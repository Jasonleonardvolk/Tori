//! ψ-Trajectory Memory Subsystem - Rust Implementation
//!
//! This is the main library entry point for the Rust implementation of the
//! ψ-Trajectory Memory Subsystem. It provides both native Rust APIs and
//! WebAssembly bindings for JavaScript integration.

mod psi_recorder;
mod psi_reader;
pub mod psi_sync_monitor;

use psi_recorder::{PsiRecorder, RecorderConfig, RecorderStats};
use psi_reader::{PsiArchiveReader, PsiPlayer, Frame, PlaybackStats};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

// Re-export for public use
pub use psi_recorder::{
    BAND_MICRO, BAND_MESO, BAND_MACRO, BAND_AUDIO_PCM, BAND_END, KEYFRAME_MARKER,
};

// Global instances for JS bindings
static RECORDER_INSTANCE: Mutex<Option<Arc<Mutex<PsiRecorder>>>> = Mutex::new(None);
static PLAYER_INSTANCE: Mutex<Option<Arc<Mutex<PsiPlayer>>>> = Mutex::new(None);

// Declare lazy_static for internal use
#[macro_use]
extern crate lazy_static;

/// Initialize the ψ-Trajectory system with the given configuration
///
/// # Arguments
///
/// * `oscillator_count` - Number of oscillators to record
/// * `emotion_dimensions` - Number of emotion dimensions
/// * `queue_capacity` - Capacity of the frame queue
/// * `keyframe_interval` - Interval for generating keyframes (in frames)
/// * `output_dir` - Base directory for storing archives
/// * `compression_level` - Compression level (1-22)
/// * `flush_interval` - Interval for flushing data to disk (in frames)
/// * `meso_decimation` - Take every Nth micro frame for meso band
/// * `macro_event_only` - Only record macro band on significant events
/// * `elfin_symbols_path` - Path to ELFIN symbols JSON file (optional)
///
/// # Returns
///
/// * `true` if initialization was successful, `false` otherwise
pub fn initialize(
    oscillator_count: usize,
    emotion_dimensions: usize,
    queue_capacity: usize,
    keyframe_interval: u64,
    output_dir: &str,
    compression_level: i32,
    flush_interval: u64,
    meso_decimation: u64,
    macro_event_only: bool,
    elfin_symbols_path: Option<&str>,
) -> bool {
    // Create recorder configuration
    let config = RecorderConfig {
        oscillator_count,
        emotion_dimensions,
        queue_capacity,
        keyframe_interval,
        output_dir: PathBuf::from(output_dir),
        compression_level,
        flush_interval,
        meso_decimation,
        macro_event_only,
    };
    
    // Create recorder
    let recorder = PsiRecorder::new(config);
    
    // Store in global instance
    {
        let mut global = RECORDER_INSTANCE.lock().unwrap();
        *global = Some(Arc::new(Mutex::new(recorder)));
    }
    
    // Load ELFIN symbols if provided
    if let Some(path) = elfin_symbols_path {
        match psi_sync_monitor::ConceptGraph::global().import_elfin(path) {
            Ok(count) => {
                println!("Loaded {} ELFIN symbols", count);
            }
            Err(e) => {
                eprintln!("Failed to load ELFIN symbols: {:?}", e);
            }
        }
    }
    
    true
}

/// Initialize a player for a specific archive
///
/// # Arguments
///
/// * `archive_path` - Path to the archive file
/// * `oscillator_count` - Number of oscillators in the archive
/// * `emotion_dimensions` - Number of emotion dimensions in the archive
///
/// # Returns
///
/// * `true` if initialization was successful, `false` otherwise
pub fn initialize_player(
    archive_path: &str,
    oscillator_count: usize,
    emotion_dimensions: usize,
) -> bool {
    // Create reader
    let mut reader = PsiArchiveReader::new(archive_path, oscillator_count, emotion_dimensions);
    
    // Open the archive
    if let Err(e) = reader.open() {
        eprintln!("Failed to open archive: {:?}", e);
        return false;
    }
    
    // Create player
    let player = PsiPlayer::new(Arc::new(reader));
    
    // Store in global instance
    let mut global = PLAYER_INSTANCE.lock().unwrap();
    *global = Some(Arc::new(Mutex::new(player)));
    
    true
}

/// Start recording a new session
///
/// # Arguments
///
/// * `session_id` - Identifier for this session
///
/// # Returns
///
/// * `true` if recording started successfully, `false` otherwise
pub fn start_recording(session_id: &str) -> bool {
    let global = RECORDER_INSTANCE.lock().unwrap();
    
    if let Some(recorder) = &*global {
        let mut recorder = recorder.lock().unwrap();
        match recorder.start_recording(session_id) {
            Ok(_) => true,
            Err(e) => {
                eprintln!("Error starting recording: {}", e);
                false
            }
        }
    } else {
        eprintln!("Recorder not initialized");
        false
    }
}

/// Play the currently loaded archive
///
/// # Returns
///
/// * `true` if playback started successfully, `false` otherwise
pub fn play() -> bool {
    let global = PLAYER_INSTANCE.lock().unwrap();
    
    if let Some(player) = &*global {
        let mut player = player.lock().unwrap();
        player.play();
        true
    } else {
        eprintln!("Player not initialized");
        false
    }
}

/// Pause playback
///
/// # Returns
///
/// * `true` if pause was successful, `false` otherwise
pub fn pause() -> bool {
    let global = PLAYER_INSTANCE.lock().unwrap();
    
    if let Some(player) = &*global {
        let mut player = player.lock().unwrap();
        player.pause();
        true
    } else {
        eprintln!("Player not initialized");
        false
    }
}

/// Seek to a specific frame
///
/// # Arguments
///
/// * `frame` - Frame index to seek to
///
/// # Returns
///
/// * `true` if seek was successful, `false` otherwise
pub fn seek(frame: u64) -> bool {
    let global = PLAYER_INSTANCE.lock().unwrap();
    
    if let Some(player) = &*global {
        let mut player = player.lock().unwrap();
        match player.seek(frame) {
            Ok(_) => true,
            Err(e) => {
                eprintln!("Error seeking: {:?}", e);
                false
            }
        }
    } else {
        eprintln!("Player not initialized");
        false
    }
}

/// Update the player state
///
/// This should be called regularly to deliver frames and
/// maintain accurate playback timing.
///
/// # Returns
///
/// * `true` if update was successful, `false` otherwise
pub fn update_player() -> bool {
    let global = PLAYER_INSTANCE.lock().unwrap();
    
    if let Some(player) = &*global {
        let mut player = player.lock().unwrap();
        match player.update() {
            Ok(_) => true,
            Err(e) => {
                eprintln!("Error updating player: {:?}", e);
                false
            }
        }
    } else {
        eprintln!("Player not initialized");
        false
    }
}

/// Set frame delivery callback
///
/// # Arguments
///
/// * `callback` - Function to call when a frame is ready for delivery
///
/// # Returns
///
/// * `true` if callback was set successfully, `false` otherwise
pub fn set_frame_callback<F>(callback: F) -> bool
where
    F: Fn(&Frame) + Send + Sync + 'static,
{
    let global = PLAYER_INSTANCE.lock().unwrap();
    
    if let Some(player) = &*global {
        let mut player = player.lock().unwrap();
        player.set_frame_callback(callback);
        true
    } else {
        eprintln!("Player not initialized");
        false
    }
}

/// Stop the current recording session
///
/// # Returns
///
/// * `true` if recording stopped successfully, `false` otherwise
pub fn stop_recording() -> bool {
    let global = RECORDER_INSTANCE.lock().unwrap();
    
    if let Some(recorder) = &*global {
        let mut recorder = recorder.lock().unwrap();
        match recorder.stop_recording() {
            Ok(_) => true,
            Err(e) => {
                eprintln!("Error stopping recording: {}", e);
                false
            }
        }
    } else {
        eprintln!("Recorder not initialized");
        false
    }
}

/// Capture a frame from the current oscillator state
///
/// # Arguments
///
/// * `phases` - Oscillator phases in the range [-π, π]
/// * `amplitudes` - Oscillator amplitudes in the range [0, 1]
/// * `emotions` - Emotion vector in the range [0, 1]
///
/// # Returns
///
/// * `true` if the frame was successfully captured, `false` otherwise
pub fn capture_frame(
    phases: &[f32],
    amplitudes: &[f32],
    emotions: &[f32],
) -> bool {
    let global = RECORDER_INSTANCE.lock().unwrap();
    
    if let Some(recorder) = &*global {
        let recorder = recorder.lock().unwrap();
        recorder.capture_frame(phases, amplitudes, emotions)
    } else {
        eprintln!("Recorder not initialized");
        false
    }
}

/// Get recorder statistics
///
/// # Returns
///
/// * Statistics about the recorder
pub fn get_recorder_stats() -> RecorderStats {
    let global = RECORDER_INSTANCE.lock().unwrap();
    
    if let Some(recorder) = &*global {
        let recorder = recorder.lock().unwrap();
        recorder.get_stats()
    } else {
        eprintln!("Recorder not initialized");
        RecorderStats::default()
    }
}

/// Get player statistics
///
/// # Returns
///
/// * Statistics about the player
pub fn get_player_stats() -> PlaybackStats {
    let global = PLAYER_INSTANCE.lock().unwrap();
    
    if let Some(player) = &*global {
        let player = player.lock().unwrap();
        player.get_stats()
    } else {
        eprintln!("Player not initialized");
        PlaybackStats {
            position: 0,
            playing: false,
            buffer_size: 0,
            rate: 1.0,
        }
    }
}

/// Process an oscillator pattern and try to bind it to an ELFIN symbol
///
/// This should be called when a stable oscillator pattern is detected.
///
/// # Arguments
///
/// * `node_id` - Identifier for the concept
/// * `signature` - Oscillator signature (typically spectral decomposition)
///
/// # Returns
///
/// * `true` if the pattern was successfully bound, `false` otherwise
pub fn process_oscillator_pattern(node_id: u64, signature: &[f32]) -> bool {
    psi_sync_monitor::on_attractor_promoted(node_id, signature);
    
    // Return whether binding was successful
    psi_sync_monitor::try_bind_to_elfin(node_id, signature)
}

// WASM bindings (optional feature)
#[cfg(feature = "wasm")]
mod wasm {
    use super::*;
    use wasm_bindgen::prelude::*;
    use js_sys::{Array, Float32Array};
    
    #[wasm_bindgen]
    pub struct WasmRecorderStats {
        frames_captured: u64,
        frames_processed: u64,
        frames_dropped: u64,
        max_capture_time_us: u64,
        avg_capture_time_us: f64,
        max_processing_time_us: u64,
        avg_processing_time_us: f64,
        raw_bytes: u64,
        compressed_bytes: u64,
        keyframes: u64,
    }
    
    #[wasm_bindgen]
    pub struct WasmPlaybackStats {
        position: u64,
        playing: bool,
        buffer_size: usize,
        rate: f32,
    }
    
    #[wasm_bindgen]
    impl WasmRecorderStats {
        #[wasm_bindgen(getter)]
        pub fn frames_captured(&self) -> u64 {
            self.frames_captured
        }
        
        #[wasm_bindgen(getter)]
        pub fn frames_processed(&self) -> u64 {
            self.frames_processed
        }
        
        #[wasm_bindgen(getter)]
        pub fn frames_dropped(&self) -> u64 {
            self.frames_dropped
        }
        
        #[wasm_bindgen(getter)]
        pub fn max_capture_time_us(&self) -> u64 {
            self.max_capture_time_us
        }
        
        #[wasm_bindgen(getter)]
        pub fn avg_capture_time_us(&self) -> f64 {
            self.avg_capture_time_us
        }
        
        #[wasm_bindgen(getter)]
        pub fn max_processing_time_us(&self) -> u64 {
            self.max_processing_time_us
        }
        
        #[wasm_bindgen(getter)]
        pub fn avg_processing_time_us(&self) -> f64 {
            self.avg_processing_time_us
        }
        
        #[wasm_bindgen(getter)]
        pub fn raw_bytes(&self) -> u64 {
            self.raw_bytes
        }
        
        #[wasm_bindgen(getter)]
        pub fn compressed_bytes(&self) -> u64 {
            self.compressed_bytes
        }
        
        #[wasm_bindgen(getter)]
        pub fn keyframes(&self) -> u64 {
            self.keyframes
        }
        
        #[wasm_bindgen(getter)]
        pub fn compression_ratio(&self) -> f64 {
            if self.compressed_bytes == 0 {
                0.0
            } else {
                self.raw_bytes as f64 / self.compressed_bytes as f64
            }
        }
    }
    
    #[wasm_bindgen]
    impl WasmPlaybackStats {
        #[wasm_bindgen(getter)]
        pub fn position(&self) -> u64 {
            self.position
        }
        
        #[wasm_bindgen(getter)]
        pub fn playing(&self) -> bool {
            self.playing
        }
        
        #[wasm_bindgen(getter)]
        pub fn buffer_size(&self) -> usize {
            self.buffer_size
        }
        
        #[wasm_bindgen(getter)]
        pub fn rate(&self) -> f32 {
            self.rate
        }
    }
    
    impl From<RecorderStats> for WasmRecorderStats {
        fn from(stats: RecorderStats) -> Self {
            Self {
                frames_captured: stats.frames_captured,
                frames_processed: stats.frames_processed,
                frames_dropped: stats.frames_dropped,
                max_capture_time_us: stats.max_capture_time_us,
                avg_capture_time_us: stats.avg_capture_time_us,
                max_processing_time_us: stats.max_processing_time_us,
                avg_processing_time_us: stats.avg_processing_time_us,
                raw_bytes: stats.raw_bytes,
                compressed_bytes: stats.compressed_bytes,
                keyframes: stats.keyframes,
            }
        }
    }
    
    impl From<PlaybackStats> for WasmPlaybackStats {
        fn from(stats: PlaybackStats) -> Self {
            Self {
                position: stats.position,
                playing: stats.playing,
                buffer_size: stats.buffer_size,
                rate: stats.rate,
            }
        }
    }
    
    #[wasm_bindgen(js_name = initialize)]
    pub fn wasm_initialize(
        oscillator_count: usize,
        emotion_dimensions: usize,
        queue_capacity: usize,
        keyframe_interval: u64,
        output_dir: &str,
        compression_level: i32,
        flush_interval: u64,
        meso_decimation: u64,
        macro_event_only: bool,
        elfin_symbols_path: Option<String>,
    ) -> bool {
        initialize(
            oscillator_count,
            emotion_dimensions,
            queue_capacity,
            keyframe_interval,
            output_dir,
            compression_level,
            flush_interval,
            meso_decimation,
            macro_event_only,
            elfin_symbols_path.as_deref(),
        )
    }
    
    #[wasm_bindgen(js_name = initializePlayer)]
    pub fn wasm_initialize_player(
        archive_path: &str,
        oscillator_count: usize,
        emotion_dimensions: usize,
    ) -> bool {
        initialize_player(archive_path, oscillator_count, emotion_dimensions)
    }
    
    #[wasm_bindgen(js_name = startRecording)]
    pub fn wasm_start_recording(session_id: &str) -> bool {
        start_recording(session_id)
    }
    
    #[wasm_bindgen(js_name = stopRecording)]
    pub fn wasm_stop_recording() -> bool {
        stop_recording()
    }
    
    #[wasm_bindgen(js_name = captureFrame)]
    pub fn wasm_capture_frame(
        phases: &Float32Array,
        amplitudes: &Float32Array,
        emotions: &Float32Array,
    ) -> bool {
        // Convert Float32Array to Vec<f32>
        let phases_vec = get_float32_vec(phases);
        let amplitudes_vec = get_float32_vec(amplitudes);
        let emotions_vec = get_float32_vec(emotions);
        
        capture_frame(&phases_vec, &amplitudes_vec, &emotions_vec)
    }
    
    #[wasm_bindgen(js_name = play)]
    pub fn wasm_play() -> bool {
        play()
    }
    
    #[wasm_bindgen(js_name = pause)]
    pub fn wasm_pause() -> bool {
        pause()
    }
    
    #[wasm_bindgen(js_name = seek)]
    pub fn wasm_seek(frame: u64) -> bool {
        seek(frame)
    }
    
    #[wasm_bindgen(js_name = updatePlayer)]
    pub fn wasm_update_player() -> bool {
        update_player()
    }
    
    #[wasm_bindgen(js_name = getRecorderStats)]
    pub fn wasm_get_recorder_stats() -> WasmRecorderStats {
        get_recorder_stats().into()
    }
    
    #[wasm_bindgen(js_name = getPlayerStats)]
    pub fn wasm_get_player_stats() -> WasmPlaybackStats {
        get_player_stats().into()
    }
    
    #[wasm_bindgen(js_name = processOscillatorPattern)]
    pub fn wasm_process_oscillator_pattern(
        node_id: u64,
        signature: &Float32Array,
    ) -> bool {
        let signature_vec = get_float32_vec(signature);
        process_oscillator_pattern(node_id, &signature_vec)
    }
    
    // Helper function to convert Float32Array to Vec<f32>
    fn get_float32_vec(array: &Float32Array) -> Vec<f32> {
        let mut result = vec![0.0; array.length() as usize];
        array.copy_to(&mut result);
        result
    }
}
