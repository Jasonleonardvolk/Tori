---
title: "🐛 Fuzzing Crash Found in {{ env.TARGET }}"
labels: bug, security, fuzzing
assignees: securityteam
---

## Fuzzing Crash Report

A crash was discovered during nightly fuzzing of the `{{ env.TARGET }}` target.

### Crash Information

- **Fuzzing Target:** `{{ env.TARGET }}`
- **Discovered At:** `{{ date | date('YYYY-MM-DD HH:mm') }} UTC`
- **Workflow Run:** [View Run Details]({{ env.GITHUB_SERVER_URL }}/{{ env.GITHUB_REPOSITORY }}/actions/runs/{{ env.GITHUB_RUN_ID }})

### Next Steps

1. Download the crash artifacts from the workflow run
2. Reproduce locally using:
   ```bash
   cargo fuzz run {{ env.TARGET }} fuzz/findings/{{ env.TARGET }}/crashes/[crash_id]
   ```
3. Debug the crash with:
   ```bash
   RUSTFLAGS="-Z sanitizer=address" cargo fuzz run {{ env.TARGET }} --debug fuzz/findings/{{ env.TARGET }}/crashes/[crash_id]
   ```

### Potential Impact

This crash could indicate:
- Memory safety issue
- Input validation error
- State corruption
- Resource exhaustion

Please investigate as soon as possible, especially if this target is in the crypto or frame decoder code paths, which are security-critical.

### Coverage Report

A code coverage report is also available in the workflow artifacts to help understand which code paths the fuzzer was exploring when the crash occurred.

---

*This issue was automatically created by the nightly fuzzing workflow.*
