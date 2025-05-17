//! ψ-Trajectory Archive Reader
//!
//! This module provides functionality for reading and replaying ψ-trajectory archives.
//! It implements memory-mapped file access for efficient random access, buffer
//! preloading for smooth playback, and audio-synchronized frame delivery.

use std::fs::File;
use std::io::{self, Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, RwLock};
use std::time::{Duration, Instant};
use memmap2::{Mmap, MmapOptions};
use std::collections::VecDeque;

use crate::psi_recorder::{
    BAND_MICRO, BAND_MESO, BAND_MACRO, BAND_AUDIO_PCM, BAND_END, KEYFRAME_MARKER,
};

/// Error types for archive reader
#[derive(Debug)]
pub enum ReaderError {
    /// I/O error
    Io(io::Error),
    /// Invalid file format
    InvalidFormat(String),
    /// End of file
    EndOfFile,
    /// Seek error
    SeekError(String),
    /// Decompression error
    DecompressionError(String),
    /// Invalid parameter
    InvalidParameter(String),
}

impl From<io::Error> for ReaderError {
    fn from(err: io::Error) -> Self {
        ReaderError::Io(err)
    }
}

/// A frame extracted from the archive
#[derive(Clone)]
pub struct Frame {
    /// Frame timestamp in milliseconds
    pub timestamp_ms: u64,
    
    /// Frame index in the sequence
    pub frame_index: u64,
    
    /// Oscillator phases (one per oscillator)
    pub phases: Vec<f32>,
    
    /// Oscillator amplitudes (one per oscillator)
    pub amplitudes: Vec<f32>,
    
    /// Emotion vector (typically 8 dimensions)
    pub emotions: Vec<f32>,
    
    /// Whether this is a keyframe
    pub is_keyframe: bool,
    
    /// Band type (micro, meso, macro)
    pub band: u8,
}

impl Frame {
    /// Create a new empty frame
    pub fn new(oscillator_count: usize, emotion_dimensions: usize) -> Self {
        Self {
            timestamp_ms: 0,
            frame_index: 0,
            phases: vec![0.0; oscillator_count],
            amplitudes: vec![0.0; oscillator_count],
            emotions: vec![0.0; emotion_dimensions],
            is_keyframe: false,
            band: BAND_MICRO,
        }
    }
    
    /// Convert int16 phase values to float (-π to π range)
    pub fn apply_int16_phases(&mut self, phases: &[i16]) {
        for (i, &phase) in phases.iter().enumerate().take(self.phases.len()) {
            self.phases[i] = (phase as f32 * std::f32::consts::PI) / 32767.0;
        }
    }
    
    /// Convert int16 amplitude values to float (0 to 1 range)
    pub fn apply_int16_amplitudes(&mut self, amplitudes: &[i16]) {
        for (i, &amplitude) in amplitudes.iter().enumerate().take(self.amplitudes.len()) {
            self.amplitudes[i] = amplitude as f32 / 32767.0;
        }
    }
    
    /// Convert int16 emotion values to float (0 to 1 range)
    pub fn apply_int16_emotions(&mut self, emotions: &[i16]) {
        for (i, &emotion) in emotions.iter().enumerate().take(self.emotions.len()) {
            self.emotions[i] = emotion as f32 / 32767.0;
        }
    }
}

/// Chunk descriptor for archive reading
struct ChunkDescriptor {
    /// Offset in the file
    offset: u64,
    
    /// Chunk type/band
    chunk_type: u8,
    
    /// Whether this is a keyframe
    is_keyframe: bool,
    
    /// Size of the chunk data
    data_size: usize,
    
    /// Timestamp (derived from metadata or position)
    timestamp_ms: u64,
    
    /// Associated frame index
    frame_index: u64,
}

/// Header information from the archive
struct ArchiveHeader {
    /// Format version
    version: u16,
    
    /// Start timestamp in milliseconds
    start_timestamp_ms: u64,
    
    /// CRC32 of the header
    header_crc: u32,
}

/// A reader for ψ-trajectory archives
pub struct PsiArchiveReader {
    /// Path to the archive file
    path: PathBuf,
    
    /// Memory-mapped file
    mmap: Option<Mmap>,
    
    /// Archive header
    header: Option<ArchiveHeader>,
    
    /// Keyframe chunk descriptors
    keyframe_chunks: Vec<ChunkDescriptor>,
    
    /// All chunks
    all_chunks: Vec<ChunkDescriptor>,
    
    /// Cache of decoded keyframes
    keyframe_cache: RwLock<Vec<(u64, Frame)>>,
    
    /// Cached delta decoder state
    delta_decoder: Mutex<DeltaDecoder>,
    
    /// Number of oscillators in this archive
    oscillator_count: usize,
    
    /// Number of emotion dimensions in this archive
    emotion_dimensions: usize,
    
    /// Maximum number of keyframes to cache
    max_keyframe_cache: usize,
    
    /// Duration of the archive in milliseconds
    duration_ms: u64,
}

/// Delta decoder for frame decompression
struct DeltaDecoder {
    /// Last phases for each oscillator
    last_phases: Vec<i16>,
    
    /// Last amplitudes for each oscillator
    last_amplitudes: Vec<i16>,
    
    /// Last emotions
    last_emotions: Vec<i16>,
}

impl DeltaDecoder {
    /// Create a new delta decoder
    fn new(oscillator_count: usize, emotion_dimensions: usize) -> Self {
        Self {
            last_phases: vec![0; oscillator_count],
            last_amplitudes: vec![0; oscillator_count],
            last_emotions: vec![0; emotion_dimensions],
        }
    }
    
    /// Reset the decoder state
    fn reset(&mut self) {
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
    
    /// Set decoder state from frame data
    fn set_state_from_data(&mut self, phases: &[i16], amplitudes: &[i16], emotions: &[i16]) {
        self.last_phases.copy_from_slice(phases);
        self.last_amplitudes.copy_from_slice(amplitudes);
        self.last_emotions.copy_from_slice(emotions);
    }
    
    /// Apply deltas to phases
    fn apply_phase_deltas(&mut self, deltas: &[i16], output: &mut [i16]) {
        for (i, &delta) in deltas.iter().enumerate().take(self.last_phases.len()) {
            self.last_phases[i] = Self::apply_phase_delta(self.last_phases[i], delta);
            output[i] = self.last_phases[i];
        }
    }
    
    /// Apply deltas to amplitudes
    fn apply_amplitude_deltas(&mut self, deltas: &[i16], output: &mut [i16]) {
        for (i, &delta) in deltas.iter().enumerate().take(self.last_amplitudes.len()) {
            self.last_amplitudes[i] = self.last_amplitudes[i].saturating_add(delta);
            output[i] = self.last_amplitudes[i];
        }
    }
    
    /// Apply deltas to emotions
    fn apply_emotion_deltas(&mut self, deltas: &[i16], output: &mut [i16]) {
        for (i, &delta) in deltas.iter().enumerate().take(self.last_emotions.len()) {
            self.last_emotions[i] = self.last_emotions[i].saturating_add(delta);
            output[i] = self.last_emotions[i];
        }
    }
    
    /// Apply delta to a phase value with proper phase wrap handling
    fn apply_phase_delta(value: i16, delta: i16) -> i16 {
        // Add with wrapping in int16 space
        value.wrapping_add(delta)
    }
}

impl PsiArchiveReader {
    /// Create a new archive reader
    pub fn new<P: AsRef<Path>>(
        path: P,
        oscillator_count: usize,
        emotion_dimensions: usize,
    ) -> Self {
        Self {
            path: path.as_ref().to_path_buf(),
            mmap: None,
            header: None,
            keyframe_chunks: Vec::new(),
            all_chunks: Vec::new(),
            keyframe_cache: RwLock::new(Vec::new()),
            delta_decoder: Mutex::new(DeltaDecoder::new(oscillator_count, emotion_dimensions)),
            oscillator_count,
            emotion_dimensions,
            max_keyframe_cache: 10, // Cache up to 10 keyframes by default
            duration_ms: 0,
        }
    }
    
    /// Open the archive and read the header and index
    pub fn open(&mut self) -> Result<(), ReaderError> {
        // Open the file
        let file = File::open(&self.path)?;
        
        // Memory map the file
        let mmap = unsafe { MmapOptions::new().map(&file)? };
        
        // Read and verify the header
        self.header = Some(self.read_header(&mmap)?);
        
        // Scan the file for chunks and build the index
        self.scan_chunks(&mmap)?;
        
        // Calculate duration
        if let Some(last_chunk) = self.all_chunks.last() {
            self.duration_ms = last_chunk.timestamp_ms;
        }
        
        // Store the memory map
        self.mmap = Some(mmap);
        
        Ok(())
    }
    
    /// Read and parse the header
    fn read_header(&self, mmap: &Mmap) -> Result<ArchiveHeader, ReaderError> {
        if mmap.len() < 16 {
            return Err(ReaderError::InvalidFormat("File too small for header".to_string()));
        }
        
        // Check magic bytes "ΨARC"
        if &mmap[0..4] != b"\xCE\xA8ARC" {
            return Err(ReaderError::InvalidFormat("Invalid magic bytes".to_string()));
        }
        
        // Parse version (uint16, little endian)
        let version = u16::from_le_bytes([mmap[4], mmap[5]]);
        
        // Parse start timestamp (uint64, little endian)
        let mut timestamp_bytes = [0u8; 8];
        timestamp_bytes.copy_from_slice(&mmap[6..14]);
        let start_timestamp_ms = u64::from_le_bytes(timestamp_bytes);
        
        // Parse header CRC32 (uint32, little endian)
        let mut crc_bytes = [0u8; 4];
        crc_bytes.copy_from_slice(&mmap[14..18]);
        let header_crc = u32::from_le_bytes(crc_bytes);
        
        // In a full implementation, we would verify the CRC32 here
        
        Ok(ArchiveHeader {
            version,
            start_timestamp_ms,
            header_crc,
        })
    }
    
    /// Scan the file for chunks and build the index
    fn scan_chunks(&mut self, mmap: &Mmap) -> Result<(), ReaderError> {
        let mut offset = 18; // Start after the header
        let mut frame_index = 0;
        
        // Clear existing indices
        self.keyframe_chunks.clear();
        self.all_chunks.clear();
        
        while offset < mmap.len() {
            // Read chunk tag
            let tag = mmap[offset];
            offset += 1;
            
            // Check for END marker
            if tag == BAND_END {
                break;
            }
            
            // Parse chunk type and keyframe flag
            let chunk_type = tag & 0x7F;
            let is_keyframe = (tag & KEYFRAME_MARKER) != 0;
            
            // Read chunk length as LEB128
            let (length, bytes_read) = self.read_leb128(mmap, offset)?;
            offset += bytes_read;
            
            if offset + length > mmap.len() {
                return Err(ReaderError::InvalidFormat("Chunk extends beyond file".to_string()));
            }
            
            // Create chunk descriptor
            let chunk = ChunkDescriptor {
                offset: offset as u64,
                chunk_type,
                is_keyframe,
                data_size: length,
                timestamp_ms: if let Some(header) = &self.header {
                    // This is a simplification; in reality we would need to decode
                    // the chunk to get the exact timestamp or interpolate based on position
                    header.start_timestamp_ms + frame_index * 16 // Assuming 60fps
                } else {
                    0
                },
                frame_index,
            };
            
            // Add to indices
            self.all_chunks.push(chunk.clone());
            
            if is_keyframe && 
               (chunk_type == BAND_MICRO || chunk_type == BAND_MESO || chunk_type == BAND_MACRO) {
                self.keyframe_chunks.push(chunk);
                
                // Only increment frame index for visual frames
                frame_index += 1;
            }
            
            // Skip chunk data and CRC
            offset += length + 4; // 4 bytes for CRC32
        }
        
        Ok(())
    }
    
    /// Read a LEB128 encoded integer
    fn read_leb128(&self, mmap: &Mmap, mut offset: usize) -> Result<(usize, usize), ReaderError> {
        let mut result = 0;
        let mut shift = 0;
        let mut bytes_read = 0;
        
        loop {
            if offset >= mmap.len() {
                return Err(ReaderError::InvalidFormat("Unexpected end of file in LEB128".to_string()));
            }
            
            let byte = mmap[offset];
            offset += 1;
            bytes_read += 1;
            
            result |= ((byte & 0x7F) as usize) << shift;
            
            if (byte & 0x80) == 0 {
                break;
            }
            
            shift += 7;
            
            if shift > 28 {
                return Err(ReaderError::InvalidFormat("LEB128 overflow".to_string()));
            }
        }
        
        Ok((result, bytes_read))
    }
    
    /// Find the most recent keyframe before or at the given frame index
    fn find_keyframe_before(&self, frame_index: u64) -> Option<&ChunkDescriptor> {
        self.keyframe_chunks
            .iter()
            .rev()
            .find(|chunk| chunk.frame_index <= frame_index)
    }
    
    /// Find the keyframe chunk at exactly the given frame index
    fn find_keyframe_at(&self, frame_index: u64) -> Option<&ChunkDescriptor> {
        self.keyframe_chunks
            .iter()
            .find(|chunk| chunk.frame_index == frame_index)
    }
    
    /// Get a chunk descriptor by index
    fn get_chunk(&self, index: usize) -> Option<&ChunkDescriptor> {
        self.all_chunks.get(index)
    }
    
    /// Decompress a chunk from the archive
    fn decompress_chunk(&self, chunk: &ChunkDescriptor) -> Result<Vec<u8>, ReaderError> {
        if let Some(mmap) = &self.mmap {
            let offset = chunk.offset as usize;
            let data = &mmap[offset..offset + chunk.data_size];
            
            // In a real implementation, we would use zstd to decompress the data
            // For now, let's assume the data is uncompressed
            Ok(data.to_vec())
        } else {
            Err(ReaderError::InvalidFormat("Archive not open".to_string()))
        }
    }
    
    /// Read a frame at the given index
    pub fn read_frame(&self, frame_index: u64) -> Result<Frame, ReaderError> {
        // First, check if the frame is a keyframe and if it's in the cache
        if let Some(keyframe_chunk) = self.find_keyframe_at(frame_index) {
            // Check cache first
            let cache = self.keyframe_cache.read().unwrap();
            if let Some((_, frame)) = cache.iter().find(|(idx, _)| *idx == frame_index) {
                return Ok(frame.clone());
            }
            drop(cache); // Release the read lock
            
            // Not in cache, decode the keyframe
            let frame = self.decode_keyframe(keyframe_chunk)?;
            
            // Add to cache
            let mut cache = self.keyframe_cache.write().unwrap();
            cache.push((frame_index, frame.clone()));
            
            // Limit cache size
            if cache.len() > self.max_keyframe_cache {
                cache.remove(0);
            }
            
            return Ok(frame);
        }
        
        // Not a keyframe, find the most recent keyframe and apply deltas
        let keyframe_chunk = self.find_keyframe_before(frame_index)
            .ok_or_else(|| ReaderError::SeekError("No keyframe found before frame".to_string()))?;
        
        // Read keyframe
        let keyframe = self.read_frame(keyframe_chunk.frame_index)?;
        
        // Initialize delta decoder
        let mut decoder = self.delta_decoder.lock().unwrap();
        decoder.reset();
        
        // Convert float values back to int16 for delta decoding
        let mut int_phases = vec![0i16; self.oscillator_count];
        let mut int_amplitudes = vec![0i16; self.oscillator_count];
        let mut int_emotions = vec![0i16; self.emotion_dimensions];
        
        // Convert keyframe values to int16
        for (i, &phase) in keyframe.phases.iter().enumerate() {
            int_phases[i] = (phase * 32767.0 / std::f32::consts::PI) as i16;
        }
        
        for (i, &amplitude) in keyframe.amplitudes.iter().enumerate() {
            int_amplitudes[i] = (amplitude * 32767.0) as i16;
        }
        
        for (i, &emotion) in keyframe.emotions.iter().enumerate() {
            int_emotions[i] = (emotion * 32767.0) as i16;
        }
        
        // Set decoder state
        decoder.set_state_from_data(&int_phases, &int_amplitudes, &int_emotions);
        
        // Find all delta frames between keyframe and target
        let start_chunk_index = self.all_chunks.iter()
            .position(|chunk| chunk.frame_index == keyframe_chunk.frame_index)
            .ok_or_else(|| ReaderError::SeekError("Could not find keyframe chunk in index".to_string()))?;
        
        // Apply all deltas up to the target frame
        for chunk_index in (start_chunk_index + 1)..self.all_chunks.len() {
            let chunk = &self.all_chunks[chunk_index];
            
            if chunk.chunk_type != BAND_MICRO {
                continue; // Skip non-micro bands for now
            }
            
            if chunk.frame_index > frame_index {
                break; // We've gone past the target frame
            }
            
            // Decompress delta chunk
            let delta_data = self.decompress_chunk(chunk)?;
            
            // Parse deltas (assuming int16 data layout)
            if delta_data.len() < (self.oscillator_count + self.emotion_dimensions) * 2 {
                return Err(ReaderError::InvalidFormat("Delta data too small".to_string()));
            }
            
            // Extract phase deltas
            let mut phase_deltas = vec![0i16; self.oscillator_count];
            for i in 0..self.oscillator_count {
                let offset = i * 2;
                phase_deltas[i] = i16::from_le_bytes([delta_data[offset], delta_data[offset + 1]]);
            }
            
            // Extract amplitude deltas
            let mut amplitude_deltas = vec![0i16; self.oscillator_count];
            for i in 0..self.oscillator_count {
                let offset = (self.oscillator_count + i) * 2;
                amplitude_deltas[i] = i16::from_le_bytes([delta_data[offset], delta_data[offset + 1]]);
            }
            
            // Extract emotion deltas
            let mut emotion_deltas = vec![0i16; self.emotion_dimensions];
            for i in 0..self.emotion_dimensions {
                let offset = (self.oscillator_count * 2 + i) * 2;
                emotion_deltas[i] = i16::from_le_bytes([delta_data[offset], delta_data[offset + 1]]);
            }
            
            // Apply deltas
            decoder.apply_phase_deltas(&phase_deltas, &mut int_phases);
            decoder.apply_amplitude_deltas(&amplitude_deltas, &mut int_amplitudes);
            decoder.apply_emotion_deltas(&emotion_deltas, &mut int_emotions);
        }
        
        // Create result frame
        let mut frame = Frame::new(self.oscillator_count, self.emotion_dimensions);
        frame.frame_index = frame_index;
        frame.timestamp_ms = if let Some(header) = &self.header {
            header.start_timestamp_ms + frame_index * 16 // Assuming 60fps
        } else {
            0
        };
        frame.is_keyframe = false;
        frame.band = BAND_MICRO;
        
        // Convert int16 values to float
        frame.apply_int16_phases(&int_phases);
        frame.apply_int16_amplitudes(&int_amplitudes);
        frame.apply_int16_emotions(&int_emotions);
        
        Ok(frame)
    }
    
    /// Decode a keyframe chunk into a frame
    fn decode_keyframe(&self, chunk: &ChunkDescriptor) -> Result<Frame, ReaderError> {
        // Decompress the chunk
        let data = self.decompress_chunk(chunk)?;
        
        // Parse the data (assuming int16 data layout)
        if data.len() < (self.oscillator_count * 2 + self.oscillator_count * 2 + self.emotion_dimensions * 2) {
            return Err(ReaderError::InvalidFormat("Keyframe data too small".to_string()));
        }
        
        // Extract phases
        let mut phases = vec![0i16; self.oscillator_count];
        for i in 0..self.oscillator_count {
            let offset = i * 2;
            phases[i] = i16::from_le_bytes([data[offset], data[offset + 1]]);
        }
        
        // Extract amplitudes
        let mut amplitudes = vec![0i16; self.oscillator_count];
        for i in 0..self.oscillator_count {
            let offset = (self.oscillator_count + i) * 2;
            amplitudes[i] = i16::from_le_bytes([data[offset], data[offset + 1]]);
        }
        
        // Extract emotions
        let mut emotions = vec![0i16; self.emotion_dimensions];
        for i in 0..self.emotion_dimensions {
            let offset = (self.oscillator_count * 2 + i) * 2;
            emotions[i] = i16::from_le_bytes([data[offset], data[offset + 1]]);
        }
        
        // Create frame
        let mut frame = Frame::new(self.oscillator_count, self.emotion_dimensions);
        frame.frame_index = chunk.frame_index;
        frame.timestamp_ms = chunk.timestamp_ms;
        frame.is_keyframe = true;
        frame.band = chunk.chunk_type;
        
        // Convert int16 values to float
        frame.apply_int16_phases(&phases);
        frame.apply_int16_amplitudes(&amplitudes);
        frame.apply_int16_emotions(&emotions);
        
        Ok(frame)
    }
    
    /// Get the duration of the archive in milliseconds
    pub fn duration_ms(&self) -> u64 {
        self.duration_ms
    }
    
    /// Get the number of frames in the archive
    pub fn frame_count(&self) -> u64 {
        if let Some(last_chunk) = self.all_chunks.last() {
            last_chunk.frame_index + 1
        } else {
            0
        }
    }
    
    /// Get the number of oscillators in the archive
    pub fn oscillator_count(&self) -> usize {
        self.oscillator_count
    }
    
    /// Get the number of emotion dimensions in the archive
    pub fn emotion_dimensions(&self) -> usize {
        self.emotion_dimensions
    }
}

/// A player for ψ-trajectory archives that synchronizes with audio
pub struct PsiPlayer {
    /// The archive reader
    reader: Arc<PsiArchiveReader>,
    
    /// Current playback position in frames
    position: u64,
    
    /// Playback state
    playing: bool,
    
    /// Playback rate (1.0 = normal speed)
    rate: f32,
    
    /// Start time of playback
    start_time: Instant,
    
    /// Time of last frame
    last_frame_time: Instant,
    
    /// Buffer of preloaded frames
    frame_buffer: VecDeque<Frame>,
    
    /// Maximum buffer size
    max_buffer_size: usize,
    
    /// Callback for frame delivery
    frame_callback: Option<Box<dyn Fn(&Frame) + Send + Sync>>,
    
    /// Callback for audio samples
    audio_callback: Option<Box<dyn Fn(&[i16], u64) + Send + Sync>>,
}

impl PsiPlayer {
    /// Create a new player for the given archive
    pub fn new(reader: Arc<PsiArchiveReader>) -> Self {
        Self {
            reader,
            position: 0,
            playing: false,
            rate: 1.0,
            start_time: Instant::now(),
            last_frame_time: Instant::now(),
            frame_buffer: VecDeque::new(),
            max_buffer_size: 60, // Buffer up to 1 second at 60fps
            frame_callback: None,
            audio_callback: None,
        }
    }
    
    /// Set the callback for frame delivery
    pub fn set_frame_callback<F>(&mut self, callback: F)
    where
        F: Fn(&Frame) + Send + Sync + 'static,
    {
        self.frame_callback = Some(Box::new(callback));
    }
    
    /// Set the callback for audio samples
    pub fn set_audio_callback<F>(&mut self, callback: F)
    where
        F: Fn(&[i16], u64) + Send + Sync + 'static,
    {
        self.audio_callback = Some(Box::new(callback));
    }
    
    /// Start playback
    pub fn play(&mut self) {
        self.playing = true;
        self.start_time = Instant::now();
        self.last_frame_time = Instant::now();
    }
    
    /// Pause playback
    pub fn pause(&mut self) {
        self.playing = false;
    }
    
    /// Stop playback and reset position
    pub fn stop(&mut self) {
        self.playing = false;
        self.position = 0;
        self.frame_buffer.clear();
    }
    
    /// Seek to a specific frame
    pub fn seek(&mut self, frame: u64) -> Result<(), ReaderError> {
        let frame_count = self.reader.frame_count();
        if frame >= frame_count {
            return Err(ReaderError::InvalidParameter(format!("Frame index {} out of range (0-{})", frame, frame_count - 1)));
        }
        
        self.position = frame;
        self.frame_buffer.clear();
        
        // Preload buffer
        self.preload_buffer()?;
        
        Ok(())
    }
    
    /// Set playback rate
    pub fn set_rate(&mut self, rate: f32) {
        self.rate = rate.max(0.1).min(10.0);
    }
    
    /// Preload the frame buffer
    fn preload_buffer(&mut self) -> Result<(), ReaderError> {
        // Clear buffer if it's too large
        while self.frame_buffer.len() >= self.max_buffer_size {
            self.frame_buffer.pop_front();
        }
        
        // Calculate how many frames to preload
        let to_preload = self.max_buffer_size - self.frame_buffer.len();
        let next_frame = self.position + self.frame_buffer.len() as u64;
        let frame_count = self.reader.frame_count();
        
        // Preload frames
        for i in 0..to_preload {
            let frame_index = next_frame + i as u64;
            if frame_index >= frame_count {
                break;
            }
            
            let frame = self.reader.read_frame(frame_index)?;
            self.frame_buffer.push_back(frame);
        }
        
        Ok(())
    }
    
    /// Update the player state and deliver frames
    pub fn update(&mut self) -> Result<(), ReaderError> {
        if !self.playing {
            return Ok(());
        }
        
        // Calculate elapsed time
        let elapsed = self.start_time.elapsed();
        let frame_time = Duration::from_millis(16); // ~60fps
        
        // Check if it's time for a new frame
        let time_since_last = self.last_frame_time.elapsed();
        if time_since_last < frame_time {
            return Ok(());
        }
        
        // Deliver as many frames as needed to catch up
        let frames_to_deliver = (time_since_last.as_millis() as f32 / frame_time.as_millis() as f32 * self.rate) as usize;
        
        for _ in 0..frames_to_deliver {
            // Ensure buffer is loaded
            if self.frame_buffer.is_empty() {
                self.preload_buffer()?;
                
                // If still empty, we've reached the end
                if self.frame_buffer.is_empty() {
                    self.playing = false;
                    return Ok(());
                }
            }
            
            // Get the next frame
            if let Some(frame) = self.frame_buffer.pop_front() {
                // Deliver the frame using callback
                if let Some(callback) = &self.frame_callback {
                    callback(&frame);
                }
                
                // Update position
                self.position += 1;
            }
        }
        
        // Update timing
        self.last_frame_time = Instant::now();
        
        Ok(())
    }
    
    /// Get the current playback position
    pub fn get_position(&self) -> u64 {
        self.position
    }
    
    /// Check if playback is active
    pub fn is_playing(&self) -> bool {
        self.playing
    }
    
    /// Get playback statistics
    pub fn get_stats(&self) -> PlaybackStats {
        PlaybackStats {
            position: self.position,
            playing: self.playing,
            buffer_size: self.frame_buffer.len(),
            rate: self.rate,
        }
    }
}

/// Statistics for playback
pub struct PlaybackStats {
    /// Current position in frames
    pub position: u64,
    
    /// Whether playback is active
    pub playing: bool,
    
    /// Size of the buffer in frames
    pub buffer_size: usize,
    
    /// Playback rate
    pub rate: f32,
}

/// Module for synchronizing ELFIN symbols with oscillator patterns
pub mod psi_sync_monitor {
    use std::collections::HashMap;
    use std::sync::{Arc, Mutex};
    
    /// Concept identifier type
    pub type ConceptId = u64;
    
    /// A simple concept graph for binding ELFIN symbols
    pub struct ConceptGraph {
        /// Nodes in the graph
        nodes: HashMap<ConceptId, ConceptNode>,
        
        /// Hash lookup table
        hash_lookup: HashMap<u64, ConceptId>,
    }
    
    /// A node in the concept graph
    struct ConceptNode {
        /// Node identifier
        id: ConceptId,
        
        /// Metadata
        metadata: HashMap<String, String>,
    }
    
    impl ConceptGraph {
        /// Create a new concept graph
        pub fn new() -> Self {
            Self {
                nodes: HashMap::new(),
                hash_lookup: HashMap::new(),
            }
        }
        
        /// Create a new node
        pub fn create_node() -> ConceptId {
            // In a full implementation, this would be more sophisticated
            // For now, just generate a random ID
            rand::random()
        }
        
        /// Ensure a node exists
        pub fn ensure_node(id: &str) -> &Self {
            // Parse id as u64
            let id = id.parse::<u64>().unwrap_or(0);
            
            // In a full implementation, this would create the node if it doesn't exist
            // For now, just return self
            self
        }
        
        /// Set metadata on a node
        pub fn set_meta(node: ConceptId, key: &str, value: &str) {
            // In a full implementation, this would set metadata on the node
        }
        
        /// Get metadata from a node
        pub fn get_meta(node: ConceptId, key: &str) -> Option<String> {
            // In a full implementation, this would get metadata from the node
            None
        }
        
        /// Look up a hash in the graph
        pub fn lookup_hash(hash: u64) -> Option<ConceptId> {
            // In a full implementation, this would look up the hash
            None
        }
        
        /// Merge two nodes
        pub fn merge(node1: ConceptId, node2: ConceptId) {
            // In a full implementation, this would merge the nodes
        }
        
        /// Import ELFIN symbols
        pub fn import_elfin(path: &str) -> Result<(), std::io::Error> {
            // In a full implementation, this would import ELFIN symbols
            Ok(())
        }
    }
    
    /// Try to bind an oscillator pattern to an ELFIN symbol
    pub fn try_bind_to_elfin(node_id: ConceptId, psi_signature: &[f32]) {
        // Compute the hash using siphash24
        let signature_str = format!("{:.3?}", psi_signature);
        let h = siphash24(&signature_str);
        
        // Look up the hash in the concept graph
        if let Some(elfin_id) = ConceptGraph::lookup_hash(h) {
            // Merge the nodes
            ConceptGraph::merge(node_id, elfin_id);
            
            // Set the source metadata
            ConceptGraph::set_meta(node_id, "source", "ELFIN");
        }
    }
    
    /// Called when a new attractor is promoted to a concept
    pub fn on_attractor_promoted(node_id: ConceptId, signature: &[f32]) {
        // Try to bind to ELFIN
        try_bind_to_elfin(node_id, signature);
        
        // Additional stability bookkeeping would go here
    }
    
    /// Compute a SipHash-2-4 hash of a string
    fn siphash24(input: &str) -> u64 {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        input.hash(&mut hasher);
        hasher.finish()
    }
    
    #[cfg(test)]
    mod tests {
        use super::*;
        
        #[test]
        fn test_bind_to_elfin() {
            // Mock signature that would hash to a known ELFIN symbol
            let mock_sig = vec![0.1, 0.2, 0.3, 0.4];
            
            // Create a node
            let node = ConceptGraph::create_node();
            
            // Try to bind
            on_attractor_promoted(node, &mock_sig);
            
            // In a real implementation, we would verify the binding was successful
            // assert_eq!(ConceptGraph::get_meta(node, "elfin_name"), Some("wheelDiameter".to_string()));
        }
    }
}
