# Stability Reasoning Integration - Complete Implementation

We've successfully implemented all the requested components from the "BOOYAH" drop, creating a complete pipeline from source validation through spectral monitoring to stability-aware reasoning.

## 1. Integration Overview

The implementation connects three critical components:

```
┌──────────────────┐    ┌───────────────────┐    ┌─────────────────────┐
│                  │    │                   │    │                     │
│  Source Validator│───▶│  Spectral Monitor ├───▶│ Stability Reasoning │
│                  │    │                   │    │                     │
└──────────────────┘    └───────────────────┘    └─────────────────────┘
```

Each component has been implemented with a focus on using the real system data rather than simulations, ensuring accurate and reliable reasoning.

## 2. Implementation Details

### 2.1 Source Validator Integration

- **Location**: Integrated in `pdf_upload_server.py`
- **Functionality**: Validates uploaded PDFs based on domain trust, structure, and content
- **Rejection Flow**: Invalid PDFs are moved to `uploads/rejected/` directory
- **Monitoring**: Rejections are logged for admin review without UI exposure

### 2.2 Spectral Monitor Implementation

- **Core Module**: `packages/runtime-bridge/src/SpectralMonitor.ts`
- **React Hook**: `tori_chat_frontend/src/hooks/useSpectral.ts`
- **Functionality**: Monitors concept graph coherence, detects drift, and broadcasts updates
- **Communication**: Uses WebSockets to send spectral state to stability bridge

### 2.3 Stability Bridge

- **Python Bridge**: `packages/runtime-bridge/python/stability_bridge.py`
- **Factory**: `ingest_pdf/stability_reasoning_factory.py`
- **Functionality**: Connects TypeScript spectral monitor to Python reasoning system
- **Data Flow**: Receives WebSocket spectral updates and applies to concept store

### 2.4 Concept Store Integration

- **Enhanced Store**: `packages/data-model/src/concept/ConceptStoreWithStability.ts`
- **Metadata Model**: Uses existing `ConceptMetadata` from `ingest_pdf/concept_metadata.py`
- **Functionality**: Extends concept store with stability metrics and tracking

## 3. Key Features

### 3.1 Source Quality Control

- Academic-grade filtering based on source trust, structure, and content
- Automatic rejection of low-quality documents
- Detailed rejection reasons with logging

### 3.2 Spectral Health Monitoring

- Real-time coherence and stability metrics
- Drift detection with concept identification
- Historical stability tracking

### 3.3 Stability-Aware Reasoning

- Concept stability verification before reasoning use
- Alternative concept routing for unstable concepts
- Confidence scoring for inferences
- Detection of phase decoherence in reasoning chains

## 4. Integration Points

### 4.1 PDF Upload → Source Validator

```python
# In pdf_upload_server.py
validation_result = validate_source(pdf_path)
if not validation_result.is_valid:
    # Move to rejected folder
    rejected_path = os.path.join(REJECTED_FOLDER, pdf_filename)
    shutil.move(pdf_path, rejected_path)
    # Return rejection info
    return jsonify({
        "status": "rejected",
        "reason": validation_result.reasons[0]
    }), 202
```

### 4.2 Spectral Monitor → Stability Bridge

```typescript
// In SpectralMonitor.ts
broadcastState(state: SpectralState): void {
  if (broadcastFn) {
    broadcastFn(MessageKind.CONCEPT_UPDATE, {
      type: 'spectral_state',
      data: state
    });
  }
}
```

### 4.3 Stability Bridge → Stability Reasoning

```python
# In stability_bridge.py
def update_stability_reasoning_context(stability_reasoning=None, concept_store=None):
    # Use actual concept store from stability reasoning
    sr = stability_reasoning or default_stability_reasoning
    store = concept_store or sr.concept_store
    
    # Apply spectral state to concepts
    return default_stability_bridge.apply_spectral_state_to_concepts(store)
```

### 4.4 Factory Integration

```python
# In stability_reasoning_factory.py
def create_integrated_stability_reasoning(...):
    # Create StabilityReasoning instance
    sr = StabilityReasoning(
        concept_store=store,
        time_context=ctx,
        logger=log,
        stability_threshold=stability_threshold,
        coherence_threshold=coherence_threshold
    )
    
    # Register for coherence break events
    default_stability_bridge.on_coherence_break(_create_coherence_break_handler(sr))
    
    # Register for regular updates
    default_stability_bridge.on_update(lambda: _update_stability_context(sr))
    
    return sr
```

## 5. Deployment Instructions

### 5.1 Environment Configuration

Set these environment variables for proper configuration:

```
# Spectral monitor configuration
SPECTRAL_WS_ENDPOINT=ws://localhost:8000/ws
SPECTRAL_SYNC_INTERVAL=5.0

# Stability thresholds
STABILITY_COHERENCE_THRESH=0.6
STABILITY_PHASE_NOISE=0.1
```

### 5.2 Startup Sequence

1. Start the WebSocket server for spectral communication
2. Initialize the backend with `stability_reasoning_factory.ensure_stability_bridge_running()`
3. Create stability-aware reasoning agents using `create_integrated_stability_reasoning()`

### 5.3 Using in Reasoning Agents

To integrate with reasoning agents:

```python
from ingest_pdf.stability_reasoning_factory import create_integrated_stability_reasoning

# Create a stability-aware reasoning system
sr = create_integrated_stability_reasoning(concept_store=my_concepts)

# Use for path creation and verification
reasoning_path = sr.create_reasoning_path(concept_chain)
strongest_path = reasoning_path.get_strongest_path()
confidence = reasoning_path.path_confidence
```

## 6. Testing

The implementation passes all critical tests:

1. ✅ Source validator correctly identifies and rejects low-quality PDFs
2. ✅ Spectral monitor accurately tracks concept drift and coherence
3. ✅ Stability reasoning provides alternate paths for unstable concepts
4. ✅ WebSocket communication properly transmits spectral updates
5. ✅ End-to-end data flow works without simulated data

## 7. Next Steps

As outlined in the recommendations document, next priorities are:

1. Admin dashboard for source validation review (~1 day)
2. Advanced visualization components for spectral data
3. Alert system for critical coherence issues
4. Custom validation thresholds via environment variables
