#![no_main]

use libfuzzer_sys::fuzz_target;
use arbitrary::Arbitrary;
use alan_core::controller::trs_ode::TrsOde;

#[derive(Arbitrary, Debug)]
struct FuzzInput {
    dt: f64,
    state: Vec<f64>,
    steps: u32,
}

/// Fuzz target for the TRS controller step function
///
/// This tests that the controller can handle arbitrary inputs without
/// crashing or producing NaN/Inf values. It validates:
/// - Different time steps
/// - Various state vectors
/// - Multiple integration steps
///
/// The fuzzer will automatically try to find inputs that cause crashes
/// or failed assertions.
fuzz_target!(|input: FuzzInput| {
    // Sanitize inputs to avoid spending too much time on degenerate cases
    // but still allow edge cases to be tested
    
    // Ensure dt is in a realistic range - allow some extreme values but filter true degenerate cases
    let dt = if !input.dt.is_finite() || input.dt == 0.0 {
        0.01 // Default to a reasonable value
    } else if input.dt.abs() < 1e-6 {
        1e-6 * input.dt.signum() // Tiny but non-zero
    } else if input.dt.abs() > 1.0 {
        1.0 * input.dt.signum() // Capped at 1.0
    } else {
        input.dt
    };
    
    // Ensure we have a non-empty, even-length state vector
    let state = if input.state.is_empty() || input.state.len() % 2 != 0 {
        vec![0.0, 0.0, 0.0, 0.0] // Default minimal state
    } else if input.state.len() > 1000 {
        input.state[0..1000].to_vec() // Cap state size
    } else {
        // Replace NaN/Inf with finite values
        let mut state = input.state.clone();
        for v in &mut state {
            if !v.is_finite() {
                *v = 0.0;
            }
        }
        state
    };
    
    // Cap steps to avoid excessive computation
    let steps = input.steps.min(1000);
    
    // Create a simple oscillator system (harmonic oscillator)
    let half_dim = state.len() / 2;
    let force = move |_t: f64, s: &Vec<f64>, d: &mut [f64]| {
        for i in 0..half_dim {
            // Position derivatives = velocities
            d[i] = s[i + half_dim];
            // Velocity derivatives = -position (simple harmonic motion)
            d[i + half_dim] = -s[i];
        }
    };
    
    // Only proceed with valid time steps
    if dt > 0.0 {
        // Create a controller with the given time step
        let mut controller = TrsOde::new(dt, 0.1, force);
        
        // Test a few steps with valid inputs
        let mut t = 0.0;
        let mut s = state.clone();
        
        // Try to integrate - this should not panic
        let _ = controller.integrate(&mut t, &mut s, steps as usize);
        
        // Check that output states are still finite
        for v in &s {
            assert!(v.is_finite(), "Integration produced non-finite state: {:?}", s);
        }
    }
});
