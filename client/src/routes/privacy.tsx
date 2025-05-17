import React from 'react';
import { TelemetryEvent } from '../telemetry';

/**
 * Privacy page component that shows what telemetry data is collected
 * 
 * This component displays a sample of the telemetry payload that's sent
 * to give users transparency about what data is collected.
 */
export default function Privacy() {
  // Sample telemetry event for demonstration
  const sampleEvent: TelemetryEvent = {
    deviceId: '77b9…',
    model: 'Pixel 7',
    os: 'Android 14',
    sessionLenS: 314,
    peakRamMb: 118,
    avgFps: 57,
    export: { 
      success: true, 
      durationMs: 8432,
      error: undefined 
    }
  };

  return (
    <div className="prose max-w-xl mx-auto p-6">
      <h1>Telemetry &amp; Privacy</h1>
      
      <h2>What data is collected?</h2>
      <p>
        TORI/ALAN collects minimal anonymous telemetry data to help us improve performance
        and fix issues. We do not collect any personal information, code snippets, 
        or conversation content.
      </p>
      
      <h3>Sample telemetry payload (JSON):</h3>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(sampleEvent, null, 2)}
      </pre>
      
      <h3>Data explanation</h3>
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="text-left">Field</th>
            <th className="text-left">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>deviceId</td>
            <td>Hashed device identifier (anonymized)</td>
          </tr>
          <tr>
            <td>model</td>
            <td>Device model</td>
          </tr>
          <tr>
            <td>os</td>
            <td>Operating system</td>
          </tr>
          <tr>
            <td>sessionLenS</td>
            <td>Session length in seconds</td>
          </tr>
          <tr>
            <td>peakRamMb</td>
            <td>Peak memory usage in MB</td>
          </tr>
          <tr>
            <td>avgFps</td>
            <td>Average frames per second during rendering</td>
          </tr>
          <tr>
            <td>export</td>
            <td>Export success/failure metrics</td>
          </tr>
        </tbody>
      </table>

      <h2>Disabling telemetry</h2>
      <p>
        You can disable telemetry collection at any time:
      </p>
      <ul>
        <li>Set the <code>TORI_NO_TELEMETRY=1</code> environment variable</li>
        <li>Toggle telemetry in <strong>Settings → Privacy → Telemetry</strong></li>
      </ul>
      
      <h2>Storage and Security</h2>
      <p>
        All telemetry data is:
      </p>
      <ul>
        <li>Transmitted over encrypted connections (TLS 1.3)</li>
        <li>Stored securely and analyzed in aggregate</li>
        <li>Automatically deleted after 90 days</li>
      </ul>
      
      <p className="text-sm text-gray-500 mt-10">
        For questions about our data practices, please contact <a href="mailto:privacy@tori.ai">privacy@tori.ai</a>.
      </p>
    </div>
  );
}
