"""
Prometheus metrics for the iTori Platform backend.

This module defines the metrics that are exposed to Prometheus for monitoring.
"""

from prometheus_client import Counter, Gauge, Histogram

# Spectral coherence metrics
chi_value = Gauge('chi_value', 'Current coherence value', ['app'])

# Cluster alerts metrics  
cluster_alert_total = Counter('cluster_alert_total', 'Number of cluster alerts', ['severity'])

# Forecast metrics
forecast_confidence_interval = Gauge('forecast_confidence_interval', 'Width of PCA 95% CI')

# Performance metrics
request_latency = Histogram('request_latency_seconds', 'Request latency in seconds', 
                           ['endpoint'])

# Phase-related metrics
phase_value = Gauge('phase_value', 'Current phase value', ['agent_id', 'build_hash'])
phase_velocity = Gauge('phase_velocity', 'Phase velocity in rad/s', ['agent_id', 'build_hash'])
phase_drift = Gauge('phase_drift', 'Phase drift from mean in radians', ['agent_id', 'build_hash'])
phase_sync_total = Counter('phase_sync_total', 'Number of phase sync events', ['agent_id', 'build_hash'])
phase_dispersion = Gauge('phase_dispersion', 'Phase dispersion across agents', ['build_hash'])
phase_stddev_5m = Gauge('phase_stddev_5m', '5-minute rolling standard deviation of phase', ['agent_id', 'build_hash'])
phase_stability_index = Gauge('phase_stability_index', 'Stability index based on phase variance over time', ['build_hash'])

# Lyapunov stability metrics
lyapunov_alarm_total = Counter('lyapunov_alarm_total', 'Number of Lyapunov stability alarms', 
                              ['component', 'severity', 'build_hash'])
lyapunov_derivative = Gauge('lyapunov_derivative', 'Lyapunov function derivative (V̇)', 
                           ['component', 'build_hash'])
lyapunov_alarm_state = Gauge('lyapunov_alarm_state', 'Current state of Lyapunov alarm (1=alarming, 0=normal)', 
                            ['component', 'severity', 'build_hash'])

# Delta protocol metrics
delta_packet_total = Counter('delta_packet_total', 'Number of delta packets sent', ['build_hash'])
delta_resync_total = Counter('delta_resync_total', 'Number of delta protocol resyncs', ['build_hash'])
delta_bandwidth_bytes = Gauge('delta_bandwidth_bytes', 'Delta protocol bandwidth usage in bytes/s', ['build_hash'])
delta_full_ratio = Gauge('delta_full_ratio', 'Ratio of delta size to full state size', ['build_hash'])
delta_state_size_bytes = Gauge('delta_state_size_bytes', 'Size of state in bytes', ['type', 'build_hash'])

# Initialize with default values
chi_value.labels(app='chat').set(1.0)
