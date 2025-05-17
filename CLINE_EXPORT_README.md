# Cline Conversation Exporter Toolkit

A set of utilities to find and export conversation data from Cline tasks in VS Code.

## Features

- Find Cline data directories on your system
- Export conversations from all Cline tasks or a specific task ID
- Works anywhere in your project structure
- Transforms messages into a standardized format
- Compatible with Node.js (both CommonJS and ES Modules)
- Cross-platform support (Windows and Unix/Linux)

## Files

### Exporter Tools
- `export-cline.js` - ES Modules version of the exporter
- `export-cline-cjs.js` - CommonJS version of the exporter
- `export-cline.bat` - Windows batch file to run the exporter (uses CommonJS version by default)
- `export-cline.sh` - Unix/Linux shell script to run the exporter

### Finder Tools
- `find-cline-directory.js` - Utility to locate .cline directories on your system
- `find-cline-directory.bat` - Windows batch file to run the finder

### Documentation
- `CLINE_EXPORT_README.md` - This documentation file

## Usage

### Basic Usage

Simply run the batch file from your project root:

```
./export-cline.bat
```

This will:
1. Look for the `.cline/tasks` directory in your project
2. Export all conversations
3. Save them to a timestamped JSON file (`Cline_Conversation_TIMESTAMP.json`)

### Export Specific Task

To export just one specific task, pass the task ID as an argument:

```
./export-cline.bat 42
```

### Location of Cline Data

Cline stores conversations in:

```
<project-root>/.cline/tasks/<task-id>/
    ├─ ui_messages.json            ← what you see in the chat panel
    └─ api_conversation_history.json  ← full Claude request/response bodies
```

## Output Format

The exported JSON file contains an array of messages with this structure:

```json
[
  {
    "id": 1,
    "role": "user",
    "timestamp": "2025-05-10T17:44:38.000Z",
    "content": "Your message here"
  },
  {
    "id": 2,
    "role": "assistant",
    "timestamp": "2025-05-10T17:45:12.000Z",
    "content": "Assistant's response here"
  }
]
```

## Troubleshooting

- **Error: .cline directory not found**: Make sure you're running the script from your project root, or edit the script to specify the full path to your `.cline` directory.
- **No messages exported**: Verify that you have Cline tasks in your project. The `.cline/tasks` directory should exist and contain task folders.

## Customization

You can customize the script by editing the config section at the top:

```javascript
// --- config -------------------------------------------------------
const root = process.cwd();              // or hard-code your repo path
const tasksDir = path.join(root, '.cline', 'tasks');
const pickTask = process.argv[2];        // allow: node export… <taskId>
// -----------------------------------------------------------------
