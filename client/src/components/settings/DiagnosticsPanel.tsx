import React, { useState, useEffect } from 'react';
import { Switch, FormGroup, FormControlLabel, Typography, Paper, Box } from '@mui/material';
import { useSettings, type SettingsContextType } from '../../contexts/SettingsContext';

/**
 * DiagnosticsPanel component for managing diagnostics settings
 * 
 * This panel allows users to enable/disable the diagnostic recorder
 * which captures the last 5 seconds of ψ-frames on crash
 */
export const DiagnosticsPanel: React.FC = () => {
  const { settings, updateSettings } = useSettings() as SettingsContextType;
  const [diagnosticsEnabled, setDiagnosticsEnabled] = useState<boolean>(
    settings.diagnosticsEnabled ?? false
  );

  // Update settings when toggle changes
  useEffect(() => {
    updateSettings({ diagnosticsEnabled });
  }, [diagnosticsEnabled, updateSettings]);

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Diagnostic Settings
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          The diagnostic recorder captures the last 5 seconds of activity when a crash occurs,
          helping developers identify and fix issues faster.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Diagnostic data is only saved locally and is not automatically transmitted unless you
          explicitly choose to share it.
        </Typography>
      </Box>

      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={diagnosticsEnabled}
              onChange={(e) => setDiagnosticsEnabled(e.target.checked)}
              color="primary"
            />
          }
          label="Enable diagnostics recorder (last 5s on crash)"
        />
      </FormGroup>
      
      {diagnosticsEnabled && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Crash dumps will be saved to the "crash_dumps" folder in your application directory.
          Each dump is approximately 2MB in size.
        </Typography>
      )}
    </Paper>
  );
};

export default DiagnosticsPanel;
