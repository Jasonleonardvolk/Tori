# ITORI IDE Client - Vite Edition

This is the client-side application for ITORI IDE (formerly ALAN IDE), migrated from Create React App (CRA) to Vite for faster development and smaller bundle sizes.

## Key Project Entry Points

- **IDE Main Application**: `src/App.jsx` - Main entry component with React Router
- **IDE Layout**: `src/ItoriIDELayout.jsx` - Main IDE layout component
- **Chat Runtime**: `src/components/ChatWindow.jsx` - Core chat component mounted by App.jsx
- **Standalone Chat**: `chat/standalone.html` - Self-contained chat demo that works offline

## Getting Started

### Development

```bash
# Start the development server
./dev-start.bat

# Access the application
# Main IDE: http://localhost:5173
# Standalone Chat with HMR: http://localhost:5173/chat/standalone.html
```

### Production Build

```bash
# Create an optimized production build
./build-prod.bat

# Preview the production build
npx vite preview
```

## Project Structure

```
client/
├── src/              # Application source code
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── timecapsule/  # Time capsule functionality
│   └── index.jsx     # Main entry point
├── public/           # Static assets
├── chat/             # Standalone chat application
│   └── standalone.html  # Offline-ready chat interface
├── vite.config.js    # Vite configuration
└── .env.*            # Environment-specific variables
```

## Features

- **Fast Development**: HMR with Vite - changes appear instantly
- **Smaller Bundles**: Using Preact compatibility layer (~30KB vs ~120KB)
- **Environment Support**: Separate configs for development and production
- **TypeScript Path Resolution**: Auto-resolves paths from tsconfig.json
- **Code Splitting**: Optimized bundle chunks for faster loading
- **Hot Module Replacement**: Available in standalone.html when accessed via Vite dev server

## Environment Configuration

- `.env.development` - Development environment variables
- `.env.production` - Production environment variables

## Standalone Chat Usage

The standalone chat interface can be used in two ways:

1. **Offline Mode**: Double-click `chat/standalone.html` to launch instantly
2. **Development Mode**: Access via Vite dev server at `http://localhost:5173/chat/standalone.html` to get HMR functionality

Always run the production build after making changes to keep the standalone chat's JavaScript bundle up to date.
