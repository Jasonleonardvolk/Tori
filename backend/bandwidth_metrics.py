#!/usr/bin/env python3
"""
Bandwidth Metrics Collector

This module tracks cumulative bandwidth metrics for the Delta Protocol,
allowing for long-term analysis of bandwidth savings and optimization ROI.

Usage:
    from bandwidth_metrics import log_bandwidth_metrics, get_savings_report

    # Log a delta packet transmission
    log_bandwidth_metrics(
        delta_size=1024,       # Size of delta packet in bytes
        full_state_size=8192,  # Size of full state in bytes
        build_hash="abc123"    # Build hash for version tracking
    )

    # Get cumulative savings report
    report = get_savings_report()
"""

import os
import json
import time
import datetime
import logging
from typing import Dict, Any, List, Optional
from prometheus_client import Counter, Gauge

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bandwidth_metrics")

# Constants
METRICS_FILE = "bandwidth_metrics.json"
SNAPSHOT_DIR = "bandwidth_snapshots"

# Initialize Prometheus metrics
delta_bytes_sent = Counter('delta_bytes_sent_total', 'Total bytes sent with delta protocol', 
                         ['build_hash'])
full_bytes_equivalent = Counter('full_bytes_equivalent_total', 
                              'Bytes that would have been sent without delta protocol', 
                              ['build_hash'])
bytes_saved = Counter('delta_bytes_saved_total', 'Bytes saved by using delta protocol', 
                    ['build_hash'])
compression_ratio = Gauge('delta_compression_ratio', 'Ratio of delta size to full state size', 
                        ['build_hash', 'window'])

# Ensure snapshot directory exists
os.makedirs(SNAPSHOT_DIR, exist_ok=True)

def load_metrics() -> Dict[str, Any]:
    """Load existing metrics from file"""
    try:
        if os.path.exists(METRICS_FILE):
            with open(METRICS_FILE, 'r') as f:
                return json.load(f)
        else:
            return {
                "start_time": time.time(),
                "delta_bytes_total": 0,
                "full_bytes_total": 0,
                "packets_total": 0,
                "by_build": {},
                "hourly": [],
                "daily": [],
                "last_snapshot": 0
            }
    except Exception as e:
        logger.error(f"Error loading metrics: {e}")
        return {
            "start_time": time.time(),
            "delta_bytes_total": 0,
            "full_bytes_total": 0,
            "packets_total": 0,
            "by_build": {},
            "hourly": [],
            "daily": [],
            "last_snapshot": 0
        }

def save_metrics(metrics: Dict[str, Any]) -> bool:
    """Save metrics to file"""
    try:
        with open(METRICS_FILE, 'w') as f:
            json.dump(metrics, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving metrics: {e}")
        return False

def log_bandwidth_metrics(delta_size: int, full_state_size: int, build_hash: str = "unknown") -> bool:
    """
    Log bandwidth metrics for a delta packet transmission.
    
    Args:
        delta_size: Size of the delta packet in bytes
        full_state_size: Size of full state in bytes (if sent without delta)
        build_hash: Build hash for version tracking
        
    Returns:
        True if metrics were logged successfully, False otherwise
    """
    # Load existing metrics
    metrics = load_metrics()
    
    # Update counters
    metrics["delta_bytes_total"] += delta_size
    metrics["full_bytes_total"] += full_state_size
    metrics["packets_total"] += 1
    
    # Update build-specific counters
    if build_hash not in metrics["by_build"]:
        metrics["by_build"][build_hash] = {
            "delta_bytes": 0,
            "full_bytes": 0,
            "packets": 0,
            "first_seen": time.time()
        }
    
    metrics["by_build"][build_hash]["delta_bytes"] += delta_size
    metrics["by_build"][build_hash]["full_bytes"] += full_state_size
    metrics["by_build"][build_hash]["packets"] += 1
    
    # Update Prometheus metrics
    delta_bytes_sent.labels(build_hash=build_hash).inc(delta_size)
    full_bytes_equivalent.labels(build_hash=build_hash).inc(full_state_size)
    saved = full_state_size - delta_size
    if saved > 0:
        bytes_saved.labels(build_hash=build_hash).inc(saved)
    
    # Update compression ratio
    if full_state_size > 0:
        ratio = delta_size / full_state_size
        compression_ratio.labels(build_hash=build_hash, window="current").set(ratio)
    
    # Check if we need to create a snapshot
    now = time.time()
    if now - metrics["last_snapshot"] >= 3600:  # 1 hour
        create_hourly_snapshot(metrics)
        metrics["last_snapshot"] = now
    
    # Save updated metrics
    return save_metrics(metrics)

def create_hourly_snapshot(metrics: Dict[str, Any]) -> None:
    """Create an hourly snapshot of bandwidth metrics"""
    now = time.time()
    
    # Create snapshot entry
    snapshot = {
        "timestamp": now,
        "delta_bytes_total": metrics["delta_bytes_total"],
        "full_bytes_total": metrics["full_bytes_total"],
        "packets_total": metrics["packets_total"],
        "savings_bytes": metrics["full_bytes_total"] - metrics["delta_bytes_total"],
        "compression_ratio": metrics["delta_bytes_total"] / metrics["full_bytes_total"] if metrics["full_bytes_total"] > 0 else 1.0
    }
    
    # Add to hourly metrics
    metrics["hourly"].append(snapshot)
    
    # Keep only the last 48 hours of hourly data
    if len(metrics["hourly"]) > 48:
        metrics["hourly"] = metrics["hourly"][-48:]
    
    # Check if we need to create a daily snapshot
    midnight = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
    if len(metrics["daily"]) == 0 or metrics["daily"][-1]["timestamp"] < midnight:
        # Create daily snapshot
        daily_snapshot = snapshot.copy()
        daily_snapshot["day"] = datetime.datetime.now().strftime("%Y-%m-%d")
        metrics["daily"].append(daily_snapshot)
        
        # Keep only the last 90 days
        if len(metrics["daily"]) > 90:
            metrics["daily"] = metrics["daily"][-90:]
        
        # Create a permanent snapshot file
        try:
            snapshot_file = os.path.join(SNAPSHOT_DIR, f"bandwidth_{daily_snapshot['day']}.json")
            with open(snapshot_file, 'w') as f:
                json.dump(daily_snapshot, f, indent=2)
        except Exception as e:
            logger.error(f"Error creating snapshot file: {e}")

def get_savings_report(days: int = 7) -> Dict[str, Any]:
    """
    Get a report on bandwidth savings over time.
    
    Args:
        days: Number of days to include in the report
        
    Returns:
        Dictionary with savings statistics
    """
    metrics = load_metrics()
    
    # Calculate overall savings
    total_savings = metrics["full_bytes_total"] - metrics["delta_bytes_total"]
    savings_percent = (total_savings / metrics["full_bytes_total"] * 100) if metrics["full_bytes_total"] > 0 else 0
    
    # Format human-readable sizes
    def format_size(size_bytes):
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024**2:
            return f"{size_bytes/1024:.2f} KB"
        elif size_bytes < 1024**3:
            return f"{size_bytes/1024**2:.2f} MB"
        else:
            return f"{size_bytes/1024**3:.2f} GB"
    
    # Create report
    report = {
        "summary": {
            "total_savings_bytes": total_savings,
            "total_savings_formatted": format_size(total_savings),
            "savings_percent": f"{savings_percent:.2f}%",
            "compression_ratio": metrics["delta_bytes_total"] / metrics["full_bytes_total"] if metrics["full_bytes_total"] > 0 else 1.0,
            "start_date": datetime.datetime.fromtimestamp(metrics["start_time"]).strftime("%Y-%m-%d"),
            "days_tracked": int((time.time() - metrics["start_time"]) / 86400)
        },
        "by_build": {}
    }
    
    # Add build-specific stats
    for build, data in metrics["by_build"].items():
        build_savings = data["full_bytes"] - data["delta_bytes"]
        build_percent = (build_savings / data["full_bytes"] * 100) if data["full_bytes"] > 0 else 0
        
        report["by_build"][build] = {
            "savings_bytes": build_savings,
            "savings_formatted": format_size(build_savings),
            "savings_percent": f"{build_percent:.2f}%",
            "compression_ratio": data["delta_bytes"] / data["full_bytes"] if data["full_bytes"] > 0 else 1.0,
            "first_seen": datetime.datetime.fromtimestamp(data["first_seen"]).strftime("%Y-%m-%d %H:%M:%S")
        }
    
    # Add recent stats based on requested days
    now = time.time()
    cutoff = now - (days * 86400)
    
    recent_data = [entry for entry in metrics["daily"] if entry["timestamp"] >= cutoff]
    if recent_data:
        recent_delta = sum(entry["delta_bytes_total"] for entry in recent_data)
        recent_full = sum(entry["full_bytes_total"] for entry in recent_data)
        recent_savings = recent_full - recent_delta
        recent_percent = (recent_savings / recent_full * 100) if recent_full > 0 else 0
        
        report[f"last_{days}_days"] = {
            "savings_bytes": recent_savings,
            "savings_formatted": format_size(recent_savings),
            "savings_percent": f"{recent_percent:.2f}%",
            "compression_ratio": recent_delta / recent_full if recent_full > 0 else 1.0,
            "days_count": len(recent_data)
        }
    
    return report

def create_metrics_visualizations() -> Dict[str, List[Dict[str, Any]]]:
    """
    Create data for visualizing metrics trends.
    
    Returns:
        Dictionary with data series for different visualization types
    """
    metrics = load_metrics()
    
    # Create time series for charts
    time_series = {
        "compression_ratio": [],
        "daily_savings": [],
        "cumulative_savings": []
    }
    
    # Process daily data
    cumulative_savings = 0
    for entry in metrics["daily"]:
        # Format timestamp for charts
        day = datetime.datetime.fromtimestamp(entry["timestamp"]).strftime("%Y-%m-%d")
        
        # Compression ratio
        time_series["compression_ratio"].append({
            "date": day,
            "value": entry["compression_ratio"]
        })
        
        # Daily savings
        daily_savings = entry["full_bytes_total"] - entry["delta_bytes_total"]
        time_series["daily_savings"].append({
            "date": day,
            "bytes": daily_savings,
            "megabytes": daily_savings / 1024**2
        })
        
        # Cumulative savings
        cumulative_savings += daily_savings
        time_series["cumulative_savings"].append({
            "date": day,
            "bytes": cumulative_savings,
            "megabytes": cumulative_savings / 1024**2
        })
    
    return time_series

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "report":
        days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
        report = get_savings_report(days)
        print(json.dumps(report, indent=2))
    else:
        print("Usage: python bandwidth_metrics.py report [days]")
