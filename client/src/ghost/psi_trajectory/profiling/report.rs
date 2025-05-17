/**
 * Memory Profiling Reports
 * ------------------------------------------------------------------
 * Data structures and utilities for memory profiling reports
 */

use std::time::Duration;
use serde::{Serialize, Deserialize};

/// A single memory usage snapshot at a specific point in time
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemorySnapshot {
    /// Time elapsed since profiling started
    pub timestamp: Duration,
    
    /// Memory usage in bytes
    pub memory_usage: usize,
    
    /// Number of allocations at this point
    pub allocation_count: usize,
}

/// Information about a single allocation site
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllocationSite {
    /// Rank in the list of top allocations (1 = largest)
    pub rank: usize,
    
    /// Total size in bytes
    pub size: usize,
    
    /// Number of allocations at this site
    pub count: usize,
    
    /// Source code location (file:line:column)
    pub location: String,
}

/// Comprehensive memory profiling report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryReport {
    /// Peak memory usage during profiling (bytes)
    pub peak_memory: usize,
    
    /// Total number of allocations recorded
    pub total_allocations: usize,
    
    /// Total duration of the profiling session
    pub duration: Duration,
    
    /// Sequence of memory snapshots over time
    pub snapshots: Vec<MemorySnapshot>,
    
    /// Top allocation sites by size
    pub top_allocations: Vec<AllocationSite>,
}

impl MemoryReport {
    /// Create a flamegraph visualization of memory usage
    pub fn generate_flamegraph(&self, output_path: &str) -> Result<(), String> {
        // This would integrate with inferno-flamegraph or another visualization library
        // For now, we'll just stub this out
        #[cfg(feature = "flamegraph")]
        {
            use inferno::flamegraph;
            
            // TODO: Convert allocation data to flamegraph format
            
            Ok(())
        }
        
        #[cfg(not(feature = "flamegraph"))]
        {
            Err("Flamegraph generation requires the 'flamegraph' feature".to_string())
        }
    }
    
    /// Export the report as a CSV file for analysis
    pub fn export_csv(&self, output_path: &str) -> Result<(), String> {
        use std::fs::File;
        use std::io::{self, Write};
        
        // Create the output file
        let mut file = File::create(output_path)
            .map_err(|e| format!("Failed to create CSV file: {}", e))?;
        
        // Write header
        writeln!(file, "timestamp_ms,memory_mb,allocations")
            .map_err(|e| format!("Failed to write CSV header: {}", e))?;
        
        // Write snapshot data
        for snapshot in &self.snapshots {
            writeln!(
                file,
                "{},{:.2},{}", 
                snapshot.timestamp.as_millis(),
                snapshot.memory_usage as f64 / (1024.0 * 1024.0),
                snapshot.allocation_count
            )
            .map_err(|e| format!("Failed to write CSV data: {}", e))?;
        }
        
        // Write allocations section if available
        if !self.top_allocations.is_empty() {
            writeln!(file)
                .map_err(|e| format!("Failed to write CSV separator: {}", e))?;
            
            writeln!(file, "rank,size_bytes,count,location")
                .map_err(|e| format!("Failed to write allocations header: {}", e))?;
            
            for site in &self.top_allocations {
                writeln!(
                    file,
                    "{},{},{},\"{}\"",
                    site.rank,
                    site.size,
                    site.count,
                    site.location
                )
                .map_err(|e| format!("Failed to write allocation data: {}", e))?;
            }
        }
        
        Ok(())
    }
    
    /// Generate a markdown report with tables and charts
    pub fn generate_markdown(&self) -> String {
        let mut md = String::new();
        
        // Header
        md.push_str("# Memory Profile Report\n\n");
        
        // Summary
        md.push_str("## Summary\n\n");
        md.push_str("| Metric | Value |\n");
        md.push_str("|--------|-------|\n");
        md.push_str(&format!(
            "| Peak Memory | {:.2} MB |\n",
            self.peak_memory as f64 / (1024.0 * 1024.0)
        ));
        md.push_str(&format!(
            "| Total Allocations | {} |\n",
            self.total_allocations
        ));
        md.push_str(&format!(
            "| Duration | {:.2} seconds |\n",
            self.duration.as_secs_f64()
        ));
        md.push_str("\n");
        
        // Top allocations
        if !self.top_allocations.is_empty() {
            md.push_str("## Top Allocation Sites\n\n");
            md.push_str("| Rank | Size | Count | Location |\n");
            md.push_str("|------|------|-------|----------|\n");
            
            for site in &self.top_allocations {
                let size_str = if site.size < 1024 {
                    format!("{} B", site.size)
                } else if site.size < 1024 * 1024 {
                    format!("{:.2} KB", site.size as f64 / 1024.0)
                } else {
                    format!("{:.2} MB", site.size as f64 / (1024.0 * 1024.0))
                };
                
                md.push_str(&format!(
                    "| {} | {} | {} | {} |\n",
                    site.rank,
                    size_str,
                    site.count,
                    site.location
                ));
            }
            md.push_str("\n");
        }
        
        // Memory over time chart (ASCII chart)
        if self.snapshots.len() >= 2 {
            md.push_str("## Memory Usage Over Time\n\n");
            
            // Find min/max values for scale
            let max_memory = self.snapshots
                .iter()
                .map(|s| s.memory_usage)
                .max()
                .unwrap_or(0) as f64 / (1024.0 * 1024.0);
            
            let min_memory = self.snapshots
                .iter()
                .map(|s| s.memory_usage)
                .min()
                .unwrap_or(0) as f64 / (1024.0 * 1024.0);
            
            md.push_str(&format!(
                "Memory range: {:.2} MB - {:.2} MB\n\n",
                min_memory,
                max_memory
            ));
            
            md.push_str("```\n");
            // Insert ASCII chart here (simple version)
            md.push_str(&self.generate_ascii_chart(min_memory, max_memory));
            md.push_str("```\n\n");
        }
        
        // Recommendations based on profile
        md.push_str("## Recommendations\n\n");
        
        if self.peak_memory > 150 * 1024 * 1024 {
            md.push_str("- **High Memory Usage**: Peak memory exceeds the target of 150 MB for desktop. ");
            md.push_str("Consider optimizing the top allocation sites.\n");
        } else {
            md.push_str("- Memory usage is within target limits for desktop (< 150 MB).\n");
        }
        
        if let Some(max_site) = self.top_allocations.first() {
            let pct = (max_site.size as f64 / self.peak_memory as f64) * 100.0;
            
            if pct > 20.0 {
                md.push_str(&format!(
                    "- **Large Allocation Site**: `{}` accounts for {:.1}% of peak memory. ",
                    max_site.location,
                    pct
                ));
                md.push_str("This may be a good candidate for optimization.\n");
            }
        }
        
        // Look for memory growth patterns
        if self.snapshots.len() >= 2 {
            let first = &self.snapshots[0];
            let last = &self.snapshots[self.snapshots.len() - 1];
            
            let growth = last.memory_usage as f64 - first.memory_usage as f64;
            let growth_pct = (growth / first.memory_usage as f64) * 100.0;
            
            if growth_pct > 20.0 {
                md.push_str(&format!(
                    "- **Memory Growth**: Usage increased by {:.1}% over the session. ",
                    growth_pct
                ));
                md.push_str("Check for potential memory leaks.\n");
            }
        }
        
        md
    }
    
    /// Generate a simple ASCII chart for memory usage over time
    fn generate_ascii_chart(&self, min_memory_mb: f64, max_memory_mb: f64) -> String {
        const WIDTH: usize = 60;
        const HEIGHT: usize = 15;
        
        let mut chart = vec![vec![' '; WIDTH]; HEIGHT];
        
        // Draw axes
        for y in 0..HEIGHT {
            chart[y][0] = '|';
        }
        
        for x in 0..WIDTH {
            chart[HEIGHT - 1][x] = '-';
        }
        
        chart[HEIGHT - 1][0] = '+';
        
        // Draw memory usage line
        let memory_range = max_memory_mb - min_memory_mb;
        
        // Avoid division by zero
        let scale_factor = if memory_range > 0.0 {
            (HEIGHT - 2) as f64 / memory_range
        } else {
            0.0
        };
        
        let time_scale = if self.snapshots.len() > 1 {
            (WIDTH - 2) as f64 / (self.snapshots.len() - 1) as f64
        } else {
            0.0
        };
        
        for (i, snapshot) in self.snapshots.iter().enumerate() {
            let memory_mb = snapshot.memory_usage as f64 / (1024.0 * 1024.0);
            let y = HEIGHT - 2 - ((memory_mb - min_memory_mb) * scale_factor).round() as usize;
            let x = 1 + (i as f64 * time_scale).round() as usize;
            
            if y < HEIGHT && x < WIDTH {
                chart[y][x] = '*';
            }
        }
        
        // Convert to string
        let mut result = String::new();
        
        // Add y-axis labels
        result.push_str(&format!(" {:.1} MB -|\n", max_memory_mb));
        
        for y in 0..HEIGHT {
            for x in 0..WIDTH {
                result.push(chart[y][x]);
            }
            result.push('\n');
        }
        
        // Add x-axis labels
        result.push_str(&format!(" 0{:width$}{:.1} seconds\n", "", self.duration.as_secs_f64(), width = WIDTH - 15));
        
        result
    }
    
    /// Compare with another report to track improvements
    pub fn compare_with(&self, other: &MemoryReport) -> String {
        let mut comparison = String::new();
        
        comparison.push_str("# Memory Optimization Comparison\n\n");
        
        // Compare peak memory
        let peak_diff = self.peak_memory as f64 - other.peak_memory as f64;
        let peak_pct = if other.peak_memory > 0 {
            (peak_diff / other.peak_memory as f64) * 100.0
        } else {
            0.0
        };
        
        comparison.push_str("## Peak Memory Usage\n\n");
        comparison.push_str("| Version | Peak Memory | Change |\n");
        comparison.push_str("|---------|------------|--------|\n");
        comparison.push_str(&format!(
            "| Before | {:.2} MB | - |\n",
            other.peak_memory as f64 / (1024.0 * 1024.0)
        ));
        comparison.push_str(&format!(
            "| After | {:.2} MB | {}{:.2}% |\n\n",
            self.peak_memory as f64 / (1024.0 * 1024.0),
            if peak_diff < 0.0 { "-" } else { "+" },
            peak_pct.abs()
        ));
        
        // Compare allocation counts
        let alloc_diff = self.total_allocations as i64 - other.total_allocations as i64;
        let alloc_pct = if other.total_allocations > 0 {
            (alloc_diff as f64 / other.total_allocations as f64) * 100.0
        } else {
            0.0
        };
        
        comparison.push_str("## Allocation Counts\n\n");
        comparison.push_str("| Version | Allocations | Change |\n");
        comparison.push_str("|---------|------------|--------|\n");
        comparison.push_str(&format!(
            "| Before | {} | - |\n",
            other.total_allocations
        ));
        comparison.push_str(&format!(
            "| After | {} | {}{:.2}% |\n\n",
            self.total_allocations,
            if alloc_diff < 0 { "-" } else { "+" },
            alloc_pct.abs()
        ));
        
        // Summary and recommendations
        comparison.push_str("## Summary\n\n");
        
        if peak_diff < 0.0 {
            comparison.push_str(&format!(
                "- Memory usage **decreased** by {:.2} MB ({:.2}%)\n",
                peak_diff.abs() / (1024.0 * 1024.0),
                peak_pct.abs()
            ));
        } else if peak_diff > 0.0 {
            comparison.push_str(&format!(
                "- Memory usage **increased** by {:.2} MB ({:.2}%)\n",
                peak_diff / (1024.0 * 1024.0),
                peak_pct
            ));
        } else {
            comparison.push_str("- Memory usage unchanged\n");
        }
        
        if alloc_diff < 0 {
            comparison.push_str(&format!(
                "- Allocation count **decreased** by {} ({:.2}%)\n",
                alloc_diff.abs(),
                alloc_pct.abs()
            ));
        } else if alloc_diff > 0 {
            comparison.push_str(&format!(
                "- Allocation count **increased** by {} ({:.2}%)\n",
                alloc_diff,
                alloc_pct
            ));
        } else {
            comparison.push_str("- Allocation count unchanged\n");
        }
        
        // Target assessment
        if self.peak_memory <= 150 * 1024 * 1024 {
            comparison.push_str("\n✅ **Desktop target met**: Peak memory <= 150 MB\n");
        } else {
            comparison.push_str("\n❌ **Desktop target not met**: Peak memory > 150 MB\n");
        }
        
        if self.peak_memory <= 90 * 1024 * 1024 {
            comparison.push_str("\n✅ **Mobile target met**: Peak memory <= 90 MB\n");
        } else {
            comparison.push_str("\n❌ **Mobile target not met**: Peak memory > 90 MB\n");
        }
        
        comparison
    }
}
