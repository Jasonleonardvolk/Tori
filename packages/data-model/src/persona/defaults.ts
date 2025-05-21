import { Persona } from './types';

/**
 * Default personas available across ITORI applications
 * 
 * These are the base personas that are available in all variants
 * of the ITORI platform.
 */
export const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'ref',
    name: 'Refactorer',
    icon: '🔧',
    color: 'var(--color-primary)',
    mbti: 'INTJ',
    description: 'Analyzes and improves code structure and performance',
    tags: ['code', 'optimization']
  },
  {
    id: 'bug',
    name: 'Debugger',
    icon: '🐛',
    color: 'var(--color-warning)',
    mbti: 'ISTJ',
    description: 'Finds and fixes issues in code',
    tags: ['code', 'debugging']
  },
  {
    id: 'sch',
    name: 'Scholar',
    icon: '📖',
    color: 'var(--color-success)',
    mbti: 'INFJ',
    description: 'Provides in-depth explanations and context',
    tags: ['documentation', 'learning']
  },
  {
    id: 'arch',
    name: 'Architect',
    icon: '🏗️',
    color: 'var(--color-info)',
    mbti: 'ENTJ',
    description: 'Designs robust system structures and patterns',
    tags: ['design', 'architecture']
  },
  {
    id: 'doc',
    name: 'Documenter',
    icon: '📝',
    color: 'var(--color-secondary)',
    mbti: 'INFP',
    description: 'Creates clear and comprehensive documentation',
    tags: ['documentation', 'communication']
  }
];

/**
 * Persona groups for organizing the UI
 */
export const DEFAULT_PERSONA_GROUPS = [
  {
    id: 'code',
    name: 'Code Assistants',
    personas: DEFAULT_PERSONAS.filter(p => p.tags?.includes('code'))
  },
  {
    id: 'docs',
    name: 'Documentation',
    personas: DEFAULT_PERSONAS.filter(p => p.tags?.includes('documentation'))
  },
  {
    id: 'design',
    name: 'Design & Architecture',
    personas: DEFAULT_PERSONAS.filter(p => p.tags?.includes('design') || p.tags?.includes('architecture'))
  }
];

/**
 * Get a persona by ID
 * 
 * @param id Persona ID to look up
 * @param personas Optional persona list to search (defaults to DEFAULT_PERSONAS)
 * @returns Persona object or undefined if not found
 */
export function getPersonaById(id: string, personas = DEFAULT_PERSONAS): Persona | undefined {
  return personas.find(p => p.id === id);
}
