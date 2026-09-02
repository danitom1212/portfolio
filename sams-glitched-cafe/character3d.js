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
    this.scene.add(new THREE.HemisphereLight(0xfff4e6, 0x33241f, 1.15));
    const dir = new THREE.DirectionalLight(0xfff0e0, 1.1);
    dir.position.set(1, 2.2, 2.4);
    this.scene.add(dir);
    const fill = new THREE.DirectionalLight(0xffe6f0, 0.35);
    fill.position.set(-1.2, 1.4, 1.6);
    this.scene.add(fill);

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
  // to render wrong: a fully metallic (metalness=1) material with no
  // environment map reflects nothing but black, and a texture that fails
  // to decode (corrupt data, or a mobile GPU refusing an unusual size)
  // silently leaves geometry with no visible color at all. Anime/toon art
  // was never meant to be lit as shiny metal in the first place, so we
  // flatten every material to a plain matte diffuse surface: metalness=0
  // guarantees it can never render as an unlit black mirror, and forcing
  // safe (non-mipmapped, clamped) texture filtering rules out the classic
  // non-power-of-two texture failure some mobile WebGL drivers hit.
  _fixMaterial(mesh) {
    mesh.material.side = THREE.DoubleSide;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!mat) continue;
      mat.metalness = 0;
      mat.roughness = 1;
      if (mat.color) mat.color.set(0xffffff);
      if (mat.map) {
        mat.map.generateMipmaps = false;
        mat.map.minFilter = THREE.LinearFilter;
        mat.map.magFilter = THREE.LinearFilter;
        mat.map.wrapS = THREE.ClampToEdgeWrapping;
        mat.map.wrapT = THREE.ClampToEdgeWrapping;
        mat.map.encoding = THREE.sRGBEncoding;
        mat.map.needsUpdate = true;
      }
      mat.needsUpdate = true;
    }
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
    const list = [...this.chars.values()];
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
