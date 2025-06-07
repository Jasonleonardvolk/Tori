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

// ====== Missing Type Definitions ======

export interface InputSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}

export interface OutputSchema {
  type: string;
  properties: Record<string, any>;
}

export interface SideEffect {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface NetworkPolicy {
  allowed: boolean;
  endpoints?: string[];
  protocols?: string[];
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential';
  baseDelay: number;
}

export interface Dependency {
  name: string;
  version: string;
  type: 'npm' | 'system' | 'internal';
}

export interface RuntimeEnvironment {
  type: 'node' | 'python' | 'docker';
  version: string;
  config: Record<string, any>;
}

export interface RateLimit {
  requests: number;
  window: number; // seconds
  burst?: number;
}

export interface AccessPolicy {
  type: 'allow' | 'deny';
  rules: string[];
}

export interface CachePolicy {
  enabled: boolean;
  ttl: number;
  maxSize?: number;
}

export interface Variable {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface ValidationRule {
  field: string;
  rule: string;
  message: string;
}

export interface VerificationKey {
  id: string;
  algorithm: string;
  publicKey: string;
}

export interface KernelMetrics {
  uptime: number;
  requestCount: number;
  errorRate: number;
  averageResponseTime: number;
}

export interface ExecutionState {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
}

export interface ResourceAllocation {
  memory: number;
  cpu: number;
  storage: number;
}

export interface SandboxContext {
  id: string;
  type: string;
  restrictions: string[];
}

export interface Condition {
  field: string;
  operator: string;
  value: any;
}

export interface SecurityRule {
  id: string;
  pattern: string;
  action: 'allow' | 'deny' | 'audit';
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  event: string;
  user?: string;
  details: Record<string, any>;
}

export interface EncryptionConfig {
  algorithm: string;
  keyId: string;
  enabled: boolean;
}

export interface MetricsCollector {
  collect: (metric: Metric) => void;
  getMetrics: () => Metric[];
}

export interface Tracer {
  trace: (operation: string) => void;
  getTraces: () => any[];
}

export interface Profiler {
  start: () => void;
  stop: () => any;
}

export interface AnomalyDetector {
  detect: (data: any) => boolean;
  threshold: number;
}

export interface TransportConfig {
  protocol: 'http' | 'websocket' | 'grpc';
  host: string;
  port: number;
  secure: boolean;
}

export interface AuthConfig {
  type: 'none' | 'bearer' | 'oauth';
  credentials?: Record<string, any>;
}

export interface ServerCapabilities {
  tools: string[];
  resources: string[];
  prompts: string[];
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, any>;
  lastCheck: Date;
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  duration?: number;
}

export interface PhaseTransition {
  from: string;
  to: string;
  condition: string;
}

export interface Checkpoint {
  id: string;
  phase: string;
  timestamp: Date;
  state: any;
}

export interface RollbackStrategy {
  enabled: boolean;
  checkpoints: number;
  strategy: 'immediate' | 'graceful';
}

export interface ConceptNode {
  id: string;
  label: string;
  properties: Record<string, any>;
  vector?: number[];
}

export interface ConceptEdge {
  from: string;
  to: string;
  relationship: string;
  weight: number;
}

export interface VectorIndex {
  dimensions: number;
  algorithm: string;
  config: Record<string, any>;
}

export interface QueryEngine {
  query: (input: ConceptQuery) => any[];
  index: (nodes: ConceptNode[]) => void;
}

export interface UpdatePolicy {
  strategy: 'replace' | 'merge' | 'append';
  validation: boolean;
}

export interface ConceptFilter {
  type: string;
  pattern: string;
  action: 'allow' | 'block' | 'transform';
}

export interface ContentPolicy {
  id: string;
  name: string;
  rules: string[];
  enforcement: 'strict' | 'lenient';
}

export interface FilterPipeline {
  filters: ConceptFilter[];
  policies: ContentPolicy[];
  order: string[];
}

export interface LogEvent {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
}

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface MCPRequest {
  id: string;
  method: string;
  params: any;
  timestamp: Date;
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: any;
  timestamp: Date;
}

export interface ConceptQuery {
  type: 'semantic' | 'exact' | 'fuzzy';
  query: string;
  limit?: number;
  filters?: Record<string, any>;
}

export interface FilterResult {
  allowed: boolean;
  concepts: ConceptNode[];
  blocked: ConceptNode[];
  modified: ConceptNode[];
}

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
