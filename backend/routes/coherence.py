"""
Routes for coherence monitoring and forecasting.

This module contains API endpoints for accessing coherence data,
forecast information, and spectral metrics.
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime
import pandas as pd
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Dict, List, Any, Optional

# Import our forecasting modules
from packages.runtime_bridge.python.trend_forecast import default_forecaster, get_forecaster

# Configure logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/coherence",
    tags=["coherence"]
)

# Get forecast data
@router.get("/forecast")
async def get_coherence_forecast(
    metrics: Optional[str] = Query(None, description="Comma-separated metrics to include"),
    refresh: bool = Query(False, description="Force refresh forecast")
):
    """
    Get coherence forecast data.
    
    Args:
        metrics: Optional comma-separated list of metrics to include
        refresh: Whether to force a refresh of the forecast
        
    Returns:
        Forecast data
    """
    try:
        # Parse metrics
        metrics_list = None
        if metrics:
            metrics_list = [m.strip() for m in metrics.split(',')]
        
        # Get forecaster
        forecaster = default_forecaster
        
        # Generate forecast
        forecast = forecaster.forecast(metrics=metrics_list)
        
        # Return forecast
        return forecast
    except Exception as e:
        logger.error(f"Error getting coherence forecast: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get coherence forecast: {str(e)}"
        )

# Get historical coherence data
@router.get("/history")
async def get_coherence_history(
    days: int = Query(1, ge=1, le=30, description="Number of days of history"),
    interval: str = Query("5min", description="Resampling interval (e.g. '1min', '5min', '1h')")
):
    """
    Get historical coherence data.
    
    Args:
        days: Number of days of history to return
        interval: Resampling interval for data points
        
    Returns:
        Historical coherence data
    """
    try:
        # Get history path from environment or use default
        history_path = os.environ.get('SPECTRAL_HISTORY_PATH', './spectral_history')
        history_path = Path(history_path)
        
        # List all parquet files in history directory
        parquet_files = sorted(history_path.glob('*.parquet'))
        
        # Check if we have data
        if not parquet_files:
            return {
                "history": [],
                "interval": interval,
                "days": days
            }
        
        # Load data from most recent days
        dfs = []
        
        for pq_file in reversed(parquet_files[:days]):
            try:
                df = pd.read_parquet(pq_file)
                dfs.append(df)
            except Exception as e:
                logger.error(f"Error loading {pq_file}: {e}")
        
        if not dfs:
            return {
                "history": [],
                "interval": interval,
                "days": days
            }
        
        # Combine all dataframes
        history = pd.concat(dfs, ignore_index=True)
        
        # Convert timestamp to datetime for resampling
        history['datetime'] = pd.to_datetime(history['timestamp'], unit='ms')
        history = history.set_index('datetime')
        
        # Resample data
        resampled = history.resample(interval).mean()
        
        # Convert back to records
        resampled['timestamp'] = resampled.index.astype(int) // 10**6  # Convert to milliseconds
        records = resampled.reset_index().to_dict(orient='records')
        
        # Return history
        return {
            "history": records,
            "interval": interval,
            "days": days
        }
        
    except Exception as e:
        logger.error(f"Error getting coherence history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get coherence history: {str(e)}"
        )

# Get latest spectral state
@router.get("/state")
async def get_spectral_state():
    """
    Get the latest spectral state.
    
    Returns:
        Latest spectral state
    """
    try:
        # Get history path from environment or use default
        history_path = os.environ.get('SPECTRAL_HISTORY_PATH', './spectral_history')
        history_path = Path(history_path)
        
        # Get most recent parquet file
        parquet_files = sorted(history_path.glob('*.parquet'))
        
        if not parquet_files:
            raise HTTPException(
                status_code=404,
                detail="No spectral data available"
            )
        
        # Load most recent file
        latest_file = parquet_files[-1]
        df = pd.read_parquet(latest_file)
        
        # Get most recent row
        if df.empty:
            raise HTTPException(
                status_code=404,
                detail="No spectral data available"
            )
        
        latest = df.iloc[-1].to_dict()
        
        # Return latest state
        return latest
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting spectral state: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get spectral state: {str(e)}"
        )
