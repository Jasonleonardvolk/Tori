# Affective Agent Integration Installation Guide

This guide provides instructions for setting up and integrating the affective agent-enhanced components into your ALAN IDE project.

## Overview

The Affective Agent Integration enhances the standard agent suggestions with:

1. Emotion and state-aware suggestions based on developer interaction patterns
2. Multiple agent personas with specialized knowledge domains
3. Hierarchical suggestion categorization (immediate, tactical, strategic)
4. Causal explanations for suggestions with long-term impact analysis
5. Ripple effect visualization for code changes
6. Interactive chat interface for natural language interactions
7. Side-by-side diff preview for code changes

## Installation Steps

### 1. Install Dependencies

First, ensure you have the required dependencies:

```bash
cd client
npm install codemirror react-codemirror2 
```

### 2. File Structure

The integration consists of the following key files:

```
client/src/
├── AffectiveApp.jsx                       # Standalone affective-enabled editor
├── AffectiveIntegrationExample.jsx        # Complete demo with all features
├── AffectiveIntegrationExample.css        # Styling for the demo
├── affective-computing-integration.md     # Technical documentation
├── components/
│   ├── PersonaSelector/                   # Agent persona selection
│   ├── QuickActionsBar/
│   │   ├── AffectiveQuickActionsBar.jsx   # Enhanced suggestion bar
│   │   └── AffectiveQuickActionsBar.css   # Styling for the bar
│   └── RipplePreview/                     # Code change impact visualization
└── services/
    └── affectiveAgentSuggestionsService.js # Backend connection with affective features
```

### 3. Integration Options

You have three options for integrating the affective agent features:

#### Option A: Use the Complete Demo

Import and use the `AffectiveIntegrationExample` component that includes all features:

```jsx
import AffectiveIntegrationExample from './AffectiveIntegrationExample';

function App() {
  return (
    <div className="app">
      <AffectiveIntegrationExample />
    </div>
  );
}
```

#### Option B: Use Only the Affective Editor

Import and use the `AffectiveApp` component for just the editor with affective suggestions:

```jsx
import AffectiveApp from './AffectiveApp';

function App() {
  return (
    <div className="app">
      <AffectiveApp />
    </div>
  );
}
```

#### Option C: Use Individual Components

Integrate the specific components you need:

```jsx
import AffectiveQuickActionsBar from './components/QuickActionsBar/AffectiveQuickActionsBar';
import PersonaSelector from './components/PersonaSelector/PersonaSelector';
import RipplePreview from './components/RipplePreview/RipplePreview';
import affectiveAgentSuggestionsService from './services/affectiveAgentSuggestionsService';

// Then use them in your component
```

### 4. Backend Setup

The affective agent features require a WebSocket connection to provide real-time suggestions. Update your server configuration:

1. In `server.js`, add the WebSocket handler:

```javascript
// Add WebSocket support for affective agent
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to affective agent WebSocket');
  
  // Send initial developer state
  ws.send(JSON.stringify({
    type: 'developerState',
    data: {
      focusLevel: 0.5,
      frustrationLevel: 0.1,
      explorationLevel: 0.3
    }
  }));
  
  // Handle messages from clients
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'interactionData') {
        // Process interaction data and update state
        // In a real implementation, this would use ML models
        console.log('Received interaction data:', data);
        
        // Send updated suggestions based on new state
        ws.send(JSON.stringify({
          type: 'suggestions',
          data: generateSuggestions(data)
        }));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected from affective agent WebSocket');
  });
});

// Helper function to generate suggestions based on state
function generateSuggestions(interactionData) {
  // In a real implementation, this would use ML models
  // For now, return sample suggestions
  return [
    {
      id: 'suggestion-1',
      label: 'Refactor for loop to map()',
      explanation: 'Using Array.map() is more readable and functional.',
      confidence: 0.85,
      hierarchyLevel: 'immediate',
      icon: '🔄',
      color: '#2563eb',
      diff: {
        old: 'for (let i = 0; i < array.length; i++) {\n  results.push(array[i] * 2);\n}',
        new: 'const results = array.map(item => item * 2);'
      },
      causalExplanation: {
        cause: {
          description: "The for loop is less readable and more error-prone",
          evidence: ["Manual index tracking", "Imperative style"]
        },
        effect: {
          immediate: "Improved code readability",
          longTerm: "More maintainable codebase and fewer bugs"
        },
        alternatives: [
          {
            approach: "forEach method",
            consequence: "Still requires external array and push operations"
          }
        ]
      }
    }
    // More suggestions...
  ];
}
```

### 5. Testing Your Integration

To test that everything is working:

1. Start your server with `node server.js`
2. Run your client with `cd client && npm start`
3. Open your browser to the application
4. Try the following interactions:
   - Select different agent personas
   - Type and pause in the editor to trigger suggestions
   - Apply a suggestion to see the ripple effect preview
   - Use the chat interface to ask questions about your code

## Customization

### Styling

You can customize the appearance by modifying these CSS files:

- `AffectiveQuickActionsBar.css` - For the suggestion bar styling
- `AffectiveIntegrationExample.css` - For the overall demo styling

### Agent Personas

To add or modify agent personas, update the `availablePersonas` state in `AffectiveIntegrationExample.jsx`:

```jsx
const [availablePersonas, setAvailablePersonas] = useState([
  { id: 'Refactorer', name: 'Code Refactorer', icon: '🔧', description: '...' },
  // Add or modify personas here
]);
```

### Suggestion Types

To customize the types of suggestions shown, modify the `fetchSuggestions` function in `affectiveAgentSuggestionsService.js`.

## Troubleshooting

### WebSocket Connection Issues

If you're experiencing WebSocket connection issues:

1. Check that your server is running and the WebSocket server is properly initialized
2. Verify the WebSocket URL in `affectiveAgentSuggestionsService.js` matches your server configuration
3. Check browser console for connection errors

### Suggestion Display Problems

If suggestions aren't appearing:

1. Verify that sample suggestions are being returned from the service
2. Check that the `AffectiveQuickActionsBar` component is properly mounted
3. Ensure the WebSocket connection is established and receiving messages

## Next Steps

After installation, consider these enhancements:

1. Implement more sophisticated developer state detection using ML models
2. Add additional agent personas for specialized domains
3. Expand the ripple effect visualization with more detailed impact analysis
4. Integrate with version control systems for commit-aware suggestions
