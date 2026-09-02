// Minimal VRM character renderer: loads VRoid-style VRM/glTF humanoids,
// positions them left/center/right on one shared stage, and drives their
// facial blend shapes + a small idle animation from the same emotion/focus
// data the 2D sprite system already uses. No animation clips are needed —
// VRM ships blend shapes (for expressions) and a standard humanoid
// skeleton (for the arms-down pose + breathing), so everything here is
// procedural.

const POS_X = { left: -0.46, center: 0, right: 0.46 };

const EMOTION_BLEND = {
  neutral: null,
  smile: 'Joy',
  sad: 'Sorrow',
  angry: 'Angry',
  shock: 'Surprised',
  glitch: 'Surprised',
};

const MOUTH_SHAPES = ['A', 'I', 'U', 'E', 'O'];
const BLUSH_COLOR = new (typeof THREE !== 'undefined' ? THREE.Color : Object)(0xff90a8);

// Named poses layered on top of the idle stance for a fixed duration, then
// released back to the relaxed rest pose. `env` below is a 0->1->0 envelope
// (eased in/out over the gesture's lifetime); gestures use it plus elapsed
// time `t` for anything that should oscillate (a wave, a sway).
const GESTURES = {
  wave: (b, env, t) => {
    if (b.rightUpperArm) b.rightUpperArm.rotation.z = -1.3 + env * 1.65;
    if (b.rightLowerArm) b.rightLowerArm.rotation.z = env * (0.6 + Math.sin(t * 14) * 0.35);
  },
  lean: (b, env) => {
    if (b.chest) b.chest.rotation.x -= env * 0.16;
    if (b.head) b.head.rotation.x -= env * 0.08;
  },
  shrug: (b, env) => {
    if (b.leftUpperArm) b.leftUpperArm.rotation.z = 1.3 - env * 0.35;
    if (b.rightUpperArm) b.rightUpperArm.rotation.z = -1.3 + env * 0.35;
    if (b.head) b.head.rotation.z = env * 0.06;
  },
  point: (b, env) => {
    if (b.rightUpperArm) { b.rightUpperArm.rotation.z = -1.3 + env * 1.1; b.rightUpperArm.rotation.x = -env * 0.5; }
  },
  dance: (b, env, t) => {
    if (b.leftUpperArm) b.leftUpperArm.rotation.z = 1.3 - env * 1.7;
    if (b.rightUpperArm) b.rightUpperArm.rotation.z = -1.3 + env * 1.7;
    if (b.spine) b.spine.rotation.z = Math.sin(t * 6) * 0.12 * env;
    if (b.chest) b.chest.rotation.z = Math.sin(t * 6 + 0.3) * 0.1 * env;
    if (b.head) b.head.rotation.z = Math.sin(t * 6) * 0.08 * env;
  },
};

// The humanoid bone roles this module poses/animates. VRM artists name
// their actual bone nodes however they like (VRoid ships "J_Bip_L_UpperArm"
// etc, not "leftUpperArm") — the VRM spec's humanoid.humanBones list is
// the only reliable way to resolve a role to a real node, so we read that
// instead of guessing from names.
const POSED_BONES = ['leftUpperArm', 'rightUpperArm', 'leftLowerArm', 'rightLowerArm', 'spine', 'chest', 'neck', 'head'];

export class VrmStage {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
    // powerPreference 'default' (not 'high-performance'): on some mobile
    // GPUs forcing the discrete/high-power path is what triggers a context
    // creation failure in the first place. failIfMajorPerformanceCaveat is
    // explicitly left false so we still get *a* context (even a software
    // one) rather than throwing on lower-end hardware.
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true, powerPreference: 'default', failIfMajorPerformanceCaveat: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    // No scene lights: every material in this file (characters and room
    // alike) is MeshBasicMaterial, which ignores lighting entirely. One
    // less shader path — and one less thing a flaky mobile GPU driver can
    // get wrong — for a game that can't be debugged on the device it
    // fails on. Depth reads instead from baked-in per-surface color
    // choices (see setRoom), the same trick flat-shaded low-poly games
    // have always used.
    this.room = null;
    this.roomKey = null;

    // Visible-to-the-player diagnostics: game.js reads this to show a
    // small on-screen notice instead of silently doing nothing when 3D
    // fails on a device we have no way to test against directly.
    this.status = { loadErrors: {} };

    // A lost WebGL context (common on memory-pressured mobile browsers)
    // would otherwise leave the canvas permanently black with the render
    // loop silently doing nothing forever. Recovering isn't worth the
    // complexity here, but we must stop fighting the browser and must
    // never let it cascade into an uncaught exception that kills the
    // whole game's event listeners.
    this.contextLost = false;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.contextLost = true; });
    canvas.addEventListener('webglcontextrestored', () => { this.contextLost = false; });

    this.chars = new Map(); // id -> { root, bones, blendMeshes, focus }
    this.clock = new THREE.Clock();
    this._loader = new THREE.GLTFLoader();
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._raf = requestAnimationFrame(() => this._tick());
  }

  _resize() {
    const r = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = r.width * (window.devicePixelRatio || 1);
    this.canvas.height = r.height * (window.devicePixelRatio || 1);
    this.renderer.setSize(r.width, r.height, false);
    this.camera.aspect = r.width / r.height;
    this.camera.updateProjectionMatrix();
  }

  // Reads extensions.VRM.humanoid.humanBones (role name -> node index) from
  // the raw glTF JSON and resolves each role we care about to its actual
  // loaded THREE.Object3D via the parser's node cache. Falls back to
  // matching VRoid's real bone names directly (e.g. "J_Bip_L_UpperArm")
  // if the VRM extension lookup comes back empty for a role, so a pose
  // still applies even if the primary path fails for some reason.
  async _resolveHumanoidBones(gltf, root) {
    const bones = {};
    try {
      const vrm = gltf.parser.json.extensions && gltf.parser.json.extensions.VRM;
      const humanBones = vrm && vrm.humanoid && vrm.humanoid.humanBones;
      if (humanBones) {
        for (const role of POSED_BONES) {
          const entry = humanBones.find((b) => b.bone === role);
          if (!entry) continue;
          try {
            bones[role] = await gltf.parser.getDependency('node', entry.node);
          } catch { /* falls through to name matching below */ }
        }
      }
    } catch { /* no VRM extension at all — name matching below covers it */ }

    const NAME_PATTERNS = {
      leftUpperArm: /(^|_)l(eft)?_?upperarm/i, rightUpperArm: /(^|_)r(ight)?_?upperarm/i,
      leftLowerArm: /(^|_)l(eft)?_?(lowerarm|forearm)/i, rightLowerArm: /(^|_)r(ight)?_?(lowerarm|forearm)/i,
      spine: /(^|_)spine$/i, chest: /(^|_)chest$/i, neck: /(^|_)neck$/i, head: /(^|_)head$/i,
    };
    const missing = POSED_BONES.filter((role) => !bones[role]);
    if (missing.length) {
      root.traverse((child) => {
        for (const role of missing) {
          if (!bones[role] && NAME_PATTERNS[role] && NAME_PATTERNS[role].test(child.name)) {
            bones[role] = child;
          }
        }
      });
    }
    return bones;
  }

  async load(id, url, pos) {
    if (this.chars.has(id)) return;
    const gltf = await new Promise((resolve, reject) => this._loader.load(url, resolve, undefined, reject));
    const root = gltf.scene;

    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    root.position.x -= center.x;
    root.position.z -= center.z;
    root.position.y -= box.min.y;
    root.rotation.y = Math.PI; // VRM convention: model faces -Z

    const bones = await this._resolveHumanoidBones(gltf, root);
    window.__vrmDebug = window.__vrmDebug || {};
    window.__vrmDebug[id] = POSED_BONES.filter((r) => !bones[r]);
    const blendMeshes = [];
    root.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary) {
        blendMeshes.push(child);
        child.__isFace = true; // only the face mesh carries expression blend shapes
      }
      if (child.isMesh) this._fixMaterial(child);
    });

    // Relaxed standing pose instead of the raw T-pose bind (arms out).
    if (bones.leftUpperArm) bones.leftUpperArm.rotation.z = 1.3;
    if (bones.rightUpperArm) bones.rightUpperArm.rotation.z = -1.3;
    if (bones.leftLowerArm) bones.leftLowerArm.rotation.y = -0.1;
    if (bones.rightLowerArm) bones.rightLowerArm.rotation.y = 0.1;

    this.scene.add(root);
    this.chars.set(id, {
      root, bones, blendMeshes, size, height: size.y, pos,
      focus: 'none', blinkT: Math.random() * 3, seed: Math.random() * 10,
      talking: false, mouthT: 0, mouthShape: 'A',
      blush: 0, blushTarget: 0,
      gesture: null, gestureT: 0, gestureDur: 1.6,
    });
    this._layout();
  }

  // VRM/MToon materials export as plain glTF PBR materials that are easy
  // to render wrong on a device we can't test on directly: a fully
  // metallic (metalness=1) material with no environment map reflects
  // nothing but black, and PBR's lighting math runs a heavier shader that
  // some mobile GPU drivers handle inconsistently. Rather than keep
  // tuning a physically-based material's knobs against a bug we can only
  // reproduce by guessing, every mesh's material is replaced outright
  // with THREE.MeshBasicMaterial: it has no lighting term at all — no
  // metalness, no roughness, no normals, nothing for a flaky driver to
  // get wrong — just the diffuse texture drawn as-is. Flatter than real
  // shading, but it can never render as an unlit black mirror. Safe
  // (non-mipmapped, clamped) texture filtering also rules out the classic
  // non-power-of-two texture failure some mobile WebGL drivers hit.
  _fixMaterial(mesh) {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const fixed = mats.map((mat) => {
      if (!mat) return mat;
      const map = mat.map || null;
      if (map) {
        map.generateMipmaps = false;
        map.minFilter = THREE.LinearFilter;
        map.magFilter = THREE.LinearFilter;
        map.wrapS = THREE.ClampToEdgeWrapping;
        map.wrapT = THREE.ClampToEdgeWrapping;
        map.encoding = THREE.sRGBEncoding;
        map.needsUpdate = true;
      }
      // Basic materials can't drive morph-target-influenced vertex colors
      // the same way, but skinning/morphing themselves are geometry-level
      // and unaffected — only the shading model changes.
      const basic = new THREE.MeshBasicMaterial({ map, color: 0xffffff, side: THREE.DoubleSide, transparent: mat.transparent, alphaTest: mat.alphaTest || 0 });
      basic.skinning = !!mesh.isSkinnedMesh;
      basic.morphTargets = !!mesh.morphTargetDictionary;
      basic.morphNormals = false;
      return basic;
    });
    mesh.material = Array.isArray(mesh.material) ? fixed : fixed[0];
  }

  // Flat-shaded per-scene room: three walls, a floor, a window, and a
  // couple of furniture blocks (café) or a night street with building
  // silhouettes and a lamp. Every surface is a plain color — no textures,
  // no lights, nothing that depends on a shader working right on hardware
  // this can't be tested against — so depth reads purely from picking a
  // slightly different flat tone per surface, the same "baked shading"
  // trick flat/low-poly 3D games use. This is the actual world behind the
  // characters, replacing the flat 2D photo backdrop whenever 3D is
  // available; the photo stays as the layer underneath for when it isn't.
  // Colors are chosen to look clearly like a rendered space rather than
  // matching the old photo backdrop's tones — the point is for it to be
  // obvious the 3D layer is the thing on screen now, not for it to blend
  // in and go unnoticed.
  static ROOM_PALETTES = {
    cafe: { wall: 0xe8b98a, wallSide: 0xd39f68, floor: 0x5a3320, accent: 0xc65a3a, window: 0xffe9a8 },
    cafe_dim: { wall: 0x8a5a42, wallSide: 0x704632, floor: 0x2a1810, accent: 0xb0492e, window: 0xffb45c },
    cafe_cracked: { wall: 0x3a1420, wallSide: 0x2a0e18, floor: 0x140a0e, accent: 0x8a2438, window: 0xff5060 },
    street: { ground: 0x201c2c, wall: 0x161426, wallSide: 0x0f0e1c, buildingLit: 0xffcf7a, lamp: 0xffdf9e },
  };

  setRoom(bgKey) {
    if (this.roomKey === bgKey) return;
    this.roomKey = bgKey;
    if (this.room) {
      this.scene.remove(this.room);
      this.room.traverse((c) => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
      this.room = null;
    }
    const pal = VrmStage.ROOM_PALETTES[bgKey];
    if (!pal) return; // unknown key: no room, 2D photo backdrop still shows through
    const group = new THREE.Group();
    const box = (w, h, d, color, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color }));
      m.position.set(x, y, z);
      group.add(m);
      return m;
    };

    // Both room shapes share the same envelope (a wallZ..wallZ+depth box
    // with tall walls) so a two-character wide shot never sees past the
    // edges regardless of which scene it is — a rainy alley reads the
    // same as an indoor room, just re-colored and re-dressed.
    const wallZ = -2.2, halfW = 3.8, height = 4.8, depth = 4.6;
    box(halfW * 2, height, 0.15, pal.wall, 0, height / 2, wallZ); // back wall
    box(0.15, height, depth, pal.wallSide, -halfW, height / 2, wallZ + depth / 2); // left wall
    box(0.15, height, depth, pal.wallSide, halfW, height / 2, wallZ + depth / 2); // right wall
    box(halfW * 2, depth, 0.1, pal.floor || pal.ground, 0, -0.05, wallZ + depth / 2).rotation.x = -Math.PI / 2; // floor

    if (bgKey === 'street') {
      const lit = [-2.6, -1.1, 1.3, 2.6];
      lit.forEach((x, i) => box(0.5, 0.7, 0.05, pal.buildingLit, x, 1.8 + (i % 2) * 1.1, wallZ + 0.1));
      box(0.08, 2.4, 0.08, 0x0a0a12, -1.8, 1.2, wallZ + 1.4); // lamp post
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshBasicMaterial({ color: pal.lamp }));
      bulb.position.set(-1.8, 2.45, wallZ + 1.4);
      group.add(bulb);
    } else {
      box(1.5, 1.0, 0.08, pal.window, 1.7, height * 0.5, wallZ + 0.09); // window
      box(1.0, 0.06, 1.0, pal.accent, 1.7, height * 0.5 - 0.55, wallZ + 0.55); // window sill / counter hint
      box(1.6, 0.75, 0.6, pal.accent, -1.6, 0.375, wallZ + 1.1); // counter
    }
    this.scene.add(group);
    this.room = group;
  }

  remove(id) {
    const c = this.chars.get(id);
    if (!c) return;
    this.scene.remove(c.root);
    this.chars.delete(id);
    this._layout();
  }

  setPosition(id, pos) {
    const c = this.chars.get(id);
    if (c) c.pos = pos;
    this._layout();
  }

  // A character stepping off-stage mid-story is common (Noa's scenes,
  // characters entering/leaving) — reloading a ~4MB model every time they
  // come back would be wasteful, so "not on stage" just hides the root
  // and excludes it from camera framing rather than disposing anything.
  setVisible(id, visible) {
    const c = this.chars.get(id);
    if (!c) return;
    c.root.visible = visible;
    c.hidden = !visible;
    this._layout();
  }

  // Frames a waist-up "medium shot" rather than the full standing figure:
  // on a phone-width canvas a full body reduces the face — the one part
  // carrying all the emotion blend shapes — to a few dozen pixels. Only
  // the top ~58% of the character's height (waist and up) is used to fit
  // the vertical camera distance, and the look-at target sits near the
  // chin so the head fills the upper part of the frame instead of the
  // middle.
  //
  // A phone screen is portrait, so the *horizontal* field of view at any
  // given distance is much narrower than the vertical one (horizontal
  // FOV shrinks with the aspect ratio). Getting close enough for a good
  // head shot with one character can put a two- or three-shot's side
  // characters outside that narrow horizontal cone entirely. So we solve
  // for the distance required in each dimension and use whichever is
  // larger — nobody gets cropped, and it only pulls back as far as it
  // has to.
  _layout() {
    const list = [...this.chars.values()].filter((c) => !c.hidden);
    if (list.length === 0) return;
    for (const c of list) {
      c.root.position.x = POS_X[c.pos] ?? 0;
    }
    const maxHeight = Math.max(...list.map((c) => c.height));
    const framedHeight = maxHeight * 0.58;
    const vFovHalf = (this.camera.fov * Math.PI / 180) / 2;
    const distForHeight = (framedHeight / 2) / Math.tan(vFovHalf) * 1.15;

    const maxAbsX = Math.max(0, ...list.map((c) => Math.abs(POS_X[c.pos] ?? 0)));
    const shoulderMargin = 0.42; // half a character's own width, so nobody's shoulder touches the edge
    const aspect = this.camera.aspect || (this.canvas.width / this.canvas.height) || 1;
    const distForWidth = maxAbsX > 0 ? (maxAbsX + shoulderMargin) / (Math.tan(vFovHalf) * aspect) : 0;

    const fitDist = Math.max(distForHeight, distForWidth);
    const targetY = maxHeight * 0.8;
    this.camera.position.set(0, targetY, fitDist);
    this.camera.lookAt(0, targetY, 0);
  }

  setEmotion(id, emotion) {
    const c = this.chars.get(id);
    if (!c) return;
    c.emotion = emotion;
    const target = EMOTION_BLEND[emotion] || null;
    for (const mesh of c.blendMeshes) {
      for (const name of Object.keys(mesh.morphTargetDictionary)) {
        if (name === 'Blink') continue; // owned by the idle-blink loop
        const idx = mesh.morphTargetDictionary[name];
        mesh.morphTargetInfluences[idx] = name === target ? 1 : 0;
      }
    }
  }

  setFocus(id, focus) {
    const c = this.chars.get(id);
    if (c) c.focus = focus; // 'speaking' | 'listening' | 'none'
  }

  // Plays a named pose from GESTURES for `duration` ms, eased in and back
  // out to the idle rest pose. Silently ignored for an unknown name or a
  // character not yet on stage, so story data can call this speculatively.
  setGesture(id, name, duration = 1600) {
    const c = this.chars.get(id);
    if (!c || !GESTURES[name]) return;
    c.gesture = name;
    c.gestureT = 0;
    c.gestureDur = duration / 1000;
  }

  // Cycles the mouth blend shapes while `on` is true, driving lip-sync off
  // the typewriter's own on/off state rather than real audio analysis —
  // there's no voice track, so this is a readable approximation.
  setTalking(id, on) {
    const c = this.chars.get(id);
    if (!c) return;
    c.talking = on;
    if (!on) this._setMouth(c, null);
  }

  setBlush(id, on) {
    const c = this.chars.get(id);
    if (c) c.blushTarget = on ? 1 : 0;
  }

  _setMouth(c, shape) {
    for (const mesh of c.blendMeshes) {
      for (const name of MOUTH_SHAPES) {
        const idx = mesh.morphTargetDictionary[name];
        if (idx !== undefined) mesh.morphTargetInfluences[idx] = name === shape ? 1 : 0;
      }
    }
  }

  _applyFocusTint(c) {
    const scale = c.focus === 'listening' ? 0.62 : c.focus === 'speaking' ? 1.05 : 0.85;
    c.root.traverse((child) => {
      if (child.isMesh && child.material && child.material.color) {
        if (child.__baseColor === undefined) child.__baseColor = child.material.color.clone();
        child.material.color.copy(child.__baseColor).multiplyScalar(scale);
        if (child.__isFace && c.blush > 0.01) {
          child.material.color.lerp(BLUSH_COLOR, c.blush * 0.35);
        }
      }
    });
  }

  _tick() {
    this._raf = requestAnimationFrame(() => this._tick());
    if (this.contextLost) return;
    const dt = this.clock.getDelta();
    const t = this.clock.elapsedTime;
    for (const c of this.chars.values()) {
      if (c.hidden) continue;
      // One character's bad state (a missing bone, an odd morph target)
      // must never take down the shared render loop for everyone else on
      // stage, so each character's per-frame update is isolated.
      try {
        this._applyFocusTint(c);
        // Idle breathing sway.
        if (c.bones.chest) c.bones.chest.rotation.x = Math.sin(t * 1.1 + c.seed) * 0.02;
        if (c.bones.head) c.bones.head.rotation.y = Math.sin(t * 0.6 + c.seed) * 0.05;

        // Gesture envelope: 0 -> 1 -> 0 hump over gestureDur seconds, then
        // clears so the idle pose above takes back over.
        if (c.gesture) {
          c.gestureT += dt;
          const progress = Math.min(1, c.gestureT / c.gestureDur);
          const env = Math.sin(progress * Math.PI);
          GESTURES[c.gesture](c.bones, env, t);
          if (progress >= 1) c.gesture = null;
        }

        // Talking mouth-flap: cycles through the vowel blend shapes on a
        // short timer for a readable (if approximate) lip-sync.
        if (c.talking) {
          c.mouthT -= dt;
          if (c.mouthT <= 0) {
            c.mouthT = 0.09 + Math.random() * 0.07;
            c.mouthShape = MOUTH_SHAPES[(Math.random() * MOUTH_SHAPES.length) | 0];
            this._setMouth(c, c.mouthShape);
          }
        }

        // Blush fades toward its target rather than snapping.
        c.blush += (c.blushTarget - c.blush) * Math.min(1, dt * 3);

        // Blink cycle.
        c.blinkT -= dt;
        if (c.blinkT <= 0) {
          c.blinkT = 2.6 + Math.random() * 2.4;
          c.blinkPhase = 0.12;
        }
        if (c.blinkPhase > 0) {
          c.blinkPhase -= dt;
          const v = Math.max(0, Math.sin((0.12 - c.blinkPhase) / 0.12 * Math.PI));
          for (const mesh of c.blendMeshes) {
            const idx = mesh.morphTargetDictionary['Blink'];
            if (idx !== undefined) mesh.morphTargetInfluences[idx] = v;
          }
        }
      } catch (err) {
        console.warn('VrmStage: per-character tick failed, continuing', err);
      }
    }
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (err) {
      console.warn('VrmStage: render failed', err);
    }
  }
}
