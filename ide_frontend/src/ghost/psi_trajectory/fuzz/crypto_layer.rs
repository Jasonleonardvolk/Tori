//! Fuzzing target for ψ-Trajectory crypto layer
//! 
//! This fuzzer tests the security and stability of our encryption/decryption implementation.
//! It attempts to decrypt malformed data, test edge cases in key derivation, and verify
//! that the crypto layer handles corrupted inputs gracefully.

use arbitrary::{Arbitrary, Unstructured};
use libfuzzer_sys::fuzz_target;
use psi_trajectory::crypto::{self, Key, Algorithm, KeyDerivation, EncryptionHeader};
use std::io::{Cursor, Read, Write};

/// Fuzz target for crypto layer
fuzz_target!(|data: &[u8]| {
    // Skip empty or small inputs
    if data.len() < 32 {
        return;
    }
    
    // Derive a test key
    let password = &data[0..std::cmp::min(data.len(), 16)];
    let key_result = crypto::Key::from_password(password, KeyDerivation::Direct);
    
    if let Ok(key) = key_result {
        // Try to decrypt the data
        let mut input = Cursor::new(data);
        let mut output = Vec::new();
        
        // Attempt to decrypt the data (should never panic)
        let _ = crypto::decrypt(&mut input, &mut output, &key);
        
        // Try with a different algorithm
        let alt_key_result = crypto::Key::from_password(
            password,
            KeyDerivation::Pbkdf2 { 
                iterations: 1000, 
                salt: [0u8; 16] 
            }
        );
        
        if let Ok(alt_key) = alt_key_result {
            input.set_position(0);
            output.clear();
            let _ = crypto::decrypt(&mut input, &mut output, &alt_key);
        }
    }
    
    // Test the header parsing
    let mut cursor = Cursor::new(data);
    let header_result = EncryptionHeader::read(&mut cursor);
    
    if let Ok(header) = header_result {
        // Test with corrupted nonce
        let mut modified_header = header.clone();
        modified_header.initial_nonce[0] ^= 1; // Flip one bit
        
        let mut header_bytes = Vec::new();
        let _ = modified_header.write(&mut header_bytes);
        
        // Try to decrypt with modified header
        if header_bytes.len() > 0 {
            let mut input = Cursor::new(header_bytes);
            let key_result = Key::generate();
            
            if let Ok(key) = key_result {
                let mut output = Vec::new();
                let _ = crypto::decrypt(&mut input, &mut output, &key);
            }
        }
    }
    
    // Test encryption with random slices of the input data
    if data.len() > 64 {
        let start = data[0] as usize % (data.len() / 2);
        let end = start + (data[1] as usize % (data.len() - start));
        let slice = &data[start..end];
        
        // Generate a random key
        let key_result = Key::generate();
        
        if let Ok(key) = key_result {
            // Encrypt the slice
            let mut input = Cursor::new(slice);
            let mut encrypted = Vec::new();
            
            let encrypt_result = crypto::encrypt(
                &mut input, 
                &mut encrypted, 
                &key, 
                Algorithm::ChaCha20Poly1305,
                Vec::new()
            );
            
            // If encryption succeeded, try to decrypt it back
            if encrypt_result.is_ok() && !encrypted.is_empty() {
                let mut decrypt_input = Cursor::new(encrypted);
                let mut decrypted = Vec::new();
                
                let _ = crypto::decrypt(&mut decrypt_input, &mut decrypted, &key);
                
                // Verify roundtrip if enough data
                if decrypted.len() == slice.len() {
                    assert_eq!(&decrypted, slice, "Roundtrip encryption/decryption failed");
                }
            }
        }
    }
    
    // Test key derivation with various parameters
    if data.len() >= 64 {
        // Use data chunks as salt and password
        let password = &data[0..32];
        let salt_data = &data[32..48];
        let mut salt = [0u8; 16];
        salt.copy_from_slice(salt_data);
        
        // Try different iteration counts derived from the input
        let iterations_base = 
            (u32::from_le_bytes([data[48], data[49], data[50], data[51]]) % 10000) + 1;
        
        // Test with different iteration counts
        for i in 0..3 {
            let iterations = iterations_base * (i + 1);
            
            let _ = Key::from_password(
                password,
                KeyDerivation::Pbkdf2 { 
                    iterations, 
                    salt,
                }
            );
        }
    }
});

/// Crypto parameters for generating arbitrary test cases
#[derive(Debug, Arbitrary)]
struct CryptoParams {
    /// Encryption algorithm (0 = ChaCha20Poly1305, 1 = AES-256-GCM)
    algorithm: u8,
    
    /// Key derivation method (0 = Direct, 1 = PBKDF2)
    key_derivation: u8,
    
    /// PBKDF2 iterations if applicable
    iterations: u32,
    
    /// Salt for key derivation if applicable
    salt: [u8; 16],
    
    /// Password for key derivation
    password: Vec<u8>,
    
    /// Initial nonce
    nonce: [u8; 12],
    
    /// Data to encrypt
    data: Vec<u8>,
}

/// Generate valid test parameters for crypto fuzzing
fn normalize_crypto_params(params: &CryptoParams) -> (Algorithm, KeyDerivation, Vec<u8>) {
    // Normalize algorithm
    let algorithm = if params.algorithm % 2 == 0 {
        Algorithm::ChaCha20Poly1305
    } else {
        Algorithm::Aes256Gcm
    };
    
    // Normalize key derivation
    let key_derivation = if params.key_derivation % 2 == 0 {
        KeyDerivation::Direct
    } else {
        // Ensure reasonable iteration count (not too small, not too large)
        let iterations = (params.iterations % 10000) + 1000;
        
        KeyDerivation::Pbkdf2 {
            iterations,
            salt: params.salt,
        }
    };
    
    // Ensure password is not empty
    let password = if params.password.is_empty() {
        vec![1, 2, 3, 4, 5] // Default non-empty password
    } else {
        params.password.clone()
    };
    
    (algorithm, key_derivation, password)
}
