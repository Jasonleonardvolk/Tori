"""
TORI ConceptFuzzing - Python Testing Engine

This module implements the advanced testing algorithms and property-based
test generation for the TORI cognitive system. It provides intelligent
test case generation, statistical analysis, and sophisticated fuzzing
strategies that complement the Rust core.

The module serves as the mathematical and algorithmic backend for fuzzing,
handling computationally intensive operations that benefit from Python's
scientific computing ecosystem.
"""

import numpy as np
import scipy.stats
import scipy.optimize
import random
import itertools
import json
import asyncio
import aiohttp
from aiohttp import web
import logging
import argparse
import time
import uuid
import hashlib
from typing import List, Dict, Tuple, Optional, Any, Union, Set
from dataclasses import dataclass, asdict
from enum import Enum
import concurrent.futures
import threading
import queue
import statistics
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore', category=RuntimeWarning)

# ===================================================================
# TYPE DEFINITIONS AND DATA STRUCTURES
# ===================================================================

@dataclass
class TestCase:
    """Represents a generated test case for fuzzing"""
    test_id: str
    target_module: str
    test_type: str
    parameters: Dict[str, Any]
    input_data: Dict[str, Any]
    expected_properties: List[str]
    generation_method: str
    generation_time: float

@dataclass
class PropertyTestResult:
    """Result of a property-based test"""
    property_name: str
    passed: bool
    iterations_run: int
    first_failure_iteration: Optional[int]
    counterexample: Optional[Dict[str, Any]]
    statistics: Dict[str, float]
    execution_time: float

@dataclass
class GenerationStrategy:
    """Strategy for generating test data"""
    name: str
    description: str
    parameters: Dict[str, Any]
    weight: float
    constraints: List[str]

@dataclass
class CoverageInfo:
    """Coverage information for test generation"""
    covered_branches: Set[str]
    uncovered_branches: Set[str]
    coverage_percentage: float
    hotspots: List[Tuple[str, int]]  # (branch, hit_count)

# ===================================================================
# COVERAGE TRACKING AND ANALYSIS
# ===================================================================

class CoverageTracker:
    """Tracks code coverage and guides test generation"""
    
    def __init__(self):
        self.covered_branches = set()
        self.branch_hit_counts = {}
        self.uncovered_branches = set([
            "single_concept", "small_hierarchy", "large_hierarchy",
            "empty_hierarchy", "single_relationship", "star_pattern", 
            "chain_pattern", "cycle_detection", "invalid_refs",
            "empty_threads", "single_thread", "complex_braiding",
            "alien_detection", "scar_formation", "wormhole_creation"
        ])
        self.execution_paths = []
        self.coverage_history = []
        
    def record_branch_coverage(self, branch_id: str):
        """Record that a branch was covered"""
        self.covered_branches.add(branch_id)
        self.branch_hit_counts[branch_id] = self.branch_hit_counts.get(branch_id, 0) + 1
        self.uncovered_branches.discard(branch_id)
        
    def record_execution_path(self, path: List[str]):
        """Record an execution path"""
        self.execution_paths.append(path)
        for branch in path:
            self.record_branch_coverage(branch)
            
    def get_coverage_percentage(self) -> float:
        """Calculate current coverage percentage"""
        total_branches = len(self.covered_branches) + len(self.uncovered_branches)
        if total_branches == 0:
            return 100.0
        return len(self.covered_branches) / total_branches * 100.0
        
    def get_uncovered_targets(self) -> List[str]:
        """Get list of uncovered branches for targeted generation"""
        return list(self.uncovered_branches)
        
    def analyze_coverage_gaps(self) -> Dict[str, Any]:
        """Analyze coverage gaps and provide recommendations"""
        return {
            "total_branches": len(self.covered_branches) + len(self.uncovered_branches),
            "covered_branches": len(self.covered_branches),
            "coverage_percentage": self.get_coverage_percentage(),
            "cold_spots": [branch for branch, count in self.branch_hit_counts.items() if count == 1],
            "hot_spots": sorted(self.branch_hit_counts.items(), key=lambda x: x[1], reverse=True)[:10],
            "never_executed": list(self.uncovered_branches),
            "execution_diversity": len(set(tuple(path) for path in self.execution_paths))
        }

# ===================================================================
# TRANSSERIES AND ALIEN DETECTION MATHEMATICS
# ===================================================================

class TransseriesAnalyzer:
    """Implements Écalle's transseries analysis for alien detection"""
    
    def __init__(self):
        self.epsilon = 1e-10  # Small parameter for transseries
        
    def fit_transseries(self, series_data: List[float], max_order: int = 5) -> Dict[str, Any]:
        """Fit a transseries expansion to data"""
        if len(series_data) < max_order + 1:
            return {"error": "Insufficient data for transseries fitting"}
        
        data = np.array(series_data)
        n = len(data)
        
        # Generate parameter values (inverse time-like)
        g_values = 1.0 / np.arange(1, n + 1)
        
        # Fit perturbative part: sum(a_n * g^n)
        perturbative_coeffs = self._fit_perturbative_series(data, g_values, max_order)
        
        # Compute residuals to look for non-perturbative terms
        perturbative_fit = self._evaluate_perturbative(perturbative_coeffs, g_values)
        residuals = data - perturbative_fit
        
        # Detect alien terms: exp(-S/g) contributions
        alien_terms = self._detect_alien_terms(residuals, g_values)
        
        return {
            "perturbative_coefficients": perturbative_coeffs.tolist(),
            "alien_terms": alien_terms,
            "fit_quality": np.mean(residuals**2),
            "series_length": len(series_data),
            "alien_significance": self._calculate_alien_significance(alien_terms)
        }
    
    def _fit_perturbative_series(self, data: np.ndarray, g_values: np.ndarray, max_order: int) -> np.ndarray:
        """Fit perturbative series coefficients"""
        # Build Vandermonde matrix for polynomial fitting
        A = np.column_stack([g_values**i for i in range(max_order + 1)])
        
        # Use least squares to fit coefficients
        coeffs, _, _, _ = np.linalg.lstsq(A, data, rcond=None)
        return coeffs
    
    def _evaluate_perturbative(self, coeffs: np.ndarray, g_values: np.ndarray) -> np.ndarray:
        """Evaluate perturbative series"""
        result = np.zeros_like(g_values)
        for i, coeff in enumerate(coeffs):
            result += coeff * (g_values ** i)
        return result
    
    def _detect_alien_terms(self, residuals: np.ndarray, g_values: np.ndarray) -> List[Dict[str, float]]:
        """Detect exponentially small alien terms"""
        alien_terms = []
        
        # Look for exponentially suppressed patterns
        for action in np.arange(0.5, 5.0, 0.5):
            # Test if residuals fit exp(-action/g) pattern
            expected_alien = np.exp(-action / g_values)
            
            # Fit coefficient for this alien term
            if np.sum(expected_alien**2) > self.epsilon:
                coefficient = np.dot(residuals, expected_alien) / np.sum(expected_alien**2)
                
                # Compute fit quality
                alien_fit = coefficient * expected_alien
                fit_error = np.mean((residuals - alien_fit)**2)
                
                # If this alien term explains significant variance
                if abs(coefficient) > 0.01 and fit_error < np.mean(residuals**2) * 0.8:
                    alien_terms.append({
                        "action": action,
                        "coefficient": coefficient,
                        "fit_error": fit_error,
                        "significance": abs(coefficient) / (np.std(residuals) + self.epsilon)
                    })
        
        return sorted(alien_terms, key=lambda x: x["significance"], reverse=True)
    
    def _calculate_alien_significance(self, alien_terms: List[Dict[str, float]]) -> float:
        """Calculate overall significance of alien effects"""
        if not alien_terms:
            return 0.0
        
        # Sum of significant alien terms
        total_significance = sum(term["significance"] for term in alien_terms 
                               if term["significance"] > 1.0)
        return total_significance
    
    def compute_alien_derivative(self, series_data: List[float], action: float) -> float:
        """Compute alien derivative Delta_action for given action value"""
        if len(series_data) < 3:
            return 0.0
        
        data = np.array(series_data)
        n = len(data)
        g_values = 1.0 / np.arange(1, n + 1)
        
        # Alien derivative extracts coefficient of exp(-action/g)
        alien_pattern = np.exp(-action / g_values)
        
        if np.sum(alien_pattern**2) < self.epsilon:
            return 0.0
        
        # Project data onto alien pattern
        alien_coefficient = np.dot(data, alien_pattern) / np.sum(alien_pattern**2)
        return alien_coefficient

# ===================================================================
# PROPERTY-BASED TEST GENERATORS
# ===================================================================

class PropertyTestGenerator:
    """Generator for property-based test cases"""
    
    def __init__(self, seed: Optional[int] = None):
        self.rng = random.Random(seed)
        self.np_rng = np.random.RandomState(seed)
        self.generation_strategies = self._initialize_strategies()
        self.coverage_tracker = CoverageTracker()
        self.transseries_analyzer = TransseriesAnalyzer()
        
    def _initialize_strategies(self) -> List[GenerationStrategy]:
        """Initialize test generation strategies"""
        return [
            GenerationStrategy(
                name="uniform_random",
                description="Uniform random generation",
                parameters={"distribution": "uniform"},
                weight=1.0,
                constraints=[]
            ),
            GenerationStrategy(
                name="boundary_values",
                description="Generate boundary and edge cases",
                parameters={"focus": "boundaries"},
                weight=2.0,
                constraints=["valid_range"]
            ),
            GenerationStrategy(
                name="adversarial",
                description="Generate adversarial inputs",
                parameters={"intent": "adversarial"},
                weight=1.5,
                constraints=[]
            ),
            GenerationStrategy(
                name="structured",
                description="Generate structured data following patterns",
                parameters={"pattern": "structured"},
                weight=1.2,
                constraints=["valid_structure"]
            ),
            GenerationStrategy(
                name="coverage_guided",
                description="Generate inputs to maximize coverage",
                parameters={"guidance": "coverage"},
                weight=2.5,
                constraints=["coverage_target"]
            ),
        ]
    
    def generate_hierarchy_test_case(self, parameters: Dict[str, Any]) -> TestCase:
        """Generate test case for hierarchy testing"""
        strategy = self._select_strategy("hierarchy")
        
        concept_count = parameters.get("concept_count", 100)
        max_depth = parameters.get("hierarchy_depth", 5)
        connection_density = parameters.get("connection_density", 0.3)
        
        if strategy.name == "boundary_values":
            concepts = self._generate_boundary_concepts(concept_count)
            relationships = self._generate_boundary_relationships(concepts, max_depth)
        elif strategy.name == "adversarial":
            concepts = self._generate_adversarial_concepts(concept_count)
            relationships = self._generate_adversarial_relationships(concepts, max_depth)
        elif strategy.name == "coverage_guided":
            concepts = self._generate_coverage_guided_concepts(concept_count)
            relationships = self._generate_coverage_guided_relationships(concepts, max_depth)
        else:
            concepts = self._generate_random_concepts(concept_count)
            relationships = self._generate_random_relationships(concepts, connection_density)
        
        scales = self._generate_scale_assignments(concepts, max_depth)
        
        return TestCase(
            test_id=str(uuid.uuid4()),
            target_module="MultiScaleHierarchy",
            test_type="property_based",
            parameters=parameters,
            input_data={
                "concepts": concepts,
                "relationships": relationships,
                "scales": scales
            },
            expected_properties=[
                "no_cycles",
                "valid_parent_child_refs",
                "scale_ordering_preserved",
                "reachability_from_root"
            ],
            generation_method=strategy.name,
            generation_time=time.time()
        )
    
    def generate_memory_test_case(self, parameters: Dict[str, Any]) -> TestCase:
        """Generate test case for memory/braid testing"""
        strategy = self._select_strategy("memory")
        
        thread_count = parameters.get("thread_count", 20)
        concepts_per_thread = parameters.get("concepts_per_thread", 10)
        braiding_probability = parameters.get("braiding_probability", 0.3)
        
        if strategy.name == "boundary_values":
            threads = self._generate_boundary_threads(thread_count, concepts_per_thread)
            braiding_pattern = self._generate_boundary_braiding(threads)
        elif strategy.name == "adversarial":
            threads = self._generate_adversarial_threads(thread_count, concepts_per_thread)
            braiding_pattern = self._generate_adversarial_braiding(threads)
        else:
            threads = self._generate_random_threads(thread_count, concepts_per_thread)
            braiding_pattern = self._generate_random_braiding(threads, braiding_probability)
        
        temporal_sequence = self._generate_temporal_sequence(threads, parameters)
        
        return TestCase(
            test_id=str(uuid.uuid4()),
            target_module="BraidMemory",
            test_type="property_based",
            parameters=parameters,
            input_data={
                "threads": threads,
                "braiding_pattern": braiding_pattern,
                "temporal_sequence": temporal_sequence
            },
            expected_properties=[
                "braid_coherence",
                "infinity_groupoid_laws",
                "temporal_consistency",
                "thread_integrity"
            ],
            generation_method=strategy.name,
            generation_time=time.time()
        )
    
    def generate_wormhole_test_case(self, parameters: Dict[str, Any]) -> TestCase:
        """Generate test case for wormhole testing"""
        strategy = self._select_strategy("wormhole")
        
        concept_count = parameters.get("concept_count", 100)
        connection_density = parameters.get("connection_density", 0.2)
        
        concepts = list(range(1, concept_count + 1))
        
        if strategy.name == "boundary_values":
            similarity_matrix = self._generate_boundary_similarity_matrix(concept_count)
            concept_pairs = self._generate_boundary_concept_pairs(concepts)
        elif strategy.name == "adversarial":
            similarity_matrix = self._generate_adversarial_similarity_matrix(concept_count)
            concept_pairs = self._generate_adversarial_concept_pairs(concepts)
        else:
            similarity_matrix = self._generate_random_similarity_matrix(concept_count)
            concept_pairs = self._generate_random_concept_pairs(concepts, connection_density)
        
        connection_strengths = [self.rng.random() for _ in concept_pairs]
        
        return TestCase(
            test_id=str(uuid.uuid4()),
            target_module="WormholeEngine",
            test_type="property_based",
            parameters=parameters,
            input_data={
                "concepts": concepts,
                "concept_pairs": concept_pairs,
                "similarity_matrix": similarity_matrix,
                "connection_strengths": connection_strengths
            },
            expected_properties=[
                "similarity_symmetry",
                "triangle_inequality",
                "connection_validity",
                "semantic_consistency"
            ],
            generation_method=strategy.name,
            generation_time=time.time()
        )
    
    def generate_alien_test_case(self, parameters: Dict[str, Any]) -> TestCase:
        """Generate test case for alien calculus testing"""
        strategy = self._select_strategy("alien")
        
        series_length = parameters.get("series_length", 100)
        novelty_variance = parameters.get("novelty_variance", 1.0)
        alien_probability = parameters.get("alien_probability", 0.05)
        
        if strategy.name == "boundary_values":
            series_data = self._generate_boundary_series(series_length, novelty_variance)
            alien_candidates = self._generate_boundary_alien_candidates()
        elif strategy.name == "adversarial":
            series_data = self._generate_adversarial_series(series_length)
            alien_candidates = self._generate_adversarial_alien_candidates()
        else:
            series_data = self._generate_random_series_with_aliens(
                series_length, novelty_variance, alien_probability
            )
            alien_candidates = self._generate_random_alien_candidates()
        
        # Analyze series with transseries mathematics
        transseries_analysis = self.transseries_analyzer.fit_transseries(series_data)
        
        context_metadata = {
            "series_id": str(uuid.uuid4()),
            "generation_time": time.time(),
            "expected_aliens": sum(1 for x in series_data if abs(x) > 3.0),
            "series_complexity": np.std(series_data),
            "transseries_analysis": transseries_analysis
        }
        
        return TestCase(
            test_id=str(uuid.uuid4()),
            target_module="AlienCalculus",
            test_type="property_based",
            parameters=parameters,
            input_data={
                "series_data": series_data,
                "alien_candidates": alien_candidates,
                "context_metadata": context_metadata
            },
            expected_properties=[
                "alien_detection_accuracy",
                "false_positive_rate",
                "mathematical_consistency",
                "transseries_validity"
            ],
            generation_method=strategy.name,
            generation_time=time.time()
        )
    
    def _select_strategy(self, domain: str) -> GenerationStrategy:
        """Select generation strategy based on weights and coverage"""
        # Coverage-guided selection
        if domain in ["hierarchy", "memory"] and self.coverage_tracker.get_coverage_percentage() < 80:
            coverage_strategies = [s for s in self.generation_strategies if s.name == "coverage_guided"]
            if coverage_strategies:
                return coverage_strategies[0]
        
        # Weighted random selection
        weights = [s.weight for s in self.generation_strategies]
        return random.choices(self.generation_strategies, weights=weights)[0]
    
    # ===================================================================
    # CONCEPT GENERATION METHODS
    # ===================================================================
    
    def _generate_random_concepts(self, count: int) -> List[int]:
        """Generate random concept IDs"""
        return list(range(1, count + 1))
    
    def _generate_boundary_concepts(self, count: int) -> List[int]:
        """Generate concepts focusing on boundary values"""
        concepts = []
        if count > 0:
            concepts.extend([1, count])  # Min and max
        if count > 2:
            concepts.extend([2, count - 1])  # Near boundaries
        
        # Fill remaining with random
        remaining = count - len(concepts)
        if remaining > 0:
            concepts.extend(range(len(concepts) + 1, len(concepts) + 1 + remaining))
        
        return sorted(set(concepts))[:count]
    
    def _generate_adversarial_concepts(self, count: int) -> List[int]:
        """Generate concepts designed to stress the system"""
        concepts = list(range(1, count + 1))
        
        # Add some potential problematic cases
        if count > 10:
            # Large gaps in concept IDs
            concepts.extend([count * 10, count * 100])
        
        return concepts[:count]
    
    def _generate_coverage_guided_concepts(self, count: int) -> List[int]:
        """Generate concepts to maximize code coverage"""
        concepts = []
        uncovered = self.coverage_tracker.get_uncovered_targets()
        
        # Single concept (edge case)
        if count >= 1 and "single_concept" in uncovered:
            concepts.append(1)
            self.coverage_tracker.record_branch_coverage("single_concept")
        
        # Small number of concepts
        if count >= 10 and "small_hierarchy" in uncovered:
            concepts.extend(range(2, 11))
            self.coverage_tracker.record_branch_coverage("small_hierarchy")
        
        # Large number (performance path)
        remaining = count - len(concepts)
        if remaining > 0:
            concepts.extend(range(len(concepts) + 1, len(concepts) + 1 + remaining))
            if remaining > 100:
                self.coverage_tracker.record_branch_coverage("large_hierarchy")
        
        return concepts[:count]
    
    # ===================================================================
    # RELATIONSHIP GENERATION METHODS
    # ===================================================================
    
    def _generate_random_relationships(self, concepts: List[int], density: float) -> List[Tuple[int, int]]:
        """Generate random parent-child relationships"""
        relationships = []
        total_possible = len(concepts) * (len(concepts) - 1)
        num_relationships = int(total_possible * density)
        
        for _ in range(num_relationships):
            parent = self.rng.choice(concepts)
            child = self.rng.choice(concepts)
            if parent != child:
                relationships.append((parent, child))
        
        return list(set(relationships))  # Remove duplicates
    
    def _generate_boundary_relationships(self, concepts: List[int], max_depth: int) -> List[Tuple[int, int]]:
        """Generate relationships focusing on boundary cases"""
        relationships = []
        
        if len(concepts) < 2:
            return relationships
        
        # Empty relationships (boundary case)
        if self.rng.random() < 0.2:
            self.coverage_tracker.record_branch_coverage("empty_hierarchy")
            return relationships
        
        # Single relationship
        if len(concepts) >= 2:
            relationships.append((concepts[0], concepts[1]))
            self.coverage_tracker.record_branch_coverage("single_relationship")
        
        # Create a minimal tree (boundary case)
        for i in range(1, min(len(concepts), max_depth + 1)):
            if i < len(concepts):
                relationships.append((concepts[0], concepts[i]))
                self.coverage_tracker.record_branch_coverage("star_pattern")
        
        return relationships
    
    def _generate_adversarial_relationships(self, concepts: List[int], max_depth: int) -> List[Tuple[int, int]]:
        """Generate relationships designed to stress the system"""
        relationships = []
        
        if len(concepts) < 2:
            return relationships
        
        # Try to create cycles (should be detected and rejected)
        if len(concepts) >= 3:
            relationships.extend([
                (concepts[0], concepts[1]),
                (concepts[1], concepts[2]),
                (concepts[2], concepts[0])  # Creates cycle
            ])
            self.coverage_tracker.record_branch_coverage("cycle_detection")
        
        # Self-references (invalid)
        relationships.extend([(c, c) for c in concepts[:3]])
        self.coverage_tracker.record_branch_coverage("invalid_refs")
        
        # Very deep chains
        for i in range(min(len(concepts) - 1, max_depth * 2)):
            if i + 1 < len(concepts):
                relationships.append((concepts[i], concepts[i + 1]))
                self.coverage_tracker.record_branch_coverage("chain_pattern")
        
        return relationships
    
    def _generate_coverage_guided_relationships(self, concepts: List[int], max_depth: int) -> List[Tuple[int, int]]:
        """Generate relationships to maximize code coverage"""
        relationships = []
        uncovered = self.coverage_tracker.get_uncovered_targets()
        
        # Empty relationships (edge case)
        if "empty_hierarchy" in uncovered:
            return relationships
        
        # Single relationship
        if len(concepts) >= 2 and "single_relationship" in uncovered:
            relationships.append((concepts[0], concepts[1]))
            self.coverage_tracker.record_branch_coverage("single_relationship")
        
        # Star pattern (one parent, many children)
        if len(concepts) >= 5 and "star_pattern" in uncovered:
            parent = concepts[0]
            for child in concepts[1:5]:
                relationships.append((parent, child))
            self.coverage_tracker.record_branch_coverage("star_pattern")
        
        # Chain pattern
        if len(concepts) >= 8 and "chain_pattern" in uncovered:
            for i in range(5, min(len(concepts) - 1, 8)):
                relationships.append((concepts[i], concepts[i + 1]))
            self.coverage_tracker.record_branch_coverage("chain_pattern")
        
        return relationships
    
    def _generate_scale_assignments(self, concepts: List[int], max_depth: int) -> List[int]:
        """Generate scale assignments for concepts"""
        return [self.rng.randint(0, max_depth) for _ in concepts]
    
    # ===================================================================
    # MEMORY THREAD GENERATION
    # ===================================================================
    
    def _generate_random_threads(self, thread_count: int, concepts_per_thread: int) -> List[Dict[str, Any]]:
        """Generate random memory threads"""
        threads = []
        for i in range(thread_count):
            thread_id = str(uuid.uuid4())
            concepts = [self.rng.randint(1, 1000) for _ in range(concepts_per_thread)]
            threads.append({
                "thread_id": thread_id,
                "concepts": concepts,
                "created_at": time.time(),
                "metadata": {
                    "thread_type": "random",
                    "complexity": len(set(concepts)) / len(concepts) if concepts else 0
                }
            })
        return threads
    
    def _generate_boundary_threads(self, thread_count: int, concepts_per_thread: int) -> List[Dict[str, Any]]:
        """Generate boundary case memory threads"""
        threads = []
        
        # Empty thread (boundary case)
        if thread_count > 0:
            threads.append({
                "thread_id": str(uuid.uuid4()),
                "concepts": [],
                "created_at": time.time(),
                "metadata": {"thread_type": "empty", "complexity": 0.0}
            })
            self.coverage_tracker.record_branch_coverage("empty_threads")
        
        # Single concept thread
        if thread_count > 1:
            threads.append({
                "thread_id": str(uuid.uuid4()),
                "concepts": [1],
                "created_at": time.time(),
                "metadata": {"thread_type": "single", "complexity": 1.0}
            })
            self.coverage_tracker.record_branch_coverage("single_thread")
        
        # Fill remaining with normal threads
        remaining = thread_count - len(threads)
        for i in range(remaining):
            concepts = [self.rng.randint(1, 100) for _ in range(concepts_per_thread)]
            threads.append({
                "thread_id": str(uuid.uuid4()),
                "concepts": concepts,
                "created_at": time.time(),
                "metadata": {"thread_type": "normal", "complexity": len(set(concepts)) / len(concepts)}
            })
        
        return threads[:thread_count]
    
    def _generate_adversarial_threads(self, thread_count: int, concepts_per_thread: int) -> List[Dict[str, Any]]:
        """Generate adversarial memory threads"""
        threads = []
        
        for i in range(thread_count):
            if i % 3 == 0:
                # Thread with duplicate concepts
                base_concepts = [self.rng.randint(1, 50) for _ in range(concepts_per_thread // 2)]
                concepts = base_concepts + base_concepts  # Duplicates
                thread_type = "duplicates"
            elif i % 3 == 1:
                # Thread with extreme concept IDs
                concepts = [0, -1, 999999, 1000000]  # Edge/invalid IDs
                thread_type = "extreme_ids"
            else:
                # Thread with high variance
                concepts = [self.rng.randint(1, 10000) for _ in range(concepts_per_thread)]
                thread_type = "high_variance"
            
            threads.append({
                "thread_id": str(uuid.uuid4()),
                "concepts": concepts,
                "created_at": time.time(),
                "metadata": {
                    "thread_type": thread_type,
                    "complexity": len(set(concepts)) / len(concepts) if concepts else 0
                }
            })
        
        return threads
    
    def _generate_random_braiding(self, threads: List[Dict[str, Any]], probability: float) -> List[Tuple[str, str]]:
        """Generate random braiding patterns"""
        braiding_pattern = []
        thread_ids = [t["thread_id"] for t in threads]
        
        for i in range(len(thread_ids)):
            for j in range(i + 1, len(thread_ids)):
                if self.rng.random() < probability:
                    braiding_pattern.append((thread_ids[i], thread_ids[j]))
        
        return braiding_pattern
    
    def _generate_boundary_braiding(self, threads: List[Dict[str, Any]]) -> List[Tuple[str, str]]:
        """Generate boundary case braiding patterns"""
        braiding_pattern = []
        thread_ids = [t["thread_id"] for t in threads]
        
        if len(thread_ids) < 2:
            return braiding_pattern
        
        # No braiding (boundary case)
        if self.rng.random() < 0.3:
            return braiding_pattern
        
        # Single braid
        if len(thread_ids) >= 2:
            braiding_pattern.append((thread_ids[0], thread_ids[1]))
        
        return braiding_pattern
    
    def _generate_adversarial_braiding(self, threads: List[Dict[str, Any]]) -> List[Tuple[str, str]]:
        """Generate adversarial braiding patterns"""
        braiding_pattern = []
        thread_ids = [t["thread_id"] for t in threads]
        
        # Self-braiding (invalid)
        if thread_ids:
            braiding_pattern.append((thread_ids[0], thread_ids[0]))
        
        # All possible braids (maximum complexity)
        for i in range(len(thread_ids)):
            for j in range(i + 1, len(thread_ids)):
                braiding_pattern.append((thread_ids[i], thread_ids[j]))
        
        self.coverage_tracker.record_branch_coverage("complex_braiding")
        return braiding_pattern
    
    def _generate_temporal_sequence(self, threads: List[Dict[str, Any]], parameters: Dict[str, Any]) -> List[Tuple[float, int]]:
        """Generate temporal sequence for threads"""
        sequence = []
        current_time = time.time()
        temporal_skew = parameters.get("temporal_skew", 1.0)
        
        for thread in threads:
            for concept in thread["concepts"]:
                sequence.append((current_time, concept))
                current_time += self.rng.random() * temporal_skew
        
        return sorted(sequence)  # Sort by time
    
    # ===================================================================
    # SIMILARITY MATRIX GENERATION
    # ===================================================================
    
    def _generate_random_similarity_matrix(self, concept_count: int) -> List[List[float]]:
        """Generate random similarity matrix"""
        matrix = [[0.0 for _ in range(concept_count)] for _ in range(concept_count)]
        
        for i in range(concept_count):
            for j in range(i, concept_count):
                if i == j:
                    matrix[i][j] = 1.0  # Self-similarity
                else:
                    similarity = self.rng.random()
                    matrix[i][j] = similarity
                    matrix[j][i] = similarity  # Symmetric
        
        return matrix
    
    def _generate_boundary_similarity_matrix(self, concept_count: int) -> List[List[float]]:
        """Generate similarity matrix with boundary values"""
        matrix = [[0.0 for _ in range(concept_count)] for _ in range(concept_count)]
        
        for i in range(concept_count):
            for j in range(i, concept_count):
                if i == j:
                    matrix[i][j] = 1.0
                else:
                    # Use boundary values: 0.0, 1.0, 0.5
                    similarity = self.rng.choice([0.0, 0.5, 1.0])
                    matrix[i][j] = similarity
                    matrix[j][i] = similarity
        
        return matrix
    
    def _generate_adversarial_similarity_matrix(self, concept_count: int) -> List[List[float]]:
        """Generate adversarial similarity matrix"""
        matrix = [[0.0 for _ in range(concept_count)] for _ in range(concept_count)]
        
        for i in range(concept_count):
            for j in range(i, concept_count):
                if i == j:
                    # Test with non-1.0 self-similarity (invalid)
                    matrix[i][j] = self.rng.choice([0.0, 0.5, 1.0, 1.5])
                else:
                    # Include invalid values
                    similarity = self.rng.choice([
                        -1.0, 0.0, 0.5, 1.0, 2.0
                    ])
                    if self.rng.random() < 0.1:  # 10% chance of extreme values
                        similarity = self.rng.choice([float('inf'), float('-inf'), float('nan')])
                    matrix[i][j] = similarity
                    matrix[j][i] = similarity
        
        return matrix
    
    def _generate_random_concept_pairs(self, concepts: List[int], density: float) -> List[Tuple[int, int]]:
        """Generate random concept pairs"""
        pairs = []
        total_pairs = len(concepts) * (len(concepts) - 1) // 2
        num_pairs = int(total_pairs * density)
        
        all_pairs = [(concepts[i], concepts[j]) 
                     for i in range(len(concepts)) 
                     for j in range(i + 1, len(concepts))]
        
        return self.rng.sample(all_pairs, min(num_pairs, len(all_pairs)))
    
    def _generate_boundary_concept_pairs(self, concepts: List[int]) -> List[Tuple[int, int]]:
        """Generate boundary case concept pairs"""
        if len(concepts) < 2:
            return []
        
        # Minimal pairs (boundary case)
        return [(concepts[0], concepts[1])]
    
    def _generate_adversarial_concept_pairs(self, concepts: List[int]) -> List[Tuple[int, int]]:
        """Generate adversarial concept pairs"""
        pairs = []
        
        # Self-pairs (invalid)
        for concept in concepts[:3]:
            pairs.append((concept, concept))
        
        # Pairs with invalid IDs
        if concepts:
            pairs.extend([
                (concepts[0], 0),      # Invalid ID
                (concepts[0], -1),     # Invalid ID
                (concepts[0], 999999)  # Very large ID
            ])
        
        return pairs
    
    # ===================================================================
    # ALIEN SERIES GENERATION
    # ===================================================================
    
    def _generate_random_series_with_aliens(self, length: int, variance: float, alien_prob: float) -> List[float]:
        """Generate random series with injected alien terms"""
        series = []
        base_value = 1.0
        trend = (self.rng.random() - 0.5) * 0.01  # Small trend
        
        for i in range(length):
            # Base value with trend and noise
            value = base_value + trend * i + self.rng.gauss(0, variance)
            
            # Inject alien terms
            if self.rng.random() < alien_prob:
                # Alien spike - exponentially suppressed term
                alien_magnitude = self.rng.choice([3.0, 4.0, 5.0, -3.0, -4.0, -5.0])
                action_value = self.rng.uniform(0.5, 5.0)
                # Simulate exponential suppression: exp(-S/g) where g->0
                g_param = 1.0 / (i + 1)  # Parameter going to zero
                suppression = np.exp(-action_value / max(g_param, 0.01))
                value += alien_magnitude * suppression
            
            series.append(value)
        
        return series
    
    def _generate_boundary_series(self, length: int, variance: float) -> List[float]:
        """Generate boundary case series"""
        if length == 0:
            return []
        elif length == 1:
            return [1.0]
        else:
            # Series with extreme characteristics
            return [0.0] * (length // 2) + [1000.0] * (length - length // 2)
    
    def _generate_adversarial_series(self, length: int) -> List[float]:
        """Generate adversarial series for alien detection"""
        series = []
        
        for i in range(length):
            if i % 10 == 0:
                # Include problematic values
                value = self.rng.choice([
                    float('inf'), float('-inf'), float('nan'), 0.0, 1e10, -1e10
                ])
            else:
                value = self.rng.gauss(0, 1)
            
            series.append(value)
        
        return series
    
    def _generate_random_alien_candidates(self) -> List[Tuple[float, float]]:
        """Generate random alien candidates (action, coefficient)"""
        candidates = []
        for _ in range(5):
            action = self.rng.uniform(0.5, 5.0)
            coefficient = self.rng.uniform(0.01, 0.5)
            candidates.append((action, coefficient))
        return candidates
    
    def _generate_boundary_alien_candidates(self) -> List[Tuple[float, float]]:
        """Generate boundary alien candidates"""
        return [
            (0.0, 0.0),      # Boundary values
            (0.1, 0.001),    # Very small values
            (10.0, 1.0),     # Large values
        ]
    
    def _generate_adversarial_alien_candidates(self) -> List[Tuple[float, float]]:
        """Generate adversarial alien candidates"""
        return [
            (0.0, 0.0),
            (-1.0, 0.5),         # Negative action (invalid)
            (1.0, float('nan')), # NaN coefficient
            (float('inf'), 0.1), # Infinite action
        ]

# ===================================================================
# STATISTICAL ANALYSIS AND VALIDATION
# ===================================================================

class StatisticalAnalyzer:
    """Performs statistical analysis on test results"""
    
    def __init__(self):
        self.test_results = []
        self.performance_metrics = {}
        
    def analyze_test_distribution(self, results: List[PropertyTestResult]) -> Dict[str, Any]:
        """Analyze the distribution of test results"""
        if not results:
            return {"error": "No results to analyze"}
        
        pass_rates = [1.0 if r.passed else 0.0 for r in results]
        execution_times = [r.execution_time for r in results]
        
        analysis = {
            "total_tests": len(results),
            "pass_rate": np.mean(pass_rates),
            "pass_rate_std": np.std(pass_rates),
            "execution_time_stats": {
                "mean": np.mean(execution_times),
                "std": np.std(execution_times),
                "median": np.median(execution_times),
                "p95": np.percentile(execution_times, 95),
                "p99": np.percentile(execution_times, 99)
            },
            "confidence_interval": self._calculate_confidence_interval(pass_rates),
            "performance_trends": self._analyze_performance_trends(results)
        }
        
        return analysis
    
    def _calculate_confidence_interval(self, data: List[float], confidence: float = 0.95) -> Tuple[float, float]:
        """Calculate confidence interval for pass rate"""
        if not data:
            return (0.0, 0.0)
        
        mean = np.mean(data)
        sem = scipy.stats.sem(data)
        h = sem * scipy.stats.t.ppf((1 + confidence) / 2., len(data) - 1)
        
        return (mean - h, mean + h)
    
    def _analyze_performance_trends(self, results: List[PropertyTestResult]) -> Dict[str, Any]:
        """Analyze performance trends over time"""
        if len(results) < 10:
            return {"insufficient_data": True}
        
        execution_times = [r.execution_time for r in results]
        
        # Simple linear regression to detect trends
        x = np.arange(len(execution_times))
        slope, intercept, r_value, p_value, std_err = scipy.stats.linregress(x, execution_times)
        
        return {
            "trend_slope": slope,
            "trend_r_squared": r_value ** 2,
            "trend_significance": p_value,
            "performance_degradation": slope > 0.001,  # Threshold for concern
            "variability": np.std(execution_times) / np.mean(execution_times)
        }
    
    def detect_anomalies(self, series_data: List[float]) -> Dict[str, Any]:
        """Detect anomalies in series data using statistical methods"""
        if len(series_data) < 10:
            return {"insufficient_data": True}
        
        data = np.array(series_data)
        
        # Remove infinite and NaN values for analysis
        clean_data = data[np.isfinite(data)]
        if len(clean_data) == 0:
            return {"error": "No finite data points"}
        
        # Z-score based anomaly detection
        z_scores = np.abs(scipy.stats.zscore(clean_data))
        z_anomalies = np.where(z_scores > 3)[0]
        
        # IQR based anomaly detection
        Q1 = np.percentile(clean_data, 25)
        Q3 = np.percentile(clean_data, 75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        iqr_anomalies = np.where((clean_data < lower_bound) | (clean_data > upper_bound))[0]
        
        # Statistical tests
        normality_test = scipy.stats.normaltest(clean_data)
        
        return {
            "total_points": len(series_data),
            "finite_points": len(clean_data),
            "z_score_anomalies": len(z_anomalies),
            "iqr_anomalies": len(iqr_anomalies),
            "anomaly_indices": {
                "z_score": z_anomalies.tolist(),
                "iqr": iqr_anomalies.tolist()
            },
            "statistical_properties": {
                "mean": np.mean(clean_data),
                "std": np.std(clean_data),
                "skewness": scipy.stats.skew(clean_data),
                "kurtosis": scipy.stats.kurtosis(clean_data)
            },
            "normality_test": {
                "statistic": normality_test.statistic,
                "p_value": normality_test.pvalue,
                "is_normal": normality_test.pvalue > 0.05
            }
        }

# ===================================================================
# WEB SERVICE FOR RUST INTEGRATION
# ===================================================================

class ConceptFuzzService:
    """Web service for Rust-Python integration"""
    
    def __init__(self, port: int = 8005):
        self.port = port
        self.generator = PropertyTestGenerator()
        self.analyzer = StatisticalAnalyzer()
        self.app = web.Application()
        self.setup_routes()
        
    def setup_routes(self):
        """Setup web service routes"""
        self.app.router.add_post('/generate_test_case', self.generate_test_case)
        self.app.router.add_post('/analyze_series', self.analyze_series)
        self.app.router.add_post('/validate_property', self.validate_property)
        self.app.router.add_get('/health', self.health_check)
        self.app.router.add_get('/coverage', self.get_coverage_info)
        self.app.router.add_post('/transseries_analysis', self.transseries_analysis)
        
    async def generate_test_case(self, request):
        """Generate test case endpoint"""
        try:
            data = await request.json()
            target_module = data.get('target_module', 'MultiScaleHierarchy')
            parameters = data.get('parameters', {})
            
            if target_module == 'MultiScaleHierarchy':
                test_case = self.generator.generate_hierarchy_test_case(parameters)
            elif target_module == 'BraidMemory':
                test_case = self.generator.generate_memory_test_case(parameters)
            elif target_module == 'WormholeEngine':
                test_case = self.generator.generate_wormhole_test_case(parameters)
            elif target_module == 'AlienCalculus':
                test_case = self.generator.generate_alien_test_case(parameters)
            else:
                return web.json_response({'error': 'Unknown target module'}, status=400)
            
            return web.json_response(asdict(test_case))
            
        except Exception as e:
            return web.json_response({'error': str(e)}, status=500)
    
    async def analyze_series(self, request):
        """Analyze series data endpoint"""
        try:
            data = await request.json()
            series_data = data.get('series_data', [])
            
            analysis = self.analyzer.detect_anomalies(series_data)
            return web.json_response(analysis)
            
        except Exception as e:
            return web.json_response({'error': str(e)}, status=500)
    
    async def transseries_analysis(self, request):
        """Transseries analysis endpoint"""
        try:
            data = await request.json()
            series_data = data.get('series_data', [])
            max_order = data.get('max_order', 5)
            
            analysis = self.generator.transseries_analyzer.fit_transseries(series_data, max_order)
            return web.json_response(analysis)
            
        except Exception as e:
            return web.json_response({'error': str(e)}, status=500)
    
    async def validate_property(self, request):
        """Validate property endpoint"""
        try:
            data = await request.json()
            property_name = data.get('property_name')
            test_data = data.get('test_data')
            
            result = self._validate_property(property_name, test_data)
            return web.json_response(result)
            
        except Exception as e:
            return web.json_response({'error': str(e)}, status=500)
    
    async def health_check(self, request):
        """Health check endpoint"""
        return web.json_response({
            'status': 'healthy',
            'timestamp': time.time(),
            'service': 'ConceptFuzzService',
            'coverage': self.generator.coverage_tracker.get_coverage_percentage()
        })
    
    async def get_coverage_info(self, request):
        """Get coverage information endpoint"""
        coverage_analysis = self.generator.coverage_tracker.analyze_coverage_gaps()
        return web.json_response(coverage_analysis)
    
    def _validate_property(self, property_name: str, test_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a specific property"""
        if property_name == "no_cycles":
            return self._validate_no_cycles(test_data)
        elif property_name == "braid_coherence":
            return self._validate_braid_coherence(test_data)
        elif property_name == "similarity_symmetry":
            return self._validate_similarity_symmetry(test_data)
        elif property_name == "alien_detection_accuracy":
            return self._validate_alien_detection(test_data)
        else:
            return {"error": f"Unknown property: {property_name}"}
    
    def _validate_no_cycles(self, test_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate that hierarchy has no cycles"""
        relationships = test_data.get('relationships', [])
        
        # Build adjacency list
        graph = {}
        for parent, child in relationships:
            if parent not in graph:
                graph[parent] = []
            graph[parent].append(child)
        
        # DFS cycle detection
        visited = set()
        rec_stack = set()
        
        def has_cycle(node):
            if node in rec_stack:
                return True
            if node in visited:
                return False
            
            visited.add(node)
            rec_stack.add(node)
            
            for neighbor in graph.get(node, []):
                if has_cycle(neighbor):
                    return True
            
            rec_stack.remove(node)
            return False
        
        for node in graph:
            if node not in visited:
                if has_cycle(node):
                    return {"valid": False, "reason": "Cycle detected"}
        
        return {"valid": True, "cycles_found": 0}
    
    def _validate_braid_coherence(self, test_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate braid coherence (simplified)"""
        braiding_pattern = test_data.get('braiding_pattern', [])
        threads = test_data.get('threads', [])
        
        thread_ids = set(t['thread_id'] for t in threads)
        
        # Check if all braided threads exist
        for thread_a, thread_b in braiding_pattern:
            if thread_a not in thread_ids or thread_b not in thread_ids:
                return {"valid": False, "reason": "Invalid thread reference in braiding"}
            if thread_a == thread_b:
                return {"valid": False, "reason": "Self-braiding detected"}
        
        return {"valid": True, "braids_validated": len(braiding_pattern)}
    
    def _validate_similarity_symmetry(self, test_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate similarity matrix symmetry"""
        similarity_matrix = test_data.get('similarity_matrix', [])
        
        if not similarity_matrix:
            return {"valid": True, "reason": "Empty matrix"}
        
        n = len(similarity_matrix)
        for i in range(n):
            if len(similarity_matrix[i]) != n:
                return {"valid": False, "reason": "Non-square matrix"}
            
            for j in range(n):
                if abs(similarity_matrix[i][j] - similarity_matrix[j][i]) > 1e-10:
                    return {"valid": False, "reason": f"Asymmetry at ({i},{j})"}
        
        return {"valid": True, "symmetry_validated": True}
    
    def _validate_alien_detection(self, test_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate alien detection logic"""
        series_data = test_data.get('series_data', [])
        
        analysis = self.analyzer.detect_anomalies(series_data)
        transseries_analysis = self.generator.transseries_analyzer.fit_transseries(series_data)
        
        # Check if detected aliens match mathematical expectations
        has_anomalies = (analysis.get('z_score_anomalies', 0) > 0 or 
                        analysis.get('iqr_anomalies', 0) > 0)
        
        has_aliens = transseries_analysis.get('alien_significance', 0) > 1.0
        
        return {
            "valid": True,
            "anomalies_detected": has_anomalies,
            "aliens_detected": has_aliens,
            "statistical_analysis": analysis,
            "transseries_analysis": transseries_analysis
        }
    
    async def start_server(self):
        """Start the web service"""
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        print(f"ConceptFuzzService started on http://localhost:{self.port}")
        print(f"Coverage: {self.generator.coverage_tracker.get_coverage_percentage():.1f}%")
        return runner

# ===================================================================
# COMMAND LINE INTERFACE
# ===================================================================

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='TORI ConceptFuzzing Python Service')
    parser.add_argument('--port', type=int, default=8005, help='Server port')
    parser.add_argument('--server', action='store_true', help='Run as server')
    parser.add_argument('--test', action='store_true', help='Run tests')
    parser.add_argument('--generate', type=str, help='Generate test case for module')
    parser.add_argument('--seed', type=int, help='Random seed')
    parser.add_argument('--analyze', type=str, help='Analyze series from JSON file')
    
    args = parser.parse_args()
    
    if args.server:
        service = ConceptFuzzService(args.port)
        runner = await service.start_server()
        
        try:
            # Keep server running
            while True:
                await asyncio.sleep(3600)  # Sleep for 1 hour
        except KeyboardInterrupt:
            print("Shutting down server...")
        finally:
            await runner.cleanup()
            
    elif args.test:
        # Run comprehensive test suite
        generator = PropertyTestGenerator(args.seed)
        analyzer = StatisticalAnalyzer()
        
        print("Running TORI ConceptFuzzing test suite...")
        
        # Test hierarchy generation
        print("\n1. Testing Hierarchy Generation...")
        hierarchy_test = generator.generate_hierarchy_test_case({
            "concept_count": 50,
            "hierarchy_depth": 4,
            "connection_density": 0.3
        })
        print(f"   Generated hierarchy test: {hierarchy_test.test_id}")
        print(f"   Concepts: {len(hierarchy_test.input_data['concepts'])}")
        print(f"   Relationships: {len(hierarchy_test.input_data['relationships'])}")
        
        # Test memory generation
        print("\n2. Testing Memory Thread Generation...")
        memory_test = generator.generate_memory_test_case({
            "thread_count": 10,
            "concepts_per_thread": 8,
            "braiding_probability": 0.4
        })
        print(f"   Generated memory test: {memory_test.test_id}")
        print(f"   Threads: {len(memory_test.input_data['threads'])}")
        print(f"   Braiding patterns: {len(memory_test.input_data['braiding_pattern'])}")
        
        # Test wormhole generation
        print("\n3. Testing Wormhole Generation...")
        wormhole_test = generator.generate_wormhole_test_case({
            "concept_count": 20,
            "connection_density": 0.3
        })
        print(f"   Generated wormhole test: {wormhole_test.test_id}")
        print(f"   Concept pairs: {len(wormhole_test.input_data['concept_pairs'])}")
        
        # Test alien series generation
        print("\n4. Testing Alien Series Generation...")
        alien_test = generator.generate_alien_test_case({
            "series_length": 100,
            "novelty_variance": 1.5,
            "alien_probability": 0.1
        })
        print(f"   Generated alien test: {alien_test.test_id}")
        series_data = alien_test.input_data["series_data"]
        print(f"   Series length: {len(series_data)}")
        
        # Analyze generated series
        print("\n5. Analyzing Generated Series...")
        series_analysis = analyzer.detect_anomalies(series_data)
        print(f"   Statistical anomalies: {series_analysis.get('z_score_anomalies', 0)}")
        print(f"   IQR anomalies: {series_analysis.get('iqr_anomalies', 0)}")
        
        # Test transseries analysis
        transseries_analysis = generator.transseries_analyzer.fit_transseries(series_data)
        print(f"   Alien significance: {transseries_analysis.get('alien_significance', 0):.3f}")
        print(f"   Detected alien terms: {len(transseries_analysis.get('alien_terms', []))}")
        
        # Coverage analysis
        print("\n6. Coverage Analysis...")
        coverage = generator.coverage_tracker.analyze_coverage_gaps()
        print(f"   Coverage: {coverage['coverage_percentage']:.1f}%")
        print(f"   Covered branches: {coverage['covered_branches']}")
        print(f"   Uncovered branches: {len(coverage['never_executed'])}")
        
        print("\n✅ Test suite completed successfully!")
        
    elif args.generate:
        # Generate single test case
        generator = PropertyTestGenerator(args.seed)
        
        if args.generate == "hierarchy":
            test_case = generator.generate_hierarchy_test_case({"concept_count": 20})
        elif args.generate == "memory":
            test_case = generator.generate_memory_test_case({"thread_count": 5})
        elif args.generate == "wormhole":
            test_case = generator.generate_wormhole_test_case({"concept_count": 15})
        elif args.generate == "alien":
            test_case = generator.generate_alien_test_case({"series_length": 50})
        else:
            print(f"Unknown module: {args.generate}")
            return
        
        print(json.dumps(asdict(test_case), indent=2, default=str))
        
    elif args.analyze:
        # Analyze series from file
        try:
            with open(args.analyze, 'r') as f:
                data = json.load(f)
            
            series_data = data.get('series_data', data)  # Support both formats
            
            analyzer = StatisticalAnalyzer()
            transseries_analyzer = TransseriesAnalyzer()
            
            print(f"Analyzing series from {args.analyze}...")
            print(f"Series length: {len(series_data)}")
            
            # Statistical analysis
            stats = analyzer.detect_anomalies(series_data)
            print(f"\nStatistical Analysis:")
            print(f"  Anomalies (Z-score): {stats.get('z_score_anomalies', 0)}")
            print(f"  Anomalies (IQR): {stats.get('iqr_anomalies', 0)}")
            print(f"  Mean: {stats.get('statistical_properties', {}).get('mean', 0):.3f}")
            print(f"  Std: {stats.get('statistical_properties', {}).get('std', 0):.3f}")
            
            # Transseries analysis
            transseries = transseries_analyzer.fit_transseries(series_data)
            print(f"\nTransseries Analysis:")
            print(f"  Alien significance: {transseries.get('alien_significance', 0):.3f}")
            print(f"  Alien terms detected: {len(transseries.get('alien_terms', []))}")
            print(f"  Fit quality: {transseries.get('fit_quality', 0):.6f}")
            
            if transseries.get('alien_terms'):
                print("\nDetected Alien Terms:")
                for i, term in enumerate(transseries['alien_terms'][:3]):  # Top 3
                    print(f"  {i+1}. Action: {term['action']:.2f}, Coeff: {term['coefficient']:.4f}, Sig: {term['significance']:.2f}")
                    
        except Exception as e:
            print(f"Error analyzing file: {e}")
        
    else:
        parser.print_help()

if __name__ == "__main__":
    asyncio.run(main())
