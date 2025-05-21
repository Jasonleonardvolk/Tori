/**
 * Standalone Chat Bundle
 * 
 * This file serves as the entry point for the standalone chat application.
 * When built with vite.standalone.config.js, it produces a bundle that
 * can be used in chat/standalone.html either directly or via the dev server.
 */

// Import base styles
import './index.css';

// Initialize chat functionality when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Get chat elements
  const chatMessages = document.querySelector('.chat-messages');
  const chatForm = document.querySelector('.chat-input-form');
  const messageInput = document.querySelector('.message-input');
  const clearButton = document.querySelector('.clear-button');
  
  // System welcome message
  addMessage('Welcome to TORI Chat Standalone! This is a simplified interface for direct interaction.', 'system');
  
  // Add initial assistant message
  addMessage('Hello! I\'m TORI, your AI assistant. How can I help you today?', 'assistant');
  
  // Handle message sending
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
      // Add user message to chat
      addMessage(message, 'user');
      
      // Clear input
      messageInput.value = '';
      
      // Simulate assistant response (in a real app, this would be an API call)
      simulateResponse(message);
    }
  });
  
  // Handle clear chat
  clearButton.addEventListener('click', () => {
    chatMessages.innerHTML = '';
    addMessage('Chat history cleared.', 'system');
  });
  
  // Adjust textarea height as user types
  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = messageInput.scrollHeight + 'px';
  });
  
  // Function to add messages to the chat
  function addMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-message-${type}`;
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Function to simulate assistant response
  function simulateResponse(userMessage) {
    // Add typing indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-message chat-message-loading';
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      typingIndicator.appendChild(dot);
    }
    
    loadingDiv.appendChild(typingIndicator);
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Generate response after delay
    setTimeout(() => {
      // Remove loading indicator
      chatMessages.removeChild(loadingDiv);
      
      // Demo responses
      const responses = [
        "I understand! Let me think about how I can help with that.",
        "That's an interesting question. Here's what I know about this topic...",
        "I'd be happy to assist with that request. Let me break down the approach.",
        "I can definitely help you work through this problem.",
        "Let me analyze this further to provide you with the most accurate information."
      ];
      
      // Select random response for demo
      const response = responses[Math.floor(Math.random() * responses.length)];
      addMessage(response, 'assistant');
    }, 1500);
  }
  
  console.log('Standalone chat initialized!');
});

// Export any components or functions that might be used elsewhere
export default {
  name: 'StandaloneChat',
  version: '1.0.0'
};
