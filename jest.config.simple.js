// Simple Jest config for clean test runs
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.test.jsx'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.mock\\.js$',
    '\\.mock\\.jsx$',
    '/data/USB Drive/'
  ],
  setupFilesAfterEnv: [
    '@testing-library/jest-dom'
  ],
  bail: true,
  verbose: true,
  maxWorkers: 1,
  testTimeout: 10000,
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  }
};
