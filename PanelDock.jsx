// ALAN IDE – PanelDock (Story 2.4)
// Author: Cascade (2025-05-07)
// Features: docking, resizing, live updates for cognitive side panels

import React, { useState } from 'react';

// Usage: <PanelDock><KoopmanSpectrumPanel/><PhaseDynamicsPanel/><AttractorMapPanel/></PanelDock>
export default function PanelDock({ children }) {
  // Panel state: docked (left/right), floating, size (width)
  const [dockSide, setDockSide] = useState('left'); // 'left' | 'right'
  const [width, setWidth] = useState(340);
  const [floating, setFloating] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Drag to resize
  function handleResizeStart(e) {
    setDragging(true);
    e.preventDefault();
  }
  function handleResize(e) {
    if (dragging) {
      setWidth(Math.max(220, Math.min(540, e.clientX)));
    }
  }
  function handleResizeEnd() {
    setDragging(false);
  }
  React.useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', handleResizeEnd);
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [dragging]);

  // Dock/undock controls
  function toggleDock() {
    setFloating(f => !f);
  }
  function toggleSide() {
    setDockSide(s => (s === 'left' ? 'right' : 'left'));
  }

  return floating ? (
    <div
      style={{
        position: 'absolute',
        top: 40,
        left: dockSide === 'left' ? 40 : undefined,
        right: dockSide === 'right' ? 40 : undefined,
        width,
        minHeight: 320,
        background: 'var(--color-surface, #23272F)',
        borderRadius: 10,
        boxShadow: '0 6px 36px #0007',
        zIndex: 1000,
        resize: 'horizontal',
        overflow: 'auto',
        transition: 'box-shadow 0.2s',
      }}
    >
      <PanelDockControls floating={floating} dockSide={dockSide} onToggleDock={toggleDock} onToggleSide={toggleSide} />
      <div style={{padding: 8}}>{children}</div>
    </div>
  ) : (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: dockSide === 'left' ? 0 : undefined,
        right: dockSide === 'right' ? 0 : undefined,
        width,
        height: '100%',
        background: 'var(--color-surface, #23272F)',
        borderTopRightRadius: dockSide === 'left' ? 10 : 0,
        borderBottomRightRadius: dockSide === 'left' ? 10 : 0,
        borderTopLeftRadius: dockSide === 'right' ? 10 : 0,
        borderBottomLeftRadius: dockSide === 'right' ? 10 : 0,
        boxShadow: '0 0 20px #0006',
        zIndex: 10,
        overflow: 'auto',
        transition: 'box-shadow 0.2s, width 0.2s',
        display: 'flex', flexDirection: 'column'
      }}
    >
      <PanelDockControls floating={floating} dockSide={dockSide} onToggleDock={toggleDock} onToggleSide={toggleSide} />
      <div style={{flex: 1, padding: 8}}>{children}</div>
      {/* Resize handle */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: dockSide === 'left' ? -6 : undefined,
          left: dockSide === 'right' ? -6 : undefined,
          width: 12,
          height: '100%',
          cursor: 'ew-resize',
          zIndex: 20,
        }}
        onMouseDown={handleResizeStart}
      />
    </div>
  );
}

function PanelDockControls({ floating, dockSide, onToggleDock, onToggleSide }) {
  return (
    <div style={{display: 'flex', gap: 10, alignItems: 'center', padding: 6}}>
      <button
        style={{background: '#00FFCC', color: '#23272F', border: 'none', borderRadius: 4, padding: '2px 8px', fontWeight: 600, cursor: 'pointer'}}
        onClick={onToggleDock}
      >{floating ? 'Dock' : 'Float'}</button>
      <button
        style={{background: '#FFD700', color: '#23272F', border: 'none', borderRadius: 4, padding: '2px 8px', fontWeight: 600, cursor: 'pointer'}}
        onClick={onToggleSide}
      >{dockSide === 'left' ? 'Right' : 'Left'}</button>
    </div>
  );
}
