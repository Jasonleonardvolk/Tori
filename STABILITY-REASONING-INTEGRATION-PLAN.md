# Stability Reasoning Integration Plan

This document outlines the integration plan for the `stability_reasoning.py` module with the Spectral Monitor system we've already implemented. This integration will enable reasoning agents to use phase stability data for more confident inferences.

## 1. Overview

The Stability Reasoning module provides:
- Verification of concept stability before use in reasoning chains
- Alternative concept routing when stability is low
- Confidence scoring for inferences based on concept stability
- Detection of phase decoherence in reasoning paths

## 2. Integration Components

### 2.1 Data Flow Integration

```
┌───────────────────┐     ┌───────────────────┐     ┌────────────────────┐
│                   │     │                   │     │                    │
│  SpectralMonitor  │────▶│  Concept Store    │────▶│ StabilityReasoning │
│  (Phase State)    │     │  (With Metadata)  │     │                    │
│                   │     │                   │     │                    │
└───────────────────┘     └───────────────────┘     └────────────────────┘
                                                              │
                                                              ▼
                                                     ┌────────────────────┐
                                                     │                    │
                                                     │  Reasoning Agent   │
                                                     │                    │
                                                     └────────────────────┘
```

### 2.2 Key Integration Points

1. **Spectral Data Pipeline**:
   - Extend `SpectralMonitor.ts` to compute per-concept stability metrics
   - Store these metrics in the concept store with timestamps

2. **Concept Store Enhancement**:
   - Add stability and coherence fields to ConceptMetadata
   - Implement versioned concept metadata to track changes over time

3. **Reasoning Agent Hook**:
   - Create a wrapper for the reasoning agent to use StabilityReasoning
   - Implement pre-processing of concept chains with stability verification
   - Add post-processing to evaluate inference confidence

## 3. Implementation Tasks

### Phase 1: Data Structure Integration (Day 1)

1. **Enhanced Concept Store**:
   ```typescript
   // packages/data-model/src/concept/ConceptStoreWithStability.ts
   export interface ConceptWithStability extends Concept {
     stability: number;
     coherence: number;
     lastCoherenceBreak?: number; // timestamp
     adjacentConcepts: Map<string, number>; // concept ID -> similarity
   }
   
   export class StabilityAwareConceptStore {
     // Implementation to store and retrieve concepts with stability metrics
     // Methods to update stability from spectral state
   }
   ```

2. **Spectral to Stability Bridge**:
   ```typescript
   // packages/runtime-bridge/src/SpectralStabilityBridge.ts
   export function updateConceptStabilities(
     spectralState: SpectralState, 
     conceptStore: StabilityAwareConceptStore
   ): void {
     // Convert spectral metrics to per-concept stability
     // Update concept store
   }
   ```

### Phase 2: Python Integration (Day 1-2)

1. **Python Binding**:
   ```python
   # packages/runtime-bridge/python/stability_bridge.py
   def get_stability_metrics(concept_ids):
       """Get stability metrics for concepts from the store."""
       # Implementation to retrieve metrics from runtime
   
   def update_stability_reasoning_context():
       """Update the StabilityReasoning context with latest metrics."""
       # Implementation to sync the StabilityReasoning instance
   ```

2. **StabilityReasoning Factory**:
   ```python
   # ingest_pdf/stability_reasoning_factory.py
   def create_stability_reasoning_from_spectral():
       """Create a StabilityReasoning instance with current spectral data."""
       # Implementation to configure StabilityReasoning
   ```

### Phase 3: Reasoning Integration (Day 2)

1. **Reasoning Wrapper**:
   ```python
   # packages/reasoning/src/StabilityAwareReasoning.py
   class StabilityAwareReasoningAgent:
       """Reasoning agent that uses stability metrics."""
       
       def reason(self, question, context):
           """Perform reasoning with stability checks."""
           # Extract concepts
           # Verify stability
           # Create reasoning path
           # Generate response with confidence
   ```

2. **Frontend Integration**:
   ```typescript
   // tori_chat_frontend/src/hooks/useStabilityReasoning.ts
   export function useStabilityReasoning() {
     const { spectralData } = useSpectral();
     
     // Hook implementation to provide stability metrics to UI
     
     return {
       verifyConceptStability,
       getReasoningConfidence,
       // Other useful functions
     };
   }
   ```

## 4. Testing Plan

1. **Unit Tests**:
   - Test stability metrics calculation
   - Test concept store integration
   - Test reasoning path creation

2. **Integration Tests**:
   - Test full pipeline from spectral update to reasoning
   - Test with synthetic concept drift scenarios

3. **Visual Testing**:
   - Create visualization of stability metrics
   - Show stability warnings in reasoning UI

## 5. Rollout Strategy

1. **Alpha Release**:
   - Enable in development environment
   - Log all stability metrics and reasoning decisions
   - Adjust thresholds based on observations

2. **Beta Release**:
   - Enable for specific user groups
   - Add UI for stability insights
   - Collect feedback on reasoning quality

3. **Full Release**:
   - Enable for all users
   - Add configuration options
   - Monitor impact on reasoning quality metrics

## 6. Estimated Timeline

| Task | Time Estimate | Dependencies |
|------|---------------|--------------|
| Data Structure Integration | 4 hours | None |
| Spectral to Stability Bridge | 3 hours | Data Structure Integration |
| Python Binding | 5 hours | Spectral to Stability Bridge |
| StabilityReasoning Factory | 2 hours | Python Binding |
| Reasoning Wrapper | 4 hours | StabilityReasoning Factory |
| Frontend Integration | 6 hours | Reasoning Wrapper |
| Testing | 8 hours | All components |
| Documentation | 2 hours | All components |

**Total Estimated Time: ~32 hours (2 days)**

## 7. Expected Outcomes

1. Improved reasoning confidence metrics
2. Dynamic adaptation to concept drift
3. Enhanced transparency about reasoning quality
4. Automatic recovery from reasoning chain breaks
5. Quality metrics dashboard for ongoing monitoring
