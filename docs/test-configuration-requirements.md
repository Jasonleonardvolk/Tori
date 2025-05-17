# Test Configuration Requirements

During our testing of the ALAN IDE Phase 3 implementation, we encountered several configuration issues that need to be addressed before the tests can run successfully. This document outlines the required configuration changes.

## Issues Identified

When running the test suite, we encountered the following issues:

1. **JSX Syntax Support**: Jest could not parse JSX syntax in our test files
   ```
   Support for the experimental syntax 'jsx' isn't currently enabled
   ```

2. **ES Modules Support**: Jest could not handle ES Module import statements
   ```
   Cannot use import statement outside a module
   ```

3. **Module Resolution Issues**: Some test imports couldn't be resolved
   ```
   Cannot find module '../src/app' from 'data/USB Drive/...'
   ```

4. **Test Environment Configuration**: Missing appropriate setup for React Testing Library

## Required Configuration

To fix these issues, the following configurations need to be added:

### 1. Babel Configuration

Create or update `.babelrc` to include React support:

```json
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react"
  ],
  "plugins": [
    "@babel/plugin-syntax-jsx"
  ]
}
```

### 2. Jest Configuration

Update `jest.config.js` to support ES Modules:

```js
module.exports = {
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  transformIgnorePatterns: [
    "/node_modules/(?![@some-package-that-needs-transforming]/)"
  ],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
    "\\.(gif|ttf|eot|svg)$": "<rootDir>/__mocks__/fileMock.js"
  },
  setupFilesAfterEnv: [
    "<rootDir>/setupTests.js"
  ],
  testEnvironment: "jsdom"
}
```

### 3. Setup Tests File

Create a `setupTests.js` file:

```js
// setupTests.js
import '@testing-library/jest-dom';
```

### 4. Package Dependencies

Ensure the following packages are installed:

```bash
npm install --save-dev @babel/preset-env @babel/preset-react @babel/plugin-syntax-jsx
npm install --save-dev babel-jest jest-environment-jsdom @testing-library/jest-dom
```

## Implementation Progress

Currently, we have:

1. ✅ Created all test files according to the Phase 3 implementation plan
2. ✅ Fixed ESLint errors in test files
3. ✅ Implemented mock objects and test fixtures
4. ✅ Created test utility functions

To complete the testing implementation:

1. ⬜ Configure Jest with the settings above
2. ⬜ Create or update Babel configuration
3. ⬜ Fix any remaining test-specific issues
4. ⬜ Run and verify all tests
5. ⬜ Update documentation with test results

## Test Structure

The test suite follows this structure:

- `__tests__/integration/` - Component interaction tests
- `__tests__/accessibility/` - Accessibility compliance tests
- `__tests__/performance/` - Performance budget enforcement
- `__tests__/security/` - Secret detection and vault tests
- `__tests__/components/` - Individual component tests

## Next Steps

1. Implement the Jest and Babel configuration changes outlined above
2. Run the tests with `npm test` and debug any remaining issues
3. Update the Phase 3 implementation progress document with test results
