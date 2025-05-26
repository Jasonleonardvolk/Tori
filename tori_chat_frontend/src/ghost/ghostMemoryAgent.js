// ghostMemoryAgent.js
// Simplified ghost memory agent for TORI Chat
// Monitors conversation flow for ghost emergence triggers

import { evaluateAgenticTriggers, generateGhostMessage } from './ghostPersonaEngine.js';

// Track conversation state for ghost triggers
let conversationState = {
  messageCount: 0,
  errorStreak: 0,
  sessionStartTime: Date.now(),
  lastGhostAppearance: 0,
  phaseCoherence: 1.0,
  lyapunovStability: 0.8
};

// Minimum time between ghost appearances (5 minutes)
const GHOST_COOLDOWN_MS = 5 * 60 * 1000;

// Update conversation state based on new message/response
export function updateConversationState(message, response, metadata = {}) {
  conversationState.messageCount++;
  
  // Reset error streak on successful response
  if (response && !response.includes('error') && !response.includes('sorry')) {
    conversationState.errorStreak = 0;
  } else if (response && (response.includes('error') || response.includes('sorry'))) {
    conversationState.errorStreak++;
  }
  
  // Update phase coherence and stability from metadata
  if (metadata.phaseCoherence !== undefined) {
    conversationState.phaseCoherence = metadata.phaseCoherence;
  }
  
  if (metadata.lyapunovStability !== undefined) {
    conversationState.lyapunovStability = metadata.lyapunovStability;
  }
  
  // Gradually decay phase coherence and stability over time without updates
  const timeSinceLastUpdate = Date.now() - conversationState.sessionStartTime;
  if (timeSinceLastUpdate > 30 * 60 * 1000) { // 30 minutes
    conversationState.phaseCoherence *= 0.95;
    conversationState.lyapunovStability *= 0.98;
  }
}

// Get current session duration
function getSessionDuration() {
  return Date.now() - conversationState.sessionStartTime;
}

// Calculate frustration level based on error streak and response times
function calculateFrustrationLevel() {
  let frustration = 0;
  
  // Error streak contributes to frustration
  frustration += Math.min(conversationState.errorStreak * 0.2, 0.8);
  
  // Long sessions without progress
  const sessionHours = getSessionDuration() / (1000 * 60 * 60);
  if (sessionHours > 2 && conversationState.messageCount < sessionHours * 10) {
    frustration += 0.3;
  }
  
  return Math.min(frustration, 1.0);
}

// Check if ghost should emerge based on conversation context
export function shouldGhostEmerge(message, conversationHistory = []) {
  const now = Date.now();
  
  // Respect cooldown period
  if (now - conversationState.lastGhostAppearance < GHOST_COOLDOWN_MS) {
    return null;
  }
  
  // Build context for trigger evaluation
  const context = {
    message,
    conversationHistory,
    phaseCoherence: conversationState.phaseCoherence,
    lyapunovStability: conversationState.lyapunovStability,
    errorStreak: conversationState.errorStreak,
    sessionDuration: getSessionDuration(),
    frustrationLevel: calculateFrustrationLevel()
  };
  
  // Evaluate if any triggers are met
  const trigger = evaluateAgenticTriggers(context);
  
  if (trigger) {
    conversationState.lastGhostAppearance = now;
    return trigger;
  }
  
  return null;
}

// Generate ghost response when triggered
export function generateGhostResponse(trigger, message, userName) {
  const context = {
    message,
    userName,
    sessionDuration: getSessionDuration(),
    phaseCoherence: conversationState.phaseCoherence,
    lyapunovStability: conversationState.lyapunovStability
  };
  
  return generateGhostMessage(trigger, context);
}

// Get current conversation state (for debugging/monitoring)
export function getConversationState() {
  return {
    ...conversationState,
    sessionDuration: getSessionDuration(),
    frustrationLevel: calculateFrustrationLevel()
  };
}

// Reset conversation state (e.g., when starting new session)
export function resetConversationState() {
  conversationState = {
    messageCount: 0,
    errorStreak: 0,
    sessionStartTime: Date.now(),
    lastGhostAppearance: 0,
    phaseCoherence: 1.0,
    lyapunovStability: 0.8
  };
}

// Integration with Lyapunov spike detector
export function updateFromLyapunovDetector(stabilityData) {
  if (stabilityData.system_stability_index !== undefined) {
    conversationState.lyapunovStability = stabilityData.system_stability_index;
  }
  
  // Detect phase coherence from recent activity
  if (stabilityData.recent_activity && stabilityData.recent_activity.phase_coherence !== undefined) {
    conversationState.phaseCoherence = stabilityData.recent_activity.phase_coherence;
  }
  
  // Check for spikes that might trigger unsettled ghost
  if (stabilityData.recent_activity && stabilityData.recent_activity.spikes_last_5min > 0) {
    conversationState.errorStreak += stabilityData.recent_activity.spikes_last_5min;
  }
}

// Export all functions needed for integration
export {
  updateConversationState,
  shouldGhostEmerge,
  generateGhostResponse,
  getConversationState,
  resetConversationState,
  updateFromLyapunovDetector
};
