#!/usr/bin/env python3
"""
Alertmanager to Kaizen Ticket Bridge

This script listens for webhooks from Prometheus Alertmanager and 
automatically creates Kaizen tickets for alerts, providing a direct
connection between metric violations and the Kaizen improvement process.
"""

import os
import sys
import json
import time
import argparse
import logging
import subprocess
import hashlib
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("alert_to_ticket.log")
    ]
)
logger = logging.getLogger("alert_to_ticket")

# Directory to check for existing tickets
KAIZEN_DIR = os.path.dirname(os.path.abspath(__file__))

# Component mapping from alert labels
COMPONENT_MAPPING = {
    "pcc": "pcc-main",
    "phase_bus": "rhythm-bus",
    "mcp": "mcp-server", 
    "memory": "sec-memory",
    "lyapunov": "safety-firewall",
    "frontend": "phase-ring-ui",
    "default": "platform-core"
}

# Severity mapping from alertmanager
SEVERITY_MAPPING = {
    "critical": "high",
    "warning": "medium",
    "info": "low",
    "default": "medium"
}

def extract_component_from_alert(alert: Dict[str, Any]) -> str:
    """Extract the component ID from alert labels"""
    labels = alert.get("labels", {})
    
    # Try multiple label options
    component = labels.get("component")
    if not component:
        component = labels.get("job")
    if not component:
        component = labels.get("service")
    if not component:
        component = labels.get("instance")
        
    # Map to known components
    for key, value in COMPONENT_MAPPING.items():
        if component and key in component.lower():
            return value
    
    return COMPONENT_MAPPING["default"]

def get_severity_from_alert(alert: Dict[str, Any]) -> str:
    """Extract severity from alert"""
    labels = alert.get("labels", {})
    severity = labels.get("severity", "default")
    return SEVERITY_MAPPING.get(severity.lower(), SEVERITY_MAPPING["default"])

def generate_fingerprint(alert: Dict[str, Any]) -> str:
    """Generate a unique fingerprint for an alert"""
    if "fingerprint" in alert:
        return alert["fingerprint"]
        
    # Generate a fingerprint based on alertname and labels
    key_str = alert.get("labels", {}).get("alertname", "unknown")
    for k, v in sorted(alert.get("labels", {}).items()):
        if k not in ["severity", "instance"]:  # Exclude variable fields
            key_str += f":{k}={v}"
    
    return hashlib.md5(key_str.encode()).hexdigest()

def find_ticket_by_fingerprint(fingerprint: str) -> Optional[str]:
    """Find a ticket by fingerprint and return its ID"""
    try:
        # Run kaizen list command and parse output
        result = subprocess.run(
            ["kaizen", "list", "--json"], 
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            logger.warning(f"Failed to list tickets: {result.stderr}")
            return None
            
        tickets = json.loads(result.stdout)
        
        for ticket in tickets:
            ticket_id = ticket.get("id")
            
            # Check ticket metadata for fingerprint
            ticket_detail = subprocess.run(
                ["kaizen", "show", ticket_id, "--json"], 
                capture_output=True,
                text=True
            )
            
            if ticket_detail.returncode != 0:
                continue
                
            detail_data = json.loads(ticket_detail.stdout)
            metadata = detail_data.get("metadata", {})
            
            if metadata.get("fingerprint") == fingerprint:
                logger.info(f"Found existing ticket {ticket_id} for alert {fingerprint}")
                return ticket_id
                
        return None
    except Exception as e:
        logger.error(f"Error finding ticket by fingerprint: {e}")
        return None

def check_existing_ticket(fingerprint: str) -> bool:
    """Check if a ticket already exists for this alert fingerprint"""
    try:
        # Run kaizen list command and parse output
        result = subprocess.run(
            ["kaizen", "list", "--json"], 
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            logger.warning(f"Failed to list tickets: {result.stderr}")
            return False
            
        tickets = json.loads(result.stdout)
        
        for ticket in tickets:
            ticket_id = ticket.get("id")
            
            # Check ticket metadata for fingerprint
            ticket_detail = subprocess.run(
                ["kaizen", "show", ticket_id, "--json"], 
                capture_output=True,
                text=True
            )
            
            if ticket_detail.returncode != 0:
                continue
                
            detail_data = json.loads(ticket_detail.stdout)
            metadata = detail_data.get("metadata", {})
            
            if metadata.get("fingerprint") == fingerprint:
                logger.info(f"Found existing ticket {ticket_id} for alert {fingerprint}")
                return True
                
        return False
    except Exception as e:
        logger.error(f"Error checking existing tickets: {e}")
        return False

def close_ticket(ticket_id: str, alert: Dict[str, Any]) -> bool:
    """Close a ticket with auto-resolved comment"""
    try:
        # Get the resolved timestamp
        resolved_at = alert.get("endsAt", "unknown")
        
        # Create comment for resolved alert
        comment = f"Alert auto-resolved at {resolved_at}\n\n"
        
        # Add any annotations as context
        annotations = alert.get("annotations", {})
        if annotations:
            comment += "Resolution context:\n"
            for key, value in annotations.items():
                comment += f"{key}: {value}\n"
        
        # Add resolved comment to ticket
        comment_cmd = [
            "kaizen", "comment", ticket_id,
            "--message", comment
        ]
        
        subprocess.run(comment_cmd, capture_output=True, text=True)
        
        # Close the ticket
        close_cmd = [
            "kaizen", "close", ticket_id,
            "--reason", "auto-resolved"
        ]
        
        result = subprocess.run(close_cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info(f"Closed ticket {ticket_id} for resolved alert")
            return True
        else:
            logger.warning(f"Failed to close ticket {ticket_id}: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Error closing ticket: {e}")
        return False

def create_ticket_from_alert(alert: Dict[str, Any]) -> Optional[str]:
    """Create a new Kaizen ticket from an alert"""
    try:
        # Extract details from alert
        fingerprint = generate_fingerprint(alert)
        
        # Handle resolved alerts
        if alert.get("status") == "resolved":
            ticket_id = find_ticket_by_fingerprint(fingerprint)
            if ticket_id:
                close_ticket(ticket_id, alert)
                return ticket_id
            return None
            
        # Check if ticket already exists
        if check_existing_ticket(fingerprint):
            return None
            
        # Extract key information
        labels = alert.get("labels", {})
        annotations = alert.get("annotations", {})
        starts_at = alert.get("startsAt", "unknown")
        
        alert_name = labels.get("alertname", "Unknown Alert")
        component = extract_component_from_alert(alert)
        severity = get_severity_from_alert(alert)
        
        # Create title from alert name
        title = f"{alert_name}"
        
        # Create description from annotations
        description = annotations.get("description", annotations.get("message", "No description provided"))
        summary = annotations.get("summary", "")
        
        if summary and summary not in description:
            description = f"{summary}\n\n{description}"
            
        # Add alert details to description
        description += f"\n\nAlert started at: {starts_at}"
        for key, value in labels.items():
            if key not in ["alertname"]:
                description += f"\n{key}: {value}"
                
        # Include metric values if available
        if "value" in alert:
            description += f"\nValue: {alert['value']}"
            
        # Create ticket
        metadata = json.dumps({"fingerprint": fingerprint})
        
        cmd = [
            "kaizen", "new", 
            title,
            "--component", component,
            "--severity", severity,
            "--description", description,
            "--metadata", metadata
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"Failed to create ticket: {result.stderr}")
            return None
            
        # Extract ticket ID from output
        ticket_id = None
        for line in result.stdout.splitlines():
            if line.startswith("Created ticket "):
                ticket_id = line.split("Created ticket ")[1].strip()
                break
                
        if ticket_id:
            logger.info(f"Created ticket {ticket_id} for alert {alert_name}")
            return ticket_id
                
        return None
    except Exception as e:
        logger.error(f"Error creating ticket: {e}")
        return None

class AlertWebhookHandler(BaseHTTPRequestHandler):
    """HTTP handler for Alertmanager webhooks"""
    
    def do_POST(self):
        """Handle POST requests from Alertmanager"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            payload = json.loads(post_data.decode('utf-8'))
            
            alerts = payload.get('alerts', [])
            logger.info(f"Received {len(alerts)} alerts from Alertmanager")
            
            created_tickets = []
            processed_tickets = []
            for alert in alerts:
                ticket_id = create_ticket_from_alert(alert)
                if ticket_id:
                    processed_tickets.append(ticket_id)
                    if alert.get("status") == "firing":
                        created_tickets.append(ticket_id)
            
            # Respond with success
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                "status": "success", 
                "message": f"Processed {len(alerts)} alerts, created {len(created_tickets)} tickets, updated {len(processed_tickets) - len(created_tickets)} tickets",
                "tickets": processed_tickets
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            logger.error(f"Error processing webhook: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_response = {"status": "error", "message": str(e)}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

def main():
    """Main function to start the webhook server"""
    parser = argparse.ArgumentParser(description="Alertmanager to Kaizen Ticket Bridge")
    parser.add_argument('--port', type=int, default=9099, help='Port to listen on (default: 9099)')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to bind to (default: 0.0.0.0)')
    args = parser.parse_args()
    
    # Print startup message
    logger.info(f"Starting Alertmanager to Kaizen bridge on {args.host}:{args.port}")
    logger.info(f"Connect your Alertmanager webhook to http://{args.host}:{args.port}/")
    
    # Start HTTP server
    server = HTTPServer((args.host, args.port), AlertWebhookHandler)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Stopping server...")
    finally:
        server.server_close()
        logger.info("Server stopped")

if __name__ == "__main__":
    main()
