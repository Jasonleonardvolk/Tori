import React, { useState, useMemo } from 'react';
import useSpectral from '../../hooks/useSpectral';
import './SpectralDashboard.css';

/**
 * SpectralDashboard component for visualizing spectral monitoring data.
 * 
 * This component provides real-time visualization of spectral coherence, 
 * order parameters, and alerts from the spectral monitoring system.
 * 
 * @param {Object} props Component props
 * @param {boolean} [props.showHistory=true] Whether to show history tab
 * @param {number} [props.historyLength=20] Number of history entries to display
 * @param {boolean} [props.showAlerts=true] Whether to show alerts tab
 * @param {string} [props.className=''] Additional CSS class names
 * @param {Object} [props.style={}] Additional inline styles
 */
const SpectralDashboard = ({
  showHistory = true,
  historyLength = 20,
  showAlerts = true,
  className = '',
  style = {}
}) => {
  const { 
    spectralData, 
    history,
    alerts,
    isConnected,
    acknowledgeAlert,
    getUnacknowledgedAlerts
  } = useSpectral();

  // State for selected alerts and tab
  const [selectedTab, setSelectedTab] = useState('overview');
  const [expandedAlertId, setExpandedAlertId] = useState(null);

  // Compute stats from spectral data
  const stats = useMemo(() => {
    if (!spectralData) {
      return null;
    }

    // Calculate stability status
    let stabilityStatus = 'stable';
    if (spectralData.coherence < 0.3) {
      stabilityStatus = 'critical';
    } else if (spectralData.coherence < 0.5) {
      stabilityStatus = 'warning';
    }

    // Calculate trend (if we have history)
    let coherenceTrend = 'stable';
    if (history.length >= 2) {
      const current = spectralData.coherence;
      const previous = history[history.length - 2].coherence;
      if (current > previous + 0.05) {
        coherenceTrend = 'up';
      } else if (current < previous - 0.05) {
        coherenceTrend = 'down';
      }
    }

    return {
      stabilityStatus,
      coherenceTrend,
      driftingConceptCount: spectralData.driftingConcepts.length
    };
  }, [spectralData, history]);

  // Get unacknowledged alerts
  const unacknowledgedAlerts = useMemo(() => {
    return getUnacknowledgedAlerts();
  }, [alerts, getUnacknowledgedAlerts]);

  // Get limited history for display
  const limitedHistory = useMemo(() => {
    return history.slice(-historyLength);
  }, [history, historyLength]);

  // Handle alert acknowledgement
  const handleAcknowledgeAlert = (id, event) => {
    event.stopPropagation();
    acknowledgeAlert(id);
  };

  // Toggle expanded alert
  const toggleExpandAlert = (id) => {
    if (expandedAlertId === id) {
      setExpandedAlertId(null);
    } else {
      setExpandedAlertId(id);
    }
  };

  if (!spectralData) {
    return (
      <div className={`spectral-dashboard spectral-dashboard--loading ${className}`} style={style}>
        <div className="spectral-dashboard__loading">
          {isConnected ? 'Waiting for spectral data...' : 'Connecting to spectral monitor...'}
        </div>
      </div>
    );
  }

  return (
    <div className={`spectral-dashboard ${className}`} style={style}>
      <div className="spectral-dashboard__header">
        <h2>Spectral Health Monitor</h2>
        <div className="spectral-dashboard__tabs">
          <button 
            className={`spectral-dashboard__tab ${selectedTab === 'overview' ? 'spectral-dashboard__tab--active' : ''}`}
            onClick={() => setSelectedTab('overview')}
          >
            Overview
          </button>
          {showHistory && (
            <button 
              className={`spectral-dashboard__tab ${selectedTab === 'history' ? 'spectral-dashboard__tab--active' : ''}`}
              onClick={() => setSelectedTab('history')}
            >
              History
            </button>
          )}
          {showAlerts && (
            <button 
              className={`spectral-dashboard__tab ${selectedTab === 'alerts' ? 'spectral-dashboard__tab--active' : ''}`}
              onClick={() => setSelectedTab('alerts')}
            >
              Alerts
              {unacknowledgedAlerts.length > 0 && (
                <span className="spectral-dashboard__alert-badge">
                  {unacknowledgedAlerts.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="spectral-dashboard__content">
        {selectedTab === 'overview' && (
          <div className="spectral-dashboard__overview">
            <div className={`spectral-dashboard__status spectral-dashboard__status--${stats?.stabilityStatus}`}>
              <h3>System Stability</h3>
              <div className="spectral-dashboard__status-indicator">
                {stats?.stabilityStatus === 'stable' && 'Stable'}
                {stats?.stabilityStatus === 'warning' && 'Warning'}
                {stats?.stabilityStatus === 'critical' && 'Critical'}
              </div>
            </div>

            <div className="spectral-dashboard__metrics">
              <div className="spectral-dashboard__metric">
                <h4>Coherence</h4>
                <div className="spectral-dashboard__metric-value">
                  {spectralData.coherence.toFixed(2)}
                  {stats?.coherenceTrend === 'up' && <span className="trend-up">↑</span>}
                  {stats?.coherenceTrend === 'down' && <span className="trend-down">↓</span>}
                </div>
                <div className="spectral-dashboard__metric-bar">
                  <div 
                    className="spectral-dashboard__metric-fill"
                    style={{ width: `${spectralData.coherence * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="spectral-dashboard__metric">
                <h4>Order Parameter</h4>
                <div className="spectral-dashboard__metric-value">
                  {spectralData.orderParameter.toFixed(2)}
                </div>
                <div className="spectral-dashboard__metric-bar">
                  <div 
                    className="spectral-dashboard__metric-fill"
                    style={{ width: `${spectralData.orderParameter * 100}%` }}
                  ></div>
                </div>
              </div>

              {spectralData.connectivity !== undefined && (
                <div className="spectral-dashboard__metric">
                  <h4>Connectivity</h4>
                  <div className="spectral-dashboard__metric-value">
                    {spectralData.connectivity.toFixed(2)}
                  </div>
                  <div className="spectral-dashboard__metric-bar">
                    <div 
                      className="spectral-dashboard__metric-fill"
                      style={{ width: `${spectralData.connectivity * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {spectralData.driftingConcepts.length > 0 && (
              <div className="spectral-dashboard__drift">
                <h4>Drifting Concepts ({spectralData.driftingConcepts.length})</h4>
                <ul className="spectral-dashboard__drift-list">
                  {spectralData.driftingConcepts.map(concept => (
                    <li key={concept} className="spectral-dashboard__drift-item">
                      {concept}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {spectralData.eigenvalues && spectralData.eigenvalues.length > 0 && (
              <div className="spectral-dashboard__eigenvalues">
                <h4>Eigenvalues</h4>
                <div className="spectral-dashboard__eigenvalue-bars">
                  {spectralData.eigenvalues.map((value, index) => (
                    <div key={index} className="spectral-dashboard__eigenvalue-bar">
                      <div 
                        className="spectral-dashboard__eigenvalue-fill"
                        style={{ height: `${value * 100}%` }}
                      ></div>
                      <div className="spectral-dashboard__eigenvalue-label">λ{index+1}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'history' && showHistory && (
          <div className="spectral-dashboard__history">
            <h3>Coherence History</h3>
            <div className="spectral-dashboard__history-chart">
              {limitedHistory.length > 0 ? (
                <div className="spectral-dashboard__chart">
                  {limitedHistory.map((state, index) => (
                    <div 
                      key={index}
                      className="spectral-dashboard__chart-bar"
                      style={{ height: `${state.coherence * 100}%` }}
                      title={`Coherence: ${state.coherence.toFixed(2)}`}
                    ></div>
                  ))}
                </div>
              ) : (
                <div className="spectral-dashboard__chart-empty">
                  No history available
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'alerts' && showAlerts && (
          <div className="spectral-dashboard__alerts">
            <h3>Stability Alerts</h3>
            {alerts.length > 0 ? (
              <ul className="spectral-dashboard__alert-list">
                {alerts.map(alert => (
                  <li 
                    key={alert.id}
                    className={`
                      spectral-dashboard__alert-item 
                      spectral-dashboard__alert-item--${alert.level} 
                      ${alert.acknowledged ? 'spectral-dashboard__alert-item--acknowledged' : ''}
                      ${expandedAlertId === alert.id ? 'spectral-dashboard__alert-item--expanded' : ''}
                    `}
                    onClick={() => toggleExpandAlert(alert.id)}
                  >
                    <div className="spectral-dashboard__alert-header">
                      <span className="spectral-dashboard__alert-level">{alert.level}</span>
                      <span className="spectral-dashboard__alert-message">{alert.message}</span>
                      <span className="spectral-dashboard__alert-time">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                      {!alert.acknowledged && (
                        <button 
                          className="spectral-dashboard__alert-ack"
                          onClick={(e) => handleAcknowledgeAlert(alert.id, e)}
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                    {expandedAlertId === alert.id && (
                      <div className="spectral-dashboard__alert-details">
                        <div>Coherence: {alert.details.coherence.toFixed(3)}</div>
                        <div>Threshold: {alert.details.threshold.toFixed(3)}</div>
                        {alert.details.driftingConcepts.length > 0 && (
                          <div>
                            <div>Drifting Concepts:</div>
                            <ul className="spectral-dashboard__alert-concepts">
                              {alert.details.driftingConcepts.map(concept => (
                                <li key={concept}>{concept}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="spectral-dashboard__alerts-empty">
                No alerts recorded
              </div>
            )}
          </div>
        )}
      </div>

      <div className="spectral-dashboard__footer">
        <div className="spectral-dashboard__connection">
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        <div className="spectral-dashboard__timestamp">
          Last Update: {new Date(spectralData.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default SpectralDashboard;
