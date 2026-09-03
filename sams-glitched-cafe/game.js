import { STORY, CHARACTERS } from './story.js';
import { buildFace } from './faces.js';
import { buildDecor } from './decor.js';
import { AudioManager } from './audio.js';

const TYPE_SPEED_MS = 26;

const MUSIC_MOOD_BY_BG = {
  street: 'warm',
  cafe: 'warm',
  cafe_dim: 'tense',
};

const VECTOR_PORTRAIT_COLORS = { light: '#173324', dark: '#020604', glow: 'rgba(57,255,136,.5)' };
const SAVE_KEY = (slot) => `sgc-save-v2-${slot}`;
const SAVE_SLOTS = 3;
const ENDINGS_SEEN_KEY = 'sgc-endings-seen';
// Derived from the story data itself (every scene with `ending: true`)
// rather than hand-maintained, so a new ending added to story.js shows up
// in the gallery automatically.
const ENDING_IDS = Object.entries(STORY.scenes)
  .filter(([, scene]) => scene.ending)
  .map(([id]) => id);

// Yasmin, Sam and Noa all use illustrated 2D sprite art (assets/sprites/).
// A real-time 3D (WebGL/Three.js) render of Yasmin and Sam was tried twice
// this project and pulled both times: it worked in every automated test
// here but kept failing — silently, with no error surfacing anywhere — on
// the one real device it actually needed to run on, across several
// independently-verified fixes. Illustrated art that always renders
// correctly beats a fancier render that sometimes renders nothing. The 3D
// *room* survived as a plain CSS 3D box (#room3d in style.css / index.html)
// driven from setBackground() below — no canvas, no GPU context, nothing
// that can fail the way WebGL did.
const SPRITE_KIND = { yasmin: 'photo', sam: 'photo', noa: 'photo' };
const PHOTO_EMOTIONS = ['neutral', 'smile', 'sad', 'angry', 'shock', 'glitch'];
// Each illustrated sprite keeps its source art's own proportions.
const SPRITE_ASPECT = { yasmin: '480 / 1504', sam: '480 / 1190', noa: '420 / 1345' };
// No background-scale minor characters in this cut of the story.
const MINOR_CHARACTERS = new Set();

const GESTURE_MS = { wave: 900, lean: 1100, shrug: 700, point: 650, dance: 1400 };

class Game {
  constructor() {
    this.stats = { affection: 0, rage: 0, doubt: 0 };
    this.sceneId = STORY.start;
    this.lineIndex = 0;
    this.activeSlot = 1;
    this.onstage = new Map(); // characterId -> sprite element
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
    this.$room3d = document.getElementById('room3d');
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
    this.$galleryBtn = document.getElementById('gallery-open-btn');
    this.$galleryPanel = document.getElementById('gallery-panel');
    this.$galleryList = document.getElementById('gallery-list');
    this.$galleryCount = document.getElementById('gallery-count');
    this.$endGalleryBtn = document.getElementById('end-gallery-btn');

    // AudioManager reads/writes localStorage, which can throw outright in
    // some embedded contexts. Silence and mute state not persisting is a
    // minor loss; the whole game refusing to boot over it is not — so a
    // construction failure falls back to a no-op stub with the same
    // method names, and every call site below keeps working without
    // needing its own null check.
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
    this.$galleryBtn.addEventListener('click', () => this.openGallery());
    this.$endGalleryBtn.addEventListener('click', () => this.openGallery());
    document.getElementById('start-gallery-btn').addEventListener('click', () => this.openGallery());
    document.getElementById('gallery-close-btn').addEventListener('click', () => { this.$galleryPanel.hidden = true; });
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

  // ---------- Ending gallery ----------

  readEndingsSeen() {
    try {
      const raw = JSON.parse(localStorage.getItem(ENDINGS_SEEN_KEY));
      return Array.isArray(raw) ? new Set(raw) : new Set();
    } catch {
      return new Set();
    }
  }

  unlockEnding(id) {
    const seen = this.readEndingsSeen();
    if (seen.has(id)) return;
    seen.add(id);
    try {
      localStorage.setItem(ENDINGS_SEEN_KEY, JSON.stringify([...seen]));
    } catch {
      // Not persisted, but the gallery for *this* session still reflects it.
    }
  }

  // A locked ending shows only its position ("סיום מספר 3"), never its
  // title or how to reach it — the point is to tempt a replay, not spoil
  // one.
  openGallery() {
    this.$menuPanel.hidden = true;
    const seen = this.readEndingsSeen();
    this.$galleryCount.textContent = `${seen.size}/${ENDING_IDS.length}`;
    this.$galleryList.innerHTML = ENDING_IDS.map((id, i) => {
      const unlocked = seen.has(id);
      const title = unlocked ? STORY.scenes[id].title : `סיום מספר ${i + 1}`;
      return `<div class="gallery-row ${unlocked ? 'unlocked' : 'locked'}">
        <span class="gallery-icon">${unlocked ? '🏆' : '🔒'}</span>
        <span>${title}</span>
      </div>`;
    }).join('');
    this.$galleryPanel.hidden = false;
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
  // reading as actual depth rather than a single flat image. The 3D room
  // gets a stronger rotation than either — that's what actually reveals
  // its floor and side walls, turning "a photo" into "a box you're
  // standing inside." Purely a progressive enhancement — silently does
  // nothing without motion sensors, on desktop, or if the user declines
  // the iOS permission prompt (the room still keeps its small static
  // tilt from style.css either way).
  enableTiltParallax() {
    if (this.tiltEnabled || typeof DeviceOrientationEvent === 'undefined') return;
    this.tiltEnabled = true;

    const apply = (gamma) => {
      const tilt = Math.max(-18, Math.min(18, gamma || 0));
      this.$sprites.style.transform = `rotateY(${tilt * 0.55}deg) translateX(${tilt * 0.5}px)`;
      this.$decor.style.transform = `rotateY(${tilt * 0.25}deg) translateX(${tilt * 0.2}px)`;
      this.$room3d.style.transform = `rotateX(6deg) rotateY(${-10 + tilt * 0.9}deg)`;
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

    if (scene.walkIn) {
      this.$box.classList.remove('show');
      this.syncSprites([]);
      this.playWalkIn(scene.walkIn).then(() => this.continueScene(scene));
    } else {
      this.continueScene(scene);
    }
  }

  continueScene(scene) {
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

  // A short "establishing" beat before a scene's dialogue starts: the
  // character's own illustrated sprite slides in from off-screen, small
  // and distant, growing to full size as she "approaches camera" — a
  // cinematic entrance built from the exact same art as the rest of the
  // game, not a separate lower-fidelity stand-in (an earlier low-poly
  // CSS-3D figure did that and looked cheap next to the illustrated art;
  // this replaced it). The element this creates becomes the real onstage
  // sprite — continueScene()'s syncSprites() just settles it into its
  // final pose, no handoff needed. Purely additive: if anything here
  // throws, the scene continues straight to dialogue instead.
  async playWalkIn({ id, pos = 'left', emotion = 'neutral', durationMs = 2200 }) {
    try {
      const spec = { id, pos, emotion };
      const el = this.createSprite(spec);
      el.className = `${this.spriteClassName(spec)} walk-in`;
      this.$sprites.appendChild(el);
      this.onstage.set(id, el);
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          el.classList.remove('walk-in');
          el.classList.add('on', 'walking');
          setTimeout(() => {
            el.classList.remove('walking');
            resolve();
          }, durationMs);
        });
      });
    } catch (err) {
      console.warn('walk-in intro skipped', err);
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

    // The 3D room: the back wall reuses the exact same illustrated photo
    // class as the flat background (bg-${bgKey}), so switching from the
    // 2D backdrop to this box loses nothing — it just wraps that same art
    // in a floor and two side walls that swing into view as the device
    // tilts (see enableTiltParallax below). Pure CSS: nothing here can
    // fail to acquire a GPU context or fail to parse a model file.
    this.$room3d.className = `room-${bgKey}`;
    this.$room3d.innerHTML = `
      <div class="room-wall-back bg-${bgKey}"></div>
      <div class="room-wall-left"></div>
      <div class="room-wall-right"></div>
      <div class="room-floor"></div>
    `;
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
    }

    const majorCount = list.filter((s) => SPRITE_KIND[s.id] === 'photo' && !MINOR_CHARACTERS.has(s.id)).length;
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
    const el = this.onstage.get(id);
    if (!el) return;
    el.className = el.className.replace(/emo-\S+/, `emo-${emotion}`);
  }

  // Plays a short named CSS animation (see the .gesture-* rules in
  // style.css) on top of whatever emotion is already showing, then clears
  // the class once it's done so the same gesture can replay later.
  playGesture(id, name) {
    const el = this.onstage.get(id);
    const duration = GESTURE_MS[name];
    if (!el || !duration) return;
    el.classList.remove(`gesture-${name}`);
    void el.offsetWidth;
    el.classList.add(`gesture-${name}`);
    setTimeout(() => el.classList.remove(`gesture-${name}`), duration);
  }

  setBlush(id, on) {
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
    // The box stays in the DOM (and clickable) even while hidden — e.g.
    // during a walk-in beat, before choices, or mid scene-transition — so a
    // stray or impatient tap in that window must not touch lineIndex/
    // currentScene: they belong to whatever dialogue hasn't started yet.
    if (!this.$box.classList.contains('show')) return;
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
    this.unlockEnding(this.sceneId);
  }

  renderDebug() {
    if (this.$debugPanel.hidden) return;
    this.$debugPanel.innerHTML = Object.entries(this.stats)
      .map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`)
      .join('');
  }
}

document.addEventListener('DOMContentLoaded', () => new Game());
