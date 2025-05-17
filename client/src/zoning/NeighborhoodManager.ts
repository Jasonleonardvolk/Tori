// NeighborhoodManager.ts
// Registry and query functions for Conceptual Neighborhoods
import { ZLZone } from './types';

export class NeighborhoodManager {
  private zones: ZLZone[] = [];

  loadZones(zones: ZLZone[]) {
    this.zones = zones;
  }

  getZoneByConcept(concept: string): ZLZone | undefined {
    return this.zones.find(z => z.concepts.includes(concept));
  }

  getZonesInPhase(oscillator: string, phase: number): ZLZone[] {
    return this.zones.filter(z => z.oscillator === oscillator && z.phaseWindow && phase >= z.phaseWindow[0] && phase <= z.phaseWindow[1]);
  }

  getFrictionZonesTouchedToday(events: {concept: string, time: string}[]): ZLZone[] {
    const today = new Date().toISOString().slice(0,10);
    const conceptsToday = events.filter(e => e.time.slice(0,10) === today).map(e => e.concept);
    return this.zones.filter(z => z.tone === 'friction' && z.concepts.some(c => conceptsToday.includes(c)));
  }

  getZoneById(id: string): ZLZone | undefined {
    return this.zones.find(z => z.id === id);
  }

  all(): ZLZone[] {
    return this.zones;
  }
}
