//! Banksy spin oscillator implementation
//!
//! This module implements the core oscillator dynamics for ALAN,
//! including the Banksy phase model with spin coupling.
//!
//! The implementation is based on the altermagnetic spin dynamics
//! with a reversible update rule that preserves a global Hamiltonian.

mod phase;
mod spin;
mod integ;

// Re-export public items
pub use phase::{Phase, PhaseState};
pub use spin::{Spin, SpinVector};
pub use integ::{Integrator, VerletIntegrator};

use std::fmt;

/// Oscillator state containing both phase and spin components
#[derive(Clone, Debug)]
pub struct OscState {
    /// Number of oscillators in the network
    pub n_oscillators: usize,
    
    /// Phase angles in radians [0, 2π)
    pub theta: Vec<f32>,
    
    /// Phase momenta
    pub p_theta: Vec<f32>,
    
    /// Spin vectors (3D unit vectors)
    pub sigma: Vec<[f32; 3]>,
    
    /// Spin momenta
    pub p_sigma: Vec<[f32; 3]>,
    
    /// Effective coherence measure (N_eff)
    pub n_effective: f32,
}

impl OscState {
    /// Create a new oscillator state with the given number of nodes
    pub fn new(n: usize) -> Self {
        Self {
            n_oscillators: n,
            theta: vec![0.0; n],
            p_theta: vec![0.0; n],
            sigma: vec![[0.0, 0.0, 0.0]; n],
            p_sigma: vec![[0.0, 0.0, 0.0]; n],
            n_effective: 0.0,
        }
    }
    
    /// Randomize the oscillator state
    pub fn randomize(&mut self, rng: &mut impl rand::Rng) {
        use std::f32::consts::PI;
        
        for i in 0..self.n_oscillators {
            // Random phase in [0, 2π)
            self.theta[i] = rng.gen::<f32>() * 2.0 * PI;
            
            // Small random momentum
            self.p_theta[i] = (rng.gen::<f32>() - 0.5) * 0.01;
            
            // Random unit vector for spin
            let x = rng.gen::<f32>() * 2.0 - 1.0;
            let y = rng.gen::<f32>() * 2.0 - 1.0;
            let z = rng.gen::<f32>() * 2.0 - 1.0;
            
            // Normalize
            let norm = (x*x + y*y + z*z).sqrt();
            if norm > 1e-6 {
                self.sigma[i] = [x/norm, y/norm, z/norm];
            } else {
                self.sigma[i] = [0.0, 0.0, 1.0]; // Default to z-axis if normalization fails
            }
            
            // Small random momentum for spin
            self.p_sigma[i] = [
                (rng.gen::<f32>() - 0.5) * 0.01,
                (rng.gen::<f32>() - 0.5) * 0.01,
                (rng.gen::<f32>() - 0.5) * 0.01,
            ];
        }
        
        // Initialize coherence to 0
        self.n_effective = 0.0;
    }
    
    /// Update N_effective (phase coherence measure)
    pub fn update_n_effective(&mut self) {
        // Compute order parameter: r = |Σ exp(i θⱼ)| / N
        let mut sum_cos = 0.0;
        let mut sum_sin = 0.0;
        
        for &theta in &self.theta {
            sum_cos += theta.cos();
            sum_sin += theta.sin();
        }
        
        let n = self.n_oscillators as f32;
        let r = ((sum_cos * sum_cos) + (sum_sin * sum_sin)).sqrt() / n;
        
        // N_eff is the effective number of synchronized oscillators
        self.n_effective = r * n;
    }
}

impl fmt::Display for OscState {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "OscState{{ n={}, N_eff={:.2} }}", 
            self.n_oscillators, self.n_effective)
    }
}

/// Oscillator network with Banksy-spin dynamics
pub struct Oscillator {
    /// Coupling matrix between oscillators
    pub k_matrix: Vec<Vec<f32>>,
    
    /// Phase-to-spin coupling strength
    pub gamma: f32,
    
    /// Spin alignment rate
    pub epsilon: f32,
    
    /// Damping coefficient
    pub eta_damp: f32,
    
    /// Timesteps for phase and spin integration
    pub dt_phase: f32,
    pub dt_spin: f32,
    
    /// Phase integrator
    integrator: Box<dyn Integrator>,
}

impl Oscillator {
    /// Create a new oscillator network
    pub fn new(n: usize) -> Self {
        // Default parameters
        Self {
            k_matrix: vec![vec![0.0; n]; n],
            gamma: 0.1,
            epsilon: 0.05,
            eta_damp: 1e-4,
            dt_phase: 0.01,
            dt_spin: 0.00125,
            integrator: Box::new(VerletIntegrator::new()),
        }
    }
    
    /// Set coupling matrix
    pub fn set_coupling(&mut self, k: Vec<Vec<f32>>) -> Result<(), &'static str> {
        // Validate matrix dimensions
        let n = self.k_matrix.len();
        if k.len() != n {
            return Err("Coupling matrix row count mismatch");
        }
        
        for row in &k {
            if row.len() != n {
                return Err("Coupling matrix column count mismatch");
            }
        }
        
        self.k_matrix = k;
        Ok(())
    }
    
    /// Single step update using Banksy-spin dynamics
    pub fn step(&mut self, state: &mut OscState, n_spin: u8) -> Result<(), &'static str> {
        if state.n_oscillators != self.k_matrix.len() {
            return Err("State size doesn't match coupling matrix");
        }
        
        // First, update phase using the integrator
        self.integrator.integrate_phase(state, &self.k_matrix, self.dt_phase, self.eta_damp);
        
        // Then, update spin alignment n_spin times with smaller dt
        for _ in 0..n_spin {
            self.integrator.integrate_spin(state, &self.k_matrix, self.dt_spin, self.gamma, self.epsilon);
        }
        
        // Update the coherence measure
        state.update_n_effective();
        
        Ok(())
    }
    
    /// Run simulation for multiple steps
    pub fn run(&mut self, state: &mut OscState, steps: usize, n_spin: u8) -> Result<(), &'static str> {
        for _ in 0..steps {
            self.step(state, n_spin)?;
        }
        Ok(())
    }
    
    /// Get the expected number of effective synchronized oscillators
    pub fn expected_n_effective(&self) -> f32 {
        // Simple approximation based on coupling strength
        let n = self.k_matrix.len();
        if n == 0 {
            return 0.0;
        }
        
        // Calculate mean coupling strength
        let mut sum_k = 0.0;
        let mut count = 0;
        for i in 0..n {
            for j in 0..n {
                if i != j {
                    sum_k += self.k_matrix[i][j].abs();
                    count += 1;
                }
            }
        }
        
        let mean_k = if count > 0 { sum_k / count as f32 } else { 0.0 };
        
        // Estimate N_eff based on coupling
        let n_f = n as f32;
        let r_est = (1.0 - (-10.0 * mean_k).exp()) * 0.95; // Saturates at ~0.95
        r_est * n_f
    }
}
