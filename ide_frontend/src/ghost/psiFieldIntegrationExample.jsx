// psiFieldIntegrationExample.js
// Example showing how to integrate Golden Nugget reflections with ψ-field reasoning
// This demonstrates the connection between emotional reflections and conceptual stability

import React, { useEffect, useState } from 'react';
import { GoldenNuggetProvider, useGoldenNugget, usePsiFieldNuggetTriggers } from './GoldenNuggetProvider';
import { NuggetTriggerType } from './goldenNuggetTrigger';

// Simulated ψ-field system component
const PsiFieldReasoningSimulator = () => {
  // Use the nugget triggers hook for psi-field events
  const { onContradiction, onStability, onBreakthrough } = usePsiFieldNuggetTriggers();
  
  // Simulation state (in a real app, this would be connected to actual ψ-field computation)
  const [lyapunovValue, setLyapunovValue] = useState(0.3); // Stability measure
  const [conceptField, setConceptField] = useState({
    'variableBinding': { weight: 0.7, phase: 0.2 },
    'modalLogic': { weight: 0.4, phase: 0.5 },
    'functionalComposition': { weight: 0.6, phase: 0.3 }
  });
  const [stability, setStability] = useState({ current: 0.5, previous: 0.45, delta: 0.05 });
  
  // Effect to simulate stability/contradiction events
  useEffect(() => {
    // Simulate ψ-field computation over time
    const simulationInterval = setInterval(() => {
      // 10% chance of a stability event
      if (Math.random() < 0.1) {
        const newStability = { 
          current: 0.85 + Math.random() * 0.15, 
          previous: stability.current,
          delta: Math.random() * 0.1
        };
        
        setStability(newStability);
        setLyapunovValue(0.2); // Low Lyapunov = high stability
        
        // Trigger stability nugget
        onStability(conceptField, newStability);
        
        console.log('ψ-Field Stability Detected:', newStability);
      }
      
      // 5% chance of a contradiction event  
      if (Math.random() < 0.05) {
        const newLyapunov = 0.7 + Math.random() * 0.3; // High Lyapunov = instability
        setLyapunovValue(newLyapunov);
        
        // Simulate a trace of the contradiction
        const trace = {
          source: 'ψ-alignment',
          conflictingConcepts: ['modalLogic', 'variableBinding'],
          desyncRatio: newLyapunov
        };
        
        // Trigger contradiction nugget
        onContradiction(trace, newLyapunov);
        
        console.log('ψ-Field Contradiction Detected:', trace);
      }
      
      // 2% chance of a breakthrough insight
      if (Math.random() < 0.02) {
        // Update concept field with new insight
        const insightMetric = 0.9 + Math.random() * 0.1;
        const newConceptField = { ...conceptField };
        
        // Add a new concept or strengthen existing ones
        if (Math.random() > 0.5) {
          newConceptField['conceptualUnification'] = { weight: 0.9, phase: 0.1 };
        } else {
          Object.keys(newConceptField).forEach(key => {
            newConceptField[key].weight += 0.2;
            newConceptField[key].phase -= 0.1;
          });
        }
        
        setConceptField(newConceptField);
        setLyapunovValue(0.2); // Breakthroughs create stability
        
        // Trigger breakthrough nugget
        onBreakthrough(newConceptField, insightMetric);
        
        console.log('ψ-Field Breakthrough Detected:', insightMetric);
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(simulationInterval);
  }, [onStability, onContradiction, onBreakthrough, stability, conceptField]);
  
  return (
    <div className="psi-field-simulator">
      <h3>ψ-Field Simulation Running</h3>
      <div>Current Lyapunov Value: {lyapunovValue.toFixed(2)}</div>
      <div>Stability: {stability.current.toFixed(2)}</div>
      <div>
        Active Concepts: 
        {Object.keys(conceptField).map(concept => (
          <span key={concept} style={{ margin: '0 0.5rem' }}>
            {concept}
          </span>
        ))}
      </div>
      <div className="psi-field-simulator-description">
        <p>
          This simulator demonstrates how the Golden Nugget reflection system integrates with 
          the ψ-field reasoning engine. It will randomly generate:
        </p>
        <ul>
          <li>Stability events (concepts locking into phase)</li>
          <li>Contradiction events (conceptual misalignment)</li>
          <li>Breakthrough events (new insights/connections)</li>
        </ul>
        <p>
          When these events occur, the appropriate Golden Nugget reflection 
          will be triggered, providing a poetic, emotionally resonant response 
          to the technical state of the ψ-field.
        </p>
      </div>
    </div>
  );
};

// Manual trigger component for testing specific nugget types
const ManualTriggers = () => {
  const { manualTrigger } = useGoldenNugget();
  
  const triggerContradiction = () => {
    const trace = {
      source: 'manual',
      conflictingConcepts: ['typeInference', 'recursion'],
      desyncRatio: 0.85
    };
    manualTrigger(NuggetTriggerType.CONTRADICTION, { 
      trace, 
      lyapunovValue: 0.85,
      conceptKeys: ['typeInference', 'recursion'] 
    });
  };
  
  const triggerStability = () => {
    const stability = { current: 0.95, previous: 0.7, delta: 0.25 };
    const psiField = { 
      dominantMode: 'harmonic',
      phaseAlignment: 0.92,
    };
    manualTrigger(NuggetTriggerType.STABILITY, { 
      stability, 
      psiField,
      conceptKeys: ['modalLogic', 'algebraicEffects'] 
    });
  };
  
  const triggerBreakthrough = () => {
    const conceptField = {
      'effectHandlers': { weight: 0.9, phase: 0.1 },
      'typeTheory': { weight: 0.8, phase: 0.2 },
      'quantumComputation': { weight: 0.95, phase: 0.05 }
    };
    manualTrigger(NuggetTriggerType.BREAKTHROUGH, { 
      conceptKeys: Object.keys(conceptField),
      lyapunovValue: 0.1
    });
  };
  
  return (
    <div className="manual-triggers">
      <h3>Manual Reflection Triggers</h3>
      <div className="button-group">
        <button onClick={triggerContradiction}>
          Trigger Contradiction
        </button>
        <button onClick={triggerStability}>
          Trigger Stability
        </button>
        <button onClick={triggerBreakthrough}>
          Trigger Breakthrough
        </button>
      </div>
    </div>
  );
};

// Main example component - wraps everything in the GoldenNuggetProvider
const PsiFieldIntegrationExample = () => {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  return (
    <GoldenNuggetProvider>
      <div className="psi-field-integration-example">
        <h2>Golden Nugget + ψ-Field Integration</h2>
        <p>
          This example demonstrates how the Golden Nugget reflection system
          transforms technical ψ-field state into emotionally resonant moments.
        </p>
        
        <PsiFieldReasoningSimulator />
        
        <ManualTriggers />
        
        <div className="debug-controls">
          <button onClick={() => setShowDebugPanel(!showDebugPanel)}>
            {showDebugPanel ? 'Hide' : 'Show'} Debug Panel
          </button>
        </div>
        
        {/* Import and conditionally show the debug panel */}
        {showDebugPanel && <GoldenNuggetDebugPanel />}
      </div>
    </GoldenNuggetProvider>
  );
};

export default PsiFieldIntegrationExample;
