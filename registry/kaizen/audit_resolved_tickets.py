#!/usr/bin/env python3
"""
Kaizen Resolved Ticket Auditor

This script audits resolved tickets to ensure they have proper 
Root Cause Analysis (RCA) documentation. It identifies tickets 
that were auto-resolved but never received a follow-up analysis,
generating a report for follow-up.

Run weekly as a cron job:
0 9 * * MON python registry/kaizen/audit_resolved_tickets.py --email admin@example.com
"""

import os
import sys
import json
import time
import argparse
import logging
import subprocess
import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("audit_tickets.log")
    ]
)
logger = logging.getLogger("ticket_auditor")

# Keywords that indicate proper RCA documentation
RCA_KEYWORDS = [
    "root cause",
    "root-cause",
    "RCA",
    "investigation revealed",
    "caused by",
    "analysis shows",
    "underlying issue",
    "fixed by",
    "resolved by",
    "corrected by"
]

# Time window to look back (in days)
DEFAULT_DAYS = 7

def get_resolved_tickets(days_ago: int) -> List[Dict[str, Any]]:
    """Get tickets resolved within the specified days"""
    try:
        # Calculate date threshold
        threshold_date = (datetime.datetime.now() - 
                          datetime.timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        # Run kaizen list command with filters for resolved tickets
        result = subprocess.run(
            ["kaizen", "list", "--json", "--status", "resolved", 
             "--since", threshold_date], 
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            logger.warning(f"Failed to list tickets: {result.stderr}")
            return []
            
        tickets = json.loads(result.stdout)
        logger.info(f"Found {len(tickets)} resolved tickets in last {days_ago} days")
        return tickets
        
    except Exception as e:
        logger.error(f"Error getting resolved tickets: {e}")
        return []

def check_ticket_has_rca(ticket_id: str) -> bool:
    """Check if a ticket has RCA documentation"""
    try:
        # Get full ticket details
        result = subprocess.run(
            ["kaizen", "show", ticket_id, "--json", "--full"], 
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            logger.warning(f"Failed to get ticket {ticket_id}: {result.stderr}")
            return False
            
        # Parse ticket details
        ticket_data = json.loads(result.stdout)
        
        # Check description
        description = ticket_data.get("description", "").lower()
        
        # Check comments
        comments = ticket_data.get("comments", [])
        comments_text = " ".join([c.get("content", "").lower() for c in comments])
        
        # Get auto-resolved status
        auto_resolved = False
        if "auto-resolved" in ticket_data.get("closeReason", "").lower():
            auto_resolved = True
        
        # Check for keywords in description or comments
        for keyword in RCA_KEYWORDS:
            if keyword.lower() in description or keyword.lower() in comments_text:
                return True
                
        return False
        
    except Exception as e:
        logger.error(f"Error checking ticket {ticket_id} for RCA: {e}")
        return False

def audit_tickets(days_ago: int) -> List[Dict[str, Any]]:
    """Audit tickets for RCA documentation"""
    # Get resolved tickets
    tickets = get_resolved_tickets(days_ago)
    
    # Check each ticket for RCA
    tickets_without_rca = []
    
    for ticket in tickets:
        ticket_id = ticket.get("id")
        
        # Skip tickets that aren't closed as auto-resolved
        if "auto-resolved" not in ticket.get("closeReason", "").lower():
            continue
        
        # Check if ticket has RCA
        has_rca = check_ticket_has_rca(ticket_id)
        
        if not has_rca:
            tickets_without_rca.append({
                "id": ticket_id,
                "title": ticket.get("title"),
                "resolvedDate": ticket.get("resolvedDate"),
                "component": ticket.get("component"),
                "assignee": ticket.get("assignee")
            })
    
    logger.info(f"Found {len(tickets_without_rca)} tickets without RCA")
    return tickets_without_rca

def generate_report(tickets: List[Dict[str, Any]]) -> str:
    """Generate a report of tickets without RCA"""
    report = ["# Tickets Missing Root Cause Analysis", ""]
    report.append(f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"Found {len(tickets)} tickets auto-resolved without proper RCA.")
    report.append("")
    
    # Group by component
    by_component = {}
    for ticket in tickets:
        component = ticket.get("component", "unknown")
        if component not in by_component:
            by_component[component] = []
        by_component[component].append(ticket)
    
    # Generate report by component
    for component, tickets in by_component.items():
        report.append(f"## Component: {component}")
        report.append(f"Total tickets: {len(tickets)}")
        report.append("")
        
        for ticket in tickets:
            report.append(f"* {ticket['id']}: {ticket['title']}")
            report.append(f"  - Resolved: {ticket['resolvedDate']}")
            report.append(f"  - Assignee: {ticket['assignee'] or 'Unassigned'}")
            report.append("")
    
    # Generate commands for updating tickets
    report.append("## How to Add RCA Documentation")
    report.append("")
    report.append("To add RCA documentation to a ticket, use the following command:")
    report.append("```")
    report.append("kaizen comment <ticket-id> --message \"Root Cause Analysis: The issue was caused by...\"")
    report.append("```")
    
    return "\n".join(report)

def send_email_report(report: str, email: str) -> bool:
    """Send email report"""
    if not email:
        return False
        
    try:
        # Create message
        msg = MIMEMultipart()
        msg['Subject'] = 'Weekly Kaizen Ticket RCA Audit'
        msg['From'] = 'kaizen-audit@example.com'
        msg['To'] = email
        
        # Attach report
        msg.attach(MIMEText(report, 'plain'))
        
        # Send email (this is a placeholder - configure actual SMTP server)
        # smtp_server = smtplib.SMTP('smtp.example.com', 587)
        # smtp_server.starttls()
        # smtp_server.login('username', 'password')
        # smtp_server.send_message(msg)
        # smtp_server.quit()
        
        # For now, just log that we would have sent the email
        logger.info(f"Email report would be sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False

def main():
    """Main function to audit tickets"""
    parser = argparse.ArgumentParser(description="Kaizen Resolved Ticket Auditor")
    parser.add_argument('--days', type=int, default=DEFAULT_DAYS, 
                       help=f'Days to look back (default: {DEFAULT_DAYS})')
    parser.add_argument('--email', type=str, help='Email to send report to')
    parser.add_argument('--output', type=str, help='Path to write report file')
    args = parser.parse_args()
    
    # Audit tickets
    tickets_without_rca = audit_tickets(args.days)
    
    if not tickets_without_rca:
        logger.info("No tickets found without RCA. Good job!")
        return
    
    # Generate report
    report = generate_report(tickets_without_rca)
    
    # Output report
    if args.output:
        try:
            with open(args.output, 'w') as f:
                f.write(report)
            logger.info(f"Report written to {args.output}")
        except Exception as e:
            logger.error(f"Error writing report: {e}")
    else:
        print("\n" + report)
    
    # Send email report
    if args.email:
        send_email_report(report, args.email)

if __name__ == "__main__":
    main()
