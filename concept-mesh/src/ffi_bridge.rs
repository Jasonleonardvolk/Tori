// TORI Soliton Memory FFI Bridge
// File: concept-mesh/src/ffi_bridge.rs
// Exposes Rust soliton memory to Node.js via FFI

use std::ffi::{CString, CStr};
use std::os::raw::c_char;
use serde_json;
use once_cell::sync::Mutex;
use std::collections::HashMap;

use crate::soliton_memory::{SolitonLattice, SolitonMemory, MemoryStats};

// Global lattice storage for each user
static USER_LATTICES: Mutex<HashMap<String, SolitonLattice>> = Mutex::new(HashMap::new());

// Helper to convert C string to Rust string
unsafe fn c_str_to_string(c_str: *const c_char) -> String {
    CStr::from_ptr(c_str).to_string_lossy().into_owned()
}

// Helper to convert Rust string to C string
fn string_to_c_str(s: String) -> *mut c_char {
    CString::new(s).unwrap().into_raw()
}

// Initialize soliton lattice for a user
#[no_mangle]
pub extern "C" fn soliton_init_user(user_id: *const c_char) -> *mut c_char {
    let user_id = unsafe { c_str_to_string(user_id) };
    
    let mut lattices = USER_LATTICES.lock().unwrap();
    lattices.insert(user_id.clone(), SolitonLattice::new(user_id.clone()));
    
    let result = serde_json::json!({
        "success": true,
        "user_id": user_id,
        "message": "Soliton lattice initialized"
    });
    
    string_to_c_str(result.to_string())
}

// Store memory in soliton lattice
#[no_mangle]
pub extern "C" fn soliton_store_memory(
    user_id: *const c_char,
    concept_id: *const c_char,
    content: *const c_char,
    importance: f64
) -> *mut c_char {
    let user_id = unsafe { c_str_to_string(user_id) };
    let concept_id = unsafe { c_str_to_string(concept_id) };
    let content = unsafe { c_str_to_string(content) };
    
    let mut lattices = USER_LATTICES.lock().unwrap();
    
    if let Some(lattice) = lattices.get_mut(&user_id) {
        match lattice.store_memory(concept_id.clone(), content, importance) {
            Ok(memory_id) => {
                let phase_tag = lattice.phase_registry.get(&concept_id).unwrap_or(&0.0);
                let result = serde_json::json!({
                    "success": true,
                    "memory_id": memory_id,
                    "concept_id": concept_id,
                    "phase_tag": phase_tag,
                    "amplitude": importance.sqrt(),
                    "message": "Memory stored in soliton lattice"
                });
                string_to_c_str(result.to_string())
            },
            Err(e) => {
                let result = serde_json::json!({
                    "success": false,
                    "error": e
                });
                string_to_c_str(result.to_string())
            }
        }
    } else {
        let result = serde_json::json!({
            "success": false,
            "error": "User lattice not found. Call soliton_init_user first."
        });
        string_to_c_str(result.to_string())
    }
}

// Recall memory by concept ID
#[no_mangle]
pub extern "C" fn soliton_recall_concept(
    user_id: *const c_char,
    concept_id: *const c_char
) -> *mut c_char {
    let user_id = unsafe { c_str_to_string(user_id) };
    let concept_id = unsafe { c_str_to_string(concept_id) };
    
    let mut lattices = USER_LATTICES.lock().unwrap();
    
    if let Some(lattice) = lattices.get_mut(&user_id) {
        if let Some(memory) = lattice.recall_by_concept(&concept_id) {
            let result = serde_json::json!({
                "success": true,
                "memory": {
                    "id": memory.id,
                    "concept_id": memory.concept_id,
                    "content": memory.content,
                    "phase_tag": memory.phase_tag,
                    "amplitude": memory.amplitude,
                    "stability": memory.stability,
                    "access_count": memory.access_count,
                    "emotional_signature": memory.emotional_signature,
                    "vault_status": memory.vault_status,
                    "last_accessed": memory.last_accessed.to_rfc3339()
                }
            });
            string_to_c_str(result.to_string())
        } else {
            let result = serde_json::json!({
                "success": false,
                "error": "Memory not found"
            });
            string_to_c_str(result.to_string())
        }
    } else {
        let result = serde_json::json!({
            "success": false,
            "error": "User lattice not found"
        });
        string_to_c_str(result.to_string())
    }
}

// Phase-based memory recall (radio tuning)
#[no_mangle]
pub extern "C" fn soliton_recall_by_phase(
    user_id: *const c_char,
    target_phase: f64,
    tolerance: f64,
    max_results: i32
) -> *mut c_char {
    let user_id = unsafe { c_str_to_string(user_id) };
    
    let mut lattices = USER_LATTICES.lock().unwrap();
    
    if let Some(lattice) = lattices.get_mut(&user_id) {
        let matches = lattice.recall_by_phase(target_phase, tolerance);
        let limited_matches: Vec<_> = matches.into_iter()
            .take(max_results as usize)
            .map(|memory| {
                serde_json::json!({
                    "id": memory.id,
                    "concept_id": memory.concept_id,
                    "content": memory.content,
                    "phase_tag": memory.phase_tag,
                    "amplitude": memory.amplitude,
                    "correlation": memory.correlate_with_signal(target_phase, tolerance)
                })
            })
            .collect();
            
        let result = serde_json::json!({
            "success": true,
            "matches": limited_matches,
            "search_phase": target_phase,
            "tolerance": tolerance
        });
        string_to_c_str(result.to_string())
    } else {
        let result = serde_json::json!({
            "success": false,
            "error": "User lattice not found"
        });
        string_to_c_str(result.to_string())
    }
}

// Find related memories through phase correlation
#[no_mangle]
pub extern "C" fn soliton_find_related(
    user_id: *const c_char,
    concept_id: *const c_char,
    max_results: i32
) -> *mut c_char {
    let user_id = unsafe { c_str_to_string(user_id) };
    let concept_id = unsafe { c_str_to_string(concept_id) };
    
    let mut lattices = USER_LATTICES.lock().unwrap();
    
    if let Some(lattice) = lattices.get_mut(&user_id) {
        let related = lattice.find_related_memories(&concept_id, max_results as usize);
        let related_json: Vec<_> = related.into_iter()
            .map(|memory| {
                serde_json::json!({
                    "id": memory.id,
                    "concept_id": memory.concept_id,
                    "content": memory.content,
                    "phase_tag": memory.phase_tag,
                    "amplitude": memory.amplitude
                })
            })
            .collect();
            
        let result = serde_json::json!({
            "success": true,
            "related_memories": related_json,
            "source_concept": concept_id
        });
        string_to_c_str(result.to_string())
    } else {
        let result = serde_json::json!({
            "success": false,
            "error": "User lattice not found"
        });
        string_to_c_str(result.to_string())
    }
}

// Get memory statistics
#[no_mangle]
pub extern "C" fn soliton_get_stats(user_id: *const c_char) -> *mut c_char {
    let user_id = unsafe { c_str_to_string(user_id) };
    
    let lattices = USER_LATTICES.lock().unwrap();
    
    if let Some(lattice) = lattices.get(&user_id) {
        let stats = lattice.get_memory_stats();
        let result = serde_json::json!({
            "success": true,
            "stats": stats
        });
        string_to_c_str(result.to_string())
    } else {
        let result = serde_json::json!({
            "success": false,
            "error": "User lattice not found"
        });
        string_to_c_str(result.to_string())
    }
}

// Vault memory for protection
#[no_mangle]
pub extern "C" fn soliton_vault_memory(
    user_id: *const c_char,
    concept_id: *const c_char,
    vault_level: *const c_char
) -> *mut c_char {
    let user_id = unsafe { c_str_to_string(user_id) };
    let concept_id = unsafe { c_str_to_string(concept_id) };
    let vault_level = unsafe { c_str_to_string(vault_level) };
    
    let mut lattices = USER_LATTICES.lock().unwrap();
    
    if let Some(lattice) = lattices.get_mut(&user_id) {
        if let Some(memory) = lattice.recall_by_concept(&concept_id) {
            use crate::soliton_memory::VaultStatus;
            
            let vault_status = match vault_level.as_str() {
                "user_sealed" => VaultStatus::UserSealed,
                "time_locked" => VaultStatus::TimeLocked,
                "deep_vault" => VaultStatus::DeepVault,
                _ => VaultStatus::Active,
            };
            
            memory.apply_vault_phase_shift(vault_status);
            
            let result = serde_json::json!({
                "success": true,
                "message": "Memory vaulted successfully",
                "concept_id": concept_id,
                "vault_status": vault_level,
                "new_phase": memory.phase_tag
            });
            string_to_c_str(result.to_string())
        } else {
            let result = serde_json::json!({
                "success": false,
                "error": "Memory not found"
            });
            string_to_c_str(result.to_string())
        }
    } else {
        let result = serde_json::json!({
            "success": false,
            "error": "User lattice not found"
        });
        string_to_c_str(result.to_string())
    }
}

// Free C string memory (important for preventing leaks)
#[no_mangle]
pub extern "C" fn soliton_free_string(s: *mut c_char) {
    unsafe {
        if s.is_null() { return; }
        CString::from_raw(s);
    };
}

// Health check for the soliton engine
#[no_mangle]
pub extern "C" fn soliton_health_check() -> *mut c_char {
    let lattices = USER_LATTICES.lock().unwrap();
    let result = serde_json::json!({
        "success": true,
        "status": "healthy",
        "engine": "TORI Soliton Memory",
        "version": "1.0.0",
        "active_users": lattices.len(),
        "features": [
            "Phase-encoded memory storage",
            "Matched-filter retrieval",
            "Emotional signature analysis",
            "Memory vault protection",
            "Topological stability"
        ]
    });
    string_to_c_str(result.to_string())
}
