/**
 * Memory Profiling Module
 * ------------------------------------------------------------------
 * Tools for memory usage tracking and optimization in ψ-Trajectory
 * 
 * This module provides:
 * - Cross-platform heap profiling interfaces
 * - Allocation tracking for peak memory analysis
 * - Memory reporting for CI/benchmarking
 */

mod trace;
mod report;

pub use trace::*;
pub use report::*;

#[cfg(feature = "profiling")]
use tracing_alloc::DeferredAlloc;

/// Enable or disable memory profiling at runtime
/// 
/// When profiling is disabled, all tracking has zero overhead
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ProfilingMode {
    /// No tracking, zero overhead
    Disabled,
    
    /// Track allocations, medium overhead
    AllocationTracking,
    
    /// Full tracking with callstacks, high overhead
    FullDetailTracking,
}

/// Global configuration for the memory profiler
pub struct MemoryProfiler {
    mode: ProfilingMode,
    
    /// Maximum heap memory observed (in bytes)
    pub peak_memory: usize,
    
    /// Total number of allocations recorded
    pub total_allocations: usize,
    
    /// When profiling started (if active)
    pub start_time: Option<std::time::Instant>,
    
    /// Last time a snapshot was taken (if active)
    pub last_snapshot: Option<std::time::Instant>,
    
    /// Output directory for reports
    pub output_dir: String,
    
    // Platform-specific tracking data
    #[cfg(target_os = "macos")]
    instruments_session: Option<trace::mac::InstrumentsSession>,
    
    #[cfg(target_os = "android")]
    perfetto_session: Option<trace::android::PerfettoSession>,
    
    #[cfg(feature = "profiling")]
    deferred_alloc: Option<DeferredAlloc>,
}

impl Default for MemoryProfiler {
    fn default() -> Self {
        Self {
            mode: ProfilingMode::Disabled,
            peak_memory: 0,
            total_allocations: 0,
            start_time: None,
            last_snapshot: None,
            output_dir: String::from("./memory_profiles"),
            
            #[cfg(target_os = "macos")]
            instruments_session: None,
            
            #[cfg(target_os = "android")]
            perfetto_session: None,
            
            #[cfg(feature = "profiling")]
            deferred_alloc: None,
        }
    }
}

impl MemoryProfiler {
    /// Create a new memory profiler instance
    pub fn new() -> Self {
        Self::default()
    }
    
    /// Start profiling with the specified mode
    pub fn start(&mut self, mode: ProfilingMode) -> Result<(), &'static str> {
        if self.is_active() {
            return Err("Profiling already active");
        }
        
        self.mode = mode;
        self.start_time = Some(std::time::Instant::now());
        self.last_snapshot = self.start_time;
        
        // Initialize platform-specific tracers when in detailed mode
        if mode == ProfilingMode::FullDetailTracking {
            #[cfg(target_os = "macos")]
            {
                self.instruments_session = Some(trace::mac::InstrumentsSession::new());
            }
            
            #[cfg(target_os = "android")]
            {
                self.perfetto_session = Some(trace::android::PerfettoSession::new());
            }
        }
        
        // Initialize deferred allocation tracking if available
        #[cfg(feature = "profiling")]
        {
            if mode != ProfilingMode::Disabled {
                self.deferred_alloc = Some(DeferredAlloc::new());
            }
        }
        
        Ok(())
    }
    
    /// Stop profiling and generate a report
    pub fn stop(&mut self) -> Result<report::MemoryReport, &'static str> {
        if !self.is_active() {
            return Err("Profiling not active");
        }
        
        // Collect final snapshot
        let snapshot = self.take_snapshot()?;
        
        // Generate report
        let report = report::MemoryReport {
            peak_memory: self.peak_memory,
            total_allocations: self.total_allocations,
            duration: self.start_time.unwrap().elapsed(),
            snapshots: vec![snapshot],
            top_allocations: self.collect_top_allocations(),
        };
        
        // Cleanup platform-specific tracers
        #[cfg(target_os = "macos")]
        {
            if let Some(session) = self.instruments_session.take() {
                session.finish();
            }
        }
        
        #[cfg(target_os = "android")]
        {
            if let Some(session) = self.perfetto_session.take() {
                session.finish();
            }
        }
        
        // Cleanup deferred allocation tracking
        #[cfg(feature = "profiling")]
        {
            if let Some(deferred) = self.deferred_alloc.take() {
                // Print top allocation sites
                deferred.report_top_n(10);
            }
        }
        
        // Reset state
        self.mode = ProfilingMode::Disabled;
        self.start_time = None;
        self.last_snapshot = None;
        
        Ok(report)
    }
    
    /// Check if profiling is currently active
    #[inline]
    pub fn is_active(&self) -> bool {
        self.mode != ProfilingMode::Disabled
    }
    
    /// Take a memory snapshot for the current process
    pub fn take_snapshot(&mut self) -> Result<report::MemorySnapshot, &'static str> {
        if !self.is_active() {
            return Err("Profiling not active");
        }
        
        let now = std::time::Instant::now();
        let elapsed = self.start_time.unwrap().elapsed();
        
        // Get current memory usage
        let current_memory = self.get_current_memory_usage();
        
        // Update peak memory if needed
        if current_memory > self.peak_memory {
            self.peak_memory = current_memory;
        }
        
        // Create snapshot
        let snapshot = report::MemorySnapshot {
            timestamp: elapsed,
            memory_usage: current_memory,
            allocation_count: self.total_allocations,
        };
        
        self.last_snapshot = Some(now);
        
        Ok(snapshot)
    }
    
    /// Save the current memory profile report to a file
    pub fn save_report(&self, report: &report::MemoryReport) -> Result<String, String> {
        // Ensure output directory exists
        std::fs::create_dir_all(&self.output_dir)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;
        
        // Generate filename with timestamp
        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let filename = format!("{}/memory_profile_{}.json", self.output_dir, timestamp);
        
        // Serialize report to JSON
        let json = serde_json::to_string_pretty(report)
            .map_err(|e| format!("Failed to serialize report: {}", e))?;
        
        // Write to file
        std::fs::write(&filename, json)
            .map_err(|e| format!("Failed to write report file: {}", e))?;
        
        Ok(filename)
    }
    
    /// Get current memory usage for the process
    fn get_current_memory_usage(&self) -> usize {
        // Platform-specific memory usage tracking
        #[cfg(target_os = "macos")]
        {
            if let Some(session) = &self.instruments_session {
                return session.get_current_memory();
            }
        }
        
        #[cfg(target_os = "android")]
        {
            if let Some(session) = &self.perfetto_session {
                return session.get_current_memory();
            }
        }
        
        // Fallback to system memory info
        self.get_system_memory_usage()
    }
    
    /// Get system memory usage (fallback when platform-specific tracking is unavailable)
    fn get_system_memory_usage(&self) -> usize {
        #[cfg(target_os = "linux")]
        {
            // Read /proc/self/statm for Linux systems (including Android)
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
            // Use mach task info API for macOS/iOS
            use std::ffi::c_void;
            
            extern "C" {
                fn get_process_memory_info() -> usize;
            }
            
            unsafe {
                return get_process_memory_info();
            }
        }
        
        #[cfg(target_os = "windows")]
        {
            // Use GetProcessMemoryInfo for Windows
            use winapi::um::psapi::{GetProcessMemoryInfo, PROCESS_MEMORY_COUNTERS};
            use winapi::um::processthreadsapi::GetCurrentProcess;
            
            unsafe {
                let mut pmc: PROCESS_MEMORY_COUNTERS = std::mem::zeroed();
                pmc.cb = std::mem::size_of::<PROCESS_MEMORY_COUNTERS>() as u32;
                
                if GetProcessMemoryInfo(
                    GetCurrentProcess(),
                    &mut pmc,
                    std::mem::size_of::<PROCESS_MEMORY_COUNTERS>() as u32,
                ) != 0
                {
                    return pmc.WorkingSetSize as usize;
                }
            }
        }
        
        // Default fallback
        0
    }
    
    /// Collect top allocation sites
    fn collect_top_allocations(&self) -> Vec<report::AllocationSite> {
        let mut sites = Vec::new();
        
        #[cfg(feature = "profiling")]
        {
            if let Some(deferred) = &self.deferred_alloc {
                // Get top allocation data from tracing_alloc
                for (i, site) in deferred.top_n(10).iter().enumerate() {
                    sites.push(report::AllocationSite {
                        rank: i + 1,
                        size: site.size,
                        count: site.count,
                        location: site.location.clone(),
                    });
                }
            }
        }
        
        sites
    }
}

/// Global memory profiler singleton for easier access
static mut GLOBAL_PROFILER: Option<MemoryProfiler> = None;

/// Initialize the global memory profiler
pub fn init_global_profiler() -> Result<(), &'static str> {
    unsafe {
        if GLOBAL_PROFILER.is_some() {
            return Err("Global profiler already initialized");
        }
        
        GLOBAL_PROFILER = Some(MemoryProfiler::new());
        Ok(())
    }
}

/// Get reference to the global memory profiler
pub fn global_profiler() -> Result<&'static mut MemoryProfiler, &'static str> {
    unsafe {
        match &mut GLOBAL_PROFILER {
            Some(profiler) => Ok(profiler),
            None => Err("Global profiler not initialized"),
        }
    }
}

/// Start global profiling session
pub fn start_profiling(mode: ProfilingMode) -> Result<(), &'static str> {
    let profiler = global_profiler()?;
    profiler.start(mode)
}

/// Stop global profiling session and get report
pub fn stop_profiling() -> Result<report::MemoryReport, &'static str> {
    let profiler = global_profiler()?;
    profiler.stop()
}

/// Take a snapshot of current memory usage
pub fn take_snapshot() -> Result<report::MemorySnapshot, &'static str> {
    let profiler = global_profiler()?;
    profiler.take_snapshot()
}

/// Create memory report from a session with periodic snapshots
pub fn profile_session<F>(mode: ProfilingMode, snapshot_interval_ms: u64, func: F) -> Result<report::MemoryReport, &'static str>
where
    F: FnOnce() -> ()
{
    let profiler = global_profiler()?;
    
    // Start profiling
    profiler.start(mode)?;
    
    // Create background thread for snapshots
    let snapshot_handle = if snapshot_interval_ms > 0 {
        let snapshot_interval = std::time::Duration::from_millis(snapshot_interval_ms);
        
        // Thread to periodically take snapshots
        Some(std::thread::spawn(move || {
            let mut snapshots = Vec::new();
            
            loop {
                std::thread::sleep(snapshot_interval);
                
                // Try to take a snapshot
                match take_snapshot() {
                    Ok(snapshot) => snapshots.push(snapshot),
                    Err(_) => break, // Profiling stopped
                }
            }
            
            snapshots
        }))
    } else {
        None
    };
    
    // Run the provided function
    func();
    
    // Stop profiling to get the report
    let mut report = profiler.stop()?;
    
    // Wait for the snapshot thread and collect the snapshots
    if let Some(handle) = snapshot_handle {
        if let Ok(snapshots) = handle.join() {
            report.snapshots = snapshots;
        }
    }
    
    Ok(report)
}

/// Track memory usage during a specific function or block of code
#[macro_export]
macro_rules! track_memory {
    ($name:expr, $mode:expr, $body:block) => {{
        let profiler_result = $crate::profiling::profile_session(
            $mode,
            500, // snapshot every 500ms
            || $body
        );
        
        match profiler_result {
            Ok(report) => {
                // Log results
                tracing::info!(
                    "{} memory usage: peak={}MB, allocs={}",
                    $name,
                    report.peak_memory / (1024 * 1024),
                    report.total_allocations
                );
                
                // Save report
                if let Ok(path) = $crate::profiling::global_profiler()
                    .and_then(|p| Ok(p.save_report(&report)))
                {
                    tracing::info!("Memory profile saved to {}", path);
                }
            }
            Err(e) => {
                tracing::error!("Memory profiling failed: {}", e);
            }
        }
    }};
}

// Convenience function for quick memory usage snapshots
pub fn log_memory_usage(label: &str) {
    let memory = global_profiler()
        .and_then(|p| Ok(p.get_system_memory_usage()))
        .unwrap_or(0);
    
    tracing::info!(
        "{}: current memory usage = {}MB",
        label,
        memory / (1024 * 1024)
    );
}
