import React, { useState, useEffect } from 'react';

/**
 * ToripackViewer - Component for viewing and managing .toripack files
 * Handles viewing, validation, and importing of exported conversation packages
 */
export default function ToripackViewer({ isOpen, onClose }) {
  const [toripackData, setToripackData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null);
  const [viewMode, setViewMode] = useState('summary'); // 'summary', 'frames', 'metadata', 'raw'

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.toripack')) {
      setError('Please select a valid .toripack file');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate toripack structure
      const validation = validateToripack(data);
      setValidationStatus(validation);
      
      if (validation.valid) {
        setToripackData(data);
        setViewMode('summary');
      } else {
        setError(`Invalid .toripack file: ${validation.errors.join(', ')}`);
      }
    } catch (err) {
      setError('Failed to parse .toripack file. File may be corrupted.');
    } finally {
      setLoading(false);
    }
  };

  const validateToripack = (data) => {
    const errors = [];
    
    if (!data.version) errors.push('Missing version');
    if (!data.type) errors.push('Missing type');
    if (data.type !== 'conversation') errors.push('Invalid type - expected "conversation"');
    if (!data.session_id) errors.push('Missing session_id');
    if (!data.metadata) errors.push('Missing metadata');
    if (!Array.isArray(data.frames)) errors.push('Missing or invalid frames array');
    if (!data.checksum) errors.push('Missing checksum');
    
    // Validate frames structure
    if (Array.isArray(data.frames)) {
      data.frames.forEach((frame, idx) => {
        if (!frame.frame_id) errors.push(`Frame ${idx}: missing frame_id`);
        if (!frame.timestamp) errors.push(`Frame ${idx}: missing timestamp`);
        if (!frame.user_message && !frame.assistant_response) {
          errors.push(`Frame ${idx}: missing message content`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      frameCount: data.frames?.length || 0,
      metadata: data.metadata
    };
  };

  const calculateFileStats = (data) => {
    if (!data || !data.frames) return {};
    
    const totalMessages = data.frames.length;
    const totalOps = data.frames.reduce((sum, frame) => sum + (frame.ops?.length || 0), 0);
    const uniqueConcepts = new Set();
    
    data.frames.forEach(frame => {
      frame.ops?.forEach(op => {
        if (op.concept?.label) uniqueConcepts.add(op.concept.label);
        if (op.concept?.id) uniqueConcepts.add(op.concept.id);
        if (typeof op.concept === 'string') uniqueConcepts.add(op.concept);
      });
    });
    
    const startTime = data.frames[0]?.timestamp;
    const endTime = data.frames[data.frames.length - 1]?.timestamp;
    const duration = startTime && endTime ? 
      new Date(endTime) - new Date(startTime) : 0;
    
    return {
      totalMessages,
      totalOps,
      uniqueConcepts: uniqueConcepts.size,
      duration: Math.floor(duration / 60000), // minutes
      fileSize: JSON.stringify(data).length,
      exportTime: data.export_time
    };
  };

  const renderConceptDiffOperation = (op, opIdx) => {
    const getOpColor = (operation) => {
      switch (operation) {
        case '!Create':
        case '!CreateWithPhase': return 'text-success';
        case '!Update': return 'text-warning';
        case '!Link': return 'text-info';
        case '!PhaseShift':
        case '!BatchPhaseAlignment': return 'text-purple-400';
        default: return 'text-text-subtle';
      }
    };

    const getOpIcon = (operation) => {
      switch (operation) {
        case '!Create':
        case '!CreateWithPhase': return '➕';
        case '!Update': return '📝';
        case '!Link': return '🔗';
        case '!PhaseShift':
        case '!BatchPhaseAlignment': return '🌊';
        default: return '⚡';
      }
    };

    return (
      <div key={opIdx} className={`flex items-center gap-2 ${getOpColor(op.op)}`}>
        <span>{getOpIcon(op.op)}</span>
        <span className="font-mono text-xs">{op.op}</span>
        <span>→</span>
        <span>{op.concept?.label || op.concept?.id || op.concept || 'Unknown'}</span>
        {op.concept?.phase_tag && (
          <span className="text-primary ml-2 font-mono">
            φ={op.concept.phase_tag.toFixed(3)}
          </span>
        )}
      </div>
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-surface-dark border border-gray-700 rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-medium text-text-dark flex items-center">
              <span className="mr-2">📦</span>
              Toripack Viewer
            </h3>
            <div className="text-sm text-text-subtle mt-1">
              View and validate exported conversation packages
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-text-subtle hover:text-text-dark transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {!toripackData ? (
            /* File Upload */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-6xl mb-6">📦</div>
                <div className="text-xl mb-4 text-text-dark">Load Toripack File</div>
                <div className="text-sm text-text-subtle mb-6">
                  Upload a .toripack file to view its contents
                </div>
                
                <input
                  type="file"
                  accept=".toripack"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="toripack-upload"
                />
                <label
                  htmlFor="toripack-upload"
                  className="inline-block px-6 py-3 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary-dark transition-colors"
                >
                  {loading ? 'Loading...' : 'Choose .toripack File'}
                </label>
                
                {error && (
                  <div className="mt-4 p-3 bg-error bg-opacity-20 border border-error border-opacity-40 rounded-lg text-error">
                    {error}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Toripack Content */
            <>
              {/* Validation Status */}
              {validationStatus && (
                <div className={`p-4 border-b border-gray-700 ${validationStatus.valid ? 'bg-success bg-opacity-10' : 'bg-error bg-opacity-10'}`}>
                  <div className="flex items-center gap-2">
                    <span>{validationStatus.valid ? '✅' : '❌'}</span>
                    <span className="font-medium">
                      {validationStatus.valid ? 'Valid Toripack' : 'Invalid Toripack'}
                    </span>
                    <span className="text-sm text-text-subtle">
                      • {validationStatus.frameCount} frames
                      {!validationStatus.valid && ` • ${validationStatus.errors.length} errors`}
                    </span>
                  </div>
                  {!validationStatus.valid && (
                    <div className="mt-2 text-sm text-error">
                      Errors: {validationStatus.errors.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="p-4 border-b border-gray-700 bg-surface">
                <div className="flex gap-2">
                  {['summary', 'frames', 'metadata', 'raw'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-4 py-2 text-sm rounded ${
                        viewMode === mode
                          ? 'bg-primary text-white'
                          : 'text-text-subtle hover:text-text-dark'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6">
                {viewMode === 'summary' && (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-surface rounded-lg">
                        <h4 className="font-medium mb-3 text-text-dark">Session Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-subtle">Session ID:</span>
                            <span className="font-mono">{toripackData.session_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-subtle">Type:</span>
                            <span>{toripackData.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-subtle">Version:</span>
                            <span>{toripackData.version}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-subtle">Exported:</span>
                            <span>{new Date(toripackData.export_time).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-surface rounded-lg">
                        <h4 className="font-medium mb-3 text-text-dark">Statistics</h4>
                        <div className="space-y-2 text-sm">
                          {(() => {
                            const stats = calculateFileStats(toripackData);
                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-text-subtle">Messages:</span>
                                  <span>{stats.totalMessages}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-subtle">Operations:</span>
                                  <span>{stats.totalOps}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-subtle">Concepts:</span>
                                  <span>{stats.uniqueConcepts}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-subtle">Duration:</span>
                                  <span>{formatDuration(stats.duration)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-subtle">File Size:</span>
                                  <span>{formatFileSize(stats.fileSize)}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    {toripackData.metadata && (
                      <div className="p-4 bg-surface rounded-lg">
                        <h4 className="font-medium mb-3 text-text-dark">Metadata</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-text-subtle">User:</span>
                              <span>{toripackData.metadata.user_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-subtle">Persona:</span>
                              <span>{toripackData.metadata.persona}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-subtle">Start Time:</span>
                              <span>{new Date(toripackData.metadata.start_time).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-text-subtle">End Time:</span>
                              <span>{new Date(toripackData.metadata.end_time).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-subtle">Frame Count:</span>
                              <span>{toripackData.metadata.frame_count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-subtle">Corpus:</span>
                              <span>{toripackData.metadata.corpus}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {viewMode === 'frames' && (
                  <div className="space-y-4">
                    <div className="text-sm text-text-subtle mb-4">
                      {toripackData.frames.length} conversation frames
                    </div>
                    {toripackData.frames.map((frame, idx) => (
                      <div key={idx} className="p-4 bg-surface rounded-lg border border-gray-700">
                        <div className="text-xs text-text-subtle mb-3 flex items-center gap-2">
                          <span>Frame {frame.frame_id}</span>
                          <span>•</span>
                          <span>{new Date(frame.timestamp).toLocaleString()}</span>
                          {frame.ops?.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-warning">{frame.ops.length} ops</span>
                            </>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="p-3 rounded bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-20">
                            <div className="text-xs text-blue-400 mb-1 font-medium">👤 User</div>
                            <div className="text-sm">{frame.user_message}</div>
                          </div>
                          
                          <div className="p-3 rounded bg-green-500 bg-opacity-10 border border-green-500 border-opacity-20">
                            <div className="text-xs text-green-400 mb-1 font-medium">
                              🤖 Assistant ({frame.metadata?.persona || 'unknown'})
                            </div>
                            <div className="text-sm">{frame.assistant_response}</div>
                          </div>

                          {frame.ops && frame.ops.length > 0 && (
                            <div className="p-3 bg-surface-dark rounded border border-gray-600">
                              <div className="text-xs text-warning mb-2 font-medium">⚡ ConceptDiff Operations</div>
                              <div className="space-y-1 text-xs">
                                {frame.ops.map((op, opIdx) => renderConceptDiffOperation(op, opIdx))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === 'metadata' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-surface rounded-lg">
                      <h4 className="font-medium mb-3">Full Metadata</h4>
                      <pre className="text-xs text-text-subtle bg-black p-4 rounded overflow-x-auto">
                        {JSON.stringify(toripackData.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {viewMode === 'raw' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-surface rounded-lg">
                      <h4 className="font-medium mb-3">Raw Toripack Data</h4>
                      <pre className="text-xs text-text-subtle bg-black p-4 rounded overflow-x-auto max-h-96">
                        {JSON.stringify(toripackData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-700 bg-surface">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-text-subtle">
                    Toripack integrity: {validationStatus?.valid ? 'Valid' : 'Invalid'} • 
                    Checksum: {toripackData.checksum} • 
                    Format: ConceptDiff stream
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setToripackData(null);
                        setValidationStatus(null);
                        setError(null);
                      }}
                      className="px-4 py-2 text-sm text-text-subtle hover:text-text-dark"
                    >
                      Load Another
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
