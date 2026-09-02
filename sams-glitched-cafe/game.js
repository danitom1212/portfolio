import { STORY, CHARACTERS } from './story.js';
import { buildFace } from './faces.js';
import { buildDecor } from './decor.js';
import { AudioManager } from './audio.js';
import { VrmStage } from './character3d.js';

const TYPE_SPEED_MS = 26;

const MUSIC_MOOD_BY_BG = {
  street: 'warm',
  cafe: 'warm',
  cafe_dim: 'tense',
};

const VECTOR_PORTRAIT_COLORS = { light: '#173324', dark: '#020604', glow: 'rgba(57,255,136,.5)' };
const SAVE_KEY = 'sgc-save-v1';

// Yasmin, Sam and Noa all use real illustrated sprite art (assets/sprites/).
const SPRITE_KIND = { yasmin: 'photo', sam: 'photo', noa: 'photo' };
const PHOTO_EMOTIONS = ['neutral', 'smile', 'sad', 'angry', 'shock', 'glitch'];
// Each illustrated sprite keeps its source art's own proportions.
const SPRITE_ASPECT = { yasmin: '480 / 1504', sam: '480 / 1190', noa: '420 / 1345' };
// No background-scale minor characters in this cut of the story.
const MINOR_CHARACTERS = new Set();

// Yasmin and Sam render as real 3D characters (VRM humanoids); Noa stays
// on the illustrated 2D sprite path for now.
const VRM_CHARACTERS = new Set(['yasmin', 'sam']);
const VRM_MODEL_URL = { yasmin: 'assets/models/yasmin.vrm', sam: 'assets/models/sam.vrm' };

class Game {
  constructor() {
    this.stats = { affection: 0, rage: 0, doubt: 0 };
    this.sceneId = STORY.start;
    this.lineIndex = 0;
    this.onstage = new Map(); // characterId -> sprite element (2D only)
    this.onstageVrm = new Set(); // characterId set for 3D characters
    this.typeTimer = null;
    this.isTyping = false;
    this.bgToggle = false;

    this.$stage = document.getElementById('stage');
    this.$bgA = document.getElementById('bg-a');
    this.$bgB = document.getElementById('bg-b');
    this.$decor = document.getElementById('bg-decor');
    this.$vfx = document.getElementById('vfx-overlay');
    this.$sprites = document.getElementById('sprite-layer');
    this.$box = document.getElementById('dialogue-box');
    this.$name = document.getElementById('name-tag');
    this.$text = document.getElementById('dialogue-text');
    this.$arrow = document.getElementById('continue-arrow');
    this.$choices = document.getElementById('choice-panel');
    this.$start = document.getElementById('start-screen');
    this.$end = document.getElementById('end-screen');
    this.$endTitle = document.getElementById('end-title');
    this.$debugBtn = document.getElementById('debug-toggle');
    this.$debugPanel = document.getElementById('debug-panel');
    this.$muteBtn = document.getElementById('mute-toggle');
    this.$continueBtn = document.getElementById('continue-btn');

    // 3D setup can fail for reasons entirely outside our control — a
    // blocked CDN script, no WebGL on the device, a driver that refuses
    // context creation under memory pressure. This constructor runs
    // before any event listener below is attached, so an uncaught throw
    // here used to take the whole game down with it (the start button
    // would silently do nothing forever). Never let that happen again:
    // if 3D setup fails, Yasmin and Sam just don't render, and everything
    // else — dialogue, choices, endings — keeps working.
    try {
      this.vrmStage = new VrmStage(document.getElementById('vrm-layer'));
    } catch (err) {
      console.warn('3D character rendering unavailable, continuing without it', err);
      this.vrmStage = null;
    }

    this.audio = new AudioManager();
    this.$muteBtn.textContent = this.audio.muted ? '🔇' : '🔊';
    this.$continueBtn.hidden = !this.hasSave();

    this.$box.addEventListener('click', () => this.handleTap());
    document.getElementById('start-btn').addEventListener('click', () => this.beginStory());
    this.$continueBtn.addEventListener('click', () => this.beginStory({ resume: true }));
    document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    this.$debugBtn.addEventListener('click', () => {
      this.$debugPanel.hidden = !this.$debugPanel.hidden;
      this.renderDebug();
    });
    this.$muteBtn.addEventListener('click', () => {
      const muted = this.audio.toggleMute();
      this.$muteBtn.textContent = muted ? '🔇' : '🔊';
    });
  }

  // ---------- Save / continue ----------

  hasSave() {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch {
      return false;
    }
  }

  saveProgress() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ sceneId: this.sceneId, stats: this.stats }));
    } catch {
      // Private browsing / storage disabled: progress just won't persist.
    }
  }

  clearProgress() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // ignore
    }
  }

  restart() {
    this.stats = { affection: 0, rage: 0, doubt: 0 };
    this.sceneId = STORY.start;
    this.onstage.forEach((el) => el.remove());
    this.onstage.clear();
    if (this.vrmStage) for (const id of this.onstageVrm) this.vrmStage.remove(id);
    this.onstageVrm.clear();
    this.$end.hidden = true;
    this.$box.classList.remove('show');
    this.beginStory();
  }

  beginStory({ resume = false } = {}) {
    this.audio.unlock();
    this.enableTiltParallax();
    this.$start.hidden = true;

    if (resume) {
      try {
        const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
        if (saved) {
          this.stats = saved.stats;
          this.sceneId = saved.sceneId;
        }
      } catch {
        // fall through to a fresh start
      }
    }
    this.enterScene(this.sceneId);
  }

  // Subtle device-tilt parallax: the sprite plane and the decor plane
  // (rain/lights/steam) drift by different amounts as the phone tilts,
  // reading as actual depth rather than a single flat image. Purely a
  // progressive enhancement — silently does nothing without motion
  // sensors, on desktop, or if the user declines the iOS permission
  // prompt.
  enableTiltParallax() {
    if (this.tiltEnabled || typeof DeviceOrientationEvent === 'undefined') return;
    this.tiltEnabled = true;

    const apply = (gamma) => {
      const tilt = Math.max(-18, Math.min(18, gamma || 0));
      this.$sprites.style.transform = `rotateY(${tilt * 0.55}deg) translateX(${tilt * 0.5}px)`;
      this.$decor.style.transform = `rotateY(${tilt * 0.25}deg) translateX(${tilt * 0.2}px)`;
    };

    let queued = false;
    const onOrientation = (e) => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { apply(e.gamma); queued = false; });
    };

    const attach = () => window.addEventListener('deviceorientation', onOrientation);

    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then((state) => {
          if (state === 'granted') attach();
        }).catch(() => {});
      } else {
        attach();
      }
    } catch {
      // no motion sensors / not permitted — the scene just stays flat.
    }
  }

  // ---------- Scene lifecycle ----------

  enterScene(id) {
    this.sceneId = id;
    const scene = STORY.scenes[id];
    if (!scene) throw new Error(`Unknown scene: ${id}`);

    if (scene.evaluate) {
      const match = scene.endings.find((e) => e.when(this.stats));
      this.enterScene(match.next);
      return;
    }

    this.lineIndex = 0;
    this.setBackground(scene.bg);
    this.syncSprites(scene.sprites || []);

    if (scene.ending) {
      this.clearProgress();
      this.playDialogue(scene, () => this.showEnding(scene));
    } else if (!scene.dialogue || scene.dialogue.length === 0) {
      this.saveProgress();
      this.advanceFromScene(scene);
    } else {
      this.saveProgress();
      this.playDialogue(scene, () => this.advanceFromScene(scene));
    }
  }

  advanceFromScene(scene) {
    if (scene.choices) {
      this.showChoices(scene.choices);
    } else if (scene.next) {
      this.enterScene(scene.next);
    }
  }

  // ---------- Background cross-fade ----------

  setBackground(bgKey) {
    if (!bgKey) return;
    const incoming = this.bgToggle ? this.$bgB : this.$bgA;
    const outgoing = this.bgToggle ? this.$bgA : this.$bgB;
    this.bgToggle = !this.bgToggle;

    incoming.className = `bg-layer bg-${bgKey}`;
    requestAnimationFrame(() => {
      incoming.classList.add('visible');
      outgoing.classList.remove('visible');
    });

    this.$decor.innerHTML = buildDecor(bgKey);
    this.audio.setMood(MUSIC_MOOD_BY_BG[bgKey]);
  }

  // ---------- Sprites ----------

  syncSprites(list) {
    const wanted = new Map(list.map((s) => [s.id, s]));
    const vrmSpecs = list.filter((s) => VRM_CHARACTERS.has(s.id));
    const domList = list.filter((s) => !VRM_CHARACTERS.has(s.id));

    for (const [id, el] of this.onstage) {
      if (!wanted.has(id)) {
        el.classList.remove('on');
        setTimeout(() => el.remove(), 420);
        this.onstage.delete(id);
      }
    }

    for (const spec of domList) {
      let el = this.onstage.get(spec.id);
      if (!el) {
        el = this.createSprite(spec);
        this.$sprites.appendChild(el);
        this.onstage.set(spec.id, el);
        requestAnimationFrame(() => el.classList.add('on'));
      } else {
        el.className = `${this.spriteClassName(spec)} on`;
      }
    }

    if (this.vrmStage) {
      for (const id of [...this.onstageVrm]) {
        if (!wanted.has(id)) {
          this.vrmStage.remove(id);
          this.onstageVrm.delete(id);
        }
      }
      for (const spec of vrmSpecs) {
        this.onstageVrm.add(spec.id);
        this.vrmStage.load(spec.id, VRM_MODEL_URL[spec.id], spec.pos).then(() => {
          this.vrmStage.setEmotion(spec.id, spec.emotion || 'neutral');
        }).catch((err) => {
          console.warn('3D model failed to load, skipping', spec.id, err);
          this.onstageVrm.delete(spec.id);
        });
        this.vrmStage.setPosition(spec.id, spec.pos); // no-op until loaded; keeps repositioning working once it is
      }
    }

    const majorCount = domList.filter((s) => SPRITE_KIND[s.id] === 'photo' && !MINOR_CHARACTERS.has(s.id)).length;
    this.$sprites.classList.toggle('duo', majorCount === 2);
    this.$sprites.classList.toggle('trio', majorCount >= 3);
  }

  // Whoever is speaking gets visual focus; everyone else on stage dims
  // back, like a two-shot favoring whoever has the line. Narration (no
  // speaker) frames everyone evenly.
  updateFocus(speakerId) {
    for (const [id, el] of this.onstage) {
      el.classList.remove('is-speaking', 'is-listening');
      if (!speakerId) continue;
      el.classList.add(id === speakerId ? 'is-speaking' : 'is-listening');
    }
    if (this.vrmStage) {
      for (const id of this.onstageVrm) {
        this.vrmStage.setFocus(id, !speakerId ? 'none' : id === speakerId ? 'speaking' : 'listening');
      }
    }
  }

  spriteClassName(spec) {
    const kind = SPRITE_KIND[spec.id] || 'vector';
    const minor = MINOR_CHARACTERS.has(spec.id) ? ' sprite--minor' : '';
    return `sprite sprite--${kind}${minor} pos-${spec.pos} emo-${spec.emotion || 'neutral'}`;
  }

  createSprite(spec) {
    const char = CHARACTERS[spec.id];
    const kind = SPRITE_KIND[spec.id] || 'vector';
    const el = document.createElement('div');
    el.className = this.spriteClassName(spec);

    if (kind === 'photo') {
      const layers = PHOTO_EMOTIONS
        .map((e) => `<img class="face-photo face-${e}" src="assets/sprites/${spec.id}-${e}.webp" alt="${char.name}">`)
        .join('');
      el.innerHTML = `<div class="photo-stack" style="--sprite-ratio:${SPRITE_ASPECT[spec.id] || '480 / 1504'}">${layers}</div>`;
    } else {
      const colors = VECTOR_PORTRAIT_COLORS;
      el.innerHTML = `
        <div class="portrait portrait--${spec.id}" style="--pcol-light:${colors.light};--pcol-dark:${colors.dark};--pglow:${colors.glow}">${buildFace()}</div>
        <div class="sprite-name">${char.name}</div>
      `;
    }
    return el;
  }

  setSpriteEmotion(id, emotion) {
    if (!emotion) return;
    if (VRM_CHARACTERS.has(id)) {
      if (this.vrmStage) this.vrmStage.setEmotion(id, emotion);
      return;
    }
    const el = this.onstage.get(id);
    if (!el) return;
    el.className = el.className.replace(/emo-\S+/, `emo-${emotion}`);
  }

  // ---------- VFX ----------

  triggerVfx(kind) {
    if (!kind) return;
    if (kind === 'glitch') {
      this.$vfx.classList.remove('glitch');
      void this.$vfx.offsetWidth;
      this.$vfx.classList.add('glitch');
      this.audio.playSfx('glitch', { volume: 0.5 });
      setTimeout(() => this.$vfx.classList.remove('glitch'), 900);
    } else if (kind === 'shake') {
      this.$stage.classList.remove('vfx-shake');
      void this.$stage.offsetWidth;
      this.$stage.classList.add('vfx-shake');
      setTimeout(() => this.$stage.classList.remove('vfx-shake'), 450);
    }
  }

  // ---------- Dialogue / typewriter ----------

  playDialogue(scene, onDone) {
    this.currentScene = scene;
    this.onDialogueDone = onDone;
    this.$box.classList.add('show');
    this.showLine();
  }

  showLine() {
    const line = this.currentScene.dialogue[this.lineIndex];
    if (line.speaker) {
      const char = CHARACTERS[line.speaker];
      this.$name.textContent = char.name;
      this.$name.classList.add('show');
      this.$name.style.setProperty('--name-col', char.color);
      this.$text.classList.remove('narration');
      this.setSpriteEmotion(line.speaker, line.emotion);
    } else {
      this.$name.classList.remove('show');
      this.$text.classList.add('narration');
    }
    this.updateFocus(line.speaker);

    if (line.vfx) this.triggerVfx(line.vfx);
    if (line.sfx) this.audio.playSfx(line.sfx, { volume: 0.6 });
    if (line.gesture && this.vrmStage && VRM_CHARACTERS.has(line.speaker)) {
      this.vrmStage.setGesture(line.speaker, line.gesture, line.gestureMs || 1600);
    }
    if (this.vrmStage) {
      for (const id of this.onstageVrm) this.vrmStage.setBlush(id, false);
      if (line.blush && VRM_CHARACTERS.has(line.speaker)) this.vrmStage.setBlush(line.speaker, true);
    }

    this.typeText(line.text, line.speaker);
  }

  typeText(full, speaker) {
    clearTimeout(this.typeTimer);
    this.isTyping = true;
    this.$arrow.classList.remove('show');
    this.$text.textContent = '';
    let i = 0;
    this.setSpeakerTalking(speaker, true);

    const step = () => {
      this.$text.textContent = full.slice(0, i + 1);
      const ch = full[i];
      if (i % 2 === 0 && ch && ch.trim()) {
        this.audio.playSfx('tick', { rate: 0.9 + Math.random() * 0.3, volume: 0.35 });
      }
      i++;
      if (i < full.length) {
        this.typeTimer = setTimeout(step, TYPE_SPEED_MS);
      } else {
        this.finishTyping();
      }
    };
    this.typeTimer = setTimeout(step, TYPE_SPEED_MS);
  }

  // Drives the 3D mouth-flap lip-sync purely off the typewriter's own
  // on/off state (there's no voice track to analyze).
  setSpeakerTalking(speaker, on) {
    if (this.vrmStage && speaker && VRM_CHARACTERS.has(speaker)) {
      this.vrmStage.setTalking(speaker, on);
    }
  }

  finishTyping() {
    clearTimeout(this.typeTimer);
    this.typeTimer = null;
    this.isTyping = false;
    this.$arrow.classList.add('show');
    const line = this.currentScene.dialogue[this.lineIndex];
    this.setSpeakerTalking(line.speaker, false);
  }

  handleTap() {
    if (this.isTyping) {
      clearTimeout(this.typeTimer);
      this.typeTimer = null;
      this.isTyping = false;
      const line = this.currentScene.dialogue[this.lineIndex];
      this.$text.textContent = line.text;
      this.$arrow.classList.add('show');
      this.setSpeakerTalking(line.speaker, false);
      return;
    }

    this.lineIndex++;
    if (this.lineIndex < this.currentScene.dialogue.length) {
      this.showLine();
    } else {
      this.$arrow.classList.remove('show');
      const done = this.onDialogueDone;
      this.onDialogueDone = null;
      if (done) done();
    }
  }

  // ---------- Choices ----------

  showChoices(choices) {
    this.$box.classList.remove('show');
    this.$choices.innerHTML = '';
    choices.forEach((choice) => {
      const card = document.createElement('div');
      card.className = 'choice-card';
      card.textContent = choice.text;
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectChoice(choice);
      });
      this.$choices.appendChild(card);
    });
    this.$choices.classList.add('show');
  }

  selectChoice(choice) {
    this.audio.playSfx('select');
    this.$choices.classList.remove('show');
    if (choice.effects) {
      for (const [k, v] of Object.entries(choice.effects)) {
        this.stats[k] = (this.stats[k] || 0) + v;
      }
    }
    this.renderDebug();
    this.enterScene(choice.next);
  }

  // ---------- Ending ----------

  showEnding(scene) {
    this.$endTitle.textContent = scene.title;
    this.$end.hidden = false;
  }

  renderDebug() {
    if (this.$debugPanel.hidden) return;
    const statRows = Object.entries(this.stats)
      .map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`)
      .join('');
    const vrmDebug = window.__vrmDebug || {};
    const vrmRows = Object.entries(vrmDebug)
      .map(([id, missing]) => `<div><span>${id} bones</span><span>${missing.length ? 'missing: ' + missing.join(',') : 'ok'}</span></div>`)
      .join('');
    this.$debugPanel.innerHTML = statRows + vrmRows;
  }
}

document.addEventListener('DOMContentLoaded', () => new Game());
