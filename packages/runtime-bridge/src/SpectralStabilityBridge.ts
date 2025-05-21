/**
 * SpectralStabilityBridge.ts
 * 
 * This module bridges the Spectral Monitor and the Stability-Aware Concept Store,
 * transforming spectral metrics into per-concept stability information.
 */

import { SpectralState } from './SpectralMonitor';
import { StabilityAwareConceptStore, StabilityUpdateMetrics } from '../../data-model/src/concept/ConceptStoreWithStability';

/**
 * Configuration options for the SpectralStabilityBridge
 */
export interface SpectralStabilityBridgeConfig {
  /** Weight of spectral coherence in concept stability calculation (0-1) */
  coherenceWeight: number;
  
  /** Weight of order parameter in concept stability calculation (0-1) */
  orderParameterWeight: number;
  
  /** Threshold for detecting coherence breaks */
  coherenceBreakThreshold: number;
  
  /** Minimum similarity threshold for creating concept adjacencies */
  minSimilarityThreshold: number;
}

/**
 * Default configuration for SpectralStabilityBridge
 */
const DEFAULT_CONFIG: SpectralStabilityBridgeConfig = {
  coherenceWeight: 0.7,
  orderParameterWeight: 0.3,
  coherenceBreakThreshold: 0.4,
  minSimilarityThreshold: 0.3
};

/**
 * SpectralStabilityBridge class that handles updating concept stability
 * based on spectral analysis data.
 */
export class SpectralStabilityBridge {
  private config: SpectralStabilityBridgeConfig;
  private conceptStore: StabilityAwareConceptStore;
  private previousState?: SpectralState;
  
  /**
   * Create a new SpectralStabilityBridge
   * @param conceptStore The concept store to update
   * @param config Optional configuration overrides
   */
  constructor(
    conceptStore: StabilityAwareConceptStore,
    config: Partial<SpectralStabilityBridgeConfig> = {}
  ) {
    this.conceptStore = conceptStore;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Process a new spectral state and update concept stabilities
   * @param state The spectral state to process
   * @returns Statistics about the update
   */
  processSpectralState(state: SpectralState): {
    conceptsUpdated: number;
    coherenceBreaksDetected: number;
  } {
    let coherenceBreaksDetected = 0;
    const conceptUpdates: StabilityUpdateMetrics[] = [];
    
    // Detect sudden changes in coherence if we have previous state
    if (this.previousState && state.coherence < this.previousState.coherence) {
      const coherenceDrop = this.previousState.coherence - state.coherence;
      
      // If significant drop, mark as coherence break for drifting concepts
      if (coherenceDrop > this.config.coherenceBreakThreshold) {
        coherenceBreaksDetected = state.driftingConcepts.length;
        
        // Create updates for drifting concepts with coherence breaks
        for (const conceptId of state.driftingConcepts) {
          conceptUpdates.push({
            conceptId,
            stability: this.calculateConceptStability(state, conceptId, true),
            coherence: state.coherence,
            coherenceBreak: true
          });
        }
      }
    }
    
    // Get all concept IDs from the store
    const allConcepts = this.conceptStore.getAllConcepts();
    
    // Create basic stability updates for all concepts based on global metrics
    for (const concept of allConcepts) {
      // Skip if already in updates from coherence break
      if (conceptUpdates.some(update => update.conceptId === concept.id)) {
        continue;
      }
      
      // Calculate stability based on spectral metrics
      const stability = this.calculateConceptStability(state, concept.id, false);
      
      conceptUpdates.push({
        conceptId: concept.id,
        stability,
        coherence: state.coherence
      });
    }
    
    // Process concept adjacencies based on drifting concepts
    if (state.driftingConcepts.length > 0) {
      this.processDriftingConceptsAdjacencies(state, conceptUpdates);
    }
    
    // Apply all updates to the concept store
    for (const update of conceptUpdates) {
      this.conceptStore.updateStability(update);
    }
    
    // Save current state for next comparison
    this.previousState = state;
    
    return {
      conceptsUpdated: conceptUpdates.length,
      coherenceBreaksDetected
    };
  }
  
  /**
   * Calculate stability for a specific concept based on spectral state
   * @param state The spectral state
   * @param conceptId The concept ID
   * @param isDrifting Whether the concept is currently drifting
   * @returns The calculated stability value (0-1)
   */
  private calculateConceptStability(
    state: SpectralState,
    conceptId: string,
    isDrifting: boolean
  ): number {
    // Base stability from global metrics
    const baseStability = (
      state.coherence * this.config.coherenceWeight +
      state.orderParameter * this.config.orderParameterWeight
    );
    
    // Penalty for drifting concepts
    const driftPenalty = isDrifting ? 0.3 : 0;
    
    // Get current stability for smoothing
    const currentConcept = this.conceptStore.getConcept(conceptId);
    const currentStability = currentConcept?.stability ?? 0.5;
    
    // Calculate new stability with:
    // 1. Base from spectral metrics
    // 2. Drift penalty if applicable
    // 3. Smoothing with current stability (70% new, 30% old)
    const rawStability = Math.max(0, baseStability - driftPenalty);
    const smoothedStability = 0.7 * rawStability + 0.3 * currentStability;
    
    // Ensure in range [0, 1]
    return Math.max(0, Math.min(1, smoothedStability));
  }
  
  /**
   * Process adjacencies between drifting concepts and other concepts
   * @param state The spectral state
   * @param updates The current batch of concept updates
   */
  private processDriftingConceptsAdjacencies(
    state: SpectralState,
    updates: StabilityUpdateMetrics[]
  ): void {
    const driftingConcepts = new Set(state.driftingConcepts);
    
    // For each drifting concept, calculate adjacencies with other concepts
    for (const conceptId of driftingConcepts) {
      const update = updates.find(u => u.conceptId === conceptId);
      
      if (!update) {
        continue;
      }
      
      // Initialize adjacencies map if needed
      if (!update.adjacencies) {
        update.adjacencies = new Map();
      }
      
      // Get all other concepts
      const allConcepts = this.conceptStore.getAllConcepts();
      
      // Calculate adjacencies (simulating based on concept names for now)
      // In a real implementation, this would use embedding similarity
      for (const otherConcept of allConcepts) {
        if (otherConcept.id === conceptId) {
          continue; // Skip self
        }
        
        // Calculate similarity based on stability difference
        // This is a simplification - real implementation would use embeddings
        const otherUpdate = updates.find(u => u.conceptId === otherConcept.id);
        const otherStability = otherUpdate?.stability ?? otherConcept.stability;
        
        // Similar stability suggests similar concepts in this simple model
        // Real implementation would use proper similarity metrics
        const stabilityDiff = Math.abs(update.stability - otherStability);
        const similarity = Math.max(0, 1 - stabilityDiff);
        
        // Only store significant similarities
        if (similarity > this.config.minSimilarityThreshold) {
          update.adjacencies.set(otherConcept.id, similarity);
        }
      }
    }
  }
  
  /**
   * Update the bridge configuration
   * @param config New configuration options (partial)
   */
  updateConfig(config: Partial<SpectralStabilityBridgeConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get the current configuration
   * @returns The current configuration
   */
  getConfig(): SpectralStabilityBridgeConfig {
    return { ...this.config };
  }
}

/**
 * Create and configure a SpectralStabilityBridge
 * @param conceptStore The concept store to update
 * @param config Optional configuration
 * @returns Configured SpectralStabilityBridge instance
 */
export function createSpectralStabilityBridge(
  conceptStore: StabilityAwareConceptStore,
  config?: Partial<SpectralStabilityBridgeConfig>
): SpectralStabilityBridge {
  return new SpectralStabilityBridge(conceptStore, config);
}

/**
 * Utility function to update concept stabilities from spectral state
 * @param state The spectral state to use for updates
 * @param conceptStore The concept store to update
 * @param config Optional configuration
 * @returns Statistics about the update
 */
export function updateConceptStabilities(
  state: SpectralState,
  conceptStore: StabilityAwareConceptStore,
  config?: Partial<SpectralStabilityBridgeConfig>
): { conceptsUpdated: number; coherenceBreaksDetected: number } {
  const bridge = new SpectralStabilityBridge(conceptStore, config);
  return bridge.processSpectralState(state);
}
