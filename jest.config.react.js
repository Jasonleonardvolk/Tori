// Jest config for React tests
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/__tests__/react-basic.test.js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '.disabled',
    '/data/USB Drive/',
  ],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  bail: true,
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  haste: {
    enableSymlinks: false,
  },
  modulePathIgnorePatterns: [
    '/data/USB Drive/',
  ],
  collectCoverage: false,
  maxWorkers: 1,
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
};
