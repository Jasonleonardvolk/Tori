# ALAN Quick Start Guide

## Overview

ALAN (Advanced Logic And Neurocognition) is a pure emergent cognition system designed to acquire knowledge through principled data ingestion rather than pretrained weights. Unlike conventional ML systems, ALAN builds knowledge structures using Koopman phase graphs and oscillatory dynamics, ensuring all concepts maintain provenance, coherence, and spectral lineage.

ALAN's five commitments:

1. **No Pretraining**: Knowledge derived only from curated, transparent canonical sources.
2. **No Token Imitation**: Using Koopman eigenflows for conceptual reasoning, not statistical prediction.
3. **No Memory Bloat**: Entropy-gated memory integration to prevent storing duplicate/inert concepts.
4. **No Opaque Models**: Tracking concept provenance and eigenfunction IDs for transparency.
5. **No Blind Inference**: Using oscillator synchrony to reflect phase-coherent truth.

## Getting Started

### Initial Setup

1. Ensure Python 3.8+ and required dependencies are installed:
   ```
   pip install -r requirements.txt
   ```

2. Initialize the ALAN system:
   ```
   python start_alan.py init
   ```
   Or on Windows:
   ```
   start_alan.bat init
   ```

### Ingesting Knowledge

ALAN acquires knowledge by ingesting PDFs from canonical sources. The system evaluates whether a source meets the required standards for inclusion.

To ingest a single PDF file:
```
python start_alan.py ingest path/to/document.pdf
```

To ingest all PDFs from a directory:
```
python start_alan.py ingest path/to/directory --recursive
```

You can specify the domain to improve classification:
```
python start_alan.py ingest path/to/document.pdf --domain mathematics
```

### Exploring Knowledge

To view recently ingested concepts:
```
python start_alan.py explore
```

To search for specific concepts:
```
python start_alan.py explore --query "oscillation"
```

### System Statistics

To view system statistics:
```
python start_alan.py stats
```

You can also save statistics to a JSON file:
```
python start_alan.py stats --output stats.json
```

### System Reset

If needed, you can reset the system (this will back up existing data):
```
python start_alan.py reset --confirm
```

## Understanding ALAN's Components

### Koopman Phase Graphs

At the core of ALAN's knowledge representation are Koopman phase graphs, which:

* Represent concepts as nodes with phase oscillators
* Use spectral fingerprinting to identify concept resonance
* Apply entropy-gating to prevent memory bloat
* Track complete provenance for all knowledge
* Enable phase-locked concept clusters for coherent reasoning

### Canonical Source Curation

ALAN only ingests knowledge from high-quality canonical sources:

* Academic papers (preferred)
* Technical specifications and manuals
* Formal mathematical texts
* Scientific datasets with formal structure

Sources are evaluated based on:
* Domain relevance
* Format quality
* Content depth
* Formal structure
* Source credibility

### Active Ingestion Process

When a document is ingested:

1. Source is validated against canonical criteria
2. Concepts are extracted from the content
3. Each concept receives a spectral fingerprint
4. Concepts are evaluated by the entropy gate
5. Admitted concepts are integrated into the phase graph
6. Phase synchronization is updated across the graph

### Entropy-Gated Memory Integration

All concepts pass through entropy-based gating to ensure they:

* Provide sufficient information content (measured via Shannon entropy)
* Aren't redundant with existing concepts
* Contribute to cognitive diversity
* Have clear provenance and lineage

## Recommended Source Types

ALAN works best with highly structured formal content such as:

* ArXiv papers on mathematics, physics, control theory, dynamical systems
* Formal specifications of algorithms and systems
* Research papers with formal definitions and theorems
* High-quality textbooks on foundational topics

Avoid:
* Opinion pieces or blogs
* Social media content
* News articles
* Marketing materials
* Content lacking formal structure

## Troubleshooting

### Common Issues

1. **PDF ingestion fails**:
   * Ensure the PDF is accessible and not password-protected
   * Check that the file meets the canonical source criteria
   * Verify PDF is properly formatted (not scanned or image-based)

2. **System seems slow**:
   * Spectral analysis of large networks can be computationally intensive
   * Consider limiting the number of concepts per source
   * Use domain-specific ingestion for better focus

3. **Phase coherence issues**:
   * If concepts aren't clustering properly, ingest more foundational sources
   * Add sources that bridge between disconnected domains
   * Use the stats command to check phase clustering metrics

## Advanced Usage

### Custom Domain Classification

You can specify custom domains to organize your knowledge ingestion:
```
python start_alan.py ingest path/to/file.pdf --domain "quantum_computing"
```

### Batch Processing With Domain Detection

For large collections with mixed content, you can process them in batches:
```
python start_alan.py ingest path/to/directory --recursive
```

The system will attempt to detect appropriate domains automatically.

## Further Development

ALAN is designed as a foundation for emergent cognition without relying on pretrained data. Future developments may include:

* Enhanced spectral analysis of knowledge graphs
* More sophisticated phase-walking algorithms for inference
* Integration with formal proof systems
* Expanded canonical source validation
* Interactive knowledge exploration interfaces

## License and Attribution

ALAN is an open system committed to transparency in knowledge acquisition and reasoning. When using or extending ALAN, please maintain the core commitments to transparency, provenance, and emergent rather than imitative cognition.
