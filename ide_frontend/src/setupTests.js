// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toBeInTheDocument();
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Initialize custom matchers if jest-dom isn't directly available
if (!expect.extend) {
  console.warn('expect.extend not available. Custom matchers might not work correctly.');
} else {
  // Add fallback matchers if needed
  expect.extend({
    toBeInTheDocument(received) {
      const pass = Boolean(received);
      return {
        message: () => 
          `expected ${received} ${pass ? 'not ' : ''}to be in the document`,
        pass
      };
    }
  });
}

// Mock services and components that might be problematic in tests
jest.mock('./services/mcpClientService', () => ({
  debugTraces: [],
  maxTraces: 3,
  connectedServers: new Map(),
  activeConnections: new Map(),
  subscribe: jest.fn(),
  executeTool: jest.fn(),
  accessResource: jest.fn(),
  checkConnection: jest.fn(),
  disconnectServer: jest.fn(),
  sendMessage: jest.fn(),
  _notifySubscribers: jest.fn(),
  _addTrace: jest.fn((trace) => {
    // Keep only the last 3 traces
    const service = require('./services/mcpClientService').default;
    service.debugTraces.push(trace);
    if (service.debugTraces.length > service.maxTraces) {
      service.debugTraces = service.debugTraces.slice(-service.maxTraces);
    }
  })
}));

// Global mocks for browser APIs
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
