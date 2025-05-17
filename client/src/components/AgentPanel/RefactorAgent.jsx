import React, { useState, useEffect } from 'react';
import './AgentPanel.css';
import { GuardianOverlay } from './GuardianOverlay';
import { usePersona } from '../PersonaSelector/PersonaContext';
import { scoreSocialImpact } from '../../services/socialImpactScorer.js';

/**
 * RefactorAgent Component
 * 
 * Shows refactoring suggestions from the agent.
 * Displays code clusters and patterns that could be optimized.
 */
const RefactorAgent = ({ mode }) => {
  // State for refactor suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockedSuggestion, setBlockedSuggestion] = useState(null);
  const { currentPersona } = usePersona();

  // Load suggestions on mount and when mode changes
  useEffect(() => {
    const loadSuggestions = async () => {
      setLoading(true);
      // In a real implementation, this would fetch from an actual service
      // const data = await refactorService.getSuggestions(mode);
      // For demo, use mock data
      setTimeout(() => {
        const personaBias = currentPersona && currentPersona.traits && currentPersona.traits.role === 'ethics-reviewer'
          ? { pro: 1, anti: 1.5 }
          : 1;
        const mockSuggestions = [
          {
            id: 'refactor-1',
            title: '"loop-core" → low entropy, high Kⱼⱼ cohesion',
            type: 'cluster',
            description: 'The loop-core functions show strong spectral alignment and low entropy, indicating they could be extracted into a dedicated module.',
            metrics: {
              entropy: -0.16,
              koopmamMode: 2,
              confidence: 0.85
            },
            actions: [
              { id: 'extract', label: 'Extract module', primary: true },
              { id: 'label', label: 'Label attractor', primary: false },
              { id: 'ignore', label: 'Ignore', primary: false }
            ],
            code: `
// Suggested refactor pattern:
function processLoop(items, options) {
  // Extract core loop functionality from:
  // - iterateItems()
  // - processIterations()
  // - loopTransform()
}
            `
          },
          {
            id: 'refactor-2',
            title: '"token-auth" → 3-phase aligned functions',
            type: 'phase-alignment',
            description: 'Three authentication functions with closely aligned phase values (within 0.1π) suggest they should be grouped together for maintainability.',
            metrics: {
              phaseVariance: 0.08,
              koopmamMode: 1,
              confidence: 0.78
            },
            actions: [
              { id: 'group', label: 'Group functions', primary: true },
              { id: 'label', label: 'Label phase', primary: false },
              { id: 'ignore', label: 'Ignore', primary: false }
            ],
            code: `
// Example phase-aligned functions:
function loginPhaseA() {}
function loginPhaseB() {}
function loginPhaseC() {}
            `
          }
        ];
        setSuggestions(
          mockSuggestions.map(s => {
            const impact = scoreSocialImpact(s, personaBias);
            return {
              ...s,
              socialImpact: impact.classification,
              socialImpactScore: impact.score,
              socialImpactRationale: impact.rationale
            };
          })
        );
        setLoading(false);
      }, 100);
    };
    loadSuggestions();
  }, [mode, currentPersona]);

  const handleAction = (suggestionId, actionId) => {
    // Find the suggestion
    const suggestion = suggestions.find(s => s.id === suggestionId);
    // Guardian overlay logic
    if (suggestion && suggestion.socialImpact === 'anti' && suggestion.socialImpactScore < 0) {
      setBlockedSuggestion(suggestion);
      return;
    }
    // Handle user action on suggestion (extract, label, ignore, etc.)
    // For demo, just log
    console.log(`Action '${actionId}' on suggestion '${suggestionId}'`);
  };

  // GuardianOverlay handlers
  const handleGuardianProceed = () => {
    // User chooses to proceed anyway
    if (blockedSuggestion) {
      // For demo, just log
      console.log('User overrode Guardian block:', blockedSuggestion.id);
      setBlockedSuggestion(null);
      // Here you could continue with the action
    }
  };
  const handleGuardianCancel = () => {
    setBlockedSuggestion(null);
  };

  return (
    <div className="agent-panel">
      <h2>Refactor Suggestions</h2>
      {loading && <div className="agent-loading">Loading suggestions...</div>}
      {!loading && suggestions.length === 0 && (
        <div className="agent-empty">No suggestions found.</div>
      )}
      {!loading && suggestions.map(suggestion => (
        <div key={suggestion.id} className="agent-suggestion">
          <div className="agent-suggestion-title">{suggestion.title}</div>
          <div className="agent-suggestion-desc">{suggestion.description}</div>
          {/* ...metrics and actions... */}
          <div className="agent-suggestion-actions">
            {suggestion.actions.map(action => (
              <button
                key={action.id}
                className={`agent-action-button ${
                  action.primary ? 'agent-action-primary' : 'agent-action-secondary'
                }`}
                onClick={() => handleAction(suggestion.id, action.id)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {/* GuardianOverlay modal */}
      {blockedSuggestion && (
        <GuardianOverlay
          suggestion={blockedSuggestion}
          onProceed={handleGuardianProceed}
          onCancel={handleGuardianCancel}
        />
      )}
      {mode === 'active' && (
        <div className="agent-info-message">
          <p>
            <strong>Active Mode:</strong> Refactor Agent is analyzing code patterns and will suggest improvements
            as they are detected. Adjust sensitivity in settings.
          </p>
        </div>
      )}
      {mode === 'autopilot' && (
        <div className="agent-info-message">
          <p>
            <strong>Autopilot Mode:</strong> Safe refactors with high confidence will be applied automatically.
            Review settings to adjust thresholds.
          </p>
        </div>
      )}
    </div>
  );
};

export default RefactorAgent;
