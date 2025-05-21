# ALAN IDE Phase 3 - Sprint 3 Implementation

This document outlines the implementation of the Sprint 3 components for the ALAN IDE Phase 3, as specified in the roadmap. The focus for Sprint 3 is on the Execution Field Tracer and enhancing the agent bridge.

## 1. Execution Field Tracer

The Execution Field Tracer connects Field Meditation Mode to actual Python execution, capturing phase-state events during runtime and detecting divergences. This enables real-time visualization of code execution in the concept field.

### Key Components

- **Execution Tracer Service (`client/src/services/executionTracerService.js`)**:
  - Manages real-time monitoring of Python code execution
  - Instruments Python code to emit phase-state events
  - Detects divergences between expected and actual execution state
  - Implements WebSocket-based communication with Python runtime
  - Provides event subscription system for UI components

- **Enhanced Field Meditation Mode (`client/src/components/FieldMeditationMode/`)**:
  - Connects to the Execution Tracer Service for live execution data
  - Visualizes Koopman spectrum computed from execution traces
  - Displays spectral entropy waves based on execution dynamics
  - Highlights active nodes in the concept field during execution
  - Provides controls for execution and playback
  - Shows divergence warnings when execution strays from expected behavior

### How It Works

1. **Python Code Instrumentation**:

   The Execution Tracer Service automatically instruments Python code before execution:

   ```python
   # Original code
   def calculate_result(x, y):
       return x * y + x

   # Instrumented code
   import json, time, threading, websocket, random

   # Execution tracer setup
   _tracer_ws = None
   _tracer_lock = threading.Lock()

   def _connect_tracer():
       global _tracer_ws
       try:
           _tracer_ws = websocket.create_connection("ws://localhost:3002/execution-trace")
           _tracer_ws.send(json.dumps({"type": "execution_start", "payload": {"timestamp": time.time()}}))
       except Exception as e:
           print(f"Error connecting to execution tracer: {e}")

   # ... additional tracer functions ...

   def calculate_result(x, y):
       _send_event("node_calculate_result_12", random.random(), {"type": "function_entry", "name": "calculate_result", "line": 12})
       return x * y + x
   ```

2. **Runtime Trace Capture**:

   When instrumented code executes, trace events are sent to the tracer service:

   - Function/method entries
   - Class definitions
   - Variable updates
   - Phase state changes

   Each event includes a node ID, phase value, timestamp, and context.

3. **Divergence Detection**:

   The tracer compares execution state with expected phase dynamics:

   - Phase divergences occur when a node's phase during execution differs significantly from the expected phase in the concept graph
   - Resonance divergences occur when the runtime resonance of a node differs from its modeled resonance
   - Divergences are reported to the UI with severity levels

4. **Live Visualization**:

   The Field Meditation Mode component subscribes to execution events and updates:

   - The phase field canvas highlights active nodes
   - The Koopman spectrum trail visualizes eigenvalues from execution data
   - The entropy wave displays system entropy over time
   - Divergence warnings are shown in real time

## 2. Enhanced Agent Bridge

The Agent Bridge implementation connects the ALAN IDE to external agents through a standardized API, enabling automation and agent-driven workflows.

### Key Components

- **Accessibility Bridge Service (`client/src/services/accessibilityBridgeService.js`)**:
  - Provides a comprehensive UI command API via WebSocket
  - Creates a tree representation of the IDE's UI for agent navigation
  - Implements a component registry and command execution system
  - Allows agents to operate the IDE through accessibility hooks
  - Maintains connection with external agent systems

### How It Works

1. **Component Registration**:

   UI components register with the accessibility bridge:

   ```javascript
   // Inside a React component
   useEffect(() => {
     const unregister = accessibilityBridgeService.register(
       'concept-editor-panel',
       editorRef.current,
       {
         type: 'editor',
         filePath: props.filePath,
         language: props.language
       }
     );

     // Register available commands
     accessibilityBridgeService.registerCommand(
       'concept-editor-panel',
       'setValue',
       ({ value }) => {
         editorRef.current.setValue(value);
         return { success: true };
       }
     );

     return () => unregister();
   }, [props.filePath, props.language]);
   ```

2. **UI Tree Generation**:

   The bridge scans the DOM and registered components to create a navigable tree:

   ```javascript
   {
     "type": "root",
     "id": "alan-ide-root",
     "children": [
       {
         "type": "component",
         "id": "concept-editor-panel",
         "metadata": {
           "type": "editor",
           "filePath": "src/main.py",
           "language": "python"
         },
         "commands": ["setValue", "toggleConceptCanvas", "cycleLayout"],
         "accessibility": {
           "role": "textbox",
           "label": "Code editor for src/main.py"
         }
       },
       // Other components...
     ]
   }
   ```

3. **Command Execution**:

   Agents can execute commands on registered components:

   ```javascript
   // Example WebSocket message from agent
   {
     "type": "execute_command",
     "commandId": 123,
     "payload": {
       "componentId": "concept-editor-panel",
       "commandName": "setValue",
       "args": {
         "value": "def hello_world():\n    print('Hello, world!')"
       }
     }
   }
   ```

4. **Observation**:

   Agents observe the IDE state through the UI tree and execution results:

   ```javascript
   // Example WebSocket message to agent
   {
     "type": "ui_tree_update",
     "payload": {
       "type": "root",
       "id": "alan-ide-root",
       "children": [
         // Current UI state
       ],
       "timestamp": 1620000000000
     }
   }
   ```

## Integration with Previous Sprints

The Sprint 3 components build on the foundation of Sprints 1 and 2:

1. **Concept Graph Integration**:
   - The Execution Tracer connects to the concept graph from Sprint 1
   - Phase dynamics from the concept graph are used for divergence detection

2. **Editor Sync Integration**:
   - The Execution Tracer highlights active nodes in the ConceptFieldCanvas
   - The Editor Sync Service is notified of nodes being executed

3. **Persona Integration**:
   - The Concept Architect persona is enriched with execution tracking
   - Field Meditation Mode adapts to persona preferences through the context

## Code Examples

### Using the Execution Tracer in Custom Components

```javascript
import executionTracerService from '../../services/executionTracerService';

function MyComponent({ pythonCode }) {
  const [executionState, setExecutionState] = useState({});
  const [divergences, setDivergences] = useState([]);

  useEffect(() => {
    // Subscribe to tracer updates
    const traceSub = executionTracerService.subscribe(
      'traceUpdate',
      ({ executionState: state }) => {
        setExecutionState(state || {});
      }
    );

    // Subscribe to divergence detection
    const divergenceSub = executionTracerService.subscribe(
      'divergenceDetected',
      (divergence) => {
        setDivergences(prev => [...prev, divergence]);
      }
    );

    return () => {
      traceSub();
      divergenceSub();
    };
  }, []);

  const handleExecuteCode = () => {
    executionTracerService.startTracing(pythonCode)
      .then(result => {
        console.log('Execution completed:', result);
      })
      .catch(error => {
        console.error('Execution error:', error);
      });
  };

  // Component rendering...
}
```

### Registering with the Accessibility Bridge

```javascript
import accessibilityBridgeService from '../../services/accessibilityBridgeService';

function MyAccessibleComponent() {
  const componentRef = useRef();

  useEffect(() => {
    // Register the component
    const unregister = accessibilityBridgeService.register(
      'my-component',
      componentRef.current,
      {
        type: 'custom',
        description: 'My component description'
      }
    );

    // Register a command
    const unregisterCmd = accessibilityBridgeService.registerCommand(
      'my-component',
      'doSomething',
      (args) => {
        // Command implementation
        console.log('Doing something with:', args);
        return { success: true, result: 'Action completed' };
      }
    );

    return () => {
      unregister();
      unregisterCmd();
    };
  }, []);

  // Component rendering...
}
```

## Next Steps for Phase 3 Completion

With Sprint 3 complete, the final steps to complete Phase 3 include:

1. **Agent Bridge Enhancements**:
   - Complete the multi-agent communication protocols
   - Implement collaborative agent workflows
   - Add security and permission models

2. **Refactor Tools**:
   - Implement the Refactorer agent for code morphing
   - Add secret-lint autofix to replace literals with Vault references

3. **MCP Client Layer**:
   - Complete the integration with local MCP servers
   - Add Debug Agent for MCP traces

4. **Exporter**:
   - Implement Graph→code emitter with lineage comments
   - Add field state snapshot capabilities

These remaining components will complete the ALAN IDE Phase 3 implementation as specified in the roadmap.
