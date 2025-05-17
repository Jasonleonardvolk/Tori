/**
 * ψ-Trajectory Export Pipeline TypeScript Interface
 * 
 * This module provides the frontend API for the export functionality,
 * with platform-specific optimizations and user configuration options.
 */

import { EventEmitter } from 'events';
import { PsiTrajectory } from './index';

/**
 * Export quality preset
 */
export enum ExportQuality {
  /** Draft quality (fast, low quality) */
  DRAFT = 'draft',
  /** Standard quality (balanced) */
  STANDARD = 'standard',
  /** High quality (better, slower) */
  HIGH = 'high',
  /** Ultra quality (best, slowest) */
  ULTRA = 'ultra',
}

/**
 * Export mode
 */
export enum ExportMode {
  /** Fast export (maximum resource usage) */
  FAST = 'fast',
  /** Balanced export (default) */
  BALANCED = 'balanced',
  /** Low-power export (minimal resource usage) */
  LOW_POWER = 'low_power',
}

/**
 * Export format
 */
export enum ExportFormat {
  /** MP4 with H.264 video */
  MP4 = 'mp4',
  /** WebM with VP9 video */
  WEBM = 'webm',
  /** GIF animation */
  GIF = 'gif',
  /** Individual PNG frames */
  PNG_SEQUENCE = 'png_sequence',
}

/**
 * Export configuration
 */
export interface ExportConfig {
  /** Archive path */
  archivePath: string;
  /** Output file path */
  outputPath: string;
  /** Export quality preset */
  quality?: ExportQuality;
  /** Export mode */
  mode?: ExportMode;
  /** Export format */
  format?: ExportFormat;
  /** Frame width */
  width?: number;
  /** Frame height */
  height?: number;
  /** Frame rate (frames per second) */
  fps?: number;
  /** Start frame */
  startFrame?: number;
  /** End frame */
  endFrame?: number;
  /** Use hardware acceleration if available */
  useHardwareAccel?: boolean;
  /** Include audio */
  includeAudio?: boolean;
}

/**
 * Export progress status
 */
export interface ExportProgress {
  /** Job ID */
  jobId: string;
  /** Current frame */
  currentFrame: number;
  /** Total frames */
  totalFrames: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Elapsed time in seconds */
  elapsedSeconds: number;
  /** Estimated time remaining in seconds */
  remainingSeconds: number;
  /** Current status message */
  statusMessage: string;
}

/**
 * Export job status
 */
export enum JobStatus {
  /** Job is queued */
  QUEUED = 'queued',
  /** Job is running */
  RUNNING = 'running',
  /** Job is paused */
  PAUSED = 'paused',
  /** Job completed successfully */
  COMPLETED = 'completed',
  /** Job failed */
  FAILED = 'failed',
  /** Job was cancelled */
  CANCELLED = 'cancelled',
}

/**
 * PsiExporter extends the core PsiTrajectory class with export functionality
 */
export class PsiExporter extends EventEmitter {
  private psi: PsiTrajectory;
  private activeJobs: Map<string, JobStatus> = new Map();

  /**
   * Create a new PsiExporter
   * @param psi PsiTrajectory instance
   */
  constructor(psi: PsiTrajectory) {
    super();
    this.psi = psi;

    // Set up progress monitoring
    this.setupProgressMonitoring();
  }

  /**
   * Create a new export job
   * @param config Export configuration
   * @returns Promise resolving to the job ID
   */
  async createExportJob(config: ExportConfig): Promise<string> {
    if (!this.psi) {
      throw new Error('PsiTrajectory not initialized');
    }

    // Validate configuration
    this.validateConfig(config);

    // Create export job
    const jobId = await this.callExportFunction('createExportJob', {
      archive_path: config.archivePath,
      output_path: config.outputPath,
      quality: this.mapQuality(config.quality || ExportQuality.STANDARD),
      mode: this.mapMode(config.mode || ExportMode.BALANCED),
      format: this.mapFormat(config.format || ExportFormat.MP4),
      width: config.width || 1920,
      height: config.height || 1080,
      fps: config.fps || 60,
      start_frame: config.startFrame,
      end_frame: config.endFrame,
      use_hardware_accel: config.useHardwareAccel !== false,
      include_audio: config.includeAudio !== false,
    });

    // Add to active jobs
    this.activeJobs.set(jobId, JobStatus.QUEUED);

    // Return the job ID
    return jobId;
  }

  /**
   * Get the status of an export job
   * @param jobId Job ID
   * @returns Job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    if (!this.psi) {
      throw new Error('PsiTrajectory not initialized');
    }

    // Check if job exists
    if (!this.activeJobs.has(jobId)) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Get status from WASM
    const status = await this.callExportFunction('getJobStatus', { job_id: jobId });
    const mappedStatus = this.mapStatus(status);

    // Update local status
    this.activeJobs.set(jobId, mappedStatus);

    return mappedStatus;
  }

  /**
   * Get the progress of an export job
   * @param jobId Job ID
   * @returns Job progress
   */
  async getJobProgress(jobId: string): Promise<ExportProgress> {
    if (!this.psi) {
      throw new Error('PsiTrajectory not initialized');
    }

    // Check if job exists
    if (!this.activeJobs.has(jobId)) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Get progress from WASM
    const progress = await this.callExportFunction('getJobProgress', { job_id: jobId });

    // Map to TypeScript interface
    return {
      jobId: progress.job_id,
      currentFrame: progress.current_frame,
      totalFrames: progress.total_frames,
      percentage: progress.percentage,
      elapsedSeconds: progress.elapsed_seconds,
      remainingSeconds: progress.remaining_seconds,
      statusMessage: progress.status_message,
    };
  }

  /**
   * Cancel an export job
   * @param jobId Job ID
   * @returns True if job was cancelled
   */
  async cancelJob(jobId: string): Promise<boolean> {
    if (!this.psi) {
      throw new Error('PsiTrajectory not initialized');
    }

    // Check if job exists
    if (!this.activeJobs.has(jobId)) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Cancel job
    const result = await this.callExportFunction('cancelJob', { job_id: jobId });

    // Update status if successful
    if (result) {
      this.activeJobs.set(jobId, JobStatus.CANCELLED);
    }

    return result;
  }

  /**
   * Get all active export jobs
   * @returns Map of job IDs to statuses
   */
  getActiveJobs(): Map<string, JobStatus> {
    return new Map(this.activeJobs);
  }

  /**
   * Clear completed, failed, or cancelled jobs from the active jobs list
   */
  clearFinishedJobs(): void {
    for (const [jobId, status] of this.activeJobs.entries()) {
      if (
        status === JobStatus.COMPLETED ||
        status === JobStatus.FAILED ||
        status === JobStatus.CANCELLED
      ) {
        this.activeJobs.delete(jobId);
      }
    }
  }

  /**
   * Set up progress monitoring for export jobs
   * This sets up a listener for progress updates from the WASM module
   */
  private setupProgressMonitoring(): void {
    // In a real implementation, this would set up an event listener
    // for progress updates from the WASM module.
    // For now, we'll use polling for demo purposes.

    const pollProgress = async () => {
      for (const [jobId, status] of this.activeJobs.entries()) {
        if (
          status === JobStatus.RUNNING ||
          status === JobStatus.PAUSED
        ) {
          try {
            const progress = await this.getJobProgress(jobId);
            this.emit('progress', progress);

            // Check if job status changed
            const newStatus = await this.getJobStatus(jobId);
            if (newStatus !== status) {
              this.activeJobs.set(jobId, newStatus);
              this.emit('statusChange', { jobId, status: newStatus });

              // Emit specific events
              if (newStatus === JobStatus.COMPLETED) {
                this.emit('completed', jobId);
              } else if (newStatus === JobStatus.FAILED) {
                this.emit('failed', jobId);
              }
            }
          } catch (error) {
            console.error(`Error polling progress for job ${jobId}:`, error);
          }
        }
      }

      // Schedule next poll if there are active jobs
      if (this.hasActiveJobs()) {
        setTimeout(pollProgress, 500);
      }
    };

    // Start polling if there are active jobs
    if (this.hasActiveJobs()) {
      pollProgress();
    }

    // Set up event listener for new jobs
    this.on('newJob', () => {
      if (this.activeJobs.size === 1) {
        // This is the first job, start polling
        pollProgress();
      }
    });
  }

  /**
   * Check if there are any active jobs (running or paused)
   * @returns True if there are active jobs
   */
  private hasActiveJobs(): boolean {
    for (const status of this.activeJobs.values()) {
      if (status === JobStatus.RUNNING || status === JobStatus.PAUSED) {
        return true;
      }
    }
    return false;
  }

  /**
   * Validate export configuration
   * @param config Export configuration
   */
  private validateConfig(config: ExportConfig): void {
    if (!config.archivePath) {
      throw new Error('archivePath is required');
    }
    if (!config.outputPath) {
      throw new Error('outputPath is required');
    }
  }

  /**
   * Call an export function in the WASM module
   * @param func Function name
   * @param args Function arguments
   * @returns Function result
   */
  private async callExportFunction(func: string, args: any): Promise<any> {
    // In a real implementation, this would call into the WASM module
    // For now, we'll just simulate the response for demo purposes

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Mock implementation
    switch (func) {
      case 'createExportJob':
        return `export-${Date.now()}`;
      case 'getJobStatus':
        return 'running';
      case 'getJobProgress':
        return {
          job_id: args.job_id,
          current_frame: 100,
          total_frames: 1000,
          percentage: 10.0,
          elapsed_seconds: 5.0,
          remaining_seconds: 45.0,
          status_message: 'Exporting frame 100 of 1000',
        };
      case 'cancelJob':
        return true;
      default:
        throw new Error(`Unknown export function: ${func}`);
    }
  }

  /**
   * Map TypeScript quality enum to Rust quality value
   * @param quality Quality preset
   * @returns Rust quality value
   */
  private mapQuality(quality: ExportQuality): number {
    switch (quality) {
      case ExportQuality.DRAFT:
        return 0;
      case ExportQuality.STANDARD:
        return 1;
      case ExportQuality.HIGH:
        return 2;
      case ExportQuality.ULTRA:
        return 3;
      default:
        return 1; // Standard
    }
  }

  /**
   * Map TypeScript mode enum to Rust mode value
   * @param mode Export mode
   * @returns Rust mode value
   */
  private mapMode(mode: ExportMode): number {
    switch (mode) {
      case ExportMode.FAST:
        return 0;
      case ExportMode.BALANCED:
        return 1;
      case ExportMode.LOW_POWER:
        return 2;
      default:
        return 1; // Balanced
    }
  }

  /**
   * Map TypeScript format enum to Rust format value
   * @param format Export format
   * @returns Rust format value
   */
  private mapFormat(format: ExportFormat): number {
    switch (format) {
      case ExportFormat.MP4:
        return 0;
      case ExportFormat.WEBM:
        return 1;
      case ExportFormat.GIF:
        return 2;
      case ExportFormat.PNG_SEQUENCE:
        return 3;
      default:
        return 0; // MP4
    }
  }

  /**
   * Map Rust status value to TypeScript status enum
   * @param status Rust status value
   * @returns TypeScript status enum
   */
  private mapStatus(status: string): JobStatus {
    switch (status) {
      case 'queued':
        return JobStatus.QUEUED;
      case 'running':
        return JobStatus.RUNNING;
      case 'paused':
        return JobStatus.PAUSED;
      case 'completed':
        return JobStatus.COMPLETED;
      case 'failed':
        return JobStatus.FAILED;
      case 'cancelled':
        return JobStatus.CANCELLED;
      default:
        return JobStatus.FAILED;
    }
  }
}

/**
 * Create a PsiExporter instance for a PsiTrajectory instance
 * @param psi PsiTrajectory instance
 * @returns PsiExporter instance
 */
export function createExporter(psi: PsiTrajectory): PsiExporter {
  return new PsiExporter(psi);
}
