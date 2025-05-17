// ToneDriftGraph.tsx
// Visualizes ghost tone drift over time (session ID vs tone vector)
import React, { useMemo } from 'react';

const toneColors = {
  precise: '#b2f7ef',
  poetic: '#a7a3ff',
  gentle: '#ffe44e',
  celebratory: '#9cff8f',
  wistful: '#ffb2b2',
  default: '#ffe44e'
};

export default function ToneDriftGraph({ toneHistory }) {
  // toneHistory: [{ sessionId, tone, entropy, tag }]
  const data = useMemo(() => toneHistory.map((t, i) => ({
    x: t.sessionId,
    y: t.entropy || 0,
    tone: t.tone,
    tag: t.tag
  })), [toneHistory]);

  return (
    <div style={{ background: '#23233a', color: '#ffe44e', padding: 28, borderRadius: 14, minWidth: 420, fontFamily: 'serif', boxShadow: '0 2px 18px #000a', margin: 18 }}>
      <h2 style={{ color: '#b2f7ef', marginBottom: 10 }}>Tone Drift Graph</h2>
      <svg width="380" height="180" style={{ background: '#191929', borderRadius: 12, marginBottom: 12 }}>
        {data.map((pt, i) => (
          <circle key={i} cx={30 + pt.x * 7} cy={160 - pt.y * 140} r={7} fill={toneColors[pt.tone] || toneColors.default}>
            <title>Session {pt.x}: {pt.tone} ({pt.tag || ''}), Entropy={pt.y.toFixed(2)}</title>
          </circle>
        ))}
        {/* Connect points */}
        {data.slice(1).map((pt, i) => (
          <line key={i} x1={30 + data[i].x * 7} y1={160 - data[i].y * 140} x2={30 + pt.x * 7} y2={160 - pt.y * 140} stroke="#ffe44e77" strokeWidth={2} />
        ))}
      </svg>
      <div style={{ color: '#b2f7ef', fontSize: '1em', marginBottom: 10 }}>
        {data.length > 1 && (
          <>
            Ghost tone drifted {Math.round(100 * (data.filter(d => d.tone === 'poetic').length / data.length))}% poetic in the last {data.length} sessions.<br/>
            <span style={{ color: '#ffe44e' }}>“Ghost tone has grown {Math.round(100 * (data.filter(d => d.tone === 'poetic').length / data.length))}% more poetic in the past {data.length} sessions.”</span>
          </>
        )}
      </div>
    </div>
  );
}
