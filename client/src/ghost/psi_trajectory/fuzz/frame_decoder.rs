//! Fuzzing target for ψ-Trajectory frame decoder
//! 
//! This fuzzer tests the robustness of our frame decoding logic against malformed inputs.
//! It attempts to decode frames with various corruptions, missing data, or invalid formats.

use arbitrary::{Arbitrary, Unstructured};
use libfuzzer_sys::fuzz_target;
use psi_trajectory::compat::{ArchiveHeader, SchemaVersion, DEFAULT_OSCILLATOR_COUNT};
use std::io::Cursor;

/// Fuzz target for frame decoder
fuzz_target!(|data: &[u8]| {
    // Skip empty inputs
    if data.len() < 10 {
        return;
    }

    // Create a cursor with the fuzz data
    let mut cursor = Cursor::new(data);
    
    // Try to parse as an archive header (should never panic or crash)
    let header_result = ArchiveHeader::read(&mut cursor);
    
    // If header parsed successfully, try to decode frames
    if let Ok(header) = header_result {
        // Reset cursor position
        cursor.set_position(0);
        
        // Try to decode the frame data based on oscillator count
        let osc_count = header.schema.oscillator_count;
        
        // Attempt to decode frames with different methods
        match osc_count {
            128 | 256 | 512 => {
                // Decode as standard frame
                let _ = psi_trajectory::decode_frame(&mut cursor, osc_count);
            },
            _ => {
                // Try migration if oscillator count is non-standard
                let _ = psi_trajectory::compat::migrate_oscillator_state(
                    &data[..std::cmp::min(data.len(), 1024)], 
                    std::cmp::max(1, osc_count),
                    DEFAULT_OSCILLATOR_COUNT
                );
            }
        }
    }
    
    // Try to parse as a raw frame without header
    if data.len() > 16 {
        // Get a 32-bit value from the data to use as frame flags
        let flags = u32::from_le_bytes([
            data[0], 
            data.get(1).copied().unwrap_or(0),
            data.get(2).copied().unwrap_or(0),
            data.get(3).copied().unwrap_or(0),
        ]);
        
        // Attempt to decode as a raw frame
        let _ = psi_trajectory::decode_raw_frame(
            &data[4..],
            DEFAULT_OSCILLATOR_COUNT,
            flags
        );
    }
    
    // Test frame corruption recovery
    if data.len() > 32 {
        let frame_data = data.to_vec();
        let _ = psi_trajectory::recovery::attempt_recovery(&frame_data, DEFAULT_OSCILLATOR_COUNT);
    }
});

/// Frame data structure for generating arbitrary test frames
#[derive(Debug, Arbitrary)]
struct FrameData {
    /// Schema version (1 or 2)
    version: u8,
    
    /// Oscillator count (typically 128, 256, or 512)
    oscillator_count: u16,
    
    /// Frame flags
    flags: u32,
    
    /// Frame timestamp
    timestamp: u64,
    
    /// Frame data (variable length)
    data: Vec<u8>,
}

/// Generate a valid frame header for testing
fn generate_valid_frame_header(frame: &FrameData) -> Vec<u8> {
    let mut header = Vec::with_capacity(32);
    
    // Magic "PSIFRAME"
    header.extend_from_slice(b"PSIFRAME");
    
    // Version (clamp to valid range)
    let version = (frame.version % 2) + 1;
    header.push(version);
    
    // Oscillator count (normalize to standard values)
    let osc_count = match frame.oscillator_count % 3 {
        0 => 128,
        1 => 256,
        _ => 512,
    };
    header.extend_from_slice(&(osc_count as u16).to_le_bytes());
    
    // Flags
    header.extend_from_slice(&frame.flags.to_le_bytes());
    
    // Timestamp
    header.extend_from_slice(&frame.timestamp.to_le_bytes());
    
    // Data length
    let data_len = frame.data.len() as u32;
    header.extend_from_slice(&data_len.to_le_bytes());
    
    header
}
