# Kaizen Loop & Phase Metrics: Launch Plan and Roadmap

This document outlines the deployment strategy and evolutionary roadmap for TORI's Kaizen Loop and Phase Metrics system, which has now been fully implemented with production-grade components and enhancements.

## Production Go-Live Verification Checklist

Prior to official launch, verify all critical components with this checklist:

| Check | Command/URL | Expected Result | Status |
|-------|-------------|-----------------|--------|
| MTTR Panel | Grafana → Kaizen/Overview | MTTR stat cards populated with drill-down links | ✅ |
| Digest Run | `python registry/kaizen/slack_digest.py --dry-run` | Shows "0 tickets – digest suppressed" when empty | ✅ |
| Canary Alert | `kaizen simulate-canary --duration 3h` | PagerDuty fires at 2h mark; ticket auto-opened | ✅ |
| Phase Heatmap | Replay `12k_spin_trace.bin` | Browser FPS ≥ 55; GPU mode active flag true | ✅ |
| Prom Rule Lint | PR with bad `for:` syntax | Workflow fails with error message | ✅ |
| Dashboard Diff | PR edits Grafana JSON | Bot comments with side-by-side panel diff | ✅ |
| Bandwidth Metric | Grafana → MCP/Network | Cumulative "bytes_saved_total" > 0 and monotonic | ✅ |

Once all checks pass, proceed to flip production traffic to the Kaizen-enabled stack.

## Phased Deployment Plan

### Phase 0: Initial Burn-In (Days 0-7)

Critical first steps following production activation:

| Task | Owner | Purpose | Timeline |
|------|-------|---------|----------|
| Activate "observer" mode | SRE | Establish baselines for MTTR, bytes-saved, and alarm frequency | Day 0 |
| Collect Grafana snapshots | Ops | Create immutable "v1.1 baseline" artifact of all Kaizen boards | T+24h |
| Open feedback channel | Eng+Product | Establish #kaizen-launch channel to catch UX issues and false-positive alerts early | Day 0 |

**Decision Gate**: If p95 MCP latency < 7ms and alarm volume is within expected range, proceed to Phase 1.

### Phase 1: Resilience & Cost Validation (Week 2)

Focus on validating the system's resilience and quantifying efficiency gains:

| Exercise | Details | Expected Outcome |
|----------|---------|------------------|
| **Chaos Weekend Drill** | • Inject 5% packet loss & 200ms jitter overnight<br>• Monitor system response | • Verify Delta Protocol back-off<br>• Confirm ticket auto-creation and auto-resolve<br>• Quantify bytes saved under chaos conditions |
| **Disaster Recovery Simulation** | • Kill MCP process<br>• Monitor systemd auto-restart | • Measure total outage time<br>• Update SLA documentation<br>• Verify ticket lifecycle |
| **Cost Dashboard Implementation** | • Create "Δ-bandwidth $ saved/day" Grafana panel | • Quantify cost savings using current cloud egress pricing<br>• Establish ROI metrics for future optimizations |

### Phase 2: Multi-Tenant Pilot (Weeks 3-4)

Extend the system to support multiple isolated tenants:

| Deliverable | Implementation | Benefit |
|-------------|----------------|---------|
| **Schema Namespace Fields** | • Add `tenant_id` and `visibility` to registry schema<br>• Implement database partitioning | Enables tenant isolation for security and scaling |
| **Shadow Bus for Partner Plugin** | • Set up isolated event bus for first external partner<br>• Start with read-only monitoring | Validates multi-tenant architecture with real workloads |
| **Per-tenant SLO Buckets** | • Tag MTTR & p95 latency metrics with `tenant_id`<br>• Create tenant-specific dashboards | Enables differentiated SLAs and targeted optimizations |
| **Tenant Context Switcher** | • Add dropdown filter to all dashboards<br>• Implement tenant context in Chat & IDE panels | Provides seamless operator experience across tenant boundaries |

**Note**: The current JSON wire format is sufficient to service multiple tenants at current rates. No protocol change needed yet.

### Phase 3: ALAN-Assisted RCA MVP (Week 5)

Implement intelligent Root Cause Analysis assistance:

| Component | Details | Metrics |
|-----------|---------|---------|
| **Data Pipeline** | • Feed alerts + last 60s logs to ALAN inference endpoint<br>• Create structured RCA templates | • Processing latency<br>• Log capture success rate |
| **Human Review Flow** | • Draft RCA attached to ticket as Markdown<br>• Implement approval workflow for human editors | • Editor time spent<br>• Acceptance rate |
| **Feedback Loop** | • Track changes made during review<br>• Use feedback to improve suggestion quality | • Edit distance metrics<br>• Satisfaction scores |
| **Effectiveness Measurement** | • Compare pre-ALAN vs post-ALAN RCA process | • Average RCA authoring time reduction<br>• Consistency improvement |

## Future Enhancements (Q3-Q4 2025)

### Protocol Buffers Wire Format Decision Gate (End of Q3)

Rather than implementing Protocol Buffers immediately, we'll trigger this enhancement only when specific thresholds are met.

**Proceed with Protocol Buffers implementation if any TWO of these conditions are met:**

1. ≥ 500 simultaneous WebSocket clients or 10 MB/s egress per MCP bus
2. p95 JSON encode/decode CPU utilization > 50% of a single core
3. External SDK demand (Rust/Go) requiring tighter schema enforcement

If triggered, implementation will follow the approach documented in `FUTURE_ROADMAP.md` with:
- Protocol Buffer schema definitions
- Format negotiation
- Monitoring instrumentation
- Controlled rollout

The two-phase approach (JSON now, Protocol Buffers later if needed) saves engineering effort while maintaining a clear upgrade path if system demands increase.

### Policy-as-Code Gatekeeper (Q4)

Implementation of flexible, programmable policy enforcement:

| Component | Details | Timeline |
|-----------|---------|----------|
| **Policy Engine Selection** | • Evaluate Open Policy Agent (OPA) vs. custom DSL<br>• Create initial policies for latency, cost, and carbon budgets | Early Q4 |
| **Orchestrator Integration** | • Ω-Orchestrator evaluates policy bundle on each promotion<br>• Implement human override workflow with audit logging | Mid Q4 |
| **Policy Visualization** | • Create policy visualization and testing UI<br>• Implement impact analysis for policy changes | Late Q4 |

## Monitoring Guidance 

### First-Week Watch Items

During the initial burn-in period, closely monitor:

1. **Digest Noise Filter**: 
   - Ensure critical information isn't suppressed
   - Consider using `--force` flag during initial deployment to validate filter logic
   - Adjust threshold parameters if necessary

2. **Alert Overlap Report**: 
   - Run `python prometheus/alert_overlap_checker.py` daily
   - Review the Markdown diff for unexpected 90%+ similarity hits
   - Prune ambiguous alerts early to prevent alert fatigue

3. **WebGL Fallback Threshold**: 
   - Monitor GPU memory on lower-end client laptops
   - Adjust threshold from 5k → 3k spins if performance issues are reported
   - Collect browser console logs for exceptions and rendering warnings

### Long-term Metrics

Establish baseline measurements and track these key metrics:

| Category | Metric | Target | Source |
|----------|--------|--------|--------|
| **Efficiency** | MTTR (Mean Time to Resolution) | Continuous improvement | `kaizen_mttr_seconds` |
| **Performance** | p95 MCP message latency | <10ms | `mcp_message_latency_seconds` |
| **Resource Usage** | Bandwidth savings | >40% | `delta_bytes_saved_total` |
| **Quality** | False positive alert rate | <1% | `alert_count{outcome="false_positive"}` |

## Conclusion

By following this phased approach with clear decision gates, TORI will maximize the value of the Kaizen Loop system while minimizing unnecessary engineering effort. 

The roadmap prioritizes:
1. System stability and validation during burn-in
2. Multi-tenant support for ecosystem expansion
3. Intelligent RCA to reduce operator cognitive load
4. Data-driven decisions on protocol optimization

With these foundational elements in place, TORI's operational stack is positioned to deliver compounding returns through improved observability, self-healing capabilities, and operational excellence.
