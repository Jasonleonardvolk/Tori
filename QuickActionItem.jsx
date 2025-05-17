import React from "react";

/**
 * QuickActionItem
 * Props:
 * - icon: JSX element (agent persona icon)
 * - color: string (accent color)
 * - label: string (short action label)
 * - explanation: string (tooltip/diff preview)
 * - onApply: function (apply handler)
 */
export default function QuickActionItem({ icon, color, label, explanation, onApply }) {
  return (
    <div
      className="quick-action-item"
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
      <span style={{ marginRight: 6 }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
