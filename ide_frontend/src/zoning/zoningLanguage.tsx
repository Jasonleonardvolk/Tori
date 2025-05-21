// zoningLanguage.ts
// Zoning Language (ZL) parser to AST (ZLZone[]), now with AdaptiveRule parsing
import { ZLZone, AdaptiveRule } from './types';

// Minimal parser: parses zone blocks, now parses adaptiveRules blocks (Phase 1.5)
export function parseZoningLanguage(zlText: string): ZLZone[] {
  const zones: ZLZone[] = [];
  const zoneRegex = /zone\s+"([^"]+)"\s*{([\s\S]*?)}/g;
  let match;
  while ((match = zoneRegex.exec(zlText))) {
    const [, label, body] = match;
    const zone: Partial<ZLZone> = { label, concepts: [] };
    let adaptiveRules: AdaptiveRule[] = [];
    body.split(/\n|;/).forEach(line => {
      const l = line.trim();
      if (l.startsWith('concepts:')) {
        zone.concepts = l.match(/\[([^\]]+)\]/)?.[1].split(',').map(s => s.trim().replace(/"/g, '')) || [];
      } else if (l.startsWith('anchor:')) {
        zone.anchor = l.split(':')[1].trim().replace(/"/g, '');
      } else if (l.startsWith('color:')) {
        zone.color = l.split(':')[1].trim().replace(/"/g, '');
      } else if (l.startsWith('tone:')) {
        zone.tone = l.split(':')[1].trim().replace(/"/g, '') as ZLZone['tone'];
      } else if (l.startsWith('oscillator:')) {
        zone.oscillator = l.split(':')[1].trim().replace(/"/g, '');
      } else if (l.startsWith('phase_window:')) {
        zone.phaseWindow = l.match(/\[([^\]]+)\]/)?.[1].split(',').map(s => parseFloat(s.trim())) as [number, number];
      } else if (l.startsWith('relates_to:')) {
        zone.relatesTo = l.match(/\[([^\]]+)\]/)?.[1].split(',').map(s => s.trim().replace(/"/g, '')) || [];
      } else if (l.startsWith('decay:')) {
        zone.decay = true;
      } else if (l.startsWith('inferred:')) {
        zone.inferred = l.split(':')[1].trim() === 'true';
      } else if (l.startsWith('adaptiveRules:')) {
        // Parse AdaptiveRules: adaptiveRules: [error_streak(3), oscillator_sync("bugFixCycle")]
        const rulesArr = l.match(/\[([^\]]+)\]/)?.[1].split(',').map(s => s.trim()) || [];
        adaptiveRules = rulesArr.map(ruleStr => {
          // error_streak(3), oscillator_sync("bugFixCycle"), etc.
          const kindMatch = ruleStr.match(/^(\w+)/);
          const paramsMatch = ruleStr.match(/\((.*)\)/);
          const kind = kindMatch ? kindMatch[1] : '';
          let params: Record<string, any> = {};
          if (paramsMatch) {
            const paramStr = paramsMatch[1];
            // Support single param (number or string)
            if (/^\d+$/.test(paramStr)) {
              params.count = parseInt(paramStr, 10);
            } else if (/^".*"$/.test(paramStr)) {
              params.value = paramStr.replace(/"/g, '');
            } else if (paramStr.includes(':')) {
              // Support key: value pairs (future)
              paramStr.split(',').forEach(pair => {
                const [k, v] = pair.split(':').map(s => s.trim());
                params[k] = /^\d+$/.test(v) ? parseInt(v, 10) : v.replace(/"/g, '');
              });
            }
          }
          return { kind, params } as AdaptiveRule;
        });
      }
    });
    if (adaptiveRules.length) zone.adaptiveRules = adaptiveRules;
    zone.id = zone.label.toLowerCase().replace(/\s+/g, '_');
    zones.push(zone as ZLZone);
  }
  return zones;
}

// Example ZL snippet for dev/test
export const exampleZL = `
zone "Debug Loop" {
  concepts: ["breakpoint", "watchVar", "stepInto"]
  anchor: "debugger/"
  color: "red"
  tone: "friction"
  oscillator: "bugFixCycle"
  phase_window: [0.25, 0.75]
  relates_to: ["Test Harness", "Race Condition Alley"]
  adaptiveRules: [error_streak(3), oscillator_sync("bugFixCycle")]
}
`;
