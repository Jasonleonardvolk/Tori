/**
 * test-helpers.ts
 * ------------------------------------------------
 * Test utilities for ψ-Trajectory testing
 * Includes functions for creating test archives and cleanup
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { PsiTrajectory } from '../index';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

// Promisify file operations
const unlink = promisify(fs.unlink);
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);

interface TempArchiveOptions {
  sessionId: string;
  duration: number;
  frameRate: number;
  keyframeInterval: number;
  oscillatorCount: number;
  audioSampleRate: number;
  tempDir?: string;
}

/**
 * Create a temporary test archive with specified properties
 * @param options Configuration for the test archive
 * @returns Path to the created temporary archive
 */
export async function createTempArchive(options: TempArchiveOptions): Promise<string> {
  // Create temporary directory for test files if it doesn't exist
  const tempDir = options.tempDir || path.join(os.tmpdir(), 'psi-trajectory-tests');
  
  if (!await exists(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }
  
  // Generate unique filename for this test
  const archiveFileName = `test-archive-${uuidv4()}.psi`;
  const archivePath = path.join(tempDir, archiveFileName);
  
  // Create test archive
  const psi = new PsiTrajectory();
  
  // Initialize with test parameters
  await psi.initialize({
    path: archivePath,
    create: true,
    oscillatorCount: options.oscillatorCount,
    audioConfig: {
      sampleRate: options.audioSampleRate,
      channels: 1
    },
    keyframeInterval: options.keyframeInterval
  });
  
  // Create a new session
  await psi.createSession({
    id: options.sessionId,
    metadata: {
      test: true,
      created: new Date().toISOString()
    }
  });
  
  // Generate synthetic data for the specified duration
  const frameCount = Math.floor(options.duration * options.frameRate);
  
  for (let i = 0; i < frameCount; i++) {
    // Generate synthetic frame data
    const frameData = generateSyntheticFrame(i, options.oscillatorCount);
    
    // Generate synthetic audio data
    const audioSamples = generateSyntheticAudio(
      i / options.frameRate,
      options.audioSampleRate / options.frameRate
    );
    
    // Add frame to the session
    await psi.addFrame({
      sessionId: options.sessionId,
      oscillatorStates: frameData,
      audioSamples: audioSamples,
      timestamp: i / options.frameRate
    });
  }
  
  // Finalize the session
  await psi.finalizeSession(options.sessionId);
  
  // Close the archive
  await psi.close();
  
  return archivePath;
}

/**
 * Remove temporary test files
 * @param filePaths Array of file paths to remove
 */
export async function cleanupTempFiles(filePaths: string[]): Promise<void> {
  for (const filePath of filePaths) {
    if (await exists(filePath)) {
      try {
        await unlink(filePath);
      } catch (err) {
        console.warn(`Failed to delete test file: ${filePath}`, err);
      }
    }
  }
}

/**
 * Generate synthetic oscillator states for testing
 * @param frameIndex Frame index for deterministic pattern generation
 * @param oscillatorCount Number of oscillators to generate data for
 */
function generateSyntheticFrame(frameIndex: number, oscillatorCount: number): Float32Array {
  const result = new Float32Array(oscillatorCount * 3); // * 3 for phase, amplitude, frequency
  
  // Fill with deterministic but varying test data
  for (let i = 0; i < oscillatorCount; i++) {
    // Phase varies with frame index (0-2π)
    const phaseIndex = i * 3;
    result[phaseIndex] = (frameIndex * 0.1 + i * 0.2) % (2 * Math.PI);
    
    // Amplitude follows a pattern (0-1)
    const amplitudeIndex = i * 3 + 1;
    result[amplitudeIndex] = 0.5 + 0.5 * Math.sin((frameIndex + i) * 0.05);
    
    // Frequency varies by oscillator (0-20 Hz range for testing)
    const frequencyIndex = i * 3 + 2;
    result[frequencyIndex] = 5 + 15 * ((i % 5) / 5) * (1 + 0.1 * Math.sin(frameIndex * 0.02));
  }
  
  return result;
}

/**
 * Generate synthetic audio samples for testing
 * @param timestamp Current time in seconds
 * @param sampleCount Number of samples to generate
 */
function generateSyntheticAudio(timestamp: number, sampleCount: number): Float32Array {
  const result = new Float32Array(Math.floor(sampleCount));
  
  // Generate a simple sine wave with varying frequency based on timestamp
  const baseFreq = 440; // A4 note
  
  for (let i = 0; i < result.length; i++) {
    // Vary frequency slightly over time for more realistic test data
    const freq = baseFreq * (1 + 0.1 * Math.sin(timestamp * 0.2));
    const phase = 2 * Math.PI * freq * (timestamp + i / sampleCount);
    
    // Add some harmonics for more complex waveform
    result[i] = 0.5 * Math.sin(phase) + 
                0.25 * Math.sin(phase * 2) + 
                0.125 * Math.sin(phase * 3);
    
    // Normalize to prevent clipping
    result[i] *= 0.7;
  }
  
  return result;
}
