//! Integrators for Banksy-spin oscillator dynamics
//!
//! This module implements time integration methods for the ODE system
//! that governs the Banksy-spin oscillator network dynamics.
//!
//! The primary integrator is a symplectic Verlet method which preserves
//! the Hamiltonian structure of the dynamics for time-reversible operation.

use crate::oscillator::{OscState, Phase, Spin, SpinVector};

/// Trait for oscillator system integrators
pub trait Integrator {
    /// Integrate phase dynamics for a single timestep
    fn integrate_phase(&self, state: &mut OscState, k_matrix: &[Vec<f32>], dt: f32, damp: f32);
    
    /// Integrate spin dynamics for a single timestep
    fn integrate_spin(
        &self, 
        state: &mut OscState, 
        k_matrix: &[Vec<f32>], 
        dt: f32, 
        gamma: f32, 
        epsilon: f32
    );
}

/// Verlet symplectic integrator implementation
///
/// This integrator uses the velocity Verlet method which is symplectic (preserves
/// phase space volume) and second-order accurate. This property is essential
/// for time-reversal symmetry in the TRS controller.
pub struct VerletIntegrator;

impl VerletIntegrator {
    /// Create a new Verlet integrator
    pub fn new() -> Self {
        Self
    }
    
    /// Apply momentum to update phases
    fn apply_phase_momentum(&self, state: &mut OscState, dt: f32) {
        for i in 0..state.n_oscillators {
            // Update θ using p_θ
            state.theta[i] += state.p_theta[i] * dt;
            
            // Normalize to [0, 2π)
            while state.theta[i] >= std::f32::consts::TAU {
                state.theta[i] -= std::f32::consts::TAU;
            }
            while state.theta[i] < 0.0 {
                state.theta[i] += std::f32::consts::TAU;
            }
        }
    }
    
    /// Calculate phase coupling forces
    fn calculate_phase_forces(&self, state: &OscState, k_matrix: &[Vec<f32>]) -> Vec<f32> {
        let n = state.n_oscillators;
        let mut forces = vec![0.0; n];
        
        for i in 0..n {
            for j in 0..n {
                if i != j && k_matrix[i][j] != 0.0 {
                    // Force term: K_ij * sin(θ_j - θ_i)
                    let diff = state.theta[j] - state.theta[i];
                    let sin_diff = diff.sin();
                    forces[i] += k_matrix[i][j] * sin_diff;
                }
            }
        }
        
        forces
    }
    
    /// Apply spin-lattice coupling (phase affects spin)
    fn apply_spin_lattice_coupling(
        &self, 
        state: &mut OscState, 
        dt: f32, 
        gamma: f32
    ) {
        // For each oscillator
        for i in 0..state.n_oscillators {
            // Calculate mean spin
            let mut mean_sigma = [0.0, 0.0, 0.0];
            let mut count = 0;
            
            for j in 0..state.n_oscillators {
                if i != j {
                    // Add neighboring spin
                    mean_sigma[0] += state.sigma[j][0];
                    mean_sigma[1] += state.sigma[j][1];
                    mean_sigma[2] += state.sigma[j][2];
                    count += 1;
                }
            }
            
            // Normalize mean spin
            if count > 0 {
                let norm_sq = mean_sigma[0] * mean_sigma[0] + 
                              mean_sigma[1] * mean_sigma[1] + 
                              mean_sigma[2] * mean_sigma[2];
                
                if norm_sq > 1e-10 {
                    let norm = norm_sq.sqrt();
                    mean_sigma[0] /= norm;
                    mean_sigma[1] /= norm;
                    mean_sigma[2] /= norm;
                    
                    // Apply phase-spin coupling: p_θ += γ * (σ - σ̄)
                    // First compute the deviation from mean
                    let deviation = [
                        state.sigma[i][0] - mean_sigma[0],
                        state.sigma[i][1] - mean_sigma[1],
                        state.sigma[i][2] - mean_sigma[2],
                    ];
                    
                    // Calculate magnitude of deviation
                    let dev_mag = (deviation[0] * deviation[0] + 
                                  deviation[1] * deviation[1] + 
                                  deviation[2] * deviation[2]).sqrt();
                    
                    // Update phase momentum
                    state.p_theta[i] += gamma * dev_mag * dt;
                }
            }
        }
    }
    
    /// Update spins based on phase alignment (Hebbian learning)
    fn update_spin_alignment(
        &self, 
        state: &mut OscState, 
        k_matrix: &[Vec<f32>], 
        dt: f32, 
        epsilon: f32
    ) {
        let n = state.n_oscillators;
        let mut spin_updates = vec![[0.0, 0.0, 0.0]; n];
        
        // For each oscillator
        for i in 0..n {
            // For each connected neighbor
            for j in 0..n {
                if i != j && k_matrix[i][j] != 0.0 {
                    // Check phase alignment window (cos(θᵢ - θⱼ))
                    let phase_diff = state.theta[i] - state.theta[j];
                    let phase_alignment = phase_diff.cos();
                    
                    // Only align spins if phases are close enough
                    if phase_alignment > 0.5 {
                        // Scaled influence based on phase alignment
                        let influence = phase_alignment * epsilon * dt;
                        
                        // Calculate spin alignment contribution
                        spin_updates[i][0] += influence * state.sigma[j][0];
                        spin_updates[i][1] += influence * state.sigma[j][1];
                        spin_updates[i][2] += influence * state.sigma[j][2];
                    }
                }
            }
        }
        
        // Apply spin updates
        for i in 0..n {
            // Apply update
            let new_spin = [
                state.sigma[i][0] + spin_updates[i][0],
                state.sigma[i][1] + spin_updates[i][1],
                state.sigma[i][2] + spin_updates[i][2],
            ];
            
            // Normalize the updated spin
            let norm_sq = new_spin[0] * new_spin[0] + 
                          new_spin[1] * new_spin[1] + 
                          new_spin[2] * new_spin[2];
            
            if norm_sq > 1e-10 {
                let norm = norm_sq.sqrt();
                state.sigma[i][0] = new_spin[0] / norm;
                state.sigma[i][1] = new_spin[1] / norm;
                state.sigma[i][2] = new_spin[2] / norm;
            }
        }
    }
}

impl Integrator for VerletIntegrator {
    fn integrate_phase(&self, state: &mut OscState, k_matrix: &[Vec<f32>], dt: f32, damp: f32) {
        // Velocity Verlet integrator for phase dynamics
        
        // 1. Half-step update of momenta
        let forces = self.calculate_phase_forces(state, k_matrix);
        for i in 0..state.n_oscillators {
            state.p_theta[i] += 0.5 * forces[i] * dt;
        }
        
        // 2. Full-step update of positions
        self.apply_phase_momentum(state, dt);
        
        // 3. Recalculate forces at new positions
        let forces = self.calculate_phase_forces(state, k_matrix);
        
        // 4. Half-step update of momenta
        for i in 0..state.n_oscillators {
            state.p_theta[i] += 0.5 * forces[i] * dt;
            
            // Apply damping
            state.p_theta[i] *= (1.0 - damp);
        }
        
        // Apply spin-lattice coupling (feedback from spin to phase)
        // This is part of the Banksy-spin coupling mechanism
        // Not included in basic Verlet integration
    }
    
    fn integrate_spin(
        &self, 
        state: &mut OscState, 
        k_matrix: &[Vec<f32>], 
        dt: f32, 
        gamma: f32, 
        epsilon: f32
    ) {
        // First, apply phase-to-spin coupling (spin-lattice term)
        self.apply_spin_lattice_coupling(state, dt, gamma);
        
        // Then, update spins based on phase alignment (Hebbian)
        self.update_spin_alignment(state, k_matrix, dt, epsilon);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f32::consts::{PI, FRAC_PI_2};
    
    // Helper to create a simple state
    fn create_test_state(n: usize) -> OscState {
        let mut state = OscState {
            n_oscillators: n,
            theta: vec![0.0; n],
            p_theta: vec![0.0; n],
            sigma: vec![[0.0, 0.0, 1.0]; n],
            p_sigma: vec![[0.0, 0.0, 0.0]; n],
            n_effective: 0.0,
        };
        
        // Set up some initial phases
        for i in 0..n {
            state.theta[i] = (i as f32) * FRAC_PI_2;
        }
        
        state
    }
    
    // Helper to create a simple coupling matrix
    fn create_test_coupling(n: usize) -> Vec<Vec<f32>> {
        let mut k = vec![vec![0.0; n]; n];
        
        // Ring coupling
        for i in 0..n {
            let next = (i + 1) % n;
            let prev = (i + n - 1) % n;
            k[i][next] = 0.1;
            k[i][prev] = 0.1;
        }
        
        k
    }
    
    #[test]
    fn test_verlet_integrator_creation() {
        let integrator = VerletIntegrator::new();
        
        // Just making sure creation doesn't panic
        assert!(true);
    }
    
    #[test]
    fn test_phase_integration() {
        let integrator = VerletIntegrator::new();
        let mut state = create_test_state(4);
        let k_matrix = create_test_coupling(4);
        
        // Initial phases: [0, π/2, π, 3π/2]
        // With ring coupling, this should cause each oscillator to start moving
        
        // Integrate for one step
        integrator.integrate_phase(&mut state, &k_matrix, 0.01, 0.0);
        
        // Verify momenta were updated
        for p in &state.p_theta {
            assert!(*p != 0.0);
        }
        
        // Integrate for more steps to ensure stability
        for _ in 0..100 {
            integrator.integrate_phase(&mut state, &k_matrix, 0.01, 1e-4);
        }
        
        // After many steps with small damping, should start converging
        // to a synchronized state
        state.update_n_effective();
        assert!(state.n_effective > 0.5); // Some level of synchronization
    }
    
    #[test]
    fn test_spin_integration() {
        let integrator = VerletIntegrator::new();
        let mut state = create_test_state(4);
        let k_matrix = create_test_coupling(4);
        
        // Set up some initial spins
        state.sigma[0] = [1.0, 0.0, 0.0];
        state.sigma[1] = [0.0, 1.0, 0.0];
        state.sigma[2] = [0.0, 0.0, 1.0];
        state.sigma[3] = [1.0, 1.0, 0.0]; // Will be normalized
        
        // Adjust phases to be more aligned (for Hebbian coupling)
        state.theta = vec![0.0, 0.1, 0.2, 0.1];
        
        // Integrate spin dynamics
        for _ in 0..100 {
            integrator.integrate_spin(&mut state, &k_matrix, 0.01, 0.1, 0.1);
        }
        
        // Check that spins are still normalized
        for i in 0..state.n_oscillators {
            let norm_sq = state.sigma[i][0] * state.sigma[i][0] +
                         state.sigma[i][1] * state.sigma[i][1] +
                         state.sigma[i][2] * state.sigma[i][2];
            assert!((norm_sq - 1.0).abs() < 1e-6);
        }
    }
}
