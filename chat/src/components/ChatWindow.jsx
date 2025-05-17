import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import PersonaBar from './PersonaBar';
import QuickActions from './QuickActionsBar';
import '../index.css';

export default function ChatWindow() {
  const listRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ───────── state ───────── */
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: 'Howdy 👋 How can I help?', persona: 'sch' },
  ]);
  const [input, setInput] = useState('');
  const [persona, setPersona] = useState('sch');        // active persona
  const [unseen, setUnseen] = useState({ ref:0, bug:0, sch:0 });
  const [nudge, setNudge] = useState(false);        // Send-button pulse
  
  // File upload states
  const [uploadStatus, setUploadStatus] = useState(null);
  const [showConceptsToggle, setShowConceptsToggle] = useState(true);
  const [extractedConcepts, setExtractedConcepts] = useState([]);

  /* ───────── auto-scroll ───────── */
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  /* ───────── idle nudge ───────── */
  useEffect(() => {
    const t = setTimeout(()=>setNudge(true), 5000); // 5-s hesitation
    return () => clearTimeout(t);
  }, [input]);

  /* ───────── helpers ───────── */
  const personaColor = {
    ref:'var(--color-primary)',
    bug:'var(--color-warning)',
    sch:'var(--color-success)',
  }[persona];

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages(prev => [...prev, { id: Date.now(), role:'user', text:trimmed }]);
    setInput(''); setNudge(false);

    /* TODO: stream reply from backend here */
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: Date.now()+1, role:'assistant', text:`Echo: ${trimmed}`, persona },
      ]);
      setUnseen(u => ({ ...u, [persona]:0 }));
    }, 600);
  };

  const handleAction = (id) => {
    if (id==='opt') sendPatch('/optimize');
    if (id==='exp') sendPatch('/explain');
  };

  const sendPatch = (path) => {
    /* stub for quick-action handlers */
    console.log(`Sending patch for ${path}`);
  };

  // File upload handlers
  const handleFileSelection = (e) => {
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
    
    // Start upload process
    const fileList = files.map(file => ({
      name: file.name,
      size: file.size,
      formattedSize: formatFileSize(file.size)
    }));
    
    setUploadStatus({
      files: fileList,
      totalFiles: files.length,
      progress: 0,
      statusText: 'Uploading...'
    });
    
    // Process the upload
    processUpload(files);
  };

  // Process the upload with a simulated progress bar
  const processUpload = (files) => {
    let progress = 0;
    const totalSteps = 100;
    
    const uploadInterval = setInterval(() => {
      progress += 1;
      
      // Update status based on progress
      if (progress < 50) {
        setUploadStatus(prev => ({
          ...prev,
          progress,
          statusText: 'Uploading...'
        }));
      } else if (progress < 80) {
        setUploadStatus(prev => ({
          ...prev,
          progress,
          statusText: 'Extracting concepts...'
        }));
      } else if (progress < 95) {
        setUploadStatus(prev => ({
          ...prev,
          progress,
          statusText: 'Processing...'
        }));
      } else {
        setUploadStatus(prev => ({
          ...prev,
          progress,
          statusText: 'Finalizing...'
        }));
      }
      
      // Complete upload
      if (progress >= totalSteps) {
        clearInterval(uploadInterval);
        completeUpload(files);
      }
    }, 50);
  };

  // Complete the upload and extract concepts
  const completeUpload = (files) => {
    // Clear upload status
    setUploadStatus(null);
    
    // Add system message about upload completion
    const systemMessage = {
      id: Date.now(),
      role: 'system',
      text: `Uploaded ${files.length} file${files.length > 1 ? 's' : ''} and extracted concepts.`
    };
    
    // Generate some simulated extracted concepts
    const sampleConcepts = [
      'Quantum Mechanics', 'Neural Networks', 'Vector Spaces',
      'Differential Equations', 'Eigenvalues', 'Manifold Learning',
      'Phase Transitions', 'Entropy', 'Information Theory',
      'Symplectic Geometry', 'Lyapunov Exponents', 'Attractor Dynamics',
      'Spectral Analysis', 'Tensor Decomposition', 'Koopman Operators'
    ];
    
    // Randomly select several concepts
    const numConcepts = 5 + Math.floor(Math.random() * 10); // 5-15 concepts
    const selectedConcepts = [];
    
    while (selectedConcepts.length < numConcepts) {
      const concept = sampleConcepts[Math.floor(Math.random() * sampleConcepts.length)];
      if (!selectedConcepts.includes(concept)) {
        selectedConcepts.push(concept);
      }
    }
    
    // Add assistant message with concept summary
    const assistantMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      text: `I've analyzed the uploaded document${files.length > 1 ? 's' : ''} and extracted ${selectedConcepts.length} key concepts. Would you like me to summarize them or focus on any specific area?`,
      persona
    };
    
    // Set extracted concepts for the sidebar
    setExtractedConcepts(selectedConcepts);
    
    // Add the messages to the chat
    setMessages(prev => [...prev, systemMessage, assistantMessage]);
  };

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto h-[90vh]">
      {/* Header */}
      <header className="glass rounded-t-xl2 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-dark">TORI Chat</h1>
        <span className="text-sm text-text-subtle">Phase-Sync Mode</span>
      </header>

      {/* Persona toggle */}
      <PersonaBar active={persona} setActive={setPersona} unseen={unseen} />

      {/* Concept toggle */}
      <div className="flex items-center justify-end px-3 py-1 bg-surface-dark">
        <label className="flex items-center text-sm text-text-subtle">
          <span className="mr-2">Show Extracted Concepts</span>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input 
              type="checkbox" 
              checked={showConceptsToggle} 
              onChange={() => setShowConceptsToggle(!showConceptsToggle)}
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
            />
            <div className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300"></div>
          </div>
        </label>
      </div>
      
      {/* Messages */}
      <main
        ref={listRef}
        className="flex-1 overflow-y-auto bg-surface-dark px-6 py-4 space-y-4 overscroll-contain"
      >
        {messages.map(m => (
          <ChatMessage
            key={m.id} role={m.role} text={m.text}
            personaColor={personaColor}
          />
        ))}
      </main>

      {/* Quick actions */}
      <QuickActions onAction={handleAction} />

      {/* File upload status overlay */}
      {uploadStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-surface p-5 rounded-xl max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Uploading {uploadStatus.files.length} file{uploadStatus.files.length !== 1 ? 's' : ''}
              </h3>
              <button 
                onClick={() => setUploadStatus(null)}
                className="text-text-subtle hover:text-text-dark"
              >
                &times;
              </button>
            </div>
            
            {/* File list */}
            <div className="max-h-40 overflow-y-auto mb-4 bg-surface-dark rounded p-2">
              {uploadStatus.files.map((file, index) => (
                <div key={index} className="flex justify-between py-1 px-2 mb-1 bg-black bg-opacity-20 rounded">
                  <span className="truncate flex-1 text-sm">{file.name}</span>
                  <span className="text-xs text-text-subtle ml-2">{file.formattedSize}</span>
                </div>
              ))}
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-surface-dark rounded-full h-2 mb-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadStatus.progress}%` }}
              ></div>
            </div>
            <div className="text-center text-sm text-text-subtle">
              {uploadStatus.statusText}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <footer className="glass rounded-b-xl2 p-4">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          multiple
          accept=".pdf"
          onChange={handleFileSelection}
        />
        
        <form onSubmit={e=>{e.preventDefault();send();}} className="flex items-end gap-3">
          {/* File upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="text-lg text-text-subtle hover:text-primary transition-colors"
            title="Upload PDF files (max 10 files, 100MB each, 500MB total)"
          >
            📎
          </button>
          
          <textarea
            rows={1} value={input}
            onChange={e=>{setInput(e.target.value); setNudge(false);}}
            placeholder="Type a message…"
            className="flex-1 resize-none bg-transparent text-text-dark placeholder-text-subtle focus:outline-none focus:ring-0"
            style={{ scrollbarWidth:'none' }}
          />
          <button
            type="submit"
            className={`rounded-full px-4 py-2 bg-primary hover:bg-primary-dark active:scale-95 transition transform-gpu font-medium text-surface-dark ${nudge?'nudge':''}`}
          >
            Send
          </button>
        </form>
      </footer>

      {/* Extracted concepts panel */}
      {showConceptsToggle && extractedConcepts.length > 0 && (
        <div className="fixed right-0 top-1/4 w-64 bg-surface p-4 rounded-l-lg shadow-lg border-l border-t border-b border-primary">
          <h3 className="text-md font-medium mb-2 border-b border-gray-700 pb-1">
            Extracted Concepts
          </h3>
          <ul className="max-h-72 overflow-y-auto">
            {extractedConcepts.map((concept, index) => (
              <li 
                key={index}
                className="py-1 px-2 text-sm hover:bg-black hover:bg-opacity-20 rounded cursor-pointer flex items-center"
              >
                <span className="w-1 h-1 rounded-full bg-primary mr-2 inline-block"></span>
                {concept}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
