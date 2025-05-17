/**
 * Encryption for ψ-Trajectory
 * ------------------------------------------------------------------
 * Optional ChaCha20-Poly1305 encryption for archive files:
 * - Uses Ring crypto library for FIPS-friendly implementation
 * - Key derivation from passwords
 * - Platform-specific secure key storage
 * - Encryption header format
 * 
 * This module is only active when the "secure" feature is enabled.
 */

use std::io::{self, Read, Write, Seek, SeekFrom};
use ring::aead::{self, BoundKey, Nonce, NonceSequence, SealingKey, OpeningKey, UnboundKey, AES_256_GCM, CHACHA20_POLY1305};
use ring::error::Unspecified;
use ring::pbkdf2;
use ring::rand::{SecureRandom, SystemRandom};
use std::num::NonZeroU32;
use std::sync::Arc;

/// Magic identifier for encrypted archives "PSICRYPT"
pub const ENCRYPTION_MAGIC: [u8; 8] = *b"PSICRYPT";

/// Length of the encryption key in bytes
pub const KEY_LENGTH: usize = 32;

/// Length of the nonce in bytes
pub const NONCE_LENGTH: usize = 12;

/// Length of the auth tag in bytes
pub const TAG_LENGTH: usize = 16;

/// Default number of pbkdf2 iterations for password hashing
pub const DEFAULT_PBKDF2_ITERATIONS: u32 = 100_000;

/// Maximum chunk size for encryption/decryption
pub const MAX_CHUNK_SIZE: usize = 64 * 1024;

/// Encryption algorithm
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Algorithm {
    /// ChaCha20-Poly1305 (RFC 8439)
    ChaCha20Poly1305,
    
    /// AES-256-GCM
    Aes256Gcm,
}

impl Algorithm {
    /// Get the algorithm name
    pub fn name(&self) -> &'static str {
        match self {
            Algorithm::ChaCha20Poly1305 => "ChaCha20-Poly1305",
            Algorithm::Aes256Gcm => "AES-256-GCM",
        }
    }
    
    /// Get the Ring algorithm
    fn ring_algorithm(&self) -> &'static aead::Algorithm {
        match self {
            Algorithm::ChaCha20Poly1305 => &CHACHA20_POLY1305,
            Algorithm::Aes256Gcm => &AES_256_GCM,
        }
    }
}

impl Default for Algorithm {
    fn default() -> Self {
        Algorithm::ChaCha20Poly1305
    }
}

/// Key derivation method
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum KeyDerivation {
    /// Direct key (raw bytes)
    Direct,
    
    /// PBKDF2-HMAC-SHA256
    Pbkdf2 {
        /// Number of iterations
        iterations: u32,
        
        /// Salt for key derivation
        salt: [u8; 16],
    },
}

impl Default for KeyDerivation {
    fn default() -> Self {
        // Generate random salt
        let mut salt = [0u8; 16];
        SystemRandom::new()
            .fill(&mut salt)
            .unwrap_or_else(|_| {
                // Fallback if random generation fails
                for i in 0..16 {
                    salt[i] = i as u8;
                }
            });
        
        KeyDerivation::Pbkdf2 {
            iterations: DEFAULT_PBKDF2_ITERATIONS,
            salt,
        }
    }
}

/// Encryption key
#[derive(Debug, Clone)]
pub struct Key {
    /// Raw key bytes
    bytes: [u8; KEY_LENGTH],
}

impl Key {
    /// Create a new key from raw bytes
    pub fn new(bytes: [u8; KEY_LENGTH]) -> Self {
        Self { bytes }
    }
    
    /// Generate a random key
    pub fn generate() -> Result<Self, Unspecified> {
        let mut bytes = [0u8; KEY_LENGTH];
        SystemRandom::new().fill(&mut bytes)?;
        Ok(Self { bytes })
    }
    
    /// Derive a key from a password
    pub fn from_password(
        password: &[u8],
        method: KeyDerivation,
    ) -> Result<Self, Unspecified> {
        let mut key = [0u8; KEY_LENGTH];
        
        match method {
            KeyDerivation::Direct => {
                // Direct key (copy the password bytes)
                let len = std::cmp::min(password.len(), KEY_LENGTH);
                key[..len].copy_from_slice(&password[..len]);
            }
            KeyDerivation::Pbkdf2 { iterations, salt } => {
                // Derive key using PBKDF2
                let iterations = NonZeroU32::new(iterations).unwrap_or(NonZeroU32::new(1).unwrap());
                pbkdf2::derive(
                    pbkdf2::PBKDF2_HMAC_SHA256,
                    iterations,
                    &salt,
                    password,
                    &mut key,
                );
            }
        }
        
        Ok(Self { bytes: key })
    }
    
    /// Get the raw key bytes
    pub fn as_bytes(&self) -> &[u8; KEY_LENGTH] {
        &self.bytes
    }
}

/// Encryption header
#[derive(Debug, Clone)]
pub struct EncryptionHeader {
    /// Magic identifier "PSICRYPT"
    pub magic: [u8; 8],
    
    /// Encryption algorithm
    pub algorithm: Algorithm,
    
    /// Key derivation method
    pub key_derivation: KeyDerivation,
    
    /// Initial nonce
    pub initial_nonce: [u8; NONCE_LENGTH],
    
    /// Additional authenticated data (AAD)
    pub aad: Vec<u8>,
}

impl Default for EncryptionHeader {
    fn default() -> Self {
        // Generate random initial nonce
        let mut initial_nonce = [0u8; NONCE_LENGTH];
        SystemRandom::new()
            .fill(&mut initial_nonce)
            .unwrap_or_else(|_| {
                // Fallback if random generation fails
                for i in 0..NONCE_LENGTH {
                    initial_nonce[i] = i as u8;
                }
            });
        
        Self {
            magic: ENCRYPTION_MAGIC,
            algorithm: Algorithm::default(),
            key_derivation: KeyDerivation::default(),
            initial_nonce,
            aad: Vec::new(),
        }
    }
}

impl EncryptionHeader {
    /// Create a new encryption header
    pub fn new(
        algorithm: Algorithm,
        key_derivation: KeyDerivation,
        initial_nonce: [u8; NONCE_LENGTH],
        aad: Vec<u8>,
    ) -> Self {
        Self {
            magic: ENCRYPTION_MAGIC,
            algorithm,
            key_derivation,
            initial_nonce,
            aad,
        }
    }
    
    /// Write the header to a writer
    pub fn write<W: Write>(&self, writer: &mut W) -> io::Result<()> {
        // Write magic
        writer.write_all(&self.magic)?;
        
        // Write algorithm
        let algorithm_byte = match self.algorithm {
            Algorithm::ChaCha20Poly1305 => 1,
            Algorithm::Aes256Gcm => 2,
        };
        writer.write_all(&[algorithm_byte])?;
        
        // Write key derivation method
        match self.key_derivation {
            KeyDerivation::Direct => {
                writer.write_all(&[1])?; // Direct
                writer.write_all(&[0; 20])?; // Padding
            }
            KeyDerivation::Pbkdf2 { iterations, salt } => {
                writer.write_all(&[2])?; // PBKDF2
                writer.write_all(&iterations.to_le_bytes())?;
                writer.write_all(&salt)?;
            }
        }
        
        // Write initial nonce
        writer.write_all(&self.initial_nonce)?;
        
        // Write AAD length and data
        let aad_len = self.aad.len() as u32;
        writer.write_all(&aad_len.to_le_bytes())?;
        writer.write_all(&self.aad)?;
        
        Ok(())
    }
    
    /// Read the header from a reader
    pub fn read<R: Read>(reader: &mut R) -> io::Result<Self> {
        // Read magic
        let mut magic = [0u8; 8];
        reader.read_exact(&mut magic)?;
        
        if magic != ENCRYPTION_MAGIC {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "Invalid encryption header magic",
            ));
        }
        
        // Read algorithm
        let mut algorithm_byte = [0u8; 1];
        reader.read_exact(&mut algorithm_byte)?;
        
        let algorithm = match algorithm_byte[0] {
            1 => Algorithm::ChaCha20Poly1305,
            2 => Algorithm::Aes256Gcm,
            _ => {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidData,
                    "Invalid encryption algorithm",
                ));
            }
        };
        
        // Read key derivation method
        let mut method_byte = [0u8; 1];
        reader.read_exact(&mut method_byte)?;
        
        let key_derivation = match method_byte[0] {
            1 => {
                // Direct
                let mut padding = [0u8; 20];
                reader.read_exact(&mut padding)?;
                KeyDerivation::Direct
            }
            2 => {
                // PBKDF2
                let mut iterations_bytes = [0u8; 4];
                reader.read_exact(&mut iterations_bytes)?;
                let iterations = u32::from_le_bytes(iterations_bytes);
                
                let mut salt = [0u8; 16];
                reader.read_exact(&mut salt)?;
                
                KeyDerivation::Pbkdf2 { iterations, salt }
            }
            _ => {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidData,
                    "Invalid key derivation method",
                ));
            }
        };
        
        // Read initial nonce
        let mut initial_nonce = [0u8; NONCE_LENGTH];
        reader.read_exact(&mut initial_nonce)?;
        
        // Read AAD length and data
        let mut aad_len_bytes = [0u8; 4];
        reader.read_exact(&mut aad_len_bytes)?;
        let aad_len = u32::from_le_bytes(aad_len_bytes) as usize;
        
        let mut aad = vec![0u8; aad_len];
        reader.read_exact(&mut aad)?;
        
        Ok(Self {
            magic,
            algorithm,
            key_derivation,
            initial_nonce,
            aad,
        })
    }
}

/// Nonce sequence for encryption
struct CounterNonceSequence {
    /// Current counter value
    counter: u32,
    
    /// Initial nonce value
    initial_nonce: [u8; NONCE_LENGTH],
}

impl NonceSequence for CounterNonceSequence {
    fn advance(&mut self) -> Result<Nonce, Unspecified> {
        // Create nonce from initial value and counter
        let mut nonce_bytes = self.initial_nonce;
        
        // Increment the last 4 bytes of the nonce with the counter
        // (preserving the initial random bytes)
        let counter_bytes = self.counter.to_le_bytes();
        nonce_bytes[8..12].copy_from_slice(&counter_bytes);
        
        // Increment counter for next nonce
        self.counter = self.counter.wrapping_add(1);
        
        Nonce::try_assume_unique_for_key(&nonce_bytes)
    }
}

/// Encrypt a reader and write to a writer
pub fn encrypt<R, W>(
    reader: &mut R,
    writer: &mut W,
    key: &Key,
    algorithm: Algorithm,
    aad: Vec<u8>,
) -> io::Result<()>
where
    R: Read,
    W: Write,
{
    // Generate random initial nonce
    let mut initial_nonce = [0u8; NONCE_LENGTH];
    SystemRandom::new()
        .fill(&mut initial_nonce)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
    
    // Create encryption header
    let header = EncryptionHeader::new(
        algorithm,
        KeyDerivation::Direct, // For direct encryption, not password-based
        initial_nonce,
        aad.clone(),
    );
    
    // Write header
    header.write(writer)?;
    
    // Setup encryption
    let algorithm = algorithm.ring_algorithm();
    let unbound_key = UnboundKey::new(algorithm, key.as_bytes())
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
    
    let nonce_sequence = CounterNonceSequence {
        counter: 0,
        initial_nonce,
    };
    
    let mut sealing_key = SealingKey::new(unbound_key, nonce_sequence);
    
    // Read input in chunks and encrypt to output
    let mut input_buffer = vec![0u8; MAX_CHUNK_SIZE];
    let mut in_out = vec![0u8; 0]; // Will be resized as needed
    
    loop {
        // Read a chunk
        let bytes_read = reader.read(&mut input_buffer)?;
        if bytes_read == 0 {
            break; // End of input
        }
        
        // Resize in_out buffer to fit the input plus tag
        in_out.resize(bytes_read + TAG_LENGTH, 0);
        in_out[..bytes_read].copy_from_slice(&input_buffer[..bytes_read]);
        
        // Encrypt in place
        sealing_key
            .seal_in_place_append_tag(aead::Aad::from(&aad), &mut in_out)
            .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
        
        // Write ciphertext
        writer.write_all(&in_out)?;
    }
    
    Ok(())
}

/// Decrypt a reader and write to a writer
pub fn decrypt<R, W>(
    reader: &mut R,
    writer: &mut W,
    key: &Key,
) -> io::Result<()>
where
    R: Read,
    W: Write,
{
    // Read encryption header
    let header = EncryptionHeader::read(reader)?;
    
    // Setup decryption
    let algorithm = header.algorithm.ring_algorithm();
    let unbound_key = UnboundKey::new(algorithm, key.as_bytes())
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
    
    let nonce_sequence = CounterNonceSequence {
        counter: 0,
        initial_nonce: header.initial_nonce,
    };
    
    let mut opening_key = OpeningKey::new(unbound_key, nonce_sequence);
    
    // Read input in chunks and decrypt to output
    let mut input_buffer = vec![0u8; MAX_CHUNK_SIZE + TAG_LENGTH];
    let mut in_out = vec![0u8; 0]; // Will be resized as needed
    
    loop {
        // Read a chunk
        let bytes_read = reader.read(&mut input_buffer)?;
        if bytes_read == 0 {
            break; // End of input
        }
        
        if bytes_read <= TAG_LENGTH {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "Invalid ciphertext length",
            ));
        }
        
        // Resize in_out buffer to fit the input
        in_out.resize(bytes_read, 0);
        in_out.copy_from_slice(&input_buffer[..bytes_read]);
        
        // Decrypt in place
        let decrypted = opening_key
            .open_in_place(aead::Aad::from(&header.aad), &mut in_out)
            .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
        
        // Write plaintext
        writer.write_all(decrypted)?;
    }
    
    Ok(())
}

/// Encrypt a file
pub fn encrypt_file(
    input_path: &str,
    output_path: &str,
    password: &str,
) -> io::Result<()> {
    use std::fs::File;
    
    // Open input and output files
    let mut input_file = File::open(input_path)?;
    let mut output_file = File::create(output_path)?;
    
    // Generate key derivation parameters
    let key_derivation = KeyDerivation::default();
    
    // Derive key from password
    let key = Key::from_password(password.as_bytes(), key_derivation)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
    
    // Create encryption header
    let mut initial_nonce = [0u8; NONCE_LENGTH];
    SystemRandom::new()
        .fill(&mut initial_nonce)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
    
    let header = EncryptionHeader::new(
        Algorithm::default(),
        key_derivation,
        initial_nonce,
        Vec::new(), // No additional data
    );
    
    // Write header
    header.write(&mut output_file)?;
    
    // Setup encryption
    let algorithm = header.algorithm.ring_algorithm();
    let unbound_key = UnboundKey::new(algorithm, key.as_bytes())
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
    
    let nonce_sequence = CounterNonceSequence {
        counter: 0,
        initial_nonce,
    };
    
    let mut sealing_key = SealingKey::new(unbound_key, nonce_sequence);
    
    // Read input in chunks and encrypt to output
    let mut input_buffer = vec![0u8; MAX_CHUNK_SIZE];
    let mut in_out = vec![0u8; 0]; // Will be resized as needed
    let aad = Vec::new(); // No additional data
    
    loop {
        // Read a chunk
        let bytes_read = input_file.read(&mut input_buffer)?;
        if bytes_read == 0 {
            break; // End of input
        }
        
        // Resize in_out buffer to fit the input plus tag
        in_out.resize(bytes_read + TAG_LENGTH, 0);
        in_out[..bytes_read].copy_from_slice(&input_buffer[..bytes_read]);
        
        // Encrypt in place
        sealing_key
            .seal_in_place_append_tag(aead::Aad::from(&aad), &mut in_out)
            .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
        
        // Write ciphertext
        output_file.write_all(&in_out)?;
    }
    
    Ok(())
}

/// Decrypt a file
pub fn decrypt_file(
    input_path: &str,
    output_path: &str,
    password: &str,
) -> io::Result<()> {
    use std::fs::File;
    
    // Open input and output files
    let mut input_file = File::open(input_path)?;
    let mut output_file = File::create(output_path)?;
    
    // Read encryption header
    let header = EncryptionHeader::read(&mut input_file)?;
    
    // Derive key from password
    let key = Key::from_password(password.as_bytes(), header.key_derivation)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
    
    // Setup decryption
    let algorithm = header.algorithm.ring_algorithm();
    let unbound_key = UnboundKey::new(algorithm, key.as_bytes())
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
    
    let nonce_sequence = CounterNonceSequence {
        counter: 0,
        initial_nonce: header.initial_nonce,
    };
    
    let mut opening_key = OpeningKey::new(unbound_key, nonce_sequence);
    
    // Read input in chunks and decrypt to output
    let mut input_buffer = vec![0u8; MAX_CHUNK_SIZE + TAG_LENGTH];
    let mut in_out = vec![0u8; 0]; // Will be resized as needed
    
    loop {
        // Read a chunk
        let bytes_read = input_file.read(&mut input_buffer)?;
        if bytes_read == 0 {
            break; // End of input
        }
        
        if bytes_read <= TAG_LENGTH {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "Invalid ciphertext length",
            ));
        }
        
        // Resize in_out buffer to fit the input
        in_out.resize(bytes_read, 0);
        in_out.copy_from_slice(&input_buffer[..bytes_read]);
        
        // Decrypt in place
        let decrypted = opening_key
            .open_in_place(aead::Aad::from(&header.aad), &mut in_out)
            .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
        
        // Write plaintext
        output_file.write_all(decrypted)?;
    }
    
    Ok(())
}

/// Secure key storage for different platforms
pub mod key_storage {
    use super::Key;
    use std::io;
    
    /// Platform-specific key storage
    pub enum KeyStorage {
        /// macOS/iOS Keychain
        #[cfg(target_os = "macos")]
        Keychain,
        
        /// Android Keystore
        #[cfg(target_os = "android")]
        AndroidKeystore,
        
        /// Windows Credential Manager
        #[cfg(target_os = "windows")]
        WindowsCredential,
        
        /// Linux Secret Service
        #[cfg(target_os = "linux")]
        SecretService,
        
        /// File-based storage (fallback)
        File,
    }
    
    impl KeyStorage {
        /// Get the default key storage for the current platform
        pub fn default() -> Self {
            #[cfg(target_os = "macos")]
            return KeyStorage::Keychain;
            
            #[cfg(target_os = "android")]
            return KeyStorage::AndroidKeystore;
            
            #[cfg(target_os = "windows")]
            return KeyStorage::WindowsCredential;
            
            #[cfg(target_os = "linux")]
            return KeyStorage::SecretService;
            
            #[cfg(not(any(target_os = "macos", target_os = "android", target_os = "windows", target_os = "linux")))]
            return KeyStorage::File;
        }
        
        /// Store a key
        pub fn store_key(&self, key_name: &str, key: &Key) -> io::Result<()> {
            match self {
                #[cfg(target_os = "macos")]
                KeyStorage::Keychain => {
                    // TODO: Implement macOS Keychain integration
                    Err(io::Error::new(io::ErrorKind::Other, "Keychain storage not yet implemented"))
                }
                
                #[cfg(target_os = "android")]
                KeyStorage::AndroidKeystore => {
                    // TODO: Implement Android Keystore integration
                    Err(io::Error::new(io::ErrorKind::Other, "Android Keystore storage not yet implemented"))
                }
                
                #[cfg(target_os = "windows")]
                KeyStorage::WindowsCredential => {
                    // TODO: Implement Windows Credential Manager integration
                    Err(io::Error::new(io::ErrorKind::Other, "Windows Credential Manager storage not yet implemented"))
                }
                
                #[cfg(target_os = "linux")]
                KeyStorage::SecretService => {
                    // TODO: Implement Linux Secret Service integration
                    Err(io::Error::new(io::ErrorKind::Other, "Secret Service storage not yet implemented"))
                }
                
                KeyStorage::File => {
                    // Simple file-based storage (not secure)
                    use std::fs::{self, File};
                    use std::io::Write;
                    use std::path::PathBuf;
                    
                    // Create storage directory
                    let storage_dir = dirs::data_local_dir()
                        .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "Could not find data directory"))?
                        .join("psi_trajectory").join("keys");
                    
                    fs::create_dir_all(&storage_dir)?;
                    
                    // Create key file
                    let key_path = storage_dir.join(format!("{}.key", key_name));
                    let mut file = File::create(key_path)?;
                    
                    // Write key
                    file.write_all(key.as_bytes())?;
                    
                    Ok(())
                }
            }
        }
        
        /// Retrieve a key
        pub fn retrieve_key(&self, key_name: &str) -> io::Result<Key> {
            match self {
                #[cfg(target_os = "macos")]
                KeyStorage::Keychain => {
                    // TODO: Implement macOS Keychain integration
                    Err(io::Error::new(io::ErrorKind::Other, "Keychain retrieval not yet implemented"))
                }
                
                #[cfg(target_os = "android")]
                KeyStorage::AndroidKeystore => {
                    // TODO: Implement Android Keystore integration
                    Err(io::Error::new(io::ErrorKind::Other, "Android Keystore retrieval not yet implemented"))
                }
                
                #[cfg(target_os = "windows")]
                KeyStorage::WindowsCredential => {
                    // TODO: Implement Windows Credential Manager integration
                    Err(io::Error::new(io::ErrorKind::Other, "Windows Credential Manager retrieval not yet implemented"))
                }
                
                #[cfg(target_os = "linux")]
                KeyStorage::SecretService => {
                    // TODO: Implement Linux Secret Service integration
                    Err(io::Error::new(io::ErrorKind::Other, "Secret Service retrieval not yet implemented"))
                }
                
                KeyStorage::File => {
                    // Simple file-based storage (not secure)
                    use std::fs::File;
                    use std::io::Read;
                    use std::path::PathBuf;
                    
                    // Find storage directory
                    let storage_dir = dirs::data_local_dir()
                        .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "Could not find data directory"))?
                        .join("psi_trajectory").join("keys");
                    
                    // Open key file
                    let key_path = storage_dir.join(format!("{}.key", key_name));
                    let mut file = File::open(key_path)?;
                    
                    // Read key
                    let mut key_bytes = [0u8; super::KEY_LENGTH];
                    file.read_exact(&mut key_bytes)?;
                    
                    Ok(Key::new(key_bytes))
                }
            }
        }
        
        /// Delete a key
        pub fn delete_key(&self, key_name: &str) -> io::Result<()> {
            match self {
                #[cfg(target_os = "macos")]
                KeyStorage::Keychain => {
                    // TODO: Implement macOS Keychain integration
                    Err(io::Error::new(io::ErrorKind::Other, "Keychain deletion not yet implemented"))
                }
                
                #[cfg(target_os = "android")]
                KeyStorage::AndroidKeystore => {
                    // TODO: Implement Android Keystore integration
                    Err(io::Error::new(io::ErrorKind::Other, "Android Keystore deletion not yet implemented"))
                }
                
                #[cfg(target_os = "windows")]
                KeyStorage::WindowsCredential => {
                    // TODO: Implement Windows Credential Manager integration
                    Err(io::Error::new(io::ErrorKind::Other, "Windows Credential Manager deletion not yet implemented"))
                }
                
                #[cfg(target_os = "linux")]
                KeyStorage::SecretService => {
                    // TODO: Implement Linux Secret Service integration
                    Err(io::Error::new(io::ErrorKind::Other, "Secret Service deletion not yet implemented"))
                }
                
                KeyStorage::File => {
                    // Simple file-based storage (not secure)
                    use std::fs;
                    use std::path::PathBuf;
                    
                    // Find storage directory
                    let storage_dir = dirs::data_local_dir()
                        .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "Could not find data directory"))?
                        .join("psi_trajectory").join("keys");
                    
                    // Delete key file
                    let key_path = storage_dir.join(format!("{}.key", key_name));
                    fs::remove_file(key_path)?;
                    
                    Ok(())
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;
    
    #[test]
    fn test_key_generation() {
        let key = Key::generate().unwrap();
        assert_eq!(key.as_bytes().len(), KEY_LENGTH);
    }
    
    #[test]
    fn test_key_from_password() {
        let password = b"test_password";
        
        // Test direct key derivation
        let key_direct = Key::from_password(password, KeyDerivation::Direct).unwrap();
        assert_eq!(&key_direct.as_bytes()[..password.len()], password);
        
        // Test PBKDF2 key derivation
        let salt = [0u8; 16];
        let key_pbkdf2 = Key::from_password(
            password,
            KeyDerivation::Pbkdf2 {
                iterations: 1000,
                salt,
            },
        ).unwrap();
        
        // PBKDF2 should produce a different key than direct
        assert_ne!(key_direct.as_bytes(), key_pbkdf2.as_bytes());
        
        // Same password and salt should produce the same key
        let key_pbkdf2_again = Key::from_password(
            password,
            KeyDerivation::Pbkdf2 {
                iterations: 1000,
                salt,
            },
        ).unwrap();
        assert_eq!(key_pbkdf2.as_bytes(), key_pbkdf2_again.as_bytes());
    }
    
    #[test]
    fn test_encryption_header() {
        let header = EncryptionHeader::default();
        let mut buffer = Cursor::new(Vec::new());
        
        // Write and read back
        header.write(&mut buffer).unwrap();
        buffer.set_position(0);
        let read_header = EncryptionHeader::read(&mut buffer).unwrap();
        
        // Compare
        assert_eq!(read_header.magic, header.magic);
        assert_eq!(read_header.algorithm, header.algorithm);
        assert_eq!(read_header.initial_nonce, header.initial_nonce);
        
        // Check key derivation matches
        match (header.key_derivation, read_header.key_derivation) {
            (KeyDerivation::Direct, KeyDerivation::Direct) => {
                // Both are Direct, good
            }
            (
                KeyDerivation::Pbkdf2 {
                    iterations: it1,
                    salt: salt1,
                },
                KeyDerivation::Pbkdf2 {
                    iterations: it2,
                    salt: salt2,
                },
            ) => {
                assert_eq!(it1, it2);
                assert_eq!(salt1, salt2);
            }
            _ => {
                panic!("Key derivation methods don't match");
            }
        }
    }
    
    #[test]
    fn test_encrypt_decrypt() {
        let plaintext = b"This is a test message";
        let key = Key::generate().unwrap();
        
        // Encrypt
        let mut plaintext_reader = Cursor::new(plaintext.to_vec());
        let mut ciphertext = Vec::new();
        encrypt(&mut plaintext_reader, &mut ciphertext, &key, Algorithm::default(), Vec::new()).unwrap();
        
        // Decrypt
        let mut ciphertext_reader = Cursor::new(ciphertext);
        let mut decrypted = Vec::new();
        decrypt(&mut ciphertext_reader, &mut decrypted, &key).unwrap();
        
        // Compare
        assert_eq!(decrypted, plaintext);
    }
    
    #[test]
    fn test_encrypt_decrypt_with_wrong_key() {
        let plaintext = b"This is a test message";
        let key = Key::generate().unwrap();
        let wrong_key = Key::generate().unwrap();
        
        // Encrypt with correct key
        let mut plaintext_reader = Cursor::new(plaintext.to_vec());
        let mut ciphertext = Vec::new();
        encrypt(&mut plaintext_reader, &mut ciphertext, &key, Algorithm::default(), Vec::new()).unwrap();
        
        // Attempt to decrypt with wrong key
        let mut ciphertext_reader = Cursor::new(ciphertext);
        let mut decrypted = Vec::new();
        let result = decrypt(&mut ciphertext_reader, &mut decrypted, &wrong_key);
        
        // Should fail
        assert!(result.is_err());
    }
    
    #[test]
    fn test_encrypt_decrypt_large_data() {
        // Generate 1 MB of random data
        let mut rng = ring::rand::SystemRandom::new();
        let mut plaintext = vec![0u8; 1024 * 1024];
        rng.fill(&mut plaintext).unwrap();
        
        let key = Key::generate().unwrap();
        
        // Encrypt
        let mut plaintext_reader = Cursor::new(plaintext.clone());
        let mut ciphertext = Vec::new();
        encrypt(&mut plaintext_reader, &mut ciphertext, &key, Algorithm::default(), Vec::new()).unwrap();
        
        // Decrypt
        let mut ciphertext_reader = Cursor::new(ciphertext);
        let mut decrypted = Vec::new();
        decrypt(&mut ciphertext_reader, &mut decrypted, &key).unwrap();
        
        // Compare
        assert_eq!(decrypted, plaintext);
    }
}
