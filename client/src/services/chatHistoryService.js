/**
 * Chat History Service
 * 
 * Handles storage, retrieval, indexing, and auto-referencing of chat history.
 * This service uses IndexedDB for local storage with automatic encryption
 * of sensitive content and provides background synchronization.
 */

import { nanoid } from 'nanoid';

// Constants for storage
const DB_NAME = 'chatHistoryDB';
const DB_VERSION = 1;
const CONVERSATIONS_STORE = 'conversations';
const MESSAGES_STORE = 'messages';
const INTENTS_STORE = 'intents';
const REFERENCES_STORE = 'references';
const MAX_LOCALLY_STORED_CONVERSATIONS = 50;

// Encryption functions
const encryptSensitiveContent = (content) => {
  // In a production environment, implement actual encryption
  // This is a placeholder for demonstration purposes
  return {
    encrypted: true,
    content: `encrypted:${content}`,
    timestamp: Date.now()
  };
};

const decryptContent = (encryptedData) => {
  // In a production environment, implement actual decryption
  // This is a placeholder for demonstration purposes
  if (!encryptedData.encrypted) return encryptedData.content;
  return encryptedData.content.replace('encrypted:', '');
};

// Database initialization
let dbPromise;

const initDB = () => {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error("Database error:", event.target.error);
      reject("Could not open database");
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Conversations store
      if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
        const conversationsStore = db.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id' });
        conversationsStore.createIndex('timestamp', 'timestamp', { unique: false });
        conversationsStore.createIndex('title', 'title', { unique: false });
        conversationsStore.createIndex('tags', 'tags', { multiEntry: true });
      }
      
      // Messages store
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const messagesStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
        messagesStore.createIndex('conversationId', 'conversationId', { unique: false });
        messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
        messagesStore.createIndex('sender', 'sender', { unique: false });
      }
      
      // Intents store
      if (!db.objectStoreNames.contains(INTENTS_STORE)) {
        const intentsStore = db.createObjectStore(INTENTS_STORE, { keyPath: 'id' });
        intentsStore.createIndex('messageId', 'messageId', { unique: false });
        intentsStore.createIndex('type', 'type', { unique: false });
        intentsStore.createIndex('confidenceScore', 'confidenceScore', { unique: false });
      }
      
      // References store
      if (!db.objectStoreNames.contains(REFERENCES_STORE)) {
        const referencesStore = db.createObjectStore(REFERENCES_STORE, { keyPath: 'id' });
        referencesStore.createIndex('sourceMessageId', 'sourceMessageId', { unique: false });
        referencesStore.createIndex('targetMessageId', 'targetMessageId', { unique: false });
        referencesStore.createIndex('relevanceScore', 'relevanceScore', { unique: false });
      }
    };
  });
  
  return dbPromise;
};

// Helper functions for database operations
const getStore = async (storeName, mode = 'readonly') => {
  const db = await initDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

/**
 * Creates a new conversation thread
 * @param {Object} conversationData - Initial conversation data
 * @returns {Promise<string>} Conversation ID
 */
const createConversation = async (conversationData = {}) => {
  const conversationId = nanoid();
  const timestamp = Date.now();
  
  const conversation = {
    id: conversationId,
    title: conversationData.title || 'New Conversation',
    timestamp,
    lastModified: timestamp,
    tags: conversationData.tags || [],
    metadata: conversationData.metadata || {},
    summary: '',
    intentSummary: '',
    manipulationRisk: 'none',
    timeoutStatus: {
      isTimeout: false,
      reason: '',
      expiry: null
    }
  };
  
  const store = await getStore(CONVERSATIONS_STORE, 'readwrite');
  await store.add(conversation);
  
  // Trigger background sync
  scheduleSyncConversation(conversationId);
  
  return conversationId;
};

/**
 * Adds a message to a conversation with automatic intent detection
 * @param {string} conversationId - ID of the conversation
 * @param {Object} messageData - Message data
 * @returns {Promise<string>} Message ID
 */
const addMessage = async (conversationId, messageData) => {
  const messageId = nanoid();
  const timestamp = Date.now();
  
  const message = {
    id: messageId,
    conversationId,
    content: messageData.content,
    timestamp,
    sender: messageData.sender, // 'user' or 'assistant'
    metadata: messageData.metadata || {},
    referencedMessages: messageData.referencedMessages || [],
    intentDetected: false,
    manipulationDetected: false
  };
  
  // Store encrypted content for sensitive messages
  if (messageData.isSensitive) {
    message.encryptedContent = encryptSensitiveContent(messageData.content);
    message.content = null; // Don't store plaintext
  }
  
  // Save message
  const messageStore = await getStore(MESSAGES_STORE, 'readwrite');
  await messageStore.add(message);
  
  // Update conversation last modified timestamp
  const conversationStore = await getStore(CONVERSATIONS_STORE, 'readwrite');
  const conversation = await conversationStore.get(conversationId);
  if (conversation) {
    conversation.lastModified = timestamp;
    await conversationStore.put(conversation);
  }
  
  // Trigger background intent detection
  scheduleIntentDetection(messageId);
  
  // Find and create references to past messages
  scheduleReferenceGeneration(messageId);
  
  // Trigger background sync
  scheduleSyncMessage(messageId);
  
  return messageId;
};

/**
 * Retrieves a conversation and its messages
 * @param {string} conversationId - ID of the conversation
 * @returns {Promise<Object>} Conversation with messages
 */
const getConversation = async (conversationId) => {
  // Get conversation
  const conversationStore = await getStore(CONVERSATIONS_STORE);
  const conversation = await conversationStore.get(conversationId);
  
  if (!conversation) {
    throw new Error(`Conversation with ID ${conversationId} not found`);
  }
  
  // Get messages
  const messageStore = await getStore(MESSAGES_STORE);
  const messageIndex = messageStore.index('conversationId');
  const messagesRequest = messageIndex.getAll(conversationId);
  
  return new Promise((resolve, reject) => {
    messagesRequest.onsuccess = (event) => {
      const messages = event.target.result.map(message => {
        // Decrypt content if needed
        if (message.encryptedContent) {
          message.content = decryptContent(message.encryptedContent);
          delete message.encryptedContent;
        }
        return message;
      });
      
      // Sort messages by timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp);
      
      resolve({
        ...conversation,
        messages
      });
    };
    
    messagesRequest.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

/**
 * Retrieves all conversations with optional filtering
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} Array of conversations
 */
const getAllConversations = async (options = {}) => {
  const { limit = 20, offset = 0, sortBy = 'lastModified', sortDir = 'desc', tag = null } = options;
  
  const conversationStore = await getStore(CONVERSATIONS_STORE);
  const index = conversationStore.index(sortBy === 'title' ? 'title' : 'timestamp');
  
  return new Promise((resolve, reject) => {
    const results = [];
    
    let request;
    if (tag) {
      const tagIndex = conversationStore.index('tags');
      request = tagIndex.openCursor(tag);
    } else {
      request = index.openCursor(null, sortDir === 'asc' ? 'next' : 'prev');
    }
    
    let counter = 0;
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      
      if (cursor) {
        if (counter >= offset && counter < offset + limit) {
          results.push(cursor.value);
        }
        
        counter++;
        
        if (counter < offset + limit) {
          cursor.continue();
        } else {
          resolve(results);
        }
      } else {
        resolve(results);
      }
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

/**
 * Searches conversations and messages using full-text search
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results
 */
const searchHistory = async (query, options = {}) => {
  const { 
    maxResults = 20, 
    includeMessages = true, 
    startDate = null, 
    endDate = null 
  } = options;
  
  if (!query || query.trim() === '') {
    return { conversations: [], messages: [] };
  }
  
  // Normalize query for search
  const normalizedQuery = query.toLowerCase().trim();
  const queryTerms = normalizedQuery.split(/\s+/);
  
  // Get all conversations
  const conversationStore = await getStore(CONVERSATIONS_STORE);
  const allConversationsRequest = conversationStore.getAll();
  
  // Get all messages if includeMessages is true
  let allMessages = [];
  if (includeMessages) {
    const messageStore = await getStore(MESSAGES_STORE);
    const allMessagesRequest = messageStore.getAll();
    
    allMessages = await new Promise((resolve, reject) => {
      allMessagesRequest.onsuccess = (event) => {
        resolve(event.target.result);
      };
      allMessagesRequest.onerror = (event) => {
        reject(event.target.error);
      };
    });
    
    // Decrypt content if needed
    allMessages = allMessages.map(message => {
      if (message.encryptedContent) {
        message.content = decryptContent(message.encryptedContent);
        delete message.encryptedContent;
      }
      return message;
    });
    
    // Filter by date if provided
    if (startDate) {
      allMessages = allMessages.filter(message => message.timestamp >= startDate);
    }
    if (endDate) {
      allMessages = allMessages.filter(message => message.timestamp <= endDate);
    }
  }
  
  // Wait for conversations to be retrieved
  const allConversations = await new Promise((resolve, reject) => {
    allConversationsRequest.onsuccess = (event) => {
      resolve(event.target.result);
    };
    allConversationsRequest.onerror = (event) => {
      reject(event.target.error);
    };
  });
  
  // Filter conversations by query
  const matchedConversations = allConversations
    .filter(conversation => {
      return (
        conversation.title.toLowerCase().includes(normalizedQuery) ||
        conversation.tags.some(tag => tag.toLowerCase().includes(normalizedQuery)) ||
        (conversation.summary && conversation.summary.toLowerCase().includes(normalizedQuery))
      );
    })
    .sort((a, b) => b.lastModified - a.lastModified)
    .slice(0, maxResults);
  
  // Filter messages by query
  const matchedMessages = allMessages
    .filter(message => {
      if (!message.content) return false;
      
      return queryTerms.some(term => message.content.toLowerCase().includes(term));
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxResults);
  
  return {
    conversations: matchedConversations,
    messages: matchedMessages
  };
};

/**
 * Stores intent data for a message
 * @param {string} messageId - ID of the message
 * @param {Object} intentData - Intent data
 * @returns {Promise<string>} Intent ID
 */
const storeIntent = async (messageId, intentData) => {
  const intentId = nanoid();
  
  const intent = {
    id: intentId,
    messageId,
    type: intentData.type,
    content: intentData.content,
    confidenceScore: intentData.confidenceScore || 0.0,
    metadata: intentData.metadata || {},
    timestamp: Date.now()
  };
  
  const intentStore = await getStore(INTENTS_STORE, 'readwrite');
  await intentStore.add(intent);
  
  // Update message to mark intent as detected
  const messageStore = await getStore(MESSAGES_STORE, 'readwrite');
  const message = await messageStore.get(messageId);
  if (message) {
    message.intentDetected = true;
    await messageStore.put(message);
  }
  
  return intentId;
};

/**
 * Creates a reference between messages
 * @param {string} sourceMessageId - ID of the source message
 * @param {string} targetMessageId - ID of the target message
 * @param {Object} referenceData - Reference data
 * @returns {Promise<string>} Reference ID
 */
const createReference = async (sourceMessageId, targetMessageId, referenceData = {}) => {
  const referenceId = nanoid();
  
  const reference = {
    id: referenceId,
    sourceMessageId,
    targetMessageId,
    relevanceScore: referenceData.relevanceScore || 0.0,
    context: referenceData.context || '',
    type: referenceData.type || 'semantic',
    timestamp: Date.now()
  };
  
  const referenceStore = await getStore(REFERENCES_STORE, 'readwrite');
  await referenceStore.add(reference);
  
  return referenceId;
};

/**
 * Finds references for a message based on semantic similarity
 * @param {string} messageId - ID of the message
 * @returns {Promise<Array>} Array of references
 */
const findReferences = async (messageId) => {
  // Get the message
  const messageStore = await getStore(MESSAGES_STORE);
  const message = await messageStore.get(messageId);
  
  if (!message || !message.content) {
    return [];
  }
  
  // In a real implementation, this would use vector embeddings
  // and semantic search to find similar messages
  
  // For demonstration, we'll use a simple keyword-based approach
  const words = message.content.toLowerCase().split(/\s+/);
  const significantWords = words.filter(word => word.length > 4); // Filter out short words
  
  // Get all messages
  const allMessagesRequest = messageStore.getAll();
  
  const allMessages = await new Promise((resolve, reject) => {
    allMessagesRequest.onsuccess = (event) => {
      resolve(event.target.result);
    };
    allMessagesRequest.onerror = (event) => {
      reject(event.target.error);
    };
  });
  
  // Find similar messages
  const similarMessages = allMessages
    .filter(m => m.id !== messageId) // Don't reference the same message
    .map(m => {
      if (!m.content) return { message: m, score: 0 };
      
      // Calculate similarity score
      const mWords = m.content.toLowerCase().split(/\s+/);
      const common = significantWords.filter(word => mWords.includes(word));
      const score = common.length / significantWords.length;
      
      return { message: m, score };
    })
    .filter(item => item.score > 0.3) // Only include messages with sufficient similarity
    .sort((a, b) => b.score - a.score) // Sort by similarity score
    .slice(0, 5); // Limit to top 5 similar messages
  
  // Create references
  const references = [];
  
  for (const { message: similarMessage, score } of similarMessages) {
    const referenceId = await createReference(messageId, similarMessage.id, {
      relevanceScore: score,
      context: 'Semantic similarity',
      type: 'semantic'
    });
    
    references.push({
      id: referenceId,
      message: similarMessage,
      score
    });
  }
  
  return references;
};

/**
 * Updates the manipulation risk level for a conversation
 * @param {string} conversationId - ID of the conversation
 * @param {string} riskLevel - Risk level ('none', 'low', 'medium', 'high')
 * @param {Object} details - Additional details about the risk
 * @returns {Promise<void>}
 */
const updateManipulationRisk = async (conversationId, riskLevel, details = {}) => {
  const store = await getStore(CONVERSATIONS_STORE, 'readwrite');
  const conversation = await store.get(conversationId);
  
  if (!conversation) {
    throw new Error(`Conversation with ID ${conversationId} not found`);
  }
  
  conversation.manipulationRisk = riskLevel;
  conversation.manipulationDetails = details;
  
  await store.put(conversation);
};

/**
 * Places a conversation in timeout for safety violations
 * @param {string} conversationId - ID of the conversation
 * @param {Object} timeoutData - Timeout data
 * @returns {Promise<void>}
 */
const setConversationTimeout = async (conversationId, timeoutData) => {
  const { reason, duration = 3600000 } = timeoutData; // Default to 1 hour
  
  const store = await getStore(CONVERSATIONS_STORE, 'readwrite');
  const conversation = await store.get(conversationId);
  
  if (!conversation) {
    throw new Error(`Conversation with ID ${conversationId} not found`);
  }
  
  conversation.timeoutStatus = {
    isTimeout: true,
    reason,
    expiry: Date.now() + duration,
    createdAt: Date.now()
  };
  
  await store.put(conversation);
};

/**
 * Removes timeout from a conversation
 * @param {string} conversationId - ID of the conversation
 * @returns {Promise<void>}
 */
const clearConversationTimeout = async (conversationId) => {
  const store = await getStore(CONVERSATIONS_STORE, 'readwrite');
  const conversation = await store.get(conversationId);
  
  if (!conversation) {
    throw new Error(`Conversation with ID ${conversationId} not found`);
  }
  
  conversation.timeoutStatus = {
    isTimeout: false,
    reason: '',
    expiry: null
  };
  
  await store.put(conversation);
};

/**
 * Checks if a conversation is currently in timeout
 * @param {string} conversationId - ID of the conversation
 * @returns {Promise<Object>} Timeout status
 */
const checkConversationTimeout = async (conversationId) => {
  const store = await getStore(CONVERSATIONS_STORE);
  const conversation = await store.get(conversationId);
  
  if (!conversation) {
    throw new Error(`Conversation with ID ${conversationId} not found`);
  }
  
  const { timeoutStatus } = conversation;
  
  // Check if timeout has expired
  if (timeoutStatus.isTimeout && timeoutStatus.expiry < Date.now()) {
    await clearConversationTimeout(conversationId);
    return { isTimeout: false };
  }
  
  return timeoutStatus;
};

// Background task schedulers
const scheduleSyncConversation = (conversationId) => {
  // In a real implementation, this would sync with a server
  console.log(`Scheduled sync for conversation: ${conversationId}`);
};

const scheduleSyncMessage = (messageId) => {
  // In a real implementation, this would sync with a server
  console.log(`Scheduled sync for message: ${messageId}`);
};

const scheduleIntentDetection = (messageId) => {
  // In a real implementation, this would call the intentDetectionService
  console.log(`Scheduled intent detection for message: ${messageId}`);
  
  // We'll set a timeout to simulate async processing
  setTimeout(async () => {
    try {
      const messageStore = await getStore(MESSAGES_STORE);
      const message = await messageStore.get(messageId);
      
      if (!message) return;
      
      // Here we would call the intentDetectionService to get real intents
      // For now, we'll just create a dummy intent
      await storeIntent(messageId, {
        type: 'topic',
        content: 'This is a simulated intent',
        confidenceScore: 0.85
      });
      
      console.log(`Intent detection completed for message: ${messageId}`);
    } catch (error) {
      console.error('Error in scheduled intent detection:', error);
    }
  }, 1000);
};

const scheduleReferenceGeneration = (messageId) => {
  // In a real implementation, this would call the findReferences method
  console.log(`Scheduled reference generation for message: ${messageId}`);
  
  // We'll set a timeout to simulate async processing
  setTimeout(async () => {
    try {
      await findReferences(messageId);
      console.log(`Reference generation completed for message: ${messageId}`);
    } catch (error) {
      console.error('Error in scheduled reference generation:', error);
    }
  }, 1500);
};

// Data cleanup
const cleanupOldData = async () => {
  // Get all conversations sorted by timestamp
  const store = await getStore(CONVERSATIONS_STORE, 'readwrite');
  const index = store.index('timestamp');
  const request = index.openCursor(null, 'next');
  
  const allConversations = [];
  
  await new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        allConversations.push(cursor.value);
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
  
  // If we have more than MAX_LOCALLY_STORED_CONVERSATIONS, delete the oldest ones
  if (allConversations.length > MAX_LOCALLY_STORED_CONVERSATIONS) {
    // Sort by timestamp (oldest first)
    allConversations.sort((a, b) => a.timestamp - b.timestamp);
    
    // Get the IDs of the oldest conversations to delete
    const conversationsToDelete = allConversations
      .slice(0, allConversations.length - MAX_LOCALLY_STORED_CONVERSATIONS)
      .map(conversation => conversation.id);
    
    // Delete the conversations and their messages
    for (const conversationId of conversationsToDelete) {
      await deleteConversation(conversationId);
    }
  }
};

/**
 * Deletes a conversation and all associated data
 * @param {string} conversationId - ID of the conversation
 * @returns {Promise<void>}
 */
const deleteConversation = async (conversationId) => {
  // Delete messages
  const messageStore = await getStore(MESSAGES_STORE, 'readwrite');
  const messageIndex = messageStore.index('conversationId');
  const messagesRequest = messageIndex.getAll(conversationId);
  
  const messages = await new Promise((resolve, reject) => {
    messagesRequest.onsuccess = (event) => {
      resolve(event.target.result);
    };
    messagesRequest.onerror = (event) => {
      reject(event.target.error);
    };
  });
  
  for (const message of messages) {
    // Delete intents for this message
    const intentStore = await getStore(INTENTS_STORE, 'readwrite');
    const intentIndex = intentStore.index('messageId');
    const intentsRequest = intentIndex.getAll(message.id);
    
    const intents = await new Promise((resolve, reject) => {
      intentsRequest.onsuccess = (event) => {
        resolve(event.target.result);
      };
      intentsRequest.onerror = (event) => {
        reject(event.target.error);
      };
    });
    
    for (const intent of intents) {
      await intentStore.delete(intent.id);
    }
    
    // Delete references for this message
    const referenceStore = await getStore(REFERENCES_STORE, 'readwrite');
    const sourceRefIndex = referenceStore.index('sourceMessageId');
    const targetRefIndex = referenceStore.index('targetMessageId');
    
    const sourceRefsRequest = sourceRefIndex.getAll(message.id);
    const targetRefsRequest = targetRefIndex.getAll(message.id);
    
    const sourceRefs = await new Promise((resolve, reject) => {
      sourceRefsRequest.onsuccess = (event) => {
        resolve(event.target.result);
      };
      sourceRefsRequest.onerror = (event) => {
        reject(event.target.error);
      };
    });
    
    const targetRefs = await new Promise((resolve, reject) => {
      targetRefsRequest.onsuccess = (event) => {
        resolve(event.target.result);
      };
      targetRefsRequest.onerror = (event) => {
        reject(event.target.error);
      };
    });
    
    const allRefs = [...sourceRefs, ...targetRefs];
    for (const ref of allRefs) {
      await referenceStore.delete(ref.id);
    }
    
    // Delete the message
    await messageStore.delete(message.id);
  }
  
  // Delete the conversation
  const conversationStore = await getStore(CONVERSATIONS_STORE, 'readwrite');
  await conversationStore.delete(conversationId);
};

// Run cleanup periodically
setInterval(cleanupOldData, 24 * 60 * 60 * 1000); // Once per day

const chatHistoryService = {
  initDB,
  createConversation,
  addMessage,
  getConversation,
  getAllConversations,
  searchHistory,
  storeIntent,
  createReference,
  findReferences,
  updateManipulationRisk,
  setConversationTimeout,
  clearConversationTimeout,
  checkConversationTimeout,
  deleteConversation
};

export default chatHistoryService;
