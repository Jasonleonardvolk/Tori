#!/usr/bin/env python3
"""
Kaizen Metrics Exporter

This script exports Kaizen ticket metrics to Prometheus, including MTTR,
open ticket counts, and resolution rates.

Run as a cron job every 15 minutes:
*/15 * * * * python registry/kaizen/metrics.py
"""

import os
import sys
import json
import time
import logging
import subprocess
import datetime
from typing import Dict, Any, List, Optional
from prometheus_client import Counter, Gauge, Summary, push_to_gateway

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("kaizen_metrics.log")
    ]
)
logger = logging.getLogger("kaizen_metrics")

# Prometheus push gateway configuration
PUSHGATEWAY_URL = os.environ.get("PUSHGATEWAY_URL", "localhost:9091")
JOB_NAME = "kaizen_metrics"

# Prometheus metrics
tickets_total = Gauge('kaizen_tickets_total', 'Total number of Kaizen tickets', 
                      ['status', 'component', 'severity'])
kaizen_mttr = Summary('kaizen_mttr_seconds', 'Mean time to resolution for Kaizen tickets', 
                     ['component', 'severity'])
resolution_time = Summary('kaizen_resolution_time_seconds', 'Resolution time for individual tickets',
                          ['component', 'severity', 'id'])
tickets_created = Counter('kaizen_tickets_created_total', 'Total number of Kaizen tickets created',
                          ['component', 'severity'])
tickets_resolved = Counter('kaizen_tickets_resolved_total', 'Total number of Kaizen tickets resolved',
                           ['component', 'severity', 'auto_resolved'])

def parse_datetime(dt_string: str) -> Optional[datetime.datetime]:
    """Parse a datetime string into a datetime object"""
    if not dt_string:
        return None
        
    try:
        return datetime.datetime.fromisoformat(dt_string.replace('Z', '+00:00'))
    except ValueError:
        try:
            return datetime.datetime.strptime(dt_string, "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            try:
                return datetime.datetime.strptime(dt_string, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                logger.error(f"Could not parse datetime: {dt_string}")
                return None

def get_tickets(days_ago: int = 30, status: str = None) -> List[Dict[str, Any]]:
    """Get Kaizen tickets with optional status filter"""
    try:
        # Calculate date threshold
        threshold_date = (datetime.datetime.now() - 
                          datetime.timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        # Build command
        cmd = ["kaizen", "list", "--json", "--since", threshold_date]
        if status:
            cmd.extend(["--status", status])
        
        # Run kaizen list command
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.warning(f"Failed to list tickets: {result.stderr}")
            return []
            
        tickets = json.loads(result.stdout)
        logger.info(f"Found {len(tickets)} tickets with status {status or 'any'}")
        return tickets
        
    except Exception as e:
        logger.error(f"Error getting tickets: {e}")
        return []

def calculate_mttr(tickets: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
    """Calculate Mean Time to Resolution by component and severity"""
    if not tickets:
        return {}
    
    # Group by component and severity
    grouped = {}
    
    for ticket in tickets:
        component = ticket.get("component", "unknown")
        severity = ticket.get("severity", "unknown")
        
        if component not in grouped:
            grouped[component] = {}
            
        if severity not in grouped[component]:
            grouped[component][severity] = []
            
        created = parse_datetime(ticket.get("createdDate"))
        resolved = parse_datetime(ticket.get("resolvedDate"))
        
        if created and resolved:
            # Calculate seconds between created and resolved
            delta = resolved - created
            grouped[component][severity].append(delta.total_seconds())
    
    # Calculate MTTR
    result = {}
    for component, severities in grouped.items():
        result[component] = {}
        for severity, times in severities.items():
            if times:
                result[component][severity] = sum(times) / len(times)
    
    return result

def update_metrics():
    """Update Prometheus metrics for Kaizen tickets"""
    try:
        # Reset gauges
        tickets_total._metrics.clear()
        
        # Get tickets by status
        open_tickets = get_tickets(status="open")
        resolved_tickets = get_tickets(status="resolved")
        all_tickets = get_tickets()
        
        # Count tickets by status, component, and severity
        status_counts = {}
        for status in ["open", "resolved"]:
            status_counts[status] = {}
            for ticket in (open_tickets if status == "open" else resolved_tickets):
                component = ticket.get("component", "unknown")
                severity = ticket.get("severity", "unknown")
                
                if component not in status_counts[status]:
                    status_counts[status][component] = {}
                
                if severity not in status_counts[status][component]:
                    status_counts[status][component][severity] = 0
                
                status_counts[status][component][severity] += 1
        
        # Update tickets_total gauge
        for status, components in status_counts.items():
            for component, severities in components.items():
                for severity, count in severities.items():
                    tickets_total.labels(status=status, component=component, severity=severity).set(count)
        
        # Calculate and update MTTR
        mttr_data = calculate_mttr(resolved_tickets)
        for component, severities in mttr_data.items():
            for severity, mttr in severities.items():
                kaizen_mttr.labels(component=component, severity=severity).observe(mttr)
        
        # Update resolution times for individual tickets
        for ticket in resolved_tickets:
            component = ticket.get("component", "unknown")
            severity = ticket.get("severity", "unknown")
            ticket_id = ticket.get("id", "unknown")
            
            created = parse_datetime(ticket.get("createdDate"))
            resolved = parse_datetime(ticket.get("resolvedDate"))
            
            if created and resolved:
                delta = resolved - created
                resolution_time.labels(component=component, severity=severity, id=ticket_id).observe(delta.total_seconds())
        
        # Push metrics to Prometheus
        push_to_gateway(PUSHGATEWAY_URL, job=JOB_NAME, registry=None)
        logger.info("Successfully updated Kaizen metrics")
        
    except Exception as e:
        logger.error(f"Error updating metrics: {e}")

def main():
    """Main function"""
    logger.info("Starting Kaizen metrics export")
    update_metrics()

if __name__ == "__main__":
    main()
