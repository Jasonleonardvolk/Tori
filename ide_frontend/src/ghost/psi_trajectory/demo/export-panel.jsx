import React, { useState, useEffect, useRef } from 'react';
import { 
  createExporter, 
  ExportQuality, 
  ExportMode, 
  ExportFormat,
  JobStatus
} from '../export';

/**
 * Export panel component for ψ-Trajectory archives
 */
export const ExportPanel = ({ psi, archivePath }) => {
  // Export configuration state
  const [config, setConfig] = useState({
    archivePath,
    outputPath: './output.mp4',
    quality: ExportQuality.STANDARD,
    mode: ExportMode.BALANCED,
    format: ExportFormat.MP4,
    width: 1920,
    height: 1080,
    fps: 60,
  });
  
  // Export state
  const [exporter, setExporter] = useState(null);
  const [activeJobId, setActiveJobId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [error, setError] = useState(null);
  
  // UI state
  const [outputDirectory, setOutputDirectory] = useState('./');
  const [outputFilename, setOutputFilename] = useState('output.mp4');
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  
  // Create exporter when PsiTrajectory is available
  useEffect(() => {
    if (psi) {
      const exp = createExporter(psi);
      
      // Set up event listeners
      exp.on('progress', (progress) => {
        setProgress(progress);
      });
      
      exp.on('statusChange', ({ jobId, status }) => {
        if (jobId === activeJobId) {
          setJobStatus(status);
          
          // Show completion message
          if (status === JobStatus.COMPLETED) {
            alert(`Export completed! File saved to: ${config.outputPath}`);
          }
          
          // Show error message
          if (status === JobStatus.FAILED) {
            setError('Export failed. Check the console for details.');
          }
        }
      });
      
      setExporter(exp);
    }
  }, [psi]);
  
  // Update config when outputDirectory or outputFilename changes
  useEffect(() => {
    let extension = '.mp4';
    switch (config.format) {
      case ExportFormat.MP4:
        extension = '.mp4';
        break;
      case ExportFormat.WEBM:
        extension = '.webm';
        break;
      case ExportFormat.GIF:
        extension = '.gif';
        break;
      case ExportFormat.PNG_SEQUENCE:
        extension = '/frame_%04d.png';
        break;
    }
    
    setConfig(prev => ({
      ...prev,
      outputPath: `${outputDirectory}${outputFilename}${extension}`,
    }));
  }, [outputDirectory, outputFilename, config.format]);
  
  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
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
      const jobId = await exporter.createExportJob(config);
      setActiveJobId(jobId);
      setJobStatus(JobStatus.QUEUED);
      setError(null);
    } catch (err) {
      setError(`Failed to start export: ${err}`);
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
    } catch (err) {
      setError(`Failed to cancel export: ${err}`);
    }
  };
  
  // Select output directory
  const handleSelectDirectory = () => {
    // In a real implementation, this would open a file picker dialog
    // For this demo, we'll just simulate it
    setIsFolderPickerOpen(true);
  };
  
  // Simulate folder picker
  const handleFolderSelected = (path) => {
    setOutputDirectory(path);
    setIsFolderPickerOpen(false);
  };
  
  return (
    <div className="export-panel">
      <h2>Export Configuration</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="config-section">
        <div className="config-row">
          <label>Output Location:</label>
          <div className="path-selector">
            <input 
              type="text" 
              value={outputDirectory} 
              onChange={e => setOutputDirectory(e.target.value)}
              disabled={isFolderPickerOpen}
            />
            <button onClick={handleSelectDirectory}>Browse...</button>
          </div>
        </div>
        
        <div className="config-row">
          <label>Filename:</label>
          <input 
            type="text" 
            value={outputFilename} 
            onChange={e => setOutputFilename(e.target.value)}
          />
        </div>
        
        <div className="config-row">
          <label>Format:</label>
          <select 
            value={config.format} 
            onChange={e => setConfig({...config, format: e.target.value})}
          >
            <option value={ExportFormat.MP4}>MP4 (H.264)</option>
            <option value={ExportFormat.WEBM}>WebM (VP9)</option>
            <option value={ExportFormat.GIF}>GIF Animation</option>
            <option value={ExportFormat.PNG_SEQUENCE}>PNG Sequence</option>
          </select>
        </div>
        
        <div className="config-row">
          <label>Quality:</label>
          <select 
            value={config.quality} 
            onChange={e => setConfig({...config, quality: e.target.value})}
          >
            <option value={ExportQuality.DRAFT}>Draft (Fastest)</option>
            <option value={ExportQuality.STANDARD}>Standard</option>
            <option value={ExportQuality.HIGH}>High</option>
            <option value={ExportQuality.ULTRA}>Ultra (Best Quality)</option>
          </select>
        </div>
        
        <div className="config-row">
          <label>Export Mode:</label>
          <select 
            value={config.mode} 
            onChange={e => setConfig({...config, mode: e.target.value})}
          >
            <option value={ExportMode.FAST}>Fast (Max Resources)</option>
            <option value={ExportMode.BALANCED}>Balanced</option>
            <option value={ExportMode.LOW_POWER}>Low Power</option>
          </select>
        </div>
        
        <div className="config-row">
          <label>Resolution:</label>
          <div className="resolution-inputs">
            <input 
              type="number" 
              value={config.width} 
              onChange={e => setConfig({...config, width: parseInt(e.target.value)})}
              min="1"
              step="1"
            />
            <span>×</span>
            <input 
              type="number" 
              value={config.height} 
              onChange={e => setConfig({...config, height: parseInt(e.target.value)})}
              min="1"
              step="1"
            />
          </div>
        </div>
        
        <div className="config-row">
          <label>Frame Rate:</label>
          <input 
            type="number" 
            value={config.fps} 
            onChange={e => setConfig({...config, fps: parseInt(e.target.value)})}
            min="1"
            max="240"
            step="1"
          />
          <span>fps</span>
        </div>
        
        <div className="config-row">
          <label>Hardware Acceleration:</label>
          <input 
            type="checkbox" 
            checked={config.useHardwareAccel !== false} 
            onChange={e => setConfig({...config, useHardwareAccel: e.target.checked})}
          />
        </div>
        
        <div className="config-row">
          <label>Include Audio:</label>
          <input 
            type="checkbox" 
            checked={config.includeAudio !== false} 
            onChange={e => setConfig({...config, includeAudio: e.target.checked})}
          />
        </div>
      </div>
      
      <div className="export-actions">
        {(!activeJobId || jobStatus === JobStatus.COMPLETED || jobStatus === JobStatus.FAILED || jobStatus === JobStatus.CANCELLED) ? (
          <button 
            className="export-button"
            onClick={handleStartExport}
            disabled={!exporter}
          >
            Start Export
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
      
      {progress && (
        <div className="export-progress">
          <h3>Export Progress</h3>
          
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{width: `${progress.percentage}%`}}
            ></div>
          </div>
          
          <div className="progress-details">
            <div className="progress-stat">
              <span>Status:</span>
              <span>{jobStatus}</span>
            </div>
            
            <div className="progress-stat">
              <span>Frame:</span>
              <span>{progress.currentFrame} / {progress.totalFrames}</span>
            </div>
            
            <div className="progress-stat">
              <span>Progress:</span>
              <span>{progress.percentage.toFixed(1)}%</span>
            </div>
            
            <div className="progress-stat">
              <span>Elapsed:</span>
              <span>{formatTime(progress.elapsedSeconds)}</span>
            </div>
            
            <div className="progress-stat">
              <span>Remaining:</span>
              <span>{formatTime(progress.remainingSeconds)}</span>
            </div>
          </div>
          
          <div className="status-message">
            {progress.statusMessage}
          </div>
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
          max-width: 800px;
        }
        
        h2 {
          margin-top: 0;
          color: #333;
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
          width: 150px;
          font-weight: bold;
        }
        
        .path-selector {
          display: flex;
          flex: 1;
        }
        
        .path-selector input {
          flex: 1;
          margin-right: 10px;
        }
        
        .resolution-inputs {
          display: flex;
          align-items: center;
        }
        
        .resolution-inputs input {
          width: 80px;
        }
        
        .resolution-inputs span {
          margin: 0 10px;
        }
        
        input[type="text"],
        input[type="number"],
        select {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }
        
        input[type="checkbox"] {
          transform: scale(1.3);
          margin-left: 10px;
        }
        
        .export-actions {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }
        
        .export-button,
        .cancel-button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        }
        
        .export-button {
          background-color: #4CAF50;
          color: white;
        }
        
        .export-button:hover {
          background-color: #45a049;
        }
        
        .export-button:disabled {
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
          background-color: #e8f5e9;
          border-radius: 4px;
        }
        
        .export-progress h3 {
          margin-top: 0;
          color: #2e7d32;
        }
        
        .progress-bar-container {
          height: 20px;
          background-color: #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 15px;
        }
        
        .progress-bar {
          height: 100%;
          background-color: #4CAF50;
          transition: width 0.3s ease;
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
        }
        
        .progress-stat span:first-child {
          font-weight: bold;
          margin-right: 10px;
        }
        
        .status-message {
          font-style: italic;
          color: #666;
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
      `}</style>
    </div>
  );
};

export default ExportPanel;
