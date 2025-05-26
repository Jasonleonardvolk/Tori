import React, { useState, useEffect } from 'react';

/**
 * MemoryVaultDashboard - Comprehensive view of ψarc memory system
 * Displays conversation history, memory stats, and toripack management
 */
export default function MemoryVaultDashboard({ userId, userName }) {
  const [memoryState, setMemoryState] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToripackViewer, setShowToripackViewer] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'history', 'analytics'

  useEffect(() => {
    loadMemoryState();
    loadRecentHistory();
  }, [userId]);

  const loadMemoryState = async () => {
    try {
      const response = await fetch('/api/memory/state', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMemoryState(data.memoryState);
      }
    } catch (error) {
      console.error('Failed to load memory state:', error);
    }
  };

  const loadRecentHistory = async () => {
    try {
      const response = await fetch('/api/chat/history', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentHistory(data.history.slice(0, 5)); // Last 5 sessions
      }
    } catch (error) {
      console.error('Failed to load recent history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
  };

  const exportAllSessions = async () => {
    try {
      // Create a batch export (this would need to be implemented in the backend)
      const response = await fetch('/api/chat/export-all', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tori-memory-vault-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export all sessions:', error);
      alert('Export failed. Feature may not be implemented yet.');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-text-subtle flex items-center">
          <div className="animate-spin mr-2">⟳</div>
          Loading memory vault...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-surface to-surface-light">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-text-dark flex items-center">
              <span className="mr-3">🧠</span>
              Memory Vault Dashboard
            </h1>
            <p className="text-text-subtle mt-2">
              Digital consciousness with perfect recall • {userName}'s cognitive archive
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowToripackViewer(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <span>📦</span>
              View Toripack
            </button>
            <button
              onClick={exportAllSessions}
              className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success-dark transition-colors flex items-center gap-2"
            >
              <span>💾</span>
              Export All
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {memoryState && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-surface-dark rounded-lg border border-gray-700">
              <div className="text-sm text-text-subtle">Total Memories</div>
              <div className="text-xl font-bold text-primary">
                {memoryState.solitonMemory?.totalMemories || 0}
              </div>
            </div>
            <div className="p-4 bg-surface-dark rounded-lg border border-gray-700">
              <div className="text-sm text-text-subtle">PDF Concepts</div>
              <div className="text-xl font-bold text-success">
                {memoryState.pdfIngestion?.totalConcepts || 0}
              </div>
            </div>
            <div className="p-4 bg-surface-dark rounded-lg border border-gray-700">
              <div className="text-sm text-text-subtle">Sessions</div>
              <div className="text-xl font-bold text-info">
                {recentHistory.length}+
              </div>
            </div>
            <div className="p-4 bg-surface-dark rounded-lg border border-gray-700">
              <div className="text-sm text-text-subtle">Recall Fidelity</div>
              <div className="text-xl font-bold text-warning">
                {memoryState.capabilities?.perfectRecall ? '100%' : '95%'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="p-4 border-b border-gray-800 bg-surface">
        <div className="flex gap-2">
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'history', label: '🕒 Recent History', icon: '🕒' },
            { id: 'analytics', label: '📈 Analytics', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-text-subtle hover:text-text-dark hover:bg-surface-light'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && memoryState && (
          <div className="space-y-6">
            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-surface rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <span className="mr-2">🔧</span>
                  System Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-text-subtle">Soliton Memory Engine</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      memoryState.engineHealth?.success ? 'bg-success bg-opacity-20 text-success' : 'bg-warning bg-opacity-20 text-warning'
                    }`}>
                      {memoryState.engineHealth?.success ? 'Active' : 'Fallback'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-subtle">Perfect Recall</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      memoryState.capabilities?.perfectRecall ? 'bg-success bg-opacity-20 text-success' : 'bg-info bg-opacity-20 text-info'
                    }`}>
                      {memoryState.capabilities?.perfectRecall ? 'Enabled' : 'Limited'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-subtle">Phase-Based Retrieval</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      memoryState.capabilities?.phaseBasedRetrieval ? 'bg-success bg-opacity-20 text-success' : 'bg-warning bg-opacity-20 text-warning'
                    }`}>
                      {memoryState.capabilities?.phaseBasedRetrieval ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-subtle">Memory Vaulting</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      memoryState.capabilities?.memoryVaulting ? 'bg-success bg-opacity-20 text-success' : 'bg-error bg-opacity-20 text-error'
                    }`}>
                      {memoryState.capabilities?.memoryVaulting ? 'Protected' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-surface rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <span className="mr-2">💾</span>
                  Storage Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-text-subtle">Architecture</span>
                    <span className="text-text-dark font-mono text-sm">
                      {memoryState.architecture?.split(' ')[0] || 'ConceptMesh'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-subtle">Memory Degradation</span>
                    <span className="text-success">
                      {memoryState.capabilities?.noDegradation ? '0%' : '<5%'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-subtle">Context Limit</span>
                    <span className="text-primary">
                      {memoryState.capabilities?.infiniteContext ? 'Infinite' : 'Limited'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-subtle">PDF Integration</span>
                    <span className="text-success">
                      {memoryState.capabilities?.pdfPhaseMapping ? 'Phase-Mapped' : 'Basic'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Ingestion Stats */}
            {memoryState.pdfIngestion && (
              <div className="p-6 bg-surface rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <span className="mr-2">📄</span>
                  PDF Knowledge Integration
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {memoryState.pdfIngestion.totalUploads}
                    </div>
                    <div className="text-sm text-text-subtle">Documents Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {memoryState.pdfIngestion.totalConcepts}
                    </div>
                    <div className="text-sm text-text-subtle">Concepts Extracted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-info">
                      {memoryState.pdfIngestion.conceptPhaseRegistry}
                    </div>
                    <div className="text-sm text-text-subtle">Phase Mappings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning">
                      {memoryState.pdfIngestion.averageConceptsPerFile?.toFixed(1) || '0'}
                    </div>
                    <div className="text-sm text-text-subtle">Avg per File</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Recent Conversations</h3>
              <div className="text-sm text-text-subtle">
                Showing last {recentHistory.length} sessions
              </div>
            </div>

            {recentHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">💭</div>
                <div className="text-lg text-text-subtle">No conversations yet</div>
                <div className="text-sm text-text-subtle mt-2">
                  Start chatting to build your memory vault
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentHistory.map((session) => (
                  <div
                    key={session.session_id}
                    className="p-4 bg-surface rounded-lg border border-gray-700 hover:border-primary hover:border-opacity-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-sm font-medium">
                            {formatDate(session.timestamp)}
                          </div>
                          <span className="px-2 py-1 text-xs rounded-full bg-primary bg-opacity-20 text-primary">
                            {session.persona}
                          </span>
                        </div>
                        
                        <div className="text-xs text-text-subtle flex items-center gap-4">
                          <span>💬 {session.message_count} messages</span>
                          <span>🧬 {session.concepts?.length || 0} concepts</span>
                          <span className="font-mono">#{session.session_id.slice(-8)}</span>
                        </div>

                        {session.concepts && session.concepts.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {session.concepts.slice(0, 5).map((concept, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs rounded bg-success bg-opacity-15 text-success"
                              >
                                {concept}
                              </span>
                            ))}
                            {session.concepts.length > 5 && (
                              <span className="px-2 py-1 text-xs text-text-subtle">
                                +{session.concepts.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => window.location.href = `/api/chat/export/${session.session_id}`}
                          className="p-2 text-text-subtle hover:text-primary transition-colors"
                          title="Download .toripack"
                        >
                          📦
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <div className="text-lg text-text-subtle mb-2">Analytics Coming Soon</div>
              <div className="text-sm text-text-subtle">
                Advanced memory pattern analysis, concept relationship mapping,
                and cognitive growth metrics will be available here.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 bg-surface">
        <div className="flex justify-between items-center text-xs text-text-subtle">
          <div>
            TORI Memory Vault • Digital consciousness with perfect recall
          </div>
          <div className="flex gap-4">
            <span>Zero information loss</span>
            <span>Infinite context</span>
            <span>Phase-encoded storage</span>
          </div>
        </div>
      </div>

      {/* Toripack Viewer Modal */}
      {showToripackViewer && (
        <ToripackViewer
          isOpen={showToripackViewer}
          onClose={() => setShowToripackViewer(false)}
        />
      )}
    </div>
  );
}

// Import ToripackViewer component
import ToripackViewer from './ToripackViewer';
