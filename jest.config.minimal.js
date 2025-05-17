// Minimal Jest configuration
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/minimal.test.js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '.disabled',
    '/data/USB Drive/', // Ignore the USB drive that has duplicate packages
  ],
  bail: true,
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  // Prevent issues with duplicate package.json files
  haste: {
    enableSymlinks: false,
  },
  modulePathIgnorePatterns: [
    '/data/USB Drive/',
  ],
  collectCoverage: false,
  maxWorkers: 1,
};
