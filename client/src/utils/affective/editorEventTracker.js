/**
 * Editor Event Tracker for Affective Computing
 * 
 * This utility provides functionality to track editor events and analyze them
 * for affective computing purposes. It helps to determine the developer's
 * cognitive and emotional state based on their interaction patterns.
 */

// Constants for affective analysis
const TYPING_SPEED_MAX = 5; // keystrokes per second
const PAUSE_THRESHOLD = 2000; // ms
const INTERACTION_HISTORY_MAX = 200; // max events to store
const ANALYSIS_WINDOW = 10000; // ms - window for recent activity analysis

/**
 * Create a new editor event tracker instance
 */
export function createEditorEventTracker() {
  // State for tracking interactions
  const state = {
    lastKeyTime: Date.now(),
    keyPressCount: 0,
    deletionCount: 0,
    pauseStart: null,
    keyHistory: [], // [{ timestamp, key, type }]
    pauses: [], // [{ start, end, duration }]
  };
  
  /**
   * Process an editor event
   * @param {Object} editor - Editor instance
   * @param {Object} event - Event object
   * @returns {Object} - Current state
   */
  const processEvent = (editor, event) => {
    const now = Date.now();
    
    // Process based on event type
    switch (event.type) {
      case 'keydown':
      case 'keyup':
        // Skip modifier keys
        if (event.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
          // Track key events
          state.lastKeyTime = now;
          state.keyPressCount++;
          
          // Record key history
          state.keyHistory.push({
            timestamp: now,
            key: event.key,
            type: event.type
          });
          
          // Limit history size
          if (state.keyHistory.length > INTERACTION_HISTORY_MAX) {
            state.keyHistory.shift();
          }
          
          // Track deletion events
          if (event.key === 'Backspace' || event.key === 'Delete') {
            state.deletionCount++;
          }
          
          // End pause if there was one
          if (state.pauseStart) {
            const pauseDuration = now - state.pauseStart;
            if (pauseDuration > PAUSE_THRESHOLD) {
              state.pauses.push({
                start: state.pauseStart,
                end: now,
                duration: pauseDuration
              });
              
              // Limit pause history
              if (state.pauses.length > 50) {
                state.pauses.shift();
              }
            }
            state.pauseStart = null;
          }
        }
        break;
        
      case 'focus':
        // End pause if there was one
        if (state.pauseStart) {
          state.pauseStart = null;
        }
        break;
        
      case 'blur':
        // Start tracking a pause
        state.pauseStart = now;
        break;
        
      default:
        // Other events like cursor movements, selections, etc.
        break;
    }
    
    return state;
  };
  
  /**
   * Analyze the current state to compute metrics
   * @returns {Object} - Computed metrics
   */
  const computeMetrics = () => {
    const now = Date.now();
    
    // Calculate typing speed (keystrokes per second) in recent window
    const recentKeyPresses = state.keyHistory.filter(
      event => event.type === 'keydown' && now - event.timestamp < ANALYSIS_WINDOW
    ).length;
    
    // Normalized typing speed (0-1 range)
    const typingSpeed = Math.min(
      recentKeyPresses / (ANALYSIS_WINDOW / 1000) / TYPING_SPEED_MAX, 
      1
    );
    
    // Calculate deletion rate
    const recentEvents = state.keyHistory.filter(
      event => now - event.timestamp < ANALYSIS_WINDOW
    );
    
    const recentDeletions = recentEvents.filter(
      event => (event.key === 'Backspace' || event.key === 'Delete') && event.type === 'keydown'
    ).length;
    
    const deletionRate = recentEvents.length > 0 
      ? recentDeletions / recentEvents.length 
      : 0;
    
    // Detect pause
    const timeSinceLastKey = now - state.lastKeyTime;
    const pauseDetected = timeSinceLastKey > PAUSE_THRESHOLD;
    
    // Analyze key patterns for potential frustration
    // Look for rapid repeated keystrokes or repeated deletions
    let frustrationIndicators = 0;
    
    // Check for rapid repeated keys
    const keyTimings = state.keyHistory
      .filter(event => event.type === 'keydown' && now - event.timestamp < ANALYSIS_WINDOW)
      .map(event => event.timestamp);
    
    // Look for very short intervals between keystrokes (< 100ms)
    for (let i = 1; i < keyTimings.length; i++) {
      if (keyTimings[i] - keyTimings[i-1] < 100) {
        frustrationIndicators++;
      }
    }
    
    // Check for consecutive deletions
    let consecutiveDeletions = 0;
    let maxConsecutiveDeletions = 0;
    
    for (let i = 0; i < recentEvents.length; i++) {
      if ((recentEvents[i].key === 'Backspace' || recentEvents[i].key === 'Delete') 
          && recentEvents[i].type === 'keydown') {
        consecutiveDeletions++;
        maxConsecutiveDeletions = Math.max(maxConsecutiveDeletions, consecutiveDeletions);
      } else {
        consecutiveDeletions = 0;
      }
    }
    
    // Normalize frustration indicators
    const normalizedFrustration = Math.min(
      (frustrationIndicators / 10) + (maxConsecutiveDeletions / 5), 
      1
    );
    
    // Calculate exploration level based on cursor movement and jump patterns
    // For now, we'll use a simple heuristic based on pauses and typing patterns
    // In a real implementation, we would track cursor jumps, scrolling, etc.
    const pauseFrequency = state.pauses.filter(
      pause => now - pause.end < ANALYSIS_WINDOW * 3 // Larger window for pauses
    ).length;
    
    const explorationLevel = Math.min(
      pauseFrequency / 5 + (1 - typingSpeed) * 0.5,
      1
    );
    
    // Return computed metrics
    return {
      typingSpeed,
      deletionRate,
      pauseDetected,
      frustrationLevel: normalizedFrustration,
      explorationLevel: explorationLevel
    };
  };
  
  /**
   * Reset the tracker state
   */
  const resetState = () => {
    state.lastKeyTime = Date.now();
    state.keyPressCount = 0;
    state.deletionCount = 0;
    state.pauseStart = null;
    state.keyHistory = [];
    state.pauses = [];
  };
  
  /**
   * Get the current state
   */
  const getState = () => {
    return { ...state };
  };
  
  // Return the public API
  return {
    processEvent,
    computeMetrics,
    resetState,
    getState
  };
}

/**
 * Helper: Create an event handler for an editor component
 * @param {Function} tracker - Event tracker instance
 * @param {Function} onUpdate - Callback for metric updates
 * @param {Number} updateFrequency - How often to compute metrics (ms)
 */
export function createEditorEventHandler(tracker, onUpdate, updateFrequency = 3000) {
  let updateTimer = null;
  
  // Set up the update timer
  if (onUpdate && updateFrequency > 0) {
    updateTimer = setInterval(() => {
      const metrics = tracker.computeMetrics();
      onUpdate(metrics);
    }, updateFrequency);
  }
  
  // The event handler function
  const handleEvent = (editor, event) => {
    tracker.processEvent(editor, event);
  };
  
  // Cleanup function
  const cleanup = () => {
    if (updateTimer) {
      clearInterval(updateTimer);
    }
  };
  
  return {
    handleEvent,
    cleanup
  };
}

/**
 * Helper: Hook to create and use an editor event tracker
 * 
 * Usage:
 * const { handleEditorEvent, metrics, cleanup } = useEditorEventTracker(onMetricsUpdate);
 */
export function useEditorEventTracker(onMetricsUpdate, updateFrequency = 3000) {
  const tracker = createEditorEventTracker();
  const handler = createEditorEventHandler(tracker, onMetricsUpdate, updateFrequency);
  
  return {
    handleEditorEvent: handler.handleEvent,
    metrics: tracker.computeMetrics(),
    cleanup: handler.cleanup,
    resetState: tracker.resetState
  };
}
