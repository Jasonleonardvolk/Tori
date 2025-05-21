/**
 * PSI-Trajectory PSIARC Prototype Implementation
 * 
 * This file implements a prototype for the .psiarc file format with:
 * - LEB128 variable-length encoding for chunk sizes
 * - CRC32 checksums for data integrity
 * - Delta encoding with proper phase wrap handling
 * - Keyframe intervals for seeking
 * - Zstd compression (simulation only in JS prototype)
 */

// Constants for band types
const BAND_MICRO = 0x01;
const BAND_MESO = 0x02;
const BAND_MACRO = 0x03;
const BAND_AUDIO_PCM = 0xFE;
const BAND_END = 0xFF;

// Keyframe marker (can be OR'ed with band type)
const KEYFRAME_MARKER = 0x80;

/**
 * Writes a uint32 as a LEB128 variable-length encoding
 * @param {number} value - Integer value to encode
 * @returns {Uint8Array} - LEB128 encoded bytes
 */
function encodeLEB128(value) {
  const result = [];
  
  do {
    let byte = value & 0x7F;
    value >>>= 7;
    
    if (value !== 0) {
      byte |= 0x80; // Set high bit to indicate more bytes follow
    }
    
    result.push(byte);
  } while (value !== 0);
  
  return new Uint8Array(result);
}

/**
 * Calculates CRC32 for a byte array
 * @param {Uint8Array} data - Data to calculate CRC for
 * @returns {number} - CRC32 value
 */
function calculateCRC32(data) {
  // Simple implementation of CRC32 for prototype
  // In production would use a more efficient implementation
  let crc = 0xFFFFFFFF;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & (-(crc & 1)));
    }
  }
  
  return ~crc >>> 0;
}

/**
 * Delta encoder for int16 values with special handling for phase wrapping
 */
class DeltaEncoder {
  /**
   * @param {number} numChannels - Number of values per frame
   */
  constructor(numChannels) {
    this.lastValues = new Int16Array(numChannels);
  }
  
  /**
   * Reset encoder to initial state
   */
  reset() {
    this.lastValues.fill(0);
  }
  
  /**
   * Set initial values for the encoder (for keyframes)
   * @param {Int16Array} values - Initial values
   */
  setInitialValues(values) {
    if (values.length !== this.lastValues.length) {
      throw new Error('Values length mismatch');
    }
    
    for (let i = 0; i < values.length; i++) {
      this.lastValues[i] = values[i];
    }
  }
  
  /**
   * Encode a frame as deltas from the previous frame
   * @param {Int16Array} values - Current values to encode
   * @param {Int16Array} deltas - Output array for deltas
   */
  encodeFrame(values, deltas) {
    if (values.length !== this.lastValues.length || values.length !== deltas.length) {
      throw new Error('Array length mismatch');
    }
    
    for (let i = 0; i < values.length; i++) {
      // Use modular arithmetic for phase values
      deltas[i] = this.encodePhaseDelta(this.lastValues[i], values[i]);
      this.lastValues[i] = values[i];
    }
  }
  
  /**
   * Calculate delta with proper phase wrap handling
   * Implements Δθ = ((θ₂-θ₁+π) mod 2π)−π in fixed-point
   * @param {number} prev - Previous value
   * @param {number} curr - Current value
   * @returns {number} - Delta with wrap handling
   */
  encodePhaseDelta(prev, curr) {
    // Calculate raw delta
    let rawDelta = curr - prev;
    
    // Handle wrap-around in int16 space
    if (rawDelta > 32767) {
      rawDelta -= 65536;
    } else if (rawDelta <= -32768) {
      rawDelta += 65536;
    }
    
    return rawDelta;
  }
}

/**
 * Decoder to reconstruct original values from deltas
 */
class DeltaDecoder {
  /**
   * @param {number} numChannels - Number of values per frame
   */
  constructor(numChannels) {
    this.currentValues = new Int16Array(numChannels);
  }
  
  /**
   * Set values from a keyframe
   * @param {Int16Array} values - Keyframe values
   */
  setKeyframe(values) {
    if (values.length !== this.currentValues.length) {
      throw new Error('Values length mismatch');
    }
    
    for (let i = 0; i < values.length; i++) {
      this.currentValues[i] = values[i];
    }
  }
  
  /**
   * Apply deltas to current values
   * @param {Int16Array} deltas - Delta values to apply
   * @param {Int16Array} result - Output array for results
   */
  applyDeltas(deltas, result) {
    if (deltas.length !== this.currentValues.length || result.length !== this.currentValues.length) {
      throw new Error('Array length mismatch');
    }
    
    for (let i = 0; i < deltas.length; i++) {
      // Apply delta with proper wrap handling
      this.currentValues[i] = this.applyPhaseDelta(this.currentValues[i], deltas[i]);
      result[i] = this.currentValues[i];
    }
  }
  
  /**
   * Apply delta to a value with proper phase wrap handling
   * @param {number} value - Current value
   * @param {number} delta - Delta to apply
   * @returns {number} - New value
   */
  applyPhaseDelta(value, delta) {
    // Add with wrapping in int16 space
    return ((value + delta) & 0xFFFF) << 16 >> 16; // Force int16 wrapping
  }
}

/**
 * Generate synthetic oscillator data for testing
 * @param {number} numFrames - Number of frames to generate
 * @param {number} numOscillators - Number of oscillators per frame
 * @param {number} fps - Frames per second
 * @returns {Array<Int16Array>} - Array of frames, each containing oscillator values
 */
function generateSyntheticOscillatorData(numFrames, numOscillators, fps) {
  // Parameters for oscillators
  const frequencies = [];
  const phases = [];
  
  // Generate random parameters with deterministic seed
  let seed = 42;
  const random = () => {
    // Simple random generator with seed
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  // Initialize oscillator parameters
  for (let i = 0; i < numOscillators; i++) {
    // Frequencies between 0.1 and 10 Hz
    frequencies.push(0.1 + random() * 9.9);
    // Initial phases between 0 and 2π
    phases.push(random() * 2 * Math.PI);
  }
  
  // Generate frames
  const frames = [];
  
  for (let frame = 0; frame < numFrames; frame++) {
    const t = frame / fps; // Time in seconds
    const values = new Int16Array(numOscillators);
    
    for (let i = 0; i < numOscillators; i++) {
      // Calculate oscillator value at this time
      const phase = phases[i] + 2 * Math.PI * frequencies[i] * t;
      
      // Map sine wave [-1, 1] to int16 range [-32768, 32767]
      values[i] = Math.round(Math.sin(phase) * 32767);
    }
    
    frames.push(values);
  }
  
  return frames;
}

/**
 * Simulates compression using a simple ratio model (since we can't use zstd in JS)
 * @param {Uint8Array} data - Data to compress
 * @param {number} level - Compression level (1-22)
 * @returns {Uint8Array} - Compressed data (simulated)
 */
function simulateCompression(data, level) {
  // In real implementation, this would use zstd
  // For prototype, we'll simulate compression ratios
  
  // Calculate entropy as a simple measure
  const counts = new Map();
  for (let i = 0; i < data.length; i++) {
    counts.set(data[i], (counts.get(data[i]) || 0) + 1);
  }
  
  let entropy = 0;
  for (const [_, count] of counts.entries()) {
    const p = count / data.length;
    entropy -= p * Math.log2(p);
  }
  
  // Simulate compression ratio based on entropy and level
  // Higher entropy = worse compression, higher level = better compression
  const baseRatio = Math.max(1, 8 - entropy);
  const levelFactor = 0.5 + (level / 22) * 0.5; // 0.5 to 1.0 based on level
  
  const compressionRatio = baseRatio * levelFactor;
  
  // Create a simulated compressed buffer
  const compressedSize = Math.max(1, Math.ceil(data.length / compressionRatio));
  return new Uint8Array(compressedSize);
}

/**
 * Prototype PSIARC archive creator with synthetic data
 * @param {Object} options - Configuration options
 * @returns {Object} - Statistics about the created archive
 */
function createPrototypeArchive(options = {}) {
  const {
    numFrames = 1000,
    numOscillators = 15,
    fps = 60,
    keyframeInterval = 300,
    compressionLevel = 22
  } = options;
  
  // Generate synthetic data
  console.log(`Generating ${numFrames} frames with ${numOscillators} oscillators at ${fps} FPS...`);
  const frames = generateSyntheticOscillatorData(numFrames, numOscillators, fps);
  
  // Create delta encoder
  const encoder = new DeltaEncoder(numOscillators);
  const deltas = new Int16Array(numOscillators);
  
  // Track sizes
  let rawSize = 0;
  let compressedSize = 0;
  let headerSize = 16; // 4 (magic) + 2 (version) + 8 (timestamp) + 2 (CRC)
  compressedSize += headerSize;
  
  // Header (simulate)
  const header = new Uint8Array([
    0xCE, 0xA8, 0x41, 0x52, 0x43, // ΨARC magic
    0x01, 0x00,                   // Version 1 (LE)
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // Timestamp 0 (LE)
    0x00, 0x00                    // CRC placeholder
  ]);
  
  // Process frames
  for (let i = 0; i < frames.length; i++) {
    const isKeyframe = i === 0 || i % keyframeInterval === 0;
    const frame = frames[i];
    
    // Convert frame to bytes
    let frameBytes = new Uint8Array(frame.length * 2);
    for (let j = 0; j < frame.length; j++) {
      frameBytes[j*2] = frame[j] & 0xFF;
      frameBytes[j*2 + 1] = (frame[j] >> 8) & 0xFF;
    }
    
    if (isKeyframe) {
      // For keyframes, store absolute values
      encoder.setInitialValues(frame);
      rawSize += frameBytes.length;
      
      // Compress and write
      const compressed = simulateCompression(frameBytes, compressionLevel);
      
      // Calculate and add header size
      const tag = BAND_MICRO | KEYFRAME_MARKER;
      const lengthBytes = encodeLEB128(compressed.length);
      const crcBytes = 4; // 4 bytes for CRC32
      
      compressedSize += 1 + lengthBytes.length + compressed.length + crcBytes; // tag + length + data + CRC
    } else {
      // For non-keyframes, store deltas
      encoder.encodeFrame(frame, deltas);
      
      // Convert deltas to bytes
      let deltaBytes = new Uint8Array(deltas.length * 2);
      for (let j = 0; j < deltas.length; j++) {
        deltaBytes[j*2] = deltas[j] & 0xFF;
        deltaBytes[j*2 + 1] = (deltas[j] >> 8) & 0xFF;
      }
      
      rawSize += deltaBytes.length;
      
      // Compress and write
      const compressed = simulateCompression(deltaBytes, compressionLevel);
      
      // Calculate and add header size
      const tag = BAND_MICRO;
      const lengthBytes = encodeLEB128(compressed.length);
      const crcBytes = 4; // 4 bytes for CRC32
      
      compressedSize += 1 + lengthBytes.length + compressed.length + crcBytes; // tag + length + data + CRC
    }
  }
  
  // Add END marker
  compressedSize += 4; // tag + 3 bytes of zero length
  
  return {
    numFrames,
    numOscillators,
    fps,
    keyframeInterval,
    compressionLevel,
    rawSize,
    compressedSize,
    compressionRatio: rawSize / compressedSize,
    bytesPerFrame: compressedSize / numFrames,
    
    // Estimated storage for various durations
    estimatedStorage: {
      oneMinute: (60 * compressedSize / numFrames * fps) / 1024, // KB
      tenMinutes: (600 * compressedSize / numFrames * fps) / 1024, // KB
      oneHour: (3600 * compressedSize / numFrames * fps) / (1024 * 1024) // MB
    }
  };
}

/**
 * Run the prototype benchmark and print results
 */
function runPrototypeBenchmark() {
  console.log("ψ-Trajectory PSIARC File Format Prototype");
  console.log("=========================================");
  
  // Test with parameters from specification
  const results = createPrototypeArchive({
    numFrames: 1000,         // 1000 frames
    numOscillators: 15,      // 15 oscillators
    fps: 60,                 // 60 fps
    keyframeInterval: 300,   // Keyframe every 5 seconds (300 frames at 60fps)
    compressionLevel: 22     // Zstd compression level
  });
  
  console.log("\nCompression Results:");
  console.log(`Raw Data Size: ${results.rawSize} bytes`);
  console.log(`Compressed Size: ${results.compressedSize} bytes`);
  console.log(`Compression Ratio: ${results.compressionRatio.toFixed(2)}x`);
  console.log(`Bytes per Frame: ${results.bytesPerFrame.toFixed(2)}`);
  
  console.log("\nEstimated Storage Requirements:");
  console.log(`1 minute: ${results.estimatedStorage.oneMinute.toFixed(2)} KB`);
  console.log(`10 minutes: ${results.estimatedStorage.tenMinutes.toFixed(2)} KB`);
  console.log(`1 hour: ${results.estimatedStorage.oneHour.toFixed(2)} MB`);
  
  console.log("\nDelta Encoding Edge Case Validation:");
  validateDeltaEdgeCases();
  
  return results;
}

/**
 * Validate delta encoding/decoding for edge cases
 * Ensures proper handling of phase wrapping
 */
function validateDeltaEdgeCases() {
  const numChannels = 1;
  const encoder = new DeltaEncoder(numChannels);
  const decoder = new DeltaDecoder(numChannels);
  
  const testCases = [
    // Test regular cases
    [0, 100],
    [100, 0],
    [0, -100],
    [-100, 0],
    [100, 200],
    [-100, -200],
    
    // Test wrap-around cases
    [32767, -32768],  // Max positive to max negative (wrap forward)
    [-32768, 32767],  // Max negative to max positive (wrap backward)
    [32760, -32760],  // Near max wrap
    [0, 32767],       // Zero to max
    [0, -32768],      // Zero to min
    
    // Test edge cases mentioned in spec
    [0, 65530],       // Should handle via wrapping
    [32767, -32767]   // Near-symmetric wrap
  ];
  
  console.log("Delta Encoding Edge Cases:");
  console.log("---------------------------");
  console.log("  Original   ->   Delta   ->   Decoded   |   Result");
  console.log("--------------------------------------------------------");
  
  let allPassed = true;
  
  for (const [prev, curr] of testCases) {
    const inputs = new Int16Array([prev]);
    const currValues = new Int16Array([curr]);
    const deltas = new Int16Array(1);
    const decoded = new Int16Array(1);
    
    // Encode
    encoder.setInitialValues(inputs);
    encoder.encodeFrame(currValues, deltas);
    
    // Decode
    decoder.setKeyframe(inputs);
    decoder.applyDeltas(deltas, decoded);
    
    const passed = decoded[0] === curr;
    allPassed = allPassed && passed;
    
    console.log(`  ${prev.toString().padStart(8)} -> ${deltas[0].toString().padStart(8)} -> ${decoded[0].toString().padStart(8)}   |   ${passed ? 'PASS' : 'FAIL'}`);
  }
  
  console.log("--------------------------------------------------------");
  console.log(`Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  return allPassed;
}

// Export functions for use in other modules
module.exports = {
  createPrototypeArchive,
  runPrototypeBenchmark,
  validateDeltaEdgeCases,
  // Classes
  DeltaEncoder,
  DeltaDecoder,
  // Constants
  BAND_MICRO,
  BAND_MESO,
  BAND_MACRO,
  BAND_AUDIO_PCM,
  BAND_END,
  KEYFRAME_MARKER
};
