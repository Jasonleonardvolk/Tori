import React from 'react';
import './WebSocketStatus.css';

/**
 * WebSocket connection status indicator component
 * 
 * Displays a colored dot that indicates the current WebSocket connection status:
 * - Green: Connected (open)
 * - Yellow: Connecting
 * - Red: Disconnected
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - Current WebSocket status ('open', 'connecting', 'disconnected')
 * @param {Function} props.onReconnect - Optional callback for manual reconnection
 * @returns {JSX.Element} - The connection status indicator
 */
const WebSocketStatus = ({ status, onReconnect }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'open':
        return 'ws-status-connected';
      case 'connecting':
        return 'ws-status-connecting';
      case 'disconnected':
      default:
        return 'ws-status-disconnected';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'open':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="ws-status-container">
      <div className={`ws-status-dot ${getStatusColor()}`} />
      <span className="ws-status-text">{getStatusText()}</span>
      {status === 'disconnected' && onReconnect && (
        <button 
          className="ws-reconnect-button"
          onClick={onReconnect}
          aria-label="Reconnect WebSocket"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};

export default WebSocketStatus;
