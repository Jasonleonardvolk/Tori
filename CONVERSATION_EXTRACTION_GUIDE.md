# TORI Conversation Extraction Guide

This document describes the tools available for extracting valuable content from CLINE conversations, making it easier to utilize code, notes, and other information from AI chat sessions.

## Overview

The TORI Conversation Extraction system consists of three main components:

1. **extract_conversation.js**: A utility for processing conversation files and extracting code, notes, and clean conversation text.
2. **verify-extraction.js**: A verification tool to check the integrity and quality of extracted content.
3. **extraction-integration.js**: An integration script that combines the functionality of the other tools and interfaces with the TORI deployment system.

These tools are designed to work seamlessly with the TORI deployment system, enabling you to quickly extract useful content from AI conversations while building and deploying your projects.

## Quick Start

### Extract a Single Conversation File

```bash
# Basic usage
node extract_conversation.js path/to/conversation.md

# With custom output directory
node extract_conversation.js path/to/conversation.md --outdir ./my_extracted_content

# Using JSON format output
node extract_conversation.js path/to/conversation.md --format json
```

### Extract Multiple Files

```bash
# Process all .md, .json and .txt files in a directory
node extract_conversation.js --dir ./docs/conversations/3259

# With verification
node extract_conversation.js --dir ./docs/conversations/3259
node verify-extraction.js ./docs/conversations/3259/extracted
```

### Integration with TORI Deployment

Use the extraction features directly from the deployment scripts:

**Windows:**
```cmd
deploy-tori-chat.bat --extract="path/to/conversation.md" --verify

# Extract only, without deploying the app
deploy-tori-chat.bat --extract="path/to/conversation.md" --extract-only
```

**Mac/Linux:**
```bash
./deploy-tori-chat.sh --extract="path/to/conversation.md" --verify

# Extract only, without deploying the app
./deploy-tori-chat.sh --extract="path/to/conversation.md" --extract-only
```

## Detailed Usage

### extract_conversation.js

The primary extraction tool with various configuration options:

```
Usage:
  node extract_conversation.js <path-to-file>              # Process a single file
  node extract_conversation.js --dir <directory>           # Process all eligible files in directory
  node extract_conversation.js <file> --outdir <path>      # Specify custom output directory
  node extract_conversation.js --help                      # Show help information

Optional arguments:
  --format, -f <format>     Output format (default, json)
  --verbose, -v             Show detailed processing information
  --quiet, -q               Suppress non-essential outputs
```

The tool extracts:
- **Code**: All code blocks with appropriate language tagging
- **Notes**: Bullet points, numbered lists, and headers
- **Clean Conversation**: The conversation text without system prompts and formatting

### verify-extraction.js

A tool for verifying the integrity and quality of the extracted content:

```
Usage:
  node verify-extraction.js <directory>            # Verify files in a specific directory
  node verify-extraction.js --last                 # Verify most recently extracted files
  node verify-extraction.js --help                 # Show help information

Optional arguments:
  --report, -r <file>      Save verification report to specified file
  --fix, -f                Attempt to fix common issues automatically
  --verbose, -v            Show detailed verification information
```

The verification tool checks for:
- Missing files or empty files
- Malformed code blocks or JSON
- Unclosed code blocks
- Metadata consistency
- Other common issues

### extraction-integration.js

The integration script that unifies the extraction and verification tools:

```
Usage:
  node extraction-integration.js [options]

Options:
  --conversation, -c <path>   Path to conversation file or directory to process
  --output, -o <directory>    Custom output directory for extracted files
  --verify, -v                Verify extracted files after processing
  --auto-fix, -f              Automatically attempt to fix any issues found
  --silent, -s                Run in silent mode with minimal output
  --help, -h                  Show this help message
```

## Output Structure

### Default Output Location

By default, all extracted content is saved to:

```
ingest_pdf/extracted_conversations/
```

This is the canonical location for all CLINE conversation extractions, organized in subfolders:
- If a conversation ID is detected (a 4-digit number in the filename), it will be used as the subfolder name
- Otherwise, the current date in YYYYMMDD format will be used

For example:
```
ingest_pdf/extracted_conversations/3259/cline_task_may-21-2025_9-55-43-am_code.js
```

To specify a custom output location, use the `--outdir` parameter:
```
node extract_conversation.js conversation.md --outdir ./my_extracted_content
```

### Output Files

The extraction process produces several files for each processed conversation:

- **{baseName}_code.js**: Contains all code blocks with header comments
- **{baseName}_notes.md**: Contains all notes, bullet points, and headers
- **{baseName}_clean.md**: Contains the cleaned conversation text
- **{baseName}_metadata.json**: Contains metadata about the extraction process

When using JSON format, all content is combined into a single `{baseName}_extracted.json` file.

## Troubleshooting

### Common Issues

1. **Empty output files**: This can happen if the conversation doesn't contain the specific content type. For example, if there are no code blocks, the code file will be empty.

2. **Unclosed code blocks**: When a conversation file has unclosed code blocks (missing ending ```), the extractor will identify this and include a warning in the metadata.

3. **Extraction verification failures**: The verification tool may report issues with the extracted files. Use the `--fix` option to attempt to automatically resolve common issues.

### Manual Fixes

For issues that can't be automatically fixed:

1. Check the original conversation file for formatting issues.
2. Ensure code blocks are properly closed with triple backticks.
3. For malformed JSON, manually edit the files to correct the syntax.

## Best Practices

1. **Always verify after extraction**: Use the verification tool to ensure extracted content is correct and complete.

2. **Use custom output directories**: For important extractions, specify a custom output directory to avoid overwriting existing files.

3. **Extract first, then deploy**: When working with conversations that contain code or configuration you plan to use, extract the content first, then use the deployment script to build and deploy.

4. **Keep original conversations**: The extraction process doesn't modify original files, so always keep them for reference.

## Example Workflow

1. Have a conversation with CLINE about implementing a feature
2. Save the conversation as a markdown file
3. Extract the code and notes:
   ```
   node extract_conversation.js path/to/conversation.md --outdir ./my_feature
   ```
4. Verify the extraction:
   ```
   node verify-extraction.js ./my_feature
   ```
5. Review and implement the extracted code in your project
6. Deploy your project with the new feature:
   ```
   ./deploy-tori-chat.sh
   ```

## Future Improvements

Planned enhancements for the extraction system:

- Support for more output formats (HTML, PDF)
- Enhanced code analysis and linting
- Integration with version control systems
- Interactive UI for extraction and management
