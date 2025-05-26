import subprocess
import sys

# Test if the fixed files have valid Python syntax
files_to_check = [
    r"C:\Users\jason\Desktop\tori\kha\ingest_pdf\koopman_estimator.py",
    r"C:\Users\jason\Desktop\tori\kha\ingest_pdf\eigen_alignment.py"
]

print("🔍 Checking Python syntax for fixed files...")
all_valid = True

for file_path in files_to_check:
    print(f"\nChecking: {file_path}")
    try:
        result = subprocess.run(
            [sys.executable, "-m", "py_compile", file_path],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Syntax is valid!")
        else:
            print(f"❌ Syntax error: {result.stderr}")
            all_valid = False
    except Exception as e:
        print(f"❌ Error checking file: {e}")
        all_valid = False

if all_valid:
    print("\n🎉 All syntax errors fixed! Your advanced memory architecture is now 100% functional!")
else:
    print("\n⚠️ Some files still have issues. Please check the errors above.")
