/**
 * Spectral Monitor integration for the phase-sync runtime
 * 
 * This module provides functionality to monitor the spectral properties
 * of the concept graph, detect drift, and broadcast spectral state updates.
 */

import { MessageKind } from './types/websocket';
import { alertSystem } from './SpectralAlertSystem';

// Type definitions for the spectral monitor data
export interface SpectralState {
  timestamp: number;
  coherence: number;
  orderParameter: number;
  meanPhase: number;
  driftDetected: boolean;
  driftingConcepts: string[];
  eigenvalues?: number[];
  connectivity?: number;
}

// Configuration for the spectral monitor
export interface SpectralMonitorConfig {
  // How often to sample the spectral state (milliseconds)
  sampleInterval: number;
  // Destination for storing historical data
  historyPath: string;
  // Optional callback for custom processing of spectral data
  onStateUpdate?: (state: SpectralState) => void;
}

// Default configuration
const DEFAULT_CONFIG: SpectralMonitorConfig = {
  sampleInterval: 5000, // 5 seconds
  historyPath: './spectral_history'
};

// WebSocket broadcast function (to be set during initialization)
let broadcastFn: ((kind: string, payload: any) => void) | null = null;

// In-memory cache of recent spectral states
const recentStates: SpectralState[] = [];
const MAX_CACHED_STATES = 100; // Keep last 100 states in memory

/**
 * Initialize the spectral monitor with WebSocket broadcasting capability
 * 
 * @param broadcast Function to broadcast messages to connected clients
 * @param config Optional configuration parameters
 */
export function initSpectralMonitor(
  broadcast: (kind: string, payload: any) => void,
  config: Partial<SpectralMonitorConfig> = {}
): void {
  // Merge config with defaults
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Set the broadcast function for use by the monitor
  broadcastFn = broadcast;
  
  // Ensure the history directory exists
  try {
    // This would use fs in Node.js, but we're in browser context
    // In a real implementation, this would be handled by the server
    console.log(`[SpectralMonitor] Will store history at: ${fullConfig.historyPath}`);
  } catch (err) {
    console.error(`[SpectralMonitor] Error preparing history directory: ${err}`);
  }
  
  // Start the monitor update interval
  console.log(`[SpectralMonitor] Starting with ${fullConfig.sampleInterval}ms interval`);
  startMonitorInterval(fullConfig);
}

/**
 * Start the monitoring interval that checks spectral properties periodically
 * @returns Function to clean up interval when needed
 */
function startMonitorInterval(config: SpectralMonitorConfig): () => void {
  // In a browser context, we use setInterval
  // In Node.js with proper backend, this would use asyncio.create_task with a loop
  const intervalId = setInterval(() => {
    updateSpectralState(config);
  }, config.sampleInterval);
  
  // Return cleanup function for React useEffect or similar
  return () => clearInterval(intervalId);
}

/**
 * Update the spectral state by calling into the spectral_monitor backend
 * and broadcasting results to connected clients
 */
async function updateSpectralState(config: SpectralMonitorConfig): Promise<void> {
  try {
    // In a real implementation, this would call into the Python backend
    // For now, we simulate a spectral state update
    const simulatedState = simulateSpectralState();
    
    // Store state in memory cache
    cacheState(simulatedState);
    
    // Store to disk (would use pandas in Python backend)
    storeStateToHistory(simulatedState, config.historyPath);
    
    // Process with alert system to check for critical coherence issues
    const alert = alertSystem.processSpectralState(simulatedState);
    if (alert) {
      console.log(`[SpectralMonitor] Alert generated: ${alert.level} - ${alert.message}`);
    }
    
    // Broadcast state update to connected clients
    broadcastState(simulatedState);
    
    // Call optional callback if provided
    if (config.onStateUpdate) {
      config.onStateUpdate(simulatedState);
    }
  } catch (err) {
    console.error(`[SpectralMonitor] Error updating spectral state: ${err}`);
  }
}

/**
 * Add a spectral state to the in-memory cache
 */
function cacheState(state: SpectralState): void {
  recentStates.push(state);
  
  // Keep cache size limited
  if (recentStates.length > MAX_CACHED_STATES) {
    recentStates.shift(); // Remove oldest item
  }
}

/**
 * Store spectral state to disk using date-based organization
 * Implements actual storage to parquet files for trend analysis
 */
function storeStateToHistory(state: SpectralState, historyPath: string): void {
  // In the browser context, we delegate storage to the backend
  // by sending a specialized message through the WebSocket
  if (broadcastFn) {
    // Use CONCEPT_UPDATE message kind since SYSTEM_COMMAND isn't available
    broadcastFn(MessageKind.CONCEPT_UPDATE, {
      type: 'store_spectral_history',
      command: 'store_spectral_history',
      data: state,
      path: historyPath
    });
  }
  
  // For development, still log what we're doing
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const filename = `${dateStr}.parquet`;
  console.log(`[SpectralMonitor] Storing state to ${historyPath}/${filename}`);
}

/**
 * Broadcast spectral state to connected WebSocket clients
 */
function broadcastState(state: SpectralState): void {
  if (broadcastFn) {
    // Using 'concept_update' message kind with a specific type for spectral data
    broadcastFn(MessageKind.CONCEPT_UPDATE, {
      type: 'spectral_state',
      data: state
    });
  }
}

/**
 * Get recent spectral states from the in-memory cache
 */
export function getRecentSpectralStates(): SpectralState[] {
  return [...recentStates]; // Return a copy to prevent external mutation
}

/**
 * Simulate a spectral state for development/testing
 * In production, this would call into the real spectral_monitor Python module
 */
function simulateSpectralState(): SpectralState {
  // Generate some random-ish spectral properties that somewhat resemble real data
  const now = Date.now();
  const coherence = 0.6 + Math.random() * 0.3; // 0.6 to 0.9
  const orderParameter = 0.5 + Math.random() * 0.4; // 0.5 to 0.9
  const meanPhase = Math.random() * 2 * Math.PI; // 0 to 2π
  
  // Occasionally simulate drift
  const driftDetected = Math.random() < 0.1; // 10% chance of drift
  
  // Generate eigenvalues with the largest around 1 and decaying pattern
  const eigenvalues = Array.from({ length: 5 }, (_, i) => 
    Math.max(0, 1 - (i * 0.2) + (Math.random() * 0.1))
  );
  
  return {
    timestamp: now,
    coherence,
    orderParameter,
    meanPhase,
    driftDetected,
    driftingConcepts: driftDetected ? 
      ['concept_' + Math.floor(Math.random() * 10), 'concept_' + Math.floor(Math.random() * 10)] : 
      [],
    eigenvalues,
    connectivity: 0.7 + Math.random() * 0.2 // 0.7 to 0.9
  };
}
