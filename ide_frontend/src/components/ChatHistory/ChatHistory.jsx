import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import TimeoutNotice from '../TimeoutNotice/TimeoutNotice';
import chatHistoryService from '../../services/chatHistoryService';
import intentDetectionService from '../../services/intentDetectionService';
import manipulationDetectionService from '../../services/manipulationDetectionService';
import './ChatHistory.css';

/**
 * ChatHistory Component
 * 
 * Displays chat conversation history with intelligent references and
 * minimally intrusive intent awareness. Includes safety features for
 * detecting manipulation and enforcing timeouts.
 * 
 * Props:
 * - conversationId: ID of the conversation to display
 * - onSendMessage: Function to call when sending a message
 * - onCreateConversation: Function to call to create a new conversation
 * - maxHeight: Maximum height of the chat container
 * - className: Additional CSS class names
 */
const ChatHistory = ({
  conversationId,
  onSendMessage,
  onCreateConversation,
  maxHeight = '600px',
  className = ''
}) => {
  // State
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [references, setReferences] = useState({});
  const [showReferences, setShowReferences] = useState({});
  const [timeoutInfo, setTimeoutInfo] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [intentSummaries, setIntentSummaries] = useState({});
  const [showIntentSummary, setShowIntentSummary] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Effect to load the conversation
  useEffect(() => {
    let isMounted = true;
    
    const loadConversation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If no conversationId is provided, create a new conversation
        let convoId = conversationId;
        if (!convoId) {
          convoId = await chatHistoryService.createConversation({
            title: 'New Conversation',
            timestamp: Date.now()
          });
          
          if (onCreateConversation) {
            onCreateConversation(convoId);
          }
        }
        
        // Load the conversation data
        const convo = await chatHistoryService.getConversation(convoId);
        
        if (isMounted) {
          setConversation(convo);
          setMessages(convo.messages || []);
          
          // Check timeout status
          const timeoutStatus = await chatHistoryService.checkConversationTimeout(convoId);
          setTimeoutInfo(timeoutStatus);
          
          // Load references for messages
          const refs = {};
          for (const message of convo.messages || []) {
            try {
              const messageRefs = await chatHistoryService.findReferences(message.id);
              if (messageRefs.length > 0) {
                refs[message.id] = messageRefs;
              }
            } catch (err) {
              console.error(`Error loading references for message ${message.id}:`, err);
            }
          }
          setReferences(refs);
          
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading conversation:', err);
        if (isMounted) {
          setError('Failed to load conversation. Please try again.');
          setLoading(false);
        }
      }
    };
    
    loadConversation();
    
    return () => {
      isMounted = false;
    };
  }, [conversationId, onCreateConversation]);
  
  // Effect to scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Effect to focus input when conversation is loaded
  useEffect(() => {
    if (!loading && !error && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, error]);
  
  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversation || timeoutInfo?.isTimeout) return;
    
    try {
      // First, check for immediate red flags in the message
      const { hasRedFlags } = manipulationDetectionService.checkMessageRedFlags(newMessage);
      
      if (hasRedFlags) {
        // Show a warning and don't send the message
        setError('Your message contains content that violates our community guidelines.');
        return;
      }
      
      // Send the message
      const messageData = {
        content: newMessage,
        sender: 'user',
        timestamp: Date.now()
      };
      
      // Analyze the message in real-time
      const { messageId, hasManipulation, manipulationSeverity, needsTimeout } = 
        await manipulationDetectionService.analyzeMessageRealTime(
          messageData, 
          conversation.id
        );
      
      // Clear the input
      setNewMessage('');
      
      // Reload messages
      const updatedConvo = await chatHistoryService.getConversation(conversation.id);
      setMessages(updatedConvo.messages || []);
      
      // Check if timeout was applied
      if (needsTimeout) {
        const timeoutStatus = await chatHistoryService.checkConversationTimeout(conversation.id);
        setTimeoutInfo(timeoutStatus);
      }
      
      // Call the onSendMessage callback
      if (onSendMessage) {
        onSendMessage(messageData, messageId);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };
  
  // Handle showing/hiding references for a message
  const toggleReferences = (messageId) => {
    setShowReferences(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };
  
  // Handle dismissing the timeout notice
  const handleDismissTimeout = () => {
    // Just hide the notice UI, don't actually clear the timeout
    setTimeoutInfo(prev => ({
      ...prev,
      isAcknowledged: true
    }));
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get intent summary for a message
  const getIntentSummary = async (messageId) => {
    if (intentSummaries[messageId]) {
      setSelectedMessageId(messageId);
      setShowIntentSummary(true);
      return;
    }
    
    try {
      const intent = await intentDetectionService.detectIntent(messageId);
      
      setIntentSummaries(prev => ({
        ...prev,
        [messageId]: intent
      }));
      
      setSelectedMessageId(messageId);
      setShowIntentSummary(true);
    } catch (err) {
      console.error(`Error getting intent for message ${messageId}:`, err);
    }
  };

  // Handle file upload button click
  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };

  // Handle file selection
  const handleFileSelection = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Validate file count
    if (files.length > 10) {
      setError('Maximum 10 files allowed');
      return;
    }
    
    // Validate file sizes
    let totalSize = 0;
    const invalidFiles = [];
    
    files.forEach(file => {
      totalSize += file.size;
      if (file.size > 100 * 1024 * 1024) { // 100MB
        invalidFiles.push(file.name);
      }
    });
    
    if (invalidFiles.length > 0) {
      setError(`Files exceeding 100MB: ${invalidFiles.join(', ')}`);
      return;
    }
    
    if (totalSize > 500 * 1024 * 1024) { // 500MB
      setError('Total upload size exceeds 500MB limit');
      return;
    }
    
    // Start upload process
    const fileList = files.map(file => ({
      name: file.name,
      size: file.size,
      formattedSize: formatFileSize(file.size)
    }));
    
    setUploadStatus({
      state: 'uploading',
      progress: 0,
      files: fileList,
      totalFiles: files.length
    });
    
    // Simulate upload process
    simulateFileUpload(files);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Simulate file upload
  const simulateFileUpload = (files) => {
    let progress = 0;
    const totalSteps = 100;
    
    const uploadInterval = setInterval(() => {
      progress += 1;
      
      // Update status based on progress
      if (progress < 50) {
        setUploadStatus(prev => ({
          ...prev,
          state: 'uploading',
          progress,
          statusText: 'Uploading...'
        }));
      } else if (progress < 80) {
        setUploadStatus(prev => ({
          ...prev,
          state: 'processing',
          progress,
          statusText: 'Extracting concepts...'
        }));
      } else if (progress < 95) {
        setUploadStatus(prev => ({
          ...prev,
          state: 'processing',
          progress,
          statusText: 'Processing...'
        }));
      } else {
        setUploadStatus(prev => ({
          ...prev,
          state: 'finalizing',
          progress,
          statusText: 'Finalizing...'
        }));
      }
      
      // Complete upload
      if (progress >= totalSteps) {
        clearInterval(uploadInterval);
        completeUpload(files);
      }
    }, 50);
  };

  // Complete upload
  const completeUpload = async (files) => {
    // Clear upload status
    setUploadStatus(null);
    
    // Add system message about the upload
    const systemMessage = {
      content: `Uploaded ${files.length} file${files.length > 1 ? 's' : ''} and extracted concepts.`,
      sender: 'system',
      timestamp: Date.now()
    };
    
    // Add assistant message with concept summary
    const conceptCount = Math.floor(Math.random() * 20) + 5;
    const assistantMessage = {
      content: `I've analyzed the uploaded document${files.length > 1 ? 's' : ''} and extracted ${conceptCount} key concepts. Would you like me to summarize them or focus on any specific area?`,
      sender: 'assistant',
      timestamp: Date.now() + 800
    };
    
    // Add the messages to the chat
    setMessages(prev => [...prev, systemMessage, assistantMessage]);
  };

  // Cancel upload
  const cancelUpload = () => {
    setUploadStatus(null);
  };
  
  // Render empty state
  if (loading) {
    return (
      <div className={`chat-history-container ${className}`} style={{ maxHeight }}>
        <div className="chat-history-loading">
          <div className="chat-history-loading-spinner"></div>
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }
  
  if (error && !conversation) {
    return (
      <div className={`chat-history-container ${className}`} style={{ maxHeight }}>
        <div className="chat-history-error">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="chat-history-error-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`chat-history-container ${className}`} style={{ maxHeight }}>
      {/* Timeout notice */}
      {timeoutInfo && timeoutInfo.isTimeout && !timeoutInfo.isAcknowledged && (
        <TimeoutNotice 
          timeoutInfo={timeoutInfo} 
          onDismiss={handleDismissTimeout}
        />
      )}
      
      {/* Error alert */}
      {error && (
        <div className="chat-history-alert error">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)} 
            className="chat-history-alert-dismiss"
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Intent summary display */}
      {showIntentSummary && selectedMessageId && intentSummaries[selectedMessageId] && (
        <div className="intent-summary-overlay" onClick={() => setShowIntentSummary(false)}>
          <div className="intent-summary-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="intent-summary-close" 
              onClick={() => setShowIntentSummary(false)}
            >
              &times;
            </button>
            <h3>Message Intent Analysis</h3>
            <div className="intent-summary-content">
              <div className="intent-type">
                <strong>Type:</strong> {intentSummaries[selectedMessageId].type}
              </div>
              <div className="intent-description">
                <strong>Description:</strong> {intentSummaries[selectedMessageId].description}
              </div>
              <div className="intent-confidence">
                <strong>Confidence:</strong> {Math.round(intentSummaries[selectedMessageId].confidence * 100)}%
              </div>
              {intentSummaries[selectedMessageId].entities && 
               intentSummaries[selectedMessageId].entities.length > 0 && (
                <div className="intent-entities">
                  <strong>Detected Entities:</strong>
                  <ul>
                    {intentSummaries[selectedMessageId].entities.map((entity, idx) => (
                      <li key={idx}>
                        {entity.type}: {entity.value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File upload status overlay */}
      {uploadStatus && (
        <div className="file-upload-overlay">
          <div className="file-upload-modal">
            <div className="file-upload-header">
              <h3>Uploading {uploadStatus.totalFiles} file{uploadStatus.totalFiles > 1 ? 's' : ''}</h3>
              <button 
                className="file-upload-close" 
                onClick={cancelUpload}
              >
                &times;
              </button>
            </div>
            
            {/* File list */}
            <div className="file-upload-list">
              {uploadStatus.files.map((file, index) => (
                <div key={index} className="file-upload-item">
                  <span className="file-upload-name">{file.name}</span>
                  <span className="file-upload-size">{file.formattedSize}</span>
                </div>
              ))}
            </div>
            
            {/* Progress bar */}
            <div className="file-upload-progress">
              <div className="file-upload-progress-bar">
                <div 
                  className="file-upload-progress-fill" 
                  style={{ width: `${uploadStatus.progress}%` }}
                ></div>
              </div>
              <div className="file-upload-status-text">
                {uploadStatus.statusText}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Messages container */}
      <div className="chat-history-messages">
        {messages.length === 0 ? (
          <div className="chat-history-empty">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id || message.timestamp} 
              className={`chat-message ${message.sender}`}
            >
              <div className="message-content">
                {message.content}
                
                {/* Show intent indicator */}
                {message.sender === 'user' && message.intentDetected && (
                  <button 
                    className="message-intent-indicator"
                    onClick={() => getIntentSummary(message.id)}
                    title="View message intent"
                  >
                    i
                  </button>
                )}
                
                {/* Reference indicator */}
                {references[message.id] && references[message.id].length > 0 && (
                  <button 
                    className="message-reference-indicator"
                    onClick={() => toggleReferences(message.id)}
                    title={`${references[message.id].length} reference${references[message.id].length !== 1 ? 's' : ''} available`}
                  >
                    {showReferences[message.id] ? '▼' : '▲'} {references[message.id].length}
                  </button>
                )}
                
                <div className="message-timestamp">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
              
              {/* References display */}
              {references[message.id] && showReferences[message.id] && (
                <div className="message-references">
                  <h4>Related Messages</h4>
                  {references[message.id].map(ref => (
                    <div key={ref.id} className="reference-item">
                      <div className="reference-score">
                        {Math.round(ref.score * 100)}% match
                      </div>
                      <div className="reference-content">
                        {ref.message.content}
                      </div>
                      <div className="reference-timestamp">
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
        className="chat-history-input-form" 
        onSubmit={handleSendMessage}
        style={{ opacity: timeoutInfo?.isTimeout ? 0.5 : 1 }}
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          multiple
          accept=".pdf"
          onChange={handleFileSelection}
        />
        
        {/* File upload button */}
        <button
          type="button"
          className="file-upload-button"
          onClick={handleFileUploadClick}
          disabled={timeoutInfo?.isTimeout}
          title="Upload PDF files (max 10 files, 100MB each, 500MB total)"
        >
          📎
        </button>
        
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
            timeoutInfo?.isTimeout 
              ? "This conversation is paused" 
              : "Type a message..."
          }
          disabled={timeoutInfo?.isTimeout}
          className="chat-history-input"
          rows={1}
        />
        <button 
          type="submit" 
          className="chat-history-send-button"
          disabled={!newMessage.trim() || timeoutInfo?.isTimeout}
        >
          Send
        </button>
      </form>
    </div>
  );
};

ChatHistory.propTypes = {
  conversationId: PropTypes.string,
  onSendMessage: PropTypes.func,
  onCreateConversation: PropTypes.func,
  maxHeight: PropTypes.string,
  className: PropTypes.string
};

export default ChatHistory;
