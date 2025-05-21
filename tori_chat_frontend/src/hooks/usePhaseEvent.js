/**
 * Phase Event Bus Hook
 * 
 * React hook for connecting to the PhaseEventBus and 
 * streaming phase events to components.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
// Import from relative path to make it work in both environments
import { 
  PhaseEventType,
  globalPhaseBus 
} from '../../../packages/runtime-bridge/src/PhaseEventBus';

/**
 * @typedef {Object} PhaseEventHookOptions
 * @property {string} [agentId] - Custom agent ID
 * @property {number} [driftThreshold] - Phase drift threshold
 * @property {boolean} [autoPublish] - Auto-publish phase updates
 * @property {number} [publishInterval] - Publishing interval (ms)
 * @property {number} [initialPhase] - Initial phase value
 */

/**
 * @typedef {Object} PhaseEventHookResult
 * @property {number} phase - Current phase [0, 2π)
 * @property {number} phaseVelocity - Phase velocity (rad/s)
 * @property {number} phaseDrift - Phase drift from mean (rad)
 * @property {string[]} agents - Connected agents
 * @property {boolean} locked - Whether the bus is locked
 * @property {string|null} lockOwner - Owner of the lock
 * @property {number} connectionCount - Number of connected agents
 * @property {number} eventRate - Events per second
 * @property {Object|null} metrics - Latest metrics
 * @property {Object|null} lastEvent - Last received event
 * @property {Function} publishPhase - Publish a phase
 * @property {Function} requestLock - Request a lock
 * @property {Function} releaseLock - Release a lock
 */

/**
 * Hook for using the PhaseEventBus in React components
 * 
 * @param {PhaseEventHookOptions} options - Options for the phase event hook
 * @returns {PhaseEventHookResult} Hook result
 */
export function usePhaseEvent(options = {}) {
  // Bus instance - default to global bus
  const bus = useRef(globalPhaseBus);
  
  // State
  const [phase, setPhase] = useState(options.initialPhase || 0);
  const [phaseVelocity, setPhaseVelocity] = useState(0);
  const [phaseDrift, setPhaseDrift] = useState(0);
  const [agents, setAgents] = useState([]);
  const [locked, setLocked] = useState(false);
  const [lockOwner, setLockOwner] = useState(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [eventRate, setEventRate] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  
  // Auto-publish timer ref
  const publishTimerRef = useRef(null);
  
  // Callbacks
  const handlePhaseUpdate = useCallback((event) => {
    setLastEvent(event);
    
    // Update phase if it's our own update or auto-sync is enabled
    if (event.agentId === bus.current.agentId) {
      setPhase(event.phase);
    }
  }, []);
  
  const handlePhaseSync = useCallback((event) => {
    setLastEvent(event);
    setAgents(bus.current.getConnectedAgents());
    setConnectionCount(bus.current.getConnectedAgents().length);
  }, []);
  
  const handleLock = useCallback((data) => {
    setLocked(true);
    setLockOwner(data.agentId);
  }, []);
  
  const handleUnlock = useCallback(() => {
    setLocked(false);
    setLockOwner(null);
  }, []);
  
  const handleMetrics = useCallback((data) => {
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
  const publishPhase = useCallback((newPhase, metadata = {}) => {
    bus.current.publishPhase(newPhase, metadata);
  }, []);
  
  // Callback to use the enhanced phase_event function
  const phaseEvent = useCallback((newPhase, agentId, metadata = {}) => {
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
    const originalOptions = bus.current.options;
    const originalCallback = originalOptions.metricsCallback;
    originalOptions.metricsCallback = (data) => {
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
