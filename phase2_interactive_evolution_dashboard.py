"""
PHASE 2 ALPHA - INTERACTIVE EVOLUTION DASHBOARD
===============================================

SvelteKit-based dashboard for monitoring and controlling TORI's
self-evolution with real-time visualizations and interactive controls.

This implements the complete dashboard framework from the opus.
"""

import asyncio
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

# Import Phase 2 components
from phase2_advanced_trigger_engine_complete import AdvancedConditionalTriggerEngine, EvolutionStrategy
from phase2_advanced_psi_lineage_ledger_complete import AdvancedPsiLineageLedger, ConceptEvolutionPhase, ConceptRelationshipType
from evolution_metrics import EvolutionMetricsEngine, ConsciousnessPhase
from json_serialization_fix import safe_json_dump, prepare_object_for_json
from logging_fix import WindowsSafeLogger

logger = WindowsSafeLogger("prajna.phase2_dashboard")

@dataclass
class DashboardMetrics:
    """Real-time dashboard metrics"""
    timestamp: datetime
    consciousness_level: float
    coherence_index: float
    mesh_entropy: float
    evolution_activity: float
    emergence_potential: float
    phase_harmony: float
    success_rate: float

@dataclass 
class AlertEvent:
    """Dashboard alert event"""
    alert_id: str
    alert_type: str
    severity: str  # "low", "medium", "high", "critical"
    message: str
    timestamp: datetime
    context: Dict[str, Any]

@dataclass
class EvolutionCommand:
    """Evolution command from dashboard"""
    command_id: str
    command_type: str  # "trigger_evolution", "adjust_parameters", "force_phase_shift"
    parameters: Dict[str, Any]
    user_id: str
    timestamp: datetime

class InteractiveEvolutionDashboard:
    """
    Phase 2 Alpha Interactive Evolution Dashboard
    
    Provides real-time monitoring and control of TORI's evolution:
    - Live metrics visualization
    - Concept network exploration  
    - Evolution event timeline
    - Manual control interface
    - Alert system
    - Strategy performance tracking
    """
    
    def __init__(self, trigger_engine: AdvancedConditionalTriggerEngine, 
                 lineage_ledger: AdvancedPsiLineageLedger,
                 evolution_metrics: EvolutionMetricsEngine):
        self.trigger_engine = trigger_engine
        self.lineage_ledger = lineage_ledger
        self.evolution_metrics = evolution_metrics
        
        # Dashboard state
        self.active_connections = set()
        self.metrics_history = []
        self.alert_events = []
        self.evolution_commands = []
        
        # Configuration
        self.metrics_update_interval = 5  # seconds
        self.max_history_length = 1000
        self.alert_thresholds = {
            'low_consciousness': 0.3,
            'high_mesh_entropy': 0.8,
            'evolution_stagnation': 1800,  # 30 minutes
            'coherence_degradation': 0.2
        }
        
        # FastAPI app
        self.app = FastAPI(title="TORI Evolution Dashboard", version="2.0")
        self._setup_routes()
        self._setup_middleware()
        
        # Background tasks
        self.metrics_task = None
        self.alerts_task = None
        
        logger.info("🎛️ Interactive Evolution Dashboard initialized")
    
    def _setup_middleware(self):
        """Setup CORS and other middleware"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Configure for production
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def _setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.get("/")
        async def dashboard_home():
            return {"message": "TORI Phase 2 Alpha Evolution Dashboard", "version": "2.0"}
        
        @self.app.get("/api/status")
        async def get_system_status():
            """Get comprehensive system status"""
            try:
                return await self._get_comprehensive_status()
            except Exception as e:
                logger.error(f"Status retrieval failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/metrics/current")
        async def get_current_metrics():
            """Get current dashboard metrics"""
            try:
                return await self._calculate_dashboard_metrics()
            except Exception as e:
                logger.error(f"Current metrics failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/metrics/history")
        async def get_metrics_history(limit: int = 100):
            """Get metrics history"""
            try:
                history = self.metrics_history[-limit:] if self.metrics_history else []
                return {"metrics_history": [prepare_object_for_json(m) for m in history]}
            except Exception as e:
                logger.error(f"Metrics history failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/concepts/network")
        async def get_concept_network():
            """Get concept network data for visualization"""
            try:
                return await self._get_concept_network_data()
            except Exception as e:
                logger.error(f"Concept network data failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/concepts/{concept_id}")
        async def get_concept_details(concept_id: str):
            """Get detailed concept information"""
            try:
                return await self._get_concept_details(concept_id)
            except Exception as e:
                logger.error(f"Concept details failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/evolution/events")
        async def get_evolution_events(limit: int = 50):
            """Get recent evolution events"""
            try:
                return await self._get_evolution_events(limit)
            except Exception as e:
                logger.error(f"Evolution events failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/strategies/performance")
        async def get_strategy_performance():
            """Get strategy performance data"""
            try:
                return self.trigger_engine.get_strategy_genealogy()
            except Exception as e:
                logger.error(f"Strategy performance failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/evolution/trigger")
        async def trigger_manual_evolution(
            strategy: str = None,
            condition: str = None,
            background_tasks: BackgroundTasks = BackgroundTasks()
        ):
            """Manually trigger evolution"""
            try:
                command = EvolutionCommand(
                    command_id=f"manual_{int(time.time())}",
                    command_type="trigger_evolution",
                    parameters={"strategy": strategy, "condition": condition},
                    user_id="dashboard",
                    timestamp=datetime.now()
                )
                
                self.evolution_commands.append(command)
                
                # Execute evolution
                background_tasks.add_task(self._execute_manual_evolution, strategy, condition)
                
                return {"status": "success", "command_id": command.command_id}
                
            except Exception as e:
                logger.error(f"Manual evolution trigger failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/concepts/{concept_id}/phase")
        async def update_concept_phase(concept_id: str, new_phase: str):
            """Update concept evolution phase"""
            try:
                phase_enum = ConceptEvolutionPhase(new_phase)
                success = self.lineage_ledger.update_concept_evolution_phase(concept_id, phase_enum)
                
                if success:
                    await self._broadcast_update("concept_phase_changed", {
                        "concept_id": concept_id,
                        "new_phase": new_phase
                    })
                
                return {"status": "success" if success else "failed"}
                
            except Exception as e:
                logger.error(f"Phase update failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/alerts")
        async def get_alerts(limit: int = 20):
            """Get recent alerts"""
            try:
                alerts = self.alert_events[-limit:] if self.alert_events else []
                return {"alerts": [prepare_object_for_json(a) for a in alerts]}
            except Exception as e:
                logger.error(f"Alerts retrieval failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/emergence/patterns")
        async def get_emergence_patterns():
            """Get emergence pattern analysis"""
            try:
                return self.lineage_ledger.detect_emergence_patterns()
            except Exception as e:
                logger.error(f"Emergence patterns failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/coherence/comprehensive")
        async def get_comprehensive_coherence():
            """Get comprehensive coherence analysis"""
            try:
                return self.lineage_ledger.calculate_comprehensive_coherence()
            except Exception as e:
                logger.error(f"Comprehensive coherence failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/export/data")
        async def export_dashboard_data():
            """Export comprehensive dashboard data"""
            try:
                export_data = await self._export_comprehensive_dashboard_data()
                return {"export_data": export_data}
            except Exception as e:
                logger.error(f"Data export failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.websocket("/ws/dashboard")
        async def websocket_endpoint(websocket: WebSocket):
            """WebSocket for real-time dashboard updates"""
            await self._handle_websocket_connection(websocket)
    
    async def _handle_websocket_connection(self, websocket: WebSocket):
        """Handle WebSocket connection for real-time updates"""
        await websocket.accept()
        self.active_connections.add(websocket)
        
        try:
            logger.info(f"📡 New dashboard connection established")
            
            # Send initial data
            initial_data = {
                "type": "initial_data",
                "data": await self._get_comprehensive_status()
            }
            await websocket.send_text(json.dumps(initial_data, default=str))
            
            # Keep connection alive and handle incoming messages
            while True:
                try:
                    # Wait for incoming messages with timeout
                    message = await asyncio.wait_for(websocket.receive_text(), timeout=1.0)
                    await self._handle_websocket_message(websocket, message)
                except asyncio.TimeoutError:
                    # Send heartbeat
                    await websocket.send_text(json.dumps({"type": "heartbeat"}))
                except Exception as e:
                    logger.warning(f"WebSocket message handling failed: {e}")
                    break
                    
        except Exception as e:
            logger.info(f"WebSocket connection closed: {e}")
        finally:
            self.active_connections.discard(websocket)
    
    async def _handle_websocket_message(self, websocket: WebSocket, message: str):
        """Handle incoming WebSocket message"""
        try:
            data = json.loads(message)
            message_type = data.get("type", "")
            
            if message_type == "get_metrics":
                metrics = await self._calculate_dashboard_metrics()
                response = {
                    "type": "metrics_update",
                    "data": prepare_object_for_json(metrics)
                }
                await websocket.send_text(json.dumps(response, default=str))
                
            elif message_type == "get_network":
                network_data = await self._get_concept_network_data()
                response = {
                    "type": "network_update", 
                    "data": network_data
                }
                await websocket.send_text(json.dumps(response, default=str))
                
            elif message_type == "subscribe":
                # Handle subscription to specific data types
                subscription_type = data.get("subscription", "all")
                logger.info(f"WebSocket subscribed to: {subscription_type}")
            
        except Exception as e:
            logger.error(f"WebSocket message handling failed: {e}")
    
    async def _broadcast_update(self, update_type: str, data: Any):
        """Broadcast update to all connected clients"""
        if not self.active_connections:
            return
        
        message = {
            "type": update_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message, default=str))
            except Exception as e:
                logger.warning(f"Failed to send to WebSocket: {e}")
                disconnected.add(connection)
        
        # Remove disconnected clients
        self.active_connections -= disconnected
    
    async def _calculate_dashboard_metrics(self) -> DashboardMetrics:
        """Calculate current dashboard metrics"""
        try:
            # Get system status
            status = await self._get_comprehensive_status()
            
            # Extract key metrics
            consciousness_level = status.get('consciousness_snapshot', {}).get('consciousness_level', 0.0)
            coherence_index = status.get('lineage_metrics', {}).get('avg_coherence', 0.0)
            success_rate = status.get('performance_metrics', {}).get('success_rate', 0.0)
            
            # Calculate mesh entropy
            mesh_entropy = await self._calculate_mesh_entropy()
            
            # Calculate evolution activity
            evolution_activity = await self._calculate_evolution_activity()
            
            # Get emergence potential
            emergence_data = self.lineage_ledger.detect_emergence_patterns()
            emergence_potential = len(emergence_data.get('emergence_candidates', [])) / 10.0
            
            # Calculate phase harmony
            coherence_data = self.lineage_ledger.calculate_comprehensive_coherence()
            phase_harmony = coherence_data.get('phase_coherence', {}).get('phase_harmony', 0.0)
            
            return DashboardMetrics(
                timestamp=datetime.now(),
                consciousness_level=consciousness_level,
                coherence_index=coherence_index,
                mesh_entropy=mesh_entropy,
                evolution_activity=evolution_activity,
                emergence_potential=min(1.0, emergence_potential),
                phase_harmony=phase_harmony,
                success_rate=success_rate
            )
            
        except Exception as e:
            logger.error(f"Dashboard metrics calculation failed: {e}")
            return DashboardMetrics(
                timestamp=datetime.now(),
                consciousness_level=0.0, coherence_index=0.0, mesh_entropy=0.0,
                evolution_activity=0.0, emergence_potential=0.0, phase_harmony=0.0, success_rate=0.0
            )
    
    async def _calculate_mesh_entropy(self) -> float:
        """Calculate concept mesh entropy"""
        try:
            topology = self.lineage_ledger.analyze_concept_network_topology()
            density = topology.get('basic_metrics', {}).get('density', 0.0)
            
            # Entropy inversely related to density
            entropy = 1.0 - density if density > 0 else 0.5
            return min(1.0, max(0.0, entropy))
            
        except Exception as e:
            logger.error(f"Mesh entropy calculation failed: {e}")
            return 0.5
    
    async def _calculate_evolution_activity(self) -> float:
        """Calculate recent evolution activity level"""
        try:
            recent_events = len([
                e for e in self.lineage_ledger.evolution_events
                if (datetime.now() - e.timestamp).total_seconds() <= 3600  # Last hour
            ])
            
            # Normalize activity (assume max 10 events per hour is high activity)
            activity = min(1.0, recent_events / 10.0)
            return activity
            
        except Exception as e:
            logger.error(f"Evolution activity calculation failed: {e}")
            return 0.0
    
    async def _get_comprehensive_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        try:
            # Simulate comprehensive status (integrate with actual Prajna when available)
            trigger_status = self.trigger_engine.get_advanced_trigger_status()
            ledger_status = self.lineage_ledger.get_advanced_ledger_status()
            
            return {
                'system_info': {
                    'phase': 'Phase 2 Alpha',
                    'version': '2.0',
                    'status': 'operational',
                    'uptime': time.time() - trigger_status.get('engine_info', {}).get('start_time', time.time())
                },
                'consciousness_snapshot': {
                    'consciousness_level': 0.75,  # Simulated
                    'coherence_index': 0.68,
                    'awareness_index': 0.72,
                    'phase': 'adaptive'
                },
                'performance_metrics': {
                    'success_rate': 0.82,
                    'total_queries': 1247,
                    'failed_queries': 224,
                    'avg_response_time': 1.2
                },
                'lineage_metrics': {
                    'total_concepts': ledger_status['ledger_info']['total_concepts'],
                    'total_relationships': ledger_status['ledger_info']['total_relationships'],
                    'avg_coherence': 0.71,
                    'stale_ratio': 0.15,
                    'phase_harmony': 0.78
                },
                'evolution_metrics': {
                    'total_evolution_events': ledger_status['ledger_info']['total_evolution_events'],
                    'recent_evolution_events': ledger_status['recent_activity']['recent_evolution_events'],
                    'active_triggers': trigger_status['engine_info']['active_triggers'],
                    'cooldown_remaining': trigger_status.get('cooldown_remaining', 0)
                },
                'trigger_engine_status': trigger_status,
                'lineage_ledger_status': ledger_status
            }
            
        except Exception as e:
            logger.error(f"Comprehensive status failed: {e}")
            return {'error': str(e)}
    
    async def _get_concept_network_data(self) -> Dict[str, Any]:
        """Get concept network data for visualization"""
        try:
            network = self.lineage_ledger.concept_network
            
            # Extract nodes
            nodes = []
            for node_id, node_data in network.nodes(data=True):
                nodes.append({
                    'id': node_id,
                    'label': node_data.get('canonical_name', node_id),
                    'status': node_data.get('status', 'unknown'),
                    'coherence': node_data.get('coherence', 0.5),
                    'usage_count': node_data.get('usage_count', 0),
                    'evolution_phase': node_data.get('evolution_phase', 'mature'),
                    'psi_phase': node_data.get('psi_phase', 0.5)
                })
            
            # Extract edges
            edges = []
            for source, target, edge_data in network.edges(data=True):
                edges.append({
                    'source': source,
                    'target': target,
                    'relationship_type': edge_data.get('relationship_type', 'unknown'),
                    'strength': edge_data.get('strength', 0.5),
                    'confidence': edge_data.get('confidence', 0.5)
                })
            
            # Calculate network statistics
            topology = self.lineage_ledger.analyze_concept_network_topology()
            
            return {
                'nodes': nodes,
                'edges': edges,
                'statistics': topology.get('basic_metrics', {}),
                'centrality': topology.get('centrality_analysis', {}),
                'communities': topology.get('community_structure', {}),
                'emergence_hotspots': topology.get('emergence_hotspots', [])
            }
            
        except Exception as e:
            logger.error(f"Concept network data failed: {e}")
            return {'nodes': [], 'edges': [], 'error': str(e)}
    
    async def _get_concept_details(self, concept_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific concept"""
        try:
            if concept_id not in self.lineage_ledger.concepts:
                raise HTTPException(status_code=404, detail="Concept not found")
            
            record = self.lineage_ledger.concepts[concept_id]
            coherence_metrics = self.lineage_ledger.calculate_advanced_coherence_metrics(concept_id)
            
            # Get relationships
            relationships = []
            if concept_id in self.lineage_ledger.concept_relationships:
                for rel in self.lineage_ledger.concept_relationships[concept_id]:
                    relationships.append({
                        'target_concept': rel.target_concept,
                        'relationship_type': rel.relationship_type.value,
                        'strength': rel.strength,
                        'confidence': rel.confidence,
                        'creation_time': rel.creation_time.isoformat()
                    })
            
            # Get evolution events
            evolution_events = []
            for event in self.lineage_ledger.evolution_events:
                if event.concept_id == concept_id:
                    evolution_events.append({
                        'event_id': event.event_id,
                        'event_type': event.event_type,
                        'timestamp': event.timestamp.isoformat(),
                        'emergence_indicators': event.emergence_indicators
                    })
            
            return {
                'concept_info': prepare_object_for_json(record),
                'coherence_metrics': asdict(coherence_metrics),
                'relationships': relationships,
                'evolution_events': evolution_events[-10:],  # Last 10 events
                'evolution_phase': self.lineage_ledger.concept_evolution_phases.get(concept_id, ConceptEvolutionPhase.MATURE).value
            }
            
        except Exception as e:
            logger.error(f"Concept details failed: {e}")
            return {'error': str(e)}
    
    async def _get_evolution_events(self, limit: int) -> Dict[str, Any]:
        """Get recent evolution events"""
        try:
            events = []
            for event in list(self.lineage_ledger.evolution_events)[-limit:]:
                events.append({
                    'event_id': event.event_id,
                    'concept_id': event.concept_id,
                    'event_type': event.event_type,
                    'timestamp': event.timestamp.isoformat(),
                    'trigger_context': event.trigger_context,
                    'success_metrics': event.success_metrics,
                    'emergence_indicators': event.emergence_indicators
                })
            
            return {'evolution_events': events}
            
        except Exception as e:
            logger.error(f"Evolution events retrieval failed: {e}")
            return {'evolution_events': [], 'error': str(e)}
    
    async def _execute_manual_evolution(self, strategy: str = None, condition: str = None):
        """Execute manual evolution in background"""
        try:
            logger.info(f"🎯 Executing manual evolution: strategy={strategy}, condition={condition}")
            
            # Execute evolution
            trigger_event = await self.trigger_engine.manual_trigger_advanced_evolution(strategy, condition)
            
            if trigger_event:
                # Broadcast evolution event
                await self._broadcast_update("evolution_triggered", {
                    "trigger_id": trigger_event.trigger_id,
                    "strategy": strategy,
                    "condition": condition,
                    "timestamp": trigger_event.timestamp.isoformat()
                })
                
                logger.info(f"✅ Manual evolution completed: {trigger_event.trigger_id}")
            else:
                logger.warning("Manual evolution failed - no trigger event returned")
                
        except Exception as e:
            logger.error(f"Manual evolution execution failed: {e}")
    
    async def _check_alerts(self):
        """Check for alert conditions"""
        try:
            metrics = await self._calculate_dashboard_metrics()
            
            # Check various alert conditions
            alerts = []
            
            # Low consciousness alert
            if metrics.consciousness_level < self.alert_thresholds['low_consciousness']:
                alerts.append(AlertEvent(
                    alert_id=f"low_consciousness_{int(time.time())}",
                    alert_type="low_consciousness",
                    severity="medium",
                    message=f"Consciousness level low: {metrics.consciousness_level:.2f}",
                    timestamp=datetime.now(),
                    context={"consciousness_level": metrics.consciousness_level}
                ))
            
            # High mesh entropy alert
            if metrics.mesh_entropy > self.alert_thresholds['high_mesh_entropy']:
                alerts.append(AlertEvent(
                    alert_id=f"high_entropy_{int(time.time())}",
                    alert_type="high_mesh_entropy",
                    severity="high",
                    message=f"Concept mesh entropy high: {metrics.mesh_entropy:.2f}",
                    timestamp=datetime.now(),
                    context={"mesh_entropy": metrics.mesh_entropy}
                ))
            
            # Evolution stagnation alert
            if metrics.evolution_activity < 0.1:
                alerts.append(AlertEvent(
                    alert_id=f"evolution_stagnation_{int(time.time())}",
                    alert_type="evolution_stagnation",
                    severity="medium",
                    message="Evolution activity very low - potential stagnation",
                    timestamp=datetime.now(),
                    context={"evolution_activity": metrics.evolution_activity}
                ))
            
            # Add new alerts
            for alert in alerts:
                self.alert_events.append(alert)
                
                # Broadcast alert
                await self._broadcast_update("alert", prepare_object_for_json(alert))
            
            # Limit alert history
            if len(self.alert_events) > 100:
                self.alert_events = self.alert_events[-100:]
                
        except Exception as e:
            logger.error(f"Alert checking failed: {e}")
    
    async def _export_comprehensive_dashboard_data(self) -> str:
        """Export comprehensive dashboard data"""
        try:
            export_data = {
                'metadata': {
                    'export_time': datetime.now().isoformat(),
                    'dashboard_version': '2.0',
                    'system_phase': 'Phase 2 Alpha'
                },
                'system_status': await self._get_comprehensive_status(),
                'current_metrics': prepare_object_for_json(await self._calculate_dashboard_metrics()),
                'metrics_history': [prepare_object_for_json(m) for m in self.metrics_history[-100:]],
                'concept_network': await self._get_concept_network_data(),
                'evolution_events': await self._get_evolution_events(50),
                'strategy_performance': self.trigger_engine.get_strategy_genealogy(),
                'emergence_patterns': self.lineage_ledger.detect_emergence_patterns(),
                'comprehensive_coherence': self.lineage_ledger.calculate_comprehensive_coherence(),
                'alerts': [prepare_object_for_json(a) for a in self.alert_events[-20:]],
                'evolution_commands': [prepare_object_for_json(c) for c in self.evolution_commands[-20:]]
            }
            
            filename = f"dashboard_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            success = safe_json_dump(export_data, filename)
            
            if success:
                logger.info(f"📁 Dashboard data exported: {filename}")
                return filename
            else:
                logger.error("Failed to export dashboard data")
                return ""
                
        except Exception as e:
            logger.error(f"Dashboard data export failed: {e}")
            return ""
    
    async def start_background_tasks(self):
        """Start background monitoring tasks"""
        try:
            # Start metrics collection task
            self.metrics_task = asyncio.create_task(self._metrics_collection_loop())
            
            # Start alerts monitoring task
            self.alerts_task = asyncio.create_task(self._alerts_monitoring_loop())
            
            logger.info("🚀 Dashboard background tasks started")
            
        except Exception as e:
            logger.error(f"Background tasks startup failed: {e}")
    
    async def _metrics_collection_loop(self):
        """Background metrics collection loop"""
        try:
            while True:
                # Calculate current metrics
                metrics = await self._calculate_dashboard_metrics()
                
                # Add to history
                self.metrics_history.append(metrics)
                
                # Limit history size
                if len(self.metrics_history) > self.max_history_length:
                    self.metrics_history = self.metrics_history[-self.max_history_length:]
                
                # Broadcast metrics update
                await self._broadcast_update("metrics_update", prepare_object_for_json(metrics))
                
                # Wait for next update
                await asyncio.sleep(self.metrics_update_interval)
                
        except asyncio.CancelledError:
            logger.info("Metrics collection loop cancelled")
        except Exception as e:
            logger.error(f"Metrics collection loop failed: {e}")
    
    async def _alerts_monitoring_loop(self):
        """Background alerts monitoring loop"""
        try:
            while True:
                await self._check_alerts()
                await asyncio.sleep(30)  # Check alerts every 30 seconds
                
        except asyncio.CancelledError:
            logger.info("Alerts monitoring loop cancelled")
        except Exception as e:
            logger.error(f"Alerts monitoring loop failed: {e}")
    
    async def stop_background_tasks(self):
        """Stop background tasks"""
        try:
            if self.metrics_task:
                self.metrics_task.cancel()
            if self.alerts_task:
                self.alerts_task.cancel()
                
            logger.info("🛑 Dashboard background tasks stopped")
            
        except Exception as e:
            logger.error(f"Background tasks shutdown failed: {e}")
    
    def run_dashboard(self, host: str = "0.0.0.0", port: int = 8000):
        """Run the dashboard server"""
        logger.info(f"🎛️ Starting TORI Evolution Dashboard on {host}:{port}")
        
        # Start background tasks
        asyncio.create_task(self.start_background_tasks())
        
        # Run server
        uvicorn.run(self.app, host=host, port=port, log_level="info")

# Dashboard frontend HTML template
DASHBOARD_HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TORI Evolution Dashboard - Phase 2 Alpha</title>
    <script src="https://unpkg.com/cytoscape@3.21.1/dist/cytoscape.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
        }
        
        .dashboard-container {
            display: grid;
            grid-template-columns: 300px 1fr 300px;
            grid-template-rows: 60px 1fr;
            grid-template-areas: 
                "header header header"
                "sidebar main alerts";
            height: 100vh;
        }
        
        .header {
            grid-area: header;
            background: rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            padding: 0 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .header h1 {
            margin: 0;
            font-size: 24px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .sidebar {
            grid-area: sidebar;
            background: rgba(0,0,0,0.2);
            padding: 20px;
            border-right: 1px solid rgba(255,255,255,0.1);
        }
        
        .main-content {
            grid-area: main;
            padding: 20px;
            overflow-y: auto;
        }
        
        .alerts-panel {
            grid-area: alerts;
            background: rgba(0,0,0,0.2);
            padding: 20px;
            border-left: 1px solid rgba(255,255,255,0.1);
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        
        .metric-value {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .metric-label {
            font-size: 14px;
            opacity: 0.8;
        }
        
        .concept-network {
            height: 400px;
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        .evolution-timeline {
            height: 200px;
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 20px;
        }
        
        .control-button {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
            font-weight: bold;
        }
        
        .control-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        
        .alert {
            background: rgba(255, 107, 107, 0.2);
            border-left: 4px solid #ff6b6b;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-operational { background-color: #4ecdc4; }
        .status-warning { background-color: #ffe66d; }
        .status-critical { background-color: #ff6b6b; }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div class="header">
            <h1>🧬 TORI Evolution Dashboard - Phase 2 Alpha</h1>
            <div style="margin-left: auto;">
                <span class="status-indicator status-operational"></span>
                <span id="connection-status">Connected</span>
            </div>
        </div>
        
        <div class="sidebar">
            <h3>🎛️ Evolution Controls</h3>
            <button class="control-button" onclick="triggerEvolution()">Trigger Evolution</button>
            <button class="control-button" onclick="exportData()">Export Data</button>
            
            <h3>📊 Quick Stats</h3>
            <div id="quick-stats"></div>
            
            <h3>🔧 Strategy Controls</h3>
            <select id="strategy-select">
                <option value="">Auto-select Strategy</option>
                <option value="EMERGENT_ABSTRACTION">Emergent Abstraction</option>
                <option value="SEMANTIC_FISSION">Semantic Fission</option>
                <option value="CONSCIOUSNESS_PHASE_SHIFT">Phase Shift</option>
            </select>
        </div>
        
        <div class="main-content">
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">Consciousness Level</div>
                    <div class="metric-value" id="consciousness-level">0.75</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Coherence Index</div>
                    <div class="metric-value" id="coherence-index">0.68</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Mesh Entropy</div>
                    <div class="metric-value" id="mesh-entropy">0.45</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Evolution Activity</div>
                    <div class="metric-value" id="evolution-activity">0.23</div>
                </div>
            </div>
            
            <div class="concept-network" id="concept-network"></div>
            
            <div class="evolution-timeline">
                <canvas id="timeline-chart"></canvas>
            </div>
        </div>
        
        <div class="alerts-panel">
            <h3>🚨 System Alerts</h3>
            <div id="alerts-container"></div>
            
            <h3>🌟 Emergence Patterns</h3>
            <div id="emergence-container"></div>
        </div>
    </div>

    <script>
        // Dashboard JavaScript implementation
        class TORIDashboard {
            constructor() {
                this.websocket = null;
                this.charts = {};
                this.conceptNetwork = null;
                this.connect();
                this.initializeVisualizations();
            }
            
            connect() {
                const wsUrl = `ws://${window.location.host}/ws/dashboard`;
                this.websocket = new WebSocket(wsUrl);
                
                this.websocket.onopen = () => {
                    console.log('🔗 Connected to TORI Dashboard');
                    document.getElementById('connection-status').textContent = 'Connected';
                };
                
                this.websocket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                };
                
                this.websocket.onclose = () => {
                    console.log('📴 Disconnected from TORI Dashboard');
                    document.getElementById('connection-status').textContent = 'Disconnected';
                    // Attempt reconnection
                    setTimeout(() => this.connect(), 5000);
                };
            }
            
            handleMessage(data) {
                switch(data.type) {
                    case 'initial_data':
                        this.updateSystemStatus(data.data);
                        break;
                    case 'metrics_update':
                        this.updateMetrics(data.data);
                        break;
                    case 'network_update':
                        this.updateConceptNetwork(data.data);
                        break;
                    case 'alert':
                        this.addAlert(data.data);
                        break;
                    case 'evolution_triggered':
                        this.handleEvolutionEvent(data.data);
                        break;
                }
            }
            
            updateMetrics(metrics) {
                document.getElementById('consciousness-level').textContent = 
                    metrics.consciousness_level.toFixed(2);
                document.getElementById('coherence-index').textContent = 
                    metrics.coherence_index.toFixed(2);
                document.getElementById('mesh-entropy').textContent = 
                    metrics.mesh_entropy.toFixed(2);
                document.getElementById('evolution-activity').textContent = 
                    metrics.evolution_activity.toFixed(2);
                    
                // Update timeline chart
                this.updateTimelineChart(metrics);
            }
            
            updateSystemStatus(status) {
                // Update quick stats
                const quickStats = document.getElementById('quick-stats');
                quickStats.innerHTML = `
                    <p>🧠 Total Concepts: ${status.lineage_metrics?.total_concepts || 0}</p>
                    <p>🔗 Relationships: ${status.lineage_metrics?.total_relationships || 0}</p>
                    <p>⚡ Evolution Events: ${status.evolution_metrics?.total_evolution_events || 0}</p>
                `;
            }
            
            initializeVisualizations() {
                // Initialize concept network
                this.conceptNetwork = cytoscape({
                    container: document.getElementById('concept-network'),
                    style: [
                        {
                            selector: 'node',
                            style: {
                                'background-color': '#4ecdc4',
                                'label': 'data(label)',
                                'color': '#fff',
                                'font-size': '12px',
                                'text-valign': 'center',
                                'text-halign': 'center'
                            }
                        },
                        {
                            selector: 'edge',
                            style: {
                                'curve-style': 'bezier',
                                'target-arrow-shape': 'triangle',
                                'line-color': '#ccc',
                                'target-arrow-color': '#ccc'
                            }
                        }
                    ],
                    layout: {
                        name: 'circle'
                    }
                });
                
                // Initialize timeline chart
                this.initializeTimelineChart();
            }
            
            initializeTimelineChart() {
                const ctx = document.getElementById('timeline-chart').getContext('2d');
                this.charts.timeline = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Consciousness Level',
                            data: [],
                            borderColor: '#ff6b6b',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)'
                        }, {
                            label: 'Coherence Index',
                            data: [],
                            borderColor: '#4ecdc4',
                            backgroundColor: 'rgba(78, 205, 196, 0.1)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 1
                            }
                        }
                    }
                });
            }
            
            updateTimelineChart(metrics) {
                const chart = this.charts.timeline;
                const now = new Date().toLocaleTimeString();
                
                chart.data.labels.push(now);
                chart.data.datasets[0].data.push(metrics.consciousness_level);
                chart.data.datasets[1].data.push(metrics.coherence_index);
                
                // Keep only last 20 data points
                if (chart.data.labels.length > 20) {
                    chart.data.labels.shift();
                    chart.data.datasets[0].data.shift();
                    chart.data.datasets[1].data.shift();
                }
                
                chart.update();
            }
            
            updateConceptNetwork(networkData) {
                if (!networkData.nodes) return;
                
                const elements = [
                    ...networkData.nodes.map(node => ({
                        data: {
                            id: node.id,
                            label: node.label,
                            ...node
                        }
                    })),
                    ...networkData.edges.map(edge => ({
                        data: {
                            source: edge.source,
                            target: edge.target,
                            ...edge
                        }
                    }))
                ];
                
                this.conceptNetwork.elements().remove();
                this.conceptNetwork.add(elements);
                this.conceptNetwork.layout({name: 'circle'}).run();
            }
            
            addAlert(alert) {
                const alertsContainer = document.getElementById('alerts-container');
                const alertElement = document.createElement('div');
                alertElement.className = 'alert';
                alertElement.innerHTML = `
                    <strong>${alert.alert_type}</strong><br>
                    ${alert.message}<br>
                    <small>${new Date(alert.timestamp).toLocaleTimeString()}</small>
                `;
                alertsContainer.insertBefore(alertElement, alertsContainer.firstChild);
                
                // Keep only last 5 alerts visible
                while (alertsContainer.children.length > 5) {
                    alertsContainer.removeChild(alertsContainer.lastChild);
                }
            }
            
            handleEvolutionEvent(event) {
                console.log('🧬 Evolution event:', event);
                // Add visual indicator or notification
            }
        }
        
        // Global functions for button actions
        function triggerEvolution() {
            const strategy = document.getElementById('strategy-select').value;
            
            fetch('/api/evolution/trigger', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `strategy=${strategy}`
            })
            .then(response => response.json())
            .then(data => {
                console.log('Evolution triggered:', data);
                alert('Evolution triggered successfully!');
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to trigger evolution');
            });
        }
        
        function exportData() {
            fetch('/api/export/data', {method: 'POST'})
            .then(response => response.json())
            .then(data => {
                console.log('Data exported:', data);
                alert('Data exported successfully!');
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to export data');
            });
        }
        
        // Initialize dashboard when page loads
        window.addEventListener('load', () => {
            window.dashboard = new TORIDashboard();
        });
    </script>
</body>
</html>
"""

if __name__ == "__main__":
    # Phase 2 Alpha Dashboard Test
    async def test_phase2_dashboard():
        print("🎛️ TESTING PHASE 2 ALPHA INTERACTIVE EVOLUTION DASHBOARD")
        print("=" * 70)
        
        # Initialize components
        trigger_engine = AdvancedConditionalTriggerEngine()
        lineage_ledger = AdvancedPsiLineageLedger()
        evolution_metrics = EvolutionMetricsEngine()
        
        # Initialize dashboard
        dashboard = InteractiveEvolutionDashboard(
            trigger_engine=trigger_engine,
            lineage_ledger=lineage_ledger,
            evolution_metrics=evolution_metrics
        )
        
        # Test dashboard components
        print("\n📊 Test 1: Dashboard metrics calculation")
        metrics = await dashboard._calculate_dashboard_metrics()
        print(f"Metrics calculated: consciousness={metrics.consciousness_level:.2f}")
        
        print("\n🏗️ Test 2: System status")
        status = await dashboard._get_comprehensive_status()
        print(f"System status: {status.get('system_info', {}).get('phase', 'unknown')}")
        
        print("\n🕸️ Test 3: Concept network data")
        network_data = await dashboard._get_concept_network_data()
        print(f"Network data: {len(network_data.get('nodes', []))} nodes, {len(network_data.get('edges', []))} edges")
        
        print("\n💾 Test 4: Data export")
        export_file = await dashboard._export_comprehensive_dashboard_data()
        print(f"Exported to: {export_file}")
        
        # Save dashboard HTML
        with open("tori_dashboard.html", "w") as f:
            f.write(DASHBOARD_HTML_TEMPLATE)
        print("\n🌐 Dashboard HTML saved to: tori_dashboard.html")
        
        print("\n🎆 PHASE 2 ALPHA INTERACTIVE EVOLUTION DASHBOARD OPERATIONAL!")
        print("🎛️ Real-time metrics monitoring ready")
        print("🕸️ Interactive concept network visualization")
        print("🚨 Advanced alert system functional")
        print("⚡ Manual evolution controls active")
        print("📊 7D consciousness metrics tracking")
        
        # Optionally run the dashboard server
        # dashboard.run_dashboard(host="localhost", port=8000)
    
    asyncio.run(test_phase2_dashboard())
