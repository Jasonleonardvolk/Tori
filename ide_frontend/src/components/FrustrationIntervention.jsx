// FrustrationIntervention.jsx
// Reactively offers empathy-aware suggestions based on frustration level
import React, { useEffect, useState } from 'react';
import { getFrustrationMetrics, estimateFrustrationLevel, isFlowState } from '../services/frustrationMonitor';

const SUGGESTIONS = [
  {
    key: 'debug',
    text: "Hey, looks like you've run into this error a few times. Want a quick debug strategy?",
    condition: metrics => metrics.repeatErrors > 2
  },
  {
    key: 'break',
    text: "You've been hammering this for a while. Want to review from a fresh angle?",
    condition: metrics => metrics.runSpam > 3 || metrics.rapidFileToggles > 3
  },
  {
    key: 'recall',
    text: m => `Earlier, you had trouble with ${m.lastError || 'this module'}. I’ve kept a quick note — want to revisit it?`,
    condition: metrics => metrics.repeatErrors > 0 && metrics.timeSinceLastSuccess > 120
  }
];

export default function FrustrationIntervention() {
  const [metrics, setMetrics] = useState(getFrustrationMetrics());
  const [level, setLevel] = useState(estimateFrustrationLevel(metrics));
  const [flow, setFlow] = useState(isFlowState(metrics));
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const m = getFrustrationMetrics();
      setMetrics(m);
      setLevel(estimateFrustrationLevel(m));
      setFlow(isFlowState(m));
      // Pick first matching suggestion
      const s = SUGGESTIONS.find(sug => typeof sug.condition === 'function' && sug.condition(m));
      setSuggestion(s ? (typeof s.text === 'function' ? s.text(m) : s.text) : null);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  if (flow || !suggestion || level < 2) return null;

  return (
    <div style={{
      position: 'fixed',
      left: 350,
      top: 60,
      background: '#e3f2fd',
      border: '1px solid #90caf9',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(33,150,243,0.08)',
      zIndex: 10010,
      padding: 18,
      fontFamily: 'sans-serif',
      minWidth: 280,
      maxWidth: 350,
      color: '#1565c0',
      fontSize: 15
    }}>
      <span role="img" aria-label="soft glance" style={{marginRight:8}}>👀</span>
      {suggestion}
    </div>
  );
}
