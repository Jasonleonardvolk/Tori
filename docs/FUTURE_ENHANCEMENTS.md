# Phased Enhancement Roadmap for Kaizen Loop & Phase Metrics

This document outlines a structured approach to implementing light-touch enhancements to the Kaizen Loop and Phase Metrics system. The enhancements are organized into four phases, prioritized by impact, urgency, and implementation effort.

## Phase 1: Operational Clarity (This Week)

Focus on immediate improvements to operational visibility and team awareness.

### 1. MTTR Dashboard (Mean Time to Resolution)

**Why it matters:** Turns Kaizen velocity into a KPI; keeps RCA culture visible

**Effort:** ½ day

**Implementation:**
- Add `kaizen_ticket_seconds` Prometheus summary metric
- Create Grafana stat panel to visualize MTTR by component
- Track trends over time to measure process improvements

```python
# Add to registry/kaizen/metrics.py
def calculate_mttr(tickets):
    """Calculate Mean Time to Resolution"""
    if not tickets:
        return None
    
    resolution_times = []
    for ticket in tickets:
        created = parse_datetime(ticket.get("createdDate"))
        resolved = parse_datetime(ticket.get("resolvedDate"))
        
        if created and resolved:
            # Calculate hours between created and resolved
            delta = resolved - created
            resolution_times.append(delta.total_seconds())  # seconds
    
    if not resolution_times:
        return None
        
    return sum(resolution_times) / len(resolution_times)

# Register Prometheus metrics
kaizen_mttr = Summary('kaizen_mttr_seconds', 'Mean time to resolution for Kaizen tickets', 
                     ['component', 'severity'])
```

### 2. Slack/RSS Digest for Tickets

**Why it matters:** Keeps engineers looped in without polling IDE

**Effort:** ½ day

**Implementation:**
- Use GitHub webhooks → Lambda → Slack Incoming Webhook
- Include SLA countdown for each ticket
- Add RSS feed for subscription options

```python
# Add to registry/kaizen/slack_digest.py
def generate_ticket_digest():
    """Generate daily digest of active Kaizen tickets"""
    tickets = get_active_tickets()
    
    # Group by component
    by_component = {}
    for ticket in tickets:
        component = ticket.get("component", "unknown")
        if component not in by_component:
            by_component[component] = []
        by_component[component].append(ticket)
    
    # Format for Slack
    blocks = [{
        "type": "header",
        "text": {"type": "plain_text", "text": "Daily Kaizen Ticket Digest"}
    }]
    
    for component, tickets in by_component.items():
        blocks.append({
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*Component: {component}*"}
        })
        
        for ticket in tickets:
            # Calculate SLA remaining
            sla_hours = calculate_sla_remaining(ticket)
            sla_status = "🟢" if sla_hours > 24 else "🟠" if sla_hours > 8 else "🔴"
            
            blocks.append({
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"{sla_status} {ticket['id']}: {ticket['title']} - SLA: {sla_hours}h remaining"}
            })
    
    return blocks
```

### 3. Canary Time-Budget Alert

**Why it matters:** Catches forgotten 1% deployments

**Effort:** < ½ day

**Implementation:**
- Track canary deployment time using a Prometheus metric
- Add alert rules for canaries that exceed their time budget (2 hours)
- Integrate with on-call paging system

```yaml
# prometheus/rules/canary.yml
groups:
  - name: canary
    rules:
      - alert: CanaryDeploymentTimeout
        expr: time() - canary_deployment_start_time{environment="production"} > 7200  # 2 hours
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Canary deployment exceeded time budget"
          description: "Canary deployment {{ $labels.deployment }} in {{ $labels.environment }} has been running for more than 2 hours"
```

## Phase 2: Metric Hygiene (Next Sprint)

Focus on improving the quality and reliability of metrics data.

### 4. Phase-Heatmap Downsampler

**Why it matters:** Prevents dashboard melt for >4k oscillators

**Effort:** 1 day

**Implementation:**
- Use reservoir-sampling for rows + WebGL heatmap fallback
- Implement adaptive downsampling based on the number of oscillators
- Store downsampled data in a separate time series with configurable resolution

```python
# Example implementation in backend/metrics.py
def downsample_phase_data(phases, target_size=1000):
    """Downsample phase data for large oscillator sets using reservoir sampling"""
    if len(phases) <= target_size:
        return phases
    
    # Use reservoir sampling for unbiased representation
    import random
    result = [0] * target_size
    
    # Fill the reservoir with the first target_size elements
    for i in range(target_size):
        result[i] = phases[i]
    
    # Replace elements with decreasing probability
    for i in range(target_size, len(phases)):
        # Random index in [0, i]
        j = random.randrange(0, i + 1)
        
        # Replace element at j with probability target_size/(i+1)
        if j < target_size:
            result[j] = phases[i]
    
    return result
```

### 5. Delta/Full Cumulative Savings Counter

**Why it matters:** Shows ROI of protocol optimizations

**Effort:** ½ day

**Implementation:**
- Add Counter metric `bytes_saved_total`
- Create Grafana cumulative line chart
- Track savings over time for optimization decisions

```typescript
// Add to DeltaProtocol.ts
export interface DeltaBandwidthStats {
  totalBytesSent: number;
  totalBytesWithoutDelta: number;  // Estimated size if always sending full state
  totalBytesSaved: number;         // Calculated savings
  startTime: number;               // When tracking started
}

// Update metrics in encode method
private updateBandwidthMetrics(fullStateSize: number, sentSize: number) {
  const bytesSaved = fullStateSize - sentSize;
  if (bytesSaved > 0) {
    // Update Prometheus counter
    deltaSavedBytes.add(bytesSaved);
  }
}
```

### 6. Prometheus Rule Linting CI

**Why it matters:** Stops bad alert syntax from blocking deploys

**Effort:** ½ day

**Implementation:**
- Run promtool check rules in CI pipeline
- Fail job on error
- Check for duplicate alerts and overlapping conditions

```yaml
# .github/workflows/prometheus-lint.yml
name: Prometheus Rules Lint

on:
  pull_request:
    paths:
      - 'prometheus/rules/*.yml'

jobs:
  prometheus-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Prometheus
        run: |
          wget https://github.com/prometheus/prometheus/releases/download/v2.35.0/prometheus-2.35.0.linux-amd64.tar.gz
          tar xvfz prometheus-2.35.0.linux-amd64.tar.gz
          cd prometheus-2.35.0.linux-amd64
          ./promtool --version
      
      - name: Lint Rules
        run: |
          cd prometheus-2.35.0.linux-amd64
          for file in ../prometheus/rules/*.yml; do
            echo "Checking $file"
            ./promtool check rules $file
            if [ $? -ne 0 ]; then
              echo "Error in $file"
              exit 1
            fi
          done
```

## Phase 3: Developer Experience & Review (Within 30 Days)

Focus on improving the development and review process.

### 7. Grafana Dashboard Diff-Viewer on PRs

**Why it matters:** Review panel changes like code

**Effort:** 1 day

**Implementation:**
- GitHub Action: jsonnetfmt + grafonnet diff → PR comment
- Render visual differences in dashboard panels
- Include metrics affected by changes

```yaml
# .github/workflows/dashboard-diff.yml
name: Dashboard Diff

on:
  pull_request:
    paths:
      - 'docs/dashboards/*.json'

jobs:
  dashboard-diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      
      - name: Generate dashboard diff
        id: dashboard-diff
        run: |
          BASE_REF=${{ github.event.pull_request.base.ref }}
          for file in $(git diff --name-only $BASE_REF...HEAD docs/dashboards/*.json); do
            echo "Generating diff for $file"
            ./tools/dashboard-diff.js $BASE_REF $file > dashboard-diff-$(basename $file .json).md
          done
      
      - name: Comment on PR
        uses: actions/github-script@v5
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const fs = require('fs');
            const diffs = fs.readdirSync('.').filter(f => f.startsWith('dashboard-diff-') && f.endsWith('.md'));
            
            let comment = "## Dashboard Changes\n\n";
            for (const diff of diffs) {
              comment += fs.readFileSync(diff, 'utf8') + "\n\n";
            }
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### 8. Bandwidth Snapshot Log

**Why it matters:** Trend view of bus egress; spots creep before pain

**Effort:** ½ day

**Implementation:**
- Store daily MB/s in Influx or Prometheus
- Create trending reports
- Alert on unexpected increases

```typescript
// Add to metrics.ts
export function logDailyBandwidthSnapshot() {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Get current bandwidth metrics
  const bytesOut = getCurrentBandwidth();
  
  // Store in log
  const logEntry = {
    date: timestamp,
    bytesPerSecond: bytesOut,
    majorVersion: CURRENT_SCHEMA_VERSION.major,
    minorVersion: CURRENT_SCHEMA_VERSION.minor,
    buildHash: CURRENT_SCHEMA_VERSION.build
  };
  
  // Save to database or file
  saveBandwidthSnapshot(logEntry);
}
```

### 9. Phase-Schema Version Handshake - UX Polish

**Why it matters:** Future protocol switch frictionless

**Effort:** Done (Already implemented)

**Implementation:**
- Add documentation for integrators
- Create error banner component for version mismatches
- Include upgrade instructions in error message

## Phase 4: Cost & Drift Guardrails

Focus on long-term maintenance and cost control.

### 10. Sandbox CPU/RAM Auto-Reaper

**Why it matters:** Keeps zombie namespaces from hogging metal

**Effort:** 1 day

**Implementation:**
- Cron checks cgroup usage
- Stops sandbox >2h idle
- Notifies owners before shutdown

```python
# Example implementation in tools/sandbox_reaper.py
def check_idle_sandboxes():
    """Check for idle sandboxes and stop them"""
    # Get list of sandboxes
    sandboxes = get_sandboxes()
    
    for sandbox in sandboxes:
        # Check last activity time
        last_activity = get_last_activity(sandbox)
        idle_time = datetime.now() - last_activity
        
        # If idle for more than 2 hours
        if idle_time > timedelta(hours=2):
            # Check if notification already sent
            if not notification_sent(sandbox):
                # Send notification
                send_notification(sandbox)
                mark_notification_sent(sandbox)
            else:
                # Check if grace period expired
                notification_time = get_notification_time(sandbox)
                if datetime.now() - notification_time > timedelta(minutes=30):
                    # Stop sandbox
                    stop_sandbox(sandbox)
                    log_sandbox_stopped(sandbox)
```

### 11. Grafana JSON Snapshot + Diff Audit

**Why it matters:** Full IaC parity for dashboards

**Effort:** Done + ½ day

**Implementation:**
- Grafana snapshot script (already implemented)
- Extend to tag git refs and track changes over time
- Add diff comparison between snapshots

```bash
# Extend grafana-snapshot.sh
# Add tagging with git references
if [ -n "$GIT_REF" ]; then
  # Create a tag file with the git reference
  echo "$GIT_REF" > "$OUTPUT_DIR/.git_ref"
  echo "Tagged dashboard snapshot with $GIT_REF"
  
  # If previous ref exists, generate diff
  if [ -f "$OUTPUT_DIR/.previous_git_ref" ]; then
    PREV_REF=$(cat "$OUTPUT_DIR/.previous_git_ref")
    echo "Generating diff between $PREV_REF and $GIT_REF"
    
    for file in "$OUTPUT_DIR"/*.json; do
      if [ -f "$OUTPUT_DIR/previous/$file" ]; then
        # Generate diff
        diff -u "$OUTPUT_DIR/previous/$file" "$file" > "$OUTPUT_DIR/diffs/$(basename $file).diff"
      fi
    done
  fi
  
  # Update previous ref
  cp "$OUTPUT_DIR/.git_ref" "$OUTPUT_DIR/.previous_git_ref"
fi
```

### 12. Phase-Heatmap Adaptive Resolution

**Why it matters:** Dynamic down-sample based on client FPS

**Effort:** 1 day

**Implementation:**
- Use requestAnimationFrame budget to choose cell size
- Adjust resolution based on rendering performance
- Maintain smooth UI experience regardless of data size

```javascript
// Example implementation in frontend component
class AdaptiveHeatmap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      resolution: 1.0, // Start with full resolution
      lastFrameTime: 0,
      frameCount: 0,
      fps: 60
    };
  }
  
  componentDidMount() {
    this.updateFPS();
  }
  
  updateFPS() {
    // Calculate FPS
    const now = performance.now();
    const elapsed = now - this.state.lastFrameTime;
    
    if (elapsed > 1000) { // Update every second
      const fps = this.state.frameCount / (elapsed / 1000);
      
      // Adjust resolution based on FPS
      let newResolution = this.state.resolution;
      if (fps < 30 && newResolution > 0.2) {
        // Lower resolution if FPS drops
        newResolution -= 0.1;
      } else if (fps > 55 && newResolution < 1.0) {
        // Increase resolution if FPS is good
        newResolution += 0.1;
      }
      
      this.setState({
        fps,
        resolution: newResolution,
        frameCount: 0,
        lastFrameTime: now
      });
    }
    
    this.setState(prevState => ({
      frameCount: prevState.frameCount + 1
    }));
    
    requestAnimationFrame(() => this.updateFPS());
  }
  
  render() {
    // Use this.state.resolution to adjust rendering
    const { data, width, height } = this.props;
    const { resolution } = this.state;
    
    // Calculate cell size based on resolution
    const cellSize = Math.max(1, Math.floor(1 / resolution));
    
    // Downsample data based on cellSize
    const downsampledData = downsampleData(data, cellSize);
    
    return (
      <HeatmapRenderer
        data={downsampledData}
        width={width}
        height={height}
        cellSize={cellSize}
      />
    );
  }
}
```

## Quick Wins to Tackle First

The following enhancements offer immediate value with minimal effort:

1. **Slack Digest** - Visibility boost, no infrastructure changes
2. **Canary Time-Budget Alert** - Safety net, minimal PromQL implementation
3. **MTTR Stat Panel** - Culture signal, showcases Kaizen success

After these are implemented, proceed to Phase 2 metric hygiene for long-term signal quality.

## Conclusion

This phased approach allows for incremental improvements without requiring schema or architecture rewrites. These light-touch enhancements offer compounding benefits, improving observability, system stability, and development processes.

Each enhancement has been prioritized based on impact and effort, allowing the team to make steady progress while delivering value at each step.
