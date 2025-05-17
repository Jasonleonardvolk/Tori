/**
 * Tests for FeatureFlagsService
 * 
 * Tests the functionality of the FeatureFlagsService.
 */

import featureFlagsService from '../../services/featureFlagsService';

// Mock js-yaml
jest.mock('js-yaml', () => ({
  load: jest.fn(text => {
    // Simple YAML parser for testing
    const lines = text.split('\n');
    const result = {};
    
    lines.forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) {
        return;
      }
      
      const [key, value] = line.split(':').map(str => str.trim());
      
      if (value === 'true') {
        result[key] = true;
      } else if (value === 'false') {
        result[key] = false;
      }
    });
    
    return result;
  })
}));

describe('FeatureFlagsService', () => {
  let originalFetch;
  
  beforeEach(() => {
    // Reset the service state
    featureFlagsService.flags = {};
    featureFlagsService.isInitialized = false;
    featureFlagsService.listeners = new Set();
    
    // Mock fetch
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
  });
  
  test('initializes with flags from YAML file', async () => {
    // Mock successful fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'telemetryOptIn: false\nsecretDetection: true'
    });
    
    await featureFlagsService.initialize();
    
    expect(global.fetch).toHaveBeenCalledWith('/config/phase3_flags.yaml');
    expect(featureFlagsService.isInitialized).toBe(true);
    expect(featureFlagsService.flags).toEqual({
      telemetryOptIn: false,
      secretDetection: true
    });
  });
  
  test('uses default flags when fetch fails', async () => {
    // Mock failed fetch
    global.fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found'
    });
    
    await featureFlagsService.initialize();
    
    expect(featureFlagsService.isInitialized).toBe(true);
    expect(featureFlagsService.flags).toEqual(expect.objectContaining({
      telemetryOptIn: false,
      secretDetection: true,
      // ...and other default flags
    }));
  });
  
  test('uses default flags when an error occurs', async () => {
    // Mock fetch that throws an error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    await featureFlagsService.initialize();
    
    expect(featureFlagsService.isInitialized).toBe(true);
    expect(featureFlagsService.flags).toEqual(expect.objectContaining({
      telemetryOptIn: false,
      secretDetection: true,
      // ...and other default flags
    }));
  });
  
  test('isEnabled returns correct flag value', async () => {
    // Mock successful fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'telemetryOptIn: false\nsecretDetection: true'
    });
    
    await featureFlagsService.initialize();
    
    expect(featureFlagsService.isEnabled('telemetryOptIn')).toBe(false);
    expect(featureFlagsService.isEnabled('secretDetection')).toBe(true);
    expect(featureFlagsService.isEnabled('nonExistentFlag')).toBe(false);
    expect(featureFlagsService.isEnabled('nonExistentFlag', true)).toBe(true);
  });
  
  test('setFlag updates flag value and notifies listeners', async () => {
    // Set up an initialized service
    featureFlagsService.flags = { telemetryOptIn: false };
    featureFlagsService.isInitialized = true;
    
    // Mock fetch for persistChanges
    global.fetch.mockResolvedValueOnce({
      ok: true
    });
    
    // Set up a listener
    const listener = jest.fn();
    featureFlagsService.subscribe(listener);
    
    // Set a flag
    featureFlagsService.setFlag('telemetryOptIn', true);
    
    expect(featureFlagsService.flags.telemetryOptIn).toBe(true);
    expect(listener).toHaveBeenCalledWith(featureFlagsService.flags);
    expect(global.fetch).toHaveBeenCalledWith('/api/feature-flags', expect.any(Object));
  });
  
  test('subscribe and unsubscribe work correctly', async () => {
    // Set up a listener
    const listener = jest.fn();
    const unsubscribe = featureFlagsService.subscribe(listener);
    
    // Trigger notification
    featureFlagsService.notifyListeners();
    
    expect(listener).toHaveBeenCalledTimes(1);
    
    // Unsubscribe
    unsubscribe();
    
    // Trigger notification again
    featureFlagsService.notifyListeners();
    
    // Still called only once
    expect(listener).toHaveBeenCalledTimes(1);
  });
  
  test('resetToDefaults resets flags and persists changes', async () => {
    // Set up an initialized service with custom flags
    featureFlagsService.flags = {
      telemetryOptIn: true,
      secretDetection: false
    };
    featureFlagsService.isInitialized = true;
    
    // Mock fetch for persistChanges
    global.fetch.mockResolvedValueOnce({
      ok: true
    });
    
    // Set up a listener
    const listener = jest.fn();
    featureFlagsService.subscribe(listener);
    
    // Reset to defaults
    featureFlagsService.resetToDefaults();
    
    // Should have reset to default values
    expect(featureFlagsService.flags.telemetryOptIn).toBe(false);
    expect(featureFlagsService.flags.secretDetection).toBe(true);
    
    // Listener should have been called
    expect(listener).toHaveBeenCalledWith(featureFlagsService.flags);
    
    // Should have attempted to persist changes
    expect(global.fetch).toHaveBeenCalledWith('/api/feature-flags', expect.any(Object));
  });
});
