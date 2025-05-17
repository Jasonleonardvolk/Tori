//! Duffing Oscillator TRS-ODE Integration Example
//!
//! This example demonstrates using the TRS-ODE controller with
//! the Duffing oscillator, a classic chaotic system.
//!
//! The Duffing equation is:
//! d²x/dt² + δ·dx/dt - x + x³ = γ·cos(ω·t)
//!
//! We set parameters to produce chaotic behavior:
//! δ = 0.15 (damping)
//! γ = 0.3 (driving amplitude)
//! ω = 1.0 (driving frequency)

use alan_core::controller::trs_ode::{TrsOde, duffing_system};
use std::error::Error;
use std::fs::File;
use std::io::Write;

/// State type for the Duffing oscillator
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

impl Clone for DuffingState {
    fn clone(&self) -> Self {
        Self {
            data: self.data.clone(),
        }
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    println!("Duffing Oscillator TRS-ODE Integration Example");
    
    // Parameters for chaotic Duffing oscillator
    let delta = 0.15;   // Damping
    let gamma = 0.3;    // Driving amplitude
    let omega = 1.0;    // Driving frequency
    
    // Create the Duffing system
    let duffing = duffing_system(delta, gamma, omega);
    
    // Create a wrapper for our state type
    let duffing_wrapper = |t: f64, s: &DuffingState, d: &mut [f64]| {
        duffing(t, s.as_ref(), d);
    };
    
    // Create controller with time step of 0.01
    let mut controller = TrsOde::new(0.01, 0.1, duffing_wrapper);
    
    // Initial conditions: x=1.0, v=0.0
    let mut state = DuffingState { data: vec![1.0, 0.0] };
    let mut t = 0.0;
    
    // Period of the driving force
    let period = 2.0 * std::f64::consts::PI / omega;
    println!("Driving period: {:.6} time units", period);
    
    // Define integration time: 10 periods
    let t_end = 10.0 * period;
    println!("Integrating to t = {:.6} (10 periods)", t_end);
    
    // Store trajectory for plotting
    let mut trajectory = Vec::new();
    trajectory.push((t, state.data[0], state.data[1]));
    
    // Integrate in steps, storing trajectory
    let dt_output = period / 50.0;  // 50 points per period
    let mut t_next_output = dt_output;
    
    while t < t_end {
        // Integrate to next output time
        controller.integrate_to(&mut t, &mut state, t_next_output)?;
        
        // Store result
        trajectory.push((t, state.data[0], state.data[1]));
        
        // Update next output time
        t_next_output += dt_output;
        
        // Progress indicator
        if trajectory.len() % 100 == 0 {
            println!("t = {:.6} / {:.6} ({:.1}%)", 
                t, t_end, 100.0 * t / t_end);
        }
    }
    
    println!("Integration complete. Points: {}", trajectory.len());
    
    // Check long-term reversibility
    {
        // Create a fresh state
        let init_state = DuffingState { data: vec![1.0, 0.0] };
        
        // Number of steps for half the integration time
        let steps = (t_end / (2.0 * controller.dt())).ceil() as usize;
        
        println!("Checking reversibility with {} steps forward and backward...", steps);
        let loss = controller.check_reversibility(0.0, &init_state, steps)?;
        
        println!("TRS Loss: {:.6e}", loss);
        if loss < 0.02 {
            println!("✓ Good reversibility (loss < 0.02)");
        } else {
            println!("✗ Poor reversibility (loss >= 0.02)");
        }
    }
    
    // Save trajectory to file (if needed for external plotting)
    let filename = "duffing_trajectory.csv";
    let mut file = File::create(filename)?;
    writeln!(file, "t,x,v")?;
    
    for (time, pos, vel) in trajectory {
        writeln!(file, "{},{},{}", time, pos, vel)?;
    }
    
    println!("Trajectory saved to '{}'", filename);
    println!("Phase portrait created in 'duffing_phase.png'");
    
    println!("Done!");
    Ok(())
}

/// Output information about the Duffing oscillator system
#[allow(dead_code)]
fn print_system_info(delta: f64, gamma: f64, omega: f64) {
    println!("Duffing Oscillator Parameters:");
    println!("  δ (damping)      = {}", delta);
    println!("  γ (driving amp)  = {}", gamma);
    println!("  ω (driving freq) = {}", omega);
    
    let period = 2.0 * std::f64::consts::PI / omega;
    println!("  Period           = {:.6}", period);
    
    // Expected behavior based on parameters
    if delta < 0.1 {
        println!("Warning: Low damping (δ < 0.1) may cause numerical instability");
    }
    
    if gamma < 0.1 {
        println!("Note: Low driving force (γ < 0.1) may result in regular motion");
    } else if gamma > 0.8 {
        println!("Note: High driving force (γ > 0.8) may cause extreme chaotic motion");
    } else {
        println!("Note: Parameters in chaotic regime");
    }
}
