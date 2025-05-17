/**
 * Mock components for ExecutionTracer + FieldMeditationMode tests
 */
import React from 'react';

// Mock ConceptFieldCanvas component
export const MockConceptFieldCanvas = React.forwardRef(({ conceptData, onNodeSelect }, ref) => {
  return (
    <div className="mock-concept-field-canvas" data-testid="concept-field-canvas">
      <div className="nodes-container">
        {conceptData?.nodes?.map(node => (
          <div 
            key={node.id} 
            className="node" 
            data-node-id={node.id}
            onClick={() => onNodeSelect && onNodeSelect([node.id])}
          >
            {node.label || node.id}
          </div>
        ))}
      </div>
    </div>
  );
});
MockConceptFieldCanvas.displayName = 'ConceptFieldCanvas';

// Mock FieldMeditationMode component with minimal functionality
export const MockFieldMeditationMode = ({ 
  conceptData, 
  pythonCode, 
  onDivergenceDetected 
}) => {
  return (
    <div className="field-meditation-mode" data-testid="field-meditation-mode">
      <div className="spectral-entropy-wave">Spectral entropy wave visualization</div>
      <div className="python-code">{pythonCode}</div>
      <div className="concept-visualization">
        <MockConceptFieldCanvas conceptData={conceptData} />
      </div>
      {conceptData?.divergences?.length > 0 && (
        <div className="divergence-warnings">
          <h4>Divergence Warnings</h4>
          {conceptData.divergences.map((divergence, index) => (
            <div key={index} className="divergence">
              <span className="divergence-type">{divergence.type}</span>
              <span className="divergence-node">{divergence.nodeId}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Mock ExecutionTracer component for testing
export const MockExecutionTracer = ({ events, onExecutionEvent }) => {
  return (
    <div className="execution-tracer" data-testid="execution-tracer">
      <div className="events-container">
        {events?.map((event, index) => (
          <div key={index} className="event" onClick={() => onExecutionEvent(event)}>
            {event.type}: {event.nodeId}
          </div>
        ))}
      </div>
    </div>
  );
};
