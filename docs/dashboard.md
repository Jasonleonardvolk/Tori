# ELFIN Safety Lens Dashboard

## Overview

The ELFIN Safety Lens Dashboard provides real-time visualization of barrier functions and Lyapunov stability metrics for control systems. This interactive dashboard offers:

1. **Real-time barrier monitoring** - Stream data at 20Hz with warning indicators for safety violations
2. **3D iso-surface visualization** - WebGL-based interactive exploration of barrier and Lyapunov functions
3. **2D heatmap visualization** - Color-coded field representation for barrier/Lyapunov analysis
4. **Interactive parameter adjustment** - Real-time tuning of λ-cut, weights, and thresholds

## Components

### SafetyTimeline

The `SafetyTimeline` component displays real-time streaming data of barrier function values:

- Uses Server-Sent Events (SSE) for high-frequency updates (20Hz)
- Plots both barrier values and threshold over time
- Visual indicators when barrier value breaches threshold
- Auto-scrolling timeline with configurable history length

### IsoSurfaceViewer

The `IsoSurfaceViewer` component provides 3D visualization of barrier/Lyapunov functions:

- WebGL-based rendering using Three.js
- Interactive camera controls (orbit, pan, zoom)
- λ-cut level adjustable in real-time
- Toggle between barrier and Lyapunov function visualization
- Automatic scaling and centering

### FieldHeatmap

The `FieldHeatmap` component displays 2D heatmaps of state-space fields:

- Color-coded visualization of barrier or Lyapunov function values
- Uses Plotly.js for interactive exploration
- Hover tooltips with precise values
- Automatic gridding with configurable resolution

### ParamSlider

The `ParamSlider` component enables real-time parameter adjustment:

- Debounced API updates (100ms default) to prevent flooding
- Both slider and direct numeric input
- Visual feedback during parameter updates
- Min/max/step configuration

## API Integration

The dashboard components interact with the following backend API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/stream/barrier?sys=<id>` | GET | SSE stream of barrier data |
| `/api/v1/barrier/isosurface?lvl=<val>&type=<type>` | GET | 3D iso-surface data (GLB format) |
| `/api/v1/field?type=<type>&grid=<size>` | GET | 2D field data for heatmap |
| `/api/v1/koopman/params` | POST | Update system parameters |

## Technical Details

### Performance Considerations

The dashboard is optimized for real-time performance:

- SSE stream rate: 20 Hz maximum
- Target frame budget: 4ms per frame (60 FPS with headroom)
- 3D isosurface: pre-computed on server with <25k faces
- Memory usage: <50 MB JS heap target

### Architecture Pattern

The dashboard follows a component-based architecture:

1. **Hooks layer** - Custom React hooks for data fetching, SSE, and state management
2. **Component layer** - Reusable visualization widgets with clean APIs
3. **Page layer** - Composition of components with layout and navigation

### Running the Dashboard

To start the dashboard:

```bash
# Start both backend API and frontend
python run_dashboard.py

# Start in production mode (pre-built frontend)
python run_dashboard.py --prod

# Start without auto-opening browser
python run_dashboard.py --no-browser
```

This will start:
- Backend API on http://localhost:8000
- Frontend on http://localhost:3000

## Technologies Used

- **Frontend**:
  - React 18 with TypeScript
  - Three.js for 3D visualization
  - Plotly.js for 2D plots
  - Server-Sent Events for real-time updates

- **Backend**:
  - FastAPI (Python)
  - NumPy for array operations
  - AsyncIO for concurrent processing

## Integration with Packaging System

The dashboard is intended to be distributed as an ELFIN package, showcasing the packaging system capabilities. The package defines its dependencies in `elfpkg.toml` and includes:

- Frontend React components
- Backend API endpoints
- Example systems for demonstration

To install the dashboard package:

```bash
elf install elfin-dashboard
