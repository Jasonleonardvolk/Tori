// ...imports...

/*──────── new in-memory intent ring-buffer (per persona) ────────*/
const INTENT_WINDOW = 50;   // last N intents kept
const personaIntents = new Map();                     // id → [ intents ]

function pushIntent({ speaker, personaId, intentType, confidence }) {
  if (!personaIntents.has(personaId)) personaIntents.set(personaId, []);
  const buf = personaIntents.get(personaId);
  buf.push({ speaker, intentType, confidence, ts: Date.now() });
  if (buf.length > INTENT_WINDOW) buf.shift();
}

export function getIntentsForPersona(id) {
  return personaIntents.get(id) ?? [];
}

// ...existing code...

/*──────── lifecycle ────────*/
personaService.subscribe(msg => {
  if (msg.type === 'persona-updated')   updatePersona(msg.id, msg.data);
});
/* NEW: intent stream hookup */
personaService.connectIntentStream(pushIntent);
