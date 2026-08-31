// Hand-drawn vector portraits (inline SVG). No bitmap assets — every
// expression is a set of SVG groups toggled by the sprite's emo-* class,
// so swapping emotion is just a CSS opacity crossfade, no image loading.

function samFace() {
  return `
  <svg viewBox="0 0 100 100" class="face">
    <defs>
      <clipPath id="samHead"><ellipse cx="50" cy="56" rx="29" ry="31"/></clipPath>
    </defs>

    <!-- hair back -->
    <path d="M18,50 C16,20 34,6 50,6 C66,6 84,20 82,50 C82,34 70,24 50,24 C30,24 18,34 18,50 Z" fill="#c91c86"/>

    <!-- head -->
    <ellipse cx="50" cy="56" rx="29" ry="31" fill="#ffd9b3"/>

    <g clip-path="url(#samHead)">
      <!-- blush -->
      <ellipse cx="32" cy="63" rx="5" ry="3" fill="#ff9fc0" opacity=".55"/>
      <ellipse cx="68" cy="63" rx="5" ry="3" fill="#ff9fc0" opacity=".55"/>

      <!-- ===== emotion groups ===== -->
      <g class="face-group face-neutral">
        <path d="M27,42 Q33,38 40,41" fill="none" stroke="#7a0a4e" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M60,41 Q67,38 73,42" fill="none" stroke="#7a0a4e" stroke-width="2.6" stroke-linecap="round"/>
        <ellipse cx="37" cy="53" rx="3.6" ry="4.6" fill="#3a1224"/>
        <ellipse cx="63" cy="53" rx="3.6" ry="4.6" fill="#3a1224"/>
        <path d="M42,71 Q50,74 58,71" fill="none" stroke="#7a0a4e" stroke-width="2.6" stroke-linecap="round"/>
      </g>

      <g class="face-group face-smile">
        <path d="M27,41 Q33,36 40,40" fill="none" stroke="#7a0a4e" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M60,40 Q67,36 73,41" fill="none" stroke="#7a0a4e" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M32,54 Q37,48 42,54" fill="none" stroke="#3a1224" stroke-width="3" stroke-linecap="round"/>
        <path d="M58,54 Q63,48 68,54" fill="none" stroke="#3a1224" stroke-width="3" stroke-linecap="round"/>
        <path d="M39,68 Q50,80 61,68 Q50,76 39,68 Z" fill="#7a0a4e"/>
      </g>

      <g class="face-group face-sad">
        <path d="M27,44 Q33,48 41,46" fill="none" stroke="#7a0a4e" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M59,46 Q67,48 73,44" fill="none" stroke="#7a0a4e" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M33,55 Q37,58 42,55" fill="none" stroke="#3a1224" stroke-width="3" stroke-linecap="round"/>
        <path d="M58,55 Q63,58 67,55" fill="none" stroke="#3a1224" stroke-width="3" stroke-linecap="round"/>
        <path d="M42,74 Q50,68 58,74" fill="none" stroke="#7a0a4e" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M35,58 L33,66" stroke="#7ec8ff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
      </g>

      <g class="face-group face-angry">
        <path d="M28,40 L41,45" fill="none" stroke="#7a0a4e" stroke-width="3" stroke-linecap="round"/>
        <path d="M72,40 L59,45" fill="none" stroke="#7a0a4e" stroke-width="3" stroke-linecap="round"/>
        <path d="M32,53 L42,53" stroke="#3a1224" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M58,53 L68,53" stroke="#3a1224" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M41,72 L59,70 L41,68" fill="none" stroke="#7a0a4e" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      </g>

      <g class="face-group face-shock">
        <path d="M27,38 Q33,34 40,37" fill="none" stroke="#7a0a4e" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M60,37 Q67,34 73,38" fill="none" stroke="#7a0a4e" stroke-width="2.6" stroke-linecap="round"/>
        <circle cx="37" cy="54" r="5.4" fill="#3a1224"/>
        <circle cx="63" cy="54" r="5.4" fill="#3a1224"/>
        <circle cx="38.5" cy="52" r="1.4" fill="#fff"/>
        <circle cx="64.5" cy="52" r="1.4" fill="#fff"/>
        <ellipse cx="50" cy="72" rx="5" ry="6" fill="#7a0a4e"/>
      </g>

      <g class="face-group face-glitch">
        <path d="M27,42 Q33,38 40,41" fill="none" stroke="#39ff88" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M60,41 Q67,44 73,39" fill="none" stroke="#ff3fb0" stroke-width="2.6" stroke-linecap="round"/>
        <rect x="33" y="51" width="9" height="3.4" fill="#3a1224"/>
        <ellipse cx="63" cy="53" rx="3.6" ry="4.6" fill="#39ff88"/>
        <path d="M40,70 L46,66 L52,72 L58,67 L64,71" fill="none" stroke="#ff3fb0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>

    <!-- hair front bangs -->
    <path d="M16,48 C18,26 32,14 50,14 C68,14 82,26 84,48 C78,32 66,26 50,27 C34,26 22,32 16,48 Z" fill="#ff3fb0"/>
    <path d="M50,14 C54,20 54,28 50,33 C46,28 46,20 50,14 Z" fill="#ff3fb0"/>

    <!-- collar / apron hint -->
    <path d="M20,92 Q50,80 80,92 L80,100 L20,100 Z" fill="#2a1220"/>
    <path d="M40,86 Q50,92 60,86" fill="none" stroke="#ff3fb0" stroke-width="2.4" stroke-linecap="round"/>
  </svg>`;
}

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

const FACE_BUILDERS = { sam: samFace, static: staticFace };

export function buildFace(characterId) {
  const build = FACE_BUILDERS[characterId] || FACE_BUILDERS.sam;
  return build();
}
