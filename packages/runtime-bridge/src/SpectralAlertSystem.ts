/**
 * SpectralAlertSystem.ts
 * 
 * This module provides an alert system for critical spectral coherence issues
 * by monitoring the spectral state and triggering alerts when thresholds are crossed.
 */

import { SpectralState } from './SpectralMonitor';

/**
 * Alert levels for the spectral alert system
 */
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

/**
 * Alert data structure with metadata
 */
export interface SpectralAlert {
  id: string;
  timestamp: number;
  level: AlertLevel;
  message: string;
  details: {
    coherence: number;
    threshold: number;
    driftingConcepts: string[];
    [key: string]: any;
  };
  acknowledged: boolean;
}

/**
 * Configuration options for the alert system
 */
export interface AlertSystemConfig {
  // Coherence threshold for warning alerts
  warningThreshold: number;
  
  // Coherence threshold for critical alerts
  criticalThreshold: number;
  
  // Minimum time between alerts (ms)
  alertCooldown: number;
  
  // Maximum alerts to keep in history
  maxAlertHistory: number;
  
  // Whether to enable desktop notifications
  enableDesktopNotifications: boolean;
}

/**
 * Default configuration for the alert system
 */
const DEFAULT_CONFIG: AlertSystemConfig = {
  warningThreshold: 0.5,
  criticalThreshold: 0.3,
  alertCooldown: 60000, // 1 minute
  maxAlertHistory: 100,
  enableDesktopNotifications: true
};

/**
 * Spectral Alert System for monitoring coherence and stability issues
 */
export class SpectralAlertSystem {
  private config: AlertSystemConfig;
  private alerts: SpectralAlert[] = [];
  private lastAlertTime: number = 0;
  private onAlertCallbacks: ((alert: SpectralAlert) => void)[] = [];
  
  /**
   * Initialize the alert system with configuration
   * @param config Configuration options
   */
  constructor(config: Partial<AlertSystemConfig> = {}) {
    // Read configuration from environment variables if available
    const warningThreshold = parseEnvVar('SPECTRAL_WARNING_THRESHOLD', '0.5');
    const criticalThreshold = parseEnvVar('SPECTRAL_CRITICAL_THRESHOLD', '0.3');
    const alertCooldown = parseEnvVar('SPECTRAL_ALERT_COOLDOWN', '60000');
    const maxAlertHistory = parseEnvVar('SPECTRAL_MAX_ALERT_HISTORY', '100');
    const enableNotifications = parseEnvBool('SPECTRAL_ENABLE_NOTIFICATIONS', true);
    
    // Create config by merging defaults, environment vars, and provided config
    this.config = {
      ...DEFAULT_CONFIG,
      warningThreshold: Number(warningThreshold),
      criticalThreshold: Number(criticalThreshold),
      alertCooldown: Number(alertCooldown),
      maxAlertHistory: Number(maxAlertHistory),
      enableDesktopNotifications: enableNotifications,
      ...config
    };
    
    // Request notification permission if enabled
    if (this.config.enableDesktopNotifications && typeof window !== 'undefined') {
      this.requestNotificationPermission();
    }
    
    console.log('Spectral Alert System initialized with thresholds:', 
      `warning=${this.config.warningThreshold}, critical=${this.config.criticalThreshold}`);
  }
  
  /**
   * Process a spectral state update and generate alerts if needed
   * @param state The spectral state to process
   * @returns Alert if one was generated, otherwise null
   */
  processSpectralState(state: SpectralState): SpectralAlert | null {
    const now = Date.now();
    const coherence = state.coherence;
    
    // Check if we're in cooldown period
    if (now - this.lastAlertTime < this.config.alertCooldown) {
      return null;
    }
    
    // Check for critical condition
    if (coherence <= this.config.criticalThreshold) {
      return this.createAlert(
        AlertLevel.CRITICAL,
        'Critical coherence level detected',
        {
          coherence,
          threshold: this.config.criticalThreshold,
          driftingConcepts: state.driftingConcepts,
          orderParameter: state.orderParameter
        }
      );
    }
    
    // Check for warning condition
    if (coherence <= this.config.warningThreshold) {
      return this.createAlert(
        AlertLevel.WARNING,
        'Low coherence level detected',
        {
          coherence,
          threshold: this.config.warningThreshold,
          driftingConcepts: state.driftingConcepts,
          orderParameter: state.orderParameter
        }
      );
    }
    
    // No alert needed
    return null;
  }
  
  /**
   * Create a new alert and add it to history
   * @param level Alert level
   * @param message Alert message
   * @param details Additional alert details
   * @returns The created alert
   */
  private createAlert(
    level: AlertLevel,
    message: string,
    details: Record<string, any>
  ): SpectralAlert {
    const now = Date.now();
    const alert: SpectralAlert = {
      id: `alert-${now}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: now,
      level,
      message,
      details,
      acknowledged: false
    };
    
    // Add to alerts history
    this.alerts.push(alert);
    
    // Trim alerts if over limit
    if (this.alerts.length > this.config.maxAlertHistory) {
      this.alerts = this.alerts.slice(-this.config.maxAlertHistory);
    }
    
    // Update last alert time
    this.lastAlertTime = now;
    
    // Trigger notifications
    this.showNotification(alert);
    
    // Call alert handlers
    this.notifyAlertHandlers(alert);
    
    return alert;
  }
  
  /**
   * Show desktop notification for an alert
   * @param alert The alert to show
   */
  private showNotification(alert: SpectralAlert): void {
    if (!this.config.enableDesktopNotifications || typeof window === 'undefined') {
      return;
    }
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Desktop notifications not supported in this browser');
      return;
    }
    
    // Check permission
    if (Notification.permission !== 'granted') {
      return;
    }
    
    // Create notification title based on alert level
    let title: string;
    switch (alert.level) {
      case AlertLevel.CRITICAL:
        title = '⚠️ CRITICAL: Coherence Issue';
        break;
      case AlertLevel.WARNING:
        title = '⚠️ WARNING: Coherence Issue';
        break;
      default:
        title = 'Spectral Alert';
    }
    
    // Create and show notification
    try {
      const notification = new Notification(title, {
        body: `${alert.message} (Coherence: ${alert.details.coherence.toFixed(2)})`,
        icon: '/favicon.ico'
      });
      
      // Close notification after 5 seconds
      setTimeout(() => notification.close(), 5000);
      
      // Mark as acknowledged when clicked
      notification.onclick = () => {
        this.acknowledgeAlert(alert.id);
        notification.close();
      };
    } catch (e) {
      console.error('Failed to show notification:', e);
    }
  }
  
  /**
   * Request permission for desktop notifications
   */
  private requestNotificationPermission(): void {
    if (!('Notification' in window)) {
      console.warn('Desktop notifications not supported in this browser');
      return;
    }
    
    // Check if already granted
    if (Notification.permission === 'granted') {
      return;
    }
    
    // Request permission if not denied
    if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        console.log(`Notification permission ${permission}`);
      });
    }
  }
  
  /**
   * Mark an alert as acknowledged
   * @param id Alert ID to acknowledge
   * @returns Whether the alert was found and acknowledged
   */
  acknowledgeAlert(id: string): boolean {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }
  
  /**
   * Get all alerts in the history
   * @param options Filter options
   * @returns Filtered alerts
   */
  getAlerts(options?: {
    level?: AlertLevel,
    acknowledged?: boolean,
    limit?: number,
    since?: number
  }): SpectralAlert[] {
    let filtered = [...this.alerts];
    
    // Apply filters if provided
    if (options) {
      if (options.level !== undefined) {
        filtered = filtered.filter(a => a.level === options.level);
      }
      
      if (options.acknowledged !== undefined) {
        filtered = filtered.filter(a => a.acknowledged === options.acknowledged);
      }
      
      if (options.since !== undefined) {
        filtered = filtered.filter(a => a.timestamp >= options.since);
      }
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit if provided
    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }
  
  /**
   * Get unacknowledged alerts
   * @param level Optional alert level filter
   * @returns Unacknowledged alerts
   */
  getUnacknowledgedAlerts(level?: AlertLevel): SpectralAlert[] {
    return this.getAlerts({
      acknowledged: false,
      level
    });
  }
  
  /**
   * Register a callback for new alerts
   * @param callback Function to call when a new alert is created
   */
  onAlert(callback: (alert: SpectralAlert) => void): void {
    if (!this.onAlertCallbacks.includes(callback)) {
      this.onAlertCallbacks.push(callback);
    }
  }
  
  /**
   * Remove an alert callback
   * @param callback Callback to remove
   * @returns Whether the callback was found and removed
   */
  removeAlertCallback(callback: (alert: SpectralAlert) => void): boolean {
    const index = this.onAlertCallbacks.indexOf(callback);
    if (index >= 0) {
      this.onAlertCallbacks.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Notify all registered alert handlers
   * @param alert The alert to notify about
   */
  private notifyAlertHandlers(alert: SpectralAlert): void {
    for (const callback of this.onAlertCallbacks) {
      try {
        callback(alert);
      } catch (e) {
        console.error('Error in alert callback:', e);
      }
    }
  }
  
  /**
   * Update the alert system configuration
   * @param config New configuration (partial)
   */
  updateConfig(config: Partial<AlertSystemConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

  /**
   * Parse an environment variable with a default value
   * @param name Environment variable name
   * @param defaultValue Default value
   * @returns Parsed value
   */
  function parseEnvVar(name: string, defaultValue: string): string {
    if (typeof window !== 'undefined' && (window as any).process && (window as any).process.env) {
      return (window as any).process.env[name] || defaultValue;
    }
    
    return defaultValue;
  }
  
  /**
   * Parse a boolean environment variable
   * @param name Environment variable name
   * @param defaultValue Default value
   * @returns Parsed boolean value
   */
  function parseEnvBool(name: string, defaultValue: boolean): boolean {
    if (typeof window !== 'undefined' && (window as any).process && (window as any).process.env) {
      const val = (window as any).process.env[name];
      if (val) {
        return val.toLowerCase() === 'true' || val === '1';
      }
    }
    
    return defaultValue;
  }

// Create default instance for easy import
export const alertSystem = new SpectralAlertSystem();

/**
 * Utility function to check if the coherence is in a critical state
 * @param coherence Coherence value to check
 * @returns Whether this is a critical coherence level
 */
export function isCriticalCoherence(coherence: number): boolean {
  return coherence <= alertSystem.getConfig().criticalThreshold;
}

/**
 * Get the alert system configuration
 */
export function getAlertSystemConfig(): AlertSystemConfig {
  return alertSystem.getConfig();
}

/**
 * Extend the SpectralAlertSystem prototype to add the getConfig method
 */
SpectralAlertSystem.prototype['getConfig'] = function(): AlertSystemConfig {
  return { ...this.config };
};
