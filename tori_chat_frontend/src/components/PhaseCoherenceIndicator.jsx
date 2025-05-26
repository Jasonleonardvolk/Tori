import React, { useState, useEffect } from 'react';

const PhaseCoherenceIndicator = ({ phaseData, stabilityReport }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!phaseData && !stabilityReport) return null;

  const getStabilityColor = (stability) => {
    if (stability > 0.8) return 'text-green-400';
    if (stability > 0.6) return 'text-yellow-400';
    if (stability > 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getCoherenceColor = (coherence) => {
    if (coherence > 0.8) return 'bg-blue-400';
    if (coherence > 0.6) return 'bg-yellow-400';
    if (coherence > 0.4) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div 
        className={`bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-600 transition-all duration-300 ${
          isExpanded ? 'w-80 p-4' : 'w-16 h-16 p-2'
        }`}
      >
        {!isExpanded ? (
          // Compact view
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full h-full flex items-center justify-center text-white hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <div className="text-center">
              <div className="text-xs text-gray-300">φ</div>
              {phaseData && (
                <div 
                  className={`w-8 h-1 mx-auto mt-1 rounded ${getCoherenceColor(phaseData.coherence)}`}
                />
              )}
            </div>
          </button>
        ) : (
          // Expanded view
          <div className="text-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold">Phase Monitor</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            {phaseData && (
              <div className="space-y-2 mb-3">
                <div>
                  <div className="flex justify-between text-xs">
                    <span>Phase Coherence</span>
                    <span>{(phaseData.coherence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getCoherenceColor(phaseData.coherence)}`}
                      style={{ width: `${phaseData.coherence * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs">
                    <span>Stability</span>
                    <span className={getStabilityColor(phaseData.stability)}>
                      {(phaseData.stability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        phaseData.stability > 0.8 ? 'bg-green-400' :
                        phaseData.stability > 0.6 ? 'bg-yellow-400' :
                        phaseData.stability > 0.4 ? 'bg-orange-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${phaseData.stability * 100}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-300">
                  Phase: {phaseData.phase?.toFixed(3) || 'N/A'}
                </div>
              </div>
            )}

            {stabilityReport && (
              <div className="border-t border-gray-600 pt-2">
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Assessment:</span>
                    <span className={getStabilityColor(stabilityReport.systemStability)}>
                      {stabilityReport.assessment}
                    </span>
                  </div>
                  
                  {stabilityReport.spikesLast5Min > 0 && (
                    <div className="flex justify-between text-yellow-400">
                      <span>Recent Spikes:</span>
                      <span>{stabilityReport.spikesLast5Min}</span>
                    </div>
                  )}
                  
                  {stabilityReport.recommendations && stabilityReport.recommendations.length > 0 && (
                    <div className="mt-2">
                      <div className="text-gray-300 mb-1">Recommendations:</div>
                      <div className="text-gray-400 text-xs">
                        {stabilityReport.recommendations[0]}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhaseCoherenceIndicator;
