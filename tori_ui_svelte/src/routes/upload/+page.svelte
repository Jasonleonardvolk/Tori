<script lang="ts">
  import { onMount } from 'svelte';
  
  // ATOMIC PRECISION DEBUGGING - Track every single event
  let file: File | null = null;
  let uploadResult: any = null;
  let uploadError: string = '';
  let fileInput: HTMLInputElement;
  let isUploading: boolean = false;
  
  // PRECISION TRACKER - Every single action gets logged with exact state
  let actionLog: Array<{time: string, action: string, state: any}> = [];
  
  function logAction(action: string) {
    const timestamp = new Date().toLocaleTimeString() + '.' + Date.now().toString().slice(-3);
    const currentState = {
      file: file ? `${file.name} (${file.size}b)` : null,
      uploadResult: uploadResult ? 'EXISTS' : null,
      uploadError: uploadError || null,
      isUploading,
      fileInputValue: fileInput?.value || 'UNBOUND',
      fileInputFiles: fileInput?.files?.length || 0
    };
    
    actionLog = [...actionLog, { time: timestamp, action, state: currentState }];
    console.log(`🎯 ${timestamp}: ${action}`, currentState);
  }
  
  onMount(() => {
    logAction('PAGE_MOUNTED');
  });
  
  // ATOMIC PRECISION: File selection handler
  function handleFileSelect(event: Event) {
    logAction('FILE_SELECT_EVENT_FIRED');
    
    const target = event.target as HTMLInputElement;
    logAction(`FILE_INPUT_HAS_${target.files?.length || 0}_FILES`);
    
    if (target.files && target.files.length > 0) {
      const selectedFile = target.files[0];
      logAction(`FILE_OBJECT_CREATED: ${selectedFile.name}`);
      
      file = selectedFile;
      logAction('FILE_VARIABLE_SET');
      
      if (uploadResult) {
        logAction('CLEARING_PREVIOUS_RESULT');
        uploadResult = null;
        uploadError = '';
        logAction('PREVIOUS_RESULT_CLEARED');
      }
    }
    
    // Reset input
    setTimeout(() => {
      if (target) {
        target.value = '';
        logAction('FILE_INPUT_VALUE_RESET');
      }
    }, 50);
  }
  
  // ATOMIC PRECISION: Upload function
  async function startUpload() {
    logAction('START_UPLOAD_FUNCTION_CALLED');
    
    if (!file) {
      logAction('ERROR_NO_FILE_SELECTED');
      uploadError = 'No file selected';
      return;
    }
    
    logAction(`UPLOAD_STARTING_FOR: ${file.name}`);
    
    uploadError = '';
    uploadResult = null;
    isUploading = true;
    logAction('UPLOAD_STATE_SET_TO_TRUE');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      logAction('FORMDATA_CREATED');
      
      logAction('FETCH_REQUEST_STARTING');
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });
      logAction(`FETCH_RESPONSE_RECEIVED: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      logAction('RESPONSE_JSON_PARSED');
      
      uploadResult = result;
      isUploading = false;
      file = null;
      logAction('UPLOAD_COMPLETED_SUCCESSFULLY');
      
    } catch (error) {
      logAction(`UPLOAD_FAILED: ${error}`);
      uploadError = String(error);
      isUploading = false;
      uploadResult = null;
    }
  }
  
  // ATOMIC PRECISION: Reset function
  function resetUpload() {
    logAction('RESET_FUNCTION_CALLED');
    
    file = null;
    logAction('FILE_CLEARED');
    
    uploadResult = null;
    logAction('UPLOAD_RESULT_CLEARED');
    
    uploadError = '';
    isUploading = false;
    logAction('FLAGS_CLEARED');
    
    if (fileInput) {
      fileInput.value = '';
      logAction('FILE_INPUT_FORCE_RESET');
    } else {
      logAction('ERROR_FILE_INPUT_NOT_BOUND');
    }
  }
  
  // ATOMIC PRECISION: Browse button
  function triggerFileBrowser() {
    logAction('BROWSE_BUTTON_CLICKED');
    
    if (uploadResult) {
      logAction('CLEARING_RESULT_BEFORE_BROWSE');
      uploadResult = null;
      uploadError = '';
    }
    
    if (fileInput) {
      fileInput.value = '';
      logAction('FILE_INPUT_CLEARED_BEFORE_BROWSE');
      fileInput.click();
      logAction('FILE_INPUT_CLICK_TRIGGERED');
    } else {
      logAction('CRITICAL_ERROR_FILE_INPUT_NOT_FOUND');
    }
  }
  
  // ATOMIC PRECISION: UI state computation
  $: showFileSelection = !isUploading && !uploadResult;
  $: showProgress = isUploading;
  $: showResults = !!uploadResult && !isUploading;
  
  // Log UI state changes
  $: {
    if (actionLog.length > 0) { // Only after initial mount
      logAction(`UI_STATE: fileSelection=${showFileSelection} progress=${showProgress} results=${showResults}`);
    }
  }
</script>

<div class="debug-container">
  <h1>🎯 ATOMIC PRECISION UPLOAD DEBUG</h1>
  
  <!-- REAL-TIME STATE DISPLAY -->
  <div class="state-display">
    <div>FILE: {file ? file.name : 'NULL'}</div>
    <div>RESULT: {uploadResult ? 'EXISTS' : 'NULL'}</div>
    <div>ERROR: {uploadError || 'NULL'}</div>
    <div>UPLOADING: {isUploading}</div>
    <div>UI: fileSelection={showFileSelection} progress={showProgress} results={showResults}</div>
  </div>
  
  <!-- UI SECTIONS WITH PRECISE LOGGING -->
  {#if showFileSelection}
    <div class="section file-selection">
      <h2>📁 FILE SELECTION SECTION</h2>
      
      {#if file}
        <div class="file-selected">
          <div>Selected: {file.name} ({Math.round(file.size/1024)}KB)</div>
          <button on:click={resetUpload}>❌ Remove</button>
        </div>
      {:else}
        <div class="file-browser">
          <input
            type="file"
            accept=".pdf"
            on:change={handleFileSelect}
            style="display: none;"
            bind:this={fileInput}
          />
          <button on:click={triggerFileBrowser}>📁 Browse Files</button>
        </div>
      {/if}
      
      {#if file}
        <button 
          class="upload-btn" 
          on:click={() => {
            logAction('UPLOAD_BUTTON_CLICKED');
            startUpload();
          }}
        >
          🚀 START UPLOAD
        </button>
      {/if}
      
      {#if uploadError}
        <div class="error">ERROR: {uploadError}</div>
      {/if}
    </div>
  {/if}
  
  {#if showProgress}
    <div class="section progress">
      <h2>⏳ UPLOAD IN PROGRESS</h2>
      <div>Uploading... Please wait.</div>
    </div>
  {/if}
  
  {#if showResults}
    <div class="section results">
      <h2>✅ UPLOAD COMPLETE</h2>
      <div>Upload successful!</div>
      <button 
        on:click={() => {
          logAction('UPLOAD_ANOTHER_BUTTON_CLICKED');
          resetUpload();
        }}
      >
        📁 Upload Another PDF
      </button>
    </div>
  {/if}
  
  <!-- ATOMIC PRECISION ACTION LOG -->
  <div class="action-log">
    <h3>🎯 ATOMIC PRECISION LOG</h3>
    <div class="log-entries">
      {#each actionLog.slice(-15) as entry}
        <div class="log-entry">
          <span class="time">{entry.time}</span>
          <span class="action">{entry.action}</span>
          <span class="state">{JSON.stringify(entry.state)}</span>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .debug-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 1rem;
    font-family: monospace;
  }
  
  .state-display {
    background: #000;
    color: #0f0;
    padding: 1rem;
    margin-bottom: 1rem;
    font-size: 14px;
    border-radius: 4px;
  }
  
  .section {
    border: 2px solid #333;
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 4px;
  }
  
  .file-selection { border-color: #00f; background: #f0f8ff; }
  .progress { border-color: #fa0; background: #fff8f0; }
  .results { border-color: #0a0; background: #f0fff0; }
  
  .file-selected, .file-browser {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
  }
  
  .upload-btn {
    background: #0a0;
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 16px;
    cursor: pointer;
    border-radius: 4px;
    margin: 1rem 0;
  }
  
  .error {
    color: #f00;
    font-weight: bold;
    margin: 1rem 0;
  }
  
  .action-log {
    background: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    margin-top: 2rem;
  }
  
  .log-entries {
    max-height: 400px;
    overflow-y: auto;
    font-size: 12px;
  }
  
  .log-entry {
    display: grid;
    grid-template-columns: 80px 200px 1fr;
    gap: 10px;
    padding: 2px 0;
    border-bottom: 1px solid #eee;
  }
  
  .time { color: #666; }
  .action { color: #00f; font-weight: bold; }
  .state { color: #333; word-break: break-all; }
  
  button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 4px;
  }
  
  button:hover {
    background: #0056b3;
  }
</style>