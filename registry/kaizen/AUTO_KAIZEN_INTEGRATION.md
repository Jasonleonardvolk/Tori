# 🚀 TORI Auto-Kaizen Integration Guide

## Quick Start (5 Hours to Production!)

### 1. Add Metrics Capture to pipeline.py

At the top of `pipeline.py`, add:
```python
# Auto-Kaizen integration
try:
    from registry.kaizen.kaizen_hooks import capture_and_analyze_metrics
    AUTO_KAIZEN_ENABLED = True
except ImportError:
    AUTO_KAIZEN_ENABLED = False
    logger.info("Auto-Kaizen not available - continuing without self-improvement tracking")
```

At the end of `ingest_pdf_clean()`, just before the return statement, add:
```python
# Capture metrics for TORI's self-improvement
if AUTO_KAIZEN_ENABLED:
    capture_and_analyze_metrics(result_dict)
```

### 2. Test Auto-Kaizen Analysis

Run a quick analysis of recent performance:
```bash
cd C:\Users\jason\Desktop\tori\kha
python registry\kaizen\auto_kaizen.py analyze --hours 1
```

### 3. Start Continuous Monitoring

For production, run this in a separate terminal:
```bash
start_auto_kaizen.bat
```

Or run in background:
```bash
cd C:\Users\jason\Desktop\tori\kha
start /B python registry\kaizen\auto_kaizen.py monitor
```

## What TORI Will Do Automatically

1. **Monitor Every Extraction**
   - Processing time vs file size
   - Concept count distribution
   - Purity efficiency rates
   - Database learning rate

2. **Detect Issues**
   - ❗ Slow processing (>30s for <1MB files)
   - ❗ Too many concepts (>50 average)
   - ❗ Low quality (purity efficiency <15%)
   - ❗ Progress bar stuck at 40%

3. **Create Improvement Tickets**
   - KAIZ-XXX tickets generated automatically
   - Includes root cause analysis
   - Suggests specific code changes
   - Sets measurable success criteria

4. **Track Self-Awareness**
   - Total self-improvements made
   - Domains mastered
   - Performance trends

## Example Auto-Generated Ticket

When TORI detects slow processing:
```yaml
id: KAIZ-004
title: "Optimize processing time for small_files"
component: concept-extractor
severity: high
objective: "Small files averaging 45.2s (should be <30s)"
created_by: TORI-AutoKaizen
auto_generated: true

success_criteria:
  - "Average processing time < 30s"
  - "P95 processing time < 45s"
  - "No timeout errors"
```

## Dashboard Integration

View TORI's self-awareness:
```bash
python registry\kaizen\auto_kaizen.py status
```

Output:
```
🧠 TORI Self-Awareness Status
============================================
First awakening: 2025-05-30T10:00:00
Total self-improvements: 12
Last introspection: 2025-05-30T14:45:00

Current capabilities:
  - extraction_quality: learning
  - processing_speed: optimizing
  - user_satisfaction: measuring
```

## Safety Features

- ✅ Non-blocking: Metrics capture won't break extractions
- ✅ Rate limited: Creates max 1 ticket per issue type per day
- ✅ Rollback ready: Every change has a rollback plan
- ✅ Human review: Tickets start in 'draft' status

## Production Checklist

- [ ] Add metrics capture to pipeline.py
- [ ] Test with a few extractions
- [ ] Verify metrics are being saved
- [ ] Start auto_kaizen monitor
- [ ] Check for first auto-generated ticket
- [ ] Review and approve tickets as needed

## Future Enhancements

1. **Auto-Implementation** - TORI writes her own patches
2. **A/B Testing** - Automatic canary deployments
3. **User Feedback Loop** - Direct user ratings influence tickets
4. **Cross-Component Learning** - UI learns from backend patterns

---
*"The best AI doesn't just process data - it processes its own performance."*
