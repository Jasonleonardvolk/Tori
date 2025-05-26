import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Button, Divider, Chip, Grid } from '@mui/material';
import { mcp } from '../../lib/mcpClient';

/**
 * DreamDiary component displays the results of memory consolidation
 * Showing the "dreams" (consolidation events) from the TORI memory system
 */
const DreamDiary = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consolidations, setConsolidations] = useState([]);
  const [selectedDream, setSelectedDream] = useState(null);
  const [modes, setModes] = useState([]);

  // Fetch consolidation history on component mount
  useEffect(() => {
    fetchConsolidations();
  }, []);

  // Fetch spectral modes when a dream is selected
  useEffect(() => {
    if (selectedDream) {
      fetchModes(selectedDream.id);
    }
  }, [selectedDream]);

  // Fetch consolidation history
  const fetchConsolidations = async () => {
    setLoading(true);
    try {
      // Get consolidation summary from the sleep scheduler
      const response = await fetch('/api/sleep/summary');
      const data = await response.json();
      
      if (data.consolidations) {
        setConsolidations(data.consolidations);
        
        // Auto-select the most recent consolidation
        if (data.consolidations.length > 0) {
          setSelectedDream(data.consolidations[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching consolidation history:', err);
      setError('Failed to load consolidation history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch spectral modes associated with a consolidation
  const fetchModes = async (consolidationId) => {
    try {
      // Get spectral modes via MCP
      const response = await mcp('memory.kcl_status', { max_modes: 10 });
      
      if (response.success && response.modes) {
        setModes(response.modes);
      }
    } catch (err) {
      console.error('Error fetching spectral modes:', err);
    }
  };

  // Trigger a manual consolidation
  const triggerConsolidation = async () => {
    setLoading(true);
    try {
      await mcp('memory.sleep', { 
        once: true,
        max_episodes: 100,
        wait_for_completion: true
      });
      
      // Refresh the consolidation history
      await fetchConsolidations();
    } catch (err) {
      console.error('Error triggering consolidation:', err);
      setError('Failed to trigger consolidation. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading && consolidations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={fetchConsolidations} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dream Diary
        <Button 
          variant="contained" 
          onClick={triggerConsolidation} 
          disabled={loading}
          sx={{ ml: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Consolidate Now'}
        </Button>
      </Typography>
      
      <Typography variant="body1" paragraph>
        The Dream Diary shows memory consolidation events (dreams) from the TORI memory system.
        Each consolidation event processes episodes from the EpisodicVault and strengthens connections
        between related concepts.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Consolidation list */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>Recent Dreams</Typography>
          
          {consolidations.length === 0 ? (
            <Typography color="textSecondary">
              No consolidation events found. Trigger a consolidation to see results.
            </Typography>
          ) : (
            consolidations.map((consolidation) => (
              <Card 
                key={consolidation.id}
                sx={{ 
                  mb: 2, 
                  cursor: 'pointer',
                  bgcolor: selectedDream?.id === consolidation.id ? 'action.selected' : 'background.paper'
                }}
                onClick={() => setSelectedDream(consolidation)}
              >
                <CardContent>
                  <Typography variant="subtitle1">
                    {new Date(consolidation.timestamp).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Processed {consolidation.episodes_processed} episodes
                  </Typography>
                  <Typography variant="body2">
                    Energy change: ΔE={consolidation.energy_delta.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Grid>
        
        {/* Selected dream details */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>Dream Details</Typography>
          
          {selectedDream ? (
            <Card>
              <CardContent>
                <Typography variant="h6">
                  Consolidation on {new Date(selectedDream.timestamp).toLocaleString()}
                </Typography>
                
                <Box sx={{ my: 2 }}>
                  <Typography variant="subtitle1">
                    Performance Metrics:
                  </Typography>
                  <Typography variant="body2">
                    Energy before: {selectedDream.energy_before.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    Energy after: {selectedDream.energy_after.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    Energy change: ΔE={selectedDream.energy_delta.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    Episodes processed: {selectedDream.episodes_processed}
                  </Typography>
                  <Typography variant="body2">
                    Duration: {selectedDream.duration_seconds}s
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Associated Spectral Modes:
                </Typography>
                
                {modes.length > 0 ? (
                  <Box sx={{ mt: 1 }}>
                    {modes.map((mode) => (
                      <Box key={mode.mode_id} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">
                          Mode {mode.mode_id} 
                          <Chip 
                            label={`λ=${mode.eigenvalue_real.toFixed(2)}${mode.eigenvalue_imag !== 0 ? ' + ' + mode.eigenvalue_imag.toFixed(2) + 'j' : ''}`}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                          <Chip 
                            label={`Stability: ${mode.stability.toFixed(2)}`}
                            size="small"
                            color={mode.stability > 0.9 ? "success" : mode.stability > 0.7 ? "warning" : "error"}
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                        
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            Significant concepts: {mode.significant_concepts_count}
                          </Typography>
                          <Typography variant="body2">
                            Sparsity: {mode.sparsity.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography color="textSecondary">
                    No spectral modes found for this consolidation.
                  </Typography>
                )}
              </CardContent>
            </Card>
          ) : (
            <Typography color="textSecondary">
              Select a dream from the list to view details.
            </Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DreamDiary;
