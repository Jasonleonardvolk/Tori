//! Spin vector implementation for Banksy-spin dynamics
//!
//! This module implements the spin component of the oscillator system,
//! where each oscillator has a 3D spin vector σ and momentum p_σ.

use std::ops::{Add, Sub, Mul, Div, Neg};
use std::fmt;

/// A 3D spin vector representing a unit vector in ℝ³
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct SpinVector {
    /// The x, y, z components of the vector
    pub components: [f32; 3],
}

impl SpinVector {
    /// Create a new spin vector with the given components
    pub fn new(x: f32, y: f32, z: f32) -> Self {
        let mut result = Self { components: [x, y, z] };
        result.normalize();
        result
    }
    
    /// Create a new spin vector from an array of components
    pub fn from_array(arr: [f32; 3]) -> Self {
        let mut result = Self { components: arr };
        result.normalize();
        result
    }
    
    /// Create a new spin vector from a slice
    pub fn from_slice(slice: &[f32]) -> Option<Self> {
        if slice.len() != 3 {
            return None;
        }
        let mut result = Self { components: [slice[0], slice[1], slice[2]] };
        result.normalize();
        Some(result)
    }
    
    /// Create a spin vector pointing along the z-axis
    pub fn z_axis() -> Self {
        Self { components: [0.0, 0.0, 1.0] }
    }
    
    /// Create a randomly oriented spin vector
    pub fn random(rng: &mut impl rand::Rng) -> Self {
        // Generate a random point on a sphere
        let x = rng.gen::<f32>() * 2.0 - 1.0;
        let y = rng.gen::<f32>() * 2.0 - 1.0;
        let z = rng.gen::<f32>() * 2.0 - 1.0;
        
        Self::new(x, y, z)  // This will normalize the vector
    }
    
    /// Get the x component
    #[inline]
    pub fn x(&self) -> f32 {
        self.components[0]
    }
    
    /// Get the y component
    #[inline]
    pub fn y(&self) -> f32 {
        self.components[1]
    }
    
    /// Get the z component
    #[inline]
    pub fn z(&self) -> f32 {
        self.components[2]
    }
    
    /// Set the components
    pub fn set(&mut self, x: f32, y: f32, z: f32) {
        self.components = [x, y, z];
        self.normalize();
    }
    
    /// Normalize the vector to unit length
    #[inline]
    pub fn normalize(&mut self) {
        let norm_squared = self.norm_squared();
        if norm_squared < 1e-10 {
            // Avoid division by very small numbers
            self.components = [0.0, 0.0, 1.0];  // Default to z-axis
            return;
        }
        
        let norm = norm_squared.sqrt();
        self.components[0] /= norm;
        self.components[1] /= norm;
        self.components[2] /= norm;
    }
    
    /// Get the squared norm (length) of the vector
    #[inline]
    pub fn norm_squared(&self) -> f32 {
        self.components[0] * self.components[0] +
        self.components[1] * self.components[1] +
        self.components[2] * self.components[2]
    }
    
    /// Get the norm (length) of the vector
    #[inline]
    pub fn norm(&self) -> f32 {
        self.norm_squared().sqrt()
    }
    
    /// Compute the dot product with another vector
    #[inline]
    pub fn dot(&self, other: &Self) -> f32 {
        self.components[0] * other.components[0] +
        self.components[1] * other.components[1] +
        self.components[2] * other.components[2]
    }
    
    /// Compute the cross product with another vector
    pub fn cross(&self, other: &Self) -> Self {
        let x = self.components[1] * other.components[2] - self.components[2] * other.components[1];
        let y = self.components[2] * other.components[0] - self.components[0] * other.components[2];
        let z = self.components[0] * other.components[1] - self.components[1] * other.components[0];
        
        Self { components: [x, y, z] }
    }
    
    /// Rotate the spin vector around an axis
    pub fn rotate_around_axis(&mut self, axis: &Self, angle: f32) {
        // Ensure the axis is normalized
        let mut axis_norm = *axis;
        axis_norm.normalize();
        
        // Rodrigues rotation formula
        let cos_angle = angle.cos();
        let sin_angle = angle.sin();
        
        let dot_prod = self.dot(&axis_norm);
        let cross_prod = self.cross(&axis_norm);
        
        let x = self.components[0] * cos_angle + 
                cross_prod.components[0] * sin_angle + 
                axis_norm.components[0] * dot_prod * (1.0 - cos_angle);
                
        let y = self.components[1] * cos_angle + 
                cross_prod.components[1] * sin_angle + 
                axis_norm.components[1] * dot_prod * (1.0 - cos_angle);
                
        let z = self.components[2] * cos_angle + 
                cross_prod.components[2] * sin_angle + 
                axis_norm.components[2] * dot_prod * (1.0 - cos_angle);
        
        self.components = [x, y, z];
        self.normalize();
    }
    
    /// Compute the angle between this vector and another
    pub fn angle_with(&self, other: &Self) -> f32 {
        let dot_prod = self.dot(other);
        
        // Clamp to avoid domain errors in acos
        let clamped_dot = dot_prod.max(-1.0).min(1.0);
        clamped_dot.acos()
    }
    
    /// Align with another vector (used in spin coupling)
    pub fn align_with(&mut self, other: &Self, rate: f32) {
        let dot_prod = self.dot(other);
        
        // No alignment needed if vectors are parallel or anti-parallel
        if dot_prod.abs() > 0.999 {
            if dot_prod < 0.0 {
                // Flip if anti-parallel
                self.components[0] = -self.components[0];
                self.components[1] = -self.components[1];
                self.components[2] = -self.components[2];
            }
            return;
        }
        
        // Find rotation axis (perpendicular to both vectors)
        let axis = self.cross(other);
        
        // Find rotation angle (limited by rate)
        let angle = self.angle_with(other).min(rate);
        
        // Rotate toward other vector
        if dot_prod >= 0.0 {
            self.rotate_around_axis(&axis, angle);
        } else {
            // For anti-parallel vectors, rotate around any perpendicular axis
            // We can use any vector perpendicular to self
            let mut perp = SpinVector::new(1.0, 0.0, 0.0);
            if self.dot(&perp).abs() > 0.9 {
                perp = SpinVector::new(0.0, 1.0, 0.0);
            }
            
            let axis = self.cross(&perp);
            self.rotate_around_axis(&axis, angle);
        }
    }
}

// Implement Add for SpinVector
impl Add for SpinVector {
    type Output = SpinVector;
    
    fn add(self, other: Self) -> Self::Output {
        Self {
            components: [
                self.components[0] + other.components[0],
                self.components[1] + other.components[1],
                self.components[2] + other.components[2],
            ]
        }
    }
}

// Implement Sub for SpinVector
impl Sub for SpinVector {
    type Output = SpinVector;
    
    fn sub(self, other: Self) -> Self::Output {
        Self {
            components: [
                self.components[0] - other.components[0],
                self.components[1] - other.components[1],
                self.components[2] - other.components[2],
            ]
        }
    }
}

// Implement Mul<f32> for SpinVector (scalar multiplication)
impl Mul<f32> for SpinVector {
    type Output = SpinVector;
    
    fn mul(self, scalar: f32) -> Self::Output {
        Self {
            components: [
                self.components[0] * scalar,
                self.components[1] * scalar,
                self.components[2] * scalar,
            ]
        }
    }
}

// Implement Div<f32> for SpinVector (scalar division)
impl Div<f32> for SpinVector {
    type Output = SpinVector;
    
    fn div(self, scalar: f32) -> Self::Output {
        let inv_scalar = 1.0 / scalar;
        self * inv_scalar
    }
}

// Implement Neg for SpinVector
impl Neg for SpinVector {
    type Output = SpinVector;
    
    fn neg(self) -> Self::Output {
        Self {
            components: [
                -self.components[0],
                -self.components[1],
                -self.components[2],
            ]
        }
    }
}

// Implement Display for SpinVector
impl fmt::Display for SpinVector {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({:.4}, {:.4}, {:.4})", self.x(), self.y(), self.z())
    }
}

/// Spin utility functions for operating on collections of spin vectors
pub struct Spin;

impl Spin {
    /// Calculate the mean spin direction of a collection of spin vectors
    pub fn mean_direction(spins: &[[f32; 3]]) -> [f32; 3] {
        let mut sum_x = 0.0;
        let mut sum_y = 0.0;
        let mut sum_z = 0.0;
        
        // Sum all spin vectors
        for spin in spins {
            sum_x += spin[0];
            sum_y += spin[1];
            sum_z += spin[2];
        }
        
        // Normalize the result
        let n = spins.len() as f32;
        if n < 1.0 {
            return [0.0, 0.0, 1.0]; // Default to z-axis
        }
        
        let norm = (sum_x * sum_x + sum_y * sum_y + sum_z * sum_z).sqrt();
        if norm < 1e-10 {
            return [0.0, 0.0, 1.0]; // Default to z-axis
        }
        
        [sum_x / norm, sum_y / norm, sum_z / norm]
    }
    
    /// Calculate the average spin alignment (dot product) with the mean direction
    pub fn alignment(spins: &[[f32; 3]]) -> f32 {
        let mean = Spin::mean_direction(spins);
        let mut sum_alignment = 0.0;
        
        for spin in spins {
            // Dot product with mean direction
            let dot = spin[0] * mean[0] + spin[1] * mean[1] + spin[2] * mean[2];
            sum_alignment += dot;
        }
        
        let n = spins.len() as f32;
        if n < 1.0 {
            return 0.0;
        }
        
        sum_alignment / n
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f32::consts::PI;
    use std::f32::consts::FRAC_PI_2;
    
    #[test]
    fn test_spin_vector_creation() {
        let sv = SpinVector::new(1.0, 0.0, 0.0);
        assert!((sv.x() - 1.0).abs() < 1e-6);
        assert!(sv.y().abs() < 1e-6);
        assert!(sv.z().abs() < 1e-6);
        
        let sv2 = SpinVector::new(3.0, 0.0, 0.0);
        assert!((sv2.x() - 1.0).abs() < 1e-6);  // Should be normalized
    }
    
    #[test]
    fn test_spin_vector_operations() {
        let v1 = SpinVector::new(1.0, 0.0, 0.0);
        let v2 = SpinVector::new(0.0, 1.0, 0.0);
        
        // Test dot product
        assert!(v1.dot(&v2).abs() < 1e-6);
        
        // Test cross product
        let cross = v1.cross(&v2);
        assert!(cross.x().abs() < 1e-6);
        assert!(cross.y().abs() < 1e-6);
        assert!((cross.z() - 1.0).abs() < 1e-6);
        
        // Test angle
        let angle = v1.angle_with(&v2);
        assert!((angle - FRAC_PI_2).abs() < 1e-6);
    }
    
    #[test]
    fn test_spin_vector_rotation() {
        let mut v = SpinVector::new(1.0, 0.0, 0.0);
        let axis = SpinVector::new(0.0, 0.0, 1.0);
        
        // Rotate by 90 degrees
        v.rotate_around_axis(&axis, FRAC_PI_2);
        assert!(v.x().abs() < 1e-6);
        assert!((v.y() - 1.0).abs() < 1e-6);
        assert!(v.z().abs() < 1e-6);
        
        // Rotate by another 90 degrees
        v.rotate_around_axis(&axis, FRAC_PI_2);
        assert!((v.x() + 1.0).abs() < 1e-6);
        assert!(v.y().abs() < 1e-6);
        assert!(v.z().abs() < 1e-6);
    }
    
    #[test]
    fn test_spin_alignment() {
        // All spins aligned along x-axis
        let aligned = [[1.0, 0.0, 0.0], [1.0, 0.0, 0.0], [1.0, 0.0, 0.0]];
        assert!((Spin::alignment(&aligned) - 1.0).abs() < 1e-6);
        
        // Random but aligned spins
        let random_aligned = [
            [0.8, 0.4, 0.0],
            [0.8, 0.4, 0.0],
            [0.8, 0.4, 0.0],
        ];
        assert!((Spin::alignment(&random_aligned) - 1.0).abs() < 1e-6);
        
        // Perpendicular spins
        let perpendicular = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]];
        let alignment = Spin::alignment(&perpendicular);
        assert!(alignment > 0.0 && alignment < 0.6); // Weak alignment
    }
}
