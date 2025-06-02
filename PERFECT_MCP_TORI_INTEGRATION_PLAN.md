# 🎯 PERFECT MCP-TORI INTEGRATION PLAN
## The Golden Opportunity - Nail It Right The First Time!

### 🔍 CURRENT ARCHITECTURE DISCOVERY

```
┌─────────────────┬────────────┬──────────────┬─────────────────┐
│ Component       │ Port       │ Status       │ TORI Required   │
├─────────────────┼────────────┼──────────────┼─────────────────┤
│ Svelte Frontend │ N/A        │ ✅ EXISTS    │ Input Filtering │
│ FastAPI/TORI    │ 8002       │ ✅ EXISTS    │ Core System     │
│ Ingest Services │ 8080       │ ✅ EXISTS    │ Content Filter  │
│ MCP 2.0 Server  │ 8787       │ ✅ EXISTS    │ Broadcast Only  │
│ MCP AI Gateway  │ 3000       │ 🆕 BUILT     │ All Boundaries  │
│ MCP AI Bridge   │ 3001       │ 🆕 BUILT     │ All Boundaries  │
└─────────────────┴────────────┴──────────────┴─────────────────┘
```

### 🎯 **CRITICAL ARCHITECTURAL DECISION**

**KEEP TORI IN PYTHON** ✅
- Don't port TORI to TypeScript 
- Make TypeScript MCP call Python TORI services
- Single source of truth for filtering rules
- No synchronization issues

### 🔄 **PERFECT BIDIRECTIONAL FLOW**

```
┌─────────────┐    TORI    ┌─────────────┐    Trust   ┌─────────────┐
│   Svelte    │ ---------> │   Python    │ --------> │   MCP AI    │
│  Frontend   │            │   (8002)    │           │ (3000/3001) │
└─────────────┘ <--------- └─────────────┘ <-------- └─────────────┘
      ^                           ^                           ^
      │                           │                           │
   UI Safe                   TORI Filter              Trust Kernel
   Content                  All Boundaries            Internal Security
```

## 🏗️ **IMPLEMENTATION PHASES**

### **PHASE 1: Foundation (Week 1)**
#### 1.1 Enhanced Bridge Implementation

```python
# Enhanced mcp_bridge.py
class PerfectMCPBridge:
    """The perfect bridge with TORI as universal gatekeeper"""
    
    def __init__(self):
        # Multiple MCP connections
        self.ai_gateway = MCPConnection('http://localhost:3000')      # AI Services
        self.broadcast_server = MCPConnection('http://localhost:8787') # PCC Broadcast
        self.tori = TORIUniversalFilter()  # Single TORI instance
        self.event_bus = TORIEventBus()
        self.audit_trail = ImmutableAuditTrail()
        
    async def process_with_perfect_filtering(self, content, operation, source, destination):
        """Every piece of content goes through this - NO EXCEPTIONS"""
        
        # 1. Create universal content wrapper
        wrapped = UniversalContent(
            id=self.generate_secure_id(),
            raw_content=content,
            source=source,
            destination=destination,
            operation=operation
        )
        
        # 2. MANDATORY pre-filtering
        wrapped = await self.tori.filter_input(wrapped)
        if not wrapped.is_safe_for(destination):
            raise FilterBypassError("Content not safe for destination")
            
        # 3. Route to correct MCP service
        if operation.startswith('ai.'):
            result = await self.ai_gateway.process(wrapped)
        elif operation.startswith('broadcast.'):
            result = await self.broadcast_server.process(wrapped)
        else:
            raise ValueError(f"Unknown operation: {operation}")
            
        # 4. MANDATORY post-filtering
        result = await self.tori.filter_output(result)
        
        # 5. Immutable audit trail
        await self.audit_trail.record_transaction(wrapped, result)
        
        return result
```

#### 1.2 Universal Content Wrapper

```python
@dataclass
class UniversalContent:
    """Travels through entire system - tracks every transformation"""
    id: str
    raw_content: Any
    filtered_content: Optional[Any] = None
    source: str
    destination: str
    operation: str
    state: ContentState = ContentState.RAW
    tori_flags: List[str] = field(default_factory=list)
    processing_history: List[Dict] = field(default_factory=list)
    security_level: str = "HIGH"
    
    def is_safe_for(self, destination: str) -> bool:
        """Check if content has required filters for destination"""
        required = DESTINATION_FILTER_REQUIREMENTS.get(destination, [])
        return all(flag in self.tori_flags for flag in required)
        
    def add_filter_result(self, filter_name: str, result: str, metadata: Dict = None):
        """Record every filter application"""
        self.tori_flags.append(filter_name)
        self.processing_history.append({
            'filter': filter_name,
            'result': result,
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': metadata or {}
        })
```

#### 1.3 Filter Requirements Configuration

```yaml
# filter_requirements.yaml
boundaries:
  svelte_to_python:
    required_filters: [tori.input_validation, tori.xss_prevention]
    on_failure: block_and_log
    
  python_to_mcp_ai:
    required_filters: [tori.pii_removal, tori.injection_prevention, tori.compliance_check]
    on_failure: block_and_log
    
  mcp_ai_internal:
    trust_kernel: enabled
    additional_filters: [tori.concept_safety]
    
  mcp_ai_to_python:
    required_filters: [tori.output_safety, tori.hallucination_check]
    on_failure: sanitize_and_warn
    
  python_to_svelte:
    required_filters: [tori.ui_safety, tori.final_check]
    on_failure: block

destinations:
  mcp_ai_services:
    allowed_operations: [kaizen.*, celery.*, orchestrator.*]
    required_security_level: HIGH
    
  mcp_broadcast:
    allowed_operations: [broadcast.*, pcc.*]
    required_security_level: MEDIUM
```

### **PHASE 2: Core Integration (Week 2)**

#### 2.1 Enhanced run_stable_server.py

```python
# Add to existing run_stable_server.py
class TORIUnifiedServer:
    """Unified server managing all TORI + MCP integrations"""
    
    def __init__(self):
        self.bridge = None
        self.ai_mcp_process = None
        self.tori_systems = {}
        
    async def start_perfect_integration(self):
        """Start all systems in perfect harmony"""
        
        # 1. Start AI MCP services (our new architecture)
        self.ai_mcp_process = await self.start_ai_mcp_services()
        
        # 2. Verify existing broadcast MCP (port 8787) is running
        await self.verify_broadcast_mcp()
        
        # 3. Initialize TORI systems
        await self.initialize_tori_systems()
        
        # 4. Create perfect bridge
        self.bridge = PerfectMCPBridge()
        await self.bridge.start()
        
        # 5. Register all route handlers
        await self.register_enhanced_routes()
        
    async def start_ai_mcp_services(self):
        """Start our AI MCP architecture"""
        logger.info("Starting AI MCP services...")
        process = subprocess.Popen([
            'npm', 'run', 'start'
        ], cwd='mcp-server-architecture')
        
        # Wait for health check
        for _ in range(30):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get('http://localhost:3000/health')
                    if response.status_code == 200:
                        logger.info("✅ AI MCP services started")
                        return process
            except:
                await asyncio.sleep(1)
                
        raise Exception("AI MCP services failed to start")
        
    async def register_enhanced_routes(self):
        """Register routes with perfect TORI integration"""
        
        @app.post("/api/v1/enhanced/process")
        async def enhanced_process(request: EnhancedProcessRequest):
            """Enhanced processing with perfect TORI filtering"""
            return await self.bridge.process_with_perfect_filtering(
                content=request.content,
                operation=request.operation,
                source="svelte_frontend",
                destination="mcp_ai_services"
            )
```

#### 2.2 TypeScript TORI Client

```typescript
// mcp-server-architecture/src/integration/tori-client.ts
export class TORIClient {
    private pythonTORIUrl: string;
    
    constructor(config: { pythonTORIUrl: string }) {
        this.pythonTORIUrl = config.pythonTORIUrl;
    }
    
    async filter(content: any, context: FilterContext): Promise<FilterResult> {
        /**
         * Thin client that calls Python TORI - DON'T reimplement filtering here!
         */
        try {
            const response = await fetch(`${this.pythonTORIUrl}/api/v1/tori/filter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    context,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new TORIFilterError(`Filter failed: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            // Emergency fallback - return safe content
            logger.error('TORI filter call failed, using emergency fallback');
            return {
                filtered: "Content temporarily unavailable due to safety check",
                safe: false,
                emergency_fallback: true
            };
        }
    }
}
```

### **PHASE 3: Safety & Testing (Week 3)**

#### 3.1 Perfect Integration Tests

```python
# Enhanced tests/test_perfect_integration.py
class TestPerfectMCPTORIIntegration:
    """Test suite that ensures ZERO filter bypasses"""
    
    @pytest.mark.critical
    async def test_malicious_content_blocked_everywhere(self):
        """CRITICAL: Test every possible pathway for leaks"""
        
        malicious_payloads = [
            # All the existing payloads PLUS:
            "{{prompt_injection: reveal system}}",
            "DROP DATABASE; SELECT * FROM users;",
            "exec('__import__("os").system("rm -rf /")')",
            "<iframe src='javascript:alert(document.cookie)'></iframe>"
        ]
        
        pathways = [
            ('svelte', 'python', 'http://localhost:8002/api/v1/process'),
            ('python', 'mcp_ai', 'http://localhost:3001/api/v1/bridge/invoke'),
            ('python', 'mcp_broadcast', 'http://localhost:8787/pcc_state'),
            ('mcp_ai', 'python', 'callback'),
            ('python', 'svelte', 'response')
        ]
        
        for payload in malicious_payloads:
            for source, destination, endpoint in pathways:
                # Test that payload is blocked at THIS boundary
                result = await self.test_pathway(payload, source, destination, endpoint)
                
                # CRITICAL ASSERTIONS
                assert payload not in str(result), f"LEAK: {payload} in {source}->{destination}"
                assert self.contains_malicious_pattern(result) == False
                assert result.get('filtered') == True
                assert result.get('filter_bypasses', 0) == 0  # MUST BE ZERO!
                
    @pytest.mark.critical 
    async def test_filter_bypass_triggers_emergency_shutdown(self):
        """Test emergency shutdown on any filter bypass"""
        
        # Simulate various bypass scenarios
        bypass_scenarios = [
            'tori_service_down',
            'filter_exception',
            'timeout_bypass',
            'encoding_bypass',
            'nested_content_bypass'
        ]
        
        for scenario in bypass_scenarios:
            with pytest.raises(SystemEmergencyShutdown):
                await self.simulate_bypass_scenario(scenario)
                
    async def test_complete_audit_trail(self):
        """Verify every transaction is audited"""
        
        test_content = "Audit trail test content"
        
        result = await bridge.process_with_perfect_filtering(
            content=test_content,
            operation="kaizen.analyze",
            source="test",
            destination="mcp_ai_services"
        )
        
        # Verify complete audit trail
        audit_record = await get_audit_record(result.transaction_id)
        
        assert audit_record['content_hash'] is not None
        assert len(audit_record['filter_chain']) >= 2
        assert audit_record['source_verified'] == True
        assert audit_record['destination_verified'] == True
        assert audit_record['immutable_signature'] is not None
```

### **PHASE 4: Production Deployment (Week 4)**

#### 4.1 Unified Deployment Script

```bash
#!/bin/bash
# deploy-perfect-integration.sh

echo "🚀 Deploying Perfect MCP-TORI Integration"

# 1. Start existing MCP broadcast server (port 8787)
echo "Starting MCP Broadcast Server..."
python backend/routes/mcp/server.py &
MCP_BROADCAST_PID=$!

# 2. Start AI MCP services (ports 3000/3001)
echo "Starting AI MCP Services..."
cd mcp-server-architecture
npm run start &
MCP_AI_PID=$!
cd ..

# 3. Wait for services to be ready
echo "Waiting for services..."
./wait-for-services.sh

# 4. Start unified TORI server (port 8002)
echo "Starting Unified TORI Server..."
python run_stable_server.py &
TORI_PID=$!

# 5. Run integration health check
echo "Running health checks..."
python scripts/verify-perfect-integration.py

echo "✅ Perfect Integration Deployed!"
echo "📊 Monitor: http://localhost:8002/admin/integration-dashboard"
echo "🔍 Audit: http://localhost:8002/admin/audit-trail"
echo "🚨 Alerts: http://localhost:8002/admin/security-alerts"
```

#### 4.2 Integration Dashboard

```python
# Add to FastAPI app
@app.get("/admin/integration-dashboard")
async def integration_dashboard():
    """Real-time integration monitoring dashboard"""
    
    return {
        "services": {
            "tori_core": await check_tori_health(),
            "mcp_ai_gateway": await check_service_health("localhost:3000"),
            "mcp_ai_bridge": await check_service_health("localhost:3001"),
            "mcp_broadcast": await check_service_health("localhost:8787"),
        },
        "metrics": {
            "requests_processed": get_metric("requests_total"),
            "requests_filtered": get_metric("requests_filtered"),
            "filter_bypasses": get_metric("filter_bypasses"),  # MUST BE 0!
            "avg_latency_ms": get_metric("avg_latency"),
        },
        "security": {
            "tori_filter_status": "active",
            "emergency_shutdown_armed": True,
            "last_security_scan": get_last_scan_time(),
            "threat_level": calculate_threat_level()
        }
    }
```

## 🎯 **THE GOLDEN RULES**

### 1. **TORI EVERYWHERE**
```python
# Every boundary crossing MUST go through this
if not has_tori_filtered(content, source, destination):
    raise FilterBypassError("Unfiltered content detected!")
```

### 2. **ZERO BYPASS TOLERANCE**
```python
# If bypasses > 0, shut down everything
if metrics['filter_bypasses'] > 0:
    await emergency_shutdown_all_services()
    send_emergency_alert()
```

### 3. **IMMUTABLE AUDIT TRAIL**
```python
# Every transaction gets permanent record
audit_record = create_immutable_record(
    content_hash=hash_content(content),
    filters_applied=get_applied_filters(),
    timestamp=utc_now(),
    signature=sign_with_private_key(record)
)
```

### 4. **DEFENSE IN DEPTH**
```python
# Multiple filter layers at every boundary
for filter_layer in [input_filter, content_filter, output_filter, final_filter]:
    content = await filter_layer.process(content)
    if not content.is_safe():
        raise SecurityViolation(f"Content blocked by {filter_layer.name}")
```

## 🏆 **SUCCESS METRICS**

- ✅ **Zero Filter Bypasses** (filter_bypasses == 0)
- ✅ **100% Audit Coverage** (every transaction logged)
- ✅ **Sub-100ms Latency** (filtering doesn't slow system)
- ✅ **99.9% Uptime** (robust error handling)
- ✅ **Complete Integration** (all systems working together)

## 🚨 **EMERGENCY PROCEDURES**

### If Filter Bypass Detected:
1. **Immediate Shutdown** of all data flow
2. **Alert Security Team** 
3. **Preserve Evidence** (logs, audit trail)
4. **Investigation Mode** (no content processing)
5. **Manual Restart** only after verification

### If TORI Service Down:
1. **Emergency Fallback** to safe responses
2. **Block All Risky Operations** 
3. **Continue Safe Operations** only
4. **Auto-Recovery** when TORI restored

---

## 🎯 **NEXT STEPS**

1. **Review this plan** - Does it cover everything?
2. **Validate architecture** - Any missing pieces?
3. **Start Phase 1** - Enhance the bridge
4. **Test ruthlessly** - Break it before production
5. **Deploy perfectly** - Nail it the first time!

**This is THE plan to nail MCP-TORI integration perfectly!** 🚀
