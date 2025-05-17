// Temporary Jest config to avoid infinite loops
module.exports = {
  roots: ['<rootDir>/client'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.temp.js'],
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
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  // Prevent infinite loops
  maxWorkers: 1,
  forceExit: true,
  testTimeout: 5000,
  errorOnDeprecated: false,
  bail: true, // Stop on first error
};
