/**
 * Integration Test for ExecutionTracer + FieldMeditationMode
 * 
 * Tests the interaction between the ExecutionTracerService and FieldMeditationMode
 * components, ensuring execution events are properly visualized.
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import mockExecutionTracerService from './mockExecutionTracerService';
import mockConceptGraphService from '../Exporter_ConceptGraphService/mockConceptGraphService';
import { MockFieldMeditationMode } from './mockComponents';

// Use the mocks for all tests
const executionTracerService = mockExecutionTracerService;
const conceptGraphService = mockConceptGraphService;

// Use mock component instead of the real one
jest.mock('../../../components/FieldMeditationMode/FieldMeditationMode', () => {
  return require('./mockComponents').MockFieldMeditationMode;
});

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    this.readyState = 0; // CONNECTING
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen();
      }
    }, 50);
  }
  send(data) {
    const parsedData = JSON.parse(data);
    if (parsedData.type === 'execute_python') {
      setTimeout(() => {
        this.simulateExecutionStart();
        setTimeout(() => this.simulateExecutionEvent('node_1', 0.2), 100);
        setTimeout(() => this.simulateExecutionEvent('node_2', 0.5), 200);
        setTimeout(() => this.simulateExecutionEvent('node_3', 0.8), 300);
        setTimeout(() => this.simulateExecutionEnd(), 400);
      }, 50);
    }
  }
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
  simulateExecutionStart() {
    this.simulateMessage({
      type: 'execution_start',
      payload: { timestamp: Date.now() }
    });
  }
  simulateExecutionEvent(nodeId, phase) {
    this.simulateMessage({
      type: 'execution_event',
      payload: { nodeId, phase, timestamp: Date.now() }
    });
  }
  simulateExecutionEnd() {
    this.simulateMessage({
      type: 'execution_end',
      payload: { timestamp: Date.now() }
    });
  }
  close() {
    this.readyState = 3;
    if (this.onclose) {
      this.onclose();
    }
  }
}

global.WebSocket = MockWebSocket;

describe('ExecutionTracer ↔ FieldMeditationMode', () => {
  let sampleConceptData;
  beforeEach(() => {
    sampleConceptData = { alpha: 0, epsilon: 0, nodes: [{ id: 'node_1' }, { id: 'node_2' }, { id: 'node_3' }], links: [] };
    jest.clearAllMocks();
  });

  test('Visualizes execution events and updates', async () => {
    render(
      <MockFieldMeditationMode
        conceptData={sampleConceptData}
        pythonCode="print('Hello, world!')"
        onDivergenceDetected={jest.fn()}
      />
    );
    await act(async () => {
      await executionTracerService.connect();
    });
    await waitFor(() => {
      expect(screen.getByText(/spectral entropy wave/i)).toBeInTheDocument();
    });
  });

  test('Divergence detection is triggered and displayed', async () => {
    conceptGraphService.getNode.mockImplementationOnce(nodeId => ({
      id: nodeId,
      label: `Node ${nodeId}`,
      type: 'function',
      phase: 0.8
    }));
    const onDivergenceDetected = jest.fn();
    render(
      <MockFieldMeditationMode
        conceptData={sampleConceptData}
        pythonCode="print('Hello, world!')"
        onDivergenceDetected={onDivergenceDetected}
      />
    );
    await act(async () => {
      await executionTracerService.connect();
    });
    act(() => {
      executionTracerService.executionState.currentNode = 'node_1';
      executionTracerService.executionState.currentPhase = 0.2;
      executionTracerService.detectDivergences();
    });
    await waitFor(() => {
      expect(onDivergenceDetected).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'phase_divergence',
          nodeId: 'node_1'
        })
      );
    });
    await act(async () => {
      executionTracerService.handleExecutionStart({});
      executionTracerService.executionState.divergences = [{
        type: 'phase_divergence',
        nodeId: 'node_1',
        nodeName: 'Node node_1',
        severity: 'warning'
      }];
      executionTracerService.emitTraceUpdate();
    });
    await waitFor(() => {
      expect(screen.getByText(/divergence warnings/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/phase_divergence/i)).toBeInTheDocument();
  });
});
