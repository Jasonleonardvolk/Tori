// semanticConflictService.enhanced.js
// Enhanced service for detecting and resolving semantic conflicts in intent specifications
// with improved conflict resolution algorithms for AI-native version control

import conceptGraphService from './conceptGraphService';

/**
 * This service implements an enhanced semantic conflict detection and resolution pipeline
 * for AI-driven development. It uses the concept graph to identify potentially conflicting
 * statements, classify them by conflict severity, and provide more intelligent resolution
 * strategies based on deep semantic understanding.
 */
class EnhancedSemanticConflictService {
  constructor() {
    this.graphService = conceptGraphService;
    this.intentSpecifications = new Map(); // Map of specId -> array of statements
    this.initialized = false;
    
    // Cached conflict detections to avoid redundant processing
    this.conflictCache = new Map();
    
    // Conflict type definitions with confidence thresholds
    this.conflictTypes = {
      DIRECT: { id: 'direct', threshold: 0.85, severity: 3 },
      SEMANTIC: { id: 'semantic', threshold: 0.7, severity: 2 },
      AMBIGUOUS: { id: 'ambiguous', threshold: 0.5, severity: 1 },
      NONE: { id: 'none', threshold: 0, severity: 0 }
    };
    
    // Secondary impact levels
    this.impactLevels = {
      GLOBAL: { id: 'global', threshold: 0.8, description: 'Affects the entire codebase or architecture' }, 
      MODERATE: { id: 'moderate', threshold: 0.5, description: 'Affects multiple components or files' },
      LOCAL: { id: 'local', threshold: 0.2, description: 'Effects contained to a single component or file' },
      MINIMAL: { id: 'minimal', threshold: 0, description: 'Negligible impact' }
    };
    
    // Domain-specific context patterns (for improved conflict detection)
    this.contextPatterns = {
      STATE_MANAGEMENT: {
        keywords: ['state', 'redux', 'store', 'context', 'useState', 'useReducer'],
        conflictPriority: 0.9, // Higher priority for state conflicts
        resolutionStrategies: ['merge', 'layer', 'refactor']
      },
      STYLING: {
        keywords: ['style', 'css', 'scss', 'theme', 'styled', 'className'],
        conflictPriority: 0.7,
        resolutionStrategies: ['theme', 'compose', 'override']
      },
      PERFORMANCE: {
        keywords: ['performance', 'optimize', 'memoize', 'useMemo', 'useCallback'],
        conflictPriority: 0.8,
        resolutionStrategies: ['profile', 'optimize', 'refactor']
      },
      // Add more patterns as needed
    };
  }
  
  /**
   * Initialize the service with the given intent specifications
   * @param {Object} specifications - Map of specification ID to array of statements
   * @returns {Promise<boolean>}
   */
  async initialize(specifications = {}) {
    try {
      // Clear previous state
      this.graphService.clear();
      this.intentSpecifications.clear();
      this.conflictCache.clear();
      
      // Add each specification and build the concept graph
      for (const [specId, statements] of Object.entries(specifications)) {
        this.intentSpecifications.set(specId, [...statements]);
        
        // Add each statement to the graph service
        for (const [index, statement] of statements.entries()) {
          await this.graphService.addDocument(
            `${specId}_${index}`,
            statement,
            { 
              specId, 
              index,
              timestamp: Date.now(), // Track when statements were added
              context: this.extractContextFromStatement(statement) // Add domain context
            }
          );
        }
      }
      
      this.initialized = true;
      console.log('Enhanced semantic conflict service initialized with graph stats:', 
        this.graphService.getGraphStats());
      
      return true;
    } catch (error) {
      console.error('Error initializing semantic conflict service:', error);
      this.initialized = false;
      return false;
    }
  }
  
  /**
   * Extract domain-specific context from a statement to improve conflict detection
   * @param {string} statement - The statement to analyze
   * @returns {Object} - Context information
   */
  extractContextFromStatement(statement) {
    const contextInfo = {
      domains: [],
      priority: 0.5, // Default priority
      suggestedStrategies: []
    };
    
    // Check which domain patterns match this statement
    for (const [domain, pattern] of Object.entries(this.contextPatterns)) {
      const matchScore = this.calculatePatternMatchScore(statement, pattern.keywords);
      if (matchScore > 0.3) { // Threshold for domain relevance
        contextInfo.domains.push({
          name: domain,
          score: matchScore,
          priority: pattern.conflictPriority
        });
        
        // Update priority based on domain match
        contextInfo.priority = Math.max(contextInfo.priority, pattern.conflictPriority * matchScore);
        
        // Add suggested resolution strategies from this domain
        contextInfo.suggestedStrategies.push(...pattern.resolutionStrategies);
      }
    }
    
    // Sort domains by relevance
    contextInfo.domains.sort((a, b) => b.score - a.score);
    
    // Remove duplicate strategies
    contextInfo.suggestedStrategies = [...new Set(contextInfo.suggestedStrategies)];
    
    return contextInfo;
  }
  
  /**
   * Calculate how well a statement matches a set of domain keywords
   * @param {string} statement - The statement to check
   * @param {Array<string>} keywords - Domain keywords to match against
   * @returns {number} - Match score between 0-1
   */
  calculatePatternMatchScore(statement, keywords) {
    const normalizedStatement = statement.toLowerCase();
    let matchCount = 0;
    
    for (const keyword of keywords) {
      if (normalizedStatement.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    return keywords.length > 0 ? matchCount / keywords.length : 0;
  }
  
  /**
   * Detect semantic conflicts between new information and existing statements
   * @param {string} newInfo - The new information to check for conflicts
   * @param {string} specId - ID of the specification to check against
   * @param {Object} options - Detection options
   * @returns {Promise<Array>} - List of potential conflicts with scores
   */
  async detectConflicts(newInfo, specId, options = {}) {
    const {
      maxResults = 10,
      threshold = 0.1,
      includeAmbiguous = true,
      includeSemanticConflicts = true  // New option to include semantic (not just direct) conflicts
    } = options;
    
    try {
      if (!this.initialized) {
        console.error('Semantic conflict service not initialized');
        return [];
      }
      
      if (!this.intentSpecifications.has(specId)) {
        console.error(`Specification ${specId} not found`);
        return [];
      }
      
      // Check cache first
      const cacheKey = `${specId}:${newInfo}:${includeAmbiguous}:${includeSemanticConflicts}`;
      if (this.conflictCache.has(cacheKey)) {
        return this.conflictCache.get(cacheKey);
      }
      
      // Extract context from new information to inform conflict detection
      const newInfoContext = this.extractContextFromStatement(newInfo);
      
      // Find potentially related documents using concept graph with enhanced retrieval
      // Use a lower initial threshold to cast a wider net, we'll filter more carefully later
      const relatedDocs = await this.graphService.findRelatedDocuments(newInfo, {
        maxResults: maxResults * 5, // Get more than needed for enhanced filtering
        threshold: Math.max(0.05, threshold / 2) // Lower threshold to catch more potential conflicts
      });
      
      // Filter to only include documents from the requested specification
      const filteredDocs = relatedDocs.filter(doc => 
        doc.id.startsWith(`${specId}_`)
      );
      
      if (filteredDocs.length === 0) {
        return [];
      }
      
      // Get the actual statements from the IDs
      const statementConflicts = [];
      
      for (const doc of filteredDocs) {
        const [, indexStr] = doc.id.split('_');
        const index = parseInt(indexStr);
        
        if (isNaN(index) || index < 0 || 
            index >= this.intentSpecifications.get(specId).length) {
          continue; // Invalid index
        }
        
        const statement = this.intentSpecifications.get(specId)[index];
        
        // Enhanced conflict classification using semantic similarity, contradictions, and domain context
        const conflictAnalysis = await this.analyzeConflict(newInfo, statement, newInfoContext);
        
        // Apply filtering based on conflict type and options
        if (
          conflictAnalysis.type === this.conflictTypes.NONE.id ||
          (conflictAnalysis.type === this.conflictTypes.AMBIGUOUS.id && !includeAmbiguous) ||
          (conflictAnalysis.type === this.conflictTypes.SEMANTIC.id && !includeSemanticConflicts)
        ) {
          continue;
        }
        
        // Calculate enhanced impact using graph-based assessment
        const impact = await this.assessImpact(statement, newInfo, conflictAnalysis);
        
        statementConflicts.push({
          index,
          statement,
          ...conflictAnalysis,
          score: Math.max(doc.score, conflictAnalysis.confidence), // Use higher of graph score or conflict confidence
          impact
        });
      }
      
      // Sort conflicts by severity and confidence
      const sortedConflicts = statementConflicts.sort((a, b) => {
        // First sort by conflict type severity
        const severityA = this.getSeverityForType(a.type);
        const severityB = this.getSeverityForType(b.type);
        if (severityA !== severityB) return severityB - severityA;
        
        // Then by confidence
        return b.confidence - a.confidence;
      }).slice(0, maxResults);
      
      // Cache the results
      this.conflictCache.set(cacheKey, sortedConflicts);
      
      return sortedConflicts;
    } catch (error) {
      console.error('Error detecting semantic conflicts:', error);
      return [];
    }
  }
  
  /**
   * Get the severity level for a conflict type
   * @param {string} type - The conflict type
   * @returns {number} - Severity level
   */
  getSeverityForType(type) {
    for (const conflictType of Object.values(this.conflictTypes)) {
      if (conflictType.id === type) {
        return conflictType.severity;
      }
    }
    return 0;
  }
  
  /**
   * Analyze the conflict between two statements with enhanced classification
   * Uses semantic similarity, contradiction detection, and domain context
   * 
   * @param {string} newInfo - New information
   * @param {string} existingInfo - Existing information to check against
   * @param {Object} newInfoContext - Context of the new information 
   * @returns {Promise<Object>} - Detailed conflict analysis
   */
  async analyzeConflict(newInfo, existingInfo, newInfoContext) {
    try {
      // Extract context from existing statement for comparison
      const existingInfoContext = this.extractContextFromStatement(existingInfo);
      
      // ---- Step 1: Check for direct contradictions ----
      const contradictionResult = this.detectContradictions(newInfo, existingInfo);
      
      if (contradictionResult.isContradiction && contradictionResult.confidence >= this.conflictTypes.DIRECT.threshold) {
        return {
          type: this.conflictTypes.DIRECT.id,
          reason: contradictionResult.reason,
          confidence: contradictionResult.confidence,
          contradictionDetails: contradictionResult,
          domainContext: this.mergeDomainContext(newInfoContext, existingInfoContext)
        };
      }
      
      // ---- Step 2: Check for semantic conflicts (same topic, different approaches) ----
      const semanticResult = this.detectSemanticConflicts(newInfo, existingInfo, newInfoContext, existingInfoContext);
      
      if (semanticResult.isSemanticConflict && semanticResult.confidence >= this.conflictTypes.SEMANTIC.threshold) {
        return {
          type: this.conflictTypes.SEMANTIC.id,
          reason: semanticResult.reason,
          confidence: semanticResult.confidence,
          semanticDetails: semanticResult,
          domainContext: this.mergeDomainContext(newInfoContext, existingInfoContext)
        };
      }
      
      // ---- Step 3: Check for ambiguous relationships ----
      // Calculate semantic similarity using concept overlap
      const similarity = this.calculateSemanticSimilarity(newInfo, existingInfo);
      const sharedConcepts = this.extractSharedConcepts(newInfo, existingInfo);
      
      // Higher similarity means more likely to be ambiguous (related but not directly contradicting)
      if (similarity >= this.conflictTypes.AMBIGUOUS.threshold) {
        return {
          type: this.conflictTypes.AMBIGUOUS.id,
          reason: `Both statements share concepts (${sharedConcepts.slice(0, 3).join(', ')}${sharedConcepts.length > 3 ? '...' : ''}) but may have different implications or details. Review needed to ensure consistency.`,
          confidence: similarity,
          similarityConcepts: sharedConcepts,
          domainContext: this.mergeDomainContext(newInfoContext, existingInfoContext)
        };
      }
      
      // ---- Step 4: No conflict detected ----
      return {
        type: this.conflictTypes.NONE.id,
        reason: 'No apparent conflict between these statements.',
        confidence: 1.0 - similarity, // Confidence in lack of conflict
        domainContext: this.mergeDomainContext(newInfoContext, existingInfoContext)
      };
    } catch (error) {
      console.error('Error analyzing conflict:', error);
      return {
        type: this.conflictTypes.AMBIGUOUS.id, // Default to ambiguous if error
        reason: 'Error during conflict analysis, please review manually.',
        confidence: 0.5,
        error: error.message
      };
    }
  }
  
  /**
   * Merge domain contexts from two statements to understand the combined domain impact
   * @param {Object} context1 - First context
   * @param {Object} context2 - Second context
   * @returns {Object} - Merged context
   */
  mergeDomainContext(context1, context2) {
    // Start with combined domains
    const allDomains = [...context1.domains];
    
    // Add domains from context2 that aren't already in the list
    for (const domain of context2.domains) {
      const existing = allDomains.find(d => d.name === domain.name);
      if (existing) {
        // If domain exists, update with higher score
        existing.score = Math.max(existing.score, domain.score);
        existing.priority = Math.max(existing.priority, domain.priority);
      } else {
        // Otherwise add it
        allDomains.push({...domain});
      }
    }
    
    // Sort by relevance
    allDomains.sort((a, b) => b.score - a.score);
    
    // Combine strategies from both contexts
    const combinedStrategies = [
      ...new Set([...context1.suggestedStrategies, ...context2.suggestedStrategies])
    ];
    
    return {
      domains: allDomains,
      priority: Math.max(context1.priority, context2.priority),
      suggestedStrategies: combinedStrategies
    };
  }
  
  /**
   * Enhanced detection of direct contradictions between statements
   * @param {string} newInfo - New statement
   * @param {string} existingInfo - Existing statement
   * @returns {Object} - Contradiction analysis
   */
  detectContradictions(newInfo, existingInfo) {
    // Normalize text for comparison
    const normalizeText = (text) => text.toLowerCase().trim();
    
    const newNormalized = normalizeText(newInfo);
    const existingNormalized = normalizeText(existingInfo);
    
    // Enhanced set of contradiction patterns
    const contradictionPatterns = [
      // Simple opposites
      { patterns: [['is', 'is not'], ['should', 'should not'], ['must', 'must not'], ['will', 'will not']], weight: 1.0 },
      // Directional opposites
      { patterns: [['increase', 'decrease'], ['more', 'less'], ['larger', 'smaller'], ['higher', 'lower']], weight: 0.9 },
      // Logic/value opposites
      { patterns: [['true', 'false'], ['always', 'never'], ['enable', 'disable'], ['allow', 'prevent']], weight: 0.8 },
      // Style opposites 
      { patterns: [['inline', 'external'], ['sync', 'async'], ['stateful', 'stateless']], weight: 0.7 },
      // Soft contradictions
      { patterns: [['prefer', 'avoid'], ['good', 'bad'], ['correct', 'incorrect']], weight: 0.6 }
    ];
    
    let maxConfidence = 0;
    let contradictionReason = '';
    let contradictionDetail = {};
    
    // Check all contradiction patterns
    for (const { patterns, weight } of contradictionPatterns) {
      for (const [positive, negative] of patterns) {
        const hasPositiveInNew = newNormalized.includes(positive);
        const hasNegativeInNew = newNormalized.includes(negative);
        const hasPositiveInExisting = existingNormalized.includes(positive);
        const hasNegativeInExisting = existingNormalized.includes(negative);
        
        // Check for direct contradiction
        if ((hasPositiveInNew && hasNegativeInExisting) || 
            (hasNegativeInNew && hasPositiveInExisting)) {
          
          // Find the subject (context) around the contradictory terms
          const context = this.findContradictionContext(
            hasPositiveInNew ? positive : negative,
            hasPositiveInExisting ? positive : negative,
            newInfo, 
            existingInfo
          );
          
          // Calculate confidence based on weight and context specificity
          const confidence = weight * (context.specificity || 0.5);
          
          if (confidence > maxConfidence) {
            maxConfidence = confidence;
            contradictionReason = `Direct contradiction detected regarding "${context.subject}". Statement one uses "${positive}" while statement two uses "${negative}".`;
            contradictionDetail = {
              term1: positive,
              term2: negative,
              context
            };
          }
        }
      }
    }
    
    // Check for numerical contradictions (like different values for same property)
    const numericContradiction = this.detectNumericalContradiction(newInfo, existingInfo);
    if (numericContradiction.isContradiction && numericContradiction.confidence > maxConfidence) {
      maxConfidence = numericContradiction.confidence;
      contradictionReason = numericContradiction.reason;
      contradictionDetail = numericContradiction;
    }
    
    return {
      isContradiction: maxConfidence > 0,
      confidence: maxConfidence,
      reason: contradictionReason,
      details: contradictionDetail
    };
  }
  
  /**
   * Find the context around contradictory terms to understand what they're referring to
   * @param {string} term1 - First contradictory term
   * @param {string} term2 - Second contradictory term
   * @param {string} text1 - First statement
   * @param {string} text2 - Second statement
   * @returns {Object} - Context information
   */
  findContradictionContext(term1, term2, text1, text2) {
    // Try to find the subject by looking at shared nouns near the contradictory terms
    const context1 = this.extractSurroundingContext(text1, term1, 5); // 5 words before and after
    const context2 = this.extractSurroundingContext(text2, term2, 5);
    
    // Extract potential nouns/subjects from both contexts
    const nouns1 = this.extractPotentialNouns(context1);
    const nouns2 = this.extractPotentialNouns(context2);
    
    // Find common nouns (potential subjects of contradiction)
    const commonNouns = nouns1.filter(noun => nouns2.includes(noun));
    
    if (commonNouns.length > 0) {
      // Sort by length descending (longer nouns are likely more specific)
      const sortedNouns = [...commonNouns].sort((a, b) => b.length - a.length);
      return {
        subject: sortedNouns[0],
        allSubjects: sortedNouns,
        specificity: 0.8, // High specificity when we have a clear common subject
        context1,
        context2
      };
    }
    
    // Fallback: if no common nouns, try to find any shared words
    const words1 = context1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const words2 = context2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const commonWords = words1.filter(word => words2.includes(word));
    
    if (commonWords.length > 0) {
      return {
        subject: commonWords[0],
        allSubjects: commonWords,
        specificity: 0.5, // Medium specificity - have common words but not clear nouns
        context1, 
        context2
      };
    }
    
    // Last resort: can't find a clear subject
    return {
      subject: "this topic",
      specificity: 0.3, // Low specificity - could be talking about different things
      context1,
      context2
    };
  }
  
  /**
   * Extract words around a term in text to get context
   * @param {string} text - Full text
   * @param {string} term - Term to find context for
   * @param {number} windowSize - Words before/after to include
   * @returns {string} - Context window
   */
  extractSurroundingContext(text, term, windowSize) {
    const words = text.split(/\s+/);
    const termIndex = words.findIndex(word => 
      word.toLowerCase().includes(term.toLowerCase())
    );
    
    if (termIndex === -1) return "";
    
    const start = Math.max(0, termIndex - windowSize);
    const end = Math.min(words.length, termIndex + windowSize + 1);
    
    return words.slice(start, end).join(' ');
  }
  
  /**
   * Extract potential nouns from a text fragment
   * Simple implementation that can be enhanced with NLP
   * @param {string} text - Text to extract nouns from
   * @returns {Array<string>} - List of potential nouns
   */
  extractPotentialNouns(text) {
    // Simple heuristic: words that aren't common stopwords 
    // and aren't typical adjectives/verbs
    const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
      'be', 'been', 'being', 'to', 'of', 'for', 'with', 'by', 'about', 'against', 'between',
      'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down',
      'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
      'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
      'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now']);
    
    // Non-noun endings (simplified)
    const nonNounEndings = ['ing', 'ly', 'ed'];
    
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    return words.filter(word => {
      // Filter out stopwords
      if (stopwords.has(word)) return false;
      
      // Filter out likely verbs/adjectives based on endings
      if (nonNounEndings.some(ending => word.endsWith(ending))) return false;
      
      return true;
    });
  }
  
  /**
   * Detect numerical contradictions (different values for same property)
   * @param {string} text1 - First statement
   * @param {string} text2 - Second statement
   * @returns {Object} - Contradiction analysis
   */
  detectNumericalContradiction(text1, text2) {
    // Pattern to find numerical values with context (e.g., "timeout of 500ms")
    const numPattern = /(\w+(?:\s+\w+){0,3})\s+(?:of|is|should be|=|:)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z%]+)?/g;
    
    const values1 = {};
    const values2 = {};
    
    // Extract numerical values from text1
    let match;
    while ((match = numPattern.exec(text1)) !== null) {
      const [, context, value, unit] = match;
      values1[context.toLowerCase()] = { value: parseFloat(value), unit: unit || '', raw: match[0] };
    }
    
    // Reset regex to use on text2
    numPattern.lastIndex = 0;
    
    // Extract from text2 and check for contradictions
    const contradictions = [];
    
    while ((match = numPattern.exec(text2)) !== null) {
      const [, context, value, unit] = match;
      const contextKey = context.toLowerCase();
      values2[contextKey] = { value: parseFloat(value), unit: unit || '', raw: match[0] };
      
      // Check if same context exists in text1 with different value
      if (values1[contextKey] && values1[contextKey].value !== parseFloat(value)) {
        // Check if units are compatible if both present
        const unitsMatch = !values1[contextKey].unit || !unit || values1[contextKey].unit === unit;
        
        if (unitsMatch) {
          contradictions.push({
            context: context,
            value1: values1[contextKey].value,
            unit1: values1[contextKey].unit,
            value2: parseFloat(value),
            unit2: unit || '',
            raw1: values1[contextKey].raw,
            raw2: match[0],
            // Calculate confidence based on how specific the context is
            confidence: 0.7 + (0.1 * context.split(/\s+/).length) // More words = more specific context
          });
        }
      }
    }
    
    if (contradictions.length > 0) {
      // Sort by confidence
      contradictions.sort((a, b) => b.confidence - a.confidence);
      const strongest = contradictions[0];
      
      return {
        isContradiction: true,
        confidence: strongest.confidence,
        reason: `Numerical contradiction found for "${strongest.context}": ${strongest.value1}${strongest.unit1} vs ${strongest.value2}${strongest.unit2}.`,
        allContradictions: contradictions
      };
    }
    
    return {
      isContradiction: false,
      confidence: 0
    };
  }
  
  /**
   * Detect semantic conflicts (statements that address the same topic with conflicting approaches)
   * @param {string} newInfo - New statement
   * @param {string} existingInfo - Existing statement
   * @param {Object} newInfoContext - Context of the new information
   * @param {Object} existingInfoContext - Context of the existing information
   * @returns {Object} - Semantic conflict analysis
   */
  detectSemanticConflicts(newInfo, existingInfo, newInfoContext, existingInfoContext) {
    // First check if they're in the same domain
    const sharedDomains = newInfoContext.domains.filter(
      domain => existingInfoContext.domains.some(d => d.name === domain.name)
    );
    
    if (sharedDomains.length === 0) {
      // Different domains, less likely to conflict semantically
      return {
        isSemanticConflict: false,
        confidence: 0.2,
        domains: []
      };
    }
    
    // Calculate semantic similarity
    const similarity = this.calculateSemanticSimilarity(newInfo, existingInfo);
    
    // Check for semantic opposites in the same domain
    const semanticOpposites = this.detectSemanticOpposites(newInfo, existingInfo);
    
    // Find key concepts they're both discussing
    const sharedConcepts = this.extractSharedConcepts(newInfo, existingInfo);
    
    // If there are semantic opposites and they share concepts, it's likely a semantic conflict
    if (semanticOpposites.hasOpposites && sharedConcepts.length > 0) {
      return {
        isSemanticConflict: true,
        confidence: Math.min(0.9, 0.6 + (semanticOpposites.confidence * 0.3)),
        reason: `Semantic conflict detected: both statements discuss ${sharedConcepts.slice(0, 2).join(' and ')} but with potentially conflicting approaches (${semanticOpposites.pairs[0][0]} vs ${semanticOpposites.pairs[0][1]}).`,
        concepts: sharedConcepts,
        opposites: semanticOpposites.pairs,
        domains: sharedDomains
      };
    }
    
    // Check if they prescribe different approaches (multiple domains)
    if (sharedDomains.length > 0 && similarity > 0.4) {
      // Different prescriptive verbs?
      const prescriptiveTerms1 = this.extractPrescriptiveTerms(newInfo);
      const prescriptiveTerms2 = this.extractPrescriptiveTerms(existingInfo);
      
      // Check if they have different prescriptive terms
      if (prescriptiveTerms1.length > 0 && prescriptiveTerms2.length > 0 && 
          !this.hasCommonElement(prescriptiveTerms1, prescriptiveTerms2)) {
        return {
          isSemanticConflict: true,
          confidence: 0.75,
          reason: `Both statements address ${sharedDomains[0].name} but with different approaches: "${prescriptiveTerms1[0]}" vs "${prescriptiveTerms2[0]}".`,
          approaches: {
            new: prescriptiveTerms1,
            existing: prescriptiveTerms2
