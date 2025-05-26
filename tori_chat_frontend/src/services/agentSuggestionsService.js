/**
 * Agent Suggestions Service
 * 
 * Handles communication with the TORI backend for agent suggestions,
 * concept-based recommendations, and real-time chat assistance.
 */

class AgentSuggestionsService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    this.websocket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Fetch current agent suggestions from the backend
   */
  async fetchSuggestions() {
    try {
      const response = await fetch(`${this.baseUrl}/api/agent/suggestions`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.warn('Failed to fetch suggestions, using mock data:', error);
      return this.getMockSuggestions();
    }
  }

  /**
   * Apply a suggestion
   */
  async applySuggestion(suggestionId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/agent/suggestions/${suggestionId}/apply`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      throw error;
    }
  }

  /**
   * Dismiss a suggestion
   */
  async dismissSuggestion(suggestionId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/agent/suggestions/${suggestionId}/dismiss`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to dismiss suggestion:', error);
      throw error;
    }
  }

  /**
   * Connect to WebSocket for real-time suggestions
   */
  connectWebSocket(onSuggestionsUpdate) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      return this.websocket;
    }

    try {
      const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws/suggestions';
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('Connected to agent suggestions WebSocket');
        this.reconnectAttempts = 0;
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'suggestions_update') {
            onSuggestionsUpdate(data.suggestions || []);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('WebSocket connection closed');
        this.attemptReconnect(onSuggestionsUpdate);
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return this.websocket;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      return null;
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  attemptReconnect(onSuggestionsUpdate) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      
      console.log(`Attempting to reconnect WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket(onSuggestionsUpdate);
      }, delay);
    } else {
      console.warn('Max reconnection attempts reached');
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Mock suggestions for when backend is not available
   */
  getMockSuggestions() {
    return [
      {
        id: 'concept-extract-1',
        type: 'concept_suggestion',
        title: 'Extract Concept: "phase alignment"',
        description: 'Detected phase alignment pattern in your code. Create a concept for reuse?',
        priority: 'medium',
        confidence: 0.85,
        category: 'concept_extraction',
        diff: {
          old: '// phase alignment logic here',
          new: 'const phaseAlignment = new PhaseAlignmentConcept();'
        },
        onApply: () => {
          console.log('Applied concept extraction suggestion');
        }
      },
      {
        id: 'refactor-1',
        type: 'code_improvement',
        title: 'Refactor: Extract ConceptDiff Handler',
        description: 'This function could be simplified using the ConceptDiff pattern',
        priority: 'low',
        confidence: 0.72,
        category: 'refactoring',
        diff: {
          old: 'function handleMessage(msg) {\n  // complex logic\n}',
          new: 'const conceptDiff = new ConceptDiff();\nconceptDiff.handleMessage(msg);'
        }
      },
      {
        id: 'memory-optimization-1',
        type: 'performance',
        title: 'Memory: Use ψarc Storage',
        description: 'Consider using ψarc storage for persistent conversation memory',
        priority: 'high',
        confidence: 0.91,
        category: 'optimization',
        diff: {
          old: 'localStorage.setItem("conversation", JSON.stringify(data));',
          new: 'conversationStorage.savePsiArcSession(data);'
        }
      }
    ];
  }
}

// Export singleton instance
const agentSuggestionsService = new AgentSuggestionsService();
export default agentSuggestionsService;
