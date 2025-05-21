# Predictive Coherence Analysis System

## Overview

The Predictive Coherence Analysis (PCA) system provides time-series forecasting of spectral coherence metrics, enabling early detection of potential stability issues before they become critical. The system implements both simple trend-based forecasting and more sophisticated statistical models to predict future coherence states with confidence intervals.

## Features

- **Level-0 Forecasting**: Simple linear trend + EWMA (Exponential Weighted Moving Average)
- **Level-1 Forecasting**: ARIMA/Holt-Winters models with confidence intervals
- **WebSocket-based Real-time Updates**: Live forecasts pushed to connected clients
- **REST API**: Access to forecast data and historical metrics
- **React Integration**: React hook and components for UI integration
- **Configurable Thresholds**: Environment variable controls for all parameters

## Architecture

The PCA system consists of the following components:

1. **Data Collection**: Spectral metrics are captured and stored in parquet files
2. **Forecast Engine**: Time-series analysis of historical data
3. **WebSocket Server**: Broadcasts forecast updates to clients
4. **REST API**: Provides HTTP access to forecast data
5. **Frontend Integration**: React hook and UI components

## Components

### Backend

- `trend_forecast.py`: Core forecasting engine
- `forecast_loop.py`: Background service for periodic forecasts and broadcasts
- `coherence.py`: FastAPI routes for REST access

### Frontend

- `useCoherenceForecast.js`: React hook for accessing forecast data
- `CoherenceRibbon`: UI component showing forecast status

## Configuration

The system is configured through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SPECTRAL_HISTORY_PATH` | Path for storing spectral data | `./spectral_history` |
| `SPECTRAL_HISTORY_WINDOW` | Number of historical points to analyze | `288` (24 hours at 5min intervals) |
| `SPECTRAL_FORECAST_HORIZON` | Number of future points to forecast | `72` (6 hours at 5min intervals) |
| `SPECTRAL_EWMA_ALPHA` | EWMA smoothing factor | `0.3` |
| `SPECTRAL_COHERENCE_THRESHOLD` | Threshold for coherence concern | `0.4` |
| `SPECTRAL_CONFIDENCE_LEVEL` | Confidence level for intervals | `0.95` |
| `SPECTRAL_FORECAST_INTERVAL` | Seconds between forecast runs | `30` |
| `SPECTRAL_FULL_FORECAST_INTERVAL` | Seconds between full refreshes | `300` |
| `SPECTRAL_FORECAST_WS_URI` | WebSocket URI for the forecast service | `ws://localhost:8000/ws/spectral_forecast` |
| `SPECTRAL_AUTOSTART_FORECAST` | Whether to auto-start the service | `true` |
| `SPECTRAL_ENABLE_AUTO_GATING` | Enable auto-response to critical forecasts | `false` |

## Installation

### Backend Setup

1. Ensure you have the required Python packages:
   ```bash
   pip install pandas numpy statsmodels fastapi websockets
   ```

2. Make sure the spectral history directory exists:
   ```bash
   mkdir -p ./spectral_history
   ```

3. Start the backend server which includes the forecast service:
   ```bash
   cd backend
   python main.py
   ```

### Frontend Integration

1. Import the hook in your React component:
   ```javascript
   import useCoherenceForecast from '../../hooks/useCoherenceForecast';
   ```

2. Use the hook in your component:
   ```javascript
   const { forecast, status, isConnected } = useCoherenceForecast();
   ```

3. Add the CoherenceRibbon component to your UI:
   ```javascript
   import CoherenceRibbon from '../components/CoherenceRibbon/CoherenceRibbon';
   
   // In your render method:
   <CoherenceRibbon />
   ```

## Forecast Data Format

The forecast data follows this structure:

```javascript
{
  timestamp: "2025-05-18T21:30:00.000Z",
  metrics: {
    coherence: {
      metric: "coherence",
      forecast: [
        {
          step: 1,
          value: 0.82,
          lower: 0.75,  // Confidence interval lower bound
          upper: 0.89   // Confidence interval upper bound
        },
        // Additional forecast points
      ],
      trend: 0.001,  // Positive means improving, negative means deteriorating
      crosses_threshold: false,
      time_to_threshold: null
    },
    // Other metrics like orderParameter, eigenvalueGap
  },
  assessment: {
    status: "stable",  // 'stable', 'warning', or 'critical'
    message: "System coherence appears stable",
    time_to_warning: null,
    time_to_critical: null
  }
}
```

## API Endpoints

### GET /api/coherence/forecast

Get the latest coherence forecast.

Query parameters:
- `metrics` (optional): Comma-separated list of metrics to include
- `refresh` (optional): Force a refresh of the forecast

### GET /api/coherence/history

Get historical coherence data.

Query parameters:
- `days` (optional): Number of days of history to return (default: 1)
- `interval` (optional): Resampling interval (default: '5min')

### GET /api/coherence/state

Get the latest spectral state.

## WebSocket Protocol

The forecast system broadcasts updates over WebSocket:

```javascript
{
  type: 'coherence_forecast',
  data: {
    // Forecast data as described above
  }
}
```

To request an immediate forecast refresh, send:

```javascript
{
  kind: 'custom_request',
  payload: {
    type: 'refresh_forecast',
    action: 'refresh_forecast'
  }
}
```

## Implementation Details

### Level-0 Forecasting

The Level-0 forecasting implements:

1. **Linear Trend**: Simple least-squares regression line
2. **EWMA**: Exponential Weighted Moving Average with configurable alpha

This provides a computationally lightweight baseline forecast.

### Level-1 Forecasting

The Level-1 forecasting uses:

1. **SARIMAX**: For coherence and orderParameter metrics
2. **Exponential Smoothing**: For other metrics and as fallback

The Level-1 models detect seasonality patterns and provide confidence intervals for predictions.

## Future Enhancements

1. **Distributed Computation**: Partition large concept graphs for parallel processing
2. **Advanced ML Models**: Incorporate deep learning for complex pattern recognition
3. **Concept Cluster Analysis**: Forecast stability within concept subgroups
4. **Automatic Remediation**: Implement automated responses to critical forecasts

## Troubleshooting

### Missing Forecast Data

If no forecast data is being generated:
- Check that the spectral history directory exists and has parquet files
- Verify the WebSocket connection is established
- Check backend logs for any errors in the forecasting process

### High Resource Usage

If the forecasting process is using excessive resources:
- Reduce the history window or forecast horizon
- Disable Level-1 forecasting in resource-constrained environments
- Increase the forecast interval to reduce update frequency

## References

- Time Series Forecasting Documentation: [statsmodels.org](https://www.statsmodels.org/stable/tsa.html)
- React Hooks Documentation: [reactjs.org](https://reactjs.org/docs/hooks-intro.html)
- FastAPI Documentation: [fastapi.tiangolo.com](https://fastapi.tiangolo.com/)
