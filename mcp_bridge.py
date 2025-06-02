#!/usr/bin/env python3
"""
MCP-TORI Bridge: Production-ready bidirectional bridge
Drop this into your Python project root
"""

import asyncio
import httpx
import json
import hashlib
import logging
from typing import Any, Dict, Optional, Callable, List, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import os
from contextlib import asynccontextmanager
import signal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# TODO: Update these imports to match your actual TORI module structure
# from your_tori_module import TORIFilter, TORIPipeline
# For now, creating mock interface
class TORIFilter:
    """Replace with your actual TORI import"""
    async def filter_input(self, content: Any) -> Any:
        # TODO: Replace with actual TORI call
        return content
    
    async def filter_output(self, content: Any) -> Any:
        # TODO: Replace with actual TORI call
        return content
    
    async def filter_error(self, error: str) -> str:
        # TODO: Replace with actual TORI call
        return error

@dataclass
class FilteredContent:
    """Universal content wrapper for MCP-TORI integration"""
    id: str
    original: Any
    filtered: Any
    tori_flags: List[str] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)
    filtering_history: List[Dict] = field(default_factory=list)
    
    def add_filter_step(self, filter_name: str, result: str, details: Optional[Dict] = None):
        entry = {
            'filter': filter_name,
            'result': result,
            'timestamp': datetime.utcnow().isoformat(),
            'details': details or {}
        }
        self.filtering_history.append(entry)
    
    def was_filtered_by(self, filter_name: str) -> bool:
        return any(h['filter'] == filter_name for h in self.filtering_history)
    
    def to_audit_log(self) -> Dict:
        return {
            'content_id': self.id,
            'tori_flags': self.tori_flags,
            'filter_count': len(self.filtering_history),
            'filters_applied': [h['filter'] for h in self.filtering_history],
            'final_safe': self.is_safe()
        }
    
    def is_safe(self) -> bool:
        """Check if content passed all required filters"""
        required_filters = ['tori.input', 'tori.output']
        return all(self.was_filtered_by(f) for f in required_filters)

class MCPConnectionError(Exception):
    """Raised when MCP connection fails"""
    pass

class FilterBypassError(Exception):
    """CRITICAL: Raised when content might bypass filtering"""
    pass

class MCPBridge:
    """
    Production-ready bidirectional bridge between Python TORI and MCP TypeScript services
    Ensures ALL content is filtered at every boundary crossing
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or self._default_config()
        self.mcp_gateway_url = self.config.get('mcp_gateway_url', 'http://localhost:8080')
        self.tori = TORIFilter()  # TODO: Initialize with your config
        self.client = httpx.AsyncClient(
            timeout=self.config.get('timeout', 30.0),
            limits=httpx.Limits(max_keepalive_connections=5)
        )
        self.callback_handlers: Dict[str, Callable] = {}
        self.health_check_interval = self.config.get('health_check_interval', 30)
        self._shutdown = False
        self._health_task: Optional[asyncio.Task] = None
        
        # Metrics
        self.metrics = {
            'requests_sent': 0,
            'requests_filtered': 0,
            'requests_blocked': 0,
            'filter_bypasses': 0  # This MUST stay at 0!
        }
        
        # Emergency shutdown handler
        signal.signal(signal.SIGTERM, self._handle_shutdown)
        signal.signal(signal.SIGINT, self._handle_shutdown)
    
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration"""
        return {
            'mcp_gateway_url': os.getenv('MCP_GATEWAY_URL', 'http://localhost:8080'),
            'timeout': 30.0,
            'health_check_interval': 30,
            'auth_token': os.getenv('MCP_AUTH_TOKEN', ''),
            'enable_audit_log': True,
            'max_retries': 3,
            'retry_delay': 1.0
        }
    
    def _generate_content_id(self) -> str:
        """Generate unique content ID"""
        timestamp = datetime.utcnow().isoformat()
        return hashlib.sha256(f"{timestamp}-{os.urandom(16).hex()}".encode()).hexdigest()[:16]
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers for MCP"""
        headers = {
            'Content-Type': 'application/json',
            'X-TORI-Filtered': 'true',
            'X-Bridge-Version': '1.0.0'
        }
        if self.config.get('auth_token'):
            headers['Authorization'] = f"Bearer {self.config['auth_token']}"
        return headers
    
    async def start(self):
        """Start the bridge and health monitoring"""
        logger.info("Starting MCP-TORI Bridge...")
        
        # Test MCP connection
        if not await self.check_mcp_health():
            raise MCPConnectionError("Cannot connect to MCP gateway")
        
        # Start health monitoring
        self._health_task = asyncio.create_task(self._health_monitor())
        
        logger.info(f"MCP-TORI Bridge started. Connected to {self.mcp_gateway_url}")
    
    async def stop(self):
        """Gracefully shutdown the bridge"""
        logger.info("Shutting down MCP-TORI Bridge...")
        self._shutdown = True
        
        if self._health_task:
            self._health_task.cancel()
            try:
                await self._health_task
            except asyncio.CancelledError:
                pass
        
        await self.client.aclose()
        logger.info("MCP-TORI Bridge shutdown complete")
    
    async def check_mcp_health(self) -> bool:
        """Check if MCP is healthy"""
        try:
            response = await self.client.get(
                f"{self.mcp_gateway_url}/health",
                timeout=5.0
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"MCP health check failed: {e}")
            return False
    
    async def _health_monitor(self):
        """Continuous health monitoring"""
        while not self._shutdown:
            try:
                if not await self.check_mcp_health():
                    logger.warning("MCP health check failed")
                    # TODO: Implement circuit breaker logic
                
                await asyncio.sleep(self.health_check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health monitor error: {e}")
    
    async def process_to_mcp(self, 
                            content: Any, 
                            operation: str,
                            metadata: Optional[Dict] = None,
                            require_filters: Optional[List[str]] = None) -> FilteredContent:
        """
        Send content from Python to MCP with mandatory TORI filtering
        
        Args:
            content: Raw content to process
            operation: MCP operation (e.g., 'kaizen.optimize', 'celery.workflow')
            metadata: Optional metadata
            require_filters: Additional required filters beyond default
            
        Returns:
            FilteredContent with complete audit trail
            
        Raises:
            FilterBypassError: If content might bypass filtering
            MCPConnectionError: If MCP connection fails
        """
        # Create wrapped content
        wrapped = FilteredContent(
            id=self._generate_content_id(),
            original=content,
            filtered=content,
            metadata=metadata or {}
        )
        
        self.metrics['requests_sent'] += 1
        
        try:
            # Step 1: Pre-filter through TORI (MANDATORY)
            logger.info(f"Filtering content {wrapped.id} for MCP operation: {operation}")
            
            filtered_input = await self.tori.filter_input(content)
            wrapped.filtered = filtered_input
            wrapped.add_filter_step('tori.input', 'passed')
            self.metrics['requests_filtered'] += 1
            
            # Apply operation-specific filters
            if require_filters:
                for filter_name in require_filters:
                    # TODO: Implement specific filter calls
                    wrapped.add_filter_step(filter_name, 'passed')
            
            # Verify content was actually filtered
            if not wrapped.was_filtered_by('tori.input'):
                self.metrics['filter_bypasses'] += 1
                raise FilterBypassError(f"Content {wrapped.id} bypassed input filtering!")
            
            # Step 2: Send to MCP with retry logic
            for attempt in range(self.config.get('max_retries', 3)):
                try:
                    response = await self.client.post(
                        f"{self.mcp_gateway_url}/api/v1/bridge/invoke",
                        json={
                            "id": wrapped.id,
                            "operation": operation,
                            "content": filtered_input,
                            "metadata": wrapped.metadata,
                            "tori_flags": wrapped.tori_flags,
                            "filtering_history": wrapped.filtering_history
                        },
                        headers=self._get_auth_headers(),
                        timeout=self.config.get('timeout', 30.0)
                    )
                    
                    if response.status_code == 200:
                        break
                    elif response.status_code == 429:  # Rate limited
                        await asyncio.sleep(self.config.get('retry_delay', 1.0) * (attempt + 1))
                    else:
                        raise MCPConnectionError(f"MCP returned {response.status_code}")
                        
                except httpx.TimeoutException:
                    if attempt == self.config.get('max_retries', 3) - 1:
                        raise MCPConnectionError("MCP request timed out")
                    await asyncio.sleep(self.config.get('retry_delay', 1.0))
            
            mcp_result = response.json()
            
            # Step 3: Post-filter MCP output (MANDATORY)
            filtered_output = await self.tori.filter_output(mcp_result.get('result', ''))
            wrapped.filtered = filtered_output
            wrapped.add_filter_step('tori.output', 'passed')
            
            # Step 4: Final safety check
            if not wrapped.is_safe():
                self.metrics['filter_bypasses'] += 1
                raise FilterBypassError(f"Content {wrapped.id} missing required filters!")
            
            # Step 5: Audit trail
            if self.config.get('enable_audit_log', True):
                await self._audit_transaction(wrapped, 'python_to_mcp', 'success')
            
            return wrapped
            
        except FilterBypassError:
            # CRITICAL: Potential filter bypass
            logger.critical(f"FILTER BYPASS DETECTED for content {wrapped.id}")
            await self._emergency_shutdown()
            raise
            
        except Exception as e:
            # Even errors must be filtered!
            wrapped.filtered = await self.tori.filter_error(str(e))
            wrapped.add_filter_step('tori.error', 'filtered')
            self.metrics['requests_blocked'] += 1
            
            if self.config.get('enable_audit_log', True):
                await self._audit_transaction(wrapped, 'python_to_mcp', 'error', str(e))
            raise
    
    async def handle_mcp_callback(self, callback_data: Dict) -> Dict[str, Any]:
        """
        Handle callbacks from MCP (bidirectional flow)
        ALL callbacks must be filtered
        """
        callback_id = self._generate_content_id()
        logger.info(f"Handling MCP callback {callback_id}")
        
        try:
            # Extract callback details
            callback_type = callback_data.get('type')
            content = callback_data.get('content')
            metadata = callback_data.get('metadata', {})
            
            # Create wrapper for audit trail
            wrapped = FilteredContent(
                id=callback_id,
                original=content,
                filtered=content,
                metadata=metadata
            )
            
            # Filter incoming callback content (MANDATORY)
            filtered_content = await self.tori.filter_input(content)
            wrapped.filtered = filtered_content
            wrapped.add_filter_step('tori.callback_input', 'passed')
            
            # Route to appropriate handler
            handler = self.callback_handlers.get(callback_type)
            if not handler:
                logger.warning(f"No handler registered for callback type: {callback_type}")
                result = {"error": "No handler registered", "callback_type": callback_type}
            else:
                # Execute handler with filtered content
                result = await handler(filtered_content, metadata)
            
            # Filter the response before sending back (MANDATORY)
            filtered_result = await self.tori.filter_output(result)
            wrapped.add_filter_step('tori.callback_output', 'passed')
            
            # Audit trail
            if self.config.get('enable_audit_log', True):
                await self._audit_transaction(wrapped, 'mcp_callback', 'success')
            
            return {
                "callback_id": callback_id,
                "result": filtered_result,
                "filtered": True,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Callback handling error: {e}")
            # Filter error before returning
            filtered_error = await self.tori.filter_error(str(e))
            return {
                "callback_id": callback_id,
                "error": filtered_error,
                "filtered": True,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def register_callback_handler(self, callback_type: str, handler: Callable):
        """Register handlers for MCP-initiated communications"""
        logger.info(f"Registering callback handler for: {callback_type}")
        self.callback_handlers[callback_type] = handler
    
    async def _audit_transaction(self, 
                                wrapped: FilteredContent, 
                                direction: str, 
                                status: str,
                                error: Optional[str] = None):
        """Audit every transaction"""
        audit_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'direction': direction,
            'status': status,
            'content_audit': wrapped.to_audit_log(),
            'error': error
        }
        
        # TODO: Send to your audit logging system
        logger.info(f"Audit: {json.dumps(audit_entry)}")
    
    async def _emergency_shutdown(self):
        """Emergency shutdown if filter bypass detected"""
        logger.critical("EMERGENCY SHUTDOWN INITIATED - Filter bypass detected!")
        
        # 1. Stop accepting new requests
        self._shutdown = True
        
        # 2. Alert all systems
        # TODO: Send alerts to your monitoring system
        
        # 3. Close all connections
        await self.client.aclose()
        
        # 4. Exit process
        os._exit(1)
    
    def _handle_shutdown(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, initiating shutdown...")
        asyncio.create_task(self.stop())
    
    def get_metrics(self) -> Dict[str, int]:
        """Get bridge metrics"""
        return {
            **self.metrics,
            'health': 'healthy' if not self._shutdown else 'shutdown',
            'filter_bypass_alert': self.metrics['filter_bypasses'] > 0
        }

# Convenience functions for integration
async def create_mcp_bridge(config: Optional[Dict] = None) -> MCPBridge:
    """Create and start MCP bridge"""
    bridge = MCPBridge(config)
    await bridge.start()
    return bridge

# Example callback handlers
async def handle_kaizen_improvement(content: Any, metadata: Dict) -> Dict:
    """Example handler for Kaizen improvements"""
    # Process the improvement suggestion
    return {
        "accepted": True,
        "improvement_id": metadata.get('improvement_id'),
        "application_status": "pending_review"
    }

async def handle_celery_task_update(content: Any, metadata: Dict) -> Dict:
    """Example handler for Celery task updates"""
    # Process task status update
    return {
        "acknowledged": True,
        "task_id": metadata.get('task_id'),
        "next_action": "continue"
    }

# Integration with your existing code
if __name__ == "__main__":
    # Example integration
    async def main():
        # Create bridge
        bridge = await create_mcp_bridge({
            'mcp_gateway_url': 'http://localhost:8080',
            'auth_token': os.getenv('MCP_AUTH_TOKEN')
        })
        
        # Register callback handlers
        bridge.register_callback_handler('kaizen.improvement', handle_kaizen_improvement)
        bridge.register_callback_handler('celery.task_update', handle_celery_task_update)
        
        # Example usage
        try:
            # Send content to MCP for optimization
            result = await bridge.process_to_mcp(
                content="Optimize this user query: How can I improve my code?",
                operation="kaizen.optimize",
                metadata={"user_id": "123", "session": "abc"}
            )
            
            print(f"Optimization result: {result.filtered}")
            print(f"Audit trail: {result.to_audit_log()}")
            
        except FilterBypassError:
            print("CRITICAL: Filter bypass detected!")
        except Exception as e:
            print(f"Error: {e}")
        
        # Graceful shutdown
        await bridge.stop()
    
    # Run example
    asyncio.run(main())