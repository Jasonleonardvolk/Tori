import React from 'react';
import './QuickActionsBar.css';

export interface ActionChip {
  id: string;
  label: string;
  icon: string;
  hint: string;
}

export interface QuickActionsBarProps {
  /** Array of action chips to display */
  chips: ActionChip[];
  /** Callback function when an action is clicked */
  onAction: (id: string) => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * QuickActionsBar component for displaying quick action chips
 * 
 * Provides a horizontal scrollable bar of action buttons for common operations
 */
export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  chips,
  onAction,
  className = '',
}) => {
  return (
    <div className={`itori-quick-actions-bar flex gap-2 px-4 py-2 overflow-x-auto ${className}`}>
      {chips.map(c => (
        <button
          key={c.id}
          title={c.hint}
          onClick={() => onAction(c.id)}
          className="itori-action-chip rounded-full bg-surface-dark/60 hover:bg-[--color-hover] px-3 py-1 text-xs transition whitespace-nowrap"
        >
          {c.icon} {c.label}
        </button>
      ))}
    </div>
  );
};

export default QuickActionsBar;
