/**
 * Mock components for ExecutionTracer_FieldMeditationMode integration tests
 */

import React, { useState, useEffect } from 'react';
import mockExecutionTracerService from './mockExecutionTracerService';

/**
 * Mock implementation of FieldMeditationMode component
 * Simulates the behavior needed for testing the ExecutionTracerService integration
 */
export const MockFieldMeditationMode = ({ conceptData, pythonCode, onDivergenceDetected }) => {
  const [executionState, setExecutionState] = useState({
    isRunning: false,
    currentNode: null,
    currentPhase: 0,
    divergences: []
  });
  
  useEffect(() => {
    // Connect to the execution tracer service when component mounts
    const setupTracer = async () => {
      await mockExecutionTracerService.connect();
      
      // Subscribe to execution state updates
      mockExecutionTracerService.subscribe('traceUpdate', (state) => {
        setExecutionState({
          isRunning: state.isRunning || false,
          currentNode: state.currentNode,
          currentPhase: state.currentPhase || 0,
          divergences: state.divergences || []
        });
        
        // If there are divergences, notify the parent
        if (state.divergences && state.divergences.length > 0) {
          onDivergenceDetected(state.divergences[0]);
        }
      });
      
      // Simulate execution on mount for testing
      if (pythonCode) {
        mockExecutionTracerService.executePythonCode(pythonCode);
      }
    };
    
    setupTracer();
    
    // Cleanup when component unmounts
    return () => {
      mockExecutionTracerService.disconnect();
    };
  }, [pythonCode, onDivergenceDetected]);
  
  // Render the mock component with necessary elements for testing
  return (
    <div data-testid="field-meditation-mode">
      <h3>Field Meditation Mode (Mock)</h3>
      
      {executionState.isRunning && (
        <div data-testid="execution-indicator">
          Execution in progress...
        </div>
      )}
      
      {executionState.currentNode && (
        <div data-testid="current-node">
          Current Node: {executionState.currentNode}
          Phase: {executionState.currentPhase.toFixed(2)}
        </div>
      )}
      
      {executionState.divergences && executionState.divergences.length > 0 && (
        <div data-testid="divergence-warnings">
          <h4>Divergence Warnings</h4>
          <ul>
            {executionState.divergences.map((div, index) => (
              <li key={index}>
                {div.type}: {div.nodeId} - {div.severity}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div data-testid="visualization">
        <p>Spectral Entropy Wave Visualization</p>
        {/* Simulated visualization elements would go here */}
      </div>
    </div>
  );
};
