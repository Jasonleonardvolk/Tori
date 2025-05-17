import os
import json
import datetime
import gzip

# Path to the Status directory
status_dir = os.path.join('docs', 'Status')
# Output file path
output_file = os.path.join('docs', 'combined_status.json')
output_file_compressed = os.path.join('docs', 'combined_status.json.gz')

# Function to convert timestamp to readable date
def timestamp_to_date(timestamp):
    try:
        # Convert millisecond timestamp to readable date
        dt = datetime.datetime.fromtimestamp(int(timestamp)/1000)
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except:
        return timestamp

# Function to extract important fields from a file
def extract_important_data(file_data, file_name):
    # Based on file type, extract only the most important fields
    important_data = {}
    
    try:
        if file_name == "api_conversation_history.json":
            # For conversation history, we'll keep only essential message info
            if isinstance(file_data, list):
                important_data = []
                for message in file_data:
                    if isinstance(message, dict):
                        # Keep only essential fields from each message
                        simplified_message = {
                            "role": message.get("role", ""),
                            "id": message.get("id", ""),
                            "timestamp": message.get("timestamp", "")
                        }
                        # Add content summary if available
                        if "content" in message and message["content"]:
                            # Store only first 100 chars of content
                            content = message["content"]
                            if isinstance(content, list):
                                simplified_message["content_length"] = len(str(content))
                            elif isinstance(content, str):
                                simplified_message["content_length"] = len(content)
                                if len(content) > 100:
                                    simplified_message["content_preview"] = content[:100] + "..."
                                else:
                                    simplified_message["content_preview"] = content
                        important_data.append(simplified_message)
            return important_data
            
        elif file_name == "context_history.json":
            # For context history, preserve structure but trim content
            if isinstance(file_data, dict):
                for key, value in file_data.items():
                    if isinstance(value, list) and len(value) > 0:
                        important_data[key] = f"[{len(value)} items]"
                    elif isinstance(value, dict):
                        important_data[key] = "{...}"
                    else:
                        important_data[key] = value
            return important_data
            
        elif file_name == "task_metadata.json":
            # For task metadata, keep most fields as they're usually important
            if isinstance(file_data, dict):
                # Select only the most critical metadata fields
                for key in ["id", "title", "description", "status", "created_at", "updated_at"]:
                    if key in file_data:
                        important_data[key] = file_data[key]
            return important_data
            
        elif file_name == "ui_messages.json":
            # For UI messages, keep count and a sample
            if isinstance(file_data, list):
                message_count = len(file_data)
                important_data = {
                    "message_count": message_count,
                    "sample": file_data[:2] if message_count > 2 else file_data
                }
            return important_data
            
        # Default - return original if we don't know how to optimize this file type
        return file_data
        
    except Exception as e:
        return {"error": f"Error extracting data: {str(e)}"}

# Dictionary to store all the combined data - use a more efficient structure
combined_data = []

# Sort directories by timestamp to process chronologically
all_dirs = [d for d in os.listdir(status_dir) if os.path.isdir(os.path.join(status_dir, d))]
all_dirs.sort()  # Sort chronologically

# Process directories
for dir_name in all_dirs:
    dir_path = os.path.join(status_dir, dir_name)
    
    # Create a simplified entry for this directory
    readable_date = timestamp_to_date(dir_name)
    dir_entry = {
        "t": dir_name,  # shorter key name
        "date": readable_date,
        "f": {}  # shorter key name for files
    }
    
    # Process each JSON file in the directory
    for file_name in os.listdir(dir_path):
        if file_name.endswith('.json'):
            file_path = os.path.join(dir_path, file_name)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    file_data = json.load(f)
                    # Extract only important data from each file
                    important_data = extract_important_data(file_data, file_name)
                    dir_entry["f"][file_name] = important_data
            except Exception as e:
                dir_entry["f"][file_name] = {"error": f"Error reading file: {str(e)}"}
    
    combined_data.append(dir_entry)
    print(f"Processed directory: {dir_name}")

# Determine file size using different compression settings to hit target size
target_size_bytes = 180 * 1024 * 1024  # 180 MB in bytes

# Try with minimal indentation first (most space efficient)
json_str = json.dumps(combined_data, separators=(',', ':'))
if len(json_str.encode('utf-8')) <= target_size_bytes:
    # If it fits under target with no indentation, write it out
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(json_str)
    file_size = len(json_str.encode('utf-8'))
else:
    # If still too large, create compact output with minimal indentation
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(combined_data, f, indent=None, separators=(',', ':'))
    file_size = os.path.getsize(output_file)

print(f"\nAll files combined successfully into: {output_file}")
print(f"Total number of directories processed: {len(combined_data)}")
print(f"File size: {file_size / (1024 * 1024):.2f} MB")

# Also create a compressed version for reference
with open(output_file, 'rb') as f_in:
    with gzip.open(output_file_compressed, 'wb') as f_out:
        f_out.write(f_in.read())
print(f"Compressed version also created: {output_file_compressed}")
print(f"Compressed size: {os.path.getsize(output_file_compressed) / (1024 * 1024):.2f} MB")
