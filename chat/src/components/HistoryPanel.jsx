import React, { useState } from 'react';

/**
 * HistoryPanel Component
 * Displays the chat history and project list in the left panel
 */
export default function HistoryPanel() {
  const [activeTab, setActiveTab] = useState('chats');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data - would be fetched from FileStore in a real implementation
  const chatHistory = [
    { id: 'chat1', title: 'Refactoring Session', date: '5/14/2025', persona: 'ref' },
    { id: 'chat2', title: 'Bug Hunting', date: '5/13/2025', persona: 'bug' },
    { id: 'chat3', title: 'Learning React Hooks', date: '5/12/2025', persona: 'sch' },
  ];
  
  const projects = [
    { id: 'proj1', title: 'TORI Chat', language: 'JavaScript' },
    { id: 'proj2', title: 'API Integration', language: 'Python' },
    { id: 'proj3', title: 'Data Visualization', language: 'TypeScript' },
  ];
  
  // Filter based on search term
  const filteredChats = chatHistory.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Helper to render the persona icon
  const getPersonaIcon = (persona) => {
    switch(persona) {
      case 'ref': return '🔧';
      case 'bug': return '🐛';
      case 'sch': return '📖';
      default: return '💬';
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-surface-light/10">
        <h2 className="text-lg font-medium mb-2">TORI</h2>
        
        {/* Search Box */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-light/5 border border-surface-light/10 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-subtle"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-surface-light/10">
        <button 
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'chats' ? 'text-primary border-b-2 border-primary' : 'text-text-subtle'}`}
          onClick={() => setActiveTab('chats')}
        >
          Chats
        </button>
        <button 
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'projects' ? 'text-primary border-b-2 border-primary' : 'text-text-subtle'}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' ? (
          <div className="p-2 space-y-1">
            {filteredChats.length > 0 ? (
              filteredChats.map(chat => (
                <div key={chat.id} className="p-2 hover:bg-surface-light/10 rounded cursor-pointer flex items-center">
                  <span className="mr-2">{getPersonaIcon(chat.persona)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{chat.title}</div>
                    <div className="text-xs text-text-subtle">{chat.date}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-text-subtle text-sm">
                {searchTerm ? 'No matching chats found' : 'No chat history yet'}
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredProjects.length > 0 ? (
              filteredProjects.map(project => (
                <div key={project.id} className="p-2 hover:bg-surface-light/10 rounded cursor-pointer">
                  <div className="text-sm">{project.title}</div>
                  <div className="text-xs text-text-subtle">{project.language}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-text-subtle text-sm">
                {searchTerm ? 'No matching projects found' : 'No projects yet'}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* New Chat Button */}
      <div className="p-3 border-t border-surface-light/10">
        <button className="w-full py-2 px-4 bg-primary hover:bg-primary-dark text-surface-dark rounded-md text-sm font-medium transition">
          New Chat
        </button>
      </div>
    </div>
  );
}
