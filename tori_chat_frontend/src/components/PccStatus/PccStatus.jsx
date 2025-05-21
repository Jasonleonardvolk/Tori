import React, { useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useMcpSocket } from '../../hooks/useMcpSocket';
import { usePhaseEvent } from '../../hooks/usePhaseEvent';
import './PccStatus.css';

/**
 * PCC Status Component
 * 
 * Displays real-time PCC state information from the MCP WebSocket connection
 * including metrics, energy chart, oscillator visualization, and phase metrics.
 */
const PccStatus = ({ websocketUrl }) => {
  // Connect to MCP WebSocket for real-time updates
  const { pccState, connected } = useMcpSocket(websocketUrl || "ws://127.0.0.1:8787/ws");
  const { phases = [], spins = [], energy = 0, step = 0 } = pccState;
  
  // Connect to PhaseEventBus for phase metrics
  const { 
    phase, 
    phaseVelocity, 
    phaseDrift,
    agents,
    connectionCount,
    eventRate,
    metrics,
    phaseEvent
  } = usePhaseEvent({
    autoPublish: true,
    publishInterval: 1000,
  });
  
  // Send periodic phase event to feed metrics
  useEffect(() => {
    const interval = setInterval(() => {
      // Use phase_event with oscillator data if available
      if (phases.length > 0) {
        const avgPhase = phases.reduce((sum, p) => sum + p, 0) / phases.length;
        phaseEvent(avgPhase, undefined, { 
          energy,
          oscillatorCount: phases.length,
          step
        });
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [phases, energy, step, phaseEvent]);

  // Format phase data for the chart
  const chartData = useMemo(() => {
    return phases.slice(0, 20).map((phase, index) => ({
      index,
      phase,
      spin: spins[index] || 0
    }));
  }, [phases, spins]);

  // Generate colors for the oscillators based on phase values
  const getOscillatorColor = (phase, spin) => {
    // Normalize phase to [0, 1]
    const normalizedPhase = phase / (2 * Math.PI);
    
    // Generate HSL color based on phase (hue) and spin (lightness)
    const hue = normalizedPhase * 360;
    const lightness = spin === 1 ? 50 : 30;
    
    return `hsl(${hue}, 70%, ${lightness}%)`;
  };

  return (
    <div className="pcc-status">
      <div className="pcc-status__header">
        <h2>PCC Status</h2>
        <div className="pcc-status__connection-wrapper">
          <div className={`pcc-status__connection ${connected ? 'connected' : 'disconnected'}`}>
            MCP: {connected ? 'Connected' : 'Disconnected'}
          </div>
          <div className={`pcc-status__connection ${connectionCount > 0 ? 'connected' : 'disconnected'}`}>
            Phase Bus: {connectionCount} agents
          </div>
        </div>
      </div>

      <div className="pcc-status__metrics">
        <div className="pcc-status__metric">
          <span className="pcc-status__metric-label">Step</span>
          <span className="pcc-status__metric-value">{step}</span>
        </div>
        <div className="pcc-status__metric">
          <span className="pcc-status__metric-label">Energy</span>
          <span className="pcc-status__metric-value">{energy.toFixed(4)}</span>
        </div>
        <div className="pcc-status__metric">
          <span className="pcc-status__metric-label">Oscillators</span>
          <span className="pcc-status__metric-value">{phases.length}</span>
        </div>
        <div className="pcc-status__metric">
          <span className="pcc-status__metric-label">Last Update</span>
          <span className="pcc-status__metric-value">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
      
      <div className="pcc-status__metrics pcc-status__phase-metrics">
        <div className="pcc-status__metric">
          <span className="pcc-status__metric-label">Phase</span>
          <span className="pcc-status__metric-value">{phase.toFixed(2)}</span>
        </div>
        <div className="pcc-status__metric">
          <span className="pcc-status__metric-label">Phase Velocity</span>
          <span className="pcc-status__metric-value">{phaseVelocity.toFixed(3)} rad/s</span>
        </div>
        <div className="pcc-status__metric">
          <span className="pcc-status__metric-label">Phase Drift</span>
          <span className="pcc-status__metric-value">{phaseDrift.toFixed(3)}</span>
        </div>
        <div className="pcc-status__metric">
          <span className="pcc-status__metric-label">Event Rate</span>
          <span className="pcc-status__metric-value">{eventRate.toFixed(1)} ev/s</span>
        </div>
      </div>

      <div className="pcc-status__chart">
        <h3>Phase Distribution</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <XAxis dataKey="index" />
            <YAxis domain={[0, 2 * Math.PI]} />
            <Tooltip 
              formatter={(value) => value.toFixed(2)} 
              labelFormatter={(index) => `Oscillator ${index}`}
            />
            <Line 
              type="monotone" 
              dataKey="phase" 
              stroke="#8884d8" 
              dot={{ r: 4 }} 
              activeDot={{ r: 6 }} 
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="pcc-status__visualization">
        <h3>Oscillator Network</h3>
        <div className="pcc-status__oscillators">
          {phases.map((phase, index) => (
            <div
              key={index}
              className="pcc-status__oscillator"
              style={{ 
                backgroundColor: getOscillatorColor(phase, spins[index]),
                transform: `rotate(${phase * (180 / Math.PI)}deg)`
              }}
              title={`Oscillator ${index}: Phase ${phase.toFixed(2)}, Spin ${spins[index]}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PccStatus;
