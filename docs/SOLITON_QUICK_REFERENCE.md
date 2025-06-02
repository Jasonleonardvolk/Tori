# Soliton Memory Quick Reference Guide

## 🔍 Quick File Locations

### Core Implementations:
```
📁 Rust Core Engine
   └── concept-mesh/src/soliton_memory.rs

📁 JavaScript/Node.js
   ├── tori_chat_frontend/src/services/solitonMemory.js
   └── ImSpecial/soliton_user.js

📁 TypeScript Integration
   └── src/services/GhostSolitonIntegration.ts

📁 Documentation
   ├── docs/Soliton Memory Architecture Integration Guide.docx
   ├── docs/SolitonMemoryandArch.txt
   └── docs/SOLITON_MEMORY_COMPLETE_DOCUMENTATION.md
```

## 🚀 Quick Start Commands

### 1. Compile Rust Engine:
```bash
cd concept-mesh
cargo build --release
```

### 2. Run Demo:
```bash
cd ImSpecial
node demo_soliton_consciousness.js
```

### 3. Integrate in Your Code:
```javascript
// Import the service
import solitonMemory from './services/solitonMemory.js';

// Store a memory
const result = await solitonMemory.storeMemory(
    userId,
    conceptId,
    content,
    importance
);

// Retrieve by phase
const memories = await solitonMemory.recallByPhase(
    userId,
    targetPhase,
    tolerance,
    maxResults
);
```

## 🔑 Key Functions

### Rust (`soliton_memory.rs`):
- `SolitonMemory::new()` - Create new memory
- `evaluate_waveform()` - Get soliton wave at time t
- `correlate_with_signal()` - Phase correlation
- `apply_vault_phase_shift()` - Protect memory
- `SolitonLattice::store_memory()` - Store in lattice
- `recall_by_phase()` - Phase-based retrieval
- `find_related_memories()` - Associative recall

### JavaScript (`solitonMemory.js`):
- `initializeUser()` - Set up user lattice
- `storeMemory()` - Save memory with phase
- `recallConcept()` - Direct concept recall
- `recallByPhase()` - Phase-tuned retrieval
- `findRelatedMemories()` - Find associations
- `vaultMemory()` - Protect sensitive content

### User System (`soliton_user.js`):
- `SolitonUser.initialize()` - Create user consciousness
- `sendMessage()` - Process with memory
- `uploadDocument()` - Extract concepts
- `startVideoCall()` - Real-time memory
- `getMemoryStats()` - Memory analytics

## 📊 Key Patterns to Search For

### Finding Soliton Code:
```bash
# Search for core soliton patterns
grep -r "soliton" .
grep -r "phase_tag" .
grep -r "correlate_with_signal" .
grep -r "SolitonMemory" .
grep -r "emit_" .
grep -r "replay_" .
grep -r "fold_" .
```

### Key Structures:
```rust
// Rust
struct SolitonMemory
struct SolitonLattice
enum VaultStatus

// JavaScript
class SolitonMemoryService
class SolitonMemoryLattice
class SolitonUser
```

## 🧮 Core Equations

### Soliton Wave:
```
Si(t) = A·sech((t-t₀)/T)·exp[j(ω₀t + ψᵢ)]
```

### Phase Correlation:
```
correlation = (1 - |Δψ|/tolerance) × amplitude
```

### Vault Phase Shifts:
- Active: ψ
- UserSealed: ψ + π/4 (45°)
- TimeLocked: ψ + π/2 (90°)
- DeepVault: ψ + π (180°)

## 🎯 Common Use Cases

### 1. Store Conversation Memory:
```javascript
await solitonLattice.storeMemory(
    `conversation_${timestamp}`,
    messageContent,
    0.8 // importance
);
```

### 2. Find Related Concepts:
```javascript
const related = await solitonLattice.findRelatedMemories(
    currentConcept,
    5 // max results
);
```

### 3. Protect Sensitive Memory:
```javascript
if (emotionalSignature.requires_protection()) {
    memory.apply_vault_phase_shift(VaultStatus.UserSealed);
}
```

### 4. Phase-Based Search:
```javascript
// Like tuning a radio to memory frequency
const memories = await recallByPhase(
    targetPhase,
    0.1, // tolerance
    10   // max results
);
```

## 🛠️ Troubleshooting

### If Rust engine not loading:
1. Check if compiled: `ls concept-mesh/target/release/`
2. Compile if needed: `cd concept-mesh && cargo build --release`
3. Falls back to JavaScript automatically

### Memory not persisting:
1. Check if initialized: `await user.initialize()`
2. Verify phase tag assignment
3. Check memory stats: `await getMemoryStats()`

### Phase collision:
1. Increase phase tolerance
2. Use composite keys (phase + frequency)
3. Check for phase wraparound

## 📈 Performance Tips

1. **Batch Operations**: Store multiple memories together
2. **Phase Caching**: Cache frequently used phase tags
3. **Selective Retrieval**: Use phase tolerance wisely
4. **Memory Pruning**: Remove unused memories periodically

## 🔗 Integration Points

- **Concept Mesh**: Phase tags link to concept IDs
- **Ghost AI**: Phase states trigger personas
- **Memory Vault**: Protects via phase shifting
- **ALAN/TORI**: Koopman modes for spectral memory

Remember: Soliton memories are wave-based, not token-based. They persist indefinitely with perfect fidelity!
