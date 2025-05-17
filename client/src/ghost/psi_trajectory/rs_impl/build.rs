//! Build script for ψ-Trajectory module
//!
//! This script runs during the build process to export ELFIN symbols
//! and prepare necessary files for the ψ-Trajectory system.

use std::env;
use std::fs;
use std::path::Path;
use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=../../elfin_lsp/examples/*.elfin");
    println!("cargo:rerun-if-changed=../examples/*.elfin");
    
    // Export ELFIN symbols at build time
    export_elfin_symbols().unwrap_or_else(|e| {
        eprintln!("Warning: Failed to export ELFIN symbols: {}", e);
    });
}

/// Export ELFIN symbols to a JSON file
fn export_elfin_symbols() -> Result<(), Box<dyn std::error::Error>> {
    // Determine output directory
    let out_dir = env::var("OUT_DIR")?;
    let out_path = Path::new(&out_dir).join("elfin_symbols.json");
    
    // Create directory if it doesn't exist
    fs::create_dir_all(&out_dir)?;
    
    // Run elfin-lsp export command
    let output = Command::new("elfin-lsp")
        .args(&["--export-symbols", out_path.to_str().unwrap()])
        .output()?;
    
    if !output.status.success() {
        eprintln!("ELFIN export failed: {}", String::from_utf8_lossy(&output.stderr));
        
        // If the command failed, generate a minimal symbols file for testing
        generate_minimal_symbols_file(&out_path)?;
    }
    
    // Copy to a more accessible location
    let target_dir = Path::new("src").join("generated");
    fs::create_dir_all(&target_dir)?;
    
    let target_path = target_dir.join("elfin_symbols.json");
    fs::copy(&out_path, &target_path)?;
    
    println!("cargo:warning=ELFIN symbols exported to {}", target_path.display());
    
    Ok(())
}

/// Generate a minimal symbols file for testing when elfin-lsp isn't available
fn generate_minimal_symbols_file(path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let minimal_content = r#"{
  "version": "1.0",
  "symbols": [
    {
      "name": "wheelDiameter",
      "hash": "8a7b3e9f2c1d5e6f",
      "unit": "meters",
      "type": "physical"
    },
    {
      "name": "engineRPM",
      "hash": "7c3f9e2a1b8d7c5f",
      "unit": "rpm",
      "type": "physical"
    },
    {
      "name": "acceleration",
      "hash": "6d2e8f4a1c7b3e5d",
      "unit": "m/s²",
      "type": "physical"
    }
  ]
}"#;

    fs::write(path, minimal_content)?;
    
    Ok(())
}
