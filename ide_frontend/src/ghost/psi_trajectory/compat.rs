/**
 * Compatibility and versioning for ψ-Trajectory
 * ------------------------------------------------------------------
 * Handles version compatibility and migration between different archive formats:
 * - Schema version tracking
 * - Oscillator count migration
 * - Feature detection
 * - Backward compatibility mechanisms
 */

use std::io::{self, Read, Write, Seek, SeekFrom};
use serde::{Serialize, Deserialize};

/// Maximum supported schema version
pub const CURRENT_SCHEMA_VERSION: u32 = 2;

/// Default oscillator count (current version)
pub const DEFAULT_OSCILLATOR_COUNT: usize = 256;

/// Archive schema version and feature flags
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct SchemaVersion {
    /// Schema version number
    pub version: u32,
    
    /// Number of oscillators in this archive
    pub oscillator_count: usize,
    
    /// Feature flags
    pub features: FeatureFlags,
    
    /// Compatibility flags
    pub compat_flags: u32,
    
    /// Creation timestamp (UNIX epoch seconds)
    pub created_at: u64,
}

/// Feature flags for archives
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct FeatureFlags {
    /// Audio is present
    pub has_audio: bool,
    
    /// Video is present
    pub has_video: bool,
    
    /// Encrypted archive
    pub encrypted: bool,
    
    /// Uses content-based chunking
    pub chunked: bool,
    
    /// Contains markers & annotations
    pub annotated: bool,
    
    /// Uses delta encoding
    pub delta_encoded: bool,
}

impl Default for FeatureFlags {
    fn default() -> Self {
        Self {
            has_audio: true,
            has_video: true,
            encrypted: false,
            chunked: false,
            annotated: false,
            delta_encoded: true,
        }
    }
}

impl Default for SchemaVersion {
    fn default() -> Self {
        Self {
            version: CURRENT_SCHEMA_VERSION,
            oscillator_count: DEFAULT_OSCILLATOR_COUNT,
            features: FeatureFlags::default(),
            compat_flags: 0,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        }
    }
}

impl SchemaVersion {
    /// Create a new schema version with the specified oscillator count
    pub fn new(oscillator_count: usize) -> Self {
        Self {
            oscillator_count,
            ..Default::default()
        }
    }
    
    /// Check if the schema version is compatible with the current version
    pub fn is_compatible(&self) -> bool {
        // Version 1 and 2 are compatible
        (self.version == 1 || self.version == 2) &&
            // Must have some oscillators
            self.oscillator_count > 0 &&
            // Must have at least one of audio or video
            (self.features.has_audio || self.features.has_video)
    }
    
    /// Check if this schema requires oscillator count migration
    pub fn needs_oscillator_migration(&self) -> bool {
        self.oscillator_count != DEFAULT_OSCILLATOR_COUNT
    }
    
    /// Write the schema version to a writer
    pub fn write<W: Write>(&self, writer: &mut W) -> io::Result<()> {
        let data = bincode::serialize(self)
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;
        
        // Write length-prefixed data
        writer.write_all(&(data.len() as u32).to_le_bytes())?;
        writer.write_all(&data)
    }
    
    /// Read the schema version from a reader
    pub fn read<R: Read>(reader: &mut R) -> io::Result<Self> {
        let mut len_bytes = [0u8; 4];
        reader.read_exact(&mut len_bytes)?;
        let len = u32::from_le_bytes(len_bytes) as usize;
        
        let mut data = vec![0u8; len];
        reader.read_exact(&mut data)?;
        
        bincode::deserialize(&data)
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))
    }
}

/// Compatibility error types
#[derive(Debug, thiserror::Error)]
pub enum CompatError {
    #[error("Unsupported schema version: {0}")]
    UnsupportedVersion(u32),
    
    #[error("Incompatible oscillator count: {0} (expected {1})")]
    OscillatorCountMismatch(usize, usize),
    
    #[error("Unsupported feature: {0}")]
    UnsupportedFeature(String),
    
    #[error("IO error: {0}")]
    IoError(#[from] io::Error),
    
    #[error("Archive requires feature not present in this build: {0}")]
    MissingFeature(String),
}

/// Archive header with compatibility information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchiveHeader {
    /// Magic identifier "PSIARC"
    pub magic: [u8; 6],
    
    /// Schema version and features
    pub schema: SchemaVersion,
    
    /// Number of sessions in this archive
    pub session_count: u32,
    
    /// CRC32 checksum of the header
    pub header_crc: u32,
}

impl Default for ArchiveHeader {
    fn default() -> Self {
        Self {
            magic: *b"PSIARC",
            schema: SchemaVersion::default(),
            session_count: 0,
            header_crc: 0,
        }
    }
}

impl ArchiveHeader {
    /// Create a new archive header with the specified oscillator count
    pub fn new(oscillator_count: usize) -> Self {
        Self {
            schema: SchemaVersion::new(oscillator_count),
            ..Default::default()
        }
    }
    
    /// Write the header to a writer
    pub fn write<W: Write + Seek>(&self, writer: &mut W) -> io::Result<()> {
        // Remember the start position
        let start_pos = writer.stream_position()?;
        
        // Write header without CRC
        writer.write_all(&self.magic)?;
        self.schema.write(writer)?;
        writer.write_all(&self.session_count.to_le_bytes())?;
        writer.write_all(&[0u8; 4])?;  // Placeholder for CRC
        
        // Calculate CRC
        let end_pos = writer.stream_position()?;
        writer.seek(SeekFrom::Start(start_pos))?;
        
        let mut buffer = vec![0u8; (end_pos - start_pos) as usize - 4];
        writer.read_exact(&mut buffer)?;
        
        let crc = crc32fast::hash(&buffer);
        
        // Write the real CRC
        writer.seek(SeekFrom::Start(end_pos - 4))?;
        writer.write_all(&crc.to_le_bytes())?;
        
        // Restore position
        writer.seek(SeekFrom::Start(end_pos))?;
        
        Ok(())
    }
    
    /// Read the header from a reader
    pub fn read<R: Read + Seek>(reader: &mut R) -> io::Result<Self> {
        // Remember the start position
        let start_pos = reader.stream_position()?;
        
        // Read magic
        let mut magic = [0u8; 6];
        reader.read_exact(&mut magic)?;
        
        if magic != *b"PSIARC" {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "Invalid archive magic",
            ));
        }
        
        // Read schema version
        let schema = SchemaVersion::read(reader)?;
        
        // Read session count
        let mut session_count_bytes = [0u8; 4];
        reader.read_exact(&mut session_count_bytes)?;
        let session_count = u32::from_le_bytes(session_count_bytes);
        
        // Read CRC
        let mut crc_bytes = [0u8; 4];
        reader.read_exact(&mut crc_bytes)?;
        let header_crc = u32::from_le_bytes(crc_bytes);
        
        // Verify CRC
        let end_pos = reader.stream_position()?;
        reader.seek(SeekFrom::Start(start_pos))?;
        
        let mut buffer = vec![0u8; (end_pos - start_pos) as usize - 4];
        reader.read_exact(&mut buffer)?;
        
        let calculated_crc = crc32fast::hash(&buffer);
        
        if calculated_crc != header_crc {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "Header CRC mismatch",
            ));
        }
        
        // Restore position
        reader.seek(SeekFrom::Start(end_pos))?;
        
        Ok(Self {
            magic,
            schema,
            session_count,
            header_crc,
        })
    }
    
    /// Check if the header is valid
    pub fn is_valid(&self) -> bool {
        self.magic == *b"PSIARC" && self.schema.is_compatible()
    }
}

/// Migrate oscillator state from source count to target count
///
/// This function handles converting between different oscillator counts:
/// - If source < target: Will zero-pad additional oscillators
/// - If source > target: Will truncate excess oscillators
///
/// Both states must be in the canonical format (flat array of phase values).
pub fn migrate_oscillator_state(
    source: &[f32],
    source_count: usize,
    target_count: usize,
) -> Vec<f32> {
    if source_count == target_count {
        // No migration needed
        return source.to_vec();
    }
    
    let values_per_osc = source.len() / source_count;
    let mut result = Vec::with_capacity(values_per_osc * target_count);
    
    if source_count < target_count {
        // Source has fewer oscillators - copy existing and zero-pad
        result.extend_from_slice(source);
        
        // Add zero padding for the additional oscillators
        let padding_count = values_per_osc * (target_count - source_count);
        result.resize(result.len() + padding_count, 0.0);
    } else {
        // Source has more oscillators - truncate
        let truncated_size = values_per_osc * target_count;
        result.extend_from_slice(&source[0..truncated_size]);
    }
    
    result
}

/// Migrate file format between different oscillator counts
///
/// This function will:
/// 1. Open the source file
/// 2. Read its header
/// 3. Create a target file with the desired oscillator count
/// 4. Copy and convert all sessions
pub fn migrate_file_format(
    source_path: &str,
    target_path: &str,
    target_osc_count: usize,
) -> Result<(), CompatError> {
    use std::fs::File;
    
    // Open source file
    let mut source_file = File::open(source_path)
        .map_err(|e| CompatError::IoError(io::Error::new(
            e.kind(),
            format!("Failed to open source file: {}", e),
        )))?;
    
    // Read source header
    let source_header = ArchiveHeader::read(&mut source_file)
        .map_err(|e| CompatError::IoError(io::Error::new(
            e.kind(),
            format!("Failed to read source header: {}", e),
        )))?;
    
    // Validate source header
    if !source_header.is_valid() {
        return Err(CompatError::UnsupportedVersion(source_header.schema.version));
    }
    
    // Check if migration is needed
    if source_header.schema.oscillator_count == target_osc_count {
        // No migration needed - just copy the file
        use std::io::copy;
        let mut target_file = File::create(target_path)
            .map_err(|e| CompatError::IoError(io::Error::new(
                e.kind(),
                format!("Failed to create target file: {}", e),
            )))?;
        
        source_file.seek(SeekFrom::Start(0))?;
        copy(&mut source_file, &mut target_file)?;
        
        return Ok(());
    }
    
    // Create target file
    let mut target_file = File::create(target_path)
        .map_err(|e| CompatError::IoError(io::Error::new(
            e.kind(),
            format!("Failed to create target file: {}", e),
        )))?;
    
    // Write target header
    let mut target_header = source_header.clone();
    target_header.schema.oscillator_count = target_osc_count;
    target_header.write(&mut target_file)
        .map_err(|e| CompatError::IoError(io::Error::new(
            e.kind(),
            format!("Failed to write target header: {}", e),
        )))?;
    
    // TODO: Implement full session migration
    // This would:
    // 1. Read each session header from source
    // 2. Read frame data and migrate oscillator states
    // 3. Write migrated sessions to target
    
    Ok(())
}

/// Verify an archive file
///
/// This function will:
/// 1. Check CRC
/// 2. Verify schema version
/// 3. Ensure oscillator count is compatible
pub fn verify_archive(path: &str) -> Result<ArchiveHeader, CompatError> {
    use std::fs::File;
    
    // Open file
    let mut file = File::open(path)
        .map_err(|e| CompatError::IoError(io::Error::new(
            e.kind(),
            format!("Failed to open archive: {}", e),
        )))?;
    
    // Read header
    let header = ArchiveHeader::read(&mut file)
        .map_err(|e| CompatError::IoError(io::Error::new(
            e.kind(),
            format!("Failed to read archive header: {}", e),
        )))?;
    
    // Validate header
    if !header.is_valid() {
        return Err(CompatError::UnsupportedVersion(header.schema.version));
    }
    
    // Check oscillator count
    if header.schema.needs_oscillator_migration() {
        return Err(CompatError::OscillatorCountMismatch(
            header.schema.oscillator_count,
            DEFAULT_OSCILLATOR_COUNT,
        ));
    }
    
    // TODO: Add more checks as needed
    
    Ok(header)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;
    
    #[test]
    fn test_schema_version_serialization() {
        let schema = SchemaVersion::new(128);
        let mut buffer = Cursor::new(Vec::new());
        
        // Write and read back
        schema.write(&mut buffer).unwrap();
        buffer.set_position(0);
        let read_schema = SchemaVersion::read(&mut buffer).unwrap();
        
        // Compare
        assert_eq!(read_schema.version, schema.version);
        assert_eq!(read_schema.oscillator_count, schema.oscillator_count);
        assert_eq!(read_schema.features.has_audio, schema.features.has_audio);
        assert_eq!(read_schema.features.has_video, schema.features.has_video);
    }
    
    #[test]
    fn test_archive_header_serialization() {
        let header = ArchiveHeader::new(128);
        let mut buffer = Cursor::new(Vec::new());
        
        // Write and read back
        header.write(&mut buffer).unwrap();
        buffer.set_position(0);
        let read_header = ArchiveHeader::read(&mut buffer).unwrap();
        
        // Compare
        assert_eq!(read_header.magic, header.magic);
        assert_eq!(read_header.schema.version, header.schema.version);
        assert_eq!(read_header.schema.oscillator_count, header.schema.oscillator_count);
        assert_eq!(read_header.session_count, header.session_count);
    }
    
    #[test]
    fn test_oscillator_migration() {
        // Create test data for 4 oscillators with 2 values each
        let source = vec![
            1.0, 2.0,   // Oscillator 0
            3.0, 4.0,   // Oscillator 1
            5.0, 6.0,   // Oscillator 2
            7.0, 8.0,   // Oscillator 3
        ];
        
        // Test upsizing from 4 to 6 oscillators
        let upsize = migrate_oscillator_state(&source, 4, 6);
        assert_eq!(upsize, vec![
            1.0, 2.0,   // Oscillator 0
            3.0, 4.0,   // Oscillator 1
            5.0, 6.0,   // Oscillator 2
            7.0, 8.0,   // Oscillator 3
            0.0, 0.0,   // Oscillator 4 (zero-padded)
            0.0, 0.0,   // Oscillator 5 (zero-padded)
        ]);
        
        // Test downsizing from 4 to 2 oscillators
        let downsize = migrate_oscillator_state(&source, 4, 2);
        assert_eq!(downsize, vec![
            1.0, 2.0,   // Oscillator 0
            3.0, 4.0,   // Oscillator 1
            // Oscillators 2 and 3 are truncated
        ]);
    }
    
    #[test]
    fn test_oscillator_migration_zero_to_zero() {
        // Both source and target are 0, which would be a division by zero
        // in a naive implementation
        let source = Vec::<f32>::new();
        let result = migrate_oscillator_state(&source, 0, 0);
        assert_eq!(result, Vec::<f32>::new());
    }
    
    #[test]
    fn test_verify_archive() {
        // Create a valid archive in memory
        let header = ArchiveHeader::new(DEFAULT_OSCILLATOR_COUNT);
        let mut buffer = Cursor::new(Vec::new());
        header.write(&mut buffer).unwrap();
        
        // Write the buffer to a temporary file
        let temp_dir = tempfile::tempdir().unwrap();
        let file_path = temp_dir.path().join("test.psiarc");
        std::fs::write(&file_path, buffer.get_ref()).unwrap();
        
        // Verify the archive
        let result = verify_archive(file_path.to_str().unwrap());
        assert!(result.is_ok());
        
        // Create an invalid archive
        let mut invalid_header = header.clone();
        invalid_header.magic = *b"INVALIDABC"; // Wrong magic
        let mut buffer = Cursor::new(Vec::new());
        invalid_header.write(&mut buffer).unwrap();
        
        // Write the buffer to a temporary file
        let file_path = temp_dir.path().join("invalid.psiarc");
        std::fs::write(&file_path, buffer.get_ref()).unwrap();
        
        // Verify the archive (should fail)
        let result = verify_archive(file_path.to_str().unwrap());
        assert!(result.is_err());
    }
}
