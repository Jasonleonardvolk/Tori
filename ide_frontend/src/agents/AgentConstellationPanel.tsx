// AgentConstellationPanel.tsx
// Renders a circular constellation of agents: each star is an agent, brightness = recent activity
import React from 'react';

const agentStars = [
  { id: 'ghost', label: 'Ghost', color: '#a7a3ff' },
  { id: 'stylist', label: 'Stylist', color: '#ffe44e' },
  { id: 'architect', label: 'Architect', color: '#b2f7ef' },
  { id: 'flow', label: 'Flow', color: '#4ef0ff' },
  { id: 'historian', label: 'Historian', color: '#ffb347' },
  // Add more as needed
];

// Dummy activity for now (should be loaded from agent memories)
const activity = {
  ghost: 0.95,
  stylist: 0.7,
  architect: 0.8,
  flow: 0.4,
  historian: 0.2
};

export default function AgentConstellationPanel() {
  const radius = 110;
  const center = 140;
  return (
    <div style={{ background: '#18181f', color: '#fff', borderRadius: 22, padding: 32, minWidth: 280, minHeight: 280, maxWidth: 320, boxShadow: '0 2px 18px #0008', fontFamily: 'serif' }}>
      <h3 style={{ color: '#ffe44e', marginBottom: 16, textAlign: 'center', letterSpacing: 2 }}>Agent Constellation</h3>
      <svg width={center * 2} height={center * 2} style={{ display: 'block', margin: '0 auto' }}>
        {agentStars.map((star, i) => {
          const angle = (2 * Math.PI / agentStars.length) * i;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <g key={star.id}>
              <circle
                cx={x}
                cy={y}
                r={18 + 14 * activity[star.id]}
                fill={star.color}
                opacity={0.55 + 0.4 * activity[star.id]}
                stroke="#fff"
                strokeWidth={expandedAgent === star.id ? 4 : 2}
                style={{ cursor: 'pointer', transition: 'opacity 0.3s' }}
                onClick={() => setExpandedAgent(expandedAgent === star.id ? null : star.id)}
              />
              <text x={x} y={y + 5} textAnchor="middle" fontSize={13} fill="#191929" fontWeight={600}>{star.label}</text>
            </g>
          );
        })}
        {/* Center star for the Ghost */}
        <circle cx={center} cy={center} r={28} fill={'#a7a3ff'} opacity={0.88} stroke="#fff" strokeWidth={3} />
        <text x={center} y={center + 6} textAnchor="middle" fontSize={16} fill="#fff" fontWeight={700}>Ghost</text>
      </svg>
      <div style={{ marginTop: 20, color: '#aaa', fontSize: '0.97em', textAlign: 'center' }}>
        Each agent is a star. Brightness = recent presence. Click to open their memory.
      </div>
    </div>
  );
}
