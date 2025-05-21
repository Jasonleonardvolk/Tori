import React from 'react';
import ChatWindow from './components/ChatWindow';
import VideoPanel from './components/VideoPanel';
import HistoryPanel from './components/HistoryPanel';

function App() {
  return (
    <div className="h-screen flex">
      {/* Left - Chat History / Projects */}
      <div className="w-64 shrink-0 border-r bg-surface-dark overflow-y-auto">
        <HistoryPanel />
      </div>
      
      {/* Center - Chat */}
      <div className="flex-1">
        <ChatWindow />
      </div>
      
      {/* Right - Video */}
      <div className="w-[28rem] shrink-0 border-l bg-surface-dark">
        <VideoPanel />
      </div>
    </div>
  );
}

export default App;
