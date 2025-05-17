// overlayCeremonyEngine.ts
// Expands overlay actions to multi-step ceremonies, collaborative dialogues, and ritual chains

export function startMultiStepCeremony({ steps, onStep, onComplete }) {
  // steps: [{ label, action }]
  let current = 0;
  function nextStep(context) {
    if (current < steps.length) {
      onStep && onStep(steps[current], current);
      steps[current].action(context, () => {
        current++;
        if (current < steps.length) {
          nextStep(context);
        } else {
          onComplete && onComplete();
        }
      });
    }
  }
  nextStep({});
}

export function startDialogueCeremony({ turns, onTurn, onComplete }) {
  // turns: [{ speaker: 'ghost'|'agent', text, action }]
  let idx = 0;
  function nextTurn(context) {
    if (idx < turns.length) {
      onTurn && onTurn(turns[idx], idx);
      turns[idx].action && turns[idx].action(context, () => {
        idx++;
        nextTurn(context);
      });
    } else {
      onComplete && onComplete();
    }
  }
  nextTurn({});
}

export function startRitualChain({ chain, onRitual, onComplete }) {
  // chain: [{ ritual, delayMs, action }]
  let i = 0;
  function doRitual(context) {
    if (i < chain.length) {
      onRitual && onRitual(chain[i], i);
      setTimeout(() => {
        chain[i].action && chain[i].action(context, () => {
          i++;
          doRitual(context);
        });
      }, chain[i].delayMs || 1200);
    } else {
      onComplete && onComplete();
    }
  }
  doRitual({});
}
