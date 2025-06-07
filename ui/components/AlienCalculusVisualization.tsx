{
  `path`: `C:\\Users\\jason\\Desktop\	ori\\kha\\ui\\components\\AlienCalculusVisualization.tsx`,
  `content`: `/**
 * TORI AlienCalculus - TypeScript Visualization Component
 * 
 * This component provides real-time visualization of alien calculus analysis,
 * including alien term detection, scar highlighting, and transseries plots.
 * 
 * Features:
 * - Real-time alien event visualization
 * - Interactive concept graphs with scar highlighting  
 * - Time series plots of novelty and alien significance
 * - Transseries analysis dashboard
 * - Formal verification status display
 * - Performance metrics monitoring
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Text, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  LineChart, Line as RechartsLine, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ScatterChart, Scatter,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { 
  AlertTriangle, Zap, Activity, Brain, GitBranch, 
  Target, TrendingUp, Clock, CheckCircle, XCircle,
  Eye, Settings, Play, Pause, RotateCcw
} from 'lucide-react';

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

interface AlienTerm {
  term_id: string;
  concept_id: number;
  context_id: string;
  significance: number;
  action_value: number;
  coefficient: number;
  detected_at: number;
  term_type: 'SemanticJump' | 'ConceptualLeap' | 'ContextualAnomaly' | 
             'TemporalDisruption' | 'CausalBreak' | 'Resurgence' | 
             'NoveltySpike' | 'PatternBreak';
  explanation: string;
  confidence: number;
  resolution_status: 'Unresolved' | 'ResolvedByWormhole' | 'ResolvedByBraid' | 
                    'ResolvedByHierarchy' | 'BecameScar' | 'FalsePositive' | 
                    'UnderInvestigation';
  metadata: Record<string, number>;
}

interface Scar {
  scar_id: string;
  concept_id: number;
  contexts: string[];
  severity: number;
  created_at: number;
  last_audit: number;
  scar_type: 'ContextualGap' | 'HierarchicalOrphan' | 'TemporalInconsistency' |
             'CausalLoop' | 'SemanticVoid' | 'TopologicalDefect';
  formal_description: string;
  healing_probability: number;
}

interface ConceptSeries {
  series_id: string;
  context_id: string;
  concept_sequence: number[];
  timestamps: number[];
  novelty_scores: number[];
  surprise_values: number[];
  alien_term_count: number;
}

interface AlienCalculusEvent {
  type: 'AlienDetected' | 'ScarDetected' | 'AlienResolved' | 'ScarHealed' |
        'SeriesAnalysisCompleted' | 'NoveltySpike' | 'FormalVerificationCompleted';
  timestamp: number;
  data: any;
}

interface VisualizationProps {
  websocketUrl?: string;
  autoConnect?: boolean;
  debugMode?: boolean;
  theme?: 'dark' | 'light';
}

// ===================================================================
// WEBSOCKET CONNECTION HOOK
// ===================================================================

const useAlienCalculusWebSocket = (url: string = 'ws://localhost:8004') => {
  const [isConnected, setIsConnected] = useState(false);
  const [alienTerms, setAlienTerms] = useState<AlienTerm[]>([]);
  const [scars, setScars] = useState<Scar[]>([]);
  const [recentEvents, setRecentEvents] = useState<AlienCalculusEvent[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(url);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Connected to AlienCalculus WebSocket');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const eventData: AlienCalculusEvent = JSON.parse(event.data);
          
          // Update state based on event type
          switch (eventData.type) {
            case 'AlienDetected':
              setAlienTerms(prev => [eventData.data.alien_term, ...prev].slice(0, 100));
              break;
              
            case 'ScarDetected':
              setScars(prev => [eventData.data.scar, ...prev].slice(0, 50));
              break;
              
            case 'AlienResolved':
              setAlienTerms(prev => prev.map(term => 
                term.term_id === eventData.data.term_id 
                  ? { ...term, resolution_status: eventData.data.success ? 'ResolvedByWormhole' : 'UnderInvestigation' }
                  : term
              ));
              break;
              
            case 'ScarHealed':
              setScars(prev => prev.filter(scar => scar.scar_id !== eventData.data.scar_id));
              break;
          }

          // Add to recent events
          setRecentEvents(prev => [eventData, ...prev].slice(0, 50));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('Disconnected from AlienCalculus WebSocket');
        // Attempt reconnection after 5 seconds
        setTimeout(connect, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    isConnected,
    alienTerms,
    scars,
    recentEvents,
    stats,
    connect,
    disconnect
  };
};

// ===================================================================
// 3D ALIEN TERM VISUALIZATION
// ===================================================================

const AlienTerm3D: React.FC<{ term: AlienTerm; position: [number, number, number] }> = ({ term, position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Pulsing effect based on significance
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * (term.significance / 10);
      meshRef.current.scale.setScalar(scale);
      
      // Rotation based on action value
      meshRef.current.rotation.y += term.action_value * 0.01;
    }
  });

  const color = useMemo(() => {
    const typeColors = {
      'SemanticJump': '#ff6b6b',
      'ConceptualLeap': '#4ecdc4',
      'ContextualAnomaly': '#45b7d1',
      'TemporalDisruption': '#f39c12',
      'CausalBreak': '#e74c3c',
      'Resurgence': '#9b59b6',
      'NoveltySpike': '#2ecc71',
      'PatternBreak': '#f1c40f'
    };
    return typeColors[term.term_type] || '#95a5a6';
  }, [term.term_type]);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.5 + term.significance * 0.1, 16, 16]} />
        <meshStandardMaterial 
          color={color}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Action value visualization as orbiting ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1 + term.action_value * 0.2, 0.05, 8, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      
      {/* Hover info */}
      {hovered && (
        <Html position={[0, 1, 0]} center>
          <div className=\"bg-black bg-opacity-80 text-white p-2 rounded text-xs max-w-xs\">
            <div className=\"font-bold\">{term.term_type}</div>
            <div>Significance: {term.significance.toFixed(2)}</div>
            <div>Action: {term.action_value.toFixed(2)}</div>
            <div>Confidence: {(term.confidence * 100).toFixed(1)}%</div>
            <div>Status: {term.resolution_status}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

// ===================================================================
// SCAR VISUALIZATION
// ===================================================================

const Scar3D: React.FC<{ scar: Scar; position: [number, number, number] }> = ({ scar, position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Irregular pulsing for scars
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3 + scar.severity) * 0.2;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const scarColor = useMemo(() => {
    const healingIntensity = 1 - scar.healing_probability;
    return `hsl(${Math.max(0, 60 - scar.severity * 10)}, 80%, ${50 + healingIntensity * 30}%)`;
  }, [scar.severity, scar.healing_probability]);

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.4 + scar.severity * 0.1]} />
        <meshStandardMaterial 
          color={scarColor}
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>
      
      {/* Crack effect */}
      <Line
        points={[
          [0, 0, 0],
          [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5],
          [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]
        ]}
        color=\"#8b0000\"
        lineWidth={2}
      />
    </group>
  );
};

// ===================================================================
// MAIN 3D VISUALIZATION SCENE
// ===================================================================

const AlienCalculus3DScene: React.FC<{ alienTerms: AlienTerm[]; scars: Scar[] }> = ({ alienTerms, scars }) => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color=\"#4a90e2\" />
      
      {/* Alien Terms */}
      {alienTerms.slice(0, 20).map((term, index) => {
        const angle = (index / alienTerms.length) * Math.PI * 2;
        const radius = 5 + term.significance;
        const position: [number, number, number] = [
          Math.cos(angle) * radius,
          (term.action_value - 2.5) * 2,
          Math.sin(angle) * radius
        ];
        
        return (
          <AlienTerm3D 
            key={term.term_id} 
            term={term} 
            position={position} 
          />
        );
      })}
      
      {/* Scars */}
      {scars.slice(0, 10).map((scar, index) => {
        const position: [number, number, number] = [
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        ];
        
        return (
          <Scar3D 
            key={scar.scar_id} 
            scar={scar} 
            position={position} 
          />
        );
      })}
      
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  );
};

// ===================================================================
// TRANSSERIES ANALYSIS CHART
// ===================================================================

const TransseriesChart: React.FC<{ series: ConceptSeries }> = ({ series }) => {
  const chartData = useMemo(() => {
    return series.timestamps.map((timestamp, index) => ({
      time: timestamp,
      novelty: series.novelty_scores[index] || 0,
      surprise: series.surprise_values[index] || 0,
      concept: series.concept_sequence[index] || 0
    }));
  }, [series]);

  return (
    <div className=\"w-full h-64\">
      <ResponsiveContainer width=\"100%\" height=\"100%\">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray=\"3 3\" stroke=\"#374151\" />
          <XAxis 
            dataKey=\"time\" 
            stroke=\"#9ca3af\"
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke=\"#9ca3af\" tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '8px'
            }}
          />
          <RechartsLine 
            type=\"monotone\" 
            dataKey=\"novelty\" 
            stroke=\"#10b981\" 
            strokeWidth={2}
            dot={false}
            name=\"Novelty\"
          />
          <RechartsLine 
            type=\"monotone\" 
            dataKey=\"surprise\" 
            stroke=\"#f59e0b\" 
            strokeWidth={2}
            dot={false}
            name=\"Surprise\"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ===================================================================
// ALIEN EVENTS TIMELINE
// ===================================================================

const AlienEventsTimeline: React.FC<{ events: AlienCalculusEvent[] }> = ({ events }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'AlienDetected': return <Zap className=\"w-4 h-4 text-yellow-400\" />;
      case 'ScarDetected': return <AlertTriangle className=\"w-4 h-4 text-red-400\" />;
      case 'AlienResolved': return <CheckCircle className=\"w-4 h-4 text-green-400\" />;
      case 'ScarHealed': return <CheckCircle className=\"w-4 h-4 text-blue-400\" />;
      case 'NoveltySpike': return <TrendingUp className=\"w-4 h-4 text-purple-400\" />;
      default: return <Activity className=\"w-4 h-4 text-gray-400\" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  return (
    <div className=\"max-h-96 overflow-y-auto space-y-2\">
      {events.map((event, index) => (
        <div key={index} className=\"flex items-center space-x-3 p-2 bg-gray-800 rounded-lg\">
          <div className=\"flex-shrink-0\">
            {getEventIcon(event.type)}
          </div>
          <div className=\"flex-grow\">
            <div className=\"text-sm font-medium text-white\">
              {event.type.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className=\"text-xs text-gray-400\">
              {formatTimestamp(event.timestamp)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ===================================================================
// STATISTICS DASHBOARD
// ===================================================================

const StatsDashboard: React.FC<{ stats: Record<string, number> }> = ({ stats }) => {
  const statCards = [
    { key: 'total_alien_terms', label: 'Total Aliens', icon: Zap, color: 'text-yellow-400' },
    { key: 'unresolved_aliens', label: 'Unresolved', icon: AlertTriangle, color: 'text-red-400' },
    { key: 'total_scars', label: 'Active Scars', icon: Target, color: 'text-orange-400' },
    { key: 'resolution_rate', label: 'Resolution Rate', icon: CheckCircle, color: 'text-green-400', isPercentage: true },
    { key: 'average_significance', label: 'Avg Significance', icon: Brain, color: 'text-blue-400' },
    { key: 'active_series', label: 'Active Series', icon: Activity, color: 'text-purple-400' }
  ];

  return (
    <div className=\"grid grid-cols-2 md:grid-cols-3 gap-4\">
      {statCards.map(({ key, label, icon: Icon, color, isPercentage }) => {
        const value = stats[key] || 0;
        const displayValue = isPercentage ? `${(value * 100).toFixed(1)}%` : value.toFixed(1);
        
        return (
          <div key={key} className=\"bg-gray-800 p-4 rounded-lg\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm text-gray-400\">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{displayValue}</p>
              </div>
              <Icon className={`w-8 h-8 ${color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ===================================================================
// ALIEN TERM TYPE DISTRIBUTION
// ===================================================================

const AlienTypeDistribution: React.FC<{ alienTerms: AlienTerm[] }> = ({ alienTerms }) => {
  const distributionData = useMemo(() => {
    const counts = alienTerms.reduce((acc, term) => {
      acc[term.term_type] = (acc[term.term_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([type, count]) => ({
      name: type.replace(/([A-Z])/g, ' $1').trim(),
      value: count,
      fill: {
        'SemanticJump': '#ff6b6b',
        'ConceptualLeap': '#4ecdc4',
        'ContextualAnomaly': '#45b7d1',
        'TemporalDisruption': '#f39c12',
        'CausalBreak': '#e74c3c',
        'Resurgence': '#9b59b6',
        'NoveltySpike': '#2ecc71',
        'PatternBreak': '#f1c40f'
      }[type] || '#95a5a6'
    }));
  }, [alienTerms]);

  return (
    <ResponsiveContainer width=\"100%\" height={250}>
      <PieChart>
        <Pie
          data={distributionData}
          cx=\"50%\"
          cy=\"50%\"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey=\"value\"
        >
          {distributionData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            border: '1px solid #374151',
            borderRadius: '8px'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// ===================================================================
// MAIN ALIEN CALCULUS VISUALIZATION COMPONENT
// ===================================================================

const AlienCalculusVisualization: React.FC<VisualizationProps> = ({
  websocketUrl = 'ws://localhost:8004',
  autoConnect = true,
  debugMode = false,
  theme = 'dark'
}) => {
  const { isConnected, alienTerms, scars, recentEvents, stats } = useAlienCalculusWebSocket(websocketUrl);
  const [activeTab, setActiveTab] = useState<'3d' | 'charts' | 'events' | 'stats'>('3d');
  const [isPlaying, setIsPlaying] = useState(true);

  // Mock series data for demonstration
  const mockSeries: ConceptSeries = {
    series_id: 'demo_series',
    context_id: 'demo_context',
    concept_sequence: Array.from({ length: 50 }, (_, i) => i),
    timestamps: Array.from({ length: 50 }, (_, i) => Date.now() - (50 - i) * 1000),
    novelty_scores: Array.from({ length: 50 }, () => Math.random() * 3 + 0.5),
    surprise_values: Array.from({ length: 50 }, () => Math.random() * 2),
    alien_term_count: alienTerms.length
  };

  const tabs = [
    { id: '3d', label: '3D Visualization', icon: Eye },
    { id: 'charts', label: 'Analysis Charts', icon: TrendingUp },
    { id: 'events', label: 'Event Timeline', icon: Clock },
    { id: 'stats', label: 'Statistics', icon: Brain }
  ] as const;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <header className=\"bg-gray-800 border-b border-gray-700 p-4\">
        <div className=\"flex items-center justify-between\">
          <div className=\"flex items-center space-x-4\">
            <Brain className=\"w-8 h-8 text-blue-400\" />
            <h1 className=\"text-2xl font-bold\">TORI Alien Calculus</h1>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
              isConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          
          <div className=\"flex items-center space-x-2\">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className=\"p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors\"
            >
              {isPlaying ? <Pause className=\"w-4 h-4\" /> : <Play className=\"w-4 h-4\" />}
            </button>
            <button className=\"p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors\">
              <RotateCcw className=\"w-4 h-4\" />
            </button>
            <button className=\"p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors\">
              <Settings className=\"w-4 h-4\" />
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className=\"bg-gray-800 border-b border-gray-700\">
        <div className=\"flex space-x-1 p-1\">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className=\"w-4 h-4\" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className=\"p-6\">
        {activeTab === '3d' && (
          <div className=\"h-[600px] bg-gray-800 rounded-lg overflow-hidden\">
            <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
              <AlienCalculus3DScene alienTerms={alienTerms} scars={scars} />
            </Canvas>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className=\"space-y-6\">
            <div className=\"bg-gray-800 p-6 rounded-lg\">
              <h3 className=\"text-lg font-semibold mb-4 flex items-center space-x-2\">
                <Activity className=\"w-5 h-5\" />
                <span>Transseries Analysis</span>
              </h3>
              <TransseriesChart series={mockSeries} />
            </div>
            
            <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
              <div className=\"bg-gray-800 p-6 rounded-lg\">
                <h3 className=\"text-lg font-semibold mb-4\">Alien Type Distribution</h3>
                <AlienTypeDistribution alienTerms={alienTerms} />
              </div>
              
              <div className=\"bg-gray-800 p-6 rounded-lg\">
                <h3 className=\"text-lg font-semibold mb-4\">Resolution Status</h3>
                <div className=\"space-y-2\">
                  {['Unresolved', 'ResolvedByWormhole', 'ResolvedByBraid', 'BecameScar'].map(status => {
                    const count = alienTerms.filter(term => term.resolution_status === status).length;
                    const percentage = alienTerms.length > 0 ? (count / alienTerms.length) * 100 : 0;
                    
                    return (
                      <div key={status} className=\"flex items-center justify-between\">
                        <span className=\"text-sm text-gray-300\">{status}</span>
                        <div className=\"flex items-center space-x-2\">
                          <div className=\"w-20 bg-gray-700 rounded-full h-2\">
                            <div 
                              className=\"bg-blue-500 h-2 rounded-full transition-all duration-300\"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className=\"text-xs text-gray-400 w-12 text-right\">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className=\"bg-gray-800 p-6 rounded-lg\">
            <h3 className=\"text-lg font-semibold mb-4 flex items-center space-x-2\">
              <Clock className=\"w-5 h-5\" />
              <span>Recent Events ({recentEvents.length})</span>
            </h3>
            <AlienEventsTimeline events={recentEvents} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className=\"space-y-6\">
            <StatsDashboard stats={stats} />
            
            <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
              <div className=\"bg-gray-800 p-6 rounded-lg\">
                <h3 className=\"text-lg font-semibold mb-4\">Alien Terms by Significance</h3>
                <ResponsiveContainer width=\"100%\" height={200}>
                  <ScatterChart data={alienTerms.slice(0, 20).map(term => ({
                    significance: term.significance,
                    confidence: term.confidence * 100,
                    action: term.action_value
                  }))}>
                    <CartesianGrid strokeDasharray=\"3 3\" stroke=\"#374151\" />
                    <XAxis dataKey=\"significance\" name=\"Significance\" stroke=\"#9ca3af\" />
                    <YAxis dataKey=\"confidence\" name=\"Confidence\" stroke=\"#9ca3af\" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Scatter name=\"Alien Terms\" dataKey=\"confidence\" fill=\"#10b981\" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              
              <div className=\"bg-gray-800 p-6 rounded-lg\">
                <h3 className=\"text-lg font-semibold mb-4\">Scar Healing Probabilities</h3>
                <ResponsiveContainer width=\"100%\" height={200}>
                  <BarChart data={scars.map(scar => ({
                    id: scar.scar_id.slice(-8),
                    healing: scar.healing_probability * 100,
                    severity: scar.severity
                  }))}>
                    <CartesianGrid strokeDasharray=\"3 3\" stroke=\"#374151\" />
                    <XAxis dataKey=\"id\" stroke=\"#9ca3af\" />
                    <YAxis stroke=\"#9ca3af\" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey=\"healing\" fill=\"#3b82f6\" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Debug Panel */}
      {debugMode && (
        <div className=\"fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg border border-gray-700 max-w-sm\">
          <h4 className=\"font-semibold mb-2\">Debug Info</h4>
          <div className=\"text-xs text-gray-400 space-y-1\">
            <div>Alien Terms: {alienTerms.length}</div>
            <div>Scars: {scars.length}</div>
            <div>Events: {recentEvents.length}</div>
            <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
            <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlienCalculusVisualization;
export { useAlienCalculusWebSocket, AlienCalculus3DScene, TransseriesChart, AlienEventsTimeline };
export type { AlienTerm, Scar, ConceptSeries, AlienCalculusEvent, VisualizationProps };`
}