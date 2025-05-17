import numpy as np
import math
import random
from typing import Dict, List, Set, Tuple, Optional

class ConceptNode:
    def __init__(self, name: str, omega: float = 1.0, coord: Optional[np.ndarray] = None):
        self.name = name
        self.phase = 0.0  # θᵢ(t): phase oscillator
        self.activation = 0.0  # Activation level
        self.omega = omega  # intrinsic frequency
        self.neighbors: Dict[str, float] = {}  # neighbor_name: coupling strength (K_ij)
        self.coord = coord  # coordinate in manifold (for κ-geometry)

class AlanKernel:
    def __init__(self):
        self.concepts: Dict[str, ConceptNode] = {}
        self.edges: List[Tuple[str, str, float]] = []  # (src, dst, K_ij)
        self.time = 0
        self.noise = 0.0  # noise amplitude for phase updates
        self.history: List[List[float]] = []  # phase vector at each step
        self._last_eigvals = None
        self._last_eigvecs = None
        # κ-geometry
        self.kappa = 0  # 0: Euclidean, 1: Spherical, -1: Hyperbolic
        self.alpha = 1.0  # coupling decay parameter

    def add_concepts(self, names: List[str], omega: float = 1.0, coords: Optional[List[np.ndarray]] = None):
        for idx, n in enumerate(names):
            if n not in self.concepts:
                coord = coords[idx] if coords is not None else None
                self.concepts[n] = ConceptNode(n, omega=omega, coord=coord)

    def assign_random_coords(self, dim: int = 2):
        # Assign random coordinates in unit disk/plane/sphere based on kappa
        for node in self.concepts.values():
            if self.kappa == 0:
                node.coord = np.random.uniform(-1, 1, size=dim)
            elif self.kappa > 0:
                v = np.random.normal(size=dim)
                node.coord = v / np.linalg.norm(v)
            else:  # Hyperbolic: Poincare disk model
                r = np.random.uniform(0, 0.9)
                theta = np.random.uniform(0, 2 * np.pi)
                node.coord = np.array([r * np.cos(theta), r * np.sin(theta)])

    def set_geometry(self, kappa: int = 0, alpha: float = 1.0):
        self.kappa = kappa
        self.alpha = alpha
        self.assign_random_coords()
        self.update_coupling_matrix()
        print(f"[κ-Geometry] Set geometry: {'Euclidean' if kappa == 0 else ('Spherical' if kappa > 0 else 'Hyperbolic')}, alpha={alpha}")

    def geodesic(self, x: np.ndarray, y: np.ndarray) -> float:
        if self.kappa == 0:
            return np.linalg.norm(x - y)
        elif self.kappa > 0:
            # Spherical: angle between unit vectors
            dot = np.clip(np.dot(x, y), -1.0, 1.0)
            return np.arccos(dot)
        else:
            # Hyperbolic: Poincare disk model
            norm_x = np.linalg.norm(x)
            norm_y = np.linalg.norm(y)
            num = 2 * np.linalg.norm(x - y)
            denom = (1 - norm_x ** 2) * (1 - norm_y ** 2)
            arg = 1 + num ** 2 / denom
            return np.arccosh(arg) if arg >= 1 else 0.0

    def update_coupling_matrix(self):
        # Set K_ij = exp(-alpha * δκ(xi, xj)^2) for all pairs
        names = list(self.concepts.keys())
        for i in names:
            for j in names:
                if i != j:
                    xi = self.concepts[i].coord
                    xj = self.concepts[j].coord
                    if xi is not None and xj is not None:
                        d = self.geodesic(xi, xj)
                        K = math.exp(-self.alpha * d ** 2)
                        self.concepts[i].neighbors[j] = K
                        # Optionally: self.edges updated here if needed

    def link(self, src: str, dst: str, type: str = "related", weight: float = 1.0):
        if src in self.concepts and dst in self.concepts:
            self.concepts[src].neighbors[dst] = weight
            self.edges.append((src, dst, weight))

    def activate(self, name: str, level: float = 1.0, phase: float = 0.0):
        if name in self.concepts:
            self.concepts[name].activation = level
            self.concepts[name].phase = phase

    def step_phase(self, dt: float = 0.1):
        new_phases = {}
        for i, concept in self.concepts.items():
            theta_i = concept.phase
            omega_i = concept.omega
            coupling_sum = 0.0
            for j, K_ij in concept.neighbors.items():
                theta_j = self.concepts[j].phase
                coupling_sum += K_ij * math.sin(theta_j - theta_i)
            dtheta = omega_i + coupling_sum
            if self.noise > 0:
                dtheta += random.uniform(-self.noise, self.noise)
            new_phases[i] = theta_i + dt * dtheta
        for i in new_phases:
            self.concepts[i].phase = new_phases[i] % (2 * math.pi)
        self.time += 1
        # Record phase vector for Koopman
        self.history.append([self.concepts[n].phase for n in self.concepts])
        print(f"[t={self.time}] Lyapunov energy: {self.lyapunov_energy():.4f}")

    def lyapunov_energy(self):
        # V(θ) = -sum_{i<j} K_ij * cos(θ_i - θ_j)
        names = list(self.concepts.keys())
        phases = [self.concepts[n].phase for n in names]
        energy = 0.0
        for idx_i, i in enumerate(names):
            for idx_j, j in enumerate(names):
                if idx_j > idx_i:
                    K_ij = self.concepts[i].neighbors.get(j, 0.0)
                    K_ji = self.concepts[j].neighbors.get(i, 0.0)
                    K = (K_ij + K_ji) / 2  # symmetric coupling
                    if K != 0:
                        energy -= K * math.cos(phases[idx_i] - phases[idx_j])
        return energy

    def koopman_decompose(self, window: Optional[int] = None):
        # Use last `window` steps, or all
        if len(self.history) < 3:
            print("Not enough history for Koopman analysis.")
            return
        X_full = np.array(self.history[-window:] if window else self.history)
        if X_full.shape[0] < 3:
            print("Not enough history for Koopman analysis.")
            return
        X = X_full[:-1]
        Xp = X_full[1:]
        # Least squares: K = (X^T X)^-1 X^T Xp
        try:
            K, _, _, _ = np.linalg.lstsq(X, Xp, rcond=None)
            eigvals, eigvecs = np.linalg.eig(K)
            self._last_eigvals = eigvals
            self._last_eigvecs = eigvecs
            # Predict next state
            pred = X @ K
            error = np.linalg.norm(pred - Xp) / np.linalg.norm(Xp)
            print("--- Koopman Decomposition ---")
            print(f"Eigenvalues (|λ|, arg):")
            for l in eigvals:
                print(f"  {abs(l):.3f}, {np.angle(l):.3f}")
            print(f"Reconstruction error: {error:.4e}")
            print(f"Dominant mode (real part): {eigvecs[:,0].real}")
            print("----------------------------")
        except Exception as e:
            print(f"Koopman decomposition failed: {e}")

    def morph_concept_field(self, mode_index: int = 0, epsilon: float = 0.2):
        # Perturb current phase vector along a Koopman mode
        if self._last_eigvecs is None:
            print("No Koopman modes available. Run koopman_decompose() first.")
            return
        mode = self._last_eigvecs[:, mode_index].real
        theta_current = np.array([c.phase for c in self.concepts.values()])
        theta_perturbed = theta_current + epsilon * mode
        for i, c in enumerate(self.concepts.values()):
            c.phase = theta_perturbed[i] % (2 * np.pi)
        print(f"[Morph] Nudged phase vector along Koopman mode {mode_index} (ε={epsilon})")

    def show_active_concepts(self, thresh: float = 0.01):
        print("Active concepts:")
        for n, node in self.concepts.items():
            if node.activation > thresh:
                print(f"  {n}: activation={node.activation:.2f}, phase={node.phase:.2f}")

    def show_resonance_map(self, name: str):
        if name not in self.concepts:
            print(f"Concept '{name}' not found.")
            return
        phases = np.array([node.phase for node in self.concepts.values()])
        names = list(self.concepts.keys())
        idx = names.index(name)
        ref_phase = phases[idx]
        resonance = np.cos(phases - ref_phase)
        print(f"Resonance map for '{name}':")
        for n, res in zip(names, resonance):
            print(f"  {n}: {res:.2f}")

# Example harness (can be replaced with tests)
if __name__ == "__main__":
    brain = AlanKernel()
    concepts = ["filter", "map", "reduce", "loop", "aggregate", "transform"]
    brain.add_concepts(concepts)
    # Set κ-geometry: 0=Euclidean, 1=Spherical, -1=Hyperbolic
    brain.set_geometry(kappa=0, alpha=1.0)
    brain.activate("map", phase=0.5)
    brain.noise = 0.05
    for t in range(60):
        brain.step_phase()
        if (t+1) % 20 == 0:
            brain.koopman_decompose(window=20)
    brain.morph_concept_field(mode_index=0, epsilon=0.2)
    for t in range(40):
        brain.step_phase()
        if (t+1) % 20 == 0:
            brain.koopman_decompose(window=20)
    for n in concepts:
        node = brain.concepts[n]
        print(f"{n}: phase={node.phase:.2f}")
    brain.show_resonance_map("map")
    print(f"Final Lyapunov energy: {brain.lyapunov_energy():.4f}")
