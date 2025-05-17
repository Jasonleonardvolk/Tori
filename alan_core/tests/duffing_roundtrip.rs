//! Integration test for TRS-ODE controller with Duffing oscillator
//!
//! This test validates the time-reversal symmetry of the TRS-ODE controller
//! when applied to the Duffing oscillator system. It ensures the TRS loss
//! remains below the target threshold of 1e-2 when integrating forward and
//! backward in time.

use alan_core::controller::trs_ode::{TrsOde, duffing_system};

/// State type for the Duffing oscillator
#[derive(Clone)]
struct DuffingState {
    /// State vector: [position, velocity]
    data: Vec<f64>,
}

impl AsRef<[f64]> for DuffingState {
    fn as_ref(&self) -> &[f64] {
        &self.data
    }
}

impl AsMut<[f64]> for DuffingState {
    fn as_mut(&mut self) -> &mut [f64] {
        &mut self.data
    }
}

/// Test that the Duffing system has good reversibility properties
#[test]
fn test_duffing_roundtrip() {
    // Standard parameters for chaotic Duffing oscillator
    let delta = 0.15;   // Damping
    let gamma = 0.3;    // Driving amplitude
    let omega = 1.0;    // Driving frequency
    
    // Create the Duffing system
    let duffing = duffing_system(delta, gamma, omega);
    
    // Create a wrapper for our state type
    let duffing_wrapper = |t: f64, s: &DuffingState, d: &mut [f64]| {
        duffing(t, s.as_ref(), d);
    };
    
    // Create controller with very small time step for accuracy
    let mut controller = TrsOde::new(0.005, 0.1, duffing_wrapper);
    
    // Initial conditions
    let init_state = DuffingState { data: vec![1.0, 0.0] };
    
    // Integrate for varying numbers of steps to check stability
    for &steps in &[100, 200, 500] {
        let loss = controller.check_reversibility(0.0, &init_state, steps).unwrap();
        println!("Steps: {}, TRS Loss: {:.6e}", steps, loss);
        
        // Check that loss is below threshold
        assert!(loss < 1e-2, "TRS loss ({:.6e}) exceeds threshold (1e-2) for {} steps", loss, steps);
    }
    
    // Test over longer time (10 periods)
    let period = 2.0 * std::f64::consts::PI / omega;
    let long_steps = (10.0 * period / controller.dt()).ceil() as usize;
    
    // We need to limit the number of steps to avoid making the test too slow
    let test_steps = long_steps.min(1000);
    
    let loss = controller.check_reversibility(0.0, &init_state, test_steps).unwrap();
    println!("Long test - Steps: {}, TRS Loss: {:.6e}", test_steps, loss);
    
    // For long integrations, the tolerance is relaxed due to accumulation of error
    assert!(loss < 1e-2, "Long-term TRS loss ({:.6e}) exceeds threshold (1e-2)", loss);
}

/// Test that changing parameters affects reversibility as expected
#[test]
fn test_parameter_sensitivity() {
    // Create a function to measure reversibility for given parameters
    let measure_reversibility = |delta: f64, dt: f64, steps: usize| -> f64 {
        let gamma = 0.3;
        let omega = 1.0;
        
        let duffing = duffing_system(delta, gamma, omega);
        let duffing_wrapper = |t: f64, s: &DuffingState, d: &mut [f64]| {
            duffing(t, s.as_ref(), d);
        };
        
        let mut controller = TrsOde::new(dt, 0.1, duffing_wrapper);
        let init_state = DuffingState { data: vec![1.0, 0.0] };
        
        controller.check_reversibility(0.0, &init_state, steps).unwrap()
    };
    
    // Baseline with standard parameters
    let baseline_loss = measure_reversibility(0.15, 0.01, 200);
    println!("Baseline loss: {:.6e}", baseline_loss);
    
    // Increasing damping should worsen reversibility
    let high_damping_loss = measure_reversibility(0.3, 0.01, 200);
    println!("High damping loss: {:.6e}", high_damping_loss);
    assert!(high_damping_loss > baseline_loss, 
            "Higher damping should increase TRS loss");
    
    // Decreasing time step should improve reversibility
    let small_dt_loss = measure_reversibility(0.15, 0.005, 400); // same time span
    println!("Small dt loss: {:.6e}", small_dt_loss);
    assert!(small_dt_loss < baseline_loss, 
            "Smaller time step should decrease TRS loss");
    
    // Even with smaller time steps, all should be within tolerance
    assert!(high_damping_loss < 1e-2, 
            "Even with higher damping, loss should be < 1e-2");
}

/// Test the system conserves energy for the undamped case
#[test]
fn test_energy_conservation() {
    // Create an undamped Duffing oscillator (delta = 0, gamma = 0)
    // This becomes a conservative system that should preserve energy
    let delta = 0.0;
    let gamma = 0.0;
    let omega = 1.0;
    
    let duffing = duffing_system(delta, gamma, omega);
    let duffing_wrapper = |t: f64, s: &DuffingState, d: &mut [f64]| {
        duffing(t, s.as_ref(), d);
    };
    
    let mut controller = TrsOde::new(0.01, 0.1, duffing_wrapper);
    
    // Initial state
    let mut state = DuffingState { data: vec![1.0, 0.0] };
    let mut t = 0.0;
    
    // Calculate initial energy
    // Energy = 0.5 * v² + 0.5 * (-x² + 0.5*x⁴)
    let calc_energy = |s: &DuffingState| -> f64 {
        let x = s.data[0];
        let v = s.data[1];
        0.5 * v * v + 0.5 * (-x * x + 0.5 * x * x * x * x)
    };
    
    let initial_energy = calc_energy(&state);
    
    // Integrate for 1000 steps
    controller.integrate(&mut t, &mut state, 1000).unwrap();
    
    // Calculate final energy
    let final_energy = calc_energy(&state);
    
    // Check energy conservation (allow small numerical drift)
    let rel_error = (final_energy - initial_energy).abs() / initial_energy.abs();
    println!("Energy relative error: {:.6e}", rel_error);
    
    assert!(rel_error < 1e-4, "Energy should be conserved for undamped system");
    
    // Also check that reversibility is excellent for conservative system
    let init_state = DuffingState { data: vec![1.0, 0.0] };
    let loss = controller.check_reversibility(0.0, &init_state, 1000).unwrap();
    println!("Conservative system TRS loss: {:.6e}", loss);
    
    assert!(loss < 1e-6, "Conservative system should have excellent reversibility");
}
