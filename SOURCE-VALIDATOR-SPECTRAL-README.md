# Source Validator & Spectral Monitor Integration

This document summarizes the implementation of source validation for PDFs and spectral monitoring for the concept graph, as requested in the "BOOYAH" drop.

## 1. Source Validator Integration

The source validator has been integrated into the PDF upload pipeline to ensure only high-quality documents enter the system. The integration provides:

- Quality filtering of uploaded PDFs based on domain trust, structure, and content
- Automatic rejection of low-quality documents with detailed rejection reasons
- Movement of rejected files to a separate folder for review

### Implementation Details:

- **Location**: Source validation logic is integrated in `pdf_upload_server.py`
- **Validation Criteria**: Academic sources, formal structure, relevant content areas
- **Rejection Flow**: Low-quality PDFs are moved to `uploads/rejected/` with a 202 status code
- **Monitoring**: Rejections are logged but not surfaced in the UI as requested

### Usage:

When a PDF is uploaded, the server now:
1. Saves the file to the uploads directory
2. Validates the source using `validate_source(pdf_path)`
3. If valid, processes it normally
4. If invalid, moves it to the rejected folder and returns a 202 status with rejection reason

## 2. Spectral Monitor

A spectral monitoring system has been implemented to track the health of the concept graph, detect drift, and provide real-time coherence metrics through WebSockets.

### Implementation Details:

- **Core Module**: `packages/runtime-bridge/src/SpectralMonitor.ts`
- **Frontend Integration**: `tori_chat_frontend/src/hooks/useSpectral.ts`
- **Data Storage**: Rolling history stored in memory with daily parquet files
- **Broadcast Mechanism**: WebSocket messages with type 'spectral_state'

### Key Features:

- Periodic sampling of spectral properties (5-second intervals by default)
- Drift detection with identification of drifting concepts
- Computation of order parameter and coherence scores
- Historical data storage for trend analysis
- Real-time notifications via WebSockets

### Metrics Tracked:

- **Coherence**: Overall coherence of the concept graph (0-1)
- **Order Parameter**: Kuramoto order parameter (0-1)
- **Drift Detection**: Boolean flag indicating whether drift is occurring
- **Drifting Concepts**: List of concept IDs that are drifting
- **Eigenvalues**: Spectral eigenvalues of the concept graph
- **Connectivity**: Graph connectivity metric (0-1)

### Frontend Usage:

In React components, you can use the spectral hook:

```jsx
import useSpectral from '../hooks/useSpectral';

function SpectralDisplay() {
  const { 
    spectralData,
    getCoherence,
    isDriftDetected,
    getDriftingConcepts
  } = useSpectral();
  
  return (
    <div>
      <div>Coherence: {getCoherence() ?? 'Loading...'}</div>
      {isDriftDetected() && (
        <div>
          Drift detected! Concepts affected:
          <ul>
            {getDriftingConcepts().map(c => <li key={c}>{c}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Integration Testing

To test the integration:

### Source Validator:

1. Upload a PDF through the UI or test endpoint
2. Check server logs for validation outcomes
3. Verify rejected files appear in `uploads/rejected/` directory

### Spectral Monitor:

1. Start the WebSocket server
2. Connect using any client component with the `useSpectral` hook
3. Observe spectral state updates (should see 'spectral_state' messages every 5 seconds)
4. Verify history is being stored in the spectral_history directory
