/**
 * Benchmark suite for ψ-Trajectory
 * ------------------------------------------------------------------
 * Comprehensive benchmark suite for performance testing and memory profiling:
 * - Memory optimization benchmarks
 * - SIMD acceleration benchmarks
 * - Kernel performance benchmarks
 * - Integration benchmarks
 */

// Memory optimization benchmarks
pub mod memory_benchmark;

// Re-export benchmark functions
pub use memory_benchmark::memory_benchmarks;
pub use memory_benchmark::run_comprehensive_benchmark;

/// Main function for running all benchmarks
pub fn run_all_benchmarks() {
    println!("Running memory optimization benchmarks...");
    let memory_report = memory_benchmark::run_comprehensive_benchmark();
    
    // Save memory report
    let markdown = memory_report.generate_markdown();
    if let Err(e) = std::fs::write("memory_report.md", markdown) {
        eprintln!("Failed to write memory report: {}", e);
    } else {
        println!("Memory report saved to memory_report.md");
    }
    
    // Add more benchmarks here as they are implemented
    
    println!("All benchmarks completed.");
}

/// Default benchmark function for Criterion
pub fn default_benchmarks() {
    let mut criterion = criterion::Criterion::default()
        .configure_from_args();
    
    // Run memory benchmarks
    memory_benchmarks(&mut criterion);
    
    // Add more benchmark groups here as they are implemented
}

/// Run memory profiling for CI
pub fn profile_memory_for_ci() -> bool {
    println!("Running memory profiling for CI...");
    
    // Initialize profiling
    if let Err(e) = crate::profiling::init_global_profiler() {
        eprintln!("Failed to initialize profiler: {}", e);
        return false;
    }
    
    // Run comprehensive benchmark
    let report = memory_benchmark::run_comprehensive_benchmark();
    
    // Check desktop target (150 MB)
    let desktop_target_met = report.peak_memory <= 150 * 1024 * 1024;
    
    // Check mobile target (90 MB)
    let mobile_target_met = report.peak_memory <= 90 * 1024 * 1024;
    
    // Generate and save report
    if let Ok(path) = crate::profiling::global_profiler()
        .and_then(|p| Ok(p.save_report(&report)))
    {
        println!("Memory profile saved to {}", path);
    }
    
    // Generate markdown report with CI-specific flags
    let mut markdown = report.generate_markdown();
    
    // Add CI status badges
    markdown = format!(
        "# Memory Profiling CI Report\n\n\
        ![Desktop Target](https://img.shields.io/badge/Desktop_Target_(150MB)-{}-{})\n\
        ![Mobile Target](https://img.shields.io/badge/Mobile_Target_(90MB)-{}-{})\n\n\
        {}\n",
        if desktop_target_met { "PASS" } else { "FAIL" },
        if desktop_target_met { "success" } else { "critical" },
        if mobile_target_met { "PASS" } else { "FAIL" },
        if mobile_target_met { "success" } else { "critical" },
        markdown
    );
    
    // Save CI report
    if let Err(e) = std::fs::write("memory_report_ci.md", markdown) {
        eprintln!("Failed to write CI memory report: {}", e);
    }
    
    // Return success status for CI
    desktop_target_met
}
