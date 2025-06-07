/**
 * TORI Multimodal Integration UI - Real-time Visualization Component
 * 
 * This React TypeScript component provides a comprehensive interface for:
 * - Real-time multimodal data ingestion and processing
 * - Cross-modal concept alignment visualization
 * - Processing pipeline monitoring and statistics
 * - Interactive concept exploration and navigation
 * 
 * The component integrates with the Rust multimodal integration system via WebSocket
 * to provide live updates of the cognitive processing pipeline.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  LinearProgress,
  Chip,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  TextField,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
  VideoFile as VideoIcon,
  TextFields as TextIcon,
  Psychology as BrainIcon,
  Hub as NetworkIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon,
  Analytics as AnalyticsIcon,
  Memory as MemoryIcon,
  Transform as TransformIcon,
  Link as LinkIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

interface ExtractedConcept {
  concept_id?: number;
  name: string;
  confidence: number;
  modality: string;
  attributes: Record<string, any>;
  spatial_info?: SpatialInfo;
  temporal_info?: TemporalInfo;
  embeddings?: number[];
}

interface SpatialInfo {
  bounding_box?: BoundingBox;
  region_coordinates?: [number, number][];
  spatial_relationships: SpatialRelationship[];
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface SpatialRelationship {
  relation_type: string;
  target_concept: string;
  confidence: number;
}

interface TemporalInfo {
  start_time?: number;
  end_time?: number;
  duration?: number;
  temporal_relationships: TemporalRelationship[];
}

interface TemporalRelationship {
  relation_type: string;
  target_concept: string;
  confidence: number;
}

interface CrossModalAlignment {
  alignment_id: string;
  primary_concept: ExtractedConcept;
  aligned_concepts: ExtractedConcept[];
  alignment_confidence: number;
  alignment_type: 'SemanticEquivalence' | 'SpatialCorrespondence' | 'TemporalCorrespondence' | 'CausalRelationship' | 'ComplementaryInfo';
  evidence: AlignmentEvidence[];
}

interface AlignmentEvidence {
  evidence_type: string;
  confidence: number;
  details: Record<string, any>;
}

interface ProcessingSession {
  session_id: string;
  input_modalities: any[];
  extracted_concepts: ExtractedConcept[];
  alignments: CrossModalAlignment[];
  thread_id?: string;
  processing_start: number;
  processing_duration?: number;
  status: 'Queued' | 'Processing' | 'ConceptExtraction' | 'CrossModalAlignment' | 'CognitiveIntegration' | 'Completed' | 'Failed';
  metadata: Record<string, string>;
}

interface ProcessingResult {
  session_id: string;
  concept_ids: number[];
  thread_id?: string;
  alignments: CrossModalAlignment[];
  processing_duration: number;
  cognitive_insights: CognitiveInsight[];
}

interface CognitiveInsight {
  insight_type: 'CrossModalCorrelation' | 'NovelConceptEmergence' | 'ConceptualAnomalies' | 'PatternRecognition' | 'SemanticBridge';
  confidence: number;
  description: string;
  involved_concepts: number[];
  evidence: string[];
}

interface ProcessingStatistics {
  total_sessions_processed: number;
  total_concepts_extracted: number;
  total_alignments_created: number;
  average_processing_time: number;
  modality_breakdown: Record<string, number>;
  error_rate: number;
  throughput_per_second: number;
}

interface GraphNode {
  id: string;
  name: string;
  type: 'concept' | 'alignment' | 'insight';
  modality?: string;
  confidence?: number;
  x?: number;
  y?: number;
  val?: number;
  color?: string;
}

interface GraphLink {
  source: string;
  target: string;
  type: 'alignment' | 'relationship' | 'hierarchy';
  confidence?: number;
  width?: number;
  color?: string;
}

// ===================================================================
// MAIN COMPONENT
// ===================================================================

const MultimodalIntegrationUI: React.FC = () => {
  // State management
  const [activeSessions, setActiveSessions] = useState<ProcessingSession[]>([]);
  const [completedSessions, setCompletedSessions] = useState<ProcessingResult[]>([]);
  const [processingStats, setProcessingStats] = useState<ProcessingStatistics | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<ExtractedConcept | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [maxDisplayConcepts, setMaxDisplayConcepts] = useState(50);
  
  // Graph visualization state
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[], links: GraphLink[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  // WebSocket connection
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // File upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle');
  
  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:8080/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Connected to TORI Multimodal Integration');
        setIsConnected(true);
        
        // Request current state
        wsRef.current?.send(JSON.stringify({
          type: 'get_active_sessions'
        }));
        
        wsRef.current?.send(JSON.stringify({
          type: 'get_processing_stats'
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('Disconnected from TORI Multimodal Integration');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
    }
  }, []);
  
  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'session_created':
        setActiveSessions(prev => [...prev, message.session]);
        break;
        
      case 'session_updated':
        setActiveSessions(prev => 
          prev.map(session => 
            session.session_id === message.session.session_id 
              ? message.session 
              : session
          )
        );
        break;
        
      case 'session_completed':
        setActiveSessions(prev => 
          prev.filter(session => session.session_id !== message.result.session_id)
        );
        setCompletedSessions(prev => [...prev, message.result]);
        updateGraphData(message.result);
        break;
        
      case 'processing_stats':
        setProcessingStats(message.stats);
        break;
        
      case 'concept_added':
        if (realTimeMode) {
          updateGraphWithConcept(message.concept);
        }
        break;
        
      case 'alignment_created':
        if (realTimeMode) {
          updateGraphWithAlignment(message.alignment);
        }
        break;
        
      case 'cognitive_insight':
        showCognitiveInsight(message.insight);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }, [realTimeMode]);
  
  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);
  
  // File upload handling
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!isConnected) {
      alert('Please wait for connection to TORI system');
      return;
    }
    
    setIsProcessing(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    for (const file of acceptedFiles) {
      try {
        await processFile(file);
      } catch (error) {
        console.error('Error processing file:', error);
        setUploadStatus('error');
      }
    }
    
    setIsProcessing(false);
    setUploadStatus('complete');
  }, [isConnected]);
  
  // Process uploaded file
  const processFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify({
      filename: file.name,
      size: file.size,
      type: file.type,
      timestamp: Date.now(),
    }));
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const response = await fetch('/api/multimodal/process', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Processing result:', result);
      
      setUploadStatus('processing');
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      throw error;
    }
  };
  
  // Update graph data with completed session
  const updateGraphData = useCallback((result: ProcessingResult) => {
    const newNodes: GraphNode[] = [];
    const newLinks: GraphLink[] = [];
    
    // Add concept nodes
    result.concept_ids.forEach((conceptId, index) => {
      newNodes.push({
        id: `concept_${conceptId}`,
        name: `Concept ${conceptId}`,
        type: 'concept',
        confidence: 0.8 + Math.random() * 0.2,
        val: 5 + Math.random() * 10,
        color: getModalityColor('mixed'),
      });
    });
    
    // Add alignment nodes and links
    result.alignments.forEach((alignment, index) => {
      const alignmentId = `alignment_${alignment.alignment_id}`;
      newNodes.push({
        id: alignmentId,
        name: `Alignment (${alignment.alignment_type})`,
        type: 'alignment',
        confidence: alignment.alignment_confidence,
        val: 3 + alignment.alignment_confidence * 7,
        color: '#ff9800',
      });
      
      // Link alignment to primary concept
      newLinks.push({
        source: `concept_${alignment.primary_concept.concept_id || 0}`,
        target: alignmentId,
        type: 'alignment',
        confidence: alignment.alignment_confidence,
        width: 2 + alignment.alignment_confidence * 3,
        color: '#ff9800',
      });
      
      // Link alignment to aligned concepts
      alignment.aligned_concepts.forEach(concept => {
        newLinks.push({
          source: alignmentId,
          target: `concept_${concept.concept_id || 0}`,
          type: 'alignment',
          confidence: alignment.alignment_confidence,
          width: 1 + alignment.alignment_confidence * 2,
          color: '#ff9800',
        });
      });
    });
    
    // Add cognitive insight nodes
    result.cognitive_insights.forEach((insight, index) => {
      const insightId = `insight_${index}`;
      newNodes.push({
        id: insightId,
        name: insight.description,
        type: 'insight',
        confidence: insight.confidence,
        val: 8 + insight.confidence * 12,
        color: getInsightColor(insight.insight_type),
      });
      
      // Link insights to involved concepts
      insight.involved_concepts.forEach(conceptId => {
        newLinks.push({
          source: `concept_${conceptId}`,
          target: insightId,
          type: 'relationship',
          confidence: insight.confidence,
          width: 2 + insight.confidence * 3,
          color: getInsightColor(insight.insight_type),
        });
      });
    });
    
    setGraphData(prevData => ({
      nodes: [...prevData.nodes, ...newNodes].slice(-maxDisplayConcepts),
      links: [...prevData.links, ...newLinks].slice(-maxDisplayConcepts * 2),
    }));
  }, [maxDisplayConcepts]);
  
  // Update graph with individual concept
  const updateGraphWithConcept = useCallback((concept: ExtractedConcept) => {
    const newNode: GraphNode = {
      id: `concept_${concept.concept_id || Date.now()}`,
      name: concept.name,
      type: 'concept',
      modality: concept.modality,
      confidence: concept.confidence,
      val: 5 + concept.confidence * 10,
      color: getModalityColor(concept.modality),
    };
    
    setGraphData(prevData => ({
      nodes: [...prevData.nodes, newNode].slice(-maxDisplayConcepts),
      links: prevData.links,
    }));
  }, [maxDisplayConcepts]);
  
  // Update graph with alignment
  const updateGraphWithAlignment = useCallback((alignment: CrossModalAlignment) => {
    const alignmentNode: GraphNode = {
      id: `alignment_${alignment.alignment_id}`,
      name: `${alignment.alignment_type} Alignment`,
      type: 'alignment',
      confidence: alignment.alignment_confidence,
      val: 3 + alignment.alignment_confidence * 7,
      color: '#ff9800',
    };
    
    const newLinks: GraphLink[] = [];
    
    // Link to primary concept
    if (alignment.primary_concept.concept_id) {
      newLinks.push({
        source: `concept_${alignment.primary_concept.concept_id}`,
        target: alignmentNode.id,
        type: 'alignment',
        confidence: alignment.alignment_confidence,
        width: 2,
        color: '#ff9800',
      });
    }
    
    // Link to aligned concepts
    alignment.aligned_concepts.forEach(concept => {
      if (concept.concept_id) {
        newLinks.push({
          source: alignmentNode.id,
          target: `concept_${concept.concept_id}`,
          type: 'alignment',
          confidence: alignment.alignment_confidence,
          width: 1,
          color: '#ff9800',
        });
      }
    });
    
    setGraphData(prevData => ({
      nodes: [...prevData.nodes, alignmentNode],
      links: [...prevData.links, ...newLinks],
    }));
  }, []);
  
  // Show cognitive insight notification
  const showCognitiveInsight = useCallback((insight: CognitiveInsight) => {
    console.log('New cognitive insight:', insight);
  }, []);
  
  // Helper functions
  const getModalityColor = (modality: string): string => {
    switch (modality) {
      case 'text': return '#2196f3';
      case 'image': return '#4caf50';
      case 'audio': return '#ff9800';
      case 'video': return '#9c27b0';
      case 'mixed': return '#607d8b';
      default: return '#757575';
    }
  };
  
  const getInsightColor = (insightType: string): string => {
    switch (insightType) {
      case 'CrossModalCorrelation': return '#e91e63';
      case 'NovelConceptEmergence': return '#ff5722';
      case 'ConceptualAnomalies': return '#f44336';
      case 'PatternRecognition': return '#673ab7';
      case 'SemanticBridge': return '#3f51b5';
      default: return '#795548';
    }
  };
  
  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'Queued': return 'default';
      case 'Processing': return 'info';
      case 'ConceptExtraction': return 'primary';
      case 'CrossModalAlignment': return 'secondary';
      case 'CognitiveIntegration': return 'warning';
      case 'Completed': return 'success';
      case 'Failed': return 'error';
      default: return 'default';
    }
  };
  
  // Render methods
  const renderUploadArea = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            transition: 'all 0.3s ease',
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Upload Multimodal Data
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Upload images, audio, video, or text files for cognitive processing
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Supported: PNG, JPG, MP3, WAV, MP4, AVI, TXT, MD (max 100MB)
          </Typography>
          
          {uploadStatus !== 'idle' && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ mb: 1 }}
              />
              <Typography variant="caption">
                {uploadStatus === 'uploading' && `Uploading... ${uploadProgress}%`}
                {uploadStatus === 'processing' && 'Processing through cognitive pipeline...'}
                {uploadStatus === 'complete' && 'Processing complete!'}
                {uploadStatus === 'error' && 'Upload failed. Please try again.'}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
  
  const renderProcessingSessions = () => (
    <Grid container spacing={3}>
      {/* Active Sessions */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Active Processing Sessions
            </Typography>
            {activeSessions.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No active sessions
              </Typography>
            ) : (
              <List>
                {activeSessions.map((session) => (
                  <ListItem key={session.session_id}>
                    <ListItemIcon>
                      <BrainIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Session ${session.session_id.slice(0, 8)}...`}
                      secondary={
                        <Box>
                          <Chip 
                            label={session.status} 
                            size="small" 
                            color={getStatusColor(session.status)}
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="caption">
                            {session.extracted_concepts.length} concepts, {session.alignments.length} alignments
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      {/* Recent Completed Sessions */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Completed Sessions
            </Typography>
            {completedSessions.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No completed sessions
              </Typography>
            ) : (
              <List>
                {completedSessions.slice(-5).map((result) => (
                  <ListItem key={result.session_id}>
                    <ListItemIcon>
                      <MemoryIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Session ${result.session_id.slice(0, 8)}...`}
                      secondary={
                        <Box>
                          <Typography variant="caption" component="div">
                            {result.concept_ids.length} concepts, {result.alignments.length} alignments
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Processing time: {(result.processing_duration / 1000).toFixed(2)}s
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
  
  const renderStatistics = () => (
    <Grid container spacing={3}>
      {processingStats && (
        <>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {processingStats.total_sessions_processed}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Sessions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="success.main">
                  {processingStats.total_concepts_extracted}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Concepts Extracted
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="warning.main">
                  {processingStats.total_alignments_created}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Cross-Modal Alignments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="info.main">
                  {(processingStats.average_processing_time / 1000).toFixed(2)}s
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Avg Processing Time
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  );
  
  const renderConceptGraph = () => (
    <Card sx={{ height: 600 }}>
      <CardContent sx={{ height: '100%', p: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">
            Cognitive Concept Network
          </Typography>
          <Box>
            <Tooltip title="Real-time updates">
              <FormControlLabel
                control={
                  <Switch
                    checked={realTimeMode}
                    onChange={(e) => setRealTimeMode(e.target.checked)}
                    size="small"
                  />
                }
                label="Live"
              />
            </Tooltip>
            <IconButton onClick={() => setShowSettings(true)} size="small">
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Box sx={{ height: 'calc(100% - 40px)', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          {graphData.nodes.length > 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'text.secondary'
            }}>
              <Typography>Graph visualization would be rendered here</Typography>
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'text.secondary'
            }}>
              <NetworkIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                No concepts to display
              </Typography>
              <Typography variant="body2">
                Upload some data to see the cognitive network in action
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
  
  // Main render
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          TORI Multimodal Integration
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={isConnected ? <LinkIcon /> : <WarningIcon />}
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              wsRef.current?.send(JSON.stringify({ type: 'get_processing_stats' }));
            }}
            disabled={!isConnected}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {/* Connection Alert */}
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Not connected to TORI system. Attempting to reconnect...
        </Alert>
      )}
      
      {/* Upload Area */}
      {renderUploadArea()}
      
      {/* Main Content */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab label="Processing" icon={<TransformIcon />} />
          <Tab label="Statistics" icon={<AnalyticsIcon />} />
          <Tab label="Network" icon={<NetworkIcon />} />
        </Tabs>
      </Box>
      
      {/* Tab Content */}
      {selectedTab === 0 && renderProcessingSessions()}
      {selectedTab === 1 && renderStatistics()}
      {selectedTab === 2 && renderConceptGraph()}
    </Box>
  );
};

export default MultimodalIntegrationUI;