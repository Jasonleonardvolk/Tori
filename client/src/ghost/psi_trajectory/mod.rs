/**
 * ψ-Trajectory Module
 * ------------------------------------------------------------------
 * Phase 6 Implementation: Memory optimization and dual-channel framework
 * 
 * This module integrates:
 * - Memory-optimized buffer implementations
 * - Profiling tools for memory usage tracking
 * - Versioning and compatibility mechanisms
 * - Archive encryption and security
 * - CLI tools for management
 * 
 * Part of the unified audio+visual generative framework using
 * oscillator-based phase synchronization.
 */

// Buffer optimizations (30% memory reduction)
pub mod buffer;

// Memory profiling tools
pub mod profiling;

// Benchmarking suite
pub mod bench;

// Version compatibility and migration
pub mod compat;

// Encryption and security (optional)
#[cfg(feature = "secure")]
pub mod crypto;

// Binary tools
pub mod bin;

// Re-export key types and functions
pub use buffer::{InlineVec, AdaptiveRingBuffer};
pub use profiling::{start_profiling, stop_profiling, ProfilingMode};
pub use compat::{DEFAULT_OSCILLATOR_COUNT, migrate_oscillator_state};

/// Current version of the ψ-Trajectory module
pub const VERSION: &str = "6.0.0";

/// Performance-critical constants
pub mod constants {
    /// Maximum oscillator count supported
    pub const MAX_OSCILLATOR_COUNT: usize = 1024;
    
    /// Default audio sample rate
    pub const DEFAULT_SAMPLE_RATE: usize = 48000;
    
    /// Default visual frame rate
    pub const DEFAULT_FRAME_RATE: f32 = 60.0;
    
    /// Mobile memory target (MB)
    pub const MOBILE_MEMORY_TARGET_MB: usize = 90;
    
    /// Desktop memory target (MB)
    pub const DESKTOP_MEMORY_TARGET_MB: usize = 150;
}

/// Initialize the ψ-Trajectory module with the given settings
pub fn initialize(oscillator_count: Option<usize>) -> Result<(), &'static str> {
    // Initialize profiling
    profiling::init_global_profiler()?;
    
    // Use default oscillator count if not specified
    let oscillator_count = oscillator_count.unwrap_or(compat::DEFAULT_OSCILLATOR_COUNT);
    
    // Validate oscillator count
    if oscillator_count > constants::MAX_OSCILLATOR_COUNT {
        return Err("Oscillator count exceeds maximum supported value");
    }
    
    // Log initialization
    tracing::info!(
        "ψ-Trajectory v{} initialized with {} oscillators",
        VERSION,
        oscillator_count
    );
    
    Ok(())
}

/// Configuration for the ψ-Trajectory module
#[derive(Debug, Clone)]
pub struct Config {
    /// Number of oscillators to use
    pub oscillator_count: usize,
    
    /// Whether to use memory profiling
    pub profile_memory: bool,
    
    /// Target platform (affects memory optimization)
    pub target_platform: Platform,
    
    /// Whether to use encryption for storage
    pub use_encryption: bool,
    
    /// Audio sample rate
    pub sample_rate: usize,
    
    /// Visual frame rate
    pub frame_rate: f32,
}

/// Target platform for optimization
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Platform {
    /// Mobile devices (lower memory target)
    Mobile,
    
    /// Desktop systems (higher memory target)
    Desktop,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            oscillator_count: compat::DEFAULT_OSCILLATOR_COUNT,
            profile_memory: cfg!(debug_assertions),
            target_platform: Platform::Desktop,
            use_encryption: false,
            sample_rate: constants::DEFAULT_SAMPLE_RATE,
            frame_rate: constants::DEFAULT_FRAME_RATE,
        }
    }
}

impl Config {
    /// Create a new configuration with default values
    pub fn new() -> Self {
        Self::default()
    }
    
    /// Create a configuration optimized for mobile devices
    pub fn mobile() -> Self {
        Self {
            target_platform: Platform::Mobile,
            // Mobile-optimized parameters
            oscillator_count: 128, // Reduced from default 256
            ..Self::default()
        }
    }
    
    /// Create a configuration for high-performance desktop systems
    pub fn desktop_high_performance() -> Self {
        Self {
            oscillator_count: 512, // Increased for quality
            ..Self::default()
        }
    }
    
    /// Get memory target based on platform
    pub fn memory_target_mb(&self) -> usize {
        match self.target_platform {
            Platform::Mobile => constants::MOBILE_MEMORY_TARGET_MB,
            Platform::Desktop => constants::DESKTOP_MEMORY_TARGET_MB,
        }
    }
    
    /// Initialize with this configuration
    pub fn initialize(&self) -> Result<(), &'static str> {
        // Start profiling if enabled
        if self.profile_memory {
            profiling::start_profiling(ProfilingMode::AllocationTracking)?;
        }
        
        // Initialize with oscillator count
        initialize(Some(self.oscillator_count))
    }
}

/// Run memory-optimized and check if it meets target
pub fn run_memory_check<F>(config: &Config, func: F) -> Result<bool, &'static str>
where
    F: FnOnce() -> ()
{
    // Start profiling
    profiling::start_profiling(ProfilingMode::AllocationTracking)?;
    
    // Run the function
    func();
    
    // Stop profiling and get report
    let report = profiling::stop_profiling()?;
    
    // Check if memory usage is within target
    let target_mb = config.memory_target_mb();
    let peak_mb = report.peak_memory / (1024 * 1024);
    
    Ok(peak_mb <= target_mb)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_initialization() {
        // Initialize with default settings
        let result = initialize(None);
        assert!(result.is_ok());
        
        // Initialize with custom oscillator count
        let result = initialize(Some(128));
        assert!(result.is_ok());
        
        // Initialize with too large oscillator count
        let result = initialize(Some(constants::MAX_OSCILLATOR_COUNT + 1));
        assert!(result.is_err());
    }
    
    #[test]
    fn test_buffer_memory_optimization() {
        use buffer::InlineVec;
        
        // Compare memory usage of Vec vs InlineVec
        let mut vec_allocations = 0;
        let mut inline_vec_allocations = 0;
        
        // Track allocations for Vec
        {
            let mut vec = Vec::<i16>::new();
            for i in 0..100 {
                // Every resize is a new allocation
                if vec.capacity() <= i {
                    vec_allocations += 1;
                }
                vec.push(i as i16);
            }
        }
        
        // Track allocations for InlineVec
        {
            let mut inline_vec = InlineVec::<i16, 64>::new();
            for i in 0..100 {
                // Only allocate once we exceed inline capacity
                if inline_vec.capacity() <= i && inline_vec.is_inline() {
                    inline_vec_allocations += 1;
                }
                inline_vec.push(i as i16);
            }
        }
        
        // InlineVec should have fewer allocations
        assert!(inline_vec_allocations < vec_allocations);
    }
    
    #[test]
    fn test_config_memory_targets() {
        let desktop_config = Config::default();
        let mobile_config = Config::mobile();
        
        assert_eq!(
            desktop_config.memory_target_mb(),
            constants::DESKTOP_MEMORY_TARGET_MB
        );
        
        assert_eq!(
            mobile_config.memory_target_mb(),
            constants::MOBILE_MEMORY_TARGET_MB
        );
        
        // Mobile target should be less than desktop
        assert!(mobile_config.memory_target_mb() < desktop_config.memory_target_mb());
    }
    
    #[test]
    fn test_oscillator_migration() {
        // Source with 2 oscillators and 2 values each
        let source = vec![1.0, 2.0, 3.0, 4.0];
        
        // Migrate up to 3 oscillators
        let upsize = compat::migrate_oscillator_state(&source, 2, 3);
        assert_eq!(upsize, vec![1.0, 2.0, 3.0, 4.0, 0.0, 0.0]);
        
        // Migrate down to 1 oscillator
        let downsize = compat::migrate_oscillator_state(&source, 2, 1);
        assert_eq!(downsize, vec![1.0, 2.0]);
    }
}
