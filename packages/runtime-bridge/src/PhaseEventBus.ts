/**
 * PhaseEventBus - Rhythm-Bus Multi-Agent Kernel
 * 
 * Core implementation of the phase broadcast loop that provides:
 * - Phase synchronization across agents
 * - Drift detection and alerts
 * - Consensus mechanism through phase locking
 */

// Use custom EventEmitter to avoid Node.js dependency in browser
type EventHandler = (...args: any[]) => void;

class SimpleEventEmitter {
  private events: Record<string, EventHandler[]> = {};
  
  on(event: string, handler: EventHandler): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler);
    return this;
  }
  
  emit(event: string, ...args: any[]): boolean {
    const handlers = this.events[event];
    if (!handlers || handlers.length === 0) {
      return false;
    }
    
    handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
    
    return true;
  }
  
  removeListener(event: string, handler: EventHandler): this {
    const handlers = this.events[event];
    if (!handlers) {
      return this;
    }
    
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
    
    return this;
  }
  
  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    
    return this;
  }
}

// Import nanoid for unique identifiers
import { nanoid } from 'nanoid';

// Define build hash - safe to use in browser
// Add type declaration for window.__BUILD_HASH__
declare global {
  interface Window {
    __BUILD_HASH__?: string;
  }
}

const BUILD_HASH = typeof window !== 'undefined' && window.__BUILD_HASH__ 
  ? window.__BUILD_HASH__ 
  : 'dev';

// Phase event types
export enum PhaseEventType {
  PHASE_UPDATE = 'phase_update',       // Regular phase update
  PHASE_SYNC = 'phase_sync',           // Synchronization request/response
  PHASE_DRIFT = 'phase_drift',         // Drift detection alert
  PHASE_LOCK = 'phase_lock',           // Phase locking (consensus)
  PHASE_UNLOCK = 'phase_unlock',       // Release phase lock
}

// Phase event interface
export interface PhaseEvent {
  id: string;                          // Unique event ID
  type: PhaseEventType;                // Event type
  agentId: string;                     // Source agent ID
  timestamp: number;                   // Event timestamp (ms)
  phase: number;                       // Current phase [0, 2π)
  frequency?: number;                  // Optional frequency
  amplitude?: number;                  // Optional amplitude
  metadata?: Record<string, any>;      // Additional metadata
  counter: number;                     // Sequence counter (for ordering)
}

// Phase bus options
export interface PhaseEventBusOptions {
  agentId?: string;                    // Agent ID (generated if not provided)
  driftThreshold?: number;             // Phase drift threshold for alerts (radians)
  syncInterval?: number;               // Sync interval (ms)
  metricsCallback?: (metrics: PhaseMetrics) => void; // Metrics callback
}

// Phase metrics
export interface PhaseMetrics {
  agentId: string;                     // Agent ID
  timestamp: number;                   // Timestamp (ms)
  phaseValue: number;                  // Current phase [0, 2π)
  phaseVelocity: number;               // Phase velocity (rad/s)
  phaseDrift: number;                  // Phase drift from mean (rad)
  agentCount: number;                  // Connected agent count
  syncCount: number;                   // Sync event count
  eventRate: number;                   // Events per second
  buildHash?: string;                  // Build hash for tracing
}

/**
 * PhaseEventBus - Core implementation of the Rhythm-Bus
 * 
 * This class implements the phase broadcast system that forms the
 * foundation of the TORI platform's coordination mechanism.
 */
export class PhaseEventBus extends SimpleEventEmitter {
  private options: Required<PhaseEventBusOptions>;
  private defaultMetricsCallback = () => {}; // Default empty metrics callback
  private agentPhases: Map<string, PhaseEvent> = new Map();
  private eventCounter: number = 0;
  private lastMetricsTime: number = 0;
  private eventCounts: number = 0;
  private syncTimer: number | null = null;
  private locked: boolean = false;
  private lockOwner: string | null = null;
  private buildHash: string = BUILD_HASH;

  /**
   * Create a new PhaseEventBus
   */
  constructor(options: PhaseEventBusOptions = {}) {
    super();
    
    // Set default options
    this.options = {
      agentId: options.agentId || `agent-${nanoid(8)}`,
      driftThreshold: options.driftThreshold || 0.5,  // radians
      syncInterval: options.syncInterval || 5000,     // 5 seconds
      metricsCallback: options.metricsCallback || this.defaultMetricsCallback,
    };
    
    // Start sync timer
    this.startSyncTimer();
  }
  
  /**
   * Get the agent ID
   */
  public get agentId(): string {
    return this.options.agentId;
  }
  
  /**
   * Start the sync timer
   */
  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = window.setInterval(() => {
      this.emitSync();
      this.checkDrift();
      this.emitMetrics();
    }, this.options.syncInterval);
  }
  
  /**
   * Stop the sync timer
   */
  public stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
  
  /**
   * Publish a phase event
   * 
   * @param phase Current phase [0, 2π)
   * @param metadata Additional metadata
   * @returns The event that was published
   */
  public publishPhase(phase: number, metadata: Record<string, any> = {}): PhaseEvent {
    // Normalize phase to [0, 2π)
    while (phase < 0) phase += 2 * Math.PI;
    while (phase >= 2 * Math.PI) phase -= 2 * Math.PI;
    
    const event: PhaseEvent = {
      id: nanoid(),
      type: PhaseEventType.PHASE_UPDATE,
      agentId: this.options.agentId,
      timestamp: Date.now(),
      phase,
      metadata,
      counter: this.eventCounter++,
    };
    
    // Store our own phase
    this.agentPhases.set(this.options.agentId, event);
    
    // Emit the event
    this.emit(PhaseEventType.PHASE_UPDATE, event);
    this.eventCounts++;
    
    return event;
  }

  /**
   * Phase event function - core of the Rhythm-Bus system
   * 
   * This method publishes a phase event with optional agent ID override
   * and directly emits metrics to enable real-time monitoring.
   * 
   * @param phase Current phase [0, 2π)
   * @param agentId Optional agent ID (defaults to this instance's ID)
   * @param metadata Additional metadata
   * @returns The event that was published
   */
  public phase_event(phase: number, agentId?: string, metadata: Record<string, any> = {}): PhaseEvent {
    // Use provided agentId or default to this instance's agentId
    const sourceAgentId = agentId || this.options.agentId;
    
    // Normalize phase to [0, 2π)
    while (phase < 0) phase += 2 * Math.PI;
    while (phase >= 2 * Math.PI) phase -= 2 * Math.PI;
    
    const event: PhaseEvent = {
      id: nanoid(),
      type: PhaseEventType.PHASE_UPDATE,
      agentId: sourceAgentId,
      timestamp: Date.now(),
      phase,
      metadata: {
        ...metadata,
        buildHash: this.buildHash, // Include build hash for tracing
      },
      counter: this.eventCounter++,
    };
    
    // Store phase data for the source agent
    this.agentPhases.set(sourceAgentId, event);
    
    // Emit the event
    this.emit(PhaseEventType.PHASE_UPDATE, event);
    this.eventCounts++;
    
    // Export to Prometheus if metrics callback is not the default empty function
    if (this.options.metricsCallback !== this.defaultMetricsCallback) {
      this.emitMetrics();
    }
    
    return event;
  }
  
  /**
   * Receive a phase event from another agent
   * 
   * @param event The phase event
   * @returns True if the event was processed
   */
  public receivePhaseEvent(event: PhaseEvent): boolean {
    // Validate event
    if (!event || !event.agentId || event.agentId === this.options.agentId) {
      return false;
    }
    
    // Skip old events (based on counter)
    const existing = this.agentPhases.get(event.agentId);
    if (existing && existing.counter >= event.counter) {
      return false;
    }
    
    // Store the phase
    this.agentPhases.set(event.agentId, event);
    
    // Emit the event
    this.emit(event.type, event);
    this.eventCounts++;
    
    // Handle special event types
    switch (event.type) {
      case PhaseEventType.PHASE_SYNC:
        // Respond to sync requests with our current phase
        this.emitSync();
        break;
        
      case PhaseEventType.PHASE_LOCK:
        // Set lock state if we're not already locked
        if (!this.locked) {
          this.locked = true;
          this.lockOwner = event.agentId;
          this.emit('lock', { agentId: event.agentId, timestamp: event.timestamp });
        }
        break;
        
      case PhaseEventType.PHASE_UNLOCK:
        // Clear lock state if owned by the sender
        if (this.locked && this.lockOwner === event.agentId) {
          this.locked = false;
          this.lockOwner = null;
          this.emit('unlock', { agentId: event.agentId, timestamp: event.timestamp });
        }
        break;
    }
    
    return true;
  }
  
  /**
   * Emit a sync event
   */
  private emitSync(): void {
    const event: PhaseEvent = {
      id: nanoid(),
      type: PhaseEventType.PHASE_SYNC,
      agentId: this.options.agentId,
      timestamp: Date.now(),
      phase: this.getCurrentPhase(),
      counter: this.eventCounter++,
    };
    
    this.emit(PhaseEventType.PHASE_SYNC, event);
    this.eventCounts++;
  }
  
  /**
   * Get the current phase
   */
  public getCurrentPhase(): number {
    const ownEvent = this.agentPhases.get(this.options.agentId);
    return ownEvent ? ownEvent.phase : 0;
  }
  
  /**
   * Check for phase drift and emit alerts if needed
   */
  private checkDrift(): void {
    if (this.agentPhases.size < 2) {
      return;  // Need at least two agents to detect drift
    }
    
    // Calculate mean phase
    let sumSin = 0;
    let sumCos = 0;
    
    for (const [, event] of this.agentPhases) {
      sumSin += Math.sin(event.phase);
      sumCos += Math.cos(event.phase);
    }
    
    const meanPhase = Math.atan2(sumSin, sumCos);
    
    // Check each agent for drift
    for (const [agentId, event] of this.agentPhases) {
      // Calculate shortest angular distance
      let drift = event.phase - meanPhase;
      while (drift > Math.PI) drift -= 2 * Math.PI;
      while (drift <= -Math.PI) drift += 2 * Math.PI;
      
      // Check if drift exceeds threshold
      if (Math.abs(drift) > this.options.driftThreshold) {
        const driftEvent: PhaseEvent = {
          id: nanoid(),
          type: PhaseEventType.PHASE_DRIFT,
          agentId: this.options.agentId,
          timestamp: Date.now(),
          phase: this.getCurrentPhase(),
          metadata: {
            driftingAgent: agentId,
            drift,
            meanPhase,
          },
          counter: this.eventCounter++,
        };
        
        this.emit(PhaseEventType.PHASE_DRIFT, driftEvent);
        this.eventCounts++;
      }
    }
  }
  
  /**
   * Emit metrics
   */
  private emitMetrics(): void {
    const now = Date.now();
    const elapsed = (now - this.lastMetricsTime) / 1000;
    const eventRate = elapsed > 0 ? this.eventCounts / elapsed : 0;
    
    // Reset counters
    this.eventCounts = 0;
    this.lastMetricsTime = now;
    
    // Get current phase
    const currentPhase = this.getCurrentPhase();
    
    // Calculate phase velocity (if we have previous events)
    const ownEvent = this.agentPhases.get(this.options.agentId);
    const prevEvent = ownEvent;
    
    let phaseVelocity = 0;
    if (prevEvent && prevEvent.timestamp !== now) {
      // Calculate change in phase, handling wrap-around
      let deltaPhase = currentPhase - prevEvent.phase;
      while (deltaPhase > Math.PI) deltaPhase -= 2 * Math.PI;
      while (deltaPhase <= -Math.PI) deltaPhase += 2 * Math.PI;
      
      // Calculate velocity in rad/s
      const deltaTime = (now - prevEvent.timestamp) / 1000;
      if (deltaTime > 0) {
        phaseVelocity = deltaPhase / deltaTime;
      }
    }
    
    // Calculate drift from mean phase
    let phaseDrift = 0;
    if (this.agentPhases.size >= 2) {
      // Calculate mean phase
      let sumSin = 0;
      let sumCos = 0;
      
      for (const [, event] of this.agentPhases) {
        if (event.agentId !== this.options.agentId) {
          sumSin += Math.sin(event.phase);
          sumCos += Math.cos(event.phase);
        }
      }
      
      const meanPhase = Math.atan2(sumSin, sumCos);
      
      // Calculate drift (shortest angular distance)
      phaseDrift = currentPhase - meanPhase;
      while (phaseDrift > Math.PI) phaseDrift -= 2 * Math.PI;
      while (phaseDrift <= -Math.PI) phaseDrift += 2 * Math.PI;
    }
    
    // Create metrics object
    const metrics: PhaseMetrics = {
      agentId: this.options.agentId,
      timestamp: now,
      phaseValue: currentPhase,
      phaseVelocity,
      phaseDrift,
      agentCount: this.agentPhases.size,
      syncCount: this.eventCounts,
      eventRate,
      buildHash: this.buildHash,
    };
    
    // Call metrics callback
    this.options.metricsCallback(metrics);
  }
  
  /**
   * Request a phase lock (for consensus)
   */
  public requestLock(): boolean {
    if (this.locked) {
      return false;  // Already locked
    }
    
    const event: PhaseEvent = {
      id: nanoid(),
      type: PhaseEventType.PHASE_LOCK,
      agentId: this.options.agentId,
      timestamp: Date.now(),
      phase: this.getCurrentPhase(),
      counter: this.eventCounter++,
    };
    
    this.emit(PhaseEventType.PHASE_LOCK, event);
    this.locked = true;
    this.lockOwner = this.options.agentId;
    this.eventCounts++;
    
    return true;
  }
  
  /**
   * Release a phase lock
   */
  public releaseLock(): boolean {
    if (!this.locked || this.lockOwner !== this.options.agentId) {
      return false;  // Not locked or not the owner
    }
    
    const event: PhaseEvent = {
      id: nanoid(),
      type: PhaseEventType.PHASE_UNLOCK,
      agentId: this.options.agentId,
      timestamp: Date.now(),
      phase: this.getCurrentPhase(),
      counter: this.eventCounter++,
    };
    
    this.emit(PhaseEventType.PHASE_UNLOCK, event);
    this.locked = false;
    this.lockOwner = null;
    this.eventCounts++;
    
    return true;
  }
  
  /**
   * Check if the phase bus is locked
   */
  public isLocked(): boolean {
    return this.locked;
  }
  
  /**
   * Get the lock owner
   */
  public getLockOwner(): string | null {
    return this.lockOwner;
  }
  
  /**
   * Get all connected agents
   */
  public getConnectedAgents(): string[] {
    return Array.from(this.agentPhases.keys());
  }
}

// Export singleton instance for use across the application
export const globalPhaseBus = new PhaseEventBus();
