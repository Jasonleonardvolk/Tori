#!/usr/bin/env python3
"""
Kaizen Slack Digest

This script generates and sends a daily digest of Kaizen tickets to Slack,
including open tickets, their SLA status, and recently resolved tickets.

Run as a daily cron job:
0 9 * * * python registry/kaizen/slack_digest.py
"""

import os
import sys
import json
import time
import logging
import requests
import subprocess
import datetime
import argparse
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("slack_digest.log")
    ]
)
logger = logging.getLogger("slack_digest")

# Default Slack webhook URL - override with environment variable
SLACK_WEBHOOK_URL = os.environ.get("KAIZEN_SLACK_WEBHOOK_URL", "")

# SLA time thresholds in hours
SLA_THRESHOLDS = {
    "high": 24,      # 1 day for high severity
    "medium": 72,    # 3 days for medium severity
    "low": 168,      # 7 days for low severity
    "default": 72    # Default SLA if severity is unknown
}

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

def get_tickets(status: str = None, days_ago: int = 7) -> List[Dict[str, Any]]:
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

def calculate_sla_remaining(ticket: Dict[str, Any]) -> float:
    """Calculate remaining SLA time in hours for a ticket"""
    # Get ticket creation time
    created = parse_datetime(ticket.get("createdDate"))
    if not created:
        return 0
    
    # Get ticket severity and determine SLA threshold
    severity = ticket.get("severity", "default").lower()
    sla_hours = SLA_THRESHOLDS.get(severity, SLA_THRESHOLDS["default"])
    
    # Calculate SLA deadline
    deadline = created + datetime.timedelta(hours=sla_hours)
    
    # Calculate remaining time
    now = datetime.datetime.now(tz=created.tzinfo if created.tzinfo else None)
    remaining = deadline - now
    
    # Convert to hours
    return max(0, remaining.total_seconds() / 3600)

def get_sla_emoji(hours_remaining: float) -> str:
    """Get emoji indicator for SLA status"""
    if hours_remaining <= 0:
        return "🔴"  # Red circle for expired SLA
    elif hours_remaining <= 8:
        return "🟠"  # Orange circle for < 8 hours remaining
    elif hours_remaining <= 24:
        return "🟡"  # Yellow circle for < 24 hours remaining
    else:
        return "🟢"  # Green circle for healthy SLA

def get_ticket_url(ticket_id: str) -> str:
    """Generate URL to view ticket (customize based on your system)"""
    # Replace with your ticket URL format
    return f"http://kaizen.example.com/ticket/{ticket_id}"

def format_ticket_text(ticket: Dict[str, Any], include_sla: bool = True) -> str:
    """Format a ticket for Slack message"""
    ticket_id = ticket.get("id", "unknown")
    title = ticket.get("title", "No title")
    severity = ticket.get("severity", "unknown").upper()
    assignee = ticket.get("assignee", "Unassigned")
    component = ticket.get("component", "unknown")
    
    # Format text
    text = f"<{get_ticket_url(ticket_id)}|{ticket_id}>: {title} [{component}] - {severity}"
    
    # Add SLA info if needed
    if include_sla:
        hours_remaining = calculate_sla_remaining(ticket)
        emoji = get_sla_emoji(hours_remaining)
        time_text = f"{int(hours_remaining)}h remaining" if hours_remaining > 0 else "EXPIRED"
        text = f"{emoji} {text} - SLA: {time_text}"
    
    # Add assignee
    text += f" - Assigned to: {assignee}"
    
    return text

def generate_slack_blocks(open_tickets: List[Dict[str, Any]], 
                         resolved_tickets: List[Dict[str, Any]]) -> List[Dict]:
    """Generate Slack message blocks"""
    # Group tickets by component
    open_by_component = {}
    for ticket in open_tickets:
        component = ticket.get("component", "unknown")
        if component not in open_by_component:
            open_by_component[component] = []
        open_by_component[component].append(ticket)
    
    # Sort tickets within each component by SLA remaining
    for component, tickets in open_by_component.items():
        open_by_component[component] = sorted(
            tickets, 
            key=lambda t: calculate_sla_remaining(t)
        )
    
    # Create header
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "📋 Kaizen Ticket Digest",
                "emoji": True
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*{len(open_tickets)}* open tickets, *{len(resolved_tickets)}* recently resolved"
            }
        },
        {
            "type": "divider"
        }
    ]
    
    # Add open tickets by component
    if open_tickets:
        blocks.append({
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "Open Tickets",
                "emoji": True
            }
        })
        
        for component, tickets in open_by_component.items():
            # Add component header
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Component: {component}* - {len(tickets)} tickets"
                }
            })
            
            # Add tickets
            for ticket in tickets:
                blocks.append({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": format_ticket_text(ticket)
                    }
                })
            
            # Add divider between components
            blocks.append({
                "type": "divider"
            })
    
    # Add recently resolved tickets
    if resolved_tickets:
        blocks.append({
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "Recently Resolved",
                "emoji": True
            }
        })
        
        for ticket in resolved_tickets[:5]:  # Limit to 5 most recent
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": format_ticket_text(ticket, include_sla=False)
                }
            })
    
    # Add footer
    blocks.append({
        "type": "context",
        "elements": [
            {
                "type": "mrkdwn",
                "text": f"Generated at {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} • <http://kaizen.example.com|View All Tickets> • <http://kaizen.example.com/rss|RSS Feed>"
            }
        ]
    })
    
    return blocks

def send_slack_message(blocks: List[Dict], webhook_url: str) -> bool:
    """Send message to Slack using webhook"""
    if not webhook_url:
        logger.error("No Slack webhook URL provided")
        return False
        
    try:
        payload = {
            "blocks": blocks
        }
        
        response = requests.post(
            webhook_url,
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            logger.info("Successfully sent digest to Slack")
            return True
        else:
            logger.error(f"Failed to send to Slack: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending to Slack: {e}")
        return False

def generate_rss_feed(open_tickets: List[Dict[str, Any]], 
                     resolved_tickets: List[Dict[str, Any]],
                     output_file: str) -> bool:
    """Generate RSS feed of Kaizen tickets"""
    try:
        # Combine tickets and sort by date
        all_tickets = []
        for ticket in open_tickets:
            all_tickets.append({
                "id": ticket.get("id", "unknown"),
                "title": ticket.get("title", "No title"),
                "description": ticket.get("description", ""),
                "status": "open",
                "date": ticket.get("createdDate", ""),
                "link": get_ticket_url(ticket.get("id", "unknown"))
            })
            
        for ticket in resolved_tickets:
            all_tickets.append({
                "id": ticket.get("id", "unknown"),
                "title": ticket.get("title", "No title"),
                "description": ticket.get("description", ""),
                "status": "resolved",
                "date": ticket.get("resolvedDate", ""),
                "link": get_ticket_url(ticket.get("id", "unknown"))
            })
        
        # Sort by date (newest first)
        all_tickets.sort(key=lambda t: t["date"] or "", reverse=True)
        
        # Generate RSS XML
        rss = [
            '<?xml version="1.0" encoding="UTF-8" ?>',
            '<rss version="2.0">',
            '<channel>',
            '<title>Kaizen Ticket Digest</title>',
            '<description>Latest Kaizen tickets and updates</description>',
            '<link>http://kaizen.example.com</link>',
            f'<lastBuildDate>{datetime.datetime.now().strftime("%a, %d %b %Y %H:%M:%S %z")}</lastBuildDate>'
        ]
        
        for ticket in all_tickets:
            # Format date for RSS
            try:
                if ticket["date"]:
                    date_obj = parse_datetime(ticket["date"])
                    if date_obj:
                        formatted_date = date_obj.strftime("%a, %d %b %Y %H:%M:%S %z")
                    else:
                        formatted_date = ""
                else:
                    formatted_date = ""
            except:
                formatted_date = ""
            
            # Add item
            rss.extend([
                '<item>',
                f'<title>{ticket["id"]}: {ticket["title"]} ({ticket["status"].upper()})</title>',
                f'<description><![CDATA[{ticket["description"]}]]></description>',
                f'<link>{ticket["link"]}</link>',
                f'<guid>{ticket["link"]}</guid>',
                f'<pubDate>{formatted_date}</pubDate>',
                '</item>'
            ])
        
        rss.extend([
            '</channel>',
            '</rss>'
        ])
        
        # Write to file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(rss))
            
        logger.info(f"Successfully generated RSS feed: {output_file}")
        return True
        
    except Exception as e:
        logger.error(f"Error generating RSS feed: {e}")
        return False

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Kaizen Slack Digest")
    parser.add_argument('--webhook', type=str, default=SLACK_WEBHOOK_URL, 
                       help='Slack webhook URL')
    parser.add_argument('--rss', type=str, default="", 
                       help='Path to output RSS feed file')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Generate digest but do not send to Slack')
    parser.add_argument('--force', action='store_true',
                       help='Force sending digest even if no tickets')
    args = parser.parse_args()
    
    logger.info("Starting Kaizen Slack digest")
    
    # Get tickets
    open_tickets = get_tickets(status="open")
    resolved_tickets = get_tickets(status="resolved", days_ago=2)  # Last 2 days
    
    # Skip digest on quiet days unless forced
    if len(open_tickets) == 0 and len(resolved_tickets) == 0 and not args.force:
        logger.info("No tickets to report, skipping digest")
        return
    
    # Generate Slack blocks
    blocks = generate_slack_blocks(open_tickets, resolved_tickets)
    
    # Generate RSS feed if requested
    if args.rss:
        generate_rss_feed(open_tickets, resolved_tickets, args.rss)
    
    # If dry run, just print the blocks
    if args.dry_run:
        print(json.dumps(blocks, indent=2))
        return
    
    # Send to Slack
    if args.webhook:
        send_slack_message(blocks, args.webhook)
    else:
        logger.warning("No webhook URL provided. Use --webhook to specify URL.")
        print(json.dumps(blocks, indent=2))

if __name__ == "__main__":
    main()
