#!/usr/bin/env bash
# ci/triage.sh  – run in a post-crash step of your GH Action
set -euo pipefail

DUMP="$1"                      # path to crash_X.zip
OUT=triage_report.txt

unzip -p "$DUMP" panic.txt     >> "$OUT" || echo "panic.txt missing" >> "$OUT"

# Extract addr2line stack from embedded .dSYM / .pdb / DWARF
if command -v llvm-symbolizer &>/dev/null; then
  echo -e "\n--- stacktrace ---" >> "$OUT"
  llvm-symbolizer -print-source-context-lines=2 -obj="$(pwd)/target/release/tori" \
    $(grep -Eo '0x[0-9a-f]+' "$OUT" | head -20) >> "$OUT" || true
fi

# Markdown wrap
echo -e "\n<details><summary>Raw dump</summary>\n\n\`\`\`txt" >> "$OUT"
unzip -l "$DUMP" >> "$OUT"
echo -e "\`\`\`\n</details>" >> "$OUT"

# Upload triage file as GH Action artifact and dump to job summary
echo "Triage report written to $OUT"
echo "### Crash triage\n\`\`\`\n$(cat "$OUT")\n\`\`\`" >> "$GITHUB_STEP_SUMMARY"
