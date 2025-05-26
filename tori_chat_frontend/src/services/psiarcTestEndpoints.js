// Additional server endpoint for testing ψarc replay functionality
// Add this to server.js after the existing endpoints

// Test ψarc replay functionality
app.get('/api/chat/test-replay', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Get user's conversation history
    const history = conversationStorage.getUserConversationHistory(userId);
    
    if (history.length === 0) {
      return res.json({
        success: false,
        message: 'No conversations found to test replay',
        suggestion: 'Have a conversation first, then test replay'
      });
    }
    
    // Test replay of the most recent session
    const latestSession = history[0];
    const sessionId = latestSession.session_id;
    
    try {
      const frames = await conversationStorage.replayPsiArcSession(sessionId);
      
      res.json({
        success: true,
        message: 'ψarc replay test successful',
        sessionId: sessionId,
        frameCount: frames.length,
        testResults: {
          replayWorking: true,
          framesLoaded: frames.length > 0,
          firstFrameValid: frames.length > 0 && frames[0].frame_id !== undefined,
          conceptDiffOpsPresent: frames.some(f => f.ops && f.ops.length > 0),
          timestampsValid: frames.every(f => f.timestamp && !isNaN(new Date(f.timestamp).getTime()))
        },
        sampleFrame: frames.length > 0 ? {
          frame_id: frames[0].frame_id,
          timestamp: frames[0].timestamp,
          hasUserMessage: !!frames[0].user_message,
          hasAssistantResponse: !!frames[0].assistant_response,
          operationCount: frames[0].ops?.length || 0
        } : null
      });
      
    } catch (replayError) {
      res.status(500).json({
        success: false,
        error: 'Replay failed',
        details: replayError.message,
        sessionId: sessionId,
        troubleshooting: {
          checkPsiarcFile: `Check if ${sessionId}.psiarc exists in psiarc_logs/`,
          checkMetaFile: `Check if ${sessionId}.meta.json exists in psiarc_logs/`,
          possibleCauses: [
            'Session file corrupted',
            'Invalid JSON in .psiarc file',
            'Missing timestamp or frame_id fields',
            'Permissions issue accessing files'
          ]
        }
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test replay failed',
      details: error.message
    });
  }
});

// Batch export all sessions as ZIP
app.post('/api/chat/export-all', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userName = req.session.user.name;
    
    // Get all user sessions
    const history = conversationStorage.getUserConversationHistory(userId);
    
    if (history.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No conversations to export'
      });
    }
    
    // For now, create a simple manifest since we don't have zip library
    const manifest = {
      exportType: 'batch_toripack_collection',
      userId: userId,
      userName: userName,
      exportTime: new Date().toISOString(),
      sessionCount: history.length,
      sessions: history.map(session => ({
        sessionId: session.session_id,
        timestamp: session.timestamp,
        messageCount: session.message_count,
        persona: session.persona,
        concepts: session.concepts || [],
        toripackUrl: `/api/chat/export/${session.session_id}`
      })),
      instructions: {
        message: 'Individual .toripack files can be downloaded using the URLs provided',
        downloadAll: 'Use the toripackUrl for each session to download individual files',
        viewer: 'Use TORI\'s Toripack Viewer to open and examine each file'
      }
    };
    
    res.json({
      success: true,
      exportManifest: manifest,
      message: `Found ${history.length} sessions ready for export`,
      note: 'Individual toripack downloads available via provided URLs'
    });
    
  } catch (error) {
    console.error('Batch export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create export manifest'
    });
  }
});

// ψarc system diagnostics
app.get('/api/chat/psiarc-diagnostics', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const fs = await import('fs');
    const path = await import('path');
    
    // Check ψarc directories
    const psiarcDir = path.join(process.cwd(), 'psiarc_logs');
    const conversationsDir = path.join(process.cwd(), 'conversations');
    
    const diagnostics = {
      directories: {
        psiarcExists: fs.existsSync(psiarcDir),
        conversationsExists: fs.existsSync(conversationsDir),
        psiarcPath: psiarcDir,
        conversationsPath: conversationsDir
      },
      files: {
        psiarcFiles: [],
        metaFiles: [],
        conversationFiles: [],
        totalSize: 0
      },
      userSessions: {
        totalSessions: 0,
        userSessions: 0,
        latestSession: null
      },
      integrity: {
        validPsiarcFiles: 0,
        corruptedFiles: 0,
        missingMetadata: 0,
        errors: []
      }
    };
    
    // Scan ψarc files
    if (fs.existsSync(psiarcDir)) {
      const files = fs.readdirSync(psiarcDir);
      
      for (const file of files) {
        const filePath = path.join(psiarcDir, file);
        const stats = fs.statSync(filePath);
        diagnostics.files.totalSize += stats.size;
        
        if (file.endsWith('.psiarc')) {
          diagnostics.files.psiarcFiles.push({
            name: file,
            size: stats.size,
            modified: stats.mtime.toISOString()
          });
          
          // Check if it's a user session
          if (file.includes(userId) || true) { // For now, count all as potential user sessions
            diagnostics.userSessions.userSessions++;
            
            // Try to validate the file
            try {
              const content = fs.readFileSync(filePath, 'utf-8');
              const lines = content.split('\n').filter(line => line.trim());
              let validFrames = 0;
              
              for (const line of lines) {
                try {
                  const frame = JSON.parse(line);
                  if (frame.frame_id && frame.timestamp) {
                    validFrames++;
                  }
                } catch (e) {
                  diagnostics.integrity.errors.push(`Invalid JSON in ${file}: ${e.message}`);
                }
              }
              
              if (validFrames > 0) {
                diagnostics.integrity.validPsiarcFiles++;
                if (!diagnostics.userSessions.latestSession || stats.mtime > new Date(diagnostics.userSessions.latestSession.modified)) {
                  diagnostics.userSessions.latestSession = {
                    file: file,
                    frames: validFrames,
                    modified: stats.mtime.toISOString()
                  };
                }
              } else {
                diagnostics.integrity.corruptedFiles++;
              }
              
            } catch (error) {
              diagnostics.integrity.corruptedFiles++;
              diagnostics.integrity.errors.push(`Failed to read ${file}: ${error.message}`);
            }
          }
        } else if (file.endsWith('.meta.json')) {
          diagnostics.files.metaFiles.push({
            name: file,
            size: stats.size,
            modified: stats.mtime.toISOString()
          });
        }
      }
    }
    
    // Scan conversation markdown files
    if (fs.existsSync(conversationsDir)) {
      const files = fs.readdirSync(conversationsDir);
      for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.toripack')) {
          const filePath = path.join(conversationsDir, file);
          const stats = fs.statSync(filePath);
          diagnostics.files.conversationFiles.push({
            name: file,
            size: stats.size,
            modified: stats.mtime.toISOString()
          });
        }
      }
    }
    
    diagnostics.userSessions.totalSessions = diagnostics.files.psiarcFiles.length;
    
    // Calculate health score
    const healthScore = Math.min(100, Math.max(0, 
      (diagnostics.integrity.validPsiarcFiles / Math.max(1, diagnostics.files.psiarcFiles.length)) * 100
    ));
    
    res.json({
      success: true,
      diagnostics,
      healthScore: Math.round(healthScore),
      summary: {
        status: healthScore > 90 ? 'excellent' : healthScore > 70 ? 'good' : healthScore > 50 ? 'fair' : 'poor',
        totalFiles: diagnostics.files.psiarcFiles.length + diagnostics.files.metaFiles.length + diagnostics.files.conversationFiles.length,
        totalSizeFormatted: formatBytes(diagnostics.files.totalSize),
        recommendations: generateRecommendations(diagnostics, healthScore)
      }
    });
    
  } catch (error) {
    console.error('Diagnostics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run ψarc diagnostics',
      details: error.message
    });
  }
});

// Helper functions for diagnostics
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateRecommendations(diagnostics, healthScore) {
  const recommendations = [];
  
  if (!diagnostics.directories.psiarcExists) {
    recommendations.push('Create ψarc_logs directory for conversation storage');
  }
  
  if (diagnostics.integrity.corruptedFiles > 0) {
    recommendations.push(`Repair ${diagnostics.integrity.corruptedFiles} corrupted ψarc files`);
  }
  
  if (diagnostics.files.psiarcFiles.length === 0) {
    recommendations.push('Start conversations to build your memory vault');
  }
  
  if (healthScore < 70) {
    recommendations.push('Run integrity check and repair corrupted files');
  }
  
  if (diagnostics.files.totalSize > 100 * 1024 * 1024) { // > 100MB
    recommendations.push('Consider archiving old conversations for performance');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('ψarc system is healthy - perfect memory integrity maintained');
  }
  
  return recommendations;
}
