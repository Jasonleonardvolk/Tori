/**
 * TORI WormholeEngine - TypeScript Visualization Component (Continued)
 * 
 * This completes the WormholeNetworkVisualizer implementation with all
 * remaining utility methods, public API, and helper functions.
 */

    private updateNodeSelection(selectedIds: Set<number>): void {
        this.nodeElements
            .style('stroke', d => selectedIds.has(d.id) ? '#ff4444' : '#ffffff')
            .style('stroke-width', d => selectedIds.has(d.id) ? 3 : 2);
    }

    private updateWormholeSelection(selectedIds: Set<string>): void {
        this.linkElements
            .style('stroke', d => selectedIds.has(d.id) ? '#ff4444' : d.color)
            .style('stroke-width', d => selectedIds.has(d.id) ? d.width * 1.5 : d.width);
    }

    private updateNodeHover(nodeId: number | null): void {
        if (nodeId === null) {
            this.clearHighlights();
        }
    }

    private updateVisualization(config: VisualizationConfig): void {
        // Update SVG size
        this.svg
            .attr('width', config.width)
            .attr('height', config.height);
        
        // Update forces
        this.simulation
            .force('charge', d3.forceManyBody().strength(config.force_strength))
            .force('center', d3.forceCenter(config.width / 2, config.height / 2))
            .force('collision', d3.forceCollide().radius(d => d.radius + config.collision_radius))
            .alphaDecay(config.alpha_decay);
        
        // Update visual elements
        this.updateNodes();
        this.updateLinks();
        this.updateLabels();
        this.updateClusters();
        
        // Enable/disable physics
        if (!config.enable_physics) {
            this.simulation.stop();
        } else {
            this.simulation.restart();
        }
        
        // Enable/disable zoom
        if (config.enable_zoom) {
            this.svg.call(this.zoom);
        } else {
            this.svg.on('.zoom', null);
        }
    }

    private updateSimilarityVisualization(data: any): void {
        // Update link colors based on similarity computation
        if (data.concept_a && data.concept_b && data.similarity) {
            this.linkElements
                .filter(d => {
                    const sourceId = typeof d.source === 'number' ? d.source : d.source.id;
                    const targetId = typeof d.target === 'number' ? d.target : d.target.id;
                    return (sourceId === data.concept_a && targetId === data.concept_b) ||
                           (sourceId === data.concept_b && targetId === data.concept_a);
                })
                .style('stroke', getSimilarityColor(data.similarity))
                .style('stroke-width', d => d.width * (1 + data.similarity));
        }
    }

    // ===================================================================
    // TOOLTIP AND CONTEXT MENU
    // ===================================================================

    private showTooltip(event: MouseEvent, content: string): void {
        // Remove existing tooltip
        d3.select('body').select('.wormhole-tooltip').remove();
        
        // Create new tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'wormhole-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .html(content);
        
        // Position tooltip
        tooltip
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .transition()
            .duration(200)
            .style('opacity', 1);
    }

    private hideTooltip(): void {
        d3.select('body')
            .select('.wormhole-tooltip')
            .transition()
            .duration(200)
            .style('opacity', 0)
            .remove();
    }

    private createNodeTooltip(node: ConceptNode): string {
        return `
            <strong>${node.label}</strong><br/>
            Concept ID: ${node.id}<br/>
            Wormholes: ${node.wormhole_count}<br/>
            Connectivity: ${node.connectivity.toFixed(3)}<br/>
            ${Object.entries(node.centrality_scores).map(([key, value]) => 
                `${key}: ${(value as number).toFixed(3)}`
            ).join('<br/>')}
        `;
    }

    private createWormholeTooltip(link: WormholeLink): string {
        const wormhole = link.wormhole;
        return `
            <strong>Wormhole</strong><br/>
            Type: ${wormhole.wormhole_type}<br/>
            Strength: ${wormhole.strength.toFixed(3)}<br/>
            Confidence: ${wormhole.confidence.toFixed(3)}<br/>
            Bidirectional: ${wormhole.bidirectional ? 'Yes' : 'No'}<br/>
            Traversals: ${wormhole.access_count}<br/>
            Created: ${new Date(wormhole.created_at * 1000).toLocaleDateString()}
        `;
    }

    private showContextMenu(event: MouseEvent, node: ConceptNode): void {
        // Implement context menu for nodes
        console.log('Node context menu for:', node.label);
    }

    private showWormholeContextMenu(event: MouseEvent, link: WormholeLink): void {
        // Implement context menu for wormholes
        console.log('Wormhole context menu for:', link.wormhole.id);
    }

    // ===================================================================
    // PUBLIC API METHODS
    // ===================================================================

    public clearSelections(): void {
        selectedNodes.set(new Set());
        selectedWormholes.set(new Set());
    }

    public selectAll(): void {
        const allNodeIds = new Set(this.nodes.map(n => n.id));
        const allWormholeIds = new Set(this.links.map(l => l.id));
        selectedNodes.set(allNodeIds);
        selectedWormholes.set(allWormholeIds);
    }

    public deleteSelectedWormholes(): void {
        const selected = get(selectedWormholes);
        if (selected.size > 0 && this.websocket) {
            this.websocket.send(JSON.stringify({
                type: 'delete_wormholes',
                wormhole_ids: Array.from(selected)
            }));
        }
    }

    public resetLayout(): void {
        this.simulation.alpha(1).restart();
    }

    public focusSearch(): void {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
            searchInput.focus();
        }
    }

    public centerOnNode(nodeId: number): void {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node && node.x !== undefined && node.y !== undefined) {
            const config = get(visualConfig);
            const transform = d3.zoomIdentity
                .translate(config.width / 2 - node.x, config.height / 2 - node.y)
                .scale(1.5);
            
            this.svg.transition()
                .duration(750)
                .call(this.zoom.transform, transform);
        }
    }

    public createWormhole(conceptA: number, conceptB: number, strength: number): void {
        if (this.websocket) {
            this.websocket.send(JSON.stringify({
                type: 'create_wormhole',
                concept_a: conceptA,
                concept_b: conceptB,
                strength: strength
            }));
        }
    }

    public exportVisualization(): string {
        return JSON.stringify({
            wormholeData: get(wormholeData),
            visualConfig: get(visualConfig),
            selectedNodes: Array.from(get(selectedNodes)),
            selectedWormholes: Array.from(get(selectedWormholes)),
            viewportTransform: get(viewportTransform),
            timestamp: Date.now()
        }, null, 2);
    }

    public destroy(): void {
        if (this.websocket) {
            this.websocket.close();
        }
        
        if (this.simulation) {
            this.simulation.stop();
        }
        
        if (this.svg) {
            this.svg.remove();
        }
    }

    // ===================================================================
    // PRIVATE UTILITY METHODS
    // ===================================================================

    private addEvent(event: WormholeEvent): void {
        wormholeEvents.update(current => {
            const updated = [...current, event];
            return updated.slice(-100); // Keep last 100 events
        });
    }

    private emitCustomEvent(eventType: string, detail: any): void {
        const customEvent = new CustomEvent(`wormhole:${eventType}`, {
            detail: { ...detail, timestamp: Date.now() }
        });
        window.dispatchEvent(customEvent);
    }
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

export function getWormholeColor(wormhole: Wormhole): string {
    const typeColors = {
        'semantic': '#9B59B6',
        'temporal': '#3498DB', 
        'causal': '#E74C3C',
        'analogical': '#2ECC71',
        'user_defined': '#F39C12',
        'system_detected': '#95A5A6',
        'experimental': '#E67E22'
    };
    return typeColors[wormhole.wormhole_type] || '#95A5A6';
}

export function getSimilarityColor(similarity: number): string {
    // Color scale from red (low) to green (high)
    const red = Math.floor(255 * (1 - similarity));
    const green = Math.floor(255 * similarity);
    return `rgb(${red}, ${green}, 0)`;
}

export function createWormholeVisualizer(
    containerId: string,
    websocketUrl?: string
): WormholeNetworkVisualizer {
    return new WormholeNetworkVisualizer(containerId, websocketUrl);
}

export function updateWormholeData(newData: any): void {
    wormholeData.set(newData);
}

export function updateNetworkStats(newStats: WormholeNetworkStats): void {
    networkStats.set(newStats);
}

export function highlightWormholeElements(elementIds: {
    nodes?: number[];
    wormholes?: string[];
}): void {
    if (elementIds.nodes) {
        selectedNodes.set(new Set(elementIds.nodes));
    }
    if (elementIds.wormholes) {
        selectedWormholes.set(new Set(elementIds.wormholes));
    }
}

export function clearAllWormholeSelections(): void {
    selectedNodes.set(new Set());
    selectedWormholes.set(new Set());
    hoveredNode.set(null);
    hoveredWormhole.set(null);
}

export function applyWormholeFilter(filters: Partial<typeof activeFilters>): void {
    activeFilters.update(current => ({ ...current, ...filters }));
}

export function searchWormholes(query: string): void {
    searchQuery.set(query);
}

// Default visualization configuration
export const DEFAULT_WORMHOLE_CONFIG: VisualizationConfig = {
    width: 1200,
    height: 800,
    node_min_radius: 8,
    node_max_radius: 25,
    link_min_width: 1,
    link_max_width: 8,
    force_strength: -300,
    link_distance: 100,
    collision_radius: 30,
    alpha_decay: 0.02,
    show_labels: true,
    show_clusters: true,
    show_stats: true,
    enable_physics: true,
    enable_zoom: true,
    enable_pan: true,
    color_scheme: 'type',
    animation_duration: 500,
    highlight_neighbors: true,
    filter_threshold: 0.5,
    max_nodes: 500,
    max_links: 1000
};

// Wormhole type labels for UI
export const WORMHOLE_TYPE_LABELS = {
    semantic: 'Semantic Similarity',
    temporal: 'Temporal Co-occurrence',
    causal: 'Causal Relationship',
    analogical: 'Analogical Structure',
    user_defined: 'User Defined',
    system_detected: 'System Detected',
    experimental: 'Experimental'
};

// Color schemes for different visualization modes
export const WORMHOLE_COLOR_SCHEMES = {
    type: 'Color by wormhole type',
    strength: 'Color by connection strength',
    centrality: 'Color by node centrality',
    cluster: 'Color by detected clusters'
};
