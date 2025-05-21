/**
 * PsiNodeTooltip.tsx
 * ------------------------------------------------------------------
 * One-file, copy-and-paste implementation of an ELFIN-aware tooltip
 * for ψ-concept nodes.  No external UI libraries required.
 *
 * – Hover over the circular "NodeAvatar" and the tooltip shows:
 *     • Canonical ELFIN name (or fallback ψ-cluster-XXXX)
 *     • Unit (if any)
 *     • "Seen … ago" timestamp
 *     • Confidence %
 *     • Green badge "ELFIN verified ✅" when node.meta.source === 'ELFIN'
 *
 * – All styling is done with <style jsx> for drop-in use in a
 *   Next.js / React setup that supports styled-JSX.  Adapt as needed.
 */

import React from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface PsiNodeData {
  id: string;

  meta: {
    elfin_name?: string;
    elfin_unit?: string;
    source?: string; // 'ELFIN' | undefined
  };

  /** Unix epoch (ms) when this node last fired */
  last_seen: number;

  /** 0-1 stability / confidence score */
  confidence: number;
}

/* ------------------------------------------------------------------ */
/*  Utility helpers                                                   */
/* ------------------------------------------------------------------ */

/** "123 ms ago" / "3 hours ago" helper (no external deps) */
const timeAgo = (timestamp: number): string => {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/** 0-1 float → "91%" */
const pct = (value: number): string => `${Math.round(value * 100)}%`;

/* ------------------------------------------------------------------ */
/*  Tooltip primitive (self-contained)                                */
/* ------------------------------------------------------------------ */

interface TooltipProps {
  children: any;
  content: any;
}

const Tooltip = ({ children, content }: TooltipProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      className="tooltip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && <div className="tooltip-content">{content}</div>}

      <style jsx>{`
        .tooltip-wrap {
          position: relative;
          display: inline-block;
        }
        .tooltip-content {
          position: absolute;
          bottom: 110%;
          left: 50%;
          transform: translateX(-50%);
          background: #fff;
          border-radius: 6px;
          padding: 8px 12px;
          min-width: 200px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          animation: fade 0.15s ease;
        }
        .tooltip-content::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: #fff;
        }
        @keyframes fade {
          from {
            opacity: 0;
            transform: translate(-50%, -4px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .tooltip-content {
            background: #262626;
            color: #f0f0f0;
          }
          .tooltip-content::after {
            border-top-color: #262626;
          }
        }
      `}</style>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Node avatar (simple visual)                                       */
/* ------------------------------------------------------------------ */

interface NodeAvatarProps {
  node: PsiNodeData;
}

const NodeAvatar = ({ node }: NodeAvatarProps) => (
  <>
    <div className="node-avatar" />
    <style jsx>{`
      .node-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #6e56cf;
        display: inline-block;
        cursor: pointer;
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .node-avatar {
          background: #8a70e8; /* Slightly brighter in dark mode for contrast */
        }
      }
    `}</style>
  </>
);

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export interface PsiNodeTooltipProps {
  node: PsiNodeData;
  /** Optionally render a custom trigger element */
  children?: any;
}

export const PsiNodeTooltip = ({
  node,
  children,
}: PsiNodeTooltipProps) => {
  const name =
    node.meta.elfin_name || `ψ-cluster-${node.id.slice(0, 4)}`.toUpperCase();

  const tooltip = (
    <div className="tt">
      <p className="name">{name}</p>

      {node.meta.elfin_unit && <p className="unit">{node.meta.elfin_unit}</p>}

      <p className="sub">
        Seen <strong>{timeAgo(node.last_seen)}</strong>
      </p>
      <p className="sub">
        Confidence <strong>{pct(node.confidence)}</strong>
      </p>

      {node.meta.source === 'ELFIN' && (
        <span className="badge">ELFIN&nbsp;verified&nbsp;✅</span>
      )}

      <style jsx>{`
        .tt {
          font-family: system-ui, sans-serif;
          font-size: 14px;
          color: #333;
        }
        .name {
          margin: 0;
          font-weight: 600;
        }
        .unit {
          margin: 2px 0 6px;
          font-size: 12px;
          color: #666;
        }
        .sub {
          margin: 2px 0;
          font-size: 12px;
        }
        .badge {
          display: inline-block;
          margin-top: 6px;
          padding: 3px 6px;
          font-size: 11px;
          font-weight: 600;
          color: #166534;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 4px;
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .tt {
            color: #f0f0f0;
          }
          .unit {
            color: #aaa;
          }
          .badge {
            color: #4ade80;
            background: #052e16;
            border-color: #166534;
          }
        }
      `}</style>
    </div>
  );

  return (
    <Tooltip content={tooltip}>{children ?? <NodeAvatar node={node} />}</Tooltip>
  );
};

/* ------------------------------------------------------------------ */
/*  Example usage (remove in production)                              */
/* ------------------------------------------------------------------ */

// const Example = () => (
//   <PsiNodeTooltip
//     node={{
//       id: 'abcd1234',
//       meta: { elfin_name: 'wheelDiameter', elfin_unit: 'meter', source: 'ELFIN' },
//       last_seen: Date.now() - 42_000,
//       confidence: 0.91,
//     }}
//   />
// );

// export default Example;

export default PsiNodeTooltip;
