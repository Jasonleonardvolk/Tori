//! Fuzzing target for ψ-Trajectory GPU kernel dispatcher
//! 
//! This fuzzer tests the robustness of our GPU kernel dispatch logic against
//! malformed inputs, edge cases, and unusual parameter combinations.
//! It ensures our GPU kernel dispatcher handles invalid inputs gracefully.

use arbitrary::{Arbitrary, Unstructured};
use libfuzzer_sys::fuzz_target;
use std::sync::Arc;

/// Simulated GPU kernel parameters for fuzzing
#[derive(Debug, Arbitrary)]
struct KernelParams {
    /// Kernel ID (which kernel to dispatch)
    kernel_id: u32,
    
    /// Work group size X
    workgroup_size_x: u32,
    
    /// Work group size Y
    workgroup_size_y: u32,
    
    /// Work group size Z
    workgroup_size_z: u32,
    
    /// Global size X
    global_size_x: u32,
    
    /// Global size Y
    global_size_y: u32,
    
    /// Global size Z
    global_size_z: u32,
    
    /// Buffer sizes for input/output
    buffer_sizes: Vec<u32>,
    
    /// Uniform values
    uniforms: Vec<u32>,
    
    /// Oscillator count
    oscillator_count: u32,
    
    /// GPU device preference (0 = any, 1 = discrete, 2 = integrated)
    device_preference: u8,
    
    /// Enable profiling (0 = no, 1 = yes)
    enable_profiling: u8,
}

/// Fuzz target for kernel dispatcher
fuzz_target!(|data: &[u8]| {
    // Skip empty inputs
    if data.len() < 16 {
        return;
    }
    
    // Try to parse as kernel parameters
    let mut unstructured = Unstructured::new(data);
    let kernel_params_result = KernelParams::arbitrary(&mut unstructured);
    
    if let Ok(params) = kernel_params_result {
        // Normalize parameters to reasonable ranges
        let params = normalize_kernel_params(params);
        
        // Try to dispatch kernel with these parameters
        let _ = psi_trajectory::gpu::dispatch_kernel(
            params.kernel_id,
            (params.workgroup_size_x, params.workgroup_size_y, params.workgroup_size_z),
            (params.global_size_x, params.global_size_y, params.global_size_z),
            &params.buffer_sizes,
            &params.uniforms,
            params.oscillator_count as usize,
            params.device_preference != 0,
            params.enable_profiling != 0,
        );
    }
    
    // Test raw buffer data
    if data.len() >= 64 {
        // Create simulated GPU buffer data
        let buffer_data = Arc::new(data.to_vec());
        
        // Try to process the buffer with different kernel types
        for kernel_id in 0..4 {
            let _ = psi_trajectory::gpu::process_buffer(
                kernel_id,
                buffer_data.clone(),
                psi_trajectory::compat::DEFAULT_OSCILLATOR_COUNT,
                false, // Don't profile in fuzzing
            );
        }
    }
    
    // Try to parse as shader code
    if data.len() > 128 {
        let shader_code = String::from_utf8_lossy(&data[0..std::cmp::min(data.len(), 1024)]);
        
        // Try to compile the shader code
        let _ = psi_trajectory::gpu::compile_shader(
            &shader_code,
            psi_trajectory::gpu::ShaderType::Compute,
        );
    }
});

/// Normalize kernel parameters to reasonable ranges
fn normalize_kernel_params(params: KernelParams) -> KernelParams {
    let mut normalized = params;
    
    // Limit kernel ID to valid range
    normalized.kernel_id %= 8; // Assume 8 valid kernel types
    
    // Ensure work group sizes are non-zero and within limits
    normalized.workgroup_size_x = nonzero_min(normalized.workgroup_size_x, 256);
    normalized.workgroup_size_y = nonzero_min(normalized.workgroup_size_y, 256);
    normalized.workgroup_size_z = nonzero_min(normalized.workgroup_size_z, 64);
    
    // Ensure global sizes are multiples of work group sizes and within limits
    normalized.global_size_x = normalize_global_size(normalized.global_size_x, normalized.workgroup_size_x);
    normalized.global_size_y = normalize_global_size(normalized.global_size_y, normalized.workgroup_size_y);
    normalized.global_size_z = normalize_global_size(normalized.global_size_z, normalized.workgroup_size_z);
    
    // Limit oscillator count to valid range
    normalized.oscillator_count = match normalized.oscillator_count % 3 {
        0 => 128,
        1 => 256,
        _ => 512,
    };
    
    // Limit buffer sizes to reasonable values
    let max_buffers = 8;
    if normalized.buffer_sizes.len() > max_buffers {
        normalized.buffer_sizes.truncate(max_buffers);
    }
    
    for i in 0..normalized.buffer_sizes.len() {
        // Limit each buffer to 16MB
        normalized.buffer_sizes[i] = std::cmp::min(normalized.buffer_sizes[i], 16 * 1024 * 1024);
    }
    
    // Ensure we have at least input and output buffers
    if normalized.buffer_sizes.is_empty() {
        normalized.buffer_sizes = vec![1024, 1024];
    } else if normalized.buffer_sizes.len() == 1 {
        normalized.buffer_sizes.push(normalized.buffer_sizes[0]);
    }
    
    // Limit uniforms to reasonable count
    let max_uniforms = 16;
    if normalized.uniforms.len() > max_uniforms {
        normalized.uniforms.truncate(max_uniforms);
    }
    
    normalized
}

/// Helper to ensure a value is non-zero and below a max
fn nonzero_min(value: u32, max: u32) -> u32 {
    if value == 0 {
        1
    } else {
        std::cmp::min(value, max)
    }
}

/// Helper to normalize global size based on work group size
fn normalize_global_size(global: u32, workgroup: u32) -> u32 {
    let min_global = workgroup; // At least one work group
    let max_global = 1024 * 1024; // Upper limit
    
    // Make global a multiple of workgroup, and limit to reasonable range
    let mut normalized = if global < min_global {
        min_global
    } else if global > max_global {
        (max_global / workgroup) * workgroup
    } else {
        (global / workgroup) * workgroup
    };
    
    // Ensure it's at least one workgroup
    if normalized < workgroup {
        normalized = workgroup;
    }
    
    normalized
}
