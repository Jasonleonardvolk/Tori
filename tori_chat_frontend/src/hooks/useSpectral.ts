import { useState, useEffect } from 'react';
import useAlanSocket from '../../../packages/runtime-bridge/src/useAlanSocket';
import { SpectralState } from '../../../packages/runtime-bridge/src/SpectralMonitor';
import { alertSystem } from '../../../packages/runtime-bridge/src/SpectralAlertSystem';

/**
 * Hook to access spectral monitor data
 * 
 * This hook subscribes to spectral state updates from the WebSocket and provides
 * the latest spectral information about the concept graph.
 * 
 * @returns The latest spectral state
 */
export function useSpectral() {
  const [spectralData, setSpectralData] = useState<SpectralState | null>(null);
  const [history, setHistory] = useState<SpectralState[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  // Custom message handler for WebSocket messages
  const handleMessage = (message: any) => {
    // Handle spectral_state messages
    if (message.kind === 'concept_update' && 
        message.payload?.type === 'spectral_state') {
      
      const newState = message.payload.data as SpectralState;
      
      // Update current state
      setSpectralData(newState);
      
      // Process for alerts
      const alert = alertSystem.processSpectralState(newState);
      if (alert) {
        setAlerts(prev => [...prev.slice(-19), alert]);
      }
      
      // Add to history (limited to last 100 entries)
      setHistory(prev => {
        const updated = [...prev, newState];
        if (updated.length > 100) {
          return updated.slice(-100);
        }
        return updated;
      });
    }
  };
  
  // Use the WebSocket hook
  const { status, send } = useAlanSocket(handleMessage);
  
  // Track connection status
  useEffect(() => {
    setIsConnected(status === 'open');
  }, [status]);
  
  // Request spectral data when connection is established
  useEffect(() => {
    if (isConnected) {
      // When first connected, request current spectral state
      // In a production environment, you might add a specific message kind for this
      console.log('Connected to WebSocket, spectral data will stream automatically');
    }
  }, [isConnected, send]);
  
  return {
    /** Current spectral state */
    spectralData,
    
    /** History of recent spectral states (limited to last 100) */
    history,
    
    /** Recent alerts from the alert system */
    alerts,
    
    /** Whether connected to the WebSocket */
    isConnected,
    
    /** WebSocket connection status */
    connectionStatus: status,
    
    /** Get spectral coherence (0-1) or null if no data */
    getCoherence: () => spectralData?.coherence ?? null,
    
    /** Get order parameter (0-1) or null if no data */
    getOrderParameter: () => spectralData?.orderParameter ?? null,
    
    /** Check if drift is detected */
    isDriftDetected: () => spectralData?.driftDetected ?? false,
    
    /** Get array of concepts that are drifting */
    getDriftingConcepts: () => spectralData?.driftingConcepts ?? [],
    
    /** Get spectral connectivity metric (0-1) or null if no data */
    getConnectivity: () => spectralData?.connectivity ?? null,
    
    /** Acknowledge an alert by ID */
    acknowledgeAlert: (id: string) => alertSystem.acknowledgeAlert(id),
    
    /** Get unacknowledged alerts */
    getUnacknowledgedAlerts: () => alerts.filter(a => !a.acknowledged)
  };
}

export default useSpectral;
