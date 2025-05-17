#![no_main]

use libfuzzer_sys::fuzz_target;
use arbitrary::Arbitrary;
use alan_core::controller::trs_ode::{TrsOde, duffing_system, conservative_duffing};

#[derive(Arbitrary, Debug)]
struct FuzzInput {
    dt: f64,
    delta: f64,  // Damping coefficient for Duffing
    gamma: f64,  // Driving amplitude for Duffing
    init_state: [f64; 2],  // Initial [position, velocity]
    steps: u32,  // Number of steps to take forward and then backward
}

/// Fuzz target for time-reversibility (round trip) property
///
/// This target tests that the controller can integrate forward, then backward,
/// and return close to the initial state (low TRS loss).
///
/// It uses a Duffing oscillator with varying parameters and checks that
/// the TRS loss remains below an acceptable threshold.
fuzz_target!(|input: FuzzInput| {
    // Sanitize inputs to reasonable ranges
    
    // Time step
    let dt = if !input.dt.is_finite() || input.dt <= 0.0 || input.dt >= 1.0 {
        0.01 // Default to reasonable value
    } else if input.dt < 1e-6 {
        1e-6 // Minimum threshold
    } else {
        input.dt
    };
    
    // Duffing parameters
    let delta = if !input.delta.is_finite() {
        0.15 // Default damping
    } else {
        input.delta.clamp(-0.5, 0.5) // Limit range
    };
    
    let gamma = if !input.gamma.is_finite() {
        0.3 // Default driving amplitude
    } else {
        input.gamma.clamp(-1.0, 1.0) // Limit range
    };
    
    // Initial state
    let init_state = [
        if input.init_state[0].is_finite() { input.init_state[0].clamp(-10.0, 10.0) } else { 1.0 },
        if input.init_state[1].is_finite() { input.init_state[1].clamp(-10.0, 10.0) } else { 0.0 },
    ];
    
    // Steps capped to avoid excessive computation
    let steps = input.steps.min(1000);
    
    // Create the Duffing oscillator system
    let omega = 1.0; // Fixed frequency
    let duff = duffing_system(delta, gamma, omega);
    
    // Wrap for our Vec<f64> state type
    let force = move |t: f64, s: &Vec<f64>, d: &mut [f64]| {
        duff(t, &s[..], d);
    };
    
    // Create a controller with the time step
    let mut controller = TrsOde::new(dt, 0.1, force);
    
    // Create state vector from init_state
    let state = vec![init_state[0], init_state[1]];
    
    // Check reversibility (forward steps, backward steps, measure loss)
    let loss = match controller.check_reversibility(0.0, &state, steps as usize) {
        Ok(loss) => loss,
        Err(_) => {
            // If it fails, we want to know about it, but don't crash the fuzzer
            // For debugging, lower loss targets will force it to find more edge cases
            assert!(delta.abs() > 0.3 || gamma.abs() > 0.7, 
                    "Reversibility check failed with moderate parameters: dt={}, delta={}, gamma={}, state={:?}",
                    dt, delta, gamma, init_state);
            1.0 // High loss for failure cases
        },
    };
    
    // Check if loss is within acceptable bounds:
    // - For conservative systems (delta=0, gamma=0), should be very low loss
    // - For damped systems, allow higher loss proportional to damping
    
    if delta.abs() < 1e-10 && gamma.abs() < 1e-10 {
        // Conservative system - should have excellent reversibility 
        assert!(loss < 1e-3, "Conservative system had high TRS loss: {}", loss);
    } else {
        // Damped/driven system - allow higher loss proportional to non-conservative forces
        let max_allowed_loss = 0.01 + (delta.abs() + gamma.abs()) * 0.1;
        assert!(loss < max_allowed_loss, 
                "TRS loss {} exceeds threshold {} for dt={}, delta={}, gamma={}",
                loss, max_allowed_loss, dt, delta, gamma);
    }
});
