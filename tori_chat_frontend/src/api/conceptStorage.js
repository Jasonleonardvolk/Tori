// Concept Storage API - Links users to their extracted concepts
export const conceptStorageAPI = {
  // Store concepts for authenticated user
  async storeUserConcepts(userId, documentId, concepts) {
    const response = await fetch('/api/concepts/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include session cookies
      body: JSON.stringify({
        userId,
        documentId,
        concepts,
        timestamp: new Date().toISOString(),
        memoryArchitecture: {
          solitonEncoding: true,
          topologicalProtection: true,
          koopmanAnalysis: true,
          phaseAlignment: true
        }
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to store concepts');
    }
    
    return response.json();
  },

  // Retrieve concepts for user
  async getUserConcepts(userId) {
    const response = await fetch(`/api/concepts/user/${userId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to retrieve concepts');
    }
    
    return response.json();
  },

  // Search concepts across the mesh
  async searchConcepts(query, userId) {
    const response = await fetch('/api/concepts/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        query,
        userId,
        useKoopmanAnalysis: true,
        usePhaseAlignment: true
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to search concepts');
    }
    
    return response.json();
  },

  // Get concept relationships
  async getConceptGraph(conceptId, depth = 2) {
    const response = await fetch(`/api/concepts/graph/${conceptId}?depth=${depth}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to get concept graph');
    }
    
    return response.json();
  }
};
