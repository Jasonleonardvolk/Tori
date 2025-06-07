/**
 * TORI BraidMemory - TypeScript Visualization Component
 * 
 * This module provides interactive visualization of the braid memory system
 * with temporal threading, ∞-groupoid coherence visualization, and real-time
 * braid connection management. Features braided timeline views and homotopy
 * equivalence visualization.
 */

import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

export interface MemoryNode {
    id: number;
    concept_id: number;
    thread_id: number;
    position: number;
    timestamp: number;
    context?: string;
    strength: number;
    causal_links: number[];
    metadata: Record<string, any>;
}

export interface MemoryThread {
    id: number;
    title: string;
    nodes: number[];
    created_at: number;
    modified_at: number;
    activity_level: number;
    domain?: string;
    parent_thread?: number;
    child_threads: number[];
    braid_points: Record<number, number>; // position -> braid_id
    metadata: Record<string, any>;
}

export interface BraidConnection {
    id: number;
    threads: number[];
    concept_id: number;
    positions: Record<number, number>; // thread_id -> position
    created_at: number;
    strength: number;
    braid_type: 'semantic' | 'temporal' | 'causal' | 'logical' | 'user_defined' | 'system_detected';
    homotopy_class?: string;
    metadata: Record<string, any>;
}

export interface HomotopyRelation {
    source_braid: number;
    target_braid: number;
    transformation: string;
    confidence: number;
    created_at: number;
}

export interface BraidMemoryStats {
    total_threads: number;
    total_nodes: number;
    total_braids: number;
    total_homotopies: number;
    active_threads: number;
    average_thread_length: number;
    max_thread_length: number;
    braid_density: number;
    coherence_score: number;
    last_updated: number;
}

export interface VisualizationConfig {
    width: number;
    height: number;
    threadSpacing: number;
    nodeSize: number;
    braidWidth: number;
    timeScale: number;
    colorScheme: 'temporal' | 'concept' | 'strength' | 'homotopy';
    showLabels: boolean;
    showBraids: boolean;
    showHomotopies: boolean;
    enableZoom: boolean;
    enablePan: boolean;
    animationDuration: number;
    braidAnimations: boolean;
}

export interface ThreadPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface VisualThread extends MemoryThread {
    position: ThreadPosition;
    color: string;
    highlighted: boolean;
    selected: boolean;
    visible: boolean;
    opacity: number;
    visualNodes: VisualNode[];
}

export interface VisualNode extends MemoryNode {
    position: { x: number; y: number };
    color: string;
    highlighted: boolean;
    selected: boolean;
    visible: boolean;
    opacity: number;
    size: number;
    temporalOrder: number;
}

export interface VisualBraid extends BraidConnection {
    path: string; // SVG path for the braid curve
    color: string;
    highlighted: boolean;
    selected: boolean;
    visible: boolean;
    opacity: number;
    width: number;
    animationPhase: number;
}

export interface BraidEvent {
    type: 'thread_added' | 'node_added' | 'braid_created' | 'homotopy_detected' | 'coherence_updated';
    timestamp: number;
    data: any;
}

// ===================================================================
// STORES AND STATE MANAGEMENT
// ===================================================================

// Core braid memory data stores
export const braidMemoryData: Writable<{
    threads: Record<number, MemoryThread>;
    nodes: Record<number, MemoryNode>;
    braids: Record<number, BraidConnection>;
    homotopies: HomotopyRelation[];
} | null> = writable(null);

// Memory statistics
export const braidMemoryStats: Writable<BraidMemoryStats | null> = writable(null);

// Visual configuration
export const braidVisualConfig: Writable<VisualizationConfig> = writable({
    width: 1200,
    height: 800,
    threadSpacing: 120,
    nodeSize: 6,
    braidWidth: 3,
    timeScale: 1.0,
    colorScheme: 'temporal',
    showLabels: true,
    showBraids: true,
    showHomotopies: false,
    enableZoom: true,
    enablePan: true,
    animationDuration: 500,
    braidAnimations: true
});

// Visual elements with computed positions and styling
export const visualThreads: Writable<Record<number, VisualThread>> = writable({});
export const visualNodes: Writable<Record<number, VisualNode>> = writable({});
export const visualBraids: Writable<Record<number, VisualBraid>> = writable({});

// Selected and highlighted elements
export const selectedThreads: Writable<Set<number>> = writable(new Set());
export const selectedNodes: Writable<Set<number>> = writable(new Set());
export const selectedBraids: Writable<Set<number>> = writable(new Set());
export const highlightedElements: Writable<{
    threads: Set<number>;
    nodes: Set<number>;
    braids: Set<number>;
}> = writable({
    threads: new Set(),
    nodes: new Set(),
    braids: new Set()
});

// Events stream
export const braidEvents: Writable<BraidEvent[]> = writable([]);

// Current time range for temporal visualization
export const timeRange: Writable<{
    start: number;
    end: number;
    current: number;
}> = writable({
    start: 0,
    end: Date.now() / 1000,
    current: Date.now() / 1000
});

// ===================================================================
// DERIVED STORES
// ===================================================================

// Threads organized by temporal order
export const threadsByTime: Readable<VisualThread[]> = derived(
    [visualThreads],
    ([$visualThreads]) => {
        return Object.values($visualThreads).sort((a, b) => a.created_at - b.created_at);
    }
);

// Active braids (within current time range)
export const activeBraids: Readable<VisualBraid[]> = derived(
    [visualBraids, timeRange],
    ([$visualBraids, $timeRange]) => {
        return Object.values($visualBraids).filter(braid => 
            braid.created_at >= $timeRange.start && braid.created_at <= $timeRange.end
        );
    }
);

// Homotopy equivalence groups
export const homotopyGroups: Readable<Record<string, BraidConnection[]>> = derived(
    [braidMemoryData],
    ([$braidMemoryData]) => {
        if (!$braidMemoryData) return {};
        
        const groups: Record<string, BraidConnection[]> = {};
        
        Object.values($braidMemoryData.braids).forEach(braid => {
            if (braid.homotopy_class) {
                if (!groups[braid.homotopy_class]) {
                    groups[braid.homotopy_class] = [];
                }
                groups[braid.homotopy_class].push(braid);
            }
        });
        
        return groups;
    }
);

// Current viewport bounds
export const braidViewportBounds: Writable<{
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    zoom: number;
}> = writable({
    minX: 0,
    maxX: 1200,
    minY: 0,
    maxY: 800,
    zoom: 1.0
});

// ===================================================================
// BRAID MEMORY VISUALIZER CLASS
// ===================================================================

export class BraidMemoryVisualizer {
    private websocket: WebSocket | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private context: CanvasRenderingContext2D | null = null;
    private svgContainer: SVGElement | null = null;
    private animationId: number | null = null;
    private isDragging = false;
    private dragOffset = { x: 0, y: 0 };
    private lastMousePos = { x: 0, y: 0 };
    private timelinePosition = 0;
    private braidAnimationOffset = 0;

    constructor(
        private containerId: string,
        private websocketUrl: string = 'ws://localhost:8002/ws/braid'
    ) {
        this.initializeWebSocket();
        this.initializeVisualization();
        this.setupEventListeners();
    }

    // ===================================================================
    // INITIALIZATION
    // ===================================================================

    private initializeWebSocket(): void {
        try {
            this.websocket = new WebSocket(this.websocketUrl);
            
            this.websocket.onopen = () => {
                console.log('🔌 Connected to TORI BraidMemory WebSocket');
                this.addEvent({
                    type: 'coherence_updated',
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
                console.error('BraidMemory WebSocket error:', error);
            };

            this.websocket.onclose = () => {
                console.log('📡 BraidMemory WebSocket closed, reconnecting...');
                setTimeout(() => this.initializeWebSocket(), 5000);
            };
        } catch (error) {
            console.error('Failed to initialize BraidMemory WebSocket:', error);
        }
    }

    private initializeVisualization(): void {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        // Create main visualization container
        const vizContainer = document.createElement('div');
        vizContainer.style.position = 'relative';
        vizContainer.style.width = '100%';
        vizContainer.style.height = '100%';
        vizContainer.style.overflow = 'hidden';
        
        // Create SVG container for braids (vector graphics)
        this.svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgContainer.style.position = 'absolute';
        this.svgContainer.style.top = '0';
        this.svgContainer.style.left = '0';
        this.svgContainer.style.pointerEvents = 'none';
        
        // Create canvas for threads and nodes (raster graphics)
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.border = '1px solid #ddd';
        this.canvas.style.borderRadius = '4px';
        
        vizContainer.appendChild(this.svgContainer);
        vizContainer.appendChild(this.canvas);
        container.appendChild(vizContainer);
        
        this.context = this.canvas.getContext('2d');
        if (!this.context) {
            console.error('Failed to get 2D context');
            return;
        }

        // Set initial size
        this.resizeVisualization();
        
        // Start animation loop
        this.startAnimationLoop();
    }

    private resizeVisualization(): void {
        if (!this.canvas || !this.svgContainer || !this.context) return;

        const config = get(braidVisualConfig);
        
        // Update canvas size
        this.canvas.width = config.width;
        this.canvas.height = config.height;
        
        // Update SVG size
        this.svgContainer.setAttribute('width', config.width.toString());
        this.svgContainer.setAttribute('height', config.height.toString());
        
        // Update viewport bounds
        braidViewportBounds.set({
            minX: 0,
            maxX: config.width,
            minY: 0,
            maxY: config.height,
            zoom: 1.0
        });
    }

    private setupEventListeners(): void {
        if (!this.canvas) return;

        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));

        // Keyboard events
        window.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Store subscriptions
        braidMemoryData.subscribe(this.handleDataUpdate.bind(this));
        braidVisualConfig.subscribe(this.handleConfigUpdate.bind(this));
        timeRange.subscribe(this.handleTimeUpdate.bind(this));
    }

    // ===================================================================
    // EVENT HANDLERS
    // ===================================================================

    private handleWebSocketMessage(message: any): void {
        console.log('📨 Received braid memory update:', message);

        switch (message.event) {
            case 'ThreadAdded':
                this.handleThreadAdded(message.data);
                break;
            case 'NodeAdded':
                this.handleNodeAdded(message.data);
                break;
            case 'BraidCreated':
                this.handleBraidCreated(message.data);
                break;
            case 'HomotopyDetected':
                this.handleHomotopyDetected(message.data);
                break;
            case 'CoherenceUpdated':
                this.handleCoherenceUpdated(message.data);
                break;
            default:
                console.log('Unknown braid message type:', message.event);
        }
    }

    private handleThreadAdded(data: any): void {
        this.updateVisualElements();
        this.addEvent({
            type: 'thread_added',
            timestamp: Date.now(),
            data
        });
    }

    private handleNodeAdded(data: any): void {
        this.updateVisualElements();
        this.addEvent({
            type: 'node_added',
            timestamp: Date.now(),
            data
        });
    }

    private handleBraidCreated(data: any): void {
        this.updateVisualElements();
        this.animateBraidCreation(data.braid_id);
        this.addEvent({
            type: 'braid_created',
            timestamp: Date.now(),
            data
        });
    }

    private handleHomotopyDetected(data: any): void {
        this.highlightHomotopyEquivalence(data.source_braid, data.target_braid);
        this.addEvent({
            type: 'homotopy_detected',
            timestamp: Date.now(),
            data
        });
    }

    private handleCoherenceUpdated(data: any): void {
        braidMemoryStats.update(current => {
            if (current) {
                return { ...current, coherence_score: data.coherence_score };
            }
            return current;
        });
    }

    private handleMouseDown(event: MouseEvent): void {
        const rect = this.canvas!.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const clickedElement = this.getElementAtPosition(x, y);
        
        if (clickedElement) {
            this.selectElement(clickedElement);
            this.isDragging = true;
            this.dragOffset = { x: x - clickedElement.position.x, y: y - clickedElement.position.y };
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
            const selected = get(selectedThreads);
            if (selected.size > 0) {
                // Drag selected threads
                this.dragSelectedThreads(x - this.lastMousePos.x, y - this.lastMousePos.y);
            } else {
                // Pan viewport
                this.panViewport(x - this.lastMousePos.x, y - this.lastMousePos.y);
            }
        } else {
            // Update hover state
            const hoveredElement = this.getElementAtPosition(x, y);
            this.updateHoverState(hoveredElement);
        }
        
        this.lastMousePos = { x, y };
    }

    private handleMouseUp(event: MouseEvent): void {
        this.isDragging = false;
        this.canvas!.style.cursor = 'default';
    }

    private handleWheel(event: WheelEvent): void {
        event.preventDefault();
        
        const config = get(braidVisualConfig);
        if (!config.enableZoom) return;
        
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        this.zoomViewport(zoomFactor, event.offsetX, event.offsetY);
    }

    private handleClick(event: MouseEvent): void {
        const rect = this.canvas!.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const clickedElement = this.getElementAtPosition(x, y);
        
        if (clickedElement) {
            if (event.ctrlKey || event.metaKey) {
                this.toggleElementSelection(clickedElement);
            } else {
                this.selectElement(clickedElement);
            }
            
            this.emitElementEvent('element_selected', clickedElement);
        }
    }

    private handleKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
            case 'Escape':
                this.clearSelection();
                this.clearHighlights();
                break;
            case 'Space':
                event.preventDefault();
                this.toggleTimelineAnimation();
                break;
            case 'ArrowLeft':
                this.stepTimeline(-1);
                break;
            case 'ArrowRight':
                this.stepTimeline(1);
                break;
            case 'h':
            case 'H':
                this.toggleHomotopyVisualization();
                break;
        }
    }

    private handleDataUpdate(data: any): void {
        if (data) {
            this.updateVisualElements();
            this.calculateLayout();
        }
    }

    private handleConfigUpdate(config: VisualizationConfig): void {
        this.resizeVisualization();
        this.calculateLayout();
    }

    private handleTimeUpdate(timeRange: any): void {
        this.updateTemporalVisualization();
    }

    // ===================================================================
    // LAYOUT AND POSITIONING
    // ===================================================================

    private calculateLayout(): void {
        const data = get(braidMemoryData);
        if (!data) return;

        const config = get(braidVisualConfig);
        
        // Calculate thread positions
        this.calculateThreadPositions(Object.values(data.threads));
        
        // Calculate node positions within threads
        this.calculateNodePositions(Object.values(data.nodes));
        
        // Calculate braid paths
        this.calculateBraidPaths(Object.values(data.braids));
    }

    private calculateThreadPositions(threads: MemoryThread[]): void {
        const config = get(braidVisualConfig);
        const sortedThreads = threads.sort((a, b) => a.created_at - b.created_at);
        
        visualThreads.update(current => {
            const updated: Record<number, VisualThread> = {};
            
            sortedThreads.forEach((thread, index) => {
                const y = 60 + index * config.threadSpacing;
                const threadWidth = config.width - 120;
                
                updated[thread.id] = {
                    ...thread,
                    position: {
                        x: 60,
                        y: y,
                        width: threadWidth,
                        height: 40
                    },
                    color: this.getThreadColor(thread),
                    highlighted: false,
                    selected: false,
                    visible: true,
                    opacity: 0.8,
                    visualNodes: []
                };
            });
            
            return updated;
        });
    }

    private calculateNodePositions(nodes: MemoryNode[]): void {
        const config = get(braidVisualConfig);
        const threads = get(visualThreads);
        const timeRangeData = get(timeRange);
        
        visualNodes.update(current => {
            const updated: Record<number, VisualNode> = {};
            
            nodes.forEach(node => {
                const thread = threads[node.thread_id];
                if (!thread) return;
                
                // Calculate temporal position
                const timeProgress = (node.timestamp - timeRangeData.start) / 
                                   (timeRangeData.end - timeRangeData.start);
                const x = thread.position.x + (timeProgress * thread.position.width);
                const y = thread.position.y + 20; // Center of thread
                
                updated[node.id] = {
                    ...node,
                    position: { x, y },
                    color: this.getNodeColor(node),
                    highlighted: false,
                    selected: false,
                    visible: true,
                    opacity: 0.9,
                    size: config.nodeSize,
                    temporalOrder: timeProgress
                };
            });
            
            return updated;
        });
    }

    private calculateBraidPaths(braids: BraidConnection[]): void {
        const config = get(braidVisualConfig);
        const threads = get(visualThreads);
        const nodes = get(visualNodes);
        
        visualBraids.update(current => {
            const updated: Record<number, VisualBraid> = {};
            
            braids.forEach(braid => {
                const braidThreads = braid.threads.map(tid => threads[tid]).filter(Boolean);
                if (braidThreads.length < 2) return;
                
                // Calculate braid curve path
                const path = this.calculateBraidCurve(braid, braidThreads, nodes);
                
                updated[braid.id] = {
                    ...braid,
                    path,
                    color: this.getBraidColor(braid),
                    highlighted: false,
                    selected: false,
                    visible: true,
                    opacity: 0.7,
                    width: config.braidWidth,
                    animationPhase: 0
                };
            });
            
            return updated;
        });
    }

    private calculateBraidCurve(
        braid: BraidConnection, 
        threads: VisualThread[], 
        nodes: Record<number, VisualNode>
    ): string {
        const points: Array<{x: number, y: number}> = [];
        
        // Get connection points on each thread
        braid.threads.forEach(threadId => {
            const thread = threads.find(t => t.id === threadId);
            const position = braid.positions[threadId];
            
            if (thread && position !== undefined) {
                // Find the node at this position
                const threadNodes = Object.values(nodes).filter(n => n.thread_id === threadId);
                if (threadNodes[position]) {
                    points.push(threadNodes[position].position);
                } else {
                    // Estimate position if node not found
                    const x = thread.position.x + (position / thread.nodes.length) * thread.position.width;
                    points.push({ x, y: thread.position.y + 20 });
                }
            }
        });
        
        if (points.length < 2) return '';
        
        // Create smooth curve through all points
        let path = `M ${points[0].x} ${points[0].y}`;
        
        if (points.length === 2) {
            // Simple curve for two points
            const midX = (points[0].x + points[1].x) / 2;
            const controlY = Math.min(points[0].y, points[1].y) - 30;
            path += ` Q ${midX} ${controlY} ${points[1].x} ${points[1].y}`;
        } else {
            // Complex curve for multiple points
            for (let i = 1; i < points.length; i++) {
                if (i === 1) {
                    const cp1x = points[0].x + (points[1].x - points[0].x) * 0.5;
                    const cp1y = points[0].y - 20;
                    path += ` Q ${cp1x} ${cp1y} ${points[1].x} ${points[1].y}`;
                } else {
                    path += ` L ${points[i].x} ${points[i].y}`;
                }
            }
        }
        
        return path;
    }

    private getThreadColor(thread: MemoryThread): string {
        const config = get(braidVisualConfig);
        
        switch (config.colorScheme) {
            case 'temporal':
                const hue = (thread.created_at % 3600) / 3600 * 360;
                return `hsl(${hue}, 70%, 60%)`;
            case 'concept':
                return '#4A90E2';
            case 'strength':
                const intensity = thread.activity_level * 100;
                return `hsl(220, 70%, ${Math.max(30, 90 - intensity)}%)`;
            default:
                return '#4A90E2';
        }
    }

    private getNodeColor(node: MemoryNode): string {
        const config = get(braidVisualConfig);
        
        switch (config.colorScheme) {
            case 'temporal':
                const age = Date.now() / 1000 - node.timestamp;
                const dayAge = age / 86400;
                const hue = Math.max(0, 240 - dayAge * 10);
                return `hsl(${hue}, 80%, 65%)`;
            case 'concept':
                const conceptHue = (node.concept_id * 137.5) % 360;
                return `hsl(${conceptHue}, 70%, 60%)`;
            case 'strength':
                const strengthColor = Math.floor(node.strength * 255);
                return `rgb(${255 - strengthColor}, ${strengthColor}, 100)`;
            default:
                return '#FF6B6B';
        }
    }

    private getBraidColor(braid: BraidConnection): string {
        const config = get(braidVisualConfig);
        
        switch (config.colorScheme) {
            case 'homotopy':
                if (braid.homotopy_class) {
                    const classHash = braid.homotopy_class.split('').reduce((a, b) => {
                        a = ((a << 5) - a) + b.charCodeAt(0);
                        return a & a;
                    }, 0);
                    const hue = Math.abs(classHash) % 360;
                    return `hsl(${hue}, 80%, 50%)`;
                }
                return '#888888';
            case 'strength':
                const alpha = braid.strength / 10;
                return `rgba(255, 100, 50, ${alpha})`;
            default:
                const typeColors = {
                    'semantic': '#9B59B6',
                    'temporal': '#3498DB',
                    'causal': '#E74C3C',
                    'logical': '#2ECC71',
                    'user_defined': '#F39C12',
                    'system_detected': '#95A5A6'
                };
                return typeColors[braid.braid_type] || '#95A5A6';
        }
    }

    // ===================================================================
    // RENDERING
    // ===================================================================

    private startAnimationLoop(): void {
        const animate = () => {
            this.updateAnimations();
            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    private updateAnimations(): void {
        const config = get(braidVisualConfig);
        
        if (config.braidAnimations) {
            this.braidAnimationOffset += 0.02;
            
            // Update braid animation phases
            visualBraids.update(current => {
                const updated = { ...current };
                Object.values(updated).forEach(braid => {
                    braid.animationPhase = (this.braidAnimationOffset + braid.id * 0.1) % (Math.PI * 2);
                });
                return updated;
            });
        }
    }

    private render(): void {
        if (!this.context || !this.canvas || !this.svgContainer) return;

        const config = get(braidVisualConfig);
        const bounds = get(braidViewportBounds);
        
        // Clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Clear SVG
        this.svgContainer.innerHTML = '';
        
        // Apply transformations
        this.context.save();
        this.context.scale(bounds.zoom, bounds.zoom);
        this.context.translate(-bounds.minX, -bounds.minY);
        
        // Render threads
        this.renderThreads();
        
        // Render nodes
        this.renderNodes();
        
        this.context.restore();
        
        // Render braids (SVG)
        if (config.showBraids) {
            this.renderBraids();
        }
        
        // Render homotopy relations
        if (config.showHomotopies) {
            this.renderHomotopies();
        }
        
        // Render UI overlays
        this.renderOverlays();
    }

    private renderThreads(): void {
        const threads = get(visualThreads);
        const config = get(braidVisualConfig);
        const selected = get(selectedThreads);
        
        Object.values(threads).forEach(thread => {
            if (!thread.visible) return;
            
            const { x, y, width, height } = thread.position;
            
            // Thread background
            this.context!.globalAlpha = thread.opacity;
            this.context!.fillStyle = thread.color;
            this.context!.fillRect(x, y, width, height);
            
            // Thread border
            if (selected.has(thread.id)) {
                this.context!.strokeStyle = '#FF4444';
                this.context!.lineWidth = 3;
                this.context!.strokeRect(x, y, width, height);
            } else if (thread.highlighted) {
                this.context!.strokeStyle = '#FFD700';
                this.context!.lineWidth = 2;
                this.context!.strokeRect(x, y, width, height);
            }
            
            // Thread label
            if (config.showLabels) {
                this.context!.fillStyle = '#333333';
                this.context!.font = '12px Arial';
                this.context!.textAlign = 'left';
                this.context!.textBaseline = 'middle';
                this.context!.fillText(thread.title, x + 5, y + height / 2);
            }
        });
        
        this.context!.globalAlpha = 1.0;
    }

    private renderNodes(): void {
        const nodes = get(visualNodes);
        const selected = get(selectedNodes);
        
        Object.values(nodes).forEach(node => {
            if (!node.visible) return;
            
            const { x, y } = node.position;
            
            this.context!.globalAlpha = node.opacity;
            
            // Node circle
            this.context!.fillStyle = node.color;
            this.context!.beginPath();
            this.context!.arc(x, y, node.size, 0, 2 * Math.PI);
            this.context!.fill();
            
            // Node border
            if (selected.has(node.id)) {
                this.context!.strokeStyle = '#FF4444';
                this.context!.lineWidth = 2;
                this.context!.stroke();
            } else if (node.highlighted) {
                this.context!.strokeStyle = '#FFD700';
                this.context!.lineWidth = 1;
                this.context!.stroke();
            }
            
            // Causal links
            if (node.causal_links.length > 0) {
                this.renderCausalLinks(node, nodes);
            }
        });
        
        this.context!.globalAlpha = 1.0;
    }

    private renderCausalLinks(sourceNode: VisualNode, allNodes: Record<number, VisualNode>): void {
        this.context!.strokeStyle = '#999999';
        this.context!.lineWidth = 1;
        this.context!.setLineDash([3, 3]);
        
        sourceNode.causal_links.forEach(targetId => {
            const targetNode = allNodes[targetId];
            if (targetNode && targetNode.visible) {
                this.context!.beginPath();
                this.context!.moveTo(sourceNode.position.x, sourceNode.position.y);
                this.context!.lineTo(targetNode.position.x, targetNode.position.y);
                this.context!.stroke();
            }
        });
        
        this.context!.setLineDash([]);
    }

    private renderBraids(): void {
        const braids = get(visualBraids);
        const bounds = get(braidViewportBounds);
        const config = get(braidVisualConfig);
        
        Object.values(braids).forEach(braid => {
            if (!braid.visible || !braid.path) return;
            
            // Create SVG path element
            const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement.setAttribute('d', braid.path);
            pathElement.setAttribute('stroke', braid.color);
            pathElement.setAttribute('stroke-width', braid.width.toString());
            pathElement.setAttribute('fill', 'none');
            pathElement.setAttribute('opacity', braid.opacity.toString());
            
            // Add animation if enabled
            if (config.braidAnimations) {
                const dashLength = 10;
                const dashOffset = Math.sin(braid.animationPhase) * dashLength;
                pathElement.setAttribute('stroke-dasharray', `${dashLength} ${dashLength}`);
                pathElement.setAttribute('stroke-dashoffset', dashOffset.toString());
            }
            
            // Add interaction attributes
            pathElement.setAttribute('data-braid-id', braid.id.toString());
            pathElement.style.cursor = 'pointer';
            
            this.svgContainer!.appendChild(pathElement);
        });
    }

    private renderHomotopies(): void {
        const homotopyGroups = get(homotopyGroups);
        const braids = get(visualBraids);
        
        Object.entries(homotopyGroups).forEach(([className, groupBraids]) => {
            if (groupBraids.length < 2) return;
            
            // Create visual indicator for homotopy equivalence
            const groupElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            groupElement.setAttribute('class', 'homotopy-group');
            
            // Draw equivalence indicators
            groupBraids.forEach((braid, index) => {
                const visualBraid = braids[braid.id];
                if (!visualBraid || !visualBraid.visible) return;
                
                // Add equivalence marker
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                
                // Position at midpoint of braid
                const pathLength = visualBraid.path.length;
                if (pathLength > 0) {
                    // Simplified positioning - in practice would calculate actual path midpoint
                    marker.setAttribute('cx', '100');
                    marker.setAttribute('cy', '100');
                    marker.setAttribute('r', '3');
                    marker.setAttribute('fill', visualBraid.color);
                    marker.setAttribute('stroke', '#ffffff');
                    marker.setAttribute('stroke-width', '1');
                    
                    groupElement.appendChild(marker);
                }
            });
            
            this.svgContainer!.appendChild(groupElement);
        });
    }

    private renderOverlays(): void {
        const stats = get(braidMemoryStats);
        const timeRangeData = get(timeRange);
        const bounds = get(braidViewportBounds);
        
        // Stats panel
        this.context!.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.context!.fillRect(10, 10, 180, 120);
        
        this.context!.fillStyle = '#FFFFFF';
        this.context!.font = '12px Arial';
        this.context!.textAlign = 'left';
        this.context!.textBaseline = 'top';
        
        let y = 20;
        this.context!.fillText(`Zoom: ${(bounds.zoom * 100).toFixed(0)}%`, 15, y);
        y += 15;
        
        if (stats) {
            this.context!.fillText(`Threads: ${stats.total_threads}`, 15, y);
            y += 15;
            this.context!.fillText(`Nodes: ${stats.total_nodes}`, 15, y);
            y += 15;
            this.context!.fillText(`Braids: ${stats.total_braids}`, 15, y);
            y += 15;
            this.context!.fillText(`Coherence: ${(stats.coherence_score * 100).toFixed(1)}%`, 15, y);
            y += 15;
            this.context!.fillText(`Density: ${stats.braid_density.toFixed(3)}`, 15, y);
        }
        
        // Timeline
        this.renderTimeline(timeRangeData);
    }

    private renderTimeline(timeRangeData: any): void {
        const config = get(braidVisualConfig);
        const timelineY = config.height - 50;
        const timelineWidth = config.width - 40;
        
        // Timeline background
        this.context!.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.context!.fillRect(20, timelineY, timelineWidth, 30);
        
        // Timeline progress
        const progress = (timeRangeData.current - timeRangeData.start) / 
                        (timeRangeData.end - timeRangeData.start);
        const progressWidth = timelineWidth * progress;
        
        this.context!.fillStyle = '#4A90E2';
        this.context!.fillRect(20, timelineY, progressWidth, 30);
        
        // Timeline labels
        this.context!.fillStyle = '#333333';
        this.context!.font = '10px Arial';
        this.context!.textAlign = 'center';
        
        const startDate = new Date(timeRangeData.start * 1000).toLocaleTimeString();
        const endDate = new Date(timeRangeData.end * 1000).toLocaleTimeString();
        
        this.context!.fillText(startDate, 20, timelineY + 45);
        this.context!.fillText(endDate, 20 + timelineWidth, timelineY + 45);
    }

    // ===================================================================
    // INTERACTION UTILITIES
    // ===================================================================

    private getElementAtPosition(x: number, y: number): any {
        const bounds = get(braidViewportBounds);
        
        // Transform to world coordinates
        const worldX = (x / bounds.zoom) + bounds.minX;
        const worldY = (y / bounds.zoom) + bounds.minY;
        
        // Check nodes first (smallest targets)
        const nodes = get(visualNodes);
        for (const node of Object.values(nodes)) {
            if (!node.visible) continue;
            
            const distance = Math.sqrt(
                Math.pow(worldX - node.position.x, 2) + 
                Math.pow(worldY - node.position.y, 2)
            );
            
            if (distance <= node.size) {
                return { type: 'node', element: node };
            }
        }
        
        // Check threads
        const threads = get(visualThreads);
        for (const thread of Object.values(threads)) {
            if (!thread.visible) continue;
            
            const { x, y, width, height } = thread.position;
            if (worldX >= x && worldX <= x + width && 
                worldY >= y && worldY <= y + height) {
                return { type: 'thread', element: thread };
            }
        }
        
        return null;
    }

    private selectElement(elementData: any): void {
        this.clearSelection();
        
        if (elementData.type === 'thread') {
            selectedThreads.set(new Set([elementData.element.id]));
        } else if (elementData.type === 'node') {
            selectedNodes.set(new Set([elementData.element.id]));
        }
    }

    private toggleElementSelection(elementData: any): void {
        if (elementData.type === 'thread') {
            selectedThreads.update(current => {
                const newSet = new Set(current);
                if (newSet.has(elementData.element.id)) {
                    newSet.delete(elementData.element.id);
                } else {
                    newSet.add(elementData.element.id);
                }
                return newSet;
            });
        } else if (elementData.type === 'node') {
            selectedNodes.update(current => {
                const newSet = new Set(current);
                if (newSet.has(elementData.element.id)) {
                    newSet.delete(elementData.element.id);
                } else {
                    newSet.add(elementData.element.id);
                }
                return newSet;
            });
        }
    }

    private clearSelection(): void {
        selectedThreads.set(new Set());
        selectedNodes.set(new Set());
        selectedBraids.set(new Set());
    }

    private clearHighlights(): void {
        highlightedElements.set({
            threads: new Set(),
            nodes: new Set(),
            braids: new Set()
        });
    }

    private updateHoverState(elementData: any): void {
        if (elementData) {
            this.canvas!.style.cursor = 'pointer';
        } else {
            this.canvas!.style.cursor = 'default';
        }
    }

    private dragSelectedThreads(deltaX: number, deltaY: number): void {
        const selected = get(selectedThreads);
        if (selected.size === 0) return;
        
        visualThreads.update(current => {
            const updated = { ...current };
            
            selected.forEach(threadId => {
                if (updated[threadId]) {
                    updated[threadId].position.x += deltaX;
                    updated[threadId].position.y += deltaY;
                }
            });
            
            return updated;
        });
        
        // Recalculate dependent positions
        this.calculateLayout();
    }

    private panViewport(deltaX: number, deltaY: number): void {
        braidViewportBounds.update(current => ({
            ...current,
            minX: current.minX - deltaX,
            maxX: current.maxX - deltaX,
            minY: current.minY - deltaY,
            maxY: current.maxY - deltaY
        }));
    }

    private zoomViewport(factor: number, centerX: number, centerY: number): void {
        braidViewportBounds.update(current => {
            const newZoom = Math.max(0.1, Math.min(5.0, current.zoom * factor));
            
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

    // ===================================================================
    // ANIMATION AND TIMELINE CONTROL
    // ===================================================================

    private toggleTimelineAnimation(): void {
        // Toggle timeline playback
        console.log('🎬 Timeline animation toggled');
    }

    private stepTimeline(direction: number): void {
        timeRange.update(current => {
            const step = (current.end - current.start) * 0.01; // 1% step
            const newCurrent = Math.max(
                current.start,
                Math.min(current.end, current.current + direction * step)
            );
            
            return { ...current, current: newCurrent };
        });
    }

    private toggleHomotopyVisualization(): void {
        braidVisualConfig.update(current => ({
            ...current,
            showHomotopies: !current.showHomotopies
        }));
    }

    private animateBraidCreation(braidId: number): void {
        // Animate the creation of a new braid
        visualBraids.update(current => {
            if (current[braidId]) {
                current[braidId].animationPhase = 0;
                // Trigger animation sequence...
            }
            return current;
        });
    }

    private highlightHomotopyEquivalence(sourceBraidId: number, targetBraidId: number): void {
        highlightedElements.update(current => ({
            ...current,
            braids: new Set([...current.braids, sourceBraidId, targetBraidId])
        }));
        
        // Auto-clear after delay
        setTimeout(() => {
            highlightedElements.update(current => {
                const newBraids = new Set(current.braids);
                newBraids.delete(sourceBraidId);
                newBraids.delete(targetBraidId);
                return { ...current, braids: newBraids };
            });
        }, 3000);
    }

    // ===================================================================
    // PUBLIC API METHODS
    // ===================================================================

    public updateVisualElements(): void {
        const data = get(braidMemoryData);
        if (!data) return;
        
        this.calculateLayout();
    }

    public updateTemporalVisualization(): void {
        this.calculateNodePositions(Object.values(get(braidMemoryData)?.nodes || {}));
    }

    public refreshBraidMemory(): void {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'request_braid_refresh'
            }));
        }
    }

    public exportVisualization(): string {
        return JSON.stringify({
            braidMemory: get(braidMemoryData),
            visualElements: {
                threads: get(visualThreads),
                nodes: get(visualNodes),
                braids: get(visualBraids)
            },
            config: get(braidVisualConfig),
            viewport: get(braidViewportBounds),
            timeRange: get(timeRange),
            timestamp: Date.now()
        }, null, 2);
    }

    public destroy(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.websocket) {
            this.websocket.close();
        }
        
        if (this.canvas) {
            this.canvas.remove();
        }
        
        if (this.svgContainer) {
            this.svgContainer.remove();
        }
    }

    // ===================================================================
    // UTILITY METHODS
    // ===================================================================

    private addEvent(event: BraidEvent): void {
        braidEvents.update(current => {
            const updated = [...current, event];
            return updated.slice(-100); // Keep last 100 events
        });
    }

    private emitElementEvent(eventType: string, elementData: any): void {
        const customEvent = new CustomEvent(`braid:${eventType}`, {
            detail: { elementData, timestamp: Date.now() }
        });
        window.dispatchEvent(customEvent);
    }
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

export function createBraidMemoryVisualizer(
    containerId: string,
    websocketUrl?: string
): BraidMemoryVisualizer {
    return new BraidMemoryVisualizer(containerId, websocketUrl);
}

export function updateBraidMemoryData(newData: any): void {
    braidMemoryData.set(newData);
}

export function updateBraidMemoryStats(newStats: BraidMemoryStats): void {
    braidMemoryStats.set(newStats);
}

export function highlightBraidElements(elementIds: {
    threads?: number[];
    nodes?: number[];
    braids?: number[];
}): void {
    highlightedElements.set({
        threads: new Set(elementIds.threads || []),
        nodes: new Set(elementIds.nodes || []),
        braids: new Set(elementIds.braids || [])
    });
}

export function selectBraidElements(elementIds: {
    threads?: number[];
    nodes?: number[];
    braids?: number[];
}): void {
    if (elementIds.threads) selectedThreads.set(new Set(elementIds.threads));
    if (elementIds.nodes) selectedNodes.set(new Set(elementIds.nodes));
    if (elementIds.braids) selectedBraids.set(new Set(elementIds.braids));
}

export function clearAllBraidSelections(): void {
    selectedThreads.set(new Set());
    selectedNodes.set(new Set());
    selectedBraids.set(new Set());
    highlightedElements.set({
        threads: new Set(),
        nodes: new Set(),
        braids: new Set()
    });
}

// Color schemes for braid visualization
export const BRAID_COLOR_SCHEMES = {
    temporal: 'time-based coloring',
    concept: 'concept-based coloring',
    strength: 'strength-based coloring',
    homotopy: 'homotopy class coloring'
};

// Default configuration for braid visualization
export const DEFAULT_BRAID_CONFIG: VisualizationConfig = {
    width: 1200,
    height: 800,
    threadSpacing: 120,
    nodeSize: 6,
    braidWidth: 3,
    timeScale: 1.0,
    colorScheme: 'temporal',
    showLabels: true,
    showBraids: true,
    showHomotopies: false,
    enableZoom: true,
    enablePan: true,
    animationDuration: 500,
    braidAnimations: true
};
