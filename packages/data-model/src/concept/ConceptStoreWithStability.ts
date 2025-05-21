/**
 * ConceptStoreWithStability.ts
 * 
 * This module extends the core concept store with stability metrics
 * to enable integration between the Spectral Monitor and Stability Reasoning.
 */

import { Concept } from './Concept';

/**
 * ConceptWithStability extends the base Concept interface with
 * stability and coherence metrics necessary for stable reasoning.
 */
export interface ConceptWithStability extends Concept {
  /** Overall stability score (0-1) from spectral analysis */
  stability: number;
  
  /** Phase coherence with other concepts (0-1) */
  coherence: number;
  
  /** Timestamp of the last coherence break event (if any) */
  lastCoherenceBreak?: number;
  
  /** Map of adjacent concept IDs to similarity scores */
  adjacentConcepts: Map<string, number>;
  
  /** Spectral eigenvalue if applicable */
  eigenvalue?: number;
  
  /** Timestamp when stability was last updated */
  stabilityUpdatedAt: number;
}

/**
 * StabilityUpdateMetrics contains the metrics used to update
 * stability information for a single concept.
 */
export interface StabilityUpdateMetrics {
  conceptId: string;
  stability: number;
  coherence: number;
  adjacencies?: Map<string, number>;
  eigenvalue?: number;
  coherenceBreak?: boolean;
}

/**
 * StabilityAwareConceptStore provides methods to manage concepts
 * with their associated stability metrics.
 */
export class StabilityAwareConceptStore {
  private concepts: Map<string, ConceptWithStability> = new Map();
  private stabilityHistory: Map<string, Array<[number, number]>> = new Map(); // conceptId -> [(timestamp, stability)]
  private historyLimit = 100; // Limit history entries per concept
  
  /**
   * Initialize the concept store
   * @param initialConcepts Optional initial concepts
   */
  constructor(initialConcepts?: Map<string, ConceptWithStability>) {
    if (initialConcepts) {
      this.concepts = new Map(initialConcepts);
    }
  }
  
  /**
   * Get a concept by ID
   * @param id Concept ID
   * @returns The concept or undefined if not found
   */
  getConcept(id: string): ConceptWithStability | undefined {
    return this.concepts.get(id);
  }
  
  /**
   * Add or update a concept
   * @param concept The concept to add or update
   */
  addConcept(concept: ConceptWithStability): void {
    // Ensure the concept has the required stability fields
    if (concept.stability === undefined) {
      concept.stability = 0.5; // Default stability
    }
    
    if (concept.coherence === undefined) {
      concept.coherence = 0.5; // Default coherence
    }
    
    if (!concept.adjacentConcepts) {
      concept.adjacentConcepts = new Map();
    }
    
    if (!concept.stabilityUpdatedAt) {
      concept.stabilityUpdatedAt = Date.now();
    }
    
    this.concepts.set(concept.id, concept);
  }
  
  /**
   * Get all concepts
   * @returns All concepts in the store
   */
  getAllConcepts(): ConceptWithStability[] {
    return Array.from(this.concepts.values());
  }
  
  /**
   * Update stability metrics for a concept
   * @param metrics The stability metrics to update
   * @returns The updated concept
   */
  updateStability(metrics: StabilityUpdateMetrics): ConceptWithStability | undefined {
    const concept = this.concepts.get(metrics.conceptId);
    
    if (!concept) {
      console.warn(`Cannot update stability: Concept ${metrics.conceptId} not found`);
      return undefined;
    }
    
    // Update the metrics
    concept.stability = metrics.stability;
    concept.coherence = metrics.coherence;
    concept.stabilityUpdatedAt = Date.now();
    
    if (metrics.eigenvalue !== undefined) {
      concept.eigenvalue = metrics.eigenvalue;
    }
    
    if (metrics.adjacencies) {
      // Merge new adjacencies with existing ones
      metrics.adjacencies.forEach((similarity, adjId) => {
        concept.adjacentConcepts.set(adjId, similarity);
      });
    }
    
    if (metrics.coherenceBreak) {
      concept.lastCoherenceBreak = Date.now();
    }
    
    // Record in history for trend analysis
    this.recordStabilityHistory(metrics.conceptId, metrics.stability);
    
    // Update the concept in the store
    this.concepts.set(metrics.conceptId, concept);
    
    return concept;
  }
  
  /**
   * Record stability history for trend analysis
   * @param conceptId The concept ID
   * @param stability The stability value to record
   */
  private recordStabilityHistory(conceptId: string, stability: number): void {
    if (!this.stabilityHistory.has(conceptId)) {
      this.stabilityHistory.set(conceptId, []);
    }
    
    const history = this.stabilityHistory.get(conceptId)!;
    
    // Add the new entry
    history.push([Date.now(), stability]);
    
    // Limit history size
    if (history.length > this.historyLimit) {
      history.shift(); // Remove oldest entry
    }
    
    this.stabilityHistory.set(conceptId, history);
  }
  
  /**
   * Get stability history for a concept
   * @param conceptId The concept ID
   * @returns Array of [timestamp, stability] entries or empty array if no history
   */
  getStabilityHistory(conceptId: string): Array<[number, number]> {
    return this.stabilityHistory.get(conceptId) || [];
  }
  
  /**
   * Find unstable concepts based on threshold
   * @param threshold Stability threshold (default: 0.4)
   * @returns Array of unstable concepts
   */
  findUnstableConcepts(threshold = 0.4): ConceptWithStability[] {
    return Array.from(this.concepts.values())
      .filter(concept => concept.stability < threshold);
  }
  
  /**
   * Find recent coherence breaks
   * @param timeWindowMs Time window in milliseconds (default: 24 hours)
   * @returns Array of concepts with recent coherence breaks
   */
  findRecentCoherenceBreaks(timeWindowMs: number = 24 * 60 * 60 * 1000): ConceptWithStability[] {
    const cutoffTime = Date.now() - timeWindowMs;
    
    return Array.from(this.concepts.values())
      .filter(concept => 
        concept.lastCoherenceBreak !== undefined && 
        concept.lastCoherenceBreak >= cutoffTime
      );
  }
  
  /**
   * Get similar concepts for a given concept
   * @param conceptId The concept ID
   * @param threshold Similarity threshold (default: 0.5)
   * @param limit Maximum number of similar concepts to return (default: 5)
   * @returns Array of similar concepts with their similarity scores
   */
  getSimilarConcepts(
    conceptId: string, 
    threshold = 0.5, 
    limit = 5
  ): Array<[ConceptWithStability, number]> {
    const concept = this.concepts.get(conceptId);
    
    if (!concept || !concept.adjacentConcepts) {
      return [];
    }
    
    const similarConcepts: Array<[ConceptWithStability, number]> = [];
    
    // Convert adjacencies to concept references
    for (const [adjId, similarity] of concept.adjacentConcepts.entries()) {
      if (similarity >= threshold) {
        const adjConcept = this.concepts.get(adjId);
        
        if (adjConcept) {
          similarConcepts.push([adjConcept, similarity]);
        }
      }
    }
    
    // Sort by similarity (highest first) and limit
    return similarConcepts
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }
  
  /**
   * Clear all concepts and history
   */
  clear(): void {
    this.concepts.clear();
    this.stabilityHistory.clear();
  }
}
