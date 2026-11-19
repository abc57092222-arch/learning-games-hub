/**
 * Zero-asset procedural Web Audio sound synthesizer.
 * Shared across all games in the Learning Games Hub.
 * Safe no-op in headless Node or when audio is muted/blocked.
 */

let audioCtx = null;
let muted = false;

function getCtx() {
  if (muted || typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctx();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setMuted(val) {
  muted = Boolean(val);
}

export function isMuted() {
  return muted;
}

export function playTone({ type = 'sine', freq = 440, endFreq = null, duration = 0.12, gain = 0.12, delay = 0 } = {}) {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), t0 + duration);
  }
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playPop() {
  playTone({ type: 'sine', freq: 520, endFreq: 760, duration: 0.08, gain: 0.1 });
}

export function playDrop() {
  playTone({ type: 'triangle', freq: 240, endFreq: 140, duration: 0.11, gain: 0.14 });
}

export function playClink() {
  playTone({ type: 'sine', freq: 880, endFreq: 1120, duration: 0.09, gain: 0.08 });
}

export function playError() {
  playTone({ type: 'sawtooth', freq: 210, endFreq: 135, duration: 0.22, gain: 0.08 });
}

export function playBalanceLock() {
  playTone({ type: 'triangle', freq: 523.25, duration: 0.12, gain: 0.11, delay: 0 });
  playTone({ type: 'triangle', freq: 659.25, duration: 0.12, gain: 0.11, delay: 0.08 });
  playTone({ type: 'triangle', freq: 783.99, duration: 0.18, gain: 0.12, delay: 0.16 });
}

export function playVictory() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, idx) => {
    playTone({ type: 'triangle', freq: f, duration: idx === 3 ? 0.38 : 0.14, gain: 0.12, delay: idx * 0.09 });
  });
}
