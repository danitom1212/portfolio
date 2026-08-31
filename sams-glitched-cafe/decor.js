// Scene decoration layer — small illustrated/animated touches (rain, neon
// sign, string lights, drifting static) layered over the flat background
// gradients so each location reads as a place, not just a color.

function rain(count, klass = '') {
  let out = '';
  for (let i = 0; i < count; i++) {
    const left = ((i * 137.5) % 100).toFixed(1); // golden-angle spread, deterministic
    const delay = (i * 0.37 % 2.2).toFixed(2);
    const dur = (1.1 + (i % 5) * 0.15).toFixed(2);
    out += `<div class="rain-drop ${klass}" style="left:${left}%;animation-delay:-${delay}s;animation-duration:${dur}s"></div>`;
  }
  return out;
}

function staticSpecks(count) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const left = ((i * 97.3) % 100).toFixed(1);
    const top = ((i * 53.7) % 100).toFixed(1);
    const delay = (i * 0.29 % 3).toFixed(2);
    out += `<div class="static-speck" style="left:${left}%;top:${top}%;animation-delay:-${delay}s"></div>`;
  }
  return out;
}

function neonSign() {
  return `
    <svg class="neon-sign" viewBox="0 0 200 60">
      <text x="100" y="34" text-anchor="middle" class="neon-text">קפה גליץ'</text>
    </svg>`;
}

function stringLights(count = 9) {
  let bulbs = '';
  for (let i = 0; i < count; i++) {
    const left = (6 + (i * (88 / (count - 1)))).toFixed(1);
    const delay = (i * 0.22).toFixed(2);
    bulbs += `<span class="bulb" style="left:${left}%;animation-delay:-${delay}s"></span>`;
  }
  return `<div class="light-string">${bulbs}</div>`;
}

const DECOR = {
  street: () => `${rain(16)}${neonSign()}<div class="puddle-glow"></div>`,
  cafe: () => `${stringLights(9)}${rain(6, 'rain-drop--faint')}`,
  cafe_dim: () => `${stringLights(9)}${rain(5, 'rain-drop--faint')}`,
  cafe_glitch: () => `${stringLights(9)}${staticSpecks(18)}`,
  void: () => `${staticSpecks(26)}`,
};

export function buildDecor(bgKey) {
  const build = DECOR[bgKey];
  return build ? build() : '';
}
