//! Snapshot serialization and deserialization
//!
//! This module provides functionality for saving and loading ALAN state
//! snapshots using FlatBuffers, with cross-platform compatibility and
//! optional compression.

use std::fmt;
use std::io::{self, Read, Write};
use std::path::Path;
use std::fs::File;
use thiserror::Error;

#[cfg(feature = "compression")]
use zstd::{encode_all, decode_all};

// Constants
const SCHEMA_CRC32: u32 = 0x8A7B4C3D;
const VERSION: u16 = 0x0200;  // 2.0
const IDENTIFIER: &[u8; 4] = b"ALSN";
const COMPRESSED_IDENTIFIER: &[u8; 5] = b"ALSNZ";

// Endianness flags
const LITTLE_ENDIAN: u8 = 0;
const BIG_ENDIAN: u8 = 1;

/// Errors that can occur during snapshot operations
#[derive(Error, Debug)]
pub enum SnapshotError {
    #[error("IO error: {0}")]
    Io(#[from] io::Error),

    #[error("Invalid snapshot format: {0}")]
    InvalidFormat(String),
    
    #[error("Incompatible schema version {0}.{1}, expected {2}.{3}")]
    IncompatibleVersion(u8, u8, u8, u8),
    
    #[error("Schema CRC32 mismatch: {0:08x} != {1:08x}")]
    SchemaMismatch(u32, u32),
    
    #[error("Unsupported endianness: {0}")]
    UnsupportedEndianness(u8),
    
    #[error("Compression error: {0}")]
    CompressionError(String),
    
    #[error("Decompression error: {0}")]
    DecompressionError(String),
}

/// Get the schema version as a (major, minor) tuple
pub fn get_version() -> (u8, u8) {
    let major = ((VERSION >> 8) & 0xFF) as u8;
    let minor = (VERSION & 0xFF) as u8;
    (major, minor)
}

/// A snapshot of the ALAN system state
///
/// This structure contains the complete state of an ALAN system,
/// including phase angles, phase momenta, spin vectors, and spin momenta.
#[derive(Debug, Clone)]
pub struct StateSnapshot {
    /// Phase angles of oscillators in radians [0, 2π)
    pub theta: Vec<f32>,
    
    /// Phase momenta of oscillators
    pub p_theta: Vec<f32>,
    
    /// Spin vectors of oscillators (3D)
    pub sigma: Vec<[f32; 3]>,
    
    /// Spin momenta of oscillators (3D)
    pub p_sigma: Vec<[f32; 3]>,
    
    /// Phase timestep (outer loop)
    pub dt_phase: f32,
    
    /// Spin timestep (inner loop)
    pub dt_spin: f32,
    
    /// Cached regularization parameter λ for Hopfield memory
    pub lambda: Option<f32>,
}

impl StateSnapshot {
    /// Create a new state snapshot
    ///
    /// # Arguments
    /// * `n_oscillators` - Number of oscillators
    /// * `dt_phase` - Phase timestep (outer loop)
    /// * `dt_spin` - Spin timestep (inner loop)
    ///
    /// # Returns
    /// A new `StateSnapshot` with zero-initialized state
    pub fn new(n_oscillators: usize, dt_phase: f32, dt_spin: f32) -> Self {
        Self {
            theta: vec![0.0; n_oscillators],
            p_theta: vec![0.0; n_oscillators],
            sigma: vec![[0.0, 0.0, 0.0]; n_oscillators],
            p_sigma: vec![[0.0, 0.0, 0.0]; n_oscillators],
            dt_phase,
            dt_spin,
            lambda: None,
        }
    }
    
    /// Get the number of oscillators in the snapshot
    pub fn n_oscillators(&self) -> usize {
        self.theta.len()
    }
    
    /// Save the snapshot to a file
    ///
    /// # Arguments
    /// * `path` - Path to the file
    /// * `compress` - Whether to compress the snapshot
    ///
    /// # Returns
    /// `Ok(())` on success, or an error if the save failed
    pub fn save<P: AsRef<Path>>(&self, path: P, compress: bool) -> Result<(), SnapshotError> {
        let buffer = if compress {
            #[cfg(feature = "compression")]
            {
                let bytes = self.to_bytes()?;
                let compressed = encode_all(&bytes[..], 3)
                    .map_err(|e| SnapshotError::CompressionError(e.to_string()))?;
                
                // Prepend the compressed identifier
                let mut buffer = Vec::with_capacity(COMPRESSED_IDENTIFIER.len() + compressed.len());
                buffer.extend_from_slice(COMPRESSED_IDENTIFIER);
                buffer.extend_from_slice(&compressed);
                buffer
            }
            #[cfg(not(feature = "compression"))]
            {
                return Err(SnapshotError::CompressionError(
                    "Compression not enabled in this build".to_string()
                ));
            }
        } else {
            self.to_bytes()?
        };
        
        let mut file = File::create(path)
            .map_err(SnapshotError::Io)?;
        
        file.write_all(&buffer)
            .map_err(SnapshotError::Io)?;
        
        Ok(())
    }
    
    /// Load a snapshot from a file
    ///
    /// # Arguments
    /// * `path` - Path to the file
    ///
    /// # Returns
    /// The loaded `StateSnapshot`, or an error if the load failed
    pub fn load<P: AsRef<Path>>(path: P) -> Result<Self, SnapshotError> {
        let mut file = File::open(path)
            .map_err(SnapshotError::Io)?;
        
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)
            .map_err(SnapshotError::Io)?;
        
        // Check for compressed format
        if buffer.len() >= COMPRESSED_IDENTIFIER.len() &&
           &buffer[..COMPRESSED_IDENTIFIER.len()] == COMPRESSED_IDENTIFIER {
            #[cfg(feature = "compression")]
            {
                let compressed = &buffer[COMPRESSED_IDENTIFIER.len()..];
                let decompressed = decode_all(compressed)
                    .map_err(|e| SnapshotError::DecompressionError(e.to_string()))?;
                
                return Self::from_bytes(&decompressed);
            }
            #[cfg(not(feature = "compression"))]
            {
                return Err(SnapshotError::DecompressionError(
                    "Compression not enabled in this build".to_string()
                ));
            }
        }
        
        Self::from_bytes(&buffer)
    }
    
    /// Serialize the snapshot to bytes
    ///
    /// # Returns
    /// The serialized snapshot as bytes, or an error if serialization failed
    pub fn to_bytes(&self) -> Result<Vec<u8>, SnapshotError> {
        // This is just a placeholder until we implement FlatBuffers
        // In the real implementation, we would use FlatBuffers to serialize
        
        // For now, just create a simple header to demonstrate the concept
        let mut buffer = Vec::new();
        
        // Add identifier
        buffer.extend_from_slice(IDENTIFIER);
        
        // Add version
        buffer.extend_from_slice(&VERSION.to_le_bytes());
        
        // Add schema CRC32
        buffer.extend_from_slice(&SCHEMA_CRC32.to_le_bytes());
        
        // Add endianness flag (always little-endian for now)
        buffer.push(LITTLE_ENDIAN);
        
        // Add timestep info
        buffer.extend_from_slice(&self.dt_phase.to_le_bytes());
        buffer.extend_from_slice(&self.dt_spin.to_le_bytes());
        
        // Add lambda if present
        let has_lambda = self.lambda.is_some();
        buffer.push(if has_lambda { 1 } else { 0 });
        if let Some(lambda) = self.lambda {
            buffer.extend_from_slice(&lambda.to_le_bytes());
        }
        
        // Add oscillator count
        let n_oscillators = self.n_oscillators() as u32;
        buffer.extend_from_slice(&n_oscillators.to_le_bytes());
        
        // Add theta array
        for &theta in &self.theta {
            buffer.extend_from_slice(&theta.to_le_bytes());
        }
        
        // Add p_theta array
        for &p_theta in &self.p_theta {
            buffer.extend_from_slice(&p_theta.to_le_bytes());
        }
        
        // Add sigma array (flattened)
        for &sigma in &self.sigma {
            for &component in &sigma {
                buffer.extend_from_slice(&component.to_le_bytes());
            }
        }
        
        // Add p_sigma array (flattened)
        for &p_sigma in &self.p_sigma {
            for &component in &p_sigma {
                buffer.extend_from_slice(&component.to_le_bytes());
            }
        }
        
        Ok(buffer)
    }
    
    /// Deserialize a snapshot from bytes
    ///
    /// # Arguments
    /// * `bytes` - The serialized snapshot bytes
    ///
    /// # Returns
    /// The deserialized `StateSnapshot`, or an error if deserialization failed
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, SnapshotError> {
        // This is just a placeholder until we implement FlatBuffers
        // In the real implementation, we would use FlatBuffers to deserialize
        
        // Verify buffer size and identifier
        if bytes.len() < 12 {
            return Err(SnapshotError::InvalidFormat(
                "Buffer too small".to_string()
            ));
        }
        
        if &bytes[0..4] != IDENTIFIER {
            return Err(SnapshotError::InvalidFormat(
                "Invalid identifier".to_string()
            ));
        }
        
        // Verify version
        let version = u16::from_le_bytes([bytes[4], bytes[5]]);
        if version != VERSION {
            let actual_major = (version >> 8) as u8;
            let actual_minor = (version & 0xFF) as u8;
            let (expected_major, expected_minor) = get_version();
            
            return Err(SnapshotError::IncompatibleVersion(
                actual_major, actual_minor, 
                expected_major, expected_minor
            ));
        }
        
        // Verify schema CRC32
        let crc32 = u32::from_le_bytes([bytes[6], bytes[7], bytes[8], bytes[9]]);
        if crc32 != SCHEMA_CRC32 {
            return Err(SnapshotError::SchemaMismatch(crc32, SCHEMA_CRC32));
        }
        
        // Check endianness
        let endianness = bytes[10];
        if endianness != LITTLE_ENDIAN {
            return Err(SnapshotError::UnsupportedEndianness(endianness));
        }
        
        // Extract timestep info
        let dt_phase = f32::from_le_bytes([bytes[11], bytes[12], bytes[13], bytes[14]]);
        let dt_spin = f32::from_le_bytes([bytes[15], bytes[16], bytes[17], bytes[18]]);
        
        // Extract lambda if present
        let has_lambda = bytes[19] != 0;
        let mut offset = 20;
        let lambda = if has_lambda {
            let lambda = f32::from_le_bytes([
                bytes[offset], bytes[offset+1], bytes[offset+2], bytes[offset+3]
            ]);
            offset += 4;
            Some(lambda)
        } else {
            None
        };
        
        // Extract oscillator count
        let n_oscillators = u32::from_le_bytes([
            bytes[offset], bytes[offset+1], bytes[offset+2], bytes[offset+3]
        ]) as usize;
        offset += 4;
        
        // Ensure buffer is large enough
        let expected_size = offset + n_oscillators * 4 * (2 + 3 + 3);
        if bytes.len() < expected_size {
            return Err(SnapshotError::InvalidFormat(
                format!("Buffer too small: {} < {}", bytes.len(), expected_size)
            ));
        }
        
        // Extract theta array
        let mut theta = Vec::with_capacity(n_oscillators);
        for i in 0..n_oscillators {
            let idx = offset + i * 4;
            let value = f32::from_le_bytes([
                bytes[idx], bytes[idx+1], bytes[idx+2], bytes[idx+3]
            ]);
            theta.push(value);
        }
        offset += n_oscillators * 4;
        
        // Extract p_theta array
        let mut p_theta = Vec::with_capacity(n_oscillators);
        for i in 0..n_oscillators {
            let idx = offset + i * 4;
            let value = f32::from_le_bytes([
                bytes[idx], bytes[idx+1], bytes[idx+2], bytes[idx+3]
            ]);
            p_theta.push(value);
        }
        offset += n_oscillators * 4;
        
        // Extract sigma array
        let mut sigma = Vec::with_capacity(n_oscillators);
        for i in 0..n_oscillators {
            let idx = offset + i * 12;
            let x = f32::from_le_bytes([
                bytes[idx], bytes[idx+1], bytes[idx+2], bytes[idx+3]
            ]);
            let y = f32::from_le_bytes([
                bytes[idx+4], bytes[idx+5], bytes[idx+6], bytes[idx+7]
            ]);
            let z = f32::from_le_bytes([
                bytes[idx+8], bytes[idx+9], bytes[idx+10], bytes[idx+11]
            ]);
            sigma.push([x, y, z]);
        }
        offset += n_oscillators * 12;
        
        // Extract p_sigma array
        let mut p_sigma = Vec::with_capacity(n_oscillators);
        for i in 0..n_oscillators {
            let idx = offset + i * 12;
            let x = f32::from_le_bytes([
                bytes[idx], bytes[idx+1], bytes[idx+2], bytes[idx+3]
            ]);
            let y = f32::from_le_bytes([
                bytes[idx+4], bytes[idx+5], bytes[idx+6], bytes[idx+7]
            ]);
            let z = f32::from_le_bytes([
                bytes[idx+8], bytes[idx+9], bytes[idx+10], bytes[idx+11]
            ]);
            p_sigma.push([x, y, z]);
        }
        
        Ok(Self {
            theta,
            p_theta,
            sigma,
            p_sigma,
            dt_phase,
            dt_spin,
            lambda,
        })
    }
}

impl fmt::Display for StateSnapshot {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "StateSnapshot(n_oscillators={}, dt_phase={}, dt_spin={})",
               self.n_oscillators(), self.dt_phase, self.dt_spin)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f32::consts::PI;
    use tempfile::tempdir;
    
    #[test]
    fn test_version() {
        let (major, minor) = get_version();
        assert_eq!(major, 2);
        assert_eq!(minor, 0);
    }
    
    #[test]
    fn test_snapshot_roundtrip() {
        // Create a simple snapshot
        let mut snapshot = StateSnapshot::new(3, 0.01, 0.00125);
        
        // Set some values
        snapshot.theta[0] = 0.0;
        snapshot.theta[1] = PI / 2.0;
        snapshot.theta[2] = PI;
        
        snapshot.p_theta[0] = 0.1;
        snapshot.p_theta[1] = 0.2;
        snapshot.p_theta[2] = 0.3;
        
        snapshot.sigma[0] = [1.0, 0.0, 0.0];
        snapshot.sigma[1] = [0.0, 1.0, 0.0];
        snapshot.sigma[2] = [0.0, 0.0, 1.0];
        
        snapshot.p_sigma[0] = [0.01, 0.0, 0.0];
        snapshot.p_sigma[1] = [0.0, 0.01, 0.0];
        snapshot.p_sigma[2] = [0.0, 0.0, 0.01];
        
        // Set lambda
        snapshot.lambda = Some(0.05);
        
        // Serialization and deserialization
        let bytes = snapshot.to_bytes().unwrap();
        let decoded = StateSnapshot::from_bytes(&bytes).unwrap();
        
        // Verify values
        assert_eq!(decoded.n_oscillators(), 3);
        assert_eq!(decoded.dt_phase, 0.01);
        assert_eq!(decoded.dt_spin, 0.00125);
        assert_eq!(decoded.lambda, Some(0.05));
        
        assert_eq!(decoded.theta[0], 0.0);
        assert_eq!(decoded.theta[1], PI / 2.0);
        assert_eq!(decoded.theta[2], PI);
        
        assert_eq!(decoded.p_theta[0], 0.1);
        assert_eq!(decoded.p_theta[1], 0.2);
        assert_eq!(decoded.p_theta[2], 0.3);
        
        assert_eq!(decoded.sigma[0], [1.0, 0.0, 0.0]);
        assert_eq!(decoded.sigma[1], [0.0, 1.0, 0.0]);
        assert_eq!(decoded.sigma[2], [0.0, 0.0, 1.0]);
        
        assert_eq!(decoded.p_sigma[0], [0.01, 0.0, 0.0]);
        assert_eq!(decoded.p_sigma[1], [0.0, 0.01, 0.0]);
        assert_eq!(decoded.p_sigma[2], [0.0, 0.0, 0.01]);
    }
    
    #[test]
    fn test_snapshot_file_io() {
        // Create a temporary directory
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("snapshot.bin");
        
        // Create a simple snapshot
        let mut snapshot = StateSnapshot::new(2, 0.01, 0.00125);
        snapshot.theta[0] = 0.0;
        snapshot.theta[1] = PI;
        
        // Save to file
        snapshot.save(&file_path, false).unwrap();
        
        // Load from file
        let loaded = StateSnapshot::load(&file_path).unwrap();
        
        // Verify values
        assert_eq!(loaded.n_oscillators(), 2);
        assert_eq!(loaded.dt_phase, 0.01);
        assert_eq!(loaded.dt_spin, 0.00125);
        assert_eq!(loaded.theta[0], 0.0);
        assert_eq!(loaded.theta[1], PI);
    }
    
    #[cfg(feature = "compression")]
    #[test]
    fn test_snapshot_compression() {
        // Create a temporary directory
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("snapshot.bin.zst");
        
        // Create a larger snapshot to benefit from compression
        let n = 1000;
        let mut snapshot = StateSnapshot::new(n, 0.01, 0.00125);
        
        // Set some repetitive values to get good compression
        for i in 0..n {
            snapshot.theta[i] = (i as f32 % 10.0) * 0.1;
            snapshot.p_theta[i] = 0.0;
            snapshot.sigma[i] = [1.0, 0.0, 0.0];
            snapshot.p_sigma[i] = [0.0, 0.0, 0.0];
        }
        
        // Save to file with compression
        snapshot.save(&file_path, true).unwrap();
        
        // Load from compressed file
        let loaded = StateSnapshot::load(&file_path).unwrap();
        
        // Verify values
        assert_eq!(loaded.n_oscillators(), n);
        for i in 0..n {
            assert!((loaded.theta[i] - (i as f32 % 10.0) * 0.1).abs() < 1e-6);
        }
    }
}
