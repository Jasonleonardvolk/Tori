import React, { useState, useEffect } from 'react';
import { useSSE } from '../hooks/useSSE';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  LinearProgress,
  Divider,
  Tooltip,
  Grid
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  Sync as SyncIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  BubbleChart as BubbleChartIcon
} from '@mui/icons-material';

// Types for system health data
interface SystemHealthData {
  sync_ratio: number;             // Phase synchronization ratio [0-1]
  stability_index: number;        // System stability [-1 to 1]
  max_delta_v: number;            // Maximum Lyapunov potential change
  unstable_modes: number;         // Count of unstable modes
  dominant_modes: string[];       // IDs of dominant modes
  timestamp: number;              // Timestamp of the data
  concept_count: number;          // Number of active concepts
  connection_count: number;       // Number of active connections
  performance: {
    step_time_ms: number;         // Time per engine step in ms
    spectral_time_ms: number;     // Time for spectral analysis in ms
  }
}

// Color utility functions
const getColorForSyncRatio = (ratio: number): string => {
  if (ratio > 0.9) return '#4caf50';  // Green
  if (ratio > 0.7) return '#ff9800';  // Orange
  return '#f44336';                   // Red
};

const getColorForStability = (index: number): string => {
  if (index > 0.5) return '#4caf50';  // Green (stable)
  if (index > 0) return '#8bc34a';    // Light green (slightly stable)
  if (index > -0.5) return '#ff9800'; // Orange (slightly unstable)
  return '#f44336';                   // Red (unstable)
};

const formatNumber = (num: number, precision: number = 2): string => {
  return num.toFixed(precision);
};

// Circular progress with label component
const CircularProgressWithLabel: React.FC<{
  value: number;
  color: string;
  size?: number;
  label: string;
  icon: React.ReactNode;
}> = ({ value, color, size = 80, label, icon }) => {
  return (
    <Box position="relative" display="inline-flex" flexDirection="column" alignItems="center">
      <Box position="relative" display="inline-flex">
        <CircularProgress
          variant="determinate"
          value={value * 100}
          size={size}
          thickness={5}
          sx={{ color }}
        />
        <Box
          position="absolute"
          top={0}
          left={0}
          bottom={0}
          right={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {icon}
        </Box>
      </Box>
      <Typography variant="caption" component="div" color="text.secondary" mt={1}>
        {label}: {formatNumber(value)}
      </Typography>
    </Box>
  );
};

// Primary component for the System Health Tile
const SystemHealthTile: React.FC<{
  systemId: string;
  width?: number;
  height?: number;
}> = ({ systemId, width = 350, height = 300 }) => {
  // Fetch data from server-sent events
  const { data: healthData } = useSSE<SystemHealthData>(`/api/v1/stream/health?sys=${systemId}`);
  
  // Fallback data for development/testing
  const fallbackData: SystemHealthData = {
    sync_ratio: 0.85,
    stability_index: 0.3,
    max_delta_v: 0.05,
    unstable_modes: 1,
    dominant_modes: ['concept1', 'concept2'],
    timestamp: Date.now(),
    concept_count: 250,
    connection_count: 1250,
    performance: {
      step_time_ms: 5.2,
      spectral_time_ms: 15.7
    }
  };
  
  // Use fallback data if no data is streamed
  const data = healthData || fallbackData;
  
  // Health status text
  const getSystemStatusText = (): string => {
    if (data.stability_index > 0.5 && data.sync_ratio > 0.9) 
      return 'Healthy';
    if (data.stability_index < 0 || data.sync_ratio < 0.7)
      return 'Unhealthy';
    return 'Warning';
  };
  
  // Health status icon
  const getSystemStatusIcon = () => {
    const status = getSystemStatusText();
    if (status === 'Healthy') return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
    if (status === 'Unhealthy') return <WarningIcon sx={{ color: '#f44336' }} />;
    return <WarningIcon sx={{ color: '#ff9800' }} />;
  };
  
  return (
    <Card sx={{ width, height, overflow: 'auto' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div">
            System Health
          </Typography>
          <Box display="flex" alignItems="center">
            {getSystemStatusIcon()}
            <Typography variant="body2" ml={1}>
              {getSystemStatusText()}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <CircularProgressWithLabel
              value={data.sync_ratio}
              color={getColorForSyncRatio(data.sync_ratio)}
              label="Sync"
              icon={<SyncIcon />}
            />
          </Grid>
          <Grid item>
            <CircularProgressWithLabel
              value={(data.stability_index + 1) / 2} // Convert from [-1,1] to [0,1]
              color={getColorForStability(data.stability_index)}
              label="Stability"
              icon={
                data.stability_index >= 0 
                  ? <TrendingUpIcon /> 
                  : <TrendingDownIcon />
              }
            />
          </Grid>
        </Grid>
        
        <Box mt={2}>
          <Tooltip title="Lower is better - Changes in Lyapunov potential">
            <Typography variant="body2" component="div">
              Max ΔV: {formatNumber(data.max_delta_v)}
            </Typography>
          </Tooltip>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(data.max_delta_v * 100, 100)}
            sx={{ 
              height: 8, 
              borderRadius: 5,
              bgcolor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                bgcolor: data.max_delta_v > 0.1 ? '#f44336' : '#4caf50',
              }
            }}
          />
        </Box>
        
        <Box mt={3}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Tooltip title="Active concepts in the system">
                <Typography variant="body2">
                  Concepts: {data.concept_count}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid item xs={6}>
              <Tooltip title="Active connections between concepts">
                <Typography variant="body2">
                  Connections: {data.connection_count}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid item xs={6}>
              <Tooltip title="Time to compute one step of the phase engine">
                <Typography variant="body2">
                  Step: {data.performance.step_time_ms.toFixed(1)} ms
                </Typography>
              </Tooltip>
            </Grid>
            <Grid item xs={6}>
              <Tooltip title="Time to perform spectral analysis">
                <Typography variant="body2">
                  Spectral: {data.performance.spectral_time_ms.toFixed(1)} ms
                </Typography>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>
        
        {data.unstable_modes > 0 && (
          <Box mt={2} p={1} bgcolor="#fff3e0" borderRadius={1}>
            <Typography variant="body2" color="warning.main">
              <WarningIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              {data.unstable_modes} unstable {data.unstable_modes === 1 ? 'mode' : 'modes'} detected
            </Typography>
          </Box>
        )}
        
        <Box mt={2} textAlign="right">
          <Typography variant="caption" color="text.secondary">
            Updated: {new Date(data.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SystemHealthTile;
