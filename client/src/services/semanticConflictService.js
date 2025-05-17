// semanticConflictService.js
// Service for detecting and resolving semantic conflicts in intent specifications

import conceptGraphService from './conceptGraphService';

/**
 * This service implements the semantic conflict detection and resolution pipeline
 * described in the Semantic Commit paper. It uses the concept graph to identify
 * potentially conflicting statements and classify them by conflict severity.
 */
class SemanticConflictService {
  constructor() {
    this.graphService = conceptGraphService;
    this.intentSpecifications = new Map(); // Map of specId -> array of statements
    this.initialized = false;
    
    // Cached conflict detections to avoid redundant processing
    this.conflictCache = new Map();
  }
  
  /**
   * Initialize the service with the given intent specifications
   * @param {Object} specifications - Map of specification ID to array of statements
   * @returns {Promise<void>}
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
            { specId, index }
          );
        }
      }
      
      this.initialized = true;
      console.log('Semantic conflict service initialized with graph stats:', 
        this.graphService.getGraphStats());
      
      return true;
    } catch (error) {
      console.error('Error initializing semantic conflict service:', error);
      this.initialized = false;
      return false;
    }
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
      includeAmbiguous = true
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
      const cacheKey = `${specId}:${newInfo}`;
      if (this.conflictCache.has(cacheKey)) {
        return this.conflictCache.get(cacheKey);
      }
      
      // Find potentially related documents using concept graph
      const relatedDocs = await this.graphService.findRelatedDocuments(newInfo, {
        maxResults: maxResults * 3, // Get more than needed for filtering
        threshold
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
        
        // Classify the conflict type using LLM or other technique
        const { type, reason } = await this.classifyConflict(newInfo, statement);
        
        // Skip non-conflicts if requested
        if (type === 'none' || (type === 'ambiguous' && !includeAmbiguous)) {
          continue;
        }
        
        statementConflicts.push({
          index,
          statement,
          type, // direct, ambiguous, or none
          reason,
          score: doc.score,
          impact: await this.estimateImpact(statement, newInfo)
        });
      }
      
      // Sort conflicts by type (direct first) and then by score
      const sortedConflicts = statementConflicts.sort((a, b) => {
        if (a.type === 'direct' && b.type !== 'direct') return -1;
        if (a.type !== 'direct' && b.type === 'direct') return 1;
        return b.score - a.score;
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
   * Classify the type of semantic conflict between two statements
   * This would use an LLM in production to determine if there's a direct conflict,
   * ambiguous conflict, or no conflict
   * 
   * @param {string} newInfo - New information
   * @param {string} existingInfo - Existing information to check against
   * @returns {Promise<Object>} - Object with type and reason
   */
  async classifyConflict(newInfo, existingInfo) {
    // In a real implementation, this would call an LLM
    // For this demo, we'll use simple heuristics
    
    try {
      // Simple keyword-based conflict detection
      // In production, this would use an LLM to perform natural language inference
      
      // Normalize text for comparison
      const normalizeText = (text) => text.toLowerCase().trim();
      
      const newNormalized = normalizeText(newInfo);
      const existingNormalized = normalizeText(existingInfo);
      
      // Check for contradictory phrases
      const contradictions = [
        ['is', 'is not'], ['will', 'will not'], ['can', 'cannot'],
        ['should', 'should not'], ['must', 'must not'], ['always', 'never']
      ];
      
      // Simple pattern for direct contradictions - both texts mention the same subject
      // but with opposite modifiers
      for (const [positive, negative] of contradictions) {
        if ((newNormalized.includes(positive) && existingNormalized.includes(negative)) ||
            (newNormalized.includes(negative) && existingNormalized.includes(positive))) {
          
          const subject = this.findCommonSubject(newInfo, existingInfo);
          if (subject) {
            return {
              type: 'direct',
              reason: `Direct contradiction detected regarding "${subject}". One statement uses "${positive}" while the other uses "${negative}".`
            };
          }
        }
      }
      
      // Check for potentially conflicting statements about the same subject
      const subject = this.findCommonSubject(newInfo, existingInfo);
      if (subject) {
        // This is simplified - a real implementation would use more sophisticated NLP
        return {
          type: 'ambiguous',
          reason: `Both statements refer to "${subject}" but may have different implications or details. Review needed to ensure consistency.`
        };
      }
      
      // If no conflicts detected
      return {
        type: 'none',
        reason: 'No apparent conflict between these statements.'
      };
    } catch (error) {
      console.error('Error classifying conflict:', error);
      return {
        type: 'ambiguous', // Default to ambiguous if error
        reason: 'Error during conflict classification, please review manually.'
      };
    }
  }
  
  /**
   * Find common subjects between two statements
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {string|null} - Common subject if found, null otherwise
   */
  findCommonSubject(text1, text2) {
    // Extract potential subjects (nouns, named entities)
    // In a real implementation, this would use NLP techniques
    
    // Simple implementation - find words that appear in both texts
    const words1 = new Set(text1.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
    const words2 = new Set(text2.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
    
    // Find common words
    const commonWords = [...words1].filter(word => words2.has(word));
    
    if (commonWords.length > 0) {
      // Return the longest common word as a simplistic heuristic for important subjects
      return commonWords.sort((a, b) => b.length - a.length)[0];
    }
    
    return null;
  }
  
  /**
   * Estimate the impact of a conflict resolution
   * @param {string} statement - The conflicting statement
   * @param {string} newInfo - The new information
   * @returns {Promise<Object>} - Impact analysis
   */
  async estimateImpact(statement, newInfo) {
    // In a real implementation, this would analyze the knowledge graph
    // to identify secondary effects and impacted components
    
    // For demo purposes, we'll generate a simple impact estimate
    return {
      scope: 'local', // local, moderate, or global
      confidence: 0.8, // 0-1 confidence in the impact assessment
      affectedStatements: 1, // Estimated number of affected statements
      secondaryImpacts: [] // List of other statements that may be affected
    };
  }
  
  /**
   * Suggest a resolution for a conflict
   * @param {string} newInfo - The new information
   * @param {Object} conflict - The conflict to resolve
   * @returns {Promise<Object>} - Suggested resolution
   */
  async suggestResolution(newInfo, conflict) {
    try {
      // In a real implementation, this would use an LLM to generate
      // conflict resolution strategies
      
      const resolutions = [];
      
      // Simple heuristic-based resolution strategies
      if (conflict.type === 'direct') {
        // For direct conflicts, suggest replacing the old information
        resolutions.push({
          strategy: 'replace',
          description: 'Replace the existing information with the new information',
          updatedStatement: newInfo
        });
        
        // Add option to merge information
        resolutions.push({
          strategy: 'merge',
          description: 'Merge the information, keeping compatible parts of both',
          updatedStatement: `${conflict.statement} However, ${newInfo}`
        });
      } else if (conflict.type === 'ambiguous') {
        // For ambiguous conflicts, suggest clarifying the relationship
        resolutions.push({
          strategy: 'clarify',
          description: 'Clarify the relationship between the conflicting information',
          updatedStatement: `${conflict.statement} Additionally, ${newInfo}`
        });
        
        // Add option to keep both separately
        resolutions.push({
          strategy: 'keep-both',
          description: 'Keep both pieces of information separate',
          updatedStatement: conflict.statement // Unchanged
        });
      }
      
      // Always include option to delete
      resolutions.push({
        strategy: 'delete',
        description: 'Delete the existing information',
        updatedStatement: null
      });
      
      return {
        conflict,
        resolutions,
        recommendedStrategy: resolutions[0]?.strategy || 'none'
      };
    } catch (error) {
      console.error('Error suggesting resolution:', error);
      return {
        conflict,
        resolutions: [],
        recommendedStrategy: 'none'
      };
    }
  }
  
  /**
   * Update an intent specification with conflict resolutions
   * @param {string} specId - ID of the specification to update
   * @param {Array} resolutions - List of conflict resolutions
   * @returns {Promise<boolean>} - Success status
   */
  async applyResolutions(specId, resolutions) {
    try {
      if (!this.intentSpecifications.has(specId)) {
        console.error(`Specification ${specId} not found`);
        return false;
      }
      
      // Get the current specification
      const currentSpec = this.intentSpecifications.get(specId);
      const newSpec = [...currentSpec];
      
      // Apply each resolution
      for (const resolution of resolutions) {
        const { index, strategy, updatedStatement } = resolution;
        
        if (index < 0 || index >= newSpec.length) {
          console.error(`Invalid index: ${index}`);
          continue;
        }
        
        if (strategy === 'delete') {
          // Remove the statement
          newSpec.splice(index, 1);
        } else if (updatedStatement) {
          // Update the statement
          newSpec[index] = updatedStatement;
        }
      }
      
      // Update the specification
      this.intentSpecifications.set(specId, newSpec);
      
      // Invalidate conflict cache
      this.conflictCache.clear();
      
      // Rebuild the concept graph (this is simplified - a real implementation
      // would incrementally update the graph)
      await this.initialize(Object.fromEntries(this.intentSpecifications.entries()));
      
      return true;
    } catch (error) {
      console.error('Error applying resolutions:', error);
      return false;
    }
  }
  
  /**
   * Add new information to a specification
   * @param {string} specId - ID of the specification to update
   * @param {string} newInfo - New information to add
   * @returns {Promise<boolean>} - Success status
   */
  async addInformation(specId, newInfo) {
    try {
      if (!this.intentSpecifications.has(specId)) {
        console.error(`Specification ${specId} not found`);
        return false;
      }
      
      // Get the current specification
      const currentSpec = this.intentSpecifications.get(specId);
      
      // Add the new information
      const newSpec = [...currentSpec, newInfo];
      
      // Update the specification
      this.intentSpecifications.set(specId, newSpec);
      
      // Add the new statement to the graph
      const newIndex = newSpec.length - 1;
      await this.graphService.addDocument(
        `${specId}_${newIndex}`,
        newInfo,
        { specId, index: newIndex }
      );
      
      // Invalidate conflict cache
      this.conflictCache.clear();
      
      return true;
    } catch (error) {
      console.error('Error adding information:', error);
      return false;
    }
  }
  
  /**
   * Get all statements for a specification
   * @param {string} specId - ID of the specification
   * @returns {Array} - List of statements
   */
  getStatements(specId) {
    return this.intentSpecifications.has(specId) 
      ? [...this.intentSpecifications.get(specId)]
      : [];
  }
  
  /**
   * Visualize the impact of new information on the concept graph
   * @param {string} newInfo - The new information
   * @param {string} specId - ID of the specification
   * @returns {Promise<Object>} - Graph visualization data
   */
  async visualizeImpact(newInfo, specId) {
    try {
      // Find potential conflicts
      const conflicts = await this.detectConflicts(newInfo, specId, {
        includeAmbiguous: true,
        threshold: 0.05 // Lower threshold for visualization
      });
      
      // Extract entities and relationships from the new information
      const { entities, relationships } = await this.graphService.extractConceptsFromText(newInfo);
      
      // Create a visualization of the concept graph focused on the impacted areas
      const baseVisualization = this.graphService.getGraphVisualization();
      
      // Highlight nodes and edges related to the conflicts
      const impactedNodeIds = new Set();
      
      // Add all concepts from the new information
      for (const entity of entities) {
        impactedNodeIds.add(entity.id || this.graphService.normalizeEntityName(entity.name));
      }
      
      // Add nodes from conflicting statements
      for (const conflict of conflicts) {
        const statementEntities = await this.graphService.extractConceptsFromText(conflict.statement);
        for (const entity of statementEntities.entities) {
          impactedNodeIds.add(entity.id || this.graphService.normalizeEntityName(entity.name));
        }
      }
      
      // Create a styled version of the graph highlighting impacted nodes
      const impactVisualization = {
        nodes: baseVisualization.nodes.map(node => ({
          ...node,
          isImpacted: impactedNodeIds.has(node.id),
          importance: impactedNodeIds.has(node.id) ? 2.0 : 1.0
        })),
        edges: baseVisualization.edges.map(edge => ({
          ...edge,
          isImpacted: impactedNodeIds.has(edge.source) && impactedNodeIds.has(edge.target)
        })),
        conflicts,
        newInfo: {
          entities,
          relationships
        }
      };
      
      return impactVisualization;
    } catch (error) {
      console.error('Error visualizing impact:', error);
      return {
        nodes: [],
        edges: [],
        conflicts: [],
        newInfo: { entities: [], relationships: [] }
      };
    }
  }
}

// Create and export singleton instance
const semanticConflictService = new SemanticConflictService();
export default semanticConflictService;
