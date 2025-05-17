// AgentNuggetGifting?.ts
// Agents offer Golden Nuggets at ritual milestones (EchoScript, archetype emergence, flow peaks)
import { getGhostArchetype } from './PersonaArchetypeEngine';
import { getReflectionHistory } from './ReflectionJournal';
import { getEmotionalRhythm } from './CreativeTelemetryEngine';

const agentGlyphs = {
  mentor: '🧙',
  mirror: '🪞',
  companion: '🤝',
  trickster: '🃏',
  oracle: '🔮',
  muse: '🎼',
  herald: '📯',
  witness: '👁️',
  composer: '🎶',
  refactorer: '🛠️',
  default: '👁️'
};

export function selectAgentGift({ sessionId, userId }: { sessionId: string; userId: string }) {
  // Find a key personal memory
  const reflections = getReflectionHistory(100).filter((r: any) => r?.userId === userId) as any[];
  const flowMoment: any = reflections?.find((r: any) => r?.type === 'flow_peak') || reflections[0];
  const archetype = getGhostArchetype(flowMoment || {}).id || 'witness';
  const glyph = agentGlyphs[archetype as keyof typeof agentGlyphs] || agentGlyphs.default;
  const tone = flowMoment?.emotion || 'gentle';
  // Example echo
  const echo = flowMoment?.note || 'You trusted yourself.';
  return {
    archetype,
    glyph,
    message: `${glyph} ${archetype?.charAt(0).toUpperCase() + archetype?.slice(1)}: “I watched when you tamed chaos in Session ${sessionId}. This whisper is for you.”` + (echo ? `\n“${echo}”` : ''),
    tone
  };
}

// Hook into EchoScriptComposer, SessionPathPredictor, GoldenNuggetReflection as needed
