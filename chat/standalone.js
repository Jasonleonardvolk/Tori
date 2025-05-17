/**
 * TORI Chat - Standalone JavaScript Implementation
 * 
 * A lightweight, framework-free implementation of the TORI Chat interface
 * that doesn't require React, Vite, or any build process.
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const chatContainer = document.querySelector('.chat-messages');
  const messageInput = document.querySelector('.message-input');
  const sendButton = document.querySelector('.send-button');
  
  // State
  let activePerson = 'ref'; // Default starting persona (refactorer)
  let messageCount = 0;
  let videoActive = false;
  let stream = null;
  
  // Initialize persona tabs
  const personaTabs = document.querySelectorAll('.persona-tab');
  personaTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setActivePerson(tab.dataset.persona);
    });
  });
  
  // Set active persona
  function setActivePerson(persona) {
    // Remove active class from all tabs
    personaTabs.forEach(tab => tab.classList.remove('active'));
    
    // Add active class to selected tab
    document.querySelector(`.persona-tab[data-persona="${persona}"]`).classList.add('active');
    
    // Update active persona
    activePerson = persona;
  }
  
  // Send a message
  function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    // Create user message
    appendMessage('user', text);
    
    // Clear input
    messageInput.value = '';
    
    // Simulate response after a short delay
    setTimeout(() => {
      const responses = {
        ref: `Here's a refactoring suggestion: ${text.length > 30 ? text.substring(0, 30) + '...' : text} could be optimized for better performance.`,
        bug: `I've detected a potential issue related to: ${text.length > 30 ? text.substring(0, 30) + '...' : text}`,
        sch: `Based on best practices, I'd recommend: ${text.length > 30 ? text.substring(0, 30) + '...' : text}`
      };
      
      appendMessage('assistant', responses[activePerson], activePerson);
    }, 600);
  }
  
  // Append a message to the chat
  function appendMessage(role, text, persona = null) {
    messageCount++;
    
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${role}`;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.textContent = text;
    
    // Add timestamp
    const timestampElement = document.createElement('div');
    timestampElement.className = 'message-timestamp';
    timestampElement.textContent = getCurrentTime();
    contentElement.appendChild(timestampElement);
    
    messageElement.appendChild(contentElement);
    chatContainer.appendChild(messageElement);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Add persona color if it's an assistant message
    if (role === 'assistant' && persona) {
      const colors = {
        ref: 'var(--color-primary)',
        bug: 'var(--color-warning)',
        sch: 'var(--color-success)'
      };
      
      contentElement.style.borderLeftColor = colors[persona];
      const personaBadge = document.createElement('span');
      personaBadge.className = 'persona-badge';
      personaBadge.textContent = getPersonaName(persona);
      personaBadge.style.backgroundColor = colors[persona];
      contentElement.prepend(personaBadge);
    }
  }
  
  // Get current time for message timestamp
  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Get persona full name
  function getPersonaName(persona) {
    const names = {
      ref: 'Refactorer',
      bug: 'Debugger',
      sch: 'Scholar'
    };
    return names[persona];
  }
  
  // Audio/Video chat functionality
  const videoToggleButton = document.querySelector('.video-toggle');
  const videoContainer = document.querySelector('.video-container');
  
  videoToggleButton.addEventListener('click', toggleVideo);
  
  async function toggleVideo() {
    if (videoActive) {
      // Stop video
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      
      videoContainer.style.display = 'none';
      videoToggleButton.textContent = '📹 Start Video';
      videoActive = false;
    } else {
      try {
        // Request camera and microphone access
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        // Display video
        const videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        videoElement.muted = true; // Mute to prevent feedback
        
        // Clear container and add video
        videoContainer.innerHTML = '';
        videoContainer.appendChild(videoElement);
        videoContainer.style.display = 'block';
        
        videoToggleButton.textContent = '🛑 Stop Video';
        videoActive = true;
        
        // Add system message
        appendMessage('system', 'Video call started. This is a local preview only.');
      } catch (err) {
        console.error('Error accessing media devices:', err);
        appendMessage('system', 'Could not access camera or microphone.');
      }
    }
  }
  
  // File upload functionality
  const fileUploadButton = document.querySelector('.file-upload-button');
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.accept = '.pdf';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  fileUploadButton.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', handleFileUpload);
  
  function handleFileUpload(e) {
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
    
    // Create upload status overlay
    showUploadStatus(files);
  }
  
  function showUploadStatus(files) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'upload-overlay';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'upload-modal';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'upload-header';
    header.innerHTML = `
      <h3>Uploading ${files.length} file${files.length !== 1 ? 's' : ''}</h3>
      <button class="upload-close">&times;</button>
    `;
    
    // Create file list
    const fileList = document.createElement('div');
    fileList.className = 'upload-file-list';
    
    files.forEach(file => {
      const fileItem = document.createElement('div');
      fileItem.className = 'upload-file-item';
      fileItem.innerHTML = `
        <span class="upload-file-name">${file.name}</span>
        <span class="upload-file-size">${formatFileSize(file.size)}</span>
      `;
      fileList.appendChild(fileItem);
    });
    
    // Create progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'upload-progress';
    progressContainer.innerHTML = `
      <div class="upload-progress-bar">
        <div class="upload-progress-fill" style="width: 0%"></div>
      </div>
      <div class="upload-status-text">Uploading...</div>
    `;
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(fileList);
    modal.appendChild(progressContainer);
    overlay.appendChild(modal);
    
    // Add to DOM
    document.body.appendChild(overlay);
    
    // Add close button handler
    const closeButton = overlay.querySelector('.upload-close');
    closeButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    // Simulate upload progress
    simulateUpload(overlay, files);
  }
  
  function simulateUpload(overlay, files) {
    let progress = 0;
    const progressFill = overlay.querySelector('.upload-progress-fill');
    const statusText = overlay.querySelector('.upload-status-text');
    
    const interval = setInterval(() => {
      progress += 1;
      progressFill.style.width = `${progress}%`;
      
      // Update status text based on progress
      if (progress < 50) {
        statusText.textContent = 'Uploading...';
      } else if (progress < 80) {
        statusText.textContent = 'Extracting concepts...';
      } else if (progress < 95) {
        statusText.textContent = 'Processing...';
      } else {
        statusText.textContent = 'Finalizing...';
      }
      
      // Complete upload
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          document.body.removeChild(overlay);
          completeUpload(files);
        }, 500);
      }
    }, 50);
  }
  
  function completeUpload(files) {
    // Add system message
    appendMessage('system', `Uploaded ${files.length} file${files.length !== 1 ? 's' : ''} and extracted concepts.`);
    
    // Add assistant response
    setTimeout(() => {
      const conceptCount = Math.floor(Math.random() * 20) + 5;
      const message = `I've analyzed the uploaded document${files.length > 1 ? 's' : ''} and extracted ${conceptCount} key concepts. Would you like me to summarize them or focus on any specific area?`;
      appendMessage('assistant', message, activePerson);
      
      // Show extracted concepts panel if toggle is on
      if (document.querySelector('.concepts-toggle-checkbox').checked) {
        showExtractedConcepts();
      }
    }, 800);
  }
  
  function showExtractedConcepts() {
    // Sample concepts
    const concepts = [
      'Quantum Mechanics',
      'Neural Networks',
      'Vector Spaces',
      'Differential Equations',
      'Eigenvalues',
      'Manifold Learning',
      'Phase Transitions',
      'Entropy',
      'Information Theory',
      'Symplectic Geometry',
      'Lyapunov Exponents',
      'Attractor Dynamics',
      'Spectral Analysis',
      'Tensor Decomposition',
      'Koopman Operators'
    ];
    
    // Randomly select several concepts
    const numConcepts = 5 + Math.floor(Math.random() * 10); // 5-15 concepts
    const selectedConcepts = [];
    
    while (selectedConcepts.length < numConcepts) {
      const concept = concepts[Math.floor(Math.random() * concepts.length)];
      if (!selectedConcepts.includes(concept)) {
        selectedConcepts.push(concept);
      }
    }
    
    // Create or update concepts panel
    let conceptsPanel = document.querySelector('.concepts-panel');
    
    if (!conceptsPanel) {
      conceptsPanel = document.createElement('div');
      conceptsPanel.className = 'concepts-panel';
      document.body.appendChild(conceptsPanel);
    }
    
    // Update panel content
    conceptsPanel.innerHTML = `
      <h3>Extracted Concepts</h3>
      <ul>
        ${selectedConcepts.map(concept => `
          <li><span class="concept-dot"></span>${concept}</li>
        `).join('')}
      </ul>
    `;
  }
  
  // Format file size for display
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  
  // Toggle concepts panel visibility
  const conceptsToggle = document.querySelector('.concepts-toggle-checkbox');
  conceptsToggle.addEventListener('change', function() {
    const panel = document.querySelector('.concepts-panel');
    
    if (this.checked && panel) {
      panel.style.display = 'block';
    } else if (panel) {
      panel.style.display = 'none';
    }
  });
  
  // Add clear button functionality
  const clearButton = document.querySelector('.clear-button');
  clearButton.addEventListener('click', () => {
    chatContainer.innerHTML = '';
    messageCount = 0;
    
    // Add welcome message
    appendMessage('assistant', 'Howdy 👋 How can I help?', 'sch');
  });
  
  // Event listeners
  sendButton.addEventListener('click', sendMessage);
  
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Initial welcome message
  appendMessage('assistant', 'Howdy 👋 How can I help?', 'sch');
});
