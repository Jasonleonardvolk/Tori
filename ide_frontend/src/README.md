# ALAN IDE Client

## Testing Information

### Mock vs Real Services

The tests are currently configured to use mock services instead of real services to isolate components during testing. 

When you want to run the actual application (vs tests):

1. The application automatically uses real services in development/production mode
2. The mocked services are only used during test execution

### Running the Application

To run the actual application:

```bash
# In the client directory
npm start
```

This will start the development server and run the application with the real services instead of the mock ones.

### Testing Configuration

Tests are run using one of these configurations:

- `jest.config.js` - Standard configuration
- `jest.config.complete.js` - Complete configuration with mocks
- `jest.config.minimal.js` - Minimal configuration for quick tests

Use the various test runner scripts (e.g., `run-tests-with-mocks.js`) to run tests with specific configurations.
