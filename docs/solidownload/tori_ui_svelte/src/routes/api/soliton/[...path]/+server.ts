import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const path = params.path;
  const body = await request.json();
  
  console.log(`🌊 Soliton API POST: /api/soliton/${path}`);
  
  try {
    // Forward to Python backend
    const response = await fetch(`${BACKEND_URL}/api/soliton/${path}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': locals.user?.id || body.userId || 'anonymous'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ Soliton API success:`, result.engine);
    return json(result);
  } catch (error) {
    console.error('Soliton API error:', error);
    
    // Fallback responses for each endpoint
    if (path === 'init') {
      return json({ 
        success: true, 
        engine: 'fallback',
        message: 'Using client-side soliton memory'
      });
    } else if (path === 'store') {
      const phaseTag = Math.random() * 2 * Math.PI;
      return json({
        success: true,
        memoryId: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conceptId: body.conceptId,
        phaseTag,
        amplitude: Math.sqrt(body.importance || 0.8),
        engine: 'fallback'
      });
    } else if (path === 'phase') {
      return json({
        success: true,
        matches: [],
        searchPhase: body.targetPhase,
        tolerance: body.tolerance,
        engine: 'fallback'
      });
    } else if (path === 'vault') {
      return json({
        success: true,
        conceptId: body.conceptId,
        vaultStatus: body.vaultLevel,
        phaseShifted: true,
        message: 'Memory protected (fallback)',
        engine: 'fallback'
      });
    }
    
    return json({ 
      success: false, 
      error: 'Unknown endpoint',
      engine: 'fallback'
    });
  }
};

export const GET: RequestHandler = async ({ params, locals, url }) => {
  const path = params.path;
  
  console.log(`🌊 Soliton API GET: /api/soliton/${path}`);
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/soliton/${path}${url.search}`, {
      headers: {
        'X-User-Id': locals.user?.id || 'anonymous'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    
    return json(await response.json());
  } catch (error) {
    console.error('Soliton API GET error:', error);
    
    // Fallback responses
    if (path?.includes('recall')) {
      return json({
        success: false,
        error: 'Memory not found',
        engine: 'fallback'
      });
    } else if (path?.includes('related')) {
      return json({
        relatedMemories: [],
        engine: 'fallback'
      });
    } else if (path?.includes('stats')) {
      return json({
        stats: {
          totalMemories: 0,
          activeMemories: 0,
          vaultedMemories: 0,
          averageStability: 0.8,
          memoryIntegrity: 0.95,
          informationLoss: 0.05
        },
        engine: 'fallback'
      });
    } else if (path === 'health') {
      return json({
        success: true,
        status: 'operational',
        engine: 'fallback',
        message: 'Soliton memory service is running in fallback mode'
      });
    }
    
    return json({ 
      success: false, 
      error: 'Backend unavailable',
      engine: 'fallback'
    });
  }
};
