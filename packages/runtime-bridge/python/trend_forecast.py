"""
Trend forecasting for spectral coherence metrics.

This module implements time-series forecasting for spectral metrics,
providing early warning of potential coherence degradation.

It includes:
- Level-0: Linear trend + EWMA for simple forecasting
- Level-1: ARIMA / Holt-Winters for more sophisticated forecasting with 
  confidence intervals
"""

import os
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Union, Any
from datetime import datetime, timedelta
import logging
from pathlib import Path
import warnings

# Conditionally import statsmodels - only needed for Level-1 forecasting
try:
    import statsmodels.api as sm
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False
    warnings.warn("statsmodels not available, Level-1 forecasting disabled")

# Configure logger
logger = logging.getLogger("trend_forecast")

# Default forecast parameters (can be overridden via environment variables)
DEFAULT_HISTORY_WINDOW = 24 * 12  # 24 hours at 5-minute intervals
DEFAULT_FORECAST_HORIZON = 12 * 6  # 6 hours at 5-minute intervals
DEFAULT_EWMA_ALPHA = float(os.getenv("PCA_EWMA_ALPHA", "0.3"))  # Exponential weighted moving average smoothing factor
DEFAULT_COHERENCE_THRESHOLD = 0.4  # Threshold below which coherence is concerning
DEFAULT_CONFIDENCE_LEVEL = 0.95  # Confidence level for prediction intervals

# Key metrics to forecast
FORECAST_METRICS = [
    'coherence',         # Overall spectral coherence
    'orderParameter',    # Phase synchronization measure
    'eigenvalueGap'      # Gap between first and second eigenvalues (stability indicator)
]

class SpectralForecast:
    """Forecast engine for spectral coherence metrics."""
    
    def __init__(self, 
                 history_path: str = './spectral_history',
                 use_level1: bool = True,
                 params: Optional[Dict[str, Any]] = None):
        """
        Initialize the forecast engine.
        
        Args:
            history_path: Path to directory with spectral history parquet files
            use_level1: Whether to use Level-1 (ARIMA/Holt-Winters) forecasting
            params: Optional parameters to override defaults
        """
        self.history_path = Path(history_path)
        self.use_level1 = use_level1 and STATSMODELS_AVAILABLE
        
        # Load parameters from environment or use defaults
        self.params = params or {}
        self.history_window = int(os.environ.get('SPECTRAL_HISTORY_WINDOW', 
                                                 self.params.get('history_window', DEFAULT_HISTORY_WINDOW)))
        self.forecast_horizon = int(os.environ.get('SPECTRAL_FORECAST_HORIZON',
                                                  self.params.get('forecast_horizon', DEFAULT_FORECAST_HORIZON)))
        self.ewma_alpha = float(os.environ.get('SPECTRAL_EWMA_ALPHA',
                                              self.params.get('ewma_alpha', DEFAULT_EWMA_ALPHA)))
        self.coherence_threshold = float(os.environ.get('SPECTRAL_COHERENCE_THRESHOLD',
                                                       self.params.get('coherence_threshold', DEFAULT_COHERENCE_THRESHOLD)))
        self.confidence_level = float(os.environ.get('SPECTRAL_CONFIDENCE_LEVEL',
                                                    self.params.get('confidence_level', DEFAULT_CONFIDENCE_LEVEL)))
        
        # Cache for loaded data and models
        self.history_cache = None
        self.history_cache_timestamp = None
        self.models = {}
        
        logger.info(f"Initialized SpectralForecast with window={self.history_window}, "
                   f"horizon={self.forecast_horizon}, level1={self.use_level1}")
    
    def load_history(self, force_reload: bool = False) -> pd.DataFrame:
        """
        Load spectral history from parquet files.
        
        Args:
            force_reload: Whether to force reload even if cache is fresh
            
        Returns:
            DataFrame with spectral history
        """
        # Check if cache is still valid
        now = datetime.now()
        if (not force_reload and 
            self.history_cache is not None and 
            self.history_cache_timestamp is not None and
            (now - self.history_cache_timestamp) < timedelta(minutes=5)):
            return self.history_cache
        
        # Load data from parquet files
        logger.info(f"Loading spectral history from {self.history_path}")
        
        # List all parquet files in history directory
        parquet_files = sorted(self.history_path.glob('*.parquet'))
        
        # Load and concatenate recent files to get desired history window
        dfs = []
        remaining_rows = self.history_window
        
        for pq_file in reversed(parquet_files):  # Start with most recent
            if remaining_rows <= 0:
                break
                
            try:
                df = pd.read_parquet(pq_file)
                dfs.append(df.tail(remaining_rows))
                remaining_rows -= len(df)
            except Exception as e:
                logger.error(f"Error loading {pq_file}: {e}")
        
        if not dfs:
            logger.warning("No spectral history found, returning empty DataFrame")
            self.history_cache = pd.DataFrame(columns=['timestamp'] + FORECAST_METRICS)
            self.history_cache_timestamp = now
            return self.history_cache
        
        # Combine all dataframes and sort by timestamp
        history = pd.concat(dfs, ignore_index=True)
        history = history.sort_values('timestamp').reset_index(drop=True)
        
        # Ensure we have all required columns, add eigenvalueGap if needed
        if 'eigenvalues' in history.columns and 'eigenvalueGap' not in history.columns:
            # Extract first two eigenvalues from eigenvalues list and compute gap
            history['eigenvalueGap'] = history['eigenvalues'].apply(
                lambda x: x[0] - x[1] if isinstance(x, list) and len(x) >= 2 else None
            )
        
        # Only keep the columns we need
        keep_cols = ['timestamp'] + [m for m in FORECAST_METRICS if m in history.columns]
        history = history[keep_cols]
        
        # Update cache
        self.history_cache = history
        self.history_cache_timestamp = now
        
        logger.info(f"Loaded {len(history)} historical data points")
        return history
    
    def forecast_level0(self, metric: str, history: pd.DataFrame) -> Dict[str, Any]:
        """
        Level-0 forecasting: Linear trend + EWMA.
        
        Args:
            metric: Name of metric to forecast
            history: DataFrame with historical data
            
        Returns:
            Dictionary with forecast results
        """
        if metric not in history.columns or history.empty:
            logger.warning(f"Cannot forecast {metric}: no data available")
            return {
                'metric': metric,
                'forecast': [],
                'trend': 0,
                'ewma': None,
                'crosses_threshold': False,
                'time_to_threshold': None
            }
        
        # Extract data points
        y = history[metric].values
        t = np.arange(len(y))
        
        # Calculate linear trend
        if len(y) >= 2:
            slope, intercept = np.polyfit(t, y, 1)
        else:
            slope, intercept = 0, y[0] if len(y) > 0 else 0
        
        # Calculate EWMA (Exponential Weighted Moving Average)
        if len(y) > 0:
            ewma = y[-1]  # Start with last known value
        else:
            ewma = None
        
        # Generate forecast points
        forecast = []
        crosses_threshold = False
        time_to_threshold = None
        
        for i in range(1, self.forecast_horizon + 1):
            # Linear trend forecast
            t_i = len(y) + i - 1
            y_pred = intercept + slope * t_i
            
            # Update EWMA forecast
            if ewma is not None:
                ewma = self.ewma_alpha * y_pred + (1 - self.ewma_alpha) * ewma
            
            # Check if forecast crosses threshold (only for coherence)
            if metric == 'coherence' and y_pred < self.coherence_threshold and not crosses_threshold:
                crosses_threshold = True
                time_to_threshold = i
            
            forecast.append({
                'step': i,
                'value': y_pred,
                'ewma': ewma,
                'lower': None,  # No confidence intervals in Level-0
                'upper': None
            })
        
        return {
            'metric': metric,
            'forecast': forecast,
            'trend': slope,
            'ewma': ewma,
            'crosses_threshold': crosses_threshold,
            'time_to_threshold': time_to_threshold
        }
    
    def forecast_level1(self, metric: str, history: pd.DataFrame) -> Dict[str, Any]:
        """
        Level-1 forecasting: ARIMA/Holt-Winters with confidence intervals.
        
        Args:
            metric: Name of metric to forecast
            history: DataFrame with historical data
            
        Returns:
            Dictionary with forecast results including confidence intervals
        """
        if not STATSMODELS_AVAILABLE:
            logger.warning("statsmodels not available, falling back to Level-0")
            return self.forecast_level0(metric, history)
        
        if metric not in history.columns or len(history) < 10:  # Need enough data
            logger.warning(f"Cannot forecast {metric} with Level-1: insufficient data")
            return self.forecast_level0(metric, history)
        
        try:
            # Prepare time series data
            ts = history[metric].dropna()
            if len(ts) < 10:
                return self.forecast_level0(metric, history)
            
            # Check if we have a cached model
            model_key = f"{metric}_{len(ts)}"
            if model_key in self.models:
                model = self.models[model_key]
            else:
                # Detect seasonality - check for daily patterns (288 points = 24h at 5min intervals)
                seasonality = 288 if len(ts) >= 576 else 1  # Need at least 2 days of data
                
                # Create and fit model - either SARIMAX or ExponentialSmoothing
                if metric == 'coherence' or metric == 'orderParameter':
                    # These metrics benefit from SARIMAX for better handling of trends
                    try:
                        model = SARIMAX(
                            ts,
                            order=(1, 1, 1),
                            seasonal_order=(1, 0, 1, seasonality) if seasonality > 1 else (0, 0, 0, 0),
                            enforce_stationarity=False
                        )
                        model = model.fit(disp=False)
                    except Exception as e:
                        logger.warning(f"SARIMAX failed for {metric}, falling back to ExponentialSmoothing: {e}")
                        # Fall back to simpler model
                        model = ExponentialSmoothing(
                            ts,
                            trend='add',
                            seasonal='add' if seasonality > 1 else None,
                            seasonal_periods=seasonality if seasonality > 1 else None
                        )
                        model = model.fit()
                else:
                    # Simpler Holt-Winters for other metrics
                    model = ExponentialSmoothing(
                        ts,
                        trend='add',
                        seasonal='add' if seasonality > 1 else None,
                        seasonal_periods=seasonality if seasonality > 1 else None
                    )
                    model = model.fit()
                
                # Cache the model
                self.models[model_key] = model
            
            # Generate forecast with confidence intervals
            alpha = 1 - self.confidence_level
            forecast_result = model.get_forecast(steps=self.forecast_horizon)
            
            # For SARIMAX, we get prediction intervals; for ExponentialSmoothing we simulate them
            if hasattr(forecast_result, 'conf_int'):
                # SARIMAX
                conf_int = forecast_result.conf_int(alpha=alpha)
                pred_mean = forecast_result.predicted_mean
                
                lower = conf_int.iloc[:, 0].values
                upper = conf_int.iloc[:, 1].values
                predictions = pred_mean.values
            else:
                # ExponentialSmoothing - approximate confidence intervals
                predictions = forecast_result
                
                # Estimate prediction variance based on historical errors
                pred_variance = np.var(ts - model.fittedvalues)
                z_value = 1.96  # ~95% confidence
                
                # Calculate intervals
                std_error = np.sqrt(pred_variance)
                lower = predictions - z_value * std_error
                upper = predictions + z_value * std_error
            
            # Check if forecast crosses threshold
            crosses_threshold = False
            time_to_threshold = None
            
            if metric == 'coherence':
                for i, pred in enumerate(predictions):
                    if pred < self.coherence_threshold:
                        crosses_threshold = True
                        time_to_threshold = i + 1
                        break
            
            # Format results
            forecast = []
            for i in range(self.forecast_horizon):
                forecast.append({
                    'step': i + 1,
                    'value': float(predictions[i]),
                    'lower': float(lower[i]),
                    'upper': float(upper[i]),
                    'ewma': None  # No EWMA in Level-1
                })
            
            return {
                'metric': metric,
                'forecast': forecast,
                'model_type': type(model).__name__,
                'crosses_threshold': crosses_threshold,
                'time_to_threshold': time_to_threshold
            }
            
        except Exception as e:
            logger.error(f"Error in Level-1 forecast for {metric}: {e}")
            logger.info("Falling back to Level-0 forecast")
            return self.forecast_level0(metric, history)
    
    def forecast(self, metrics: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Generate forecasts for specified metrics.
        
        Args:
            metrics: List of metrics to forecast, or None for all metrics
            
        Returns:
            Dictionary with forecast results for each metric
        """
        if metrics is None:
            metrics = FORECAST_METRICS
        
        # Load historical data
        history = self.load_history()
        
        # Generate forecasts for each metric
        results = {}
        for metric in metrics:
            if self.use_level1:
                results[metric] = self.forecast_level1(metric, history)
            else:
                results[metric] = self.forecast_level0(metric, history)
        
        # Generate overall assessment
        assessment = self._assess_forecasts(results)
        
        # Return complete results
        return {
            'timestamp': datetime.now().isoformat(),
            'metrics': results,
            'assessment': assessment
        }
    
    def _assess_forecasts(self, forecast_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate overall assessment of forecast results.
        
        Args:
            forecast_results: Dictionary with forecast results
            
        Returns:
            Assessment dictionary
        """
        # Default assessment
        assessment = {
            'status': 'stable',  # stable, warning, critical
            'message': 'System coherence appears stable',
            'time_to_warning': None,
            'time_to_critical': None
        }
        
        # Check coherence forecast if available
        if 'coherence' in forecast_results:
            coherence = forecast_results['coherence']
            
            if coherence.get('crosses_threshold', False):
                time_to_threshold = coherence.get('time_to_threshold')
                
                if time_to_threshold is not None:
                    # Determine severity based on time to threshold
                    if time_to_threshold <= 6:  # Within 30 minutes (6 steps at 5min)
                        assessment['status'] = 'critical'
                        assessment['message'] = f'Critical: Coherence projected to drop below threshold in {time_to_threshold * 5} minutes'
                        assessment['time_to_critical'] = time_to_threshold
                    elif time_to_threshold <= 24:  # Within 2 hours
                        assessment['status'] = 'warning'
                        assessment['message'] = f'Warning: Coherence projected to drop below threshold in {time_to_threshold * 5} minutes'
                        assessment['time_to_warning'] = time_to_threshold
        
        # Check eigenvalue gap if available
        if 'eigenvalueGap' in forecast_results:
            gap = forecast_results['eigenvalueGap']
            
            # Detect rapidly narrowing gap (indicator of instability)
            if 'trend' in gap and gap['trend'] < -0.01:  # Negative trend
                if assessment['status'] == 'stable':
                    assessment['status'] = 'warning'
                    assessment['message'] = 'Warning: Eigenvalue gap is narrowing rapidly'
        
        return assessment

# Helper function to get a pre-configured forecaster
def get_forecaster(history_path: str = None, use_level1: bool = True) -> SpectralForecast:
    """
    Get a pre-configured forecaster instance.
    
    Args:
        history_path: Path to spectral history directory or None for default
        use_level1: Whether to use Level-1 forecasting if available
        
    Returns:
        SpectralForecast instance
    """
    # Get path from environment if not provided
    if history_path is None:
        history_path = os.environ.get(
            'SPECTRAL_HISTORY_PATH', 
            './spectral_history'
        )
    
    # Create and return forecaster
    return SpectralForecast(
        history_path=history_path,
        use_level1=use_level1
    )

# Default forecaster instance for easy import
default_forecaster = get_forecaster()

if __name__ == "__main__":
    # Simple CLI for testing
    import json
    
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Create forecaster
    forecaster = get_forecaster()
    
    # Generate and print forecast
    forecast = forecaster.forecast()
    print(json.dumps(forecast, indent=2))
