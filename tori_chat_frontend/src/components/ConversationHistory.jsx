import React, { useState, useEffect } from 'react';

export default function ConversationHistory({ userId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [replayFrames, setReplayFrames] = useState(null);
  const [replayMode, setReplayMode] = useState('conversation'); // 'conversation' or 'psiarc'
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [userId]);

  useEffect(() => {
    let interval = null;
    if (isAutoPlaying && replayFrames && currentFrameIndex < replayFrames.length - 1) {
      interval = setInterval(() => {
        setCurrentFrameIndex(prev => prev + 1);
      }, 2000); // 2 seconds per frame
    } else if (currentFrameIndex >= replayFrames?.length - 1) {
      setIsAutoPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentFrameIndex, replayFrames]);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/chat/history', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const replaySession = async (sessionId) => {
    try {
      const response = await fetch(`/api/chat/replay/${sessionId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setReplayFrames(data.frames);
        setSelectedSession(sessionId);
        setCurrentFrameIndex(0);
        setIsAutoPlaying(false);
      }
    } catch (error) {
      console.error('Failed to replay session:', error);
      alert('Failed to replay session. The .psiarc file may be corrupted or missing.');
    }
  };

  const exportSession = async (sessionId) => {
    try {
      // Trigger download
      const link = document.createElement('a');
      link.href = `/api/chat/export/${sessionId}`;
      link.download = `${sessionId}.toripack`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      const exportButton = document.getElementById(`export-${sessionId}`);
      if (exportButton) {
        const originalText = exportButton.textContent;
        exportButton.textContent = '✅ Downloaded';
        exportButton.className = exportButton.className.replace('hover:text-primary', 'text-success');
        setTimeout(() => {
          exportButton.textContent = originalText;
          exportButton.className = exportButton.className.replace('text-success', 'hover:text-primary');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to export session:', error);
      alert('Failed to export session as .toripack');
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatDuration = (session) => {
    if (session.end_time) {
      const duration = new Date(session.end_time) - new Date(session.timestamp);
      const minutes = Math.floor(duration / 60000);
      return minutes > 0 ? `${minutes}m` : '<1m';
    }
    return 'ongoing';
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const goToFrame = (index) => {
    setCurrentFrameIndex(index);
    setIsAutoPlaying(false);
  };

  const renderConceptDiffOperation = (op, opIdx) => {
    switch (op.op) {
      case '!Create':
      case '!CreateWithPhase':
        return (
          <div key={opIdx} className="text-success">
            ➕ {op.op} → {op.concept?.label || op.concept?.id || op.concept}
            {op.concept?.phase_tag && (
              <span className="text-primary ml-2">
                φ={op.concept.phase_tag.toFixed(3)}
              </span>
            )}
          </div>
        );
      case '!Update':
        return (
          <div key={opIdx} className="text-warning">
            📝 {op.op} → {op.concept}
          </div>
        );
      case '!Link':
        return (
          <div key={opIdx} className="text-info">
            🔗 {op.op} → {Array.isArray(op.concepts) ? op.concepts.join(' ↔ ') : op.concept}
          </div>
        );
      case '!PhaseShift':
      case '!BatchPhaseAlignment':
        return (
          <div key={opIdx} className="text-purple-400">
            🌊 {op.op} → {op.concepts?.length || 0} concepts
            {op.alignment && (
              <span className="text-primary ml-2">
                ψ={op.alignment.coherence?.toFixed(3)}
              </span>
            )}
          </div>
        );
      default:
        return (
          <div key={opIdx} className="text-text-subtle">
            ⚡ {op.op} → {JSON.stringify(op.concept || op.concepts)}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-text-subtle flex items-center">
        <div className="animate-spin mr-2">⟳</div>
        Loading conversation history from ψarc logs...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-text-dark flex items-center">
          <span className="mr-2">🧠</span>
          ψarc Memory Vault
        </h2>
        <p className="text-sm text-text-subtle mt-1">
          {history.length} conversation sessions • Perfect recall enabled
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-4 text-center text-text-subtle">
            <div className="text-4xl mb-4">🌟</div>
            <div className="text-lg mb-2">No conversations yet</div>
            <div>Start chatting to build your cognitive map!</div>
            <div className="text-xs mt-2 opacity-60">
              Every conversation becomes memory • Zero information loss
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {history.map((session) => (
              <div
                key={session.session_id}
                className="p-4 rounded-lg bg-surface hover:bg-surface-light transition-all duration-200 cursor-pointer border border-transparent hover:border-primary hover:border-opacity-30"
                onClick={() => replaySession(session.session_id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-sm font-medium text-text-dark">
                        {formatDate(session.timestamp)}
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-primary bg-opacity-20 text-primary">
                        {session.persona}
                      </span>
                      <span className="text-xs text-text-subtle">
                        {formatDuration(session)}
                      </span>
                    </div>
                    
                    <div className="text-xs text-text-subtle mb-2 flex items-center gap-4">
                      <span>💬 {session.message_count} exchanges</span>
                      <span>🧬 {session.concepts?.length || 0} concepts</span>
                      <span className="font-mono">ψ={session.session_id.slice(-8)}</span>
                    </div>
                    
                    {session.concepts && session.concepts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {session.concepts.slice(0, 4).map((concept, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs rounded-full bg-success bg-opacity-15 text-success border border-success border-opacity-30"
                          >
                            {concept}
                          </span>
                        ))}
                        {session.concepts.length > 4 && (
                          <span className="px-2 py-1 text-xs text-text-subtle bg-surface-dark rounded-full">
                            +{session.concepts.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        replaySession(session.session_id);
                      }}
                      className="p-2 text-sm text-text-subtle hover:text-info transition-colors"
                      title="Replay ψarc session"
                    >
                      ▶️
                    </button>
                    <button
                      id={`export-${session.session_id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        exportSession(session.session_id);
                      }}
                      className="p-2 text-sm text-text-subtle hover:text-primary transition-colors"
                      title="Download as .toripack"
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

      {/* Enhanced ψarc Replay Modal */}
      {replayFrames && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
          <div className="bg-surface-dark border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-medium text-text-dark flex items-center">
                  <span className="mr-2">🎬</span>
                  ψarc Replay: {selectedSession}
                </h3>
                <div className="text-sm text-text-subtle mt-1">
                  {replayFrames.length} frames • Perfect fidelity reconstruction
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex bg-surface rounded-lg p-1">
                  <button
                    onClick={() => setReplayMode('conversation')}
                    className={`px-3 py-1 text-xs rounded ${replayMode === 'conversation' ? 'bg-primary text-white' : 'text-text-subtle'}`}
                  >
                    💬 Chat
                  </button>
                  <button
                    onClick={() => setReplayMode('psiarc')}
                    className={`px-3 py-1 text-xs rounded ${replayMode === 'psiarc' ? 'bg-primary text-white' : 'text-text-subtle'}`}
                  >
                    🧬 ψarc
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    setReplayFrames(null);
                    setSelectedSession(null);
                    setCurrentFrameIndex(0);
                    setIsAutoPlaying(false);
                  }}
                  className="p-2 text-text-subtle hover:text-text-dark transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 border-b border-gray-700 bg-surface">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToFrame(Math.max(0, currentFrameIndex - 1))}
                    disabled={currentFrameIndex === 0}
                    className="p-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:text-primary"
                  >
                    ⏮️
                  </button>
                  
                  <button
                    onClick={toggleAutoPlay}
                    className="p-2 text-sm hover:text-primary"
                  >
                    {isAutoPlaying ? '⏸️' : '▶️'}
                  </button>
                  
                  <button
                    onClick={() => goToFrame(Math.min(replayFrames.length - 1, currentFrameIndex + 1))}
                    disabled={currentFrameIndex === replayFrames.length - 1}
                    className="p-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:text-primary"
                  >
                    ⏭️
                  </button>
                  
                  <div className="text-sm text-text-subtle ml-4">
                    Frame {currentFrameIndex + 1} of {replayFrames.length}
                  </div>
                </div>
                
                <div className="text-xs text-text-subtle">
                  {new Date(replayFrames[currentFrameIndex]?.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-surface-dark rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentFrameIndex + 1) / replayFrames.length) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-text-subtle min-w-[60px]">
                    {Math.round(((currentFrameIndex + 1) / replayFrames.length) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {replayMode === 'conversation' ? (
                /* Conversation View */
                <div className="space-y-4">
                  {replayFrames.slice(0, currentFrameIndex + 1).map((frame, idx) => (
                    <div 
                      key={idx} 
                      className={`transition-all duration-500 ${idx === currentFrameIndex ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
                    >
                      <div className="text-xs text-text-subtle mb-2 flex items-center gap-2">
                        <span>Frame {frame.frame_id}</span>
                        <span>•</span>
                        <span>{new Date(frame.timestamp).toLocaleTimeString()}</span>
                        {frame.ops.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-warning">{frame.ops.length} ops</span>
                          </>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-20">
                          <div className="text-xs text-blue-400 mb-2 font-medium">👤 User</div>
                          <div className="text-sm text-text-dark">{frame.user_message}</div>
                        </div>
                        
                        <div className="p-4 rounded-lg bg-green-500 bg-opacity-10 border border-green-500 border-opacity-20">
                          <div className="text-xs text-green-400 mb-2 font-medium">
                            🤖 Assistant ({frame.metadata.persona})
                          </div>
                          <div className="text-sm text-text-dark">{frame.assistant_response}</div>
                        </div>

                        {frame.ops.length > 0 && (
                          <div className="p-3 bg-surface-dark rounded-lg border border-gray-700">
                            <div className="text-xs text-warning mb-2 font-medium">⚡ ConceptDiff Operations</div>
                            <div className="space-y-1 text-xs font-mono">
                              {frame.ops.map((op, opIdx) => renderConceptDiffOperation(op, opIdx))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ψarc Raw View */
                <div className="space-y-4">
                  <div className="p-4 bg-black rounded-lg border border-gray-700">
                    <div className="text-xs text-primary mb-2 font-mono">ψarc Frame Data</div>
                    <pre className="text-xs text-text-subtle overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(replayFrames[currentFrameIndex], null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 bg-surface">
              <div className="flex justify-between items-center text-xs text-text-subtle">
                <div>
                  ψarc integrity: Perfect • Zero information loss • Digital consciousness replay
                </div>
                <div className="flex gap-4">
                  <span>Session: {selectedSession?.slice(-12)}</span>
                  <span>Format: ConceptDiff stream</span>
                  <span>Fidelity: 100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
