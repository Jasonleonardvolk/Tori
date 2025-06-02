// mcp-server-architecture/src/core/mcp-gateway.ts

/**
 * MCPGateway — Main API entrypoint for all requests into the MCP system.
 * Exposes HTTP(S) endpoints for orchestrating SCC workflows, compliance checks, etc.
 * Handles request validation, provenance setup, routing to orchestrator, and response emission.
 * Pathways for authentication, rate limiting, audit, and full TORI policy integration.
 */

import express, { Request, Response } from 'express';
import { SecureComputeCell, MCPServer, Provenance, MCPRequest, MCPResponse, AuditLog, TORIIntegration, ComplianceFlag } from './types';
import { PhaseOrchestrator } from './phase-orchestrator';
import { TrustKernel } from './trust-kernel';
import { Monitoring } from './monitoring';
import { ConceptMemoryGraph } from './concept-memory-graph';

// --- Gateway Class ---

export class MCPGateway {
  private app = express();
  private auditLog: AuditLog;
  private orchestrator: PhaseOrchestrator;
  private trustKernel: TrustKernel;
  private tori: TORIIntegration;
  private monitoring: Monitoring;
  private memoryGraph: ConceptMemoryGraph;

  constructor(
    auditLog: AuditLog,
    orchestrator: PhaseOrchestrator,
    trustKernel: TrustKernel,
    tori: TORIIntegration,
    monitoring: Monitoring,
    memoryGraph: ConceptMemoryGraph
  ) {
    this.auditLog = auditLog;
    this.orchestrator = orchestrator;
    this.trustKernel = trustKernel;
    this.tori = tori;
    this.monitoring = monitoring;
    this.memoryGraph = memoryGraph;

    this.app.use(express.json());

    // --- Main request endpoint ---
    this.app.post('/mcp/execute', async (req: Request, res: Response) => {
      const provenance = this.createProvenance(req);
      try {
        // === Step 1: Validate and construct MCPRequest ===
        const mcpRequest: MCPRequest = this.buildRequest(req.body, provenance);

        // === Step 2: Compliance/Policy (Ingress filter) ===
        const ingressDecision = await this.checkIngressPolicy(mcpRequest);
        if (!ingressDecision.allowed) {
          this.audit('REQUEST_BLOCKED', null, ingressDecision.reason, { provenance });
          return res.status(403).json({
            requestId: mcpRequest.requestId,
            status: 'error',
            error: `Request blocked by policy: ${ingressDecision.reason}`,
            provenance,
            complianceFlags: [this.policyToComplianceFlag(ingressDecision)]
          });
        }

        // === Step 3: Route to Orchestrator ===
        const cell = await this.findCellForRequest(mcpRequest);
        const result = await this.orchestrator.runOrchestration(cell, mcpRequest.userId, mcpRequest.payload);

        // === Step 4: Emit Response ===
        const response: MCPResponse = {
          requestId: mcpRequest.requestId,
          status: 'success',
          result,
          provenance
        };
        this.audit('REQUEST_SUCCESS', cell, null, { mcpRequest, result, provenance });
        res.status(200).json(response);

      } catch (err) {
        this.audit('REQUEST_ERROR', null, String(err), { provenance });
        res.status(500).json({
          status: 'error',
          error: String(err),
          provenance
        });
      }
    });

    // (Optional) Health check
    this.app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
  }

  /** Start the MCP Gateway HTTP server. */
  public start(port: number) {
    this.app.listen(port, () => {
      console.log(`[MCPGateway] Listening on port ${port}`);
    });
  }

  /** Create provenance for this request. */
  private createProvenance(req: Request): Provenance {
    return {
      traceId: this.generateUUID(),
      createdBy: 'MCPGateway',
      timestamp: new Date(),
      parentId: req.headers['x-session-id'] as string || undefined,
      annotations: { ip: req.ip }
    };
  }

  /** Build MCPRequest object from client data and provenance. */
  private buildRequest(raw: any, provenance: Provenance): MCPRequest {
    return {
      requestId: this.generateUUID(),
      userId: raw.userId || 'anonymous',
      payload: raw.payload,
      provenance
    };
  }

  /** Check ingress policy via TORI or custom policy engine. */
  private async checkIngressPolicy(request: MCPRequest) {
    // Integrate with all TORI filters for request payload.
    for (const filter of this.tori.filters) {
      if (typeof filter.check === 'function') {
        const result = await filter.check(request.payload, 'ingress');
        if (!result.allowed) return result;
      }
    }
    // Default: allow
    return {
      allowed: true,
      reason: 'none',
      severity: 'low',
      provenance: { traceId: this.generateUUID(), createdBy: 'MCPGateway.checkIngressPolicy', timestamp: new Date() }
    };
  }

  /** (Stub) Find SCC for request. In real system, this maps payload/type to cell. */
  private async findCellForRequest(request: MCPRequest): Promise<SecureComputeCell> {
    // In production: implement logic to select the correct SCC/cell for request
    // Here, just return a demo cell (replace as needed)
    return {
      id: 'cell-001',
      name: 'default',
      version: '1.0.0',
      manifest: {} as any,
      code: {} as any,
      signature: '',
      created: new Date(),
      lastVerified: new Date(),
      status: 'ACTIVE'
    };
  }

  /** Write an entry to the audit log. */
  private audit(eventType: string, cell: SecureComputeCell | null, error?: string | null, context?: any) {
    if (!this.auditLog.entries) this.auditLog.entries = [];
    this.auditLog.entries.push({
      eventType,
      cellId: cell?.id || '',
      cellName: cell?.name || '',
      timestamp: new Date(),
      error,
      context,
      provenance: context?.provenance
    });
  }

  private policyToComplianceFlag(decision: any): ComplianceFlag {
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
 * - Ingress requests pass through full TORI/policy filter before reaching orchestrator.
 * - Provenance, audit, and compliance flags travel from entry to exit for every request.
 * - Authentication, rate limiting, and security can be plugged in at the top (middleware).
 * - findCellForRequest is where you route to the right SCC/cell; replace with real business logic.
 * - Health checks, metrics, and custom endpoints are trivial to add.
 * - Drop this file in, wire up your dependencies in main.ts, and you're enterprise-ready!
 */
