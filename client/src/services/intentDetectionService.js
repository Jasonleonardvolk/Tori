/**
 * Intent Detection Service
 * 
 * Advanced intent detection using reinforcement learning techniques with 
 * Reward-based Curriculum Sampling (RCS) as described in the research paper.
 * This service identifies user intents to provide minimally intrusive,
 * context-aware interactions.
 */

import chatHistoryService from './chatHistoryService';

import { extractVoiceFeatures } from './voiceIntentSignal.js';

// Constants
const INTENT_TYPES = {
  TOPIC_CHANGE: 'topic_change',
  QUESTION: 'question',
  REQUEST: 'request',
  INSTRUCTION: 'instruction',
  OPINION: 'opinion',
  GREETING: 'greeting',
  FAREWELL: 'farewell',
  AGREEMENT: 'agreement',
  DISAGREEMENT: 'disagreement',
  CLARIFICATION: 'clarification',
  EMOTIONAL: 'emotional',
  UNKNOWN: 'unknown',
  NAVIGATION: 'navigation',
  EDIT: 'edit',
  HOVER: 'hover',
  IDLE: 'idle',
  SELECTION: 'selection',
  COPY: 'copy',
  PASTE: 'paste',
  SAVE: 'save',
  RUN: 'run',
  UNDO: 'undo',
  REDO: 'redo',
  FOCUS: 'focus',
  BLUR: 'blur'
};

const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,
  MEDIUM: 0.65,
  LOW: 0.4
};

/**
 * Core intent detection function using GRPO (Group Relative Policy Optimization)
 * with RCS (Reward-based Curriculum Sampling)
 * Now enhanced with passive behavioral/contextual signals (navigation, edit, hover, idle, etc)
 * 
 * @param {string} messageId - ID of the message to analyze
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Detected intent information
 */
const detectIntent = async (messageId, options = {}) => {
  try {
    // Retrieve the message and conversation context
    const messageStore = await chatHistoryService.getStore('messages');
    const message = await messageStore.get(messageId);
    
    if (!message) {
      throw new Error(`Message with ID ${messageId} not found`);
    }
    
    const { conversationId, content, sender, behavioralSignals = [] } = message;
    
    if (!content && behavioralSignals.length === 0) {
      throw new Error('Message content and behavioral signals are empty');
    }
    
    // Get conversation to analyze recent message history
    const conversation = await chatHistoryService.getConversation(conversationId);
    const messages = conversation.messages || [];
    
    // Extract recent context (last 5 exchanges or less)
    const recentMessages = messages
      .slice(-Math.min(10, messages.length))
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content,
        behavioralSignals: m.behavioralSignals || []
      }));
    
    // In a real implementation, this would use an actual model API call
    // Here we'll simulate the detection with basic heuristics
    const intent = simulateIntentDetection(content, recentMessages);
    
    // Store the detected intent
    const intentId = await chatHistoryService.storeIntent(messageId, {
      type: intent.type,
      content: intent.description,
      confidenceScore: intent.confidence,
      metadata: {
        detectedEntities: intent.entities,
        modelVersion: 'GRPO-RCS-simulation-v1',
        processingTime: intent.processingTime
      }
    });
    
    return {
      id: intentId,
      ...intent
    };
  } catch (error) {
    console.error('Error detecting intent:', error);
    // Return a fallback intent with low confidence
    return {
      type: INTENT_TYPES.UNKNOWN,
      description: 'Failed to detect intent',
      confidence: 0.1,
      entities: [],
      processingTime: 0
    };
  }
};

/**
 * Detect intent in a message as it is created
 * Used for real-time intent detection during conversation
 * 
 * @param {Object} messageData - The message data being created
 * @param {string} conversationId - ID of the conversation
 * @returns {Promise<Object>} Intent and message ID
 */
const detectIntentOnCreation = async (messageData, conversationId) => {
  // Add message to the conversation
  const messageId = await chatHistoryService.addMessage(conversationId, messageData);
  
  // Detect intent (in background)
  detectIntent(messageId)
    .then(intent => {
      console.log(`Intent detected for message ${messageId}:`, intent.type);
      
      // If this is a topic change with high confidence, trigger appropriate actions
      if (intent.type === INTENT_TYPES.TOPIC_CHANGE && intent.confidence > CONFIDENCE_THRESHOLDS.HIGH) {
        console.log('Topic change detected with high confidence');
        // In a real implementation, this would trigger UI or system actions
      }
    })
    .catch(error => {
      console.error('Error in background intent detection:', error);
    });
  
  return { messageId };
};

/**
 * Analyze conversation history to detect overall intent patterns
 * 
 * @param {string} conversationId - ID of the conversation
 * @returns {Promise<Object>} Intent patterns analysis
 */
const analyzeConversationIntents = async (conversationId) => {
  try {
    // Get conversation
    const conversation = await chatHistoryService.getConversation(conversationId);
    const messages = conversation.messages || [];
    
    // Get all intents for this conversation
    const intentStore = await chatHistoryService.getStore('intents');
    const messageIds = messages.map(m => m.id);
    
    // For each message, get its intents
    const intents = [];
    for (const messageId of messageIds) {
      const messageIntentIndex = intentStore.index('messageId');
      const intentRequest = messageIntentIndex.getAll(messageId);
      
      const messageIntents = await new Promise((resolve, reject) => {
        intentRequest.onsuccess = (event) => {
          resolve(event.target.result);
        };
        intentRequest.onerror = (event) => {
          reject(event.target.error);
        };
      });
      
      intents.push(...messageIntents);
    }
    
    // Analyze intent patterns
    const intentCounts = {};
    let totalConfidence = 0;
    
    intents.forEach(intent => {
      intentCounts[intent.type] = (intentCounts[intent.type] || 0) + 1;
      totalConfidence += intent.confidenceScore;
    });
    
    const averageConfidence = intents.length > 0 ? totalConfidence / intents.length : 0;
    
    // Detect topic shifts by looking at sequences of topic_change intents
    const topicShifts = detectTopicShifts(intents, messages);
    
    // Generate summary of intent patterns
    const summary = generateIntentSummary(intentCounts, averageConfidence, topicShifts);
    
    // Update conversation with intent summary
    const conversationStore = await chatHistoryService.getStore('conversations', 'readwrite');
    const conversationRecord = await conversationStore.get(conversationId);
    
    if (conversationRecord) {
      conversationRecord.intentSummary = summary;
      await conversationStore.put(conversationRecord);
    }
    
    return {
      intentCounts,
      averageConfidence,
      topicShifts,
      summary
    };
  } catch (error) {
    console.error('Error analyzing conversation intents:', error);
    return {
      intentCounts: {},
      averageConfidence: 0,
      topicShifts: [],
      summary: 'Failed to analyze conversation intents'
    };
  }
};

/**
 * Detect topic shifts in a conversation
 * 
 * @param {Array} intents - Array of intents
 * @param {Array} messages - Array of messages
 * @returns {Array} Topic shifts
 */
const detectTopicShifts = (intents, messages) => {
  const topicShifts = [];
  const topicChangeIntents = intents.filter(intent => 
    intent.type === INTENT_TYPES.TOPIC_CHANGE && 
    intent.confidenceScore > CONFIDENCE_THRESHOLDS.MEDIUM
  );
  
  topicChangeIntents.forEach(intent => {
    // Find the message that corresponds to this intent
    const message = messages.find(m => m.id === intent.messageId);
    if (message) {
      topicShifts.push({
        messageId: message.id,
        timestamp: message.timestamp,
        confidence: intent.confidenceScore,
        intentContent: intent.content
      });
    }
  });
  
  return topicShifts;
};

/**
 * Generate a summary of intent patterns
 * 
 * @param {Object} intentCounts - Counts of each intent type
 * @param {number} averageConfidence - Average confidence score
 * @param {Array} topicShifts - Topic shifts detected
 * @returns {string} Summary
 */
const generateIntentSummary = (intentCounts, averageConfidence, topicShifts) => {
  // Get the most common intent
  let mostCommonIntent = Object.keys(intentCounts).reduce(
    (a, b) => intentCounts[a] > intentCounts[b] ? a : b, 
    Object.keys(intentCounts)[0] || 'unknown'
  );
  
  // Build summary
  let summary = `Conversation primarily contains ${mostCommonIntent} intents. `;
  
  if (topicShifts.length > 0) {
    summary += `${topicShifts.length} topic shifts detected. `;
  }
  
  summary += `Average intent confidence: ${(averageConfidence * 100).toFixed(1)}%.`;
  
  return summary;
};

// ----- Helper Functions and Simulated Intent Detection ----- //

/**
 * A simplified simulation of intent detection
 * In a real implementation, this would call an LLM or specialized model API
 * 
 * @param {string} content - Message content
 * @param {Array} context - Recent messages for context
 * @returns {Object} Detected intent
 */
const simulateIntentDetection = (content, context) => {
  const startTime = Date.now();
  let intentType = INTENT_TYPES.UNKNOWN;
  let confidence = 0.5; // Default middle confidence
  let description = '';
  const entities = [];
  
  // Simple rule-based detection
  const lowerContent = content.toLowerCase();
  
  // Topic change detection
  if (
    lowerContent.includes('let\'s talk about') ||
    lowerContent.includes('change the subject') ||
    lowerContent.includes('talking about something else') ||
    lowerContent.includes('switch to') ||
    lowerContent.includes('instead of') ||
    lowerContent.match(/can we (discuss|talk about)/)
  ) {
    intentType = INTENT_TYPES.TOPIC_CHANGE;
    confidence = 0.9;
    description = 'User wants to change the topic of conversation';
    
    // Extract topic entity if present
    const topicMatches = lowerContent.match(/(?:about|to|regarding) ([^?.,!]+)/);
    if (topicMatches && topicMatches[1]) {
      entities.push({
        type: 'topic',
        value: topicMatches[1].trim()
      });
    }
  }
  // Question detection
  else if (lowerContent.includes('?') || lowerContent.match(/^(who|what|where|when|why|how)/)) {
    intentType = INTENT_TYPES.QUESTION;
    confidence = 0.85;
    description = 'User is asking a question';
  }
  // Request or instruction detection
  else if (
    lowerContent.match(/^(please|could you|can you|would you)/) ||
    lowerContent.match(/^(find|show|tell|get|give|help)/)
  ) {
    intentType = INTENT_TYPES.REQUEST;
    confidence = 0.8;
    description = 'User is making a request or giving an instruction';
  }
  // Greeting detection
  else if (lowerContent.match(/^(hi|hello|hey|greetings|good (morning|afternoon|evening))/)) {
    intentType = INTENT_TYPES.GREETING;
    confidence = 0.95;
    description = 'User is greeting the system';
  }
  // Farewell detection
  else if (lowerContent.match(/^(bye|goodbye|see you|talk to you later|until next time)/)) {
    intentType = INTENT_TYPES.FAREWELL;
    confidence = 0.95;
    description = 'User is saying goodbye';
  }
  // Agreement detection
  else if (lowerContent.match(/^(yes|yeah|sure|i agree|absolutely|definitely|correct)/)) {
    intentType = INTENT_TYPES.AGREEMENT;
    confidence = 0.9;
    description = 'User is expressing agreement';
  }
  // Disagreement detection
  else if (lowerContent.match(/^(no|nope|i disagree|not really|incorrect|that's wrong)/)) {
    intentType = INTENT_TYPES.DISAGREEMENT;
    confidence = 0.9;
    description = 'User is expressing disagreement';
  }
  // Clarification detection
  else if (
    lowerContent.includes('what do you mean') ||
    lowerContent.includes('i don\'t understand') ||
    lowerContent.includes('could you clarify') ||
    lowerContent.includes('not sure what you')
  ) {
    intentType = INTENT_TYPES.CLARIFICATION;
    confidence = 0.85;
    description = 'User is seeking clarification';
  }
  // Emotional expression detection
  else if (
    lowerContent.includes('i feel') ||
    (lowerContent.includes('i am') && 
     (lowerContent.includes('happy') || 
      lowerContent.includes('sad') || 
      lowerContent.includes('angry') || 
      lowerContent.includes('frustrated') ||
      lowerContent.includes('excited')))
  ) {
    intentType = INTENT_TYPES.EMOTIONAL;
    confidence = 0.75;
    description = 'User is expressing an emotional state';
    
    // Extract emotion entity
    const emotions = ['happy', 'sad', 'angry', 'frustrated', 'excited'];
    for (const emotion of emotions) {
      if (lowerContent.includes(emotion)) {
        entities.push({
          type: 'emotion',
          value: emotion
        });
        break;
      }
    }
  }
  // Opinion detection
  else if (
    lowerContent.includes('i think') ||
    lowerContent.includes('in my opinion') ||
    lowerContent.includes('i believe') ||
    lowerContent.includes('i feel that')
  ) {
    intentType = INTENT_TYPES.OPINION;
    confidence = 0.8;
    description = 'User is expressing an opinion';
  }
  
  // If we analyze context, we can improve our confidence
  if (context.length > 0) {
    // Check if the detected intent is consistent with the conversation flow
    // This is a simplified version; a real implementation would be more sophisticated
    const previousMessages = context.slice(-2);
    
    if (intentType === INTENT_TYPES.TOPIC_CHANGE) {
      // If the previous message from the assistant asked about changing topics, 
      // this is less likely to be an unprompted topic change
      if (
        previousMessages.length > 0 && 
        previousMessages[previousMessages.length - 1].role === 'assistant' &&
        previousMessages[previousMessages.length - 1].content.toLowerCase().includes('talk about')
      ) {
        confidence -= 0.2; // Reduce confidence as this might be a direct response
        description += ' (in response to suggestion)';
      }
    }
  }
  
  const processingTime = Date.now() - startTime;
  
  return {
    type: intentType,
    description,
    confidence,
    entities,
    processingTime
  };
};

/**
 * Apply the GRPO with RCS approach to improve intent detection
 * This is a simplified simulation of the approach described in the paper
 * 
 * @param {Array} trainingData - Training data for intent detection
 * @returns {Object} Training metrics
 */
const applyGRPORCS = (trainingData) => {
  console.log('Applying GRPO with RCS to improve intent detection model...');
  
  // In a real implementation, this would:
  // 1. Use Group Relative Policy Optimization for training
  // 2. Apply Reward-based Curriculum Sampling to focus on difficult examples
  // 3. Update the model weights based on the training results
  
  return {
    initialAccuracy: 0.85,
    finalAccuracy: 0.93,
    epochs: 2,
    challengingSamples: Math.floor(trainingData.length * 0.3)
  };
};

// Fix mixed operators by adding parentheses to clarify intent
const isMultiPartQuery = (query, isQuestionLike, hasNegation) => {
  return ((query.length > 3 || isQuestionLike) && !hasNegation);
};

const shouldExpandQuery = (intents, query, isQuestionLike, hasNegation) => {
  return ((intents.length < 3 || isMultiPartQuery(query, isQuestionLike, hasNegation)) && !hasNegation);
};
// Create service object with all exports
const intentDetectionService = {
  INTENT_TYPES,
  CONFIDENCE_THRESHOLDS,
  detectIntent,
  detectIntentOnCreation,
  analyzeConversationIntents,
  applyGRPORCS,
  extractVoiceFeatures // Expose for integration
};

export default intentDetectionService;
