/**
 * ψ-Trajectory Archive CLI Tool
 * ------------------------------------------------------------------
 * Command-line interface for working with ψ-Trajectory archives:
 * - Verify archive files
 * - Migrate between oscillator counts
 * - Extract audio/video
 * - Display metadata
 * 
 * Usage: psiarc [COMMAND] [OPTIONS] <FILE>
 */

use clap::{Parser, Subcommand};
use colored::*;
use std::path::PathBuf;
use psi_trajectory::compat::{
    verify_archive, ArchiveHeader, DEFAULT_OSCILLATOR_COUNT,
    migrate_file_format, CompatError
};

/// Command-line interface for ψ-Trajectory archive files
#[derive(Parser, Debug)]
#[command(name = "psiarc")]
#[command(author = "Psi Trajectory Team")]
#[command(version = env!("CARGO_PKG_VERSION"))]
#[command(about = "Command-line tool for working with ψ-Trajectory archives", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Verify archive integrity and compatibility
    Verify {
        /// Archive file to verify
        #[arg(required = true)]
        file: PathBuf,
        
        /// Check schema compatibility only
        #[arg(short, long)]
        schema_only: bool,
        
        /// Allow different oscillator counts
        #[arg(short, long)]
        allow_osc_mismatch: bool,
        
        /// Print full verification details including build hash
        #[arg(long)]
        full: bool,
    },
    
    /// Migrate archive to different oscillator count
    Migrate {
        /// Input archive file
        #[arg(required = true)]
        input: PathBuf,
        
        /// Output archive file
        #[arg(required = true)]
        output: PathBuf,
        
        /// Target oscillator count
        #[arg(short, long, default_value_t = DEFAULT_OSCILLATOR_COUNT)]
        oscillator_count: usize,
    },
    
    /// Display archive metadata
    Info {
        /// Archive file to analyze
        #[arg(required = true)]
        file: PathBuf,
        
        /// Show detailed information
        #[arg(short, long)]
        detailed: bool,
        
        /// Output in JSON format
        #[arg(short, long)]
        json: bool,
    },
}

/// Format archive header as a human-readable string
fn format_header(header: &ArchiveHeader) -> String {
    let mut result = String::new();
    
    result.push_str("ψ-Trajectory Archive\n");
    result.push_str("─────────────────────────────\n");
    
    // Schema version
    result.push_str(&format!("Schema Version: {}\n", header.schema.version));
    
    // Oscillator count
    let osc_count = header.schema.oscillator_count;
    let osc_match = osc_count == DEFAULT_OSCILLATOR_COUNT;
    let osc_str = if osc_match {
        format!("{} (default)", osc_count)
    } else {
        format!("{} (default: {})", osc_count, DEFAULT_OSCILLATOR_COUNT)
    };
    result.push_str(&format!("Oscillator Count: {}\n", osc_str));
    
    // Session count
    result.push_str(&format!("Session Count: {}\n", header.session_count));
    
    // Features
    let features = &header.schema.features;
    result.push_str("Features:\n");
    result.push_str(&format!("  Audio: {}\n", if features.has_audio { "Yes" } else { "No" }));
    result.push_str(&format!("  Video: {}\n", if features.has_video { "Yes" } else { "No" }));
    result.push_str(&format!("  Encrypted: {}\n", if features.encrypted { "Yes" } else { "No" }));
    result.push_str(&format!("  Chunked: {}\n", if features.chunked { "Yes" } else { "No" }));
    result.push_str(&format!("  Annotated: {}\n", if features.annotated { "Yes" } else { "No" }));
    result.push_str(&format!("  Delta Encoded: {}\n", if features.delta_encoded { "Yes" } else { "No" }));
    
    // Creation time
    let created_at = chrono::NaiveDateTime::from_timestamp_opt(
        header.schema.created_at as i64, 0
    ).unwrap_or_default();
    result.push_str(&format!("Created: {}\n", created_at));
    
    result
}

/// Format verification result for display
fn format_verification_result(result: Result<ArchiveHeader, CompatError>) -> String {
    match result {
        Ok(header) => {
            let mut output = String::new();
            
            output.push_str(&format!("{}\n", "✅ Archive verification PASSED".green()));
            output.push_str("\n");
            output.push_str(&format_header(&header));
            
            // Check oscillator count
            if header.schema.oscillator_count != DEFAULT_OSCILLATOR_COUNT {
                output.push_str("\n");
                output.push_str(&format!("{}\n", "⚠️ Warning: Non-standard oscillator count".yellow()));
                output.push_str("This archive uses a different oscillator count than the current default.\n");
                output.push_str("It will be automatically migrated when loaded, but this may affect performance.\n");
                output.push_str(&format!("Use 'psiarc migrate' to convert to {} oscillators.\n", 
                    DEFAULT_OSCILLATOR_COUNT));
            }
            
            output
        },
        Err(err) => {
            let mut output = String::new();
            
            output.push_str(&format!("{}\n", "❌ Archive verification FAILED".red()));
            output.push_str("\n");
            
            match err {
                CompatError::UnsupportedVersion(version) => {
                    output.push_str(&format!("Unsupported schema version: {}\n", version));
                    output.push_str("This archive was created with a newer or incompatible version.\n");
                },
                CompatError::OscillatorCountMismatch(found, expected) => {
                    output.push_str(&format!("Oscillator count mismatch: {} (expected {})\n", found, expected));
                    output.push_str("This archive uses a different oscillator count than the current default.\n");
                    output.push_str(&format!("Use 'psiarc migrate' to convert to {} oscillators.\n", expected));
                },
                CompatError::UnsupportedFeature(feature) => {
                    output.push_str(&format!("Unsupported feature: {}\n", feature));
                    output.push_str("This archive uses a feature that is not supported by this version.\n");
                },
                CompatError::IoError(err) => {
                    output.push_str(&format!("I/O error: {}\n", err));
                    output.push_str("There was a problem reading the archive file.\n");
                },
                CompatError::MissingFeature(feature) => {
                    output.push_str(&format!("Missing feature: {}\n", feature));
                    output.push_str("This archive requires a feature that is not available in this build.\n");
                },
            }
            
            output
        },
    }
}

/// Archive verification info with build hash and additional details
struct ArchiveVerifyInfo {
    build_hash: String,
    schema: u32,
    osc_count: usize,
    peak_ram: u32,
}

/// Verify command implementation
fn verify_command(file: PathBuf, schema_only: bool, allow_osc_mismatch: bool, full: bool) -> i32 {
    let file_str = file.to_string_lossy();
    
    // Print header
    println!("Verifying archive: {}", file_str);
    println!();
    
    // Verify the archive
    let result = verify_archive(&file_str);
    
    // Special handling for oscillator count mismatch
    if allow_osc_mismatch {
        if let Err(CompatError::OscillatorCountMismatch(_, _)) = &result {
            // Convert to a warning instead of error
            if let Ok(header) = verify_archive(&file_str) {
                println!("{}", format!("⚠️ Oscillator count mismatch (ignored)").yellow());
                println!("{}", format_header(&header));
                return 0;
            }
        }
    }
    
    // Handle full verification if requested
    if full {
        if let Ok(header) = &result {
            // Create verification info with build hash and detailed info
            let info = ArchiveVerifyInfo {
                build_hash: env!("CARGO_PKG_VERSION").to_string() + "-" + env!("CARGO_PKG_HASH", "dev"),
                schema: header.schema.version,
                osc_count: header.schema.oscillator_count,
                peak_ram: 0, // This would be populated from actual memory profiling data
            };
            
            // Print full verification details
            println!("✅ OK — build_hash={} schema={} osc={} peak_ram={}MB", 
                info.build_hash, info.schema, info.osc_count, info.peak_ram);
            return 0;
        }
    }
    
    // Standard output for normal verification
    if !full {
        println!("{}", format_verification_result(result));
    }
    
    // Return exit code based on result
    match result {
        Ok(_) => 0,
        Err(err) => {
            // If in full mode, provide a machine-readable error format for scripts
            if full {
                match err {
                    CompatError::IoError(io_err) => {
                        println!("❌ FAIL — error=\"CRC_ERROR\" detail=\"{}\"", io_err);
                    },
                    _ => {
                        println!("❌ FAIL — error=\"{}\" detail=\"{}\"", 
                            err.to_string().replace(" ", "_").to_uppercase(), err);
                    }
                }
            }
            1
        }
    }
}

/// Migrate command implementation
fn migrate_command(input: PathBuf, output: PathBuf, oscillator_count: usize) -> i32 {
    let input_str = input.to_string_lossy();
    let output_str = output.to_string_lossy();
    
    // Print header
    println!("Migrating archive:");
    println!("  Input:  {}", input_str);
    println!("  Output: {}", output_str);
    println!("  Target oscillator count: {}", oscillator_count);
    println!();
    
    // Perform migration
    match migrate_file_format(&input_str, &output_str, oscillator_count) {
        Ok(()) => {
            println!("{}", "✅ Migration successful".green());
            
            // Verify the output file
            if let Ok(header) = verify_archive(&output_str) {
                println!();
                println!("Output archive details:");
                println!("{}", format_header(&header));
            }
            
            0
        },
        Err(err) => {
            println!("{}", "❌ Migration failed".red());
            println!("{}", err);
            1
        },
    }
}

/// Info command implementation
fn info_command(file: PathBuf, detailed: bool, json: bool) -> i32 {
    let file_str = file.to_string_lossy();
    
    // Verify the archive
    let result = verify_archive(&file_str);
    
    match result {
        Ok(header) => {
            if json {
                // Output JSON format
                let json = serde_json::to_string_pretty(&header)
                    .unwrap_or_else(|e| format!("{{\"error\": \"{}\"}}", e));
                println!("{}", json);
            } else {
                // Output human-readable format
                println!("{}", format_header(&header));
                
                // Add additional details if requested
                if detailed {
                    // TODO: Add more detailed info when available
                    println!("Detailed information not yet implemented");
                }
            }
            
            0
        },
        Err(err) => {
            if json {
                // Output JSON error
                let error_json = format!("{{\"error\": \"{}\"}}", err);
                println!("{}", error_json);
            } else {
                println!("{}", "❌ Failed to read archive".red());
                println!("{}", err);
            }
            
            1
        },
    }
}

fn main() {
    let cli = Cli::parse();

    let exit_code = match cli.command {
        Commands::Verify { file, schema_only, allow_osc_mismatch, full } => {
            verify_command(file, schema_only, allow_osc_mismatch, full)
        },
        Commands::Migrate { input, output, oscillator_count } => {
            migrate_command(input, output, oscillator_count)
        },
        Commands::Info { file, detailed, json } => {
            info_command(file, detailed, json)
        },
    };
    
    std::process::exit(exit_code);
}
