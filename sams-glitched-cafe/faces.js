// Abstract SVG portrait for the antagonist entity — deliberately not
// human, so it stays a vector silhouette rather than illustrated art.
// Every expression is a group toggled by the sprite's emo-* class, so
// swapping emotion is just a CSS opacity crossfade.
function staticFace() {
  return `
  <svg viewBox="0 0 100 100" class="face">
    <!-- hooded silhouette -->
    <path d="M50,4 C74,4 88,26 86,54 C85,72 78,86 66,96 L34,96 C22,86 15,72 14,54 C12,26 26,4 50,4 Z" fill="#08140f"/>
    <path d="M50,4 C74,4 88,26 86,54 C85,66 81,77 74,86 C78,66 74,40 50,34 C26,40 22,66 26,86 C19,77 15,66 14,54 C12,26 26,4 50,4 Z" fill="#0f2a1e"/>

    <g class="face-group face-neutral">
      <rect x="34" y="48" width="10" height="6" rx="1" fill="#39ff88"/>
      <rect x="56" y="48" width="10" height="6" rx="1" fill="#39ff88"/>
      <rect x="40" y="68" width="20" height="3" fill="#39ff88" opacity=".8"/>
    </g>
    <g class="face-group face-smile">
      <rect x="34" y="48" width="10" height="6" rx="1" fill="#39ff88"/>
      <rect x="56" y="48" width="10" height="6" rx="1" fill="#39ff88"/>
      <path d="M38,68 Q50,76 62,68" fill="none" stroke="#39ff88" stroke-width="3" stroke-linecap="round"/>
    </g>
    <g class="face-group face-sad">
      <rect x="34" y="50" width="10" height="4" rx="1" fill="#39ff88" opacity=".7"/>
      <rect x="56" y="50" width="10" height="4" rx="1" fill="#39ff88" opacity=".7"/>
      <path d="M38,72 Q50,66 62,72" fill="none" stroke="#39ff88" stroke-width="2.6" stroke-linecap="round"/>
    </g>
    <g class="face-group face-angry">
      <path d="M33,47 L45,52" stroke="#ff2b2b" stroke-width="4" stroke-linecap="round"/>
      <path d="M67,47 L55,52" stroke="#ff2b2b" stroke-width="4" stroke-linecap="round"/>
      <path d="M38,70 L62,70" stroke="#ff2b2b" stroke-width="3.4" stroke-linecap="round"/>
    </g>
    <g class="face-group face-shock">
      <circle cx="39" cy="51" r="6" fill="#39ff88"/>
      <circle cx="61" cy="51" r="6" fill="#39ff88"/>
      <ellipse cx="50" cy="72" rx="6" ry="7" fill="#08140f" stroke="#39ff88" stroke-width="2"/>
    </g>
    <g class="face-group face-glitch">
      <rect x="32" y="46" width="12" height="7" fill="#39ff88"/>
      <rect x="58" y="50" width="12" height="4" fill="#ff3fb0"/>
      <rect x="36" y="66" width="10" height="3" fill="#ff3fb0"/>
      <rect x="52" y="70" width="14" height="3" fill="#39ff88"/>
      <path d="M20,60 L80,58" stroke="#39ff88" stroke-width="1" opacity=".5"/>
      <path d="M18,64 L82,63" stroke="#ff3fb0" stroke-width="1" opacity=".4"/>
    </g>
  </svg>`;
}

export function buildFace() {
  return staticFace();
}
