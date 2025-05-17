import React from 'react';
import { render } from '@testing-library/react';
import { PersonaProvider } from './components/PersonaSelector/PersonaContext';

// Patch for JSDOM missing APIs
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class {
  constructor() {}
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Simple mock canvas
const mockCanvas = {
  getContext: () => ({
    beginPath: () => {},
    closePath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    fillRect: () => {},
    clearRect: () => {},
    measureText: () => ({ width: 0 }),
    fillText: () => {},
    strokeText: () => {},
    moveTo: () => {},
    lineTo: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    createLinearGradient: () => ({
      addColorStop: () => {}
    })
  }),
  width: 500,
  height: 500
};

const originalCreateElement = document.createElement.bind(document);
document.createElement = (tagName) => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  return originalCreateElement(tagName);
};

// Default concept data for all tests
const safeConceptData = { 
  alpha: 0, 
  epsilon: 0, 
  nodes: [
    { id: 'node_1', label: 'Node 1', phase: 0.0 },
    { id: 'node_2', label: 'Node 2', phase: 0.0 },
    { id: 'node_3', label: 'Node 3', phase: 0.0 }
  ], 
  links: [] 
};

// Mock common services
jest.mock('./services/conceptGraphService', () => ({
  getNode: jest.fn((nodeId) => ({
    id: nodeId,
    label: `Node ${nodeId}`,
    type: 'function',
    phase: 0.0
  })),
  updateNode: jest.fn(),
  getConceptGraph: jest.fn(() => safeConceptData),
  subscribeToUpdates: jest.fn(() => () => {}),
}));

jest.mock('./services/executionTracerService', () => ({
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn(),
  executionState: {
    currentNode: null,
    currentPhase: 0,
    divergences: []
  },
  detectDivergences: jest.fn(),
  handleExecutionStart: jest.fn(),
  emitTraceUpdate: jest.fn(),
  subscribeToExecutionUpdates: jest.fn(() => () => {}),
}));

// Wrap everything so FieldMeditationMode (and friends) never see `undefined`
const AllProviders = ({ children }) => {
  const childElement = React.isValidElement(children) 
    ? React.cloneElement(children, { conceptData: safeConceptData, ...children.props })
    : children;
    
  return (
    <PersonaProvider>
      {childElement}
    </PersonaProvider>
  );
};

const customRender = (ui, options = {}) => {
  const { wrapper, ...renderOptions } = options;
  
  const Wrapper = ({ children }) => {
    const providers = wrapper ? wrapper({ children }) : <AllProviders>{children}</AllProviders>;
    return providers;
  };
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// re-export RTL with our wrapper
export * from '@testing-library/react';
export { customRender as render };
export { safeConceptData as defaultConceptData };
