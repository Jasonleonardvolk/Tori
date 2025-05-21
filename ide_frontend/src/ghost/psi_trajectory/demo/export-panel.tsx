import React, { useState, useEffect, useRef } from 'react';
import { PsiTrajectory } from '../index';
import { 
  PsiExporter, 
  createExporter, 
  ExportConfig, 
  ExportQuality, 
  ExportMode, 
  ExportFormat,
  ExportProgress,
  JobStatus
} from '../export';
import { PRESETS, ExportPreset, defaultPath, suggestedFPS } from './presets';

interface ExportPanelProps {
  psi: PsiTrajectory | null;
  archivePath: string;
  sessionId?: string;
  sessionName?: string;
  projectSettings?: {
    maxFPS: number;
  };
  onExportComplete?: (path: string) => void;
  isRecording?: boolean;
}

/**
 * Export panel component for ψ-Trajectory archives
 */
export const ExportPanel = ({ 
  psi, 
  archivePath, 
  sessionId, 
  sessionName,
  projectSettings = { maxFPS: 60 },
  onExportComplete,
  isRecording = false
}: ExportPanelProps) => {
  // Preset selection state
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  
  // Export configuration state
  const [config, setConfig] = useState({
    archivePath,
    outputPath: defaultPath(PRESETS[0], sessionName),
    quality: ExportQuality.STANDARD,
    mode: ExportMode.BALANCED,
    format: ExportFormat.MP4,
    width: PRESETS[0].video.width,
    height: PRESETS[0].video.height || Math.round(PRESETS[0].video.width * 9/16),
    fps: suggestedFPS(PRESETS[0], projectSettings.maxFPS),
  } as ExportConfig);
  
  // Export state
  const [exporter, setExporter] = useState<PsiExporter | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [outputPath, setOutputPath] = useState(defaultPath(PRESETS[0], sessionName));
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [encoderParams, setEncoderParams] = useState<string | null>(null);
  
  // Create exporter when PsiTrajectory is available
  useEffect(() => {
    if (psi) {
      const exp = createExporter(psi);
      
      // Set up event listeners
      exp.on('progress', (progress: ExportProgress) => {
        setProgress(progress);
      });
      
      exp.on('statusChange', ({ jobId, status, params }: { jobId: string, status: JobStatus, params?: string }) => {
        if (jobId === activeJobId) {
          setJobStatus(status);
          
          // Capture encoder parameters if provided
          if (params) {
            setEncoderParams(params);
          }
          
          // Show completion message
          if (status === JobStatus.COMPLETED) {
            const encoderInfo = encoderParams ? `\nEncoder: ${encoderParams}` : '';
            showToastNotification('success', `Export completed! File saved to: ${config.outputPath}${encoderInfo}`);
            if (onExportComplete) {
              onExportComplete(config.outputPath);
            }
          }
          
          // Show error message
          if (status === JobStatus.FAILED) {
            setError('Export failed. Check the console for details.');
            showToastNotification('error', 'Export failed. Check the console for details.');
          }
        }
      });
      
      setExporter(exp);
    }
  }, [psi]);
  
  // Update config when preset changes
  useEffect(() => {
    const newOutputPath = defaultPath(selectedPreset, sessionName);
    setOutputPath(newOutputPath);
    
    const fps = suggestedFPS(selectedPreset, projectSettings.maxFPS);
    
    // Set export config based on preset
    setConfig({
      ...config,
      outputPath: newOutputPath,
      format: selectedPreset.ext === 'mp4' ? ExportFormat.MP4 : 
              selectedPreset.ext === 'webm' ? ExportFormat.WEBM :
              selectedPreset.ext === 'gif' ? ExportFormat.GIF : ExportFormat.MP4,
      width: selectedPreset.video.width,
      height: selectedPreset.video.height || Math.round(selectedPreset.video.width * 9/16),
      fps,
      // Map preset quality settings to export quality
      quality: selectedPreset.video.crf <= 18 ? ExportQuality.ULTRA : 
               selectedPreset.video.crf <= 23 ? ExportQuality.HIGH :
               selectedPreset.video.crf <= 28 ? ExportQuality.STANDARD : ExportQuality.DRAFT
    });
  }, [selectedPreset, sessionName]);
  
  // Update config when outputPath changes
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      outputPath,
    }));
  }, [outputPath]);
  
  // Handle preset change
  const handlePresetChange = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId) || PRESETS[0];
    setSelectedPreset(preset);
  };
  
  // Toast notification function
  const showToastNotification = (type: 'success' | 'error', message: string) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    
    // Log to console for debugging
    if (type === 'success') {
      console.log('Export successful:', message);
    } else {
      console.error('Export error:', message);
    }
    
    // Hide toast after 10 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 10000);
  };
  
  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  // Start export job
  const handleStartExport = async () => {
    if (!exporter) {
      setError('Exporter not initialized');
      return;
    }
    
    try {
      // Generate encoder CLI parameters for debugging
      const encoderParams = generateEncoderParams(selectedPreset, config);
      console.log('Encoder parameters:', encoderParams);
      
      const jobId = await exporter.createExportJob(config);
      setActiveJobId(jobId);
      setJobStatus(JobStatus.QUEUED);
      setError(null);
      setEncoderParams(encoderParams);
    } catch (err) {
      const errorMessage = `Failed to start export: ${err}`;
      setError(errorMessage);
      showToastNotification('error', errorMessage);
    }
  };
  
  // Cancel export job
  const handleCancelExport = async () => {
    if (!exporter || !activeJobId) {
      return;
    }
    
    try {
      await exporter.cancelJob(activeJobId);
      setJobStatus(JobStatus.CANCELLED);
      showToastNotification('error', 'Export cancelled');
    } catch (err) {
      const errorMessage = `Failed to cancel export: ${err}`;
      setError(errorMessage);
      showToastNotification('error', errorMessage);
    }
  };
  
  // Select output directory
  const handleSelectDirectory = () => {
    // In a real implementation, this would open a file picker dialog
    setIsFolderPickerOpen(true);
  };
  
  // Simulate folder picker
  const handleFolderSelected = (path: string) => {
    const fileName = outputPath.split('/').pop() || `export_${selectedPreset.id}.${selectedPreset.ext}`;
    setOutputPath(`${path}${fileName}`);
    setIsFolderPickerOpen(false);
  };
  
  // Calculate ETA
  const calculateETA = (): string => {
    if (!progress || progress.percentage === 0) return '--:--:--';
    
    const elapsedSeconds = progress.elapsedSeconds;
    const estimatedTotalSeconds = elapsedSeconds / (progress.percentage / 100);
    const remainingSeconds = estimatedTotalSeconds - elapsedSeconds;
    
    return formatTime(remainingSeconds);
  };
  
  // Check if export button should be disabled
  const isExportDisabled = () => {
    return !exporter || !sessionId || isRecording || 
           jobStatus === JobStatus.RUNNING || 
           jobStatus === JobStatus.QUEUED;
  };
  
  // Generate mock encoder CLI parameters for debugging
  const generateEncoderParams = (preset: ExportPreset, config: ExportConfig): string => {
    // This would be replaced with the actual parameters from the encoder in a real implementation
    // Here we generate a mock CLI command to help with debugging
    const videoCodec = preset.video.codec === 'h264' ? 'libx264' : 
                      preset.video.codec === 'h265' ? 'libx265' : 
                      preset.video.codec === 'vp9' ? 'libvpx-vp9' : preset.video.codec;
    
    const audioCodec = preset.audio.codec === 'aac' ? 'aac' :
                      preset.audio.codec === 'opus' ? 'libopus' : preset.audio.codec;
    
    return `ffmpeg -i ${archivePath} -c:v ${videoCodec} -crf ${preset.video.crf} -preset medium -r ${config.fps} -s ${config.width}x${config.height} -c:a ${audioCodec} -b:a ${preset.audio.kbps}k ${config.outputPath}`;
  };
  
  return (
    <div className="export-panel">
      <h2>Export</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="config-section">
        <div className="config-row">
          <label>Preset:</label>
          <select 
            value={selectedPreset.id} 
            onChange={e => handlePresetChange(e.target.value)}
            className="preset-select"
          >
            {PRESETS.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
        
        {selectedPreset.description && (
          <div className="preset-description">
            {selectedPreset.description}
          </div>
        )}
        
        <div className="config-row">
          <label>Output path:</label>
          <div className="path-selector">
            <input 
              type="text" 
              value={outputPath} 
              onChange={e => setOutputPath(e.target.value)}
              disabled={isFolderPickerOpen}
            />
            <button onClick={handleSelectDirectory}>Browse...</button>
          </div>
        </div>
        
        <div className="config-details">
          <div className="config-detail">
            <span>Resolution:</span>
            <span>{config.width} × {config.height}</span>
          </div>
          
          <div className="config-detail">
            <span>Format:</span>
            <span>{selectedPreset.video.codec} / {selectedPreset.audio.codec}</span>
          </div>
          
          <div className="config-detail">
            <span>FPS:</span>
            <span>{config.fps} (suggested)</span>
          </div>
          
          <div className="config-detail">
            <span>Quality:</span>
            <span>CRF {selectedPreset.video.crf}</span>
          </div>
        </div>
      </div>
      
      <div className="export-actions">
        {(!activeJobId || jobStatus === JobStatus.COMPLETED || jobStatus === JobStatus.FAILED || jobStatus === JobStatus.CANCELLED) ? (
          <button 
            className={`export-button ${isExportDisabled() ? 'disabled' : ''}`}
            onClick={handleStartExport}
            disabled={isExportDisabled()}
          >
            {isRecording ? 'Cannot export during recording' : 'Export'}
          </button>
        ) : (
          <button 
            className="cancel-button"
            onClick={handleCancelExport}
          >
            Cancel Export
          </button>
        )}
      </div>
      
      {progress && (jobStatus === JobStatus.RUNNING || jobStatus === JobStatus.QUEUED) && (
        <div className="export-progress">
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{width: `${progress.percentage}%`}}
            ></div>
            <div className="progress-percentage">
              {progress.percentage.toFixed(1)}%
            </div>
          </div>
          
          <div className="progress-details">
            <div className="progress-stat">
              <span>Frame:</span>
              <span>{progress.currentFrame} / {progress.totalFrames}</span>
            </div>
            
            <div className="progress-stat">
              <span>Elapsed:</span>
              <span>{formatTime(progress.elapsedSeconds)}</span>
            </div>
            
            <div className="progress-stat">
              <span>ETA:</span>
              <span>{calculateETA()}</span>
            </div>
          </div>
          
          <div className="status-message">
            {progress.statusMessage || `Exporting ${selectedPreset.label} format...`}
          </div>
        </div>
      )}
      
      {/* Toast notification */}
      {showToast && (
        <div className={`toast-notification ${toastType}`}>
          <div className="toast-content">
            {toastMessage.split('\n').map((line, index) => (
              <div key={index} className={index > 0 ? 'toast-subtext' : ''}>
                {line}
              </div>
            ))}
          </div>
          <button className="toast-close" onClick={() => setShowToast(false)}>×</button>
        </div>
      )}
      
      {/* Simulated folder picker (would normally use a native dialog) */}
      {isFolderPickerOpen && (
        <div className="folder-picker-modal">
          <div className="folder-picker-content">
            <h3>Select Output Directory</h3>
            <div className="folder-list">
              <div className="folder-item" onClick={() => handleFolderSelected('./exports/')}>
                ./exports/
              </div>
              <div className="folder-item" onClick={() => handleFolderSelected('./videos/')}>
                ./videos/
              </div>
              <div className="folder-item" onClick={() => handleFolderSelected('./downloads/')}>
                ./downloads/
              </div>
              <div className="folder-item" onClick={() => handleFolderSelected('./custom/')}>
                ./custom/
              </div>
            </div>
            <div className="folder-picker-actions">
              <button onClick={() => setIsFolderPickerOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .export-panel {
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          max-width: 600px;
          position: relative;
        }
        
        h2 {
          margin-top: 0;
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        .error-message {
          background-color: #ffdddd;
          color: #ff0000;
          padding: 10px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        
        .config-section {
          margin-bottom: 20px;
        }
        
        .config-row {
          display: flex;
          margin-bottom: 12px;
          align-items: center;
        }
        
        .config-row label {
          width: 100px;
          font-weight: bold;
        }
        
        .preset-select {
          flex: 1;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .preset-description {
          font-size: 12px;
          color: #666;
          margin: -8px 0 15px 100px;
          font-style: italic;
        }
        
        .path-selector {
          display: flex;
          flex: 1;
        }
        
        .path-selector input {
          flex: 1;
          margin-right: 10px;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .path-selector button {
          padding: 8px 12px;
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .path-selector button:hover {
          background-color: #e0e0e0;
        }
        
        .config-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin: 15px 0;
          background-color: #fff;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }
        
        .config-detail {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }
        
        .config-detail span:first-child {
          font-weight: bold;
          color: #555;
        }
        
        .export-actions {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }
        
        .export-button,
        .cancel-button {
          padding: 10px 30px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .export-button {
          background-color: #4CAF50;
          color: white;
        }
        
        .export-button:hover {
          background-color: #45a049;
        }
        
        .export-button.disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .cancel-button {
          background-color: #f44336;
          color: white;
        }
        
        .cancel-button:hover {
          background-color: #d32f2f;
        }
        
        .export-progress {
          margin-top: 20px;
          padding: 15px;
          background-color: #fff;
          border-radius: 4px;
          border: 1px solid #ddd;
        }
        
        .progress-bar-container {
          position: relative;
          height: 24px;
          background-color: #e0e0e0;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 15px;
        }
        
        .progress-bar {
          height: 100%;
          background-color: #4CAF50;
          transition: width 0.3s ease;
        }
        
        .progress-percentage {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          font-weight: bold;
          font-size: 14px;
        }
        
        .progress-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .progress-stat {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }
        
        .progress-stat span:first-child {
          font-weight: bold;
          color: #555;
        }
        
        .status-message {
          font-style: italic;
          color: #666;
          font-size: 14px;
          text-align: center;
        }
        
        .toast-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 4px;
          color: white;
          font-size: 14px;
          max-width: 400px;
          z-index: 1000;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.3s ease;
        }
        
        .toast-content {
          flex: 1;
          margin-right: 10px;
        }
        
        .toast-subtext {
          margin-top: 4px;
          font-size: 12px;
          opacity: 0.9;
          font-family: monospace;
          word-break: break-all;
        }
        
        .toast-notification.success {
          background-color: #4CAF50;
        }
        
        .toast-notification.error {
          background-color: #f44336;
        }
        
        .toast-close {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 0 5px;
          align-self: flex-start;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .folder-picker-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .folder-picker-content {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          width: 400px;
        }
        
        .folder-list {
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 20px;
        }
        
        .folder-item {
          padding: 10px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
        }
        
        .folder-item:hover {
          background-color: #f5f5f5;
        }
        
        .folder-picker-actions {
          display: flex;
          justify-content: flex-end;
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .export-panel {
            background-color: #262626;
            color: #f0f0f0;
          }
          
          h2 {
            color: #e0e0e0;
            border-bottom-color: #444;
          }
          
          .config-details,
          .export-progress {
            background-color: #333;
            border-color: #444;
            color: #e0e0e0;
          }
          
          .config-detail span:first-child,
          .progress-stat span:first-child {
            color: #aaa;
          }
          
          .preset-select,
          .path-selector input {
            background-color: #333;
            color: #e0e0e0;
            border-color: #555;
          }
          
          .path-selector button {
            background-color: #444;
            color: #e0e0e0;
            border-color: #555;
          }
          
          .path-selector button:hover {
            background-color: #555;
          }
          
          .progress-percentage {
            color: #e0e0e0;
          }
          
          .status-message {
            color: #aaa;
          }
          
          .folder-picker-content {
            background-color: #333;
            color: #e0e0e0;
          }
          
          .folder-item {
            border-color: #444;
          }
          
          .folder-item:hover {
            background-color: #444;
          }
        }
      `}</style>
    </div>
  );
};

export default ExportPanel;
