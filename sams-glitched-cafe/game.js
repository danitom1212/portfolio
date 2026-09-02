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
const SAVE_KEY = (slot) => `sgc-save-v2-${slot}`;
const SAVE_SLOTS = 3;

// Yasmin, Sam and Noa all use real illustrated sprite art (assets/sprites/)
// as the baseline — always rendered, always visible. Yasmin and Sam
// additionally get a real 3D render (Three.js + VRM humanoids, plus a
// simple flat-shaded 3D room standing in for the photo background) layered
// on top once it successfully loads. This is deliberately a progressive
// enhancement rather than a replacement: 3D rendering on a device we can't
// test against directly has already failed silently more than once this
// project, so the 2D art underneath is the guarantee that a character is
// always visible even when 3D doesn't come up — the 3D layer only ever
// hides the 2D fallback for a character once THAT character has actually
// finished loading.
const SPRITE_KIND = { yasmin: 'photo', sam: 'photo', noa: 'photo' };
const PHOTO_EMOTIONS = ['neutral', 'smile', 'sad', 'angry', 'shock', 'glitch'];
// Each illustrated sprite keeps its source art's own proportions.
const SPRITE_ASPECT = { yasmin: '480 / 1504', sam: '480 / 1190', noa: '420 / 1345' };
// No background-scale minor characters in this cut of the story.
const MINOR_CHARACTERS = new Set();

const VRM_CHARACTERS = new Set(['yasmin', 'sam']);
const VRM_MODEL_URL = { yasmin: 'assets/models/yasmin.vrm', sam: 'assets/models/sam.vrm' };

const GESTURE_MS = { wave: 900, lean: 1100, shrug: 700, point: 650, dance: 1400 };

class Game {
  constructor() {
    this.stats = { affection: 0, rage: 0, doubt: 0 };
    this.sceneId = STORY.start;
    this.lineIndex = 0;
    this.activeSlot = 1;
    this.onstage = new Map(); // characterId -> sprite element
    this.vrm3dLoaded = new Set(); // characterId set: 3D model finished loading, 2D fallback hidden
    this.typeTimer = null;
    this.autoTimer = null;
    this.isTyping = false;
    this.autoPlay = false;
    this.skipMode = false;
    this.history = []; // { speaker, text } for every line shown this session
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
    this.$notice = document.getElementById('render-notice');
    this.$slotList = document.getElementById('slot-list');
    this.$menuBtn = document.getElementById('menu-toggle');
    this.$menuPanel = document.getElementById('menu-panel');
    this.$autoBtn = document.getElementById('auto-toggle');
    this.$skipBtn = document.getElementById('skip-toggle');
    this.$musicVol = document.getElementById('music-vol');
    this.$sfxVol = document.getElementById('sfx-vol');
    this.$historyBtn = document.getElementById('history-open-btn');
    this.$historyPanel = document.getElementById('history-panel');
    this.$historyList = document.getElementById('history-list');

    // 3D setup can fail for reasons entirely outside our control — no
    // WebGL on the device, a driver that refuses context creation under
    // memory pressure. This constructor runs before any event listener
    // below is attached, so an uncaught throw here used to take the whole
    // game down with it. Never again: if 3D setup fails, this.vrmStage
    // stays null, every call below is guarded, and the 2D sprites (always
    // rendered regardless) are simply all the player sees.
    try {
      this.vrmStage = new VrmStage(document.getElementById('vrm-layer'));
    } catch (err) {
      console.warn('3D rendering unavailable, continuing with 2D only', err);
      this.vrmStage = null;
      this.showRenderNotice('תלת-המימד לא נטען במכשיר הזה — ממשיך עם התמונות הרגילות.');
    }

    // Same reasoning as the 3D guard above: AudioManager reads/writes
    // localStorage, which can throw outright in some embedded contexts.
    // Silence and mute state not persisting is a minor loss; the whole
    // game refusing to boot over it is not — so a construction failure
    // falls back to a no-op stub with the same method names, and every
    // call site below keeps working without needing its own null check.
    try {
      this.audio = new AudioManager();
    } catch (err) {
      console.warn('Audio unavailable, continuing without sound', err);
      this.audio = {
        muted: true, musicVolume: 1, sfxVolume: 1,
        unlock() {}, playSfx() {}, setMood() {}, toggleMute: () => true,
        setMusicVolume() {}, setSfxVolume() {},
      };
    }
    this.$muteBtn.textContent = this.audio.muted ? '🔇' : '🔊';
    this.$musicVol.value = Math.round(this.audio.musicVolume * 100);
    this.$sfxVol.value = Math.round(this.audio.sfxVolume * 100);
    this.renderSlotList();

    this.$box.addEventListener('click', () => this.handleTap());
    document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    this.$debugBtn.addEventListener('click', () => {
      this.$debugPanel.hidden = !this.$debugPanel.hidden;
      this.renderDebug();
    });
    this.$muteBtn.addEventListener('click', () => {
      const muted = this.audio.toggleMute();
      this.$muteBtn.textContent = muted ? '🔇' : '🔊';
    });

    this.$menuBtn.addEventListener('click', () => { this.$menuPanel.hidden = !this.$menuPanel.hidden; });
    document.getElementById('menu-close-btn').addEventListener('click', () => { this.$menuPanel.hidden = true; });
    this.$autoBtn.addEventListener('click', () => this.setAutoPlay(!this.autoPlay));
    this.$skipBtn.addEventListener('click', () => this.setSkipMode(!this.skipMode));
    this.$musicVol.addEventListener('input', () => this.audio.setMusicVolume(this.$musicVol.value / 100));
    this.$sfxVol.addEventListener('input', () => this.audio.setSfxVolume(this.$sfxVol.value / 100));
    this.$historyBtn.addEventListener('click', () => this.openHistory());
    document.getElementById('history-close-btn').addEventListener('click', () => { this.$historyPanel.hidden = true; });
  }

  // ---------- Menu: auto-play / skip / history ----------

  setAutoPlay(on) {
    this.autoPlay = on;
    this.$autoBtn.classList.toggle('active', on);
    this.$autoBtn.querySelector('.menu-state').textContent = on ? 'פעיל' : 'כבוי';
    if (on) this.setSkipMode(false);
    this.maybeScheduleAdvance();
  }

  setSkipMode(on) {
    this.skipMode = on;
    this.$skipBtn.classList.toggle('active', on);
    this.$skipBtn.querySelector('.menu-state').textContent = on ? 'פעיל' : 'כבוי';
    if (on) this.setAutoPlay(false);
    if (on && !this.isTyping) this.maybeScheduleAdvance();
  }

  // Auto-play and skip both advance without a tap once the current line
  // has finished typing — skip just does it almost instantly, auto-play
  // leaves enough time to actually read. Neither ever fires while choices
  // are on screen; a decision always waits for the player.
  maybeScheduleAdvance() {
    clearTimeout(this.autoTimer);
    if (this.isTyping || this.$choices.classList.contains('show')) return;
    if (this.skipMode) {
      this.autoTimer = setTimeout(() => this.handleTap(), 90);
    } else if (this.autoPlay) {
      this.autoTimer = setTimeout(() => this.handleTap(), 1400);
    }
  }

  openHistory() {
    this.$menuPanel.hidden = true;
    this.$historyList.innerHTML = this.history.map((h) => {
      if (!h.speaker) return `<div class="history-line narration">${h.text}</div>`;
      const char = CHARACTERS[h.speaker];
      return `<div class="history-line"><span class="history-speaker" style="color:${char.color}">${char.name}</span>${h.text}</div>`;
    }).join('') || '<div class="history-line narration">עדיין אין היסטוריה בשיחה הזאת.</div>';
    this.$historyPanel.hidden = false;
    this.$historyList.scrollTop = this.$historyList.scrollHeight;
  }

  // ---------- Save slots ----------

  readSlot(slot) {
    try {
      const raw = localStorage.getItem(SAVE_KEY(slot));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveProgress() {
    try {
      localStorage.setItem(SAVE_KEY(this.activeSlot), JSON.stringify({
        sceneId: this.sceneId, stats: this.stats, updatedAt: Date.now(),
      }));
    } catch {
      // Private browsing / storage disabled: progress just won't persist.
    }
  }

  clearSlot(slot) {
    try {
      localStorage.removeItem(SAVE_KEY(slot));
    } catch {
      // ignore
    }
  }

  // Three independent save slots, shown on the start screen: an empty
  // slot starts a fresh game there, an occupied one shows roughly when
  // you left off and can be continued or wiped without touching the
  // other two — a real multi-save setup rather than one silent autosave.
  renderSlotList() {
    const fmtWhen = (ts) => {
      const mins = Math.round((Date.now() - ts) / 60000);
      if (mins < 1) return 'הרגע';
      if (mins < 60) return `לפני ${mins} דק׳`;
      const hours = Math.round(mins / 60);
      if (hours < 24) return `לפני ${hours} שע׳`;
      return `לפני ${Math.round(hours / 24)} ימים`;
    };

    this.$slotList.innerHTML = '';
    for (let slot = 1; slot <= SAVE_SLOTS; slot++) {
      const data = this.readSlot(slot);
      const row = document.createElement('div');
      row.className = 'slot-row';
      const main = document.createElement('button');
      main.className = 'btn';
      if (data) {
        main.innerHTML = `משבצת ${slot} — המשך<span class="slot-meta">${fmtWhen(data.updatedAt || Date.now())}</span>`;
        main.addEventListener('click', () => this.beginStory({ slot, resume: true }));
      } else {
        main.innerHTML = `משבצת ${slot} — משחק חדש`;
        main.addEventListener('click', () => this.beginStory({ slot, resume: false }));
      }
      row.appendChild(main);
      if (data) {
        const del = document.createElement('button');
        del.className = 'btn btn-ghost';
        del.textContent = '🗑';
        del.title = 'מחק משבצת זו';
        del.addEventListener('click', (e) => {
          e.stopPropagation();
          this.clearSlot(slot);
          this.renderSlotList();
        });
        row.appendChild(del);
      }
      this.$slotList.appendChild(row);
    }
  }

  restart() {
    clearTimeout(this.autoTimer);
    this.stats = { affection: 0, rage: 0, doubt: 0 };
    this.sceneId = STORY.start;
    this.history = [];
    this.onstage.forEach((el) => el.remove());
    this.onstage.clear();
    if (this.vrmStage) for (const id of [...this.vrm3dLoaded || []]) this.vrmStage.remove(id);
    this.vrm3dLoaded = new Set();
    this.$end.hidden = true;
    this.$box.classList.remove('show');
    this.beginStory({ slot: this.activeSlot, resume: false });
  }

  beginStory({ slot = 1, resume = false } = {}) {
    this.activeSlot = slot;
    this.audio.unlock();
    this.enableTiltParallax();
    this.$start.hidden = true;

    if (resume) {
      const saved = this.readSlot(slot);
      if (saved) {
        this.stats = saved.stats;
        this.sceneId = saved.sceneId;
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
      this.clearSlot(this.activeSlot);
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
    if (this.vrmStage) {
      try {
        this.vrmStage.setRoom(bgKey);
      } catch (err) {
        console.warn('3D room failed to build, staying on the photo backdrop', err);
      }
    }
  }

  showRenderNotice(text) {
    this.$notice.textContent = text;
    this.$notice.hidden = false;
    clearTimeout(this._noticeTimer);
    this._noticeTimer = setTimeout(() => { this.$notice.hidden = true; }, 6000);
  }

  // ---------- Sprites ----------

  syncSprites(list) {
    const wanted = new Map(list.map((s) => [s.id, s]));

    for (const [id, el] of this.onstage) {
      if (!wanted.has(id)) {
        el.classList.remove('on');
        setTimeout(() => el.remove(), 420);
        this.onstage.delete(id);
      }
    }

    // The 2D sprite is always created/kept in sync — it's the guaranteed
    // baseline. A character whose 3D model has already loaded just has it
    // visually hidden (see .mode-3d in style.css) rather than skipped.
    for (const spec of list) {
      let el = this.onstage.get(spec.id);
      if (!el) {
        el = this.createSprite(spec);
        this.$sprites.appendChild(el);
        this.onstage.set(spec.id, el);
        requestAnimationFrame(() => el.classList.add('on'));
      } else {
        el.className = `${this.spriteClassName(spec)} on`;
      }
      el.classList.toggle('mode-3d', this.vrm3dLoaded.has(spec.id));
    }

    const majorCount = list.filter((s) => SPRITE_KIND[s.id] === 'photo' && !MINOR_CHARACTERS.has(s.id)).length;
    this.$sprites.classList.toggle('duo', majorCount === 2);
    this.$sprites.classList.toggle('trio', majorCount >= 3);

    if (this.vrmStage) this.syncVrm(list, wanted);
  }

  // Kicks off (once per character, ever) loading the 3D model for anyone
  // in VRM_CHARACTERS who's on stage, hides/shows already-loaded 3D
  // characters to match who's actually in this scene, and repositions
  // anyone left/right/center. A model that fails to load just leaves that
  // character on its 2D fallback — see the .catch() below — and shows a
  // one-time on-screen notice so a real-device failure is reportable
  // instead of silent.
  syncVrm(list, wanted) {
    for (const id of this.vrm3dLoaded) {
      this.vrmStage.setVisible(id, wanted.has(id));
    }
    for (const spec of list) {
      if (!VRM_CHARACTERS.has(spec.id)) continue;
      if (this.vrm3dLoaded.has(spec.id)) {
        this.vrmStage.setPosition(spec.id, spec.pos);
        continue;
      }
      if (this.vrm3dAttempted?.has(spec.id)) continue;
      (this.vrm3dAttempted ??= new Set()).add(spec.id);
      this.vrmStage.load(spec.id, VRM_MODEL_URL[spec.id], spec.pos).then(() => {
        this.vrmStage.setEmotion(spec.id, spec.emotion || 'neutral');
        this.vrm3dLoaded.add(spec.id);
        const el = this.onstage.get(spec.id);
        if (el) el.classList.add('mode-3d');
      }).catch((err) => {
        console.warn('3D model failed to load, staying on 2D art for', spec.id, err);
        this.showRenderNotice('דמות אחת לא עלתה בתלת-מימד — ממשיכה בתמונה הרגילה.');
      });
    }
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
      for (const id of this.vrm3dLoaded) {
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
    if (this.vrmStage) this.vrmStage.setEmotion(id, emotion); // no-op if not loaded/not a VRM id
    const el = this.onstage.get(id);
    if (!el) return;
    el.className = el.className.replace(/emo-\S+/, `emo-${emotion}`);
  }

  // Plays a short named animation on top of whatever emotion is already
  // showing — a real bone pose in 3D (see GESTURES in character3d.js), or
  // the equivalent .gesture-* CSS keyframe on the 2D fallback — whichever
  // is currently the visible representation of that character.
  playGesture(id, name) {
    if (this.vrm3dLoaded.has(id)) {
      this.vrmStage.setGesture(id, name, GESTURE_MS[name]);
      return;
    }
    const el = this.onstage.get(id);
    const duration = GESTURE_MS[name];
    if (!el || !duration) return;
    el.classList.remove(`gesture-${name}`);
    void el.offsetWidth;
    el.classList.add(`gesture-${name}`);
    setTimeout(() => el.classList.remove(`gesture-${name}`), duration);
  }

  setBlush(id, on) {
    if (this.vrmStage) this.vrmStage.setBlush(id, on); // no-op if not loaded/not a VRM id
    const el = this.onstage.get(id);
    if (el) el.classList.toggle('blush', on);
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
    this.history.push({ speaker: line.speaker, text: line.text });
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
    if (line.gesture && line.speaker) this.playGesture(line.speaker, line.gesture);
    for (const id of this.onstage.keys()) this.setBlush(id, false);
    if (line.blush && line.speaker) this.setBlush(line.speaker, true);

    this.typeText(line.text, line.speaker);
  }

  typeText(full, speaker) {
    clearTimeout(this.typeTimer);
    this.isTyping = true;
    this.$arrow.classList.remove('show');
    this.$text.textContent = '';

    if (this.skipMode) {
      this.$text.textContent = full;
      this.finishTyping();
      return;
    }

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

  // Drives the face's talking-flap animation purely off the typewriter's
  // own on/off state (there's no voice track to analyze).
  setSpeakerTalking(speaker, on) {
    if (!speaker) return;
    if (this.vrmStage) this.vrmStage.setTalking(speaker, on); // no-op if not loaded/not a VRM id
    const el = this.onstage.get(speaker);
    if (el) el.classList.toggle('talking', on);
  }

  finishTyping() {
    clearTimeout(this.typeTimer);
    this.typeTimer = null;
    this.isTyping = false;
    this.$arrow.classList.add('show');
    const line = this.currentScene.dialogue[this.lineIndex];
    this.setSpeakerTalking(line.speaker, false);
    this.maybeScheduleAdvance();
  }

  handleTap() {
    clearTimeout(this.autoTimer);
    if (this.isTyping) {
      clearTimeout(this.typeTimer);
      this.typeTimer = null;
      this.isTyping = false;
      const line = this.currentScene.dialogue[this.lineIndex];
      this.$text.textContent = line.text;
      this.$arrow.classList.add('show');
      this.setSpeakerTalking(line.speaker, false);
      this.maybeScheduleAdvance();
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
    const vrmRow = `<div><span>3d</span><span>${this.vrmStage ? [...VRM_CHARACTERS].map((id) => `${id}:${this.vrm3dLoaded.has(id) ? 'on' : 'off'}`).join(' ') : 'unavailable'}</span></div>`;
    this.$debugPanel.innerHTML = statRows + vrmRow;
  }
}

document.addEventListener('DOMContentLoaded', () => new Game());
