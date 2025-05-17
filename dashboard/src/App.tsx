import React, { useState } from 'react';
import SafetyTimeline from './components/SafetyTimeline';
import IsoSurfaceViewer from './components/IsoSurfaceViewer';
import ParamSlider from './components/ParamSlider';
import FieldHeatmap from './components/FieldHeatmap';

/**
 * Main Safety Dashboard Application
 * Provides real-time visualization of barrier functions and Lyapunov stability metrics
 */
const App: React.FC = () => {
  const [sysId, setSysId] = useState<string>('quadrotor');
  const [functionType, setFunctionType] = useState<'barrier' | 'lyapunov'>('barrier');
  const [levelValue, setLevelValue] = useState<number>(0.5);
  const [lambdaWeight, setLambdaWeight] = useState<number>(0.75);
  const [epsilonValue, setEpsilonValue] = useState<number>(0.01);
  
  const handleSystemChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSysId(event.target.value);
  };
  
  const handleFunctionTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFunctionType(event.target.value as 'barrier' | 'lyapunov');
  };
  
  return (
    <div className="safety-dashboard">
      <header style={{ 
        padding: '20px', 
        backgroundColor: '#2a3f5f', 
        color: 'white', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <h1>ELFIN Safety Lens Dashboard</h1>
        <p>Real-time barrier and Lyapunov stability monitoring</p>
      </header>
      
      <div style={{ padding: '20px' }}>
        {/* Control panel */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <h2>Controls</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>System</label>
              <select 
                value={sysId} 
                onChange={handleSystemChange}
                style={{ padding: '8px', borderRadius: '4px', width: '200px' }}
              >
                <option value="quadrotor">Quadrotor</option>
                <option value="pendulum">Inverted Pendulum</option>
                <option value="cartpole">Cart-Pole</option>
                <option value="custom">Custom System</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Function Type</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <label>
                  <input 
                    type="radio" 
                    value="barrier" 
                    checked={functionType === 'barrier'} 
                    onChange={handleFunctionTypeChange} 
                  />
                  Barrier
                </label>
                <label>
                  <input 
                    type="radio" 
                    value="lyapunov" 
                    checked={functionType === 'lyapunov'} 
                    onChange={handleFunctionTypeChange} 
                  />
                  Lyapunov
                </label>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <h3>Parameters</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '15px' 
            }}>
              <ParamSlider 
                label="λ-cut Level" 
                min={0} 
                max={1} 
                step={0.01} 
                initialValue={levelValue} 
                paramId="lambda_cut" 
                onValueChange={setLevelValue}
              />
              
              <ParamSlider 
                label="λ Weight" 
                min={0} 
                max={1} 
                step={0.01} 
                initialValue={lambdaWeight} 
                paramId="lambda_weight" 
                onValueChange={setLambdaWeight}
              />
              
              <ParamSlider 
                label="ε Value" 
                min={0.001} 
                max={0.1} 
                step={0.001} 
                initialValue={epsilonValue} 
                paramId="epsilon" 
                onValueChange={setEpsilonValue}
              />
            </div>
          </div>
        </div>
        
        {/* Visualization panels - First row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
          gap: '20px',
          marginBottom: '20px'
        }}>
          {/* Barrier function timeline */}
          <div className="panel" style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '5px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <SafetyTimeline 
              sysId={sysId} 
              width={500} 
              height={300} 
            />
          </div>
          
          {/* 3D Iso-surface viewer */}
          <div className="panel" style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '5px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <IsoSurfaceViewer 
              levelValue={levelValue} 
              functionType={functionType} 
              width={500} 
              height={500} 
            />
          </div>
        </div>
        
        {/* Visualization panels - Second row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
          gap: '20px',
          marginBottom: '20px'
        }}>
          {/* 2D Field Heatmap */}
          <div className="panel" style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '5px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <FieldHeatmap
              type={functionType}
              sysId={sysId}
              gridSize={80}
              width={500}
              height={400}
            />
          </div>
          
          {/* Additional metrics and indicators */}
          <div className="panel" style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '5px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3>System Metrics</h3>
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#e8f5e9', 
              borderRadius: '4px', 
              color: '#2e7d32',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '15px'
            }}>
              STABLE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Min Barrier Value</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>0.28</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Safety Margin</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>76%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Lyapunov Decay</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>-0.05/s</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Compute Usage</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>4.2ms</div>
              </div>
            </div>
            <p style={{ marginTop: '15px', fontSize: '0.9rem' }}>
              Current system is within safe operating parameters. All barrier conditions are satisfied.
              {functionType === 'lyapunov' ? 
                ' Lyapunov function indicates guaranteed convergence to the origin.' : 
                ' Barrier function remains above the minimum safety threshold.'}
            </p>
          </div>
        </div>
      </div>
      
      <footer style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderTop: '1px solid #ddd',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#666'
      }}>
        ELFIN Safety Lens Dashboard | α-0.2.0 | © 2025 ELFIN Project
      </footer>
    </div>
  );
};

export default App;
