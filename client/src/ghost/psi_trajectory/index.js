/**
 * ψ-Trajectory Memory Subsystem - Main Entry Point
 * 
 * This file exports the core components of the ψ-Trajectory system for use in other modules.
 * These components work together to capture, store, replay, and explain oscillator-based
 * animations and audio for the TORI/ALAN system.
 */

// PSIARC File Format
const psiarc = require('./psiarc_prototype');

// Lock-Free Queue and Capture Pipeline
const capture = require('./lock_free_queue');

// ELFIN Binding System
const binding = require('./bind_to_elfin');

// Demo and Testing
const demo = require('./psi_archive_demo');

/**
 * Main export object containing all components of the ψ-Trajectory system
 */
module.exports = {
  /**
   * File format related components for storing oscillator trajectories
   */
  fileFormat: {
    // Core format operations
    createArchive: psiarc.createPrototypeArchive,
    runBenchmark: psiarc.runPrototypeBenchmark,
    validateDeltas: psiarc.validateDeltaEdgeCases,
    
    // Tag constants
    BAND_MICRO: psiarc.BAND_MICRO,
    BAND_MESO: psiarc.BAND_MESO,
    BAND_MACRO: psiarc.BAND_MACRO,
    BAND_AUDIO_PCM: psiarc.BAND_AUDIO_PCM,
    BAND_END: psiarc.BAND_END,
    KEYFRAME_MARKER: psiarc.KEYFRAME_MARKER
  },
  
  /**
   * Real-time capture components for oscillator state
   */
  capture: {
    // Core capture classes
    LockFreeQueue: capture.LockFreeQueue,
    FrameDataFactory: capture.FrameDataFactory,
    OscillatorCapturePipeline: capture.OscillatorCapturePipeline,
    
    // Testing utility
    runQueueBenchmark: capture.runQueueBenchmark
  },
  
  /**
   * ELFIN binding system for connecting oscillator patterns to symbolic representations
   */
  binding: {
    // Main interface
    ConceptGraph: binding.ConceptGraph,
    
    // Core operations
    initialize: binding.initializeElfinBinding,
    tryBindToElfin: binding.tryBindToElfin,
    onAttractorPromoted: binding.onAttractorPromoted,
    
    // Testing utility
    validateBinding: binding.validateBindingWithMockCase
  },
  
  /**
   * Demo and simulation components
   */
  demo: {
    runDemo: demo.runPsiArchiveDemo,
    OscillatorSimulator: demo.OscillatorSimulator
  },
  
  /**
   * Version information
   */
  version: {
    major: 0,
    minor: 1,
    patch: 0,
    toString: function() {
      return `${this.major}.${this.minor}.${this.patch}`;
    }
  },
  
  /**
   * Utility function to initialize the entire ψ-Trajectory system
   * @param {Object} options - Configuration options
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  initialize: async function(options = {}) {
    console.log(`Initializing ψ-Trajectory system v${this.version}`);
    
    const {
      elfinSymbolsPath = '/elfin_symbols.json',
      oscillatorCount = 15,
      queueCapacity = 256,
      keyframeInterval = 300
    } = options;
    
    try {
      // Initialize ELFIN binding
      await binding.initializeElfinBinding(elfinSymbolsPath);
      
      // Create and return the capture pipeline (most commonly needed component)
      const pipeline = new capture.OscillatorCapturePipeline({
        oscillatorCount,
        queueCapacity,
        keyframeInterval
      });
      
      console.log(`ψ-Trajectory system initialized successfully`);
      return pipeline;
    } catch (error) {
      console.error(`Failed to initialize ψ-Trajectory system:`, error);
      throw error;
    }
  }
};
