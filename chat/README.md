# TORI Chat Interface

A modern chat interface with an Apple-inspired design, featuring:

- Multi-persona AI chat system (Refactorer, Debugger, Scholar)
- Glass-like UI elements with subtle depth and animation
- Quick action functionality
- Three-column layout (History, Chat, Video)
- Responsive design for all devices

## Implementation Options

This project provides two implementation approaches:

### 1. Standalone HTML/CSS/JS Version
- No framework dependencies - pure HTML, CSS, and vanilla JavaScript
- Single file CSS with no build process required
- Works in any modern browser
- Easy to integrate with backend services

### 2. React Component Version (src/ directory)
- Component-based architecture
- Built with React and Tailwind CSS
- More extensible for complex applications

## Quick Demo

To quickly see the UI without setting up the full React environment:

1. Open the standalone version:
```bash
cd chat
start standalone.html
```

This standalone HTML file includes a simplified version of the complete UI with working interactions. It uses CDN versions of required libraries without any build step.

## Setup Instructions (React Development)

There are two ways to run the project:

### Option 1: Simple Express Server (Quick Preview)

This option serves the static demo without building the React app:

```bash
cd chat
npm install express
node start-demo.js
```

Then open http://localhost:3000 in your browser.

### Option 2: Full React Development Environment

1. Install dependencies:
```bash
cd chat
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Features

### Persona System
Choose between different AI personas:
- 🔧 Refactorer - For code optimization
- 🐛 Debugger - For finding and fixing bugs
- 📖 Scholar - For explanations and learning

### Quick Actions
- One-click code optimizations
- Explanations for code blocks
- Notifications for issues

### Styling
- Frosted glass UI elements
- Subtle animations
- Mac-like design aesthetics

## Extending the UI

### Adding the Three-Column Layout

To implement the mentioned three-column layout with chat history on the left and video on the right:

```jsx
// Layout component
function AppLayout() {
  return (
    <div className="h-screen flex">
      {/* Left - Chat History */}
      <div className="w-64 shrink-0 border-r bg-surface-dark overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-medium mb-4">Chat History</h2>
          {/* Chat history items would go here */}
        </div>
      </div>
      
      {/* Center - Chat */}
      <div className="flex-1">
        <ChatWindow />
      </div>
      
      {/* Right - Video */}
      <div className="w-[28rem] shrink-0 border-l bg-surface-dark">
        <div className="p-4">
          <h2 className="text-lg font-medium mb-4">Video Panel</h2>
          {/* Video content would go here */}
        </div>
      </div>
    </div>
  );
}
```

## Next Steps

1. Connect to backend API for real message handling
2. Implement dark/light mode toggling
3. Add accessibility improvements
4. Set up proper build and deployment pipeline
