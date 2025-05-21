/**
 * ψ-Trajectory Lock-Free Queue Implementation
 * 
 * A high-performance, lock-free queue for real-time oscillator state capture.
 * Designed for single-producer/single-consumer scenarios where one thread
 * captures frame data and another processes/compresses it.
 * 
 * Features:
 * - Zero allocation during operation
 * - Bounded memory usage with configurable capacity
 * - Batch operations for better cache efficiency
 * - Minimal CPU impact (target: <1ms overhead per frame)
 */

/**
 * A fixed-size ring buffer with lock-free SPSC (Single Producer, Single Consumer) properties
 */
class LockFreeQueue {
  /**
   * Creates a new lock-free queue
   * @param {number} capacity - Maximum number of elements in the queue
   * @param {function} itemFactory - Factory function to create buffer elements
   */
  constructor(capacity, itemFactory) {
    if (capacity < 2 || (capacity & (capacity - 1)) !== 0) {
      throw new Error('Capacity must be a power of 2 and at least 2');
    }
    
    this.capacity = capacity;
    this.mask = capacity - 1;  // Bit mask for fast modulo operations
    
    // Pre-allocate all memory upfront
    this.buffer = new Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.buffer[i] = itemFactory ? itemFactory() : null;
    }
    
    // Head is written by producer, read by consumer
    this.head = 0;
    
    // Tail is written by consumer, read by producer
    this.tail = 0;
    
    // Statistics
    this.totalEnqueued = 0;
    this.totalDequeued = 0;
    this.maxUsage = 0;
    
    // Performance tracking
    this.lastOpTime = 0;
    this.maxEnqueueTime = 0;
    this.maxDequeueTime = 0;
  }
  
  /**
   * Returns the number of items currently in the queue
   * @returns {number} Number of items in the queue
   */
  size() {
    // In a true concurrent environment, we'd need memory barriers here
    // For JS prototype, this simple approach is sufficient
    return (this.head - this.tail) & this.mask;
  }
  
  /**
   * Checks if the queue is empty
   * @returns {boolean} True if the queue is empty
   */
  isEmpty() {
    return this.head === this.tail;
  }
  
  /**
   * Checks if the queue is full
   * @returns {boolean} True if the queue is full
   */
  isFull() {
    return ((this.head + 1) & this.mask) === this.tail;
  }
  
  /**
   * Enqueues an item to the queue
   * @param {function} populateFunc - Function to populate the next buffer slot
   * @returns {boolean} True if successful, false if the queue is full
   */
  enqueue(populateFunc) {
    const startTime = performance.now();
    
    if (this.isFull()) {
      return false;
    }
    
    const index = this.head;
    const item = this.buffer[index];
    
    // Let the caller populate the item
    populateFunc(item);
    
    // Update head (would use memory barrier in real implementation)
    this.head = (this.head + 1) & this.mask;
    
    this.totalEnqueued++;
    
    // Update statistics
    const currentSize = this.size();
    if (currentSize > this.maxUsage) {
      this.maxUsage = currentSize;
    }
    
    // Track performance
    const opTime = performance.now() - startTime;
    if (opTime > this.maxEnqueueTime) {
      this.maxEnqueueTime = opTime;
    }
    
    return true;
  }
  
  /**
   * Attempts to enqueue multiple items at once for better efficiency
   * @param {Array} items - Array of items to enqueue
   * @param {function} populateFunc - Function to populate each buffer slot
   * @returns {number} Number of items successfully enqueued
   */
  enqueueBatch(items, populateFunc) {
    const startTime = performance.now();
    const available = this.capacity - this.size() - 1;
    const count = Math.min(items.length, available);
    
    if (count <= 0) {
      return 0;
    }
    
    for (let i = 0; i < count; i++) {
      const index = (this.head + i) & this.mask;
      const item = this.buffer[index];
      
      // Populate the item
      populateFunc(item, items[i], i);
    }
    
    // Update head once for the whole batch
    this.head = (this.head + count) & this.mask;
    
    this.totalEnqueued += count;
    
    // Update statistics
    const currentSize = this.size();
    if (currentSize > this.maxUsage) {
      this.maxUsage = currentSize;
    }
    
    // Track performance
    const opTime = performance.now() - startTime;
    if (opTime > this.maxEnqueueTime) {
      this.maxEnqueueTime = opTime;
    }
    
    return count;
  }
  
  /**
   * Dequeues an item from the queue
   * @returns {*} The dequeued item, or null if the queue is empty
   */
  dequeue() {
    const startTime = performance.now();
    
    if (this.isEmpty()) {
      return null;
    }
    
    const index = this.tail;
    const item = this.buffer[index];
    
    // We don't remove the item from the buffer, just advance the tail
    this.tail = (this.tail + 1) & this.mask;
    
    this.totalDequeued++;
    
    // Track performance
    const opTime = performance.now() - startTime;
    if (opTime > this.maxDequeueTime) {
      this.maxDequeueTime = opTime;
    }
    
    return item;
  }
  
  /**
   * Attempts to dequeue multiple items at once for better efficiency
   * @param {number} maxCount - Maximum number of items to dequeue
   * @param {function} processFunc - Function to process each dequeued item
   * @returns {number} Number of items successfully dequeued
   */
  dequeueBatch(maxCount, processFunc) {
    const startTime = performance.now();
    const available = this.size();
    const count = Math.min(maxCount, available);
    
    if (count <= 0) {
      return 0;
    }
    
    for (let i = 0; i < count; i++) {
      const index = (this.tail + i) & this.mask;
      const item = this.buffer[index];
      
      // Process the item
      processFunc(item, i);
    }
    
    // Update tail once for the whole batch
    this.tail = (this.tail + count) & this.mask;
    
    this.totalDequeued += count;
    
    // Track performance
    const opTime = performance.now() - startTime;
    if (opTime > this.maxDequeueTime) {
      this.maxDequeueTime = opTime;
    }
    
    return count;
  }
  
  /**
   * Takes a peek at the next item without removing it
   * @returns {*} The next item, or null if the queue is empty
   */
  peek() {
    if (this.isEmpty()) {
      return null;
    }
    
    return this.buffer[this.tail];
  }
  
  /**
   * Clears the queue, resetting it to empty state
   */
  clear() {
    this.head = 0;
    this.tail = 0;
  }
  
  /**
   * Returns performance statistics about the queue
   * @returns {object} Queue statistics
   */
  getStats() {
    return {
      capacity: this.capacity,
      currentSize: this.size(),
      totalEnqueued: this.totalEnqueued,
      totalDequeued: this.totalDequeued,
      maxUsage: this.maxUsage,
      maxEnqueueTime: this.maxEnqueueTime,
      maxDequeueTime: this.maxDequeueTime,
      percentFull: (this.size() / this.capacity) * 100
    };
  }
}

/**
 * Factory for creating frame data objects used in the queue
 */
class FrameDataFactory {
  /**
   * Creates a factory for producing frame data objects
   * @param {number} oscillatorCount - Number of oscillators per frame
   */
  constructor(oscillatorCount) {
    this.oscillatorCount = oscillatorCount;
  }
  
  /**
   * Creates a new frame data object
   * @returns {object} A pre-allocated frame data object
   */
  createFrameData() {
    return {
      timestamp: 0,
      frameIndex: 0,
      phases: new Float32Array(this.oscillatorCount),
      amplitudes: new Float32Array(this.oscillatorCount),
      emotions: new Float32Array(8), // Typical emotion vector size
      isKeyframe: false,
      band: 'micro', // Default to micro-band
      
      // For internal use
      processed: false,
      retries: 0
    };
  }
}

/**
 * The main capture pipeline for oscillator state
 */
class OscillatorCapturePipeline {
  /**
   * Creates a new oscillator capture pipeline
   * @param {object} options - Configuration options
   */
  constructor(options = {}) {
    const {
      oscillatorCount = 15,
      queueCapacity = 256,
      keyframeInterval = 300,
      workerThreads = 1
    } = options;
    
    this.oscillatorCount = oscillatorCount;
    this.keyframeInterval = keyframeInterval;
    this.currentFrameIndex = 0;
    this.isCapturing = false;
    this.sessionId = null;
    
    // Create the frame data factory
    this.frameFactory = new FrameDataFactory(oscillatorCount);
    
    // Create the lock-free queue
    this.frameQueue = new LockFreeQueue(
      queueCapacity,
      () => this.frameFactory.createFrameData()
    );
    
    // Worker thread control
    this.workerThreads = workerThreads;
    this.workers = [];
    
    // Performance monitoring
    this.captureStartTime = 0;
    this.lastCaptureTime = 0;
    this.totalFramesCaptured = 0;
    this.maxCaptureTime = 0;
    this.captureTimeHistory = new Array(100).fill(0);
    this.captureTimeIndex = 0;
  }
  
  /**
   * Starts a new capture session
   * @param {string} sessionId - Identifier for this capture session
   * @returns {boolean} True if successfully started
   */
  startCapture(sessionId = `session_${Date.now()}`) {
    if (this.isCapturing) {
      console.warn('Capture already in progress');
      return false;
    }
    
    this.sessionId = sessionId;
    this.currentFrameIndex = 0;
    this.captureStartTime = performance.now();
    this.isCapturing = true;
    this.frameQueue.clear();
    this.totalFramesCaptured = 0;
    
    console.log(`Started oscillator capture session: ${sessionId}`);
    
    // Start worker threads for processing
    this._startWorkers();
    
    return true;
  }
  
  /**
   * Stops the current capture session
   * @returns {object} Statistics about the completed session
   */
  stopCapture() {
    if (!this.isCapturing) {
      console.warn('No capture in progress');
      return null;
    }
    
    const duration = performance.now() - this.captureStartTime;
    this.isCapturing = false;
    
    // Stop worker threads
    this._stopWorkers();
    
    // Process any remaining frames
    this._drainQueue();
    
    const stats = {
      sessionId: this.sessionId,
      framesCaptured: this.totalFramesCaptured,
      duration: duration,
      averageFrameTime: duration / this.totalFramesCaptured,
      maxCaptureTime: this.maxCaptureTime,
      queueStats: this.frameQueue.getStats()
    };
    
    console.log(`Stopped capture session: ${this.sessionId}`);
    console.log(`Captured ${this.totalFramesCaptured} frames in ${duration.toFixed(2)}ms`);
    console.log(`Average capture time: ${stats.averageFrameTime.toFixed(3)}ms per frame`);
    console.log(`Max capture time: ${this.maxCaptureTime.toFixed(3)}ms`);
    
    return stats;
  }
  
  /**
   * Captures the current oscillator state into a frame
   * @param {object} state - The current oscillator state
   * @returns {boolean} True if the frame was successfully captured
   */
  captureFrame(state) {
    if (!this.isCapturing) {
      return false;
    }
    
    const startTime = performance.now();
    
    // Determine if this should be a keyframe
    const isKeyframe = this.currentFrameIndex === 0 || 
                       this.currentFrameIndex % this.keyframeInterval === 0;
    
    // Try to enqueue the frame
    const success = this.frameQueue.enqueue(frame => {
      frame.timestamp = startTime;
      frame.frameIndex = this.currentFrameIndex;
      frame.isKeyframe = isKeyframe;
      frame.processed = false;
      frame.retries = 0;
      
      // Copy oscillator phases
      for (let i = 0; i < this.oscillatorCount; i++) {
        frame.phases[i] = state.phases[i] || 0;
        frame.amplitudes[i] = state.amplitudes[i] || 0;
      }
      
      // Copy emotion vector if present
      if (state.emotions) {
        for (let i = 0; i < Math.min(frame.emotions.length, state.emotions.length); i++) {
          frame.emotions[i] = state.emotions[i];
        }
      }
    });
    
    if (success) {
      this.currentFrameIndex++;
      this.totalFramesCaptured++;
      
      // Track performance
      const captureTime = performance.now() - startTime;
      this.lastCaptureTime = captureTime;
      
      if (captureTime > this.maxCaptureTime) {
        this.maxCaptureTime = captureTime;
      }
      
      // Keep a rolling history of capture times
      this.captureTimeHistory[this.captureTimeIndex] = captureTime;
      this.captureTimeIndex = (this.captureTimeIndex + 1) % this.captureTimeHistory.length;
    } else {
      console.warn('Failed to capture frame: queue is full');
    }
    
    return success;
  }
  
  /**
   * Starts the worker threads for processing frames
   * @private
   */
  _startWorkers() {
    // In a real implementation, this would create actual worker threads
    // For the prototype, we'll simulate with a timer
    this.processingInterval = setInterval(() => {
      this._processFrameBatch();
    }, 10); // Check for new frames every 10ms
  }
  
  /**
   * Stops the worker threads
   * @private
   */
  _stopWorkers() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
  
  /**
   * Processes a batch of frames from the queue
   * @private
   */
  _processFrameBatch() {
    // Process up to 10 frames at a time
    const batchSize = 10;
    
    this.frameQueue.dequeueBatch(batchSize, frame => {
      this._processFrame(frame);
    });
  }
  
  /**
   * Processes a single frame (simulated)
   * @param {object} frame - The frame to process
   * @private
   */
  _processFrame(frame) {
    // In a real implementation, this would:
    // 1. Delta-encode the frame (if not a keyframe)
    // 2. Compress the data
    // 3. Write to the psiarc file
    
    // For prototype, just mark as processed
    frame.processed = true;
    
    // In a real system, we might also:
    // - Apply downsampling for meso/macro bands
    // - Handle error cases with retries
    // - Update progress metrics
  }
  
  /**
   * Drains any remaining items in the queue
   * @private
   */
  _drainQueue() {
    while (!this.frameQueue.isEmpty()) {
      const frame = this.frameQueue.dequeue();
      if (frame) {
        this._processFrame(frame);
      }
    }
  }
  
  /**
   * Gets the average capture time over recent frames
   * @returns {number} Average capture time in milliseconds
   */
  getAverageCaptureTime() {
    const sum = this.captureTimeHistory.reduce((acc, val) => acc + val, 0);
    return sum / this.captureTimeHistory.length;
  }
  
  /**
   * Returns detailed stats about the capture pipeline
   * @returns {object} Capture pipeline statistics
   */
  getStats() {
    return {
      sessionId: this.sessionId,
      isCapturing: this.isCapturing,
      totalFramesCaptured: this.totalFramesCaptured,
      currentFrameIndex: this.currentFrameIndex,
      lastCaptureTime: this.lastCaptureTime,
      maxCaptureTime: this.maxCaptureTime,
      averageCaptureTime: this.getAverageCaptureTime(),
      queueStats: this.frameQueue.getStats()
    };
  }
}

/**
 * Runs benchmark tests on the lock-free queue implementation
 * @param {object} options - Benchmark configuration
 * @returns {object} Benchmark results
 */
function runQueueBenchmark(options = {}) {
  const {
    queueCapacity = 256,
    oscillatorCount = 15,
    frameCount = 10000,
    producerDelayMs = 16.67, // ~60fps
    consumerDelayMs = 20     // Slightly slower consumer
  } = options;
  
  console.log("Running Lock-Free Queue Benchmark");
  console.log("=================================");
  console.log(`Queue Capacity: ${queueCapacity}`);
  console.log(`Oscillators: ${oscillatorCount}`);
  console.log(`Frame Count: ${frameCount}`);
  console.log(`Producer Delay: ${producerDelayMs}ms (${(1000/producerDelayMs).toFixed(1)} fps)`);
  console.log(`Consumer Delay: ${consumerDelayMs}ms (${(1000/consumerDelayMs).toFixed(1)} fps)`);
  
  // Create the test objects
  const frameFactory = new FrameDataFactory(oscillatorCount);
  const queue = new LockFreeQueue(queueCapacity, () => frameFactory.createFrameData());
  
  // Prepare test data
  const testData = [];
  for (let i = 0; i < frameCount; i++) {
    const phases = new Float32Array(oscillatorCount);
    const amplitudes = new Float32Array(oscillatorCount);
    
    // Generate some recognizable patterns
    for (let j = 0; j < oscillatorCount; j++) {
      // Create sine waves with different frequencies
      phases[j] = Math.sin(i * 0.01 + j * 0.1) * Math.PI;
      amplitudes[j] = 0.5 + 0.5 * Math.sin(i * 0.005 + j * 0.2);
    }
    
    testData.push({
      frameIndex: i,
      timestamp: i * producerDelayMs,
      phases,
      amplitudes,
      emotions: new Float32Array([0.5, 0.3, 0.2, 0.1, 0, 0, 0, 0])
    });
  }
  
  // Run the benchmark
  return new Promise((resolve) => {
    let producerIndex = 0;
    let consumerIndex = 0;
    
    const stats = {
      startTime: performance.now(),
      endTime: 0,
      producerDone: false,
      consumerDone: false,
      framesSent: 0,
      framesReceived: 0,
      droppedFrames: 0,
      maxQueueSize: 0,
      producerMaxTime: 0,
      consumerMaxTime: 0
    };
    
    // Producer - adds frames to the queue
    const producerInterval = setInterval(() => {
      if (producerIndex >= frameCount) {
        clearInterval(producerInterval);
        stats.producerDone = true;
        checkCompletion();
        return;
      }
      
      const startTime = performance.now();
      
      const frame = testData[producerIndex];
      const success = queue.enqueue(item => {
        item.frameIndex = frame.frameIndex;
        item.timestamp = frame.timestamp;
        item.phases.set(frame.phases);
        item.amplitudes.set(frame.amplitudes);
        item.emotions.set(frame.emotions);
        item.isKeyframe = frame.frameIndex % 300 === 0;
      });
      
      const elapsedTime = performance.now() - startTime;
      stats.producerMaxTime = Math.max(stats.producerMaxTime, elapsedTime);
      
      if (success) {
        producerIndex++;
        stats.framesSent++;
      } else {
        // Queue is full, frame is dropped
        stats.droppedFrames++;
      }
      
      // Track queue size
      const queueSize = queue.size();
      stats.maxQueueSize = Math.max(stats.maxQueueSize, queueSize);
      
    }, producerDelayMs);
    
    // Consumer - processes frames from the queue
    const consumerInterval = setInterval(() => {
      if (consumerIndex >= frameCount) {
        clearInterval(consumerInterval);
        stats.consumerDone = true;
        checkCompletion();
        return;
      }
      
      const startTime = performance.now();
      
      // Process up to 10 frames at once
      const processed = queue.dequeueBatch(10, item => {
        // Simulate processing time
        for (let i = 0; i < item.phases.length; i++) {
          // Some dummy computation
          item.phases[i] = Math.sin(item.phases[i]);
        }
        
        consumerIndex++;
        stats.framesReceived++;
      });
      
      const elapsedTime = performance.now() - startTime;
      stats.consumerMaxTime = Math.max(stats.consumerMaxTime, elapsedTime);
      
      if (processed === 0 && stats.producerDone) {
        // No more frames to process and producer is done
        clearInterval(consumerInterval);
        stats.consumerDone = true;
        checkCompletion();
      }
    }, consumerDelayMs);
    
    // Check if benchmark is complete
    function checkCompletion() {
      if (stats.producerDone && stats.consumerDone) {
        stats.endTime = performance.now();
        stats.duration = stats.endTime - stats.startTime;
        stats.throughput = stats.framesReceived / (stats.duration / 1000);
        
        // Get queue statistics
        stats.queueStats = queue.getStats();
        
        console.log("\nBenchmark Results:");
        console.log(`Total time: ${stats.duration.toFixed(2)}ms`);
        console.log(`Frames sent: ${stats.framesSent}`);
        console.log(`Frames received: ${stats.framesReceived}`);
        console.log(`Dropped frames: ${stats.droppedFrames}`);
        console.log(`Max queue size: ${stats.maxQueueSize} / ${queueCapacity}`);
        console.log(`Throughput: ${stats.throughput.toFixed(2)} frames/second`);
        console.log(`Producer max time: ${stats.producerMaxTime.toFixed(3)}ms`);
        console.log(`Consumer max time: ${stats.consumerMaxTime.toFixed(3)}ms`);
        
        resolve(stats);
      }
    }
  });
}

// Export modules
module.exports = {
  LockFreeQueue,
  FrameDataFactory,
  OscillatorCapturePipeline,
  runQueueBenchmark
};
