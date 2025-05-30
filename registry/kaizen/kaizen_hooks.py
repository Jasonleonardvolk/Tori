"""
🔗 TORI Metrics Capture Hook

Add this to your pipeline.py after successful extraction to feed
metrics to the Auto-Kaizen system.
"""

def capture_and_analyze_metrics(result: Dict[str, Any]) -> None:
    """
    Capture extraction metrics and trigger auto-improvement analysis
    
    Add this call at the end of ingest_pdf_clean, right before return:
    capture_and_analyze_metrics(result)
    """
    try:
        # Import here to avoid circular dependencies
        from registry.kaizen.auto_kaizen import capture_extraction_metrics
        
        # Capture the metrics
        metrics = capture_extraction_metrics(result)
        
        # Log for visibility
        logger.info(f"📊 [AUTO-KAIZEN] Metrics captured: {metrics['concept_count']} concepts in {metrics['processing_time_seconds']:.1f}s")
        
        # Check if this extraction had any notable issues
        if metrics['processing_time_seconds'] > 60 and metrics['file_size_bytes'] < 1024*1024:
            logger.warning("🐌 [AUTO-KAIZEN] Slow processing detected for small file")
        
        if metrics['concept_count'] > 80:
            logger.warning("📚 [AUTO-KAIZEN] High concept count detected")
            
        if metrics.get('purity_analysis', {}).get('purity_efficiency', '').replace('%', ''):
            efficiency = float(metrics['purity_analysis']['purity_efficiency'].replace('%', '')) / 100
            if efficiency < 0.15:
                logger.warning("🔍 [AUTO-KAIZEN] Low purity efficiency detected")
        
    except Exception as e:
        # Don't let metrics capture break the extraction
        logger.debug(f"Could not capture metrics for Auto-Kaizen: {e}")


# Add this import at the top of pipeline.py:
# from registry.kaizen.kaizen_hooks import capture_and_analyze_metrics

# Add this line at the end of ingest_pdf_clean, just before the return statement:
# capture_and_analyze_metrics(response_data)
