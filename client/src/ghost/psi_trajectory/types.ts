/**
 * types.ts
 * ------------------------------------------------
 * Type definitions for the ψ-Trajectory library
 */

/**
 * Session initialization options
 */
export interface SessionInitOptions {
  id: string;
  metadata?: Record<string, any>;
}

/**
 * Archive initialization options
 */
export interface ArchiveInitOptions {
  path: string;
  create?: boolean;
  oscillatorCount?: number;
  audioConfig?: {
    sampleRate: number;
    channels: number;
  };
  keyframeInterval?: number;
  compressionLevel?: number;
  recoveryMode?: boolean;
  attemptHeaderReconstruction?: boolean;
  useNewFormat?: boolean;
}

/**
 * Frame data structure
 */
export interface FrameData {
  sessionId: string;
  timestamp: number;
  oscillatorStates: Float32Array;
  audioSamples: Float32Array;
  metadata?: Record<string, any>;
}

/**
 * Session data retrieval options
 */
export interface SessionRetrievalOptions {
  skipCorruptedFrames?: boolean;
  repairCrcErrors?: boolean;
  maxRecoveryAttempts?: number;
}

/**
 * Session interface
 */
export interface PsiSession {
  id: string;
  metadata?: Record<string, any>;
  frameCount: number;
  corruptedFrameCount?: number;
  recoveredFrameCount?: number;
  unrecoverableFrameCount?: number;
  keyframesUsed?: number;
  getAllFrames(): Promise<FrameData[]>;
}

/**
 * Main PsiTrajectory class interface
 * Represents a ψ-Trajectory archive for storing and retrieving oscillator states
 */
export declare class PsiTrajectory {
  // Constants
  static readonly KEYFRAME_SIGNATURE: Uint8Array;
  
  // Factory methods
  static createFromPath(path: string, options?: Partial<ArchiveInitOptions>): PsiTrajectory;
  
  // Constructor - for internal use only
  private constructor();
  
  // Initialization
  initialize(options: ArchiveInitOptions): Promise<void>;
  
  // Recovery status 
  wasHeaderReconstructed(): boolean;
  wasTruncationDetected(): boolean;
  
  // Session management
  getSessionIds(): Promise<string[]>;
  getSession(sessionId: string, options?: SessionRetrievalOptions): Promise<PsiSession>;
  createSession(options: SessionInitOptions): Promise<void>;
  finalizeSession(sessionId: string): Promise<void>;
  
  // Frame management
  addFrame(frame: FrameData): Promise<void>;
  
  // Archive management
  close(): Promise<void>;
}
