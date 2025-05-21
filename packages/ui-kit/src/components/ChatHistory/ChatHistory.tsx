import React, { useState, useEffect, useRef } from 'react';
import './ChatHistory.css';

export interface Message {
  id?: string;
  content: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: number;
}

export interface Reference {
  id: string;
  score: number;
  message: Message;
}

export interface ChatHistoryProps {
  /** Array of messages to display */
  messages: Message[];
  /** Function called when user sends a message */
  onSendMessage: (content: string) => void;
  /** Function called when user uploads files */
  onFileUpload?: (files: File[]) => void;
  /** Maximum file size in bytes (default: 100MB) */
  maxFileSize?: number;
  /** Maximum number of files allowed (default: 10) */
  maxFiles?: number;
  /** Maximum height of the chat container */
  maxHeight?: string;
  /** Additional CSS class name */
  className?: string;
  /** Whether the chat is disabled */
  disabled?: boolean;
  /** Text to display when chat is disabled */
  disabledText?: string;
  /** Message references lookup by message ID */
  references?: Record<string, Reference[]>;
}

/**
 * ChatHistory component for displaying conversation history
 * 
 * Displays messages between user and assistant with support for
 * file uploads, references, and styling variants.
 */
export const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  onSendMessage,
  onFileUpload,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  maxFiles = 10,
  maxHeight = '600px',
  className = '',
  disabled = false,
  disabledText = 'This conversation is paused',
  references = {},
}) => {
  // State
  const [newMessage, setNewMessage] = useState('');
  const [showReferences, setShowReferences] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    state: 'uploading' | 'processing' | 'finalizing';
    progress: number;
    files: { name: string; size: number; formattedSize: string }[];
    totalFiles: number;
    statusText?: string;
  } | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Effect to scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Effect to focus input when enabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);
  
  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || disabled) return;
    
    onSendMessage(newMessage.trim());
    setNewMessage('');
  };
  
  // Handle file upload button click
  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // Validate file count
    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }
    
    // Validate file sizes
    let totalSize = 0;
    const invalidFiles: string[] = [];
    
    files.forEach(file => {
      totalSize += file.size;
      if (file.size > maxFileSize) {
        invalidFiles.push(file.name);
      }
    });
    
    if (invalidFiles.length > 0) {
      setError(`Files exceeding size limit: ${invalidFiles.join(', ')}`);
      return;
    }
    
    // Start upload process if onFileUpload is provided
    if (onFileUpload) {
      onFileUpload(files);
    }
  };

  // Toggle references for a message
  const toggleReferences = (messageId: string) => {
    setShowReferences(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <div className={`itori-chat-history ${className}`} style={{ maxHeight }}>
      {/* Error alert */}
      {error && (
        <div className="itori-chat-alert itori-error">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)} 
            className="itori-alert-dismiss"
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}
      
      {/* File upload status overlay */}
      {uploadStatus && (
        <div className="itori-upload-overlay">
          <div className="itori-upload-modal">
            <div className="itori-upload-header">
              <h3>Uploading {uploadStatus.totalFiles} file{uploadStatus.totalFiles > 1 ? 's' : ''}</h3>
              <button 
                className="itori-upload-close"
                onClick={() => setUploadStatus(null)}
                aria-label="Cancel upload"
              >
                &times;
              </button>
            </div>
            
            {/* File list */}
            <div className="itori-upload-list">
              {uploadStatus.files.map((file, index) => (
                <div key={index} className="itori-upload-item">
                  <span className="itori-upload-name">{file.name}</span>
                  <span className="itori-upload-size">{file.formattedSize}</span>
                </div>
              ))}
            </div>
            
            {/* Progress bar */}
            <div className="itori-upload-progress">
              <div className="itori-upload-progress-bar">
                <div 
                  className="itori-upload-progress-fill" 
                  style={{ width: `${uploadStatus.progress}%` }}
                ></div>
              </div>
              <div className="itori-upload-status-text">
                {uploadStatus.statusText || 'Uploading...'}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Messages container */}
      <div className="itori-chat-messages">
        {messages.length === 0 ? (
          <div className="itori-chat-empty">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id || message.timestamp} 
              className={`itori-message itori-${message.sender}`}
            >
              <div className="itori-message-content">
                {message.content}
                
                {/* Reference indicator */}
                {references[message.id || ''] && references[message.id || ''].length > 0 && (
                  <button 
                    className="itori-reference-indicator"
                    onClick={() => toggleReferences(message.id || message.timestamp.toString())}
                    title={`${references[message.id || ''].length} reference${references[message.id || ''].length !== 1 ? 's' : ''} available`}
                  >
                    {showReferences[message.id || message.timestamp.toString()] ? '▼' : '▲'} {references[message.id || ''].length}
                  </button>
                )}
                
                <div className="itori-message-timestamp">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
              
              {/* References display */}
              {references[message.id || ''] && showReferences[message.id || message.timestamp.toString()] && (
                <div className="itori-message-references">
                  <h4>Related Messages</h4>
                  {references[message.id || ''].map(ref => (
                    <div key={ref.id} className="itori-reference-item">
                      <div className="itori-reference-score">
                        {Math.round(ref.score * 100)}% match
                      </div>
                      <div className="itori-reference-content">
                        {ref.message.content}
                      </div>
                      <div className="itori-reference-timestamp">
                        {formatTimestamp(ref.message.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input form */}
      <form 
        className="itori-chat-input-form" 
        onSubmit={handleSendMessage}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        {/* Hidden file input */}
        {onFileUpload && (
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            accept=".pdf"
            onChange={handleFileSelection}
            disabled={disabled}
          />
        )}
        
        {/* File upload button */}
        {onFileUpload && (
          <button
            type="button"
            className="itori-file-upload-button"
            onClick={handleFileUploadClick}
            disabled={disabled}
            title={`Upload PDF files (max ${maxFiles} files, ${formatFileSize(maxFileSize)} each)`}
          >
            📎
          </button>
        )}
        
        <textarea
          ref={inputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          placeholder={
            disabled 
              ? disabledText
              : "Type a message..."
          }
          disabled={disabled}
          className="itori-chat-input"
          rows={1}
        />
        <button 
          type="submit" 
          className="itori-chat-send-button"
          disabled={!newMessage.trim() || disabled}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatHistory;
