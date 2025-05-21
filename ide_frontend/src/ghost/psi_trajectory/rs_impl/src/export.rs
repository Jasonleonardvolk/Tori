//! ψ-Trajectory Export Pipeline
//!
//! This module implements the export functionality for ψ-Trajectory archives,
//! with platform-specific optimizations and configurable quality presets.

use std::path::{Path, PathBuf};
use std::process::{Command, Stdio, Child};
use std::io::Write;
use std::sync::{Arc, Mutex, mpsc::{self, Sender, Receiver}};
use std::thread;
use std::time::{Duration, Instant};

use crate::psi_reader::{PsiArchiveReader, Frame, ReaderError};

/// Export quality preset
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExportQuality {
    /// Draft quality (fast, low quality)
    Draft,
    /// Standard quality (balanced)
    Standard,
    /// High quality (better, slower)
    High,
    /// Ultra quality (best, slowest)
    Ultra,
}

impl Default for ExportQuality {
    fn default() -> Self {
        ExportQuality::Standard
    }
}

/// Export mode
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExportMode {
    /// Fast export (maximum resource usage)
    Fast,
    /// Balanced export (default)
    Balanced,
    /// Low-power export (minimal resource usage)
    LowPower,
}

impl Default for ExportMode {
    fn default() -> Self {
        ExportMode::Balanced
    }
}

/// Export format
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExportFormat {
    /// MP4 with H.264 video
    MP4,
    /// WebM with VP9 video
    WebM,
    /// GIF animation
    GIF,
    /// Individual PNG frames
    PNGSequence,
}

impl Default for ExportFormat {
    fn default() -> Self {
        ExportFormat::MP4
    }
}

/// Export configuration
#[derive(Debug, Clone)]
pub struct ExportConfig {
    /// Archive path
    pub archive_path: PathBuf,
    
    /// Output file path
    pub output_path: PathBuf,
    
    /// Export quality preset
    pub quality: ExportQuality,
    
    /// Export mode
    pub mode: ExportMode,
    
    /// Export format
    pub format: ExportFormat,
    
    /// Frame width
    pub width: u32,
    
    /// Frame height
    pub height: u32,
    
    /// Frame rate (frames per second)
    pub fps: f32,
    
    /// Start frame
    pub start_frame: Option<u64>,
    
    /// End frame
    pub end_frame: Option<u64>,
    
    /// Use hardware acceleration if available
    pub use_hardware_accel: bool,
    
    /// Include audio
    pub include_audio: bool,
}

impl Default for ExportConfig {
    fn default() -> Self {
        Self {
            archive_path: PathBuf::new(),
            output_path: PathBuf::new(),
            quality: ExportQuality::default(),
            mode: ExportMode::default(),
            format: ExportFormat::default(),
            width: 1920,
            height: 1080,
            fps: 60.0,
            start_frame: None,
            end_frame: None,
            use_hardware_accel: true,
            include_audio: true,
        }
    }
}

/// Export progress status
#[derive(Debug, Clone)]
pub struct ExportProgress {
    /// Job ID
    pub job_id: String,
    
    /// Current frame
    pub current_frame: u64,
    
    /// Total frames
    pub total_frames: u64,
    
    /// Progress percentage (0-100)
    pub percentage: f32,
    
    /// Elapsed time in seconds
    pub elapsed_seconds: f32,
    
    /// Estimated time remaining in seconds
    pub remaining_seconds: f32,
    
    /// Current status message
    pub status_message: String,
}

/// Export error types
#[derive(Debug)]
pub enum ExportError {
    /// I/O error
    Io(std::io::Error),
    
    /// Archive error
    Archive(ReaderError),
    
    /// FFmpeg error
    FFmpeg(String),
    
    /// Configuration error
    Config(String),
    
    /// Encoding error
    Encoding(String),
}

impl From<std::io::Error> for ExportError {
    fn from(err: std::io::Error) -> Self {
        ExportError::Io(err)
    }
}

impl From<ReaderError> for ExportError {
    fn from(err: ReaderError) -> Self {
        ExportError::Archive(err)
    }
}

/// Export job status
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum JobStatus {
    /// Job is queued
    Queued,
    /// Job is running
    Running,
    /// Job is paused
    Paused,
    /// Job completed successfully
    Completed,
    /// Job failed
    Failed,
    /// Job was cancelled
    Cancelled,
}

/// Export job
#[derive(Debug)]
pub struct ExportJob {
    /// Job ID
    pub id: String,
    
    /// Job configuration
    pub config: ExportConfig,
    
    /// Job status
    pub status: JobStatus,
    
    /// Progress information
    pub progress: ExportProgress,
    
    /// Creation time
    pub created_at: Instant,
    
    /// Start time (when job started running)
    pub started_at: Option<Instant>,
    
    /// Completion time
    pub completed_at: Option<Instant>,
    
    /// Error message (if failed)
    pub error_message: Option<String>,
}

impl ExportJob {
    /// Create a new export job
    pub fn new(id: String, config: ExportConfig) -> Self {
        let progress = ExportProgress {
            job_id: id.clone(),
            current_frame: 0,
            total_frames: 0,
            percentage: 0.0,
            elapsed_seconds: 0.0,
            remaining_seconds: 0.0,
            status_message: "Queued".to_string(),
        };
        
        Self {
            id,
            config,
            status: JobStatus::Queued,
            progress,
            created_at: Instant::now(),
            started_at: None,
            completed_at: None,
            error_message: None,
        }
    }
}

/// Export queue manager
pub struct ExportQueue {
    /// Queue of export jobs
    jobs: Vec<ExportJob>,
    
    /// Progress update channel
    progress_tx: Sender<ExportProgress>,
    
    /// Running job
    running_job: Option<ExportJob>,
    
    /// Maximum concurrent jobs
    max_concurrent_jobs: usize,
}

impl ExportQueue {
    /// Create a new export queue
    pub fn new() -> (Self, Receiver<ExportProgress>) {
        let (tx, rx) = mpsc::channel();
        
        let queue = Self {
            jobs: Vec::new(),
            progress_tx: tx,
            running_job: None,
            max_concurrent_jobs: 1, // For now, only one job at a time
        };
        
        (queue, rx)
    }
    
    /// Add a job to the queue
    pub fn add_job(&mut self, config: ExportConfig) -> String {
        // Generate a unique job ID
        let id = format!("export-{}", std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis());
        
        // Create the job
        let job = ExportJob::new(id.clone(), config);
        
        // Add to queue
        self.jobs.push(job);
        
        // Start processing if not already running
        self.process_next_job();
        
        id
    }
    
    /// Start processing the next job in the queue
    fn process_next_job(&mut self) {
        // Skip if already running max jobs
        if self.running_job.is_some() {
            return;
        }
        
        // Get the next queued job
        if let Some(next_job_index) = self.jobs.iter().position(|job| job.status == JobStatus::Queued) {
            // Remove from queue and set as running
            let mut job = self.jobs.remove(next_job_index);
            job.status = JobStatus::Running;
            job.started_at = Some(Instant::now());
            
            // Update progress
            let mut progress = job.progress.clone();
            progress.status_message = "Starting...".to_string();
            self.progress_tx.send(progress).ok();
            
            // Store as running job
            self.running_job = Some(job);
            
            // Start export process (in a real implementation)
            // This is a placeholder; in a complete implementation, we would:
            // 1. Create an exporter based on the platform
            // 2. Run it in a separate thread
            // 3. Update progress regularly
            // 4. Handle completion or failure
        }
    }
    
    /// Get the status of a job
    pub fn get_job_status(&self, job_id: &str) -> Option<JobStatus> {
        // Check running job
        if let Some(ref job) = self.running_job {
            if job.id == job_id {
                return Some(job.status);
            }
        }
        
        // Check queued jobs
        for job in &self.jobs {
            if job.id == job_id {
                return Some(job.status);
            }
        }
        
        None
    }
    
    /// Get the progress of a job
    pub fn get_job_progress(&self, job_id: &str) -> Option<ExportProgress> {
        // Check running job
        if let Some(ref job) = self.running_job {
            if job.id == job_id {
                return Some(job.progress.clone());
            }
        }
        
        // Check queued jobs
        for job in &self.jobs {
            if job.id == job_id {
                return Some(job.progress.clone());
            }
        }
        
        None
    }
    
    /// Cancel a job
    pub fn cancel_job(&mut self, job_id: &str) -> bool {
        // Check running job
        if let Some(ref mut job) = self.running_job {
            if job.id == job_id {
                job.status = JobStatus::Cancelled;
                
                // In a real implementation, we would send a signal to the export process
                // to cancel it gracefully
                
                return true;
            }
        }
        
        // Check queued jobs
        if let Some(pos) = self.jobs.iter().position(|job| job.id == job_id) {
            let mut job = self.jobs.remove(pos);
            job.status = JobStatus::Cancelled;
            self.jobs.push(job);
            return true;
        }
        
        false
    }
}

/// Desktop exporter using FFmpeg
pub struct DesktopExporter {
    /// Archive reader
    reader: Arc<PsiArchiveReader>,
    
    /// Export configuration
    config: ExportConfig,
    
    /// FFmpeg process
    ffmpeg_process: Option<Child>,
    
    /// Progress updates sender
    progress_tx: Sender<ExportProgress>,
    
    /// Job ID
    job_id: String,
}

impl DesktopExporter {
    /// Create a new desktop exporter
    pub fn new(
        reader: Arc<PsiArchiveReader>,
        config: ExportConfig,
        progress_tx: Sender<ExportProgress>,
        job_id: String,
    ) -> Self {
        Self {
            reader,
            config,
            ffmpeg_process: None,
            progress_tx,
            job_id,
        }
    }
    
    /// Start the export process
    pub fn start(&mut self) -> Result<(), ExportError> {
        // Validate the output directory exists
        if let Some(parent) = self.config.output_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        
        // Determine frame count
        let start_frame = self.config.start_frame.unwrap_or(0);
        let end_frame = self.config.end_frame.unwrap_or_else(|| self.reader.frame_count());
        let total_frames = end_frame.saturating_sub(start_frame);
        
        // Update progress
        let mut progress = ExportProgress {
            job_id: self.job_id.clone(),
            current_frame: 0,
            total_frames,
            percentage: 0.0,
            elapsed_seconds: 0.0,
            remaining_seconds: 0.0,
            status_message: "Initializing FFmpeg...".to_string(),
        };
        
        self.progress_tx.send(progress.clone()).ok();
        
        // Set up FFmpeg command line
        let mut args = Vec::new();
        
        // Input format: raw RGB24 at specified FPS
        args.extend_from_slice(&[
            "-f", "rawvideo",
            "-pixel_format", "rgb24",
            "-video_size", &format!("{}x{}", self.config.width, self.config.height),
            "-framerate", &format!("{}", self.config.fps),
            "-i", "pipe:0", // Read from stdin
        ]);
        
        // Add audio input if needed
        if self.config.include_audio {
            // In a real implementation, we would extract audio from the archive
            // and pass it as a separate input to FFmpeg
        }
        
        // Configure quality preset
        match self.config.quality {
            ExportQuality::Draft => {
                args.extend_from_slice(&["-crf", "28", "-preset", "ultrafast"]);
            }
            ExportQuality::Standard => {
                args.extend_from_slice(&["-crf", "23", "-preset", "medium"]);
            }
            ExportQuality::High => {
                args.extend_from_slice(&["-crf", "18", "-preset", "slow"]);
            }
            ExportQuality::Ultra => {
                args.extend_from_slice(&["-crf", "12", "-preset", "veryslow"]);
            }
        }
        
        // Configure hardware acceleration
        if self.config.use_hardware_accel {
            // Check for available hardware encoders
            // NVIDIA NVENC
            if Command::new("ffmpeg").args(&["-encoders"]).output()
                .map(|output| String::from_utf8_lossy(&output.stdout).contains("h264_nvenc"))
                .unwrap_or(false)
            {
                args.extend_from_slice(&["-c:v", "h264_nvenc"]);
            }
            // Intel QuickSync
            else if Command::new("ffmpeg").args(&["-encoders"]).output()
                .map(|output| String::from_utf8_lossy(&output.stdout).contains("h264_qsv"))
                .unwrap_or(false)
            {
                args.extend_from_slice(&["-c:v", "h264_qsv"]);
            }
            // AMD AMF
            else if Command::new("ffmpeg").args(&["-encoders"]).output()
                .map(|output| String::from_utf8_lossy(&output.stdout).contains("h264_amf"))
                .unwrap_or(false)
            {
                args.extend_from_slice(&["-c:v", "h264_amf"]);
            }
            // Apple VideoToolbox
            else if Command::new("ffmpeg").args(&["-encoders"]).output()
                .map(|output| String::from_utf8_lossy(&output.stdout).contains("h264_videotoolbox"))
                .unwrap_or(false)
            {
                args.extend_from_slice(&["-c:v", "h264_videotoolbox"]);
            }
            // Default to software encoding if hardware not available
            else {
                args.extend_from_slice(&["-c:v", "libx264"]);
            }
        } else {
            // Software encoding
            args.extend_from_slice(&["-c:v", "libx264"]);
        }
        
        // Format-specific settings
        match self.config.format {
            ExportFormat::MP4 => {
                args.extend_from_slice(&["-pix_fmt", "yuv420p", "-movflags", "+faststart"]);
            }
            ExportFormat::WebM => {
                args.extend_from_slice(&["-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p"]);
            }
            ExportFormat::GIF => {
                args.extend_from_slice(&["-filter_complex", "split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"]);
            }
            ExportFormat::PNGSequence => {
                // For PNG sequence, use a different output path pattern
                let output_pattern = self.config.output_path.with_extension("").to_str()
                    .ok_or_else(|| ExportError::Config("Invalid output path".to_string()))?
                    .to_string() + "_%04d.png";
                
                args.extend_from_slice(&["-c:v", "png"]);
            }
        }
        
        // Output file
        args.push(self.config.output_path.to_str()
            .ok_or_else(|| ExportError::Config("Invalid output path".to_string()))?);
        
        // Start FFmpeg process
        let process = Command::new("ffmpeg")
            .args(&args)
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()?;
        
        self.ffmpeg_process = Some(process);
        
        // Start feeding frames in a separate thread
        let reader = self.reader.clone();
        let config = self.config.clone();
        let progress_tx = self.progress_tx.clone();
        let job_id = self.job_id.clone();
        
        // Get stdin pipe to write frames
        let mut stdin = self.ffmpeg_process.as_mut()
            .and_then(|process| process.stdin.take())
            .ok_or_else(|| ExportError::FFmpeg("Failed to open FFmpeg stdin".to_string()))?;
        
        thread::spawn(move || {
            let start = Instant::now();
            let mut progress = progress.clone();
            
            // Export frames
            for frame_idx in start_frame..end_frame {
                // Update progress periodically
                if frame_idx % 10 == 0 {
                    let elapsed = start.elapsed().as_secs_f32();
                    let frames_done = frame_idx - start_frame;
                    let frames_remaining = total_frames - frames_done;
                    
                    let avg_time_per_frame = if frames_done > 0 {
                        elapsed / frames_done as f32
                    } else {
                        0.0
                    };
                    
                    let estimated_remaining = frames_remaining as f32 * avg_time_per_frame;
                    
                    progress.current_frame = frame_idx;
                    progress.percentage = 100.0 * frames_done as f32 / total_frames as f32;
                    progress.elapsed_seconds = elapsed;
                    progress.remaining_seconds = estimated_remaining;
                    progress.status_message = format!("Exporting frame {} of {}", frame_idx, end_frame);
                    
                    progress_tx.send(progress.clone()).ok();
                }
                
                // Read frame from archive
                match reader.read_frame(frame_idx) {
                    Ok(frame) => {
                        // In a real implementation, we would:
                        // 1. Render the frame to an RGB buffer
                        // 2. Write the buffer to FFmpeg's stdin
                        
                        // For this implementation, we'll just simulate it with a placeholder
                        let rgb_buffer = vec![0u8; (config.width * config.height * 3) as usize];
                        
                        // Write buffer to FFmpeg
                        if stdin.write_all(&rgb_buffer).is_err() {
                            // FFmpeg process likely terminated
                            break;
                        }
                    }
                    Err(e) => {
                        // Report error
                        progress.status_message = format!("Error reading frame {}: {:?}", frame_idx, e);
                        progress_tx.send(progress.clone()).ok();
                        break;
                    }
                }
                
                // Throttle if in low-power mode
                if config.mode == ExportMode::LowPower {
                    thread::sleep(Duration::from_millis(10));
                }
            }
            
            // Close stdin to signal end of input
            drop(stdin);
            
            // Final progress update
            progress.current_frame = total_frames;
            progress.percentage = 100.0;
            progress.elapsed_seconds = start.elapsed().as_secs_f32();
            progress.remaining_seconds = 0.0;
            progress.status_message = "Export completed".to_string();
            
            progress_tx.send(progress).ok();
        });
        
        Ok(())
    }
}

/// Export job factory
pub struct ExportFactory;

impl ExportFactory {
    /// Create an appropriate exporter for the current platform
    #[cfg(target_os = "windows")]
    pub fn create_exporter(
        reader: Arc<PsiArchiveReader>,
        config: ExportConfig,
        progress_tx: Sender<ExportProgress>,
        job_id: String,
    ) -> Box<dyn Exporter> {
        Box::new(DesktopExporter::new(reader, config, progress_tx, job_id))
    }
    
    #[cfg(target_os = "macos")]
    pub fn create_exporter(
        reader: Arc<PsiArchiveReader>,
        config: ExportConfig,
        progress_tx: Sender<ExportProgress>,
        job_id: String,
    ) -> Box<dyn Exporter> {
        Box::new(DesktopExporter::new(reader, config, progress_tx, job_id))
    }
    
    #[cfg(target_os = "linux")]
    pub fn create_exporter(
        reader: Arc<PsiArchiveReader>,
        config: ExportConfig,
        progress_tx: Sender<ExportProgress>,
        job_id: String,
    ) -> Box<dyn Exporter> {
        Box::new(DesktopExporter::new(reader, config, progress_tx, job_id))
    }
    
    #[cfg(target_os = "android")]
    pub fn create_exporter(
        reader: Arc<PsiArchiveReader>,
        config: ExportConfig,
        progress_tx: Sender<ExportProgress>,
        job_id: String,
    ) -> Box<dyn Exporter> {
        // In a real implementation, we would have an AndroidExporter
        // For now, just use a placeholder
        Box::new(DesktopExporter::new(reader, config, progress_tx, job_id))
    }
    
    #[cfg(target_os = "ios")]
    pub fn create_exporter(
        reader: Arc<PsiArchiveReader>,
        config: ExportConfig,
        progress_tx: Sender<ExportProgress>,
        job_id: String,
    ) -> Box<dyn Exporter> {
        // In a real implementation, we would have an IOSExporter
        // For now, just use a placeholder
        Box::new(DesktopExporter::new(reader, config, progress_tx, job_id))
    }
}

/// Common trait for all exporters
pub trait Exporter {
    /// Start the export process
    fn start(&mut self) -> Result<(), ExportError>;
    
    /// Stop the export process
    fn stop(&mut self) -> Result<(), ExportError>;
    
    /// Pause the export process
    fn pause(&mut self) -> Result<(), ExportError>;
    
    /// Resume the export process
    fn resume(&mut self) -> Result<(), ExportError>;
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_export_config() {
        let config = ExportConfig {
            archive_path: PathBuf::from("test.psiarc"),
            output_path: PathBuf::from("output.mp4"),
            quality: ExportQuality::High,
            ..Default::default()
        };
        
        assert_eq!(config.quality, ExportQuality::High);
        assert_eq!(config.mode, ExportMode::Balanced);
        assert_eq!(config.format, ExportFormat::MP4);
    }
}
