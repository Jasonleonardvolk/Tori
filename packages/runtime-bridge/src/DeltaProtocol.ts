/**
 * Delta Protocol
 * 
 * Efficient delta-based transport protocol for high-frequency updates
 * with sequence tracking and re-sync capabilities.
 */

// Maximum number of previous states to keep for deltas
const DEFAULT_MAX_HISTORY = 10;

// Maximum sequence number before rollover (16-bit counter)
const MAX_SEQUENCE = 65535;

/**
 * Delta packet structure
 */
export interface DeltaPacket<T> {
  sequence: number;      // 16-bit rolling counter
  baseState?: T;         // Full state on first packet or re-sync
  deltas?: any[];        // Array of changes since last state
  requireAck: boolean;   // Whether ACK is required
  timestamp: number;     // Timestamp for monitoring
}

/**
 * Acknowledgment packet structure
 */
export interface DeltaAck {
  sequence: number;       // Sequence being acknowledged
  status: 'ok' | 'resync'; // Request resync if needed
  timestamp: number;      // Timestamp for monitoring
}

/**
 * Delta metrics data
 */
export interface DeltaMetrics {
  deltaFullRatio: number;   // Ratio of delta size to full state size
  fullStateSize: number;    // Size of full state in bytes
  deltaSize: number;        // Size of delta in bytes  
}

/**
 * Delta encoder options
 */
export interface DeltaEncoderOptions {
  maxHistory?: number;   // Maximum previous states to keep
  requireAck?: boolean;  // Whether to require ACKs by default
  ackTimeout?: number;   // Timeout in ms before considering packet lost
  backoffFactor?: number; // Exponential backoff factor for resync requests
  maxBackoff?: number;   // Maximum backoff time in ms
  onMetrics?: (metrics: DeltaMetrics) => void; // Callback for metrics reporting
}

/**
 * Delta encoder class
 * 
 * Encodes state updates as efficient deltas with sequence tracking and
 * re-sync capabilities.
 */
export class DeltaEncoder<T> {
  private sequence: number = 0;
  private history: T[] = [];
  private options: Required<DeltaEncoderOptions>;
  private pendingAcks: Map<number, { 
    timestamp: number, 
    state: T, 
    attempts: number,
    nextRetry: number 
  }> = new Map();
  private resyncRequested: boolean = false;
  private lastResyncTime: number = 0;
  
  /**
   * Create a new delta encoder
   */
  constructor(options: DeltaEncoderOptions = {}) {
    this.options = {
      maxHistory: options.maxHistory || DEFAULT_MAX_HISTORY,
      requireAck: options.requireAck !== undefined ? options.requireAck : false,
      ackTimeout: options.ackTimeout || 5000,
      backoffFactor: options.backoffFactor || 1.5,
      maxBackoff: options.maxBackoff || 30000, // 30 seconds max backoff
      onMetrics: options.onMetrics || (() => {}), // Default no-op function
    };
  }
  
  /**
   * Encode a state update
   * 
   * @param state Current full state
   * @param requireAck Whether to require an ACK for this packet
   * @returns Delta packet
   */
  public encode(state: T, requireAck?: boolean): DeltaPacket<T> {
    const needAck = requireAck !== undefined ? requireAck : this.options.requireAck;
    
    // Increment sequence number with rollover
    this.sequence = (this.sequence + 1) % MAX_SEQUENCE;
    
    // If resync requested or first packet, send full state
    if (this.resyncRequested || this.history.length === 0) {
      const packet: DeltaPacket<T> = {
        sequence: this.sequence,
        baseState: state,
        requireAck: needAck,
        timestamp: Date.now(),
      };
      
      // Update history
      this.history = [state];
      this.resyncRequested = false;
      
      // Track pending ACK if required
      if (needAck) {
        const now = Date.now();
        this.pendingAcks.set(this.sequence, { 
          timestamp: now, 
          state,
          attempts: 0,
          nextRetry: now + this.options.ackTimeout
        });
      }
      
      return packet;
    }
    
    // Calculate delta from previous state
    const previousState = this.history[this.history.length - 1];
    const deltas = this.calculateDeltas(previousState, state);
    
    // If deltas are larger than full state, send full state instead
    if (JSON.stringify(deltas).length > JSON.stringify(state).length * 0.7) {
      const packet: DeltaPacket<T> = {
        sequence: this.sequence,
        baseState: state,
        requireAck: needAck,
        timestamp: Date.now(),
      };
      
        // Calculate size metrics
        const fullStateSize = JSON.stringify(state).length;
        const deltasSize = JSON.stringify(deltas).length;
        const ratio = deltasSize / fullStateSize;
        
        // If metrics collection is provided, report sizes
        if (this.options.onMetrics) {
          this.options.onMetrics({
            deltaFullRatio: ratio,
            fullStateSize,
            deltaSize: deltasSize
          });
        }
        
        // Update history
        this.addToHistory(state);
        
        // Track pending ACK if required
        if (needAck) {
          const now = Date.now();
          this.pendingAcks.set(this.sequence, { 
            timestamp: now, 
            state,
            attempts: 0,
            nextRetry: now + this.options.ackTimeout
          });
        }
        
        return packet;
      }
    
    // Create delta packet
    const packet: DeltaPacket<T> = {
      sequence: this.sequence,
      deltas,
      requireAck: needAck,
      timestamp: Date.now(),
    };
    
    // Update history
    this.addToHistory(state);
    
      // Track pending ACK if required
      if (needAck) {
        const now = Date.now();
        this.pendingAcks.set(this.sequence, { 
          timestamp: now, 
          state,
          attempts: 0,
          nextRetry: now + this.options.ackTimeout
        });
      }
    
    return packet;
  }
  
  /**
   * Handle an acknowledgment
   * 
   * @param ack The acknowledgment packet
   * @returns Whether the ACK was handled successfully
   */
  public handleAck(ack: DeltaAck): boolean {
    // Clear pending ACK
    if (this.pendingAcks.has(ack.sequence)) {
      this.pendingAcks.delete(ack.sequence);
      
      // Handle resync request
      if (ack.status === 'resync') {
        this.resyncRequested = true;
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Check for ACK timeouts and return timed-out states
   * Implements exponential backoff for retries
   * 
   * @returns Array of timed-out states for retry
   */
  public checkAckTimeouts(): { sequence: number, state: T }[] {
    const now = Date.now();
    const timedOut: { sequence: number, state: T }[] = [];
    
    // Check if we can request a resync (with backoff)
    const canRequestResync = (now - this.lastResyncTime) > 
      Math.min(this.options.ackTimeout * 2, this.options.maxBackoff);
    
    for (const [sequence, entry] of this.pendingAcks.entries()) {
      // Only check entries ready for retry
      if (now >= entry.nextRetry) {
        // Increment attempt counter
        entry.attempts += 1;
        
        // For extreme cases, eventually give up
        if (entry.attempts > 10) {
          this.pendingAcks.delete(sequence);
          continue;
        }
        
        // Add to timed-out list
        timedOut.push({ sequence, state: entry.state });
        
        // Calculate exponential backoff for next retry
        const backoffTime = Math.min(
          this.options.ackTimeout * Math.pow(this.options.backoffFactor, entry.attempts),
          this.options.maxBackoff
        );
        
        // Update next retry time
        entry.nextRetry = now + backoffTime;
        
        // If many packets are timing out, request a full resync (with backoff)
        if (timedOut.length > 3 && canRequestResync) {
          this.resyncRequested = true;
          this.lastResyncTime = now;
          // Clear pending ACKs if we're going to resync anyway
          this.pendingAcks.clear();
          break;  // Stop checking others, we'll resync
        }
      }
    }
    
    return timedOut;
  }
  
  /**
   * Add a state to the history
   * 
   * @param state The state to add
   */
  private addToHistory(state: T): void {
    this.history.push(state);
    
    // Trim history if needed
    if (this.history.length > this.options.maxHistory) {
      this.history.shift();
    }
  }
  
  /**
   * Calculate deltas between two states
   * 
   * This is a simple implementation. More sophisticated diff algorithms
   * could be used for specific state types.
   * 
   * @param oldState Previous state
   * @param newState Current state
   * @returns Array of changes
   */
  private calculateDeltas(oldState: T, newState: T): any[] {
    // For objects, calculate property-level deltas
    if (typeof oldState === 'object' && typeof newState === 'object') {
      const deltas: any[] = [];
      
      // Handle arrays
      if (Array.isArray(oldState) && Array.isArray(newState)) {
        // For arrays, track modified indices
        for (let i = 0; i < newState.length; i++) {
          if (i >= oldState.length) {
            // New element
            deltas.push({ op: 'add', path: [i], value: newState[i] });
          } else if (JSON.stringify(oldState[i]) !== JSON.stringify(newState[i])) {
            // Modified element
            deltas.push({ op: 'replace', path: [i], value: newState[i] });
          }
        }
        
        // Handle removed elements
        if (oldState.length > newState.length) {
          deltas.push({ op: 'truncate', path: [], length: newState.length });
        }
      } else {
        // For objects, track changed properties
        const oldKeys = Object.keys(oldState as object);
        const newKeys = Object.keys(newState as object);
        
        // Handle added and modified properties
        for (const key of newKeys) {
          const oldValue = (oldState as any)[key];
          const newValue = (newState as any)[key];
          
          if (oldValue === undefined) {
            // New property
            deltas.push({ op: 'add', path: [key], value: newValue });
          } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            // Modified property
            deltas.push({ op: 'replace', path: [key], value: newValue });
          }
        }
        
        // Handle removed properties
        for (const key of oldKeys) {
          if (!newKeys.includes(key)) {
            deltas.push({ op: 'remove', path: [key] });
          }
        }
      }
      
      return deltas;
    }
    
    // For primitive types, return the new value if different
    if (oldState !== newState) {
      return [{ op: 'replace', path: [], value: newState }];
    }
    
    return [];
  }
}

/**
 * Delta decoder options
 */
export interface DeltaDecoderOptions {
  onResyncNeeded?: () => void; // Callback when resync is needed
}

/**
 * Delta decoder class
 * 
 * Decodes delta packets into full states.
 */
export class DeltaDecoder<T> {
  private currentState: T | null = null;
  private lastSequence: number = -1;
  private options: Required<DeltaDecoderOptions>;
  
  /**
   * Create a new delta decoder
   */
  constructor(options: DeltaDecoderOptions = {}) {
    this.options = {
      onResyncNeeded: options.onResyncNeeded || (() => {}),
    };
  }
  
  /**
   * Decode a delta packet
   * 
   * @param packet The delta packet
   * @returns The decoded state and ACK packet
   */
  public decode(packet: DeltaPacket<T>): { state: T | null, ack: DeltaAck | null } {
    // Check for out-of-order packets
    if (this.lastSequence !== -1) {
      const expectedSequence = (this.lastSequence + 1) % MAX_SEQUENCE;
      
      // Handle sequence mismatch
      if (packet.sequence !== expectedSequence) {
        // Skip older packets
        if ((packet.sequence < expectedSequence && expectedSequence - packet.sequence < 1000) ||
            (packet.sequence > expectedSequence && packet.sequence - expectedSequence > 1000)) {
          // Old packet, ignore
          return { state: this.currentState, ack: null };
        }
        
        // Otherwise, request resync
        this.options.onResyncNeeded();
        
        if (packet.requireAck) {
          return { 
            state: null, 
            ack: { 
              sequence: packet.sequence, 
              status: 'resync',
              timestamp: Date.now()
            } 
          };
        }
        
        return { state: null, ack: null };
      }
    }
    
    // Update sequence
    this.lastSequence = packet.sequence;
    
    // Handle base state
    if (packet.baseState) {
      this.currentState = packet.baseState;
      
      if (packet.requireAck) {
        return { 
          state: this.currentState, 
          ack: { 
            sequence: packet.sequence, 
            status: 'ok',
            timestamp: Date.now()
          } 
        };
      }
      
      return { state: this.currentState, ack: null };
    }
    
    // Handle deltas
    if (packet.deltas && this.currentState) {
      try {
        this.applyDeltas(packet.deltas);
        
        if (packet.requireAck) {
          return { 
            state: this.currentState, 
            ack: { 
              sequence: packet.sequence, 
              status: 'ok',
              timestamp: Date.now()
            } 
          };
        }
        
        return { state: this.currentState, ack: null };
      } catch (error) {
        // Failed to apply deltas, request resync
        this.options.onResyncNeeded();
        
        if (packet.requireAck) {
          return { 
            state: this.currentState, 
            ack: { 
              sequence: packet.sequence, 
              status: 'resync',
              timestamp: Date.now()
            } 
          };
        }
        
        return { state: this.currentState, ack: null };
      }
    }
    
    // Missing required data
    if (packet.requireAck) {
      return { 
        state: this.currentState, 
        ack: { 
          sequence: packet.sequence, 
          status: 'resync',
          timestamp: Date.now()
        } 
      };
    }
    
    return { state: this.currentState, ack: null };
  }
  
  /**
   * Apply deltas to the current state
   * 
   * @param deltas Array of deltas to apply
   */
  private applyDeltas(deltas: any[]): void {
    if (!this.currentState) {
      throw new Error('Cannot apply deltas without a base state');
    }
    
    for (const delta of deltas) {
      this.applyDelta(delta);
    }
  }
  
  /**
   * Apply a single delta to the current state
   * 
   * @param delta The delta to apply
   */
  private applyDelta(delta: any): void {
    if (!this.currentState) return;
    
    const { op, path, value } = delta;
    
    if (path.length === 0) {
      // Root-level operations
      switch (op) {
        case 'replace':
          this.currentState = value;
          break;
        case 'truncate':
          if (Array.isArray(this.currentState) && typeof delta.length === 'number') {
            (this.currentState as any).length = delta.length;
          }
          break;
      }
      return;
    }
    
    // Traverse the path to find the target object
    let target: any = this.currentState;
    const lastKey = path[path.length - 1];
    
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (target[key] === undefined) {
        target[key] = typeof path[i + 1] === 'number' ? [] : {};
      }
      target = target[key];
    }
    
    // Apply the operation
    switch (op) {
      case 'add':
      case 'replace':
        target[lastKey] = value;
        break;
      case 'remove':
        if (Array.isArray(target)) {
          target.splice(lastKey as number, 1);
        } else {
          delete target[lastKey];
        }
        break;
    }
  }
}
