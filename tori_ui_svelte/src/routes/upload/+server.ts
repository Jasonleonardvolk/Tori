// +server.ts — SIMPLE AND WORKING: No progress_id complexity!
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// TypeScript fallback concept extractor
function extractConcepts(text: string, filename: string): string[] {
  const concepts: string[] = [];
  const lowerText = text.toLowerCase();
  const lowerFilename = filename.toLowerCase();

  if (filename.endsWith('.pdf')) concepts.push('PDF Document');
  if (lowerText.includes('abstract') || lowerText.includes('introduction') || lowerText.includes('methodology')) concepts.push('Academic Paper');
  if (lowerText.includes('research') || lowerText.includes('study') || lowerText.includes('analysis')) concepts.push('Research');
  if (lowerText.includes('conclusion') || lowerText.includes('results') || lowerText.includes('findings')) concepts.push('Study Results');
  if (lowerText.includes('algorithm') || lowerText.includes('method') || lowerText.includes('approach')) concepts.push('Technical Method');
  if (lowerText.includes('ai') || lowerText.includes('artificial intelligence') || lowerText.includes('machine learning')) concepts.push('Artificial Intelligence');
  if (lowerText.includes('neural') || lowerText.includes('network') || lowerText.includes('deep learning')) concepts.push('Neural Networks');
  if (lowerText.includes('cognitive') || lowerText.includes('consciousness') || lowerText.includes('memory')) concepts.push('Cognitive Science');
  if (lowerText.includes('philosophy') || lowerText.includes('ethics') || lowerText.includes('theory')) concepts.push('Philosophy');
  if (lowerText.includes('data') || lowerText.includes('dataset') || lowerText.includes('statistics')) concepts.push('Data Science');
  if (lowerText.includes('quantum') || lowerText.includes('physics') || lowerText.includes('particle')) concepts.push('Physics');
  if (lowerText.includes('biology') || lowerText.includes('genetic') || lowerText.includes('evolution')) concepts.push('Biology');
  if (lowerText.includes('mathematics') || lowerText.includes('theorem') || lowerText.includes('proof')) concepts.push('Mathematics');
  if (lowerText.includes('computer') || lowerText.includes('software') || lowerText.includes('programming')) concepts.push('Computer Science');
  if (lowerText.includes('learning') || lowerText.includes('education') || lowerText.includes('training')) concepts.push('Learning');
  if (lowerFilename.includes('report')) concepts.push('Report');
  if (lowerFilename.includes('manual') || lowerFilename.includes('guide')) concepts.push('Documentation');
  if (lowerFilename.includes('spec') || lowerFilename.includes('requirement')) concepts.push('Specification');

  concepts.push('ScholarSphere Document');
  return [...new Set(concepts)];
}

// ELFIN++ Trigger - Server-side compatible
function triggerELFINUpload(filename: string, text: string, concepts: string[]) {
  try {
    console.log('🧬 [ELFIN++] onUpload triggered:', {
      filename,
      conceptCount: concepts.length,
      preview: text.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
      source: 'scholarsphere'
    });
    
    // Log for any listening services
    console.log('🧬 [ELFIN++] Event Data:', JSON.stringify({
      type: 'tori:upload',
      filename,
      concepts,
      textPreview: text.substring(0, 500),
      timestamp: new Date().toISOString(),
      source: 'scholarsphere'
    }));
    
    return true;
  } catch (err) {
    console.warn('🧬 [ELFIN++] hook failed:', err);
    return false;
  }
}

export const POST: RequestHandler = async ({ request, locals }) => {
  console.log('📥 [UPLOAD] Processing upload request...');
  
  // 🛡️ Security check
  if (!locals.user || locals.user.role !== 'admin') {
    console.log('❌ [UPLOAD] Access denied - admin role required');
    throw error(403, 'Admin access required for document uploads');
  }
  
  console.log(`👤 [UPLOAD] User authorized: ${locals.user.name}`);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('❌ [UPLOAD] No file in request');
      throw error(400, 'No file uploaded');
    }

    console.log(`📁 [UPLOAD] File received: ${file.name} (${file.size} bytes, ${file.type})`);

    // 🛡️ Validation
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      console.log(`❌ [UPLOAD] File too large: ${file.size} bytes`);
      throw error(400, 'File too large (max 50MB)');
    }

    const allowedTypes = ['application/pdf', 'text/plain', 'application/json'];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      console.log(`❌ [UPLOAD] Invalid file type: ${file.type}`);
      throw error(400, 'Unsupported file type. PDF, TXT, and JSON files only.');
    }

    // 🛡️ Sanitize filename
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100);
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}_${sanitizedFilename}`;

    console.log(`📋 [UPLOAD] Sanitized filename: ${uniqueFilename}`);

    // 💾 Save file to disk
    const uploadDir = join(process.cwd(), 'data', 'sphere', 'admin');
    if (!existsSync(uploadDir)) {
      console.log(`📁 [UPLOAD] Creating upload directory: ${uploadDir}`);
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, uniqueFilename);
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(filePath, new Uint8Array(arrayBuffer));

    console.log(`💾 [UPLOAD] File saved: ${filePath}`);

    // ========== STEP 1: Send file path to FastAPI ==========
    console.log('🚀 [UPLOAD] STEP 1: Starting FastAPI extraction...');
    console.log(`📂 [UPLOAD] File path: ${filePath}`);
    
    let conceptNames: string[] = [];
    let apiUsed = false;
    let method = 'typescript_fallback';
    let extractedText = '';
    let pythonResult: any = null;
    let processingTime = 0;

    try {
      const startTime = Date.now();
      
      // 📡 SIMPLE PAYLOAD: No progress_id complexity!
      const payload = {
        file_path: filePath,
        filename: file.name,
        content_type: file.type
      };
      
      console.log('📤 [UPLOAD] Sending JSON payload to FastAPI:', {
        file_path: filePath,
        filename: file.name,
        content_type: file.type
      });
      
      console.log('⏱️ [UPLOAD] Using 5 minute timeout...');
      
      const res = await fetch('http://localhost:8002/extract', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(300000) // 5 minutes
      });

      processingTime = (Date.now() - startTime) / 1000;
      console.log(`📊 [UPLOAD] FastAPI responded in ${processingTime}s with status: ${res.status}`);

      if (res.ok) {
        console.log('📦 [UPLOAD] Reading JSON response...');
        pythonResult = await res.json();
        console.log('📦 [UPLOAD] JSON response received successfully');
        console.log(`🎯 [UPLOAD] Python result preview:`, {
          concept_count: pythonResult.concept_count,
          extraction_method: pythonResult.extraction_method,
          status: pythonResult.status,
          purity_based: pythonResult.purity_based
        });
        
        conceptNames = pythonResult.concept_names || [];
        method = pythonResult.extraction_method || 'purity_based_universal_pipeline';
        apiUsed = true;
        
        console.log('✅ [UPLOAD] FastAPI SUCCESS:', {
          conceptCount: conceptNames.length,
          method: method,
          processingTime: processingTime,
          purityBased: pythonResult.purity_based
        });
        
        console.log('📊 [UPLOAD] Sample extracted concepts:', conceptNames.slice(0, 10));
        
        // Log purity analysis if available
        if (pythonResult.purity_analysis) {
          const purity = pythonResult.purity_analysis;
          console.log('🏆 [UPLOAD] Purity Analysis Results:', {
            raw_concepts: purity.raw_concepts,
            pure_concepts: purity.pure_concepts,
            efficiency: purity.purity_efficiency,
            distribution: purity.distribution
          });
        }
        
      } else {
        console.error(`❌ [UPLOAD] FastAPI HTTP error: ${res.status} ${res.statusText}`);
        const errorText = await res.text().catch(e => `Failed to read error: ${e}`);
        console.error(`❌ [UPLOAD] Error response body:`, errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    } catch (err: any) {
      console.error('❌ [UPLOAD] Fetch to FastAPI failed:', {
        name: err.name,
        message: err.message,
        cause: err.cause
      });
      
      // Enhanced error categorization
      if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
        console.error('⏰ [UPLOAD] TIMEOUT: FastAPI took longer than 5 minutes');
        console.error('💡 [UPLOAD] Consider implementing async processing for very large PDFs');
      } else if (err.message.includes('ECONNREFUSED')) {
        console.error('🚫 [UPLOAD] CONNECTION REFUSED: FastAPI server not running or not accepting connections');
      } else if (err.message.includes('ENOTFOUND')) {
        console.error('🌐 [UPLOAD] HOST NOT FOUND: Cannot resolve localhost:8002');
      } else if (err.message.includes('ECONNRESET') || err.message.includes('10054')) {
        console.error('🔌 [UPLOAD] CONNECTION RESET: This should NOT happen with file path approach!');
        console.error('🔍 [UPLOAD] Check FastAPI logs for processing errors');
      } else if (err.name === 'AbortError') {
        console.error('🛑 [UPLOAD] REQUEST ABORTED: Fetch was cancelled');
      } else {
        console.error('🤔 [UPLOAD] UNKNOWN NETWORK ERROR - investigate further');
      }
      
      console.warn('🔄 [UPLOAD] Proceeding with TypeScript fallback...');
    }

    // ========== STEP 2: Fallback TypeScript Extraction ==========
    if (!apiUsed || conceptNames.length === 0) {
      console.log('🔄 [UPLOAD] STEP 2: Using TypeScript fallback extraction...');
      extractedText = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
      conceptNames = extractConcepts(extractedText, file.name);
      method = 'typescript_fallback';
      
      console.log(`✅ [UPLOAD] TypeScript fallback complete: ${conceptNames.length} concepts`);
      console.log('📊 [UPLOAD] Fallback concepts:', conceptNames);
    }

    // 🧬 Convert concept names to full concept objects
    const concepts = conceptNames.map((name, index) => ({
      name,
      score: Math.max(0.4, 0.95 - index * 0.03), // Descending scores from 0.95 to 0.4
      method,
      source: {
        python_extraction: apiUsed,
        fallback_used: !apiUsed,
        rank: index + 1
      },
      context: apiUsed ? `Python-extracted concept: ${name}` : `Fallback-extracted concept: ${name}`,
      metadata: {
        extraction_method: method,
        processing_time: processingTime,
        file_type: file.type,
        file_size: file.size,
        purity_based: pythonResult?.purity_based || false
      }
    }));

    console.log(`🧬 [UPLOAD] Created ${concepts.length} concept objects`);

    // 🧬 Trigger ELFIN++ processing
    const elfinTriggered = triggerELFINUpload(file.name, extractedText || '[Binary file - text not extracted]', conceptNames);

    // 📊 Prepare comprehensive response
    const documentData = {
      id: `doc_${timestamp}`,
      filename: file.name,
      uniqueFilename,
      size: file.size,
      type: file.type,
      concepts: concepts,
      uploadedAt: new Date().toISOString(),
      uploadedBy: locals.user.name,
      filePath,
      elfinTriggered,
      summary: `Extraction found ${concepts.length} concepts using ${method}`,
      extractionMethod: method,
      conceptCount: concepts.length,
      pythonApiUsed: apiUsed,
      processingTime: processingTime,
      fallbackUsed: !apiUsed,
      purityBased: pythonResult?.purity_based || false,
      purityAnalysis: pythonResult?.purity_analysis || null
    };

    console.log('📚 [UPLOAD] UPLOAD COMPLETE:', {
      filename: file.name,
      size: file.size,
      concepts: concepts.length,
      method: method,
      apiUsed: apiUsed,
      processingTime: processingTime,
      elfinTriggered: elfinTriggered,
      fallbackUsed: !apiUsed,
      purityBased: pythonResult?.purity_based || false
    });

    // 🎯 Return complete response
    return json({
      success: true,
      message: `Document uploaded and processed successfully (${method})`,
      filename: file.name,
      size: file.size,
      concepts: concepts, // Full concept objects array
      conceptCount: concepts.length,
      extractionMethod: method,
      apiUsed: apiUsed,
      elfinTriggered: elfinTriggered,
      processingTime: processingTime,
      document: documentData, // Complete document object for frontend
      pythonResult: pythonResult, // Include raw Python result for debugging
      fallbackUsed: !apiUsed,
      purityBased: pythonResult?.purity_based || false,
      purityAnalysis: pythonResult?.purity_analysis || null
    });

  } catch (err) {
    console.error('💥 [UPLOAD] Upload processing failed:', err);
    
    if (err instanceof Error && err.message.includes('Admin access required')) {
      throw err;
    }
    
    throw error(500, 'Upload processing failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
  }
};
