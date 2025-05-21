import { useState, useEffect, useCallback } from 'react';
import useAlanSocket from '../../../packages/runtime-bridge/src/useAlanSocket';

/**
 * Hook for accessing concept cluster stability alerts
 * 
 * This hook connects to the WebSocket to receive real-time cluster
 * stability alerts and provides methods to interact with the alerts.
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} [options.autoConnect=true] - Whether to auto-connect
 * @param {Function} [options.onNewAlert] - Callback when new alerts are received
 * @returns {Object} Cluster alerts data and methods
 */
export function useClusterAlerts(options = {}) {
  const { 
    autoConnect = true,
    onNewAlert
  } = options;
  
  // State
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Custom message handler for WebSocket
  const handleMessage = useCallback((message) => {
    if (message.kind === 'concept_update' && 
        message.payload?.type === 'cluster_alert') {
      
      const newAlerts = message.payload.data;
      
      // Update alerts state
      setAlerts(newAlerts);
      
      // Call optional callback
      if (onNewAlert) onNewAlert(newAlerts);
    }
  }, [onNewAlert]);
  
  // Use the WebSocket hook
  const { status: wsStatus } = useAlanSocket(handleMessage);
  
  // Track connection status
  useEffect(() => {
    setIsConnected(wsStatus === 'open');
  }, [wsStatus]);
  
  /**
   * Get the most critical alert
   * @returns {Object|null} The most critical alert or null if no alerts
   */
  const getMostCriticalAlert = useCallback(() => {
    if (!alerts || alerts.length === 0) {
      return null;
    }
    
    // Find the alert with the lowest stability forecast
    return alerts.reduce((critical, alert) => {
      return (alert.stab_forecast < critical.stab_forecast) ? alert : critical;
    }, alerts[0]);
  }, [alerts]);
  
  /**
   * Get alerts for a specific concept
   * @param {string} conceptId - The concept ID to check
   * @returns {Array} Alerts involving the specified concept
   */
  const getAlertsForConcept = useCallback((conceptId) => {
    if (!alerts || alerts.length === 0) {
      return [];
    }
    
    return alerts.filter(alert => 
      alert.concepts && alert.concepts.includes(conceptId)
    );
  }, [alerts]);
  
  /**
   * Check if there are any critical alerts
   * @param {number} [threshold=0.2] - Stability threshold to consider critical
   * @returns {boolean} Whether there are any critical alerts
   */
  const hasCriticalAlerts = useCallback((threshold = 0.2) => {
    if (!alerts || alerts.length === 0) {
      return false;
    }
    
    return alerts.some(alert => alert.stab_forecast < threshold);
  }, [alerts]);
  
  /**
   * Group alerts by root cause
   * @returns {Object} Alerts grouped by root cause
   */
  const groupAlertsByRootCause = useCallback(() => {
    if (!alerts || alerts.length === 0) {
      return {};
    }
    
    return alerts.reduce((groups, alert) => {
      const cause = alert.root_cause || 'Unknown';
      if (!groups[cause]) {
        groups[cause] = [];
      }
      groups[cause].push(alert);
      return groups;
    }, {});
  }, [alerts]);
  
  return {
    /** Current alerts */
    alerts,
    
    /** Whether connected to the WebSocket */
    isConnected,
    
    /** WebSocket connection status */
    connectionStatus: wsStatus,
    
    /** Get the most critical alert */
    getMostCriticalAlert,
    
    /** Get alerts for a specific concept */
    getAlertsForConcept,
    
    /** Check if there are any critical alerts */
    hasCriticalAlerts,
    
    /** Group alerts by root cause */
    groupAlertsByRootCause
  };
}

export default useClusterAlerts;
