#!/usr/bin/env python3
"""
Kaizen CLI Tool

Command-line interface for creating and managing Kaizen tickets for the TORI platform.
"""

import os
import sys
import json
import yaml
import time
import logging
import argparse
import datetime
import subprocess
from typing import Dict, List, Optional, Any
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("kaizen-cli")

# Constants
KAIZEN_ROOT = Path(__file__).parent.absolute()
SCHEMAS_DIR = KAIZEN_ROOT / "schemas"
COMPONENTS_DIR = KAIZEN_ROOT / "components"
TICKET_SCHEMA_PATH = SCHEMAS_DIR / "ticket.yml"
COMPONENT_SCHEMA_PATH = SCHEMAS_DIR / "component.yml"


def load_yaml(path: Path) -> Dict[str, Any]:
    """Load YAML file."""
    try:
        with open(path, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        logger.error(f"Error loading YAML from {path}: {e}")
        sys.exit(1)


def save_yaml(data: Dict[str, Any], path: Path) -> None:
    """Save data to YAML file."""
    try:
        os.makedirs(path.parent, exist_ok=True)
        with open(path, 'w') as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)
        logger.info(f"Saved YAML to {path}")
    except Exception as e:
        logger.error(f"Error saving YAML to {path}: {e}")
        sys.exit(1)


def get_next_ticket_id() -> str:
    """Get next available Kaizen ticket ID."""
    # Find all existing ticket directories
    ticket_dirs = [d for d in KAIZEN_ROOT.glob("KAIZ-*") if d.is_dir()]
    
    # Extract ticket numbers
    ticket_numbers = []
    for d in ticket_dirs:
        try:
            number = int(d.name.split("-")[1])
            ticket_numbers.append(number)
        except (IndexError, ValueError):
            continue
    
    # Find next available number
    next_number = 1
    if ticket_numbers:
        next_number = max(ticket_numbers) + 1
    
    return f"KAIZ-{next_number:03d}"


def list_components() -> List[str]:
    """List all available components."""
    components = []
    for path in COMPONENTS_DIR.glob("*.yml"):
        try:
            data = load_yaml(path)
            name = data.get("name", path.stem)
            components.append(f"{path.stem}: {name}")
        except Exception:
            components.append(f"{path.stem}: [Error loading component]")
    
    return sorted(components)


def create_ticket(args: argparse.Namespace) -> None:
    """Create a new Kaizen ticket."""
    title = args.title
    component_id = args.component
    
    # Check if component exists
    component_path = COMPONENTS_DIR / f"{component_id}.yml"
    if not component_path.exists():
        logger.error(f"Component '{component_id}' not found.")
        print("Available components:")
        for comp in list_components():
            print(f"  {comp}")
        sys.exit(1)
    
    # Load component details
    component = load_yaml(component_path)
    
    # Generate ticket ID
    ticket_id = get_next_ticket_id()
    
    # Create ticket directory
    ticket_dir = KAIZEN_ROOT / ticket_id
    os.makedirs(ticket_dir, exist_ok=True)
    
    # Create ticket file
    severity = args.severity or "medium"
    owner = args.owner or component.get("owner", "unknown")
    
    ticket_data = {
        "id": ticket_id,
        "title": title,
        "component": component_id,
        "owner": owner,
        "severity": severity,
        "objective": args.objective or "TBD",
        "success_criteria": args.success_criteria.split(";") if args.success_criteria else ["TBD"],
        "abort_criteria": args.abort_criteria.split(";") if args.abort_criteria else [],
        "rollback_plan": args.rollback_plan or component.get("rollback_plan", "TBD"),
        "status": "draft",
        "created_at": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "updated_at": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    
    # Create Kaizen-Tkt.yml
    ticket_path = ticket_dir / "Kaizen-Tkt.yml"
    save_yaml(ticket_data, ticket_path)
    
    # Create Patch-Spec.md
    patch_spec_path = ticket_dir / "Patch-Spec.md"
    patch_spec_content = f"""# {ticket_id}: {title}

## Summary

TODO: Provide a brief summary of the changes

## Components Modified

TODO: List all components modified by this change

## Configuration Changes

TODO: List all configuration changes

## Technical Changes

TODO: Describe the technical changes made

## Benchmark Results

TODO: List benchmark results before and after changes

## Rollback Procedure

TODO: Document the rollback procedure

## Future Improvements

TODO: List potential future improvements
"""
    
    try:
        with open(patch_spec_path, 'w') as f:
            f.write(patch_spec_content)
        logger.info(f"Created Patch-Spec.md template at {patch_spec_path}")
    except Exception as e:
        logger.error(f"Error creating Patch-Spec.md: {e}")
    
    # Create Score-card.json
    scorecard_path = ticket_dir / "Score-card.json"
    scorecard_content = {
        "id": ticket_id,
        "title": title,
        "component": component_id,
        "owner": owner,
        "scores": {
            "latency": None,
            "throughput": None,
            "reliability": None,
            "memory": None,
            "cpu": None
        },
        "metrics": {},
        "test_results": {},
        "updated_at": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    
    try:
        with open(scorecard_path, 'w') as f:
            json.dump(scorecard_content, f, indent=2)
        logger.info(f"Created Score-card.json template at {scorecard_path}")
    except Exception as e:
        logger.error(f"Error creating Score-card.json: {e}")
    
    # Open the ticket in the editor if requested
    if args.edit:
        editor = os.environ.get("EDITOR", "code")
        try:
            subprocess.run([editor, str(ticket_dir)])
        except Exception as e:
            logger.error(f"Error opening editor: {e}")
    
    logger.info(f"Created Kaizen ticket: {ticket_id} - {title}")
    logger.info(f"Location: {ticket_dir}")


def list_tickets(args: argparse.Namespace) -> None:
    """List all Kaizen tickets."""
    status_filter = args.status
    component_filter = args.component
    
    tickets = []
    for ticket_dir in KAIZEN_ROOT.glob("KAIZ-*"):
        if not ticket_dir.is_dir():
            continue
        
        ticket_path = ticket_dir / "Kaizen-Tkt.yml"
        if not ticket_path.exists():
            continue
        
        try:
            ticket = load_yaml(ticket_path)
            
            # Apply filters
            if status_filter and ticket.get("status") != status_filter:
                continue
            if component_filter and ticket.get("component") != component_filter:
                continue
            
            tickets.append({
                "id": ticket.get("id", ticket_dir.name),
                "title": ticket.get("title", "Untitled"),
                "component": ticket.get("component", "Unknown"),
                "owner": ticket.get("owner", "Unknown"),
                "status": ticket.get("status", "draft"),
                "severity": ticket.get("severity", "medium"),
                "updated_at": ticket.get("updated_at", "Unknown")
            })
        except Exception as e:
            logger.error(f"Error loading ticket {ticket_dir.name}: {e}")
    
    # Sort by ID
    tickets.sort(key=lambda t: t["id"])
    
    # Print table header
    print(f"{'ID':<10} {'Title':<40} {'Component':<15} {'Owner':<15} {'Status':<12} {'Severity':<10}")
    print("-" * 100)
    
    # Print tickets
    for ticket in tickets:
        print(f"{ticket['id']:<10} {ticket['title'][:37] + '...' if len(ticket['title']) > 37 else ticket['title']:<40} "
              f"{ticket['component']:<15} {ticket['owner']:<15} {ticket['status']:<12} {ticket['severity']:<10}")


def show_ticket(args: argparse.Namespace) -> None:
    """Show details of a specific Kaizen ticket."""
    ticket_id = args.id
    
    # Find ticket directory
    ticket_dir = KAIZEN_ROOT / ticket_id
    if not ticket_dir.exists() or not ticket_dir.is_dir():
        logger.error(f"Ticket {ticket_id} not found.")
        sys.exit(1)
    
    # Load ticket data
    ticket_path = ticket_dir / "Kaizen-Tkt.yml"
    if not ticket_path.exists():
        logger.error(f"Ticket file for {ticket_id} not found.")
        sys.exit(1)
    
    ticket = load_yaml(ticket_path)
    
    # Print ticket details
    print(f"# {ticket.get('id', ticket_id)}: {ticket.get('title', 'Untitled')}")
    print()
    print(f"Component: {ticket.get('component', 'Unknown')}")
    print(f"Owner: {ticket.get('owner', 'Unknown')}")
    print(f"Status: {ticket.get('status', 'draft')}")
    print(f"Severity: {ticket.get('severity', 'medium')}")
    print()
    print(f"Objective: {ticket.get('objective', 'TBD')}")
    print()
    
    print("Success Criteria:")
    for criteria in ticket.get("success_criteria", ["TBD"]):
        print(f"  - {criteria}")
    
    if ticket.get("abort_criteria"):
        print("\nAbort Criteria:")
        for criteria in ticket.get("abort_criteria", []):
            print(f"  - {criteria}")
    
    print(f"\nRollback Plan: {ticket.get('rollback_plan', 'TBD')}")
    
    if ticket.get("links"):
        print("\nLinks:")
        for key, value in ticket.get("links", {}).items():
            print(f"  {key}: {value}")
    
    print(f"\nCreated: {ticket.get('created_at', 'Unknown')}")
    print(f"Updated: {ticket.get('updated_at', 'Unknown')}")
    
    # Check if there's a Promotion-Log
    promotion_log_path = ticket_dir / "Promotion-Log"
    if promotion_log_path.exists():
        print("\nPromotion Log:")
        try:
            with open(promotion_log_path, 'r') as f:
                for line in f:
                    print(f"  {line.strip()}")
        except Exception as e:
            print(f"  Error reading promotion log: {e}")


def update_ticket(args: argparse.Namespace) -> None:
    """Update a Kaizen ticket."""
    ticket_id = args.id
    
    # Find ticket directory
    ticket_dir = KAIZEN_ROOT / ticket_id
    if not ticket_dir.exists() or not ticket_dir.is_dir():
        logger.error(f"Ticket {ticket_id} not found.")
        sys.exit(1)
    
    # Load ticket data
    ticket_path = ticket_dir / "Kaizen-Tkt.yml"
    if not ticket_path.exists():
        logger.error(f"Ticket file for {ticket_id} not found.")
        sys.exit(1)
    
    ticket = load_yaml(ticket_path)
    
    # Update fields
    if args.title:
        ticket["title"] = args.title
    
    if args.status:
        ticket["status"] = args.status
    
    if args.owner:
        ticket["owner"] = args.owner
    
    if args.severity:
        ticket["severity"] = args.severity
    
    if args.objective:
        ticket["objective"] = args.objective
    
    if args.success_criteria:
        ticket["success_criteria"] = args.success_criteria.split(";")
    
    if args.abort_criteria:
        ticket["abort_criteria"] = args.abort_criteria.split(";")
    
    if args.rollback_plan:
        ticket["rollback_plan"] = args.rollback_plan
    
    # Update timestamp
    ticket["updated_at"] = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Save updated ticket
    save_yaml(ticket, ticket_path)
    
    # Add to promotion log if status changed
    if args.status:
        promotion_log_path = ticket_dir / "Promotion-Log"
        try:
            with open(promotion_log_path, 'a+') as f:
                f.write(f"{datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')} - Status changed to: {args.status} by CLI\n")
            logger.info(f"Updated promotion log.")
        except Exception as e:
            logger.error(f"Error updating promotion log: {e}")
    
    logger.info(f"Updated ticket: {ticket_id}")


def create_component(args: argparse.Namespace) -> None:
    """Create a new component definition."""
    component_id = args.id
    name = args.name
    tier = args.tier
    owner = args.owner
    rollback_plan = args.rollback_plan
    
    # Check if component already exists
    component_path = COMPONENTS_DIR / f"{component_id}.yml"
    if component_path.exists():
        logger.error(f"Component '{component_id}' already exists.")
        sys.exit(1)
    
    # Create component data
    component_data = {
        "id": component_id,
        "name": name,
        "tier": tier,
        "owner": owner,
        "slo": {
            "metrics": []
        },
        "rollback_plan": rollback_plan
    }
    
    # Save component
    os.makedirs(COMPONENTS_DIR, exist_ok=True)
    save_yaml(component_data, component_path)
    
    logger.info(f"Created component: {component_id} - {name}")
    logger.info(f"Location: {component_path}")


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Kaizen CLI Tool")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Create ticket command
    create_parser = subparsers.add_parser("new", help="Create a new Kaizen ticket")
    create_parser.add_argument("title", help="Ticket title")
    create_parser.add_argument("--component", "-c", required=True, help="Component ID")
    create_parser.add_argument("--owner", "-o", help="Ticket owner (defaults to component owner)")
    create_parser.add_argument("--severity", "-s", choices=["critical", "high", "medium", "low"], help="Ticket severity")
    create_parser.add_argument("--objective", help="Ticket objective")
    create_parser.add_argument("--success-criteria", help="Success criteria (semicolon-separated)")
    create_parser.add_argument("--abort-criteria", help="Abort criteria (semicolon-separated)")
    create_parser.add_argument("--rollback-plan", help="Rollback plan")
    create_parser.add_argument("--edit", "-e", action="store_true", help="Open ticket in editor after creation")
    create_parser.set_defaults(func=create_ticket)
    
    # List tickets command
    list_parser = subparsers.add_parser("list", help="List Kaizen tickets")
    list_parser.add_argument("--status", "-s", help="Filter by status")
    list_parser.add_argument("--component", "-c", help="Filter by component")
    list_parser.set_defaults(func=list_tickets)
    
    # Show ticket command
    show_parser = subparsers.add_parser("show", help="Show Kaizen ticket details")
    show_parser.add_argument("id", help="Ticket ID")
    show_parser.set_defaults(func=show_ticket)
    
    # Update ticket command
    update_parser = subparsers.add_parser("update", help="Update a Kaizen ticket")
    update_parser.add_argument("id", help="Ticket ID")
    update_parser.add_argument("--title", "-t", help="Update title")
    update_parser.add_argument("--status", "-s", help="Update status")
    update_parser.add_argument("--owner", "-o", help="Update owner")
    update_parser.add_argument("--severity", help="Update severity")
    update_parser.add_argument("--objective", help="Update objective")
    update_parser.add_argument("--success-criteria", help="Update success criteria (semicolon-separated)")
    update_parser.add_argument("--abort-criteria", help="Update abort criteria (semicolon-separated)")
    update_parser.add_argument("--rollback-plan", help="Update rollback plan")
    update_parser.set_defaults(func=update_ticket)
    
    # Create component command
    comp_parser = subparsers.add_parser("component", help="Create a new component")
    comp_parser.add_argument("id", help="Component ID")
    comp_parser.add_argument("--name", "-n", required=True, help="Component name")
    comp_parser.add_argument("--tier", "-t", type=int, required=True, choices=[0, 1, 2, 3], help="Component tier (0-3)")
    comp_parser.add_argument("--owner", "-o", required=True, help="Component owner")
    comp_parser.add_argument("--rollback-plan", "-r", required=True, help="Default rollback plan")
    comp_parser.set_defaults(func=create_component)
    
    # Components list command
    comp_list_parser = subparsers.add_parser("components", help="List available components")
    comp_list_parser.set_defaults(func=lambda _: print("\n".join(list_components())))
    
    # Parse arguments
    args = parser.parse_args()
    
    # Check if a command was provided
    if not hasattr(args, "func"):
        parser.print_help()
        sys.exit(1)
    
    # Execute command
    args.func(args)


if __name__ == "__main__":
    main()
