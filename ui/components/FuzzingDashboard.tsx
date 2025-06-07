/**
 * TORI ConceptFuzzing Dashboard - TypeScript/React Implementation
 * 
 * This component provides real-time visualization and control interface
 * for the ConceptFuzzing system. It displays fuzzing progress, coverage
 * metrics, test results, and performance analytics.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  ScatterPlot, Scatter, AreaChart, Area, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Badge, Progress, Tabs, TabsContent, TabsList, TabsTrigger,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Input, Label, Switch, Alert, AlertDescription,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui';

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

interface FuzzTest {
  test_id: string;
  session_id: string;
  test_type: 'PropertyBased' | 'Load' | 'Chaos' | 'Integration' | 'Regression' | 'Boundary';
  target_module: 'MultiScaleHierarchy' | 'BraidMemory' | 'WormholeEngine' | 'AlienCalculus' | 'BackgroundOrchestration' | 'AllModules';
  status: 'Pending' | 'Running' | 'Passed' | 'Failed' | 'Timeout' | 'Error';
  execution_time: number;
  created_at: number;
  tags: string[];
}

interface FuzzResult {
  test_id: string;
  session_id: string;
  status: 'Passed' | 'Failed' | 'Timeout' | 'Error';
  execution_time: number;
  resource_usage: {
    peak_memory_mb: number;
    cpu_time_ms: number;
    thread_count: number;
  };
  assertions: AssertionResult[];
  coverage_data: CoverageData;
  performance_metrics: PerformanceMetrics;
  error_details?: ErrorDetails;
  completed_at: number;
}

interface AssertionResult {
  assertion_name: string;
  passed: boolean;
  actual_value: any;
  expected_value: any;
  tolerance?: number;
  message: string;
}

interface CoverageData {
  lines_covered: number;
  lines_total: number;
  functions_covered: number;
  functions_total: number;
  branches_covered: number;
  branches_total: number;
  modules_touched: string[];
  uncovered_paths: string[];
}

interface PerformanceMetrics {
  operations_per_second: number;
  latency_percentiles: Record<string, number>;
  memory_allocations: number;
  cache_hit_rate: number;
  error_rate: number;
  throughput_mb_s: number;
}

interface ErrorDetails {
  error_type: string;
  error_message: string;
  stack_trace: string[];
  module_state: Record<string, any>;
}

interface SessionSummary {
  total_tests: number;
  passed: number;
  failed: number;
  error: number;
  timeout: number;
  total_duration: number;
  coverage_achieved: number;
  performance_baseline: Record<string, number>;
  issues_found: string[];
}

interface FuzzingEvent {
  type: 'TestStarted' | 'TestCompleted' | 'ChaosInjected' | 'PerformanceAlert' | 'CoverageUpdate';
  timestamp: number;
  data: any;
}

// ===================================================================
// MAIN DASHBOARD COMPONENT
// ===================================================================

export const FuzzingDashboard: React.FC = () => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [activeTests, setActiveTests] = useState<FuzzTest[]>([]);
  const [testResults, setTestResults] = useState<FuzzResult[]>([]);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [coverageData, setCoverageData] = useState<CoverageData | null>(null);
  const [events, setEvents] = useState<FuzzingEvent[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('AllModules');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  // WebSocket connection management
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:8080/fuzzing');
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log('Connected to TORI ConceptFuzzing service');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        console.log('Disconnected from TORI ConceptFuzzing service');
        
        // Attempt to reconnect after 5 seconds
        if (autoRefresh) {
          setTimeout(connectWebSocket, 5000);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      setWebsocket(ws);
    };

    connectWebSocket();
    
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [autoRefresh]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'TestStarted':
        setActiveTests(prev => [...prev, data.test]);
        break;
        
      case 'TestCompleted':
        setActiveTests(prev => prev.filter(t => t.test_id !== data.test_id));
        setTestResults(prev => [...prev, data.result]);
        break;
        
      case 'SessionSummary':
        setSessionSummary(data.summary);
        break;
        
      case 'CoverageUpdate':
        setCoverageData(data.coverage);
        break;
        
      case 'FuzzingEvent':
        setEvents(prev => [data.event, ...prev.slice(0, 99)]); // Keep last 100 events
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);

  // Computed metrics
  const metrics = useMemo(() => {
    if (!testResults.length) return null;
    
    const recentResults = testResults.slice(-50); // Last 50 tests
    const passRate = recentResults.filter(r => r.status === 'Passed').length / recentResults.length;
    const avgExecutionTime = recentResults.reduce((sum, r) => sum + r.execution_time, 0) / recentResults.length;
    const avgMemoryUsage = recentResults.reduce((sum, r) => sum + r.resource_usage.peak_memory_mb, 0) / recentResults.length;
    
    return {
      passRate: passRate * 100,
      avgExecutionTime,
      avgMemoryUsage,
      totalTests: testResults.length,
      activeCount: activeTests.length
    };
  }, [testResults, activeTests]);

  // Manual test triggering
  const triggerTest = async (testType: string, targetModule: string) => {
    try {
      const response = await fetch('/api/fuzzing/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType, targetModule })
      });
      
      if (!response.ok) {
        throw new Error('Failed to trigger test');
      }
      
      console.log(`Triggered ${testType} test for ${targetModule}`);
    } catch (error) {
      console.error('Error triggering test:', error);
    }
  };

  // Coverage percentage calculation
  const coveragePercentage = useMemo(() => {
    if (!coverageData) return 0;
    const { lines_covered, lines_total } = coverageData;
    return lines_total > 0 ? (lines_covered / lines_total) * 100 : 0;
  }, [coverageData]);

  return (
    <div className="w-full h-screen bg-gray-50 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">TORI ConceptFuzzing</h1>
            <p className="text-gray-600">Automated cognitive system testing and validation</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              aria-label="Auto-refresh"
            />
            <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Pass Rate"
            value={`${metrics?.passRate.toFixed(1) ?? 0}%`}
            trend={metrics ? (metrics.passRate > 90 ? 'up' : metrics.passRate > 70 ? 'stable' : 'down') : 'stable'}
            color={metrics ? (metrics.passRate > 90 ? 'green' : metrics.passRate > 70 ? 'yellow' : 'red') : 'gray'}
          />
          
          <MetricCard
            title="Active Tests"
            value={`${metrics?.activeCount ?? 0}`}
            trend="stable"
            color="blue"
          />
          
          <MetricCard
            title="Total Tests"
            value={`${metrics?.totalTests ?? 0}`}
            trend="up"
            color="purple"
          />
          
          <MetricCard
            title="Avg Exec Time"
            value={`${metrics?.avgExecutionTime.toFixed(0) ?? 0}ms`}
            trend={metrics ? (metrics.avgExecutionTime < 100 ? 'up' : 'down') : 'stable'}
            color="orange"
          />
          
          <MetricCard
            title="Coverage"
            value={`${coveragePercentage.toFixed(1)}%`}
            trend={coveragePercentage > 80 ? 'up' : 'stable'}
            color={coveragePercentage > 80 ? 'green' : 'yellow'}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tests">Active Tests</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Test Results Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Results Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <TestResultsChart results={testResults} />
                </CardContent>
              </Card>

              {/* Module Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Distribution by Module</CardTitle>
                </CardHeader>
                <CardContent>
                  <ModuleDistributionChart results={testResults} />
                </CardContent>
              </Card>

              {/* Recent Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <EventsList events={events.slice(0, 10)} />
                </CardContent>
              </Card>

              {/* Session Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {sessionSummary ? (
                    <SessionSummaryDisplay summary={sessionSummary} />
                  ) : (
                    <p className="text-gray-500">No session data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Active Tests Tab */}
          <TabsContent value="tests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Tests ({activeTests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ActiveTestsTable tests={activeTests} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Test Results</h3>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AllModules">All Modules</SelectItem>
                  <SelectItem value="MultiScaleHierarchy">Hierarchy</SelectItem>
                  <SelectItem value="BraidMemory">Memory</SelectItem>
                  <SelectItem value="WormholeEngine">Wormhole</SelectItem>
                  <SelectItem value="AlienCalculus">Alien</SelectItem>
                  <SelectItem value="BackgroundOrchestration">Orchestration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Card>
              <CardContent>
                <TestResultsTable 
                  results={testResults.filter(r => 
                    selectedModule === 'AllModules' || 
                    r.test_id.includes(selectedModule)
                  )} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coverage Tab */}
          <TabsContent value="coverage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Coverage Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <CoverageOverview coverage={coverageData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Module Coverage</CardTitle>
                </CardHeader>
                <CardContent>
                  <ModuleCoverageChart coverage={coverageData} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Execution Time Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExecutionTimeChart results={testResults} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <MemoryUsageChart results={testResults} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <PerformanceRadarChart results={testResults} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Error Rate Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ErrorRateChart results={testResults} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Manual Test Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Manual Test Execution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ManualTestControls onTriggerTest={triggerTest} />
                </CardContent>
              </Card>

              {/* Chaos Engineering Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Chaos Engineering</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChaosControls />
                </CardContent>
              </Card>

              {/* Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Fuzzing Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <FuzzingConfiguration />
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <SystemStatus isConnected={isConnected} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// ===================================================================
// UTILITY COMPONENTS
// ===================================================================

interface MetricCardProps {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'yellow' | 'gray';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, color }) => {
  const colorClasses = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-500'
  };

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    stable: '➡️'
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center text-white`}>
            {trendIcons[trend]}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ===================================================================
// CHART COMPONENTS
// ===================================================================

const TestResultsChart: React.FC<{ results: FuzzResult[] }> = ({ results }) => {
  const chartData = useMemo(() => {
    const last24Hours = results.slice(-24);
    return last24Hours.map((result, index) => ({
      test: index + 1,
      passed: result.status === 'Passed' ? 1 : 0,
      failed: result.status === 'Failed' ? 1 : 0,
      error: result.status === 'Error' ? 1 : 0,
      execution_time: result.execution_time
    }));
  }, [results]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="test" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="passed" stackId="1" stroke="#10B981" fill="#10B981" />
        <Area type="monotone" dataKey="failed" stackId="1" stroke="#EF4444" fill="#EF4444" />
        <Area type="monotone" dataKey="error" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const ModuleDistributionChart: React.FC<{ results: FuzzResult[] }> = ({ results }) => {
  const data = useMemo(() => {
    const modules = ['MultiScaleHierarchy', 'BraidMemory', 'WormholeEngine', 'AlienCalculus', 'BackgroundOrchestration'];
    return modules.map(module => ({
      name: module.replace(/([A-Z])/g, ' $1').trim(),
      value: results.filter(r => r.test_id.includes(module)).length,
      color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#e91e63'][modules.indexOf(module)]
    }));
  }, [results]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          label={({ name, value }) => `${name}: ${value}`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

const ExecutionTimeChart: React.FC<{ results: FuzzResult[] }> = ({ results }) => {
  const data = useMemo(() => {
    return results.slice(-20).map((result, index) => ({
      test: index + 1,
      execution_time: result.execution_time,
      memory_mb: result.resource_usage.peak_memory_mb
    }));
  }, [results]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="test" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Line 
          yAxisId="left" 
          type="monotone" 
          dataKey="execution_time" 
          stroke="#8884d8" 
          name="Execution Time (ms)"
        />
        <Line 
          yAxisId="right" 
          type="monotone" 
          dataKey="memory_mb" 
          stroke="#82ca9d" 
          name="Memory (MB)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const MemoryUsageChart: React.FC<{ results: FuzzResult[] }> = ({ results }) => {
  const data = useMemo(() => {
    const buckets = [0, 50, 100, 200, 500, 1000, 2000];
    return buckets.map((bucket, index) => {
      const nextBucket = buckets[index + 1] || Infinity;
      const count = results.filter(r => 
        r.resource_usage.peak_memory_mb >= bucket && 
        r.resource_usage.peak_memory_mb < nextBucket
      ).length;
      
      return {
        range: `${bucket}-${nextBucket === Infinity ? '+' : nextBucket}MB`,
        count
      };
    });
  }, [results]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="range" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const PerformanceRadarChart: React.FC<{ results: FuzzResult[] }> = ({ results }) => {
  const data = useMemo(() => {
    if (!results.length) return [];
    
    const avgMetrics = results.reduce((acc, result) => {
      const metrics = result.performance_metrics;
      acc.ops_per_sec += metrics.operations_per_second;
      acc.cache_hit_rate += metrics.cache_hit_rate;
      acc.error_rate += (1 - metrics.error_rate); // Invert for radar
      acc.throughput += metrics.throughput_mb_s;
      return acc;
    }, { ops_per_sec: 0, cache_hit_rate: 0, error_rate: 0, throughput: 0 });
    
    const count = results.length;
    return [
      {
        metric: 'Ops/Sec',
        value: (avgMetrics.ops_per_sec / count) / 1000, // Normalize
        fullMark: 1
      },
      {
        metric: 'Cache Hit Rate',
        value: (avgMetrics.cache_hit_rate / count) * 100,
        fullMark: 100
      },
      {
        metric: 'Reliability',
        value: (avgMetrics.error_rate / count) * 100,
        fullMark: 100
      },
      {
        metric: 'Throughput',
        value: (avgMetrics.throughput / count) * 10, // Normalize
        fullMark: 10
      }
    ];
  }, [results]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar name="Performance" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

const ErrorRateChart: React.FC<{ results: FuzzResult[] }> = ({ results }) => {
  const data = useMemo(() => {
    const windowSize = 10;
    const windows = [];
    
    for (let i = windowSize; i <= results.length; i += windowSize) {
      const window = results.slice(i - windowSize, i);
      const errorRate = window.filter(r => r.status !== 'Passed').length / window.length;
      windows.push({
        window: Math.floor(i / windowSize),
        error_rate: errorRate * 100
      });
    }
    
    return windows;
  }, [results]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="window" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line type="monotone" dataKey="error_rate" stroke="#EF4444" name="Error Rate %" />
      </LineChart>
    </ResponsiveContainer>
  );
};

// ===================================================================
// TABLE COMPONENTS
// ===================================================================

const ActiveTestsTable: React.FC<{ tests: FuzzTest[] }> = ({ tests }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Test ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Module</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Started</TableHead>
          <TableHead>Duration</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tests.map(test => (
          <TableRow key={test.test_id}>
            <TableCell className="font-mono text-xs">
              {test.test_id.substring(0, 8)}...
            </TableCell>
            <TableCell>
              <Badge variant="outline">{test.test_type}</Badge>
            </TableCell>
            <TableCell>{test.target_module}</TableCell>
            <TableCell>
              <Badge variant={test.status === 'Running' ? 'default' : 'secondary'}>
                {test.status}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(test.created_at * 1000).toLocaleTimeString()}
            </TableCell>
            <TableCell>
              {Math.floor((Date.now() - test.created_at * 1000) / 1000)}s
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const TestResultsTable: React.FC<{ results: FuzzResult[] }> = ({ results }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Test ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Execution Time</TableHead>
          <TableHead>Memory (MB)</TableHead>
          <TableHead>Assertions</TableHead>
          <TableHead>Completed</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.slice(-20).reverse().map(result => (
          <TableRow key={result.test_id}>
            <TableCell className="font-mono text-xs">
              {result.test_id.substring(0, 8)}...
            </TableCell>
            <TableCell>
              <Badge variant={
                result.status === 'Passed' ? 'default' :
                result.status === 'Failed' ? 'destructive' : 'secondary'
              }>
                {result.status}
              </Badge>
            </TableCell>
            <TableCell>{result.execution_time}ms</TableCell>
            <TableCell>{result.resource_usage.peak_memory_mb.toFixed(1)}</TableCell>
            <TableCell>
              {result.assertions.filter(a => a.passed).length}/{result.assertions.length}
            </TableCell>
            <TableCell>
              {new Date(result.completed_at * 1000).toLocaleTimeString()}
            </TableCell>
            <TableCell>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Details</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Test Result Details</DialogTitle>
                  </DialogHeader>
                  <TestResultDetails result={result} />
                </DialogContent>
              </Dialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// ===================================================================
// DETAIL COMPONENTS
// ===================================================================

const TestResultDetails: React.FC<{ result: FuzzResult }> = ({ result }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold">Basic Info</h4>
          <p>Status: {result.status}</p>
          <p>Execution Time: {result.execution_time}ms</p>
          <p>Completed: {new Date(result.completed_at * 1000).toLocaleString()}</p>
        </div>
        <div>
          <h4 className="font-semibold">Resource Usage</h4>
          <p>Peak Memory: {result.resource_usage.peak_memory_mb.toFixed(1)} MB</p>
          <p>CPU Time: {result.resource_usage.cpu_time_ms}ms</p>
          <p>Threads: {result.resource_usage.thread_count}</p>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold">Assertions</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assertion</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.assertions.map((assertion, index) => (
              <TableRow key={index}>
                <TableCell>{assertion.assertion_name}</TableCell>
                <TableCell>
                  <Badge variant={assertion.passed ? 'default' : 'destructive'}>
                    {assertion.passed ? 'PASS' : 'FAIL'}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {JSON.stringify(assertion.expected_value)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {JSON.stringify(assertion.actual_value)}
                </TableCell>
                <TableCell>{assertion.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {result.error_details && (
        <div>
          <h4 className="font-semibold text-red-600">Error Details</h4>
          <Alert>
            <AlertDescription>
              <p><strong>Type:</strong> {result.error_details.error_type}</p>
              <p><strong>Message:</strong> {result.error_details.error_message}</p>
              {result.error_details.stack_trace.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Stack Trace</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                    {result.error_details.stack_trace.join('\n')}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

const CoverageOverview: React.FC<{ coverage: CoverageData | null }> = ({ coverage }) => {
  if (!coverage) return <p className="text-gray-500">No coverage data available</p>;

  const linesCoverage = (coverage.lines_covered / coverage.lines_total) * 100;
  const functionsCoverage = (coverage.functions_covered / coverage.functions_total) * 100;
  const branchesCoverage = (coverage.branches_covered / coverage.branches_total) * 100;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span>Lines</span>
          <span>{coverage.lines_covered}/{coverage.lines_total} ({linesCoverage.toFixed(1)}%)</span>
        </div>
        <Progress value={linesCoverage} className="h-2" />
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-2">
          <span>Functions</span>
          <span>{coverage.functions_covered}/{coverage.functions_total} ({functionsCoverage.toFixed(1)}%)</span>
        </div>
        <Progress value={functionsCoverage} className="h-2" />
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-2">
          <span>Branches</span>
          <span>{coverage.branches_covered}/{coverage.branches_total} ({branchesCoverage.toFixed(1)}%)</span>
        </div>
        <Progress value={branchesCoverage} className="h-2" />
      </div>
      
      <div>
        <h5 className="font-semibold">Modules Touched</h5>
        <div className="flex flex-wrap gap-2 mt-2">
          {coverage.modules_touched.map(module => (
            <Badge key={module} variant="outline">{module}</Badge>
          ))}
        </div>
      </div>
      
      {coverage.uncovered_paths.length > 0 && (
        <div>
          <h5 className="font-semibold">Uncovered Paths</h5>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
            {coverage.uncovered_paths.slice(0, 5).map((path, index) => (
              <li key={index}>{path}</li>
            ))}
            {coverage.uncovered_paths.length > 5 && (
              <li>... and {coverage.uncovered_paths.length - 5} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const ModuleCoverageChart: React.FC<{ coverage: CoverageData | null }> = ({ coverage }) => {
  if (!coverage) return <p className="text-gray-500">No coverage data available</p>;

  const data = coverage.modules_touched.map(module => ({
    module: module.replace(/([A-Z])/g, ' $1').trim(),
    coverage: Math.random() * 100 // Mock data - in reality would come from detailed coverage
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="module" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Bar dataKey="coverage" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const EventsList: React.FC<{ events: FuzzingEvent[] }> = ({ events }) => {
  return (
    <div className="space-y-2">
      {events.map((event, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div>
            <Badge variant="outline">{event.type}</Badge>
            <span className="ml-2 text-sm">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
      {events.length === 0 && (
        <p className="text-gray-500 text-center py-4">No recent events</p>
      )}
    </div>
  );
};

const SessionSummaryDisplay: React.FC<{ summary: SessionSummary }> = ({ summary }) => {
  const passRate = (summary.passed / summary.total_tests) * 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Total Tests</p>
          <p className="text-2xl font-bold">{summary.total_tests}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Pass Rate</p>
          <p className="text-2xl font-bold text-green-600">{passRate.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Duration</p>
          <p className="text-2xl font-bold">{Math.round(summary.total_duration)}s</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Coverage</p>
          <p className="text-2xl font-bold">{(summary.coverage_achieved * 100).toFixed(1)}%</p>
        </div>
      </div>
      
      <div>
        <h5 className="font-semibold">Test Breakdown</h5>
        <div className="grid grid-cols-4 gap-2 mt-2">
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{summary.passed}</p>
            <p className="text-xs text-gray-600">Passed</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-600">{summary.failed}</p>
            <p className="text-xs text-gray-600">Failed</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-yellow-600">{summary.error}</p>
            <p className="text-xs text-gray-600">Error</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-600">{summary.timeout}</p>
            <p className="text-xs text-gray-600">Timeout</p>
          </div>
        </div>
      </div>
      
      {summary.issues_found.length > 0 && (
        <div>
          <h5 className="font-semibold text-red-600">Issues Found</h5>
          <ul className="list-disc list-inside text-sm mt-2">
            {summary.issues_found.slice(0, 3).map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
            {summary.issues_found.length > 3 && (
              <li>... and {summary.issues_found.length - 3} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// ===================================================================
// CONTROL COMPONENTS
// ===================================================================

const ManualTestControls: React.FC<{ onTriggerTest: (type: string, module: string) => void }> = ({ onTriggerTest }) => {
  const [selectedTestType, setSelectedTestType] = useState('PropertyBased');
  const [selectedModule, setSelectedModule] = useState('AllModules');

  const testTypes = [
    'PropertyBased', 'Load', 'Chaos', 'Integration', 'Regression', 'Boundary'
  ];

  const modules = [
    'AllModules', 'MultiScaleHierarchy', 'BraidMemory', 
    'WormholeEngine', 'AlienCalculus', 'BackgroundOrchestration'
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="test-type">Test Type</Label>
        <Select value={selectedTestType} onValueChange={setSelectedTestType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {testTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="target-module">Target Module</Label>
        <Select value={selectedModule} onValueChange={setSelectedModule}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modules.map(module => (
              <SelectItem key={module} value={module}>{module}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        onClick={() => onTriggerTest(selectedTestType, selectedModule)}
        className="w-full"
      >
        Trigger Test
      </Button>
      
      <div className="grid grid-cols-2 gap-2">
        <Button 
          variant="outline" 
          onClick={() => onTriggerTest('PropertyBased', 'MultiScaleHierarchy')}
        >
          Quick Hierarchy Test
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onTriggerTest('Chaos', 'AllModules')}
        >
          Chaos Test
        </Button>
      </div>
    </div>
  );
};

const ChaosControls: React.FC = () => {
  const [chaosEnabled, setChaosEnabled] = useState(false);
  const [failureRate, setFailureRate] = useState(0.1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Enable Chaos Engineering</Label>
        <Switch checked={chaosEnabled} onCheckedChange={setChaosEnabled} />
      </div>
      
      <div>
        <Label>Failure Injection Rate</Label>
        <Input 
          type="range" 
          min={0} 
          max={1} 
          step={0.01}
          value={failureRate}
          onChange={(e) => setFailureRate(parseFloat(e.target.value))}
        />
        <p className="text-sm text-gray-600">{(failureRate * 100).toFixed(1)}%</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm">Random Delay</Button>
        <Button variant="outline" size="sm">Memory Pressure</Button>
        <Button variant="outline" size="sm">Network Partition</Button>
        <Button variant="outline" size="sm">Service Crash</Button>
      </div>
      
      {chaosEnabled && (
        <Alert>
          <AlertDescription>
            ⚠️ Chaos engineering is enabled. System may experience deliberate failures.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

const FuzzingConfiguration: React.FC = () => {
  const [maxConcurrentTests, setMaxConcurrentTests] = useState(10);
  const [defaultTimeout, setDefaultTimeout] = useState(300);

  return (
    <div className="space-y-4">
      <div>
        <Label>Max Concurrent Tests</Label>
        <Input 
          type="number" 
          value={maxConcurrentTests}
          onChange={(e) => setMaxConcurrentTests(parseInt(e.target.value))}
        />
      </div>
      
      <div>
        <Label>Default Timeout (seconds)</Label>
        <Input 
          type="number" 
          value={defaultTimeout}
          onChange={(e) => setDefaultTimeout(parseInt(e.target.value))}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <Label>Enable Coverage Tracking</Label>
        <Switch defaultChecked />
      </div>
      
      <div className="flex items-center justify-between">
        <Label>Performance Monitoring</Label>
        <Switch defaultChecked />
      </div>
      
      <Button className="w-full">Save Configuration</Button>
    </div>
  );
};

const SystemStatus: React.FC<{ isConnected: boolean }> = ({ isConnected }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span>Connection Status</span>
        <Badge variant={isConnected ? 'default' : 'destructive'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between">
        <span>Python Service</span>
        <Badge variant="default">Running</Badge>
      </div>
      
      <div className="flex items-center justify-between">
        <span>Rust Core</span>
        <Badge variant="default">Active</Badge>
      </div>
      
      <div className="flex items-center justify-between">
        <span>WebSocket</span>
        <Badge variant={isConnected ? 'default' : 'destructive'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>
      
      <Button variant="outline" className="w-full">
        Refresh Status
      </Button>
    </div>
  );
};

export default FuzzingDashboard;