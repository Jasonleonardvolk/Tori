// Jest configuration
module.exports = {
  roots: ['<rootDir>/client'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/client/src/test-utils-complete.js'],
  moduleDirectories: ['node_modules', '<rootDir>/client/src'],
  moduleNameMapper: {
    '\\.(css|scss|svg|png)$': 'identity-obj-proxy',
    '^components/(.*)$': '<rootDir>/client/src/components/$1',
    '^services/(.*)$': '<rootDir>/client/src/services/$1',
    '^utils/(.*)$': '<rootDir>/client/src/utils/$1',
    '^hooks/(.*)$': '<rootDir>/client/src/hooks/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/client/node_modules/',
    '/__mocks__/',
    '\\.mock\\.js$', // Ignore files with .mock.js extension
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  // Better handling for tests
  maxWorkers: 1,
  forceExit: true,
  testTimeout: 30000,
  bail: false, // Continue running tests even if one fails
  verbose: true,
};