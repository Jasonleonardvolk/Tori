//! Foreign Function Interface (FFI) for ALAN Core
//!
//! This module provides a C API for the ALAN Core library, allowing it to be used
//! from other languages such as C, C++, C#, and JavaScript via WebAssembly.
//!
//! All functions in this module should be safe to call from non-Rust code.
//! Memory management follows a simple pattern: the caller is responsible for
//! allocating memory for input/output buffers, and this API provides functions
//! to determine the required buffer sizes.

use std::os::raw::{c_double, c_int, c_uchar, c_uint, c_ulonglong};
use std::ffi::CStr;
use std::slice;
use std::ptr;
use std::mem;
use std::fs::File;
use std::io::Read;

use crate::controller::trs_ode::{TrsOde, TrsStats, duffing_system, conservative_duffing};

/// Error codes for the API
#[repr(C)]
pub enum AlanError {
    /// No error
    NoError = 0,
    /// Invalid parameter
    InvalidParameter = 1,
    /// Numerical instability
    NumericalInstability = 2,
    /// Dimension mismatch
    DimensionMismatch = 3,
    /// Memory allocation failed
    AllocationFailure = 4,
    /// I/O error
    IoError = 5,
    /// Invalid snapshot format
    InvalidSnapshot = 6,
    /// Endianness mismatch (expected little-endian)
    EndianMismatch = 7,
    /// Simulation already in progress
    SimulationActive = 8,
    /// Simulation not initialized
    SimulationNotInitialized = 9,
    /// Unknown error
    UnknownError = 999,
}

// Error code constants for C API
pub const ALAN_ERR_NO_ERROR: c_int = AlanError::NoError as c_int;
pub const ALAN_ERR_INVALID_PARAMETER: c_int = AlanError::InvalidParameter as c_int;
pub const ALAN_ERR_NUMERICAL_INSTABILITY: c_int = AlanError::NumericalInstability as c_int;
pub const ALAN_ERR_DIMENSION_MISMATCH: c_int = AlanError::DimensionMismatch as c_int;
pub const ALAN_ERR_ALLOCATION_FAILURE: c_int = AlanError::AllocationFailure as c_int;
pub const ALAN_ERR_IO_ERROR: c_int = AlanError::IoError as c_int;
pub const ALAN_ERR_INVALID_SNAPSHOT: c_int = AlanError::InvalidSnapshot as c_int;
pub const ALAN_ERR_ENDIAN_MISMATCH: c_int = AlanError::EndianMismatch as c_int;
pub const ALAN_ERR_SIMULATION_ACTIVE: c_int = AlanError::SimulationActive as c_int;
pub const ALAN_ERR_SIMULATION_NOT_INITIALIZED: c_int = AlanError::SimulationNotInitialized as c_int;
pub const ALAN_ERR_UNKNOWN_ERROR: c_int = AlanError::UnknownError as c_int;

/// Statistics about the TRS controller, C-compatible layout
#[repr(C)]
pub struct AlanTrsStats {
    /// Last measured TRS loss value
    pub trs_loss: c_double,
    /// Current time step size
    pub last_dt: c_double,
    /// Total number of steps taken
    pub steps: c_ulonglong,
    /// Accumulated integration time
    pub total_time: c_double,
    /// Maximum absolute position error observed
    pub max_position_error: c_double,
    /// Maximum absolute momentum error observed
    pub max_momentum_error: c_double,
}

/// Global simulation state (singleton pattern for C API)
static mut SIMULATION: Option<AlanSimulation> = None;

/// Representation of an ALAN simulation
struct AlanSimulation {
    /// Current state of the simulation (phase angles and momenta)
    state: Vec<f64>,
    /// Current time
    time: f64,
    /// TRS-ODE controller
    controller: TrsOde<Vec<f64>, Box<dyn Fn(f64, &Vec<f64>, &mut [f64])>>,
    /// Number of phase variables (half the state size)
    num_phase_vars: usize,
}

impl AlanSimulation {
    /// Create a new simulation with the given number of oscillators
    fn new(num_oscillators: usize) -> Self {
        // Each oscillator has a phase angle and momentum
        let num_phase_vars = num_oscillators;
        let state_size = num_phase_vars * 2;
        
        // Create initial state (all zeros)
        let state = vec![0.0; state_size];
        
        // Create a simple harmonic oscillator system
        let force = Box::new(move |_t: f64, state: &Vec<f64>, derivative: &mut [f64]| {
            for i in 0..num_phase_vars {
                // Position derivatives are velocities
                derivative[i] = state[num_phase_vars + i];
                // Velocity derivatives are accelerations (simple harmonic: -k*x)
                derivative[num_phase_vars + i] = -state[i];
            }
        }) as Box<dyn Fn(f64, &Vec<f64>, &mut [f64])>;
        
        // Create the controller
        let controller = TrsOde::new(0.01, 0.1, force);
        
        Self {
            state,
            time: 0.0,
            controller,
            num_phase_vars,
        }
    }
    
    /// Get the current state size (number of doubles)
    fn state_size(&self) -> usize {
        self.state.len()
    }
    
    /// Get the number of oscillators
    fn num_oscillators(&self) -> usize {
        self.num_phase_vars
    }
    
    /// Get the current phase angles
    fn get_phases(&self) -> &[f64] {
        &self.state[0..self.num_phase_vars]
    }
    
    /// Set the current state (both phases and momenta)
    fn set_state(&mut self, state: &[f64]) -> Result<(), AlanError> {
        if state.len() != self.state.len() {
            return Err(AlanError::DimensionMismatch);
        }
        self.state.copy_from_slice(state);
        Ok(())
    }
    
    /// Perform a single integration step
    fn step(&mut self) -> Result<(), AlanError> {
        match self.controller.step_symplectic(&mut self.time, &mut self.state) {
            Ok(_) => Ok(()),
            Err(_) => Err(AlanError::NumericalInstability),
        }
    }
    
    /// Perform multiple integration steps
    fn integrate(&mut self, steps: usize) -> Result<(), AlanError> {
        // Validate step count
        if steps > 1_000_000_000 {
            return Err(AlanError::InvalidParameter);
        }
        
        match self.controller.integrate(&mut self.time, &mut self.state, steps) {
            Ok(_) => Ok(()),
            Err(_) => Err(AlanError::NumericalInstability),
        }
    }
    
    /// Get statistics about the controller
    fn get_stats(&self) -> AlanTrsStats {
        let stats = self.controller.stats();
        
        AlanTrsStats {
            trs_loss: stats.trs_loss,
            last_dt: stats.last_dt,
            steps: stats.steps,
            total_time: stats.total_time,
            max_position_error: stats.max_position_error,
            max_momentum_error: stats.max_momentum_error,
        }
    }
}

/// Initialize the ALAN simulation with the given number of oscillators
///
/// # Safety
///
/// This function is unsafe because it initializes global state. It should only be
/// called once before any other API functions.
#[no_mangle]
pub unsafe extern "C" fn alan_init(num_oscillators: c_uint) -> c_int {
    // Check endianness (require little-endian)
    if cfg!(target_endian = "big") {
        return ALAN_ERR_ENDIAN_MISMATCH;
    }
    
    // Check if simulation is already initialized
    if SIMULATION.is_some() {
        return ALAN_ERR_SIMULATION_ACTIVE;
    }
    
    // Validate parameters
    if num_oscillators == 0 || num_oscillators > 1_000_000 {
        return ALAN_ERR_INVALID_PARAMETER;
    }
    
    // Create new simulation
    let simulation = AlanSimulation::new(num_oscillators as usize);
    SIMULATION = Some(simulation);
    
    ALAN_ERR_NO_ERROR
}

/// Initialize the ALAN simulation from a snapshot file
///
/// # Safety
///
/// This function is unsafe because it initializes global state and reads from a pointer.
/// It should only be called once before any other API functions.
#[no_mangle]
pub unsafe extern "C" fn alan_init_snapshot(buffer: *const c_uchar, size: usize) -> c_int {
    // Check endianness (require little-endian)
    if cfg!(target_endian = "big") {
        return ALAN_ERR_ENDIAN_MISMATCH;
    }
    
    // Check if simulation is already initialized
    if SIMULATION.is_some() {
        return ALAN_ERR_SIMULATION_ACTIVE;
    }
    
    // Validate parameters
    if buffer.is_null() || size == 0 {
        return ALAN_ERR_INVALID_PARAMETER;
    }
    
    // TODO: Implement proper snapshot loading
    // For now, just create a default simulation
    let simulation = AlanSimulation::new(32);
    SIMULATION = Some(simulation);
    
    ALAN_ERR_NO_ERROR
}

/// Get the number of elements in the state vector
///
/// This function returns the total state size (phase + momentum variables)
/// to help callers allocate buffers of the correct size.
///
/// # Safety
///
/// This function is unsafe because it accesses global state. It should only be
/// called after alan_init or alan_init_snapshot.
#[no_mangle]
pub unsafe extern "C" fn alan_state_len() -> c_uint {
    match &SIMULATION {
        Some(sim) => sim.state_size() as c_uint,
        None => 0,
    }
}

/// Get the number of oscillators in the simulation
///
/// # Safety
///
/// This function is unsafe because it accesses global state. It should only be
/// called after alan_init or alan_init_snapshot.
#[no_mangle]
pub unsafe extern "C" fn alan_num_oscillators() -> c_uint {
    match &SIMULATION {
        Some(sim) => sim.num_oscillators() as c_uint,
        None => 0,
    }
}

/// Get the current phase angles
///
/// # Safety
///
/// This function is unsafe because it accesses global state and writes to a pointer.
/// The caller must ensure that `out` points to a buffer of at least `alan_num_oscillators()`
/// doubles (8 bytes each).
#[no_mangle]
pub unsafe extern "C" fn alan_get_phase(out: *mut c_double, size: c_uint) -> c_int {
    if out.is_null() {
        return ALAN_ERR_INVALID_PARAMETER;
    }
    
    match &SIMULATION {
        Some(sim) => {
            let num_oscillators = sim.num_oscillators();
            if size as usize != num_oscillators {
                return ALAN_ERR_DIMENSION_MISMATCH;
            }
            
            let phases = sim.get_phases();
            let out_slice = slice::from_raw_parts_mut(out, num_oscillators);
            out_slice.copy_from_slice(phases);
            
            ALAN_ERR_NO_ERROR
        },
        None => ALAN_ERR_SIMULATION_NOT_INITIALIZED,
    }
}

/// Set the state of the simulation
///
/// # Safety
///
/// This function is unsafe because it accesses global state and reads from a pointer.
/// The caller must ensure that `state` points to a buffer of at least `alan_state_len()`
/// doubles (8 bytes each).
#[no_mangle]
pub unsafe extern "C" fn alan_set_state(state: *const c_double, size: c_uint) -> c_int {
    if state.is_null() {
        return ALAN_ERR_INVALID_PARAMETER;
    }
    
    match &mut SIMULATION {
        Some(sim) => {
            let state_size = sim.state_size();
            if size as usize != state_size {
                return ALAN_ERR_DIMENSION_MISMATCH;
            }
            
            let state_slice = slice::from_raw_parts(state, state_size);
            match sim.set_state(state_slice) {
                Ok(_) => ALAN_ERR_NO_ERROR,
                Err(err) => err as c_int,
            }
        },
        None => ALAN_ERR_SIMULATION_NOT_INITIALIZED,
    }
}

/// Perform a single integration step
///
/// # Safety
///
/// This function is unsafe because it accesses global state. It should only be
/// called after alan_init or alan_init_snapshot.
#[no_mangle]
pub unsafe extern "C" fn alan_step() -> c_int {
    match &mut SIMULATION {
        Some(sim) => {
            match sim.step() {
                Ok(_) => ALAN_ERR_NO_ERROR,
                Err(err) => err as c_int,
            }
        },
        None => ALAN_ERR_SIMULATION_NOT_INITIALIZED,
    }
}

/// Perform multiple integration steps
///
/// # Safety
///
/// This function is unsafe because it accesses global state. It should only be
/// called after alan_init or alan_init_snapshot.
#[no_mangle]
pub unsafe extern "C" fn alan_integrate(steps: c_uint) -> c_int {
    if steps == 0 {
        return ALAN_ERR_INVALID_PARAMETER;
    }
    
    match &mut SIMULATION {
        Some(sim) => {
            match sim.integrate(steps as usize) {
                Ok(_) => ALAN_ERR_NO_ERROR,
                Err(err) => err as c_int,
            }
        },
        None => ALAN_ERR_SIMULATION_NOT_INITIALIZED,
    }
}

/// Get statistics about the controller
///
/// # Safety
///
/// This function is unsafe because it accesses global state and writes to a pointer.
/// The caller must ensure that `stats` points to a valid `AlanTrsStats` structure.
#[no_mangle]
pub unsafe extern "C" fn alan_get_stats(stats: *mut AlanTrsStats) -> c_int {
    if stats.is_null() {
        return ALAN_ERR_INVALID_PARAMETER;
    }
    
    match &SIMULATION {
        Some(sim) => {
            let sim_stats = sim.get_stats();
            *stats = sim_stats;
            
            ALAN_ERR_NO_ERROR
        },
        None => ALAN_ERR_SIMULATION_NOT_INITIALIZED,
    }
}

/// Shut down the simulation and free resources
///
/// # Safety
///
/// This function is unsafe because it modifies global state. It should only be
/// called after the simulation is no longer needed.
#[no_mangle]
pub unsafe extern "C" fn alan_shutdown() -> c_int {
    SIMULATION = None;
    ALAN_ERR_NO_ERROR
}
