// intentSpecificationTracker.js
// Service for tracking, storing, and managing intent specifications for AI-driven development

/**
 * Intent Specification Tracker acts as the core system for AI-native version control
 * by tracking developer intents, prompt history, and behavioral specifications.
 * It implements the concept described in "Semantic Commit" where code modifications
 * are paired with the underlying intent rather than just tracking line changes.
 */
class IntentSpecificationTracker {
  constructor() {
    // Store intents as a map of intentId -> intent specification data
    this.intents = new Map();
    
    // Track which code elements are connected to which intents
    this.codeToIntentMap = new Map();
    
    // Track commit history with associated intents
    this.commitHistory = [];
    
    // Track behavioral and voice signals for each intent
    this.intentSignals = new Map(); // intentId -> [signals]
    
    // Persistent store of intent specifications for long-term tracking
    this.intentStore = {
      prompts: new Map(), // Raw prompts that generated code
      behaviors: new Map(), // Expected behaviors for components
      requirements: new Map(), // Functional/non-functional requirements
      tests: new Map(), // Test cases linked to intents
    };
    
    this.initialized = false;
  }
  
  /**
   * Initialize the tracker with existing intents
   * @param {Object} intentSpecifications - Map of existing intent specifications
   * @returns {Promise<boolean>}
   */
  async initialize(intentSpecifications = {}) {
    try {
      // Clear previous state
      this.intents.clear();
      this.codeToIntentMap.clear();
      this.commitHistory = [];
      
      // Load mock data for demo purposes
      this._loadMockData();
      
      this.initialized = true;
      console.log('Intent Specification Tracker initialized with intent count:', this.intents.size);
      
      return true;
    } catch (error) {
      console.error('Error initializing intent specification tracker:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Record a behavioral/voice signal for an intent
   * @param {string} intentId
   * @param {Object} signal
   */
  recordSignal(intentId, signal) {
    if (!this.intentSignals.has(intentId)) {
      this.intentSignals.set(intentId, []);
    }
    this.intentSignals.get(intentId).push(signal);
  }

  /**
   * Get all signals for a given intent
   * @param {string} intentId
   * @returns {Array} signals
   */
  getSignals(intentId) {
    return this.intentSignals.get(intentId) || [];
  }

  /**
   * Get all intents stored in the tracker
   * @returns {Promise<Array>} - List of all intents
   */
  async getAllIntents() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Return all intents as an array
    return Array.from(this.intents.values());
  }
  
  /**
   * Record a new intent specification
   * @param {string} intentId - Unique identifier for the intent
   * @param {Object} specification - The intent specification to store
   * @param {Array<string>} codeElements - Code elements affected by this intent
   * @returns {Promise<Object>} - Result with conflicts and stored intent
   */
  async recordIntent(intentId, specification, codeElements = []) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Store the intent
      const intentData = {
        id: intentId || `intent_${Date.now()}`,
        specification,
        codeElements,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };
      
      this.intents.set(intentData.id, intentData);
      
      // Update code element to intent mapping
      for (const element of codeElements) {
        if (!this.codeToIntentMap.has(element)) {
          this.codeToIntentMap.set(element, new Set());
        }
        this.codeToIntentMap.get(element).add(intentData.id);
      }
      
      // Return the intent
      return {
        stored: true,
        intent: intentData
      };
    } catch (error) {
      console.error('Error recording intent specification:', error);
      return {
        stored: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get detailed intent information including all related data
   * @param {string} intentId - ID of the intent to retrieve
   * @returns {Object} - Complete intent information
   */
  getIntentDetails(intentId) {
    if (!this.initialized) {
      throw new Error('Intent Specification Tracker not initialized');
    }
    
    if (!this.intents.has(intentId)) {
      throw new Error(`Intent with ID ${intentId} not found`);
    }
    
    return this.intents.get(intentId);
  }
  
  /**
   * Load mock data for demo purposes
   * @private
   */
  _loadMockData() {
    const mockIntents = [
      {
        id: 'intent_1',
        specification: 'Implement user authentication flow with email verification',
        codeElements: ['src/auth/AuthProvider.jsx', 'src/auth/useAuth.js', 'src/pages/Login.jsx'],
        createdAt: '2025-05-01T10:15:30Z',
        updatedAt: '2025-05-01T10:15:30Z',
        status: 'active'
      },
      {
        id: 'intent_2',
        specification: 'Add dark mode support with system preference detection',
        codeElements: ['src/theme/ThemeProvider.jsx', 'src/components/Header.jsx'],
        createdAt: '2025-05-02T14:22:45Z',
        updatedAt: '2025-05-02T14:22:45Z',
        status: 'active'
      },
      {
        id: 'intent_3',
        specification: 'Optimize rendering performance of the concept field visualization',
        codeElements: ['src/components/ConceptFieldCanvas.jsx', 'src/hooks/useKappaGeometry.js'],
        createdAt: '2025-05-03T09:05:12Z',
        updatedAt: '2025-05-03T09:05:12Z',
        status: 'active'
      }
    ];
    
    // Add the mock intents to the store
    for (const intent of mockIntents) {
      this.intents.set(intent.id, intent);
      
      // Update code element to intent mapping
      for (const element of intent.codeElements) {
        if (!this.codeToIntentMap.has(element)) {
          this.codeToIntentMap.set(element, new Set());
        }
        this.codeToIntentMap.get(element).add(intent.id);
      }
    }
  }
}

// Create singleton instance
const tracker = new IntentSpecificationTracker();

// Create a more robust version with better error handling
const intentSpecificationTracker = {
  // Forward the initialize method
  initialize: async function() {
    try {
      return await tracker.initialize();
    } catch (error) {
      console.error("Failed to initialize intent tracker:", error);
      return false;
    }
  },
  
  // Forward the getAllIntents method with error handling
  getAllIntents: async function() {
    try {
      return await tracker.getAllIntents();
    } catch (error) {
      console.error("Failed to get all intents:", error);
      return [];
    }
  },
  
  // Forward the recordIntent method
  recordIntent: async function(intentId, specification, codeElements = []) {
    try {
      return await tracker.recordIntent(intentId, specification, codeElements);
    } catch (error) {
      console.error("Failed to record intent:", error);
      return { stored: false, error: error.message };
    }
  },
  
  // Forward the getIntentDetails method
  getIntentDetails: function(intentId) {
    try {
      return tracker.getIntentDetails(intentId);
    } catch (error) {
      console.error("Failed to get intent details:", error);
      return null;
    }
  }
};

export default intentSpecificationTracker;
