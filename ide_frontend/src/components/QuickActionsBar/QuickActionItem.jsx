import React from "react";

/**
 * QuickActionItem
 * Props:
 * - icon: String or JSX element (agent persona icon)
 * - color: string (accent color)
 * - label: string (short action label)
 * - explanation: string (tooltip/diff preview)
 * - filePath: string (optional - path to the file to modify)
 * - rangeStart: object (optional - start position for the edit)
 * - rangeEnd: object (optional - end position for the edit)
 * - diff: object (optional - contains old and new code)
 * - impact: object (optional - contains metrics about the suggestion's impact)
 *   - type: string (e.g., "performance", "quality", etc.)
 *   - oldValue: string/number (original value)
 *   - newValue: string/number (improved value) 
 *   - unit: string (optional - unit of measurement)
 * - group: string (optional - suggestion category)
 * - isNew: boolean (optional - whether this is a new suggestion)
 * - onApply: function (apply handler)
 */
export default function QuickActionItem({ 
  icon, 
  color, 
  label, 
  explanation, 
  impact, 
  isNew = false, 
  onApply 
}) {
  // Helper function to render icon correctly whether it's a string or JSX
  const renderIcon = (icon) => {
    if (typeof icon === 'string') {
      return <span role="img" aria-label="Agent Icon">{icon}</span>;
    }
    return icon;
  };

  // Format impact values for display
  const formatImpactValue = (value, unit = '') => {
    if (typeof value === 'number') {
      // For percentage, time, or other numerical values
      return `${value}${unit}`;
    }
    return value;
  };

  // Determine if we should use the reduced animation mode
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <div
      className={`quick-action-item ${isNew && !prefersReducedMotion ? 'animate-new-suggestion' : ''}`}
      style={{
        display: "flex",
        alignItems: "center",
        background: color + "11", // subtle background
        border: `1px solid ${color}55`,
        borderRadius: 16,
        padding: "4px 12px",
        marginRight: 8,
        cursor: "pointer",
        position: "relative",
        fontSize: 14,
        transition: "background 0.2s"
      }}
      title={explanation}
      onClick={onApply}
    >
      <span 
        className={isNew && !prefersReducedMotion ? 'animate-glow' : ''}
        style={{ marginRight: 6 }}
      >
        {renderIcon(icon)}
      </span>
      <div>
        <span>{label}</span>
        
        {/* Show impact metrics with animation if available */}
        {impact && (
          <div className={`impact-indicator ${!prefersReducedMotion ? 'animate-impact' : ''}`}>
            <small style={{ color: "#aaa" }}>Impact:</small>
            <div className={`impact-value ${impact.type}`}>
              {impact.oldValue && (
                <span className="impact-old-value">
                  {formatImpactValue(impact.oldValue, impact.unit)}
                </span>
              )}
              <span className="impact-new-value">
                {formatImpactValue(impact.newValue, impact.unit)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
