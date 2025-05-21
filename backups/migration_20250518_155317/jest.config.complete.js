// Complete Jest configuration with all mocks
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/client/src/__tests__/test-utils-complete.js'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.test.jsx'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.mock\\.js$',
    '\\.mock\\.jsx$',
    '/data/USB Drive/',
    '__mocks__/',
  ],
  bail: true,
  verbose: true,
  maxWorkers: 1,
  testTimeout: 10000,
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '^services/(.*)$': '<rootDir>/client/src/services/$1',
  },
  roots: ['<rootDir>/client/src'],
  moduleDirectories: ['node_modules', '<rootDir>/client/src'],
  resetMocks: false, // Keep our mocks between tests
  clearMocks: true, // Clear mock calls between tests
};
