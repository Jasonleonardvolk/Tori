# Extracted Conversations

This folder contains verified and structured CLINE-to-TORI conversation content.

## Purpose

This is the canonical location for all extracted content from CLINE conversations, including:
- Code snippets and examples
- Notes and documentation
- Clean conversation text
- Metadata about the extraction process

## Folder Structure

Each conversation is stored in a subfolder named after its ID or date:

```
extracted_conversations/
├── 3259/                    # Folder named after conversation ID
│   ├── conversation_code.js     # Extracted code blocks
│   ├── conversation_notes.md    # Extracted notes and headings
│   ├── conversation_clean.md    # Clean conversation text
│   └── conversation_metadata.json # Metadata about the extraction
├── 20250521/                # Folder named after date (YYYYMMDD)
│   └── ...
└── README.md                # This file
```

## How This Directory Is Used

This directory is the default output location for:
- `extract_conversation.js` - Main extraction tool
- `extraction-integration.js` - Extraction workflow manager
- `verify-extraction.js` - Content verification utility

## Downstream Consumers

The extracted content in this directory is used by:
- Memory Agents and knowledge databases
- Documentation generators
- Code repositories and examples
- ML training pipelines

## Using the Extraction Tools

Extract a conversation:
```bash
node extract_conversation.js path/to/conversation.md
```

Verify extracted content:
```bash
node verify-extraction.js --last
```

Use the deployment integration:
```bash
# Windows
deploy-tori-chat.bat --extract="path/to/conversation.md" --extract-only

# Mac/Linux
./deploy-tori-chat.sh --extract="path/to/conversation.md" --extract-only
```

For more information, see the [CONVERSATION_EXTRACTION_GUIDE.md](../../CONVERSATION_EXTRACTION_GUIDE.md) in the root directory.

## Notes

- The extraction process never modifies original conversation files.
- Multiple formats are supported, including JSON output.
- For large conversations, the extraction process may take a few seconds.
- All extraction operations are logged to the console.
