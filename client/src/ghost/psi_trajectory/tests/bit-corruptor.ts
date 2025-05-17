/**
 * bit-corruptor.ts
 * ------------------------------------------------
 * Utility for introducing controlled bit errors into ψ-Trajectory archives
 * Used in fuzz testing to verify error recovery mechanisms
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Promisify file system operations
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);

export interface BitCorruptorOptions {
  // Required paths
  inputPath: string;
  outputPath: string;
  
  // Corruption parameters
  corruptionRate?: number;           // 0-1 value: percentage of bits to corrupt
  corruptionPattern?: 'random' | 'sequential' | 'burst';  // How to distribute corruption
  burstSize?: number;                // For 'burst' pattern: length of each burst
  preserveKeyframes?: boolean;       // Whether to preserve keyframe data
  keyframeSignature?: Uint8Array;    // Signature to identify keyframes
  
  // Special corruption modes
  targetHeader?: boolean;            // Target only the file header
  headerSize?: number;               // Size of header to target
  truncatePercent?: number;          // Percentage of file to truncate from the end
}

/**
 * BitCorruptor: Utility for controlled corruption of binary files
 * 
 * Introduces bit errors according to specified patterns to test
 * the resilience of ψ-Trajectory archives and recovery mechanisms.
 */
export class BitCorruptor {
  private options: BitCorruptorOptions;
  private defaultBurstSize = 128;    // Default bytes per burst
  
  constructor(options: BitCorruptorOptions) {
    this.options = {
      // Default values
      corruptionRate: 0.01,          // 1% default
      corruptionPattern: 'random',
      burstSize: this.defaultBurstSize,
      preserveKeyframes: false,
      ...options
    };
  }
  
  /**
   * Run the corruption process
   * @returns Number of bytes corrupted
   */
  async run(): Promise<number> {
    // Check if we're doing a simple truncation
    if (this.options.truncatePercent) {
      return this.truncateFile();
    }
    
    try {
      // Read input file
      const data = await readFile(this.options.inputPath);
      
      // Apply corruption
      const corruptedData = this.corruptBytes(data);
      
      // Write output file
      await writeFile(this.options.outputPath, corruptedData);
      
      // Count corrupted bytes
      let corruptedByteCount = 0;
      for (let i = 0; i < data.length; i++) {
        if (data[i] !== corruptedData[i]) {
          corruptedByteCount++;
        }
      }
      
      return corruptedByteCount;
    } catch (error) {
      console.error('Error during corruption process:', error);
      throw error;
    }
  }
  
  /**
   * Corrupt bytes in the buffer according to the specified pattern
   */
  private corruptBytes(buffer: Buffer): Buffer {
    // Create a copy of the buffer
    const result = Buffer.from(buffer);
    
    const totalBytes = buffer.length;
    const bytesToCorrupt = Math.floor(totalBytes * (this.options.corruptionRate || 0.01));
    
    // If targeting only the header, limit corruption to the header size
    const targetRegionEnd = this.options.targetHeader 
      ? Math.min(this.options.headerSize || 1024, totalBytes)
      : totalBytes;
    
    // If preserving keyframes, we need to locate them
    let keyframeLocations: number[] = [];
    if (this.options.preserveKeyframes && this.options.keyframeSignature) {
      keyframeLocations = this.findKeyframeLocations(buffer, this.options.keyframeSignature);
    }
    
    switch (this.options.corruptionPattern) {
      case 'sequential':
        // Corrupt a contiguous sequence of bytes
        const startIndex = Math.floor(Math.random() * (targetRegionEnd - bytesToCorrupt));
        
        for (let i = 0; i < bytesToCorrupt; i++) {
          const pos = startIndex + i;
          
          // Skip keyframes if preserving them
          if (this.shouldPreservePosition(pos, keyframeLocations)) {
            continue;
          }
          
          // Flip a random bit
          const originalByte = result[pos];
          const bitToFlip = Math.floor(Math.random() * 8);
          result[pos] = originalByte ^ (1 << bitToFlip);
        }
        break;
        
      case 'burst':
        // Corrupt in bursts (simulates physical media damage)
        const burstSize = this.options.burstSize || this.defaultBurstSize;
        const burstCount = Math.ceil(bytesToCorrupt / burstSize);
        
        for (let i = 0; i < burstCount; i++) {
          // Random starting position for this burst
          const burstStart = Math.floor(Math.random() * (targetRegionEnd - burstSize));
          
          // Corrupt bytes in this burst
          const burstEnd = Math.min(burstStart + burstSize, targetRegionEnd);
          for (let pos = burstStart; pos < burstEnd; pos++) {
            // Skip keyframes if preserving them
            if (this.shouldPreservePosition(pos, keyframeLocations)) {
              continue;
            }
            
            // More aggressive corruption for bursts (multiple bit flips)
            const originalByte = result[pos];
            const corruptedByte = Math.floor(Math.random() * 256);
            result[pos] = originalByte ^ corruptedByte;
          }
        }
        break;
        
      case 'random':
      default:
        // Randomly corrupt individual bytes throughout the file
        let corruptedCount = 0;
        
        while (corruptedCount < bytesToCorrupt) {
          const pos = Math.floor(Math.random() * targetRegionEnd);
          
          // Skip keyframes if preserving them
          if (this.shouldPreservePosition(pos, keyframeLocations)) {
            continue;
          }
          
          // Flip a random bit
          const originalByte = result[pos];
          const bitToFlip = Math.floor(Math.random() * 8);
          result[pos] = originalByte ^ (1 << bitToFlip);
          
          corruptedCount++;
        }
        break;
    }
    
    return result;
  }
  
  /**
   * Truncate the file by removing a percentage from the end
   */
  private async truncateFile(): Promise<number> {
    try {
      // Read input file
      const data = await readFile(this.options.inputPath);
      
      // Calculate truncation point
      const truncatePercent = this.options.truncatePercent || 10;
      const newLength = Math.floor(data.length * (1 - truncatePercent / 100));
      
      // Create truncated buffer
      const truncatedData = data.slice(0, newLength);
      
      // Write output file
      await writeFile(this.options.outputPath, truncatedData);
      
      // Return number of bytes removed
      return data.length - newLength;
    } catch (error) {
      console.error('Error during file truncation:', error);
      throw error;
    }
  }
  
  /**
   * Find all occurrences of keyframe signatures in the buffer
   */
  private findKeyframeLocations(buffer: Buffer, signature: Uint8Array): number[] {
    const locations: number[] = [];
    const signatureLength = signature.length;
    
    // Safety check
    if (signatureLength === 0) {
      return locations;
    }
    
    // Search for signature
    for (let i = 0; i <= buffer.length - signatureLength; i++) {
      let match = true;
      
      for (let j = 0; j < signatureLength; j++) {
        if (buffer[i + j] !== signature[j]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        // Found a keyframe - protect the signature and next KEYFRAME_ZONE_SIZE bytes
        locations.push(i);
        
        // Skip ahead past this signature to avoid overlapping detections
        i += signatureLength - 1;
      }
    }
    
    return locations;
  }
  
  /**
   * Determine if a position should be preserved (part of a keyframe)
   */
  private shouldPreservePosition(position: number, keyframeLocations: number[]): boolean {
    if (!this.options.preserveKeyframes || keyframeLocations.length === 0) {
      return false;
    }
    
    // Consider bytes after the signature as part of the keyframe
    const KEYFRAME_ZONE_SIZE = 1024; // 1KB protection zone
    const signatureLength = (this.options.keyframeSignature?.length || 0);
    
    for (const location of keyframeLocations) {
      if (position >= location && position < location + signatureLength + KEYFRAME_ZONE_SIZE) {
        return true;
      }
    }
    
    return false;
  }
}
