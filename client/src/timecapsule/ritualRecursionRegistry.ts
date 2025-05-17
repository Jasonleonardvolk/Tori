// ritualRecursionRegistry.ts
// Handles recursive ritual triggers: echoes, mythic recursion points, overlay-linked highlights

const recursionTriggers = [
  {
    id: 'letter_echo_highlight',
    trigger: ({ letter, file }) => letter && file && letter.includes(file),
    action: ({ file, highlight }) => highlight(file, { mode: 'echo', fx: 'ghostGlow' })
  },
  {
    id: 'mythic_recursion_point',
    trigger: ({ session }) => session && session.echoCount >= 3,
    action: ({ markRecursion }) => markRecursion({ type: 'mythic', fx: 'sigilPulse' })
  }
];

export function checkRitualRecursion(context) {
  // context: { letter, file, session, highlight, markRecursion }
  recursionTriggers.forEach(t => {
    if (t.trigger(context)) t.action(context);
  });
}
