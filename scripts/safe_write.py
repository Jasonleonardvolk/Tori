import os
import getpass

TARGET_DIR = r"C:\Users\jason\Desktop\tori\kha"
PASSWORD = "jason"

def check_password():
    pw = getpass.getpass("Enter password to write to kha directory: ")
    return pw == PASSWORD

def safe_write_file(filename, data):
    abs_path = os.path.abspath(filename)
    if not abs_path.startswith(os.path.abspath(TARGET_DIR)):
        raise PermissionError("Write blocked: Not in target directory.")
    if not check_password():
        raise PermissionError("Write blocked: Incorrect password.")
    with open(abs_path, "wb") as f:
        f.write(data)
    print(f"Write successful: {filename}")

# Example usage:
if __name__ == "__main__":
    # Example: try to write a file
    target_file = os.path.join(TARGET_DIR, "test.txt")
    try:
        safe_write_file(target_file, b"Hello, world!")
    except PermissionError as e:
        print(e)
