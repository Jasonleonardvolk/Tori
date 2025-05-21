/**
 * Concept Editor Panel
 * 
 * Integrates CodeMirror editor with the ConceptFieldCanvas, providing
 * bidirectional synchronization between text code and concept visualization.
 * 
 * Part of Sprint 2 - Phase 3 ALAN IDE implementation.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/javascript-hint';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/indent-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/foldgutter.css';

import ConceptFieldCanvas from '../ConceptFieldCanvas/ConceptFieldCanvas';
import editorSyncService from '../../services/editorSyncService';
import accessibilityBridgeService from '../../services/accessibilityBridgeService';
import { usePersona } from '../PersonaSelector/PersonaContext';
import './ConceptEditorPanel.css';
import GhostReaperIntegration from './GhostReaperIntegration';
import eggsEngine from '../../ghost/eggsEngine';
import '../../ghost/eggs.css';

const ConceptEditorPanel = ({ 
  initialCode = '',
  language = 'javascript',
  filePath = '',
  conceptGraphData = null,
  onCodeChange = () => {},
  onConceptSelect = () => {},
}) => {
  const editorRef = useRef(null);
  const editorElementRef = useRef(null);
  const conceptCanvasRef = useRef(null);
  // Remove unused state variable while keeping setCode for editor changes
  const [, setCode] = useState(initialCode);
  const [selectedConceptIds, setSelectedConceptIds] = useState([]);
  const [showConceptCanvas, setShowConceptCanvas] = useState(true);
  const [layout, setLayout] = useState('split-horizontal');
  const { currentPersona, getFeature } = usePersona();

  // --- GHOST/REAPER MODE INTEGRATION ---
  useEffect(() => {
    if (!editorElementRef.current) return;
    if (editorRef.current) return;
    // Initialize CodeMirror
    const cm = CodeMirror(editorElementRef.current, {
      value: initialCode,
      mode: language,
      lineNumbers: true,
      styleActiveLine: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      extraKeys: {
        'Ctrl-/': 'toggleComment',
        'Ctrl-Space': 'autocomplete',
      },
      theme: 'default',
      lineWrapping: true,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      tabSize: 2,
    });
    editorRef.current = cm;

    // Integrate Ghost & Reaper mode logic
    GhostReaperIntegration.integrateGhostReaper(cm);

    // Easter Egg triggers (demo: Doppelgänger Commit, Spectral Linter)
    let codeHistory = [];
    cm.on('change', (instance, changeObj) => {
      const code = instance.getValue();
      setCode(code);
      onCodeChange(code);
      editorSyncService.notifyCodeChange(code, filePath);
      // Track code history for Doppelgänger Commit
      if (changeObj.origin === '+input' || changeObj.origin === '+delete') {
        codeHistory.push({
          line: changeObj.text && changeObj.text.join(''),
          deleted: changeObj.origin === '+delete',
          time: Date.now()
        });
        if (codeHistory.length > 100) codeHistory.shift();
      }
      eggsEngine.tryDoppelgangerCommit({ codeHistory, cm });
      eggsEngine.trySpectralLinter({ cm });
    });

    // Accessibility bridge
    accessibilityBridgeService.connect(cm, editorElementRef.current);

    // Focus on mount
    cm.focus();
  }, [editorElementRef, initialCode, language, filePath]);

  // ...rest of the component unchanged...

  // UI and handlers (same as before)
  // ...

  return (
    <div className={`concept-editor-panel ${layout}`}
      style={{ width: '100%', height: '100%' }}
      data-testid="concept-editor-panel"
    >
      <div
        className="code-editor-container"
        style={{ display: layout === 'concept-only' ? 'none' : 'flex' }}
      >
        <div
          ref={editorElementRef}
          className="code-editor"
          data-testid="code-editor"
          role="textbox"
          aria-label={`Code editor for ${filePath || 'untitled'}`}
        />
        <div className="editor-toolbar">
          <button
            onClick={() => setShowConceptCanvas(!showConceptCanvas)}
            aria-label={showConceptCanvas ? 'Hide concept view' : 'Show concept view'}
            title={showConceptCanvas ? 'Hide concept view' : 'Show concept view'}
            className={showConceptCanvas ? 'active' : ''}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
            </svg>
          </button>
          <button
            onClick={() => setLayout(l => l === 'split-horizontal' ? 'split-vertical' : l === 'split-vertical' ? 'split-vertical-concept-first' : l === 'split-vertical-concept-first' ? 'editor-only' : l === 'editor-only' ? 'concept-only' : 'split-horizontal')}
            aria-label="Change layout"
            title="Change layout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M3 5v14h18V5H3zm16 6h-7V7h7v4zm-9 0H5V7h5v4zm-5 2h5v4H5v-4zm7 4v-4h7v4h-7z"/>
            </svg>
          </button>
        </div>
      </div>
      {showConceptCanvas && layout !== 'editor-only' && (
        <div className="concept-canvas-container">
          <ConceptFieldCanvas
            ref={conceptCanvasRef}
            data={conceptGraphData}
            onNodeSelect={onConceptSelect}
            selectedNodeIds={selectedConceptIds}
            geometryMode="euclidean"
            showKoopmanOverlay={getFeature('showKoopmanOverlay')}
            showPhaseColors={getFeature('showPhaseColors')}
            className="integrated-concept-canvas"
          />
        </div>
      )}
    </div>
  );
};

export default ConceptEditorPanel;
