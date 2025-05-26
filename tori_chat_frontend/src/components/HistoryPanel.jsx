import React, { useState, useEffect } from 'react';
import ConversationHistory from './ConversationHistory';

/**
 * HistoryPanel Component
 * Displays the conversation history with ψarc storage integration
 */
export default function HistoryPanel({ user }) {
  const [activeTab, setActiveTab] = useState('conversations');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  
  // Search conversations by concept
  const searchByConcept = async () => {
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }
    
    try {
      const response = await fetch(`/api/chat/search?concept=${encodeURIComponent(searchTerm)}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };
  
  // Trigger search when search term changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        searchByConcept();
      } else {
        setSearchResults(null);
      }
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);
  
  // Save current session
  const saveCurrentSession = async () => {
    try {
      const response = await fetch('/api/chat/save-session', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Session saved:', data.sessionId);
        // Trigger refresh of history
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-surface-dark">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-medium mb-2 text-text-dark">TORI Memory</h2>
        
        {/* Concept Search Box */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by concept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-gray-700 rounded-md py-1.5 px-3 text-sm text-text-dark placeholder-text-subtle focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchTerm && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setSearchResults(null);
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-subtle hover:text-text-dark"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Search Results */}
        {searchResults && (
          <div className="mt-2 text-xs text-text-subtle">
            Found {searchResults.length} conversation{searchResults.length !== 1 ? 's' : ''} with "{searchTerm}"
          </div>
        )}
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button 
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'conversations' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-text-subtle hover:text-text-dark'
          }`}
          onClick={() => setActiveTab('conversations')}
        >
          Conversations
        </button>
        <button 
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'concepts' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-text-subtle hover:text-text-dark'
          }`}
          onClick={() => setActiveTab('concepts')}
        >
          My Concepts
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'conversations' ? (
          user ? (
            <ConversationHistory userId={user.id} />
          ) : (
            <div className="p-4 text-center text-text-subtle">
              Sign in to view your conversation history
            </div>
          )
        ) : (
          <div className="p-4">
            <UserConcepts user={user} />
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="p-3 border-t border-gray-800 space-y-2">
        <button 
          onClick={saveCurrentSession}
          className="w-full py-2 px-4 bg-surface hover:bg-surface-light text-text-dark rounded-md text-sm font-medium transition border border-gray-700"
        >
          💾 Save Current Session
        </button>
        <button className="w-full py-2 px-4 bg-primary hover:bg-primary-dark text-surface-dark rounded-md text-sm font-medium transition">
          ➕ New Conversation
        </button>
      </div>
    </div>
  );
}

// Component to display user's concepts
function UserConcepts({ user }) {
  const [concepts, setConcepts] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      loadUserConcepts();
    }
  }, [user]);
  
  const loadUserConcepts = async () => {
    try {
      const response = await fetch('/api/concepts/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConcepts(data);
      }
    } catch (error) {
      console.error('Failed to load concepts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return (
      <div className="text-center text-text-subtle">
        Sign in to view your concept map
      </div>
    );
  }
  
  if (loading) {
    return <div className="text-text-subtle">Loading concepts...</div>;
  }
  
  if (!concepts || concepts.concepts.length === 0) {
    return (
      <div className="text-center text-text-subtle">
        No concepts yet. Upload PDFs or chat to build your knowledge graph!
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="text-sm text-text-subtle mb-2">
        {concepts.totalConcepts} concepts in your cognitive map
      </div>
      <div className="flex flex-wrap gap-2">
        {concepts.concepts.map((concept, idx) => (
          <div
            key={idx}
            className="px-3 py-1.5 text-sm rounded-full bg-primary bg-opacity-20 text-primary hover:bg-opacity-30 transition-colors cursor-pointer"
            title="Click to search conversations with this concept"
          >
            {concept}
          </div>
        ))}
      </div>
    </div>
  );
}
