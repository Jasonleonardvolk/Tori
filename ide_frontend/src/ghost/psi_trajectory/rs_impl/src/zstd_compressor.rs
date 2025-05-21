//! Zstd Compression for ψ-Trajectory
//!
//! This module provides high-performance Zstd compression for the ψ-Trajectory system.
//! It uses multi-threaded compression for background processing and offers both
//! streaming and block modes.

use std::io::{self, Read, Write};
use zstd::{Encoder, Decoder};
use std::sync::{Arc, Mutex};
use std::thread;
use std::collections::VecDeque;

/// Default compression level
pub const DEFAULT_COMPRESSION_LEVEL: i32 = 22;

/// Compression statistics
#[derive(Clone, Default)]
pub struct CompressionStats {
    /// Total bytes processed
    pub bytes_in: u64,
    
    /// Total bytes after compression
    pub bytes_out: u64,
    
    /// Total compression time in microseconds
    pub total_time_us: u64,
    
    /// Maximum compression time for a single chunk
    pub max_time_us: u64,
    
    /// Average compression time
    pub avg_time_us: f64,
    
    /// Number of chunks compressed
    pub chunks_processed: u64,
}

impl CompressionStats {
    /// Get the compression ratio
    pub fn ratio(&self) -> f64 {
        if self.bytes_out == 0 {
            0.0
        } else {
            self.bytes_in as f64 / self.bytes_out as f64
        }
    }
}

/// A simple Zstd compressor for block mode operation
pub struct ZstdCompressor {
    /// Compression level (1-22)
    level: i32,
    
    /// Statistics
    stats: CompressionStats,
}

impl ZstdCompressor {
    /// Create a new compressor with the given level
    pub fn new(level: i32) -> Self {
        Self {
            level: level.clamp(1, 22),
            stats: CompressionStats::default(),
        }
    }
    
    /// Compress a buffer
    pub fn compress(&mut self, input: &[u8]) -> io::Result<Vec<u8>> {
        use std::time::Instant;
        
        let start = Instant::now();
        
        // Compress using zstd
        let mut compressed = Vec::new();
        {
            let mut encoder = Encoder::new(&mut compressed, self.level)?;
            encoder.write_all(input)?;
            encoder.finish()?;
        }
        
        // Update statistics
        let elapsed = start.elapsed().as_micros() as u64;
        self.stats.bytes_in += input.len() as u64;
        self.stats.bytes_out += compressed.len() as u64;
        self.stats.total_time_us += elapsed;
        self.stats.max_time_us = self.stats.max_time_us.max(elapsed);
        self.stats.chunks_processed += 1;
        self.stats.avg_time_us = self.stats.total_time_us as f64 / self.stats.chunks_processed as f64;
        
        Ok(compressed)
    }
    
    /// Decompress a buffer
    pub fn decompress(&self, input: &[u8]) -> io::Result<Vec<u8>> {
        let mut decompressed = Vec::new();
        let mut decoder = Decoder::new(input)?;
        decoder.read_to_end(&mut decompressed)?;
        Ok(decompressed)
    }
    
    /// Get compression statistics
    pub fn stats(&self) -> CompressionStats {
        self.stats.clone()
    }
}

/// A more advanced multi-threaded compressor for background processing
pub struct AsyncCompressor {
    /// Shared compressor instance
    compressor: Arc<Mutex<ZstdCompressor>>,
    
    /// Queue for pending compression tasks
    queue: Arc<Mutex<VecDeque<(Vec<u8>, usize)>>>,
    
    /// Queue for completed compression results
    results: Arc<Mutex<VecDeque<(Vec<u8>, usize)>>>,
    
    /// Worker thread handle
    worker: Option<thread::JoinHandle<()>>,
    
    /// Flag to indicate if the worker should stop
    stop_flag: Arc<Mutex<bool>>,
}

impl AsyncCompressor {
    /// Create a new async compressor with the given level
    pub fn new(level: i32) -> Self {
        let compressor = Arc::new(Mutex::new(ZstdCompressor::new(level)));
        let queue = Arc::new(Mutex::new(VecDeque::new()));
        let results = Arc::new(Mutex::new(VecDeque::new()));
        let stop_flag = Arc::new(Mutex::new(false));
        
        // Create worker thread
        let worker_compressor = compressor.clone();
        let worker_queue = queue.clone();
        let worker_results = results.clone();
        let worker_stop_flag = stop_flag.clone();
        
        let worker = thread::spawn(move || {
            // Set thread priority to below normal
            #[cfg(target_os = "windows")]
            unsafe {
                use winapi::um::processthreadsapi::SetThreadPriority;
                use winapi::um::winbase::THREAD_PRIORITY_BELOW_NORMAL;
                SetThreadPriority(winapi::um::processthreadsapi::GetCurrentThread(), THREAD_PRIORITY_BELOW_NORMAL);
            }
            
            #[cfg(target_os = "macos")]
            unsafe {
                // On macOS, we would use pthread_setschedparam
                // This is a placeholder; in real code we would link to the appropriate function
            }
            
            #[cfg(all(unix, not(target_os = "macos")))]
            unsafe {
                // On Linux/Unix, we would use nice(1)
                // libc::nice(1);
            }
            
            loop {
                // Check if we should stop
                if *worker_stop_flag.lock().unwrap() {
                    break;
                }
                
                // Get next task
                let task = {
                    let mut queue = worker_queue.lock().unwrap();
                    queue.pop_front()
                };
                
                // Process task
                if let Some((input, id)) = task {
                    let result = {
                        let mut compressor = worker_compressor.lock().unwrap();
                        match compressor.compress(&input) {
                            Ok(compressed) => compressed,
                            Err(e) => {
                                eprintln!("Compression error: {}", e);
                                Vec::new()
                            }
                        }
                    };
                    
                    // Store result
                    let mut results = worker_results.lock().unwrap();
                    results.push_back((result, id));
                } else {
                    // No tasks, sleep a bit
                    thread::sleep(std::time::Duration::from_millis(1));
                }
            }
        });
        
        Self {
            compressor,
            queue,
            results,
            worker: Some(worker),
            stop_flag,
        }
    }
    
    /// Queue a buffer for compression
    pub fn queue_compress(&self, input: Vec<u8>, id: usize) {
        let mut queue = self.queue.lock().unwrap();
        queue.push_back((input, id));
    }
    
    /// Get the next completed compression result
    pub fn get_result(&self) -> Option<(Vec<u8>, usize)> {
        let mut results = self.results.lock().unwrap();
        results.pop_front()
    }
    
    /// Check if any results are available
    pub fn has_results(&self) -> bool {
        let results = self.results.lock().unwrap();
        !results.is_empty()
    }
    
    /// Get the number of pending tasks
    pub fn pending_count(&self) -> usize {
        let queue = self.queue.lock().unwrap();
        queue.len()
    }
    
    /// Get compression statistics
    pub fn stats(&self) -> CompressionStats {
        let compressor = self.compressor.lock().unwrap();
        compressor.stats()
    }
}

impl Drop for AsyncCompressor {
    fn drop(&mut self) {
        // Signal worker to stop
        {
            let mut stop = self.stop_flag.lock().unwrap();
            *stop = true;
        }
        
        // Wait for worker to finish
        if let Some(worker) = self.worker.take() {
            let _ = worker.join();
        }
    }
}

/// Dictionary-based compression for oscillator data
///
/// This is a more advanced compressor that uses a trained dictionary
/// for better compression of oscillator data. The dictionary is trained
/// on a sample of oscillator data and can be reused for multiple sessions.
pub struct DictionaryCompressor {
    /// The trained dictionary
    dictionary: Vec<u8>,
    
    /// Compression level
    level: i32,
    
    /// Statistics
    stats: CompressionStats,
}

impl DictionaryCompressor {
    /// Create a new dictionary compressor from a trained dictionary
    pub fn new(dictionary: Vec<u8>, level: i32) -> Self {
        Self {
            dictionary,
            level: level.clamp(1, 22),
            stats: CompressionStats::default(),
        }
    }
    
    /// Train a dictionary from sample data
    pub fn train_dictionary(samples: &[Vec<u8>], dict_size: usize) -> io::Result<Vec<u8>> {
        let dict = zstd::dict::from_samples(samples, dict_size)?;
        Ok(dict)
    }
    
    /// Compress a buffer using the dictionary
    pub fn compress(&mut self, input: &[u8]) -> io::Result<Vec<u8>> {
        use std::time::Instant;
        
        let start = Instant::now();
        
        // Compress using zstd with dictionary
        let mut compressed = Vec::new();
        {
            let mut encoder = zstd::dict::Encoder::with_dictionary(&mut compressed, &self.dictionary, self.level)?;
            encoder.write_all(input)?;
            encoder.finish()?;
        }
        
        // Update statistics
        let elapsed = start.elapsed().as_micros() as u64;
        self.stats.bytes_in += input.len() as u64;
        self.stats.bytes_out += compressed.len() as u64;
        self.stats.total_time_us += elapsed;
        self.stats.max_time_us = self.stats.max_time_us.max(elapsed);
        self.stats.chunks_processed += 1;
        self.stats.avg_time_us = self.stats.total_time_us as f64 / self.stats.chunks_processed as f64;
        
        Ok(compressed)
    }
    
    /// Decompress a buffer using the dictionary
    pub fn decompress(&self, input: &[u8]) -> io::Result<Vec<u8>> {
        let mut decompressed = Vec::new();
        let mut decoder = zstd::dict::Decoder::with_dictionary(input, &self.dictionary)?;
        decoder.read_to_end(&mut decompressed)?;
        Ok(decompressed)
    }
    
    /// Get compression statistics
    pub fn stats(&self) -> CompressionStats {
        self.stats.clone()
    }
    
    /// Save the dictionary to a file
    pub fn save_dictionary(&self, path: &std::path::Path) -> io::Result<()> {
        std::fs::write(path, &self.dictionary)
    }
    
    /// Load a dictionary from a file
    pub fn load_dictionary(path: &std::path::Path, level: i32) -> io::Result<Self> {
        let dictionary = std::fs::read(path)?;
        Ok(Self::new(dictionary, level))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_basic_compression() {
        let test_data = b"This is a test string that should compress well. Repetitive data like aaaaaaaaaaaaaaa and bbbbbbbbbbbbb should compress well.";
        
        let mut compressor = ZstdCompressor::new(DEFAULT_COMPRESSION_LEVEL);
        let compressed = compressor.compress(test_data).unwrap();
        let decompressed = compressor.decompress(&compressed).unwrap();
        
        assert_eq!(test_data.to_vec(), decompressed);
        assert!(compressed.len() < test_data.len());
        
        // Check statistics
        let stats = compressor.stats();
        assert_eq!(stats.bytes_in, test_data.len() as u64);
        assert_eq!(stats.bytes_out, compressed.len() as u64);
        assert_eq!(stats.chunks_processed, 1);
        assert!(stats.ratio() > 1.0);
    }
    
    #[test]
    fn test_dictionary_compression() {
        // Create test data that simulates oscillator patterns
        let samples = (0..10).map(|i| {
            let phase_data: Vec<u8> = (0..15).flat_map(|j| {
                let val = ((i + j) as i16).to_le_bytes();
                val.to_vec()
            }).collect();
            
            let amp_data: Vec<u8> = (0..15).flat_map(|j| {
                let val = ((100 + i + j) as i16).to_le_bytes();
                val.to_vec()
            }).collect();
            
            let emotion_data: Vec<u8> = (0..8).flat_map(|j| {
                let val = ((200 + i + j) as i16).to_le_bytes();
                val.to_vec()
            }).collect();
            
            let mut data = Vec::new();
            data.extend_from_slice(&phase_data);
            data.extend_from_slice(&amp_data);
            data.extend_from_slice(&emotion_data);
            data
        }).collect::<Vec<_>>();
        
        // Train dictionary
        let dict = DictionaryCompressor::train_dictionary(&samples, 8192).unwrap();
        let mut dict_compressor = DictionaryCompressor::new(dict, DEFAULT_COMPRESSION_LEVEL);
        
        // Create regular compressor for comparison
        let mut regular_compressor = ZstdCompressor::new(DEFAULT_COMPRESSION_LEVEL);
        
        // Test compression ratio improvement
        let test_data = samples.last().unwrap().clone();
        
        let dict_compressed = dict_compressor.compress(&test_data).unwrap();
        let regular_compressed = regular_compressor.compress(&test_data).unwrap();
        
        // Dictionary compression should be more efficient
        assert!(dict_compressed.len() <= regular_compressed.len());
        
        // Ensure decompression works
        let decompressed = dict_compressor.decompress(&dict_compressed).unwrap();
        assert_eq!(test_data, decompressed);
    }
    
    #[test]
    fn test_async_compressor() {
        use std::thread;
        use std::time::Duration;
        
        let compressor = AsyncCompressor::new(DEFAULT_COMPRESSION_LEVEL);
        
        // Queue a few tasks
        for i in 0..5 {
            let data = vec![i as u8; 1000];
            compressor.queue_compress(data, i);
        }
        
        // Wait for results
        let mut results = Vec::new();
        while results.len() < 5 {
            if let Some(result) = compressor.get_result() {
                results.push(result);
            } else {
                thread::sleep(Duration::from_millis(10));
            }
        }
        
        // Check results
        assert_eq!(results.len(), 5);
        
        // Check stats
        let stats = compressor.stats();
        assert_eq!(stats.chunks_processed, 5);
        assert!(stats.ratio() > 1.0);
    }
}
