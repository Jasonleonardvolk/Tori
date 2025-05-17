/**
 * Manipulation Detection Service
 * 
 * Detects mental manipulation in conversations using Intent-Aware Prompting (IAP)
 * as described in the research paper.
 * 
 * This service analyzes participant intents to provide early detection of
 * potential manipulation tactics with high recall.
 */

import chatHistoryService from './chatHistoryService';
import intentDetectionService from './intentDetectionService';

// Constants
const MANIPULATION_TYPES = {
  NONE: 'none',
  GASLIGHTING: 'gaslighting',
  GUILT_TRIPPING: 'guilt_tripping',
  LOVE_BOMBING: 'love_bombing',
  SILENT_TREATMENT: 'silent_treatment',
  ISOLATION: 'isolation',
  INTIMIDATION: 'intimidation',
  MOVING_GOALPOSTS: 'moving_goalposts',
  TRIANGULATION: 'triangulation',
  PROJECTION: 'projection',
  STONEWALLING: 'stonewalling',
  TRIVIALIZING: 'trivializing',
  BAITING: 'baiting',
  OTHER: 'other'
};

const SEVERITY_LEVELS = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  EXTREME: 'extreme'
};

const TIMEOUT_DURATIONS = {
  [SEVERITY_LEVELS.LOW]: 5 * 60 * 1000, // 5 minutes
  [SEVERITY_LEVELS.MEDIUM]: 30 * 60 * 1000, // 30 minutes
  [SEVERITY_LEVELS.HIGH]: 24 * 60 * 60 * 1000, // 24 hours
  [SEVERITY_LEVELS.EXTREME]: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Analyze a conversation for potential manipulation using Intent-Aware Prompting
 * 
 * @param {string} conversationId - ID of the conversation to analyze
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Analysis results
 */
const analyzeConversation = async (conversationId, options = {}) => {
  try {
    // Get the conversation with messages
    const conversation = await chatHistoryService.getConversation(conversationId);
    const messages = conversation.messages || [];
    
    if (messages.length < 3) {
      // Not enough messages for meaningful analysis
      return {
        hasManipulation: false,
        manipulationType: MANIPULATION_TYPES.NONE,
        manipulationSeverity: SEVERITY_LEVELS.NONE,
        confidence: 1.0,
        manipulativeMessages: [],
        explanation: 'Not enough messages for analysis'
      };
    }
    
    // Extract participant roles from messages
    const participants = extractParticipants(messages);
    
    // Generate intent summaries for each participant
    const intentSummaries = await generateIntentSummaries(messages, participants);
    
    // Analyze for manipulation using Intent-Aware Prompting approach
    const manipulationAnalysis = detectManipulation(messages, intentSummaries);
    
    // If manipulation is detected, store the results
    if (manipulationAnalysis.hasManipulation) {
      await chatHistoryService.updateManipulationRisk(
        conversationId,
        manipulationAnalysis.manipulationSeverity,
        {
          type: manipulationAnalysis.manipulationType,
          confidence: manipulationAnalysis.confidence,
          manipulativeMessages: manipulationAnalysis.manipulativeMessages,
          explanation: manipulationAnalysis.explanation,
          timestamp: Date.now()
        }
      );
    }
    
    return manipulationAnalysis;
  } catch (error) {
    console.error('Error analyzing conversation for manipulation:', error);
    return {
      hasManipulation: false,
      manipulationType: MANIPULATION_TYPES.NONE,
      manipulationSeverity: SEVERITY_LEVELS.NONE,
      confidence: 0,
      manipulativeMessages: [],
      explanation: `Error during analysis: ${error.message}`
    };
  }
};

/**
 * Extract unique participants from messages
 * 
 * @param {Array} messages - Array of messages
 * @returns {Object} Participant information
 */
const extractParticipants = (messages) => {
  const uniqueSenders = [...new Set(messages.map(m => m.sender))];
  
  // Create participant objects
  return uniqueSenders.map(sender => ({
    id: sender,
    messageCount: messages.filter(m => m.sender === sender).length,
    firstMessageIndex: messages.findIndex(m => m.sender === sender)
  }));
};

/**
 * Generate intent summaries for each participant using collected intents
 * 
 * @param {Array} messages - Array of messages
 * @param {Array} participants - Array of participants
 * @returns {Promise<Object>} Intent summaries by participant
 */
const generateIntentSummaries = async (messages, participants) => {
  const summaries = {};
  
  // For each participant
  for (const participant of participants) {
    // Get all messages by this participant
    const participantMessages = messages.filter(m => m.sender === participant.id);
    
    // Get all intents for these messages
    const messageIds = participantMessages.map(m => m.id);
    const allIntents = [];
    
    for (const messageId of messageIds) {
      try {
        // In a real implementation, we would retrieve existing intents
        // For now, we'll generate them on-the-fly
        const intent = await intentDetectionService.detectIntent(messageId);
        allIntents.push(intent);
      } catch (error) {
        console.error(`Error getting intent for message ${messageId}:`, error);
      }
    }
    
    // Generate an intent summary
    const summary = generateIntentSummaryFromIntents(allIntents, participantMessages);
    summaries[participant.id] = summary;
  }
  
  return summaries;
};

/**
 * Generate a summary of participant intents from collected intents
 * This is a key component of the Intent-Aware Prompting approach
 * 
 * @param {Array} intents - Array of intent objects
 * @param {Array} messages - Array of participant messages
 * @returns {Object} Intent summary
 */
const generateIntentSummaryFromIntents = (intents, messages) => {
  // Group intents by type
  const intentsByType = {};
  intents.forEach(intent => {
    if (!intentsByType[intent.type]) {
      intentsByType[intent.type] = [];
    }
    intentsByType[intent.type].push(intent);
  });
  
  // Get dominant intent types (those representing >20% of intents)
  const totalIntents = intents.length;
  const dominantTypes = Object.entries(intentsByType)
    .filter(([type, typeIntents]) => typeIntents.length / totalIntents > 0.2)
    .map(([type]) => type);
  
  // Analyze message content patterns
  const phrasePatterns = analyzeContentPatterns(messages);
  
  // Check for manipulation patterns in the intent sequence
  const manipulationPatterns = detectIntentManipulationPatterns(intents, messages);
  
  return {
    dominantIntentTypes: dominantTypes,
    intentTypeCounts: Object.fromEntries(
      Object.entries(intentsByType).map(([type, typeIntents]) => [type, typeIntents.length])
    ),
    phrasePatterns,
    manipulationPatterns,
    totalIntents,
    totalMessages: messages.length
  };
};

/**
 * Analyze message content for recurring phrases and patterns
 * 
 * @param {Array} messages - Array of messages
 * @returns {Object} Content pattern analysis
 */
const analyzeContentPatterns = (messages) => {
  // Extract message contents
  const contents = messages.map(m => m.content.toLowerCase());
  
  // Define recurring words to analyze
  const negativeEmotionWords = [
    'sad', 'angry', 'hurt', 'upset', 'disappointed',
    'frustrated', 'annoyed', 'unhappy', 'miserable',
    'depressed', 'anxious', 'worried', 'stressed',
    'afraid', 'scared', 'terrified', 'lonely'
  ];
  
  const blameWords = [
    'fault', 'blame', 'responsible', 'caused',
    'reason', 'guilty', 'wrong', 'mistake'
  ];
  
  // Count emotion and blame words
  let negativeEmotionCount = 0;
  let blameCount = 0;
  
  contents.forEach(content => {
    negativeEmotionWords.forEach(word => {
      if (content.includes(word)) {
        negativeEmotionCount++;
      }
    });
    
    blameWords.forEach(word => {
      if (content.includes(word)) {
        blameCount++;
      }
    });
  });
  
  // Check for use of absolute language
  const absoluteWords = ['always', 'never', 'every time', 'everyone', 'nobody', 'all'];
  let absoluteLanguageCount = 0;
  
  contents.forEach(content => {
    absoluteWords.forEach(word => {
      if (content.includes(word)) {
        absoluteLanguageCount++;
      }
    });
  });
  
  return {
    negativeEmotionCount,
    blameCount,
    absoluteLanguageCount,
    negativeEmotionRatio: negativeEmotionCount / contents.length,
    blameRatio: blameCount / contents.length,
    absoluteLanguageRatio: absoluteLanguageCount / contents.length
  };
};

/**
 * Detect manipulation patterns by analyzing the sequence of intents
 * 
 * @param {Array} intents - Array of intents
 * @param {Array} messages - Array of messages
 * @returns {Object} Detected manipulation patterns
 */
const detectIntentManipulationPatterns = (intents, messages) => {
  const patterns = {
    // Contradiction pattern: person says one thing, then contradicts themselves
    contradiction: 0,
    
    // Dismissal pattern: dismissing concerns or feelings
    dismissal: 0,
    
    // Control pattern: excessive use of directives/instructions
    control: 0,
    
    // Isolation pattern: attempts to isolate from others
    isolation: 0
  };
  
  // Look for contradictions in sequential messages
  for (let i = 1; i < messages.length; i++) {
    const prevContent = messages[i - 1].content.toLowerCase();
    const currContent = messages[i].content.toLowerCase();
    
    // Simple contradiction detection (in a real system, this would be more sophisticated)
    if (
      (prevContent.includes('yes') && currContent.includes('no')) ||
      (prevContent.includes('always') && currContent.includes('never')) ||
      (prevContent.includes('I did') && currContent.includes('I never')) ||
      (prevContent.includes('you said') && currContent.includes('I never said'))
    ) {
      patterns.contradiction++;
    }
  }
  
  // Control pattern: high percentage of instructions/directives
  const instructionIntents = intents.filter(intent => 
    intent.type === intentDetectionService.INTENT_TYPES.INSTRUCTION ||
    intent.type === intentDetectionService.INTENT_TYPES.REQUEST
  );
  
  patterns.control = instructionIntents.length / intents.length;
  
  // Dismissal pattern: dismissing emotional expressions
  for (let i = 1; i < intents.length; i++) {
    if (
      intents[i - 1].type === intentDetectionService.INTENT_TYPES.EMOTIONAL &&
      intents[i].type === intentDetectionService.INTENT_TYPES.DISAGREEMENT
    ) {
      patterns.dismissal++;
    }
  }
  
  // Isolation pattern: mentions of separation from others
  const isolationKeywords = ['alone', 'without them', 'just us', 'only me', 'nobody else'];
  
  messages.forEach(message => {
    const content = message.content.toLowerCase();
    isolationKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        patterns.isolation++;
      }
    });
  });
  
  return patterns;
};

/**
 * Detect manipulation using Intent-Aware Prompting approach
 * 
 * @param {Array} messages - Array of messages
 * @param {Object} intentSummaries - Summaries of participant intents
 * @returns {Object} Manipulation analysis results
 */
const detectManipulation = (messages, intentSummaries) => {
  // This is a simplified simulation of the IAP approach described in the paper
  // In a real implementation, this would use an LLM with the intent summaries as context
  
  // Look for manipulation indicators in each participant's intent summary
  let highestManipulationScore = 0;
  let manipulativeParticipant = null;
  let manipulationType = MANIPULATION_TYPES.NONE;
  let manipulativeIndicators = [];
  
  Object.entries(intentSummaries).forEach(([participantId, summary]) => {
    // Calculate manipulation score based on patterns
    let manipulationScore = 0;
    
    // High frequency of contradiction indicates possible gaslighting
    if (summary.manipulationPatterns.contradiction >= 2) {
      manipulationScore += summary.manipulationPatterns.contradiction * 0.15;
      manipulativeIndicators.push('Multiple contradictory statements');
      manipulationType = MANIPULATION_TYPES.GASLIGHTING;
    }
    
    // High control pattern indicates possible intimidation
    if (summary.manipulationPatterns.control > 0.5) {
      manipulationScore += summary.manipulationPatterns.control * 0.8;
      manipulativeIndicators.push('Excessive control or directives');
      manipulationType = MANIPULATION_TYPES.INTIMIDATION;
    }
    
    // Dismissal of emotions indicates possible guilt-tripping or trivializing
    if (summary.manipulationPatterns.dismissal >= 2) {
      manipulationScore += summary.manipulationPatterns.dismissal * 0.2;
      manipulativeIndicators.push('Dismissal of emotions');
      manipulationType = MANIPULATION_TYPES.TRIVIALIZING;
    }
    
    // High use of negative emotion language indicates possible guilt tripping
    if (summary.phrasePatterns.negativeEmotionRatio > 0.4) {
      manipulationScore += summary.phrasePatterns.negativeEmotionRatio * 0.6;
      manipulativeIndicators.push('Excessive negative emotional language');
      manipulationType = MANIPULATION_TYPES.GUILT_TRIPPING;
    }
    
    // High use of blame language indicates possible projection
    if (summary.phrasePatterns.blameRatio > 0.3) {
      manipulationScore += summary.phrasePatterns.blameRatio * 0.7;
      manipulativeIndicators.push('Excessive blame language');
      manipulationType = MANIPULATION_TYPES.PROJECTION;
    }
    
    // High use of absolute language indicates possible manipulation
    if (summary.phrasePatterns.absoluteLanguageRatio > 0.25) {
      manipulationScore += summary.phrasePatterns.absoluteLanguageRatio * 0.5;
      manipulativeIndicators.push('Excessive use of absolute language');
      // This could be various types - keep the highest scoring type
    }
    
    // If this participant has the highest manipulation score so far, update the tracking variables
    if (manipulationScore > highestManipulationScore) {
      highestManipulationScore = manipulationScore;
      manipulativeParticipant = participantId;
    }
  });
  
  // Determine if manipulation is present based on the score
  const hasManipulation = highestManipulationScore > 0.3;
  
  // Determine severity based on the score
  let manipulationSeverity = SEVERITY_LEVELS.NONE;
  if (highestManipulationScore > 0.8) {
    manipulationSeverity = SEVERITY_LEVELS.EXTREME;
  } else if (highestManipulationScore > 0.6) {
    manipulationSeverity = SEVERITY_LEVELS.HIGH;
  } else if (highestManipulationScore > 0.4) {
    manipulationSeverity = SEVERITY_LEVELS.MEDIUM;
  } else if (highestManipulationScore > 0.3) {
    manipulationSeverity = SEVERITY_LEVELS.LOW;
  }
  
  // If no manipulation is detected, return a negative result
  if (!hasManipulation) {
    return {
      hasManipulation: false,
      manipulationType: MANIPULATION_TYPES.NONE,
      manipulationSeverity: SEVERITY_LEVELS.NONE,
      confidence: 1 - highestManipulationScore,
      manipulativeMessages: [],
      explanation: 'No manipulation detected'
    };
  }
  
  // Get the manipulative messages
  const manipulativeMessages = identifyManipulativeMessages(
    messages, 
    manipulativeParticipant, 
    manipulativeIndicators
  );
  
  return {
    hasManipulation,
    manipulationType,
    manipulationSeverity,
    confidence: highestManipulationScore,
    manipulativeParticipant,
    manipulativeIndicators,
    manipulativeMessages,
    explanation: `Detected ${manipulationType} with ${
      manipulativeIndicators.length
    } indicators: ${manipulativeIndicators.join(', ')}`
  };
};

/**
 * Identify the specific messages that contain manipulative content
 * 
 * @param {Array} messages - Array of messages
 * @param {string} participantId - ID of the manipulative participant
 * @param {Array} indicators - Array of manipulation indicators
 * @returns {Array} Manipulative messages
 */
const identifyManipulativeMessages = (messages, participantId, indicators) => {
  if (!participantId) return [];
  
  // Filter messages by the manipulative participant
  const participantMessages = messages.filter(m => m.sender === participantId);
  
  // For each indicator, look for matching messages
  const manipulativeMessages = [];
  
  indicators.forEach(indicator => {
    switch (indicator) {
      case 'Multiple contradictory statements':
        // Find messages with contradictions
        for (let i = 1; i < participantMessages.length; i++) {
          const prevContent = participantMessages[i - 1].content.toLowerCase();
          const currContent = participantMessages[i].content.toLowerCase();
          
          if (
            (prevContent.includes('yes') && currContent.includes('no')) ||
            (prevContent.includes('always') && currContent.includes('never')) ||
            (prevContent.includes('I did') && currContent.includes('I never')) ||
            (prevContent.includes('you said') && currContent.includes('I never said'))
          ) {
            manipulativeMessages.push({
              messageId: participantMessages[i].id,
              indicator,
              content: participantMessages[i].content
            });
          }
        }
        break;
      
      case 'Excessive negative emotional language':
        // Find messages with negative emotional language
        const negativeEmotionWords = [
          'sad', 'angry', 'hurt', 'upset', 'disappointed',
          'frustrated', 'annoyed', 'unhappy', 'miserable',
          'depressed', 'anxious', 'worried', 'stressed',
          'afraid', 'scared', 'terrified', 'lonely'
        ];
        
        participantMessages.forEach(message => {
          const content = message.content.toLowerCase();
          const hasNegativeEmotion = negativeEmotionWords.some(word => content.includes(word));
          
          if (hasNegativeEmotion) {
            manipulativeMessages.push({
              messageId: message.id,
              indicator,
              content: message.content
            });
          }
        });
        break;
      
      case 'Excessive blame language':
        // Find messages with blame language
        const blameWords = [
          'fault', 'blame', 'responsible', 'caused',
          'reason', 'guilty', 'wrong', 'mistake'
        ];
        
        participantMessages.forEach(message => {
          const content = message.content.toLowerCase();
          const hasBlame = blameWords.some(word => content.includes(word));
          
          if (hasBlame) {
            manipulativeMessages.push({
              messageId: message.id,
              indicator,
              content: message.content
            });
          }
        });
        break;
      
      case 'Excessive use of absolute language':
        // Find messages with absolute language
        const absoluteWords = ['always', 'never', 'every time', 'everyone', 'nobody', 'all'];
        
        participantMessages.forEach(message => {
          const content = message.content.toLowerCase();
          const hasAbsoluteLanguage = absoluteWords.some(word => content.includes(word));
          
          if (hasAbsoluteLanguage) {
            manipulativeMessages.push({
              messageId: message.id,
              indicator,
              content: message.content
            });
          }
        });
        break;
      
      case 'Dismissal of emotions':
        // This requires more context analysis across multiple messages
        // For simplicity, we'll just look for dismissive phrases
        const dismissivePhrases = [
          'you\'re overreacting',
          'you\'re too sensitive',
          'that\'s ridiculous',
          'get over it',
          'it\'s not a big deal',
          'you\'re making this up',
          'you\'re imagining things'
        ];
        
        participantMessages.forEach(message => {
          const content = message.content.toLowerCase();
          const isDismissive = dismissivePhrases.some(phrase => content.includes(phrase));
          
          if (isDismissive) {
            manipulativeMessages.push({
              messageId: message.id,
              indicator,
              content: message.content
            });
          }
        });
        break;
      
      case 'Excessive control or directives':
        // Look for commanding language
        const controlPhrases = [
          'you should',
          'you need to',
          'you must',
          'you have to',
          'do this',
          'don\'t do that',
          'i want you to'
        ];
        
        participantMessages.forEach(message => {
          const content = message.content.toLowerCase();
          const isControlling = controlPhrases.some(phrase => content.includes(phrase));
          
          if (isControlling) {
            manipulativeMessages.push({
              messageId: message.id,
              indicator,
              content: message.content
            });
          }
        });
        break;
        
      default:
        // Handle unknown indicator type
        console.warn(`Unknown manipulation indicator: ${indicator}`);
        break;
    }
  });
  
  // Remove duplicates (a message might match multiple indicators)
  const uniqueMessages = [];
  const seenMessageIds = new Set();
  
  manipulativeMessages.forEach(message => {
    if (!seenMessageIds.has(message.messageId)) {
      seenMessageIds.add(message.messageId);
      uniqueMessages.push(message);
    }
  });
  
  return uniqueMessages;
};

/**
 * Create a timeout for a conversation based on manipulation severity
 * 
 * @param {string} conversationId - ID of the conversation
 * @param {string} severity - Severity level
 * @param {string} reason - Reason for timeout
 * @returns {Promise<boolean>} Success indicator
 */
const timeoutConversation = async (conversationId, severity, reason) => {
  try {
    if (severity === SEVERITY_LEVELS.NONE || severity === SEVERITY_LEVELS.LOW) {
      // No timeout for none/low severity
      return false;
    }
    
    const duration = TIMEOUT_DURATIONS[severity] || TIMEOUT_DURATIONS[SEVERITY_LEVELS.MEDIUM];
    
    await chatHistoryService.setConversationTimeout(conversationId, {
      reason: `Conversation paused due to ${severity} manipulation concerns: ${reason}`,
      duration
    });
    
    return true;
  } catch (error) {
    console.error('Error setting conversation timeout:', error);
    return false;
  }
};

/**
 * Analyze a conversation as message is being created
 * This is a real-time check that should be fast
 * 
 * @param {Object} messageData - The message data being created
 * @param {string} conversationId - ID of the conversation
 * @returns {Promise<Object>} Analysis result with message ID
 */
const analyzeMessageRealTime = async (messageData, conversationId) => {
  try {
    // Get previous messages in the conversation
    const conversation = await chatHistoryService.getConversation(conversationId);
    const previousMessages = conversation.messages || [];
    
    // Only proceed if we have enough context
    if (previousMessages.length < 3) {
      return { 
        messageId: null,
        hasManipulation: false,
        result: 'Not enough context' 
      };
    }
    
    // Check for immediate red flags in the new message
    const { hasRedFlags, redFlagType, severity } = checkMessageRedFlags(messageData.content);
    
    if (hasRedFlags && severity >= SEVERITY_LEVELS.MEDIUM) {
      // Add the message to the conversation for record-keeping
      const messageId = await chatHistoryService.addMessage(conversationId, {
        ...messageData,
        manipulationDetected: true
      });
      
      // Set timeout based on severity
      await timeoutConversation(
        conversationId,
        severity,
        `Message contained ${redFlagType} content`
      );
      
      return {
        messageId,
        hasManipulation: true,
        manipulationType: redFlagType,
        manipulationSeverity: severity,
        needsTimeout: true
      };
    }
    
    // No immediate red flags, add the message normally
    const messageId = await chatHistoryService.addMessage(conversationId, messageData);
    
    // Schedule a full conversation analysis in the background
    setTimeout(() => {
      analyzeConversation(conversationId)
        .then(result => {
          if (result.hasManipulation && result.manipulationSeverity >= SEVERITY_LEVELS.MEDIUM) {
            timeoutConversation(
              conversationId,
              result.manipulationSeverity,
              result.explanation
            );
          }
        })
        .catch(error => {
          console.error('Error in background manipulation analysis:', error);
        });
    }, 100);
    
    return { messageId, hasManipulation: false };
  } catch (error) {
    console.error('Error during real-time message analysis:', error);
    // Still try to add the message for audit purposes
    const messageId = await chatHistoryService.addMessage(conversationId, messageData);
    return { messageId, error: error.message };
  }
};

/**
 * Check a message for immediate red flags
 * This is a fast check for obvious issues
 * 
 * @param {string} content - Message content
 * @returns {Object} Red flag assessment
 */
const checkMessageRedFlags = (content) => {
  const lowerContent = content.toLowerCase();
  
  // Check for abusive language
  const abusiveTerms = [
    'idiot', 'moron', 'stupid', 'dumb', 'fool', 'worthless',
    'pathetic', 'loser', 'useless', 'failure', 'die', 'kill',
    'bitch', 'whore', 'slut', 'retard', 'cunt', 'dick'
  ];
  
  const hasAbusiveLanguage = abusiveTerms.some(term => lowerContent.includes(term));
  
  if (hasAbusiveLanguage) {
    return {
      hasRedFlags: true,
      redFlagType: 'abusive',
      severity: SEVERITY_LEVELS.HIGH
    };
  }
  
  // Check for threatening language
  const threateningTerms = [
    'kill you', 'hurt you', 'murder', 'destroy you', 'make you pay',
    'regret', 'suffer', 'punish', 'torture', 'pain', 'revenge'
  ];
  
  const hasThreatening = threateningTerms.some(term => lowerContent.includes(term));
  
  if (hasThreatening) {
    return {
      hasRedFlags: true,
      redFlagType: 'threatening',
      severity: SEVERITY_LEVELS.EXTREME
    };
  }
  
  // Check for extreme guilt-tripping
  const guiltTrippingPhrases = [
    'if you really loved me',
    'after all i\'ve done for you',
    'if you cared about me',
    'you\'re killing me',
    'you\'re destroying me',
    'look what you made me do'
  ];
  
  const hasGuiltTripping = guiltTrippingPhrases.some(phrase => lowerContent.includes(phrase));
  
  if (hasGuiltTripping) {
    return {
      hasRedFlags: true,
      redFlagType: 'guilt-tripping',
      severity: SEVERITY_LEVELS.MEDIUM
    };
  }
  
  // Check for racial, ethnic, or other identity-based slurs
  // Note: In a real implementation, this would use a more comprehensive list
  // and a more sophisticated detection mechanism
  const identitySlurs = [
    'n-word', 'f-word', 'k-word', 'c-word', 'jew', 'muslim', 'islam', 'gay', 'trans',
    'homo', 'queer', 'racist', 'slurs'
  ];
  
  const hasIdentitySlurs = identitySlurs.some(slur => lowerContent.includes(slur));
  
  if (hasIdentitySlurs) {
    return {
      hasRedFlags: true,
      redFlagType: 'discriminatory',
      severity: SEVERITY_LEVELS.EXTREME
    };
  }
  
  // No red flags found
  return {
    hasRedFlags: false,
    redFlagType: null,
    severity: SEVERITY_LEVELS.NONE
  };
};

// Create the service object
const manipulationDetectionService = {
  MANIPULATION_TYPES,
  SEVERITY_LEVELS,
  TIMEOUT_DURATIONS,
  analyzeConversation,
  analyzeMessageRealTime,
  timeoutConversation,
  checkMessageRedFlags
};

export default manipulationDetectionService;
