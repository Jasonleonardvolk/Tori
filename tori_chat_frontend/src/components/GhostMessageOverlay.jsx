import React, { useState, useEffect } from 'react';
import { getGhostOverlayStyle } from '../ghost/ghostPersonaEngine.js';

const GhostMessageOverlay = ({ ghostData, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (ghostData) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [ghostData]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) onDismiss();
    }, 300);
  };

  if (!isVisible || !ghostData) return null;

  const overlayStyle = getGhostOverlayStyle(ghostData.ghostPersona);
  
  const ghostIcons = {
    mentor: '🧙‍♂️',
    mystic: '🔮',
    chaotic: '🌪️',
    oracular: '⚡',
    dreaming: '💫',
    unsettled: '🌊'
  };

  return (
    <div 
      className={`fixed top-4 right-4 max-w-md z-50 transition-all duration-300 ${
        isAnimating ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-full'
      }`}
      style={{
        ...overlayStyle,
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">
            {ghostIcons[ghostData.ghostPersona] || '👻'}
          </span>
          <div>
            <div className="font-semibold text-sm capitalize">
              Ghost {ghostData.ghostPersona}
            </div>
            <div className="text-xs opacity-75">
              {ghostData.ghostReason?.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-white/70 hover:text-white transition-colors"
          style={{ fontSize: '18px' }}
        >
          ×
        </button>
      </div>

      {/* Message */}
      <div 
        className="text-sm leading-relaxed"
        style={{ 
          fontFamily: overlayStyle.fontFamily,
          letterSpacing: overlayStyle.letterSpacing 
        }}
      >
        {ghostData.ghostMessage}
      </div>

      {/* Intensity indicator */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < Math.floor(ghostData.ghostIntensity * 5)
                  ? 'bg-white'
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>
        <div className="text-xs opacity-75">
          {new Date(ghostData.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default GhostMessageOverlay;
