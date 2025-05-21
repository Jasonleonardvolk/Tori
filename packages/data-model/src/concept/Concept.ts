/**
 * Concept.ts
 * 
 * Core concept data model for the iTori platform.
 * This defines the base interface for concepts used throughout the system.
 */

/**
 * Basic concept interface that represents a unit of knowledge
 * within the concept graph.
 */
export interface Concept {
  /** Unique identifier for the concept */
  id: string;
  
  /** Human-readable name of the concept */
  name: string;
  
  /** Domain or category this concept belongs to */
  domain?: string;
  
  /** Set of tags associated with this concept */
  tags?: Set<string>;
  
  /** Embedding vector for the concept (if available) */
  embedding?: number[];
  
  /** Timestamp when the concept was created */
  createdAt: number;
  
  /** Timestamp when the concept was last updated */
  updatedAt: number;
  
  /** Source information about where this concept came from */
  source?: {
    /** Document ID or source identifier */
    docId: string;
    
    /** Page or section number */
    location?: string;
    
    /** Name of the source */
    name?: string;
  };
  
  /** Optional metadata object for additional properties */
  metadata?: Record<string, any>;
}

/**
 * Factory function to create a new concept with defaults
 */
export function createConcept(
  id: string,
  name: string,
  options: Partial<Concept> = {}
): Concept {
  const now = Date.now();
  
  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    ...options
  };
}
