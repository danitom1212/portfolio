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
const SAVE_KEY = 'sgc-save-v1';

// Yasmin, Sam and Noa all use real illustrated sprite art (assets/sprites/).
const SPRITE_KIND = { yasmin: 'photo', sam: 'photo', noa: 'photo' };
const PHOTO_EMOTIONS = ['neutral', 'smile', 'sad', 'angry', 'shock', 'glitch'];
// Each illustrated sprite keeps its source art's own proportions.
const SPRITE_ASPECT = { yasmin: '480 / 1504', sam: '480 / 1190', noa: '420 / 1345' };
// No background-scale minor characters in this cut of the story.
const MINOR_CHARACTERS = new Set();

class Game {
  constructor() {
    this.stats = { affection: 0, rage: 0, doubt: 0 };
    this.sceneId = STORY.start;
    this.lineIndex = 0;
    this.onstage = new Map(); // characterId -> sprite element
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
    this.$end.hidden = true;
    this.$box.classList.remove('show');
    this.beginStory();
  }

  beginStory({ resume = false } = {}) {
    this.audio.unlock();
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
    this.$sprites.classList.toggle('duo', majorCount >= 2);
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
    const el = this.onstage.get(id);
    if (!el || !emotion) return;
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

    this.typeText(line.text);
  }

  typeText(full) {
    clearTimeout(this.typeTimer);
    this.isTyping = true;
    this.$arrow.classList.remove('show');
    this.$text.textContent = '';
    let i = 0;

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

  finishTyping() {
    clearTimeout(this.typeTimer);
    this.typeTimer = null;
    this.isTyping = false;
    this.$arrow.classList.add('show');
  }

  handleTap() {
    if (this.isTyping) {
      clearTimeout(this.typeTimer);
      this.typeTimer = null;
      this.isTyping = false;
      const line = this.currentScene.dialogue[this.lineIndex];
      this.$text.textContent = line.text;
      this.$arrow.classList.add('show');
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
    this.$debugPanel.innerHTML = Object.entries(this.stats)
      .map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`)
      .join('');
  }
}

document.addEventListener('DOMContentLoaded', () => new Game());
