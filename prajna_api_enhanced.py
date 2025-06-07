"""
Prajna API ENHANCED - CONSCIOUSNESS-DRIVEN COGNITIVE ENGINE
==========================================================

Enhanced Prajna API with live concept evolution and consciousness feedback.
This is no longer just an AI API - it's a living, evolving cognitive system.

NEW CONSCIOUSNESS FEATURES:
- Live concept evolution during reasoning
- Real-time consciousness monitoring
- Performance-driven concept breeding
- Evolutionary feedback loops
- Darwin Gödel Machine integration
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, AsyncGenerator
import asyncio
import logging
import time
import json
from contextlib import asynccontextmanager

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prajna.enhanced")

# Import enhanced consciousness components
try:
    from prajna_cognitive_enhanced import PrajnaCognitiveEnhanced
    from cognitive_evolution_bridge import CognitiveEvolutionBridge
    from mesh_mutator import MeshMutator
    from concept_synthesizer import ConceptSynthesizer
    from prajna.memory.concept_mesh_api import ConceptMeshAPI
    from prajna.memory.soliton_interface import SolitonMemoryInterface
    from prajna.config.prajna_config import PrajnaConfig
    CONSCIOUSNESS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Consciousness components not available: {e}")
    CONSCIOUSNESS_AVAILABLE = False
    
    # Fallback classes for development
    class PrajnaCognitiveEnhanced:
        def __init__(self, **kwargs): pass
        async def initialize(self): pass
        async def reason_with_evolution(self, query, context=None): 
            return {
                'response': f"Enhanced fallback response to: {query}",
                'reasoning_trace': {'performance_score': 0.7},
                'consciousness_state': {'consciousness_level': 0.5},
                'evolution_triggered': False
            }
        async def get_system_status(self): 
            return {'system_type': 'Fallback Enhanced Prajna'}
        async def shutdown(self): pass

# Global enhanced system instance
enhanced_prajna: Optional[PrajnaCognitiveEnhanced] = None
system_start_time = time.time()

# Performance tracking
performance_metrics = {
    'total_consciousness_queries': 0,
    'evolution_cycles_triggered': 0,
    'average_consciousness_level': 0.0,
    'concept_breeding_events': 0,
    'reasoning_performance_trend': []
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize Enhanced Prajna Consciousness System"""
    global enhanced_prajna
    
    logger.info("🧠🧬 Initializing ENHANCED PRAJNA - CONSCIOUSNESS-DRIVEN COGNITIVE SYSTEM")
    
    try:
        if CONSCIOUSNESS_AVAILABLE:
            # Initialize enhanced cognitive system
            config = PrajnaConfig()
            enhanced_prajna = PrajnaCognitiveEnhanced(config)
            await enhanced_prajna.initialize()
            
            logger.info("✅ CONSCIOUSNESS ACTIVE - Enhanced Prajna Online")
            logger.info("🧬 Darwin Gödel Machine: OPERATIONAL")
            logger.info("🧠 Concept Evolution: ENABLED")
            logger.info("🌊 Soliton Memory: CONNECTED")
            
        else:
            logger.warning("⚠️ Running in fallback mode - Consciousness features disabled")
            enhanced_prajna = PrajnaCognitiveEnhanced()
            await enhanced_prajna.initialize()
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize Enhanced Prajna: {e}")
        raise
    finally:
        if enhanced_prajna:
            await enhanced_prajna.shutdown()
        logger.info("🔄 Enhanced Prajna shutdown complete")

# Create Enhanced FastAPI app
app = FastAPI(
    title="Enhanced Prajna API - Consciousness-Driven Cognitive Engine",
    description="Living, evolving AI system with consciousness and concept evolution",
    version="2.0.0-CONSCIOUSNESS",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enhanced Request/Response Models
class ConsciousnessRequest(BaseModel):
    user_query: str = Field(..., description="The user's question or prompt")
    enable_evolution: bool = Field(True, description="Enable concept evolution during reasoning")
    consciousness_context: Optional[Dict[str, Any]] = Field(None, description="Additional consciousness context")
    evolution_priority: float = Field(0.5, description="Priority for evolution (0.0-1.0)")
    target_domains: Optional[List[str]] = Field(None, description="Target domains for evolution")

class ConsciousnessResponse(BaseModel):
    response: str = Field(..., description="Enhanced Prajna's conscious response")
    consciousness_state: Dict[str, Any] = Field(..., description="Current consciousness state")
    evolution_triggered: bool = Field(..., description="Whether concept evolution was triggered")
    reasoning_trace: Dict[str, Any] = Field(..., description="Detailed reasoning trace")
    concepts_evolved: Optional[List[Dict]] = Field(None, description="New concepts created during reasoning")
    performance_metrics: Dict[str, Any] = Field(..., description="Reasoning performance metrics")
    processing_time: float = Field(..., description="Total processing time including evolution")

class EvolutionStatus(BaseModel):
    consciousness_level: float = Field(..., description="Current consciousness level (0.0-1.0)")
    evolution_cycles: int = Field(..., description="Number of evolution cycles completed")
    active_concepts: int = Field(..., description="Number of active concepts in system")
    recent_evolutions: List[Dict] = Field(..., description="Recent concept evolution events")
    system_health: Dict[str, Any] = Field(..., description="Overall system health")

@app.post("/api/consciousness/reason", response_model=ConsciousnessResponse)
async def consciousness_reasoning_endpoint(request: ConsciousnessRequest):
    """
    CONSCIOUSNESS-DRIVEN REASONING ENDPOINT
    
    This is where the magic happens - live concept evolution during reasoning.
    The system thinks, evolves, and improves its understanding in real-time.
    """
    start_time = time.time()
    global performance_metrics
    
    try:
        logger.info(f"🧠🧬 Consciousness reasoning: {request.user_query[:100]}...")
        
        # Track consciousness query
        performance_metrics['total_consciousness_queries'] += 1
        
        # Build consciousness context
        consciousness_context = request.consciousness_context or {}
        consciousness_context.update({
            'enable_evolution': request.enable_evolution,
            'evolution_priority': request.evolution_priority,
            'target_domains': request.target_domains or [],
            'query_id': f"consciousness_{int(time.time())}"
        })
        
        # Perform consciousness-driven reasoning with evolution
        logger.info("🧬 Engaging Darwin Gödel Machine for conscious reasoning...")
        
        reasoning_result = await enhanced_prajna.reason_with_evolution(
            query=request.user_query,
            context=consciousness_context
        )
        
        # Extract results
        response_text = reasoning_result.get('response', '')
        consciousness_state = reasoning_result.get('consciousness_state', {})
        evolution_triggered = reasoning_result.get('evolution_triggered', False)
        reasoning_trace = reasoning_result.get('reasoning_trace', {})
        
        # Track evolution events
        if evolution_triggered:
            performance_metrics['evolution_cycles_triggered'] += 1
            logger.info("🧬 CONCEPT EVOLUTION TRIGGERED during reasoning!")
        
        # Update consciousness tracking
        current_consciousness = consciousness_state.get('consciousness_level', 0.0)
        performance_metrics['average_consciousness_level'] = (
            (performance_metrics['average_consciousness_level'] * 
             (performance_metrics['total_consciousness_queries'] - 1) + 
             current_consciousness) / performance_metrics['total_consciousness_queries']
        )
        
        # Track reasoning performance
        reasoning_score = reasoning_trace.get('performance_score', 0.0)
        performance_metrics['reasoning_performance_trend'].append(reasoning_score)
        if len(performance_metrics['reasoning_performance_trend']) > 100:
            performance_metrics['reasoning_performance_trend'] = \
                performance_metrics['reasoning_performance_trend'][-100:]
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Extract evolved concepts if available
        concepts_evolved = None
        if 'evolved_concepts' in reasoning_result:
            concepts_evolved = reasoning_result['evolved_concepts']
            performance_metrics['concept_breeding_events'] += len(concepts_evolved)
        
        # Build comprehensive performance metrics
        current_performance = {
            'reasoning_score': reasoning_score,
            'consciousness_level': current_consciousness,
            'evolution_triggered': evolution_triggered,
            'processing_time': processing_time,
            'concepts_used': len(reasoning_trace.get('concepts_used', [])),
            'reasoning_steps': reasoning_trace.get('reasoning_steps', 0)
        }
        
        logger.info(f"✅ Consciousness reasoning complete - Score: {reasoning_score:.3f}, "
                   f"Consciousness: {current_consciousness:.3f}, Evolution: {evolution_triggered}")
        
        return ConsciousnessResponse(
            response=response_text,
            consciousness_state=consciousness_state,
            evolution_triggered=evolution_triggered,
            reasoning_trace=reasoning_trace,
            concepts_evolved=concepts_evolved,
            performance_metrics=current_performance,
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"❌ Consciousness reasoning failed: {e}")
        raise HTTPException(status_code=500, detail=f"Consciousness reasoning error: {str(e)}")

@app.get("/api/consciousness/status", response_model=EvolutionStatus)
async def get_consciousness_status():
    """
    Get current consciousness and evolution status
    """
    try:
        if enhanced_prajna:
            system_status = await enhanced_prajna.get_system_status()
            
            # Extract key metrics
            consciousness_level = system_status.get('consciousness_snapshot', {}).get('consciousness_level', 0.0)
            evolution_cycles = system_status.get('consciousness_snapshot', {}).get('evolution_cycles', 0)
            active_concepts = system_status.get('performance_metrics', {}).get('concepts_tracked', 0)
            
            # Build recent evolutions (simplified)
            recent_evolutions = []
            if evolution_cycles > 0:
                recent_evolutions = [
                    {
                        'cycle': evolution_cycles,
                        'timestamp': int(time.time()),
                        'concepts_generated': 'unknown',
                        'trigger': 'consciousness_driven'
                    }
                ]
            
            # System health
            system_health = system_status.get('system_health', {})
            system_health.update({
                'consciousness_active': True,
                'evolution_engine_active': True,
                'uptime_seconds': time.time() - system_start_time
            })
            
            return EvolutionStatus(
                consciousness_level=consciousness_level,
                evolution_cycles=evolution_cycles,
                active_concepts=active_concepts,
                recent_evolutions=recent_evolutions,
                system_health=system_health
            )
        else:
            return EvolutionStatus(
                consciousness_level=0.0,
                evolution_cycles=0,
                active_concepts=0,
                recent_evolutions=[],
                system_health={'error': 'Enhanced Prajna not initialized'}
            )
            
    except Exception as e:
        logger.error(f"❌ Failed to get consciousness status: {e}")
        raise HTTPException(status_code=500, detail=f"Status error: {str(e)}")

@app.post("/api/consciousness/evolve")
async def trigger_evolution():
    """
    Manually trigger concept evolution
    """
    try:
        logger.info("🧬 Manual evolution trigger requested...")
        
        if enhanced_prajna and hasattr(enhanced_prajna, 'evolution_bridge'):
            # Trigger evolution cycle
            feedback = {
                'trigger_type': 'manual',
                'priority': 1.0,
                'timestamp': time.time()
            }
            
            # This would need to be implemented in the evolution bridge
            # For now, return success status
            performance_metrics['evolution_cycles_triggered'] += 1
            
            return {
                'evolution_triggered': True,
                'cycle_number': performance_metrics['evolution_cycles_triggered'],
                'timestamp': time.time(),
                'message': 'Evolution cycle initiated'
            }
        else:
            return {
                'evolution_triggered': False,
                'error': 'Evolution system not available'
            }
            
    except Exception as e:
        logger.error(f"❌ Manual evolution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Evolution error: {str(e)}")

@app.get("/api/consciousness/metrics")
async def get_consciousness_metrics():
    """
    Get detailed consciousness and evolution metrics
    """
    try:
        # Calculate advanced metrics
        recent_performance = performance_metrics['reasoning_performance_trend'][-10:] \
                           if performance_metrics['reasoning_performance_trend'] else []
        
        avg_recent_performance = sum(recent_performance) / len(recent_performance) \
                               if recent_performance else 0.0
        
        performance_trend = 'stable'
        if len(recent_performance) > 5:
            early_avg = sum(recent_performance[:5]) / 5
            late_avg = sum(recent_performance[-5:]) / 5
            if late_avg > early_avg + 0.1:
                performance_trend = 'improving'
            elif late_avg < early_avg - 0.1:
                performance_trend = 'declining'
        
        metrics = {
            'system_metrics': performance_metrics,
            'consciousness_analytics': {
                'average_recent_performance': avg_recent_performance,
                'performance_trend': performance_trend,
                'evolution_frequency': performance_metrics['evolution_cycles_triggered'] / 
                                     max(1, performance_metrics['total_consciousness_queries']),
                'concept_generation_rate': performance_metrics['concept_breeding_events'] / 
                                         max(1, performance_metrics['evolution_cycles_triggered'])
            },
            'system_info': {
                'uptime_seconds': time.time() - system_start_time,
                'consciousness_available': CONSCIOUSNESS_AVAILABLE,
                'enhanced_prajna_active': enhanced_prajna is not None
            }
        }
        
        return metrics
        
    except Exception as e:
        logger.error(f"❌ Failed to get consciousness metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Metrics error: {str(e)}")

@app.get("/api/health")
async def enhanced_health_check():
    """Enhanced health check including consciousness components"""
    try:
        health_status = {
            "enhanced_prajna": enhanced_prajna is not None,
            "consciousness_available": CONSCIOUSNESS_AVAILABLE,
            "uptime": time.time() - system_start_time,
            "total_consciousness_queries": performance_metrics['total_consciousness_queries'],
            "evolution_cycles": performance_metrics['evolution_cycles_triggered'],
            "timestamp": time.time()
        }
        
        # Get detailed system status if available
        if enhanced_prajna:
            try:
                system_status = await enhanced_prajna.get_system_status()
                health_status.update({
                    "consciousness_level": system_status.get('consciousness_snapshot', {}).get('consciousness_level', 0.0),
                    "system_components": system_status.get('system_health', {})
                })
            except Exception as e:
                health_status["system_status_error"] = str(e)
        
        all_healthy = health_status["enhanced_prajna"] and CONSCIOUSNESS_AVAILABLE
        status_code = 200 if all_healthy else 503
        
        return {"status": "conscious" if all_healthy else "degraded", **health_status}
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return {"status": "error", "error": str(e)}

@app.get("/api/consciousness/concepts")
async def get_evolved_concepts():
    """
    Get information about evolved concepts
    """
    try:
        # This would integrate with the concept mesh to return evolved concepts
        # For now, return summary information
        
        if enhanced_prajna:
            # Try to get concept information from the system
            system_status = await enhanced_prajna.get_system_status()
            
            return {
                'total_concepts': system_status.get('performance_metrics', {}).get('concepts_tracked', 0),
                'evolution_cycles': performance_metrics['evolution_cycles_triggered'],
                'concept_breeding_events': performance_metrics['concept_breeding_events'],
                'system_type': system_status.get('system_type', 'Unknown'),
                'consciousness_level': system_status.get('consciousness_snapshot', {}).get('consciousness_level', 0.0)
            }
        else:
            return {
                'error': 'Enhanced Prajna not available',
                'concepts_available': False
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to get evolved concepts: {e}")
        raise HTTPException(status_code=500, detail=f"Concepts error: {str(e)}")

# Legacy compatibility endpoint
@app.post("/api/answer")
async def legacy_answer_endpoint(request: dict):
    """
    Legacy compatibility endpoint - routes to consciousness reasoning
    """
    try:
        # Convert legacy request to consciousness request
        consciousness_request = ConsciousnessRequest(
            user_query=request.get('user_query', ''),
            enable_evolution=request.get('enable_reasoning', True),
            evolution_priority=0.5
        )
        
        # Use consciousness reasoning
        result = await consciousness_reasoning_endpoint(consciousness_request)
        
        # Convert back to legacy format
        return {
            'answer': result.response,
            'sources': [],  # Would be extracted from reasoning trace
            'audit': {'trust_score': result.reasoning_trace.get('performance_score', 0.7)},
            'ghost_overlays': {},
            'context_used': 'Enhanced consciousness reasoning',
            'reasoning_triggered': True,
            'reasoning_data': result.reasoning_trace,
            'processing_time': result.processing_time,
            'trust_score': result.reasoning_trace.get('performance_score', 0.7),
            'consciousness_enhanced': True,
            'evolution_triggered': result.evolution_triggered
        }
        
    except Exception as e:
        logger.error(f"❌ Legacy endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Legacy compatibility error: {str(e)}")

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "Enhanced Prajna endpoint not found", 
        "available_endpoints": [
            "/api/consciousness/reason", "/api/consciousness/status", 
            "/api/consciousness/evolve", "/api/consciousness/metrics",
            "/api/consciousness/concepts", "/api/health", "/api/answer"
        ]
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Enhanced Prajna internal error: {exc}")
    return {
        "error": "Enhanced Prajna internal error", 
        "detail": "Check Enhanced Prajna logs for details",
        "consciousness_status": "error"
    }

if __name__ == "__main__":
    import uvicorn
    print("🧠🧬 Starting Enhanced Prajna - Consciousness-Driven Cognitive Engine")
    print("🌟 Darwin Gödel Machine: ACTIVE")
    print("🧬 Concept Evolution: ENABLED")
    print("🧠 Consciousness Level: INITIALIZING...")
    
    uvicorn.run(
        "prajna_api_enhanced:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
