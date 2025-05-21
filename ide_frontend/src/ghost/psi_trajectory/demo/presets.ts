import { ExportFormat } from '../export';

/**
 * Interface for export presets
 */
export interface ExportPreset {
  id: string;
  label: string;
  video: {
    codec: string;
    crf: number;
    fps: number;
    width: number;
    height?: number;
  };
  audio: {
    codec: string;
    kbps: number;
  };
  ext: string;
  description?: string;
}

/**
 * Centralized list of export presets
 * Ensures CLI and UI stay in sync with the same preset options
 */
export const PRESETS: ExportPreset[] = [
  {
    id: 'social',
    label: 'Web-Share (720p)',
    video: {
      codec: 'h264',
      crf: 28,
      fps: 30,
      width: 1280,
      height: 720
    },
    audio: {
      codec: 'aac',
      kbps: 96
    },
    ext: 'mp4',
    description: 'Optimized for sharing on social media platforms'
  },
  {
    id: 'hi-q',
    label: 'High Quality (1080p)',
    video: {
      codec: 'h264',
      crf: 18,
      fps: 60,
      width: 1920,
      height: 1080
    },
    audio: {
      codec: 'aac',
      kbps: 192
    },
    ext: 'mp4',
    description: 'High quality export for presentations and archives'
  },
  {
    id: 'compressed',
    label: 'Compressed (480p)',
    video: {
      codec: 'h264',
      crf: 32,
      fps: 30,
      width: 854,
      height: 480
    },
    audio: {
      codec: 'aac',
      kbps: 64
    },
    ext: 'mp4',
    description: 'Smaller file size for email and messaging'
  },
  {
    id: 'webm-vp9',
    label: 'WebM (VP9)',
    video: {
      codec: 'vp9',
      crf: 24,
      fps: 30,
      width: 1280,
      height: 720
    },
    audio: {
      codec: 'opus',
      kbps: 128
    },
    ext: 'webm',
    description: 'Better compression for web embedding'
  },
  {
    id: 'archival',
    label: 'Archival Quality',
    video: {
      codec: 'h265',
      crf: 18,
      fps: 60,
      width: 3840,
      height: 2160
    },
    audio: {
      codec: 'aac',
      kbps: 320
    },
    ext: 'mp4',
    description: 'Maximum quality for long-term archiving'
  }
];

/**
 * Get a default output path based on the preset
 */
export function defaultPath(preset: ExportPreset, sessionName?: string): string {
  const baseName = sessionName ? 
    sessionName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 
    'export';
  
  return `./exports/${baseName}_${preset.id}.${preset.ext}`;
}

/**
 * Calculate suggested FPS based on preset and project settings
 */
export function suggestedFPS(preset: ExportPreset, maxFPS: number): number {
  return Math.min(maxFPS, preset.video.fps);
}
