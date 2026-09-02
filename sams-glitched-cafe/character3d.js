// Minimal VRM character renderer: loads VRoid-style VRM/glTF humanoids,
// positions them left/center/right on one shared stage, and drives their
// facial blend shapes + a small idle animation from the same emotion/focus
// data the 2D sprite system already uses. No animation clips are needed —
// VRM ships blend shapes (for expressions) and a standard humanoid
// skeleton (for the arms-down pose + breathing), so everything here is
// procedural.

const POS_X = { left: -0.62, center: 0, right: 0.62 };

const EMOTION_BLEND = {
  neutral: null,
  smile: 'Joy',
  sad: 'Sorrow',
  angry: 'Angry',
  shock: 'Surprised',
  glitch: 'Surprised',
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
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene.add(new THREE.HemisphereLight(0xfff4e6, 0x33241f, 1.15));
    const dir = new THREE.DirectionalLight(0xfff0e0, 1.1);
    dir.position.set(1, 2.2, 2.4);
    this.scene.add(dir);

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
  // loaded THREE.Object3D via the parser's node cache.
  async _resolveHumanoidBones(gltf) {
    const bones = {};
    const vrm = gltf.parser.json.extensions && gltf.parser.json.extensions.VRM;
    const humanBones = vrm && vrm.humanoid && vrm.humanoid.humanBones;
    if (!humanBones) return bones;
    for (const role of POSED_BONES) {
      const entry = humanBones.find((b) => b.bone === role);
      if (!entry) continue;
      try {
        bones[role] = await gltf.parser.getDependency('node', entry.node);
      } catch {
        // role not present on this rig — skip it, poses degrade gracefully.
      }
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

    const bones = await this._resolveHumanoidBones(gltf);
    const blendMeshes = [];
    root.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary) blendMeshes.push(child);
      if (child.isMesh) child.material.side = THREE.DoubleSide;
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
    });
    this._layout();
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

  _layout() {
    const list = [...this.chars.values()];
    if (list.length === 0) return;
    for (const c of list) {
      c.root.position.x = POS_X[c.pos] ?? 0;
    }
    const maxHeight = Math.max(...list.map((c) => c.height));
    const spread = list.length >= 3 ? 1.5 : list.length === 2 ? 1.05 : 0.55;
    const fitDist = (maxHeight / 2) / Math.tan((this.camera.fov * Math.PI / 180) / 2) * (1.15 + spread * 0.55);
    this.camera.position.set(0, maxHeight * 0.55, fitDist);
    this.camera.lookAt(0, maxHeight * 0.52, 0);
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

  _applyFocusTint(c) {
    const scale = c.focus === 'listening' ? 0.62 : c.focus === 'speaking' ? 1.05 : 0.85;
    for (const mesh of c.blendMeshes.length ? c.root.children : []) { /* no-op placeholder */ }
    c.root.traverse((child) => {
      if (child.isMesh && child.material && child.material.color) {
        if (child.__baseColor === undefined) child.__baseColor = child.material.color.clone();
        child.material.color.copy(child.__baseColor).multiplyScalar(scale);
      }
    });
  }

  _tick() {
    this._raf = requestAnimationFrame(() => this._tick());
    const dt = this.clock.getDelta();
    const t = this.clock.elapsedTime;
    for (const c of this.chars.values()) {
      this._applyFocusTint(c);
      // Idle breathing sway.
      if (c.bones.chest) c.bones.chest.rotation.x = Math.sin(t * 1.1 + c.seed) * 0.02;
      if (c.bones.head) c.bones.head.rotation.y = Math.sin(t * 0.6 + c.seed) * 0.05;
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
    }
    this.renderer.render(this.scene, this.camera);
  }
}
