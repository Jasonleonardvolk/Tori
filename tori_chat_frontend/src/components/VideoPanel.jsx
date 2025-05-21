import React, { useState } from 'react';

/**
 * VideoPanel Component
 * Displays video content in the right panel of the application
 */
export default function VideoPanel() {
  const [videoActive, setVideoActive] = useState(false);
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Video Panel</h2>
        <button 
          onClick={() => setVideoActive(!videoActive)}
          className="px-3 py-1 rounded-full bg-primary text-surface-dark text-sm font-medium"
        >
          {videoActive ? 'Stop Video' : 'Start Video'}
        </button>
      </div>
      
      <div className="flex-1 p-4">
        <div className={`bg-black rounded-lg aspect-video flex items-center justify-center overflow-hidden ${videoActive ? 'border-2 border-primary' : ''}`}>
          {videoActive ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-text-subtle">Video stream active</span>
              {/* Video element would go here 
              <video 
                ref={videoRef} 
                autoPlay 
                className="w-full h-full object-cover"
              /> 
              */}
            </div>
          ) : (
            <span className="text-text-subtle">Click &apos;Start Video&apos; to activate</span>
          )}
        </div>
        
        {/* Video controls - could be expanded */}
        {videoActive && (
          <div className="mt-4 flex justify-center space-x-4">
            <button className="p-2 rounded-full bg-surface-light/10 hover:bg-surface-light/20">
              <span role="img" aria-label="Mute">🔇</span>
            </button>
            <button className="p-2 rounded-full bg-surface-light/10 hover:bg-surface-light/20">
              <span role="img" aria-label="Camera">📷</span>
            </button>
            <button className="p-2 rounded-full bg-surface-light/10 hover:bg-surface-light/20">
              <span role="img" aria-label="Settings">⚙️</span>
            </button>
          </div>
        )}
        
        {/* Information section */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Connection Info</h3>
          <div className="text-xs text-text-subtle space-y-1">
            <p>Status: {videoActive ? 'Connected' : 'Disconnected'}</p>
            <p>Resolution: {videoActive ? '720p' : 'N/A'}</p>
            <p>Latency: {videoActive ? '45ms' : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
