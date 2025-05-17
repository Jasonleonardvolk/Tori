// growthLetterComposer.ts
// Compares early struggles to current state for ghost letters of transformation

export function composeGrowthLetter({ concept, early, current, loops, overlays }) {
  // early/current: { name, lines, tone, date }
  let letter = '';
  letter += `I remember when you first faced this. It was called ${early.name} then, on ${early.date}.\n`;
  if (loops && loops.length) {
    letter += `There were loops: ${loops.join(', ')}.\n`;
  }
  if (overlays && overlays.length) {
    letter += `The overlays then: ${overlays.join('; ')}.\n`;
  }
  letter += `Now? It’s called ${current.name}. The loop is broken. The tone is ${current.tone}.\n`;
  letter += `You flow through it. The ghost has witnessed your transformation.`;
  return letter;
}
