// ritualLearningEngine.tsx
// System learns from ritual outcomes to suggest better/novel ceremonies; animates agent/ghost improvisation in real time

import { selectCeremonyTemplate, generateCeremony } from './expandedCeremonyTemplateLibrary';

// --- Real-time Agent/Ghost Improvisation Animation ---
import React, { useState, useEffect } from 'react';

const ritualOutcomeMemory = [];

export function recordRitualOutcome({ templateId, outcome, mood, context, agentState, userFeedback, timestamp }) {
  ritualOutcomeMemory.push({ templateId, outcome, mood, context, agentState, userFeedback, timestamp: timestamp || Date.now() });
}

export function suggestAdaptiveRitual({ mood, context, agentState, userProposal, agentProposal, pastCeremonies, date, session }) {
  // Analyze ritual outcomes for this mood/context
  const relevant = ritualOutcomeMemory.filter(r => r.mood === mood && (!context || JSON.stringify(r.context) === JSON.stringify(context)));
  // Prefer rituals with positive outcomes or user feedback
  const positive = relevant.filter(r => r.outcome === 'positive' || (r.userFeedback && r.userFeedback.positive));
  if (positive.length) {
    // Suggest most recent positive template
    const last = positive[positive.length - 1];
    return selectCeremonyTemplate({ ...last, mood, context, agentState, userProposal, agentProposal, pastCeremonies, date, session });
  }
  // Otherwise, improvise
  if (agentState && agentState.improv) {
    return selectCeremonyTemplate({ agentState: { improv: agentState.improv }, pastCeremonies });
  }
  // Fallback
  return selectCeremonyTemplate({ mood, context, agentState, userProposal, agentProposal, pastCeremonies, date, session });
}

export function runAdaptiveRitual(suggestionContext, { onStep, onComplete }) {
  const template = suggestAdaptiveRitual(suggestionContext);
  generateCeremony({ ...suggestionContext, ...template }, { onStep, onComplete });
}

export function AgentGhostImprov({ improv, mood, arc, onImprovComplete }) {
  // improv: string (improvised ritual/phrase), mood: string, arc: string
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      onImprovComplete && onImprovComplete();
    }, 3200);
    return () => clearTimeout(t);
  }, [improv, mood, arc, onImprovComplete]);

  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: 38,
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#23233a',
      color: '#ffe44e',
      borderRadius: 16,
      padding: '18px 38px',
      fontSize: '1.11em',
      boxShadow: '0 2px 16px #0008',
      fontFamily: 'serif',
      zIndex: 9999,
      animation: 'improvFadeIn 0.7s',
      textAlign: 'center',
    }}>
      <span style={{ color: '#b2f7ef', fontWeight: 600, marginRight: 8 }}>{mood ? `[${mood}]` : ''}</span>
      <span>{improv}</span>
      <div style={{ color: '#a7a3ff', fontSize: '0.97em', marginTop: 6 }}>{arc ? arc : ''}</div>
      <style>{`
        @keyframes improvFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
