# Enhanced Lyapunov Predictability Analysis

This module implements a robust Lyapunov exponent-based predictability analysis for concepts extracted from documents in the ALAN IDE. Based on the Rosenstein algorithm, it provides mathematically sound insights into which concepts follow predictable patterns versus which ones are used in more chaotic/creative ways.

## Overview

The Lyapunov predictability analysis integrates directly with the ALAN 2.x architecture described in the elfin.pdf document, building on the existing Koopman operator and oscillator networks to provide richer insights into concept dynamics.

### Key Components

1. **`ingest_pdf/lyapunov.py`** - Robust implementation of Rosenstein's algorithm for calculating Lyapunov exponents
2. **`batch_process_pdfs.py`** - Batch processing system for analyzing document collections
3. **`ConceptFieldCanvas.jsx`** - Enhanced visualization showing concept predictability through color modulation
4. **`LyapunovPredictabilityPanel`** - UI component for displaying predictability analysis and document chaos profiles

## Features

### 1. Concept Predictability Analysis

Concepts are analyzed to determine how predictable their usage is throughout a document:

- **Predictable concepts** (blue border, muted colors) - Follow established patterns, appear in expected contexts
- **Chaotic/creative concepts** (orange border, vibrant colors) - Used in novel ways, appear in unexpected contexts

### 2. Document Chaos Profile

A visualization showing how predictability varies throughout the document:

- **Peaks** - Indicate sections with novel, creative concept usage
- **Valleys** - Indicate formulaic, predictable sections

### 3. Batch Processing System

The batch processor can analyze thousands of PDFs efficiently:

- **Parallel Processing** - Handles multiple documents simultaneously
- **Smart Sharding** - Prevents NPZ files from growing too large (configurable limit)
- **Duplicate Detection** - Uses SHA-256 hashing to identify and skip duplicates
- **Comprehensive Logging** - Detailed logs, per-document records, and summary statistics
- **Robust Error Handling** - Gracefully manages errors without stopping the batch

### 4. Integrated Navigation Tab

The feature is accessible through the "Lyapunov Predictability" tab in the ALAN IDE Navigation interface.

## Using the Analysis

### Running Analysis on a Single PDF Document

```bash
# Analyze a PDF document
.\analyze_pdf_predictability.bat docs\elfin.pdf

# Specify custom output directory
.\analyze_pdf_predictability.bat docs\elfin.pdf output\custom_dir
```

### Processing Multiple Documents in Batch

```bash
# Process all PDFs in the USB Drive folder
.\process_usb_pdfs.bat

# Custom batch processing with specific parameters
python batch_process_pdfs.py --input_dir "data/docs" --output_dir "output/results" --parallelism 4 --max_file_size 104857600 --verbose
```

### Interpreting Results

1. **Concept Node Colors**:
   - Vibrant colors with orange borders indicate chaotic/creative concept usage
   - Muted colors with blue borders indicate predictable/formulaic concept usage
   - Color hue still represents the concept's phase as in regular visualization

2. **Document Chaos Profile**:
   - Orange sections indicate creative parts of the document
   - Blue sections indicate more formulaic parts of the document

3. **Batch Processing Output**:
   - `predictability_results.json` - JSON file for visualization
   - `predictability_results.npz` - NumPy archive for internal use
   - `batch_processing.log` - Detailed processing log
   - `batch_processing.json` - Per-document results in JSON format
   - `last_run_summary.json` - Summary statistics for the batch run

## Technical Implementation

### Rosenstein Algorithm for Lyapunov Exponent Calculation

The analysis uses Rosenstein's algorithm to robustly estimate the largest Lyapunov exponent:

1. For each concept, track its occurrences through the document as a sequence
2. For each point in the sequence, find its k nearest neighbors (excluding temporal neighbors)
3. Follow these trajectories forward and measure how they diverge over time
4. Compute the average logarithmic divergence at each time step
5. Fit a linear regression to the divergence curve to estimate the Lyapunov exponent (slope)

This approach is more robust than simple nearest-neighbor divergence, especially for shorter sequences or noisy data.

### Tunable Parameters

The implementation offers several parameters for fine-tuning the analysis:

- **k** - Number of nearest neighbors to consider (default: 3)
- **len_trajectory** - Number of time steps to follow the divergence (default: 15)
- **min_separation** - Minimum temporal separation between neighbors (default: 1)
- **outlier_threshold** - Distance threshold for excluding outlier neighbors (optional)

### Integration with ALAN 2.x Architecture

- Uses the same Koopman operator spectral embeddings for concept representation
- Complements the phase-based oscillator network with predictability metrics
- Extends the "Evaluation Dashboard" concept described in the elfin.pdf document

## Future Extensions

1. **Real-time Code Analysis** - Provide predictability feedback as users write code
2. **Temporal Evolution** - Track how concept predictability changes over document versions
3. **Cross-Document Comparison** - Compare predictability patterns across multiple documents
4. **Neural Network Integration** - Combine with neural methods for enhanced predictability metrics

## Related Files

- `ingest_pdf/lyapunov.py` - Core Lyapunov calculation with Rosenstein algorithm
- `batch_process_pdfs.py` - Batch processing system for document collections
- `process_usb_pdfs.bat` - Easy-to-use batch processing script
- `ingest_pdf/LYAPUNOV_ANALYSIS.md` - Detailed technical explanation
- `client/src/components/LyapunovPredictabilityPanel/` - UI components
- `ConceptFieldCanvas.jsx` - Enhanced visualization with predictability indicators
