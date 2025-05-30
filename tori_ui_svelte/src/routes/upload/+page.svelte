<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  // Upload state
  let file: File | null = null;
  let dragActive: boolean = false;
  let uploadResult: any = null;
  let uploadError: string = '';
  let fileInput: HTMLInputElement;
  let isUploading: boolean = false;
  let uploadStartTime: number = 0;
  let elapsedTime: number = 0;
  
  // Simple progress animation (no WebSocket complexity!)
  let progressPercentage: number = 0;
  let progressMessage: string = 'Ready to upload...';
  let progressStage: string = 'ready';
  let progressTimer: any = null;
  
  // Progress stages for smooth animation
  const progressStages = [
    { percent: 5, message: '🚀 Starting upload...', stage: 'uploading' },
    { percent: 15, message: '📄 File uploaded, starting processing...', stage: 'processing' },
    { percent: 25, message: '🔍 Validating file and loading models...', stage: 'validating' },
    { percent: 35, message: '📖 Reading PDF and extracting text...', stage: 'reading' },
    { percent: 45, message: '🧠 Starting concept extraction...', stage: 'extracting' },
    { percent: 55, message: '🔬 Processing chunk 1/5 - Analyzing content...', stage: 'chunk1' },
    { percent: 65, message: '🔬 Processing chunk 2/5 - Universal analysis...', stage: 'chunk2' },
    { percent: 72, message: '🔬 Processing chunk 3/5 - Database boosting...', stage: 'chunk3' },
    { percent: 79, message: '🔬 Processing chunk 4/5 - Cross-referencing...', stage: 'chunk4' },
    { percent: 85, message: '🔬 Processing chunk 5/5 - Final extraction...', stage: 'chunk5' },
    { percent: 92, message: '🏆 Applying purity analysis - extracting the truth...', stage: 'purity' },
    { percent: 96, message: '📦 Building final response...', stage: 'building' },
    { percent: 98, message: '✨ Finalizing results...', stage: 'finalizing' }
  ];
  
  onMount(() => {
    // Update elapsed time counter
    setInterval(() => {
      if (isUploading && uploadStartTime > 0) {
        elapsedTime = Math.floor((Date.now() - uploadStartTime) / 1000);
      }
    }, 1000);
  });
  
  onDestroy(() => {
    if (progressTimer) {
      clearInterval(progressTimer);
    }
  });
  
  function startProgressAnimation() {
    let stageIndex = 0;
    progressPercentage = 0;
    progressMessage = 'Starting upload...';
    progressStage = 'starting';
    
    // Smooth progress animation over ~35 seconds (typical processing time)
    progressTimer = setInterval(() => {
      if (stageIndex < progressStages.length) {
        const stage = progressStages[stageIndex];
        progressPercentage = stage.percent;
        progressMessage = stage.message;
        progressStage = stage.stage;
        stageIndex++;
      } else {
        // Stay at 98% until response comes back
        progressPercentage = 98;
        progressMessage = '⏳ Processing complete, preparing results...';
        progressStage = 'waiting';
      }
    }, 2500); // Update every 2.5 seconds for smooth animation
  }
  
  function stopProgressAnimation() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      file = files[0];
    }
  }
  
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragActive = true;
  }
  
  function handleDragLeave() {
    dragActive = false;
  }
  
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      file = target.files[0];
    }
  }
  
  async function startUpload() {
    if (!file) {
      uploadError = 'Please select a file first';
      return;
    }
    
    // Reset state
    uploadError = '';
    uploadResult = null;
    isUploading = true;
    uploadStartTime = Date.now();
    elapsedTime = 0;
    
    // Start smooth progress animation
    startProgressAnimation();
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('📤 Starting upload...');
      
      // Start the upload
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Upload completed:', result);
      
      // Stop animation and show completion
      stopProgressAnimation();
      
      uploadResult = result;
      
      // Show final success
      progressPercentage = 100;
      progressMessage = `🎉 Successfully extracted ${result.conceptCount} concepts!`;
      progressStage = 'complete';
      
      // Auto-navigate to results after a delay
      setTimeout(() => {
        isUploading = false;
        // You could navigate to a results page here
        // goto('/dashboard');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      
      // Stop animation and show error
      stopProgressAnimation();
      
      uploadError = error instanceof Error ? error.message : 'Upload failed';
      progressMessage = `❌ Upload failed: ${uploadError}`;
      progressStage = 'error';
      progressPercentage = 0;
      isUploading = false;
    }
  }
  
  function resetUpload() {
    file = null;
    uploadResult = null;
    uploadError = '';
    isUploading = false;
    progressPercentage = 0;
    progressMessage = 'Ready to upload...';
    progressStage = 'ready';
    elapsedTime = 0;
    
    stopProgressAnimation();
  }
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  function formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }
</script>

<div class="upload-container">
  <div class="upload-header">
    <h1>📚 ScholarSphere Upload</h1>
    <p>Upload PDFs for advanced concept extraction with smooth progress tracking</p>
  </div>
  
  {#if !isUploading && !uploadResult}
    <!-- File selection area -->
    <div
      class="drop-zone"
      class:active={dragActive}
      on:drop={handleDrop}
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
    >
      {#if file}
        <div class="file-selected">
          <div class="file-icon">📄</div>
          <div class="file-info">
            <div class="file-name">{file.name}</div>
            <div class="file-details">
              {formatFileSize(file.size)} • {file.type}
            </div>
          </div>
          <button class="remove-file" on:click={resetUpload}>✕</button>
        </div>
      {:else}
        <div class="drop-message">
          <div class="drop-icon">📁</div>
          <h3>Drop your PDF here</h3>
          <p>or click to browse files</p>
          <input
            type="file"
            accept=".pdf,application/pdf"
            on:change={handleFileSelect}
            style="display: none;"
            bind:this={fileInput}
          />
          <button class="browse-button" on:click={() => fileInput?.click()}>
            Browse Files
          </button>
        </div>
      {/if}
    </div>
    
    {#if uploadError}
      <div class="error-message">
        ❌ {uploadError}
      </div>
    {/if}
    
    {#if file}
      <div class="upload-actions">
        <button class="upload-button" on:click={startUpload}>
          🚀 Start Extraction
        </button>
        <button class="cancel-button" on:click={resetUpload}>
          Cancel
        </button>
      </div>
    {/if}
  {:else if isUploading}
    <!-- Smooth progress display -->
    <div class="progress-container">
      <div class="progress-header">
        <h2>🔬 Extracting Concepts</h2>
        <div class="progress-stats">
          <span class="elapsed-time">⏱️ {formatTime(elapsedTime)}</span>
          <span class="expected-time">Expected: ~35s</span>
        </div>
      </div>
      
      <!-- Progress bar -->
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            style="width: {progressPercentage}%"
            class:pulsing={progressPercentage > 0 && progressPercentage < 100}
          ></div>
        </div>
        <div class="progress-percentage">{progressPercentage}%</div>
      </div>
      
      <!-- Current stage and message -->
      <div class="progress-status">
        <div class="progress-message">{progressMessage}</div>
        <div class="progress-stage-info">
          Stage: {progressStage} • Processing optimized for speed (5 chunks max)
        </div>
      </div>
      
      <!-- File info during processing -->
      {#if file}
        <div class="processing-file-info">
          <div class="file-name">📄 {file.name}</div>
          <div class="file-size">{formatFileSize(file.size)}</div>
        </div>
      {/if}
      
      <!-- Performance info -->
      <div class="performance-info">
        <div class="perf-item">🚀 Performance Optimized</div>
        <div class="perf-item">🏆 Purity Analysis Enabled</div>
        <div class="perf-item">⚡ 5 Chunk Limit Applied</div>
      </div>
    </div>
  {:else if uploadResult}
    <!-- Results display -->
    <div class="results-container">
      <div class="results-header">
        <h2>🎉 Extraction Complete!</h2>
        <div class="results-summary">
          Found <strong>{uploadResult.conceptCount}</strong> concepts 
          using <strong>{uploadResult.extractionMethod}</strong>
          in <strong>{uploadResult.processingTime?.toFixed(1)}s</strong>
        </div>
      </div>
      
      {#if uploadResult.purityAnalysis}
        <div class="purity-analysis">
          <h3>🏆 Purity Analysis</h3>
          <div class="purity-stats">
            <div class="purity-stat">
              <span class="label">Raw Concepts:</span>
              <span class="value">{uploadResult.purityAnalysis.raw_concepts}</span>
            </div>
            <div class="purity-stat">
              <span class="label">Pure Concepts:</span>
              <span class="value">{uploadResult.purityAnalysis.pure_concepts}</span>
            </div>
            <div class="purity-stat">
              <span class="label">Efficiency:</span>
              <span class="value">{uploadResult.purityAnalysis.purity_efficiency}</span>
            </div>
          </div>
          
          <div class="concept-distribution">
            <h4>Concept Quality Distribution:</h4>
            <div class="distribution-grid">
              <div class="dist-item consensus">
                🤝 Consensus: {uploadResult.purityAnalysis.distribution.consensus}
              </div>
              <div class="dist-item high-conf">
                ⭐ High Confidence: {uploadResult.purityAnalysis.distribution.high_confidence}
              </div>
              <div class="dist-item db-boost">
                🚀 Database Boosted: {uploadResult.purityAnalysis.distribution.database_boosted}
              </div>
              <div class="dist-item single">
                ✅ Single Method: {uploadResult.purityAnalysis.distribution.single_method}
              </div>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Top concepts preview -->
      {#if uploadResult.concepts && uploadResult.concepts.length > 0}
        <div class="concepts-preview">
          <h3>🧠 Top Extracted Concepts</h3>
          <div class="concepts-grid">
            {#each uploadResult.concepts.slice(0, 12) as concept}
              <div class="concept-card">
                <div class="concept-name">{concept.name || concept}</div>
                {#if concept.score}
                  <div class="concept-score">Score: {concept.score.toFixed(3)}</div>
                {/if}
              </div>
            {/each}
          </div>
          {#if uploadResult.concepts.length > 12}
            <div class="more-concepts">
              +{uploadResult.concepts.length - 12} more concepts
            </div>
          {/if}
        </div>
      {/if}
      
      <div class="results-actions">
        <button class="primary-button" on:click={() => goto('/dashboard')}>
          📊 View Dashboard
        </button>
        <button class="secondary-button" on:click={resetUpload}>
          📁 Upload Another
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .upload-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .upload-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .upload-header h1 {
    color: #2d3748;
    margin-bottom: 0.5rem;
  }
  
  .drop-zone {
    border: 3px dashed #cbd5e0;
    border-radius: 12px;
    padding: 3rem 2rem;
    text-align: center;
    transition: all 0.3s ease;
    background: #f7fafc;
    cursor: pointer;
  }
  
  .drop-zone.active {
    border-color: #4299e1;
    background: #ebf8ff;
  }
  
  .drop-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .drop-icon {
    font-size: 4rem;
    opacity: 0.5;
  }
  
  .browse-button {
    background: #4299e1;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s;
  }
  
  .browse-button:hover {
    background: #3182ce;
  }
  
  .file-selected {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .file-icon {
    font-size: 2rem;
  }
  
  .file-info {
    flex: 1;
    text-align: left;
  }
  
  .file-name {
    font-weight: 600;
    color: #2d3748;
  }
  
  .file-details {
    color: #718096;
    font-size: 0.9rem;
  }
  
  .remove-file {
    background: #f56565;
    color: white;
    border: none;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .upload-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
  }
  
  .upload-button {
    background: #48bb78;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
  }
  
  .cancel-button {
    background: #a0aec0;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 6px;
    cursor: pointer;
  }
  
  .error-message {
    background: #fed7d7;
    color: #c53030;
    padding: 1rem;
    border-radius: 6px;
    margin: 1rem 0;
    text-align: center;
  }
  
  .progress-container {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .progress-stats {
    display: flex;
    gap: 1rem;
    color: #718096;
    font-size: 0.9rem;
  }
  
  .progress-bar-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .progress-bar {
    flex: 1;
    height: 12px;
    background: #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4299e1, #48bb78);
    border-radius: 6px;
    transition: width 0.8s ease;
  }
  
  .progress-fill.pulsing {
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  
  .progress-percentage {
    font-weight: 600;
    color: #2d3748;
    min-width: 3rem;
    font-size: 1.1rem;
  }
  
  .progress-status {
    margin-bottom: 1.5rem;
  }
  
  .progress-message {
    font-size: 1.1rem;
    font-weight: 500;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }
  
  .progress-stage-info {
    color: #718096;
    font-size: 0.9rem;
  }
  
  .processing-file-info {
    text-align: center;
    padding: 1rem;
    background: #f7fafc;
    border-radius: 6px;
    margin-bottom: 1rem;
  }
  
  .performance-info {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .perf-item {
    background: #e6fffa;
    color: #234e52;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .results-container {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  
  .results-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .results-summary {
    color: #718096;
    font-size: 1.1rem;
  }
  
  .purity-analysis {
    background: #f7fafc;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }
  
  .purity-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .purity-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    padding: 0.75rem;
    border-radius: 6px;
  }
  
  .distribution-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
  }
  
  .dist-item {
    padding: 0.75rem;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .dist-item.consensus { background: #c6f6d5; color: #22543d; }
  .dist-item.high-conf { background: #fed7e2; color: #702459; }
  .dist-item.db-boost { background: #bee3f8; color: #2a4365; }
  .dist-item.single { background: #fef5e7; color: #744210; }
  
  .concepts-preview {
    margin-bottom: 2rem;
  }
  
  .concepts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .concept-card {
    background: #f7fafc;
    padding: 1rem;
    border-radius: 6px;
    border-left: 4px solid #4299e1;
  }
  
  .concept-name {
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.25rem;
  }
  
  .concept-score {
    font-size: 0.8rem;
    color: #718096;
  }
  
  .more-concepts {
    text-align: center;
    color: #718096;
    font-style: italic;
  }
  
  .results-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
  
  .primary-button {
    background: #4299e1;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }
  
  .secondary-button {
    background: #e2e8f0;
    color: #4a5568;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 6px;
    cursor: pointer;
  }
</style>
