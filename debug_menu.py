#!/usr/bin/env python3
"""
🔍 CRASH DEBUGGING MENU
Choose different approaches to capture and prevent extraction crashes
"""

import sys
import subprocess
from pathlib import Path

def show_menu():
    """Display debugging options menu"""
    
    print("🔍 TORI EXTRACTION CRASH DEBUGGING")
    print("=" * 50)
    print()
    print("Your server is crashing during concept extraction.")
    print("Choose a debugging approach:")
    print()
    print("1. 🔧 PROTECTED SERVER (Recommended)")
    print("   - Adds timeout and memory protection")
    print("   - Prevents crashes by limiting resource usage")
    print("   - Should allow extraction to complete safely")
    print()
    print("2. 🧠 MEMORY MONITORING")
    print("   - Monitors memory usage during extraction")
    print("   - Helps identify memory-related crashes")
    print("   - Logs detailed memory statistics")
    print()
    print("3. 🔍 FULL CRASH CAPTURE")
    print("   - Captures all crash details and logs")
    print("   - Records stdout, stderr, and stack traces")
    print("   - Best for detailed crash analysis")
    print()
    print("4. 🚀 NORMAL SERVER")
    print("   - Run the normal server (may crash)")
    print("   - Use if you want to reproduce the crash")
    print()
    print("0. Exit")
    print()

def run_option(choice):
    """Run the selected debugging option"""
    
    scripts = {
        '1': 'protected_server.py',
        '2': 'memory_crash_capture.py', 
        '3': 'direct_crash_capture.py',
        '4': 'start_dynamic_api.py'
    }
    
    if choice in scripts:
        script = scripts[choice]
        print(f"🚀 Running {script}...")
        print("Press Ctrl+C to stop")
        print()
        
        try:
            subprocess.run([sys.executable, script])
        except KeyboardInterrupt:
            print("\n🛑 Stopped by user")
        except Exception as e:
            print(f"\n❌ Error running script: {e}")
    
    elif choice == '0':
        print("👋 Goodbye!")
        return False
    
    else:
        print("❌ Invalid choice, please try again")
    
    return True

def main():
    """Main menu loop"""
    
    # Check if we're in the right directory
    current_dir = Path.cwd()
    if not (current_dir / "ingest_pdf").exists():
        print("❌ Please run this script from the TORI kha directory")
        print(f"Current directory: {current_dir}")
        return
    
    while True:
        show_menu()
        
        try:
            choice = input("Choose an option (0-4): ").strip()
            print()
            
            if not run_option(choice):
                break
                
            print()
            input("Press Enter to return to menu...")
            print()
            
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except EOFError:
            print("\n👋 Goodbye!")
            break

if __name__ == "__main__":
    main()
