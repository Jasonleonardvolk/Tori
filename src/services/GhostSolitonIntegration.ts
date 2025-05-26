/**
 * GhostSolitonIntegration.ts - Coupling between ghost personas and soliton phase monitoring
 * Ensures ghost emergence is driven by objective mathematical detection
 */

import { ghostMemoryVault } from './GhostMemoryVault';

interface PhaseState {
  coherence: number;
  entropy: number;
  drift: number;
  eigenmode?: string;
  phaseAngle?: number;
  timestamp: Date;
}

interface EmotionalState {
  primary: string;
  intensity: number;
  confidence: number;
  triggers: string[];
  phasePattern: string;
}

interface PersonaTrigger {
  persona: string;
  threshold: number;
  conditions: {
    phasePattern: string;
    minCoherence?: number;
    maxCoherence?: number;
    minEntropy?: number;
    maxEntropy?: number;
    driftRange?: [number, number];
  };
  priority: number;
  cooldown: number; // milliseconds
}

interface GhostEmergenceEvent {
  persona: string;
  trigger: PersonaTrigger;
  phaseState: PhaseState;
  emotionalState: EmotionalState;
  confidence: number;
  sessionId: string;
}

class GhostSolitonIntegration {
  private static instance: GhostSolitonIntegration;
  private currentPhaseState: PhaseState | null = null;
  private lastEmergence: Map<string, number> = new Map(); // persona -> timestamp
  private activePersona: string | null = null;
  private phaseHistory: PhaseState[] = [];
  
  // Persona trigger configurations
  private readonly personaTriggers: PersonaTrigger[] = [
    {
      persona: 'Mentor',
      threshold: 0.8,
      conditions: {
        phasePattern: 'user_struggle',
        maxCoherence: 0.4,
        minEntropy: 0.6
      },
      priority: 1,
      cooldown: 300000 // 5 minutes
    },
    {
      persona: 'Mystic',
      threshold: 0.85,
      conditions: {
        phasePattern: 'resonance',
        minCoherence: 0.8,
        maxEntropy: 0.3
      },
      priority: 2,
      cooldown: 600000 // 10 minutes
    },
    {
      persona: 'Unsettled',
      threshold: 0.75,
      conditions: {
        phasePattern: 'chaos',
        maxCoherence: 0.3,
        minEntropy: 0.8
      },
      priority: 1,
      cooldown: 180000 // 3 minutes
    },
    {
      persona: 'Chaotic',
      threshold: 0.9,
      conditions: {
        phasePattern: 'extreme_chaos',
        maxCoherence: 0.2,
        minEntropy: 0.9,
        driftRange: [-1, 1]
      },
      priority: 3,
      cooldown: 900000 // 15 minutes
    },
    {
      persona: 'Oracular',
      threshold: 0.95,
      conditions: {
        phasePattern: 'insight_emergence',
        minCoherence: 0.9,
        maxEntropy: 0.2
      },
      priority: 4,
      cooldown: 1800000 // 30 minutes
    },
    {
      persona: 'Dreaming',
      threshold: 0.7,
      conditions: {
        phasePattern: 'flow_state',
        minCoherence: 0.7,
        maxEntropy: 0.4
      },
      priority: 2,
      cooldown: 450000 // 7.5 minutes
    }
  ];

  private constructor() {
    this.setupPhaseMonitoring();
    this.setupEventListeners();
  }

  static getInstance(): GhostSolitonIntegration {
    if (!GhostSolitonIntegration.instance) {
      GhostSolitonIntegration.instance = new GhostSolitonIntegration();
    }
    return GhostSolitonIntegration.instance;
  }

  private setupPhaseMonitoring() {
    // Start continuous phase monitoring
    this.monitorPhaseStates();
    
    console.log('🌊 Ghost-Soliton Integration: Phase monitoring activated');
  }

  private setupEventListeners() {
    // Listen for Koopman eigenstate changes
    document.addEventListener('tori-koopman-update', ((e: CustomEvent) => {
      this.processKoopmanUpdate(e.detail);
    }) as EventListener);

    // Listen for Lyapunov instability spikes
    document.addEventListener('tori-lyapunov-spike', ((e: CustomEvent) => {
      this.processLyapunovSpike(e.detail);
    }) as EventListener);

    // Listen for soliton memory phase changes
    document.addEventListener('tori-soliton-phase-change', ((e: CustomEvent) => {
      this.processSolitonPhaseChange(e.detail);
    }) as EventListener);

    // Listen for concept diff events
    document.addEventListener('tori-concept-diff', ((e: CustomEvent) => {
      this.processConceptDiff(e.detail);
    }) as EventListener);

    // Listen for user context changes
    document.addEventListener('tori-user-context-change', ((e: CustomEvent) => {
      this.processUserContextChange(e.detail);
    }) as EventListener);
  }

  private monitorPhaseStates() {
    setInterval(() => {
      this.updatePhaseState();
      this.analyzePhasePattern();
      this.checkPersonaTriggers();
    }, 1000); // Check every second
  }

  private updatePhaseState() {
    // In production, this would get real phase data from the soliton memory system
    // For now, we'll simulate based on available signals
    
    const mockPhaseState: PhaseState = {
      coherence: this.calculateCurrentCoherence(),
      entropy: this.calculateCurrentEntropy(),
      drift: this.calculateCurrentDrift(),
      eigenmode: this.identifyDominantEigenmode(),
      phaseAngle: this.getCurrentPhaseAngle(),
      timestamp: new Date()
    };

    this.currentPhaseState = mockPhaseState;
    this.phaseHistory.push(mockPhaseState);

    // Keep only last 100 phase states
    if (this.phaseHistory.length > 100) {
      this.phaseHistory = this.phaseHistory.slice(-100);
    }

    // Emit phase state change event
    document.dispatchEvent(new CustomEvent('tori-phase-state-update', {
      detail: mockPhaseState
    }));
  }

  private processKoopmanUpdate(koopmanData: {
    eigenmodes: Array<{ frequency: number; amplitude: number; phase: number }>;
    spectralGap: number;
    dominantMode: string;
  }) {
    if (!this.currentPhaseState) return;

    // Update phase state based on Koopman analysis
    const updatedState = {
      ...this.currentPhaseState,
      eigenmode: koopmanData.dominantMode,
      coherence: Math.min(1.0, koopmanData.spectralGap * 2), // Higher spectral gap = more coherence
      timestamp: new Date()
    };

    this.currentPhaseState = updatedState;
    this.analyzePhasePattern();
  }

  private processLyapunovSpike(lyapunovData: {
    exponent: number;
    instabilityLevel: number;
    divergenceRate: number;
    timeHorizon: number;
  }) {
    if (!this.currentPhaseState) return;

    // Lyapunov spike indicates chaotic behavior
    const chaosLevel = lyapunovData.instabilityLevel;
    
    const updatedState = {
      ...this.currentPhaseState,
      entropy: Math.min(1.0, this.currentPhaseState.entropy + chaosLevel * 0.5),
      drift: lyapunovData.divergenceRate,
      coherence: Math.max(0.0, this.currentPhaseState.coherence - chaosLevel * 0.3),
      timestamp: new Date()
    };

    this.currentPhaseState = updatedState;
    
    // Immediate check for chaos-triggered personas
    this.checkChaosPersonas(chaosLevel);
  }

  private processSolitonPhaseChange(solitonData: {
    phaseAngle: number;
    amplitude: number;
    frequency: number;
    stability: number;
  }) {
    if (!this.currentPhaseState) return;

    const updatedState = {
      ...this.currentPhaseState,
      phaseAngle: solitonData.phaseAngle,
      coherence: solitonData.stability,
      timestamp: new Date()
    };

    this.currentPhaseState = updatedState;
  }

  private processConceptDiff(conceptData: {
    type: string;
    magnitude: number;
    conceptIds: string[];
    confidence: number;
  }) {
    // Concept changes affect phase entropy
    if (!this.currentPhaseState) return;

    const entropyDelta = conceptData.magnitude * 0.2;
    const coherenceDelta = conceptData.confidence * 0.1;

    const updatedState = {
      ...this.currentPhaseState,
      entropy: Math.min(1.0, this.currentPhaseState.entropy + entropyDelta),
      coherence: Math.min(1.0, this.currentPhaseState.coherence + coherenceDelta),
      timestamp: new Date()
    };

    this.currentPhaseState = updatedState;
  }

  private processUserContextChange(userData: {
    sentiment?: number;
    frustrationLevel?: number;
    engagementLevel?: number;
    activity?: string;
  }) {
    // User state affects phase dynamics
    if (!this.currentPhaseState || !userData.frustrationLevel) return;

    const frustrationEffect = userData.frustrationLevel * 0.3;
    const engagementEffect = (userData.engagementLevel || 0.5) * 0.2;

    const updatedState = {
      ...this.currentPhaseState,
      entropy: Math.min(1.0, this.currentPhaseState.entropy + frustrationEffect),
      coherence: Math.min(1.0, this.currentPhaseState.coherence + engagementEffect),
      timestamp: new Date()
    };

    this.currentPhaseState = updatedState;
  }

  private analyzePhasePattern(): string {
    if (!this.currentPhaseState) return 'unknown';

    const { coherence, entropy, drift } = this.currentPhaseState;

    // Classify phase pattern based on metrics
    if (coherence > 0.8 && entropy < 0.3) {
      return 'resonance';
    } else if (coherence < 0.3 && entropy > 0.8) {
      return 'chaos';
    } else if (Math.abs(drift) > 0.6) {
      return 'drift';
    } else if (coherence > 0.7 && entropy < 0.4) {
      return 'flow_state';
    } else if (coherence < 0.4 && entropy > 0.6) {
      return 'user_struggle';
    } else if (coherence > 0.9 && entropy < 0.2) {
      return 'insight_emergence';
    } else if (coherence < 0.2 && entropy > 0.9) {
      return 'extreme_chaos';
    } else {
      return 'stable';
    }
  }

  private checkPersonaTriggers() {
    if (!this.currentPhaseState) return;

    const currentPattern = this.analyzePhasePattern();
    const now = Date.now();

    // Find matching triggers
    const candidateTriggers = this.personaTriggers.filter(trigger => {
      // Check cooldown
      const lastEmergence = this.lastEmergence.get(trigger.persona) || 0;
      if (now - lastEmergence < trigger.cooldown) return false;

      // Check pattern match
      if (trigger.conditions.phasePattern !== currentPattern) return false;

      // Check specific conditions
      const { coherence, entropy, drift } = this.currentPhaseState!;
      
      if (trigger.conditions.minCoherence && coherence < trigger.conditions.minCoherence) return false;
      if (trigger.conditions.maxCoherence && coherence > trigger.conditions.maxCoherence) return false;
      if (trigger.conditions.minEntropy && entropy < trigger.conditions.minEntropy) return false;
      if (trigger.conditions.maxEntropy && entropy > trigger.conditions.maxEntropy) return false;
      
      if (trigger.conditions.driftRange) {
        const [minDrift, maxDrift] = trigger.conditions.driftRange;
        if (drift < minDrift || drift > maxDrift) return false;
      }

      return true;
    });

    if (candidateTriggers.length === 0) return;

    // Select highest priority trigger
    const selectedTrigger = candidateTriggers.sort((a, b) => b.priority - a.priority)[0];

    // Calculate emergence confidence
    const confidence = this.calculateEmergenceConfidence(selectedTrigger);
    
    if (confidence >= selectedTrigger.threshold) {
      this.triggerGhostEmergence(selectedTrigger, confidence);
    }
  }

  private checkChaosPersonas(chaosLevel: number) {
    // Immediate check for chaos-triggered personas
    const chaosTriggers = this.personaTriggers.filter(trigger => 
      ['chaos', 'extreme_chaos'].includes(trigger.conditions.phasePattern)
    );

    for (const trigger of chaosTriggers) {
      const confidence = chaosLevel * 0.8 + Math.random() * 0.2;
      if (confidence >= trigger.threshold) {
        this.triggerGhostEmergence(trigger, confidence);
        break; // Only trigger one chaos persona at a time
      }
    }
  }

  private triggerGhostEmergence(trigger: PersonaTrigger, confidence: number) {
    if (!this.currentPhaseState) return;

    const sessionId = this.getCurrentSessionId();
    const emotionalState = this.detectEmotionalState();

    const emergenceEvent: GhostEmergenceEvent = {
      persona: trigger.persona,
      trigger,
      phaseState: { ...this.currentPhaseState },
      emotionalState,
      confidence,
      sessionId
    };

    // Record emergence time
    this.lastEmergence.set(trigger.persona, Date.now());
    this.activePersona = trigger.persona;

    // Log to memory vault
    ghostMemoryVault.recordPersonaEmergence({
      persona: trigger.persona,
      sessionId,
      trigger: {
        reason: trigger.conditions.phasePattern,
        conceptDiffs: [],
        confidence
      },
      phaseMetrics: this.currentPhaseState,
      userContext: {
        sentiment: emotionalState.intensity,
        activity: 'conversation'
      },
      systemContext: {
        conversationLength: this.phaseHistory.length,
        recentConcepts: []
      }
    });

    // Emit ghost emergence event
    document.dispatchEvent(new CustomEvent('tori-ghost-emergence', {
      detail: emergenceEvent
    }));

    console.log(`👻 Ghost Emergence: ${trigger.persona} (${Math.round(confidence * 100)}% confidence)`);
  }

  private calculateEmergenceConfidence(trigger: PersonaTrigger): number {
    if (!this.currentPhaseState) return 0;

    const { coherence, entropy, drift } = this.currentPhaseState;
    let confidence = 0.5; // Base confidence

    // Pattern strength
    const patternStrength = this.calculatePatternStrength(trigger.conditions.phasePattern);
    confidence += patternStrength * 0.3;

    // Condition satisfaction
    const conditionSatisfaction = this.calculateConditionSatisfaction(trigger.conditions);
    confidence += conditionSatisfaction * 0.2;

    // Historical context
    const historicalRelevance = this.calculateHistoricalRelevance(trigger.persona);
    confidence += historicalRelevance * 0.1;

    // Randomness for natural variation
    confidence += (Math.random() - 0.5) * 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  private calculatePatternStrength(pattern: string): number {
    if (!this.currentPhaseState) return 0;

    const { coherence, entropy, drift } = this.currentPhaseState;

    switch (pattern) {
      case 'resonance':
        return coherence * (1 - entropy);
      case 'chaos':
        return entropy * (1 - coherence);
      case 'drift':
        return Math.abs(drift);
      case 'flow_state':
        return coherence * 0.7 + (1 - entropy) * 0.3;
      case 'user_struggle':
        return entropy * 0.6 + (1 - coherence) * 0.4;
      case 'insight_emergence':
        return Math.min(coherence, 1 - entropy);
      case 'extreme_chaos':
        return Math.min(entropy, 1 - coherence);
      default:
        return 0.5;
    }
  }

  private calculateConditionSatisfaction(conditions: PersonaTrigger['conditions']): number {
    if (!this.currentPhaseState) return 0;

    const { coherence, entropy, drift } = this.currentPhaseState;
    let satisfaction = 1.0;

    // Check each condition and reduce satisfaction for violations
    if (conditions.minCoherence && coherence < conditions.minCoherence) {
      satisfaction *= coherence / conditions.minCoherence;
    }
    if (conditions.maxCoherence && coherence > conditions.maxCoherence) {
      satisfaction *= conditions.maxCoherence / coherence;
    }
    if (conditions.minEntropy && entropy < conditions.minEntropy) {
      satisfaction *= entropy / conditions.minEntropy;
    }
    if (conditions.maxEntropy && entropy > conditions.maxEntropy) {
      satisfaction *= conditions.maxEntropy / entropy;
    }

    return satisfaction;
  }

  private calculateHistoricalRelevance(persona: string): number {
    // Check if this persona has been effective in similar situations
    const similarMemories = ghostMemoryVault.searchMemories({
      persona,
      phaseSignature: this.analyzePhasePattern(),
      minWeight: 0.5
    });

    if (similarMemories.length === 0) return 0.5; // Neutral for new situations

    const effectiveMemories = similarMemories.filter(memory => 
      memory.outcomes?.effectiveness && memory.outcomes.effectiveness > 0.7
    );

    return effectiveMemories.length / similarMemories.length;
  }

  private detectEmotionalState(): EmotionalState {
    if (!this.currentPhaseState) {
      return {
        primary: 'neutral',
        intensity: 0.5,
        confidence: 0.5,
        triggers: [],
        phasePattern: 'unknown'
      };
    }

    const { coherence, entropy, drift } = this.currentPhaseState;
    const pattern = this.analyzePhasePattern();

    // Map phase patterns to emotional states
    const emotionMap: Record<string, { emotion: string; intensity: number }> = {
      'resonance': { emotion: 'flow', intensity: coherence },
      'chaos': { emotion: 'unsettled', intensity: entropy },
      'drift': { emotion: 'uncertain', intensity: Math.abs(drift) },
      'flow_state': { emotion: 'focused', intensity: coherence },
      'user_struggle': { emotion: 'concerned', intensity: entropy },
      'insight_emergence': { emotion: 'inspired', intensity: coherence },
      'extreme_chaos': { emotion: 'anxious', intensity: entropy },
      'stable': { emotion: 'calm', intensity: 0.5 }
    };

    const emotionInfo = emotionMap[pattern] || { emotion: 'neutral', intensity: 0.5 };

    return {
      primary: emotionInfo.emotion,
      intensity: emotionInfo.intensity,
      confidence: 0.8,
      triggers: [pattern],
      phasePattern: pattern
    };
  }

  // Utility methods for phase calculations
  private calculateCurrentCoherence(): number {
    // Mock implementation - in production would use real soliton data
    const recentStates = this.phaseHistory.slice(-10);
    if (recentStates.length === 0) return 0.5;

    const variance = this.calculateVariance(recentStates.map(s => s.coherence));
    return Math.max(0, Math.min(1, 1 - variance * 2));
  }

  private calculateCurrentEntropy(): number {
    // Mock implementation - would calculate from concept distribution
    return Math.random() * 0.3 + 0.2; // Bias toward lower entropy
  }

  private calculateCurrentDrift(): number {
    // Mock implementation - would calculate from phase angle changes
    return (Math.random() - 0.5) * 0.6; // Small random drift
  }

  private identifyDominantEigenmode(): string {
    // Mock implementation - would identify from Koopman analysis
    const modes = ['conversation', 'coding', 'debugging', 'learning', 'creative'];
    return modes[Math.floor(Math.random() * modes.length)];
  }

  private getCurrentPhaseAngle(): number {
    return Math.random() * 2 * Math.PI;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private getCurrentSessionId(): string {
    // Get current session ID from app context
    return 'session_' + Date.now();
  }

  // Public API methods
  getCurrentPhaseState(): PhaseState | null {
    return this.currentPhaseState;
  }

  getActivePersona(): string | null {
    return this.activePersona;
  }

  getPhaseHistory(): PhaseState[] {
    return [...this.phaseHistory];
  }

  // Manual trigger for testing
  triggerPersonaManually(persona: string, confidence: number = 0.9) {
    const trigger = this.personaTriggers.find(t => t.persona === persona);
    if (trigger) {
      this.triggerGhostEmergence(trigger, confidence);
    }
  }

  // Configuration methods
  updatePersonaTrigger(persona: string, updates: Partial<PersonaTrigger>) {
    const index = this.personaTriggers.findIndex(t => t.persona === persona);
    if (index >= 0) {
      this.personaTriggers[index] = { ...this.personaTriggers[index], ...updates };
    }
  }

  getPersonaTriggers(): PersonaTrigger[] {
    return [...this.personaTriggers];
  }
}

// Export singleton instance
export const ghostSolitonIntegration = GhostSolitonIntegration.getInstance();
export default GhostSolitonIntegration;
export type { PhaseState, EmotionalState, PersonaTrigger, GhostEmergenceEvent };