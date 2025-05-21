/**
 * Feature Flags Service
 * 
 * Manages feature flags for the ALAN IDE Phase 3 implementation.
 * Loads flags from phase3_flags.yaml and provides methods to check if features are enabled.
 */

import yaml from 'js-yaml';

class FeatureFlagsService {
  constructor() {
    this.flags = {};
    this.isInitialized = false;
    this.listeners = new Set();
  }
  
  /**
   * Initialize the feature flags service by loading flags from the YAML file
   * @returns {Promise<void>} A promise that resolves when the flags are loaded
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }
    
    try {
      const response = await fetch('/config/phase3_flags.yaml');
      
      if (!response.ok) {
        console.error('Failed to load feature flags:', response.statusText);
        // Load default flags
        this.setDefaultFlags();
        return;
      }
      
      const yamlText = await response.text();
      this.flags = yaml.load(yamlText) || {};
      
      console.log('Feature flags loaded successfully');
      this.isInitialized = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Error loading feature flags:', error);
      // Load default flags on error
      this.setDefaultFlags();
    }
  }
  
  /**
   * Set default flags in case the YAML file cannot be loaded
   */
  setDefaultFlags() {
    this.flags = {
      telemetryOptIn: false,
      secretDetection: true,
      vaultFileBackup: true,
      newAgentPanels: true,
      newGraphVirtualization: true,
      offlineDemoMode: false,
      multiAgentParallel: false,
      autoWriteFile: false,
      accessibilityGuidance: true,
      highContrastSupport: true,
      aggressiveCaching: true,
      memoryBudgetEnforcement: true,
      i18nEnabled: false,
      experimentalKoopmanView: false,
      experimentalAgentCollaboration: false
    };
    
    this.isInitialized = true;
    this.notifyListeners();
  }
  
  /**
   * Check if a feature is enabled
   * @param {string} flagName - The name of the feature flag to check
   * @param {boolean} defaultValue - The default value to return if the flag is not found
   * @returns {boolean} True if the feature is enabled, false otherwise
   */
  isEnabled(flagName, defaultValue = false) {
    if (!this.isInitialized) {
      console.warn('Feature flags service not initialized. Using default value for', flagName);
      return defaultValue;
    }
    
    return this.flags[flagName] ?? defaultValue;
  }
  
  /**
   * Set a feature flag value at runtime
   * @param {string} flagName - The name of the feature flag to set
   * @param {boolean} value - The value to set the flag to
   */
  setFlag(flagName, value) {
    if (typeof value !== 'boolean') {
      console.warn(`Feature flag value for ${flagName} must be a boolean. Got ${typeof value}.`);
      return;
    }
    
    this.flags[flagName] = value;
    this.notifyListeners();
    
    // Attempt to persist changes to server
    this.persistChanges();
  }
  
  /**
   * Persist flag changes to the server
   * @private
   */
  async persistChanges() {
    try {
      const response = await fetch('/api/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.flags)
      });
      
      if (!response.ok) {
        console.warn('Failed to persist feature flags:', response.statusText);
      }
    } catch (error) {
      console.error('Error persisting feature flags:', error);
    }
  }
  
  /**
   * Subscribe to changes in feature flags
   * @param {Function} listener - A function to call when flags change
   * @returns {Function} A function to unsubscribe the listener
   */
  subscribe(listener) {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Notify all listeners of changes to feature flags
   * @private
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.flags);
      } catch (error) {
        console.error('Error in feature flags listener:', error);
      }
    });
  }
  
  /**
   * Reset all flags to their default values
   */
  resetToDefaults() {
    this.setDefaultFlags();
    this.persistChanges();
  }
}

// Create a singleton instance
const featureFlagsService = new FeatureFlagsService();

export default featureFlagsService;
