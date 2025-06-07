#!/usr/bin/env python3
"""
🔧 MASS RELATIVE IMPORT FIXER
Fixes all relative import issues in ingest_pdf directory
"""

import os
import re
from pathlib import Path

def fix_relative_imports_in_file(file_path):
    """Fix relative imports in a single Python file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern to match relative imports like: from .module import something
        pattern = r'^(\s*)from (\.[a-zA-Z_][a-zA-Z0-9_]*) import (.+)$'
        
        lines = content.split('\n')
        modified = False
        new_lines = []
        
        for line in lines:
            match = re.match(pattern, line)
            if match:
                indent = match.group(1)
                module = match.group(2)[1:]  # Remove the leading dot
                imports = match.group(3)
                
                # Replace with try/except pattern
                new_block = f"""{indent}try:
{indent}    # Try absolute import first
{indent}    from {module} import {imports}
{indent}except ImportError:
{indent}    # Fallback to relative import
{indent}    from .{module} import {imports}"""
                
                new_lines.append(new_block)
                modified = True
                print(f"  Fixed: from .{module} import {imports}")
            else:
                new_lines.append(line)
        
        if modified:
            new_content = '\n'.join(new_lines)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ Fixed relative imports in: {file_path.name}")
            return True
        else:
            print(f"📄 No relative imports found in: {file_path.name}")
            return False
            
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def fix_all_relative_imports():
    """Fix relative imports in all Python files in ingest_pdf directory"""
    script_dir = Path(__file__).parent
    ingest_dir = script_dir / "ingest_pdf"
    
    if not ingest_dir.exists():
        print(f"❌ Directory not found: {ingest_dir}")
        return
    
    print("🔧 MASS RELATIVE IMPORT FIXER")
    print("=" * 50)
    print(f"📁 Processing directory: {ingest_dir}")
    
    python_files = list(ingest_dir.glob("*.py"))
    fixed_count = 0
    
    for py_file in python_files:
        if py_file.name.startswith('__'):
            continue  # Skip __init__.py and __pycache__
            
        print(f"\n🔍 Processing: {py_file.name}")
        if fix_relative_imports_in_file(py_file):
            fixed_count += 1
    
    print("\n" + "=" * 50)
    print(f"🎯 SUMMARY: Fixed relative imports in {fixed_count}/{len(python_files)} files")
    print("✅ All relative imports should now work with both absolute and relative patterns")

if __name__ == "__main__":
    fix_all_relative_imports()
