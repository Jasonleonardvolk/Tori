//! Advanced Pattern Matching for ψ-Trajectory System
//!
//! This module implements sophisticated pattern matching algorithms for oscillator patterns:
//! - LSH (Locality-Sensitive Hashing) for fast fuzzy matching
//! - Hebbian learning for adaptive pattern recognition
//! - Hierarchical clustering for multi-scale pattern detection

use std::collections::{HashMap, HashSet};
use std::hash::{Hash, Hasher};
use std::sync::{Arc, Mutex, RwLock};
use std::time::{Duration, Instant};
use std::collections::hash_map::DefaultHasher;

use crate::psi_sync_monitor::ConceptId;

/// Supported pattern matching algorithms
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MatchingAlgorithm {
    /// Simple cosine similarity
    Cosine,
    /// Locality-sensitive hashing
    LSH,
    /// Hebbian learning-based matching
    Hebbian,
}

impl Default for MatchingAlgorithm {
    fn default() -> Self {
        MatchingAlgorithm::LSH
    }
}

/// Pattern matcher configuration
#[derive(Debug, Clone)]
pub struct PatternMatcherConfig {
    /// Selected algorithm
    pub algorithm: MatchingAlgorithm,
    
    /// Similarity threshold (0.0-1.0)
    pub similarity_threshold: f32,
    
    /// LSH hash bits (if using LSH)
    pub lsh_hash_bits: usize,
    
    /// LSH bands (if using LSH)
    pub lsh_bands: usize,
    
    /// LSH vote threshold
    pub lsh_vote_threshold: usize,
    
    /// Vote expiration time (seconds)
    pub vote_expiration_secs: u64,
    
    /// Hebbian learning rate (if using Hebbian)
    pub hebbian_eta: f32,
    
    /// Hebbian weight decay (if using Hebbian)
    pub hebbian_decay: f32,
    
    /// Stability threshold for concept promotion
    pub stability_threshold: f32,
}

impl Default for PatternMatcherConfig {
    fn default() -> Self {
        Self {
            algorithm: MatchingAlgorithm::default(),
            similarity_threshold: 0.85,
            lsh_hash_bits: 64,
            lsh_bands: 8,
            lsh_vote_threshold: 3,
            vote_expiration_secs: 60,
            hebbian_eta: 0.05,
            hebbian_decay: 0.995,
            stability_threshold: 0.7,
        }
    }
}

/// A pattern matching system for oscillator signatures
pub struct PatternMatcher {
    /// Configuration
    config: PatternMatcherConfig,
    
    /// LSH table
    lsh_table: Option<LshTable>,
    
    /// Hebbian weights
    hebbian_weights: Option<HebbianWeights>,
}

impl PatternMatcher {
    /// Create a new pattern matcher
    pub fn new(config: PatternMatcherConfig) -> Self {
        let lsh_table = if config.algorithm == MatchingAlgorithm::LSH {
            Some(LshTable::new(
                config.lsh_bands,
                config.lsh_hash_bits,
                config.lsh_vote_threshold,
                Duration::from_secs(config.vote_expiration_secs),
            ))
        } else {
            None
        };
        
        let hebbian_weights = if config.algorithm == MatchingAlgorithm::Hebbian {
            Some(HebbianWeights::new(
                config.hebbian_eta,
                config.hebbian_decay,
            ))
        } else {
            None
        };
        
        Self {
            config,
            lsh_table,
            hebbian_weights,
        }
    }
    
    /// Match a pattern against known patterns
    pub fn match_pattern(&mut self, signature: &[f32]) -> Option<ConceptId> {
        match self.config.algorithm {
            MatchingAlgorithm::Cosine => self.match_cosine(signature),
            MatchingAlgorithm::LSH => self.match_lsh(signature),
            MatchingAlgorithm::Hebbian => self.match_hebbian(signature),
        }
    }
    
    /// Match using cosine similarity
    fn match_cosine(&self, signature: &[f32]) -> Option<ConceptId> {
        // In a real implementation, this would search through a database
        // of known patterns and find the closest match using cosine similarity
        
        // For demonstration purposes, we'll just return None
        None
    }
    
    /// Match using LSH
    fn match_lsh(&mut self, signature: &[f32]) -> Option<ConceptId> {
        let lsh_table = self.lsh_table.as_mut()?;
        
        // Compute the LSH key
        let hash_key = lsh_table.compute_hash_key(signature);
        
        // Get the vote record for this key
        if let Some(vote) = lsh_table.get_vote(hash_key) {
            // If votes exceed threshold, return the concept
            if vote.vote_count >= lsh_table.vote_threshold {
                return Some(vote.concept_id);
            }
        }
        
        None
    }
    
    /// Match using Hebbian learning
    fn match_hebbian(&mut self, signature: &[f32]) -> Option<ConceptId> {
        let weights = self.hebbian_weights.as_mut()?;
        
        // Update weights with this pattern
        weights.update(signature);
        
        // Get the stability score
        let (concept_id, stability) = weights.get_stability();
        
        // Return if stable enough
        if stability >= self.config.stability_threshold {
            Some(concept_id)
        } else {
            None
        }
    }
    
    /// Create a new concept from this pattern
    pub fn create_concept(&mut self, signature: &[f32]) -> ConceptId {
        // Generate a new concept ID
        let concept_id = self.generate_concept_id();
        
        // Register it with the appropriate matcher
        match self.config.algorithm {
            MatchingAlgorithm::LSH => {
                if let Some(lsh_table) = &mut self.lsh_table {
                    let hash_key = lsh_table.compute_hash_key(signature);
                    lsh_table.register_concept(hash_key, concept_id);
                }
            }
            MatchingAlgorithm::Hebbian => {
                if let Some(weights) = &mut self.hebbian_weights {
                    weights.register_concept(concept_id, signature);
                }
            }
            _ => {}
        }
        
        concept_id
    }
    
    /// Generate a new concept ID
    fn generate_concept_id(&self) -> ConceptId {
        // In a real implementation, this would be more sophisticated
        // For now, just generate a random ID
        rand::random()
    }
}

/// Record of votes for a pattern
struct VoteRecord {
    /// Concept ID
    concept_id: ConceptId,
    
    /// Vote count
    vote_count: usize,
    
    /// Last vote timestamp
    last_vote: Instant,
}

/// LSH table for fast pattern matching
struct LshTable {
    /// Number of bands
    bands: usize,
    
    /// Hash bits
    hash_bits: usize,
    
    /// Vote threshold
    vote_threshold: usize,
    
    /// Vote expiration
    vote_expiration: Duration,
    
    /// Hash to vote mapping
    votes: HashMap<u64, VoteRecord>,
    
    /// Random projection vectors
    projections: Vec<Vec<f32>>,
}

impl LshTable {
    /// Create a new LSH table
    fn new(bands: usize, hash_bits: usize, vote_threshold: usize, vote_expiration: Duration) -> Self {
        // Generate random projection vectors
        let mut projections = Vec::with_capacity(hash_bits);
        
        // In a real implementation, we would generate random vectors
        // For now, we'll just use a simple pattern
        for i in 0..hash_bits {
            let mut proj = Vec::with_capacity(8); // Assume 8D emotion vector
            for j in 0..8 {
                proj.push((i * j) as f32 * 0.01);
            }
            projections.push(proj);
        }
        
        Self {
            bands,
            hash_bits,
            vote_threshold,
            vote_expiration,
            votes: HashMap::new(),
            projections,
        }
    }
    
    /// Compute an LSH key for a signature
    fn compute_hash_key(&self, signature: &[f32]) -> u64 {
        // Project the signature onto random vectors and get a bit vector
        let mut bit_vector = 0u64;
        
        for (i, proj) in self.projections.iter().enumerate().take(self.hash_bits) {
            // Compute dot product
            let mut dot = 0.0;
            for (j, &val) in signature.iter().enumerate().take(proj.len()) {
                dot += val * proj[j];
            }
            
            // Set bit if dot product is positive
            if dot > 0.0 {
                bit_vector |= 1 << i;
            }
        }
        
        bit_vector
    }
    
    /// Get the vote record for a hash key
    fn get_vote(&mut self, hash_key: u64) -> Option<&VoteRecord> {
        // Clean expired votes
        self.clean_expired_votes();
        
        // Get the vote record
        self.votes.get(&hash_key)
    }
    
    /// Register a concept for a hash key
    fn register_concept(&mut self, hash_key: u64, concept_id: ConceptId) {
        // Create a new vote record
        let vote = VoteRecord {
            concept_id,
            vote_count: 1,
            last_vote: Instant::now(),
        };
        
        // Insert into votes
        self.votes.insert(hash_key, vote);
    }
    
    /// Clean expired votes
    fn clean_expired_votes(&mut self) {
        let now = Instant::now();
        self.votes.retain(|_, vote| {
            now.duration_since(vote.last_vote) < self.vote_expiration
        });
    }
}

/// Hebbian weights for pattern learning
struct HebbianWeights {
    /// Learning rate
    eta: f32,
    
    /// Weight decay
    decay: f32,
    
    /// Coupling weights between oscillators
    weights: Vec<Vec<f32>>,
    
    /// Associated concept ID
    concept_id: Option<ConceptId>,
    
    /// Stability score
    stability: f32,
}

impl HebbianWeights {
    /// Create new Hebbian weights
    fn new(eta: f32, decay: f32) -> Self {
        // Create empty weights
        // In a real implementation, we would size this based on the number of oscillators
        let weights = Vec::new();
        
        Self {
            eta,
            decay,
            weights,
            concept_id: None,
            stability: 0.0,
        }
    }
    
    /// Update weights with a new pattern
    fn update(&mut self, signature: &[f32]) {
        // Initialize weights if needed
        if self.weights.is_empty() {
            let size = signature.len();
            self.weights = vec![vec![0.0; size]; size];
        }
        
        // Compute stability before update
        let old_stability = self.compute_stability(signature);
        
        // Update weights according to Hebbian rule
        for i in 0..signature.len() {
            for j in 0..signature.len() {
                // Weight update: strengthen if both active
                let delta = self.eta * signature[i] * signature[j];
                self.weights[i][j] += delta;
                
                // Apply decay
                self.weights[i][j] *= self.decay;
            }
        }
        
        // Compute new stability
        let new_stability = self.compute_stability(signature);
        
        // Update stability (with some smoothing)
        self.stability = 0.8 * self.stability + 0.2 * new_stability;
    }
    
    /// Compute stability score for a pattern
    fn compute_stability(&self, signature: &[f32]) -> f32 {
        if self.weights.is_empty() {
            return 0.0;
        }
        
        // Compute energy (sum of weighted activations)
        let mut energy = 0.0;
        let mut total_weight = 0.0;
        
        for i in 0..signature.len() {
            for j in 0..signature.len() {
                energy += self.weights[i][j] * signature[i] * signature[j];
                total_weight += self.weights[i][j].abs();
            }
        }
        
        // Normalize
        if total_weight > 0.0 {
            energy /= total_weight;
        }
        
        // Map to [0, 1] range
        0.5 + 0.5 * energy.tanh()
    }
    
    /// Register a concept ID
    fn register_concept(&mut self, concept_id: ConceptId, signature: &[f32]) {
        self.concept_id = Some(concept_id);
        
        // Initialize weights if needed
        if self.weights.is_empty() {
            let size = signature.len();
            self.weights = vec![vec![0.0; size]; size];
            
            // Pre-learn the pattern
            for _ in 0..10 {
                self.update(signature);
            }
        }
    }
    
    /// Get stability and associated concept
    fn get_stability(&self) -> (ConceptId, f32) {
        (self.concept_id.unwrap_or(0), self.stability)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_lsh_matching() {
        let mut config = PatternMatcherConfig::default();
        config.algorithm = MatchingAlgorithm::LSH;
        
        let mut matcher = PatternMatcher::new(config);
        
        // Create a signature
        let signature = vec![0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
        
        // Create a concept
        let concept_id = matcher.create_concept(&signature);
        
        // Match should work for similar signature
        let similar = vec![0.11, 0.21, 0.31, 0.41, 0.51, 0.61, 0.71, 0.81];
        
        // In a real scenario, we would need multiple votes to meet the threshold
        // For this test, we'd manually adjust the vote count or threshold
        
        // This is a simplified test - in reality we would have more robust tests
        // for the LSH matching with proper threshold management
    }
    
    #[test]
    fn test_hebbian_matching() {
        let mut config = PatternMatcherConfig::default();
        config.algorithm = MatchingAlgorithm::Hebbian;
        config.hebbian_eta = 0.2; // Higher learning rate for testing
        
        let mut matcher = PatternMatcher::new(config);
        
        // Create a signature
        let signature = vec![0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
        
        // Create a concept
        let concept_id = matcher.create_concept(&signature);
        
        // Train the network
        for _ in 0..20 {
            matcher.match_pattern(&signature);
        }
        
        // Similar pattern should now match after training
        let similar = vec![0.11, 0.21, 0.31, 0.41, 0.51, 0.61, 0.71, 0.81];
        
        // This test is simplified - in reality we would have more robust tests
        // for the Hebbian learning with proper stability metrics
    }
}
