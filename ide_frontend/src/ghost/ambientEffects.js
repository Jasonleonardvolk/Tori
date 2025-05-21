// ghost.ambientEffects.js
// Applies environmental, visual, and temporal effects for Ghost Mode

let activeEffects = [];

export function applyHueShift(target, amount = 0.05, duration = 5000) {
  if (!target) return;
  target.style.transition = `filter ${duration/1000}s linear`;
  target.style.filter = `hue-rotate(${amount*360}deg)`;
  setTimeout(() => {
    target.style.filter = '';
  }, duration);
  activeEffects.push({type: 'hueShift', target, end: Date.now()+duration});
}

export function applyRipple(target, duration = 1500) {
  if (!target) return;
  target.classList.add('ghost-ripple');
  setTimeout(() => {
    target.classList.remove('ghost-ripple');
  }, duration);
  activeEffects.push({type: 'ripple', target, end: Date.now()+duration});
}

export function applyShimmer(target, duration = 2000) {
  if (!target) return;
  target.classList.add('ghost-shimmer');
  setTimeout(() => {
    target.classList.remove('ghost-shimmer');
  }, duration);
  activeEffects.push({type: 'shimmer', target, end: Date.now()+duration});
}

export function applyGravityBlur(target, intensity = 2, duration = 3000) {
  if (!target) return;
  target.style.transition = `filter ${duration/1000}s linear`;
  target.style.filter = `blur(${intensity}px)`;
  setTimeout(() => {
    target.style.filter = '';
  }, duration);
  activeEffects.push({type: 'gravityBlur', target, end: Date.now()+duration});
}

export function clearExpiredEffects() {
  const now = Date.now();
  activeEffects = activeEffects.filter(e => e.end > now);
}

export default {
  applyHueShift,
  applyRipple,
  applyShimmer,
  applyGravityBlur,
  clearExpiredEffects
};
