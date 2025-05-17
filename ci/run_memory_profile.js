/**
 * Memory Profiling CI Script
 * ------------------------------------------------------------------
 * Runs memory profiling and verifies we meet the target memory usage.
 * 
 * Usage:
 *   node ci/run_memory_profile.js
 * 
 * CI integration:
 *   - Saves memory_report_ci.md with badges
 *   - Exits with status code 0 if targets are met, 1 otherwise
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration constants
const DESKTOP_TARGET_MB = 150;
const MOBILE_TARGET_MB = 90;
const MEMORY_REPORT_PATH = 'memory_report_ci.md';
const FLAMEGRAPH_OUTPUT = 'memory_flamegraph.svg';

// ANSI color codes for prettier console output
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';

/**
 * Main function
 */
async function main() {
  console.log(`${CYAN}=== Memory Profiling CI Script ===${RESET}\n`);
  
  try {
    // Check if we're on a supported platform
    const platform = process.platform;
    console.log(`Platform detected: ${platform}`);
    
    if (!['linux', 'darwin', 'win32'].includes(platform)) {
      console.warn(`${YELLOW}Warning: Unsupported platform ${platform}. Profiling may not be accurate.${RESET}`);
    }
    
    // Run the memory profiling
    console.log(`${CYAN}Running memory profiling...${RESET}`);
    
    // Different command based on platform
    let cmd;
    if (platform === 'win32') {
      cmd = 'cargo test --release --features profiling -- profile_memory_for_ci --nocapture';
    } else {
      cmd = 'RUSTFLAGS="--cfg profiling" cargo test --release -- profile_memory_for_ci --nocapture';
    }
    
    try {
      execSync(cmd, { stdio: 'inherit' });
      console.log(`${GREEN}Memory profiling completed successfully.${RESET}`);
    } catch (error) {
      console.error(`${RED}Memory profiling failed:${RESET}`);
      console.error(error.message);
      process.exit(1);
    }
    
    // Check if report was generated
    if (!fs.existsSync(MEMORY_REPORT_PATH)) {
      console.error(`${RED}Error: Memory report file not found at ${MEMORY_REPORT_PATH}${RESET}`);
      process.exit(1);
    }
    
    // Parse the memory report to extract key metrics
    const reportContent = fs.readFileSync(MEMORY_REPORT_PATH, 'utf8');
    
    // Parse peak memory from report
    const peakMemoryMatch = reportContent.match(/Peak Memory\s*\|\s*([\d.]+) MB/);
    const peakMemoryMB = peakMemoryMatch ? parseFloat(peakMemoryMatch[1]) : null;
    
    // Check if we met the targets
    const desktopTargetMet = peakMemoryMB && peakMemoryMB <= DESKTOP_TARGET_MB;
    const mobileTargetMet = peakMemoryMB && peakMemoryMB <= MOBILE_TARGET_MB;
    
    // Print results
    console.log('\n--- Memory Profiling Results ---');
    console.log(`Peak Memory Usage: ${peakMemoryMB ? `${peakMemoryMB.toFixed(2)} MB` : 'Unknown'}`);
    console.log(`Desktop Target (${DESKTOP_TARGET_MB} MB): ${desktopTargetMet ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`}`);
    console.log(`Mobile Target (${MOBILE_TARGET_MB} MB): ${mobileTargetMet ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`}`);
    
    // Generate flamegraph if the tool is available
    try {
      if (platform === 'linux' || platform === 'darwin') {
        console.log(`\n${CYAN}Generating flamegraph...${RESET}`);
        execSync(`cargo flamegraph --output ${FLAMEGRAPH_OUTPUT} --bin memory-profile`);
        console.log(`${GREEN}Flamegraph generated at ${FLAMEGRAPH_OUTPUT}${RESET}`);
      }
    } catch (error) {
      console.warn(`${YELLOW}Warning: Failed to generate flamegraph:${RESET}`);
      console.warn(`Make sure cargo-flamegraph is installed: cargo install flamegraph`);
    }
    
    // Exit with appropriate status code
    if (desktopTargetMet) {
      console.log(`\n${GREEN}Memory profiling PASSED${RESET}`);
      process.exit(0);
    } else {
      console.error(`\n${RED}Memory profiling FAILED${RESET}`);
      console.error(`Peak memory (${peakMemoryMB?.toFixed(2) || '?'} MB) exceeds desktop target (${DESKTOP_TARGET_MB} MB)`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`${RED}Unhandled error:${RESET}`);
    console.error(error);
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error(`${RED}Fatal error:${RESET}`, error);
  process.exit(1);
});
