export interface ExportMeta {
  success: boolean;
  durationMs: number;
  error?: string;
}

export interface TelemetryEvent {
  deviceId: string;
  model: string;
  os: string;
  sessionLenS: number;
  peakRamMb: number;
  avgFps: number;
  export: ExportMeta;
}

const QUEUE: TelemetryEvent[] = [];
let lastFlush = 0;
const ENDPOINT = "https://telemetry.tori.ai/v1/ingest";

// Environment variable for telemetry opt-out
// Check both NO_TELEMETRY (legacy) and TORI_NO_TELEMETRY (standard)
declare global {
  interface Window {
    TORI_NO_TELEMETRY?: boolean;
    NO_TELEMETRY?: boolean;
  }
}

const isTelemetryDisabled = (
  // Check environment variable in Node.js
  (typeof process !== "undefined" && process?.env?.TORI_NO_TELEMETRY === "1") ||
  // Check global flags in browser
  (typeof window !== "undefined" && (window.TORI_NO_TELEMETRY || window.NO_TELEMETRY))
);

// Log telemetry status on initialization (debug only)
if (process?.env?.NODE_ENV === "development") {
  console.debug(`Telemetry ${isTelemetryDisabled ? "DISABLED" : "ENABLED"}`);
}

export function push(ev: TelemetryEvent) {
  if (isTelemetryDisabled) return;
  QUEUE.push(ev);
  if (QUEUE.length >= 32) flush();
}

export function tick() {
  if (isTelemetryDisabled) return;
  const now = Date.now();
  if (now - lastFlush > 30_000) flush();
}

export function flush() {
  if (isTelemetryDisabled || !QUEUE.length) return;
  const batch = QUEUE.splice(0, QUEUE.length);
  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(batch),
    keepalive: true, // allow flush during page unload
  }).catch(() => {
    // push back for retry on error
    QUEUE.unshift(...batch);
  });
  lastFlush = Date.now();
}
