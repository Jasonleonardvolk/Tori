// mcp-server-architecture/src/main.ts

/**
 * Main entry point for MCP + TORI architecture.
 * Initializes all modules, wires dependencies, and starts the API server and background services.
 * All instances are passed as singletons to ensure consistency and shared state.
 */

import { Monitoring } from './observability/monitoring';
import { TrustKernel } from './core/trust-kernel';
import { PhaseOrchestrator } from './core/phase-orchestrator';
import { ConceptMemoryGraphService } from './memory/concept-memory-graph';
import { MCPGateway } from './integration/mcp-gateway';
import { TORIFilterIntegration } from './integration/tori-filter';
import { MCPKaizenServer } from './servers/mcp-kaizen';
import { MCPCeleryServer } from './servers/mcp-celery';
import { AutoRepairSystem } from './resilience/auto-repair';
import { setupPythonBridge, PythonBridge } from './integration/python-bridge';
import express from 'express';

// --- Policy/config structure for TORIFilterIntegration (stub) ---
const toriConfig = {
  endpoint: 'http://localhost:8080', // Replace with your TORI policy engine endpoint
  filters: ['default'],
  policies: ['default-policy'],
};

async function main() {
  console.log('[MCP Main] Bootstrapping MCP + TORI system...');

  // --- 1. Initialize core shared services ---
  const monitoring = new Monitoring();
  const auditLog = { entries: [] }; // Simple in-memory audit log
  const memoryGraph = new ConceptMemoryGraphService();
  const toriFilter = new TORIFilterIntegration(toriConfig);

  // --- 2. Initialize TrustKernel and orchestrator ---
  const trustKernel = new TrustKernel(auditLog as any, monitoring as any);
  const orchestrator = new PhaseOrchestrator(
    trustKernel,
    auditLog as any,
    memoryGraph as any,
    toriFilter as any,
    monitoring as any
  );

  // --- 3. Initialize background/worker servers ---
  const kaizen = new MCPKaizenServer(trustKernel as any, memoryGraph as any, monitoring as any);
  const celery = new MCPCeleryServer(orchestrator, auditLog as any, monitoring as any);
  const autoRepair = new AutoRepairSystem(monitoring);

  // --- 4. Start the main HTTP Gateway ---
  const gateway = new MCPGateway(
    auditLog as any,
    orchestrator,
    trustKernel,
    toriFilter as any,
    monitoring,
    memoryGraph as any
  );
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  gateway.start(PORT);

  // --- 5. Setup Python bridge ---
  // Create a separate Express app for the bridge endpoints
  const bridgeApp = express();
  const pythonBridge = setupPythonBridge(bridgeApp, {
    trustKernel: trustKernel,
    toriFilter: toriFilter,
    phaseOrchestrator: orchestrator,
    kaizenServer: kaizen,
    celeryServer: celery,
    authToken: process.env.PYTHON_BRIDGE_TOKEN
  });

  // Start the bridge server on a separate port
  const BRIDGE_PORT = process.env.BRIDGE_PORT ? parseInt(process.env.BRIDGE_PORT) : 3001;
  bridgeApp.listen(BRIDGE_PORT, () => {
    console.log(`[Python Bridge] Listening on port ${BRIDGE_PORT}`);
  });

  // Add bridge events to event handlers
  pythonBridge.on('request:completed', (data) => {
    monitoring.emitMetric({
      name: 'bridge_requests_total',
      value: 1,
      timestamp: new Date(),
      tags: {
      operation: data.operation
      }
    });
  });

  pythonBridge.on('emergency:shutdown', async (data) => {
    console.error('Python bridge emergency shutdown:', data);
    process.exit(1);
  });

  // --- 6. Schedule Kaizen (continuous improvement) to run every hour ---
  setInterval(() => {
    kaizen.runAnalysis().then(result => {
      monitoring.logEvent({
        eventId: 'kaizen-' + Date.now(),
        timestamp: new Date(),
        level: 'INFO',
        message: '[Kaizen] Analysis result',
        context: result
      });
    });
  }, 60 * 60 * 1000);

  // --- 6. Hook auto-repair to orchestrator/gateway/kaizen for incident handling ---
  // Example usage:
  // autoRepair.handleError('orchestrator', new Error('Simulated orchestrator failure'));

  // --- 7. Optionally, handle graceful shutdowns, signals, or health checks ---
  process.on('SIGINT', () => {
    console.log('\n[MCP Main] Shutting down gracefully...');
    process.exit(0);
  });
}

main().catch(err => {
  console.error('[MCP Main] Fatal error:', err);
  process.exit(1);
});

/**
 * Integration Pathways / Comments:
 * - All modules instantiated as singletons for full dependency injection.
 * - Gateway, orchestrator, and background servers share monitoring/audit/memory/trustkernel instances.
 * - Easy to expand for multi-process, multi-instance, or distributed deployments.
 * - Ready for dev, prod, and test use with minimal config tweaks.
 */
