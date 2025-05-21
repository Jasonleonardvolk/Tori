"""
SARIMAX Forecast Model Trainer

This script trains a SARIMAX model for coherence time series forecasting.
It runs as a scheduled job to periodically update the forecast model.
"""

import os
import sys
import time
import pickle
import logging
import argparse
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("sarimax-trainer")

# Try to import statsmodels, installing if necessary
try:
    import statsmodels.api as sm
except ImportError:
    logger.info("Installing statsmodels...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "statsmodels"])
    import statsmodels.api as sm

# Default configuration
DEFAULT_DATA_PATH = os.path.join('data', 'spectral_history.parquet')
DEFAULT_MODEL_PATH = os.path.join('models', 'chi_sarimax.pkl')
DEFAULT_LOOKBACK_DAYS = 7
DEFAULT_TRAIN_SAMPLES = 2000  # Use last 2000 samples for training


def train_sarimax(
    data: pd.DataFrame,
    measure: str = 'coherence',
    order: Tuple[int, int, int] = (1, 0, 0),
    seasonal_order: Tuple[int, int, int, int] = (1, 0, 0, 288),  # 288 = daily seasonality with 5-min intervals
    enforce_stationarity: bool = False,
    enforce_invertibility: bool = False
) -> sm.tsa.statespace.SARIMAX:
    """
    Train a SARIMAX model on coherence time series data.
    
    Args:
        data: DataFrame with timestamp index and coherence values
        measure: Column name to model
        order: ARIMA order (p, d, q)
        seasonal_order: Seasonal ARIMA order (P, D, Q, s)
        enforce_stationarity: Whether to enforce stationarity
        enforce_invertibility: Whether to enforce invertibility
        
    Returns:
        Trained model
    """
    logger.info(f"Training SARIMAX model for {measure}...")
    logger.info(f"  ARIMA order: {order}")
    logger.info(f"  Seasonal order: {seasonal_order}")
    
    # Get series
    series = data[measure]
    
    # Create and fit model
    start_time = time.time()
    
    try:
        # Create model
        model = sm.tsa.statespace.SARIMAX(
            series,
            order=order,
            seasonal_order=seasonal_order,
            enforce_stationarity=enforce_stationarity,
            enforce_invertibility=enforce_invertibility
        )
        
        # Fit model (with output suppressed)
        result = model.fit(disp=False)
        
        duration = time.time() - start_time
        logger.info(f"  Model training completed in {duration:.2f} seconds")
        
        # Log model summary snippet
        summary_lines = str(result.summary()).split('\n')
        logger.info("  Model summary (excerpt):")
        for i, line in enumerate(summary_lines[:15]):
            if i in [0, 1, 2, 7, 8, 9, 10]:  # Selected lines with key info
                logger.info(f"    {line}")
                
        return result
        
    except Exception as e:
        logger.error(f"Error training SARIMAX model: {e}")
        raise


def load_spectral_data(
    filepath: str = DEFAULT_DATA_PATH,
    lookback_days: float = DEFAULT_LOOKBACK_DAYS,
    max_samples: Optional[int] = DEFAULT_TRAIN_SAMPLES
) -> pd.DataFrame:
    """
    Load spectral history data for model training.
    
    Args:
        filepath: Path to parquet file
        lookback_days: Days of history to use
        max_samples: Maximum number of samples to use
        
    Returns:
        DataFrame with spectral history
    """
    try:
        # Check if file exists
        if not os.path.exists(filepath):
            logger.error(f"Data file not found: {filepath}")
            raise FileNotFoundError(f"Data file not found: {filepath}")
            
        # Load data
        data = pd.read_parquet(filepath)
        logger.info(f"Loaded {len(data)} records from {filepath}")
        
        # Filter by lookback period
        if lookback_days > 0:
            cutoff = datetime.now() - timedelta(days=lookback_days)
            data = data[data.index >= cutoff]
            logger.info(f"Filtered to {len(data)} records within {lookback_days} days")
        
        # Limit to last max_samples if specified
        if max_samples and len(data) > max_samples:
            data = data.iloc[-max_samples:]
            logger.info(f"Using last {max_samples} samples for training")
            
        return data
        
    except Exception as e:
        logger.error(f"Error loading spectral data: {e}")
        raise


def save_model(model, filepath: str = DEFAULT_MODEL_PATH):
    """
    Save trained model to disk.
    
    Args:
        model: Trained SARIMAX model
        filepath: Output path
    """
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Save model
        with open(filepath, 'wb') as f:
            pickle.dump(model, f)
            
        logger.info(f"Model saved to {filepath}")
        
    except Exception as e:
        logger.error(f"Error saving model: {e}")
        raise


def main():
    """Main function for model training."""
    parser = argparse.ArgumentParser(description='Train SARIMAX forecast model')
    parser.add_argument('--data', type=str, default=DEFAULT_DATA_PATH,
                       help='Path to spectral history data (parquet)')
    parser.add_argument('--output', type=str, default=DEFAULT_MODEL_PATH,
                       help='Path to save trained model')
    parser.add_argument('--lookback', type=float, default=DEFAULT_LOOKBACK_DAYS,
                       help='Days of history to use for training')
    parser.add_argument('--max-samples', type=int, default=DEFAULT_TRAIN_SAMPLES,
                       help='Maximum number of samples to use for training')
    parser.add_argument('--measure', type=str, default='coherence',
                       help='Measure to model (coherence, stability, etc.)')
    parser.add_argument('--p', type=int, default=1,
                       help='AR order (p)')
    parser.add_argument('--d', type=int, default=0,
                       help='Differencing order (d)')
    parser.add_argument('--q', type=int, default=0,
                       help='MA order (q)')
    parser.add_argument('--P', type=int, default=1,
                       help='Seasonal AR order (P)')
    parser.add_argument('--D', type=int, default=0,
                       help='Seasonal differencing order (D)')
    parser.add_argument('--Q', type=int, default=0,
                       help='Seasonal MA order (Q)')
    parser.add_argument('--s', type=int, default=288,
                       help='Seasonal period (s)')
    
    args = parser.parse_args()
    
    try:
        # Log start
        logger.info("Starting SARIMAX model training")
        start_time = time.time()
        
        # Load data
        data = load_spectral_data(
            filepath=args.data,
            lookback_days=args.lookback,
            max_samples=args.max_samples
        )
        
        # Check if we have enough data
        if len(data) < 100:  # Arbitrary minimum
            logger.error(f"Insufficient data for training: {len(data)} samples")
            return 1
            
        # Train model
        model = train_sarimax(
            data=data,
            measure=args.measure,
            order=(args.p, args.d, args.q),
            seasonal_order=(args.P, args.D, args.Q, args.s)
        )
        
        # Save model
        save_model(model, filepath=args.output)
        
        # Log completion
        duration = time.time() - start_time
        logger.info(f"Training completed in {duration:.2f} seconds")
        
        return 0
        
    except Exception as e:
        logger.error(f"Error in training process: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
