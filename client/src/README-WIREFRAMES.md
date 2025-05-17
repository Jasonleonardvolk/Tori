# ALAN IDE Wireframe Implementation

This directory contains the implementation of the UI wireframes described in `ui_wireframes.md` and expanded upon in your additional specifications. The implementation follows a componentized approach to match the wireframe structure.

## Implemented Components

### 1. Concept Field Canvas (`/components/ConceptFieldCanvas/`)

- **Core Canvas**: Visualizes the concept graph embedded in κ-space
- **Interactive Elements**: Selection, hover, and interaction support
- **Overlays**:
  - Phase dynamics (HSV color visualization)
  - Coupling strength (edge thickness)
  - Resonance (node size and pulsing)
  - Koopman vectors (arrow visualization)
- **Controls**:
  - Geometry switching (Euclidean, spherical, hyperbolic)
  - Alpha parameter adjustment
  - Morph execution controls

### 2. Agent Panel System (`/components/AgentPanel/`)

- **Agent Tabs**:
  - Refactor Agent (algorithm suggestions)
  - Debug Agent (anomaly detection)
  - Doc Agent (documentation generation)
  - Memory Agent (project history)
  - Console Agent (direct interaction)
- **Suggestion Cards**:
  - Rich display of agent suggestions with metrics
  - Action buttons for accepting, modifying, or dismissing
- **Configuration Controls**:
  - Agent autonomy settings (passive, active, autopilot)
  - Mode-specific controls for each agent type

### 3. Field Meditation Mode (`/components/FieldMeditationMode/`)

- **Time Controls**: Play/pause, step forward/backward
- **Visualization Panels**:
  - Koopman Spectrum Trail
  - Spectral Entropy Wave  
  - Phase Field Canvas (over time)
- **Parameter Display**: Time, alpha, geometry settings

## Main Layout

All these components are assembled in the `AlanIDELayout.jsx` component, which:

- Arranges the ConceptFieldCanvas and AgentPanel in a side-by-side layout
- Provides a mode switcher to toggle Field Meditation Mode
- Maintains state and handles communication between components

## Using the Implementation

To use this implementation:

1. The default view shows the main Concept Field Canvas with the Agent Panel sidebar
2. Click the "Field Meditation" button in the header to switch to Field Meditation Mode
3. In Field Meditation Mode, use the playback controls to visualize field dynamics over time
4. Click "Exit Mode" to return to the main interface

## Design System

The implementation uses the design system tokens defined in `theme.css`, including:

- Color palette with light/dark theming support
- Spacing and typography scales
- Border radii, shadows, and transitions
- Consistent UI elements and control styling

## Future Enhancements

As part of Phase 3, this wireframe implementation will be connected to:

- Real data from Python project parsing
- Live code editing with bidirectional sync
- Execution monitoring and tracing
- Advanced refactoring tools
- Export capabilities

## Note About Placeholder Content

Some visualizations currently display placeholder data. In a production implementation, these would be connected to actual data from:

- `dynamicalSystemsService.js`
- `conceptGraphService.js`
- `scholarSphereService.js`
