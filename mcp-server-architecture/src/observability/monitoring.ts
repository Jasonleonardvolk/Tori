// mcp-server-architecture/src/observability/monitoring.ts

/**
 * Monitoring — Observability/logging/metrics/tracing for MCP.
 * Provides unified logging, custom metrics, tracing, and dashboard/statistics hooks.
 * Ready for extension to Prometheus, Datadog, Loki, ELK, or custom sinks.
 */

import { LogEvent, Metric } from '../core/types';

// Optional: Can integrate with Prometheus, Winston, etc.
import { EventEmitter } from 'events';

// -- Monitoring Class --

export class Monitoring extends EventEmitter {
  private logs: LogEvent[] = [];
  private metrics: Metric[] = [];

  constructor() {
    super();
  }

  /** Log a structured event to the internal buffer (and optionally emit/forward). */
  public logEvent(event: LogEvent) {
    this.logs.push(event);
    // Optionally emit for real-time consumption (websockets, SIEM, etc.)
    this.emit('log', event);

    // Console output for now (swap for file, DB, or external service)
    const ctx = event.context ? JSON.stringify(event.context) : '';
    console.log(`[${event.level}] ${event.message} ${ctx}`);
  }

  /** Log an error message with optional context. */
  public logError(message: string, context?: Record<string, any>) {
    this.logEvent({
      eventId: this.generateUUID(),
      timestamp: new Date(),
      level: 'ERROR',
      message,
      context
    });
  }

  /** Emit a custom metric. */
  public emitMetric(metric: Metric) {
    this.metrics.push(metric);
    this.emit('metric', metric);
    console.log(`[Metric] ${metric.name} = ${metric.value} ${JSON.stringify(metric.tags || {})}`);
  }

  /** Retrieve historical logs. */
  public getLogs(level?: LogEvent['level']): LogEvent[] {
    return level ? this.logs.filter(l => l.level === level) : this.logs.slice();
  }

  /** Retrieve historical metrics. */
  public getMetrics(name?: string): Metric[] {
    return name ? this.metrics.filter(m => m.name === name) : this.metrics.slice();
  }

  /** Compute average of a metric (for analytics/kaizen). */
  public async getMetricAverage(name: string): Promise<number> {
    const vals = this.metrics.filter(m => m.name === name).map(m => m.value);
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  /** Attach to a remote/logging backend (stub for now). */
  public attachSink(sink: (event: LogEvent) => void) {
    this.on('log', sink);
  }

  /** Attach to a remote metric backend (stub for now). */
  public attachMetricSink(sink: (metric: Metric) => void) {
    this.on('metric', sink);
  }

  private generateUUID(): string {
    return 'mon-xxxx-4xxx-yxxx-xxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

/**
 * Integration Pathways / Comments:
 * - Used as a singleton/shared instance across all modules (main.ts, orchestrator, gateway, kaizen, celery, etc).
 * - Supports event-driven or polling log/metric consumption.
 * - Easily attach external sinks for persistent logging, SIEM, dashboards, or cloud providers.
 * - Swap `console.log` for production logging frameworks as needed.
 * - Extensible for tracing (add Span/TraceEvent types) and real-time dashboard feeds.
 */

