# Sprint Board — "Diagnostics + Docs" (3 calendar days)

| ID   | Task                                     | Owner      | ETA   | Acceptance |
|------|------------------------------------------|------------|-------|------------|
| D-1  | Implement recorder.rs ring buffer (5 s) & crash hook | Core-Rust | 0.5 d | Panic produces crash_*.zip ≤ 2 MB |
| D-2  | recorder.ts wrapper + UI toggle          | Front-TS   | 0.3 d | Toggle appears in Settings; ZIP saved |
| D-3  | Zip attach in psiarc verify (CLI --attach) | CLI      | 0.2 d | verify --attach foo.zip merges logs |
| D-4  | Add GitHub Action to upload crash ZIP as artifact | DevOps | 0.1 d | Workflow on: failure attaches file |
| E-1  | Draft docs/beta_quickstart.md            | Docs       | 0.3 d | Reviewed by 2 devs → "clear" |
| E-2  | Wiki "Common Pitfalls" page              | Docs       | 0.2 d | Live, linked from README |
| E-3  | Loom screencast script & storyboard      | PM         | 0.2 d | 3-min run-through approved |

**Total effort:** ≈ 1.8 dev-days + 0.5 docs/PM. Buffer ≈ 1 day.

## Implementation Status

| ID   | Status    | Notes |
|------|-----------|-------|
| D-1  | ✅ Complete | recorder.rs implemented with circular buffer and zip writer |
| D-2  | ✅ Complete | recorder.ts implemented with browser API integration |
| D-3  | 🟨 Pending  | CLI integration for `psiarc verify --attach` needed |
| D-4  | ✅ Complete | GitHub Action workflow implemented for upload |
| E-1  | ✅ Complete | Beta quickstart guide completed |
| E-2  | ✅ Complete | Common pitfalls wiki page added |
| E-3  | ✅ Complete | Loom screencast script with detailed timing and notes |

## Files Created/Modified:

### Diagnostics Implementation (D):
- `client/src/ghost/psi_trajectory/rs_impl/src/recorder.rs`
- `client/src/diagnostics/recorder.ts`
- `client/src/components/settings/DiagnosticsPanel.tsx`
- `.github/workflows/diagnostic-upload.yml`
- `.github/DIAGNOSTIC_REPORT_TEMPLATE.md`
- Feature flag added to `Cargo.toml`

### Documentation (E):
- `docs/beta_quickstart.md`
- `docs/wiki/common-pitfalls.md`
- `docs/loom_screencast.md`

## Next Steps:

1. Complete the CLI integration for attaching diagnostic ZIPs to archives
2. Set up panic hooks in the main application entry point
3. Integrate DiagnosticsPanel component into the settings UI
4. Implement automatic ZIP upload in the bug reporting flow
5. Distribute beta documentation to testers

## Metrics:

- **Average crash report size:** Target < 2MB (≈300 frames × avg 6KB)
- **Overhead per frame:** < 500μs (frame capture + buffer management)
- **Documentation completeness:** All common errors covered; first-run success > 85%
