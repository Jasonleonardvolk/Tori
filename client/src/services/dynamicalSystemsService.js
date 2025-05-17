/**
 * Dynamical Systems Service
 * 
 * This service implements the non-tokenic semantic engine features described in
 * the ALAN IDE, including resonance-based search, Koopman mode decomposition,
 * attractor dynamics, and spectral pattern matching.
 * 
 * Core concepts:
 * - Treats semantic concepts as attractors in a dynamical system
 * - Uses resonance instead of token matching for semantic search
 * - Implements spectral decomposition using Koopman operator theory
 * - Provides geometric navigation in concept space
 * - Supports state recording and replay for field dynamics
 */

// Helper function for matrix operations (simpler implementation for demo)
const MatrixOps = {
  // Compute dot product between two vectors
  dot: (a, b) => a.reduce((sum, val, i) => sum + val * b[i], 0),
  
  // Compute L2 norm (magnitude) of a vector
  norm: (a) => Math.sqrt(a.reduce((sum, val) => sum + val * val, 0)),
  
  // Normalize a vector to unit length
  normalize: (a) => {
    const norm = MatrixOps.norm(a);
    return norm === 0 ? a : a.map(val => val / norm);
  },
  
  // Simple matrix multiplication (for small matrices)
  multiply: (A, B) => {
    const result = Array(A.length).fill().map(() => Array(B[0].length).fill(0));
    
    for (let i = 0; i < A.length; i++) {
      for (let j = 0; j < B[0].length; j++) {
        for (let k = 0; k < A[0].length; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    
    return result;
  },
  
  // Compute eigenvalues and eigenvectors (simplified power iteration method)
  // This is a very basic implementation for demonstration purposes
  // In production, you'd use a dedicated linear algebra library
  powerIteration: (A, iterations = 100) => {
    // Start with a random vector
    const n = A.length;
    let v = Array(n).fill().map(() => Math.random());
    
    // Normalize the vector
    v = MatrixOps.normalize(v);
    
    // Iterate
    for (let i = 0; i < iterations; i++) {
      // Multiply A * v
      const Av = Array(n).fill(0);
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          Av[j] += A[j][k] * v[k];
        }
      }
      
      // Normalize
      v = MatrixOps.normalize(Av);
    }
    
    // Compute eigenvalue (Rayleigh quotient)
    let eigenvalue = 0;
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += A[i][j] * v[j];
      }
      eigenvalue += v[i] * sum;
    }
    
    return { eigenvalue, eigenvector: v };
  },
  
  // Fast Fourier Transform (simplified)
  fft: (signal) => {
    // This is a placeholder for a real FFT implementation
    // In a real application, use a more efficient FFT library
    
    // For this demo, we'll just compute magnitudes at a few frequencies
    const n = signal.length;
    const result = [];
    
    for (let k = 0; k < n / 2; k++) {
      let real = 0;
      let imag = 0;
      
      for (let t = 0; t < n; t++) {
        const angle = (2 * Math.PI * k * t) / n;
        real += signal[t] * Math.cos(angle);
        imag -= signal[t] * Math.sin(angle);
      }
      
      // Magnitude
      const magnitude = Math.sqrt(real * real + imag * imag) / n;
      result.push({ frequency: k, magnitude });
    }
    
    return result;
  }
};

/**
 * DynamicalSystemsService Class
 * 
 * Implements the core dynamical systems concepts for the ALAN IDE features:
 * - Attractor-based semantic memory
 * - Resonance search via dynamical evolution
 * - Koopman mode decomposition for spectral patterns
 * - Geometric navigation in concept space
 * - State recording and replay
 */
class DynamicalSystemsService {
  constructor() {
    // Configuration
    this.config = {
      stateDimension: 64, // Dimension of the state vector
      numAttractors: 0,   // Number of attractors (concepts) stored
      timeStep: 0.1,      // Integration step size
      maxIterations: 100, // Maximum iterations for dynamics simulation
      decayRate: 0.95,    // Decay rate for dynamics
      spectralComponents: 8, // Number of spectral components to track
    };
    
    // State variables
    this.attractors = []; // Array of attractor states (concepts)
    this.attractorMetadata = []; // Metadata for each attractor
    this.currentState = new Array(this.config.stateDimension).fill(0); // Current system state
    this.adjacencyMatrix = []; // For graph-based representation
    
    // History recording
    this.stateHistory = []; // History of states for replay
    this.eventMarkers = []; // Important events in the history
    
    // Koopman operator approximation (simplified for demo)
    this.koopmanEigenfunctions = []; // Eigenfunctions of the approximated Koopman operator
    this.koopmanEigenvalues = []; // Eigenvalues of the approximated Koopman operator
    
    // Spatial index for fast nearest-neighbor lookups
    this.spatialIndex = []; // Simple array for demo, would use more efficient structure in prod
  }
  
  /**
   * Initialize the system with random attractors (for demo)
   * In a real system, these would be learned from data
   * @param {number} numAttractors - Number of attractors to generate
   */
  initRandomAttractors(numAttractors = 20) {
    this.attractors = [];
    this.attractorMetadata = [];
    
    for (let i = 0; i < numAttractors; i++) {
      // Create a random attractor state
      const state = new Array(this.config.stateDimension).fill(0)
        .map(() => Math.random() * 2 - 1); // Values between -1 and 1
      
      // Normalize the state
      const normalizedState = MatrixOps.normalize(state);
      
      // Create metadata
      const metadata = {
        id: `attractor_${i}`,
        name: `Concept ${i}`,
        type: ['function', 'class', 'variable', 'concept'][Math.floor(Math.random() * 4)],
        // For demo: some attractors are "stable" (point attractors), others are "oscillatory"
        dynamics: Math.random() > 0.7 ? 'oscillatory' : 'stable',
        // If oscillatory, assign a random frequency
        frequency: Math.random() > 0.7 ? 0.5 + Math.random() * 2 : 0,
        // Create random "tags" or categories
        tags: ['parsing', 'rendering', 'storage', 'networking', 'authentication']
          .filter(() => Math.random() > 0.7),
        // Random importance from 0 to 1
        importance: Math.random()
      };
      
      this.attractors.push(normalizedState);
      this.attractorMetadata.push(metadata);
    }
    
    this.config.numAttractors = numAttractors;
    this.buildSpatialIndex();
    this.buildConnectivityGraph();
    this.analyzeSpectralProperties();
    
    console.log(`Initialized ${numAttractors} random attractors`);
    return true;
  }
  
  /**
   * Build a spatial index for fast nearest-neighbor lookups
   * This is a simplified implementation - a real system would use a more efficient
   * data structure like a k-d tree or ball tree
   */
  buildSpatialIndex() {
    this.spatialIndex = [];
    
    // For demo, just store attractor vectors and their indices
    for (let i = 0; i < this.attractors.length; i++) {
      this.spatialIndex.push({
        index: i,
        vector: this.attractors[i]
      });
    }
  }
  
  /**
   * Build a connectivity graph between attractors
   * Determines which attractors are "neighbors" in state space
   */
  buildConnectivityGraph() {
    const n = this.attractors.length;
    this.adjacencyMatrix = Array(n).fill().map(() => Array(n).fill(0));
    
    // Compute pairwise similarities
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        
        // Compute similarity (dot product for cosine similarity)
        const similarity = MatrixOps.dot(this.attractors[i], this.attractors[j]);
        
        // Only connect if similarity is high enough
        if (similarity > 0.5) {
          this.adjacencyMatrix[i][j] = similarity;
        }
      }
    }
  }
  
  /**
   * Analyze spectral properties of the system
   * This computes approximate Koopman eigenvalues and eigenfunctions
   */
  analyzeSpectralProperties() {
    // For demo, we compute eigenvalues/eigenvectors of the adjacency matrix
    // In a real implementation, this would use proper Koopman DMD methods
    
    const n = this.adjacencyMatrix.length;
    if (n === 0) return;
    
    this.koopmanEigenvalues = [];
    this.koopmanEigenfunctions = [];
    
    // Extract leading eigenvalues/eigenvectors
    for (let i = 0; i < Math.min(this.config.spectralComponents, n); i++) {
      // In a real implementation, we'd use simultaneous iteration or ARPACK
      // For this demo, we just do power iteration and deflation
      const adj = [...this.adjacencyMatrix].map(row => [...row]);
      
      const { eigenvalue, eigenvector } = MatrixOps.powerIteration(adj);
      
      // Store the eigenvalue and eigenfunction
      this.koopmanEigenvalues.push(eigenvalue);
      this.koopmanEigenfunctions.push(eigenvector);
      
      // Deflation: remove this component from the matrix
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          adj[j][k] -= eigenvalue * eigenvector[j] * eigenvector[k];
        }
      }
    }
  }

  /**
   * Set the current state of the system
   * @param {Array} state - New state vector
   */
  setState(state) {
    if (!state || state.length !== this.config.stateDimension) {
      console.error('Invalid state vector dimension');
      return false;
    }
    
    this.currentState = [...state];
    return true;
  }
  
  /**
   * Reset the system state to zeros
   */
  resetState() {
    this.currentState = new Array(this.config.stateDimension).fill(0);
    return true;
  }
  
  /**
   * Record current state to history
   * @param {string} eventName - Optional name for the event
   * @param {Object} metadata - Optional metadata for the event
   */
  recordState(eventName = '', metadata = {}) {
    const timestamp = Date.now();
    
    // Create a snapshot of the current state
    const stateSnapshot = {
      timestamp,
      state: [...this.currentState],
      eventName,
      metadata
    };
    
    // Add to history
    this.stateHistory.push(stateSnapshot);
    
    // If event name provided, mark it as a significant event
    if (eventName) {
      this.eventMarkers.push({
        timestamp,
        name: eventName,
        metadata
      });
    }
    
    return timestamp;
  }
  
  /**
   * Clear the state history
   */
  clearHistory() {
    this.stateHistory = [];
    this.eventMarkers = [];
    return true;
  }
  
  /**
   * Get a snapshot from history at a specific time or index
   * @param {number} timeOrIndex - Timestamp or index in history
   * @param {boolean} useIndex - If true, treat timeOrIndex as an index
   * @returns {Object} State snapshot
   */
  getHistorySnapshot(timeOrIndex, useIndex = false) {
    if (this.stateHistory.length === 0) {
      return null;
    }
    
    if (useIndex) {
      // Use direct index into history
      const index = Math.max(0, Math.min(timeOrIndex, this.stateHistory.length - 1));
      return this.stateHistory[index];
    } else {
      // Find closest timestamp
      const targetTime = timeOrIndex;
      let closestIndex = 0;
      let minDiff = Infinity;
      
      for (let i = 0; i < this.stateHistory.length; i++) {
        const diff = Math.abs(this.stateHistory[i].timestamp - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      }
      
      return this.stateHistory[closestIndex];
    }
  }
  
  /**
   * Iterate the system dynamics for one step
   * This is a simplified implementation that moves toward the closest attractor
   * @returns {boolean} Success
   */
  iterateDynamics() {
    if (this.attractors.length === 0) {
      console.warn('No attractors defined');
      return false;
    }
    
    // Find the closest attractor
    let closestAttractorIndex = -1;
    let maxSimilarity = -Infinity;
    
    for (let i = 0; i < this.attractors.length; i++) {
      const similarity = MatrixOps.dot(this.currentState, this.attractors[i]);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        closestAttractorIndex = i;
      }
    }
    
    if (closestAttractorIndex === -1) {
      console.warn('Could not find closest attractor');
      return false;
    }
    
    const closestAttractor = this.attractors[closestAttractorIndex];
    const metadata = this.attractorMetadata[closestAttractorIndex];
    
    // Move the state toward the attractor (simple linear interpolation)
    // In a real implementation, this would use proper ODE integration
    
    for (let i = 0; i < this.currentState.length; i++) {
      // Simple dynamics: move toward attractor with some inertia
      // Add damping to prevent overshooting
      const damping = 0.1;
      
      if (metadata.dynamics === 'oscillatory' && metadata.frequency > 0) {
        // For oscillatory attractors, add a time-dependent term
        // This creates a limit cycle around the attractor
        const time = Date.now() / 1000; // Current time in seconds
        const frequency = metadata.frequency;
        const oscillation = Math.sin(time * frequency * 2 * Math.PI);
        
        this.currentState[i] = this.currentState[i] * (1 - damping) + 
                              (closestAttractor[i] + 0.2 * oscillation) * damping;
      } else {
        // For stable attractors, move directly toward the attractor
        this.currentState[i] = this.currentState[i] * (1 - damping) + 
                              closestAttractor[i] * damping;
      }
    }
    
    // Normalize the state to prevent exploding values
    this.currentState = MatrixOps.normalize(this.currentState);
    
    return true;
  }
  
  /**
   * Run system dynamics until convergence or max iterations
   * @param {number} maxIterations - Maximum number of iterations
   * @param {number} convergenceThreshold - Convergence threshold
   * @returns {Object} Result of the dynamics simulation
   */
  runDynamicsToConvergence(maxIterations = 100, convergenceThreshold = 1e-4) {
    const stateTrajectory = []; // For recording the state trajectory
    stateTrajectory.push([...this.currentState]); // Record initial state
    
    let iteration = 0;
    let converged = false;
    let prevState = [...this.currentState];
    
    while (iteration < maxIterations && !converged) {
      // Iterate dynamics
      this.iterateDynamics();
      
      // Record the new state
      stateTrajectory.push([...this.currentState]);
      
      // Check for convergence
      const stateDiff = prevState.map((val, i) => 
        Math.abs(val - this.currentState[i]));
      const maxDiff = Math.max(...stateDiff);
      
      if (maxDiff < convergenceThreshold) {
        converged = true;
      }
      
      // Update prev state
      prevState = [...this.currentState];
      iteration++;
    }
    
    // Find which attractor we converged to (if any)
    let convergenceAttractor = this.findClosestAttractor(this.currentState);
    
    return {
      converged,
      iterations: iteration,
      finalState: [...this.currentState],
      trajectory: stateTrajectory,
      attractorIndex: convergenceAttractor.index,
      attractorMetadata: convergenceAttractor.metadata
    };
  }
  
  /**
   * Find the closest attractor to a given state
   * @param {Array} state - State vector
   * @returns {Object} Closest attractor info
   */
  findClosestAttractor(state) {
    let closestIndex = -1;
    let maxSimilarity = -Infinity;
    
    for (let i = 0; i < this.attractors.length; i++) {
      const similarity = MatrixOps.dot(state, this.attractors[i]);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        closestIndex = i;
      }
    }
    
    if (closestIndex === -1) {
      return { index: -1, similarity: 0, metadata: null };
    }
    
    return {
      index: closestIndex,
      similarity: maxSimilarity,
      metadata: this.attractorMetadata[closestIndex]
    };
  }
  
  /**
   * Search for concepts by resonance
   * @param {Array} queryState - State vector representing the query
   * @param {Object} options - Search options
   * @returns {Array} Resonant concepts ranked by strength
   */
  searchByResonance(queryState, options = {}) {
    const {
      maxResults = 10,
      threshold = 0.5,
      runDynamics = true
    } = options;
    
    // Normalize query state
    const normalizedQuery = MatrixOps.normalize(queryState);
    
    // Option 1: Direct similarity search
    if (!runDynamics) {
      // Compute similarity to all attractors
      const similarities = this.attractors.map((attractor, index) => ({
        index,
        similarity: MatrixOps.dot(normalizedQuery, attractor),
        metadata: this.attractorMetadata[index]
      }));
      
      // Sort by similarity (descending)
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      // Filter by threshold and limit results
      return similarities
        .filter(item => item.similarity >= threshold)
        .slice(0, maxResults);
    }
    
    // Option 2: Run dynamics and see where system evolves to
    // Set the current state to the query
    this.setState(normalizedQuery);
    
    // Run dynamics
    const result = this.runDynamicsToConvergence();
    
    // Get closest attractors to the trajectory
    // (we check all points in the trajectory to see which attractors were activated)
    const trajectoryPoints = result.trajectory;
    const attractorActivations = new Map(); // Map of attractor index -> activation strength
    
    // For each point in the trajectory, find nearby attractors
    for (let i = 0; i < trajectoryPoints.length; i++) {
      const point = trajectoryPoints[i];
      const timeWeight = i / trajectoryPoints.length; // Later points are weighted more
      
      for (let j = 0; j < this.attractors.length; j++) {
        const similarity = MatrixOps.dot(point, this.attractors[j]);
        if (similarity >= threshold) {
          // Weight by both similarity and time position in trajectory
          const activation = similarity * (0.5 + 0.5 * timeWeight);
          const currentActivation = attractorActivations.get(j) || 0;
          attractorActivations.set(j, Math.max(currentActivation, activation));
        }
      }
    }
    
    // Convert to array and add metadata
    const resonances = Array.from(attractorActivations.entries())
      .map(([index, activation]) => ({
        index,
        resonance: activation,
        metadata: this.attractorMetadata[index]
      }));
    
    // Sort by resonance strength
    resonances.sort((a, b) => b.resonance - a.resonance);
    
    // Return top results
    return resonances.slice(0, maxResults);
  }
  
  /**
   * Search for concepts by spectral similarity
   * @param {Array} queryState - State vector or time series
   * @param {Object} options - Search options
   * @returns {Array} Matching concepts ranked by spectral similarity
   */
  searchBySpectralSimilarity(queryState, options = {}) {
    const {
      maxResults = 10,
      threshold = 0.5,
      useFFT = false
    } = options;
    
    // For time series analysis (FFT)
    if (useFFT && Array.isArray(queryState[0])) {
      return this.searchByFFTSimilarity(queryState, { maxResults, threshold });
    }
    
    // For single state vector, project onto Koopman eigenfunctions
    const normalizedQuery = MatrixOps.normalize(queryState);
    
    // Project query onto each eigenfunction
    const queryProjections = this.koopmanEigenfunctions.map(eigenfunction => 
      MatrixOps.dot(normalizedQuery, eigenfunction));
    
    // For each attractor, compute spectral similarity
    const similarities = this.attractors.map((attractor, index) => {
      // Project attractor onto each eigenfunction
      const attractorProjections = this.koopmanEigenfunctions.map(eigenfunction => 
        MatrixOps.dot(attractor, eigenfunction));
      
      // Compute similarity in eigenfunction space
      // (We use cosine similarity in the projection space)
      let dotProduct = 0;
      let queryNorm = 0;
      let attractorNorm = 0;
      
      for (let i = 0; i < queryProjections.length; i++) {
        // Weight by eigenvalue (importance of the mode)
        const weight = Math.abs(this.koopmanEigenvalues[i]);
        
        dotProduct += weight * queryProjections[i] * attractorProjections[i];
        queryNorm += weight * queryProjections[i] * queryProjections[i];
        attractorNorm += weight * attractorProjections[i] * attractorProjections[i];
      }
      
      const similarity = dotProduct / (Math.sqrt(queryNorm) * Math.sqrt(attractorNorm));
      
      return {
        index,
        similarity,
        metadata: this.attractorMetadata[index],
        spectralSignature: attractorProjections
      };
    });
    
    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    // Filter by threshold and limit results
    return similarities
      .filter(item => item.similarity >= threshold)
      .slice(0, maxResults);
  }
  
  /**
   * Search by FFT similarity (for time series data)
   * @param {Array} queryTimeSeries - Array of state vectors over time
   * @param {Object} options - Search options
   * @returns {Array} Matching concepts ranked by FFT similarity
   */
  searchByFFTSimilarity(queryTimeSeries, options = {}) {
    const { maxResults = 10, threshold = 0.5 } = options;
    
    // Extract a single dimension to analyze (for simplicity)
    // In practice, you might do FFT on multiple dimensions or use more sophisticated methods
    const singleDimension = queryTimeSeries.map(state => state[0]);
    
    // Compute FFT of query
    const querySpectrum = MatrixOps.fft(singleDimension);
    
    // We don't have precomputed FFTs for attractors
    // In a real implementation, you would precompute these
    // For this demo, we'll just return some mock results
    
    // Mock spectral similarities for demo
    const similarities = this.attractorMetadata
      .map((metadata, index) => {
        // Create mock spectral features based on attractor properties
        let similarity = Math.random() * 0.5 + 0.5;
        
        // If attractor is oscillatory, increase similarity
        if (metadata.dynamics === 'oscillatory') {
          similarity += 0.2;
        }
        
        return {
          index,
          similarity,
          metadata,
          // Mock spectral signature
          spectralSignature: Array(8).fill(0).map(() => Math.random())
        };
      });
    
    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    // Filter by threshold and limit results
    return similarities
      .filter(item => item.similarity >= threshold)
      .slice(0, maxResults);
  }
  
  /**
   * Get nearest neighbors in concept space
   * @param {string} conceptId - ID of the concept to find neighbors for
   * @param {number} maxNeighbors - Maximum number of neighbors to return
   * @returns {Array} Nearest neighbors
   */
  getConceptNeighbors(conceptId, maxNeighbors = 5) {
    // Find the concept
    const conceptIndex = this.attractorMetadata.findIndex(m => m.id === conceptId);
    if (conceptIndex === -1) {
      console.warn(`Concept with ID ${conceptId} not found`);
      return [];
    }
    
    const concept = this.attractors[conceptIndex];
    
    // Compute distances to all other concepts
    const neighbors = this.attractors
      .map((attractor, index) => {
        if (index === conceptIndex) return null; // Skip self
        
        return {
          index,
          // Use dot product as similarity measure
          similarity: MatrixOps.dot(concept, attractor),
          metadata: this.attractorMetadata[index]
        };
      })
      .filter(Boolean); // Remove null entry (self)
    
    // Sort by similarity (descending)
    neighbors.sort((a, b) => b.similarity - a.similarity);
    
    // Return top neighbors
    return neighbors.slice(0, maxNeighbors);
  }
  
  /**
   * Get a concept's coordinates in a low-dimensional projection
   * @param {string} conceptId - ID of the concept
   * @param {number} dimensions - Number of dimensions in the projection
   * @returns {Array} Coordinates in the projection
   */
  getConceptCoordinates(conceptId, dimensions = 2) {
    // Find the concept
    const conceptIndex = this.attractorMetadata.findIndex(m => m.id === conceptId);
    if (conceptIndex === -1) {
      console.warn(`Concept with ID ${conceptId} not found`);
      return null;
    }
    
    const concept = this.attractors[conceptIndex];
    
    // For a 2D projection, use first two Koopman eigenfunctions
    // This is a very simplified approach - real implementations would use
    // techniques like t-SNE, UMAP, or spectral embedding
    
    if (this.koopmanEigenfunctions.length < dimensions) {
      console.warn('Not enough eigenfunctions for requested dimensions');
      return null;
    }
    
    // Project concept onto eigenfunctions
    const coordinates = [];
    for (let i = 0; i < dimensions; i++) {
      coordinates.push(MatrixOps.dot(concept, this.koopmanEigenfunctions[i]));
    }
    
    return coordinates;
  }
  
  /**
   * Get coordinates for all concepts in a low-dimensional projection
   * @param {number} dimensions - Number of dimensions in the projection
   * @returns {Array} Array of {id, coordinates} objects
   */
  getAllConceptCoordinates(dimensions = 2) {
    if (this.koopmanEigenfunctions.length < dimensions) {
      console.warn('Not enough eigenfunctions for requested dimensions');
      return [];
    }
    
    return this.attractorMetadata.map((metadata, index) => {
      const attractor = this.attractors[index];
      
      // Project attractor onto eigenfunctions
      const coordinates = [];
      for (let i = 0; i < dimensions; i++) {
        coordinates.push(MatrixOps.dot(attractor, this.koopmanEigenfunctions[i]));
      }
      
      return {
        id: metadata.id,
        name: metadata.name,
        type: metadata.type,
        coordinates,
        metadata
      };
    });
  }
  
  /**
   * Test utility: create a query state from text
   * This is a simplified method for testing - real systems would use
   * more sophisticated semantic encoding
   * @param {string} text - Text to convert to a state vector
   * @returns {Array} State vector
   */
  createQueryStateFromText(text) {
    // This is a very simplistic encoding for demonstration
    // Real systems would use better semantic encoding
    
    // Create a pseudo-random vector based on the text
    const hash = this.simpleHash(text);
    const seed = hash / 1000000; // Use hash as a seed
    
    // Create a vector using the seed
    const state = new Array(this.config.stateDimension).fill(0)
      .map((_, i) => Math.sin(seed * (i + 1)));
    
    return MatrixOps.normalize(state);
  }
  
  /**
   * Simple string hash function
   * @param {string} str - String to hash
   * @returns {number} - Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// Create and export singleton instance
const dynamicalSystemsService = new DynamicalSystemsService();
export default dynamicalSystemsService;
