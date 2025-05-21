import { useState, useEffect, useCallback, useRef } from 'react';
import useAlanSocket from '../../../packages/runtime-bridge/src/useAlanSocket';

/**
 * Hook for accessing coherence forecast data
 * 
 * This hook connects to the forecast WebSocket to receive real-time
 * coherence forecast updates and provides methods to interact with
 * the forecast system.
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} [options.autoConnect=true] - Whether to auto-connect and request data
 * @param {Function} [options.onStatusChange] - Callback when status changes
 * @param {Function} [options.onNewForecast] - Callback when new forecast arrives
 * @returns {Object} Forecast data and methods
 */
export function useCoherenceForecast(options = {}) {
  const { 
    autoConnect = true,
    onStatusChange,
    onNewForecast
  } = options;
  
  // State
  const [forecast, setForecast] = useState(null);
  const [status, setStatus] = useState('unknown');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Last refresh time tracking to prevent spam
  const lastRefreshTime = useRef(0);
  
  // Custom message handler for WebSocket
  const handleMessage = useCallback((message) => {
    if (message.kind === 'concept_update' && 
        message.payload?.type === 'coherence_forecast') {
      
      const newForecast = message.payload.data;
      
      // Update forecast state
      setForecast(newForecast);
      setIsLoading(false);
      
      // Update status
      const newStatus = newForecast.assessment?.status || 'unknown';
      if (newStatus !== status) {
        setStatus(newStatus);
        if (onStatusChange) onStatusChange(newStatus);
      }
      
      // Call optional callback
      if (onNewForecast) onNewForecast(newForecast);
    }
    
    // Handle refresh acknowledgement
    if (message.kind === 'concept_update' && 
        message.payload?.type === 'forecast_refresh_ack') {
      setIsLoading(true);
    }
  }, [status, onStatusChange, onNewForecast]);
  
  // Use the WebSocket hook
  const { status: wsStatus, send } = useAlanSocket(handleMessage);
  
  // Track connection status
  useEffect(() => {
    const newConnected = wsStatus === 'open';
    setIsConnected(newConnected);
    
    // Optional: request refresh when first connected
    if (newConnected && autoConnect && !isLoading && !forecast) {
      requestForecastRefresh();
    }
  }, [wsStatus, autoConnect, isLoading, forecast]);
  
  /**
   * Request an immediate forecast refresh
   * @returns {boolean} Whether request was sent
   */
  const requestForecastRefresh = useCallback(() => {
    if (!isConnected) {
      console.warn('Cannot refresh forecast: not connected');
      return false;
    }
    
    // Prevent spam requests
    const now = Date.now();
    if (now - lastRefreshTime.current < 5000) { // 5 seconds minimum interval
      console.warn('Forecast refresh rate limited');
      return false;
    }
    
    // Send refresh request - using the correct message format for the websocket
    send({
      kind: 'custom_request',
      payload: {
        type: 'refresh_forecast',
        action: 'refresh_forecast'
      }
    });
    
    // Update state
    setIsLoading(true);
    lastRefreshTime.current = now;
    
    return true;
  }, [isConnected, send]);
  
  /**
   * Get the time remaining until a critical threshold is crossed
   * @returns {number|null} Time in minutes or null if no critical threshold detected
   */
  const getTimeToThreshold = useCallback(() => {
    if (!forecast?.assessment) {
      return null;
    }
    
    // Check for critical threshold
    if (forecast.assessment.time_to_critical) {
      // Convert steps to minutes (each step is 5 minutes in our system)
      return forecast.assessment.time_to_critical * 5;
    }
    
    // Check for warning threshold
    if (forecast.assessment.time_to_warning) {
      return forecast.assessment.time_to_warning * 5;
    }
    
    return null;
  }, [forecast]);
  
  /**
   * Get coherence forecast points for charting
   * @returns {Array} Array of forecast points or empty array if no forecast
   */
  const getCoherenceForecastPoints = useCallback(() => {
    if (!forecast?.metrics?.coherence?.forecast) {
      return [];
    }
    
    return forecast.metrics.coherence.forecast;
  }, [forecast]);
  
  /**
   * Get the trend direction for a metric
   * @param {string} [metric='coherence'] Metric name
   * @returns {'up'|'down'|'stable'} Trend direction
   */
  const getTrend = useCallback((metric = 'coherence') => {
    const metricForecast = forecast?.metrics?.[metric];
    if (!metricForecast || typeof metricForecast.trend !== 'number') {
      return 'stable';
    }
    
    if (metricForecast.trend > 0.01) {
      return 'up';
    } else if (metricForecast.trend < -0.01) {
      return 'down';
    } else {
      return 'stable';
    }
  }, [forecast]);
  
  return {
    /** Current forecast data */
    forecast,
    
    /** Current forecast status */
    status,
    
    /** Whether connected to the WebSocket */
    isConnected,
    
    /** Whether a forecast refresh is in progress */
    isLoading,
    
    /** WebSocket connection status */
    connectionStatus: wsStatus,
    
    /** Request an immediate forecast refresh */
    requestForecastRefresh,
    
    /** Get time until threshold crossed (minutes) */
    getTimeToThreshold,
    
    /** Get coherence forecast points for charting */
    getCoherenceForecastPoints,
    
    /** Get trend direction for a metric */
    getTrend
  };
}

export default useCoherenceForecast;
