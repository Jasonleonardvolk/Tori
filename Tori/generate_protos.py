#!/usr/bin/env python3
"""
Generate Python code from Protocol Buffer definitions.

This script generates Python modules from the .proto files in the proto directory.
It handles dependencies between proto files correctly and ensures all imports work.

Usage:
    python generate_protos.py [--clean]

Options:
    --clean     Remove existing generated files before generating new ones
"""

import os
import sys
import glob
import shutil
import subprocess
from pathlib import Path
import argparse


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Generate Python code from Protocol Buffer definitions.')
    parser.add_argument('--clean', action='store_true', help='Remove existing generated files before generating new ones')
    return parser.parse_args()


def clean_generated_files():
    """Remove existing generated files."""
    # Find all *_pb2.py and *_pb2_grpc.py files
    pb_files = glob.glob('mcp_services/**/*_pb2*.py', recursive=True)
    pb_files += glob.glob('mcp_services/**/__pycache__/*_pb2*.pyc', recursive=True)
    
    # Remove each file
    for file in pb_files:
        try:
            os.remove(file)
            print(f"Removed {file}")
        except Exception as e:
            print(f"Failed to remove {file}: {e}")


def ensure_init_files():
    """Ensure __init__.py files exist in all directories."""
    # Create __init__.py files in all directories
    for root, dirs, files in os.walk('mcp_services'):
        for d in dirs:
            init_file = os.path.join(root, d, '__init__.py')
            if not os.path.exists(init_file):
                with open(init_file, 'w') as f:
                    pass
                print(f"Created {init_file}")


def generate_protos():
    """Generate Python code from .proto files."""
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Set up paths
    proto_dir = os.path.join(current_dir, 'proto')
    python_out_dir = current_dir
    
    # Ensure proto directory exists
    if not os.path.exists(proto_dir):
        print(f"Proto directory not found: {proto_dir}")
        return False
    
    # Find all .proto files
    proto_files = glob.glob(os.path.join(proto_dir, '*.proto'))
    if not proto_files:
        print("No .proto files found")
        return False
    
    print(f"Found {len(proto_files)} .proto files")
    
    # Generate Python code for each .proto file
    for proto_file in proto_files:
        proto_name = os.path.basename(proto_file)
        service_name = os.path.splitext(proto_name)[0]
        
        # Determine output directory based on service name
        if service_name == 'episodic':
            out_dir = os.path.join(python_out_dir, 'mcp_services/episodic_vault/proto')
        elif service_name == 'sleep_scheduler':
            out_dir = os.path.join(python_out_dir, 'mcp_services/sleep_scheduler/proto')
        elif service_name == 'sparse_pruner':
            out_dir = os.path.join(python_out_dir, 'mcp_services/sparse_pruner/proto')
        elif service_name == 'koopman_learner':
            out_dir = os.path.join(python_out_dir, 'mcp_services/koopman_learner/proto')
        else:
            out_dir = os.path.join(python_out_dir, f'mcp_services/{service_name}/proto')
        
        # Create output directory if it doesn't exist
        os.makedirs(out_dir, exist_ok=True)
        
        # Ensure __init__.py file exists
        init_file = os.path.join(out_dir, '__init__.py')
        if not os.path.exists(init_file):
            with open(init_file, 'w') as f:
                pass
        
        print(f"Generating Python code for {proto_name} in {out_dir}")
        
        # Generate Python code
        try:
            cmd = [
                'python', '-m', 'grpc_tools.protoc',
                f'--proto_path={proto_dir}',
                f'--python_out={python_out_dir}',
                f'--grpc_python_out={python_out_dir}',
                proto_file
            ]
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            print(f"Generated code for {proto_name}")
            
            # Move generated files to the appropriate directory
            proto_basename = os.path.splitext(os.path.basename(proto_file))[0]
            pb2_file = os.path.join(python_out_dir, f'{proto_basename}_pb2.py')
            pb2_grpc_file = os.path.join(python_out_dir, f'{proto_basename}_pb2_grpc.py')
            
            if os.path.exists(pb2_file):
                shutil.move(pb2_file, os.path.join(out_dir, os.path.basename(pb2_file)))
            
            if os.path.exists(pb2_grpc_file):
                shutil.move(pb2_grpc_file, os.path.join(out_dir, os.path.basename(pb2_grpc_file)))
                
        except subprocess.CalledProcessError as e:
            print(f"Failed to generate code for {proto_name}: {e}")
            print(f"STDOUT: {e.stdout}")
            print(f"STDERR: {e.stderr}")
            return False
    
    # Fix imports in generated files
    fix_imports()
    
    return True


def fix_imports():
    """Fix imports in generated Python files."""
    # Find all generated *_pb2*.py files
    pb_files = []
    for root, _, files in os.walk('mcp_services'):
        for file in files:
            if file.endswith('_pb2.py') or file.endswith('_pb2_grpc.py'):
                pb_files.append(os.path.join(root, file))
    
    # Map of proto file names to their module paths
    proto_to_module = {}
    for pb_file in pb_files:
        if pb_file.endswith('_pb2.py'):
            base_name = os.path.basename(pb_file)[:-7]  # Remove _pb2.py
            rel_path = os.path.relpath(pb_file, '.')
            module_path = rel_path[:-3].replace(os.path.sep, '.')  # Convert path to module
            proto_to_module[base_name] = module_path
    
    # Fix imports in each file
    for pb_file in pb_files:
        with open(pb_file, 'r') as f:
            content = f.read()
        
        # Replace import statements
        for proto_name, module_path in proto_to_module.items():
            import_line = f'import {proto_name}_pb2 as {proto_name}__pb2'
            fixed_import = f'from {os.path.dirname(module_path)} import {proto_name}_pb2 as {proto_name}__pb2'
            content = content.replace(import_line, fixed_import)
        
        with open(pb_file, 'w') as f:
            f.write(content)


def main():
    """Main function."""
    args = parse_args()
    
    if args.clean:
        clean_generated_files()
    
    ensure_init_files()
    
    if generate_protos():
        print("Successfully generated Python code from .proto files")
    else:
        print("Failed to generate Python code from .proto files")
        sys.exit(1)


if __name__ == '__main__':
    main()
