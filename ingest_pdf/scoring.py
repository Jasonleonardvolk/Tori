import numpy as np
from typing import List, Dict
from collections import Counter

def resonance_score(cluster_indices: List[int], emb: np.ndarray) -> float:
    # Simple autocorrelation as resonance proxy
    if len(cluster_indices) < 2:
        return 0.0
    signal = emb[cluster_indices].mean(axis=0)
    norm = np.linalg.norm(signal) + 1e-8
    ac = np.correlate(signal, signal, mode='full')
    center = len(ac) // 2
    # Use off-center peak as resonance
    if len(ac) > 2:
        resonance = float(np.max(ac[center+1:]) / (norm**2))
    else:
        resonance = 0.0
    return resonance

def narrative_centrality(cluster_indices: List[int], adjacency: np.ndarray) -> float:
    # Degree centrality in cluster graph
    if len(cluster_indices) < 1:
        return 0.0
    sub_adj = adjacency[np.ix_(cluster_indices, cluster_indices)]
    deg = sub_adj.sum(axis=1)
    return float(np.mean(deg))

def build_cluster_adjacency(labels: List[int], emb: np.ndarray) -> np.ndarray:
    # Build adjacency based on cosine similarity between clusters
    n = len(labels)
    unique = sorted(set(labels))
    cluster_means = [emb[[i for i, l in enumerate(labels) if l == cid]].mean(axis=0) for cid in unique]
    m = len(cluster_means)
    adj = np.zeros((n, n), dtype=np.float32)
    for i in range(n):
        for j in range(n):
            if labels[i] == labels[j]:
                continue
            sim = float(emb[i] @ emb[j] / ((np.linalg.norm(emb[i])*np.linalg.norm(emb[j]))+1e-8))
            adj[i, j] = sim
    return adj

def score_clusters(labels: List[int], emb: np.ndarray) -> List[int]:
    scores = {}
    adj = build_cluster_adjacency(labels, emb)
    for cid in set(labels):
        mem = [i for i, l in enumerate(labels) if l == cid]
        if len(mem) < 1:
            continue
        res = resonance_score(mem, emb)
        cent = narrative_centrality(mem, adj)
        # Weighted score: resonance + centrality
        scores[cid] = 0.6 * res + 0.4 * cent
    return [cid for cid, _ in sorted(scores.items(), key=lambda kv: kv[1], reverse=True)]
