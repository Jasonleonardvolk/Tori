import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Check if backend is available once at startup
let backendAvailable = false;
let lastCheckTime = 0;
const CHECK_INTERVAL = 60000; // Check every minute

async function checkBackendHealth() {
  const now = Date.now();
  if (now - lastCheckTime < CHECK_INTERVAL) {
    return backendAvailable;
  }
  
  lastCheckTime = now;
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(1000) // 1 second timeout
    });
    backendAvailable = response.ok;
  } catch {
    backendAvailable = false;
  }
  
  if (!backendAvailable) {
    console.log('🌊 Soliton backend not available, using fallback mode');
  }
  
  return backendAvailable;
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const path = params.path;
  const body = await request.json();
  
  // Only log important actions, not routine calls
  if (path !== 'store' && path !== 'stats') {
    console.log(`🌊 Soliton API POST: /api/soliton/${path}`);
  }
  
  // Quick check if backend is available
  if (await checkBackendHealth()) {
    try {
      // Forward to Python backend
      const response = await fetch(`${BACKEND_URL}/api/soliton/${path}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': locals.user?.id || body.userId || 'anonymous'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ Soliton API success:`, result.engine);
      return json(result);
    } catch (error) {
      // Silently fall back
      backendAvailable = false;
    }
  }
  
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
};

export const GET: RequestHandler = async ({ params, locals, url }) => {
  const path = params.path;
  
  // Only log non-routine calls
  if (path !== 'stats' && path !== 'health') {
    console.log(`🌊 Soliton API GET: /api/soliton/${path}`);
  }
  
  // Quick check if backend is available
  if (await checkBackendHealth()) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/soliton/${path}${url.search}`, {
        headers: {
          'X-User-Id': locals.user?.id || 'anonymous'
        },
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }
      
      return json(await response.json());
    } catch (error) {
      // Silently fall back
      backendAvailable = false;
    }
  }
  
  // Fallback responses - no error logging
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
};
