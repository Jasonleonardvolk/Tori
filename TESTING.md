# ALAN IDE Testing Guide

This document provides instructions for running and maintaining the test suite for ALAN IDE.

## Test Environment Setup

Before running tests, ensure the testing environment is properly set up:

```bash
# Install test dependencies
npm run test:setup

# This will install required packages for both root and client tests:
# - @babel/preset-env, @babel/preset-react, @babel/plugin-syntax-jsx
# - babel-jest, jest-environment-jsdom
# - @testing-library/jest-dom, @testing-library/react, @testing-library/user-event
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests (root directory)
npm test

# Run client tests
npm run test:client

# Run both root and client tests
npm run test:all

# Run tests with coverage reports
npm run test:coverage

# Run tests in watch mode (useful during development)
npm run test:watch
```

### Specific Test Suites

```bash
# Run accessibility tests
cd client && npm run test:a11y

# Run performance tests
cd client && npm run test:perf

# Run integration tests
cd client && npm run test:integration

# Run security tests
cd client && npm run test:security

# Run server tests only
npm run test:server
```

### Running Individual Test Files

```bash
# Run a specific test file
npm test -- client/src/__tests__/accessibility/PersonaSelector.accessibility.test.js

# Run tests matching a specific pattern
npm test -- --testPathPattern=accessibility
```

## Test Structure

The test suite follows this structure:

- `__tests__/integration/` - Component interaction tests
  - ExecutionTracer + FieldMeditationMode
  - RefactorService + EditorSyncService
  - MCPClient + DebugAgent
  - Exporter + ConceptGraphService

- `__tests__/accessibility/` - Accessibility compliance tests
  - Tests using axe-core for WCAG 2.1 AA compliance
  - Keyboard navigation and ARIA attribute verification

- `__tests__/performance/` - Performance budget enforcement
  - Bulk import load harness (5k-file test)
  - FPS and SSE latency metrics

- `__tests__/security/` - Secret detection and vault tests
  - Hard-coded key detection
  - Import wizard security flow

- `__tests__/components/` - Individual component tests
  - Unit tests for UI components
  - Feature flag service tests

## Writing New Tests

When writing new tests, follow these guidelines:

1. **Choose the right location**: Place tests in the appropriate category folder
2. **Naming convention**: Use `ComponentName.test.js` or `FeatureName.test.js` 
3. **Use test utilities**: Import helpers from `test-utils.js`
4. **Mock external dependencies**: Use Jest's mocking features for service calls
5. **Accessibility testing**: Include axe-core checks for UI components

Example:

```javascript
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import { checkAccessibility } from '../../accessibility/accessibilityTestUtils';
import MyComponent from '../../../components/MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  test('passes accessibility checks', async () => {
    const { container } = renderWithProviders(<MyComponent />);
    const results = await checkAccessibility(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Test Configuration

The Jest and Babel configurations are set up in:

- Root directory: `.babelrc`, `jest.config.js`, `setupTests.js`
- Client directory: `client/.babelrc`, `client/jest.config.js`, `client/setupTests.js`

If you need to modify the test configuration:

1. Update the appropriate config files
2. Consider the impact on CI/CD pipelines
3. Document any changes in this file

## Troubleshooting

### Common Issues

- **JSX syntax errors**: Ensure `.babelrc` includes `@babel/preset-react`
- **Missing dependencies**: Run `npm run test:setup` to install required packages
- **Import errors**: Check path mappings in the appropriate `jest.config.js`
- **Component rendering issues**: Verify the test environment is set to `jsdom`

### Debugging

```bash
# Run tests with verbose output
npm test -- --verbose

# Debug a specific test
npm test -- --testPathPattern=MyComponent.test.js --debug
