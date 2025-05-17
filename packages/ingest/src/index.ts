/**
 * Ingest Package for ITORI IDE
 * 
 * This package provides utilities for ingesting documents into the ITORI platform,
 * with a focus on PDF handling and concept extraction.
 */

import { Document } from '@itori/data-model';

/**
 * Upload status types
 */
export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'complete' | 'error';

/**
 * Upload job type
 */
export interface UploadJob {
  id: string;
  filename: string;
  filesize: number;
  contentType: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Concept extraction result
 */
export interface ConceptExtractionResult {
  documentId: string;
  concepts: Array<{
    name: string;
    confidence: number;
    location?: number; // Position in document
  }>;
  extractionTime: number; // Time taken in milliseconds
}

/**
 * PDF upload options
 */
export interface PdfUploadOptions {
  extractConcepts?: boolean;
  splitIntoChunks?: boolean;
  maxChunkSize?: number;
  includeMetadata?: boolean;
}

/**
 * Default PDF upload options
 */
export const DEFAULT_PDF_UPLOAD_OPTIONS: PdfUploadOptions = {
  extractConcepts: true,
  splitIntoChunks: true,
  maxChunkSize: 4000,
  includeMetadata: true
};

/**
 * Utility function to check upload job status
 * 
 * @param jobId The upload job ID
 * @param apiUrl The API URL (default: from environment)
 * @returns Promise with the current job status
 */
export async function checkUploadStatus(
  jobId: string, 
  apiUrl?: string
): Promise<UploadJob> {
  const url = apiUrl || import.meta.env.VITE_ITORI_API_URL;
  
  if (!url) {
    throw new Error('API URL is required. Either provide it or set VITE_ITORI_API_URL.');
  }
  
  const response = await fetch(`${url}/api/uploads/${jobId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to check status: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Utility function to poll upload job status until complete
 * 
 * @param jobId The upload job ID
 * @param onProgress Progress callback
 * @param apiUrl The API URL (default: from environment)
 * @param intervalMs Polling interval in milliseconds
 * @returns Promise with the completed document
 */
export async function pollUploadStatus(
  jobId: string,
  onProgress?: (job: UploadJob) => void,
  apiUrl?: string,
  intervalMs = 1000
): Promise<Document> {
  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        const job = await checkUploadStatus(jobId, apiUrl);
        
        if (onProgress) {
          onProgress(job);
        }
        
        if (job.status === 'complete') {
          // Fetch the completed document
          const url = apiUrl || import.meta.env.VITE_ITORI_API_URL;
          const response = await fetch(`${url}/api/documents/${job.id}`);
          
          if (!response.ok) {
            reject(new Error(`Failed to fetch document: ${response.statusText}`));
            return;
          }
          
          const document = await response.json();
          resolve(document);
          return;
        } else if (job.status === 'error') {
          reject(new Error(job.error || 'Unknown error during processing'));
          return;
        }
        
        // Continue polling
        setTimeout(checkStatus, intervalMs);
      } catch (error) {
        reject(error);
      }
    };
    
    // Start polling
    checkStatus();
  });
}
