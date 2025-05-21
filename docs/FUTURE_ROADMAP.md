# Future Roadmap for TORI's Kaizen Loop & Phase Metrics

This document outlines the next-generation enhancements for TORI's operational infrastructure, building on the now-complete Kaizen Loop and Phase Metrics foundation. These enhancements represent strategic investments that will further elevate the system from "elite" to "industry-leading."

## Protocol Buffers Wire Format

### Overview
Replacing the current JSON wire format with Protocol Buffers to enable 50Hz dashboard refresh rates and reduce bandwidth by 60-80%.

### Implementation Path

#### Phase 1: Preparation (1-2 weeks)
- Create Protocol Buffer schema definitions in `packages/protocol/src/proto/*.proto`
- Implement encoding/decoding in `packages/runtime-bridge/src/ProtoEncoder.ts`
- Add versioning and backward compatibility
  
```protobuf
// packages/protocol/src/proto/phase_event.proto
syntax = "proto3";

message PhaseEvent {
  // Schema version for backward compatibility
  uint32 version = 1;
  
  // Event data
  string agent_id = 2;
  double timestamp = 3;
  double phase_value = 4;
  double velocity = 5;
  double drift = 6;
  
  // Optional fields for specific use cases
  oneof event_details {
    SyncEvent sync_event = 7;
    DriftEvent drift_event = 8;
  }
}

message SyncEvent {
  repeated string target_agents = 1;
  double sync_strength = 2;
}

message DriftEvent {
  double threshold_exceeded = 1;
  string reference_point = 2;
}
```

#### Phase 2: Implementation (2-3 weeks)
- Add feature flag `PCC_WIRE_FORMAT` in `.env`:
  ```
  PCC_WIRE_FORMAT=json  # Options: json, proto, auto
  ```
- Modify `PhaseEventBus.ts` to support format negotiation:
  ```typescript
  // Format negotiation during connection handshake
  negotiateFormat(clientCapabilities: string[]): string {
    // Check if client supports protobuf
    if (clientCapabilities.includes('proto') && process.env.PCC_WIRE_FORMAT !== 'json') {
      return 'proto';
    }
    return 'json';
  }
  
  // Dynamic serialization based on negotiated format
  serializeEvent(event: PhaseEvent, format: string): Uint8Array | string {
    if (format === 'proto') {
      return this.protoEncoder.encode(event);
    }
    return JSON.stringify(event);
  }
  ```

#### Phase 3: Testing & Rollout (1-2 weeks)
- Add monitoring for serialization metrics:
  ```typescript
  // Track size metrics for both formats
  trackSizeMetrics(event: PhaseEvent): void {
    const jsonSize = JSON.stringify(event).length;
    const protoSize = this.protoEncoder.encode(event).byteLength;
    
    // Update Prometheus metrics
    phaseEventSize.labels('json').observe(jsonSize);
    phaseEventSize.labels('proto').observe(protoSize);
    compressionRatio.set(protoSize / jsonSize);
  }
  ```
- Monitor `bytes_saved_total` during canary deployment
- Roll out to production with progressive percentage adjustment

### Expected Benefits
- **Latency**: 30-40% reduction in transport time
- **Bandwidth**: 70-80% reduction in bytes transferred  
- **CPU**: 15-20% reduction in serialization/deserialization cost
- **Dashboard refresh**: Support for 50Hz update rate (up from 10Hz)

### Compatibility Plan
- Clients will automatically detect and use the best available format
- Older clients continue working with JSON format
- Error UI shown only when protocol version mismatches, not format

## Multi-tenant Kaizen Registry

### Overview
Extending the Kaizen system to support multiple isolated tenants, enabling external plugin vendors and team isolation.

### Implementation Path

#### Phase 1: Schema & Identity (2 weeks)
- Modify Kaizen schema to support tenant isolation in `registry/kaizen/schema.py`:
  ```python
  class TenantConfig:
      id: str  # Unique tenant identifier
      name: str  # Display name
      api_key: str  # Authentication key (hashed)
      quota: Dict[str, int]  # Resource quotas (tickets, instances, etc.)
      access_control: List[str]  # List of allowed components
      created_at: datetime
      status: str  # active, inactive, suspended
  
  class TicketSchema:
      # Add tenant ID to existing schema
      tenant_id: str = "default"
      # Other existing fields...
  ```

- Create tenant management CLI commands:
  ```bash
  kaizen tenant create --name "External Plugin Alpha" --quota tickets=100,instances=5
  kaizen tenant list
  kaizen tenant update alpha --status inactive
  ```

#### Phase 2: Access Control (2 weeks)
- Implement API key verification in backend routes
- Create namespaced ticket IDs (e.g., `TENANT-KAIZ-001`) 
- Build tenant dashboard in `ide_frontend/src/components/TenantAdmin`
- Implement tenant-specific SLAs and metrics

```python
# registry/kaizen/tenant_manager.py
def get_tenant_sla(tenant_id: str, severity: str) -> int:
    """Get SLA hours for a tenant's severity level"""
    tenant = get_tenant(tenant_id)
    if not tenant:
        return DEFAULT_SLA[severity]
    
    # Tenant-specific SLA override or default
    return tenant.sla.get(severity, DEFAULT_SLA[severity])
```

#### Phase 3: Rollout & Partner Onboarding (3-4 weeks)
- Create onboarding documentation
- Build API for external integration
- Set up rate limiting and quota enforcement
- Develop billing/usage tracking for premium tenants

### Expected Benefits
- **Plugin Ecosystem**: Support for 3rd party extensions
- **Isolation**: Team separation for large organizations
- **Security**: Better access control and audit trails
- **Revenue**: Potential monetization path for enterprise features

### First External Tenant
- Select pilot partner with existing integration
- Start with read-only access to monitor stability
- Progressively enable write capabilities
- Maintain separate metrics for internal vs. external usage

## ALAN-Assisted RCA

### Overview
Leveraging ALAN (Advanced Language Analysis Network) to automatically generate draft Root Cause Analysis documents from alert data, system logs, and context.

### Implementation Path

#### Phase 1: Data Collection & Training (3-4 weeks)
- Create historical dataset of alerts and associated RCAs 
- Build prompt engineering framework in `alan_backend/rca_templates.py`:
  ```python
  RCA_SYSTEM_PROMPT = """
  You are an expert systems analyst. Your task is to analyze the alert data,
  logs, and metrics to propose a root cause analysis. Focus on:
  1. What triggered the alert
  2. Why it happened (underlying conditions)
  3. How it could be prevented
  Use technical details from logs but express conclusions clearly.
  """
  
  def generate_rca_prompt(alert_data, logs, metrics):
      return f"""
      {RCA_SYSTEM_PROMPT}
      
      ## Alert Information
      {format_alert_data(alert_data)}
      
      ## System Logs
      {format_logs(logs)}
      
      ## Relevant Metrics
      {format_metrics(metrics)}
      
      Generate a professional Root Cause Analysis document with these sections:
      1. Executive Summary
      2. Timeline of Events
      3. Technical Root Cause
      4. Mitigation Steps
      5. Prevention Measures
      """
  ```

#### Phase 2: Integration (2-3 weeks)
- Connect ALAN to Kaizen ticket system
- Implement RCA draft generation on ticket resolution
- Create human review workflow before finalization
- Add feedback loop to improve future suggestions

```python
# registry/kaizen/alan_rca.py
async def generate_rca_draft(ticket_id: str) -> str:
    """Generate RCA draft for a ticket using ALAN"""
    # Get ticket data
    ticket = get_ticket(ticket_id)
    if not ticket:
        return "Ticket not found"
    
    # Collect context: alert data, logs, and metrics
    alert_data = get_alert_data(ticket)
    logs = collect_relevant_logs(ticket, time_window_minutes=30)
    metrics = collect_relevant_metrics(ticket)
    
    # Generate prompt
    prompt = generate_rca_prompt(alert_data, logs, metrics)
    
    # Call ALAN service
    response = await alan_client.generate(prompt, max_tokens=2000)
    
    # Store draft RCA
    store_draft_rca(ticket_id, response)
    
    # Notify assignee for review
    notify_assignee_for_review(ticket_id)
    
    return response
```

#### Phase 3: Refinement & Expansion (Ongoing)
- Fine-tune RCA quality based on user feedback
- Expand to proactive recommendations
- Implement comparative analysis across similar incidents
- Add ML-based anomaly correlation

### Expected Benefits
- **Time Savings**: 60-70% reduction in RCA drafting time
- **Consistency**: Standardized RCA format and quality
- **Knowledge Base**: Accumulation of structured incident data
- **Training**: Educational tool for junior team members

### Integration Points
- Automated trigger when alert resolves
- Manual trigger from Kaizen ticket UI
- Scheduled batch processing for pending RCAs
- Feedback collection for continuous improvement

## Policy-as-Code Gatekeeper

### Overview
Implementing a flexible policy engine for enforcing complex rules around promotions, permissions, and system constraints.

### Implementation Path

#### Phase 1: Policy Engine Selection (1-2 weeks)
- Evaluate Open Policy Agent (OPA) vs. custom engine
- Create initial policy schema in `registry/kaizen/policies/`:
  ```yaml
  # registry/kaizen/policies/promotion.rego
  package kaizen.promotion
  
  default allow = false
  
  allow {
      # Basic requirements
      has_required_approvals
      passed_required_tests
      meets_performance_criteria
      meets_security_criteria
  }
  
  has_required_approvals {
      count(input.approvals) >= data.requirements.min_approvals
  }
  
  # Performance policy
  meets_performance_criteria {
      input.metrics.latency_p95_ms <= data.thresholds.max_latency_ms
      input.metrics.memory_mb <= data.thresholds.max_memory_mb
      input.metrics.cpu_percent <= data.thresholds.max_cpu_percent
  }
  
  # Carbon footprint policy
  meets_carbon_criteria {
      input.metrics.estimated_carbon_g_per_request <= data.thresholds.carbon_budget
  }
  ```

#### Phase 2: Integration Points (3-4 weeks)
- Implement policy evaluation in promotion workflows
- Create policy visualization and testing UI
- Add policy versioning and audit trails
- Build automatic remediation suggestions

```typescript
// packages/runtime-bridge/src/PolicyGatekeeper.ts
export class PolicyGatekeeper {
  private policyEngine: OPAClient;
  
  constructor() {
    this.policyEngine = new OPAClient();
    this.loadPolicies();
  }
  
  async evaluatePromotion(promotionRequest: PromotionRequest): Promise<PolicyResult> {
    // Gather inputs for policy evaluation
    const input = {
      requestor: promotionRequest.requestor,
      component: promotionRequest.component,
      approvals: await this.getApprovals(promotionRequest.id),
      tests: await this.getTestResults(promotionRequest.buildId),
      metrics: await this.getPerformanceMetrics(promotionRequest.buildId),
      security: await this.getSecurityScanResults(promotionRequest.buildId)
    };
    
    // Evaluate against policies
    const result = await this.policyEngine.evaluate('kaizen.promotion', input);
    
    // Generate explanation
    const explanation = this.explainResult(result);
    
    return {
      allowed: result.allow === true,
      explanation,
      requiredActions: this.generateRequiredActions(result)
    };
  }
  
  private generateRequiredActions(result: any): string[] {
    // Convert policy violations into actionable steps
    const actions = [];
    
    if (!result.has_required_approvals) {
      actions.push(`Obtain ${result.data.requirements.min_approvals - result.input.approvals.length} more approvals`);
    }
    
    if (!result.meets_performance_criteria) {
      if (result.input.metrics.latency_p95_ms > result.data.thresholds.max_latency_ms) {
        actions.push(`Reduce P95 latency from ${result.input.metrics.latency_p95_ms}ms to below ${result.data.thresholds.max_latency_ms}ms`);
      }
      // Add other performance checks...
    }
    
    return actions;
  }
}
```

#### Phase 3: Complex Rules (Ongoing)
- Add carbon footprint tracking and budgeting
- Implement cost controls and resource limits
- Create team-specific policy variants
- Build ML-based prediction for policy violations

### Expected Benefits
- **Consistency**: Uniform application of promotion standards
- **Transparency**: Clear documentation of requirements
- **Automation**: Reduced manual approval overhead
- **Safety**: Prevent non-compliant changes from reaching production

### Initial Policy Domains
- Code review requirements
- Performance thresholds
- Security scan results
- Compliance documentation
- Resource utilization limits
- Carbon footprint budgets

---

## Implementation Timeline

| Enhancement | Q3 2025 | Q4 2025 | Q1 2026 | Q2 2026 |
|-------------|---------|---------|---------|---------|
| Protocol Buffers | Preparation, Implementation | Testing, Rollout | Optimization | |
| Multi-tenant Registry | Schema, Identity | Access Control | Rollout, Partner Onboarding | |
| ALAN-Assisted RCA | Data Collection, Training | Integration | Refinement | Expansion |
| Policy-as-Code | Engine Selection | Integration Points | Complex Rules | Advanced Policies |

## Success Metrics

| Enhancement | Key Metrics | Target |
|-------------|-------------|--------|
| Protocol Buffers | Bandwidth reduction | 70% |
| | Dashboard refresh rate | 50Hz |
| | Wire format adoption | 95% of clients |
| Multi-tenant Registry | External tenants | 5+ |
| | Tenant satisfaction | >4.5/5 |
| | Cross-tenant issues | 0 |
| ALAN-Assisted RCA | Time to RCA | -60% |
| | RCA quality score | >4/5 |
| | RCA automation rate | 80% of alerts |
| Policy-as-Code | Policy compliance | 100% |
| | Manual approvals | -70% |
| | Failed promotions | -50% |

## Conclusion

These strategic enhancements build upon the solid foundation of the Kaizen Loop and Phase Metrics system, providing a clear path toward industry-leading operational excellence. By implementing these features in a phased approach, TORI can maintain stability while continuously improving capabilities.

Each enhancement addresses a specific dimension of operational maturity:
- **Protocol Buffers**: Performance and scalability
- **Multi-tenant Registry**: Ecosystem and collaboration
- **ALAN-Assisted RCA**: Knowledge and efficiency
- **Policy-as-Code**: Governance and safety

Together, they form a comprehensive roadmap that will keep TORI at the forefront of operational excellence.
