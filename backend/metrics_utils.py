"""
Metrics Utilities for Prometheus Integration

This module provides utilities for Prometheus metrics collection and export
across all TORI backend components.
"""

import time
import logging
from typing import Dict, List, Optional, Union, Callable, Any
from dataclasses import dataclass, field

# Configure logging
logger = logging.getLogger("tori.metrics")

# Metric types
COUNTER = "counter"
GAUGE = "gauge"
HISTOGRAM = "histogram"
SUMMARY = "summary"

@dataclass
class MetricDefinition:
    """Definition of a Prometheus metric."""
    name: str
    type: str
    description: str
    labels: List[str] = field(default_factory=list)
    buckets: List[float] = field(default_factory=list)  # For histograms
    percentiles: List[float] = field(default_factory=list)  # For summaries


class PrometheusRegistry:
    """
    Simple Prometheus metrics registry.
    
    This class provides a lightweight alternative to the full prometheus_client
    library, allowing for metrics collection without the external dependency.
    """
    
    def __init__(self):
        """Initialize the registry."""
        self.metrics: Dict[str, Dict[str, Any]] = {}
        self.definitions: Dict[str, MetricDefinition] = {}
        self._start_time = time.time()
        
    def register(self, definition: MetricDefinition) -> None:
        """
        Register a new metric.
        
        Args:
            definition: Metric definition
        """
        if definition.name in self.definitions:
            logger.warning(f"Metric {definition.name} already registered, skipping")
            return
            
        self.definitions[definition.name] = definition
        self.metrics[definition.name] = {}
        
        # Initialize special metrics
        if definition.type == HISTOGRAM:
            # Initialize buckets
            for label_values in self._get_label_combinations(definition.labels):
                labels_key = self._labels_to_key(definition.labels, label_values)
                self.metrics[definition.name][labels_key] = {
                    "count": 0,
                    "sum": 0,
                    "buckets": {b: 0 for b in definition.buckets}
                }
        elif definition.type == SUMMARY:
            # Initialize percentiles
            for label_values in self._get_label_combinations(definition.labels):
                labels_key = self._labels_to_key(definition.labels, label_values)
                self.metrics[definition.name][labels_key] = {
                    "count": 0,
                    "sum": 0,
                    "values": []
                }
    
    def counter(self, name: str, value: float = 1, labels: Dict[str, str] = None) -> None:
        """
        Increment a counter.
        
        Args:
            name: Metric name
            value: Amount to increment by
            labels: Label values
        """
        self._check_registered(name, COUNTER)
        
        labels_key = self._labels_to_key(
            self.definitions[name].labels, 
            {k: v for k, v in (labels or {}).items() if k in self.definitions[name].labels}
        )
        
        if labels_key not in self.metrics[name]:
            self.metrics[name][labels_key] = 0
            
        self.metrics[name][labels_key] += value
    
    def gauge(self, name: str, value: float, labels: Dict[str, str] = None) -> None:
        """
        Set a gauge value.
        
        Args:
            name: Metric name
            value: New value
            labels: Label values
        """
        self._check_registered(name, GAUGE)
        
        labels_key = self._labels_to_key(
            self.definitions[name].labels, 
            {k: v for k, v in (labels or {}).items() if k in self.definitions[name].labels}
        )
        
        self.metrics[name][labels_key] = value
    
    def histogram(self, name: str, value: float, labels: Dict[str, str] = None) -> None:
        """
        Observe a value for a histogram.
        
        Args:
            name: Metric name
            value: Observed value
            labels: Label values
        """
        self._check_registered(name, HISTOGRAM)
        
        definition = self.definitions[name]
        labels_key = self._labels_to_key(
            definition.labels, 
            {k: v for k, v in (labels or {}).items() if k in definition.labels}
        )
        
        if labels_key not in self.metrics[name]:
            self.metrics[name][labels_key] = {
                "count": 0,
                "sum": 0,
                "buckets": {b: 0 for b in definition.buckets}
            }
            
        # Update count and sum
        self.metrics[name][labels_key]["count"] += 1
        self.metrics[name][labels_key]["sum"] += value
        
        # Update buckets
        for bucket in definition.buckets:
            if value <= bucket:
                self.metrics[name][labels_key]["buckets"][bucket] += 1
    
    def summary(self, name: str, value: float, labels: Dict[str, str] = None, 
                max_samples: int = 1000) -> None:
        """
        Observe a value for a summary.
        
        Args:
            name: Metric name
            value: Observed value
            labels: Label values
            max_samples: Maximum samples to keep
        """
        self._check_registered(name, SUMMARY)
        
        definition = self.definitions[name]
        labels_key = self._labels_to_key(
            definition.labels, 
            {k: v for k, v in (labels or {}).items() if k in definition.labels}
        )
        
        if labels_key not in self.metrics[name]:
            self.metrics[name][labels_key] = {
                "count": 0,
                "sum": 0,
                "values": []
            }
            
        # Update count and sum
        self.metrics[name][labels_key]["count"] += 1
        self.metrics[name][labels_key]["sum"] += value
        
        # Update values (sliding window)
        self.metrics[name][labels_key]["values"].append(value)
        if len(self.metrics[name][labels_key]["values"]) > max_samples:
            self.metrics[name][labels_key]["values"].pop(0)
    
    def format_text(self) -> str:
        """
        Format metrics as Prometheus text format.
        
        Returns:
            Prometheus-compatible metrics text
        """
        lines = []
        
        # Process all metrics
        for name, definition in self.definitions.items():
            # Add metric header
            lines.append(f"# HELP {name} {definition.description}")
            lines.append(f"# TYPE {name} {definition.type}")
            
            if definition.type == COUNTER or definition.type == GAUGE:
                # Simple metrics
                for labels_key, value in self.metrics[name].items():
                    label_str = self._format_labels(labels_key)
                    lines.append(f"{name}{label_str} {value}")
                    
            elif definition.type == HISTOGRAM:
                # Histogram metrics
                for labels_key, data in self.metrics[name].items():
                    base_label_str = self._format_labels(labels_key)
                    
                    # Bucket lines
                    for bucket, count in data["buckets"].items():
                        bucket_label = f'{base_label_str[:-1]},le="{bucket}"}' if base_label_str else '{le="' + str(bucket) + '"}'
                        lines.append(f"{name}_bucket{bucket_label} {count}")
                    
                    # Add infinity bucket
                    inf_label = f'{base_label_str[:-1]},le="+Inf"}' if base_label_str else '{le="+Inf"}'
                    lines.append(f"{name}_bucket{inf_label} {data['count']}")
                    
                    # Sum and count
                    lines.append(f"{name}_sum{base_label_str} {data['sum']}")
                    lines.append(f"{name}_count{base_label_str} {data['count']}")
                    
            elif definition.type == SUMMARY:
                # Summary metrics
                for labels_key, data in self.metrics[name].items():
                    base_label_str = self._format_labels(labels_key)
                    
                    # Calculate quantiles
                    if data["values"]:
                        sorted_values = sorted(data["values"])
                        for quantile in definition.percentiles:
                            idx = int(len(sorted_values) * quantile)
                            value = sorted_values[idx]
                            quantile_label = f'{base_label_str[:-1]},quantile="{quantile}"}' if base_label_str else '{quantile="' + str(quantile) + '"}'
                            lines.append(f"{name}{quantile_label} {value}")
                    
                    # Sum and count
                    lines.append(f"{name}_sum{base_label_str} {data['sum']}")
                    lines.append(f"{name}_count{base_label_str} {data['count']}")
        
        # Add process info
        uptime = time.time() - self._start_time
        lines.append(f"# HELP process_uptime_seconds Time since process start in seconds")
        lines.append(f"# TYPE process_uptime_seconds gauge")
        lines.append(f"process_uptime_seconds {uptime}")
        
        return "\n".join(lines)
    
    def _check_registered(self, name: str, expected_type: str) -> None:
        """
        Check if a metric is registered with the correct type.
        
        Args:
            name: Metric name
            expected_type: Expected metric type
        
        Raises:
            ValueError: If the metric is not registered or has the wrong type
        """
        if name not in self.definitions:
            raise ValueError(f"Metric {name} not registered")
            
        if self.definitions[name].type != expected_type:
            raise ValueError(f"Metric {name} is a {self.definitions[name].type}, not a {expected_type}")
    
    def _labels_to_key(self, label_names: List[str], label_values: Dict[str, str]) -> str:
        """
        Convert label names and values to a key for the metrics dict.
        
        Args:
            label_names: Label names
            label_values: Label values
            
        Returns:
            String key
        """
        if not label_names:
            return ""
            
        parts = []
        for label in label_names:
            value = str(label_values.get(label, ""))
            parts.append(f"{label}={value}")
            
        return ";".join(parts)
    
    def _format_labels(self, labels_key: str) -> str:
        """
        Format labels for Prometheus text output.
        
        Args:
            labels_key: Labels key from _labels_to_key
            
        Returns:
            Formatted labels string
        """
        if not labels_key:
            return ""
            
        parts = []
        for part in labels_key.split(";"):
            if "=" in part:
                name, value = part.split("=", 1)
                parts.append(f'{name}="{value}"')
                
        return f'{{{",".join(parts)}}}' if parts else ""
    
    def _get_label_combinations(self, label_names: List[str]) -> List[Dict[str, str]]:
        """
        Get empty label combinations for initialization.
        
        This is a simple implementation that just returns an empty dict,
        which will create a single metric without labels.
        
        Args:
            label_names: Label names
            
        Returns:
            List of label value dictionaries
        """
        # For now, just return an empty set of labels
        return [{}]


# Create a global registry instance
registry = PrometheusRegistry()


# Convenience functions
def register_counter(name: str, description: str, labels: List[str] = None) -> None:
    """Register a counter metric."""
    registry.register(MetricDefinition(
        name=name,
        type=COUNTER,
        description=description,
        labels=labels or []
    ))


def register_gauge(name: str, description: str, labels: List[str] = None) -> None:
    """Register a gauge metric."""
    registry.register(MetricDefinition(
        name=name,
        type=GAUGE,
        description=description,
        labels=labels or []
    ))


def register_histogram(name: str, description: str, buckets: List[float], 
                      labels: List[str] = None) -> None:
    """Register a histogram metric."""
    registry.register(MetricDefinition(
        name=name,
        type=HISTOGRAM,
        description=description,
        buckets=buckets,
        labels=labels or []
    ))


def register_summary(name: str, description: str, percentiles: List[float], 
                    labels: List[str] = None) -> None:
    """Register a summary metric."""
    registry.register(MetricDefinition(
        name=name,
        type=SUMMARY,
        description=description,
        percentiles=percentiles,
        labels=labels or []
    ))


def inc_counter(name: str, value: float = 1, labels: Dict[str, str] = None) -> None:
    """Increment a counter metric."""
    registry.counter(name, value, labels)


def set_gauge(name: str, value: float, labels: Dict[str, str] = None) -> None:
    """Set a gauge metric."""
    registry.gauge(name, value, labels)


def observe_histogram(name: str, value: float, labels: Dict[str, str] = None) -> None:
    """Observe a value for a histogram metric."""
    registry.histogram(name, value, labels)


def observe_summary(name: str, value: float, labels: Dict[str, str] = None) -> None:
    """Observe a value for a summary metric."""
    registry.summary(name, value, labels)


def get_metrics_text() -> str:
    """Get metrics formatted as Prometheus text."""
    return registry.format_text()


# Timer context manager for instrumenting code blocks
class Timer:
    """Context manager for timing code blocks."""
    
    def __init__(self, metric_name: str, labels: Dict[str, str] = None):
        """
        Initialize timer.
        
        Args:
            metric_name: Name of the histogram metric to record time
            labels: Label values
        """
        self.metric_name = metric_name
        self.labels = labels
        self.start_time = None
        
    def __enter__(self):
        """Start timer."""
        self.start_time = time.time()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Stop timer and record elapsed time."""
        if self.start_time is not None:
            elapsed = time.time() - self.start_time
            observe_histogram(self.metric_name, elapsed, self.labels)
