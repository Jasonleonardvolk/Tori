// conceptGraph.js
// Human-interpretable concept graph memory for workflow & behavior patterns

const STORAGE_KEY = 'concept-graph-memory';

let graph = null;

export function loadConceptGraph() {
  if (graph) return graph;
  const raw = localStorage.getItem(STORAGE_KEY);
  graph = raw ? JSON.parse(raw) : { nodes: [], edges: [] };
  return graph;
}

export function saveConceptGraph() {
  if (graph) localStorage.setItem(STORAGE_KEY, JSON.stringify(graph));
}

export function addConceptNode(node) {
  loadConceptGraph();
  if (!graph.nodes.find(n => n.id === node.id)) graph.nodes.push(node);
  saveConceptGraph();
}

export function addConceptEdge(sourceId, targetId, attrs = {}) {
  loadConceptGraph();
  let edge = graph.edges.find(e => e.source === sourceId && e.target === targetId);
  if (!edge) {
    edge = { source: sourceId, target: targetId, weight: 1, ...attrs };
    graph.edges.push(edge);
  } else {
    edge.weight++;
  }
  saveConceptGraph();
}

export function findConceptNode(predicate) {
  loadConceptGraph();
  return graph.nodes.find(predicate);
}

export function getConceptGraph() {
  return loadConceptGraph();
}

export default {
  addConceptNode,
  addConceptEdge,
  findConceptNode,
  getConceptGraph,
  saveConceptGraph
};
