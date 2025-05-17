import React from 'react';
import PropTypes from 'prop-types';
import './TimeoutNotice.css';

/**
 * TimeoutNotice Component
 * 
 * Displays a notice when a conversation has been paused due to
 * detected manipulation or other safety violations.
 * 
 * Props:
 * - timeoutInfo: Object containing timeout details
 * - onDismiss: Function to call when user acknowledges the notice
 * - showSaved: Boolean indicating whether to show saved state message
 */
const TimeoutNotice = ({ timeoutInfo, onDismiss, showSaved = true }) => {
  if (!timeoutInfo || !timeoutInfo.isTimeout) {
    return null;
  }

  const { reason, expiry, createdAt } = timeoutInfo;
  const now = Date.now();
  
  // Calculate time remaining
  const remainingMs = expiry - now;
  const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
  const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  
  // Format time remaining in a human-readable way
  let timeRemainingText = '';
  if (remainingDays > 1) {
    timeRemainingText = `${remainingDays} days`;
  } else if (remainingHours > 1) {
    timeRemainingText = `${remainingHours} hours`;
  } else if (remainingMinutes > 0) {
    timeRemainingText = `${remainingMinutes} minutes`;
  } else {
    timeRemainingText = 'less than a minute';
  }

  // Determine severity class based on timeout duration
  const totalDurationMs = expiry - createdAt;
  let severityClass = 'low';
  
  if (totalDurationMs > 7 * 24 * 60 * 60 * 1000) { // > 7 days
    severityClass = 'extreme';
  } else if (totalDurationMs > 24 * 60 * 60 * 1000) { // > 1 day
    severityClass = 'high';
  } else if (totalDurationMs > 30 * 60 * 1000) { // > 30 minutes
    severityClass = 'medium';
  }

  return (
    <div className={`timeout-notice ${severityClass}`}>
      <div className="timeout-notice-icon">
        {severityClass === 'extreme' ? '⛔' : 
         severityClass === 'high' ? '⚠️' : 
         severityClass === 'medium' ? '⚠️' : '🔍'}
      </div>
      <div className="timeout-notice-content">
        <h2 className="timeout-notice-title">Conversation Paused</h2>
        
        <p className="timeout-notice-reason">
          {reason || 'This conversation has been paused due to detected policy violations.'}
        </p>
        
        {showSaved && (
          <p className="timeout-notice-saved">
            Your conversation has been saved and will be available again in {timeRemainingText}.
          </p>
        )}
        
        <p className="timeout-notice-policy">
          Our goal is to provide a safe environment for all users. Messages that contain harassment, 
          threats, manipulation, hate speech, or other harmful content are not allowed.
        </p>
        
        {remainingMs > 5 * 60 * 1000 && ( // Only show appeal option for timeouts longer than 5 minutes
          (<p className="timeout-notice-appeal">If you believe this is a mistake, you can <a href="#appeal" className="appeal-link">request a review</a>.
                      </p>)
        )}
      </div>
      {onDismiss && (
        <button className="timeout-notice-dismiss" onClick={onDismiss}>
          Acknowledge
        </button>
      )}
    </div>
  );
};

TimeoutNotice.propTypes = {
  timeoutInfo: PropTypes.shape({
    isTimeout: PropTypes.bool.isRequired,
    reason: PropTypes.string,
    expiry: PropTypes.number,
    createdAt: PropTypes.number
  }),
  onDismiss: PropTypes.func,
  showSaved: PropTypes.bool
};

export default TimeoutNotice;
