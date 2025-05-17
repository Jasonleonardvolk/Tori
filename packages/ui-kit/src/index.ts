/**
 * UI Kit Package for ITORI IDE
 * 
 * This package provides shared UI components for ITORI applications.
 */

// Export WebSocketStatus component
export { 
  default as WebSocketStatus,
  type WebSocketStatusProps 
} from './components/WebSocketStatus/WebSocketStatus';

// Export ErrorBoundary component
export { default as ErrorBoundary } from './components/ErrorBoundary';

// Export CodeWorkspace component
export { 
  default as CodeWorkspace,
  type CodeWorkspaceProps 
} from './components/CodeWorkspace';

// Export language modes
export { elfinLanguage } from './languages/elfin';

// Export other components as needed
