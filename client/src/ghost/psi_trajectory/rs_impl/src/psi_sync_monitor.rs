//! ψ-Trajectory Synchronization with ELFIN Symbols
//!
//! This module implements the binding between oscillator patterns and ELFIN symbols,
//! allowing the system to translate between numerical oscillator states and
//! symbolic representations used in the ELFIN language.

use std::collections::HashMap;
use std::fs::File;
use std::io::{self, Read};
use std::path::Path;
use std::sync::{Arc, Mutex, RwLock};
use serde_json::{Value, from_reader};

/// Concept identifier type
pub type ConceptId = u64;

/// Simple result type for concept operations
pub type ConceptResult<T> = Result<T, ConceptError>;

/// Error types for concept operations
#[derive(Debug)]
pub enum ConceptError {
    /// I/O error
    Io(io::Error),
    /// JSON parsing error
    Json(serde_json::Error),
    /// Node not found
    NotFound(String),
    /// Invalid operation
    InvalidOperation(String),
}

impl From<io::Error> for ConceptError {
    fn from(err: io::Error) -> Self {
        ConceptError::Io(err)
    }
}

impl From<serde_json::Error> for ConceptError {
    fn from(err: serde_json::Error) -> Self {
        ConceptError::Json(err)
    }
}

/// A node in the concept graph
#[derive(Clone, Debug)]
pub struct ConceptNode {
    /// Node identifier
    id: ConceptId,
    
    /// Metadata
    metadata: HashMap<String, String>,
    
    /// Spectral signature (if available)
    signature: Option<Vec<f32>>,
}

/// The global concept graph
pub struct ConceptGraph {
    /// Nodes in the graph, keyed by ID
    nodes: RwLock<HashMap<ConceptId, ConceptNode>>,
    
    /// Hash lookup table for ELFIN symbols
    hash_lookup: RwLock<HashMap<u64, ConceptId>>,
}

impl ConceptGraph {
    /// Create a new concept graph
    pub fn new() -> Self {
        Self {
            nodes: RwLock::new(HashMap::new()),
            hash_lookup: RwLock::new(HashMap::new()),
        }
    }
    
    /// Get global instance
    pub fn global() -> &'static ConceptGraph {
        lazy_static::lazy_static! {
            static ref INSTANCE: ConceptGraph = ConceptGraph::new();
        }
        &INSTANCE
    }
    
    /// Create a new node
    pub fn create_node(&self) -> ConceptId {
        // Generate a random ID
        let id = rand::random();
        
        // Create the node
        let node = ConceptNode {
            id,
            metadata: HashMap::new(),
            signature: None,
        };
        
        // Add to the graph
        self.nodes.write().unwrap().insert(id, node);
        
        id
    }
    
    /// Ensure a node exists
    pub fn ensure_node(&self, id_str: &str) -> ConceptId {
        // Parse id as u64
        let id = match id_str.parse::<u64>() {
            Ok(id) => id,
            Err(_) => {
                // Hash the string to get an ID
                use std::collections::hash_map::DefaultHasher;
                use std::hash::{Hash, Hasher};
                
                let mut hasher = DefaultHasher::new();
                id_str.hash(&mut hasher);
                hasher.finish()
            }
        };
        
        // Check if the node exists
        let exists = self.nodes.read().unwrap().contains_key(&id);
        
        if !exists {
            // Create the node
            let node = ConceptNode {
                id,
                metadata: HashMap::new(),
                signature: None,
            };
            
            // Add to the graph
            self.nodes.write().unwrap().insert(id, node);
        }
        
        id
    }
    
    /// Set metadata on a node
    pub fn set_meta(&self, node_id: ConceptId, key: &str, value: &str) -> ConceptResult<()> {
        let mut nodes = self.nodes.write().unwrap();
        
        if let Some(node) = nodes.get_mut(&node_id) {
            node.metadata.insert(key.to_string(), value.to_string());
            Ok(())
        } else {
            Err(ConceptError::NotFound(format!("Node {} not found", node_id)))
        }
    }
    
    /// Get metadata from a node
    pub fn get_meta(&self, node_id: ConceptId, key: &str) -> Option<String> {
        let nodes = self.nodes.read().unwrap();
        
        if let Some(node) = nodes.get(&node_id) {
            node.metadata.get(key).cloned()
        } else {
            None
        }
    }
    
    /// Look up a hash in the graph
    pub fn lookup_hash(&self, hash: u64) -> Option<ConceptId> {
        let hash_lookup = self.hash_lookup.read().unwrap();
        hash_lookup.get(&hash).copied()
    }
    
    /// Register a hash for lookup
    pub fn register_hash(&self, hash: u64, node_id: ConceptId) {
        let mut hash_lookup = self.hash_lookup.write().unwrap();
        hash_lookup.insert(hash, node_id);
    }
    
    /// Merge two nodes
    pub fn merge(&self, node1: ConceptId, node2: ConceptId) -> ConceptResult<()> {
        // Get both nodes
        let mut nodes = self.nodes.write().unwrap();
        
        let node1_data = match nodes.get(&node1) {
            Some(node) => node.clone(),
            None => return Err(ConceptError::NotFound(format!("Node {} not found", node1))),
        };
        
        let node2_data = match nodes.get(&node2) {
            Some(node) => node.clone(),
            None => return Err(ConceptError::NotFound(format!("Node {} not found", node2))),
        };
        
        // Merge metadata
        let mut merged_metadata = node1_data.metadata.clone();
        for (key, value) in node2_data.metadata {
            merged_metadata.insert(key, value);
        }
        
        // Update node1 with merged metadata
        if let Some(node) = nodes.get_mut(&node1) {
            node.metadata = merged_metadata;
        }
        
        Ok(())
    }
    
    /// Import ELFIN symbols from a JSON file
    pub fn import_elfin<P: AsRef<Path>>(&self, path: P) -> ConceptResult<usize> {
        // Open the file
        let file = File::open(path)?;
        
        // Parse the JSON
        let json: Value = from_reader(file)?;
        
        // Extract symbols
        let symbols = match json.get("symbols") {
            Some(Value::Array(symbols)) => symbols,
            _ => return Err(ConceptError::InvalidOperation("No symbols array found".to_string())),
        };
        
        let mut count = 0;
        
        // Process each symbol
        for symbol in symbols {
            // Extract name, hash, and unit
            let name = match symbol.get("name") {
                Some(Value::String(name)) => name,
                _ => continue,
            };
            
            let hash_str = match symbol.get("hash") {
                Some(Value::String(hash)) => hash,
                _ => continue,
            };
            
            let unit = match symbol.get("unit") {
                Some(Value::String(unit)) => unit,
                _ => "",
            };
            
            // Create the node
            let node_id = self.ensure_node(hash_str);
            
            // Set metadata
            self.set_meta(node_id, "elfin_name", name)?;
            self.set_meta(node_id, "elfin_unit", unit)?;
            
            // Register hash for lookup
            if let Ok(hash) = u64::from_str_radix(hash_str, 16) {
                self.register_hash(hash, node_id);
            }
            
            count += 1;
        }
        
        Ok(count)
    }
}

/// Try to bind an oscillator pattern to an ELFIN symbol
pub fn try_bind_to_elfin(node_id: ConceptId, psi_signature: &[f32]) -> bool {
    // Compute the hash using siphash24
    let signature_str = format!("{:.3?}", psi_signature);
    let h = siphash24(&signature_str);
    
    // Look up the hash in the concept graph
    if let Some(elfin_id) = ConceptGraph::global().lookup_hash(h) {
        // Merge the nodes
        if let Err(e) = ConceptGraph::global().merge(node_id, elfin_id) {
            eprintln!("Error merging nodes: {:?}", e);
            return false;
        }
        
        // Set the source metadata
        if let Err(e) = ConceptGraph::global().set_meta(node_id, "source", "ELFIN") {
            eprintln!("Error setting metadata: {:?}", e);
            return false;
        }
        
        true
    } else {
        false
    }
}

/// Called when a new attractor is promoted to a concept
pub fn on_attractor_promoted(node_id: ConceptId, signature: &[f32]) {
    // Try to bind to ELFIN
    let bound = try_bind_to_elfin(node_id, signature);
    
    // Log the result
    if bound {
        if let Some(name) = ConceptGraph::global().get_meta(node_id, "elfin_name") {
            println!("Bound oscillator pattern to ELFIN symbol: {}", name);
        } else {
            println!("Bound oscillator pattern to ELFIN symbol");
        }
    }
    
    // Additional stability bookkeeping would go here
}

/// Compute a SipHash-2-4 hash of a string
fn siphash24(input: &str) -> u64 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    input.hash(&mut hasher);
    hasher.finish()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_bind_to_elfin() {
        // Mock signature that would hash to a known ELFIN symbol
        let mock_sig = vec![0.1, 0.2, 0.3, 0.4];
        
        // Create the concept graph
        let graph = ConceptGraph::new();
        
        // Create ELFIN node with a known hash
        let mock_hash = siphash24(&format!("{:.3?}", mock_sig));
        let elfin_id = graph.create_node();
        graph.set_meta(elfin_id, "elfin_name", "wheelDiameter").unwrap();
        graph.set_meta(elfin_id, "elfin_unit", "meters").unwrap();
        graph.register_hash(mock_hash, elfin_id);
        
        // Create a node for the oscillator pattern
        let node = graph.create_node();
        
        // Try to bind
        let result = try_bind_to_elfin(node, &mock_sig);
        
        // Verify binding was successful
        assert!(result);
        assert_eq!(graph.get_meta(node, "elfin_name"), Some("wheelDiameter".to_string()));
        assert_eq!(graph.get_meta(node, "source"), Some("ELFIN".to_string()));
    }
}
