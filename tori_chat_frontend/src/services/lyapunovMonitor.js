// lyapunovMonitor.js
// Simplified Lyapunov stability monitoring for TORI Chat
// Monitors conversation phase coherence and stability

class ConversationStabilityMonitor {
  constructor() {
    this.phaseHistory = [];
    this.stabilityHistory = [];
    this.maxHistorySize = 50;
    this.currentStability = 0.8;
    this.phaseCoherence = 1.0;
    this.spikeCount = 0;
    this.lastSpikeTime = 0;
  }

  // Add conversation phase data point
  addPhaseData(messageIndex, responseQuality, conceptCoherence = 1.0) {
    const timestamp = Date.now();
    
    // Calculate phase based on conversation flow
    const phase = (messageIndex * 0.1 + Math.sin(messageIndex * 0.2)) % (2 * Math.PI);
    
    // Store phase data
    this.phaseHistory.push({
      timestamp,
      messageIndex,
      phase,
      responseQuality,
      conceptCoherence
    });
    
    // Maintain history size
    if (this.phaseHistory.length > this.maxHistorySize) {
      this.phaseHistory.shift();
    }
    
    // Update current metrics
    this.updateStabilityMetrics();
    
    return {
      phase,
      stability: this.currentStability,
      coherence: this.phaseCoherence
    };
  }

  // Update stability metrics based on recent history
  updateStabilityMetrics() {
    if (this.phaseHistory.length < 3) {
      return;
    }

    // Calculate phase velocity (rate of change)
    const recentPhases = this.phaseHistory.slice(-5);
    let totalVelocity = 0;
    
    for (let i = 1; i < recentPhases.length; i++) {
      const dt = (recentPhases[i].timestamp - recentPhases[i-1].timestamp) / 1000; // seconds
      const dPhase = Math.abs(recentPhases[i].phase - recentPhases[i-1].phase);
      totalVelocity += dPhase / (dt + 0.001); // Avoid division by zero
    }
    
    const avgVelocity = totalVelocity / (recentPhases.length - 1);
    
    // Stability decreases with high phase velocity
    this.currentStability = Math.max(0.1, 1.0 - avgVelocity * 0.5);
    
    // Calculate phase coherence
    this.updatePhaseCoherence();
    
    // Detect spikes
    this.detectStabilitySpikes(avgVelocity);
  }

  // Update phase coherence based on response quality
  updatePhaseCoherence() {
    if (this.phaseHistory.length < 2) {
      this.phaseCoherence = 1.0;
      return;
    }

    const recentData = this.phaseHistory.slice(-5);
    const avgResponseQuality = recentData.reduce((sum, data) => sum + data.responseQuality, 0) / recentData.length;
    const avgConceptCoherence = recentData.reduce((sum, data) => sum + data.conceptCoherence, 0) / recentData.length;
    
    // Phase coherence combines response quality and concept coherence
    this.phaseCoherence = (avgResponseQuality + avgConceptCoherence) / 2;
    
    // Apply smoothing
    this.phaseCoherence = Math.max(0.1, Math.min(1.0, this.phaseCoherence));
  }

  // Detect stability spikes that might trigger ghost emergence
  detectStabilitySpikes(velocity) {
    const now = Date.now();
    const spikeThreshold = 2.0; // Threshold for detecting spikes
    
    // Spike conditions
    const isVelocitySpike = velocity > spikeThreshold;
    const isStabilityDrop = this.currentStability < 0.3;
    const isCoherenceDrop = this.phaseCoherence < 0.4;
    
    if (isVelocitySpike || isStabilityDrop || isCoherenceDrop) {
      // Only count spikes if they're not too frequent
      if (now - this.lastSpikeTime > 30000) { // 30 seconds minimum between spikes
        this.spikeCount++;
        this.lastSpikeTime = now;
        
        console.log(`🌊 Stability spike detected: velocity=${velocity.toFixed(3)}, stability=${this.currentStability.toFixed(3)}, coherence=${this.phaseCoherence.toFixed(3)}`);
        
        return {
          type: isVelocitySpike ? 'velocity' : isStabilityDrop ? 'stability' : 'coherence',
          magnitude: Math.max(velocity, 1 - this.currentStability, 1 - this.phaseCoherence),
          timestamp: now
        };
      }
    }
    
    return null;
  }

  // Get current stability report
  getStabilityReport() {
    const now = Date.now();
    const recentSpikes = this.spikeCount;
    
    // Calculate recent spike activity (last 5 minutes)
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const recentSpikeCount = this.lastSpikeTime > fiveMinutesAgo ? 1 : 0;
    
    return {
      system_stability_index: this.currentStability,
      total_spikes_detected: this.spikeCount,
      monitoring_active: true,
      concepts_monitored: this.phaseHistory.length,
      
      current_stability: {
        value: this.currentStability,
        confidence: Math.min(this.phaseHistory.length / 10, 1.0),
        phase_coherence: this.phaseCoherence
      },
      
      recent_activity: {
        spikes_last_5min: recentSpikeCount,
        phase_coherence: this.phaseCoherence,
        avg_phase_velocity: this.calculateAverageVelocity()
      },
      
      stability_assessment: this.assessStability(),
      recommendations: this.generateRecommendations()
    };
  }

  // Calculate average phase velocity
  calculateAverageVelocity() {
    if (this.phaseHistory.length < 2) return 0;
    
    let totalVelocity = 0;
    const recentData = this.phaseHistory.slice(-10);
    
    for (let i = 1; i < recentData.length; i++) {
      const dt = (recentData[i].timestamp - recentData[i-1].timestamp) / 1000;
      const dPhase = Math.abs(recentData[i].phase - recentData[i-1].phase);
      totalVelocity += dPhase / (dt + 0.001);
    }
    
    return totalVelocity / (recentData.length - 1);
  }

  // Assess overall stability
  assessStability() {
    if (this.currentStability > 0.8) return "excellent";
    if (this.currentStability > 0.6) return "good";
    if (this.currentStability > 0.4) return "moderate";
    if (this.currentStability > 0.2) return "poor";
    return "critical";
  }

  // Generate stability recommendations
  generateRecommendations() {
    const recommendations = [];
    
    if (this.currentStability < 0.5) {
      recommendations.push("Consider slowing conversation pace for better stability");
    }
    
    if (this.phaseCoherence < 0.6) {
      recommendations.push("Response quality could be improved for better coherence");
    }
    
    if (this.spikeCount > 5) {
      recommendations.push("High spike activity detected - monitor for ghost emergence");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Conversation stability is good - continue current approach");
    }
    
    return recommendations;
  }

  // Reset monitor state
  reset() {
    this.phaseHistory = [];
    this.stabilityHistory = [];
    this.currentStability = 0.8;
    this.phaseCoherence = 1.0;
    this.spikeCount = 0;
    this.lastSpikeTime = 0;
  }
}

// Create global instance
const conversationMonitor = new ConversationStabilityMonitor();

// Export monitor functions
export function addConversationPhaseData(messageIndex, responseQuality, conceptCoherence) {
  return conversationMonitor.addPhaseData(messageIndex, responseQuality, conceptCoherence);
}

export function getStabilityReport() {
  return conversationMonitor.getStabilityReport();
}

export function resetStabilityMonitor() {
  conversationMonitor.reset();
}

export function getCurrentStability() {
  return {
    stability: conversationMonitor.currentStability,
    coherence: conversationMonitor.phaseCoherence,
    spikes: conversationMonitor.spikeCount
  };
}

// Export the monitor class for advanced usage
export { ConversationStabilityMonitor };
