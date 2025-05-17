#![cfg(feature = "y4")]

use alan_core::controller::trs_ode::{TrsOde, TrsParameters, IntegrationMethod, duffing_system};

/// Tests that the Yoshida 4th-order integrator has superior precision compared to
/// the 2nd-order Velocity Verlet method at the same time step.
///
/// This test verifies that the error in a round-trip integration
/// (forward then backward) is significantly smaller with Yoshida4 than with
/// Velocity Verlet, at least by a factor of 10.
#[test]
fn yoshida4_duffing_precision() {
    // Standard Duffing oscillator parameters
    let delta = 0.15;
    let gamma = 0.3;
    let omega = 1.0;
    let dt = 0.01;
    
    // Initial state for Duffing oscillator: [position, velocity]
    let init_state = vec![1.0, 0.0];
    
    // Create the Duffing system
    let duffing = duffing_system(delta, gamma, omega);
    
    // Wrap for Vec<f64> state type
    let force = move |t: f64, s: &Vec<f64>, d: &mut [f64]| {
        duffing(t, &s[..], d);
    };
    
    // Number of steps for test (long enough to see differences)
    let steps = 1000;
    
    // Create Velocity Verlet controller
    let mut vv_controller = TrsOde::new(dt, 0.1, force.clone());
    
    // Create Yoshida4 controller with same parameters except for method
    let y4_params = TrsParameters {
        dt,
        lambda_trs: 0.1,
        method: IntegrationMethod::Yoshida4,
        max_iterations: 100,
        tolerance: 1e-6,
    };
    let mut y4_controller = TrsOde::with_params(y4_params, force);
    
    // Measure VV round-trip error
    let vv_loss = vv_controller.check_reversibility(0.0, &init_state.clone(), steps)
        .unwrap_or_else(|_| panic!("Velocity Verlet integration failed"));
    
    println!("Velocity Verlet TRS loss: {:.10e}", vv_loss);
    
    // Measure Yoshida4 round-trip error
    let y4_loss = y4_controller.check_reversibility(0.0, &init_state, steps)
        .unwrap_or_else(|_| panic!("Yoshida4 integration failed"));
    
    println!("Yoshida4 TRS loss: {:.10e}", y4_loss);
    println!("Ratio (VV/Y4): {:.2}", vv_loss / y4_loss);
    
    // Verify Yoshida4 error is less than Velocity Verlet by at least factor of 10
    assert!(y4_loss < vv_loss / 10.0, 
            "Yoshida4 error ({:.10e}) should be at least 10x better than VV ({:.10e})",
            y4_loss, vv_loss);
    
    // Also verify absolute error is acceptable
    assert!(y4_loss < 1e-3, 
            "Yoshida4 TRS loss ({:.10e}) exceeds threshold (1e-3)",
            y4_loss);
}
