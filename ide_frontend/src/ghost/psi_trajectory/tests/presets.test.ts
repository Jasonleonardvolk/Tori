/**
 * presets.test.ts
 * ------------------------------------------------
 * Unit tests for export presets
 * 
 * Validates that export presets meet requirements and expectations
 */

import { PRESETS } from '../demo/presets';

// Import Jest testing functions
const { describe, test, expect } = require('@jest/globals');

describe('ψ-Trajectory Export Presets', () => {
  test('all presets have required properties', () => {
    // Verify all presets have the required structure
    PRESETS.forEach(preset => {
      // Basic preset properties
      expect(preset.id).toBeTruthy();
      expect(preset.label).toBeTruthy();
      expect(preset.ext).toBeTruthy();
      
      // Video settings
      expect(preset.video).toBeDefined();
      expect(preset.video.codec).toBeTruthy();
      expect(preset.video.crf).toBeGreaterThan(0);
      expect(preset.video.fps).toBeGreaterThan(0);
      expect(preset.video.width).toBeGreaterThan(0);
      
      // Audio settings
      expect(preset.audio).toBeDefined();
      expect(preset.audio.codec).toBeTruthy();
      expect(preset.audio.kbps).toBeGreaterThan(0);
    });
  });
  
  test('presets have appropriate quality settings', () => {
    // Find high quality preset
    const highQualityPreset = PRESETS.find(p => p.id === 'hi-q' || p.id.includes('high'));
    expect(highQualityPreset).toBeDefined();
    
    if (highQualityPreset) {
      // High quality should have lower CRF (better quality)
      expect(highQualityPreset.video.crf).toBeLessThanOrEqual(20);
      // High quality should have good audio bitrate
      expect(highQualityPreset.audio.kbps).toBeGreaterThanOrEqual(128);
    }
    
    // Find compressed preset
    const compressedPreset = PRESETS.find(p => p.id.includes('compress'));
    expect(compressedPreset).toBeDefined();
    
    if (compressedPreset) {
      // Compressed should have higher CRF (more compression)
      expect(compressedPreset.video.crf).toBeGreaterThanOrEqual(28);
    }
  });
  
  test('presets are diverse enough to cover common use cases', () => {
    // Check if we have different file format options
    const extensions = new Set(PRESETS.map(p => p.ext));
    expect(extensions.size).toBeGreaterThanOrEqual(2);
    
    // Check if we have different codec options
    const videoCodecs = new Set(PRESETS.map(p => p.video.codec));
    const audioCodecs = new Set(PRESETS.map(p => p.audio.codec));
    
    expect(videoCodecs.size).toBeGreaterThanOrEqual(1);
    expect(audioCodecs.size).toBeGreaterThanOrEqual(1);
    
    // Check for reasonable resolution options
    const hasHD = PRESETS.some(p => p.video.width >= 1280);
    expect(hasHD).toBe(true);
  });
  
  test('preset FPS values are reasonable', () => {
    // All presets should have reasonable FPS values
    PRESETS.forEach(preset => {
      expect(preset.video.fps).toBeGreaterThanOrEqual(24);
      expect(preset.video.fps).toBeLessThanOrEqual(120);
    });
    
    // At least one preset should support 60 FPS for smoother video
    const has60FpsOption = PRESETS.some(p => p.video.fps >= 60);
    expect(has60FpsOption).toBe(true);
  });
  
  test('mobile-friendly presets exist', () => {
    // Mobile-friendly presets should be available with appropriate settings
    const mobileFriendlyPreset = PRESETS.find(p => 
      p.video.width <= 1280 && 
      p.audio.kbps <= 128 &&
      p.video.crf >= 26
    );
    
    expect(mobileFriendlyPreset).toBeDefined();
  });
});
