---
title: "🔴 Diagnostics: Crash in {{ env.WORKFLOW_NAME }}"
labels: bug, crash, diagnostics
assignees: devteam
---

## Crash Diagnostics Report

A crash has been detected in the **{{ env.WORKFLOW_NAME }}** workflow.

### Crash Information

- **Workflow:** [{{ env.WORKFLOW_NAME }}]({{ env.WORKFLOW_URL }})
- **Detected At:** {{ date | date('YYYY-MM-DD HH:mm') }} UTC
- **Diagnostic data:** Available in workflow artifacts

### Diagnostic Details

The diagnostic recorder has captured the 5 seconds of ψ-frames leading up to the crash, allowing for detailed analysis of the system state immediately before failure.

### Steps to Reproduce

1. Download the diagnostic artifacts from the workflow run
2. Extract the ZIP file to access frame data
3. Use `psiarc analyze` to examine the frame sequence
4. Review `panic.txt` for the crash reason and exact timestamp

### Crash Analysis

```
{{ env.TRIAGE_REPORT }}
```

### Artifacts Included

- 5-second ψ-frame history (≈300 frames)
- Symbolicated stack trace (above)
- System state at time of crash
- Memory profile

### Next Steps

Please assign this issue to the appropriate team member for investigation. The diagnostic data is available for 14 days before automatic deletion.

For help analyzing the crash dump:
```bash
# Extract frames for analysis
./tools/extract_frames.sh crash_yyyymmddThhmmss.zip

# Visualize the frame sequence
./tools/visualize_trajectory.sh extracted_frames/
```

---

*This issue was automatically created by the diagnostic-upload workflow.*
