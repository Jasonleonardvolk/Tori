//! Time-Reversal-Symmetric ODE controller implementation
//!
//! This module implements a time-reversal-symmetric (TRS) controller
//! for reversible dynamical systems. It uses symplectic integration methods
//! to preserve phase space volume and enable high-quality time reversal.
//!
//! The implementation is based on the velocity Verlet method by default, with
//! an optional 4th-order Yoshida integrator available as a compile-time feature.

use std::marker::PhantomData;
use std::fmt;

/// Symplectic integration method to use
pub enum IntegrationMethod {
    /// Second-order velocity Verlet method
    VelocityVerlet,
    /// Fourth-order Yoshida method (when enabled)
    #[cfg(feature = "yoshida4")]
    Yoshida4,
}

/// Errors that can occur during TRS operations
#[derive(Debug)]
pub enum TrsError {
    /// Integration failed due to numerical instability
    NumericalInstability,
    /// State dimension mismatch
    DimensionMismatch,
    /// Invalid parameter value
    InvalidParameter(String),
}

impl fmt::Display for TrsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TrsError::NumericalInstability => 
                write!(f, "Integration failed due to numerical instability"),
            TrsError::DimensionMismatch => 
                write!(f, "State dimension mismatch"),
            TrsError::InvalidParameter(msg) => 
                write!(f, "Invalid parameter: {}", msg),
        }
    }
}

/// Additional parameters for the TRS controller
#[derive(Clone, Debug)]
pub struct TrsParameters {
    /// Time step size
    pub dt: f64,
    /// Weight on TRS loss term
    pub lambda_trs: f64,
    /// Integration method to use
    pub method: IntegrationMethod,
    /// Maximum iterations for convergence
    pub max_iterations: usize,
    /// Convergence tolerance
    pub tolerance: f64,
}

impl Default for TrsParameters {
    fn default() -> Self {
        Self {
            dt: 0.01,
            lambda_trs: 0.1,
            method: IntegrationMethod::VelocityVerlet,
            max_iterations: 100,
            tolerance: 1e-6,
        }
    }
}

/// Statistics for TRS controller performance
#[derive(Clone, Debug, Default)]
pub struct TrsStats {
    /// Last measured TRS loss value (when check_reversibility was called)
    pub trs_loss: f64,
    /// Current time step size
    pub last_dt: f64,
    /// Total number of steps taken
    pub steps: u64,
    /// Accumulated integration time
    pub total_time: f64,
    /// Maximum absolute position error observed
    pub max_position_error: f64,
    /// Maximum absolute momentum error observed
    pub max_momentum_error: f64,
}

/// Generic reversible ODE controller.
///
/// * `S` – state vector type implementing `AsMut<[f64]>`
/// * `F` – force/velocity callback: (t, &S, &mut dSdt)
#[derive(Clone)]
pub struct TrsOde<S, F> {
    /// Parameters for the controller
    params: TrsParameters,
    /// Function that computes the dynamics/force
    force: F,
    /// Previous state for momentum computation
    prev_state: Option<S>,
    /// State dimensions (used for temporary storage)
    state_dim: usize,
    /// Statistics about controller performance
    stats: TrsStats,
    /// Type marker
    _marker: PhantomData<S>,
}

// Implement Send + Sync for thread-safety
unsafe impl<S, F> Send for TrsOde<S, F> 
where 
    S: Send,
    F: Send,
{}

unsafe impl<S, F> Sync for TrsOde<S, F> 
where 
    S: Sync,
    F: Sync,
{}

impl<S, F> TrsOde<S, F>
where
    S: Clone + AsMut<[f64]> + AsRef<[f64]>,
    F: Fn(f64, &S, &mut [f64]),          // defines the dynamics
{
    /// Create a new TRS-ODE controller
    ///
    /// # Arguments
    ///
    /// * `dt` - Time step size
    /// * `lambda_trs` - Weight on TRS loss term (higher = stronger constraint)
    /// * `force` - Function that computes the dynamics: (t, state, derivative)
    ///
    /// # Returns
    ///
    /// A new TRS-ODE controller
    pub fn new(dt: f64, lambda_trs: f64, force: F) -> Self {
        let params = TrsParameters {
            dt,
            lambda_trs,
            ..Default::default()
        };
        Self::with_params(params, force)
    }
    
    /// Create a new TRS-ODE controller with custom parameters
    ///
    /// # Arguments
    ///
    /// * `params` - Parameters for the controller
    /// * `force` - Function that computes the dynamics: (t, state, derivative)
    ///
    /// # Returns
    ///
    /// A new TRS-ODE controller
    pub fn with_params(params: TrsParameters, force: F) -> Self {
        Self {
            params,
            force,
            prev_state: None,
            state_dim: 0,
            stats: TrsStats::default(),
            _marker: PhantomData,
        }
    }
    
    /// Get the time step size
    pub fn dt(&self) -> f64 {
        self.params.dt
    }
    
    /// Set the time step size
    pub fn set_dt(&mut self, dt: f64) -> Result<(), TrsError> {
        if !dt.is_finite() || dt <= 0.0 || dt >= 1.0 {
            return Err(TrsError::InvalidParameter(
                "dt must be finite, positive, and less than 1.0".to_string()));
        }
        self.params.dt = dt;
        self.stats.last_dt = dt;
        Ok(())
    }
    
    /// Get the TRS loss weight
    pub fn lambda_trs(&self) -> f64 {
        self.params.lambda_trs
    }
    
    /// Set the TRS loss weight
    pub fn set_lambda_trs(&mut self, lambda_trs: f64) -> Result<(), TrsError> {
        if lambda_trs < 0.0 {
            return Err(TrsError::InvalidParameter("lambda_trs must be non-negative".to_string()));
        }
        self.params.lambda_trs = lambda_trs;
        Ok(())
    }
    
    /// Initialize the controller with a state
    ///
    /// This sets the state dimension and prepares for integration
    pub fn initialize(&mut self, state: &S) {
        self.state_dim = state.as_ref().len();
        self.prev_state = None;
        self.stats = TrsStats {
            last_dt: self.params.dt,
            ..Default::default()
        };
    }
    
    /// Calculate the derivative of the state
    fn calculate_derivative(&self, t: f64, state: &S, derivative: &mut [f64]) {
        (self.force)(t, state, derivative);
    }
    
    /// Perform a single symplectic integration step using velocity Verlet
    ///
    /// # Arguments
    ///
    /// * `t` - Current time (will be updated)
    /// * `state` - Current state (will be updated)
    ///
    /// # Returns
    ///
    /// Result indicating success or error
    pub fn step_symplectic(&mut self, t: &mut f64, state: &mut S) -> Result<(), TrsError> {
        // Validate dt is in sane range for floating point precision
        let dt = self.params.dt;
        if !dt.is_finite() || dt <= 0.0 || dt >= 1.0 {
            return Err(TrsError::InvalidParameter(
                "dt must be finite, positive, and less than 1.0".to_string()));
        }
        
        let result = match self.params.method {
            IntegrationMethod::VelocityVerlet => self.step_velocity_verlet(t, state),
            #[cfg(feature = "yoshida4")]
            IntegrationMethod::Yoshida4 => self.step_yoshida4(t, state),
        };
        
        // Update stats on successful step
        if result.is_ok() {
            self.stats.steps += 1;
            self.stats.last_dt = dt;
            self.stats.total_time += dt;
        }
        
        result
    }
    
    /// Perform a single velocity Verlet integration step
    ///
    /// This is a symplectic integrator that preserves phase space volume
    /// and is time-reversible, making it ideal for TRS systems.
    fn step_velocity_verlet(&mut self, t: &mut f64, state: &mut S) -> Result<(), TrsError> {
        let dt = self.params.dt;
        let dim = state.as_ref().len();
        
        // Create temporary storage
        let mut derivative = vec![0.0; dim];
        let mut half_step = vec![0.0; dim];
        
        // Initialize state buffer if first step
        if self.prev_state.is_none() {
            self.prev_state = Some(state.clone());
        }
        
        // 1. Calculate derivative at current state
        self.calculate_derivative(*t, state, &mut derivative);
        
        // 2. Half-step positions update
        let state_slice = state.as_mut();
        for i in 0..dim/2 {
            let pos_i = i;
            let vel_i = i + dim/2;
            
            // Store current values for half-step
            half_step[pos_i] = state_slice[pos_i];
            half_step[vel_i] = state_slice[vel_i];
            
            // Update position using current velocity: q += dt/2 * v
            state_slice[pos_i] += dt * 0.5 * state_slice[vel_i];
        }
        
        // 3. Full-step velocities update
        for i in 0..dim/2 {
            let vel_i = i + dim/2;
            
            // Update velocity using force: v += dt * dv/dt
            state_slice[vel_i] += dt * derivative[vel_i];
        }
        
        // 4. Half-step positions update again
        for i in 0..dim/2 {
            let pos_i = i;
            let vel_i = i + dim/2;
            
            // Update position using updated velocity: q += dt/2 * v
            state_slice[pos_i] = half_step[pos_i] + dt * state_slice[vel_i];
        }
        
        // 5. Check numerical stability (no NaN or Inf)
        if state_slice.iter().any(|&x| x.is_nan() || x.is_infinite()) {
            return Err(TrsError::NumericalInstability);
        }
        
        // 6. Update time
        *t += dt;
        
        // 7. Store current state for next step
        self.prev_state = Some(state.clone());
        
        Ok(())
    }
    
    #[cfg(feature = "yoshida4")]
    fn step_yoshida4(&mut self, t: &mut f64, state: &mut S) -> Result<(), TrsError> {
        // Yoshida 4th-order symplectic coefficients
        let w1 = 1.0 / (2.0 - 2.0_f64.powf(1.0/3.0));
        let w0 = -w1 * 2.0_f64.powf(1.0/3.0);
        let c = [w1 * 0.5, (w0 + w1) * 0.5, (w0 + w1) * 0.5, w1 * 0.5];
        let d = [w1, w0, w1, 0.0]; // Last coefficient not used
        
        let dt = self.params.dt;
        let dim = state.as_ref().len();
        
        // Create temporary storage
        let mut derivative = vec![0.0; dim];
        let mut temp_state = state.clone();
        let temp_state_slice = temp_state.as_mut();
        let state_slice = state.as_mut();
        
        // Four-stage integration
        for stage in 0..4 {
            // Position update
            for i in 0..dim/2 {
                let pos_i = i;
                let vel_i = i + dim/2;
                state_slice[pos_i] += c[stage] * dt * state_slice[vel_i];
            }
            
            // Only calculate and apply forces for the first 3 stages
            if stage < 3 {
                self.calculate_derivative(*t + dt * (c[0] + c[1] + c[2] + c[3]), state, &mut derivative);
                
                // Velocity update
                for i in 0..dim/2 {
                    let vel_i = i + dim/2;
                    state_slice[vel_i] += d[stage] * dt * derivative[vel_i];
                }
            }
        }
        
        // Check numerical stability
        if state_slice.iter().any(|&x| x.is_nan() || x.is_infinite()) {
            return Err(TrsError::NumericalInstability);
        }
        
        // Update time
        *t += dt;
        
        // Store current state for next step
        self.prev_state = Some(state.clone());
        
        Ok(())
    }
    
    /// Perform time reversal on the system
    ///
    /// # Arguments
    ///
    /// * `t` - Current time (will be negated)
    /// * `state` - Current state (velocities will be negated)
    ///
    /// # Returns
    ///
    /// Result indicating success or error
    pub fn reverse(&self, t: &mut f64, state: &mut S) -> Result<(), TrsError> {
        // Negate time
        *t = -*t;
        
        // Negate velocities (second half of state vector)
        let state_slice = state.as_mut();
        let dim = state_slice.len();
        
        if dim % 2 != 0 {
            return Err(TrsError::DimensionMismatch);
        }
        
        for i in dim/2..dim {
            state_slice[i] = -state_slice[i];
        }
        
        Ok(())
    }
    
    /// Calculate the TRS loss between original and rolled-back states
    ///
    /// This measures how well the time-reversal symmetry is preserved.
    /// A lower value indicates better reversibility.
    ///
    /// # Arguments
    ///
    /// * `orig` - Original state
    /// * `rolled` - State after forward then backward integration
    ///
    /// # Returns
    ///
    /// The TRS loss value
    pub fn trs_loss(&self, orig: &S, rolled: &S) -> f64 {
        let orig_slice = orig.as_ref();
        let rolled_slice = rolled.as_ref();
        
        let dim = orig_slice.len();
        if dim != rolled_slice.len() || dim % 2 != 0 {
            return f64::INFINITY;
        }
        
        let half_dim = dim / 2;
        
        // Position error: ||q_orig - q_rolled||^2
        let mut pos_error = 0.0;
        let mut max_pos_error = 0.0;
        for i in 0..half_dim {
            let diff = orig_slice[i] - rolled_slice[i];
            pos_error += diff * diff;
            max_pos_error = max_pos_error.max(diff.abs());
        }
        
        // Momentum error: ||p_orig + p_rolled||^2 (note the + sign for reversed momentum)
        let mut mom_error = 0.0;
        let mut max_mom_error = 0.0;
        for i in half_dim..dim {
            let sum = orig_slice[i] + rolled_slice[i];
            mom_error += sum * sum;
            max_mom_error = max_mom_error.max(sum.abs());
        }
        
        // Update max error stats if this is a mutable reference
        if let Some(stats) = unsafe { (self as *const Self as *mut Self).as_mut() } {
            stats.stats.max_position_error = stats.stats.max_position_error.max(max_pos_error);
            stats.stats.max_momentum_error = stats.stats.max_momentum_error.max(max_mom_error);
        }
        
        // Compute weighted loss (as in Huh et al.)
        pos_error + self.params.lambda_trs * mom_error
    }
    
    /// Perform multiple integration steps
    ///
    /// # Arguments
    ///
    /// * `t` - Current time (will be updated)
    /// * `state` - Current state (will be updated)
    /// * `steps` - Number of steps to take
    ///
    /// # Returns
    ///
    /// Result indicating success or error
    pub fn integrate(&mut self, t: &mut f64, state: &mut S, steps: usize) -> Result<(), TrsError> {
        // Validate step count is reasonable
        if steps > 1_000_000_000 {
            return Err(TrsError::InvalidParameter(
                format!("Step count {} exceeds reasonable limit", steps)));
        }
        
        for _ in 0..steps {
            self.step_symplectic(t, state)?;
        }
        Ok(())
    }
    
    /// Perform time-reversed integration
    ///
    /// This is equivalent to reversing the state, integrating forward,
    /// then reversing again.
    ///
    /// # Arguments
    ///
    /// * `t` - Current time (will be updated)
    /// * `state` - Current state (will be updated)
    /// * `steps` - Number of steps to take backward
    ///
    /// # Returns
    ///
    /// Result indicating success or error
    pub fn integrate_backward(&mut self, t: &mut f64, state: &mut S, steps: usize) -> Result<(), TrsError> {
        // Validate step count is reasonable
        if steps > 1_000_000_000 {
            return Err(TrsError::InvalidParameter(
                format!("Step count {} exceeds reasonable limit", steps)));
        }
        
        // Reverse the system
        self.reverse(t, state)?;
        
        // Integrate forward in the reversed system
        self.integrate(t, state, steps)?;
        
        // Reverse back
        self.reverse(t, state)?;
        
        Ok(())
    }
    
    /// Check TRS loss between original and time-reversed states
    ///
    /// This function applies:
    /// 1. Forward integration for N steps
    /// 2. Backward integration for N steps
    /// 3. Calculates TRS loss between original and final states
    ///
    /// # Arguments
    ///
    /// * `t` - Starting time
    /// * `init_state` - Initial state
    /// * `steps` - Number of steps to take forward and then backward
    ///
    /// # Returns
    ///
    /// The TRS loss value or error
    pub fn check_reversibility(&mut self, t: f64, init_state: &S, steps: usize) -> Result<f64, TrsError> {
        // Validate step count is reasonable
        if steps > 1_000_000_000 {
            return Err(TrsError::InvalidParameter(
                format!("Step count {} exceeds reasonable limit", steps)));
        }
        
        // Clone the initial state
        let orig_state = init_state.clone();
        
        // Create mutable copies for integration
        let mut state = init_state.clone();
        let mut time = t;
        
        // Forward integration
        self.integrate(&mut time, &mut state, steps)?;
        
        // Backward integration
        self.integrate_backward(&mut time, &mut state, steps)?;
        
        // Calculate TRS loss
        let loss = self.trs_loss(&orig_state, &state);
        
        // Store the loss in stats
        self.stats.trs_loss = loss;
        
        Ok(loss)
    }
    
    /// Integrate to a specific time
    ///
    /// # Arguments
    ///
    /// * `t` - Current time
    /// * `state` - Current state (will be updated)
    /// * `target_t` - Target time to integrate to
    ///
    /// # Returns
    ///
    /// Result indicating success or error
    pub fn integrate_to(&mut self, t: &mut f64, state: &mut S, target_t: f64) -> Result<(), TrsError> {
        let dt = self.params.dt;
        
        if (target_t - *t).abs() < 1e-10 {
            return Ok(());
        }
        
        if !target_t.is_finite() {
            return Err(TrsError::InvalidParameter("Target time must be finite".to_string()));
        }
        
        // Determine direction of integration
        let forward = target_t > *t;
        let steps = ((target_t - *t).abs() / dt).ceil() as usize;
        
        // Validate step count is reasonable
        if steps > 1_000_000_000 {
            return Err(TrsError::InvalidParameter(
                format!("Step count {} exceeds reasonable limit", steps)));
        }
        
        if forward {
            self.integrate(t, state, steps)?;
        } else {
            self.integrate_backward(t, state, steps)?;
        }
        
        // Ensure exact target time
        *t = target_t;
        
        Ok(())
    }
    
    /// Get statistics about controller performance
    ///
    /// # Returns
    ///
    /// A structure containing performance statistics
    pub fn stats(&self) -> &TrsStats {
        &self.stats
    }
    
    /// Reset statistics counters
    pub fn reset_stats(&mut self) {
        self.stats = TrsStats {
            last_dt: self.params.dt,
            ..Default::default()
        };
    }
}

/// Construct an ODE system from the Duffing oscillator
///
/// The Duffing equation is:
/// d²x/dt² + δ·dx/dt - x + x³ = γ·cos(ω·t)
///
/// # Arguments
///
/// * `delta` - Damping coefficient
/// * `gamma` - Amplitude of periodic driving force
/// * `omega` - Angular frequency of driving force
///
/// # Returns
///
/// A closure that computes the Duffing dynamics
pub fn duffing_system(delta: f64, gamma: f64, omega: f64) -> impl Fn(f64, &[f64], &mut [f64]) {
    move |t, state, derivative| {
        // State format: [x, v]
        let x = state[0];
        let v = state[1];
        
        // Differential equation:
        // dx/dt = v
        // dv/dt = -delta*v + x - x^3 + gamma*cos(omega*t)
        derivative[0] = v;
        derivative[1] = -delta * v + x - x * x * x + gamma * (omega * t).cos();
    }
}

/// Create a purely conservative Duffing oscillator (no damping or driving)
///
/// This system is completely reversible and conserves energy perfectly
/// in the continuous limit. Useful for testing symplectic integrators.
pub fn conservative_duffing() -> impl Fn(f64, &[f64], &mut [f64]) {
    move |_t, state, derivative| {
        let x = state[0];
        let v = state[1];
        
        // dx/dt = v
        // dv/dt = x - x^3 (no damping or driving)
        derivative[0] = v;
        derivative[1] = x - x * x * x;
    }
}

/// Create a near-chaotic Duffing oscillator (just at the edge of chaos)
///
/// This system is useful for testing the robustness of the integrator
/// near bifurcation points.
pub fn near_chaotic_duffing() -> impl Fn(f64, &[f64], &mut [f64]) {
    // Delta just low enough and gamma just high enough for chaos
    let delta = 0.15;
    let gamma = 0.28; // Just below chaotic threshold
    let omega = 1.0;
    
    move |t, state, derivative| {
        let x = state[0];
        let v = state[1];
        
        derivative[0] = v;
        derivative[1] = -delta * v + x - x * x * x + gamma * (omega * t).cos();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    struct TestState {
        data: Vec<f64>,
    }
    
    impl AsRef<[f64]> for TestState {
        fn as_ref(&self) -> &[f64] {
            &self.data
        }
    }
    
    impl AsMut<[f64]> for TestState {
        fn as_mut(&mut self) -> &mut [f64] {
            &mut self.data
        }
    }
    
    impl Clone for TestState {
        fn clone(&self) -> Self {
            Self {
                data: self.data.clone(),
            }
        }
    }
    
    #[test]
    fn test_trs_ode_creation() {
        let force = |_t: f64, _s: &TestState, _d: &mut [f64]| {};
        let controller = TrsOde::new(0.01, 0.1, force);
        
        assert!((controller.dt() - 0.01).abs() < 1e-10);
        assert!((controller.lambda_trs() - 0.1).abs() < 1e-10);
    }
    
    #[test]
    fn test_harmonic_oscillator() {
        // Harmonic oscillator system: d²x/dt² = -x
        let force = |_t: f64, s: &TestState, d: &mut [f64]| {
            d[0] = s.data[1];
            d[1] = -s.data[0];
        };
        
        let mut controller = TrsOde::new(0.01, 0.1, force);
        
        // Initial state: x=1, v=0 (starting at maximum displacement)
        let mut state = TestState { data: vec![1.0, 0.0] };
        let mut t = 0.0;
        
        // Integrate for 100 steps (1 time unit)
        controller.integrate(&mut t, &mut state, 100).unwrap();
        
        // Check that we're close to x=cos(1), v=-sin(1)
        let expected_x = (1.0_f64).cos();
        let expected_v = -(1.0_f64).sin();
        
        assert!((state.data[0] - expected_x).abs() < 0.01);
        assert!((state.data[1] - expected_v).abs() < 0.01);
    }
    
    #[test]
    fn test_reversibility() {
        // Simple system: d²x/dt² = -x
        let force = |_t: f64, s: &TestState, d: &mut [f64]| {
            d[0] = s.data[1];
            d[1] = -s.data[0];
        };
        
        let mut controller = TrsOde::new(0.01, 0.1, force);
        
        // Initial state: x=1, v=0
        let init_state = TestState { data: vec![1.0, 0.0] };
        
        // Check reversibility
        let loss = controller.check_reversibility(0.0, &init_state, 100).unwrap();
        
        // Conservation of energy should ensure good reversibility
        assert!(loss < 1e-5);
        
        // Check that stats are updated
        assert!((controller.stats().trs_loss - loss).abs() < 1e-10);
        assert!(controller.stats().steps > 0);
        assert!(controller.stats().total_time > 0.0);
    }
    
    #[test]
    fn test_duffing_oscillator() {
        // Duffing oscillator with standard parameters
        let delta = 0.15;
        let gamma = 0.3;
        let omega = 1.0;
        
        let duffing = duffing_system(delta, gamma, omega);
        let duffing_wrapper = |t, s: &TestState, d: &mut [f64]| {
            duffing(t, &s.data, d);
        };
        
        let mut controller = TrsOde::new(0.01, 0.1, duffing_wrapper);
        
        // Initial state: x=1, v=0
        let mut state = TestState { data: vec![1.0, 0.0] };
        let mut t = 0.0;
        
        // Integrate for one period
        let period = 2.0 * std::f64::consts::PI / omega;
        controller.integrate_to(&mut t, &mut state, period).unwrap();
        
        // The solution won't be exactly periodic due to damping and driving
        // But should be bounded
        assert!(state.data[0].abs() < 2.0);
        assert!(state.data[1].abs() < 2.0);
        
        // For systems with damping, reversibility won't be perfect
        // but should still be reasonable
        let init_state = TestState { data: vec![1.0, 0.0] };
        let loss = controller.check_reversibility(0.0, &init_state, 100).unwrap();
        
        // Allow larger loss for damped system
        assert!(loss < 0.1);
    }
    
    #[test]
    fn test_invalid_parameters() {
        let force = |_t: f64, _s: &TestState, _d: &mut [f64]| {};
        let mut controller = TrsOde::new(0.01, 0.1, force);
        
        // Test invalid dt values
        assert!(controller.set_dt(-0.01).is_err());
        assert!(controller.set_dt(0.0).is_err());
