// ALAN IDE – Boilerplate ConceptEditorPanel (SelectionContext-aware)
// Author: Cascade (2025-05-07)
// This panel displays details for the currently selected node (from SelectionContext)

import React from 'react';
import { useSelection } from './SelectionContext';

export default function ConceptEditorPanel({ nodeData = [] }) {
  const { selected } = useSelection();
  const selectedNode = nodeData.find(n => n.id === selected[0]);
  if (!selectedNode) return (
    <div style={{padding: 20, color: '#A9B1BD'}}>Select a node to edit</div>
  );
  return (
    <div style={{padding: 20, background: 'var(--color-surface, #23272F)', borderRadius: 8}}>
      <h2 style={{color: 'var(--color-primary, #00FFCC)'}}>{selectedNode.label}</h2>
      <div><b>Phase:</b> {selectedNode.phase}</div>
      <div><b>Resonance:</b> {selectedNode.resonance}</div>
      <div><b>Entropy:</b> {selectedNode.entropy}</div>
      <div><b>Usage:</b> {selectedNode.usage}</div>
      {/* Placeholder for code editor, morph controls, etc. */}
    </div>
  );
}
