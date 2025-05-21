// src/recorder.rs  (compile behind feature="diagnostics")
use std::{
    fs::{create_dir_all, File},
    io::{Write, Cursor},
    path::PathBuf,
    sync::Mutex,
    time::{Duration, Instant},
};

use once_cell::sync::Lazy;
use zip::write::FileOptions;

static BUFFER: Lazy<Mutex<Circular>> = Lazy::new(|| Mutex::new(Circular::new()));

/// Prefers 60 fps * 5 s = 300 frames
const CAPACITY: usize = 300;

/// Public API --------------------------------------------------------

/// Call every frame (micro-band).
pub fn capture(frame_bytes: &[u8]) {
    if let Ok(mut buf) = BUFFER.try_lock() {
        buf.push(frame_bytes);
    }
}

/// Hook this in `std::panic::set_hook` or signal handler.
pub fn dump_on_crash(reason: &str) {
    if let Ok(buf) = BUFFER.lock() {
        let path = write_zip(&buf, reason);
        eprintln!("Diagnostics ZIP written to {:?}", path);
    }
}

/// -------------------------------------------------------- internals
struct Circular {
    data: Vec<Vec<u8>>,
    idx: usize,
}

impl Circular {
    fn new() -> Self {
        Self { data: Vec::with_capacity(CAPACITY), idx: 0 }
    }
    fn push(&mut self, bytes: &[u8]) {
        if self.data.len() < CAPACITY {
            self.data.push(bytes.to_vec());
        } else {
            self.data[self.idx].clear();
            self.data[self.idx].extend_from_slice(bytes);
            self.idx = (self.idx + 1) % CAPACITY;
        }
    }
}

fn write_zip(buf: &Circular, reason: &str) -> PathBuf {
    let ts = chrono::Utc::now().format("%Y%m%dT%H%M%S");
    let dir = PathBuf::from("crash_dumps");
    let _ = create_dir_all(&dir);
    let path = dir.join(format!("crash_{ts}.zip"));
    let file = File::create(&path).expect("zip create");
    let mut zip = zip::ZipWriter::new(file);

    let opts = FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    // frame ring
    for (i, bytes) in buf.data.iter().enumerate() {
        zip.start_file(format!("frames/{i:03}.bin"), opts).unwrap();
        zip.write_all(bytes).unwrap();
    }
    // panic info
    zip.start_file("panic.txt", opts).unwrap();
    writeln!(zip, "reason: {reason}\nCaptured at: {ts}Z").unwrap();

    zip.finish().unwrap();
    path
}
