//! Genesis CLI Tool
//!
//! Command-line tool for initializing a concept mesh with a GENESIS event.
//! This creates the TIMELESS_ROOT concept and sets up the initial corpus.

use concept_mesh::{self, LargeConceptNetwork, GENESIS_FRAME_ID};
use concept_mesh::mesh::InMemoryMesh;
use concept_mesh::psiarc::{PsiarcManager, PsiarcOptions};

use clap::{Parser, Subcommand};
use std::path::PathBuf;
use std::sync::Arc;
use tracing::{info, error};
use tracing_subscriber::FmtSubscriber;

/// Command line arguments for the genesis CLI
#[derive(Parser, Debug)]
#[clap(name = "genesis", about = "Initialize a concept mesh with a GENESIS event")]
struct Args {
    /// The name of the corpus to create
    #[clap(short, long, default_value = "MainCorpus")]
    corpus: String,
    
    /// Log directory for storing ψarc logs
    #[clap(short, long, default_value = "logs")]
    log_dir: PathBuf,
    
    /// Name of the ψarc log file
    #[clap(short, long, default_value = "genesis")]
    log_name: String,
    
    /// Whether to create a new log file even if one exists
    #[clap(short, long)]
    force_new: bool,
    
    /// Verbosity level (0-3)
    #[clap(short, long, default_value = "1")]
    verbose: u8,
}

#[tokio::main]
async fn main() -> Result<(), String> {
    // Parse command line arguments
    let args = Args::parse();
    
    // Set up logging
    let log_level = match args.verbose {
        0 => tracing::Level::ERROR,
        1 => tracing::Level::INFO,
        2 => tracing::Level::DEBUG,
        _ => tracing::Level::TRACE,
    };
    
    let subscriber = FmtSubscriber::builder()
        .with_max_level(log_level)
        .finish();
    
    tracing::subscriber::set_global_default(subscriber)
        .expect("Failed to set global default subscriber");
    
    info!("Starting GENESIS initialization");
    info!("Corpus: {}", args.corpus);
    info!("Log directory: {}", args.log_dir.display());
    
    // Create LCN
    let lcn = Arc::new(LargeConceptNetwork::new());
    
    // Create PsiarcManager
    let psiarc_options = PsiarcOptions {
        directory: args.log_dir.to_string_lossy().to_string(),
        append: !args.force_new,
        ..Default::default()
    };
    
    let psiarc_manager = Arc::new(PsiarcManager::new(&args.log_dir));
    let psiarc_log = psiarc_manager.create_log_with_options(&args.log_name, psiarc_options)
        .map_err(|e| format!("Failed to create psiarc log: {}", e))?;
    
    info!("Created ψarc log at {}", psiarc_log.path());
    
    // Create in-memory mesh
    let mesh = Arc::new(InMemoryMesh::new());
    
    // Create GENESIS diff
    let genesis_diff = concept_mesh::diff::create_genesis_diff(&args.corpus);
    
    // Apply GENESIS diff to LCN
    info!("Applying GENESIS diff to LCN");
    if let Err(e) = lcn.apply_diff(&genesis_diff) {
        error!("Failed to apply GENESIS diff to LCN: {}", e);
        return Err(format!("Failed to apply GENESIS diff: {}", e));
    }
    
    // Record GENESIS diff to psiarc
    info!("Recording GENESIS diff to ψarc");
    if let Err(e) = psiarc_log.record(&genesis_diff) {
        error!("Failed to record GENESIS diff to ψarc: {}", e);
        return Err(format!("Failed to record GENESIS diff: {}", e));
    }
    
    // Create a mesh node to publish the GENESIS diff
    let node = concept_mesh::mesh::MeshNode::new("genesis-cli", Arc::clone(&mesh)).await?;
    
    // Publish GENESIS diff to mesh
    info!("Publishing GENESIS diff to mesh");
    if let Err(e) = node.publish(genesis_diff).await {
        error!("Failed to publish GENESIS diff to mesh: {}", e);
        return Err(format!("Failed to publish GENESIS diff: {}", e));
    }
    
    info!("GENESIS complete");
    info!("LCN status: GENESIS complete = {}", lcn.is_genesis_complete());
    info!("TIMELESS_ROOT exists = {}", lcn.has_timeless_root());
    
    // Disconnect from mesh
    if let Err(e) = node.disconnect().await {
        error!("Failed to disconnect from mesh: {}", e);
    }
    
    Ok(())
}
