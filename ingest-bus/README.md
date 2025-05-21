# Ingest Bus Service

A microservice for document ingestion with MCP integration, efficient delta-based transport, and special handling for mathematical content.

## Features

- **MCP Tool Integration**: Expose document ingestion capabilities as MCP tools
- **SHA-256 Deduplication**: Prevent duplicate document processing
- **Delta Protocol**: Efficient state transfer for high-frequency updates
- **Math-Aware Processing**: Special handling for LaTeX math formulas
- **Chart Detection**: Extract and generate alt text for charts
- **WebSocket Updates**: Real-time job status updates
- **Prometheus Metrics**: Extensive monitoring capabilities
- **VS Code Integration**: Task-based workflow for developers

## Components

- **API Service**: FastAPI service exposing REST and WebSocket endpoints
- **Worker**: Background worker for document processing
- **MCP Tools**: Exposes ingest.queue, ingest.status, and ingest.metrics
- **Client Utilities**: Examples and utilities for interacting with the service

## Getting Started

### Prerequisites

- Python 3.8+
- Poetry (optional, for dependency management)
- PyMuPDF (for PDF processing)
- Python-Magic (for MIME type detection)
- MathPix API key (optional, for improved math formula recognition)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

### Starting the Service

Run the service using the provided batch file:

```
start-ingest-bus.bat
```

This will start the service on http://localhost:8000 with:
- REST API at /api
- WebSocket endpoint at /api/ws
- Prometheus metrics at :8081/metrics
- MCP schema at /mcp/v2/schema

### Starting the Worker

Run the enhanced worker with math-awareness:

```
start-enhanced-worker.bat
```

For improved math formula recognition with MathPix:

```
start-enhanced-worker.bat --mathpix
```

## VS Code Integration

The project includes VS Code tasks for common operations:

- **Run ingest-bus**: Start the ingest-bus service
- **Run math-aware worker**: Start the worker with math awareness
- **Queue sample PDFs**: Upload sample PDFs for processing
- **Tail metrics**: View real-time metrics
- **Run math chunking tests**: Run tests for math-aware chunking

To use these tasks, press `Ctrl+Shift+P` and select "Tasks: Run Task".

## API Reference

### REST API

- `POST /api/jobs`: Queue a document for processing
- `GET /api/jobs`: List jobs
- `GET /api/jobs/{job_id}`: Get job status
- `PATCH /api/jobs/{job_id}/status`: Update job status
- `PATCH /api/jobs/{job_id}/progress`: Update job progress
- `POST /api/jobs/{job_id}/chunks`: Add a chunk to a job
- `POST /api/jobs/{job_id}/concepts`: Add a concept to a job
- `GET /api/metrics`: Get ingestion metrics

### WebSocket API

- Connect to `/api/ws`
- Subscribe to updates with `{"type": "subscribe", "topic": "{job_id}"}`
- Receive updates with `{"type": "update", "topic": "{job_id}", "data": {...}}`

### MCP Tools

- `ingest.queue`: Queue a document for processing
- `ingest.status`: Get job status or list jobs
- `ingest.metrics`: Get processing metrics

## Math-Aware Processing

The system includes special handling for mathematical content:

- **Formula Detection**: Identifies LaTeX formulas in documents
- **Chunk Preservation**: Ensures formulas aren't split across chunks
- **MathPix Integration**: Optional improved formula recognition
- **Math Block Metrics**: Track math blocks and potential splitting issues

## Configuration

Configuration options are available through environment variables:

- `INGEST_BUS_URL`: URL of the ingest-bus service (default: http://localhost:8000)
- `INGEST_API_KEY`: API key for authentication (optional)
- `INGEST_REQUIRE_API_KEY`: Whether to require API key authentication (default: false)
- `USE_MATHPIX`: Whether to use MathPix for formula recognition (default: false)
- `MAX_CHUNK_SIZE`: Maximum chunk size in characters (default: 1800)
- `MAX_WORKERS`: Maximum number of worker threads (default: 2)

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Testing

Run the test suite:

```
python -m unittest discover tests
```

For math-aware chunking tests:

```
python -m unittest tests/test_math_aware_chunking.py
```

## Examples

Example scripts are provided in the `examples` directory:

- `simple_client.py`: Simple client for interacting with the service
- `test_delta_encoder.py`: Example of using the delta encoder/decoder
- `worker_extract.py`: Basic worker implementation
- `worker_extract_enhanced.py`: Enhanced worker with math awareness

## Launch Checklist

For a step-by-step guide to deploying and verifying the service, see [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md).
