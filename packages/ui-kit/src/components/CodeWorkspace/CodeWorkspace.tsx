import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { json } from '@codemirror/lang-json';
import { elfinLanguage } from '../../languages/elfin';

export interface CodeWorkspaceProps {
  /** Initial value for the editor */
  value?: string;
  /** Called when the content changes */
  onChange?: (value: string) => void;
  /** Language mode - currently only 'json' is supported */
  language?: 'json' | 'elfin';
  /** Editor height */
  height?: string;
  /** Read-only mode */
  readOnly?: boolean;
  /** CSS class name */
  className?: string;
}

/**
 * CodeWorkspace component provides a CodeMirror editor for editing code.
 */
export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({
  value = '',
  onChange,
  language = 'json',
  height = '100%',
  readOnly = false,
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Set up CodeMirror
  useEffect(() => {
    if (!editorRef.current) return;
    
    // If we already have a view, destroy it before creating a new one
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    // Basic extensions array
    const extensions = [];
    
    // Add language support
    if (language === 'json') {
      extensions.push(json());
    } else if (language === 'elfin') {
      extensions.push(elfinLanguage());
    }
    
    // Add read-only status
    if (readOnly) {
      extensions.push(EditorView.editable.of(false));
    }
    
    // Add change handler
    if (onChange) {
      extensions.push(
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        })
      );
    }

    // Create editor state and view
    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    // Store the view for later destruction
    viewRef.current = view;

    // Clean up on unmount
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
      }
    };
  }, [value, onChange, language, readOnly]);

  return (
    <div 
      className={`itori-code-workspace ${className}`} 
      style={{ 
        height, 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}
    >
      <div 
        ref={editorRef} 
        style={{ 
          flex: 1,
          overflow: 'auto'
        }}
      />
    </div>
  );
};

export default CodeWorkspace;
