import React, { useState, useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

interface FieldHeatmapProps {
  type: 'barrier' | 'lyapunov';
  sysId: string;
  gridSize?: number;
  width?: number;
  height?: number;
  colorScale?: string[];
}

interface FieldData {
  x: number[];
  y: number[];
  z: number[][];
  type: string;
  system: string;
}

/**
 * Component for displaying 2D heatmaps of barrier or Lyapunov fields.
 * Uses Plotly for rendering.
 */
const FieldHeatmap: React.FC<FieldHeatmapProps> = ({
  type,
  sysId,
  gridSize = 100,
  width = 500,
  height = 400,
  colorScale = type === 'barrier' 
    ? ['#f8696b', '#ffeb84', '#63be7b'] // Red to Green for barrier (higher is better)
    : ['#63be7b', '#ffeb84', '#f8696b'] // Green to Red for Lyapunov (lower is better)
}) => {
  const plotRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FieldData | null>(null);
  
  // Fetch field data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `/api/v1/field?type=${type}&grid=${gridSize}&sys=${sysId}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch field data: ${response.statusText}`);
        }
        
        const fieldData = await response.json();
        setData(fieldData);
      } catch (err) {
        console.error('Error fetching field data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [type, sysId, gridSize]);
  
  // Create or update plot when data changes
  useEffect(() => {
    if (!plotRef.current || !data) return;
    
    // Process data for Plotly
    const processedZ = data.z;
    
    // Create plot
    const plotData = [{
      x: data.x,
      y: data.y,
      z: processedZ,
      type: 'heatmap',
      colorscale: colorScale,
      showscale: true,
      hoverinfo: 'x+y+z',
    }];
    
    const title = type === 'barrier' 
      ? 'Barrier Function Field' 
      : 'Lyapunov Function Field';
      
    const zAxisTitle = type === 'barrier'
      ? 'Barrier Value (higher = safer)'
      : 'Lyapunov Value (lower = more stable)';
      
    const layout = {
      title: title,
      width: width,
      height: height,
      margin: { l: 65, r: 50, b: 65, t: 90 },
      xaxis: {
        title: 'x₁',
        zeroline: true,
        showgrid: true,
      },
      yaxis: {
        title: 'x₂',
        zeroline: true,
        showgrid: true,
      },
      coloraxis: {
        colorbar: {
          title: zAxisTitle,
          thickness: 15,
          len: 0.9,
        }
      },
      annotations: [
        {
          x: 0,
          y: 0,
          xref: 'x',
          yref: 'y',
          text: 'origin',
          showarrow: true,
          arrowhead: 0,
          ax: 0,
          ay: -40
        }
      ]
    };
    
    // Clear any existing plots
    while (plotRef.current.firstChild) {
      plotRef.current.removeChild(plotRef.current.firstChild);
    }
    
    // Create new plot
    Plotly.newPlot(plotRef.current, plotData, layout);
    
    // Cleanup on unmount
    return () => {
      if (plotRef.current) {
        Plotly.purge(plotRef.current);
      }
    };
  }, [data, colorScale, type, width, height]);
  
  return (
    <div className="field-heatmap">
      <h3>{type === 'barrier' ? 'Barrier' : 'Lyapunov'} Function Field</h3>
      <div style={{ position: 'relative' }}>
        <div ref={plotRef}></div>
        {loading && (
          <div 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)'
            }}
          >
            <div>Loading field data...</div>
          </div>
        )}
        {error && (
          <div 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              color: 'red'
            }}
          >
            <div>{error}</div>
          </div>
        )}
      </div>
      <div className="info" style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
        <div>System: {sysId}</div>
        <div>Grid: {gridSize}x{gridSize}</div>
        <div>
          {type === 'barrier' 
            ? 'Higher values (green) indicate safer regions' 
            : 'Lower values (green) indicate more stable regions'}
        </div>
      </div>
    </div>
  );
};

export default FieldHeatmap;
