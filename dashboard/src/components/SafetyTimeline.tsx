import React, { useRef, useEffect, useState } from 'react';
import { useSSE } from '../hooks/useSSE';

interface SafetyTimelineProps {
  sysId: string;
  thresholdColor?: string;
  barrierColor?: string;
  width?: number;
  height?: number;
  maxPoints?: number;
}

interface BarrierData {
  t: number;
  barrier: number;
  thr: number;
}

/**
 * Component to display real-time barrier function values over time.
 * Uses Server-Sent Events to stream data at high frequency (20Hz).
 */
const SafetyTimeline: React.FC<SafetyTimelineProps> = ({
  sysId,
  thresholdColor = 'rgba(255, 0, 0, 0.5)',
  barrierColor = 'rgba(0, 123, 255, 0.8)',
  width = 800,
  height = 300,
  maxPoints = 100
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<BarrierData[]>([]);
  const [alertActive, setAlertActive] = useState(false);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to barrier function stream using SSE
  const { data, status } = useSSE<BarrierData>(
    `/api/v1/stream/barrier?sys=${sysId}`,
    null,
    {
      onMessage: (newData) => {
        // Check if barrier exceeds threshold
        if (newData.barrier > newData.thr) {
          // Activate alert
          setAlertActive(true);
          
          // Clear existing timeout if there is one
          if (alertTimeoutRef.current) {
            clearTimeout(alertTimeoutRef.current);
          }
          
          // Set timeout to clear alert after 500ms
          alertTimeoutRef.current = setTimeout(() => {
            setAlertActive(false);
            alertTimeoutRef.current = null;
          }, 500);
        }
        
        // Update points for timeline
        setPoints(prev => {
          const newPoints = [...prev, newData];
          // Keep only the most recent points if we exceed maxPoints
          return newPoints.length > maxPoints
            ? newPoints.slice(newPoints.length - maxPoints)
            : newPoints;
        });
      }
    }
  );

  // Draw timeline on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (points.length === 0) return;
    
    // Calculate min and max for y-axis
    let minBarrier = Math.min(...points.map(p => p.barrier));
    let maxBarrier = Math.max(...points.map(p => p.barrier));
    const minThr = Math.min(...points.map(p => p.thr));
    const maxThr = Math.max(...points.map(p => p.thr));
    
    // Ensure min and max include both barrier and threshold values
    minBarrier = Math.min(minBarrier, minThr);
    maxBarrier = Math.max(maxBarrier, maxThr);
    
    // Add some padding to prevent values from being drawn at edges
    const paddingFactor = 0.1;
    const range = maxBarrier - minBarrier;
    const padding = range * paddingFactor;
    const yMin = minBarrier - padding;
    const yMax = maxBarrier + padding;
    
    // Function to map time and barrier values to canvas coordinates
    const mapX = (t: number, tMin: number, tMax: number) => 
      ((t - tMin) / (tMax - tMin)) * canvas.width;
    const mapY = (v: number) => 
      canvas.height - ((v - yMin) / (yMax - yMin)) * canvas.height;
    
    // Get time range
    const tMin = points[0].t;
    const tMax = points[points.length - 1].t;
    
    // Draw threshold line
    ctx.beginPath();
    ctx.moveTo(0, mapY(points[0].thr));
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(mapX(points[i].t, tMin, tMax), mapY(points[i].thr));
    }
    ctx.strokeStyle = thresholdColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw barrier function line
    ctx.beginPath();
    ctx.moveTo(0, mapY(points[0].barrier));
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(mapX(points[i].t, tMin, tMax), mapY(points[i].barrier));
    }
    ctx.strokeStyle = barrierColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw y-axis
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();
    
    // Draw y-axis labels
    ctx.fillStyle = '#333';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '12px Arial';
    
    // Draw min and max y values
    ctx.fillText(yMin.toFixed(2), 30, canvas.height - 10);
    ctx.fillText(yMax.toFixed(2), 30, 10);
    
    // Draw alert overlay if barrier has exceeded threshold
    if (alertActive) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
  }, [points, thresholdColor, barrierColor, alertActive]);
  
  return (
    <div className="safety-timeline" style={{ position: 'relative' }}>
      <h3>Barrier Function Timeline</h3>
      <div>Status: {status}</div>
      {alertActive && (
        <div 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            padding: '5px',
            backgroundColor: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
            zIndex: 100
          }}
        >
          SAFETY VIOLATION: Barrier threshold exceeded!
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        style={{ 
          border: '1px solid #ddd',
          backgroundColor: '#f9f9f9'
        }}
      />
      <div className="legend" style={{ display: 'flex', marginTop: '10px' }}>
        <div style={{ marginRight: '20px' }}>
          <span 
            style={{ 
              display: 'inline-block', 
              width: '20px', 
              height: '3px', 
              backgroundColor: barrierColor,
              marginRight: '5px'
            }} 
          />
          <span>Barrier Value</span>
        </div>
        <div>
          <span 
            style={{ 
              display: 'inline-block', 
              width: '20px', 
              height: '3px', 
              backgroundColor: thresholdColor,
              marginRight: '5px'
            }} 
          />
          <span>Threshold</span>
        </div>
      </div>
    </div>
  );
};

export default SafetyTimeline;
