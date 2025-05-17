import os
import json
import datetime
import sys

# Path to the Status directory
status_dir = os.path.join('docs', 'Status')
# Output file path
output_file = os.path.join('docs', 'combined_status.json')

# Target file size in MB
target_mb = 180 
# Preservation factor (1.0 = keep everything, 0.0 = maximum reduction)
# Increase this to produce a larger file
preservation_factor = 0.99
target_bytes = target_mb * 1024 * 1024

# Function to convert timestamp to readable date
def timestamp_to_date(timestamp):
    try:
        # Convert millisecond timestamp to readable date
        dt = datetime.datetime.fromtimestamp(int(timestamp)/1000)
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except:
        return timestamp

# Function to selectively reduce data size while preserving important information
def reduce_data_size(file_data, file_name, reduction_factor=0.6):
    """
    Selectively reduce data size while keeping structure intact.
    The reduction_factor controls how aggressive we are (0.0 = keep everything, 1.0 = remove everything)
    """
    if isinstance(file_data, dict):
        result = {}
        for key, value in file_data.items():
            # Selectively include fields based on importance and file type
            if file_name == "api_conversation_history.json":
                # For conversation history, keep important message data
                result[key] = reduce_data_size(value, file_name, reduction_factor)
            
            elif file_name == "context_history.json" and isinstance(value, list) and len(value) > 10:
                # For large lists in context history, sample items
                sample_size = max(int(len(value) * (1.0 - reduction_factor)), 5)
                result[key] = value[:sample_size]
            
            elif file_name == "task_metadata.json":
                # Keep all metadata as it's generally important
                result[key] = reduce_data_size(value, file_name, reduction_factor * 0.5)
            
            else:
                # Default handling for other fields
                result[key] = reduce_data_size(value, file_name, reduction_factor)
        
        return result
    
    elif isinstance(file_data, list):
        if len(file_data) > 20:
            # For large lists, sample items with emphasis on first and last items
            # which often contain more relevant information
            sample_size = max(int(len(file_data) * (1.0 - reduction_factor)), 10)
            if file_name == "api_conversation_history.json":
                # For conversation history, keep a balanced sample from beginning, middle and end
                first_half = sample_size // 2
                second_half = sample_size - first_half
                sampled_data = file_data[:first_half] + file_data[-second_half:]
                # Process each message to reduce content size
                return [reduce_message_content(item, reduction_factor) if isinstance(item, dict) else item 
                        for item in sampled_data]
            else:
                # For other lists, just take a sample
                return file_data[:sample_size]
        else:
            # For smaller lists, process each item
            return [reduce_data_size(item, file_name, reduction_factor) for item in file_data]
    
    elif isinstance(file_data, str) and len(file_data) > 1000:
        # Truncate long strings
        max_length = max(int(len(file_data) * (1.0 - reduction_factor)), 500)
        return file_data[:max_length] + "... [truncated]"
    
    else:
        # Keep other data types unchanged
        return file_data

def reduce_message_content(message, reduction_factor):
    """Special handler for message objects to preserve structure but reduce content size"""
    if not isinstance(message, dict):
        return message
    
    result = message.copy()
    
    # Handle content field specially
    if "content" in result:
        content = result["content"]
        if isinstance(content, str) and len(content) > 500:
            # Truncate long content strings
            max_length = max(int(len(content) * (1.0 - reduction_factor)), 500)
            result["content"] = content[:max_length] + "... [truncated]"
        elif isinstance(content, list):
            # For list content (like in Claude), process each item
            result["content"] = [reduce_data_size(item, "content", reduction_factor) 
                               for item in content[:max(int(len(content) * (1.0 - reduction_factor)), 3)]]
    
    return result

# Dictionary to store all the combined data
combined_data = {}

# Measure original total size for estimation
original_total_size = 0
for dir_name in os.listdir(status_dir):
    dir_path = os.path.join(status_dir, dir_name)
    if os.path.isdir(dir_path):
        for file_name in os.listdir(dir_path):
            if file_name.endswith('.json'):
                file_path = os.path.join(dir_path, file_name)
                original_total_size += os.path.getsize(file_path)

print(f"Estimated original total size: {original_total_size / (1024 * 1024):.2f} MB")

# Calculate initial reduction factor based on target size
calculated_reduction = 1.0 - (target_bytes / original_total_size)
# Adjust reduction factor using preservation factor (higher preservation = lower reduction)
reduction_factor = calculated_reduction * (1.0 - preservation_factor)
# Limit reduction factor to reasonable range
reduction_factor = max(0.1, min(0.8, reduction_factor))
print(f"Original estimated reduction needed: {calculated_reduction:.2f}")
print(f"Using adjusted reduction factor: {reduction_factor:.2f} (preservation: {preservation_factor:.2f})")

# Process directories
dirs_processed = 0
for dir_name in os.listdir(status_dir):
    dir_path = os.path.join(status_dir, dir_name)
    
    # Skip if not a directory
    if not os.path.isdir(dir_path):
        continue
    
    # Create an entry for this directory
    readable_date = timestamp_to_date(dir_name)
    combined_data[dir_name] = {
        "timestamp": dir_name,
        "readable_date": readable_date,
        "files": {}
    }
    
    # Process each JSON file in the directory
    for file_name in os.listdir(dir_path):
        if file_name.endswith('.json'):
            file_path = os.path.join(dir_path, file_name)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    file_data = json.load(f)
                    # Reduce data size while preserving important information
                    reduced_data = reduce_data_size(file_data, file_name, reduction_factor)
                    combined_data[dir_name]["files"][file_name] = reduced_data
            except Exception as e:
                combined_data[dir_name]["files"][file_name] = {"error": f"Error reading file: {str(e)}"}
    
    dirs_processed += 1
    print(f"Processed directory: {dir_name} ({dirs_processed}/{len([d for d in os.listdir(status_dir) if os.path.isdir(os.path.join(status_dir, d))])})")

# Estimate size before writing
json_str_sample = json.dumps(combined_data, indent=1)[:1000000]  # Take a 1MB sample
estimated_size = len(json_str_sample) * (len(json.dumps(combined_data)) / len(json.dumps(combined_data)[:1000000]))
print(f"Estimated output size: {estimated_size / (1024 * 1024):.2f} MB")

# Use a larger indentation value to increase file size
indentation = 4
print(f"Using indentation level of {indentation} to reach target file size")

# Add optional spacing to JSON output to increase file size
json_separators = (', ', ': ')
print("Using expanded JSON separators to increase file size")

# Write the combined data to a single file
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(combined_data, f, indent=indentation, separators=json_separators)

final_size = os.path.getsize(output_file)
print(f"\nAll files combined successfully into: {output_file}")
print(f"Total number of directories processed: {len(combined_data)}")
print(f"Final file size: {final_size / (1024 * 1024):.2f} MB")

# Report percentage of original size
percent_of_original = (final_size / original_total_size) * 100
print(f"Final file is {percent_of_original:.1f}% of the original size")
