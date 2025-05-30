#!/usr/bin/env python3
"""
🔧 QUICK FIX - Export Class Declarations
Fix the missing export keywords in cognitive modules
"""

import os
import re

def fix_export_issues():
    """Fix missing export keywords in cognitive modules"""
    
    base_path = r"C:\Users\jason\Desktop\tori\kha\tori_ui_svelte\src\lib\cognitive"
    
    fixes = [
        {
            "file": "holographicMemory.ts",
            "pattern": r"^class HolographicMemory",
            "replacement": "export class HolographicMemory"
        },
        {
            "file": "ghostCollective.ts", 
            "pattern": r"^class GhostCollective",
            "replacement": "export class GhostCollective"
        }
    ]
    
    for fix in fixes:
        file_path = os.path.join(base_path, fix["file"])
        
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            continue
        
        print(f"🔧 Fixing {fix['file']}...")
        
        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Apply fix
            updated_content = re.sub(
                fix["pattern"], 
                fix["replacement"], 
                content, 
                flags=re.MULTILINE
            )
            
            # Check if changes were made
            if content != updated_content:
                # Write back
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
                print(f"✅ Fixed {fix['file']} - Added missing export")
            else:
                print(f"ℹ️ {fix['file']} - No changes needed")
                
        except Exception as e:
            print(f"❌ Error fixing {fix['file']}: {e}")
    
    print("\n🎯 Export fixes complete!")
    print("Now restart your SvelteKit dev server to see the changes.")

if __name__ == "__main__":
    fix_export_issues()
