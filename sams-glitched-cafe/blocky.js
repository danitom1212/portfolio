// A low-poly humanoid built entirely from CSS 3D boxes (no WebGL, no
// canvas) — the "GTA San Andreas" look the player asked for: blocky,
// simple, and running on the one 3D technology that has actually worked
// reliably on their device all session (the CSS #room3d). Each limb is a
// real nested transform-style:preserve-3d joint (shoulder/hip), so a
// walk cycle is genuine 3D rotation, not a sprite swap.
//
// Usage: const bc = createBlockyCharacter({ hair, skin, top, legs });
// bc.el is the DOM node to place inside a preserve-3d container (like
// #room3d). bc.walkTo(container, { fromX, toX, z, durationMs }) animates
// a walk cycle while translating across X, then resolves.

const FACE_SHADE = 'linear-gradient(135deg, rgba(255,255,255,.22), rgba(0,0,0,.28))';

function box(w, h, d, color, extraStyle = '') {
  // A single flat slab per part (not a full 6-face cube) — cheap, and a
  // subtle diagonal shade gradient reads as "beveled 3D block" without
  // needing real face geometry, which matters more here than geometric
  // purity: this has to render correctly on a device we cannot test on
  // directly, so fewer moving parts is safer than more realism.
  return `<div style="position:absolute;width:${w}px;height:${h}px;left:${-w / 2}px;
    background:${color};background-image:${FACE_SHADE};
    border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.25);
    ${extraStyle}"></div>`;
}

// Scaled ~2.6x from the first pass: at the original size (head+torso+legs
// ~114px tall) the figure measured out correctly but read as an unreadable
// speck against a 900px-tall phone screen — verified by measuring actual
// getBoundingClientRect() output, not just eyeballing a screenshot. This
// size (~300px tall) puts it in the same ballpark as the illustrated
// sprites so a "someone is walking into the room" beat is actually legible.
export function createBlockyCharacter({ hair = '#8a5a3a', skin = '#e8b98a', top = '#5a6a7a', legs = '#242430' } = {}) {
  const el = document.createElement('div');
  el.className = 'blocky';
  el.style.transformStyle = 'preserve-3d';
  el.innerHTML = `
    <div class="bk-torso" style="position:relative;transform-style:preserve-3d;">
      ${box(88, 120, 18, top, 'top:-120px;')}
      <div class="bk-head" style="position:absolute;top:-187px;left:0;transform-style:preserve-3d;">
        ${box(62, 62, 20, skin)}
        ${box(68, 26, 21, hair, 'top:-21px;')}
      </div>
      <div class="bk-arm-l" style="position:absolute;top:-114px;left:-44px;transform-style:preserve-3d;transform-origin:top center;">
        ${box(26, 99, 10, top, 'top:0;')}
      </div>
      <div class="bk-arm-r" style="position:absolute;top:-114px;left:44px;transform-style:preserve-3d;transform-origin:top center;">
        ${box(26, 99, 10, top, 'top:0;')}
      </div>
      <div class="bk-leg-l" style="position:absolute;top:0;left:-23px;transform-style:preserve-3d;transform-origin:top center;">
        ${box(34, 114, 13, legs, 'top:0;')}
      </div>
      <div class="bk-leg-r" style="position:absolute;top:0;left:23px;transform-style:preserve-3d;transform-origin:top center;">
        ${box(34, 114, 13, legs, 'top:0;')}
      </div>
    </div>
  `;

  const armL = el.querySelector('.bk-arm-l');
  const armR = el.querySelector('.bk-arm-r');
  const legL = el.querySelector('.bk-leg-l');
  const legR = el.querySelector('.bk-leg-r');
  const torso = el.querySelector('.bk-torso');

  let walkRaf = null;
  function stopWalkCycle() {
    if (walkRaf) cancelAnimationFrame(walkRaf);
    walkRaf = null;
    [armL, armR, legL, legR].forEach((n) => { n.style.transform = 'rotateX(0deg)'; });
    torso.style.transform = 'translateY(0)';
  }

  function walkTo(container, { fromX = -1.2, toX = 0, z = 0, durationMs = 2200 } = {}) {
    container.appendChild(el);
    el.style.position = 'absolute';
    el.style.left = '50%';
    // Feet planted above the dialogue box's footprint, not at the very
    // bottom of the stage — the walk-in beat plays before the dialogue box
    // is shown (see game.js), but this keeps the figure clear of it even
    // if that ever changes.
    el.style.bottom = '190px';
    return new Promise((resolve) => {
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / durationMs);
        const ease = t < 1 ? t : 1;
        const x = fromX + (toX - fromX) * ease;
        // Positions here are in the same "world unit -> px" scale as
        // #room3d's own layout: roughly 200px per unit reads well at the
        // stage's default perspective(900px).
        el.style.transform = `translate3d(${x * 200}px, 0, ${z}px)`;
        const phase = t * durationMs * 0.012;
        const swing = Math.sin(phase) * 28;
        armL.style.transform = `rotateX(${swing}deg)`;
        armR.style.transform = `rotateX(${-swing}deg)`;
        legL.style.transform = `rotateX(${-swing}deg)`;
        legR.style.transform = `rotateX(${swing}deg)`;
        torso.style.transform = `translateY(${Math.abs(Math.sin(phase)) * -3}px)`;
        if (t < 1) {
          walkRaf = requestAnimationFrame(step);
        } else {
          stopWalkCycle();
          resolve();
        }
      };
      walkRaf = requestAnimationFrame(step);
    });
  }

  function remove() {
    stopWalkCycle();
    el.remove();
  }

  return { el, walkTo, remove };
}
