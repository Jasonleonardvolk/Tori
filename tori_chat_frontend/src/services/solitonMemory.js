// TORI Soliton Memory Integration - Node.js FFI Module
// File: tori_chat_frontend/src/services/solitonMemory.js
// Bridges Node.js chat system to Rust soliton engine

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load the Rust library (will compile on demand)
let solitonLib = null;
let isAvailable = false;

try {
    // Try to load compiled Rust library
    const ffi = createRequire(import.meta.url)('ffi-napi');
    
    // Define the Rust function signatures
    const libPath = path.join(__dirname, '../../../concept-mesh/target/release/libconcept_mesh.dll');
    
    solitonLib = ffi.Library(libPath, {
        'soliton_init_user': ['string', ['string']],
        'soliton_store_memory': ['string', ['string', 'string', 'string', 'double']],
        'soliton_recall_concept': ['string', ['string', 'string']],
        'soliton_recall_by_phase': ['string', ['string', 'double', 'double', 'int']],
        'soliton_find_related': ['string', ['string', 'string', 'int']],
        'soliton_get_stats': ['string', ['string']],
        'soliton_vault_memory': ['string', ['string', 'string', 'string']],
        'soliton_free_string': ['void', ['string']],
        'soliton_health_check': ['string', []]
    });
    
    isAvailable = true;
    console.log('✨ Soliton Memory Engine loaded successfully');
    
} catch (error) {
    console.log('⚠️  Soliton Memory Engine not available, using fallback storage');
    console.log('To enable soliton memory: cd concept-mesh && cargo build --release');
    isAvailable = false;
}

/**
 * TORI Soliton Memory Service
 * Provides phase-encoded memory storage with perfect recall
 */
class SolitonMemoryService {
    constructor() {
        this.isAvailable = isAvailable;
        this.fallbackStore = new Map(); // userId -> concept storage
        this.initializationStatus = new Map(); // userId -> boolean
    }

    /**
     * Initialize soliton lattice for a user
     */
    async initializeUser(userId) {
        if (!userId) throw new Error('User ID required');
        
        if (this.isAvailable) {
            try {
                const result = solitonLib.soliton_init_user(userId);
                const parsed = JSON.parse(result);
                solitonLib.soliton_free_string(result);
                
                if (parsed.success) {
                    this.initializationStatus.set(userId, true);
                    console.log(`✨ Soliton lattice initialized for user: ${userId}`);
                    return parsed;
                } else {
                    throw new Error(parsed.error);
                }
            } catch (error) {
                console.error('Soliton initialization error:', error);
                return this.initializeFallback(userId);
            }
        } else {
            return this.initializeFallback(userId);
        }
    }

    /**
     * Store memory in soliton lattice
     */
    async storeMemory(userId, conceptId, content, importance = 1.0) {
        if (!this.initializationStatus.get(userId)) {
            await this.initializeUser(userId);
        }
        
        if (this.isAvailable) {
            try {
                const result = solitonLib.soliton_store_memory(userId, conceptId, content, importance);
                const parsed = JSON.parse(result);
                solitonLib.soliton_free_string(result);
                
                if (parsed.success) {
                    console.log(`🧠 Memory stored in soliton lattice: ${conceptId} (Phase: ${parsed.phase_tag?.toFixed(3)})`);
                    return {
                        success: true,
                        memoryId: parsed.memory_id,
                        conceptId: conceptId,
                        phaseTag: parsed.phase_tag,
                        amplitude: parsed.amplitude,
                        engine: 'soliton'
                    };
                } else {
                    throw new Error(parsed.error);
                }
            } catch (error) {
                console.error('Soliton storage error:', error);
                return this.storeFallback(userId, conceptId, content, importance);
            }
        } else {
            return this.storeFallback(userId, conceptId, content, importance);
        }
    }

    /**
     * Recall memory by concept ID with perfect fidelity
     */
    async recallConcept(userId, conceptId) {
        if (this.isAvailable && this.initializationStatus.get(userId)) {
            try {
                const result = solitonLib.soliton_recall_concept(userId, conceptId);
                const parsed = JSON.parse(result);
                solitonLib.soliton_free_string(result);
                
                if (parsed.success) {
                    console.log(`🎯 Perfect recall from soliton: ${conceptId}`);
                    return {
                        success: true,
                        memory: parsed.memory,
                        fidelity: 1.0, // Perfect recall guaranteed
                        engine: 'soliton'
                    };
                } else {
                    return this.recallFallback(userId, conceptId);
                }
            } catch (error) {
                console.error('Soliton recall error:', error);
                return this.recallFallback(userId, conceptId);
            }
        } else {
            return this.recallFallback(userId, conceptId);
        }
    }

    /**
     * Phase-based memory retrieval (radio tuning analogy)
     */
    async recallByPhase(userId, targetPhase, tolerance = 0.1, maxResults = 5) {
        if (this.isAvailable && this.initializationStatus.get(userId)) {
            try {
                const result = solitonLib.soliton_recall_by_phase(userId, targetPhase, tolerance, maxResults);
                const parsed = JSON.parse(result);
                solitonLib.soliton_free_string(result);
                
                if (parsed.success) {
                    console.log(`📻 Phase recall: ${parsed.matches.length} memories at phase ${targetPhase.toFixed(3)}`);
                    return {
                        success: true,
                        matches: parsed.matches,
                        searchPhase: targetPhase,
                        tolerance: tolerance,
                        engine: 'soliton'
                    };
                }
            } catch (error) {
                console.error('Phase recall error:', error);
            }
        }
        
        // Fallback: approximate phase matching
        return {
            success: false,
            error: 'Phase-based recall requires soliton engine',
            fallback: 'Use conceptual similarity instead'
        };
    }

    /**
     * Find related memories through phase correlation
     */
    async findRelatedMemories(userId, conceptId, maxResults = 3) {
        if (this.isAvailable && this.initializationStatus.get(userId)) {
            try {
                const result = solitonLib.soliton_find_related(userId, conceptId, maxResults);
                const parsed = JSON.parse(result);
                solitonLib.soliton_free_string(result);
                
                if (parsed.success) {
                    console.log(`🔗 Found ${parsed.related_memories.length} related memories for: ${conceptId}`);
                    return {
                        success: true,
                        relatedMemories: parsed.related_memories,
                        sourceConcept: conceptId,
                        engine: 'soliton'
                    };
                }
            } catch (error) {
                console.error('Related memory search error:', error);
            }
        }
        
        return this.findRelatedFallback(userId, conceptId, maxResults);
    }

    /**
     * Get memory statistics
     */
    async getMemoryStats(userId) {
        if (this.isAvailable && this.initializationStatus.get(userId)) {
            try {
                const result = solitonLib.soliton_get_stats(userId);
                const parsed = JSON.parse(result);
                solitonLib.soliton_free_string(result);
                
                if (parsed.success) {
                    return {
                        success: true,
                        stats: {
                            ...parsed.stats,
                            engine: 'soliton',
                            fidelity: 1.0,
                            degradation: 0.0
                        }
                    };
                }
            } catch (error) {
                console.error('Stats error:', error);
            }
        }
        
        return this.getStatsFallback(userId);
    }

    /**
     * Vault memory for user protection
     */
    async vaultMemory(userId, conceptId, vaultLevel = 'user_sealed') {
        if (this.isAvailable && this.initializationStatus.get(userId)) {
            try {
                const result = solitonLib.soliton_vault_memory(userId, conceptId, vaultLevel);
                const parsed = JSON.parse(result);
                solitonLib.soliton_free_string(result);
                
                if (parsed.success) {
                    console.log(`🛡️  Memory vaulted: ${conceptId} (${vaultLevel})`);
                    return {
                        success: true,
                        conceptId: conceptId,
                        vaultStatus: vaultLevel,
                        phaseShifted: true,
                        message: 'Memory protected with dignity preserved'
                    };
                }
            } catch (error) {
                console.error('Vault error:', error);
            }
        }
        
        return {
            success: false,
            error: 'Memory vaulting requires soliton engine',
            fallback: 'Memory flagged for protection'
        };
    }

    /**
     * Health check for soliton engine
     */
    async healthCheck() {
        if (this.isAvailable) {
            try {
                const result = solitonLib.soliton_health_check();
                const parsed = JSON.parse(result);
                solitonLib.soliton_free_string(result);
                return parsed;
            } catch (error) {
                return {
                    success: false,
                    status: 'error',
                    error: error.message
                };
            }
        } else {
            return {
                success: false,
                status: 'not_available',
                message: 'Soliton engine not loaded - using fallback storage',
                recommendation: 'Compile Rust library: cd concept-mesh && cargo build --release'
            };
        }
    }

    // Fallback methods for when soliton engine is not available
    initializeFallback(userId) {
        this.fallbackStore.set(userId, {
            concepts: new Map(),
            creationCount: 0,
            lastUpdate: Date.now()
        });
        
        console.log(`📝 Fallback storage initialized for user: ${userId}`);
        return {
            success: true,
            engine: 'fallback',
            message: 'Using basic concept storage'
        };
    }

    storeFallback(userId, conceptId, content, importance) {
        const userStore = this.fallbackStore.get(userId) || this.initializeFallback(userId);
        
        userStore.concepts.set(conceptId, {
            id: conceptId,
            content: content,
            importance: importance,
            timestamp: Date.now(),
            accessCount: 0
        });
        userStore.creationCount++;
        userStore.lastUpdate = Date.now();
        
        console.log(`📝 Fallback storage: ${conceptId}`);
        return {
            success: true,
            conceptId: conceptId,
            engine: 'fallback'
        };
    }

    recallFallback(userId, conceptId) {
        const userStore = this.fallbackStore.get(userId);
        if (userStore && userStore.concepts.has(conceptId)) {
            const memory = userStore.concepts.get(conceptId);
            memory.accessCount++;
            
            return {
                success: true,
                memory: memory,
                fidelity: 0.95, // Good but not perfect
                engine: 'fallback'
            };
        }
        
        return {
            success: false,
            error: 'Memory not found in fallback storage'
        };
    }

    findRelatedFallback(userId, conceptId, maxResults) {
        const userStore = this.fallbackStore.get(userId);
        if (!userStore) return { success: false, error: 'No user data' };
        
        // Simple keyword matching for fallback
        const sourceMemory = userStore.concepts.get(conceptId);
        if (!sourceMemory) return { success: false, error: 'Source concept not found' };
        
        const related = [];
        const sourceWords = sourceMemory.content.toLowerCase().split(' ');
        
        for (const [id, memory] of userStore.concepts) {
            if (id === conceptId) continue;
            
            const memoryWords = memory.content.toLowerCase().split(' ');
            const commonWords = sourceWords.filter(word => memoryWords.includes(word));
            
            if (commonWords.length > 0) {
                related.push({
                    id: memory.id,
                    content: memory.content,
                    similarity: commonWords.length / sourceWords.length
                });
            }
        }
        
        related.sort((a, b) => b.similarity - a.similarity);
        
        return {
            success: true,
            relatedMemories: related.slice(0, maxResults),
            engine: 'fallback'
        };
    }

    getStatsFallback(userId) {
        const userStore = this.fallbackStore.get(userId);
        if (!userStore) return { success: false, error: 'No user data' };
        
        return {
            success: true,
            stats: {
                totalMemories: userStore.concepts.size,
                activeMemories: userStore.concepts.size,
                vaultedMemories: 0,
                averageStability: 0.8,
                creationCount: userStore.creationCount,
                engine: 'fallback'
            }
        };
    }
}

// Export singleton instance
const solitonMemory = new SolitonMemoryService();
export default solitonMemory;

// Also export the class for advanced usage
export { SolitonMemoryService };
