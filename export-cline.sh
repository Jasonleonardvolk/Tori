#!/bin/bash
# export-cline.sh - Run the Cline conversation exporter on Unix-like systems

echo "Running Cline Conversation Exporter..."
echo

# Check if .cline directory exists
if [ ! -d ".cline" ]; then
  echo "Error: .cline directory not found in current location."
  echo "Please run this script from your project root or specify the correct path in export-cline.js."
  echo
  exit 1
fi

# Run the exporter with Node.js (using CommonJS version for compatibility)
node export-cline-cjs.js "$@"

# Check for success
if [ $? -eq 0 ]; then
  echo
  echo "Export completed successfully! Look for Cline_Conversation_*.json in the current directory."
else
  echo
  echo "Error during export. Please check if Node.js is installed and .cline/tasks exists."
fi

echo
echo "Press Enter to exit..."
read
