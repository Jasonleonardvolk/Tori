// Complete test utilities with all necessary polyfills and mocks
import React from 'react';
import { render } from '@testing-library/react';
import { PersonaProvider } from '../components/PersonaSelector/PersonaContext';

// Import mock files directly
import mockExporterService from './__mocks__/exporterService';

// Mock all browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
);

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Canvas
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
    }),
  }),
  width: 500,
  height: 500,
  setAttribute: () => {},
  style: {},
};

const originalCreateElement = document.createElement.bind(document);
document.createElement = (tagName) => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  return originalCreateElement(tagName);
};

global.URL.createObjectURL = jest.fn(() => 'blob:mock');

// Default concept data
const defaultConceptData = { 
  alpha: 0, 
  epsilon: 0, 
  nodes: [
    { id: 'node_1', label: 'Node 1', phase: 0.0 },
    { id: 'node_2', label: 'Node 2', phase: 0.0 },
    { id: 'node_3', label: 'Node 3', phase: 0.0 }
  ], 
  links: [] 
};

// Mock all services
jest.mock('../services/conceptGraphService', () => ({
  default: {
    getNode: jest.fn((nodeId) => ({
      id: nodeId,
      label: `Node ${nodeId}`,
      type: 'function',
      phase: 0.0
    })),
    updateNode: jest.fn(),
    getConceptGraph: jest.fn(() => defaultConceptData),
    subscribeToUpdates: jest.fn((callback) => {
      return () => {};
    }),
    clear: jest.fn(),
  }
}));

jest.mock('../services/executionTracerService', () => ({
  default: {
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
    subscribeToExecutionUpdates: jest.fn((callback) => {
      return () => {};
    }),
  }
}));

jest.mock('../services/editorSyncService', () => ({
  default: {
    initialize: jest.fn((conceptGraph) => {
      return Promise.resolve();
    }),
    subscribeToUpdates: jest.fn((callback) => {
      return () => {};
    }),
    warn: jest.fn(),
    error: jest.fn(),
  }
}));

// Mock exporterService with the complete mock
jest.mock('../services/exporterService', () => mockExporterService);

// Mock other services
jest.mock('../services/featureFlagsService', () => ({
  default: {
    getFeatureFlag: jest.fn(() => false),
    subscribe: jest.fn(() => () => {}),
  }
}));

jest.mock('../services/agentSuggestionsService', () => ({
  default: {
    fetchSuggestions: jest.fn().mockResolvedValue([]),
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn(),
  }
}));

const AllTheProviders = ({ children, conceptData = defaultConceptData }) => {
  const childElement = React.isValidElement(children) 
    ? React.cloneElement(children, { conceptData })
    : <div>{children}</div>;
    
  return (
    <PersonaProvider>
      {childElement}
    </PersonaProvider>
  );
};

const customRender = (ui, options = {}) => {
  const { wrapper, ...renderOptions } = options;
  
  const Wrapper = wrapper ? ({ children }) => wrapper({ children }) : AllTheProviders;
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export * from '@testing-library/react';
export { customRender as render };
export { defaultConceptData };
export { AllTheProviders };
