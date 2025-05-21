# Affective Computing Integration Guide

This guide explains how to integrate the affective computing enhancements into your application. These enhancements enable your IDE to adapt to the developer's emotional and cognitive state, providing more contextually appropriate suggestions.

## Key Components

1. **AffectiveQuickActionsBar**: An enhanced version of the QuickActionsBar that adapts based on the developer's state
2. **AffectiveAgentSuggestionsService**: Backend service that handles affective computing features
3. **Editor Integration**: Tracks developer interactions for affective analysis

## Installation

Ensure you have all the necessary dependencies:

```bash
npm install codemirror react-codemirror2
```

## Integration Steps

### 1. Import Components

```jsx
import AffectiveQuickActionsBar from './components/QuickActionsBar/AffectiveQuickActionsBar';
import affectiveAgentSuggestionsService from './services/affectiveAgentSuggestionsService';
```

### 2. Replace Standard QuickActionsBar

Replace your existing QuickActionsBar with the AffectiveQuickActionsBar:

```jsx
// Instead of
<QuickActionsBar 
  suggestions={agentSuggestions}
  onOpenPanel={openPanel}
  onApply={handleApplySuggestion}
  onDismiss={handleDismissSuggestion}
/>

// Use
<AffectiveQuickActionsBar 
  onOpenPanel={openPanel}
  onApply={handleApplySuggestion}
  onDismiss={handleDismissSuggestion}
/>
```

The AffectiveQuickActionsBar will automatically fetch suggestions and adapt them based on the developer's state.

### 3. Track Editor Interactions

Modify your editor component to track key interactions:

```jsx
<CodeMirrorEditor
  // ... other props
  onKeyDown={(editor, event) => handleEditorEvents(editor, event)}
  onKeyUp={(editor, event) => handleEditorEvents(editor, event)}
  onFocus={(editor, event) => handleEditorEvents(editor, { ...event, type: "focus" })}
  onBlur={(editor, event) => handleEditorEvents(editor, { ...event, type: "blur" })}
/>
```

Implementation of the `handleEditorEvents` function:

```jsx
const handleEditorEvents = (editor, event) => {
  // Skip non-keyboard events or modifier key events
  if (!event.key || ['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
    return;
  }
  
  const now = Date.now();
  
  // Track key events for affective analysis
  keyEvents.current.lastKeyTime = now;
  keyEvents.current.keyPressCount++;
  keyEvents.current.keyHistory.push(now);
  
  // Track deletion events
  if (event.key === 'Backspace' || event.key === 'Delete') {
    keyEvents.current.deletionCount++;
  }
  
  // Handle specific event types
  switch (event.type) {
    case 'keydown':
      // Process keydown events
      break;
    case 'focus':
      // Process focus events
      break;
    case 'blur':
      // Process blur events
      break;
    default:
      break;
  }
};
```

### 4. Connect to the Affective Service

Set up a WebSocket connection to receive real-time suggestions and send interaction data:

```jsx
useEffect(() => {
  // Connect to WebSocket for real-time suggestions and developer state updates
  const connection = affectiveAgentSuggestionsService.connectWebSocket(
    // Suggestions callback
    (newSuggestions) => {
      setSuggestions(newSuggestions);
    },
    // Developer state callback
    (developerState) => {
      console.log("Developer state updated:", developerState);
    }
  );
  
  // Set up interval to process and send interaction data
  const intervalId = setInterval(() => {
    // Calculate metrics from interaction data
    const metrics = {
      typingSpeed: calculateTypingSpeed(),
      deletionRate: calculateDeletionRate(),
      pauseDetected: detectPauses()
    };
    
    // Send to affective service
    connection.sendInteractionData(metrics);
  }, 3000);
  
  // Cleanup
  return () => {
    connection.disconnect();
    clearInterval(intervalId);
  };
}, []);
```

### 5. Process Interaction Data

Process interaction data to calculate metrics for affective analysis:

```jsx
const processInteractionData = () => {
  const now = Date.now();
  const timeWindow = 10000; // 10 seconds window
  
  // Calculate typing speed (keystrokes per second)
  const recentKeyPresses = keyEvents.current.keyHistory.filter(
    time => now - time < timeWindow
  ).length;
  
  // Calculate normalized typing speed (0-1 range)
  const typingSpeed = Math.min(recentKeyPresses / (timeWindow / 1000) / 5, 1);
  
  // Calculate deletion rate (proportion of delete/backspace keystrokes)
  const deletionRate = keyEvents.current.keyHistory.length > 0 
    ? keyEvents.current.deletionCount / keyEvents.current.keyHistory.length
    : 0;
  
  // Detect pauses (no keystroke for more than 2 seconds)
  const pauseDetected = (now - keyEvents.current.lastKeyTime) > 2000;
  
  return { typingSpeed, deletionRate, pauseDetected };
};
```

## Technical Details

### Fuzzy Logic Implementation

The affective agent uses fuzzy logic to evaluate confidence scores and developer states:

```javascript
modifiedLaplaceMembership(x, m, lambda) {
  return Math.exp(-lambda * Math.abs(x - m));
}
```

### Causal Explanation Structure

Suggestions include causal explanations with this structure:

```javascript
{
  cause: { 
    description: "The current code pattern could be improved",
    evidence: ["for (let i = 0; i < items.length; i++) { ... }"]
  },
  effect: { 
    immediate: "Improved code readability and maintainability",
    longTerm: "Reduced technical debt and maintenance costs"
  },
  alternatives: [
    {
      approach: "No change",
      consequence: "Continued maintenance challenges"
    }
  ]
}
```

### Adaptive Priority Calculation

Suggestions are prioritized based on the developer's state:

```javascript
// When focused, prioritize immediate suggestions 
if (focusLevel > 0.7) {
  if (suggestion.hierarchyLevel === 'immediate') {
    priority += 0.3;
  } else {
    priority -= 0.2;
  }
}

// When frustrated, prioritize helpful quick wins
if (frustrationLevel > 0.6) {
  if (suggestion.hierarchyLevel === 'immediate') {
    priority += 0.4;
  }
  if (suggestion.explanation && suggestion.explanation.length < 100) {
    priority += 0.2;
  }
}
```

## Complete Example

For a complete implementation example, see `AffectiveIntegrationExample.jsx` which demonstrates all the integration steps in a working component.

## Configuration

The affective agent's behavior can be configured through the `affectiveAgentSuggestionsService.js` file:

- `causalModelParams`: Configure the parameters for the causal model
- `modifiedLaplaceMembership`: Adjust the fuzzy membership function
- `wsEndpoint`: Configure the WebSocket endpoint for real-time updates

## Troubleshooting

- **No suggestions appearing**: Check that the WebSocket connection is established and that the backend service is running
- **Suggestions not adapting**: Ensure that interaction data is being properly tracked and sent to the service
- **High CPU usage**: Reduce the frequency of interaction data processing if performance is an issue
