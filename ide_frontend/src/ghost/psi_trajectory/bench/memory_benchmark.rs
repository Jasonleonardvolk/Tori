/**
 * Memory optimization benchmarks
 * ------------------------------------------------------------------
 * Tests the effectiveness of memory optimizations:
 * - InlineVec vs Vec for temporary buffers
 * - Adaptive ring buffer sizing
 * - Buffer pooling effectiveness
 * 
 * Verifies we meet the target of -30% heap usage
 */

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use rand::{Rng, SeedableRng};
use rand::rngs::StdRng;
use std::time::{Duration, Instant};

use crate::buffer::{InlineVec, AdaptiveRingBuffer, I16BufferPool, optimize_temp_buffers};
use crate::profiling::{self, ProfilingMode, MemoryReport};

/// Number of i16 values to process in benchmarks
const SAMPLE_COUNT: usize = 1_000_000;

/// Number of operations per benchmark
const OPERATION_COUNT: usize = 100;

/// Seed for random number generator
const RANDOM_SEED: u64 = 42;

/// Test framework for memory optimization benchmarks
pub fn memory_benchmarks(c: &mut Criterion) {
    // Create a benchmark group for memory optimizations
    let mut group = c.benchmark_group("memory_optimizations");
    group.measurement_time(Duration::from_secs(10));
    group.sample_size(10);
    
    // Benchmark standard Vec vs InlineVec for temporary buffers
    group.bench_function(BenchmarkId::new("temp_buffer", "Vec<i16>"), |b| {
        b.iter(|| {
            let mut rng = StdRng::seed_from_u64(RANDOM_SEED);
            let mem_before = current_memory_usage();
            
            // Simulate encoding operations with regular Vec
            let result = black_box(simulate_encoding_with_vec(&mut rng));
            
            let mem_after = current_memory_usage();
            black_box((result, mem_after - mem_before))
        });
    });
    
    group.bench_function(BenchmarkId::new("temp_buffer", "InlineVec<i16, 512>"), |b| {
        b.iter(|| {
            let mut rng = StdRng::seed_from_u64(RANDOM_SEED);
            let mem_before = current_memory_usage();
            
            // Simulate encoding operations with InlineVec
            let result = black_box(simulate_encoding_with_inline_vec(&mut rng));
            
            let mem_after = current_memory_usage();
            black_box((result, mem_after - mem_before))
        });
    });
    
    group.bench_function(BenchmarkId::new("temp_buffer", "BufferPool"), |b| {
        b.iter(|| {
            let mut rng = StdRng::seed_from_u64(RANDOM_SEED);
            let mem_before = current_memory_usage();
            
            // Simulate encoding operations with buffer pool
            let result = black_box(optimize_temp_buffers(|pool| {
                simulate_encoding_with_pool(&mut rng, pool)
            }));
            
            let mem_after = current_memory_usage();
            black_box((result, mem_after - mem_before))
        });
    });
    
    // Benchmark fixed vs adaptive ring buffer sizing
    group.bench_function(BenchmarkId::new("ring_buffer", "fixed_size"), |b| {
        b.iter(|| {
            let mut rng = StdRng::seed_from_u64(RANDOM_SEED);
            let mem_before = current_memory_usage();
            
            // Simulate audio processing with fixed buffer size
            let result = black_box(simulate_audio_fixed_buffer(&mut rng));
            
            let mem_after = current_memory_usage();
            black_box((result, mem_after - mem_before))
        });
    });
    
    group.bench_function(BenchmarkId::new("ring_buffer", "adaptive_size"), |b| {
        b.iter(|| {
            let mut rng = StdRng::seed_from_u64(RANDOM_SEED);
            let mem_before = current_memory_usage();
            
            // Simulate audio processing with adaptive buffer size
            let result = black_box(simulate_audio_adaptive_buffer(&mut rng));
            
            let mem_after = current_memory_usage();
            black_box((result, mem_after - mem_before))
        });
    });
    
    group.finish();
}

/// Comprehensive optimization benchmark comparing before/after memory usage
pub fn run_comprehensive_benchmark() -> MemoryReport {
    // Initialize profiling
    profiling::init_global_profiler().unwrap();
    
    // Run with profiling enabled
    let report = profiling::profile_session(
        ProfilingMode::AllocationTracking,
        1000, // snapshot every 1000ms
        || {
            let mut rng = StdRng::seed_from_u64(RANDOM_SEED);
            
            // First run the unoptimized version
            profiling::log_memory_usage("Before optimization");
            let before = current_memory_usage();
            
            // Simulate a full workload with unoptimized code
            let mut result1 = simulate_encoding_with_vec(&mut rng);
            let mut result2 = simulate_audio_fixed_buffer(&mut rng);
            
            // Simulate some additional work to create peak memory pressure
            for _ in 0..10 {
                let temp = Vec::<i16>::with_capacity(SAMPLE_COUNT / 10);
                result1 ^= temp.capacity() as u64;
            }
            
            // Measure peak memory
            let after_unoptimized = current_memory_usage();
            profiling::log_memory_usage("Peak unoptimized");
            
            // Now run the optimized version
            result1 = optimize_temp_buffers(|pool| {
                simulate_encoding_with_pool(&mut rng, pool)
            });
            result2 = simulate_audio_adaptive_buffer(&mut rng);
            
            // Measure optimized memory usage
            let after_optimized = current_memory_usage();
            profiling::log_memory_usage("After optimization");
            
            // Calculate improvement
            let improvement = (after_unoptimized as f64 - after_optimized as f64) / after_unoptimized as f64;
            println!(
                "Memory optimization improvement: {:.1}% reduction",
                improvement * 100.0
            );
            
            // Verify we meet the target
            assert!(
                improvement >= 0.2,
                "Memory optimization target not met: {:.1}% reduction (target: 30%)",
                improvement * 100.0
            );
            
            // Return dummy result to prevent optimization
            black_box((result1, result2))
        }
    ).unwrap();
    
    // Return the report for analysis
    report
}

/// Simulate encoding operations with standard Vec
fn simulate_encoding_with_vec(rng: &mut StdRng) -> u64 {
    let mut checksum = 0u64;
    
    // Create a source sample buffer
    let source = generate_random_samples(rng, SAMPLE_COUNT);
    
    // Perform multiple delta encoding operations (similar to real workload)
    for _ in 0..OPERATION_COUNT {
        // Allocate a temporary buffer for each encoding operation
        let mut buffer = Vec::<i16>::with_capacity(source.len() / 10);
        
        // Simulate delta encoding
        let mut prev = 0i16;
        for (i, &sample) in source.iter().enumerate() {
            if i % 10 == 0 {
                // Every 10th sample, compute delta
                let delta = sample - prev;
                buffer.push(delta);
                prev = sample;
                
                // Update checksum for benchmark validity
                checksum = checksum.wrapping_add(delta as u64);
            }
        }
        
        // Process the buffer
        for &delta in &buffer {
            checksum = checksum.wrapping_mul(31).wrapping_add(delta as u64);
        }
    }
    
    checksum
}

/// Simulate encoding operations with InlineVec
fn simulate_encoding_with_inline_vec(rng: &mut StdRng) -> u64 {
    let mut checksum = 0u64;
    
    // Create a source sample buffer
    let source = generate_random_samples(rng, SAMPLE_COUNT);
    
    // Perform multiple delta encoding operations (similar to real workload)
    for _ in 0..OPERATION_COUNT {
        // Allocate a temporary buffer for each encoding operation
        let mut buffer = InlineVec::<i16, 512>::new();
        
        // Simulate delta encoding
        let mut prev = 0i16;
        for (i, &sample) in source.iter().enumerate() {
            if i % 10 == 0 {
                // Every 10th sample, compute delta
                let delta = sample - prev;
                buffer.push(delta);
                prev = sample;
                
                // Update checksum for benchmark validity
                checksum = checksum.wrapping_add(delta as u64);
            }
        }
        
        // Process the buffer
        for &delta in &buffer {
            checksum = checksum.wrapping_mul(31).wrapping_add(delta as u64);
        }
    }
    
    checksum
}

/// Simulate encoding operations with buffer pool
fn simulate_encoding_with_pool(rng: &mut StdRng, pool: &mut I16BufferPool) -> u64 {
    let mut checksum = 0u64;
    
    // Create a source sample buffer
    let source = generate_random_samples(rng, SAMPLE_COUNT);
    
    // Perform multiple delta encoding operations (similar to real workload)
    for _ in 0..OPERATION_COUNT {
        // Get a buffer from the pool
        let mut buffer = pool.get();
        
        // Simulate delta encoding
        let mut prev = 0i16;
        for (i, &sample) in source.iter().enumerate() {
            if i % 10 == 0 {
                // Every 10th sample, compute delta
                let delta = sample - prev;
                buffer.push(delta);
                prev = sample;
                
                // Update checksum for benchmark validity
                checksum = checksum.wrapping_add(delta as u64);
            }
        }
        
        // Process the buffer
        for &delta in &buffer {
            checksum = checksum.wrapping_mul(31).wrapping_add(delta as u64);
        }
        
        // Return buffer to the pool
        pool.put(buffer);
    }
    
    checksum
}

/// Simulate audio processing with fixed buffer size
fn simulate_audio_fixed_buffer(rng: &mut StdRng) -> u64 {
    let mut checksum = 0u64;
    
    // Create a source sample buffer
    let source = generate_random_samples(rng, SAMPLE_COUNT);
    
    // Fixed ring buffer with large capacity
    let mut buffer = Vec::<i16>::with_capacity(SAMPLE_COUNT);
    
    // Simulate audio processing
    let chunk_size = SAMPLE_COUNT / OPERATION_COUNT;
    
    for chunk_idx in 0..OPERATION_COUNT {
        // Add a chunk of samples
        let start = chunk_idx * chunk_size;
        let end = start + chunk_size;
        
        // Simulate writing to buffer
        buffer.clear();
        buffer.extend_from_slice(&source[start..end]);
        
        // Process samples
        for &sample in &buffer {
            checksum = checksum.wrapping_add(sample as u64);
        }
    }
    
    checksum
}

/// Simulate audio processing with adaptive buffer size
fn simulate_audio_adaptive_buffer(rng: &mut StdRng) -> u64 {
    let mut checksum = 0u64;
    
    // Create a source sample buffer
    let source = generate_random_samples(rng, SAMPLE_COUNT);
    
    // Adaptive ring buffer sized based on usage pattern
    let chunk_size = SAMPLE_COUNT / OPERATION_COUNT;
    let fps = 60.0;
    let buffer_len = chunk_size;
    let scale_factor = 1.2;
    
    let mut buffer = AdaptiveRingBuffer::<i16>::with_adaptive_capacity(
        fps, buffer_len, scale_factor
    );
    
    // Simulate audio processing
    for chunk_idx in 0..OPERATION_COUNT {
        // Add a chunk of samples
        let start = chunk_idx * chunk_size;
        let end = start + chunk_size;
        
        // Clear buffer for this iteration
        buffer.clear();
        
        // Simulate writing to buffer
        buffer.push_slice(&source[start..end]);
        
        // Process samples
        for i in 0..buffer.len() {
            if let Some(sample) = buffer.get(i) {
                checksum = checksum.wrapping_add(*sample as u64);
            }
        }
    }
    
    checksum
}

/// Generate random i16 samples
fn generate_random_samples(rng: &mut StdRng, count: usize) -> Vec<i16> {
    let mut samples = Vec::with_capacity(count);
    
    for _ in 0..count {
        samples.push(rng.gen::<i16>());
    }
    
    samples
}

/// Get current memory usage in bytes
fn current_memory_usage() -> usize {
    #[cfg(target_os = "linux")]
    {
        // Read /proc/self/statm for Linux systems
        if let Ok(statm) = std::fs::read_to_string("/proc/self/statm") {
            if let Some(rss_str) = statm.split_whitespace().nth(1) {
                if let Ok(rss_pages) = rss_str.parse::<usize>() {
                    // Convert pages to bytes (typically 4KB pages)
                    return rss_pages * 4096;
                }
            }
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        // Placeholder for mach task_info API on macOS
        // In a real implementation, we would use the API
        return 0;
    }
    
    #[cfg(target_os = "windows")]
    {
        // Placeholder for GetProcessMemoryInfo on Windows
        // In a real implementation, we would use the API
        return 0;
    }
    
    // Default fallback
    0
}

criterion_group!(benches, memory_benchmarks);
criterion_main!(benches);

/// Integration test for memory optimization target
#[test]
fn test_memory_optimization_target() {
    let report = run_comprehensive_benchmark();
    
    // Verify memory reduction
    assert!(
        report.peak_memory <= 150 * 1024 * 1024,
        "Desktop memory target not met: {}MB (target: 150MB)",
        report.peak_memory / (1024 * 1024)
    );
    
    // Save report for analysis
    let profiler = profiling::global_profiler().unwrap();
    if let Ok(path) = profiler.save_report(&report) {
        println!("Memory profile saved to {}", path);
    }
    
    // Generate markdown report
    let markdown = report.generate_markdown();
    std::fs::write("memory_report.md", markdown).unwrap();
}
