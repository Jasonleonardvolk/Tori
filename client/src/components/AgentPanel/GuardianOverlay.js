import { estimateRipple } from '../../services/rippleAnalysisService.js';
import '../../components/AgentPanel/GuardianOverlay.css';

// Renders a modal overlay if suggestion is blocked, else returns null
export function GuardianOverlay({ suggestion, onProceed, onCancel }) {
  if (!suggestion || suggestion.socialImpact !== 'anti') return null;
  const ripple = estimateRipple(suggestion);
  const rationale = suggestion.socialImpactRationale || [];

  return (
    <div className="guardian-overlay-modal">
      <div className="guardian-overlay-content">
        <div className="guardian-badge" title="Antisocial Impact">🔴</div>
        <h2>This change may introduce antisocial behaviour.</h2>
        <div>Impact score: <b>{ripple.toFixed(2)}</b></div>
        <div className="guardian-rationale">
          <b>Why blocked:</b>
          <ul>
            {rationale.map((r, i) => (
              <li key={i}>
                {r.type === 'pro' ? '🟢' : '🔴'} <b>{r.keyword}</b> ({r.weight > 0 ? '+' : ''}{r.weight.toFixed(1)})
              </li>
            ))}
          </ul>
        </div>
        <button className="guardian-btn" onClick={onCancel}>Cancel</button>
        <button className="guardian-btn" style={{marginLeft:'1em',background:'#388e3c'}} onClick={onProceed}>Proceed Anyway</button>
      </div>
    </div>
  );
}

// Legacy: keep maybeBlock for imperative use
export function maybeBlock(suggestion) {
  if (suggestion.socialImpact !== 'anti') return false;
  const ripple = estimateRipple(suggestion);
  if (ripple < 0) {
    let rationaleText = '';
    if (suggestion.socialImpactRationale) {
      rationaleText = '\n\nWhy blocked:' + suggestion.socialImpactRationale.map(r => `\n${r.type === 'pro' ? '🟢' : '🔴'} ${r.keyword} (${r.weight > 0 ? '+' : ''}${r.weight})`).join('');
    }
    const ok = confirm(
      `⚠️  This change may introduce antisocial behaviour.\n\n` +
      `Impact score: ${ripple.toFixed(2)}${rationaleText}\n\nProceed anyway?`
    );
    return !ok;
  }
  return false;
}

