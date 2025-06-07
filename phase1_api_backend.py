"""
PHASE 1 MVP - FASTAPI BACKEND ENDPOINTS
======================================

FastAPI endpoints for Phase 1 Darwin-Gödel Evolution System.
Provides REST API access to trigger engine, lineage ledger, and integration status.

This enables the SvelteKit dashboard to interact with the evolution system.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import asyncio
import logging
from datetime import datetime

# Import Phase 1 components
from phase1_integration_complete import Phase1EvolutionSystem
from phase1_conditional_trigger_engine import TriggerCondition
from phase1_psi_lineage_ledger import ConceptStatus, MutationType
from logging_fix import WindowsSafeLogger

logger = WindowsSafeLogger("prajna.phase1_api")

# Global system instance
evolution_system: Optional[Phase1EvolutionSystem] = None

# Pydantic models for API
class TriggerRequest(BaseModel):
    strategy: Optional[str] = Field(None, description="Strategy to apply (optional)")
    force: bool = Field(False, description="Force trigger regardless of conditions")

class ThresholdUpdate(BaseModel):
    threshold_name: str = Field(..., description="Name of threshold to update")
    value: float = Field(..., description="New threshold value")

class ConceptCreate(BaseModel):
    concept_id: str = Field(..., description="Unique concept identifier")
    canonical_name: str = Field(..., description="Human-readable concept name")
    origin_type: str = Field("extraction", description="How concept was created")
    parent_concepts: List[str] = Field([], description="Parent concept IDs")
    metadata: Dict[str, Any] = Field({}, description="Additional metadata")

class ConceptUsage(BaseModel):
    concept_id: str = Field(..., description="Concept ID to update")
    success: bool = Field(True, description="Whether usage was successful")

# FastAPI app
app = FastAPI(
    title="Phase 1 Darwin-Gödel Evolution API",
    description="REST API for TORI's self-evolution system Phase 1 MVP",
    version="1.0.0"
)

# CORS middleware for dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize the evolution system on startup"""
    global evolution_system
    try:
        logger.info("🚀 Starting Phase 1 Evolution API...")
        
        evolution_system = Phase1EvolutionSystem()
        await evolution_system.initialize()
        
        logger.info("✅ Phase 1 Evolution API ready")
        
    except Exception as e:
        logger.error(f"❌ API startup failed: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Gracefully shutdown the evolution system"""
    global evolution_system
    try:
        if evolution_system:
            await evolution_system.shutdown()
        logger.info("🛑 Phase 1 Evolution API shutdown complete")
        
    except Exception as e:
        logger.error(f"❌ API shutdown failed: {e}")

# Health and status endpoints
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    return {
        "status": "healthy",
        "phase": "Phase 1 MVP",
        "timestamp": datetime.now().isoformat(),
        "evolution_active": evolution_system.evolution_active,
        "integration_cycles": evolution_system.integration_cycles
    }

@app.get("/api/status")
async def get_system_status():
    """Get comprehensive system status"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        status = evolution_system.get_integration_status()
        return status
        
    except Exception as e:
        logger.error(f"Status retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Trigger engine endpoints
@app.get("/api/triggers/status")
async def get_trigger_status():
    """Get trigger engine status"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        trigger_status = evolution_system.trigger_engine.get_trigger_status()
        return trigger_status
        
    except Exception as e:
        logger.error(f"Trigger status failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/triggers/manual")
async def manual_trigger_evolution(request: TriggerRequest, background_tasks: BackgroundTasks):
    """Manually trigger evolution"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        logger.info(f"Manual trigger requested: strategy={request.strategy}")
        
        # Execute trigger in background if requested
        if request.force:
            # Force immediate execution
            trigger_event = await evolution_system.manual_evolution_trigger(request.strategy)
        else:
            # Add to background tasks
            background_tasks.add_task(
                evolution_system.manual_evolution_trigger, 
                request.strategy
            )
            trigger_event = {"status": "queued", "strategy": request.strategy}
        
        return {
            "trigger_requested": True,
            "strategy": request.strategy,
            "execution": "immediate" if request.force else "background",
            "trigger_event": trigger_event.trigger_id if hasattr(trigger_event, 'trigger_id') else None
        }
        
    except Exception as e:
        logger.error(f"Manual trigger failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/triggers/threshold")
async def update_trigger_threshold(threshold_update: ThresholdUpdate):
    """Update trigger threshold values"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        success = evolution_system.trigger_engine.set_trigger_threshold(
            threshold_update.threshold_name, 
            threshold_update.value
        )
        
        if success:
            return {
                "threshold_updated": True,
                "threshold_name": threshold_update.threshold_name,
                "new_value": threshold_update.value
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid threshold name")
            
    except Exception as e:
        logger.error(f"Threshold update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/triggers/enable")
async def enable_triggers(enabled: bool = True):
    """Enable or disable automatic triggers"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        evolution_system.trigger_engine.enable_triggers(enabled)
        
        return {
            "triggers_enabled": enabled,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Enable triggers failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Lineage ledger endpoints
@app.get("/api/lineage/stats")
async def get_lineage_stats():
    """Get lineage ledger statistics"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        stats = evolution_system.lineage_ledger.get_ledger_stats()
        return stats
        
    except Exception as e:
        logger.error(f"Lineage stats failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/lineage/concepts")
async def get_concepts(
    status: Optional[str] = None,
    limit: int = 20,
    sort_by: str = "usage"
):
    """Get list of concepts with optional filtering"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        # Get top concepts
        concepts = evolution_system.lineage_ledger.get_top_concepts(by=sort_by, limit=limit)
        
        # Filter by status if requested
        if status:
            try:
                status_filter = ConceptStatus(status)
                concepts = [
                    c for c in concepts 
                    if evolution_system.lineage_ledger.concepts[c['concept_id']].status == status_filter
                ]
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
        
        return {
            "concepts": concepts,
            "total_returned": len(concepts),
            "filter": {"status": status, "sort_by": sort_by, "limit": limit}
        }
        
    except Exception as e:
        logger.error(f"Get concepts failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/lineage/concept/{concept_id}")
async def get_concept_details(concept_id: str):
    """Get detailed information about a specific concept"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        if concept_id not in evolution_system.lineage_ledger.concepts:
            raise HTTPException(status_code=404, detail="Concept not found")
        
        # Get concept record
        record = evolution_system.lineage_ledger.concepts[concept_id]
        
        # Get lineage
        lineage = evolution_system.lineage_ledger.get_concept_lineage(concept_id)
        
        return {
            "concept_id": concept_id,
            "record": {
                "canonical_name": record.canonical_name,
                "status": record.status.value,
                "origin_type": record.origin_type.value,
                "creation_time": record.creation_time.isoformat(),
                "usage_count": record.usage_count,
                "coherence_score": record.coherence_score,
                "psi_phase": record.psi_phase,
                "failure_count": record.failure_count,
                "last_used": record.last_used.isoformat() if record.last_used else None,
                "parent_concepts": record.parent_concepts,
                "child_concepts": record.child_concepts,
                "metadata": record.metadata
            },
            "lineage": lineage,
            "recent_events": record.lifecycle_events[-10:]  # Last 10 events
        }
        
    except Exception as e:
        logger.error(f"Get concept details failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lineage/concept")
async def create_concept(concept_create: ConceptCreate):
    """Create a new concept in the ledger"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        # Validate origin type
        try:
            origin_type = MutationType(concept_create.origin_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid origin type: {concept_create.origin_type}")
        
        success = evolution_system.lineage_ledger.add_concept(
            concept_create.concept_id,
            concept_create.canonical_name,
            origin_type,
            concept_create.parent_concepts,
            concept_create.metadata
        )
        
        if success:
            return {
                "concept_created": True,
                "concept_id": concept_create.concept_id,
                "canonical_name": concept_create.canonical_name
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to create concept (may already exist)")
            
    except Exception as e:
        logger.error(f"Create concept failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lineage/usage")
async def update_concept_usage(usage_update: ConceptUsage):
    """Update concept usage statistics"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        success = evolution_system.lineage_ledger.update_usage(
            usage_update.concept_id,
            usage_update.success
        )
        
        if success:
            return {
                "usage_updated": True,
                "concept_id": usage_update.concept_id,
                "success": usage_update.success
            }
        else:
            raise HTTPException(status_code=404, detail="Concept not found")
            
    except Exception as e:
        logger.error(f"Update usage failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/lineage/coherence")
async def get_phase_coherence():
    """Get current phase coherence metrics"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        coherence = evolution_system.lineage_ledger.calculate_phase_coherence()
        return coherence
        
    except Exception as e:
        logger.error(f"Phase coherence failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Data export endpoints
@app.get("/api/export/lineage")
async def export_lineage_tree():
    """Export complete lineage tree"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        filename = evolution_system.lineage_ledger.export_lineage_tree()
        
        return {
            "export_completed": True,
            "filename": filename,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Lineage export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export/phase1")
async def export_phase1_data():
    """Export all Phase 1 system data"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        filename = evolution_system.export_phase1_data()
        
        return {
            "export_completed": True,
            "filename": filename,
            "timestamp": datetime.now().isoformat(),
            "phase": "Phase 1 MVP"
        }
        
    except Exception as e:
        logger.error(f"Phase 1 export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Evolution metrics endpoints
@app.get("/api/metrics/evolution")
async def get_evolution_metrics():
    """Get evolution outcome metrics"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        return {
            "total_evolution_events": len(evolution_system.evolution_outcomes),
            "recent_events": evolution_system.evolution_outcomes[-10:],
            "last_evolution": evolution_system.last_evolution_event.trigger_id if evolution_system.last_evolution_event else None
        }
        
    except Exception as e:
        logger.error(f"Evolution metrics failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics/health")
async def get_system_health():
    """Get system health metrics over time"""
    if not evolution_system:
        raise HTTPException(status_code=503, detail="Evolution system not initialized")
    
    try:
        return {
            "current_health": evolution_system.system_health_history[-1] if evolution_system.system_health_history else {},
            "health_history": evolution_system.system_health_history[-20:],  # Last 20 measurements
            "measurement_count": len(evolution_system.system_health_history)
        }
        
    except Exception as e:
        logger.error(f"System health metrics failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 STARTING PHASE 1 DARWIN-GÖDEL EVOLUTION API")
    print("=" * 60)
    print("🧬 Self-Evolution System Backend")
    print("📊 ψ-Lineage Ledger API")
    print("🎯 Conditional Trigger Engine API")
    print("🌐 Ready for SvelteKit Dashboard")
    print("=" * 60)
    
    uvicorn.run(
        "phase1_api_backend:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
