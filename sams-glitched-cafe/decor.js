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

// A silent customer, frozen in the same loop every night: one slow bite,
// forever. Present in every café scene as a background detail the player
// can notice on their own, before the story ever explains why.
function frozenDiner() {
  return `
    <div class="npc-diner">
      <svg viewBox="0 0 60 90">
        <ellipse class="npc-shadow" cx="30" cy="86" rx="20" ry="4"/>
        <path class="npc-body" d="M14,88 L14,58 Q14,34 30,34 Q46,34 46,58 L46,88 Z"/>
        <circle class="npc-head" cx="30" cy="22" r="12"/>
        <g class="npc-arm">
          <path class="npc-body" d="M38,44 Q50,46 50,34 Q50,26 44,24 Q40,23 38,28 Q36,36 38,44 Z"/>
        </g>
      </svg>
    </div>`;
}

const DECOR = {
  street: () => `${rain(16)}${neonSign()}<div class="puddle-glow"></div>`,
  cafe: () => `${stringLights(9)}${rain(6, 'rain-drop--faint')}${frozenDiner()}`,
  cafe_dim: () => `${stringLights(9)}${rain(5, 'rain-drop--faint')}${frozenDiner()}`,
  cafe_glitch: () => `${stringLights(9)}${staticSpecks(18)}${frozenDiner()}`,
  cafe_cracked: () => `${stringLights(9)}${staticSpecks(8)}`,
  void: () => `${staticSpecks(26)}`,
};

export function buildDecor(bgKey) {
  const build = DECOR[bgKey];
  return build ? build() : '';
}
