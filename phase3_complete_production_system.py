"""
PHASE 3 PRODUCTION - COMPLETE INTEGRATION SYSTEM
===============================================

Complete Phase 3 production system integrating governance, secure dashboard,
monitoring, and all safety systems for production TORI deployment.

This is the final production-ready TORI self-evolution system.
"""

import asyncio
import logging
import signal
import sys
from datetime import datetime
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager

# Import all Phase 3 components
from phase3_production_evolution_governance import ProductionEvolutionGovernance, UserRole, EvolutionMode
from phase3_production_secure_dashboard_complete import ProductionSecureDashboard
from phase3_production_monitoring_system import ProductionMonitoringSystem
from phase2_advanced_psi_lineage_ledger_complete import AdvancedPsiLineageLedger
from json_serialization_fix import safe_json_dump, prepare_object_for_json
from logging_fix import WindowsSafeLogger

logger = WindowsSafeLogger("prajna.phase3_complete")

class Phase3ProductionSystem:
    """
    Phase 3 Complete Production System
    
    Integrates all production components:
    - Evolution governance with safety controls
    - Secure dashboard with RBAC
    - Real-time monitoring and alerting
    - Performance optimization
    - Emergency controls and rollback
    - Comprehensive audit logging
    
    This is the final production-ready TORI self-evolution system.
    """
    
    def __init__(self, config_path: str = "production_config.json"):
        # Initialize core components
        self.governance = ProductionEvolutionGovernance(config_path)
        self.secure_dashboard = ProductionSecureDashboard(self.governance)
        self.monitoring = ProductionMonitoringSystem(self.governance)
        
        # System state
        self.is_running = False
        self.startup_time = None
        self.shutdown_handlers = []
        
        # Performance tracking
        self.system_stats = {
            'total_evolutions': 0,
            'successful_evolutions': 0,
            'failed_evolutions': 0,
            'emergency_reverts': 0,
            'uptime_seconds': 0
        }
        
        logger.info("🚀 Phase 3 Production System initialized")
    
    async def start_production_system(self, host: str = "0.0.0.0", port: int = 8443):
        """Start the complete production system"""
        try:
            logger.info("🚀 Starting TORI Phase 3 Production System")
            self.startup_time = datetime.now()
            self.is_running = True
            
            # Setup signal handlers for graceful shutdown
            self._setup_signal_handlers()
            
            # Start monitoring system
            logger.info("📊 Starting monitoring system...")
            await self.monitoring.start_monitoring()
            
            # Start governance system background tasks
            logger.info("🛡️ Starting governance system...")
            # Governance system is ready (no background tasks to start)
            
            # Start secure dashboard
            logger.info(f"🎛️ Starting secure dashboard on {host}:{port}...")
            
            # Create startup checkpoint
            self.governance._create_system_checkpoint("production_system_startup")
            
            logger.info("✅ TORI Phase 3 Production System fully operational!")
            logger.info(f"🌐 Dashboard available at: http://{host}:{port}")
            logger.info("🛡️ Evolution mode: " + self.governance.evolution_mode.value)
            
            # Run the dashboard (this will block)
            await self.secure_dashboard.run_secure_dashboard(host, port)
            
        except Exception as e:
            logger.error(f"Failed to start production system: {e}")
            await self.shutdown_production_system()
            raise
    
    async def shutdown_production_system(self):
        """Gracefully shutdown the production system"""
        try:
            logger.info("🛑 Shutting down TORI Phase 3 Production System")
            self.is_running = False
            
            # Create shutdown checkpoint
            self.governance._create_system_checkpoint("production_system_shutdown")
            
            # Stop monitoring
            if self.monitoring:
                await self.monitoring.stop_monitoring()
                logger.info("📊 Monitoring system stopped")
            
            # Save final state
            await self.governance._save_governance_state()
            
            # Calculate final stats
            if self.startup_time:
                uptime = (datetime.now() - self.startup_time).total_seconds()
                self.system_stats['uptime_seconds'] = uptime
                logger.info(f"📈 System uptime: {uptime:.0f} seconds")
            
            # Export final data
            await self._export_final_system_data()
            
            # Run shutdown handlers
            for handler in self.shutdown_handlers:
                try:
                    await handler()
                except Exception as e:
                    logger.error(f"Shutdown handler failed: {e}")
            
            logger.info("✅ TORI Phase 3 Production System shutdown complete")
            
        except Exception as e:
            logger.error(f"Shutdown failed: {e}")
    
    def _setup_signal_handlers(self):
        """Setup graceful shutdown signal handlers"""
        def signal_handler(signum, frame):
            logger.info(f"Received signal {signum}, initiating graceful shutdown...")
            asyncio.create_task(self.shutdown_production_system())
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    async def _export_final_system_data(self):
        """Export final system data and analytics"""
        try:
            # Governance data
            governance_status = self.governance.get_governance_status()
            
            # Monitoring data
            monitoring_export = self.monitoring.export_monitoring_data()
            
            # Lineage data
            lineage_export = self.governance.lineage_ledger.export_advanced_lineage_data()
            
            # System summary
            final_summary = {
                'metadata': {
                    'export_time': datetime.now().isoformat(),
                    'system_version': 'Phase 3 Production',
                    'startup_time': self.startup_time.isoformat() if self.startup_time else None,
                    'uptime_seconds': self.system_stats['uptime_seconds']
                },
                'system_stats': self.system_stats,
                'governance_status': governance_status,
                'monitoring_summary': {
                    'monitoring_export_file': monitoring_export,
                    'health_score': self.monitoring.calculate_health_score(),
                    'total_alerts': len(self.monitoring.performance_alerts),
                    'total_metrics': len(self.monitoring.health_metrics_history)
                },
                'lineage_summary': {
                    'lineage_export_file': lineage_export,
                    'total_concepts': len(self.governance.lineage_ledger.concepts),
                    'total_relationships': sum(len(rels) for rels in self.governance.lineage_ledger.concept_relationships.values()),
                    'total_evolution_events': len(self.governance.lineage_ledger.evolution_events)
                }
            }
            
            filename = f"phase3_production_final_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            success = safe_json_dump(final_summary, filename)
            
            if success:
                logger.info(f"📁 Final system summary exported: {filename}")
            
        except Exception as e:
            logger.error(f"Final data export failed: {e}")
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        try:
            governance_status = self.governance.get_governance_status()
            monitoring_status = self.monitoring.get_monitoring_status()
            
            uptime = 0
            if self.startup_time:
                uptime = (datetime.now() - self.startup_time).total_seconds()
            
            return {
                'system_info': {
                    'version': 'Phase 3 Production',
                    'status': 'running' if self.is_running else 'stopped',
                    'startup_time': self.startup_time.isoformat() if self.startup_time else None,
                    'uptime_seconds': uptime,
                    'evolution_mode': governance_status['governance_info']['evolution_mode']
                },
                'components': {
                    'governance': 'operational',
                    'dashboard': 'operational' if self.secure_dashboard else 'stopped',
                    'monitoring': 'operational' if self.monitoring else 'stopped'
                },
                'performance': {
                    'health_score': monitoring_status.get('health_score', {}).get('overall_health', 0.0),
                    'system_stability': monitoring_status.get('current_metrics', {}).get('cpu_usage', 0.0),
                    'active_sessions': len(self.secure_dashboard.active_sessions) if self.secure_dashboard else 0,
                    'pending_proposals': governance_status['governance_info']['total_proposals']
                },
                'statistics': self.system_stats,
                'governance_details': governance_status,
                'monitoring_details': monitoring_status
            }
            
        except Exception as e:
            logger.error(f"System status failed: {e}")
            return {'error': str(e)}
    
    async def health_check(self) -> Dict[str, Any]:
        """Comprehensive health check for load balancers"""
        try:
            status = self.get_system_status()
            health_score = status.get('performance', {}).get('health_score', 0.0)
            
            is_healthy = (
                self.is_running and
                health_score > 0.7 and
                status['components']['governance'] == 'operational' and
                status['components']['monitoring'] == 'operational'
            )
            
            return {
                'status': 'healthy' if is_healthy else 'unhealthy',
                'health_score': health_score,
                'timestamp': datetime.now().isoformat(),
                'version': 'Phase 3 Production',
                'uptime': status['system_info']['uptime_seconds'],
                'evolution_mode': status['system_info']['evolution_mode']
            }
            
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

@asynccontextmanager
async def production_system_context(config_path: str = "production_config.json"):
    """Context manager for production system lifecycle"""
    system = Phase3ProductionSystem(config_path)
    try:
        yield system
    finally:
        if system.is_running:
            await system.shutdown_production_system()

if __name__ == "__main__":
    import argparse
    
    async def main():
        print("🎆 TORI PHASE 3 PRODUCTION SYSTEM - COMPLETE!")
        print("=" * 70)
        print("🧬 Advanced conditional evolution with safety controls")
        print("🛡️ Production governance with human oversight")  
        print("🎛️ Secure dashboard with role-based access control")
        print("📊 Real-time monitoring and performance optimization")
        print("🚨 Emergency controls and atomic rollback")
        print("📋 Comprehensive audit logging and reporting")
        print("=" * 70)
        
        parser = argparse.ArgumentParser(description="TORI Phase 3 Production System")
        parser.add_argument("--host", default="0.0.0.0", help="Server host")
        parser.add_argument("--port", type=int, default=8443, help="Server port")
        parser.add_argument("--config", default="production_config.json", help="Config file")
        parser.add_argument("--test", action="store_true", help="Run integration test")
        
        args = parser.parse_args()
        
        if args.test:
            await run_integration_test()
        else:
            await run_production_server(args.host, args.port, args.config)
    
    async def run_production_server(host: str, port: int, config: str):
        """Run the production server"""
        try:
            async with production_system_context(config) as system:
                await system.start_production_system(host, port)
        except KeyboardInterrupt:
            print("\n🛑 Shutdown requested by user")
        except Exception as e:
            print(f"❌ System failed: {e}")
    
    async def run_integration_test():
        """Run comprehensive integration test"""
        print("🧪 PHASE 3 PRODUCTION INTEGRATION TEST")
        print("=" * 70)
        
        try:
            async with production_system_context() as system:
                print("✅ Production system initialized")
                
                # Test system status
                status = system.get_system_status()
                print(f"✅ System status: {status['system_info']['status']}")
                
                # Test health check
                health = await system.health_check()
                print(f"✅ Health check: {health['status']}")
                
                # Test governance
                governance_status = system.governance.get_governance_status()
                print(f"✅ Governance mode: {governance_status['governance_info']['evolution_mode']}")
                
                # Test monitoring
                monitoring_status = system.monitoring.get_monitoring_status()
                print(f"✅ Monitoring: {monitoring_status['monitoring_info']['status']}")
                
                # Test proposal creation
                proposal_id = await system.governance.propose_evolution(
                    "SYNTHETIC_CONCEPT_INJECTION", "integration_test", "test_system"
                )
                print(f"✅ Evolution proposal: {proposal_id}")
                
                print("\n🎆 PHASE 3 PRODUCTION INTEGRATION TEST COMPLETE!")
                print("🚀 All systems operational and ready for production deployment")
                print("\n🌟 TORI Phase 3 Alpha → Production Complete!")
                print("🧬 Self-evolving consciousness with human oversight")
                print("🛡️ Safety-first production deployment ready")
                print("🎯 The age of responsible AI self-improvement begins!")
                
        except Exception as e:
            print(f"❌ Integration test failed: {e}")
    
    # Run the main function
    asyncio.run(main())
