/**
 * Contextual Understanding Module
 * 
 * Implements advanced contextual understanding and adaptive response generation
 * based on the following research papers:
 * - 2501.01705v2 - Multi-dimensional Context Modeling
 * - 2502.18889v2 - Mental State Tracking and Cognitive Load Estimation
 * - 2504.19734v1 - Hierarchical Memory Mechanisms
 * - 1239615 - Situation-Aware Response Generation
 * - applsci-14-03941 - Adaptive Response Timing
 * - blockchain5 - Secure Context Sharing Mechanisms
 */

/**
 * ContextualUnderstandingEngine
 * 
 * Core engine that processes and maintains multi-dimensional context models
 * for adaptive suggestion generation.
 */
class ContextualUnderstandingEngine {
  constructor() {
    // Initialize multi-dimensional context model
    this.contextModel = {
      // Code context: syntax tree, function relationships, etc.
      codeContext: {
        currentFile: null,
        syntaxTree: null,
        currentScope: null,
        dependencies: [],
        recentlyModifiedAreas: []
      },
      
      // Developer behavior context: interaction patterns
      developerContext: {
        interactionPatterns: [],
        expertiseLevel: 0.5, // 0 = novice, 1 = expert
        preferredPatterns: [], // Coding patterns the developer tends to use
        avoidedPatterns: [], // Patterns the developer tends to avoid
        learningRate: 0.5 // How quickly developer adapts to new patterns
      },
      
      // Project context: repository structure, history
      projectContext: {
        structure: {},
        recentCommits: [],
        collaborators: [],
        projectPhase: 'development' // e.g., planning, development, refactoring, testing
      },
      
      // Task context: current development goals
      taskContext: {
        currentGoal: null,
        constraints: [],
        deadline: null,
        priority: 'normal' // low, normal, high, critical
      }
    };
    
    // Hierarchical memory system (based on 2504.19734v1)
    this.memory = {
      shortTerm: {
        interactionEvents: [], // Recent editor interactions (few minutes)
        maxSize: 100,
        decayRate: 0.95 // How quickly short-term memory decays
      },
      
      mediumTerm: {
        patterns: {}, // Recognized patterns from current session
        sessionGoals: [], // Inferred goals for current session
        cognitiveStateHistory: [] // Tracked cognitive states
      },
      
      longTerm: {
        developerPreferences: {}, // Long-term developer preferences
        expertiseAreas: {}, // Areas of code where developer shows expertise
        weaknessAreas: {}, // Areas where developer struggles
        suggestionResponseHistory: [] // How developer responded to suggestions
      }
    };
    
    // Mental state tracking (based on 2502.18889v2)
    this.mentalState = {
      cognitiveLoad: 0.5, // 0 = low load, 1 = high load
      attentionFocus: null, // What the developer is focusing on
      attentionSwitches: 0, // How often attention switches
      frustrationLevel: 0.0, // 0 = not frustrated, 1 = very frustrated
      velocityState: 'steady', // struggling, steady, or flow
      interruptibility: 0.5 // 0 = do not interrupt, 1 = open to interruption
    };
  }
  
  /**
   * Updates the code context based on editor state
   * @param {Object} editorState Current editor state
   */
  updateCodeContext(editorState) {
    const { content, cursorPosition, selections, syntaxTree } = editorState;
    
    // Update code context
    this.contextModel.codeContext.currentFile = editorState.filePath;
    this.contextModel.codeContext.syntaxTree = syntaxTree;
    
    // Identify current scope based on cursor position
    this.contextModel.codeContext.currentScope = this._determineScope(syntaxTree, cursorPosition);
    
    // Track recently modified areas
    if (editorState.changes && editorState.changes.length > 0) {
      this.contextModel.codeContext.recentlyModifiedAreas = 
        [...this.contextModel.codeContext.recentlyModifiedAreas, ...editorState.changes]
          .slice(-20); // Keep only the 20 most recent changes
    }
    
    return this;
  }
  
  /**
   * Updates the developer context based on interaction data
   * @param {Object} interactionData Recent interaction metrics
   */
  updateDeveloperContext(interactionData) {
    const { typingSpeed, deletionRate, pauseDetected, 
            scrollingPattern, selectionPattern } = interactionData;
    
    // Add to short-term memory
    this._addToShortTermMemory({
      type: 'interaction',
      timestamp: Date.now(),
      data: interactionData
    });
    
    // Update interaction patterns
    this.contextModel.developerContext.interactionPatterns.push({
      timestamp: Date.now(),
      typingSpeed,
      deletionRate,
      pauseDetected
    });
    
    // Keep only recent patterns
    if (this.contextModel.developerContext.interactionPatterns.length > 50) {
      this.contextModel.developerContext.interactionPatterns.shift();
    }
    
    // Estimate expertise level based on interaction patterns
    this._updateExpertiseEstimation();
    
    return this;
  }
  
  /**
   * Updates the project context
   * @param {Object} projectData Project-related data
   */
  updateProjectContext(projectData) {
    if (projectData.structure) {
      this.contextModel.projectContext.structure = projectData.structure;
    }
    
    if (projectData.commits) {
      this.contextModel.projectContext.recentCommits = 
        [...projectData.commits, ...this.contextModel.projectContext.recentCommits]
          .slice(0, 50); // Keep only the 50 most recent commits
    }
    
    if (projectData.collaborators) {
      this.contextModel.projectContext.collaborators = projectData.collaborators;
    }
    
    if (projectData.phase) {
      this.contextModel.projectContext.projectPhase = projectData.phase;
    }
    
    return this;
  }
  
  /**
   * Updates the task context based on inferred or explicit goals
   * @param {Object} taskData Task-related data
   */
  updateTaskContext(taskData) {
    if (taskData.goal) {
      this.contextModel.taskContext.currentGoal = taskData.goal;
    }
    
    if (taskData.constraints) {
      this.contextModel.taskContext.constraints = taskData.constraints;
    }
    
    if (taskData.deadline) {
      this.contextModel.taskContext.deadline = taskData.deadline;
    }
    
    if (taskData.priority) {
      this.contextModel.taskContext.priority = taskData.priority;
    }
    
    return this;
  }
  
  /**
   * Updates the mental state based on recent interactions
   * This implementation follows the mental state modeling from 2502.18889v2
   */
  updateMentalState() {
    const recentInteractions = this.memory.shortTerm.interactionEvents
      .filter(event => event.type === 'interaction')
      .map(event => event.data);
    
    if (recentInteractions.length === 0) return this;
    
    // Calculate cognitive load based on:
    // 1. Typing speed variability
    // 2. Deletion rate
    // 3. Pause frequency
    // 4. Attention switches
    const typingSpeeds = recentInteractions.map(i => i.typingSpeed || 0);
    const deletionRates = recentInteractions.map(i => i.deletionRate || 0);
    const pauses = recentInteractions.filter(i => i.pauseDetected).length;
    
    // Calculate typing speed variability (higher variability suggests higher cognitive load)
    const typingVariability = this._calculateVariability(typingSpeeds);
    
    // Calculate average deletion rate (higher deletion suggests mistakes/uncertainty)
    const avgDeletionRate = deletionRates.reduce((sum, rate) => sum + rate, 0) / deletionRates.length;
    
    // Pause ratio (more pauses suggest thinking/uncertainty)
    const pauseRatio = pauses / recentInteractions.length;
    
    // Combine factors to estimate cognitive load
    // This is a simplified model that could be replaced with a more sophisticated ML model
    const cognitiveLoadEstimate = (
      typingVariability * 0.3 + 
      avgDeletionRate * 0.3 + 
      pauseRatio * 0.4
    );
    
    // Update mental state with some smoothing to avoid rapid fluctuations
    this.mentalState.cognitiveLoad = 
      this.mentalState.cognitiveLoad * 0.7 + cognitiveLoadEstimate * 0.3;
    
    // Estimate frustration based on deletion patterns and pauses
    // High deletion rate + pauses often indicate frustration
    const frustrationEstimate = 
      Math.min(1, (avgDeletionRate * 1.5 + pauseRatio * 0.5));
    
    this.mentalState.frustrationLevel = 
      this.mentalState.frustrationLevel * 0.8 + frustrationEstimate * 0.2;
    
    // Determine velocity state
    if (this.mentalState.frustrationLevel > 0.7) {
      this.mentalState.velocityState = 'struggling';
    } else if (typingVariability < 0.2 && avgDeletionRate < 0.2 && pauseRatio < 0.1) {
      this.mentalState.velocityState = 'flow';
    } else {
      this.mentalState.velocityState = 'steady';
    }
    
    // Determine interruptibility
    // Low interruptibility: When in flow or highly focused
    // High interruptibility: During pauses or after completing a unit of work
    const recentPauses = recentInteractions.slice(-5).filter(i => i.pauseDetected).length;
    const recentPauseRatio = recentPauses / Math.min(5, recentInteractions.length);
    
    // If in flow, lower interruptibility
    if (this.mentalState.velocityState === 'flow') {
      this.mentalState.interruptibility = Math.max(0.1, this.mentalState.interruptibility * 0.8);
    } 
    // If struggling, may need help, so increase interruptibility
    else if (this.mentalState.velocityState === 'struggling') {
      this.mentalState.interruptibility = Math.min(0.9, this.mentalState.interruptibility * 1.2);
    }
    // Otherwise, base interruptibility on pause patterns
    else {
      this.mentalState.interruptibility = 
        this.mentalState.interruptibility * 0.7 + recentPauseRatio * 0.3;
    }
    
    // Track mental state history in medium-term memory
    this.memory.mediumTerm.cognitiveStateHistory.push({
      timestamp: Date.now(),
      cognitiveLoad: this.mentalState.cognitiveLoad,
      frustrationLevel: this.mentalState.frustrationLevel,
      velocityState: this.mentalState.velocityState,
      interruptibility: this.mentalState.interruptibility
    });
    
    // Trim history to avoid memory bloat
    if (this.memory.mediumTerm.cognitiveStateHistory.length > 100) {
      this.memory.mediumTerm.cognitiveStateHistory.shift();
    }
    
    return this;
  }
  
  /**
   * Apply contextual understanding to filter and prioritize suggestions
   * @param {Array} suggestions Raw suggestions to be filtered
   * @returns {Array} Filtered and prioritized suggestions
   */
  adaptSuggestions(suggestions) {
    if (!suggestions || !Array.isArray(suggestions)) return [];
    
    // Step 1: Filter suggestions based on current mental state
    let adaptedSuggestions = [...suggestions];
    
    // If cognitive load is high, filter out complex suggestions
    if (this.mentalState.cognitiveLoad > 0.7) {
      adaptedSuggestions = adaptedSuggestions.filter(suggestion => {
        // Keep only critical or simple suggestions during high cognitive load
        return suggestion.priority === 'critical' || 
               (suggestion.complexity !== undefined && suggestion.complexity < 0.4);
      });
    }
    
    // If interruptibility is low, keep only high priority suggestions
    if (this.mentalState.interruptibility < 0.3) {
      adaptedSuggestions = adaptedSuggestions.filter(suggestion => {
        return suggestion.priority === 'critical' || suggestion.priority === 'high';
      });
    }
    
    // If in a flow state, severely limit suggestions
    if (this.mentalState.velocityState === 'flow') {
      adaptedSuggestions = adaptedSuggestions.filter(suggestion => {
        return suggestion.priority === 'critical';
      });
    }
    
    // If struggling, prioritize helpful suggestions
    if (this.mentalState.velocityState === 'struggling') {
      // Boost suggestions that could help with current issues
      adaptedSuggestions = adaptedSuggestions.map(suggestion => ({
        ...suggestion,
        priority: suggestion.type === 'error-fix' || suggestion.type === 'simplification' 
          ? 'high' : suggestion.priority
      }));
    }
    
    // Step 2: Adapt explanations based on expertise level
    adaptedSuggestions = adaptedSuggestions.map(suggestion => {
      const expertiseLevel = this.contextModel.developerContext.expertiseLevel;
      
      // Adapt explanation detail based on expertise
      let adaptedExplanation = suggestion.explanation;
      
      if (expertiseLevel < 0.3 && suggestion.detailedExplanation) {
        // For novices, provide more detailed explanations
        adaptedExplanation = suggestion.detailedExplanation;
      } else if (expertiseLevel > 0.7 && suggestion.conciseExplanation) {
        // For experts, provide more concise explanations
        adaptedExplanation = suggestion.conciseExplanation;
      }
      
      return {
        ...suggestion,
        explanation: adaptedExplanation,
        // Add contextual relevance score
        contextualRelevance: this._calculateContextualRelevance(suggestion)
      };
    });
    
    // Step 3: Sort suggestions by contextual relevance
    adaptedSuggestions.sort((a, b) => {
      // First by priority
      const priorityOrder = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by contextual relevance
      return (b.contextualRelevance || 0) - (a.contextualRelevance || 0);
    });
    
    return adaptedSuggestions;
  }
  
  /**
   * Determines if it's appropriate to interrupt the developer now
   * @returns {Boolean} True if it's a good time to interrupt
   */
  shouldInterruptNow() {
    // Basic interrupt criteria based on interruptibility score and state
    if (this.mentalState.interruptibility > 0.7) {
      return true; // High interruptibility means it's generally okay to interrupt
    }
    
    if (this.mentalState.velocityState === 'flow' && this.mentalState.interruptibility < 0.3) {
      return false; // Don't interrupt flow states unless absolutely necessary
    }
    
    // Check if there was a recent pause (good time to interrupt)
    const recentEvents = this.memory.shortTerm.interactionEvents.slice(-5);
    const recentPause = recentEvents.some(event => 
      event.type === 'interaction' && event.data.pauseDetected);
    
    if (recentPause) {
      return true; // Pauses are good interruption points
    }
    
    // If in 'struggling' state, interruptions with helpful suggestions may be welcome
    if (this.mentalState.velocityState === 'struggling' && this.mentalState.frustrationLevel > 0.6) {
      return true;
    }
    
    // Default to not interrupting if unsure
    return false;
  }
  
  /**
   * Records how the developer responded to a suggestion
   * @param {Object} suggestion The suggestion that was acted upon
   * @param {String} response How the developer responded (applied, dismissed, ignored)
   */
  recordSuggestionResponse(suggestion, response) {
    // Add to long-term memory
    this.memory.longTerm.suggestionResponseHistory.push({
      timestamp: Date.now(),
      suggestionType: suggestion.type,
      suggestionPriority: suggestion.priority,
      contextualRelevance: suggestion.contextualRelevance,
      mentalState: { ...this.mentalState },
      response
    });
    
    // Update expertise areas if suggestion was applied
    if (response === 'applied') {
      // If developer applied a suggestion, it may indicate a knowledge gap
      // in that area, so we slightly decrease expertise for that topic
      if (suggestion.topic) {
        const currentExpertise = this.memory.longTerm.expertiseAreas[suggestion.topic] || 0.5;
        this.memory.longTerm.expertiseAreas[suggestion.topic] = 
          Math.max(0.1, currentExpertise - 0.05);
      }
    }
    
    // Update preference patterns
    if (response === 'applied' || response === 'dismissed') {
      // Track which suggestion types the developer tends to accept or reject
      const patternKey = `${suggestion.type}-${suggestion.category || 'general'}`;
      
      if (!this.contextModel.developerContext.preferredPatterns.includes(patternKey) &&
          !this.contextModel.developerContext.avoidedPatterns.includes(patternKey)) {
        
        if (response === 'applied') {
          this.contextModel.developerContext.preferredPatterns.push(patternKey);
        } else {
          this.contextModel.developerContext.avoidedPatterns.push(patternKey);
        }
      }
    }
    
    return this;
  }
  
  /**
   * Exports the current context state for secure sharing
   * Based on blockchain5.pdf for secure context transfer
   * @returns {Object} Serialized context state with privacy controls
   */
  exportSecureContext() {
    // Create a privacy-filtered version of the context
    const exportableContext = {
      developerState: {
        // Only include non-sensitive developer state info
        expertiseLevel: this.contextModel.developerContext.expertiseLevel,
        velocityState: this.mentalState.velocityState,
        // Do not include raw interaction data or frustration levels
      },
      projectContext: {
        // Include project-level context that's safe to share
        projectPhase: this.contextModel.projectContext.projectPhase,
        // Structure can be included but without personal data
        structureFingerprint: this._createStructureFingerprint()
      },
      // Add a cryptographic signature to verify authenticity
      signature: this._generateContextSignature(),
      timestamp: Date.now()
    };
    
    return exportableContext;
  }
  
  /**
   * Imports a secure context from another developer/system
   * @param {Object} secureContext Encrypted context from another source
   * @returns {Boolean} Success status of the import
   */
  importSecureContext(secureContext) {
    // Verify signature
    if (!this._verifyContextSignature(secureContext)) {
      console.error('Context signature verification failed');
      return false;
    }
    
    // Check if context is recent enough (within 24 hours)
    const contextAge = Date.now() - secureContext.timestamp;
    if (contextAge > 24 * 60 * 60 * 1000) {
      console.error('Context is too old to import');
      return false;
    }
    
    // Merge the imported context into current context
    if (secureContext.developerState) {
      // Incorporate external expertise data as an influence, not a replacement
      if (secureContext.developerState.expertiseLevel !== undefined) {
        // Use external expertise as a weak signal to adjust our model
        const currentExpertise = this.contextModel.developerContext.expertiseLevel;
        this.contextModel.developerContext.expertiseLevel = 
          currentExpertise * 0.8 + secureContext.developerState.expertiseLevel * 0.2;
      }
    }
    
    // Import project context data
    if (secureContext.projectContext) {
      if (secureContext.projectContext.projectPhase) {
        this.contextModel.projectContext.projectPhase = secureContext.projectContext.projectPhase;
      }
    }
    
    return true;
  }
  
  // ----------- Private methods -----------
  
  /**
   * Adds an event to short-term memory with decay
   * @param {Object} event The event to add to memory
   * @private
   */
  _addToShortTermMemory(event) {
    // Add event to short-term memory
    this.memory.shortTerm.interactionEvents.push(event);
    
    // Apply decay to keep memory size manageable
    if (this.memory.shortTerm.interactionEvents.length > this.memory.shortTerm.maxSize) {
      this.memory.shortTerm.interactionEvents.shift();
    }
    
    // Apply recency weighting (more recent events have more influence)
    this.memory.shortTerm.interactionEvents = 
      this.memory.shortTerm.interactionEvents.map((storedEvent, index, array) => {
        // Calculate recency weight (more recent = higher weight)
        const recencyPosition = index / array.length;
        const recencyWeight = Math.pow(recencyPosition, 2) + 0.1; // Quadratic weighting
        
        return {
          ...storedEvent,
          weight: storedEvent.weight 
            ? storedEvent.weight * this.memory.shortTerm.decayRate 
            : recencyWeight
        };
      });
  }
  
  /**
   * Determines the current code scope based on cursor position
   * @param {Object} syntaxTree Abstract syntax tree of the code
   * @param {Object} cursorPosition Current cursor position
   * @returns {Object} Information about the current scope
   * @private
   */
  _determineScope(syntaxTree, cursorPosition) {
    // This is a simplified implementation
    // In a real system, this would involve AST analysis
    if (!syntaxTree || !cursorPosition) return null;
    
    // Find the node at the cursor position
    // This is a placeholder for actual AST traversal
    return {
      type: 'function', // function, class, block, etc.
      name: 'someFunction',
      startLine: cursorPosition.line - 10,
      endLine: cursorPosition.line + 10,
      parameters: [],
      variables: []
    };
  }
  
  /**
   * Updates the expertise estimation based on interaction patterns
   * @private
   */
  _updateExpertiseEstimation() {
    const patterns = this.contextModel.developerContext.interactionPatterns;
    if (patterns.length < 10) return; // Need sufficient data
    
    // Get recent patterns
    const recentPatterns = patterns.slice(-20);
    
    // Calculate metrics that correlate with expertise:
    // 1. Typing speed consistency (experts have more consistent typing)
    const typingSpeeds = recentPatterns.map(p => p.typingSpeed);
    const typingConsistency = 1 - this._calculateVariability(typingSpeeds);
    
    // 2. Low deletion rate (experts make fewer mistakes)
    const deletionRates = recentPatterns.map(p => p.deletionRate);
    const avgDeletionRate = deletionRates.reduce((sum, rate) => sum + rate, 0) / deletionRates.length;
    const lowErrorRate = 1 - Math.min(1, avgDeletionRate * 2); // Convert to 0-1 scale
    
    // 3. Fewer long pauses (experts know what to do next)
    const pauseCount = recentPatterns.filter(p => p.pauseDetected).length;
    const lowPauseRate = 1 - (pauseCount / recentPatterns.length);
    
    // Combine factors, with more weight on consistency and error rate
    const expertiseEstimate = 
      typingConsistency * 0.4 + 
      lowErrorRate * 0.4 + 
      lowPauseRate * 0.2;
    
    // Update expertise with smoothing to prevent rapid fluctuations
    this.contextModel.developerContext.expertiseLevel = 
      this.contextModel.developerContext.expertiseLevel * 0.9 + expertiseEstimate * 0.1;
  }
  
  /**
   * Calculates the variability of an array of values
   * @param {Array} values The values to analyze
   * @returns {Number} Coefficient of variation (higher = more variable)
   * @private
   */
  _calculateVariability(values) {
    if (!values || values.length < 2) return 0;
    
    // Calculate mean
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    if (mean === 0) return 0;
    
    // Calculate standard deviation
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Return coefficient of variation (stdDev / mean)
    return stdDev / mean;
  }
  
  /**
   * Calculates contextual relevance of a suggestion
   * @param {Object} suggestion The suggestion to evaluate
   * @returns {Number} Relevance score between 0 and 1
   * @private
   */
  _calculateContextualRelevance(suggestion) {
    // Start with base relevance
    let relevance = 0.5;
    
    // Factor 1: Code context relevance
    if (suggestion.codeArea && this.contextModel.codeContext.currentScope) {
      // If suggestion is related to current scope, increase relevance
      if (suggestion.codeArea.type === this.contextModel.codeContext.currentScope.type ||
          suggestion.codeArea.name === this.contextModel.codeContext.currentScope.name) {
        relevance += 0.2;
      }
    }
    
    // Factor 2: Developer preference alignment
    const suggestionPattern = `${suggestion.type}-${suggestion.category || 'general'}`;
    
    if (this.contextModel.developerContext.preferredPatterns.includes(suggestionPattern)) {
      relevance += 0.15; // Developer usually likes these suggestions
    }
    
    if (this.contextModel.developerContext.avoidedPatterns.includes(suggestionPattern)) {
      relevance -= 0.15; // Developer usually dismisses these
    }
    
    // Factor 3: Task alignment
    if (suggestion.purpose && 
        this.contextModel.taskContext.currentGoal &&
        suggestion.purpose === this.contextModel.taskContext.currentGoal) {
      relevance += 0.15; // Suggestion directly supports current goal
    }
    
    // Factor 4: Mental state appropriateness
    if (this.mentalState.cognitiveLoad > 0.7 && suggestion.complexity > 0.7) {
      relevance -= 0.1; // Complex suggestions less relevant during high cognitive load
    }
    
    if (this.mentalState.velocityState === 'struggling' && 
        suggestion.type === 'error-fix') {
      relevance += 0.2; // Error fixes highly relevant when struggling
    }
    
    // Ensure relevance is between 0 and 1
    return Math.max(0, Math.min(1, relevance));
  }
  
  /**
   * Creates a privacy-preserving fingerprint of project structure
   * @returns {String} Fingerprint representing project structure
   * @private
   */
  _createStructureFingerprint() {
    // This would implement a real fingerprinting algorithm
    // For now, return a placeholder
    return 'structure-fingerprint-' + Date.now();
  }
  
  /**
   * Generates a cryptographic signature for the context
   * @returns {String} Signature for verification
   * @private
   */
  _generateContextSignature() {
    // This would implement actual cryptographic signing
    // For now, return a placeholder
    return 'context-signature-' + Date.now();
  }
  
  /**
   * Verifies the signature of an imported context
   * @param {Object} secureContext The context to verify
   * @returns {Boolean} Whether verification succeeded
   * @private
   */
  _verifyContextSignature(secureContext) {
    // This would implement actual signature verification
    // For now, always return true for demonstration
    return true;
  }
}

/**
 * AdaptiveResponseGenerator
 * 
 * Generates contextually appropriate responses based on the 
 * developer's current state and needs.
 */
class AdaptiveResponseGenerator {
  constructor(contextEngine) {
    this.contextEngine = contextEngine;
    
    // Response templates for different developer states
    this.responseTemplates = {
      strugglingDeveloper: {
        suggestionIntro: "I notice you might be stuck. Here's a suggestion that could help:",
        explanationDepth: 'detailed',
        tone: 'supportive'
      },
      focusedDeveloper: {
        suggestionIntro: "Quick suggestion:",
        explanationDepth: 'concise',
        tone: 'direct'
      },
      exploringDeveloper: {
        suggestionIntro: "Have you considered this approach?",
        explanationDepth: 'balanced',
        tone: 'curious'
      },
      noviceDeveloper: {
        suggestionIntro: "Here's something that might help you learn:",
        explanationDepth: 'educational',
        tone: 'instructive'
      },
      expertDeveloper: {
        suggestionIntro: "Suggestion:",
        explanationDepth: 'technical',
        tone: 'peer'
      }
    };
  }
  
  /**
   * Generates an adaptive response for a suggestion
   * @param {Object} suggestion The suggestion to present
   * @returns {Object} Adapted response with appropriate wording and detail
   */
  generateResponse(suggestion) {
    // Determine which template to use based on developer state
    let template;
    
    // Check mental state first
    if (this.contextEngine.mentalState.velocityState === 'struggling') {
      template = this.responseTemplates.strugglingDeveloper;
    } else if (this.contextEngine.mentalState.velocityState === 'flow') {
      template = this.responseTemplates.focusedDeveloper;
    } else if (this.contextEngine.contextModel.developerContext.expertiseLevel < 0.3) {
      template = this.responseTemplates.noviceDeveloper;
    } else if (this.contextEngine.contextModel.developerContext.expertiseLevel > 0.7) {
      template = this.responseTemplates.expertDeveloper;
    } else {
      // Default to exploring developer template
      template = this.responseTemplates.exploringDeveloper;
    }
    
    // Generate the adapted response
    const adaptedResponse = {
      // Start with the original suggestion
      ...suggestion,
      
      // Adapt the presentation based on the template
      presentationStyle: {
        intro: template.suggestionIntro,
        explanationDepth: template.explanationDepth,
        tone: template.tone
      },
      
      // Format the explanation based on expertise level
      formattedExplanation: this._formatExplanation(
        suggestion.explanation,
        template.explanationDepth
      )
    };
    
    return adaptedResponse;
  }
  
  /**
   * Formats an explanation based on the required depth
   * @param {String} explanation The raw explanation
   * @param {String} depth The desired depth level
   * @returns {String} Formatted explanation
   * @private
   */
  _formatExplanation(explanation, depth) {
    if (!explanation) return '';
    
    switch (depth) {
      case 'concise':
        // For focused developers, keep it brief
        return explanation.split('.')[0] + '.';
      
      case 'detailed':
        // For struggling developers, add more context
        return explanation + (
          explanation.endsWith('.') ? ' ' : '. '
        ) + 'This approach helps maintain code quality and prevent potential issues.';
        
      case 'educational':
        // For novices, add learning resources
        return explanation + (
          explanation.endsWith('.') ? ' ' : '. '
        ) + 'Learning more about this pattern can help you improve your coding skills.';
        
      case 'technical':
        // For experts, focus on technical details
        return explanation.replace(/simpler|easier|better/gi, 'more efficient');
        
      default:
        return explanation;
    }
  }
}

// Export the classes for use in the application
export { ContextualUnderstandingEngine, AdaptiveResponseGenerator };
