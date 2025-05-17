import React, { useState, useEffect } from 'react';
import ChatHistory from './components/ChatHistory/ChatHistory';
import chatHistoryService from './services/chatHistoryService';
import './DemoApp.css';

/**
 * Demo Application to showcase the Chat System with Intent Detection
 * and Safety Measures for handling manipulation and timeouts
 */
const DemoApp = () => {
  // State
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Initialize the database on component mount
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await chatHistoryService.initDB();
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setError('Failed to initialize the chat database. Please refresh the page to try again.');
        setLoading(false);
      }
    };
    initializeDatabase();
  }, []);
  // Load all conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        if (loading) return;
        const allConversations = await chatHistoryService.getAllConversations({
          sortBy: 'lastModified',
          sortDir: 'desc'
        });
        setConversations(allConversations || []);
        // If no active conversation, set the most recent one as active
        if (!activeConversationId && allConversations && allConversations.length > 0) {
          setActiveConversationId(allConversations[0].id);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
        setError('Failed to load conversations. Please try again.');
        // Set empty conversations to prevent further errors
        setConversations([]);
      }
    };
    loadConversations();
  }, [loading, activeConversationId]);
  // ... (rest of unchanged code)
  return (
    <div className="demo-app">
      <h1>Chat Application Demo</h1>
      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="app-content">
          <ChatHistory 
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
          />
        </div>
      )}
    </div>
  );
};

export default DemoApp;
