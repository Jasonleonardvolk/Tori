/**
 * recovery.ts
 * ------------------------------------------------
 * Archive recovery and re-encoding functionality for ψ-Trajectory
 * 
 * Provides mechanisms for recovering corrupted archives through:
 * - Keyframe-based reconstruction
 * - Header reconstruction
 * - Partial session recovery
 */

import fs from 'fs';
import { promisify } from 'util';
import { PsiTrajectory } from './index';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);

/**
 * Error codes for recovery operations
 */
export enum RecoveryErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_ARCHIVE = 'INVALID_ARCHIVE',
  HEADER_DAMAGED = 'HEADER_DAMAGED',
  UNRECOVERABLE = 'UNRECOVERABLE',
  NO_VALID_KEYFRAMES = 'NO_VALID_KEYFRAMES',
  MISSING_SESSIONS = 'MISSING_SESSIONS',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * Options for the re-encoding process
 */
export interface ReencodingOptions {
  // Recovery options
  attemptHeaderReconstruction?: boolean;   // Try to rebuild damaged headers
  maxRecoveryAttempts?: number;            // Max passes for frame recovery
  repairCrcErrors?: boolean;               // Fix CRC errors if possible
  forceReencode?: boolean;                 // Re-encode even without detected issues
  skipCorruptedFrames?: boolean;           // Skip frames that can't be recovered
  
  // Re-encoding parameters
  keyframeInterval?: number;               // Interval for keyframes in re-encoded file
  compressionLevel?: number;               // 0-9, where higher is better compression
  useNewFormat?: boolean;                  // Use newer archive format if available
}

/**
 * Result of a re-encoding operation
 */
export interface ReencodingResult {
  // Success status
  success: boolean;                        // Overall success flag
  errorCode?: RecoveryErrorCode;           // Error code if failed
  errorMessage?: string;                   // Detailed error message if failed
  
  // Corruption statistics
  corruptedFramesDetected: number;         // Count of corrupted frames detected
  framesRecovered: number;                 // Count of frames successfully recovered
  unrecoverableFrames: number;             // Count of frames that couldn't be recovered
  
  // Recovery details
  keyframesUsed: number;                   // Number of keyframes used for recovery
  headerReconstructed?: boolean;           // Whether the header was reconstructed
  truncationDetected?: boolean;            // Whether file truncation was detected
  totalFrames: number;                     // Total number of frames in the archive
  recoveredSessions: string[];             // List of recovered session IDs
  
  // Performance metrics
  processingTimeMs: number;                // Time taken for re-encoding
  
  // Output information
  outputPath: string;                      // Path to the re-encoded file
  originalSize: number;                    // Size of original file in bytes
  newSize: number;                         // Size of re-encoded file in bytes
}

/**
 * Re-encode a potentially corrupted ψ-Trajectory archive
 * @param inputPath Path to the potentially corrupted archive
 * @param outputPath Path where the recovered archive will be written
 * @param options Options for the recovery and re-encoding process
 * @returns Result of the re-encoding process
 */
export async function reencodeArchive(
  inputPath: string,
  outputPath: string,
  options: ReencodingOptions = {}
): Promise<ReencodingResult> {
  // Default options
  const defaultOptions: ReencodingOptions = {
    attemptHeaderReconstruction: true,
    maxRecoveryAttempts: 3,
    repairCrcErrors: true,
    skipCorruptedFrames: true,
    keyframeInterval: 15,
    compressionLevel: 6,
    useNewFormat: false,
    forceReencode: false
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  const startTime = Date.now();
  
  // Initialize result structure
  const result: ReencodingResult = {
    success: false,
    corruptedFramesDetected: 0,
    framesRecovered: 0,
    unrecoverableFrames: 0,
    keyframesUsed: 0,
    totalFrames: 0,
    recoveredSessions: [],
    processingTimeMs: 0,
    outputPath,
    originalSize: 0,
    newSize: 0
  };
  
  try {
    // Check if input file exists
    if (!await exists(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }
    
    // Get original file size
    const stats = fs.statSync(inputPath);
    result.originalSize = stats.size;
    
    // Try to open the archive with recovery mode
    const inputArchive = PsiTrajectory.createFromPath(inputPath, {
      recoveryMode: true,
      attemptHeaderReconstruction: mergedOptions.attemptHeaderReconstruction
    });
    
    // Check if header was reconstructed
    result.headerReconstructed = inputArchive.wasHeaderReconstructed();
    
    // Check if file truncation was detected
    result.truncationDetected = inputArchive.wasTruncationDetected();
    
    // Get session information
    const sessionIds = await inputArchive.getSessionIds();
    if (sessionIds.length === 0) {
      throw new Error('No valid sessions found in the archive');
    }
    
    // Create new output archive
    const outputArchive = PsiTrajectory.createFromPath(outputPath, {
      create: true,
      compressionLevel: mergedOptions.compressionLevel,
      useNewFormat: mergedOptions.useNewFormat,
      keyframeInterval: mergedOptions.keyframeInterval
    });
    
    // Process each session
    for (const sessionId of sessionIds) {
      try {
        // Get session from original archive
        const session = await inputArchive.getSession(sessionId, {
          skipCorruptedFrames: mergedOptions.skipCorruptedFrames,
          repairCrcErrors: mergedOptions.repairCrcErrors,
          maxRecoveryAttempts: mergedOptions.maxRecoveryAttempts
        });
        
        // Get session metadata
        const metadata = session.metadata || {};
        
        // Create session in output archive
        await outputArchive.createSession({ 
          id: sessionId,
          metadata: {
            ...metadata,
            recoveryDate: new Date().toISOString(),
            originalArchive: inputPath
          }
        });
        
        // Copy all frames
        const frames = await session.getAllFrames();
        result.totalFrames += frames.length;
        
        // Track corruption statistics
        result.corruptedFramesDetected += session.corruptedFrameCount || 0;
        result.framesRecovered += session.recoveredFrameCount || 0;
        result.unrecoverableFrames += session.unrecoverableFrameCount || 0;
        result.keyframesUsed += session.keyframesUsed || 0;
        
        // Write each frame to new archive
        for (const frame of frames) {
          await outputArchive.addFrame({
            sessionId,
            timestamp: frame.timestamp,
            oscillatorStates: frame.oscillatorStates,
            audioSamples: frame.audioSamples,
            metadata: frame.metadata
          });
        }
        
        // Finalize session
        await outputArchive.finalizeSession(sessionId);
        
        // Add to recovered sessions list
        result.recoveredSessions.push(sessionId);
      } catch (error) {
        // Use type assertion for more specific error handling
        const err = error as Error;
        console.error(`Failed to recover session ${sessionId}:`, err);
        // Continue with other sessions even if one fails
      }
    }
    
    // Close archives
    await inputArchive.close();
    await outputArchive.close();
    
    // Get new file size
    const newStats = fs.statSync(outputPath);
    result.newSize = newStats.size;
    
    // Update success status
    result.success = result.recoveredSessions.length > 0;
    
    // Calculate processing time
    result.processingTimeMs = Date.now() - startTime;
    
    return result;
  } catch (error) {
    // Handle errors with proper type casting
    const err = error as Error;
    console.error('Archive recovery failed:', err);
    
    result.success = false;
    result.errorMessage = err.message;
    
    // Determine error code
    if (err.message.includes('not found')) {
      result.errorCode = RecoveryErrorCode.FILE_NOT_FOUND;
    } else if (err.message.includes('invalid archive')) {
      result.errorCode = RecoveryErrorCode.INVALID_ARCHIVE;
    } else if (err.message.includes('header damaged')) {
      result.errorCode = RecoveryErrorCode.HEADER_DAMAGED;
    } else if (err.message.includes('no valid keyframes')) {
      result.errorCode = RecoveryErrorCode.NO_VALID_KEYFRAMES;
    } else if (err.message.includes('no valid sessions')) {
      result.errorCode = RecoveryErrorCode.MISSING_SESSIONS;
    } else {
      result.errorCode = RecoveryErrorCode.INTERNAL_ERROR;
    }
    
    // Calculate processing time
    result.processingTimeMs = Date.now() - startTime;
    
    return result;
  }
}
