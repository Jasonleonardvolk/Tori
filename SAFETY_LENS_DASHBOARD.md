# ELFIN Safety Lens Dashboard

> Real-time barrier + Lyapunov margin visualization

## Overview

The Safety Lens Dashboard provides real-time visualization of barrier function values and Lyapunov stability margins for ELFIN systems. It helps developers monitor and debug safety-critical control systems by providing intuitive visual representations of safety conditions.

## Components

### 1. Barrier Function Timeline

- **Purpose**: Visualizes real-time barrier function values and thresholds over time
- **Features**:
  - 20Hz streaming updates via Server-Sent Events (SSE)
  - Automatic alert on safety threshold breaches
  - Smooth animation and scrolling timeline
  - Clear visual distinction between barrier value and threshold

### 2. 3D Iso-Surface Visualization

- **Purpose**: Displays 3D representation of barrier/Lyapunov function level sets
- **Features**:
  - WebGL-based rendering with three.js
  - Interactive orbit controls for 3D manipulation
  - On-demand isosurface generation for different level values
  - Support for both barrier and Lyapunov function visualization
  - Automatic fallback to simpler geometries when needed

### 3. Parameter Sliders

- **Purpose**: Real-time adjustment of system parameters
- **Features**:
  - Debounced API updates (100ms) to prevent excessive requests
  - Numerical and slider input options
  - Visual feedback during parameter updates
  - Support for different parameter ranges and step sizes

### 4. Backend Services

The dashboard is supported by several backend services:

- **Barrier Stream**: Generates real-time barrier function values and thresholds
- **Isosurface Generator**: Creates 3D meshes for different level sets
- **API Endpoints**: FastAPI server providing data streaming and parameter control
- **Launcher Script**: Unified script to run the dashboard and its components

## Running the Dashboard

```bash
# Basic usage (Windows)
run_dashboard.bat

# Basic usage (Linux/macOS)
./run_dashboard.py

# With custom options
run_dashboard.py --demo-system quadrotor --pregenerate-isosurfaces

# Available options
--api-port PORT         API server port (default: 8000)
--dash-port PORT        Dashboard server port (default: 3000)
--demo-system SYSTEM    Demo system type (quadrotor, pendulum, default)
--pregenerate-isosurfaces  Pre-generate isosurfaces for faster loading
--dev                   Run in development mode
--api-only              Run API server only
--dashboard-only        Run dashboard only
```

## Implementation Details

### Frontend (React + TypeScript)

The dashboard frontend is built with React and TypeScript, utilizing:

- **Server-Sent Events (SSE)**: For real-time data streaming
- **Three.js**: For 3D WebGL rendering
- **Custom React Hooks**: For efficient data handling and debounced updates
- **Responsive Design**: Works on different screen sizes

### Backend (Python)

The backend services are implemented in Python, utilizing:

- **FastAPI**: For high-performance API endpoints
- **Numpy**: For mathematical computations
- **Trimesh/Scikit-image**: For 3D mesh generation and manipulation
- **Async I/O**: For efficient parallel processing

## Extending the Dashboard

### Adding New Visualizations

To add a new visualization component:

1. Create a new React component in `dashboard/src/components/`
2. Add corresponding API endpoints in `alan_backend/elfin/visualization/api.py`
3. Update the main `App.tsx` to include your new component

### Supporting New System Types

To add support for new system types:

1. Create a specialized stream class in `barrier_stream.py`
2. Add appropriate isosurface generation in `isosurface_generator.py`
3. Update the dashboard launcher to include your new system type

## Architecture

```
├── dashboard/                  # Frontend React application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── SafetyTimeline.tsx   # Barrier timeline visualization
│   │   │   ├── IsoSurfaceViewer.tsx # 3D visualization component
│   │   │   └── ParamSlider.tsx      # Parameter control slider
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── useSSE.ts       # Hook for Server-Sent Events
│   │   └── App.tsx             # Main application component
│   └── package.json            # Frontend dependencies
├── alan_backend/
│   └── elfin/
│       └── visualization/      # Backend visualization services
│           ├── api.py          # FastAPI endpoints
│           ├── barrier_stream.py  # Real-time barrier data stream
│           └── isosurface_generator.py  # 3D mesh generation
└── run_dashboard.py            # Dashboard launcher script
```

## Future Enhancements

- **Multiple System Comparison**: Side-by-side visualization of different systems
- **Historical Data Recording**: Record and replay simulation runs
- **Animation Controls**: Pause, slowdown, and time-step control
- **Export Tools**: Save visualizations as images or videos
- **Custom Color Schemes**: User-configurable visualization styles

## References

- [Three.js Documentation](https://threejs.org/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Server-Sent Events (SSE) MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
