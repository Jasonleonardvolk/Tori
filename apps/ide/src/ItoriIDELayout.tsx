import React, { useState } from 'react';
import { RuntimeProvider } from '@itori/runtime-bridge';
import { CodeWorkspace, ErrorBoundary, WebSocketStatus } from '@itori/ui-kit';

import './ItoriIDELayout.css';

/**
 * ITORI IDE Layout - Main IDE interface
 * 
 * Provides a layout with:
 * - Code editor pane (center)
 * - Chat dock (right)
 * - Phase visualization (bottom)
 */
export const ItoriIDELayout: React.FC = () => {
  const [code, setCode] = useState<string>('{\n  "hello": "world"\n}');
  
  return (
    <ErrorBoundary>
      <RuntimeProvider>
        <div className="itori-ide-layout">
          <header className="ide-header">
            <h1>ITORI IDE</h1>
            <div className="connection-status">
              <WebSocketStatus />
            </div>
          </header>
          
          <main className="ide-content">
            <div className="editor-pane">
              <CodeWorkspace
                value={code}
                onChange={setCode}
                language="json"
              />
            </div>
            
            <div className="chat-dock">
              <div className="chat-dock-header">
                <h2>Chat</h2>
              </div>
              <div className="chat-dock-content">
                {/* ChatWindow component will be added here */}
                <div className="placeholder-chat">
                  <p>Chat component placeholder</p>
                </div>
              </div>
            </div>
          </main>
          
          <footer className="ide-footer">
            <div className="phase-viz-placeholder">
              <p>Phase visualization placeholder</p>
            </div>
          </footer>
        </div>
      </RuntimeProvider>
    </ErrorBoundary>
  );
};

export default ItoriIDELayout;
