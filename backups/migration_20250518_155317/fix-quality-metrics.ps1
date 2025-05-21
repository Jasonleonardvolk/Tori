# PowerShell script to fix quality-metrics.jsx file
# This script writes the complete corrected file content in a single operation

$filePath = "client/src/ghost/psi_trajectory/demo/quality-metrics.jsx"

# The complete fixed content for the file
$fileContent = @'
import React, { useState, useEffect, useRef } from 'react';
import { PsiTrajectory } from '../index';

/**
 * Quality Metrics Component
 * 
 * This component provides visualization and analysis of the three key quality metrics:
 * 1. A/V Sync Drift
 * 2. Landmark RMS Error
 * 3. ψ-Phase Stability
 */
export const QualityMetrics = ({ psi, sessionId }) => {
  // Metrics state
  const [avSyncData, setAVSyncData] = useState(null);
  const [landmarkErrorData, setLandmarkErrorData] = useState(null);
  const [phaseStabilityData, setPhaseStabilityData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMetric, setActiveMetric] = useState('av-sync');
  
  // Chart refs
  const syncChartRef = useRef(null);
  const landmarkChartRef = useRef(null);
  const phaseChartRef = useRef(null);
  
  // Load metrics data on component mount
  useEffect(() => {
    if (!psi || !sessionId) return;
    
    const loadMetricsData = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, this would call into the PsiTrajectory
        // API to get metrics data for the session.
        // For this demo, we'll mock it with some sample data
        
        // Generate mock A/V sync drift data
        const mockSyncPoints = 100;
        const mockSyncData = {
          timestamps: Array(mockSyncPoints).fill(0).map((_, i) => i * 2.05), // seconds
          driftValues: Array(mockSyncPoints).fill(0).map(() => (Math.random() - 0.5) * 30), // ms
          maxDrift: 23.7, // ms
          avgDrift: 8.4, // ms
          driftVariance: 32.8,
        };
        
        // Generate mock landmark error data
        const mockLandmarks = [
          'Left Eye', 'Right Eye', 'Nose', 'Mouth', 'Left Cheek', 
          'Right Cheek', 'Forehead', 'Chin', 'Left Ear', 'Right Ear'
        ];
        
        const mockLandmarkData = {
          landmarks: mockLandmarks,
          errors: mockLandmarks.map(() => Math.random() * 5), // pixels
          rmsError: 2.34, // pixels
          maxError: 4.92, // pixels
          frameCount: 12540,
          errorOverTime: Array(20).fill(0).map((_, i) => ({
            frameIndex: i * 600,
            timestamp: i * 10, // seconds
            rmsError: 1 + Math.random() * 3, // pixels
          })),
        };
        
        // Generate mock phase stability data
        const mockOscillators = 32;
        const mockPhaseData = {
          oscillatorCount: mockOscillators,
          stabilityScores: Array(mockOscillators).fill(0).map(() => 0.5 + Math.random() * 0.5),
          overallStability: 0.78,
          stabilityOverTime: Array(50).fill(0).map((_, i) => ({
            frameIndex: i * 250,
            timestamp: i * 4, // seconds
            stability: 0.6 + Math.random() * 0.3,
          })),
          phaseDistribution: {
            bins: Array(10).fill(0).map((_, i) => -Math.PI + i * (2 * Math.PI / 10)),
            counts: Array(10).fill(0).map(() => Math.random() * 100),
          },
        };
        
        // Set state
        setAVSyncData(mockSyncData);
        setLandmarkErrorData(mockLandmarkData);
        setPhaseStabilityData(mockPhaseData);
        setIsLoading(false);
        
        // Draw charts after state updates and DOM changes are complete
        setTimeout(() => {
          drawSyncChart(mockSyncData);
          drawLandmarkChart(mockLandmarkData);
          drawPhaseChart(mockPhaseData);
        }, 0);
        
      } catch (err) {
        console.error('Failed to load metrics data:', err);
        setError(`Failed to load metrics data: ${err.message}`);
        setIsLoading(false);
      }
    };
    
    loadMetricsData();
  }, [psi, sessionId]);
  
  // Draw A/V sync drift chart
  const drawSyncChart = (data) => {
    const canvas = syncChartRef.current;
    if (!canvas || !data) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    const gridStep = height / 8;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    for (let y = gridStep; y < height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Calculate scales
    const xScale = width / Math.max(...data.timestamps);
    const yCenter = height / 2;
    const yScale = (height / 2) / (Math.max(Math.abs(Math.min(...data.driftValues)), Math.abs(Math.max(...data.driftValues))) * 1.2);
    
    // Draw zero line
    ctx.strokeStyle = '#9e9e9e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, yCenter);
    ctx.lineTo(width, yCenter);
    ctx.stroke();
    
    // Draw drift line
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.timestamps.forEach((time, i) => {
      const x = time * xScale;
      const y = yCenter - data.driftValues[i] * yScale;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw threshold lines (±20ms is generally considered acceptable)
    ctx.strokeStyle = 'rgba(244, 67, 54, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    
    // Upper threshold
    ctx.beginPath();
    ctx.moveTo(0, yCenter - 20 * yScale);
    ctx.lineTo(width, yCenter - 20 * yScale);
    ctx.stroke();
    
    // Lower threshold
    ctx.beginPath();
    ctx.moveTo(0, yCenter + 20 * yScale);
    ctx.lineTo(width, yCenter + 20 * yScale);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Draw labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    // Y-axis labels
    ctx.fillText('+30ms', 5, yCenter - 30 * yScale + 4);
    ctx.fillText('+20ms', 5, yCenter - 20 * yScale + 4);
    ctx.fillText('0ms', 5, yCenter + 4);
    ctx.fillText('-20ms', 5, yCenter + 20 * yScale + 4);
    ctx.fillText('-30ms', 5, yCenter + 30 * yScale + 4);
    
    // X-axis labels
    ctx.textAlign = 'center';
    const duration = Math.max(...data.timestamps);
    for (let t = 0; t <= duration; t += duration / 5) {
      const x = t * xScale;
      ctx.fillText(`${Math.round(t)}s`, x, height - 5);
    }
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('A/V Sync Drift Over Time', width / 2, 20);
  };
  
  // Draw landmark error chart
  const drawLandmarkChart = (data) => {
    const canvas = landmarkChartRef.current;
    if (!canvas || !data) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    const gridStep = height / 8;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    for (let y = gridStep; y < height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Landmark bar chart on the left half
    const barChartWidth = width * 0.6;
    const barWidth = barChartWidth / data.landmarks.length * 0.8;
    const barGap = barChartWidth / data.landmarks.length * 0.2;
    const maxBarHeight = height - 60;
    const maxError = Math.max(...data.errors, 5); // At least 5px for scale
    
    // Draw bars
    data.landmarks.forEach((landmark, i) => {
      const x = (barWidth + barGap) * i + barGap;
      const barHeight = (data.errors[i] / maxError) * maxBarHeight;
      const y = height - 30 - barHeight;
      
      // Draw bar
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw landmark label
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(x + barWidth / 2, height - 10);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(landmark, 0, 0);
      ctx.restore();
    });
    
    // Draw y-axis labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const value = (i / 5) * maxError;
      const y = height - 30 - (i / 5) * maxBarHeight;
      ctx.fillText(`${value.toFixed(1)}px`, barChartWidth - 10, y + 4);
    }
    
    // Error over time line chart on the right half
    const lineChartLeft = barChartWidth + 20;
    const lineChartWidth = width - lineChartLeft;
    const lineChartHeight = maxBarHeight;
    const lineChartBottom = height - 30;
    
    // Draw axis
    ctx.strokeStyle = '#9e9e9e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lineChartLeft, lineChartBottom);
    ctx.lineTo(lineChartLeft + lineChartWidth, lineChartBottom);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(lineChartLeft, lineChartBottom);
    ctx.lineTo(lineChartLeft, lineChartBottom - lineChartHeight);
    ctx.stroke();
    
    // Draw error over time line
    const xScale = lineChartWidth / Math.max(...data.errorOverTime.map(d => d.timestamp));
    const yScale = lineChartHeight / maxError;
    
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.errorOverTime.forEach((point, i) => {
      const x = lineChartLeft + point.timestamp * xScale;
      const y = lineChartBottom - point.rmsError * yScale;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Time (s)', lineChartLeft + lineChartWidth / 2, height - 5);
    
    ctx.save();
    ctx.translate(lineChartLeft - 15, lineChartBottom - lineChartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('RMS Error (px)', 0, 0);
    ctx.restore();
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Landmark RMS Error', width / 2, 20);
    
    // Draw overall RMS error
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Overall RMS Error: ${data.rmsError.toFixed(2)}px`, 10, 40);
    ctx.fillText(`Max Error: ${data.maxError.toFixed(2)}px`, 10, 60);
  };
  
  // Draw phase stability chart
  const drawPhaseChart = (data) => {
    const canvas = phaseChartRef.current;
    if (!canvas || !data) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    const gridStep = height / 8;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    for (let y = gridStep; y < height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw stability over time line chart on the top half
    const timeChartHeight = (height - 60) / 2;
    const timeChartTop = 30;
    const timeChartBottom = timeChartTop + timeChartHeight;
    
    // Draw axis
    ctx.strokeStyle = '#9e9e9e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, timeChartBottom);
    ctx.lineTo(width - 10, timeChartBottom);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(30, timeChartBottom);
    ctx.lineTo(30, timeChartTop);
    ctx.stroke();
    
    // Draw stability over time line
    const xScale = (width - 40) / Math.max(...data.stabilityOverTime.map(d => d.timestamp));
    const yScale = timeChartHeight;
    
    ctx.strokeStyle = '#9C27B0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.stabilityOverTime.forEach((point, i) => {
      const x = 30 + point.timestamp * xScale;
      const y = timeChartBottom - point.stability * yScale;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Time (s)', width / 2, timeChartBottom + 15);
    
    ctx.save();
    ctx.translate(15, timeChartTop + timeChartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Stability', 0, 0);
    ctx.restore();
    
    // Draw y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 1; i += 0.2) {
      const y = timeChartBottom - i * yScale;
      ctx.fillText(i.toFixed(1), 25, y + 4);
    }
    
    // Draw oscillator stability radar chart on the bottom half
    const radarChartCenterX = width / 2;
    const radarChartCenterY = timeChartBottom + 40 + (height - timeChartBottom - 50) / 2;
    const radarChartRadius = Math.min(width, height - timeChartBottom - 80) / 2.5;
    
    // Draw radar grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Draw concentric circles
    for (let r = 0.2; r <= 1; r += 0.2) {
      ctx.beginPath();
      ctx.arc(radarChartCenterX, radarChartCenterY, r * radarChartRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Label the circle
      ctx.fillStyle = '#777';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(r.toFixed(1), radarChartCenterX + 5, radarChartCenterY - r * radarChartRadius);
    }
    
    // Draw radar axes
    const axisCount = Math.min(16, data.oscillatorCount);
    const angleStep = (Math.PI * 2) / axisCount;
    
    for (let i = 0; i < axisCount; i++) {
      const angle = i * angleStep;
      const x = radarChartCenterX + Math.cos(angle) * radarChartRadius;
      const y = radarChartCenterY + Math.sin(angle) * radarChartRadius;
      
      ctx.beginPath();
      ctx.moveTo(radarChartCenterX, radarChartCenterY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Label the axis
      const labelX = radarChartCenterX + Math.cos(angle) * (radarChartRadius + 15);
      const labelY = radarChartCenterY + Math.sin(angle) * (radarChartRadius + 15);
      
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`O${i + 1}`, labelX, labelY);
    }
    
    // Draw stability data
    ctx.fillStyle = 'rgba(156, 39, 176, 0.2)';
    ctx.strokeStyle = '#9C27B0';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (let i = 0; i < axisCount; i++) {
      const angle = i * angleStep;
      const value = data.stabilityScores[i] || 0;
      const x = radarChartCenterX + Math.cos(angle) * radarChartRadius * value;
      const y = radarChartCenterY + Math.sin(angle) * radarChartRadius * value;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ψ-Phase Stability', width / 2, 20);
    
    // Draw overall stability
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Overall Stability: ${(data.overallStability * 100).toFixed(1)}%`, width / 2, height - 10);
  };
  
  // Handle metric tab selection
  const handleMetricChange = (metric) => {
    setActiveMetric(metric);
  };
  
  return (
    <div className="quality-metrics">
      <h2>Quality Metrics</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="metric-tabs">
        <button 
          className={`metric-tab ${activeMetric === 'av-sync' ? 'active' : ''}`}
          onClick={() => handleMetricChange('av-sync')}
        >
          A/V Sync Drift
        </button>
        <button 
          className={`metric-tab ${activeMetric === 'landmark-error' ? 'active' : ''}`}
          onClick={() => handleMetricChange('landmark-error')}
        >
          Landmark RMS Error
        </button>
        <button 
          className={`metric-tab ${activeMetric === 'phase-stability' ? 'active' : ''}`}
          onClick={() => handleMetricChange('phase-stability')}
        >
          ψ-Phase Stability
        </button>
      </div>
      
      <div className="metric-content">
        {isLoading ? (
          <div className="loading-indicator">Loading metrics data...</div>
        ) : (
          <>
            {/* A/V Sync Drift */}
            <div className={`metric-panel ${activeMetric === 'av-sync' ? 'active' : ''}`}>
              {avSyncData && (
                <>
                  <div className="chart-container">
                    <canvas 
                      ref={syncChartRef} 
                      width={800} 
                      height={400}
                      className="metric-chart"
                    />
                  </div>
                  
                  <div className="metric-stats">
                    <div className="stat-item">
                      <span className="stat-label">Maximum Drift:</span>
                      <span className="stat-value">{avSyncData.maxDrift.toFixed(1)} ms</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Average Drift:</span>
                      <span className="stat-value">{avSyncData.avgDrift.toFixed(1)} ms</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Drift Variance:</span>
                      <span className="stat-value">{avSyncData.driftVariance.toFixed(1)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Status:</span>
                      <span className={`stat-status ${avSyncData.maxDrift < 20 ? 'good' : 'bad'}`}>
                        {avSyncData.maxDrift < 20 ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="metric-explanation">
                    <h3>About A/V Sync Drift</h3>
                    <p>
                      A/V Sync Drift measures the temporal alignment between audio and visual elements in the 
                      ψ-Trajectory recording. The human perceptual system is sensitive to audiovisual synchrony, 
                      with tolerances generally around ±20ms.
                    </p>
                    <p>
                      <strong>Maximum Drift</strong> indicates the worst-case synchronization error across the session.
                      <strong>Average Drift</strong> provides the typical synchronization quality, while
                      <strong>Drift Variance</strong> measures consistency of synchronization.
                    </p>
                    <p>
                      This metric is calculated by measuring the time difference between corresponding audio and 
                      visual events within the same ψ-frames, utilizing the temporal markers embedded in the archive.
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {/* Landmark Error */}
            <div className={`metric-panel ${activeMetric === 'landmark-error' ? 'active' : ''}`}>
              {landmarkErrorData && (
                <>
                  <div className="chart-container">
                    <canvas 
                      ref={landmarkChartRef} 
                      width={800} 
                      height={400}
                      className="metric-chart"
                    />
                  </div>
                  
                  <div className="metric-stats">
                    <div className="stat-item">
                      <span className="stat-label">RMS Error:</span>
                      <span className="stat-value">{landmarkErrorData.rmsError.toFixed(2)} pixels</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Maximum Error:</span>
                      <span className="stat-value">{landmarkErrorData.maxError.toFixed(2)} pixels</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Frames Analyzed:</span>
                      <span className="stat-value">{landmarkErrorData.frameCount.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Status:</span>
                      <span className={`stat-status ${landmarkErrorData.rmsError < 3 ? 'good' : 'bad'}`}>
                        {landmarkErrorData.rmsError < 3 ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="metric-explanation">
                    <h3>About Landmark RMS Error</h3>
                    <p>
                      Landmark RMS (Root Mean Square) Error quantifies the positional accuracy of facial and body landmarks 
                      in the visual component of the ψ-Trajectory. Lower values indicate more precise tracking of key 
                      anatomical features.
                    </p>
                    <p>
                      This metric is calculated by comparing the positions of detected landmarks against ground truth 
                      reference positions (either manually annotated or derived from a high-precision reference system).
                    </p>
                    <p>
                      The bar chart shows per-landmark errors, while the line chart displays how the overall 
                      RMS error evolves throughout the session, which helps identify periods of tracking instability.
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {/* Phase Stability */}
            <div className={`metric-panel ${activeMetric === 'phase-stability' ? 'active' : ''}`}>
              {phaseStabilityData && (
                <>
                  <div className="chart-container">
                    <canvas 
                      ref={phaseChartRef} 
                      width={800} 
                      height={500}
                      className="metric-chart"
                    />
                  </div>
                  
                  <div className="metric-stats">
                    <div className="stat-item">
                      <span className="stat-label">Overall Stability:</span>
                      <span className="stat-value">{(phaseStabilityData.overallStability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Min Oscillator Stability:</span>
                      <span className="stat-value">
                        {(Math.min(...phaseStabilityData.stabilityScores) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Max Oscillator Stability:</span>
                      <span className="stat-value">
                        {(Math.max(...phaseStabilityData.stabilityScores) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Status:</span>
                      <span className={`stat-status ${phaseStabilityData.overallStability > 0.75 ? 'good' : 'bad'}`}>
                        {phaseStabilityData.overallStability > 0.75 ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="metric-explanation">
                    <h3>About ψ-Phase Stability</h3>
                    <p>
                      ψ-Phase Stability measures the consistency and predictability of oscillator phase patterns 
                      throughout the recorded session. High stability indicates a well-formed ψ-field with coherent 
                      oscillatory behavior.
                    </p>
                    <p>
                      This metric combines several factors:
                    </p>
                    <ul>
                      <li><strong>Phase Coherence</strong>: Consistency of phase relationships between oscillators</li>
                      <li><strong>Temporal Regularity</strong>: Predictability of phase evolution over time</li>
                      <li><strong>Resistance to Noise</strong>: Immunity to random fluctuations</li>
                    </ul>
                    <p>
                      The line chart shows overall stability throughout the session, while the radar diagram displays 
                      individual stability scores for each oscillator, helping identify problematic oscillators that may 
                      need tuning or replacement.
                    </p>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
      
      <style jsx>{`
        .quality-metrics {
          font-family: Arial, sans-serif;
          padding: 20
