#!/bin/bash
# Script to generate HTML coverage reports for fuzzing targets

set -e

# Configuration
TARGETS=("frame_decoder" "crypto_layer" "kernel_dispatcher")
OUTPUT_DIR="client/src/ghost/psi_trajectory/fuzz/coverage"
FUZZ_DIR="client/src/ghost/psi_trajectory"
TIMEOUT=60  # Time to run each fuzzer in seconds

# Make sure required tools are installed
echo "Checking required tools..."
if ! command -v cargo-fuzz &> /dev/null; then
    echo "cargo-fuzz not found, installing..."
    cargo install cargo-fuzz
fi

if ! command -v grcov &> /dev/null; then
    echo "grcov not found, installing..."
    cargo install grcov
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Generate index.html for all reports
cat > "$OUTPUT_DIR/index.html" << EOL
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ψ-Trajectory Fuzzing Coverage Reports</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .target { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        .target h2 { margin-top: 0; }
        .stats { display: flex; gap: 20px; margin-bottom: 15px; }
        .stat { flex: 1; background: #f5f5f5; padding: 10px; border-radius: 4px; }
        .stat h3 { margin-top: 0; font-size: 16px; }
        .stat p { margin-bottom: 0; font-size: 24px; font-weight: bold; text-align: center; }
        a.report-link { display: inline-block; padding: 8px 16px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }
        a.report-link:hover { background: #45a049; }
        .last-run { color: #666; font-size: 14px; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>ψ-Trajectory Fuzzing Coverage Reports</h1>
    <p>This page provides access to code coverage reports generated from fuzzing runs.</p>
    
    <div class="targets">
EOL

# Run each fuzzer and generate reports
for target in "${TARGETS[@]}"; do
    echo "=== Processing $target ==="
    target_dir="$OUTPUT_DIR/$target"
    mkdir -p "$target_dir"
    
    # Run the fuzzer with instrumentation for coverage
    echo "Running fuzzer for $target..."
    cd "$FUZZ_DIR"
    RUSTFLAGS="-Zinstrument-coverage" cargo fuzz run "$target" -- -max_total_time="$TIMEOUT"
    
    # Generate the coverage report
    echo "Generating coverage report for $target..."
    grcov . --binary-path ./target/x86_64-unknown-linux-gnu/release/ \
        -s . -t html --branch --ignore-not-existing \
        -o "$target_dir"
    
    # Extract some coverage stats
    line_coverage=$(grep -o 'lines: [0-9.]*%' "$target_dir/index.html" | grep -o '[0-9.]*' || echo "?")
    branch_coverage=$(grep -o 'branches: [0-9.]*%' "$target_dir/index.html" | grep -o '[0-9.]*' || echo "?")
    
    # Add this target to the index
    cat >> "$OUTPUT_DIR/index.html" << EOL
        <div class="target">
            <h2>$target</h2>
            <div class="stats">
                <div class="stat">
                    <h3>Line Coverage</h3>
                    <p>${line_coverage}%</p>
                </div>
                <div class="stat">
                    <h3>Branch Coverage</h3>
                    <p>${branch_coverage}%</p>
                </div>
            </div>
            <a href="./$target/index.html" class="report-link">View Full Report</a>
            <div class="last-run">Last run: $(date)</div>
        </div>
EOL

    echo "Report generated for $target"
    cd - > /dev/null
done

# Close the HTML file
cat >> "$OUTPUT_DIR/index.html" << EOL
    </div>
    
    <p>Generated on $(date)</p>
</body>
</html>
EOL

echo "All coverage reports generated successfully."
echo "Open $OUTPUT_DIR/index.html to view the reports."
