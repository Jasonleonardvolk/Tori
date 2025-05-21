import React, { useState, useEffect, useRef } from 'react';
import './AgentPanel.css';

/**
 * ConsoleAgent Component
 * 
 * Interactive console for communicating with agents directly.
 * Provides a chat-like interface with command history.
 */
const ConsoleAgent = ({ mode }) => {
  // State for console history
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Reference to scroll to bottom of console
  const consoleEndRef = useRef(null);
  
  // Load initial greeting on mount
  useEffect(() => {
    const initialMessage = {
      type: 'system',
      content: 'Alan Console Agent initialized. Ask about the codebase, suggest refactors, or request analysis.',
      timestamp: new Date().toISOString()
    };
    
    setHistory([initialMessage]);
  }, []);
  
  // Scroll to bottom when history changes
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);
  // ... (rest of unchanged code)
  return (
    <div className="console-agent">
      <div className="console-history">
        {history.map((entry, index) => (
          <div key={index} className={`console-entry console-${entry.type}`}>
            <span className="console-timestamp">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
            <span className="console-content">{entry.content}</span>
          </div>
        ))}
        <div ref={consoleEndRef} />
      </div>
      
      <div className="console-input-area">
        <input
          type="text"
          className="console-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a command or question..."
          disabled={isProcessing}
        />
        <button 
          className="console-submit"
          disabled={isProcessing || !inputValue.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ConsoleAgent;
