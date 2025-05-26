# TORI Ingest & ScholarSphere Integration Guide

This guide explains how the TORI Conversation Extraction system integrates with the Ingest Bus service and ScholarSphere knowledge system. It covers the complete workflow from conversation extraction to knowledge utilization.

## System Overview

The integration between CLINE conversations and the ScholarSphere knowledge system consists of three main components:

1. **Conversation Extraction System**: Extracts code, notes, and clean conversation text from CLINE conversations
2. **Ingest Bus Service**: Processes documents, chunks content, vectorizes, and maps to concepts
3. **ScholarSphere Integration**: Provides knowledge retrieval, citation, and visualization

```
┌───────────────┐     ┌────────────┐     ┌────────────────┐
│    CLINE      │     │ Ingest Bus │     │  ScholarSphere │
│ Conversations │────▶│  Service   │────▶│  Knowledge Base│
└───────────────┘     └────────────┘     └────────────────┘
        │                                        │
        │                                        │
        ▼                                        ▼
┌───────────────┐                       ┌────────────────┐
│  Extraction   │                       │    Citation    │
│    Output     │                       │  & Retrieval   │
└───────────────┘                       └────────────────┘
```

## Getting Started

### Step 1: Start the Ingest Bus Service

The Ingest Bus service must be running to process documents and provide knowledge retrieval:

**Windows**:
```
start-ingest-bus.bat
```

**Unix/Mac**:
```
./start-ingest-bus.sh
```

### Step 2: Process CLINE Conversations

Use the extraction system to process conversations:

```
node extract_conversation.js path/to/conversation.md
```

This extracts content to the canonical location (`ingest_pdf/extracted_conversations/`), organizing by conversation ID.

### Step 3: Ingest into ScholarSphere

The extracted content is automatically picked up by the Ingest Bus service, which processes it through the following stages:

1. **Extraction**: Content from conversation is prepared
2. **Chunking**: Content is divided into optimal chunks
3. **Vectorization**: Chunks are converted to phase vectors
4. **Concept Mapping**: Content is mapped to existing concepts or creates new ones
5. **Storage**: Content is stored with full provenance in ScholarSphere

### Step 4: Use Knowledge in TORI

The knowledge can be accessed in multiple ways:

- **DocAgentPanel**: Search and display knowledge with citations
- **CLINE**: Use MCP tool `kb.search` to find relevant content
- **Phase Field Lens**: Visualize concepts and relationships

## MCP Integration

The system is integrated with MCP via `.mcp.json`, providing the following tools:

- `ingest.queue`: Queue a document for processing
- `ingest.status`: Check processing status
- `ingest.metrics`: Get system performance metrics
- `kb.search`: Search the knowledge base
- `kb.retrieve`: Get specific content with citation information

Example MCP tool usage in CLINE:

```javascript
// Search the knowledge base
const results = await use_mcp_tool('ingest-bus', 'kb.search', {
  query: 'phase vectors in quantum mechanics',
  limit: 5,
  min_relevance: 0.7
});

// Display citation
const citation = `[§${results.results[0].source}] ${results.results[0].text.substring(0, 100)}...`;
```

## ScholarSphere Citation System

Citations from ScholarSphere follow this format:

```
[§Source, page/section] "Extracted text..."
```

For example:
```
[§Spivak, Calculus on Manifolds, p.14] "This definition aligns with the notion of differential form..."
```

### Citation Previews

The DocAgentPanel provides preview capabilities for citations:
- Hover over a citation to see a preview
- Click "View in Lens" to see the concept in the Phase Field Lens
- Associated concepts are displayed with each citation

## Monitoring & Metrics

The system includes comprehensive monitoring:

1. **Prometheus Metrics**: Available at `http://localhost:8080/metrics/prometheus`
2. **Alert Rules**: Defined in `prometheus/ingest-bus-alerts.yml`
3. **Grafana Dashboard**: Available in `grafana/ingest-bus-dashboard.json`

Key metrics to monitor:
- `ingest_files_processed_total`: Documents processed
- `concept_recall_accuracy`: Quality of concept mapping
- `chunk_avg_len_chars`: Average chunk size
- `queue_depth`: Current queue backlog

### Kaizen Integration

Alerts automatically create Kaizen tickets:
- `INGEST-ALERT`: High failure rate in document processing
- `KB-REGRESS`: Decline in concept recall accuracy
- `INGEST-DOWN`: Service unavailability

## Troubleshooting

### Verifying Extraction Quality

Use the verification tool to check extraction quality:

```
node verify-extraction.js --last
```

This produces a detailed report of any issues with the extraction.

### Testing the Ingest Service

Run the smoke test to verify the Ingest Bus service:

```
cd ingest-bus
python smoke_test.py
```

### Common Issues

1. **Connection refused**: Ensure the Ingest Bus service is running (`start-ingest-bus.bat` or `./start-ingest-bus.sh`)

2. **Extraction files missing**: Check the extraction was successful with `node verify-extraction.js --last`

3. **No results in knowledge search**: Wait for content to be fully processed (~30 seconds) after ingestion

4. **Low concept recall accuracy**: May indicate a need to retrain or update the concept mapping model

## Advanced Usage

### Processing Custom Document Types

To process custom document types:

1. Update the schema in `ingest-bus/models/schemas.py` to include new document type
2. Implement extraction in `ingest-bus/workers/extract.py`
3. Update the MCP schema in `registry/mcp/ingest.schema.yaml`

### Phase Vector Alignment

ScholarSphere uses phase vectors to align concepts. These are multi-dimensional representations of semantic content with specific properties:

- Each vector has `phase_vector_dim` dimensions (default: 1024)
- Vectors are normalized and can be compared using cosine similarity
- Related concepts have similar phase vectors
- Each vector includes encoder version for tracking

### Batch Processing

For batch processing of multiple documents:

```
node extract_conversation.js --dir ./my_documents
```

Or for integration with deployment:

```
./deploy-tori-chat.sh --extract="./my_documents" --extract-only
```

## Future Enhancements

Planned enhancements for the system:

1. **AV/Hologram Support**: Processing audio and video with spectral emotion mapping
2. **Real-time Ingest Stream**: WebSocket-based streaming updates for live content
3. **Enhanced Concept Visualization**: Interactive 3D visualization of concept spaces
4. **Cross-modal Retrieval**: Finding concepts across different media types
