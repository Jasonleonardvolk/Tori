// Temporary Jest setup to prevent infinite loops
import '@testing-library/jest-dom';

// Mock console.error to catch infinite loop warnings
const originalError = console.error;
let renderCount = 0;

console.error = (...args) => {
  const message = args[0];
  
  // Detect infinite loop warnings
  if (typeof message === 'string' && message.includes('Maximum update depth exceeded')) {
    console.log('INFINITE LOOP DETECTED! Stopping test...');
    throw new Error('Infinite loop detected in component render');
  }
  
  // Track renders
  if (message && message.includes('Warning: React.render')) {
    renderCount++;
    if (renderCount > 10) {
      throw new Error('Too many renders - possible infinite loop');
    }
  }
  
  originalError.apply(console, args);
};

// Reset render count before each test
beforeEach(() => {
  renderCount = 0;
  jest.clearAllMocks();
});

// Mock problematic browser APIs
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

// Mock window.matchMedia
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

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Prevent infinite loops in useEffect
jest.mock('react', () => {
  const actualReact = jest.requireActual('react');
  
  return {
    ...actualReact,
    useEffect: (callback, deps) => {
      // Log effects to help debug
      if (process.env.DEBUG_EFFECTS) {
        console.log('useEffect called with deps:', deps);
      }
      
      // Call original useEffect
      return actualReact.useEffect(callback, deps);
    }
  };
});
