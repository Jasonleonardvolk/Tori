"""
Unit tests for the cluster stability analysis module.

These tests verify the correct functioning of community detection and stability
forecasting for concept clusters.
"""

import unittest
import networkx as nx
import numpy as np
from cluster_stability import (
    spectral_gap, 
    find_communities, 
    analyze_clusters, 
    build_concept_graph,
    simulate_desync,
    create_test_graph
)

class TestClusterStability(unittest.TestCase):
    """Tests for the cluster stability analysis module."""
    
    def test_spectral_gap(self):
        """Test spectral gap calculation."""
        # Complete graph should have a large spectral gap
        G_complete = nx.complete_graph(5)
        gap = spectral_gap(G_complete)
        self.assertGreater(gap, 0.9, "Complete graph should have spectral gap close to 1")
        
        # Nearly disconnected graph should have a small spectral gap
        G_barbell = nx.barbell_graph(5, 1)  # Two complete graphs with one edge between
        gap = spectral_gap(G_barbell)
        self.assertLess(gap, 0.5, "Barbell graph should have small spectral gap")
        
        # Test edge cases
        self.assertEqual(spectral_gap(nx.Graph()), 0.0, "Empty graph should have 0 gap")
        self.assertEqual(spectral_gap(nx.path_graph(2)), 1.0, "Trivial graph should have gap=1")
    
    def test_find_communities(self):
        """Test community detection."""
        # Create a graph with obvious community structure
        G = nx.barbell_graph(5, 1)
        communities = find_communities(G)
        
        # Should find two communities
        self.assertEqual(len(communities), 2, "Should detect 2 communities in barbell graph")
        
        # Each community should have 5 nodes
        community_sizes = [len(c) for c in communities]
        self.assertEqual(sorted(community_sizes), [5, 5], "Each community should have 5 nodes")
        
        # Test on a complete graph (should be one community)
        G_complete = nx.complete_graph(10)
        communities = find_communities(G_complete)
        self.assertEqual(len(communities), 1, "Complete graph should be one community")
    
    def test_analyze_clusters(self):
        """Test cluster analysis and alert generation."""
        # Create test graph with two communities
        G, chi = create_test_graph()
        
        # No alerts with healthy coherence
        alerts = analyze_clusters(G, chi)
        self.assertEqual(len(alerts), 0, "No alerts should be generated for healthy graph")
        
        # Simulate degrading coherence in one community
        reduced_chi = chi.copy()
        for i in range(5):  # First community concepts
            reduced_chi[f"concept_{i}"] = 0.3
            
        # Simple identity forecast function
        def identity_forecast(x):
            return x
            
        # Should generate alert for the degraded community
        alerts = analyze_clusters(G, reduced_chi, forecast_fn=identity_forecast)
        self.assertEqual(len(alerts), 1, "Should generate 1 alert for degraded community")
        
        # Check alert details
        alert = alerts[0]
        self.assertLess(alert.stab_forecast, 0.4, "Forecast stability should be low")
        self.assertEqual(len(alert.concepts), 5, "Alert should cover 5 concepts")
        self.assertGreater(alert.eta_sec, 0, "ETA should be positive")
        
        # Test with declining forecast
        def declining_forecast(x):
            return x * 0.7  # 30% decrease
            
        # Should generate alerts even with initially healthy graph
        alerts = analyze_clusters(G, chi, forecast_fn=declining_forecast)
        self.assertGreaterEqual(len(alerts), 1, "Should generate alerts with declining forecast")
    
    def test_build_concept_graph(self):
        """Test building a concept graph from similarity data."""
        # Create similarity data
        similarities = {
            "concept_0": {"concept_1": 0.8, "concept_2": 0.2, "concept_3": 0.1},
            "concept_1": {"concept_0": 0.8, "concept_2": 0.7},
            "concept_2": {"concept_0": 0.2, "concept_1": 0.7, "concept_3": 0.9},
            "concept_3": {"concept_0": 0.1, "concept_2": 0.9}
        }
        
        # Build graph with default threshold
        G = build_concept_graph(similarities)
        
        # Check graph properties
        self.assertEqual(G.number_of_nodes(), 4, "Graph should have 4 nodes")
        self.assertEqual(G.number_of_edges(), 4, "Graph should have 4 edges with threshold=0.3")
        
        # Check specific edges
        self.assertTrue(G.has_edge("concept_0", "concept_1"), "Edge 0-1 should exist")
        self.assertFalse(G.has_edge("concept_0", "concept_3"), "Edge 0-3 should not exist (below threshold)")
        
        # Test with higher threshold
        G_high = build_concept_graph(similarities, similarity_threshold=0.7)
        self.assertEqual(G_high.number_of_edges(), 3, "Graph should have 3 edges with threshold=0.7")
    
    def test_simulate_desync(self):
        """Test desynchronization simulation."""
        G, chi = create_test_graph()
        
        # Simulate desync in community 0
        new_chi = simulate_desync(G, chi, community_idx=0, factor=0.5)
        
        # Check that values were reduced in first community
        for i in range(5):  # First community
            self.assertAlmostEqual(new_chi[f"concept_{i}"], 0.4, 
                              msg=f"Concept_{i} should have reduced coherence")
                              
        # Check that other community is unchanged
        for i in range(5, 10):  # Second community
            self.assertAlmostEqual(new_chi[f"concept_{i}"], 0.8, 
                              msg=f"Concept_{i} should have unchanged coherence")
                              
        # Test with invalid community index
        with self.assertRaises(ValueError):
            simulate_desync(G, chi, community_idx=99)

if __name__ == "__main__":
    unittest.main()
