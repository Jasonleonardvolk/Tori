import React from 'react';
import './WebSocketStatus.css';

export type WebSocketStatusProps = {
  /** Current connection status of the WebSocket */
  status: 'connecting' | 'open' | 'disconnected';
  /** Callback function for manual reconnection */
  onReconnect?: () => void;
  /** Show detailed text status (default: false) */
  showText?: boolean;
  /** Show reconnect button when disconnected (default: true) */
  showReconnect?: boolean;
  /** Additional CSS class name */
  className?: string;
};

/**
 * WebSocket status indicator component
 * 
 * Displays the current connection status of a WebSocket connection with
 * visual color indicators and optional text/reconnect button.
 */
export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  status,
  onReconnect,
  showText = false,
  showReconnect = true,
  className = '',
}) => {
  const statusText = {
    connecting: 'Connecting...',
    open: 'Connected',
    disconnected: 'Disconnected'
  };
  
  return (
    <div className={`itori-websocket-status ${className}`} data-status={status}>
      <div className="itori-websocket-status-indicator"></div>
      
      {showText && (
        <span className="itori-websocket-status-text">
          {statusText[status]}
        </span>
      )}
      
      {status === 'disconnected' && showReconnect && onReconnect && (
        <button 
          className="itori-websocket-reconnect-button"
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
