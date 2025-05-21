/**
 * Phase Event Bus Hook
 * 
 * React hook for connecting to the PhaseEventBus and 
 * streaming phase events to components.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
// Import from relative path to make it work in both environments
import { 
  PhaseEventBus, 
  PhaseEventType, 
  PhaseMetrics, 
  PhaseEvent,
  globalPhaseBus 
} from '../../../packages/runtime-bridge/src/PhaseEventBus';

export interface PhaseEventHookOptions {
  agentId?: string;                  // Custom agent ID
  driftThreshold?: number;           // Phase drift threshold
  autoPublish?: boolean;             // Auto-publish phase updates
  publishInterval?: number;          // Publishing interval (ms)
  initialPhase?: number;             // Initial phase value
}

export interface PhaseEventHookResult {
  phase: number;                     // Current phase [0, 2π)
  phaseVelocity: number;             // Phase velocity (rad/s)
  phaseDrift: number;                // Phase drift from mean (rad)
  agents: string[];                  // Connected agents
  locked: boolean;                   // Whether the bus is locked
  lockOwner: string | null;          // Owner of the lock
  connectionCount: number;           // Number of connected agents
  eventRate: number;                 // Events per second
  metrics: PhaseMetrics | null;      // Latest metrics
  lastEvent: PhaseEvent | null;      // Last received event
  publishPhase: (phase: number, metadata?: Record<string, any>) => void; // Publish a phase
  phaseEvent: (phase: number, agentId?: string, metadata?: Record<string, any>) => PhaseEvent; // Enhanced phase event function
  requestLock: () => boolean;        // Request a lock
  releaseLock: () => boolean;        // Release a lock
}

/**
 * Hook for using the PhaseEventBus in React components
 * 
 * @param options Options for the phase event hook
 * @returns Hook result
 */
export function usePhaseEvent(options: PhaseEventHookOptions = {}): PhaseEventHookResult {
  // Bus instance - default to global bus
  const bus = useRef<PhaseEventBus>(globalPhaseBus);
  
  // State
  const [phase, setPhase] = useState<number>(options.initialPhase || 0);
  const [phaseVelocity, setPhaseVelocity] = useState<number>(0);
  const [phaseDrift, setPhaseDrift] = useState<number>(0);
  const [agents, setAgents] = useState<string[]>([]);
  const [locked, setLocked] = useState<boolean>(false);
  const [lockOwner, setLockOwner] = useState<string | null>(null);
  const [connectionCount, setConnectionCount] = useState<number>(0);
  const [eventRate, setEventRate] = useState<number>(0);
  const [metrics, setMetrics] = useState<PhaseMetrics | null>(null);
  const [lastEvent, setLastEvent] = useState<PhaseEvent | null>(null);
  
  // Auto-publish timer ref
  const publishTimerRef = useRef<number | null>(null);
  
  // Callbacks
  const handlePhaseUpdate = useCallback((event: PhaseEvent) => {
    setLastEvent(event);
    
    // Update phase if it's our own update or auto-sync is enabled
    if (event.agentId === bus.current.agentId) {
      setPhase(event.phase);
    }
  }, []);
  
  const handlePhaseSync = useCallback((event: PhaseEvent) => {
    setLastEvent(event);
    setAgents(bus.current.getConnectedAgents());
    setConnectionCount(bus.current.getConnectedAgents().length);
  }, []);
  
  const handleLock = useCallback((data: { agentId: string, timestamp: number }) => {
    setLocked(true);
    setLockOwner(data.agentId);
  }, []);
  
  const handleUnlock = useCallback(() => {
    setLocked(false);
    setLockOwner(null);
  }, []);
  
  const handleMetrics = useCallback((data: PhaseMetrics) => {
    setMetrics(data);
    setPhaseVelocity(data.phaseVelocity);
    setPhaseDrift(data.phaseDrift);
    setConnectionCount(data.agentCount);
    setEventRate(data.eventRate);
  }, []);
  
  // Set up auto-publish
  const startAutoPublish = useCallback(() => {
    if (publishTimerRef.current) {
      window.clearInterval(publishTimerRef.current);
    }
    
    if (options.autoPublish) {
      const interval = options.publishInterval || 1000;
      publishTimerRef.current = window.setInterval(() => {
        // Increment phase by a small amount (angular velocity)
        const newPhase = (phase + 0.1) % (2 * Math.PI);
        bus.current.publishPhase(newPhase);
      }, interval);
    }
  }, [options.autoPublish, options.publishInterval, phase]);
  
  // Callback to publish a phase
  const publishPhase = useCallback((newPhase: number, metadata: Record<string, any> = {}) => {
    bus.current.publishPhase(newPhase, metadata);
  }, []);
  
  // Callback to use the enhanced phase_event function
  const phaseEvent = useCallback((newPhase: number, agentId?: string, metadata: Record<string, any> = {}) => {
    return bus.current.phase_event(newPhase, agentId, metadata);
  }, []);
  
  // Callback to request a lock
  const requestLock = useCallback(() => {
    return bus.current.requestLock();
  }, []);
  
  // Callback to release a lock
  const releaseLock = useCallback(() => {
    return bus.current.releaseLock();
  }, []);
  
  // Effect to set up event listeners
  useEffect(() => {
    // Set up event listeners
    bus.current.on(PhaseEventType.PHASE_UPDATE, handlePhaseUpdate);
    bus.current.on(PhaseEventType.PHASE_SYNC, handlePhaseSync);
    bus.current.on(PhaseEventType.PHASE_DRIFT, handlePhaseUpdate);
    bus.current.on('lock', handleLock);
    bus.current.on('unlock', handleUnlock);
    
    // Set up metrics callback
    const originalOptions = (bus.current as any).options;
    const originalCallback = originalOptions.metricsCallback;
    originalOptions.metricsCallback = (data: PhaseMetrics) => {
      if (originalCallback) {
        originalCallback(data);
      }
      handleMetrics(data);
    };
    
    // Initialize state
    setLocked(bus.current.isLocked());
    setLockOwner(bus.current.getLockOwner());
    setAgents(bus.current.getConnectedAgents());
    setConnectionCount(bus.current.getConnectedAgents().length);
    
    // Set up auto-publish
    startAutoPublish();
    
    // Clean up
    return () => {
      // Remove event listeners
      bus.current.removeListener(PhaseEventType.PHASE_UPDATE, handlePhaseUpdate);
      bus.current.removeListener(PhaseEventType.PHASE_SYNC, handlePhaseSync);
      bus.current.removeListener(PhaseEventType.PHASE_DRIFT, handlePhaseUpdate);
      bus.current.removeListener('lock', handleLock);
      bus.current.removeListener('unlock', handleUnlock);
      
      // Restore original metrics callback
      originalOptions.metricsCallback = originalCallback;
      
      // Clear auto-publish timer
      if (publishTimerRef.current) {
        window.clearInterval(publishTimerRef.current);
      }
    };
  }, [handleLock, handleMetrics, handlePhaseSync, handlePhaseUpdate, handleUnlock, startAutoPublish]);
  
  // Reset auto-publish when phase or interval changes
  useEffect(() => {
    startAutoPublish();
    
    return () => {
      if (publishTimerRef.current) {
        window.clearInterval(publishTimerRef.current);
      }
    };
  }, [options.publishInterval, startAutoPublish]);
  
  // Return the hook result
  return {
    phase,
    phaseVelocity,
    phaseDrift,
    agents,
    locked,
    lockOwner,
    connectionCount,
    eventRate,
    metrics,
    lastEvent,
    publishPhase,
    phaseEvent,     // New enhanced phase event function
    requestLock,
    releaseLock,
  };
}
