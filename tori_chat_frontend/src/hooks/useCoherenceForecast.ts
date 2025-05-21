import { useState, useEffect, useCallback, useRef } from 'react';
import useAlanSocket from '../../../packages/runtime-bridge/src/useAlanSocket';

/**
 * Forecast status type
 */
export type ForecastStatus = 'stable' | 'warning' | 'critical' | 'unknown';

/**
 * Forecast point with predicted values and confidence intervals
 */
export interface ForecastPoint {
  step: number;
  value: number;
  lower?: number | null;
  upper?: number | null;
  ewma?: number | null;
}

/**
 * Metric forecast data
 */
export interface MetricForecast {
  metric: string;
  forecast: ForecastPoint[];
  trend?: number;
  ewma?: number | null;
  crosses_threshold?: boolean;
  time_to_threshold?: number | null;
  model_type?: string;
}

/**
 * Assessment of forecast results
 */
export interface ForecastAssessment {
  status: ForecastStatus;
  message: string;
  time_to_warning?: number | null;
  time_to_critical?: number | null;
}

/**
 * Complete forecast result
 */
export interface ForecastResult {
  timestamp: string;
  metrics: {
    coherence?: MetricForecast;
    orderParameter?: MetricForecast;
    eigenvalueGap?: MetricForecast;
    [key: string]: MetricForecast | undefined;
  };
  assessment: ForecastAssessment;
}

/**
 * Hook options
 */
export interface UseCoherenceForecastOptions {
  autoConnect?: boolean;
  onStatusChange?: (status: ForecastStatus) => void;
  onNewForecast?: (forecast: ForecastResult) => void;
}

/**
 * Minimum time between refresh requests (ms)
 */
const MIN_REFRESH_INTERVAL = 5000;

/**
 * Hook for accessing coherence forecast data
 * 
 * This hook connects to the forecast WebSocket to receive real-time
 * coherence forecast updates and provides methods to interact with
 * the forecast system.
 */
export function useCoherenceForecast(options: UseCoherenceForecastOptions = {}) {
  const { 
    autoConnect = true,
    onStatusChange,
    onNewForecast
  } = options;
  
  // State
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [status, setStatus] = useState<ForecastStatus>('unknown');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Last refresh time tracking to prevent spam
  const lastRefreshTime = useRef<number>(0);
  
  // Custom message handler for WebSocket
  const handleMessage = useCallback((message: any) => {
    if (message.kind === 'concept_update' && 
        message.payload?.type === 'coherence_forecast') {
      
      const newForecast: ForecastResult = message.payload.data;
      
      // Update forecast state
      setForecast(newForecast);
      setIsLoading(false);
      
      // Update status
      const newStatus = newForecast.assessment?.status || 'unknown';
      if (newStatus !== status) {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      }
      
      // Call optional callback
      onNewForecast?.(newForecast);
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
   */
  const requestForecastRefresh = useCallback(() => {
    if (!isConnected) {
      console.warn('Cannot refresh forecast: not connected');
      return false;
    }
    
    // Prevent spam requests
    const now = Date.now();
    if (now - lastRefreshTime.current < MIN_REFRESH_INTERVAL) {
      console.warn('Forecast refresh rate limited');
      return false;
    }
    
    // Send refresh request
    send({
      action: 'refresh_forecast'
    });
    
    // Update state
    setIsLoading(true);
    lastRefreshTime.current = now;
    
    return true;
  }, [isConnected, send]);
  
  /**
   * Get the time remaining until a critical threshold is crossed
   * @returns Time in minutes or null if no critical threshold detected
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
   * @returns Array of forecast points or empty array if no forecast
   */
  const getCoherenceForecastPoints = useCallback(() => {
    if (!forecast?.metrics?.coherence?.forecast) {
      return [];
    }
    
    return forecast.metrics.coherence.forecast;
  }, [forecast]);
  
  /**
   * Get the trend direction for a metric
   * @param metric Metric name
   * @returns 'up', 'down', or 'stable'
   */
  const getTrend = useCallback((metric: string = 'coherence') => {
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
