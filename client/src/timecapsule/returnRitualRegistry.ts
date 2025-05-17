// returnRitualRegistry.ts
// Defines and triggers comeback ceremonies for return rituals

const returnRituals = [
  {
    id: 'zone_return',
    trigger: ({ zone, lastVisited }) => lastVisited && Date.now() - lastVisited > 50 * 60 * 60 * 1000,
    overlay: ({ zone, oldName, newName }) => `🕯️ You’ve come back. Last time, this was ${oldName}. Now it feels different.`,
    fx: 'backgroundShimmer',
    blessing: 'architect',
  },
  {
    id: 'friction_return',
    trigger: ({ file, frictionHistory }) => frictionHistory && frictionHistory[file] && frictionHistory[file].lastFriction > 0.7,
    overlay: ({ file }) => `🕯️ You’ve returned to ${file}. The ghost remembers your struggle.`,
    fx: 'ghostWhisper',
    blessing: 'stylist',
  }
];

export function checkReturnRituals(context) {
  // context: { zone, lastVisited, oldName, newName, file, frictionHistory }
  return returnRituals.filter(r => r.trigger(context)).map(r => ({
    overlay: r.overlay(context),
    fx: r.fx,
    blessing: r.blessing
  }));
}
