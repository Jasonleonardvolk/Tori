// Jest setup file
import '@testing-library/jest-dom';

// Mock global objects that might be missing in jsdom
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Canvas contexts
HTMLCanvasElement.prototype.getContext = function() {
  return {
    fillRect: function() {},
    clearRect: function() {},
    getImageData: function(x, y, w, h) {
      return {
        data: new Array(w * h * 4)
      };
    },
    putImageData: function() {},
    createImageData: function() { return []; },
    setTransform: function() {},
    drawImage: function() {},
    save: function() {},
    restore: function() {},
    beginPath: function() {},
    moveTo: function() {},
    lineTo: function() {},
    closePath: function() {},
    stroke: function() {},
    translate: function() {},
    scale: function() {},
    rotate: function() {},
    arc: function() {},
    fill: function() {},
    measureText: function() {
      return { width: 0 };
    },
    transform: function() {},
    rect: function() {},
    clip: function() {},
  };
};

// Create mock files for CSS/asset imports
jest.mock('./__mocks__/styleMock.js', () => ({}), { virtual: true });
jest.mock('./__mocks__/fileMock.js', () => 'test-file-stub', { virtual: true });
