//! Minimal, batch‑queued telemetry collector.
use serde::Serialize;
use std::time::{Duration, Instant};
use std::sync::Mutex;
use std::env;

// Check if telemetry is disabled
fn is_telemetry_disabled() -> bool {
    match env::var("TORI_NO_TELEMETRY") {
        Ok(val) => val == "1",
        Err(_) => false,
    }
}

#[derive(Serialize)]
struct TelemetryEvent<'a> {
    device_id: &'a str,
    model: &'a str,
    os: &'a str,
    session_len_s: u32,
    peak_ram_mb: u32,
    avg_fps: f32,
    export: ExportMeta,
}

#[derive(Serialize)]
struct ExportMeta {
    success: bool,
    duration_ms: u32,
    error: Option<String>,
}

lazy_static::lazy_static! {
    static ref QUEUE: Mutex<Vec<TelemetryEvent<'static>>> = Mutex::new(Vec::with_capacity(128));
}

/// Push a metric packet; flushed automatically every 30 s or when 32 events queued.
pub fn push(evt: TelemetryEvent<'static>) {
    if is_telemetry_disabled() {
        return;
    }
    
    let mut q = QUEUE.lock().unwrap();
    q.push(evt);
    if q.len() >= 32 { flush_locked(&mut q); }
}

/// Timer‑driven from main loop (call every ~5 s).
pub fn tick() {
    if is_telemetry_disabled() {
        return;
    }
    static mut LAST: Option<Instant> = None;
    unsafe {
        let now = Instant::now();
        if let Some(prev) = LAST {
            if now.duration_since(prev) > Duration::from_secs(30) {
                if let Ok(mut q) = QUEUE.try_lock() { flush_locked(&mut q) }
                LAST = Some(now);
            }
        } else {
            LAST = Some(now);
        }
    }
}

fn flush_locked(q: &mut Vec<TelemetryEvent<'static>>) {
    if q.is_empty() { return; }
    if let Err(e) = send_batch(&q) {
        tracing::warn!(?e, "telemetry send failed, will retry");
        return; // keep events for next tick
    }
    q.clear();
}

fn send_batch(batch: &[TelemetryEvent<'_>]) -> Result<(), reqwest::Error> {
    let client = reqwest::blocking::Client::new();
    client.post("https://telemetry.tori.ai/v1/ingest")
        .json(&batch)
        .send()?
        .error_for_status()?;
    Ok(())
}
