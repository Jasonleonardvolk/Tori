/**
 * Data Model Package for ITORI IDE
 * 
 * This package provides shared data models and types for ITORI applications.
 */

// Export persona models
export * from './persona';

/**
 * Concept type definition
 */
export interface Concept {
  id: string;
  name: string;
  description?: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Document type definition
 */
export interface Document {
  id: string;
  title: string;
  content: string;
  contentType: string;
  concepts?: string[]; // Array of concept IDs
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User preference settings
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  showConcepts: boolean;
  showPhaseVisualization: boolean;
  enableDebugTools: boolean;
}

/**
 * Application state
 */
export interface AppState {
  currentDocument?: Document;
  selectedConcepts: string[];
  userPreferences: UserPreferences;
}

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  fontSize: 14,
  showConcepts: true,
  showPhaseVisualization: false,
  enableDebugTools: false
};
