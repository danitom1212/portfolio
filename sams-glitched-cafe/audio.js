// Sound engine: short one-shot SFX via Web Audio (typewriter tick, choice
// select, glitch stinger) plus a two-track ambient music bed that
// crossfades between a "warm" and a "tense" mood as scenes change.
// Everything starts muted-safe: nothing plays until unlock() runs from a
// real user gesture, per browser autoplay policy.

const SFX_SOURCES = {
  tick: 'assets/sfx/tick.wav',
  select: 'assets/sfx/select.wav',
  glitch: 'assets/sfx/glitch.wav',
  bell: 'assets/sfx/bell.wav',
  clink: 'assets/sfx/clink.wav',
};

const MUSIC_SOURCES = {
  warm: 'assets/audio-cafe.mp3',
  tense: 'assets/audio-void.mp3',
};

const MUSIC_VOLUME = 0.35;
const CROSSFADE_MS = 1200;
const MUTE_KEY = 'sgc-muted';
const MUSIC_VOL_KEY = 'sgc-music-vol';
const SFX_VOL_KEY = 'sgc-sfx-vol';

// The Artifact viewer renders this page inside a cross-origin iframe, and
// Safari (and some other browsers) can block ALL storage access for a
// cross-origin frame outright — every localStorage call throws, not just
// the risky ones. This game previously called localStorage directly in
// several places with no guard; on a device where it throws, that threw
// out of the Game constructor before a single button got its click
// listener attached, i.e. the entire page looked "completely broken" with
// no error visible anywhere. Every call goes through these two helpers now
// so a storage failure just means settings/saves don't persist, never a
// dead page.
function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked or full: the setting just won't persist this session.
  }
}

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.buffers = {};
    this.unlocked = false;
    this.muted = readStorage(MUTE_KEY) === '1';
    this.musicVolume = this._readVol(MUSIC_VOL_KEY, 1);
    this.sfxVolume = this._readVol(SFX_VOL_KEY, 1);

    this.musicEls = {
      warm: this._makeAudio(MUSIC_SOURCES.warm),
      tense: this._makeAudio(MUSIC_SOURCES.tense),
    };
    this.currentMood = null;
  }

  _readVol(key, fallback) {
    const v = parseFloat(readStorage(key));
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;
  }

  _makeAudio(src) {
    const el = new Audio(src);
    el.loop = true;
    el.volume = 0;
    el.preload = 'auto';
    return el;
  }

  // Must be called from within a user-gesture handler (e.g. the start button).
  async unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    await Promise.all(
      Object.entries(SFX_SOURCES).map(async ([name, url]) => {
        try {
          const res = await fetch(url);
          const arr = await res.arrayBuffer();
          this.buffers[name] = await this.ctx.decodeAudioData(arr);
        } catch (e) {
          // Missing/blocked audio shouldn't break the game.
        }
      })
    );
  }

  playSfx(name, { rate = 1, volume = 0.7 } = {}) {
    if (this.muted || !this.ctx || !this.buffers[name]) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers[name];
    src.playbackRate.value = rate;
    const gain = this.ctx.createGain();
    gain.gain.value = volume * this.sfxVolume;
    src.connect(gain).connect(this.ctx.destination);
    src.start();
  }

  setMusicVolume(v) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    writeStorage(MUSIC_VOL_KEY, String(this.musicVolume));
    const el = this.currentMood ? this.musicEls[this.currentMood] : null;
    if (el && !el._fadeTimer) el.volume = this.muted ? 0 : MUSIC_VOLUME * this.musicVolume;
  }

  setSfxVolume(v) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    writeStorage(SFX_VOL_KEY, String(this.sfxVolume));
  }

  setMood(mood) {
    if (!mood || mood === this.currentMood) return;
    const outgoingMood = this.currentMood;
    this.currentMood = mood;

    const incoming = this.musicEls[mood];
    if (incoming.paused) incoming.play().catch(() => {});
    this._fadeTo(incoming, this.muted ? 0 : MUSIC_VOLUME * this.musicVolume);

    if (outgoingMood && outgoingMood !== mood) {
      const outgoing = this.musicEls[outgoingMood];
      this._fadeTo(outgoing, 0, () => outgoing.pause());
    }
  }

  _fadeTo(el, target, onDone) {
    clearInterval(el._fadeTimer);
    const start = el.volume;
    const steps = 24;
    let i = 0;
    el._fadeTimer = setInterval(() => {
      i++;
      el.volume = start + (target - start) * (i / steps);
      if (i >= steps) {
        clearInterval(el._fadeTimer);
        el.volume = target;
        if (onDone) onDone();
      }
    }, CROSSFADE_MS / steps);
  }

  toggleMute() {
    this.muted = !this.muted;
    writeStorage(MUTE_KEY, this.muted ? '1' : '0');
    const el = this.currentMood ? this.musicEls[this.currentMood] : null;
    if (el) el.volume = this.muted ? 0 : MUSIC_VOLUME * this.musicVolume;
    return this.muted;
  }
}
