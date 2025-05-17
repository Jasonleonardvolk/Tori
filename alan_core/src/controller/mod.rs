//! Time-Reversal-Symmetric ODE controllers
//!
//! This module implements controllers for reversible dynamics
//! using time-reversal-symmetric (TRS) ordinary differential equations.

pub mod trs_ode;

// Re-export main components
pub use trs_ode::TrsOde;
