import math
import numpy as np
from collections import defaultdict, Counter
from typing import List, Dict
from alan_backend.banksy import oscillator_update

def cluster_cohesion(emb: np.ndarray, members: List[int]) -> float:
    if len(members) < 2:
        return 0.0
    sub = emb[members]
    sim = (sub @ sub.T) / ((np.linalg.norm(sub, axis=1, keepdims=True) + 1e-8) * (np.linalg.norm(sub, axis=1, keepdims=True).T + 1e-8))
    return (sim.sum() - len(sub)) / max(len(sub)*(len(sub)-1), 1)

def run_oscillator_clustering(emb: np.ndarray, steps: int = 60, tol: float = 1e-3, cohesion_threshold: float = 0.15) -> List[int]:
    n = emb.shape[0]
    if n == 1:
        return [0]
    norms = np.linalg.norm(emb, axis=1, keepdims=True) + 1e-9
    K = (emb @ emb.T) / (norms * norms.T)
    np.fill_diagonal(K, 0)
    theta = np.random.uniform(0, 2 * math.pi, n)
    for _ in range(steps):
        nxt = oscillator_update(theta, np.ones(n), 0.25, 0.05, K, 0)
        if np.linalg.norm(nxt - theta) < tol:
            break
        theta = nxt
    # Bucket phases
    buckets: Dict[int, List[int]] = defaultdict(list)
    for i, th in enumerate(theta):
        buckets[int((th % (2 * math.pi)) / 0.25)].append(i)
    # Assign cluster labels
    labels = [-1] * n
    cid_map = {}
    for cid, (_, mem) in enumerate(sorted(buckets.items(), key=lambda kv: -len(kv[1]))):
        for m in mem:
            labels[m] = cid
        cid_map[cid] = mem
    # Validate clusters: merge/discard singletons and low cohesion
    # Find nearest neighbor for singletons
    for cid, mem in list(cid_map.items()):
        if len(mem) == 1:
            idx = mem[0]
            # Find nearest other cluster by cosine similarity
            best_cid, best_sim = None, -1e9
            for ocid, omem in cid_map.items():
                if ocid == cid or len(omem) < 1:
                    continue
                sim = float(emb[idx] @ emb[omem[0]] / (np.linalg.norm(emb[idx])*np.linalg.norm(emb[omem[0]])+1e-8))
                if sim > best_sim:
                    best_cid, best_sim = ocid, sim
            if best_cid is not None and best_sim > 0.4:
                # Merge singleton into nearest cluster
                labels[idx] = best_cid
                cid_map[best_cid].append(idx)
                cid_map[cid] = []
    # Remove clusters with low cohesion
    for cid, mem in list(cid_map.items()):
        if len(mem) < 2:
            continue
        coh = cluster_cohesion(emb, mem)
        if coh < cohesion_threshold:
            for idx in mem:
                labels[idx] = -1  # Mark as unassigned
            cid_map[cid] = []
    # Reassign unassigned to nearest cluster
    for idx, l in enumerate(labels):
        if l == -1:
            best_cid, best_sim = None, -1e9
            for cid, mem in cid_map.items():
                if len(mem) == 0:
                    continue
                sim = float(emb[idx] @ emb[mem[0]] / (np.linalg.norm(emb[idx])*np.linalg.norm(emb[mem[0]])+1e-8))
                if sim > best_sim:
                    best_cid, best_sim = cid, sim
            if best_cid is not None and best_sim > 0.3:
                labels[idx] = best_cid
                cid_map[best_cid].append(idx)
    return labels
