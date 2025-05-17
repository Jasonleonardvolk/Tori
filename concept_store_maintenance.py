"""concept_store_maintenance.py - Utilities for maintaining ALAN's concept store.

This script provides utilities for managing ALAN's concept store, including:
1. Identifying and deleting invalid or incomplete concept entries
2. Resetting duplicate detection to allow re-ingestion of documents
3. Full or selective cleaning of the concept store

These utilities help ensure that all concepts in the store have proper spectral IDs
and complete metadata, which is critical for phase-coherent reasoning.
"""

import os
import sys
import numpy as np
import json
import logging
import time
import shutil
import uuid
from pathlib import Path
from typing import List, Dict, Tuple, Set, Optional, Union, Any, Callable
import hashlib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("logs/concept_maintenance.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("alan_concept_maintenance")

# Ensure path includes current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Try to import ALAN components
try:
    from ingest_pdf.models import ConceptTuple
    from ingest_pdf.koopman_phase_graph import get_koopman_phase_graph
except ImportError as e:
    logger.error(f"Failed to import ALAN components: {e}")
    logger.error("Please make sure the ALAN system is properly installed.")

class ConceptStoreMaintenance:
    """Utilities for maintaining and cleaning the concept store."""
    
    def __init__(
        self,
        concepts_npz_path: str = "concepts.npz", 
        concepts_json_path: str = "concepts.json",
        backup_dir: str = "backups"
    ):
        """
        Initialize the maintenance utilities.
        
        Args:
            concepts_npz_path: Path to the .npz concept store file
            concepts_json_path: Path to the .json concept index file
            backup_dir: Directory for storing backups
        """
        self.concepts_npz_path = concepts_npz_path
        self.concepts_json_path = concepts_json_path
        self.backup_dir = backup_dir
        
        # Ensure backup directory exists
        os.makedirs(backup_dir, exist_ok=True)

    def create_backup(self) -> Dict[str, str]:
        """
        Create a backup of the concept store files.
        
        Returns:
            Dictionary with backup file paths
        """
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        npz_backup_path = os.path.join(
            self.backup_dir, 
            f"concepts_{timestamp}.npz"
        )
        json_backup_path = os.path.join(
            self.backup_dir, 
            f"concepts_{timestamp}.json"
        )
        
        # Create backups if files exist
        backup_files = {}
        
        if os.path.exists(self.concepts_npz_path):
            shutil.copy2(self.concepts_npz_path, npz_backup_path)
            backup_files["npz"] = npz_backup_path
            logger.info(f"Created backup of .npz file at {npz_backup_path}")
            
        if os.path.exists(self.concepts_json_path):
            shutil.copy2(self.concepts_json_path, json_backup_path)
            backup_files["json"] = json_backup_path
            logger.info(f"Created backup of .json file at {json_backup_path}")
            
        return backup_files
    
    def load_concept_store(self) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Load the concept store data.
        
        Returns:
            Tuple of (npz_data, json_data)
        """
        # Load .npz file
        npz_data = {}
        if os.path.exists(self.concepts_npz_path):
            try:
                with np.load(self.concepts_npz_path, allow_pickle=True) as data:
                    # Convert to dictionary for easier manipulation
                    for key in data.files:
                        npz_data[key] = data[key]
                    
                    # Check if this is using the legacy format with 'names', 'embeddings', etc. keys
                    if 'concepts' not in npz_data and 'names' in npz_data:
                        # Count concepts based on names array
                        concept_count = len(npz_data.get('names', []))
                        logger.info(f"Loaded .npz file with {concept_count} concepts (legacy format)")
                    else:
                        logger.info(f"Loaded .npz file with {len(npz_data.get('concepts', []))} concepts")
            except Exception as e:
                logger.error(f"Error loading .npz file: {e}")
                npz_data = {}
        
        # Load .json file
        json_data = {}
        if os.path.exists(self.concepts_json_path):
            try:
                with open(self.concepts_json_path, 'r') as f:
                    raw_json_data = json.load(f)
                
                # Check if the JSON is an array (legacy format) or an object with a 'concepts' property
                if isinstance(raw_json_data, list):
                    # Convert array format to object format
                    json_data = {"concepts": raw_json_data}
                    logger.info(f"Loaded .json file with {len(raw_json_data)} concepts (array format)")
                else:
                    # Already in object format
                    json_data = raw_json_data
                    logger.info(f"Loaded .json file with {len(json_data.get('concepts', []))} concepts")
            except Exception as e:
                logger.error(f"Error loading .json file: {e}")
                json_data = {"concepts": []}
                
        return npz_data, json_data
    
    def save_concept_store(
        self, 
        npz_data: Dict[str, Any], 
        json_data: Dict[str, Any]
    ) -> bool:
        """
        Save the concept store data.
        
        Args:
            npz_data: Dictionary with .npz data
            json_data: Dictionary with .json data
            
        Returns:
            Boolean indicating success
        """
        # Create backups before saving
        self.create_backup()
        
        # Save .npz file
        try:
            # Convert dictionary back to saveable format
            arrays_to_save = {}
            for key, value in npz_data.items():
                arrays_to_save[key] = np.array(value, dtype=object)
                
            np.savez(self.concepts_npz_path, **arrays_to_save)
            logger.info(f"Saved .npz file with {len(npz_data.get('concepts', []))} concepts")
            
            # Create SHA256 hash file for the .npz file
            self._create_hash_file(self.concepts_npz_path)
        except Exception as e:
            logger.error(f"Error saving .npz file: {e}")
            return False
        
        # Save .json file
        try:
            with open(self.concepts_json_path, 'w') as f:
                json.dump(json_data, f, indent=2)
            logger.info(f"Saved .json file with {len(json_data.get('concepts', []))} concepts")
        except Exception as e:
            logger.error(f"Error saving .json file: {e}")
            return False
            
        return True
    
    def _create_hash_file(self, file_path: str) -> None:
        """
        Create a SHA256 hash file for the given file.
        
        Args:
            file_path: Path to the file to hash
        """
        hash_file_path = f"{file_path}.sha256"
        
        try:
            # Calculate SHA256 hash
            sha256_hash = hashlib.sha256()
            with open(file_path, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
                    
            # Write hash to file
            with open(hash_file_path, "w") as f:
                f.write(sha256_hash.hexdigest())
                
            logger.info(f"Created hash file at {hash_file_path}")
        except Exception as e:
            logger.error(f"Error creating hash file: {e}")
    
    def identify_invalid_concepts(
        self, 
        npz_data: Dict[str, Any],
        criteria: Dict[str, bool] = None
    ) -> List[int]:
        """
        Identify invalid concepts based on specified criteria.
        
        Args:
            npz_data: Dictionary with .npz data
            criteria: Dictionary specifying which criteria to check
                      Default: check all criteria
            
        Returns:
            List of indices of invalid concepts
        """
        if criteria is None:
            criteria = {
                "check_spectral_id": True,
                "check_embedding": True,
                "check_source": True,
                "check_metadata": True
            }
            
        # Check if we're using the legacy format with separate arrays
        if 'concepts' not in npz_data and 'names' in npz_data:
            return self._identify_invalid_legacy_concepts(npz_data, criteria)
            
        # Standard format with 'concepts' array
        concepts = npz_data.get("concepts", [])
        invalid_indices = []
        
        for i, concept in enumerate(concepts):
            is_invalid = False
            
            # Check for spectral ID (eigenfunction ID)
            if criteria.get("check_spectral_id", True):
                if not hasattr(concept, "psi_id") or not concept.psi_id:
                    is_invalid = True
                    logger.debug(f"Concept at index {i} has no psi_id")
                    
            # Check for embedding
            if criteria.get("check_embedding", True):
                if not hasattr(concept, "embedding") or concept.embedding is None:
                    is_invalid = True
                    logger.debug(f"Concept at index {i} has no embedding")
                    
            # Check for source information
            if criteria.get("check_source", True):
                if (not hasattr(concept, "source_document_id") or not concept.source_document_id or
                    not hasattr(concept, "source_location") or not concept.source_location):
                    is_invalid = True
                    logger.debug(f"Concept at index {i} has incomplete source information")
                    
            # Check for basic metadata
            if criteria.get("check_metadata", True):
                if not hasattr(concept, "name") or not concept.name:
                    is_invalid = True
                    logger.debug(f"Concept at index {i} has no name")
                    
            if is_invalid:
                invalid_indices.append(i)
                
        logger.info(f"Found {len(invalid_indices)} invalid concepts out of {len(concepts)}")
        return invalid_indices
        
    def _identify_invalid_legacy_concepts(
        self,
        npz_data: Dict[str, Any],
        criteria: Dict[str, bool]
    ) -> List[int]:
        """
        Identify invalid concepts in the legacy format (separate arrays).
        
        Args:
            npz_data: Dictionary with .npz data in legacy format
            criteria: Dictionary specifying which criteria to check
            
        Returns:
            List of indices of invalid concepts
        """
        # Get arrays
        names = npz_data.get('names', [])
        embeddings = npz_data.get('embeddings', [])
        contexts = npz_data.get('contexts', [])
        
        # Count concepts based on names array
        concept_count = len(names)
        if concept_count == 0:
            logger.info("No concepts found in legacy format")
            return []
            
        invalid_indices = []
        
        for i in range(concept_count):
            is_invalid = False
            
            # Check for name
            if criteria.get("check_metadata", True):
                if i >= len(names) or not names[i]:
                    is_invalid = True
                    logger.debug(f"Concept at index {i} has no name")
                    
            # Check for embedding
            if criteria.get("check_embedding", True):
                if i >= len(embeddings) or embeddings[i] is None or len(embeddings[i]) == 0:
                    is_invalid = True
                    logger.debug(f"Concept at index {i} has no embedding")
                    
            # Check for context (source information)
            if criteria.get("check_source", True):
                if i >= len(contexts) or contexts[i] is None:
                    is_invalid = True
                    logger.debug(f"Concept at index {i} has no context")
                    
            # No spectral ID check for legacy format since that field doesn't exist
            
            if is_invalid:
                invalid_indices.append(i)
                
        logger.info(f"Found {len(invalid_indices)} invalid concepts out of {concept_count} (legacy format)")
        return invalid_indices
    
    def remove_invalid_concepts(
        self, 
        npz_data: Dict[str, Any],
        json_data: Dict[str, Any],
        invalid_indices: List[int]
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Remove invalid concepts from the store.
        
        Args:
            npz_data: Dictionary with .npz data
            json_data: Dictionary with .json data
            invalid_indices: List of indices of invalid concepts
            
        Returns:
            Tuple of updated (npz_data, json_data)
        """
        if not invalid_indices:
            logger.info("No invalid concepts to remove")
            return npz_data, json_data
            
        # Check if this is using the legacy format with separate arrays
        if 'concepts' not in npz_data and 'names' in npz_data:
            return self._remove_invalid_legacy_concepts(npz_data, json_data, invalid_indices)
            
        # Standard format with 'concepts' array
        concepts = npz_data.get("concepts", [])
        valid_concepts = [c for i, c in enumerate(concepts) if i not in invalid_indices]
        
        # Update .npz data
        npz_data["concepts"] = valid_concepts
        
        # Update any other arrays that might be indexed by concept ID
        # This is a simplification - you may need to adjust based on actual structure
        for key in npz_data:
            if key != "concepts" and isinstance(npz_data[key], list) and len(npz_data[key]) == len(concepts):
                npz_data[key] = [v for i, v in enumerate(npz_data[key]) if i not in invalid_indices]
                
        # Update .json data
        # Rebuild from valid concepts to ensure consistency
        if "concepts" in json_data:
            json_concepts = []
            for concept in valid_concepts:
                # Extract serializable properties
                json_concept = {
                    "id": getattr(concept, "id", str(uuid.uuid4())),
                    "name": getattr(concept, "name", "Unknown"),
                    "psi_id": getattr(concept, "psi_id", ""),
                    "source_document_id": getattr(concept, "source_document_id", ""),
                    "source_location": getattr(concept, "source_location", "")
                }
                json_concepts.append(json_concept)
                
            json_data["concepts"] = json_concepts
            
        logger.info(f"Removed {len(invalid_indices)} invalid concepts")
        return npz_data, json_data
        
    def _remove_invalid_legacy_concepts(
        self,
        npz_data: Dict[str, Any],
        json_data: Dict[str, Any],
        invalid_indices: List[int]
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Remove invalid concepts from the legacy format store (separate arrays).
        
        Args:
            npz_data: Dictionary with .npz data in legacy format
            json_data: Dictionary with .json data
            invalid_indices: List of indices of invalid concepts
            
        Returns:
            Tuple of updated (npz_data, json_data)
        """
        if not invalid_indices:
            return npz_data, json_data
            
        # Identify which arrays hold concept data
        concept_arrays = [
            'names', 'embeddings', 'contexts', 'passage_embeddings', 
            'symbol_to_id', 'spectral_ids', 'eigenvalues'
        ]
        
        # Filter each array to remove invalid indices
        for array_name in concept_arrays:
            if array_name in npz_data and isinstance(npz_data[array_name], (list, np.ndarray)):
                array_data = npz_data[array_name]
                valid_data = [v for i, v in enumerate(array_data) if i not in invalid_indices]
                npz_data[array_name] = valid_data
                
        # Update JSON data - for legacy format, we'll rebuild json from filtered arrays
        if isinstance(json_data.get("concepts", None), list):
            json_concepts = []
            names = npz_data.get('names', [])
            
            for i, name in enumerate(names):
                # Create a minimal JSON representation
                json_concept = {
                    "id": str(uuid.uuid4()),  # Generate new ID
                    "name": name if name else "Unknown"
                }
                
                # Add other fields if available
                if 'spectral_ids' in npz_data and i < len(npz_data['spectral_ids']):
                    json_concept["psi_id"] = npz_data['spectral_ids'][i]
                    
                json_concepts.append(json_concept)
                
            json_data["concepts"] = json_concepts
            
        logger.info(f"Removed {len(invalid_indices)} invalid concepts from legacy format")
        return npz_data, json_data
    
    def wipe_concept_store(self) -> bool:
        """
        Completely wipe the concept store.
        
        Returns:
            Boolean indicating success
        """
        # Create backups before wiping
        self.create_backup()
        
        # Check if we're using a legacy format by loading current store
        current_npz, _ = self.load_concept_store()
        is_legacy_format = 'concepts' not in current_npz and 'names' in current_npz
        
        # Create empty data structures based on format
        if is_legacy_format:
            # Create empty legacy format
            npz_data = {
                'names': [],
                'embeddings': [],
                'contexts': [],
                'passage_embeddings': []
            }
            # Include any other arrays from the original that should be empty
            for key in current_npz.keys():
                if key not in npz_data:
                    npz_data[key] = []
        else:
            # Create empty standard format
            npz_data = {"concepts": []}
            
        json_data = {"concepts": []}
        
        # Save empty stores
        result = self.save_concept_store(npz_data, json_data)
        
        if result:
            logger.info("Concept store wiped clean")
        
        return result
    
    def reset_ingestion_tracking(self) -> bool:
        """
        Reset the ingestion tracking to allow re-ingestion of documents.
        
        Returns:
            Boolean indicating success
        """
        # Look for ingestion tracking files
        tracking_files = [
            "ingest_pdf/processed_files.json",
            "processed_files.json",
            "ingest_pdf/document_hashes.json",
            "document_hashes.json"
        ]
        
        found = False
        
        for file_path in tracking_files:
            if os.path.exists(file_path):
                # Create backup
                backup_path = os.path.join(
                    self.backup_dir, 
                    f"{os.path.basename(file_path)}_{time.strftime('%Y%m%d_%H%M%S')}"
                )
                shutil.copy2(file_path, backup_path)
                
                # Either delete or empty the file
                try:
                    # Option 1: Delete the file
                    # os.remove(file_path)
                    
                    # Option 2: Empty the file (create empty tracking)
                    with open(file_path, 'w') as f:
                        if file_path.endswith('.json'):
                            f.write('{}')
                        else:
                            f.write('')
                            
                    logger.info(f"Reset tracking file: {file_path}")
                    found = True
                except Exception as e:
                    logger.error(f"Error resetting tracking file {file_path}: {e}")
                    return False
        
        if not found:
            logger.warning("No ingestion tracking files found to reset")
            
        return True
    
    def fix_invalid_concepts(self) -> bool:
        """
        Identify and remove invalid concepts, and reset ingestion tracking.
        
        Returns:
            Boolean indicating success
        """
        # Load concept store
        npz_data, json_data = self.load_concept_store()
        
        # Identify invalid concepts
        invalid_indices = self.identify_invalid_concepts(npz_data)
        
        # Remove invalid concepts
        if invalid_indices:
            npz_data, json_data = self.remove_invalid_concepts(
                npz_data, json_data, invalid_indices
            )
            
            # Save updated concept store
            if not self.save_concept_store(npz_data, json_data):
                logger.error("Failed to save updated concept store")
                return False
        
        # Reset ingestion tracking
        if not self.reset_ingestion_tracking():
            logger.error("Failed to reset ingestion tracking")
            return False
            
        logger.info("Successfully fixed invalid concepts and reset ingestion tracking")
        return True


def main():
    """Main entry point for the script."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="ALAN Concept Store Maintenance Utilities"
    )
    
    parser.add_argument(
        "--action",
        choices=["identify", "fix", "wipe", "reset-tracking"],
        required=True,
        help="Action to perform on the concept store"
    )
    
    parser.add_argument(
        "--npz",
        default="concepts.npz",
        help="Path to the .npz concept store file"
    )
    
    parser.add_argument(
        "--json",
        default="concepts.json",
        help="Path to the .json concept index file"
    )
    
    parser.add_argument(
        "--backup-dir",
        default="backups",
        help="Directory for storing backups"
    )
    
    args = parser.parse_args()
    
    # Create maintenance utility
    maintenance = ConceptStoreMaintenance(
        concepts_npz_path=args.npz,
        concepts_json_path=args.json,
        backup_dir=args.backup_dir
    )
    
    # Perform requested action
    if args.action == "identify":
        npz_data, _ = maintenance.load_concept_store()
        invalid_indices = maintenance.identify_invalid_concepts(npz_data)
        
        print(f"\nFound {len(invalid_indices)} invalid concepts")
        if invalid_indices:
            print("Invalid concept indices:", invalid_indices)
            
    elif args.action == "fix":
        success = maintenance.fix_invalid_concepts()
        
        if success:
            print("\nSuccessfully fixed invalid concepts and reset ingestion tracking")
        else:
            print("\nFailed to fix concept store. Check logs for details.")
            
    elif args.action == "wipe":
        success = maintenance.wipe_concept_store()
        
        if success:
            print("\nSuccessfully wiped concept store")
        else:
            print("\nFailed to wipe concept store. Check logs for details.")
            
    elif args.action == "reset-tracking":
        success = maintenance.reset_ingestion_tracking()
        
        if success:
            print("\nSuccessfully reset ingestion tracking")
        else:
            print("\nFailed to reset ingestion tracking. Check logs for details.")


if __name__ == "__main__":
    main()
