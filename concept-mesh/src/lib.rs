// Update concept-mesh/src/lib.rs to include the FFI bridge
//! # Concept Mesh
//!
//! The Concept Mesh is a framework for building concept-oriented agents that communicate
//! via ConceptDiffs. It provides a phase-aligned storage system that replaces traditional
//! embedding databases with a concept-first approach.
//!
//! ## Key Components
//!
//! - **Concept Boundary Detector (CBD)**: Segments content at semantic breakpoints
//! - **ConceptDiff**: Graph change operations for mesh communication
//! - **Large Concept Network (LCN)**: Phase-aligned concept storage
//! - **Mesh**: Communication layer for ConceptDiffs
//! - **Agentic Orchestrator**: Coordinates agents in the mesh
//! - **PsiArc**: Persistent storage and replay system
//! - **Auth**: User identity and session management
//! - **Concept Trail**: Time-ordered concept sequences with provenance tracking
//! - **Soliton Memory**: ψ-phase encoded memory with perfect recall

// Re-export key components
pub use cbd::*;
pub use diff::*;
pub use lcn::*;
pub use mesh::*;
pub use psiarc::*;
pub use auth::*;

// Genesis frame ID
/// Frame ID for GENESIS events
pub const GENESIS_FRAME_ID: u64 = 0;

// Declare modules
pub mod cbd;
pub mod diff;
pub mod lcn;
pub mod mesh;
pub mod psiarc;
pub mod safety;
pub mod auth;
pub mod concept_trail;
pub mod ingest;
pub mod soliton_memory;
pub mod ffi_bridge;

// Agent modules
pub mod agents {
    //! Agent implementations for the concept mesh
    
    pub mod orchestrator;
}

// UI modules
pub mod ui {
    //! UI integrations for the concept mesh
    
    pub mod genesis_bridge;
}

// CLI modules
pub mod cli {
    //! CLI adapters for the concept mesh
    
    pub mod adapter;
}

// Tool modules
pub mod tools {
    //! Tools and utilities for the concept mesh
    
    pub mod psidiff_viewer;
    pub mod psiarc_replay;
    pub mod psidiff_validate;
}

/// Initialize the concept mesh with a GENESIS event
///
/// This creates the TIMELESS_ROOT concept and binds it to the given corpus ID.
/// It's the first step in setting up a concept mesh.
///
/// # Arguments
///
/// * `lcn` - Large Concept Network to initialize
/// * `corpus_id` - ID for the corpus to create
///
/// # Returns
///
/// * `Ok(())` if initialization was successful
/// * `Err(String)` with an error message if initialization failed
pub fn initialize(lcn: &LargeConceptNetwork, corpus_id: &str) -> Result<(), String> {
    // Create GENESIS diff
    let genesis_diff = diff::create_genesis_diff(corpus_id);
    
    // Apply to LCN
    lcn.apply_diff(&genesis_diff)
}

/// Concepts represent nodes in the concept graph
///
/// This type alias helps distinguish concept IDs from other types of IDs.
pub type ConceptId = String;

/// Version information for the concept mesh crate
pub mod version {
    //! Version information for the concept mesh
    
    /// Current version of the concept mesh crate
    pub const VERSION: &str = env!("CARGO_PKG_VERSION");
    
    /// Build date of this crate
    pub const BUILD_DATE: &str = env!("CARGO_PKG_VERSION");
    
    /// Get the version string
    pub fn version_string() -> String {
        format!("concept-mesh v{}", VERSION)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_initialize() {
        let lcn = LargeConceptNetwork::new();
        let result = initialize(&lcn, "TestCorpus");
        
        assert!(result.is_ok());
        assert!(lcn.is_genesis_complete());
        assert!(lcn.has_timeless_root());
    }
}
