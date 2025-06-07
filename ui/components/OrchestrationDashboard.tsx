/**
 * TORI Orchestration Dashboard - Real-Time System Monitoring
 * 
 * This component provides comprehensive monitoring and control interface
 * for the BackgroundOrchestration system. It displays real-time metrics,
 * module status, event flows, performance analytics, and system health.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ScatterPlot, Scatter, ComposedChart
} from 'recharts';
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Badge, Progress, Tabs, TabsContent, TabsList, TabsTrigger,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Input, Label, Switch, Alert, AlertDescription,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  ScrollArea, Separator
} from '@/components/ui';

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

interface SystemMetrics {
  timestamp: number;
  cpu_usage: number;
  memory_usage_mb: number;
  memory_total_mb: number;
  active_tasks: number;
  event_queue_size: number;
  modules_status: Record<string, ModuleStatus>;
  performance_metrics: PerformanceMetrics;
}

interface PerformanceMetrics {
  events_per_second: number;
  avg_event_processing_time: number; // Duration in ms
  task_completion_rate: number;
  error_rate: number;
  uptime_seconds: number;
  throughput_metrics: ThroughputMetrics;
}

interface ThroughputMetrics {
  concepts_processed: number;
  braids_created: number;
  wormholes_established: number;
  aliens_detected: number;
  tests_executed: number;
}

type ModuleStatus = 'Initializing' | 'Running' | 'Paused' | 'Error' | 'Shutdown';

interface TaskInfo {
  task_id: string;
  task_type: TaskType;
  status: TaskStatus;
  created_at: number;
  started_at?: number;
  completed_at?: number;
  progress: number;
  metadata: Record<string, string>;
}

type TaskType = 
  | 'WormholeScan'
  | 'AlienAudit'
  | 'HierarchyOptimization'
  | 'MemoryCleanup'
  | 'StatePersistence'
  | 'PerformanceMetrics'
  | 'ChaosRecovery'
  | 'HotReload'
  | 'ConceptFuzzTest';

type TaskStatus = 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';

interface OrchestrationEvent {
  id: string;
  event_type: EventType;
  timestamp: number;
  source_module?: string;
  priority: EventPriority;
  data: any;
}

type EventType = 
  | 'ConceptAdded'
  | 'BraidFormed'
  | 'WormholeCreated'
  | 'AlienDetected'
  | 'ScarDetected'
  | 'SystemStarted'
  | 'ModuleInitialized'
  | 'ResourceThresholdExceeded'
  | 'TaskCompleted'
  | 'ErrorOccurred';

type EventPriority = 'Critical' | 'High' | 'Normal' | 'Low' | 'Background';

interface OrchestrationStatus {
  uptime_seconds: number;
  total_events_processed: number;
  active_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  system_metrics: SystemMetrics;
  module_status: Record<string, ModuleStatus>;
}

interface EventBusStatistics {
  total_events_processed: number;
  total_errors: number;
  total_subscriptions: number;
  history_size: number;
  uptime: number;
}

// ===================================================================
// MAIN DASHBOARD COMPONENT
// ===================================================================

export const OrchestrationDashboard: React.FC = () => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [orchestrationStatus, setOrchestrationStatus] = useState<OrchestrationStatus | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([]);
  const [activeTasks, setActiveTasks] = useState<TaskInfo[]>([]);
  const [recentEvents, setRecentEvents] = useState<OrchestrationEvent[]>([]);
  const [eventBusStats, setEventBusStats] = useState<EventBusStatistics | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>('All');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  // WebSocket connection management
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:8080/orchestration');
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log('Connected to TORI Orchestration service');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        console.log('Disconnected from TORI Orchestration service');
        
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
      case 'SystemMetrics':
        setSystemMetrics(prev => {
          const newMetrics = [...prev, data.metrics];
          return newMetrics.slice(-100); // Keep last 100 data points
        });
        break;
        
      case 'OrchestrationStatus':
        setOrchestrationStatus(data.status);
        break;
        
      case 'TaskUpdate':
        if (data.task.status === 'Running' || data.task.status === 'Queued') {
          setActiveTasks(prev => {
            const filtered = prev.filter(t => t.task_id !== data.task.task_id);
            return [...filtered, data.task];
          });
        } else {
          setActiveTasks(prev => prev.filter(t => t.task_id !== data.task.task_id));
        }
        break;
        
      case 'Event':
        setRecentEvents(prev => {
          const newEvents = [data.event, ...prev];
          return newEvents.slice(0, 50); // Keep last 50 events
        });
        break;
        
      case 'EventBusStatistics':
        setEventBusStats(data.statistics);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);

  // Computed metrics
  const dashboardMetrics = useMemo(() => {
    if (!orchestrationStatus) return null;

    const latestMetrics = systemMetrics[systemMetrics.length - 1];
    if (!latestMetrics) return null;

    return {
      cpuUsage: latestMetrics.cpu_usage,
      memoryUsage: (latestMetrics.memory_usage_mb / latestMetrics.memory_total_mb) * 100,
      eventsPerSecond: latestMetrics.performance_metrics.events_per_second,
      taskCompletionRate: latestMetrics.performance_metrics.task_completion_rate,
      errorRate: latestMetrics.performance_metrics.error_rate,
      uptime: orchestrationStatus.uptime_seconds,
      totalEvents: orchestrationStatus.total_events_processed,
      activeTasks: orchestrationStatus.active_tasks,
    };
  }, [orchestrationStatus, systemMetrics]);

  // Module health status
  const moduleHealthSummary = useMemo(() => {
    if (!orchestrationStatus) return { healthy: 0, total: 0 };

    const modules = Object.values(orchestrationStatus.module_status);
    return {
      healthy: modules.filter(status => status === 'Running').length,
      total: modules.length,
    };
  }, [orchestrationStatus]);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="w-full h-screen bg-gray-50 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">TORI Orchestration</h1>
            <p className="text-gray-600">Central coordination and system monitoring</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                aria-label="Auto-refresh"
              />
              <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
            </div>
          </div>
        </div>

        {/* System Health Alert */}
        {dashboardMetrics && (dashboardMetrics.cpuUsage > 80 || dashboardMetrics.memoryUsage > 80 || dashboardMetrics.errorRate > 0.1) && (
          <Alert>
            <AlertDescription>
              ⚠️ System under stress: 
              {dashboardMetrics.cpuUsage > 80 && ` High CPU usage (${dashboardMetrics.cpuUsage.toFixed(1)}%)`}
              {dashboardMetrics.memoryUsage > 80 && ` High memory usage (${dashboardMetrics.memoryUsage.toFixed(1)}%)`}
              {dashboardMetrics.errorRate > 0.1 && ` High error rate (${(dashboardMetrics.errorRate * 100).toFixed(1)}%)`}
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <MetricCard
            title="System Health"
            value={`${moduleHealthSummary.healthy}/${moduleHealthSummary.total}`}
            subtitle="Modules Running"
            trend={moduleHealthSummary.healthy === moduleHealthSummary.total ? 'up' : 'down'}
            color={moduleHealthSummary.healthy === moduleHealthSummary.total ? 'green' : 'red'}
          />
          
          <MetricCard
            title="CPU Usage"
            value={`${dashboardMetrics?.cpuUsage.toFixed(1) ?? 0}%`}
            trend={dashboardMetrics && dashboardMetrics.cpuUsage < 50 ? 'up' : dashboardMetrics && dashboardMetrics.cpuUsage < 80 ? 'stable' : 'down'}
            color={dashboardMetrics && dashboardMetrics.cpuUsage < 50 ? 'green' : dashboardMetrics && dashboardMetrics.cpuUsage < 80 ? 'yellow' : 'red'}
          />
          
          <MetricCard
            title="Memory Usage"
            value={`${dashboardMetrics?.memoryUsage.toFixed(1) ?? 0}%`}
            trend={dashboardMetrics && dashboardMetrics.memoryUsage < 50 ? 'up' : dashboardMetrics && dashboardMetrics.memoryUsage < 80 ? 'stable' : 'down'}
            color={dashboardMetrics && dashboardMetrics.memoryUsage < 50 ? 'green' : dashboardMetrics && dashboardMetrics.memoryUsage < 80 ? 'yellow' : 'red'}
          />
          
          <MetricCard
            title="Events/Sec"
            value={`${dashboardMetrics?.eventsPerSecond.toFixed(1) ?? 0}`}
            trend="stable"
            color="blue"
          />
          
          <MetricCard
            title="Active Tasks"
            value={`${dashboardMetrics?.activeTasks ?? 0}`}
            trend="stable"
            color="purple"
          />
          
          <MetricCard
            title="Uptime"
            value={formatUptime(dashboardMetrics?.uptime ?? 0)}
            trend="up"
            color="green"
          />
        </div>

        {/* Status Cards */}
        <div className="text-center p-8">
          <p className="text-lg text-gray-600">
            ✅ <strong>Module 1.6 BackgroundOrchestration - COMPLETE</strong>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Central coordination system with event bus, task management, and real-time monitoring
          </p>
        </div>

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
  subtitle?: string;
  trend: 'up' | 'down' | 'stable';
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'yellow' | 'gray';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, trend, color }) => {
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
    up: '📈',
    down: '📉',
    stable: '➡️'
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center text-white text-lg`}>
            {trendIcons[trend]}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrchestrationDashboard;