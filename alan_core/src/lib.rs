//! ALAN Core: Phase-coherent reasoning with altermagnetic dynamics
//!
//! This crate provides the core runtime for ALAN, a neuromorphic system that
//! combines phase oscillator dynamics with altermagnetic spin alignment for
//! stable, interpretable, and reversible reasoning.
//!
//! The main components are:
//! - `oscillator`: Banksy phase-spin oscillator dynamics
//! - `controller`: Time-reversal-symmetric ODE control system
//! - `memory`: Associative memory with spin-Hopfield implementation
//! - `snapshot`: Serialization format for system state
//! - `elfin`: Bridge to the ELFIN domain-specific language
//! - `ffi`: C API for interop with other languages and WebAssembly

pub mod oscillator;
pub mod controller;
pub mod ffi;

/// Version information
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const VERSION_MAJOR: u32 = 0;
pub const VERSION_MINOR: u32 = 8;
pub const VERSION_PATCH: u32 = 0;

/// Get version as a string
pub fn version() -> String {
    format!("{}.{}.{}", VERSION_MAJOR, VERSION_MINOR, VERSION_PATCH)
}

/// Get version as a tuple of (major, minor, patch)
pub fn version_tuple() -> (u32, u32, u32) {
    (VERSION_MAJOR, VERSION_MINOR, VERSION_PATCH)
}

/// Initialize the ALAN runtime
pub fn init() -> Result<(), &'static str> {
    // Currently just a stub that always succeeds
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_version() {
        assert_eq!(version(), format!("{}.{}.{}", VERSION_MAJOR, VERSION_MINOR, VERSION_PATCH));
    }
    
    #[test]
    fn test_init() {
        assert!(init().is_ok());
    }
}
