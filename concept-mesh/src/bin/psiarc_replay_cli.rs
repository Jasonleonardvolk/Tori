//! PSI Replay CLI Tool
//!
//! Command-line interface for the ConceptDiff Replay Engine.
//! This tool allows replaying ConceptDiffs from ψarc logs to reconstruct
//! an LCN graph state for debugging or simulation.

use concept_mesh::tools::psiarc_replay::{execute_replay_cmd, ReplayArgs};
use clap::Parser;

#[tokio::main]
async fn main() -> Result<(), String> {
    // Parse command line arguments
    let args = ReplayArgs::parse();
    
    // Execute replay command
    execute_replay_cmd(args).await
}
