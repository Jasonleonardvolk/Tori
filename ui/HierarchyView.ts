/**
 * TORI MultiScaleHierarchy - TypeScript Visualization Component
 * 
 * This module provides interactive visualization of the multi-scale hierarchy
 * using modern web technologies. It subscribes to hierarchy update events
 * and provides real-time visual feedback of the knowledge structure.
 */

import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

export interface HierarchyNode {
    id: number;
    concept_id: number;
    scale: number;
    parent?: number;
    children: number[];
    created_at: number;
    last_accessed: number;
    node_metadata: Record<string, string>;
}

export interface ConceptData {
    name: string;
    description?: string;
    embedding?: number[];
    domain?: string;
    created_at: number;
    modified_at: number;
    metadata: Record<string, string>;
}

export interface HierarchyView {
    root: HierarchyNode;
    nodes: Record<number, HierarchyNode>;
    concepts: Record<number, ConceptData>;
    max_depth?: number;
    node_count: number;
}

export interface HierarchyStats {
    total_nodes: number;
    total_concepts: number;
    max_scale: number;
    max_depth: number;
    operations_count: number;
    last_modified: number;
}

export interface HierarchyError {
    type: 'ConceptNotFound' | 'NodeNotFound' | 'InvalidParent' | 'CycleDetected' | 'ScaleViolation' | 'ConcurrencyError' | 'InvalidOperation';
    message: string;
    concept_id?: number;
    node_id?: number;
}

export interface VisualizationConfig {
    width: number;
    height: number;
    nodeRadius: number;
    levelHeight: number;
    colorScheme: 'default' | 'domain' | 'scale' | 'activity';
    showLabels: boolean;
    showConnections: boolean;
    enableZoom: boolean;
    enablePan: boolean;
    animationDuration: number;
}

export interface NodePosition {
    x: number;
    y: number;
    z?: number;
}

export interface VisualNode extends HierarchyNode {
    position: NodePosition;
    color: string;
    highlighted: boolean;
    selected: boolean;
    visible: boolean;
    opacity: number;
    size: number;
}

export interface HierarchyEvent {
    type: 'node_added' | 'node_removed' | 'node_updated' | 'hierarchy_restructured' | 'concept_highlighted';
    timestamp: number;
    data: any;
}

// ===================================================================
// STORES AND STATE MANAGEMENT
// ===================================================================

// Core hierarchy data store
export const hierarchyData: Writable<HierarchyView | null> = writable(null);

// Hierarchy statistics
export const hierarchyStats: Writable<HierarchyStats | null> = writable(null);

// Visual configuration
export const visualConfig: Writable<VisualizationConfig> = writable({
    width: 800,
    height: 600,
    nodeRadius: 8,
    levelHeight: 80,
    colorScheme: 'scale',
    showLabels: true,
    showConnections: true,
    enableZoom: true,
    enablePan: true,
    animationDuration: 300
});

// Visual nodes with computed positions and styling
export const visualNodes: Writable<Record<number, VisualNode>> = writable({});

// Selected and highlighted nodes
export const selectedNodes: Writable<Set<number>> = writable(new Set());
export const highlightedNodes: Writable<Set<number>> = writable(new Set());

// Events stream
export const hierarchyEvents: Writable<HierarchyEvent[]> = writable([]);

// Error state
export const hierarchyErrors: Writable<HierarchyError[]> = writable([]);

// ===================================================================
// DERIVED STORES
// ===================================================================

// Nodes organized by scale level
export const nodesByScale: Readable<Record<number, VisualNode[]>> = derived(
    [hierarchyData, visualNodes],
    ([$hierarchyData, $visualNodes]) => {
        if (!$hierarchyData) return {};
        
        const byScale: Record<number, VisualNode[]> = {};
        
        Object.values($visualNodes).forEach(node => {
            if (!byScale[node.scale]) {
                byScale[node.scale] = [];
            }
            byScale[node.scale].push(node);
        });
        
        return byScale;
    }
);

// Root nodes (nodes without parents)
export const rootNodes: Readable<VisualNode[]> = derived(
    visualNodes,
    ($visualNodes) => {
        return Object.values($visualNodes).filter(node => !node.parent);
    }
);

// Current viewport bounds
export const viewportBounds: Writable<{
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    zoom: number;
}> = writable({
    minX: 0,
    maxX: 800,
    minY: 0,
    maxY: 600,
    zoom: 1.0
});

// ===================================================================
// HIERARCHY VISUALIZATION CLASS
// ===================================================================

export class HierarchyVisualizer {
    private websocket: WebSocket | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private context: CanvasRenderingContext2D | null = null;
    private animationId: number | null = null;
    private isDragging = false;
    private dragOffset = { x: 0, y: 0 };
    private lastMousePos = { x: 0, y: 0 };

    constructor(
        private containerId: string,
        private websocketUrl: string = 'ws://localhost:8002/ws'
    ) {
        this.initializeWebSocket();
        this.initializeCanvas();
        this.setupEventListeners();
    }

    // ===================================================================
    // INITIALIZATION
    // ===================================================================

    private initializeWebSocket(): void {
        try {
            this.websocket = new WebSocket(this.websocketUrl);
            
            this.websocket.onopen = () => {
                console.log('🔌 Connected to TORI hierarchy WebSocket');
                this.addEvent({
                    type: 'hierarchy_restructured',
                    timestamp: Date.now(),
                    data: { status: 'connected' }
                });
            };

            this.websocket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.addError({
                    type: 'ConcurrencyError',
                    message: 'WebSocket connection error'
                });
            };

            this.websocket.onclose = () => {
                console.log('📡 WebSocket connection closed, attempting to reconnect...');
                setTimeout(() => this.initializeWebSocket(), 5000);
            };
        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
        }
    }

    private initializeCanvas(): void {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'hierarchy-canvas';
        this.canvas.style.border = '1px solid #ccc';
        this.canvas.style.borderRadius = '4px';
        
        container.appendChild(this.canvas);
        
        this.context = this.canvas.getContext('2d');
        if (!this.context) {
            console.error('Failed to get 2D context');
            return;
        }

        // Set initial canvas size
        this.resizeCanvas();
        
        // Start animation loop
        this.startAnimationLoop();
    }

    private resizeCanvas(): void {
        if (!this.canvas || !this.context) return;

        const config = get(visualConfig);
        this.canvas.width = config.width;
        this.canvas.height = config.height;
        
        // Update viewport bounds
        viewportBounds.set({
            minX: 0,
            maxX: config.width,
            minY: 0,
            maxY: config.height,
            zoom: 1.0
        });
    }

    private setupEventListeners(): void {
        if (!this.canvas) return;

        // Mouse events for interaction
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));

        // Keyboard events
        window.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this));

        // Store subscriptions
        hierarchyData.subscribe(this.handleHierarchyUpdate.bind(this));
        visualConfig.subscribe(this.handleConfigUpdate.bind(this));
    }

    // ===================================================================
    // EVENT HANDLERS
    // ===================================================================

    private handleWebSocketMessage(message: any): void {
        console.log('📨 Received hierarchy update:', message);

        switch (message.event) {
            case 'ConceptAdded':
                this.handleConceptAdded(message.data);
                break;
            case 'NodeUpdated':
                this.handleNodeUpdated(message.data);
                break;
            case 'HierarchyRestructured':
                this.handleHierarchyRestructured(message.data);
                break;
            case 'ConceptHighlighted':
                this.handleConceptHighlighted(message.data);
                break;
            default:
                console.log('Unknown message type:', message.event);
        }
    }

    private handleConceptAdded(data: any): void {
        // Update hierarchy data and visual nodes
        this.updateVisualNodes();
        this.addEvent({
            type: 'node_added',
            timestamp: Date.now(),
            data
        });
    }

    private handleNodeUpdated(data: any): void {
        // Update specific node
        const nodeId = data.node_id;
        if (nodeId) {
            this.updateSingleNode(nodeId, data);
        }
    }

    private handleHierarchyRestructured(data: any): void {
        // Full hierarchy refresh
        this.refreshHierarchy();
        this.addEvent({
            type: 'hierarchy_restructured',
            timestamp: Date.now(),
            data
        });
    }

    private handleConceptHighlighted(data: any): void {
        // Highlight specific concepts
        const conceptIds = Array.isArray(data.concept_ids) ? data.concept_ids : [data.concept_id];
        this.highlightConcepts(conceptIds);
        
        this.addEvent({
            type: 'concept_highlighted',
            timestamp: Date.now(),
            data
        });
    }

    private handleMouseDown(event: MouseEvent): void {
        const rect = this.canvas!.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const clickedNode = this.getNodeAtPosition(x, y);
        
        if (clickedNode) {
            this.selectNode(clickedNode.id);
            this.isDragging = true;
            this.dragOffset = { x: x - clickedNode.position.x, y: y - clickedNode.position.y };
        } else {
            this.clearSelection();
            this.isDragging = true;
            this.dragOffset = { x, y };
        }
        
        this.lastMousePos = { x, y };
    }

    private handleMouseMove(event: MouseEvent): void {
        const rect = this.canvas!.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (this.isDragging) {
            const selected = get(selectedNodes);
            if (selected.size > 0) {
                // Drag selected nodes
                this.dragSelectedNodes(x - this.lastMousePos.x, y - this.lastMousePos.y);
            } else {
                // Pan viewport
                this.panViewport(x - this.lastMousePos.x, y - this.lastMousePos.y);
            }
        } else {
            // Update hover state
            const hoveredNode = this.getNodeAtPosition(x, y);
            this.updateHoverState(hoveredNode?.id);
        }
        
        this.lastMousePos = { x, y };
    }

    private handleMouseUp(event: MouseEvent): void {
        this.isDragging = false;
        this.canvas!.style.cursor = 'default';
    }

    private handleWheel(event: WheelEvent): void {
        event.preventDefault();
        
        const config = get(visualConfig);
        if (!config.enableZoom) return;
        
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        this.zoomViewport(zoomFactor, event.offsetX, event.offsetY);
    }

    private handleClick(event: MouseEvent): void {
        const rect = this.canvas!.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const clickedNode = this.getNodeAtPosition(x, y);
        
        if (clickedNode) {
            if (event.ctrlKey || event.metaKey) {
                this.toggleNodeSelection(clickedNode.id);
            } else {
                this.selectNode(clickedNode.id);
            }
            
            // Emit node selection event
            this.emitNodeEvent('node_selected', clickedNode);
        }
    }

    private handleKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
            case 'Escape':
                this.clearSelection();
                this.clearHighlights();
                break;
            case 'Delete':
            case 'Backspace':
                // TODO: Implement node deletion
                break;
            case 'f':
            case 'F':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.fitToView();
                }
                break;
        }
    }

    private handleResize(): void {
        const container = document.getElementById(this.containerId);
        if (container && this.canvas) {
            const rect = container.getBoundingClientRect();
            visualConfig.update(config => ({
                ...config,
                width: rect.width,
                height: rect.height
            }));
        }
    }

    private handleHierarchyUpdate(hierarchy: HierarchyView | null): void {
        if (hierarchy) {
            this.updateVisualNodes();
            this.calculateLayout();
        }
    }

    private handleConfigUpdate(config: VisualizationConfig): void {
        this.resizeCanvas();
        this.calculateLayout();
    }

    // ===================================================================
    // LAYOUT AND POSITIONING
    // ===================================================================

    private calculateLayout(): void {
        const hierarchy = get(hierarchyData);
        if (!hierarchy) return;

        const config = get(visualConfig);
        const byScale = get(nodesByScale);
        
        // Calculate positions for each scale level
        Object.entries(byScale).forEach(([scaleStr, nodes]) => {
            const scale = parseInt(scaleStr);
            const y = config.height - (scale + 1) * config.levelHeight;
            
            // Distribute nodes horizontally at this scale
            const totalWidth = config.width - 2 * config.nodeRadius;
            const spacing = nodes.length > 1 ? totalWidth / (nodes.length - 1) : 0;
            
            nodes.forEach((node, index) => {
                const x = config.nodeRadius + (nodes.length > 1 ? index * spacing : totalWidth / 2);
                
                visualNodes.update(current => ({
                    ...current,
                    [node.id]: {
                        ...node,
                        position: { x, y },
                        color: this.getNodeColor(node),
                        size: this.getNodeSize(node),
                        opacity: this.getNodeOpacity(node),
                        visible: true
                    }
                }));
            });
        });
    }

    private getNodeColor(node: VisualNode): string {
        const config = get(visualConfig);
        
        switch (config.colorScheme) {
            case 'scale':
                const hue = (node.scale * 60) % 360;
                return `hsl(${hue}, 70%, 60%)`;
            case 'domain':
                // Use concept domain for color
                return this.getDomainColor(node.concept_id);
            case 'activity':
                const timeSinceAccess = Date.now() - node.last_accessed * 1000;
                const daysSince = timeSinceAccess / (1000 * 60 * 60 * 24);
                const intensity = Math.max(0, 1 - daysSince / 30);
                return `hsl(120, 70%, ${30 + intensity * 50}%)`;
            default:
                return '#4A90E2';
        }
    }

    private getDomainColor(conceptId: number): string {
        const hierarchy = get(hierarchyData);
        if (!hierarchy || !hierarchy.concepts[conceptId]) {
            return '#4A90E2';
        }
        
        const domain = hierarchy.concepts[conceptId].domain || 'general';
        const domainColors: Record<string, string> = {
            'science': '#FF6B6B',
            'technology': '#4ECDC4',
            'mathematics': '#45B7D1',
            'philosophy': '#96CEB4',
            'arts': '#FFEAA7',
            'general': '#DDA0DD'
        };
        
        return domainColors[domain] || domainColors['general'];
    }

    private getNodeSize(node: VisualNode): number {
        const config = get(visualConfig);
        const baseSize = config.nodeRadius;
        
        // Size based on number of children
        const childrenCount = node.children.length;
        const sizeMultiplier = 1 + (childrenCount * 0.1);
        
        return baseSize * Math.min(sizeMultiplier, 2.0);
    }

    private getNodeOpacity(node: VisualNode): number {
        const selected = get(selectedNodes);
        const highlighted = get(highlightedNodes);
        
        if (selected.has(node.id)) return 1.0;
        if (highlighted.has(node.id)) return 0.9;
        if (selected.size > 0 || highlighted.size > 0) return 0.4;
        
        return 0.8;
    }

    // ===================================================================
    // RENDERING
    // ===================================================================

    private startAnimationLoop(): void {
        const animate = () => {
            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    private render(): void {
        if (!this.context || !this.canvas) return;

        const config = get(visualConfig);
        const nodes = get(visualNodes);
        const bounds = get(viewportBounds);
        
        // Clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom and pan transformations
        this.context.save();
        this.context.scale(bounds.zoom, bounds.zoom);
        this.context.translate(-bounds.minX, -bounds.minY);
        
        // Render connections first (behind nodes)
        if (config.showConnections) {
            this.renderConnections(nodes);
        }
        
        // Render nodes
        this.renderNodes(nodes);
        
        // Render labels if enabled
        if (config.showLabels) {
            this.renderLabels(nodes);
        }
        
        this.context.restore();
        
        // Render UI overlay (zoom level, stats, etc.)
        this.renderOverlay();
    }

    private renderConnections(nodes: Record<number, VisualNode>): void {
        this.context!.strokeStyle = '#E0E0E0';
        this.context!.lineWidth = 1;
        this.context!.setLineDash([]);
        
        Object.values(nodes).forEach(node => {
            if (node.parent && nodes[node.parent]) {
                const parent = nodes[node.parent];
                
                this.context!.beginPath();
                this.context!.moveTo(parent.position.x, parent.position.y);
                this.context!.lineTo(node.position.x, node.position.y);
                this.context!.stroke();
            }
        });
    }

    private renderNodes(nodes: Record<number, VisualNode>): void {
        const selected = get(selectedNodes);
        const highlighted = get(highlightedNodes);
        
        Object.values(nodes).forEach(node => {
            if (!node.visible) return;
            
            const { x, y } = node.position;

            this.context!.globalAlpha = node.opacity;
            
            // Node circle
            this.context!.fillStyle = node.color;
            this.context!.beginPath();
            this.context!.arc(x, y, node.size, 0, 2 * Math.PI);
            this.context!.fill();
            
            // Border for selected/highlighted nodes
            if (selected.has(node.id)) {
                this.context!.strokeStyle = '#FF4444';
                this.context!.lineWidth = 3;
                this.context!.stroke();
            } else if (highlighted.has(node.id)) {
                this.context!.strokeStyle = '#FFD700';
                this.context!.lineWidth = 2;
                this.context!.stroke();
            }
            
            // Scale indicator (small text)
            this.context!.fillStyle = '#FFFFFF';
            this.context!.font = '10px Arial';
            this.context!.textAlign = 'center';
            this.context!.textBaseline = 'middle';
            this.context!.fillText(node.scale.toString(), x, y);
        });
        
        this.context!.globalAlpha = 1.0;
    }

    private renderLabels(nodes: Record<number, VisualNode>): void {
        const hierarchy = get(hierarchyData);
        if (!hierarchy) return;
        
        this.context!.fillStyle = '#333333';
        this.context!.font = '12px Arial';
        this.context!.textAlign = 'center';
        this.context!.textBaseline = 'top';
        
        Object.values(nodes).forEach(node => {
            if (!node.visible) return;
            
            const concept = hierarchy.concepts[node.concept_id];
            if (concept) {
                const { x, y } = node.position;
                const label = concept.name.length > 15 
                    ? concept.name.substring(0, 12) + '...'
                    : concept.name;
                
                this.context!.fillText(label, x, y + node.size + 5);
            }
        });
    }

    private renderOverlay(): void {
        const bounds = get(viewportBounds);
        const stats = get(hierarchyStats);
        
        // Zoom indicator
        this.context!.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.context!.fillRect(10, 10, 120, 60);
        
        this.context!.fillStyle = '#FFFFFF';
        this.context!.font = '12px Arial';
        this.context!.textAlign = 'left';
        this.context!.textBaseline = 'top';
        
        this.context!.fillText(`Zoom: ${(bounds.zoom * 100).toFixed(0)}%`, 15, 20);
        
        if (stats) {
            this.context!.fillText(`Nodes: ${stats.total_nodes}`, 15, 35);
            this.context!.fillText(`Scales: ${stats.max_scale + 1}`, 15, 50);
        }
    }

    // ===================================================================
    // INTERACTION UTILITIES
    // ===================================================================

    private getNodeAtPosition(x: number, y: number): VisualNode | null {
        const nodes = get(visualNodes);
        const bounds = get(viewportBounds);
        
        // Transform screen coordinates to world coordinates
        const worldX = (x / bounds.zoom) + bounds.minX;
        const worldY = (y / bounds.zoom) + bounds.minY;
        
        for (const node of Object.values(nodes)) {
            if (!node.visible) continue;
            
            const distance = Math.sqrt(
                Math.pow(worldX - node.position.x, 2) + 
                Math.pow(worldY - node.position.y, 2)
            );
            
            if (distance <= node.size) {
                return node;
            }
        }
        
        return null;
    }

    private selectNode(nodeId: number): void {
        selectedNodes.set(new Set([nodeId]));
        this.emitNodeEvent('node_selected', this.getNodeById(nodeId));
    }

    private toggleNodeSelection(nodeId: number): void {
        selectedNodes.update(current => {
            const newSet = new Set(current);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    }

    private clearSelection(): void {
        selectedNodes.set(new Set());
    }

    private highlightConcepts(conceptIds: number[]): void {
        const nodes = get(visualNodes);
        const nodeIds = Object.values(nodes)
            .filter(node => conceptIds.includes(node.concept_id))
            .map(node => node.id);
        
        highlightedNodes.set(new Set(nodeIds));
        
        // Auto-clear highlights after delay
        setTimeout(() => {
            highlightedNodes.set(new Set());
        }, 3000);
    }

    private clearHighlights(): void {
        highlightedNodes.set(new Set());
    }

    private updateHoverState(nodeId?: number): void {
        if (nodeId) {
            this.canvas!.style.cursor = 'pointer';
        } else {
            this.canvas!.style.cursor = 'default';
        }
    }

    private dragSelectedNodes(deltaX: number, deltaY: number): void {
        const selected = get(selectedNodes);
        if (selected.size === 0) return;
        
        visualNodes.update(current => {
            const updated = { ...current };
            
            selected.forEach(nodeId => {
                if (updated[nodeId]) {
                    updated[nodeId] = {
                        ...updated[nodeId],
                        position: {
                            ...updated[nodeId].position,
                            x: updated[nodeId].position.x + deltaX,
                            y: updated[nodeId].position.y + deltaY
                        }
                    };
                }
            });
            
            return updated;
        });
    }

    private panViewport(deltaX: number, deltaY: number): void {
        viewportBounds.update(current => ({
            ...current,
            minX: current.minX - deltaX,
            maxX: current.maxX - deltaX,
            minY: current.minY - deltaY,
            maxY: current.maxY - deltaY
        }));
    }

    private zoomViewport(factor: number, centerX: number, centerY: number): void {
        viewportBounds.update(current => {
            const newZoom = Math.max(0.1, Math.min(5.0, current.zoom * factor));
            
            // Zoom towards the mouse position
            const zoomDelta = newZoom / current.zoom;
            const newMinX = centerX - (centerX - current.minX) * zoomDelta;
            const newMinY = centerY - (centerY - current.minY) * zoomDelta;
            
            return {
                ...current,
                zoom: newZoom,
                minX: newMinX,
                maxX: newMinX + (current.maxX - current.minX) * zoomDelta,
                minY: newMinY,
                maxY: newMinY + (current.maxY - current.minY) * zoomDelta
            };
        });
    }

    private fitToView(): void {
        const nodes = get(visualNodes);
        const nodeValues = Object.values(nodes);
        
        if (nodeValues.length === 0) return;
        
        const config = get(visualConfig);
        
        // Calculate bounding box of all nodes
        const minX = Math.min(...nodeValues.map(n => n.position.x)) - 50;
        const maxX = Math.max(...nodeValues.map(n => n.position.x)) + 50;
        const minY = Math.min(...nodeValues.map(n => n.position.y)) - 50;
        const maxY = Math.max(...nodeValues.map(n => n.position.y)) + 50;
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Calculate zoom to fit
        const zoomX = config.width / width;
        const zoomY = config.height / height;
        const zoom = Math.min(zoomX, zoomY, 2.0);
        
        viewportBounds.set({
            minX,
            maxX,
            minY,
            maxY,
            zoom
        });
    }

    // ===================================================================
    // PUBLIC API METHODS
    // ===================================================================

    public updateVisualNodes(): void {
        const hierarchy = get(hierarchyData);
        if (!hierarchy) return;
        
        const newVisualNodes: Record<number, VisualNode> = {};
        
        Object.entries(hierarchy.nodes).forEach(([nodeIdStr, node]) => {
            const nodeId = parseInt(nodeIdStr);
            
            newVisualNodes[nodeId] = {
                ...node,
                position: { x: 0, y: 0 }, // Will be calculated in layout
                color: '#4A90E2',
                highlighted: false,
                selected: false,
                visible: true,
                opacity: 0.8,
                size: 8
            };
        });
        
        visualNodes.set(newVisualNodes);
    }

    public updateSingleNode(nodeId: number, data: any): void {
        visualNodes.update(current => {
            if (current[nodeId]) {
                return {
                    ...current,
                    [nodeId]: {
                        ...current[nodeId],
                        ...data,
                        last_accessed: Date.now() / 1000
                    }
                };
            }
            return current;
        });
    }

    public refreshHierarchy(): void {
        // Request fresh hierarchy data from server
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'request_hierarchy_refresh'
            }));
        }
    }

    public getNodeById(nodeId: number): VisualNode | null {
        const nodes = get(visualNodes);
        return nodes[nodeId] || null;
    }

    public exportVisualization(): string {
        // Export current state as JSON
        return JSON.stringify({
            hierarchy: get(hierarchyData),
            visualNodes: get(visualNodes),
            config: get(visualConfig),
            viewport: get(viewportBounds),
            timestamp: Date.now()
        }, null, 2);
    }

    public importVisualization(data: string): void {
        try {
            const parsed = JSON.parse(data);
            
            if (parsed.hierarchy) hierarchyData.set(parsed.hierarchy);
            if (parsed.visualNodes) visualNodes.set(parsed.visualNodes);
            if (parsed.config) visualConfig.set(parsed.config);
            if (parsed.viewport) viewportBounds.set(parsed.viewport);
            
            console.log('✅ Visualization state imported successfully');
        } catch (error) {
            console.error('❌ Failed to import visualization state:', error);
        }
    }

    public destroy(): void {
        // Cleanup resources
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.websocket) {
            this.websocket.close();
        }
        
        if (this.canvas) {
            this.canvas.remove();
        }
    }

    // ===================================================================
    // UTILITY METHODS
    // ===================================================================

    private addEvent(event: HierarchyEvent): void {
        hierarchyEvents.update(current => {
            const updated = [...current, event];
            // Keep only last 100 events
            return updated.slice(-100);
        });
    }

    private addError(error: HierarchyError): void {
        hierarchyErrors.update(current => {
            const updated = [...current, error];
            // Keep only last 20 errors
            return updated.slice(-20);
        });
    }

    private emitNodeEvent(eventType: string, node: VisualNode | null): void {
        if (node) {
            const customEvent = new CustomEvent(`hierarchy:${eventType}`, {
                detail: { node, timestamp: Date.now() }
            });
            window.dispatchEvent(customEvent);
        }
    }
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

export function createHierarchyVisualizer(
    containerId: string,
    websocketUrl?: string
): HierarchyVisualizer {
    return new HierarchyVisualizer(containerId, websocketUrl);
}

export function updateHierarchyData(newData: HierarchyView): void {
    hierarchyData.set(newData);
}

export function updateHierarchyStats(newStats: HierarchyStats): void {
    hierarchyStats.set(newStats);
}

export function highlightNodes(nodeIds: number[]): void {
    highlightedNodes.set(new Set(nodeIds));
}

export function selectNodes(nodeIds: number[]): void {
    selectedNodes.set(new Set(nodeIds));
}

export function clearAllSelections(): void {
    selectedNodes.set(new Set());
    highlightedNodes.set(new Set());
}

// Color schemes for different visualization modes
export const COLOR_SCHEMES = {
    default: '#4A90E2',
    scale: (scale: number) => `hsl(${(scale * 60) % 360}, 70%, 60%)`,
    domain: {
        science: '#FF6B6B',
        technology: '#4ECDC4',
        mathematics: '#45B7D1',
        philosophy: '#96CEB4',
        arts: '#FFEAA7',
        general: '#DDA0DD'
    },
    activity: (daysSinceAccess: number) => {
        const intensity = Math.max(0, 1 - daysSinceAccess / 30);
        return `hsl(120, 70%, ${30 + intensity * 50}%)`;
    }
};

// Animation presets
export const ANIMATION_PRESETS = {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 600,
    smooth: 1000
};

// Default configuration
export const DEFAULT_CONFIG: VisualizationConfig = {
    width: 800,
    height: 600,
    nodeRadius: 8,
    levelHeight: 80,
    colorScheme: 'scale',
    showLabels: true,
    showConnections: true,
    enableZoom: true,
    enablePan: true,
    animationDuration: ANIMATION_PRESETS.normal
};
