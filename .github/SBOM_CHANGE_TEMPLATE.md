---
title: "🔍 SBOM Changes Detected"
labels: security, dependencies
assignees: securityteam
---

## SBOM Changes Detected

The Software Bill of Materials (SBOM) has changed in the latest build. This could indicate:

1. **New dependencies added** - These should be reviewed for security implications
2. **Dependency versions updated** - Check if these address known vulnerabilities
3. **Dependencies removed** - Verify this was intentional

### Details

The changes were detected in the weekly security audit workflow run: [View Run]({{ env.GITHUB_SERVER_URL }}/{{ env.GITHUB_REPOSITORY }}/actions/runs/{{ env.GITHUB_RUN_ID }})

**Artifacts containing the full diff are available in the workflow run.**

### Required Actions

Security team, please:

1. Download and review the SBOM diff from the artifacts
2. Verify no CVEs or critical issues exist in the new dependency graph
3. Run `cargo deny check` locally to confirm license compliance
4. If issues are found, create tickets for remediation
5. Close this issue once the review is complete

---

*This issue was automatically created by the security-audit workflow.*
