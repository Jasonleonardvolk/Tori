"""
🌊 SOLITON MULTI-TENANT PHASE MANAGER
Phase 2 Integration: Soliton Memory + Multi-Tenant Architecture
Ready to implement: June 4, 2025
"""

from typing import Dict, List, Optional, Any
import logging
from dataclasses import dataclass
from enum import Enum
import json
from datetime import datetime
from pathlib import Path

from ingest_pdf.multi_tenant_manager import get_multi_tenant_manager
from ingest_pdf.knowledge_manager import get_knowledge_manager, KnowledgeTier

logger = logging.getLogger(__name__)

class SolitonPhaseType(Enum):
    FOUNDATION = "foundation"    # 0.0 - 1.0
    ORGANIZATION = "org"         # 1.0 - 10.0 (1.0 per org)  
    PRIVATE = "private"          # 10.0+ (0.1 per user)

@dataclass
class SolitonPhaseMapping:
    user_id: str
    username: str
    organization_ids: List[str]
    
    # Phase assignments
    private_phase: float           # User's private phase space
    organization_phases: Dict[str, float]  # Org ID -> phase mapping
    foundation_phase: float = 0.5  # Always 0.5 for foundation access

@dataclass
class SolitonSearchResult:
    concept_name: str
    confidence: float
    context: str
    phase: float
    phase_type: SolitonPhaseType
    tier: KnowledgeTier
    owner_id: str
    soliton_metadata: Dict[str, Any]

class SolitonMultiTenantManager:
    """
    🌊 Soliton-Based Multi-Tenant Phase Management
    
    Integrates Soliton Memory with Multi-Tenant Architecture:
    - Foundation concepts: Phase 0.0 - 1.0 (global access)
    - Organization concepts: Phase 1.0 - 10.0 (org-specific)  
    - Private concepts: Phase 10.0+ (user-specific)
    
    Phase Allocation Strategy:
    - Foundation: Fixed phases 0.0-1.0, concepts distributed evenly
    - Organizations: Each org gets 1.0 phase space (1.0-2.0, 2.0-3.0, etc.)
    - Users: Each user gets 0.1 phase space starting from 10.0
    """
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.mt_manager = get_multi_tenant_manager()
        self.knowledge_manager = get_knowledge_manager()
        
        # Phase allocation files
        self.phase_config_file = self.data_dir / "soliton_phase_config.json"
        
        # Phase allocation tracking
        self.user_phase_map: Dict[str, float] = {}
        self.org_phase_map: Dict[str, float] = {}
        self.next_user_phase = 10.0
        self.next_org_phase = 1.0
        
        # Foundation phase distribution
        self.foundation_phase_start = 0.0
        self.foundation_phase_end = 1.0
        
        # Load existing phase mappings
        self._load_phase_config()
        
        logger.info("🌊 Soliton Multi-Tenant Manager initialized")
    
    def _load_phase_config(self):
        """Load existing phase configuration"""
        try:
            if self.phase_config_file.exists():
                with open(self.phase_config_file, 'r') as f:
                    config = json.load(f)
                
                self.user_phase_map = config.get("user_phases", {})
                self.org_phase_map = config.get("org_phases", {})
                self.next_user_phase = config.get("next_user_phase", 10.0)
                self.next_org_phase = config.get("next_org_phase", 1.0)
                
                logger.info(f"✅ Loaded {len(self.user_phase_map)} user phases, {len(self.org_phase_map)} org phases")
        except Exception as e:
            logger.warning(f"Failed to load phase config: {e}")
    
    def _save_phase_config(self):
        """Save phase configuration"""
        try:
            config = {
                "user_phases": self.user_phase_map,
                "org_phases": self.org_phase_map,
                "next_user_phase": self.next_user_phase,
                "next_org_phase": self.next_org_phase,
                "last_updated": datetime.now().isoformat()
            }
            
            self.phase_config_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.phase_config_file, 'w') as f:
                json.dump(config, f, indent=2)
                
        except Exception as e:
            logger.error(f"Failed to save phase config: {e}")
    
    def assign_user_phase(self, user_id: str) -> float:
        """Assign unique phase space to user"""
        if user_id not in self.user_phase_map:
            self.user_phase_map[user_id] = self.next_user_phase
            self.next_user_phase += 0.1
            
            self._save_phase_config()
            logger.info(f"🌊 Assigned phase {self.user_phase_map[user_id]} to user {user_id}")
        
        return self.user_phase_map[user_id]
    
    def assign_organization_phase(self, org_id: str) -> float:
        """Assign unique phase space to organization"""
        if org_id not in self.org_phase_map:
            self.org_phase_map[org_id] = self.next_org_phase
            self.next_org_phase += 1.0
            
            self._save_phase_config()
            logger.info(f"🌊 Assigned phase {self.org_phase_map[org_id]} to org {org_id}")
        
        return self.org_phase_map[org_id]
    
    def get_user_phase_mapping(self, user_id: str) -> SolitonPhaseMapping:
        """Get complete phase mapping for a user"""
        try:
            user = self.mt_manager.get_user(user_id)
            if not user:
                raise ValueError(f"User {user_id} not found")
            
            # Assign user phase
            private_phase = self.assign_user_phase(user_id)
            
            # Get organization phases
            organization_phases = {}
            for org_id in user.organization_ids:
                organization_phases[org_id] = self.assign_organization_phase(org_id)
            
            return SolitonPhaseMapping(
                user_id=user_id,
                username=user.username,
                organization_ids=user.organization_ids,
                private_phase=private_phase,
                organization_phases=organization_phases,
                foundation_phase=0.5  # Foundation always accessible at phase 0.5
            )
            
        except Exception as e:
            logger.error(f"Failed to get phase mapping for user {user_id}: {e}")
            raise
    
    def calculate_concept_phase(self, tier: KnowledgeTier, owner_id: str, concept_name: str) -> float:
        """Calculate the Soliton phase for a concept based on its tier and owner"""
        try:
            if tier == KnowledgeTier.FOUNDATION:
                # Foundation concepts distributed evenly across 0.0-1.0 phase space
                concept_hash = hash(concept_name) % 1000
                return self.foundation_phase_start + (concept_hash / 1000.0)
            
            elif tier == KnowledgeTier.ORGANIZATION:
                # Organization concepts in org-specific phase space
                base_phase = self.assign_organization_phase(owner_id)
                concept_hash = hash(concept_name) % 1000
                return base_phase + (concept_hash / 1000.0)  # Within 1.0 phase space
            
            elif tier == KnowledgeTier.PRIVATE:
                # Private concepts in user-specific phase space
                base_phase = self.assign_user_phase(owner_id)
                concept_hash = hash(concept_name) % 100
                return base_phase + (concept_hash / 1000.0)  # Within 0.1 phase space
            
        except Exception as e:
            logger.error(f"Failed to calculate phase for concept {concept_name}: {e}")
            return 0.0
    
    def store_concept_with_phase(self, user_id: str, concept_data: Dict[str, Any], 
                                tier: KnowledgeTier, organization_id: Optional[str] = None) -> Optional[float]:
        """Store concept with Soliton phase metadata"""
        try:
            # Determine owner based on tier
            if tier == KnowledgeTier.PRIVATE:
                owner_id = user_id
            elif tier == KnowledgeTier.ORGANIZATION:
                owner_id = organization_id
            else:  # Foundation
                owner_id = "foundation"
            
            # Calculate Soliton phase
            concept_phase = self.calculate_concept_phase(tier, owner_id, concept_data["name"])
            
            # Add Soliton metadata to concept
            soliton_metadata = {
                "phase": concept_phase,
                "phase_type": SolitonPhaseType.PRIVATE.value if tier == KnowledgeTier.PRIVATE else
                             SolitonPhaseType.ORGANIZATION.value if tier == KnowledgeTier.ORGANIZATION else
                             SolitonPhaseType.FOUNDATION.value,
                "soliton_integration": True,
                "phase_calculated_at": datetime.now().isoformat()
            }
            
            # Merge with existing metadata
            concept_data["soliton_metadata"] = soliton_metadata
            if "metadata" not in concept_data:
                concept_data["metadata"] = {}
            concept_data["metadata"].update(soliton_metadata)
            
            # Store using knowledge manager
            concept_diff = self.knowledge_manager.store_concepts(
                user_id=user_id,
                concepts=[concept_data],
                document_title=concept_data.get("source_document", "Soliton Integration"),
                organization_id=organization_id,
                tier=tier
            )
            
            if concept_diff:
                logger.info(f"🌊 Stored concept '{concept_data['name']}' at phase {concept_phase:.3f}")
                return concept_phase
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to store concept with phase: {e}")
            return None
    
    async def search_all_phases(self, query: str, user_id: str, max_results: int = 20) -> Dict[str, Any]:
        """Search across all accessible Soliton phases"""
        try:
            # Get user's phase mapping
            phase_mapping = self.get_user_phase_mapping(user_id)
            
            # Perform multi-tier search using knowledge manager
            search_results = self.knowledge_manager.search_concepts(
                query=query,
                user_id=user_id,
                organization_ids=phase_mapping.organization_ids,
                max_results=max_results
            )
            
            # Convert to Soliton search results with phase information
            soliton_results = []
            for result in search_results:
                # Calculate or retrieve phase information
                concept_phase = self.calculate_concept_phase(result.tier, result.owner_id, result.name)
                
                # Determine phase type
                if result.tier == KnowledgeTier.PRIVATE:
                    phase_type = SolitonPhaseType.PRIVATE
                elif result.tier == KnowledgeTier.ORGANIZATION:
                    phase_type = SolitonPhaseType.ORGANIZATION
                else:
                    phase_type = SolitonPhaseType.FOUNDATION
                
                soliton_result = SolitonSearchResult(
                    concept_name=result.name,
                    confidence=result.confidence,
                    context=result.context,
                    phase=concept_phase,
                    phase_type=phase_type,
                    tier=result.tier,
                    owner_id=result.owner_id,
                    soliton_metadata=result.metadata.get("soliton_metadata", {}) if result.metadata else {}
                )
                soliton_results.append(soliton_result)
            
            # Group results by phase type
            results_by_phase = {
                "private": [r for r in soliton_results if r.phase_type == SolitonPhaseType.PRIVATE],
                "organization": [r for r in soliton_results if r.phase_type == SolitonPhaseType.ORGANIZATION],
                "foundation": [r for r in soliton_results if r.phase_type == SolitonPhaseType.FOUNDATION]
            }
            
            # Sort each group by phase for coherent memory flow
            for phase_results in results_by_phase.values():
                phase_results.sort(key=lambda x: x.phase)
            
            response = {
                "query": query,
                "user_id": user_id,
                "total_results": len(soliton_results),
                "phase_mapping": {
                    "private_phase": phase_mapping.private_phase,
                    "organization_phases": phase_mapping.organization_phases,
                    "foundation_phase": phase_mapping.foundation_phase
                },
                "results_by_phase": {
                    "private": [
                        {
                            "name": r.concept_name,
                            "confidence": r.confidence,
                            "context": r.context,
                            "phase": r.phase,
                            "soliton_metadata": r.soliton_metadata
                        }
                        for r in results_by_phase["private"]
                    ],
                    "organization": [
                        {
                            "name": r.concept_name,
                            "confidence": r.confidence,
                            "context": r.context,
                            "phase": r.phase,
                            "owner_org": r.owner_id,
                            "soliton_metadata": r.soliton_metadata
                        }
                        for r in results_by_phase["organization"]
                    ],
                    "foundation": [
                        {
                            "name": r.concept_name,
                            "confidence": r.confidence,
                            "context": r.context,
                            "phase": r.phase,
                            "soliton_metadata": r.soliton_metadata
                        }
                        for r in results_by_phase["foundation"]
                    ]
                },
                "phase_statistics": {
                    "private_phase_range": f"{phase_mapping.private_phase:.3f} - {phase_mapping.private_phase + 0.1:.3f}",
                    "org_phase_ranges": {
                        org_id: f"{phase:.3f} - {phase + 1.0:.3f}"
                        for org_id, phase in phase_mapping.organization_phases.items()
                    },
                    "foundation_phase_range": f"{self.foundation_phase_start:.1f} - {self.foundation_phase_end:.1f}",
                    "total_accessible_phases": 1 + len(phase_mapping.organization_ids) + 1  # Foundation + Orgs + Private
                }
            }
            
            logger.info(f"🌊 Soliton multi-phase search completed: {len(soliton_results)} results across {response['phase_statistics']['total_accessible_phases']} phase ranges")
            
            return response
            
        except Exception as e:
            logger.error(f"Soliton multi-phase search failed: {e}")
            return {"error": str(e)}
    
    def get_phase_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get analytics about user's phase allocation and usage"""
        try:
            phase_mapping = self.get_user_phase_mapping(user_id)
            
            # Get concept counts by tier
            private_concepts = self.knowledge_manager.get_user_concepts(user_id)
            
            org_concept_counts = {}
            for org_id in phase_mapping.organization_ids:
                org_concepts = self.knowledge_manager.get_organization_concepts(org_id)
                org_concept_counts[org_id] = len(org_concepts)
            
            foundation_concepts = self.knowledge_manager.get_foundation_concepts()
            
            analytics = {
                "user_info": {
                    "user_id": user_id,
                    "username": phase_mapping.username,
                    "organizations": phase_mapping.organization_ids
                },
                "phase_allocation": {
                    "private_phase": phase_mapping.private_phase,
                    "organization_phases": phase_mapping.organization_phases,
                    "foundation_phase": phase_mapping.foundation_phase
                },
                "concept_distribution": {
                    "private_concepts": len(private_concepts),
                    "organization_concepts": org_concept_counts,
                    "foundation_concepts": len(foundation_concepts),
                    "total_accessible": len(private_concepts) + sum(org_concept_counts.values()) + len(foundation_concepts)
                },
                "phase_statistics": {
                    "private_phase_density": len(private_concepts) / 0.1,  # concepts per phase unit
                    "org_phase_densities": {
                        org_id: count / 1.0  # concepts per phase unit
                        for org_id, count in org_concept_counts.items()
                    },
                    "foundation_phase_density": len(foundation_concepts) / 1.0,
                    "total_phase_space": 1.0 + len(phase_mapping.organization_ids) * 1.0 + 0.1  # Foundation + Orgs + Private
                }
            }
            
            return analytics
            
        except Exception as e:
            logger.error(f"Failed to get phase analytics for {user_id}: {e}")
            return {"error": str(e)}

# Global instance
_soliton_mt_manager = None

def get_soliton_multi_tenant_manager() -> SolitonMultiTenantManager:
    """Get or create global Soliton multi-tenant manager"""
    global _soliton_mt_manager
    if _soliton_mt_manager is None:
        _soliton_mt_manager = SolitonMultiTenantManager()
    return _soliton_mt_manager

if __name__ == "__main__":
    # Demo/test functionality
    print("🌊 Soliton Multi-Tenant Manager Demo")
    
    smtm = SolitonMultiTenantManager()
    
    # Test phase assignments
    user_phase = smtm.assign_user_phase("test_user")
    org_phase = smtm.assign_organization_phase("test_org")
    
    print(f"User phase: {user_phase}")
    print(f"Org phase: {org_phase}")
    
    # Test concept phase calculation
    concept_phase = smtm.calculate_concept_phase(KnowledgeTier.PRIVATE, "test_user", "test_concept")
    print(f"Concept phase: {concept_phase}")
    
    print("✅ Soliton Multi-Tenant Manager test complete!")
