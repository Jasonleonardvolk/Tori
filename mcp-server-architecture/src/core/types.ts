// mcp-server-architecture/src/core/types.ts

/**
 * Core type definitions for the MCP Server Architecture
 * Implements Secure Compute Cell (SCC) paradigm with Trust Kernel,
 * concept memory graph, observability, and deep TORI integration.
 *
 * THIS FILE IS THE CANONICAL CONTRACT FOR ALL MODULES.
 * Every field is chosen for explicit pathway support, audit, compliance,
 * and extensibility.
 */

// ====== Secure Compute Cell & Manifest ======

export interface SecureComputeCell {
  id: string;
  name: string;
  version: string;
  manifest: SCCManifest;
  code: SCCCode;
  signature: string;
  created: Date;
  lastVerified: Date;
  status: SCCStatus;
  // Integration: Pathway to audit & compliance trail for cell lifecycle
  provenance?: Provenance; // <--- Pathway: trace SCC registration/events
  complianceFlags?: ComplianceFlag[]; // <--- Pathway: for policy hooks
}

export interface SCCManifest {
  identity: {
    name: string;
    hash: string;
    version: string;
    author: string;
  };
  description: string;
  capabilities: {
    tools: ToolDefinition[];
    resources: ResourceDefinition[];
    prompts: PromptTemplate[];
  };
  contracts: {
    inputs: InputSchema[];
    outputs: OutputSchema[];
    sideEffects: SideEffect[];
  };
  security: {
    permissions: Permission[];
    resourceLimits: ResourceLimits;
    networkAccess: NetworkPolicy;
    sandboxLevel: SandboxLevel;
  };
  behavior: {
    deterministic: boolean;
    idempotent: boolean;
    timeout: number;
    retryPolicy: RetryPolicy;
  };
  // Integration: Pathway for embedding static policy/traceability
  provenance?: Provenance;
  complianceFlags?: ComplianceFlag[];
}

export interface SCCCode {
  entryPoint: string;
  dependencies: Dependency[];
  checksum: string;
  runtime: RuntimeEnvironment;
  compiledBinary?: Buffer;
  // Integration: Pathway for code origin, reproducibility, supply chain attestation
  provenance?: Provenance;
}

// ====== Capabilities, Tools, Resources ======

export interface ToolDefinition {
  name: string;
  description: string;
  schema: {
    input: object;
    output: object;
  };
  permissions: string[];
  rateLimit?: RateLimit;
  // Pathway: which policy or filter applies for tool usage
  complianceFlags?: ComplianceFlag[];
}

export interface ResourceDefinition {
  type: 'database' | 'file' | 'api' | 'memory';
  name: string;
  endpoint: string;
  accessPolicy: AccessPolicy;
  caching?: CachePolicy;
  provenance?: Provenance;
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: Variable[];
  context: string[];
  validation: ValidationRule[];
}

// ====== Trust Kernel and Security ======

export interface TrustKernel {
  id: string;
  version: string;
  securityPolicies: SecurityPolicy[];
  verificationKeys: VerificationKey[];
  auditLog: AuditLog;
  metrics: KernelMetrics;
  // Integration: hooks for TORI compliance, provenance, and audit
  provenance?: Provenance;
}

export interface ExecutionContext {
  id: string;
  sessionId: string;
  sccId: string;
  input: any;
  state: ExecutionState;
  resources: ResourceAllocation;
  monitoring: MonitoringContext;
  sandbox: SandboxContext;
  provenance?: Provenance; // Trace phase, user, etc.
  complianceFlags?: ComplianceFlag[];
}

export enum SCCStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED'
}

export enum SandboxLevel {
  NONE = 0,
  BASIC = 1,
  STANDARD = 2,
  STRICT = 3,
  PARANOID = 4
}

// ====== Security, Permissions, Resource Policy ======

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: Condition[];
}

export interface ResourceLimits {
  memory: number;
  cpu: number;
  storage: number;
  networkBandwidth: number;
  executionTime: number;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  rules: SecurityRule[];
  enforcement: 'STRICT' | 'PERMISSIVE';
  provenance?: Provenance;
}

export interface AuditLog {
  entries: AuditEntry[];
  retentionDays: number;
  encryption: EncryptionConfig;
}

export interface MonitoringContext {
  metricsCollector: MetricsCollector;
  tracer: Tracer;
  profiler: Profiler;
  anomalyDetector: AnomalyDetector;
}

// ====== MCP Server / Orchestration Types ======

export interface MCPServer {
  id: string;
  name: string;
  type: 'kaizen' | 'celery' | 'custom';
  endpoint: string;
  transport: TransportConfig;
  authentication: AuthConfig;
  capabilities: ServerCapabilities;
  health: HealthStatus;
  provenance?: Provenance;
  complianceFlags?: ComplianceFlag[];
}

// Phase orchestration: advanced workflows, multi-agent support
export interface PhaseOrchestration {
  phases: Phase[];
  currentPhase: string;
  transitions: PhaseTransition[];
  checkpoints: Checkpoint[];
  rollbackStrategy: RollbackStrategy;
}

// ====== Concept Memory Graph ======

export interface ConceptMemoryGraph {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  index: VectorIndex;
  queryEngine: QueryEngine;
  updatePolicy: UpdatePolicy;
  provenance?: Provenance;
  complianceFlags?: ComplianceFlag[];
}

// ====== TORI Policy Engine / Integration ======

/**
 * Integration point for deep TORI content filtering, concept tagging, and compliance.
 * This structure makes all TORI policy/filter operations pluggable as first-class modules.
 */
export interface TORIIntegration {
  endpoint: string;
  filters: ConceptFilter[];
  policies: ContentPolicy[];
  pipeline: FilterPipeline;
  // Integration: track provenance of policy/filter config, versioning, etc.
  provenance?: Provenance;
}

/**
 * Result of a policy check or filter operation (e.g. from TORI).
 * Use this everywhere compliance is needed.
 */
export interface PolicyDecision {
  allowed: boolean;        // True if content/action is permitted
  reason: string;          // Policy name or rule ID
  severity?: 'low' | 'medium' | 'high';
  matchedPatterns?: string[]; // Which rules were hit
  complianceFlags?: ComplianceFlag[];
  provenance?: Provenance; // Who/what generated this decision
}

// ====== Provenance, Compliance, Observability ======

/**
 * Provenance: Trace all data as it flows through the system.
 * Used for audit, compliance, and debugging.
 */
export interface Provenance {
  traceId: string;
  createdBy?: string;
  timestamp: Date;
  parentId?: string;
  annotations?: Record<string, any>;
}

/**
 * A compliance flag annotates a structure with policy context.
 * Used throughout SCCs, execution, memory, and logs.
 */
export interface ComplianceFlag {
  policyId: string;
  rule: string;
  status: 'compliant' | 'violation' | 'pending';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  details?: string;
}

// ====== (Everything else you already defined: fill in from original as needed) ======

// ... Dependency, InputSchema, OutputSchema, SideEffect, NetworkPolicy, RetryPolicy, etc.
// ... Variable, ValidationRule, AuditEntry, EncryptionConfig, MetricsCollector, Tracer, Profiler, AnomalyDetector
// ... Phase, PhaseTransition, Checkpoint, RollbackStrategy, ConceptNode, ConceptEdge, VectorIndex, QueryEngine, UpdatePolicy
// ... ConceptFilter, ContentPolicy, FilterPipeline

/**
 * [INTEGRATION COMMENT]
 * - This file is fully patched for:
 *   - End-to-end provenance and compliance tracing
 *   - Pathways for every policy and audit field
 *   - TORI concept/policy engine compatibility
 *   - Future extensions for observability and pluggable filtering
 * - Pass this file through every module, and use the optional fields (`provenance`, `complianceFlags`) everywhere you persist, log, or transmit core data.
 * - The MCP + TORI integration is as future-proof and auditable as possible from the type layer!
 */

