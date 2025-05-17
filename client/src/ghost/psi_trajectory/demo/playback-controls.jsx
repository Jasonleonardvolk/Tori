import React, { useState, useEffect, useRef } from 'react';
import { PsiTrajectory } from '../index';

/**
 * Unified Playback Controls Component
 * 
 * This component provides a comprehensive set of controls for playback
 * of ψ-Trajectory sessions, including play/pause, seek, and timeline scrubbing.
 */
export const PlaybackControls = ({ psi, sessionId, onTimeUpdate }) => {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bufferingProgress, setBufferingProgress] = useState(0);
  const [volume, setVolume] = useState(100);
  
  // Timeline state
  const [markers, setMarkers] = useState([]);
  const [hoveredTime, setHoveredTime] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs
  const timelineRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const playbackStatsRef = useRef(null);
  
  // Initialize playback on component mount
  useEffect(() => {
    if (!psi || !sessionId) return;
    
    const initializePlayback = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, this would initialize playback
        // of the specific session.
        // For this demo, we'll mock it with some sample data
        
        // Mock session duration and markers
        const mockDuration = 205.75; // seconds
        const mockMarkers = [
          { time: 0, type: 'landmark', name: 'Start' },
          { time: 20.72, type: 'landmark', name: 'Initial Oscillation' },
          { time: 39.08, type: 'pattern', name: 'engineRPM', confidence: 0.92 },
          { time: 94.63, type: 'pattern', name: 'acceleration', confidence: 0.85 },
          { time: 113.15, type: 'landmark', name: 'Peak Activity' },
          { time: 150.2, type: 'pattern', name: 'wheelDiameter', confidence: 0.91 },
          { time: 164.6, type: 'landmark', name: 'Pattern Match' },
          { time: 189.08, type: 'pattern', name: 'voltage', confidence: 0.88 },
          { time: mockDuration, type: 'landmark', name: 'End' },
        ];
        
        // Set initial state
        setDuration(mockDuration);
        setMarkers(mockMarkers);
        setCurrentTime(0);
        setIsPlaying(false);
        setIsLoading(false);
        
        // Set up mock playback stats
        playbackStatsRef.current = {
          position: 0,
          playing: false,
          buffer_size: 120, // frames
          rate: 60, // fps
        };
        
        // Simulate buffer filling
        let progress = 0;
        const bufferInterval = setInterval(() => {
          progress += 5;
          setBufferingProgress(Math.min(progress, 100));
          
          if (progress >= 100) {
            clearInterval(bufferInterval);
          }
        }, 200);
        
      } catch (err) {
        console.error('Failed to initialize playback:', err);
        setError(`Failed to initialize playback: ${err.message}`);
        setIsLoading(false);
      }
    };
    
    initializePlayback();
    
    // Clean up on unmount
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [psi, sessionId]);
  
  // Format time as MM:SS.ms
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  // Toggle play/pause
  const togglePlayPause = () => {
    if (isLoading) return;
    
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    if (newPlayingState) {
      startPlayback();
    } else {
      pausePlayback();
    }
  };
  
  // Start playback
  const startPlayback = () => {
    // In a real implementation, this would call into the PsiTrajectory
    // API to start playback.
    // For this demo, we'll just simulate it with a timer
    
    // Update simulated playback stats
    if (playbackStatsRef.current) {
      playbackStatsRef.current.playing = true;
    }
    
    // Start time update interval
    updateIntervalRef.current = setInterval(() => {
      setCurrentTime(prevTime => {
        // If we reach the end, stop playback
        if (prevTime >= duration) {
          clearInterval(updateIntervalRef.current);
          setIsPlaying(false);
          return duration;
        }
        
        // Otherwise, increment time
        const newTime = prevTime + 0.05; // 50ms interval
        
        // Update playback stats
        if (playbackStatsRef.current) {
          playbackStatsRef.current.position = newTime;
        }
        
        // Notify parent of time update
        if (onTimeUpdate) {
          onTimeUpdate(newTime, duration);
        }
        
        return newTime;
      });
    }, 50); // Update every 50ms for smooth progress
  };
  
  // Pause playback
  const pausePlayback = () => {
    // In a real implementation, this would call into the PsiTrajectory
    // API to pause playback.
    // For this demo, we'll just clear the interval
    
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    // Update simulated playback stats
    if (playbackStatsRef.current) {
      playbackStatsRef.current.playing = false;
    }
  };
  
  // Seek to a specific time
  const seekTo = (time) => {
    // Ensure time is within bounds
    const clampedTime = Math.max(0, Math.min(time, duration));
    
    // In a real implementation, this would call into the PsiTrajectory
    // API to seek to the specified time.
    // For this demo, we'll just update the state
    
    setCurrentTime(clampedTime);
    
    // Update playback stats
    if (playbackStatsRef.current) {
      playbackStatsRef.current.position = clampedTime;
    }
    
    // Notify parent of time update
    if (onTimeUpdate) {
      onTimeUpdate(clampedTime, duration);
    }
  };
  
  // Jump to previous frame
  const previousFrame = () => {
    // In a real implementation, this would seek to the previous frame.
    // For this demo, we'll just decrement by 1/60 second (assuming 60fps)
    seekTo(currentTime - (1 / 60));
  };
  
  // Jump to next frame
  const nextFrame = () => {
    // In a real implementation, this would seek to the next frame.
    // For this demo, we'll just increment by 1/60 second (assuming 60fps)
    seekTo(currentTime + (1 / 60));
  };
  
  // Handle timeline click
  const handleTimelineClick = (e) => {
    if (isLoading || !timelineRef.current) return;
    
    // Get click position relative to timeline
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    // Calculate time based on percentage
    const newTime = percentage * duration;
    
    // Seek to new time
    seekTo(newTime);
  };
  
  // Handle timeline mouse move
  const handleTimelineMouseMove = (e) => {
    if (isLoading || !timelineRef.current) return;
    
    // Get mouse position relative to timeline
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const percentage = mouseX / rect.width;
    
    // Calculate time based on percentage
    const hoverTime = percentage * duration;
    
    // Update hovered time
    setHoveredTime(hoverTime);
    
    // If dragging, seek to new time
    if (isDragging) {
      seekTo(hoverTime);
    }
  };
  
  // Handle timeline mouse down
  const handleTimelineMouseDown = (e) => {
    if (isLoading) return;
    
    setIsDragging(true);
    
    // Handle initial click position
    handleTimelineClick(e);
    
    // Add document-level event listeners for dragging
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
  };
  
  // Handle document mouse move (for dragging)
  const handleDocumentMouseMove = (e) => {
    if (isLoading || !timelineRef.current) return;
    
    // Get mouse position relative to timeline
    const rect = timelineRef.current.getBoundingClientRect();
    
    // Clamp mouse position to timeline bounds
    let mouseX = e.clientX - rect.left;
    mouseX = Math.max(0, Math.min(mouseX, rect.width));
    
    const percentage = mouseX / rect.width;
    
    // Calculate time based on percentage
    const newTime = percentage * duration;
    
    // Seek to new time
    seekTo(newTime);
  };
  
  // Handle document mouse up (for dragging)
  const handleDocumentMouseUp = () => {
    setIsDragging(false);
    
    // Remove document-level event listeners
    document.removeEventListener('mousemove', handleDocumentMouseMove);
    document.removeEventListener('mouseup', handleDocumentMouseUp);
  };
  
  // Handle timeline mouse leave
  const handleTimelineMouseLeave = () => {
    if (!isDragging) {
      setHoveredTime(null);
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    
    // In a real implementation, this would update the actual audio volume
  };
  
  // Calculate progress percentage
  const progressPercentage = (currentTime / duration) * 100 || 0;
  
  return (
    <div className="playback-controls">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="timeline-container">
        {/* Time tooltip */}
        {hoveredTime !== null && (
          <div 
            className="time-tooltip" 
            style={{ 
              left: `${(hoveredTime / duration) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            {formatTime(hoveredTime)}
          </div>
        )}
        
        {/* Timeline */}
        <div 
          className="timeline" 
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseDown={handleTimelineMouseDown}
          onMouseLeave={handleTimelineMouseLeave}
        >
          {/* Buffer progress */}
          <div 
            className="buffer-progress" 
            style={{ width: `${bufferingProgress}%` }}
          ></div>
          
          {/* Playback progress */}
          <div 
            className="playback-progress" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
          
          {/* Marker indicators */}
          {markers.map((marker, index) => (
            <div 
              key={index}
              className={`marker ${marker.type}-marker`}
              style={{ left: `${(marker.time / duration) * 100}%` }}
              title={`${marker.name} (${formatTime(marker.time)})`}
            ></div>
          ))}
          
          {/* Scrubber handle */}
          <div 
            className="scrubber-handle"
            style={{ left: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="controls-container">
        <div className="main-controls">
          {/* Previous frame button */}
          <button 
            className="control-button previous-frame-button"
            onClick={previousFrame}
            disabled={isLoading || currentTime <= 0}
            title="Previous frame"
          >
            ⏪
          </button>
          
          {/* Play/pause button */}
          <button 
            className="control-button play-pause-button"
            onClick={togglePlayPause}
            disabled={isLoading}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? '⌛' : isPlaying ? '⏸' : '▶'}
          </button>
          
          {/* Next frame button */}
          <button 
            className="control-button next-frame-button"
            onClick={nextFrame}
            disabled={isLoading || currentTime >= duration}
            title="Next frame"
          >
            ⏩
          </button>
        </div>
        
        <div className="time-display">
          <span className="current-time">{formatTime(currentTime)}</span>
          <span className="time-separator">/</span>
          <span className="duration">{formatTime(duration)}</span>
        </div>
        
        <div className="secondary-controls">
          {/* Volume control */}
          <div className="volume-control">
            <span className="volume-icon">🔊</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume} 
              onChange={handleVolumeChange} 
              className="volume-slider"
              title={`Volume: ${volume}%`}
            />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .playback-controls {
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .error-message {
          background-color: #ffdddd;
          color: #ff0000;
          padding: 10px;
          margin-bottom: 15px;
          border-radius: 4px;
          text-align: center;
        }
        
        .timeline-container {
          position: relative;
          height: 40px;
          margin-bottom: 10px;
        }
        
        .time-tooltip {
          position: absolute;
          top: -25px;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 3px 6px;
          border-radius: 3px;
          font-size: 12px;
          pointer-events: none;
          z-index: 10;
        }
        
        .timeline {
          position: relative;
          height: 8px;
          background-color: #ddd;
          border-radius: 4px;
          cursor: pointer;
          overflow: hidden;
          margin: 16px 0;
        }
        
        .buffer-progress {
          position: absolute;
          height: 100%;
          background-color: #bbdefb;
          border-radius: 4px;
          top: 0;
          left: 0;
          pointer-events: none;
        }
        
        .playback-progress {
          position: absolute;
          height: 100%;
          background-color: #2196F3;
          border-radius: 4px;
          top: 0;
          left: 0;
          pointer-events: none;
        }
        
        .marker {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          top: 0;
          transform: translate(-50%, 0);
          z-index: 5;
        }
        
        .landmark-marker {
          background-color: rgba(233, 30, 99, 0.7);
        }
        
        .pattern-marker {
          background-color: rgba(76, 175, 80, 0.7);
        }
        
        .scrubber-handle {
          position: absolute;
          width: 14px;
          height: 14px;
          background-color: #2196F3;
          border: 2px solid white;
          border-radius: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
          pointer-events: none;
          box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
        }
        
        .controls-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .main-controls {
          display: flex;
          gap: 10px;
        }
        
        .control-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .control-button:hover {
          background-color: #f0f0f0;
        }
        
        .control-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .play-pause-button {
          width: 50px;
          height: 50px;
          font-size: 20px;
        }
        
        .time-display {
          font-family: monospace;
          font-size: 16px;
          color: #333;
        }
        
        .time-separator {
          margin: 0 5px;
          color: #777;
        }
        
        .secondary-controls {
          display: flex;
          align-items: center;
        }
        
        .volume-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .volume-slider {
          width: 80px;
          height: 4px;
        }
        
        .volume-icon {
          font-size: 16px;
        }
        
        @media (max-width: 768px) {
          .controls-container {
            flex-direction: column;
            gap: 10px;
          }
          
          .time-display {
            order: -1;
            margin-bottom: 10px;
          }
          
          .secondary-controls {
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default PlaybackControls;
