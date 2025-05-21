import React, { useState, useEffect } from 'react';
import useCoherenceForecast from '../../hooks/useCoherenceForecast';
import useClusterAlerts from '../../hooks/useClusterAlerts';
import './CoherenceRibbon.css';

/**
 * CoherenceRibbon displays a small status ribbon with coherence forecast information
 * 
 * Shows current coherence status, trend, and time to critical threshold
 */
const CoherenceRibbon = () => {
  // Track whether cluster alerts tooltip is shown
  const [showClusterTooltip, setShowClusterTooltip] = useState(false);
  
  // Use hooks for coherence forecast and cluster alerts
  const {
    forecast,
    status,
    isConnected,
    isLoading,
    getTimeToThreshold,
    getTrend,
    requestForecastRefresh
  } = useCoherenceForecast({
    autoConnect: true,
    onStatusChange: (newStatus) => {
      // Optional: Play sound or show notification on status change
      if (newStatus === 'warning' || newStatus === 'critical') {
        console.log(`Coherence status changed to ${newStatus}`);
      }
    }
  });
  
  const {
    alerts: clusterAlerts,
    hasCriticalAlerts,
    getMostCriticalAlert
  } = useClusterAlerts({
    autoConnect: true,
    onNewAlert: (newAlerts) => {
      if (newAlerts && newAlerts.length > 0) {
        console.log(`Received ${newAlerts.length} cluster alerts`);
      }
    }
  });

  // Extract data for display
  const coherenceTrend = getTrend('coherence');
  const timeToThreshold = getTimeToThreshold();
  const currentCoherence = forecast?.metrics?.coherence?.forecast?.[0]?.value ?? null;
  const hasClusterWarnings = clusterAlerts && clusterAlerts.length > 0;
  const criticalCluster = hasClusterWarnings ? getMostCriticalAlert() : null;
  
  // Handle refresh button click
  const handleRefresh = () => {
    requestForecastRefresh();
  };
  
  // Toggle cluster tooltip
  const toggleClusterTooltip = () => {
    setShowClusterTooltip(!showClusterTooltip);
  };

  return (
    <div className={`coherence-ribbon coherence-ribbon--${status}`}>
      <div className="coherence-ribbon__connection">
        {isConnected ? (
          <span className="coherence-ribbon__connection-dot coherence-ribbon__connection-dot--connected" />
        ) : (
          <span className="coherence-ribbon__connection-dot coherence-ribbon__connection-dot--disconnected" />
        )}
      </div>
      
      <div className="coherence-ribbon__status">
        <span className="coherence-ribbon__label">Coherence:</span>
        <span className="coherence-ribbon__value">
          {currentCoherence !== null ? currentCoherence.toFixed(2) : '—'}
          {coherenceTrend === 'up' && <span className="coherence-ribbon__trend coherence-ribbon__trend--up">↑</span>}
          {coherenceTrend === 'down' && <span className="coherence-ribbon__trend coherence-ribbon__trend--down">↓</span>}
        </span>
      </div>
      
      {timeToThreshold && (
        <div className="coherence-ribbon__threshold">
          <span className="coherence-ribbon__threshold-label">
            {status === 'critical' ? 'Critical in:' : 'Warning in:'}
          </span>
          <span className="coherence-ribbon__threshold-value">
            {timeToThreshold} min
          </span>
        </div>
      )}
      
      {/* Cluster alerts badge */}
      {hasClusterWarnings && (
        <div 
          className="coherence-ribbon__cluster-alerts"
          onMouseEnter={toggleClusterTooltip}
          onMouseLeave={toggleClusterTooltip}
        >
          <span className="coherence-ribbon__cluster-count">
            {clusterAlerts.length} cluster{clusterAlerts.length !== 1 ? 's' : ''}
          </span>
          
          {/* Tooltip with details */}
          {showClusterTooltip && (
            <div className="coherence-ribbon__cluster-tooltip">
              <h4>Cluster Stability Alerts</h4>
              {criticalCluster && (
                <div className="coherence-ribbon__cluster-critical">
                  <p>Most critical: Cluster {criticalCluster.cluster_id}</p>
                  <p>Stability: {criticalCluster.stab_forecast.toFixed(2)}</p>
                  <p>ETA: {Math.round(criticalCluster.eta_sec / 60)} min</p>
                  {criticalCluster.root_cause && (
                    <p>Cause: {criticalCluster.root_cause}</p>
                  )}
                </div>
              )}
              <p className="coherence-ribbon__cluster-footer">
                {clusterAlerts.length} alert{clusterAlerts.length !== 1 ? 's' : ''} total
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="coherence-ribbon__actions">
        <button 
          className="coherence-ribbon__refresh"
          onClick={handleRefresh}
          disabled={isLoading || !isConnected}
        >
          {isLoading ? '⟳' : '↻'}
        </button>
      </div>
    </div>
  );
};

export default CoherenceRibbon;
