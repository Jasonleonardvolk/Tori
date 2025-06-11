"""
Prajna API: Atomic, Non-Discriminatory, Multi-Tenant, Consciousness-Enabled
============================================================================

- Non-discriminatory entropy pipeline: ALL users get ALL pure, diverse concepts
- 3-tier logic: "basic", "research", "enterprise" (role field for analytics/limits/metrics, but NO concept restriction)
- Multi-tenant endpoints preserved (user/org/knowledge)
- Evolution/consciousness endpoints exposed (no discrimination)
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, File, UploadFile, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, AsyncGenerator
import asyncio
import logging
import os
import shutil
import time
import json
from pathlib import Path

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prajna_atomic")

# --- Multi-tenant roles and 3-tier configuration ---
TIERS = ["basic", "research", "enterprise"]

def get_user_tier(authorization: Optional[str]) -> str:
    """Parse tier from JWT, header, or fallback to 'basic'."""
    # For demo: parse role from header for easy testing
    # In real setup, decode JWT or use a user management module
    if not authorization:
        return "basic"
    try:
        # Demo: header format "Bearer <tier>:<userid>:<token>"
        if authorization.startswith("Bearer "):
            token = authorization[7:]
        else:
            token = authorization
        if ":" in token:
            role = token.split(":")[0].lower()
            if role in TIERS:
                return role
        return "basic"
    except Exception as e:
        logger.warning(f"Failed to parse tier: {e}")
        return "basic"

# --- Non-Discriminatory Pipeline Import ---
from ingest_pdf.pipeline import ingest_pdf_clean

# --- MESH LOCKDOWN: Import concept mesh API ---
try:
    from prajna.memory.concept_mesh_api import ConceptMeshAPI
    concept_mesh = ConceptMeshAPI()
    MESH_AVAILABLE = True
    logger.info("✅ Concept Mesh API loaded - lockdown enabled")
except ImportError as e:
    concept_mesh = None
    MESH_AVAILABLE = False
    logger.warning(f"⚠️ Concept Mesh API not available: {e}")

# --- FastAPI app setup ---
app = FastAPI(
    title="Prajna Atomic API - Non-Discriminatory, Multi-Tenant, Consciousness-Enabled",
    description="Non-discriminatory concept pipeline with 3-tier analytics, multi-tenant endpoints, and experimental consciousness.",
    version="3.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

TMP_ROOT = r"C:\Users\jason\Desktop\tori\kha\tmp"
os.makedirs(TMP_ROOT, exist_ok=True)

# --- Models ---
class PrajnaRequest(BaseModel):
    user_query: str = Field(..., description="The user's question")
    focus_concept: Optional[str] = None
    conversation_id: Optional[str] = None
    streaming: bool = False
    enable_reasoning: bool = True
    reasoning_mode: Optional[str] = None

class PrajnaResponse(BaseModel):
    answer: str
    sources: List[str]
    audit: Dict[str, Any]
    ghost_overlays: Dict[str, Any]
    context_used: str
    reasoning_triggered: bool
    reasoning_data: Optional[Dict[str, Any]]
    processing_time: float
    trust_score: float
    user_tier: str

class UploadResponse(BaseModel):
    success: bool
    file_path: str
    filename: str
    size_mb: float
    message: str
    extraction_performed: bool
    concept_count: int
    concept_names: List[str]
    extraction_status: str
    user_tier: str
    full_extraction_result: Optional[Dict[str, Any]] = None

class UserRoleInfo(BaseModel):
    username: str
    role: str

# --- MESH LOCKDOWN: Proposal model ---
class MeshProposal(BaseModel):
    concept: str = Field(..., description="Canonical concept name")
    context: str = Field(..., description="Source or semantic context")
    provenance: Dict[str, Any] = Field(..., description="Origin, timestamp, etc.")

# --- Helper: Get current user role/tier from header ---
async def get_user_role(authorization: Optional[str] = Header(None)) -> str:
    return get_user_tier(authorization)

# --- MAIN ENDPOINTS ---

@app.post("/api/answer", response_model=PrajnaResponse)
async def prajna_answer_endpoint(request: PrajnaRequest, user_tier: str = Depends(get_user_role)):
    """
    Main Prajna endpoint (atomic, non-discriminatory): Returns answer and reasoning, logs user tier for analytics.
    """
    start_time = time.time()
    # For demo: we simulate answer/audit/ghost/context/reasoning
    answer = f"Simulated Prajna answer for: {request.user_query}"
    sources = ["source1", "source2"]
    audit = {"trust_score": 0.87}
    ghost_overlays = {"ghost_score": 0.92}
    context_used = "Simulated context used"
    reasoning_triggered = request.enable_reasoning
    reasoning_data = {"reasoning_path": ["step1", "step2"]}
    processing_time = time.time() - start_time
    trust_score = 0.87

    # --- Non-discriminatory: user_tier is for analytics only, not access control
    logger.info(f"[PRAJNA] Query by {user_tier}: '{request.user_query[:60]}'")

    return PrajnaResponse(
        answer=answer,
        sources=sources,
        audit=audit,
        ghost_overlays=ghost_overlays,
        context_used=context_used,
        reasoning_triggered=reasoning_triggered,
        reasoning_data=reasoning_data,
        processing_time=processing_time,
        trust_score=trust_score,
        user_tier=user_tier
    )

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...), user_tier: str = Depends(get_user_role)):
    """
    Atomic admin PDF upload: runs non-discriminatory pipeline, logs user tier, no access difference.
    """
    try:
        start_time = time.time()
        logger.info(f"📤 [PRAJNA-UPLOAD] User tier: {user_tier}, uploading: {file.filename}")
        os.makedirs(TMP_ROOT, exist_ok=True)
        safe_filename = "".join(c for c in file.filename if c.isalnum() or c in '._-') or f"prajna_upload_{int(time.time())}.pdf"
        timestamp = int(time.time() * 1000)
        unique_filename = f"prajna_{timestamp}_{safe_filename}"
        dest_path = os.path.join(TMP_ROOT, unique_filename)
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(dest_path)
        file_size_mb = file_size / (1024 * 1024)
        upload_time = time.time() - start_time

        logger.info(f"✅ [PRAJNA-UPLOAD] File saved: {dest_path}, Size: {file_size_mb:.2f} MB")

        # --- Non-discriminatory pipeline: EVERY user gets ALL pure, diverse concepts
        logger.info(f"📤 [PRAJNA-UPLOAD] Starting concept extraction for {safe_filename}...")
        extraction_result = ingest_pdf_clean(dest_path, extraction_threshold=0.0, admin_mode=True)  # Always admin mode for maximum concepts
        
        concept_count = extraction_result.get("concept_count", 0)
        concept_names = extraction_result.get("concept_names", [])
        extraction_status = extraction_result.get("status", "unknown")
        
        # Get full concept objects if available
        full_concepts = extraction_result.get("concepts", [])
        
        # Log detailed results
        logger.info(f"✅ [PRAJNA-UPLOAD] Extracted {concept_count} pure, diverse concepts (no discrimination!)")
        if concept_names:
            logger.info(f"🎯 [PRAJNA-UPLOAD] Top concepts: {', '.join(concept_names[:5])}")
        
        # Log analysis results
        purity_analysis = extraction_result.get("purity_analysis", {})
        entropy_analysis = extraction_result.get("entropy_analysis", {})
        
        if purity_analysis:
            logger.info(f"🔬 [PRAJNA-UPLOAD] Purity: {purity_analysis.get('final_concepts', 0)} final from {purity_analysis.get('raw_concepts', 0)} raw")
        
        if entropy_analysis.get("enabled"):
            logger.info(f"🎯 [PRAJNA-UPLOAD] Entropy: {entropy_analysis.get('selected_diverse', 0)} diverse from {entropy_analysis.get('total_before_entropy', 0)} pure")

        message = f"Upload & extraction successful! {concept_count} concepts extracted from {safe_filename}"
        total_time = time.time() - start_time

        # 🔧 FRONTEND FIX: Create document object that frontend expects
        document_data = {
            "id": unique_filename,
            "filename": safe_filename,
            "concepts": concept_names,
            "size": file_size,
            "uploadedAt": time.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "uploadedBy": "user",
            "extractionMethod": extraction_status,
            "enhancedExtraction": True,
            "elfinTriggered": False,
            "processingTime": total_time,
            "extractedText": extraction_result.get("extracted_text", ""),
            "semanticConcepts": extraction_result.get("semantic_extracted", 0),
            "boostedConcepts": extraction_result.get("database_boosted", 0),
            "summary": f"Extracted {concept_count} concepts from {safe_filename}"
        }
        
        return {
            "success": True,
            "document": document_data,
            "message": message,
            "extraction_performed": True,
            "user_tier": user_tier,
            "CLAUDE_FIX_APPLIED": "YES_NEW_CODE_RUNNING",  # Proof new code is running
            "full_extraction_result": {
                "purity_analysis": purity_analysis,
                "entropy_analysis": entropy_analysis,
                "semantic_extracted": extraction_result.get("semantic_extracted", 0),
                "database_boosted": extraction_result.get("database_boosted", 0),
                "chunks_processed": extraction_result.get("chunks_processed", 0),
                "chunks_available": extraction_result.get("chunks_available", 0),
                "processing_time": total_time,
                "admin_mode": True,
                "entropy_pruned": entropy_analysis.get("enabled", False)
            }
        }

    except Exception as e:
        logger.error(f"❌ [PRAJNA-UPLOAD] Failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# --- MESH LOCKDOWN: Single allowed mesh mutation endpoint ---
@app.post("/api/prajna/propose")
async def propose_concept(proposal: MeshProposal, user_tier: str = Depends(get_user_role)):
    """
    🚨 MESH LOCKDOWN ENDPOINT 🚨
    This is the ONLY allowed mesh mutation endpoint in the entire TORI system.
    All external modules must POST here. No direct mesh writes allowed anywhere else.
    """
    if not MESH_AVAILABLE:
        raise HTTPException(status_code=503, detail="Mesh API not available")
    
    try:
        logger.info(f"[MESH-LOCKDOWN] Proposal from {user_tier}: {proposal.concept}")
        
        # Call the locked mesh mutator (only accessible from this API)
        result = await concept_mesh._add_node_locked(
            proposal.concept,
            proposal.context,
            proposal.provenance
        )
        
        logger.info(f"[MESH-LOCKDOWN] Success: {result}")
        return {
            "status": "success", 
            "result": result,
            "user_tier": user_tier,
            "lockdown_enforced": True
        }
        
    except PermissionError as e:
        logger.error(f"[MESH-LOCKDOWN] Permission denied: {e}")
        raise HTTPException(status_code=403, detail=f"Mesh access denied: {str(e)}")
    except Exception as e:
        logger.error(f"[MESH-LOCKDOWN] Proposal failed: {e}")
        raise HTTPException(status_code=500, detail=f"Mesh proposal failed: {str(e)}")

@app.get("/api/health")
async def prajna_health_check():
    """Health check (atomic, non-discriminatory)"""
    return {
        "status": "healthy",
        "mesh_lockdown_enabled": MESH_AVAILABLE,
        "features": [
            "non_discriminatory_pipeline", "semantic_diversity", "category_balance",
            "multi_tenant", "consciousness_evolution", "three_tier_analytics",
            "mesh_write_lockdown" if MESH_AVAILABLE else "mesh_unavailable"
        ]
    }

@app.get("/api/stats")
async def prajna_stats():
    """Stats endpoint (simulate with tier analytics only)"""
    return {
        "uptime": time.time(),
        "users_by_tier": {"basic": 12, "research": 6, "enterprise": 2},
        "total_concepts": 123456
    }

# --- SOLITON STATS ENDPOINT ---
@app.get("/api/soliton/stats/{user}")
async def get_soliton_stats(user: str):
    """
    Soliton Memory Stats API — RESTORES /api/soliton/stats/{user}
    Returns soliton concept memory statistics for a specific user
    """
    try:
        # Update path as needed for your setup!
        SOLITON_MEMORY_PATH = r"C:\Users\jason\Desktop\tori\kha\soliton_concept_memory.json"
        
        if not os.path.exists(SOLITON_MEMORY_PATH):
            logger.warning(f"[SOLITON-STATS] Memory file not found: {SOLITON_MEMORY_PATH}")
            return {
                "error": "Soliton memory file not found",
                "user": user,
                "path_checked": SOLITON_MEMORY_PATH
            }
        
        with open(SOLITON_MEMORY_PATH, "r", encoding="utf-8") as f:
            memory = json.load(f)
        
        # Log access for analytics
        logger.info(f"[SOLITON-STATS] Stats requested for user: {user}")
        
        # Optionally filter or process stats based on user
        # For now, returning full memory stats
        return {
            "user": user,
            "stats": memory,
            "timestamp": time.time(),
            "total_concepts": len(memory.get("concepts", {})) if isinstance(memory, dict) else 0
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"[SOLITON-STATS] JSON decode error: {e}")
        return {
            "error": "Invalid JSON in soliton memory file",
            "user": user,
            "details": str(e)
        }
    except Exception as e:
        logger.error(f"[SOLITON-STATS] Unexpected error: {e}")
        return {
            "error": "Failed to retrieve soliton stats",
            "user": user,
            "details": str(e)
        }

# --- Multi-Tenant Endpoints (preserved as is; add your own user/org logic) ---
@app.get("/api/users/me", response_model=UserRoleInfo)
async def get_my_role(authorization: Optional[str] = Header(None)):
    """Return current user's username and role/tier (for analytics/demos)"""
    # For real use: replace with JWT/session lookup
    username = "demo_user"
    role = get_user_tier(authorization)
    return UserRoleInfo(username=username, role=role)

@app.get("/api/tenant/organizations")
async def get_orgs(user_tier: str = Depends(get_user_role)):
    """Return organizations for current user (simulated, multi-tenant demo)"""
    return {"organizations": [{"name": "LabX", "tier": user_tier}, {"name": "OpenAI", "tier": "enterprise"}]}

# --- Consciousness/Evolution (experimental, non-blocking, non-restrictive) ---
@app.post("/api/consciousness/reason")
async def consciousness_reasoning(request: Dict[str, Any], user_tier: str = Depends(get_user_role)):
    """Simulate consciousness-driven reasoning (no access difference)"""
    logger.info(f"[CONSCIOUSNESS] Tier {user_tier}: {request.get('user_query','')}")
    return {
        "response": f"Conscious answer for '{request.get('user_query','')}'",
        "consciousness_level": 0.7,
        "evolution_triggered": True,
        "user_tier": user_tier
    }

@app.get("/api/consciousness/status")
async def consciousness_status():
    return {"consciousness_level": 0.7, "evolution_cycles": 42}

@app.get("/api/consciousness/metrics")
async def consciousness_metrics():
    return {"recent_performance": [0.8, 0.85, 0.78], "performance_trend": "stable"}

# --- Error handlers ---
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse({"error": "Endpoint not found", "available_endpoints": [
        "/api/answer", "/api/upload", "/api/health", "/api/stats",
        "/api/consciousness/reason", "/api/consciousness/status", "/api/consciousness/metrics",
        "/api/soliton/stats/{user}", "/api/users/me", "/api/tenant/organizations"
    ]}, status_code=404)

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal error: {exc}")
    return JSONResponse({"error": "Internal error", "detail": "Check Prajna logs for details"}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "prajna.api.prajna_api:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
