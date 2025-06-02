// mcp-server-architecture/src/memory/concept-memory-graph.ts

/**
 * ConceptMemoryGraphService — Semantic network for long-term knowledge retention,
 * concept lineage, policy compliance, and traceable system memory.
 *
 * Integrates with provenance, audit, and TORI compliance at every update/query.
 * Designed to support in-memory and persistent/graph DB backends.
 */

import {
  ConceptMemoryGraph,
  ConceptNode,
  ConceptEdge,
  Provenance,
  ComplianceFlag,
  ConceptQuery,
  PolicyDecision
} from '../core/types';

// Optional: EventEmitter for hooks/notifications
import { EventEmitter } from 'events';

export class ConceptMemoryGraphService extends EventEmitter {
  private nodes: Map<string, ConceptNode> = new Map();
  private edges: Map<string, ConceptEdge> = new Map();
  // Index/query/embedding engines can be plugged here

  constructor(config?: any) {
    super();
    // Optionally load from persistent storage or config
    if (config?.initialNodes) config.initialNodes.forEach((n: ConceptNode) => this.nodes.set(n.id, n));
    if (config?.initialEdges) config.initialEdges.forEach((e: ConceptEdge) => this.edges.set(e.id, e));
  }

  /** Add a new concept node, tracing provenance and compliance. */
  async addConcept(concept: Omit<ConceptNode, 'id' | 'createdAt'> & Partial<Pick<ConceptNode, 'id' | 'createdAt'>>): Promise<ConceptNode> {
    const id = concept.id || this.generateUUID();
    const node: ConceptNode = {
      id,
      name: concept.name,
      data: concept.data || {},
      createdAt: concept.createdAt || new Date(),
      provenance: concept.provenance,
      complianceFlags: concept.complianceFlags || []
    };
    this.nodes.set(id, node);
    this.emit('concept:added', node);
    return node;
  }

  /** Query concepts by name/attribute/depth, returns full subgraph. */
  async queryConcepts(query: ConceptQuery): Promise<{ nodes: ConceptNode[]; edges: ConceptEdge[] }> {
    let filteredNodes = Array.from(this.nodes.values());
    if (query.name) {
      filteredNodes = filteredNodes.filter(n => n.name.toLowerCase().includes(query.name.toLowerCase()));
    }
    // (Add more attribute-based, depth, or tag filtering as needed)
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const subgraphEdges = Array.from(this.edges.values()).filter(
      e => nodeIds.has(e.from) && nodeIds.has(e.to)
    );
    return { nodes: filteredNodes, edges: subgraphEdges };
  }

  /** Update an existing concept (merge data, update provenance/compliance). */
  async updateConcept(nodeId: string, updates: Partial<ConceptNode>): Promise<ConceptNode> {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Concept ${nodeId} not found`);
    const updatedNode = {
      ...node,
      ...updates,
      data: { ...node.data, ...(updates.data || {}) },
      complianceFlags: [...(node.complianceFlags || []), ...(updates.complianceFlags || [])]
    };
    this.nodes.set(nodeId, updatedNode);
    this.emit('concept:updated', updatedNode);
    return updatedNode;
  }

  /** Create a relationship (edge) between two concepts, with provenance and compliance. */
  async createRelationship(
    from: string,
    to: string,
    type: string,
    weight: number = 1,
    provenance?: Provenance,
    complianceFlags?: ComplianceFlag[]
  ): Promise<ConceptEdge> {
    const id = this.generateUUID();
    const edge: ConceptEdge = {
      id,
      from,
      to,
      type,
      weight,
      provenance,
      complianceFlags: complianceFlags || []
    };
    this.edges.set(id, edge);
    this.emit('relationship:created', edge);
    return edge;
  }

  /** Import a graph (bulk load for restore/migration/testing). */
  async importGraph(nodes: ConceptNode[], edges: ConceptEdge[]) {
    nodes.forEach(n => this.nodes.set(n.id, n));
    edges.forEach(e => this.edges.set(e.id, e));
    this.emit('memory:imported', { nodeCount: nodes.length, edgeCount: edges.length });
  }

  /** Export the current graph (for backup, migration, analytics). */
  async exportGraph(): Promise<{ nodes: ConceptNode[]; edges: ConceptEdge[] }> {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values())
    };
  }

  /** Find related concepts (1-hop or N-hop neighbors). */
  async findRelated(nodeId: string, maxDepth: number = 1): Promise<ConceptNode[]> {
    // Simple BFS to depth
    const visited = new Set<string>();
    let currentLayer = [nodeId];
    for (let depth = 0; depth < maxDepth; depth++) {
      const nextLayer: string[] = [];
      for (const id of currentLayer) {
        visited.add(id);
        const outEdges = Array.from(this.edges.values()).filter(e => e.from === id);
        outEdges.forEach(e => {
          if (!visited.has(e.to)) nextLayer.push(e.to);
        });
      }
      currentLayer = nextLayer;
    }
    return Array.from(visited).map(id => this.nodes.get(id)).filter(Boolean) as ConceptNode[];
  }

  /** Compliance check integration: annotate node/edge with policy result. */
  async annotateCompliance(targetId: string, isEdge: boolean, decision: PolicyDecision) {
    if (isEdge) {
      const edge = this.edges.get(targetId);
      if (!edge) throw new Error(`Edge ${targetId} not found`);
      edge.complianceFlags = (edge.complianceFlags || []).concat(this.policyToComplianceFlag(decision));
      this.edges.set(targetId, edge);
    } else {
      const node = this.nodes.get(targetId);
      if (!node) throw new Error(`Node ${targetId} not found`);
      node.complianceFlags = (node.complianceFlags || []).concat(this.policyToComplianceFlag(decision));
      this.nodes.set(targetId, node);
    }
  }

  private policyToComplianceFlag(decision: PolicyDecision): ComplianceFlag {
    return {
      policyId: decision.reason || 'unknown',
      rule: decision.reason || 'unknown',
      status: decision.allowed ? 'compliant' : 'violation',
      severity: decision.severity || 'low',
      timestamp: new Date(),
      details: JSON.stringify(decision)
    };
  }

  private generateUUID(): string {
    return 'xxxx-xxxx-4xxx-yxxx-xxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0, v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

/**
 * Integration Pathways / Comments:
 * - All concept/edge add/update/relationship actions can be compliance-annotated.
 * - Provenance is preserved for all knowledge and links.
 * - Emits events for integration with monitoring, audit, and analytics.
 * - Pluggable for in-memory, persistent, or distributed graph backends.
 * - Serves as knowledge/context base for orchestrator, policy engine, and AI modules.
 */

