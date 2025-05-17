import { useState, useEffect, useRef } from 'react';
import { createEditorEventTracker } from '../utils/affective/editorEventTracker';

/**
 * Custom hook for tracking editor events and analyzing them for affective computing
 * 
 * This hook integrates editor event tracking with WebSocket communication to
 * send interaction data to the affective agent service.
 * 
 * @param {Object} wsConnection - WebSocket connection object from affectiveAgentSuggestionsService
 * @param {Function} onMetricsUpdate - Optional callback when metrics are updated
 * @param {Number} updateFrequency - How often to compute metrics (ms)
 * @returns {Object} - Handler functions and current metrics
 */
export function useAffectiveEditorTracking(wsConnection, onMetricsUpdate, updateFrequency = 3000) {
  const [metrics, setMetrics] = useState({
    typingSpeed: 0,
    deletionRate: 0,
    pauseDetected: false,
    frustrationLevel: 0,
    explorationLevel: 0
  });
  
  // Create editor tracker
  const tracker = useRef(createEditorEventTracker());
  
  // Set up interval to process interaction data
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Compute current metrics
      const currentMetrics = tracker.current.computeMetrics();
      
      // Update state
      setMetrics(currentMetrics);
      
      // Call the metrics update callback if provided
      if (onMetricsUpdate) {
        onMetricsUpdate(currentMetrics);
      }
      
      // Send to affective service if WebSocket connection is provided
      if (wsConnection) {
        wsConnection.sendInteractionData(currentMetrics);
      }
      
    }, updateFrequency);
    
    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [wsConnection, onMetricsUpdate, updateFrequency]);
  
  // Process editor events
  const handleEditorEvent = (editor, event) => {
    tracker.current.processEvent(editor, event);
  };
  
  // Reset all tracking data
  const resetTracking = () => {
    tracker.current.resetState();
  };
  
  // Return the required functions and data
  return {
    handleEditorEvent,
    resetTracking,
    metrics
  };
}

export default useAffectiveEditorTracking;
