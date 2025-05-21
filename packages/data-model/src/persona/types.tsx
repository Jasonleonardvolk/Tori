/**
 * Persona type definitions for ITORI platform
 */

/**
 * Base Persona interface
 * 
 * Defines the core properties of a persona in the ITORI platform
 */
export interface Persona {
  /** Unique identifier for the persona */
  id: string;
  
  /** Display name of the persona */
  name: string;
  
  /** Emoji icon representing the persona */
  icon: string;
  
  /** Theme color for the persona (CSS variable or hex) */
  color: string;
  
  /** Optional MBTI personality type */
  mbti?: string;
  
  /** Optional description of the persona's role/capabilities */
  description?: string;
  
  /** Optional array of tags/categories this persona belongs to */
  tags?: string[];
  
  /** Optional persona-specific settings */
  settings?: Record<string, any>;
}

/**
 * Persona with tenant information for enterprise deployments
 */
export interface EnterprisePersona extends Persona {
  /** Tenant IDs that can access this persona (empty array means all tenants) */
  tenantIds: string[];
  
  /** Whether this persona requires special permissions */
  requiresSpecialPermission?: boolean;
}

/**
 * Personas organized by categories
 */
export interface PersonaGroup {
  /** Group identifier */
  id: string;
  
  /** Display name for the group */
  name: string;
  
  /** Personas in this group */
  personas: Persona[];
}
