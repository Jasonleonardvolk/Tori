import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:5000';

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return json({ error: 'No file provided' }, { status: 400 });
        }
        
        console.log('📤 Uploading file to Python server:', file.name, file.size);
        
        // Create form data for Python server
        const pythonFormData = new FormData();
        pythonFormData.append('pdf_file', file);
        pythonFormData.append('max_concepts', '50'); // Reasonable limit
        pythonFormData.append('dim', '16');
        
        // Forward to Python PDF processing server
        const response = await fetch(`${PYTHON_SERVER_URL}/upload`, {
            method: 'POST',
            body: pythonFormData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Python server error:', response.status, errorText);
            return json({ 
                error: `PDF processing failed: ${response.statusText}`,
                details: errorText 
            }, { status: response.status });
        }
        
        const result = await response.json();
        console.log('✅ Python server response:', result);
        
        if (result.success) {
            // Fetch the full concept details with context
            const conceptsResponse = await fetch(`${PYTHON_SERVER_URL}/pdfs/${result.pdf_id}/concepts`);
            const conceptsData = await conceptsResponse.json();
            
            // Transform concepts to include context (from the 'context' field in the database)
            const conceptsWithMetadata = conceptsData.concepts.map((concept: any) => ({
                name: concept.name,
                score: concept.resonance_score || concept.score || 0.8,
                method: 'scholarsphere_enhanced_extraction',
                source: {
                    database_matched: false,
                    server_extraction: true,
                    enhanced_pipeline: true
                },
                context: concept.context || '', // This is the key - the actual text context!
                metadata: {
                    narrative_centrality: concept.narrative_centrality,
                    embedding: concept.embedding,
                    extraction_method: 'enhanced_server_extraction',
                    server_side: true,
                    enhanced_pipeline: true,
                    context: concept.context || '' // Store context in metadata too
                }
            }));
            
            // Get file info for metadata
            const pdfInfoResponse = await fetch(`${PYTHON_SERVER_URL}/pdfs/${result.pdf_id}`);
            const pdfInfo = await pdfInfoResponse.json();
            
            return json({
                success: true,
                document: {
                    id: `pdf_${result.pdf_id}_${Date.now()}`,
                    filename: file.name,
                    size: file.size,
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: locals.user?.id || 'anonymous',
                    concepts: conceptsWithMetadata,
                    conceptCount: conceptsWithMetadata.length,
                    extractedText: conceptsWithMetadata.map((c: any) => c.context).join('\n\n'), // Combine all contexts
                    extractionMethod: 'enhanced_server_extraction',
                    enhancedExtraction: true,
                    processingTime: 0, // Could calculate from timestamps
                    summary: `Extracted ${conceptsWithMetadata.length} concepts with full context from ${file.name}`,
                    // Additional metadata
                    serverPdfId: result.pdf_id,
                    conceptNames: result.concept_names || conceptsWithMetadata.map((c: any) => c.name),
                    message: result.message
                }
            });
        } else {
            return json({ 
                error: result.error || 'PDF processing failed',
                success: false 
            }, { status: 400 });
        }
        
    } catch (error) {
        console.error('❌ Upload handler error:', error);
        
        // Check if Python server is running
        if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
            return json({ 
                error: 'PDF processing server is not running. Please start the Python server on port 5000.',
                details: 'Run: python efficient_pdf_server.py'
            }, { status: 503 });
        }
        
        return json({ 
            error: 'Failed to process upload',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};

// Optional: Add GET endpoint to check server status
export const GET: RequestHandler = async () => {
    try {
        const response = await fetch(`${PYTHON_SERVER_URL}/analytics`);
        if (response.ok) {
            const data = await response.json();
            return json({
                status: 'operational',
                serverUrl: PYTHON_SERVER_URL,
                stats: data
            });
        }
        return json({ status: 'error', message: 'Server not responding' }, { status: 503 });
    } catch (error) {
        return json({ 
            status: 'offline',
            message: 'PDF processing server is not running',
            serverUrl: PYTHON_SERVER_URL
        }, { status: 503 });
    }
};
