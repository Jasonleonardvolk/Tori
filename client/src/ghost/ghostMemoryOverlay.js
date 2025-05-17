// ghostMemoryOverlay.js
// Overlay renderer now absorbs ghost tone for persona-aware visuals & phrasing
import { getAgentSettings } from './agentSettings';
import { getGhostPhrase } from './ghostToneTemplates';

// Example overlay state (could be Redux, context, or simple window event)
export function showGhostMemoryOverlay({ message, overlayId, intent = 'nudge', tone, ...opts }) {
  // Prefer explicit tone, else agent setting
  const persona = tone || getAgentSettings().ghostPersonaTone || 'default';
  const phrase = message || getGhostPhrase(persona, intent);

  // Visuals by tone
  let overlayStyle = {};
  if (persona === 'mystic') {
    overlayStyle = {
      background: 'rgba(90, 60, 160, 0.92)',
      color: '#fff',
      boxShadow: '0 0 32px 8px #a080ff66',
      border: '2px solid #c7a3ff',
      fontFamily: 'serif',
      filter: 'blur(0.5px)'
    };
  } else if (persona === 'chaotic') {
    overlayStyle = {
      background: 'rgba(40, 0, 0, 0.92)',
      color: '#ff5a5a',
      boxShadow: '0 0 20px 4px #ff5a5a99',
      border: '2px dashed #ffb347',
      animation: 'glitch 0.7s infinite',
      fontFamily: 'monospace'
    };
  } else if (persona === 'mentor') {
    overlayStyle = {
      background: 'rgba(255,255,255,0.97)',
      color: '#222',
      boxShadow: '0 0 24px 4px #b2f7ef66',
      border: '2px solid #b2f7ef',
      fontFamily: 'sans-serif',
      fontWeight: 600
    };
  } else {
    overlayStyle = {
      background: '#232323',
      color: '#fff',
      border: '2px solid #888',
      boxShadow: '0 2px 12px #0007'
    };
  }

  // Render overlay (pseudo-code, adapt to your UI framework)
  const overlayDiv = document.createElement('div');
  overlayDiv.id = overlayId || `ghost_overlay_${Date.now()}`;
  overlayDiv.innerText = phrase;
  Object.assign(overlayDiv.style, {
    position: 'fixed',
    left: '50%',
    top: '12%',
    transform: 'translate(-50%, 0)',
    zIndex: 9999,
    padding: '2em 2.5em',
    borderRadius: '18px',
    fontSize: '1.2em',
    transition: 'all 0.4s cubic-bezier(.4,2,.6,1)',
    ...overlayStyle
  });
  document.body.appendChild(overlayDiv);
  setTimeout(() => {
    overlayDiv.style.opacity = '0';
    overlayDiv.style.transform = 'translate(-50%, -32px)';
    setTimeout(() => overlayDiv.remove(), 900);
  }, 4200);
  // Optionally: trigger callbacks from opts.onAct, opts.onDismiss
}

// For devs: Live Persona Preview Panel
export function PersonaOverlayPreview({ tone = 'mentor', intent = 'confirm' }) {
  const phrase = getGhostPhrase(tone, intent);
  // Visuals by tone (reuse above)
  let overlayStyle = {};
  if (tone === 'mystic') {
    overlayStyle = {
      background: 'rgba(90, 60, 160, 0.92)',
      color: '#fff',
      boxShadow: '0 0 32px 8px #a080ff66',
      border: '2px solid #c7a3ff',
      fontFamily: 'serif',
      filter: 'blur(0.5px)'
    };
  } else if (tone === 'chaotic') {
    overlayStyle = {
      background: 'rgba(40, 0, 0, 0.92)',
      color: '#ff5a5a',
      boxShadow: '0 0 20px 4px #ff5a5a99',
      border: '2px dashed #ffb347',
      animation: 'glitch 0.7s infinite',
      fontFamily: 'monospace'
    };
  } else if (tone === 'mentor') {
    overlayStyle = {
      background: 'rgba(255,255,255,0.97)',
      color: '#222',
      boxShadow: '0 0 24px 4px #b2f7ef66',
      border: '2px solid #b2f7ef',
      fontFamily: 'sans-serif',
      fontWeight: 600
    };
  } else {
    overlayStyle = {
      background: '#232323',
      color: '#fff',
      border: '2px solid #888',
      boxShadow: '0 2px 12px #0007'
    };
  }
  // Render preview (pseudo-code, adapt to React/Vue/JSX as needed)
  const previewDiv = document.createElement('div');
  previewDiv.innerText = phrase + ` [${tone}]`;
  Object.assign(previewDiv.style, {
    margin: '1em',
    padding: '1.2em 2em',
    borderRadius: '16px',
    fontSize: '1.1em',
    ...overlayStyle
  });
  return previewDiv; // Replace with JSX if using React
}
