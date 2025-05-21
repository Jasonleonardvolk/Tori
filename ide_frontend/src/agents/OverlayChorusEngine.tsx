// OverlayChorusEngine.ts
// Composes overlays as ritual choruses—each agent a line, with tone color and glyph

const agentGlyphs = {
  ghost: '🕯️',
  architect: '🌐',
  stylist: '🖋️',
  flow: '🌊',
  historian: '📜'
};

const agentColors = {
  ghost: '#a7a3ff',
  architect: '#b2f7ef',
  stylist: '#ffe44e',
  flow: '#4ef0ff',
  historian: '#ffb347'
};

export function composeOverlayChorus(context, agentMessages) {
  // agentMessages: [{ id, message }]
  return agentMessages.map(({ id, message }) => {
    const glyph = agentGlyphs[id] || '✨';
    const color = agentColors[id] || '#fff';
    return {
      id,
      glyph,
      color,
      line: `${glyph} <span style="color:${color}">${capitalize(id)}</span>: "${message}"`
    };
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
