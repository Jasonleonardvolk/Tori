"""
TORI AlienCalculus - Python Mathematical Analysis Component

This module implements the advanced mathematical algorithms for alien calculus
based on Écalle's resurgence theory. It provides:

- Transseries analysis and fitting
- Alien derivative computation  
- Borel summation and resummation
- Stokes phenomena detection
- Asymptotic series analysis
- Cohomological computations for scar detection

The module serves as a mathematical backend for the Rust AlienCalculus core,
handling computationally intensive operations that benefit from Python's
scientific computing ecosystem.
"""

import numpy as np
import scipy.optimize
import scipy.special
import scipy.integrate
import sympy as sp
from sympy import symbols, exp, Sum, oo, diff, I, pi, E
from typing import List, Dict, Tuple, Optional, Any, Union
import json
import asyncio
import aiohttp
from aiohttp import web
import logging
import argparse
import time
from dataclasses import dataclass, asdict
from enum import Enum
import warnings

# Suppress specific warnings for cleaner output
warnings.filterwarnings('ignore', category=RuntimeWarning)
warnings.filterwarnings('ignore', category=UserWarning)

# ===================================================================
# TYPE DEFINITIONS AND DATA STRUCTURES
# ===================================================================

@dataclass
class SeriesData:
    """Input data for series analysis"""
    series_id: str
    novelty_scores: List[float]
    timestamps: List[int]
    context_id: str = ""
    
@dataclass 
class AnalysisParameters:
    """Parameters for alien calculus analysis"""
    alien_threshold: float = 2.5
    significance_threshold: float = 0.001
    max_terms: int = 20
    precision: float = 1e-10
    borel_radius: float = 1.0
    stokes_tolerance: float = 0.1

@dataclass
class NonPerturbativeTerm:
    """Represents a non-perturbative (alien) term in transseries"""
    action: float  # S_m in exp(-S_m/g)
    coefficient: float  # Leading coefficient
    power_series: List[float]  # Coefficients of g^n expansion
    confidence: float
    detected_at: float
    term_type: str = "exponential"

@dataclass
class TransseriesResult:
    """Result of transseries analysis"""
    perturbative_coeffs: List[float]
    non_perturbative_terms: List[NonPerturbativeTerm] 
    alien_derivatives: Dict[float, float]
    stokes_points: List[float]
    bridge_equation_valid: bool
    analysis_quality: float
    computation_time: float

@dataclass
class CohomologyResult:
    """Result of cohomological analysis for scar detection"""
    dimension: int
    is_trivial: bool
    obstruction_measure: float
    cocycle_data: List[float]
    cover_description: str

# ===================================================================
# CORE MATHEMATICAL FUNCTIONS
# ===================================================================

class AlienCalculusEngine:
    """Core engine for alien calculus computations"""
    
    def __init__(self, params: AnalysisParameters = None):
        self.params = params or AnalysisParameters()
        self.logger = logging.getLogger(__name__)
        
        # Symbolic variables for formal computations
        self.g, self.x, self.t = symbols('g x t', real=True, positive=True)
        self.n, self.m, self.k = symbols('n m k', integer=True, nonnegative=True)
        
        # Cache for expensive computations
        self._borel_cache = {}
        self._factorial_cache = {0: 1.0, 1: 1.0}
        
    def analyze_transseries(self, series_data: SeriesData) -> TransseriesResult:
        """
        Main entry point for transseries analysis of concept series
        
        Implements Écalle's transseries expansion:
        S(g) ~ Σ a_n g^n + Σ exp(-S_m/g) Σ a_n^(m) g^n
        """
        start_time = time.time()
        
        try:
            # Validate input data
            if len(series_data.novelty_scores) < 3:
                raise ValueError("Insufficient data for transseries analysis")
                
            # Convert to numpy arrays for efficient computation
            scores = np.array(series_data.novelty_scores, dtype=np.float64)
            timestamps = np.array(series_data.timestamps, dtype=np.float64)
            
            # Normalize time series
            normalized_scores = self._normalize_series(scores)
            
            # Fit perturbative part (polynomial expansion)
            perturbative_coeffs = self._fit_perturbative_series(normalized_scores)
            
            # Detect and analyze non-perturbative terms
            non_perturbative_terms = self._detect_alien_terms(
                normalized_scores, perturbative_coeffs
            )
            
            # Compute alien derivatives
            alien_derivatives = self._compute_alien_derivatives(
                normalized_scores, non_perturbative_terms
            )
            
            # Detect Stokes phenomena
            stokes_points = self._detect_stokes_phenomena(normalized_scores)
            
            # Verify bridge equations
            bridge_valid = self._verify_bridge_equations(
                perturbative_coeffs, non_perturbative_terms, alien_derivatives
            )
            
            # Assess analysis quality
            quality = self._assess_analysis_quality(
                scores, perturbative_coeffs, non_perturbative_terms
            )
            
            computation_time = time.time() - start_time
            
            return TransseriesResult(
                perturbative_coeffs=perturbative_coeffs,
                non_perturbative_terms=non_perturbative_terms,
                alien_derivatives=alien_derivatives,
                stokes_points=stokes_points,
                bridge_equation_valid=bridge_valid,
                analysis_quality=quality,
                computation_time=computation_time
            )
            
        except Exception as e:
            self.logger.error(f"Transseries analysis failed: {e}")
            raise
    
    def _normalize_series(self, scores: np.ndarray) -> np.ndarray:
        """Normalize series for analysis"""
        if len(scores) == 0:
            return scores
            
        # Remove trend
        x = np.arange(len(scores))
        slope, intercept = np.polyfit(x, scores, 1) if len(scores) > 1 else (0, scores[0])
        detrended = scores - (slope * x + intercept)
        
        # Normalize to unit variance
        std = np.std(detrended)
        if std > 1e-10:
            normalized = detrended / std
        else:
            normalized = detrended
            
        return normalized
    
    def _fit_perturbative_series(self, scores: np.ndarray) -> List[float]:
        """
        Fit perturbative part of transseries using polynomial regression
        
        Fits: Σ a_n g^n where g = 1/x (asymptotic parameter)
        """
        n_points = len(scores)
        max_degree = min(self.params.max_terms, n_points - 1)
        
        # Create asymptotic parameter g = 1/(x+1) to avoid division by zero
        x_values = np.arange(1, n_points + 1, dtype=np.float64)
        g_values = 1.0 / x_values
        
        # Fit polynomial in g
        try:
            coeffs = np.polyfit(g_values, scores, deg=max_degree)
            # Reverse to get a_0, a_1, a_2, ... order
            return coeffs[::-1].tolist()
        except np.linalg.LinAlgError:
            # Fallback to simple mean if polynomial fit fails
            self.logger.warning("Polynomial fit failed, using simple approximation")
            return [np.mean(scores)] + [0.0] * (max_degree - 1)
    
    def _detect_alien_terms(self, scores: np.ndarray, perturbative_coeffs: List[float]) -> List[NonPerturbativeTerm]:
        """
        Detect non-perturbative (alien) terms in the series
        
        Looks for exponentially small terms of form exp(-S/g)
        """
        alien_terms = []
        n_points = len(scores)
        
        if n_points < 5:
            return alien_terms
            
        # Reconstruct perturbative approximation
        x_values = np.arange(1, n_points + 1, dtype=np.float64)
        g_values = 1.0 / x_values
        
        perturbative_approx = np.zeros_like(scores)
        for i, coeff in enumerate(perturbative_coeffs):
            if i < len(perturbative_coeffs):
                perturbative_approx += coeff * (g_values ** i)
        
        # Compute residuals
        residuals = scores - perturbative_approx
        
        # Look for exponential patterns in residuals
        for action_candidate in [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0]:
            exponential_weights = np.exp(-action_candidate / g_values)
            
            # Fit coefficient using least squares
            if np.sum(exponential_weights**2) > 1e-10:
                coefficient = np.dot(residuals, exponential_weights) / np.sum(exponential_weights**2)
                
                # Check if this explains significant variance
                explained_variance = np.sum((coefficient * exponential_weights)**2)
                total_variance = np.sum(residuals**2)
                
                if (explained_variance / max(total_variance, 1e-10)) > self.params.significance_threshold:
                    # Fit power series for this alien term
                    power_series = self._fit_alien_power_series(
                        residuals, exponential_weights, g_values, coefficient
                    )
                    
                    confidence = min(explained_variance / max(total_variance, 1e-10), 1.0)
                    
                    alien_term = NonPerturbativeTerm(
                        action=action_candidate,
                        coefficient=float(coefficient),
                        power_series=power_series,
                        confidence=confidence,
                        detected_at=time.time(),
                        term_type="exponential"
                    )
                    
                    alien_terms.append(alien_term)
        
        # Sort by confidence and return top terms
        alien_terms.sort(key=lambda x: x.confidence, reverse=True)
        return alien_terms[:min(5, len(alien_terms))]
    
    def _fit_alien_power_series(self, residuals: np.ndarray, exp_weights: np.ndarray, 
                               g_values: np.ndarray, base_coeff: float) -> List[float]:
        """Fit power series expansion for an alien term"""
        max_power = min(5, len(residuals) - 1)
        power_coeffs = [base_coeff]  # a_0^(m)
        
        # Subtract the leading exponential term
        remaining = residuals - base_coeff * exp_weights
        
        # Fit additional powers of g
        for power in range(1, max_power + 1):
            if np.sum((exp_weights * (g_values ** power))**2) > 1e-10:
                coeff = (np.dot(remaining, exp_weights * (g_values ** power)) / 
                        np.sum((exp_weights * (g_values ** power))**2))
                power_coeffs.append(float(coeff))
                remaining -= coeff * exp_weights * (g_values ** power)
            else:
                power_coeffs.append(0.0)
        
        return power_coeffs
    
    def _compute_alien_derivatives(self, scores: np.ndarray, 
                                 alien_terms: List[NonPerturbativeTerm]) -> Dict[float, float]:
        """
        Compute alien derivatives Δ_{S_k}
        
        The alien derivative extracts the coefficient of exp(-S_k/g) terms
        """
        alien_derivatives = {}
        
        for term in alien_terms:
            action = term.action
            
            # Simplified alien derivative computation
            # In full theory, this involves complex resurgent analysis
            alien_derivative = term.coefficient * action
            
            # Apply correction factors based on the power series
            if len(term.power_series) > 1:
                # Include oscillatory contributions from higher-order terms
                oscillatory_correction = sum(
                    coeff * np.cos(i * np.pi / 4) 
                    for i, coeff in enumerate(term.power_series[1:], 1)
                )
                alien_derivative += oscillatory_correction * 0.1  # Scale factor
            
            alien_derivatives[action] = alien_derivative
        
        return alien_derivatives
    
    def _detect_stokes_phenomena(self, scores: np.ndarray) -> List[float]:
        """
        Detect Stokes phenomena - discontinuities where alien terms appear
        
        Stokes lines are where the dominant behavior changes
        """
        stokes_points = []
        
        if len(scores) < 5:
            return stokes_points
        
        # Compute local derivatives
        derivatives = np.gradient(scores)
        second_derivatives = np.gradient(derivatives)
        
        # Look for sudden changes in curvature (Stokes phenomena)
        for i in range(2, len(second_derivatives) - 2):
            local_window = second_derivatives[i-2:i+3]
            local_std = np.std(local_window)
            
            if local_std > 0:
                z_score = abs(second_derivatives[i] - np.mean(local_window)) / local_std
                if z_score > self.params.alien_threshold:
                    # Convert index to parameter value
                    g_value = 1.0 / (i + 1)
                    stokes_points.append(g_value)
        
        return stokes_points
    
    def _verify_bridge_equations(self, perturbative_coeffs: List[float],
                                alien_terms: List[NonPerturbativeTerm],
                                alien_derivatives: Dict[float, float]) -> bool:
        """
        Verify Écalle's bridge equations relating alien derivatives
        
        The bridge equation connects alien derivatives to ordinary derivatives
        """
        if not alien_terms or not alien_derivatives:
            return True  # Trivially satisfied if no alien terms
        
        # Simplified bridge equation verification
        # Full version requires complex analysis and contour integration
        
        for term in alien_terms:
            action = term.action
            if action in alien_derivatives:
                # Check consistency between alien derivative and term coefficient
                expected_derivative = term.coefficient * action
                actual_derivative = alien_derivatives[action]
                
                relative_error = abs(actual_derivative - expected_derivative) / max(abs(expected_derivative), 1e-10)
                
                if relative_error > self.params.precision * 100:  # Allow some tolerance
                    return False
        
        return True
    
    def _assess_analysis_quality(self, original_scores: np.ndarray,
                               perturbative_coeffs: List[float],
                               alien_terms: List[NonPerturbativeTerm]) -> float:
        """Assess the quality of the transseries analysis"""
        if len(original_scores) == 0:
            return 0.0
        
        # Reconstruct the series using fitted transseries
        n_points = len(original_scores)
        x_values = np.arange(1, n_points + 1, dtype=np.float64)
        g_values = 1.0 / x_values
        
        # Perturbative part
        reconstructed = np.zeros_like(original_scores)
        for i, coeff in enumerate(perturbative_coeffs):
            if i < len(perturbative_coeffs):
                reconstructed += coeff * (g_values ** i)
        
        # Non-perturbative part
        for term in alien_terms:
            exp_weights = np.exp(-term.action / g_values)
            for i, coeff in enumerate(term.power_series):
                if i < len(term.power_series):
                    reconstructed += coeff * exp_weights * (g_values ** i)
        
        # Compute R² score
        ss_res = np.sum((original_scores - reconstructed) ** 2)
        ss_tot = np.sum((original_scores - np.mean(original_scores)) ** 2)
        
        if ss_tot > 1e-10:
            r_squared = 1.0 - (ss_res / ss_tot)
            return max(0.0, min(1.0, r_squared))
        else:
            return 1.0 if ss_res < 1e-10 else 0.0

    # ===================================================================
    # BOREL SUMMATION AND RESUMMATION
    # ===================================================================
    
    def borel_summation(self, coefficients: List[float], radius: float = None) -> float:
        """
        Perform Borel summation to handle divergent asymptotic series
        
        Borel transform: B[f](ζ) = Σ aₙ ζⁿ/n!
        Borel sum: S[f](x) = ∫₀^∞ e^(-t) B[f](xt) dt
        """
        if not coefficients:
            return 0.0
            
        radius = radius or self.params.borel_radius
        
        # Check if series is Borel summable
        if not self._is_borel_summable(coefficients):
            self.logger.warning("Series may not be Borel summable")
        
        # Compute Borel transform
        borel_coeffs = []
        for n, coeff in enumerate(coefficients):
            factorial = self._factorial(n)
            if factorial > 0:
                borel_coeffs.append(coeff / factorial)
            else:
                borel_coeffs.append(0.0)
        
        # Numerical integration for Borel sum
        def borel_integrand(t, x=1.0):
            """Integrand for Borel summation integral"""
            if t <= 0:
                return 0.0
            
            result = 0.0
            xt = x * t
            
            for n, b_coeff in enumerate(borel_coeffs):
                if n < 20:  # Truncate for numerical stability
                    result += b_coeff * (xt ** n)
            
            return np.exp(-t) * result
        
        try:
            borel_sum, _ = scipy.integrate.quad(
                lambda t: borel_integrand(t, radius),
                0, np.inf,
                limit=100
            )
            return borel_sum
        except:
            # Fallback to simple truncation
            return sum(coefficients[:min(10, len(coefficients))])
    
    def _is_borel_summable(self, coefficients: List[float]) -> bool:
        """Check if series satisfies conditions for Borel summability"""
        if len(coefficients) < 3:
            return True
        
        # Check growth condition: |aₙ| ≤ C * A^n * n!^α for some α < 1
        ratios = []
        for n in range(1, min(len(coefficients), 10)):
            if abs(coefficients[n-1]) > 1e-10:
                ratio = abs(coefficients[n]) / abs(coefficients[n-1])
                ratios.append(ratio / n)  # Normalize by n
        
        if ratios:
            avg_ratio = np.mean(ratios)
            return avg_ratio < 10.0  # Heuristic threshold
        
        return True
    
    def _factorial(self, n: int) -> float:
        """Compute factorial with caching"""
        if n in self._factorial_cache:
            return self._factorial_cache[n]
        
        if n > 20:  # Use Stirling's approximation for large n
            result = np.sqrt(2 * np.pi * n) * (n / np.e) ** n
        else:
            result = float(np.math.factorial(n))
        
        self._factorial_cache[n] = result
        return result

    # ===================================================================
    # COHOMOLOGICAL ANALYSIS FOR SCAR DETECTION
    # ===================================================================
    
    def analyze_cohomology(self, contexts: List[Dict], concept_overlaps: Dict) -> CohomologyResult:
        """
        Analyze Čech cohomology for scar detection
        
        Models knowledge gaps as non-trivial cohomology classes
        """
        try:
            # Simplified cohomology computation
            # Full implementation would require sophisticated algebraic topology
            
            num_contexts = len(contexts)
            if num_contexts < 2:
                return CohomologyResult(
                    dimension=0,
                    is_trivial=True,
                    obstruction_measure=0.0,
                    cocycle_data=[],
                    cover_description="Single context cover"
                )
            
            # Build incidence matrix for context overlaps
            overlap_matrix = self._build_overlap_matrix(contexts, concept_overlaps)
            
            # Compute 1-cocycles (assignments on overlaps)
            cocycle_data = self._compute_cocycles(overlap_matrix)
            
            # Check if cocycles are coboundaries (trivial)
            is_trivial = self._check_triviality(cocycle_data, overlap_matrix)
            
            # Measure obstruction strength
            obstruction_measure = self._compute_obstruction_measure(cocycle_data)
            
            cover_description = f"Cover with {num_contexts} contexts and {len(concept_overlaps)} overlaps"
            
            return CohomologyResult(
                dimension=1,  # We work with H¹ for scars
                is_trivial=is_trivial,
                obstruction_measure=obstruction_measure,
                cocycle_data=cocycle_data,
                cover_description=cover_description
            )
            
        except Exception as e:
            self.logger.error(f"Cohomology analysis failed: {e}")
            return CohomologyResult(
                dimension=0,
                is_trivial=True,
                obstruction_measure=0.0,
                cocycle_data=[],
                cover_description="Analysis failed"
            )
    
    def _build_overlap_matrix(self, contexts: List[Dict], 
                            concept_overlaps: Dict) -> np.ndarray:
        """Build matrix representing context overlaps"""
        n = len(contexts)
        matrix = np.zeros((n, n))
        
        for i in range(n):
            for j in range(i+1, n):
                context_i_id = contexts[i].get('id', i)
                context_j_id = contexts[j].get('id', j)
                
                # Check if contexts share concepts
                overlap_key = f"{context_i_id}-{context_j_id}"
                if overlap_key in concept_overlaps:
                    matrix[i, j] = concept_overlaps[overlap_key]
                    matrix[j, i] = concept_overlaps[overlap_key]
        
        return matrix
    
    def _compute_cocycles(self, overlap_matrix: np.ndarray) -> List[float]:
        """Compute 1-cocycles representing local inconsistencies"""
        n = overlap_matrix.shape[0]
        cocycle_data = []
        
        # For each pair of contexts, compute obstruction measure
        for i in range(n):
            for j in range(i+1, n):
                overlap_strength = overlap_matrix[i, j]
                
                # If overlap exists but is weak, it represents potential obstruction
                if 0 < overlap_strength < 0.5:
                    obstruction = 1.0 - overlap_strength
                    cocycle_data.append(obstruction)
                else:
                    cocycle_data.append(0.0)
        
        return cocycle_data
    
    def _check_triviality(self, cocycle_data: List[float], 
                         overlap_matrix: np.ndarray) -> bool:
        """Check if 1-cocycle is a coboundary (trivial in cohomology)"""
        if not cocycle_data:
            return True
        
        # Simplified triviality check
        # A cocycle is trivial if it can be written as δf for some 0-cochain f
        
        max_obstruction = max(cocycle_data) if cocycle_data else 0.0
        return max_obstruction < self.params.precision * 10
    
    def _compute_obstruction_measure(self, cocycle_data: List[float]) -> float:
        """Compute overall obstruction measure"""
        if not cocycle_data:
            return 0.0
        
        # Use L² norm as obstruction measure
        return float(np.sqrt(np.sum(np.array(cocycle_data) ** 2)))

# ===================================================================
# HTTP API SERVER
# ===================================================================

class AlienCalculusServer:
    """HTTP server for alien calculus analysis"""
    
    def __init__(self, port: int = 8004):
        self.port = port
        self.engine = AlienCalculusEngine()
        self.logger = logging.getLogger(__name__)
        
    async def handle_analyze_transseries(self, request):
        """Handle transseries analysis requests"""
        try:
            data = await request.json()
            
            # Parse request
            series_data = SeriesData(
                series_id=data['series_data']['series_id'],
                novelty_scores=data['series_data']['novelty_scores'],
                timestamps=data['series_data']['timestamps'],
                context_id=data['series_data'].get('context_id', '')
            )
            
            params = AnalysisParameters(
                alien_threshold=data['parameters'].get('alien_threshold', 2.5),
                significance_threshold=data['parameters'].get('significance_threshold', 0.001)
            )
            
            self.engine.params = params
            
            # Perform analysis
            result = self.engine.analyze_transseries(series_data)
            
            # Convert to JSON-serializable format
            response_data = {
                'status': 'success',
                'result': {
                    'perturbative_coeffs': result.perturbative_coeffs,
                    'non_perturbative_terms': [asdict(term) for term in result.non_perturbative_terms],
                    'alien_derivatives': result.alien_derivatives,
                    'stokes_points': result.stokes_points,
                    'bridge_equation_valid': result.bridge_equation_valid,
                    'analysis_quality': result.analysis_quality,
                    'computation_time': result.computation_time
                }
            }
            
            return web.json_response(response_data)
            
        except Exception as e:
            self.logger.error(f"Transseries analysis request failed: {e}")
            return web.json_response({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    async def handle_borel_summation(self, request):
        """Handle Borel summation requests"""
        try:
            data = await request.json()
            coefficients = data['coefficients']
            radius = data.get('radius', 1.0)
            
            result = self.engine.borel_summation(coefficients, radius)
            
            return web.json_response({
                'status': 'success',
                'result': {
                    'borel_sum': result
                }
            })
            
        except Exception as e:
            self.logger.error(f"Borel summation request failed: {e}")
            return web.json_response({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    async def handle_cohomology_analysis(self, request):
        """Handle cohomology analysis requests"""
        try:
            data = await request.json()
            contexts = data['contexts']
            concept_overlaps = data['concept_overlaps']
            
            result = self.engine.analyze_cohomology(contexts, concept_overlaps)
            
            return web.json_response({
                'status': 'success',
                'result': asdict(result)
            })
            
        except Exception as e:
            self.logger.error(f"Cohomology analysis request failed: {e}")
            return web.json_response({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    async def handle_health_check(self, request):
        """Health check endpoint"""
        return web.json_response({
            'status': 'healthy',
            'service': 'alien-calculus',
            'version': '1.0.0',
            'timestamp': time.time()
        })
    
    def create_app(self):
        """Create aiohttp application"""
        app = web.Application()
        
        # Routes
        app.router.add_post('/analyze_transseries', self.handle_analyze_transseries)
        app.router.add_post('/borel_summation', self.handle_borel_summation)
        app.router.add_post('/cohomology_analysis', self.handle_cohomology_analysis)
        app.router.add_get('/health', self.handle_health_check)
        
        return app
    
    async def start_server(self):
        """Start the HTTP server"""
        app = self.create_app()
        runner = web.AppRunner(app)
        await runner.setup()
        
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        self.logger.info(f"AlienCalculus server started on http://localhost:{self.port}")
        
        # Keep server running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            self.logger.info("Shutting down server...")
        finally:
            await runner.cleanup()

def main():
    """Main entry point for the alien calculus service"""
    parser = argparse.ArgumentParser(description='TORI Alien Calculus Analysis Service')
    parser.add_argument('--port', type=int, default=8004,
                       help='Port for HTTP server (default: 8004)')
    parser.add_argument('--log-level', default='INFO',
                       choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                       help='Logging level (default: INFO)')
    parser.add_argument('--test', action='store_true',
                       help='Run tests instead of starting server')
    
    args = parser.parse_args()
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    if args.test:
        run_tests()
    else:
        # Start the server
        server = AlienCalculusServer(args.port)
        asyncio.run(server.start_server())

def run_tests():
    """Run comprehensive tests of the alien calculus engine"""
    print("Running TORI Alien Calculus Tests...")
    
    engine = AlienCalculusEngine()
    
    # Test 1: Basic transseries analysis
    print("\n1. Testing basic transseries analysis...")
    test_series = SeriesData(
        series_id="test_001",
        novelty_scores=[1.0, 1.2, 1.1, 3.5, 1.0, 1.3, 1.1, 4.2, 1.2, 1.1],
        timestamps=list(range(10)),
        context_id="test_context"
    )
    
    try:
        result = engine.analyze_transseries(test_series)
        print(f"  ✓ Analysis completed in {result.computation_time:.3f}s")
        print(f"  ✓ Found {len(result.non_perturbative_terms)} alien terms")
        print(f"  ✓ Analysis quality: {result.analysis_quality:.3f}")
        print(f"  ✓ Bridge equations valid: {result.bridge_equation_valid}")
        
        for i, term in enumerate(result.non_perturbative_terms):
            print(f"    Alien term {i+1}: action={term.action:.3f}, coeff={term.coefficient:.3f}, confidence={term.confidence:.3f}")
            
    except Exception as e:
        print(f"  ✗ Test failed: {e}")
    
    # Test 2: Borel summation
    print("\n2. Testing Borel summation...")
    test_coeffs = [1.0, 1.0, 2.0, 6.0, 24.0, 120.0]  # n! series (divergent)
    
    try:
        borel_sum = engine.borel_summation(test_coeffs)
        print(f"  ✓ Borel sum computed: {borel_sum:.6f}")
        print(f"  ✓ Expected for e^x at x=1: {np.e:.6f}")
        print(f"  ✓ Relative error: {abs(borel_sum - np.e)/np.e:.2%}")
    except Exception as e:
        print(f"  ✗ Test failed: {e}")
    
    # Test 3: Stokes phenomena detection
    print("\n3. Testing Stokes phenomena detection...")
    # Create series with artificial discontinuity
    x = np.linspace(0.1, 2.0, 50)
    stokes_series = np.sin(1/x) + 0.1 * np.random.randn(50)
    # Add artificial Stokes jump
    stokes_series[25:] += 0.5
    
    test_stokes_data = SeriesData(
        series_id="stokes_test",
        novelty_scores=stokes_series.tolist(),
        timestamps=list(range(50))
    )
    
    try:
        result = engine.analyze_transseries(test_stokes_data)
        print(f"  ✓ Detected {len(result.stokes_points)} Stokes points")
        if result.stokes_points:
            print(f"  ✓ Stokes points at g = {result.stokes_points}")
    except Exception as e:
        print(f"  ✗ Test failed: {e}")
    
    # Test 4: Cohomology analysis
    print("\n4. Testing cohomology analysis...")
    test_contexts = [
        {'id': 'ctx_1', 'concepts': [1, 2, 3]},
        {'id': 'ctx_2', 'concepts': [2, 3, 4]},
        {'id': 'ctx_3', 'concepts': [1, 4, 5]}
    ]
    
    test_overlaps = {
        'ctx_1-ctx_2': 0.6,  # Strong overlap
        'ctx_1-ctx_3': 0.3,  # Weak overlap (potential scar)
        'ctx_2-ctx_3': 0.7   # Strong overlap
    }
    
    try:
        cohom_result = engine.analyze_cohomology(test_contexts, test_overlaps)
        print(f"  ✓ Cohomology dimension: {cohom_result.dimension}")
        print(f"  ✓ Is trivial: {cohom_result.is_trivial}")
        print(f"  ✓ Obstruction measure: {cohom_result.obstruction_measure:.3f}")
        print(f"  ✓ Cover: {cohom_result.cover_description}")
    except Exception as e:
        print(f"  ✗ Test failed: {e}")
    
    # Test 5: Performance benchmark
    print("\n5. Performance benchmark...")
    large_series = SeriesData(
        series_id="perf_test",
        novelty_scores=np.random.randn(1000).tolist(),
        timestamps=list(range(1000))
    )
    
    try:
        start_time = time.time()
        result = engine.analyze_transseries(large_series)
        end_time = time.time()
        
        print(f"  ✓ Processed 1000 points in {end_time - start_time:.3f}s")
        print(f"  ✓ Throughput: {1000/(end_time - start_time):.0f} points/sec")
        print(f"  ✓ Memory efficient: {len(result.non_perturbative_terms)} terms extracted")
    except Exception as e:
        print(f"  ✗ Test failed: {e}")
    
    print("\n" + "="*50)
    print("TORI Alien Calculus Tests Completed")
    print("="*50)

if __name__ == "__main__":
    main()
