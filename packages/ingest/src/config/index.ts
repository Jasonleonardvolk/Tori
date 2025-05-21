/**
 * Ingest package configuration
 * 
 * Provides configuration for file uploads and ingest processes
 */

/**
 * Upload directory configuration
 */
export interface UploadConfig {
  /** Base directory for uploads */
  uploadDir: string;
  
  /** Maximum file size in bytes (default: 100MB) */
  maxFileSize: number;
  
  /** Maximum number of files per upload (default: 10) */
  maxFiles: number;
  
  /** Allowed file types */
  allowedFileTypes: string[];
}

/**
 * Default upload configuration
 */
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxFiles: 10,
  allowedFileTypes: ['.pdf', '.docx', '.txt', '.md']
};

/**
 * Get configured upload directory
 * 
 * @returns The configured upload directory path
 */
export function getUploadDir(): string {
  return process.env.UPLOAD_DIR || DEFAULT_UPLOAD_CONFIG.uploadDir;
}

/**
 * Get application-specific upload directory
 * 
 * @param appVariant App variant (chat, enterprise, ide)
 * @returns App-specific upload directory path
 */
export function getAppUploadDir(appVariant: string): string {
  const baseDir = getUploadDir();
  return `${baseDir}/${appVariant}`;
}
