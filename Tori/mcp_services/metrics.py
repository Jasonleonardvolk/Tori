"""
Prometheus metrics definitions for TORI memory consolidation services.

This module defines all the metrics used across the EpisodicVault, SleepScheduler,
SparsePruner, and KoopmanLearner services, ensuring consistent naming and labeling.
"""

from prometheus_client import Counter, Gauge, Histogram, Summary
import prometheus_client

# Global metric prefix
METRIC_PREFIX = "tori_memory_"

# Common label names
LABEL_SERVICE = "service"
LABEL_OPERATION = "operation"
LABEL_STATUS = "status"
LABEL_SOURCE = "source"
LABEL_PERSONA = "persona"
LABEL_USER = "user"
LABEL_JOB_ID = "job_id"
LABEL_BATCH_ID = "batch_id"

# Common service names
SERVICE_VAULT = "episodic_vault"
SERVICE_SCHEDULER = "sleep_scheduler"
SERVICE_PRUNER = "sparse_pruner"
SERVICE_KCL = "koopman_learner"

# ==============================================================================
# EpisodicVault Metrics
# ==============================================================================

# Counters for operations
VAULT_EPISODES_TOTAL = Counter(
    f"{METRIC_PREFIX}vault_episodes_total",
    "Total number of episodes stored in the vault",
    [LABEL_SOURCE, LABEL_PERSONA, LABEL_USER]
)

VAULT_RETRIEVALS_TOTAL = Counter(
    f"{METRIC_PREFIX}vault_retrievals_total",
    "Total number of episode retrievals",
    [LABEL_SOURCE, LABEL_STATUS]
)

VAULT_PURGED_TOTAL = Counter(
    f"{METRIC_PREFIX}vault_purged_total",
    "Total number of episodes purged due to TTL",
    [LABEL_SOURCE]
)

# Gauges for current state
VAULT_EPISODES_COUNT = Gauge(
    f"{METRIC_PREFIX}vault_episodes_count",
    "Current number of episodes in the vault",
    [LABEL_SOURCE]
)

VAULT_STORAGE_BYTES = Gauge(
    f"{METRIC_PREFIX}vault_storage_bytes",
    "Current storage size in bytes",
)

VAULT_AVG_ENERGY = Gauge(
    f"{METRIC_PREFIX}vault_avg_energy",
    "Average energy level of episodes",
    [LABEL_SOURCE]
)

# Histograms for performance
VAULT_PUT_DURATION = Histogram(
    f"{METRIC_PREFIX}vault_put_duration_seconds",
    "Duration of episode put operations",
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0]
)

VAULT_GET_DURATION = Histogram(
    f"{METRIC_PREFIX}vault_get_duration_seconds",
    "Duration of episode get operations",
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0]
)

# ==============================================================================
# SleepScheduler Metrics
# ==============================================================================

# Counters for operations
SCHEDULER_CONSOL_OPS_TOTAL = Counter(
    f"{METRIC_PREFIX}scheduler_consol_ops_total",
    "Total number of consolidation operations",
    [LABEL_STATUS, LABEL_JOB_ID]
)

SCHEDULER_EPISODES_PROCESSED_TOTAL = Counter(
    f"{METRIC_PREFIX}scheduler_episodes_processed_total",
    "Total number of episodes processed during consolidation",
    [LABEL_JOB_ID]
)

SCHEDULER_DELTAS_EMITTED_TOTAL = Counter(
    f"{METRIC_PREFIX}scheduler_deltas_emitted_total",
    "Total number of concept deltas emitted",
    [LABEL_JOB_ID]
)

# Gauges for current state
SCHEDULER_JOBS_ACTIVE = Gauge(
    f"{METRIC_PREFIX}scheduler_jobs_active",
    "Number of active consolidation jobs"
)

SCHEDULER_CURRENT_TEMP = Gauge(
    f"{METRIC_PREFIX}scheduler_current_temperature",
    "Current temperature in the annealing process",
    [LABEL_JOB_ID]
)

SCHEDULER_CURRENT_ENERGY = Gauge(
    f"{METRIC_PREFIX}scheduler_current_energy",
    "Current energy in the annealing process",
    [LABEL_JOB_ID]
)

SCHEDULER_WEIGHT_SPARSITY = Gauge(
    f"{METRIC_PREFIX}scheduler_weight_sparsity",
    "Sparsity of the weight matrix (percentage of zeros)",
)

# Histograms for performance
SCHEDULER_CONSOLIDATION_DURATION = Histogram(
    f"{METRIC_PREFIX}scheduler_consolidation_duration_seconds",
    "Duration of consolidation jobs",
    buckets=[1.0, 5.0, 10.0, 30.0, 60.0, 300.0, 600.0]
)

SCHEDULER_ENERGY_IMPROVEMENT = Histogram(
    f"{METRIC_PREFIX}scheduler_energy_improvement",
    "Energy improvement from consolidation",
    buckets=[0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0]
)

# ==============================================================================
# SparsePruner Metrics
# ==============================================================================

# Counters for operations
PRUNER_PRUNED_EDGES_TOTAL = Counter(
    f"{METRIC_PREFIX}pruner_pruned_edges_total",
    "Total number of edges pruned",
    [LABEL_JOB_ID]
)

PRUNER_PRUNING_OPS_TOTAL = Counter(
    f"{METRIC_PREFIX}pruner_pruning_ops_total",
    "Total number of pruning operations",
    [LABEL_STATUS, LABEL_JOB_ID]
)

PRUNER_ROLLBACKS_TOTAL = Counter(
    f"{METRIC_PREFIX}pruner_rollbacks_total",
    "Total number of pruning rollbacks",
    [LABEL_JOB_ID]
)

# Gauges for current state
PRUNER_JOBS_ACTIVE = Gauge(
    f"{METRIC_PREFIX}pruner_jobs_active",
    "Number of active pruning jobs"
)

PRUNER_CURRENT_EDGES = Gauge(
    f"{METRIC_PREFIX}pruner_current_edges",
    "Current number of edges in the concept graph"
)

PRUNER_CURRENT_SPARSITY = Gauge(
    f"{METRIC_PREFIX}pruner_current_sparsity",
    "Current edge sparsity in the concept graph"
)

PRUNER_MEMORY_SAVED_BYTES = Gauge(
    f"{METRIC_PREFIX}pruner_memory_saved_bytes",
    "Memory saved by pruning in bytes"
)

# Histograms for performance
PRUNER_PRUNING_DURATION = Histogram(
    f"{METRIC_PREFIX}pruner_pruning_duration_seconds",
    "Duration of pruning jobs",
    buckets=[1.0, 5.0, 10.0, 30.0, 60.0, 300.0, 600.0]
)

PRUNER_QUALITY_IMPACT = Histogram(
    f"{METRIC_PREFIX}pruner_quality_impact",
    "Quality impact of pruning (delta in F1 score)",
    buckets=[-0.5, -0.1, -0.05, -0.01, 0, 0.01, 0.05, 0.1]
)

PRUNER_RETRIEVAL_LATENCY = Histogram(
    f"{METRIC_PREFIX}pruner_retrieval_latency_seconds",
    "Retrieval latency after pruning",
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0]
)

# ==============================================================================
# KoopmanLearner Metrics
# ==============================================================================

# Counters for operations
KCL_TRACES_PROCESSED_TOTAL = Counter(
    f"{METRIC_PREFIX}kcl_traces_processed_total",
    "Total number of activation traces processed",
    [LABEL_SOURCE, LABEL_BATCH_ID]
)

KCL_COUPLING_UPDATES_TOTAL = Counter(
    f"{METRIC_PREFIX}kcl_coupling_updates_total",
    "Total number of oscillator coupling updates",
    [LABEL_BATCH_ID]
)

KCL_MODES_ADDED_TOTAL = Counter(
    f"{METRIC_PREFIX}kcl_modes_added_total",
    "Total number of spectral modes added",
    [LABEL_BATCH_ID]
)

KCL_MODES_DROPPED_TOTAL = Counter(
    f"{METRIC_PREFIX}kcl_modes_dropped_total",
    "Total number of spectral modes dropped",
    [LABEL_BATCH_ID]
)

# Gauges for current state
KCL_JOBS_ACTIVE = Gauge(
    f"{METRIC_PREFIX}kcl_jobs_active",
    "Number of active KCL processing jobs"
)

KCL_CURRENT_MODES = Gauge(
    f"{METRIC_PREFIX}kcl_current_modes",
    "Current number of spectral modes"
)

KCL_SYSTEM_STABILITY = Gauge(
    f"{METRIC_PREFIX}kcl_system_stability",
    "System stability index (-1 to 1)"
)

KCL_MODE_SPARSITY = Gauge(
    f"{METRIC_PREFIX}kcl_mode_sparsity",
    "Average sparsity of spectral modes"
)

KCL_MEMORY_USAGE_BYTES = Gauge(
    f"{METRIC_PREFIX}kcl_memory_usage_bytes",
    "Memory usage of KCL in bytes"
)

# Histograms for performance
KCL_PROCESSING_DURATION = Histogram(
    f"{METRIC_PREFIX}kcl_processing_duration_seconds",
    "Duration of trace processing jobs",
    buckets=[0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0]
)

KCL_PREDICTION_ERROR = Histogram(
    f"{METRIC_PREFIX}kcl_prediction_error",
    "Prediction error using current modes",
    buckets=[0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
)

KCL_PREDICTION_DURATION = Histogram(
    f"{METRIC_PREFIX}kcl_prediction_duration_seconds",
    "Duration of activation prediction operations",
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0]
)

# ==============================================================================
# Helper functions for metric initialization
# ==============================================================================

def initialize_vault_metrics():
    """Initialize EpisodicVault metrics with default values."""
    VAULT_EPISODES_COUNT.labels(source="all").set(0)
    VAULT_STORAGE_BYTES.set(0)
    VAULT_AVG_ENERGY.labels(source="all").set(0)
    
    # Initialize some source-specific counters
    for source in ["conversation", "document", "reasoning", "system"]:
        VAULT_EPISODES_COUNT.labels(source=source).set(0)
        VAULT_AVG_ENERGY.labels(source=source).set(0)

def initialize_scheduler_metrics():
    """Initialize SleepScheduler metrics with default values."""
    SCHEDULER_JOBS_ACTIVE.set(0)
    SCHEDULER_WEIGHT_SPARSITY.set(1.0)  # Start with full sparsity

def initialize_pruner_metrics():
    """Initialize SparsePruner metrics with default values."""
    PRUNER_JOBS_ACTIVE.set(0)
    PRUNER_CURRENT_EDGES.set(0)
    PRUNER_CURRENT_SPARSITY.set(1.0)
    PRUNER_MEMORY_SAVED_BYTES.set(0)

def initialize_kcl_metrics():
    """Initialize KoopmanLearner metrics with default values."""
    KCL_JOBS_ACTIVE.set(0)
    KCL_CURRENT_MODES.set(0)
    KCL_SYSTEM_STABILITY.set(0)
    KCL_MODE_SPARSITY.set(1.0)
    KCL_MEMORY_USAGE_BYTES.set(0)

def start_metrics_server(port=9090):
    """Start a Prometheus metrics server on the specified port."""
    prometheus_client.start_http_server(port)
    print(f"Prometheus metrics server started on port {port}")

def initialize_all_metrics():
    """Initialize all metrics with default values."""
    initialize_vault_metrics()
    initialize_scheduler_metrics()
    initialize_pruner_metrics()
    initialize_kcl_metrics()
