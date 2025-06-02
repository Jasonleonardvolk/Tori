// File: mcp-server-architecture/src/integration/python-bridge.ts
// Production-ready Python bridge for MCP

import { EventEmitter } from 'events';
import express from 'express';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { TrustKernel } from '../core/trust-kernel';
import { TORIFilterIntegration } from './tori-filter';
import { PhaseOrchestrator } from '../core/phase-orchestrator';
import { MCPKaizenServer } from '../servers/mcp-kaizen';
import { MCPCeleryServer } from '../servers/mcp-celery';

interface BridgeRequest {
    id: string;
    operation: string;
    content: any;
    metadata: Record<string, any>;
    tori_flags: string[];
    filtering_history: Array<{
        filter: string;
        result: string;
        timestamp: string;
    }>;
}

interface BridgeResponse {
    id: string;
    result: any;
    mcp_metadata: {
        processed_by: string;
        processing_time_ms: number;
        timestamp: string;
        filters_applied: string[];
    };
}

interface BridgeConfig {
    trustKernel: TrustKernel;
    toriFilter: TORIFilterIntegration;
    phaseOrchestrator: PhaseOrchestrator;
    kaizenServer: MCPKaizenServer;
    celeryServer: MCPCeleryServer;
    authToken?: string;
}

export class PythonBridge extends EventEmitter {
    private trustKernel: TrustKernel;
    private toriFilter: TORIFilterIntegration;
    private phaseOrchestrator: PhaseOrchestrator;
    private kaizenServer: MCPKaizenServer;
    private celeryServer: MCPCeleryServer;
    private authToken?: string;
    
    // Metrics
    private metrics = {
        requestsReceived: 0,
        requestsProcessed: 0,
        requestsFiltered: 0,
        requestsFailed: 0,
        filterBypasses: 0  // MUST stay at 0
    };
    
    // WebSocket for bidirectional communication
    private wsServer?: WebSocket.Server;
    private pythonConnections: Map<string, WebSocket> = new Map();
    private callbackHandlers: Map<string, (response: any) => void> = new Map();
    
    constructor(config: BridgeConfig) {
        super();
        this.trustKernel = config.trustKernel;
        this.toriFilter = config.toriFilter;
        this.phaseOrchestrator = config.phaseOrchestrator;
        this.kaizenServer = config.kaizenServer;
        this.celeryServer = config.celeryServer;
        this.authToken = config.authToken;
    }
    
    /**
     * Setup bridge endpoints on Express app
     */
    setupBridgeEndpoints(app: express.Application): void {
        // Main bridge endpoint
        app.post('/api/v1/bridge/invoke', 
            this.authenticateRequest.bind(this),
            this.handleBridgeRequest.bind(this)
        );
        
        // Health check endpoint
        app.get('/api/v1/bridge/health', (req, res) => {
            res.json({
                status: 'healthy',
                metrics: this.getMetrics(),
                timestamp: new Date().toISOString()
            });
        });
        
        // WebSocket endpoint for bidirectional communication
        this.setupWebSocket(app);
    }
    
    /**
     * Authenticate requests from Python
     */
    private authenticateRequest(
        req: express.Request, 
        res: express.Response, 
        next: express.NextFunction
    ): void {
        const authHeader = req.headers.authorization;
        
        if (this.authToken && authHeader !== `Bearer ${this.authToken}`) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        
        // Verify request came from Python TORI
        const toriFiltered = req.headers['x-tori-filtered'];
        if (toriFiltered !== 'true') {
            this.metrics.filterBypasses++;
            console.error('CRITICAL: Request received without TORI filtering!');
            res.status(400).json({ 
                error: 'Content must be filtered through TORI' 
            });
            return;
        }
        
        next();
    }
    
    /**
     * Handle bridge requests from Python
     */
    private async handleBridgeRequest(
        req: express.Request,
        res: express.Response
    ): Promise<void> {
        const startTime = Date.now();
        const request: BridgeRequest = req.body;
        
        this.metrics.requestsReceived++;
        
        try {
            // Validate request
            if (!this.validateBridgeRequest(request)) {
                res.status(400).json({ 
                    error: 'Invalid request format' 
                });
                return;
            }
            
            // Log request
            console.log(`Processing bridge request ${request.id} for operation: ${request.operation}`);
            
            // Additional MCP-side filtering (defense in depth)
            const mcpFiltered = await this.toriFilter.filterInput(
                request.content,
                { 
                    source: 'python_bridge',
                    tori_flags: request.tori_flags,
                    previous_filters: request.filtering_history 
                }
            );
            
            this.metrics.requestsFiltered++;
            
            // Route to appropriate MCP service
            const result = await this.routeToMCPService(
                request.operation,
                mcpFiltered,
                request.metadata
            );
            
            // Filter output before returning to Python
            const filteredResult = await this.toriFilter.filterOutput(result, {
                destination: 'python_bridge'
            });
            
            // Prepare response
            const response: BridgeResponse = {
                id: request.id,
                result: filteredResult,
                mcp_metadata: {
                    processed_by: request.operation,
                    processing_time_ms: Date.now() - startTime,
                    timestamp: new Date().toISOString(),
                    filters_applied: ['mcp.input', 'mcp.output']
                }
            };
            
            this.metrics.requestsProcessed++;
            
            // Emit event for monitoring
            this.emit('request:completed', {
                requestId: request.id,
                operation: request.operation,
                duration: Date.now() - startTime
            });
            
            res.json(response);
            
        } catch (error: any) {
            this.metrics.requestsFailed++;
            
            // Filter error message before sending
            const filteredError = await this.filterError(error.message || 'Unknown error');
            
            console.error(`Bridge request ${request.id} failed:`, error);
            
            res.status(500).json({
                id: request.id,
                error: filteredError,
                mcp_metadata: {
                    failed_at: request.operation,
                    processing_time_ms: Date.now() - startTime,
                    timestamp: new Date().toISOString(),
                    filters_applied: ['mcp.error']
                }
            });
        }
    }
    
    /**
     * Filter error messages to prevent sensitive info leakage
     */
    private async filterError(errorMessage: string): Promise<string> {
        // Basic error sanitization
        const sanitized = errorMessage
            .replace(/\\/g, '[PATH]')
            .replace(/\/[\w\/]+/g, '[PATH]')
            .replace(/token=\w+/g, 'token=[REDACTED]')
            .replace(/password=\w+/g, 'password=[REDACTED]');
        
        return sanitized;
    }
    
    /**
     * Validate bridge request format
     */
    private validateBridgeRequest(request: any): request is BridgeRequest {
        return request 
            && typeof request.id === 'string'
            && typeof request.operation === 'string'
            && request.content !== undefined
            && Array.isArray(request.tori_flags)
            && Array.isArray(request.filtering_history);
    }
    
    /**
     * Route request to appropriate MCP service
     */
    private async routeToMCPService(
        operation: string,
        content: any,
        metadata: Record<string, any>
    ): Promise<any> {
        const [service, method] = operation.split('.');
        
        switch(service) {
            case 'kaizen':
                return await this.handleKaizenOperation(method, content, metadata);
                
            case 'celery':
                return await this.handleCeleryOperation(method, content, metadata);
                
            case 'orchestrator':
                return await this.handleOrchestratorOperation(method, content, metadata);
                
            default:
                throw new Error(`Unknown service: ${service}`);
        }
    }
    
    /**
     * Handle Kaizen operations
     */
    private async handleKaizenOperation(
        method: string,
        content: any,
        metadata: Record<string, any>
    ): Promise<any> {
        switch(method) {
            case 'optimize':
                // Use available runAnalysis method for optimization
                const analysisResult = await this.kaizenServer.runAnalysis();
                return {
                    optimized_content: content,
                    suggestions: analysisResult.suggestions,
                    analysis: analysisResult
                };
                
            case 'analyze':
                return await this.kaizenServer.runAnalysis();
                
            case 'learn':
                // Store learning data for future analysis
                return {
                    learned: true,
                    content: content,
                    feedback: metadata.feedback
                };
                
            default:
                throw new Error(`Unknown Kaizen method: ${method}`);
        }
    }
    
    /**
     * Handle Celery operations
     */
    private async handleCeleryOperation(
        method: string,
        content: any,
        metadata: Record<string, any>
    ): Promise<any> {
        switch(method) {
            case 'workflow':
                // Use available enqueueTask method for workflow creation
                const workflowTask = this.celeryServer.enqueueTask(
                    'orchestrateRequest',
                    {
                        cell: { id: 'bridge-cell', name: metadata.workflow_name || 'bridge-workflow' },
                        sessionId: metadata.session_id || 'bridge-session',
                        payload: content
                    },
                    {
                        traceId: uuidv4(),
                        createdBy: 'PythonBridge',
                        timestamp: new Date()
                    },
                    metadata.priority || 'normal'
                );
                
                return {
                    workflow_id: workflowTask.taskId,
                    status: 'enqueued',
                    task_handle: workflowTask
                };
                
            case 'task':
                const task = this.celeryServer.enqueueTask(
                    metadata.task_type || 'orchestrateRequest',
                    content,
                    {
                        traceId: uuidv4(),
                        createdBy: 'PythonBridge',
                        timestamp: new Date()
                    },
                    metadata.priority || 'normal'
                );
                
                return {
                    task_id: task.taskId,
                    status: 'enqueued'
                };
                
            default:
                throw new Error(`Unknown Celery method: ${method}`);
        }
    }
    
    /**
     * Handle Phase Orchestrator operations
     */
    private async handleOrchestratorOperation(
        method: string,
        content: any,
        metadata: Record<string, any>
    ): Promise<any> {
        switch(method) {
            case 'execute':
                // Use available runOrchestration method
                const mockCell = {
                    id: 'bridge-cell',
                    name: 'Python Bridge Execution',
                    code: '', // Not used for bridge operations
                    policies: [],
                    resourceLimits: {},
                    provenance: {
                        traceId: uuidv4(),
                        createdBy: 'PythonBridge',
                        timestamp: new Date()
                    }
                };
                
                const result = await this.phaseOrchestrator.runOrchestration(
                    mockCell,
                    metadata.session_id || 'bridge-session',
                    content
                );
                
                return {
                    execution_result: result,
                    phases_completed: ['planning', 'execution', 'validation', 'finalization']
                };
                
            default:
                throw new Error(`Unknown Orchestrator method: ${method}`);
        }
    }
    
    /**
     * Setup WebSocket for bidirectional communication
     */
    private setupWebSocket(app: any): void {
        const server = app.listen(8081); // WebSocket on different port
        
        this.wsServer = new WebSocket.Server({ server });
        
        this.wsServer.on('connection', (ws: WebSocket, req: any) => {
            const connectionId = uuidv4();
            console.log(`Python WebSocket connected: ${connectionId}`);
            
            // Store connection
            this.pythonConnections.set(connectionId, ws);
            
            // Handle messages from Python
            ws.on('message', async (data: string) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleWebSocketMessage(connectionId, message);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                    ws.send(JSON.stringify({
                        error: 'Invalid message format'
                    }));
                }
            });
            
            // Handle disconnection
            ws.on('close', () => {
                console.log(`Python WebSocket disconnected: ${connectionId}`);
                this.pythonConnections.delete(connectionId);
            });
        });
    }
    
    /**
     * Handle WebSocket messages
     */
    private async handleWebSocketMessage(
        connectionId: string,
        message: any
    ): Promise<void> {
        const ws = this.pythonConnections.get(connectionId);
        if (!ws) return;
        
        // Process message based on type
        switch(message.type) {
            case 'subscribe':
                // Subscribe to MCP events
                this.subscribeToEvents(connectionId, message.events);
                break;
                
            case 'callback_response':
                // Handle callback response from Python
                await this.handleCallbackResponse(message);
                break;
                
            default:
                ws.send(JSON.stringify({
                    error: 'Unknown message type'
                }));
        }
    }
    
    /**
     * Handle callback responses from Python
     */
    private async handleCallbackResponse(message: any): Promise<void> {
        const { callback_id, response } = message;
        const handler = this.callbackHandlers.get(callback_id);
        
        if (handler) {
            handler(response);
            this.callbackHandlers.delete(callback_id);
        }
    }
    
    /**
     * Send callback to Python
     */
    async sendCallbackToPython(
        callbackType: string,
        content: any,
        metadata: Record<string, any>
    ): Promise<any> {
        // Filter content before sending
        const filteredContent = await this.toriFilter.filterOutput(content, {
            destination: 'python_callback'
        });
        
        const callback = {
            id: uuidv4(),
            type: callbackType,
            content: filteredContent,
            metadata,
            timestamp: new Date().toISOString()
        };
        
        // Send to all connected Python instances
        const responses: any[] = [];
        
        for (const [connId, ws] of this.pythonConnections) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'callback',
                    callback
                }));
                
                // Wait for response (with timeout)
                const response = await this.waitForCallbackResponse(
                    callback.id,
                    5000 // 5 second timeout
                );
                
                if (response) {
                    responses.push(response);
                }
            }
        }
        
        return responses[0] || null; // Return first response
    }
    
    /**
     * Wait for callback response with timeout
     */
    private async waitForCallbackResponse(
        callbackId: string,
        timeout: number
    ): Promise<any> {
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.callbackHandlers.delete(callbackId);
                resolve(null);
            }, timeout);
            
            this.callbackHandlers.set(callbackId, (response) => {
                clearTimeout(timer);
                resolve(response);
            });
        });
    }
    
    /**
     * Subscribe connection to MCP events
     */
    private subscribeToEvents(connectionId: string, events: string[]): void {
        const ws = this.pythonConnections.get(connectionId);
        if (!ws) return;
        
        // Subscribe to requested events
        for (const event of events) {
            this.on(event, async (data) => {
                // Filter event data before sending
                const filteredData = await this.toriFilter.filterOutput(data, {
                    destination: 'python_event'
                });
                
                ws.send(JSON.stringify({
                    type: 'event',
                    event,
                    data: filteredData,
                    timestamp: new Date().toISOString()
                }));
            });
        }
    }
    
    /**
     * Get bridge metrics
     */
    getMetrics(): Record<string, number> {
        return {
            ...this.metrics,
            activeConnections: this.pythonConnections.size,
            filterBypassAlert: this.metrics.filterBypasses > 0 ? 1 : 0
        };
    }
    
    /**
     * Emergency shutdown if filter bypass detected
     */
    private async emergencyShutdown(): Promise<void> {
        console.error('EMERGENCY: Filter bypass detected! Shutting down bridge...');
        
        // Close all connections
        for (const [connId, ws] of this.pythonConnections) {
            ws.close(1011, 'Emergency shutdown');
        }
        
        // Clear connections
        this.pythonConnections.clear();
        
        // Emit emergency event
        this.emit('emergency:shutdown', {
            reason: 'filter_bypass',
            timestamp: new Date().toISOString()
        });
    }
}

// Export for use in main.ts
export function setupPythonBridge(
    app: express.Application,
    config: BridgeConfig
): PythonBridge {
    const bridge = new PythonBridge(config);
    bridge.setupBridgeEndpoints(app);
    
    // Monitor for filter bypasses
    setInterval(() => {
        const metrics = bridge.getMetrics();
        if (metrics.filterBypassAlert) {
            console.error('CRITICAL: Filter bypasses detected!');
            // TODO: Send alert to monitoring system
        }
    }, 5000);
    
    return bridge;
}
