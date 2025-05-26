//! ψdiff-viewer CLI Tool
//!
//! Command-line entry point for the psidiff-viewer tool, which provides
//! visualization and debugging capabilities for ψarc logs.

// Re-export main function from psidiff_viewer module
pub use concept_mesh::tools::psidiff_viewer::main;

fn main() -> Result<(), String> {
    // Initialize logging
    tracing_subscriber::fmt::init();
    
    // Run the main function from the psidiff_viewer module
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(main())
}
