//! ψ-Trajectory Recording Pipeline
//!
//! This module implements the Phase 2 recording pipeline for the ψ-Trajectory system.
//! It focuses on efficient, real-time capture of oscillator states with
//! minimal overhead and maximum reliability.

use std::fs::{File, OpenOptions};
use std::io::{self, BufWriter, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::thread;
use std::time::{Duration, Instant};
use crossbeam_queue::ArrayQueue;

/// Band type identifiers
pub const BAND_MICRO: u8 = 0x01;
pub const BAND_MESO: u8 = 0x02;
pub const BAND_MACRO: u8 = 0x03;
pub const BAND_AUDIO_PCM: u8 = 0xFE;
pub const BAND_END: u8 = 0xFF;

/// Keyframe marker flag
pub const KEYFRAME_MARKER: u8 = 0x80;

/// Frame data for a single oscillator snapshot
#[derive(Clone)]
pub struct FrameData {
    /// Frame timestamp in milliseconds
    pub timestamp_ms: u64,
    
    /// Frame index in the sequence
    pub frame_index: u64,
    
    /// Oscillator phases (one per oscillator)
    pub phases: Vec<i16>,
    
    /// Oscillator amplitudes (one per oscillator)
    pub amplitudes: Vec<i16>,
    
    /// Emotion vector (typically 8 dimensions)
    pub emotions: Vec<i16>,
    
    /// Whether this is a keyframe
    pub is_keyframe: bool,
    
    /// Band type (micro, meso, macro)
    pub band: u8,
    
    /// Whether this frame has been processed
    pub processed: bool,
}

impl FrameData {
    /// Create a new frame data with pre-allocated buffers
    pub fn new(oscillator_count: usize, emotion_dimensions: usize) -> Self {
        Self {
            timestamp_ms: 0,
            frame_index: 0,
            phases: vec![0; oscillator_count],
            amplitudes: vec![0; oscillator_count],
            emotions: vec![0; emotion_dimensions],
            is_keyframe: false,
            band: BAND_MICRO,
            processed: false,
        }
    }
    
    /// Reset the frame data for reuse
    pub fn reset(&mut self) {
        self.timestamp_ms = 0;
        self.frame_index = 0;
        for phase in &mut self.phases {
            *phase = 0;
        }
        for amplitude in &mut self.amplitudes {
            *amplitude = 0;
        }
        for emotion in &mut self.emotions {
            *emotion = 0;
        }
        self.is_keyframe = false;
        self.band = BAND_MICRO;
        self.processed = false;
    }
}

/// Statistics for the recorder
#[derive(Default, Clone)]
pub struct RecorderStats {
    /// Total frames captured
    pub frames_captured: u64,
    
    /// Total frames processed
    pub frames_processed: u64,
    
    /// Total frames dropped (queue full)
    pub frames_dropped: u64,
    
    /// Maximum processing time in microseconds
    pub max_capture_time_us: u64,
    
    /// Average capture time in microseconds
    pub avg_capture_time_us: f64,
    
    /// Maximum processing time in microseconds
    pub max_processing_time_us: u64,
    
    /// Average processing time in microseconds
    pub avg_processing_time_us: f64,
    
    /// Size of raw data before compression
    pub raw_bytes: u64,
    
    /// Size of compressed data
    pub compressed_bytes: u64,
    
    /// Number of keyframes generated
    pub keyframes: u64,
}

/// Configuration for the recorder
pub struct RecorderConfig {
    /// Number of oscillators to record
    pub oscillator_count: usize,
    
    /// Number of emotion dimensions
    pub emotion_dimensions: usize,
    
    /// Capacity of the frame queue
    pub queue_capacity: usize,
    
    /// Interval for generating keyframes (in frames)
    pub keyframe_interval: u64,
    
    /// Base directory for storing archives
    pub output_dir: PathBuf,
    
    /// Compression level (1-22)
    pub compression_level: i32,
    
    /// Interval for flushing data to disk (in frames)
    pub flush_interval: u64,
    
    /// Band-related settings
    pub meso_decimation: u64,  // Take every Nth micro frame for meso band
    pub macro_event_only: bool, // Only record macro band on significant events
}

impl Default for RecorderConfig {
    fn default() -> Self {
        Self {
            oscillator_count: 15,
            emotion_dimensions: 8,
            queue_capacity: 256,
            keyframe_interval: 300,
            output_dir: PathBuf::from("./output"),
            compression_level: 22,
            flush_interval: 300, // Flush at keyframes
            meso_decimation: 6,  // 60fps → 10Hz
            macro_event_only: true,
        }
    }
}

/// The main recorder for ψ-trajectory capture
pub struct PsiRecorder {
    /// Configuration
    config: RecorderConfig,
    
    /// Frame queue for passing frames from capture to processing thread
    frame_queue: Arc<ArrayQueue<FrameData>>,
    
    /// Frame pool for zero-allocation operation
    frame_pool: Arc<ArrayQueue<FrameData>>,
    
    /// Thread handle for the processing thread
    processing_thread: Option<thread::JoinHandle<()>>,
    
    /// Flag to indicate if recording is active
    is_recording: Arc<AtomicBool>,
    
    /// Current frame index
    current_frame: AtomicUsize,
    
    /// Current session ID
    session_id: Arc<Mutex<String>>,
    
    /// Statistics
    stats: Arc<Mutex<RecorderStats>>,
    
    /// Last capture time for performance tracking
    last_capture_time: Mutex<Instant>,
    
    /// Delta encoder for micro band
    delta_encoder: Arc<Mutex<DeltaEncoder>>,
}

/// Delta encoder for frame compression
pub struct DeltaEncoder {
    /// Last values for each oscillator
    last_phases: Vec<i16>,
    
    /// Last amplitudes for each oscillator
    last_amplitudes: Vec<i16>,
    
    /// Last emotions
    last_emotions: Vec<i16>,
}

impl DeltaEncoder {
    /// Create a new delta encoder
    pub fn new(oscillator_count: usize, emotion_dimensions: usize) -> Self {
        Self {
            last_phases: vec![0; oscillator_count],
            last_amplitudes: vec![0; oscillator_count],
            last_emotions: vec![0; emotion_dimensions],
        }
    }
    
    /// Reset the encoder state
    pub fn reset(&mut self) {
        for phase in &mut self.last_phases {
            *phase = 0;
        }
        for amplitude in &mut self.last_amplitudes {
            *amplitude = 0;
        }
        for emotion in &mut self.last_emotions {
            *emotion = 0;
        }
    }
    
    /// Encode phases as deltas
    pub fn encode_phases(&mut self, phases: &[i16], deltas: &mut [i16]) {
        for (i, &phase) in phases.iter().enumerate() {
            deltas[i] = Self::encode_phase_delta(self.last_phases[i], phase);
            self.last_phases[i] = phase;
        }
    }
    
    /// Encode amplitudes as deltas
    pub fn encode_amplitudes(&mut self, amplitudes: &[i16], deltas: &mut [i16]) {
        for (i, &amplitude) in amplitudes.iter().enumerate() {
            deltas[i] = amplitude - self.last_amplitudes[i];
            self.last_amplitudes[i] = amplitude;
        }
    }
    
    /// Encode emotions as deltas
    pub fn encode_emotions(&mut self, emotions: &[i16], deltas: &mut [i16]) {
        for (i, &emotion) in emotions.iter().enumerate() {
            deltas[i] = emotion - self.last_emotions[i];
            self.last_emotions[i] = emotion;
        }
    }
    
    /// Calculate delta with proper phase wrap handling
    /// Implements Δθ = ((θ₂-θ₁+π) mod 2π)−π in fixed-point
    fn encode_phase_delta(prev: i16, curr: i16) -> i16 {
        // Compute raw delta
        let raw_delta = curr as i32 - prev as i32;
        
        // Handle wrap-around for phase values
        let wrapped_delta = if raw_delta > 32767 {
            raw_delta - 65536
        } else if raw_delta <= -32768 {
            raw_delta + 65536
        } else {
            raw_delta
        };
        
        wrapped_delta as i16
    }
}

/// Archive writer for PSIARC files
pub struct PsiArchiveWriter {
    /// File writer
    file: Option<BufWriter<File>>,
    
    /// Temporary path used during writing
    temp_path: PathBuf,
    
    /// Final path for the file
    final_path: PathBuf,
    
    /// Whether file header has been written
    started: bool,
}

impl PsiArchiveWriter {
    /// Create a new archive writer
    pub fn new<P: AsRef<Path>>(path: P) -> Self {
        let final_path = path.as_ref().to_path_buf();
        let temp_path = final_path.with_extension("tmp");
        
        Self {
            file: None,
            temp_path,
            final_path,
            started: false,
        }
    }
    
    /// Start writing the archive
    pub fn start(&mut self, start_time_ms: u64) -> io::Result<()> {
        // Create temp file
        let file = OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(&self.temp_path)?;
        
        // Use unbuffered I/O for better crash safety
        // Note: In real implementation we'd use fs_set_fd_internal on Unix
        // or FILE_FLAG_NO_BUFFERING on Windows
        
        let mut writer = BufWriter::new(file);
        
        // Write magic bytes "ΨARC" (UTF-8 encoded)
        writer.write_all(b"\xCE\xA8ARC")?;
        
        // Write version (uint16, little endian)
        writer.write_all(&[1, 0])?;
        
        // Write start timestamp (uint64, little endian)
        writer.write_all(&start_time_ms.to_le_bytes())?;
        
        // Calculate header CRC (first 14 bytes)
        let mut hasher = crc32fast::Hasher::new();
        hasher.update(b"\xCE\xA8ARC");
        hasher.update(&[1, 0]);
        hasher.update(&start_time_ms.to_le_bytes());
        
        let crc = hasher.finalize();
        
        // Write header CRC32 (uint32, little endian)
        writer.write_all(&crc.to_le_bytes())?;
        
        self.file = Some(writer);
        self.started = true;
        
        Ok(())
    }
    
    /// Write a data chunk to the archive
    pub fn write_chunk(&mut self, band_type: u8, is_keyframe: bool, data: &[u8]) -> io::Result<()> {
        if !self.started {
            return Err(io::Error::new(io::ErrorKind::Other, "Archive not started"));
        }
        
        let file = self.file.as_mut().unwrap();
        
        // Determine tag, including keyframe marker if needed
        let tag = if is_keyframe {
            band_type | KEYFRAME_MARKER
        } else {
            band_type
        };
        
        // Write tag
        file.write_all(&[tag])?;
        
        // Write length as LEB128
        self.write_leb128(file, data.len() as u32)?;
        
        // Write data
        file.write_all(data)?;
        
        // Calculate and write CRC32
        let mut hasher = crc32fast::Hasher::new();
        hasher.update(data);
        let crc = hasher.finalize();
        file.write_all(&crc.to_le_bytes())?;
        
        Ok(())
    }
    
    /// Write LEB128 encoded integer
    fn write_leb128<W: Write>(&self, writer: &mut W, mut value: u32) -> io::Result<()> {
        loop {
            let mut byte = (value & 0x7f) as u8;
            value >>= 7;
            
            if value != 0 {
                byte |= 0x80; // Set high bit to indicate more bytes follow
            }
            
            writer.write_all(&[byte])?;
            
            if value == 0 {
                break;
            }
        }
        
        Ok(())
    }
    
    /// Flush the archive to disk
    pub fn flush(&mut self) -> io::Result<()> {
        if let Some(file) = &mut self.file {
            file.flush()?;
            
            // On Unix-like systems, we would also call fsync here
            // which is not directly available in std Rust
            // let fd = file.get_ref().as_raw_fd();
            // unsafe { libc::fsync(fd); }
        }
        
        Ok(())
    }
    
    /// Finish writing and close the archive
    pub fn finish(mut self) -> io::Result<()> {
        if !self.started {
            return Err(io::Error::new(io::ErrorKind::Other, "Archive not started"));
        }
        
        let file = self.file.as_mut().unwrap();
        
        // Write END marker
        file.write_all(&[BAND_END])?;
        self.write_leb128(file, 0)?;
        
        // Flush to disk
        file.flush()?;
        
        // Close file (by dropping BufWriter)
        drop(self.file.take());
        
        // Rename temp file to final file (atomic operation)
        std::fs::rename(&self.temp_path, &self.final_path)?;
        
        Ok(())
    }
}

impl PsiRecorder {
    /// Create a new recorder with the given configuration
    pub fn new(config: RecorderConfig) -> Self {
        // Create output directory if it doesn't exist
        std::fs::create_dir_all(&config.output_dir).unwrap_or_else(|e| {
            eprintln!("Warning: Could not create output directory: {}", e);
        });
        
        // Create frame queues
        let frame_queue = Arc::new(ArrayQueue::new(config.queue_capacity));
        let frame_pool = Arc::new(ArrayQueue::new(config.queue_capacity));
        
        // Pre-allocate frames in the pool
        for _ in 0..config.queue_capacity {
            let frame = FrameData::new(config.oscillator_count, config.emotion_dimensions);
            frame_pool.push(frame).unwrap_or_else(|_| {
                panic!("Failed to initialize frame pool");
            });
        }
        
        // Create delta encoder
        let delta_encoder = Arc::new(Mutex::new(
            DeltaEncoder::new(config.oscillator_count, config.emotion_dimensions)
        ));
        
        Self {
            config,
            frame_queue,
            frame_pool,
            processing_thread: None,
            is_recording: Arc::new(AtomicBool::new(false)),
            current_frame: AtomicUsize::new(0),
            session_id: Arc::new(Mutex::new(String::new())),
            stats: Arc::new(Mutex::new(RecorderStats::default())),
            last_capture_time: Mutex::new(Instant::now()),
            delta_encoder,
        }
    }
    
    /// Start recording a new session
    pub fn start_recording(&mut self, session_id: &str) -> Result<(), String> {
        if self.is_recording.load(Ordering::Acquire) {
            return Err("Recording already in progress".to_string());
        }
        
        // Reset state
        self.current_frame.store(0, Ordering::Release);
        *self.session_id.lock().unwrap() = session_id.to_string();
        *self.stats.lock().unwrap() = RecorderStats::default();
        *self.last_capture_time.lock().unwrap() = Instant::now();
        self.delta_encoder.lock().unwrap().reset();
        
        // Drain any frames in the queue back to the pool
        while let Some(frame) = self.frame_queue.pop() {
            let _ = self.frame_pool.push(frame);
        }
        
        // Set recording flag
        self.is_recording.store(true, Ordering::Release);
        
        // Start processing thread
        let frame_queue = self.frame_queue.clone();
        let frame_pool = self.frame_pool.clone();
        let is_recording = self.is_recording.clone();
        let session_id = self.session_id.clone();
        let stats = self.stats.clone();
        let delta_encoder = self.delta_encoder.clone();
        let config = self.config.clone();
        
        self.processing_thread = Some(thread::spawn(move || {
            // Set thread priority to below normal
            // This is platform specific and not directly available in Rust std
            // On Windows, we would use SetThreadPriority with THREAD_PRIORITY_BELOW_NORMAL
            // On Unix, we would use nice(1) or pthread_setschedparam
            
            let output_dir = config.output_dir.clone();
            let session_path = output_dir.join(format!("{}.psiarc", session_id.lock().unwrap()));
            
            // Create archive writer
            let mut writer = PsiArchiveWriter::new(&session_path);
            let start_time = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64;
            
            if let Err(e) = writer.start(start_time) {
                eprintln!("Error starting archive: {}", e);
                return;
            }
            
            let mut frame_index = 0;
            let mut last_flush_frame = 0;
            
            // Process frames until recording is stopped
            while is_recording.load(Ordering::Acquire) || !frame_queue.is_empty() {
                // Process up to 10 frames at a time
                let mut processed = 0;
                
                for _ in 0..10 {
                    if let Some(frame) = frame_queue.pop() {
                        let start_time = Instant::now();
                        
                        // Process the frame
                        if let Err(e) = Self::process_frame(
                            &mut writer,
                            &frame,
                            &delta_encoder,
                            &config,
                            &mut frame_index,
                            &mut last_flush_frame,
                        ) {
                            eprintln!("Error processing frame: {}", e);
                        }
                        
                        // Update stats
                        let processing_time = start_time.elapsed().as_micros() as u64;
                        let mut stats = stats.lock().unwrap();
                        stats.frames_processed += 1;
                        stats.max_processing_time_us = stats.max_processing_time_us.max(processing_time);
                        stats.avg_processing_time_us = (stats.avg_processing_time_us * (stats.frames_processed - 1) as f64
                            + processing_time as f64) / stats.frames_processed as f64;
                        
                        // Return frame to pool
                        let _ = frame_pool.push(frame);
                        
                        processed += 1;
                    } else {
                        break;
                    }
                }
                
                // If no frames were processed, sleep a bit
                if processed == 0 {
                    thread::sleep(Duration::from_millis(1));
                }
            }
            
            // Finish the archive
            if let Err(e) = writer.finish() {
                eprintln!("Error finishing archive: {}", e);
            }
        }));
        
        Ok(())
    }
    
    /// Process a single frame
    fn process_frame(
        writer: &mut PsiArchiveWriter,
        frame: &FrameData,
        delta_encoder: &Arc<Mutex<DeltaEncoder>>,
        config: &RecorderConfig,
        frame_index: &mut u64,
        last_flush_frame: &mut u64,
    ) -> Result<(), io::Error> {
        // Increment frame index
        *frame_index += 1;
        
        // Process based on band type
        match frame.band {
            BAND_MICRO => {
                // For micro band, we always process
                
                // If this is a keyframe, store as-is
                if frame.is_keyframe {
                    // Pack as raw bytes
                    let mut data = Vec::with_capacity(
                        frame.phases.len() * 2 + 
                        frame.amplitudes.len() * 2 + 
                        frame.emotions.len() * 2
                    );
                    
                    // Add phases
                    for &phase in &frame.phases {
                        data.extend_from_slice(&phase.to_le_bytes());
                    }
                    
                    // Add amplitudes
                    for &amplitude in &frame.amplitudes {
                        data.extend_from_slice(&amplitude.to_le_bytes());
                    }
                    
                    // Add emotions
                    for &emotion in &frame.emotions {
                        data.extend_from_slice(&emotion.to_le_bytes());
                    }
                    
                    // In real implementation, we'd compress this with zstd
                    // For now, let's just simulate it
                    
                    // Write to archive
                    writer.write_chunk(BAND_MICRO, true, &data)?;
                    
                    // Reset delta encoder
                    let mut encoder = delta_encoder.lock().unwrap();
                    encoder.last_phases.copy_from_slice(&frame.phases);
                    encoder.last_amplitudes.copy_from_slice(&frame.amplitudes);
                    encoder.last_emotions.copy_from_slice(&frame.emotions);
                } else {
                    // For non-keyframes, delta encode
                    let mut encoder = delta_encoder.lock().unwrap();
                    
                    // Allocate buffers for deltas
                    let mut phase_deltas = vec![0i16; frame.phases.len()];
                    let mut amplitude_deltas = vec![0i16; frame.amplitudes.len()];
                    let mut emotion_deltas = vec![0i16; frame.emotions.len()];
                    
                    // Encode deltas
                    encoder.encode_phases(&frame.phases, &mut phase_deltas);
                    encoder.encode_amplitudes(&frame.amplitudes, &mut amplitude_deltas);
                    encoder.encode_emotions(&frame.emotions, &mut emotion_deltas);
                    
                    // Pack as raw bytes
                    let mut data = Vec::with_capacity(
                        phase_deltas.len() * 2 + 
                        amplitude_deltas.len() * 2 + 
                        emotion_deltas.len() * 2
                    );
                    
                    // Add phases
                    for &delta in &phase_deltas {
                        data.extend_from_slice(&delta.to_le_bytes());
                    }
                    
                    // Add amplitudes
                    for &delta in &amplitude_deltas {
                        data.extend_from_slice(&delta.to_le_bytes());
                    }
                    
                    // Add emotions
                    for &delta in &emotion_deltas {
                        data.extend_from_slice(&delta.to_le_bytes());
                    }
                    
                    // In real implementation, we'd compress this with zstd
                    // For now, let's just simulate it
                    
                    // Write to archive
                    writer.write_chunk(BAND_MICRO, false, &data)?;
                }
            }
            
            BAND_MESO => {
                // Meso band processing is similar but simpler
                // In production we'd store this in a separate file or section
                
                // Just write raw data for now
                let mut data = Vec::with_capacity(
                    frame.phases.len() * 2 + 
                    frame.amplitudes.len() * 2 + 
                    frame.emotions.len() * 2
                );
                
                // Add phases, amplitudes, emotions (same as micro band)
                for &phase in &frame.phases {
                    data.extend_from_slice(&phase.to_le_bytes());
                }
                
                for &amplitude in &frame.amplitudes {
                    data.extend_from_slice(&amplitude.to_le_bytes());
                }
                
                for &emotion in &frame.emotions {
                    data.extend_from_slice(&emotion.to_le_bytes());
                }
                
                // Write to archive (always as keyframe for simplicity)
                writer.write_chunk(BAND_MESO, true, &data)?;
            }
            
            BAND_MACRO => {
                // Macro band is event-driven, always store as keyframe
                let mut data = Vec::with_capacity(
                    frame.phases.len() * 2 + 
                    frame.amplitudes.len() * 2 + 
                    frame.emotions.len() * 2
                );
                
                // Add phases, amplitudes, emotions (same as micro band)
                for &phase in &frame.phases {
                    data.extend_from_slice(&phase.to_le_bytes());
                }
                
                for &amplitude in &frame.amplitudes {
                    data.extend_from_slice(&amplitude.to_le_bytes());
                }
                
                for &emotion in &frame.emotions {
                    data.extend_from_slice(&emotion.to_le_bytes());
                }
                
                // Write to archive
                writer.write_chunk(BAND_MACRO, true, &data)?;
            }
            
            _ => {
                // Unknown band type
                eprintln!("Warning: Unknown band type {}", frame.band);
            }
        }
        
        // Flush at regular intervals based on config
        if *frame_index - *last_flush_frame >= config.flush_interval {
            writer.flush()?;
            *last_flush_frame = *frame_index;
        }
        
        Ok(())
    }
    
    /// Capture a frame from the current oscillator state
    pub fn capture_frame(&self, 
        phases: &[f32], 
        amplitudes: &[f32], 
        emotions: &[f32]
    ) -> bool {
        if !self.is_recording.load(Ordering::Acquire) {
            return false;
        }
        
        let start_time = Instant::now();
        
        // Get next frame index
        let frame_index = self.current_frame.fetch_add(1, Ordering::AcqRel);
        
        // Check if this is a keyframe
        let is_keyframe = frame_index == 0 || frame_index as u64 % self.config.keyframe_interval == 0;
        
        // Try to get a frame from the pool
        if let Some(mut frame) = self.frame_pool.pop() {
            // Reset the frame
            frame.reset();
            
            // Set frame properties
            frame.timestamp_ms = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64;
            frame.frame_index = frame_index as u64;
            frame.is_keyframe = is_keyframe;
            frame.band = BAND_MICRO;
            
            // Convert and store oscillator state
            for (i, &phase) in phases.iter().enumerate().take(frame.phases.len()) {
                // Convert from [-π, π] range to i16 range
                frame.phases[i] = (phase * 32767.0 / std::f32::consts::PI) as i16;
            }
            
            for (i, &amplitude) in amplitudes.iter().enumerate().take(frame.amplitudes.len()) {
                // Convert from [0, 1] range to i16 range
                frame.amplitudes[i] = (amplitude * 32767.0) as i16;
            }
            
            for (i, &emotion) in emotions.iter().enumerate().take(frame.emotions.len()) {
                // Convert from [0, 1] range to i16 range
                frame.emotions[i] = (emotion * 32767.0) as i16;
            }
            
            // Push to queue
            if let Err(_) = self.frame_queue.push(frame) {
                // Queue is full, return frame to pool
                let _ = self.frame_pool.push(frame);
                
                // Update stats
                let mut stats = self.stats.lock().unwrap();
                stats.frames_dropped += 1;
                
                return false;
            }
            
            // Update stats
            let capture_time = start_time.elapsed().as_micros() as u64;
            let mut stats = self.stats.lock().unwrap();
            stats.frames_captured += 1;
            stats.max_capture_time_us = stats.max_capture_time_us.max(capture_time);
            stats.avg_capture_time_us = (stats.avg_capture_time_us * (stats.frames_captured - 1) as f64
                + capture_time as f64) / stats.frames_captured as f64;
            
            if is_keyframe {
                stats.keyframes += 1;
            }
            
            // Handle meso band decimation
            if self.config.meso_decimation > 0 && frame_index as u64 % self.config.meso_decimation == 0 {
                // Create meso band frame by decimating micro band
                if let Some(mut meso_frame) = self.frame_pool.pop() {
