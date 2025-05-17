import React, { useState, useEffect, useRef } from 'react';
import { Controlled as CodeMirrorEditor } from 'react-codemirror2';
import AffectiveQuickActionsBar from './components/QuickActionsBar/AffectiveQuickActionsBar';
import QuickActionsPanel from './components/QuickActionsPanel/QuickActionsPanel';
import affectiveAgentSuggestionsService from './services/affectiveAgentSuggestionsService';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material-darker.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/jsx/jsx';
import './App.css';

/**
 * AffectiveApp - Enhanced version of the App component that incorporates affective computing principles
 * 
 * Key enhancements:
 * 1. Uses AffectiveQuickActionsBar for confidence-aware and context-driven suggestions
 * 2. Connects to the affectiveAgentSuggestionsService to get suggestions with confidence scores
 * 3. Monitors editor interactions to feed into the affective agent system
 * 4. Adapts UI based on developer state
 */
function AffectiveApp() {
  const [agentSuggestions, setAgentSuggestions] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editorValue, setEditorValue] = useState('// Affective Agent-Enabled Editor\n\n/**\n * The editor now tracks your interactions to provide\n * context-aware, adaptive suggestions that prioritize\n * your well-being and productivity.\n *\n * Try typing, pausing, and deleting text to see\n * how the system adapts to your state.\n */\n\nfunction sampleComponent() {\n  // This example has intentional areas for improvement\n  // Wait for suggestions to appear below\n  \n  const items = [1, 2, 3, 4, 5];\n  \n  // Inefficient loop that could be improved\n  let results = [];\n  for (let i = 0; i < items.length; i++) {\n    const item = items[i];\n    results.push(item * 2);\n  }\n  \n  // Missing error handling\n  function fetchData() {\n    fetch("https://api.example.com/data")\n      .then(response => response.json())\n      .then(data => console.log(data))\n  }\n\n  return results;\n}');
  
  // Track editor interaction patterns
  const [interactionData, setInteractionData] = useState({
    typingSpeed: 0,
    deletionRate: 0,
    pauseDetected: false
  });
  
  // For tracking developer state
  const [developerState, setDeveloperState] = useState({
    focusLevel: 0.5,
    frustrationLevel: 0.1,
    explorationLevel: 0.5
  });
  
  // Refs for tracking timing
  const lastKeyPressTime = useRef(Date.now());
  const keystrokeTimings = useRef([]);
  const deletionCount = useRef(0);
  const characterCount = useRef(0);
  
  // Effect for initial suggestions fetch
  useEffect(() => {
    // Initial fetch of suggestions
    const fetchInitialSuggestions = async () => {
      try {
        const suggestions = await affectiveAgentSuggestionsService.getSuggestions();
        setAgentSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        // Fallback to empty array if fetch fails
        setAgentSuggestions([]);
      }
    };
    
    fetchInitialSuggestions();
    
    // Set up WebSocket connection for real-time suggestions
    const wsConnection = affectiveAgentSuggestionsService.connectWebSocket(
      (suggestions) => {
        setAgentSuggestions(suggestions);
      },
      (state) => {
        setDeveloperState(state);
      }
    );
    
    return () => {
      // Clean up WebSocket connection
      if (wsConnection) {
        wsConnection.disconnect();
      }
    };
  }, []);
  
  // Handle editor changes
  const handleEditorChange = (editor, data, value) => {
    setEditorValue(value);
    
    // Track interaction metrics for affective analysis
    const currentTime = Date.now();
    const timeSinceLastKeypress = currentTime - lastKeyPressTime.current;
    lastKeyPressTime.current = currentTime;
    
    // Only count "normal" keypress timings (ignore long pauses)
    if (timeSinceLastKeypress < 2000) {
      keystrokeTimings.current.push(timeSinceLastKeypress);
      
      // Keep a rolling window of the last 20 keystrokes
      if (keystrokeTimings.current.length > 20) {
        keystrokeTimings.current.shift();
      }
    }
    
    // Calculate typing speed (characters per minute)
    const typingSpeed = calculateTypingSpeed(keystrokeTimings.current);
    
    // Track deletions for deletion rate
    if (data.origin === '+delete') {
      deletionCount.current++;
    }
    
    // Track total character count
    characterCount.current = value.length;
    
    // Calculate deletion rate
    const deletionRate = characterCount.current > 0 
      ? deletionCount.current / characterCount.current 
      : 0;
    
    // Detect pauses (gap > 2 seconds)
    const pauseDetected = timeSinceLastKeypress > 2000;
    
    // Update interaction data
    const newInteractionData = {
      typingSpeed,
      deletionRate,
      pauseDetected
    };
    
    setInteractionData(newInteractionData);
    
    // Send interaction data to the service
    if (affectiveAgentSuggestionsService) {
      affectiveAgentSuggestionsService.updateInteractionData(newInteractionData);
    }
  };
  
  // Calculate typing speed from keystroke timings
  const calculateTypingSpeed = (timings) => {
    if (timings.length === 0) return 0;
    
    // Average time per keystroke in milliseconds
    const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
    
    // Convert to characters per minute
    // 60000 ms in a minute / avg time per keystroke
    return Math.min(1, 60000 / (avgTime * 100)); // Normalize to 0-1 range
  };
  
  // Handle suggestion application
  const handleApplySuggestion = async (suggestion) => {
    try {
      // Actually apply the suggestion
      if (suggestion.diff) {
        // Simple implementation - replace editor value with the new content
        // A more sophisticated implementation would apply the diff at the correct position
        setEditorValue(prevValue => 
          prevValue.replace(suggestion.diff.old, suggestion.diff.new)
        );
      }
      
      // Record the application with the service
      await affectiveAgentSuggestionsService.applySuggestion(suggestion.id);
      
      // Update the list to remove or update the suggestion
      setAgentSuggestions(prevSuggestions => 
        prevSuggestions.filter(s => s.id !== suggestion.id)
      );
    } catch (error) {
      console.error('Error applying suggestion:', error);
    }
  };
  
  // Handle suggestion dismissal
  const handleDismissSuggestion = async (suggestion) => {
    try {
      // Record the dismissal with the service
      await affectiveAgentSuggestionsService.dismissSuggestion(suggestion.id);
      
      // Update the list to remove the suggestion
      setAgentSuggestions(prevSuggestions => 
        prevSuggestions.filter(s => s.id !== suggestion.id)
      );
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };
  
  return (
    <div className="affective-app">
      <div className="editor-container">
        <CodeMirrorEditor
          value={editorValue}
          options={{
            mode: 'jsx',
            theme: 'material-darker',
            lineNumbers: true,
            lineWrapping: true
          }}
          onBeforeChange={handleEditorChange}
        />
      </div>
      
      <div className="quick-actions-container">
        <AffectiveQuickActionsBar
          suggestions={agentSuggestions}
          onApplySuggestion={handleApplySuggestion}
          onDismissSuggestion={handleDismissSuggestion}
          onShowAllSuggestions={() => setIsPanelOpen(true)}
          developerState={developerState}
        />
        
        {isPanelOpen && (
          <QuickActionsPanel
            suggestions={agentSuggestions}
            onApplySuggestion={handleApplySuggestion}
            onDismissSuggestion={handleDismissSuggestion}
            onClose={() => setIsPanelOpen(false)}
          />
        )}
      </div>
      
      <div className="state-indicators">
        <div 
          className="focus-indicator" 
          style={{ width: `${developerState.focusLevel * 100}%` }}
          title={`Focus Level: ${Math.round(developerState.focusLevel * 100)}%`}
        />
        <div 
          className="frustration-indicator" 
          style={{ width: `${developerState.frustrationLevel * 100}%` }}
          title={`Frustration Level: ${Math.round(developerState.frustrationLevel * 100)}%`}
        />
      </div>
    </div>
  );
}

export default AffectiveApp;
