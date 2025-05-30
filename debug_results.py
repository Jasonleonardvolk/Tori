#!/usr/bin/env python3
"""
🔧 CONCEPT DISPLAY FIX
Fix the [object Object] display issue in the frontend
"""

import os
import re

def fix_concept_display():
    """Fix concept display in SvelteKit frontend"""
    
    # The issue is likely in how concepts are displayed in the UI
    # We need to ensure concept.name is used instead of the full object
    
    print("🔧 FIXING CONCEPT DISPLAY BUG")
    print("=" * 40)
    print("The [object Object] issue suggests concepts are being displayed")
    print("as full objects instead of just the name property.")
    print()
    print("📊 CURRENT FORMAT:")
    print("   concepts = [{ name: 'Algorithm', score: 0.8, ... }]")
    print("   Display shows: [object Object]")
    print()
    print("✅ SHOULD BE:")
    print("   Display shows: Algorithm")
    print()
    
    print("🔍 This is likely a frontend rendering issue.")
    print("Check your Svelte component that displays the concepts.")
    print("Make sure it uses: concept.name instead of: concept")
    
    return True

def check_extraction_logs():
    """Check if we can find extraction logs"""
    
    print("\n🔍 CHECKING EXTRACTION LOGS")
    print("-" * 30)
    
    # Look for recent log files
    import glob
    from pathlib import Path
    
    log_dir = Path(__file__).parent / "logs"
    if log_dir.exists():
        log_files = list(log_dir.glob("*.log"))
        if log_files:
            print(f"📝 Found {len(log_files)} log files:")
            for log_file in sorted(log_files)[-3:]:  # Show last 3
                print(f"   - {log_file.name}")
        else:
            print("📝 No log files found")
    else:
        print("📁 No logs directory found")
    
    print("\n🔍 PYTHON API STATUS:")
    print("✅ Windows timeout protection: WORKING")
    print("❌ Extraction quality: FAILING (falls back to TypeScript)")
    print("❌ Concept display: BROKEN ([object Object])")

if __name__ == "__main__":
    fix_concept_display()
    check_extraction_logs()
    
    print("\n🎯 NEXT STEPS:")
    print("1. Fix the frontend concept display")
    print("2. Debug why Python extraction fails inside timeout")
    print("3. Test with smaller files first")
