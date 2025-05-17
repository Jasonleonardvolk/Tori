// Test script for MCP filesystem server
console.log("Testing MCP Filesystem Server connection...");

// This script will help verify if the MCP server is connected properly
// We'll set up a simple test that uses various filesystem functions

const directoriesToTest = [
  "c:/Users/jason/Desktop/tori/kha",
  "c:/Users/jason/Desktop",
  "c:/Users/jason/Documents"
];

console.log("Allowed directories:", directoriesToTest);
console.log("If the MCP server is properly connected, Claude will be able to perform filesystem operations on these directories");
console.log("Try asking Claude to use tools like list_directory, read_file, or search_files");
