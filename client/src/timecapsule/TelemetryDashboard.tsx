// TelemetryDashboard.tsx
// Visualizes creative telemetry: concept recurrence, syntax drift, API adoption, emotion overlays
import React, { useMemo } from 'react';
import { getConceptRhythm, getStyleProfile, getAPIAffinity, getEmotionalRhythm } from './CreativeTelemetryEngine';

export default function TelemetryDashboard({ concepts = [] }) {
  // Memoize telemetry queries
  const conceptData = useMemo(() => concepts.map(c => ({ concept: c, ...getConceptRhythm(c) })), [concepts]);
  const styleProfile = useMemo(() => getStyleProfile(), []);
  const apiAffinity = useMemo(() => getAPIAffinity(), []);
  const emotionalRhythm = useMemo(() => getEmotionalRhythm(), []);

  return (
    <div style={{ background: '#23233a', color: '#ffe44e', padding: 32, borderRadius: 16, minWidth: 480, fontFamily: 'serif', boxShadow: '0 2px 24px #000a', margin: 18, maxWidth: 900 }}>
      <h2 style={{ color: '#b2f7ef', marginBottom: 16 }}>Telemetry Dashboard</h2>
      <section style={{ marginBottom: 24 }}>
        <h3 style={{ color: '#ffe44e' }}>Concept Rhythm</h3>
        <ul>
          {conceptData.map(({ concept, cadence, lastUsed, recurrence }) => (
            <li key={concept}>{concept}: {recurrence} uses, cadence ~{Math.round(cadence / 60000) || 0} min, last seen {lastUsed ? new Date(lastUsed).toLocaleString() : 'never'}</li>
          ))}
        </ul>
      </section>
      <section style={{ marginBottom: 24 }}>
        <h3 style={{ color: '#ffe44e' }}>Syntax Aesthetics</h3>
        <pre style={{ background: '#191929', color: '#b2f7ef', borderRadius: 8, padding: 12 }}>{JSON.stringify(styleProfile, null, 2)}</pre>
      </section>
      <section style={{ marginBottom: 24 }}>
        <h3 style={{ color: '#ffe44e' }}>API Affinity</h3>
        <ul>
          {apiAffinity.map(({ apiName, count, lastUsed }) => (
            <li key={apiName}>{apiName}: {count} uses, last used {lastUsed ? new Date(lastUsed).toLocaleString() : 'never'}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3 style={{ color: '#ffe44e' }}>Emotional Rhythm</h3>
        <ul>
          {Object.entries(emotionalRhythm).map(([emotion, count]) => (
            <li key={emotion}>{emotion}: {count} sessions</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
