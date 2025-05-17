/**
 * TORI Chat Enterprise - Standalone JavaScript Implementation
 * 
 * A lightweight, framework-free implementation of the TORI Chat Enterprise interface
 * that doesn't require React, Vite, or any build process.
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const chatContainer = document.querySelector('.chat-messages');
  const messageInput = document.querySelector('.message-input');
  const sendButton = document.querySelector('.send-button');
  const personaButtons = document.querySelectorAll('.persona-button');
  const searchInput = document.querySelector('.search-input');
  const historyItems = document.querySelectorAll('.history-item');
  const chatTabs = document.querySelectorAll('.chat-tab');
  const videoToggleButton = document.querySelector('.video-toggle');
  const videoContainer = document.querySelector('.video-container');
  const clearButton = document.querySelector('.clear-button');
  const uploadButton = document.createElement('button');
  
  // State
  let activePersona = 'ref'; // Default: Refactorer
  let messageCount = 0;
  let videoActive = false;
  let stream = null;
  let audioContext = null;
  let audioAnalyser = null;
  let isMuted = false;
  let isCameraOn = true;
  
  // Persona Settings
  const personas = {
    'ref': { 
      icon: '🔧', 
      name: 'Refactorer', 
      color: 'var(--color-primary)',
      greeting: "I'm in Refactorer mode. I'll help optimize your code."
    },
    'bug': { 
      icon: '🐛', 
      name: 'Debugger', 
      color: 'var(--color-warning)',
      greeting: "I'm in Debugger mode. Show me what's not working."
    },
    'sch': { 
      icon: '📖', 
      name: 'Scholar', 
      color: 'var(--color-success)',
      greeting: "I'm in Scholar mode. What would you like to learn about?"
    },
    'an': {
      icon: '📊',
      name: 'Analyst',
      color: 'var(--color-secondary)',
      greeting: "I'm in Analyst mode. I'll help you interpret data and metrics."
    },
    'arc': {
      icon: '🏛️',
      name: 'Architect',
      color: 'var(--color-secondary-alt)',
      greeting: "I'm in Architect mode. Let's design robust software structures."
    }
  };
  
  // Initialize with greeting message
  addMessage('assistant', "Howdy 👋 How can I help you with TORI Chat Enterprise?", 'sch');
  
  // Add file upload button to chat input
  setupFileUpload();
  
  // Event Listeners
  
  // 1. Send message on button click or Enter key
  sendButton.addEventListener('click', sendUserMessage);
  messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  });
  
  // 2. Switch active persona
  personaButtons.forEach(button => {
    button.addEventListener('click', function() {
      const persona = this.dataset.persona;
      switchPersona(persona);
    });
  });
  
  // 3. Filter history items on search
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const query = this.value.toLowerCase();
      historyItems.forEach(item => {
        const title = item.querySelector('.history-title').textContent.toLowerCase();
        const visible = title.includes(query);
        item.style.display = visible ? 'flex' : 'none';
      });
    });
  }
  
  // 4. Toggle video display
  if (videoToggleButton) {
    videoToggleButton.addEventListener('click', toggleVideo);
  }
  
  // 5. Clear chat history
  if (clearButton) {
    clearButton.addEventListener('click', function() {
      // Remove all messages except the first greeting
      while (chatContainer.children.length > 1) {
        chatContainer.removeChild(chatContainer.lastChild);
      }
      messageCount = 0;
    });
  }
  
  // 6. Tab switching in history panel
  chatTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      chatTabs.forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      this.classList.add('active');
      
      // In a real implementation, would switch the content shown
      // For demo purposes, we'll just log it
      console.log('Switched to tab:', this.textContent);
    });
  });
  
  // 7. Quick action buttons
  document.querySelectorAll('.quick-action').forEach(button => {
    button.addEventListener('click', function() {
      const action = this.dataset.action;
      handleQuickAction(action);
    });
  });
  
  // 8. Video controls
  document.querySelectorAll('.video-control').forEach(button => {
    button.addEventListener('click', function() {
      const controlIndex = Array.from(document.querySelectorAll('.video-control')).indexOf(this);
      
      switch(controlIndex) {
        case 0: // Mute/Unmute
          toggleMute();
          break;
        case 1: // Camera On/Off
          toggleCamera();
          break;
        case 2: // Settings
          showVideoSettings();
          break;
      }
    });
  });
  
  // Functions
  
  function sendUserMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    // Add user message
    addMessage('user', text);
    messageInput.value = '';
    
    // Simulate AI response with a typing delay
    const loadingIndicator = addLoadingIndicator();
    
    setTimeout(() => {
      // Remove loading indicator
      chatContainer.removeChild(loadingIndicator);
      
      // Add bot response based on active persona
      let response;
      
      if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
        response = personas[activePersona].greeting;
      } else if (activePersona === 'ref') {
        response = `I've analyzed your code. We can refactor this to improve performance by 30%.`;
      } else if (activePersona === 'bug') {
        response = `Found the issue! There's a null reference on line 42 that's causing the crash.`;
      } else if (activePersona === 'sch') {
        response = `This pattern is known as the Observer pattern. It's commonly used when you need a one-to-many dependency between objects.`;
      } else if (activePersona === 'an') {
        response = `Based on the metrics, your system's performance has improved by 24% since the last deployment.`;
      } else if (activePersona === 'arc') {
        response = `For this feature, I recommend implementing a microservice architecture with event-driven communication.`;
      }
      
      addMessage('assistant', response, activePersona);
    }, 1000);
  }
  
  function addMessage(role, text, persona = activePersona) {
    messageCount++;
    
    const messageEl = document.createElement('div');
    messageEl.classList.add('chat-message', `chat-message-${role}`);
    
    if (role === 'assistant') {
      messageEl.style.borderLeftColor = personas[persona].color;
    }
    
    messageEl.textContent = text;
    chatContainer.appendChild(messageEl);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Show quick actions after first message exchange
    if (messageCount >= 2) {
      document.querySelector('.quick-actions').style.display = 'flex';
    }
  }
  
  function addLoadingIndicator() {
    const loadingEl = document.createElement('div');
    loadingEl.classList.add('chat-message', 'chat-message-loading');
    
    const dots = document.createElement('div');
    dots.classList.add('typing-indicator');
    dots.innerHTML = '<span></span><span></span><span></span>';
    
    loadingEl.appendChild(dots);
    chatContainer.appendChild(loadingEl);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return loadingEl;
  }
  
  function switchPersona(persona) {
    if (!personas[persona]) return;
    
    // Update active persona
    activePersona = persona;
    
    // Update UI
    personaButtons.forEach(button => {
      if (button.dataset.persona === persona) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
    
    // Add a system message indicating the switch
    const message = document.createElement('div');
    message.classList.add('chat-message', 'chat-message-system');
    message.textContent = `Switched to ${personas[persona].name} mode`;
    chatContainer.appendChild(message);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  
  function handleQuickAction(action) {
    let actionMessage;
    
    switch(action) {
      case 'optimize':
        actionMessage = "Optimizing loop in main.js...";
        break;
      case 'explain':
        actionMessage = "Generating explanation of selected code block...";
        break;
      case 'secure':
        actionMessage = "Running security check on your code...";
        break;
      case 'analyze':
        actionMessage = "Analyzing performance and generating metrics...";
        break;
      default:
        actionMessage = "Performing action: " + action;
    }
    
    // Add system message
    const message = document.createElement('div');
    message.classList.add('chat-message', 'chat-message-system');
    message.textContent = actionMessage;
    chatContainer.appendChild(message);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  
  // Video & Audio Functions
  
  async function toggleVideo() {
    videoActive = !videoActive;
    videoToggleButton.textContent = videoActive ? 'Stop Video' : 'Start Video';
    
    if (videoActive) {
      try {
        // Request camera and microphone permissions
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        // Create video element and attach stream
        const videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        videoElement.muted = true; // Mute to prevent feedback
        videoElement.classList.add('video-stream');
        
        // Create audio context for visualization
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioSource = audioContext.createMediaStreamSource(stream);
        audioAnalyser = audioContext.createAnalyser();
        audioAnalyser.fftSize = 256;
        audioSource.connect(audioAnalyser);
        
        // Setup audio visualization canvas
        const audioCanvas = document.createElement('canvas');
        audioCanvas.classList.add('audio-visualizer');
        audioCanvas.width = 400;
        audioCanvas.height = 50;
        
        // Clear the container and add video and canvas
        videoContainer.innerHTML = '';
        videoContainer.classList.add('active');
        videoContainer.appendChild(videoElement);
        videoContainer.appendChild(audioCanvas);
        
        // Start visualizations
        visualizeAudio(audioCanvas, audioAnalyser);
        
        // Update connection info
        document.querySelector('.connection-status').textContent = 'Connected';
        document.querySelector('.connection-resolution').textContent = '1080p'; // Enterprise gets higher resolution
        document.querySelector('.connection-latency').textContent = '35ms';
        
        // Update control buttons
        updateVideoControlIcons();
      } catch (error) {
        console.error('Error accessing media devices:', error);
        videoActive = false;
        videoToggleButton.textContent = 'Start Video';
        videoContainer.innerHTML = '<span>Error: Could not access camera or microphone</span>';
        videoContainer.classList.remove('active');
      }
    } else {
      // Stop all tracks
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Close audio context
      if (audioContext) {
        audioContext.close();
        audioContext = null;
        audioAnalyser = null;
      }
      
      // Reset the container
      videoContainer.classList.remove('active');
      videoContainer.innerHTML = '<span>Click &apos;Start Video&apos; to activate</span>';
      
      // Update connection info
      document.querySelector('.connection-status').textContent = 'Disconnected';
      document.querySelector('.connection-resolution').textContent = 'N/A';
      document.querySelector('.connection-latency').textContent = 'N/A';
      
      // Reset variables
      stream = null;
      isMuted = false;
      isCameraOn = true;
    }
  }
  
  function toggleMute() {
    if (!stream) return;
    
    isMuted = !isMuted;
    
    stream.getAudioTracks().forEach(track => {
      track.enabled = !isMuted;
    });
    
    // Update icon
    const muteButton = document.querySelectorAll('.video-control')[0];
    muteButton.textContent = isMuted ? '🔊' : '🔇';
  }
  
  function toggleCamera() {
    if (!stream) return;
    
    isCameraOn = !isCameraOn;
    
    stream.getVideoTracks().forEach(track => {
      track.enabled = isCameraOn;
    });
    
    // Update icon
    const cameraButton = document.querySelectorAll('.video-control')[1];
    cameraButton.textContent = isCameraOn ? '📷' : '🚫';
  }
  
  function updateVideoControlIcons() {
    const controls = document.querySelectorAll('.video-control');
    controls[0].textContent = isMuted ? '🔊' : '🔇';
    controls[1].textContent = isCameraOn ? '📷' : '🚫';
  }
  
  function showVideoSettings() {
    // Create a simple settings panel that would appear
    alert('Enterprise Video Settings Panel (resolution, fps, encoding, etc.)');
  }
  
  function visualizeAudio(canvas, analyser) {
    const canvasCtx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
      if (!audioAnalyser) return; // Stop if audio context is closed
      
      requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      canvasCtx.fillStyle = 'rgb(23, 27, 35)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 4;
        
        canvasCtx.fillStyle = `rgb(${barHeight + 100}, 65, 255)`;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    }
    
    draw();
  }
  
  // File Upload Functions
  
  function setupFileUpload() {
    // Create file input element (hidden)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = '.pdf';
    fileInput.style.display = 'none';
    fileInput.id = 'file-upload-input';
    fileInput.addEventListener('change', handleFileSelection);
    document.body.appendChild(fileInput);
    
    // Create and add upload button
    uploadButton.type = 'button';
    uploadButton.className = 'upload-button';
    uploadButton.innerHTML = '📎';
    uploadButton.title = 'Upload PDF files (max 10 files, 100MB each, 500MB total)';
    uploadButton.addEventListener('click', () => fileInput.click());
    
    // Add the upload button to the chat input form
    const chatInputForm = document.querySelector('.chat-input-form');
    chatInputForm.insertBefore(uploadButton, sendButton);
    
    // Add file upload styles
    const style = document.createElement('style');
    style.textContent = `
      .upload-button {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: var(--color-text-secondary);
        cursor: pointer;
        padding: 0.5rem;
        margin-right: 0.5rem;
        transition: color 0.2s;
      }
      
      .upload-button:hover {
        color: var(--color-primary);
      }
      
      .file-upload-status {
        position: absolute;
        bottom: 100%;
        left: 0;
        right: 0;
        background-color: var(--color-surface-dark);
        border-radius: 0.5rem;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease-out;
      }
      
      @keyframes slideIn {
        from { transform: translateY(1rem); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .file-list {
        margin-top: 0.5rem;
        max-height: 10rem;
        overflow-y: auto;
      }
      
      .file-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.25rem 0;
        font-size: 0.875rem;
      }
      
      .file-info {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .file-size {
        color: var(--color-text-secondary);
        margin-left: 0.5rem;
      }
      
      .progress-bar {
        height: 4px;
        background-color: var(--color-surface-light);
        border-radius: 2px;
        margin-top: 0.5rem;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        background-color: var(--color-primary);
        width: 0%;
        transition: width 0.3s;
      }
      
      .upload-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 0.75rem;
      }
      
      .cancel-upload {
        color: var(--color-error);
        background: none;
        border: none;
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }
  
  function handleFileSelection(e) {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Validate file count
    if (files.length > 10) {
      alert('Maximum 10 files allowed');
      return;
    }
    
    // Validate file sizes
    let totalSize = 0;
    const invalidFiles = [];
    
    files.forEach(file => {
      totalSize += file.size;
      if (file.size > 100 * 1024 * 1024) { // 100MB
        invalidFiles.push(file.name);
      }
    });
    
    if (invalidFiles.length > 0) {
      alert(`Files exceeding 100MB: ${invalidFiles.join(', ')}`);
      return;
    }
    
    if (totalSize > 500 * 1024 * 1024) { // 500MB
      alert('Total upload size exceeds 500MB limit');
      return;
    }
    
    // Show upload status UI
    showUploadStatus(files);
    
    // Simulate upload and processing
    simulateFileUpload(files);
  }
  
  function showUploadStatus(files) {
    // Create upload status container
    const statusContainer = document.createElement('div');
    statusContainer.className = 'file-upload-status';
    
    // Create header
    const header = document.createElement('div');
    header.style.fontWeight = 'bold';
    header.textContent = `Uploading ${files.length} file${files.length > 1 ? 's' : ''}`;
    
    // Create file list
    const fileList = document.createElement('div');
    fileList.className = 'file-list';
    
    files.forEach(file => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      
      const fileInfo = document.createElement('div');
      fileInfo.className = 'file-info';
      fileInfo.textContent = file.name;
      
      const fileSize = document.createElement('span');
      fileSize.className = 'file-size';
      fileSize.textContent = formatFileSize(file.size);
      
      fileItem.appendChild(fileInfo);
      fileItem.appendChild(fileSize);
      fileList.appendChild(fileItem);
    });
    
    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    
    progressBar.appendChild(progressFill);
    
    // Create actions
    const actions = document.createElement('div');
    actions.className = 'upload-actions';
    
    const status = document.createElement('div');
    status.textContent = 'Preparing...';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-upload';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(statusContainer);
    });
    
    actions.appendChild(status);
    actions.appendChild(cancelButton);
    
    // Assemble and add to DOM
    statusContainer.appendChild(header);
    statusContainer.appendChild(fileList);
    statusContainer.appendChild(progressBar);
    statusContainer.appendChild(actions);
    
    document.querySelector('.chat-input-container').appendChild(statusContainer);
    
    return { statusContainer, progressFill, status };
  }
  
  function simulateFileUpload(files) {
    const { statusContainer, progressFill, status } = showUploadStatus(files);
    
    let progress = 0;
    const totalSteps = 100;
    
    // Enterprise version processes faster
    const uploadInterval = setInterval(() => {
      progress += 2; // Twice as fast as standard version
      progressFill.style.width = `${progress}%`;
      
      if (progress < 40) {
        status.textContent = 'Uploading...';
      } else if (progress < 70) {
        status.textContent = 'Extracting concepts...';
      } else if (progress < 90) {
        status.textContent = 'Processing...';
      } else {
        status.textContent = 'Finalizing...';
      }
      
      if (progress >= totalSteps) {
        clearInterval(uploadInterval);
        completeUpload(files, statusContainer);
      }
    }, 30); // Faster interval
  }
  
  function completeUpload(files, statusContainer) {
    // Remove status container
    document.body.removeChild(statusContainer);
    
    // Add a system message about the upload
    const message = document.createElement('div');
    message.classList.add('chat-message', 'chat-message-system');
    message.textContent = `Uploaded ${files.length} file${files.length > 1 ? 's' : ''} and extracted concepts.`;
    chatContainer.appendChild(message);
    
    // Add a message from the assistant
    setTimeout(() => {
      const conceptCount = Math.floor(Math.random() * 30) + 15; // Enterprise extracts more concepts
      addMessage('assistant', `Enterprise analysis complete. I've analyzed the uploaded document${files.length > 1 ? 's' : ''} and extracted ${conceptCount} key concepts with their interconnections. Would you like me to present a summary report, focus on specific concepts, or generate a visualization of their relationships?`, activePersona);
    }, 600); // Faster response time
  }
  
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
});
