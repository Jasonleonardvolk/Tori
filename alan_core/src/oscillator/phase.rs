//! Phase oscillator implementation for Banksy dynamics
//!
//! This module implements the phase component of the oscillator system,
//! where each oscillator has a phase angle θ and momentum p_θ.

use std::f32::consts::PI;

/// Constants for phase dynamics
const TWO_PI: f32 = 2.0 * PI;

/// Phase-related utility functions
pub struct Phase;

impl Phase {
    /// Normalize angle to [0, 2π)
    #[inline]
    pub fn normalize(theta: f32) -> f32 {
        let mut result = theta % TWO_PI;
        if result < 0.0 {
            result += TWO_PI;
        }
        result
    }
    
    /// Calculate the shortest angular distance between two phases
    #[inline]
    pub fn angle_difference(theta1: f32, theta2: f32) -> f32 {
        let diff = (theta1 - theta2) % TWO_PI;
        if diff > PI {
            diff - TWO_PI
        } else if diff < -PI {
            diff + TWO_PI
        } else {
            diff
        }
    }
    
    /// Calculate phase coupling term sin(θⱼ - θᵢ)
    #[inline]
    pub fn coupling_term(theta_i: f32, theta_j: f32) -> f32 {
        Phase::angle_difference(theta_j, theta_i).sin()
    }
    
    /// Calculate order parameter r = |Σ exp(i θⱼ)| / N
    #[inline]
    pub fn order_parameter(thetas: &[f32]) -> f32 {
        let n = thetas.len() as f32;
        if n < 1.0 {
            return 0.0;
        }
        
        let mut sum_cos = 0.0;
        let mut sum_sin = 0.0;
        
        for &theta in thetas {
            sum_cos += theta.cos();
            sum_sin += theta.sin();
        }
        
        ((sum_cos * sum_cos) + (sum_sin * sum_sin)).sqrt() / n
    }
}

/// Phase state for a network of oscillators
pub struct PhaseState {
    /// Number of oscillators
    pub n: usize,
    
    /// Phase angles [0, 2π)
    pub theta: Vec<f32>,
    
    /// Phase momenta
    pub p_theta: Vec<f32>,
    
    /// Order parameter r ∈ [0,1]
    pub r: f32,
}

impl PhaseState {
    /// Create a new phase state
    pub fn new(n: usize) -> Self {
        Self {
            n,
            theta: vec![0.0; n],
            p_theta: vec![0.0; n],
            r: 0.0,
        }
    }
    
    /// Randomize phases in [0, 2π) with small momenta
    pub fn randomize(&mut self, rng: &mut impl rand::Rng) {
        for i in 0..self.n {
            self.theta[i] = rng.gen::<f32>() * TWO_PI;
            self.p_theta[i] = (rng.gen::<f32>() - 0.5) * 0.01;
        }
        self.update_order_parameter();
    }
    
    /// Update order parameter r
    pub fn update_order_parameter(&mut self) {
        self.r = Phase::order_parameter(&self.theta);
    }
    
    /// Get effective number of synchronized oscillators
    pub fn n_effective(&self) -> f32 {
        self.r * (self.n as f32)
    }
    
    /// Apply momentum to update phases
    pub fn apply_momentum(&mut self, dt: f32) {
        for i in 0..self.n {
            self.theta[i] = Phase::normalize(self.theta[i] + self.p_theta[i] * dt);
        }
    }
    
    /// Update momenta based on coupling matrix
    pub fn update_momenta(&mut self, k_matrix: &[Vec<f32>], dt: f32, damp: f32) {
        // Apply coupling forces to momenta
        for i in 0..self.n {
            let mut force = 0.0;
            
            // Sum coupling terms from all connected oscillators
            for j in 0..self.n {
                if i != j && k_matrix[i][j] != 0.0 {
                    force += k_matrix[i][j] * Phase::coupling_term(self.theta[i], self.theta[j]);
                }
            }
            
            // Update momentum with force and damping
            self.p_theta[i] += force * dt;
            self.p_theta[i] *= (1.0 - damp);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f32::consts::FRAC_PI_2;
    
    #[test]
    fn test_phase_normalization() {
        assert_eq!(Phase::normalize(0.0), 0.0);
        assert_eq!(Phase::normalize(PI), PI);
        assert_eq!(Phase::normalize(TWO_PI), 0.0);
        assert_eq!(Phase::normalize(TWO_PI + PI), PI);
        assert_eq!(Phase::normalize(-PI), PI);
        assert_eq!(Phase::normalize(-TWO_PI), 0.0);
    }
    
    #[test]
    fn test_angle_difference() {
        assert_eq!(Phase::angle_difference(0.0, 0.0), 0.0);
        assert_eq!(Phase::angle_difference(PI, 0.0), PI);
        assert_eq!(Phase::angle_difference(0.0, PI), -PI);
        assert_eq!(Phase::angle_difference(FRAC_PI_2, 0.0), FRAC_PI_2);
        assert_eq!(Phase::angle_difference(TWO_PI - 0.1, 0.1), -0.2);
    }
    
    #[test]
    fn test_order_parameter() {
        // All phases aligned should give r=1
        let aligned = [0.0, 0.0, 0.0, 0.0, 0.0];
        assert!((Phase::order_parameter(&aligned) - 1.0).abs() < 1e-6);
        
        // Phases at 90-degree intervals should give r=0
        let dispersed = [0.0, FRAC_PI_2, PI, 3.0 * FRAC_PI_2];
        assert!(Phase::order_parameter(&dispersed).abs() < 1e-6);
        
        // Phases at 180-degree separation should give r=0
        let opposite = [0.0, PI];
        assert!(Phase::order_parameter(&opposite).abs() < 1e-6);
        
        // Slightly misaligned phases should give r<1
        let slightly_misaligned = [0.0, 0.1, -0.1, 0.05, -0.05];
        let r = Phase::order_parameter(&slightly_misaligned);
        assert!(r < 1.0 && r > 0.9);
    }
}
