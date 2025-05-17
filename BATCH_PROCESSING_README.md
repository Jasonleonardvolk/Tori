# PDF Batch Processing System

A comprehensive system for processing thousands of PDF documents, extracting concepts, calculating Lyapunov predictability metrics, and organizing the results efficiently.

## Features

- **Fully Automatic Processing**: Scans directories recursively and processes all PDFs without requiring manual intervention
- **Duplicate Detection**: Uses SHA-256 hashing to identify and skip duplicate documents
- **Parallel Processing**: Processes multiple PDFs simultaneously for faster throughput (defaults to 2 at a time)
- **Smart Sharding**: Prevents NPZ files from growing too large by automatically creating new shards
- **Resume Capability**: Can be interrupted and restarted without losing progress
- **Process Monitoring**: Real-time progress tracking with estimated completion time
- **Comprehensive Logging**: Detailed logs of all operations for troubleshooting

## Getting Started

To process all PDFs in the USB Drive folder:

```
.\process_usb_pdfs.bat
```

For more control, use the Python script directly:

```
python batch_process_pdfs.py [source_dir] [output_dir] [--parallel N] [--max-size MB]
```

Examples:
- Process with 4 parallel workers: `python batch_process_pdfs.py "data/USB Drive" "output/processed_pdfs" --parallel 4`
- Set maximum NPZ size to 100MB: `python batch_process_pdfs.py "data/USB Drive" "output/processed_pdfs" --max-size 100`

## Output Structure

The batch processor creates the following directory structure and files:

```
output/processed_pdfs/
├── concepts/
│   ├── concepts_shard_001.npz     # Sharded concept data (max 50MB each)
│   ├── concepts_shard_001.json
│   ├── concepts_shard_002.npz
│   └── ...
├── uploads/
│   ├── document1_timestamp.pdf    # Copies of processed PDFs
│   └── ...
├── master_index.json              # Index of all processed PDFs
├── shard_info.json                # Information about shards
├── duplicate_files.json           # Log of duplicate files
├── processing_history.json        # Processing history and hash database
├── last_run_summary.json          # Summary of the last processing run
└── batch_processing.log           # Detailed processing log
```

## File Format Details

### master_index.json
Contains information about each processed PDF, including:
- Original file path
- Stored copy path
- File hash
- Processing timestamp
- Shard assignment
- Concept count and names

### shard_info.json
Contains information about each NPZ shard, including:
- Shard ID and name
- File paths
- Creation timestamp
- Size in KB
- PDF count
- Concept count

### processing_history.json
Tracks which files have been processed to avoid duplicate processing in future runs. Contains:
- List of processed file paths
- Hash-to-metadata mapping for quick lookups

## Lyapunov Predictability Metrics

The batch processor integrates with the Lyapunov predictability analysis system to calculate:

- **Concept predictability scores**: Measures how predictably concepts are used throughout documents
- **Document chaos profiles**: Shows how predictability varies throughout a document

These metrics are included in the JSON output for each document and can be visualized in the ALAN IDE.

## System Requirements

- Python 3.8+
- NumPy
- scikit-learn
- tqdm (for progress bars)

## Troubleshooting

If you encounter issues:

1. Check the `batch_processing.log` file for detailed error messages
2. Ensure you have sufficient disk space for the output files
3. For very large PDF collections, consider processing in smaller batches

## Advanced Usage

### Processing Specific Subdirectories

```
python batch_process_pdfs.py "data/USB Drive/docs/BANKSY" "output/banksy_pdfs"
```

### Resuming Interrupted Processing

Simply run the same command again. The processor will skip already processed files based on their hash.

### Adjusting Shard Size

Lower the `--max-size` parameter if you need smaller, more manageable NPZ files:

```
python batch_process_pdfs.py "data/USB Drive" "output/processed_pdfs" --max-size 25
