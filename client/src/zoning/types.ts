// types.ts
// Core Zoning Language (ZL) types for agentic conceptual neighborhoods

export type AdaptiveRule = {
  kind: "error_streak" | "coedit_threshold" | "oscillator_sync",
  params: Record<string, any>,
  onMatch?: string // overlay/action/note trigger
};

export type ZLZone = {
  id: string,
  label: string,
  concepts: string[],
  anchor?: string, // file or symbol
  color?: string,
  tone?: "friction" | "flow" | "exploratory" | "neutral",
  oscillator?: string,
  phaseWindow?: [number, number], // 0.0 to 1.0 cycle segment
  relatesTo?: string[], // other zone IDs
  adaptiveRules?: AdaptiveRule[],
  decay?: boolean,
  inferred?: boolean
};
