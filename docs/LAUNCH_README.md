# TORI Chat v1.0 Launch – May 19 2025

## Overview

This document covers the launch details for TORI Chat v1.0, which includes the new Predictive Coherence Analysis (PCA) system and Concept Cluster Stability Analysis features. These features provide early detection of potential stability issues and concept cluster bifurcations.

## Runtime Flags

The following environment variables can be modified to tune the system behavior:

| Flag | Default | Description |
|------|---------|-------------|
| `PCA_INTERVAL_SEC` | `5` | Seconds between forecast updates |
| `FORECAST_HORIZON` | `6` | Number of steps to forecast ahead (multiplied by PCA_INTERVAL_SEC) |
| `CLUSTER_CHI_THRESH` | `0.45` | Coherence threshold for cluster warnings |
| `CLUSTER_STAB_THRESH` | `0.15` | Stability threshold for cluster warnings |
| `PCA_EWMA_ALPHA` | `0.3` | EWMA smoothing factor (higher = more reactive) |
| `DISABLE_CLUSTER_ALERTS` | `0` | Emergency kill switch for cluster alerts (set to 1 to disable) |
| `SPECTRAL_HISTORY_WINDOW` | `288` | Number of historical data points to analyze (24 hours at 5min intervals) |
| `CLUSTER_STABILITY_ENABLED` | `true` | Enable/disable cluster stability analysis |
| `SPECTRAL_ENABLE_AUTO_GATING` | `false` | Enable automatic response to critical forecasts |

## Prometheus Metrics

The following metrics are exposed for monitoring:

| Metric | Type | Description |
|--------|------|-------------|
| `chi_value{app="chat"}` | Gauge | Current coherence value |
| `cluster_alert_total{severity="warning"}` | Counter | Number of cluster alerts by severity |
| `forecast_confidence_interval` | Gauge | Width of PCA 95% confidence interval |

## First-Week Tuning

Follow this schedule to optimize the system based on real-world data:

1. **Day 1** – Adjust `PCA_EWMA_ALPHA` if confidence band > 0.2 for >30 min
   - Lower alpha (e.g., 0.2) for more stability if predictions are too reactive
   - Increase alpha (e.g., 0.4) if the system is slow to detect changes

2. **Day 3** – Review `chi_value` trend and adjust thresholds
   - Raise `CLUSTER_CHI_THRESH` if experiencing false alerts
   - Check alert logs for patterns of false positives

3. **Day 7** – Set permanent thresholds and rotate data
   - Finalize all threshold values based on first week's data
   - Rotate parquet files into weekly bucket for long-term storage
   - Review full week's performance metrics

## Smoke Tests

Before launch, run these validation tests:

| Test | Command | Expected Result |
|------|---------|-----------------|
| Unit Tests | `pytest -q test_cluster_stability.py` | All tests pass |
| API | `curl http://localhost:8000/api/coherence/forecast` | 200 OK with forecast data |
| WebSocket | `wscat -c ws://localhost:8000/ws` | Receives CLUSTER_ALERT messages |
| UI | Run simulate_desync.py | Ribbon UI updates within 10s |
| Data Persistence | Check spectral_history/*.parquet | Files contain expected columns |

## Troubleshooting

### Common Issues

1. **No alerts generated**
   - Check `DISABLE_CLUSTER_ALERTS` is not set to 1
   - Verify WebSocket connection is established
   - Check logs for NetworkX or forecast engine errors

2. **High resource usage**
   - Reduce `SPECTRAL_HISTORY_WINDOW` to analyze less historical data
   - Increase `PCA_INTERVAL_SEC` to reduce update frequency
   - Check for memory leaks in the forecast loop

3. **False positives**
   - Increase `CLUSTER_CHI_THRESH` and `CLUSTER_STAB_THRESH`
   - Check coherence calculation in the spectral monitor
   - Review community detection quality in logs

## Emergency Controls

In case of problematic behavior:

1. Set `DISABLE_CLUSTER_ALERTS=1` to immediately stop all cluster alerts
2. Restart the service with `SPECTRAL_AUTOSTART_FORECAST=false` to disable forecasting
3. Contact the data engineering team if persistent issues occur

## Contact Information

For urgent issues, contact:
- Ops: TBD
- Engineering: TBD
- Data Engineering: TBD
