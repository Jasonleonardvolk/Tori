// ide_frontend/src/diagnostics/recorder.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck - Disabling TypeScript checking for this diagnostic utility file
import JSZip from 'jszip';

const CAPACITY = 300;
const frames: Uint8Array[] = [];
let cursor = 0;

export function captureFrame(bytes: Uint8Array) {
  if (frames.length < CAPACITY) {
    frames.push(bytes.slice());
  } else {
    frames[cursor].set(bytes);
    cursor = (cursor + 1) % CAPACITY;
  }
}

export async function dump(reason: string) {
  const zip = new JSZip();
  frames.forEach((f, i) => zip.file(`frames/${i.toString().padStart(3, '0')}.bin`, f));

  zip.file(
    'panic.txt',
    `reason: ${reason}\nCaptured at: ${new Date().toISOString()}`,
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crash_${Date.now()}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
