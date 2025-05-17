# ALAN IDE: UI/UX Wireframes & Design System (2025-05-07)

## 1. Concept Field Canvas

```
[Toolbar: Overlay Toggles | Search | Zoom | Theme Switch]
 ┌──────────────────────────────────────────────────────────────┐
 │   ◯───◯───◯───◯───◯───◯───◯───◯───◯───◯───◯───◯───◯───◯     │
 │   |   |   |   |   |   |   |   |   |   |   |   |   |   |     │
 │   ◯   ◯   ◯   ◯   ◯   ◯   ◯   ◯   ◯   ◯   ◯   ◯   ◯   ◯     │
 │ [Live overlays: phase (HSV), resonance (pulse),             │
 │  coupling (weight), Koopman (arrows)]                       │
 │ [Group select: dashed rectangle]                            │
 └──────────────────────────────────────────────────────────────┘
[Dock: Panels, Agent Tabs, Concept Editor]
```

- Click node: open editor panel
- Drag-select: group morph
- Right-click: context menu
- Hover: tooltip (phase, resonance, Koopman, doc)
- Overlay toggles: phase, coupling, resonance, Koopman

---

## 2. Cognitive Side Panels

```
[Panel Dock: Koopman Spectrum | Phase Dynamics | Attractor Map]
 ┌─────────────┐
 │ Koopman     │  Eigenvalue plot, entropy chart, mode select
 ├─────────────┤
 │ Phase       │  Phase wheel, synchrony, turbulence
 ├─────────────┤
 │ Attractor   │  List, morph slider, focus
 └─────────────┘
```

- Dockable, resizable, sync with canvas

---

## 3. Agent Interface Dock

```
[Agent Tabs: Debug | Doc | Suggestions]
 ┌─────────────┐
 │ Debug       │  Anomaly alerts, quick fixes
 ├─────────────┤
 │ Doc         │  Live doc capsules, underdocumented alerts
 ├─────────────┤
 │ Suggestions │  Refactor/morph prompts
 └─────────────┘
```

- Notifications, agent output, dock/floating

---

## 4. Concept Editor Panel

```
[ConceptCapsuleEditor]
 ┌───────────────────────────────┐
 │ Name (editable)              │
 │ Phase sparkline, HSV swatch  │
 │ Resonance chart              │
 │ Koopman influence bars       │
 │ Eigenmode selector           │
 │ Coupling mini-graph          │
 │ [Monaco/Codemirror editor]   │
 │ Morph controls, history      │
 └───────────────────────────────┘
```

- Panel-to-canvas sync, morph controls, inline agent suggestions

---

## 5. Navigation & Search

```
[Search Bar | Filters]
 ┌───────────────────────────────┐
 │ Results:                     │
 │  - Node preview: phase, doc  │
 │  - Attractor search          │
 │  - Proximity nav             │
 │  - History scrubber          │
 └───────────────────────────────┘
```

- Click to jump, field replay, morph history

---

## 6. ScholarSphere Integration

```
[Project Memory Panel]
 ┌───────────────────────────────┐
 │ Prior morphs, attractors     │
 │ Analogies, reuse suggestions │
 │ Memory lattice visualization │
 └───────────────────────────────┘
```

- Browse, suggest, visualize project memory

---

# React Component Breakdown

- `<ConceptFieldCanvas />`
  - `<Node />`, `<Edge />`, `<OverlayPhase />`, `<OverlayCoupling />`, `<OverlayResonance />`, `<OverlayKoopman />`, `<GroupSelector />`, `<Tooltip />`, `<Toolbar />`
- `<PanelDock />`
  - `<KoopmanSpectrumPanel />`, `<PhaseDynamicsPanel />`, `<AttractorMapPanel />`
- `<AgentDock />`
  - `<AgentTab type="debug|doc|suggestion" />`, `<AgentNotification />`
- `<ConceptEditorPanel />`
  - `<PhaseSignature />`, `<ResonanceProfile />`, `<KoopmanInfluenceChart />`, `<EigenmodeSelector />`, `<CouplingMiniGraph />`, `<CodeEditor />`, `<MorphControls />`
- `<SearchPanel />`
  - `<SearchBar />`, `<SearchResults />`, `<HistoryScrubber />`
- `<ScholarSpherePanel />`
  - `<MemoryList />`, `<AnalogySuggestions />`, `<MemoryLattice />`

---

# Design Token Set (Palette, Light & Dark)

```css
:root {
  /* Neutral Bases */
  --color-bg-dark: #1E1E1E;
  --color-bg-light: #E0E0E0;
  --color-surface-dark: #23272F;
  --color-surface-light: #F5F5F5;

  /* Primary Accent */
  --color-primary: #00FFCC;
  --color-primary-dark: #00FFC8;
  --color-primary-light: #1E90FF;

  /* Secondary Accent */
  --color-secondary: #FF007F;
  --color-secondary-alt: #FF6F61;

  /* Tertiary/Extended Accents */
  --color-purple: #8A2BE2;
  --color-gold: #FFD700;

  /* Semantic Feedback */
  --color-success: #32CD32;
  --color-warning: #FFC857;
  --color-error: #FF6B6B;

  /* Text/Foreground */
  --color-text-primary-dark: #E0E0E0;
  --color-text-primary-light: #23272F;
  --color-text-secondary: #A9B1BD;

  /* Overlay/States */
  --color-hover: rgba(0,255,200,0.12);
  --color-selected: #00FFCC;
  --color-group: #FF007F;
  --color-tooltip-bg: #23272F;
  --color-tooltip-text: #FFFFFF;
}

[data-theme='dark'] {
  --color-bg: var(--color-bg-dark);
  --color-surface: var(--color-surface-dark);
  --color-text-primary: var(--color-text-primary-dark);
}
[data-theme='light'] {
  --color-bg: var(--color-bg-light);
  --color-surface: var(--color-surface-light);
  --color-text-primary: var(--color-text-primary-light);
}
```

---

# Usage

- Use this file as the single source of truth for UI prototyping, Figma translation, component development, and palette consistency across the ALAN IDE.
- All design/interaction principles and palette tokens are preserved for future implementation and iteration.
