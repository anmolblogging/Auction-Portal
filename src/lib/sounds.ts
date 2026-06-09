/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

let audioCtx: AudioContext | null = null;

function initAudio() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playBidSound() {
  const ctx = initAudio();
  if (!ctx) return;
  
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  const gain2 = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'sine';

  osc1.frequency.setValueAtTime(987.77, ctx.currentTime); 
  osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1); 

  gain1.gain.setValueAtTime(0, ctx.currentTime);
  gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.03);
  gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

  gain2.gain.setValueAtTime(0, ctx.currentTime + 0.1);
  gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.13);
  gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

  osc1.connect(gain1); gain1.connect(ctx.destination);
  osc1.start(ctx.currentTime); osc1.stop(ctx.currentTime + 0.4);

  osc2.connect(gain2); gain2.connect(ctx.destination);
  osc2.start(ctx.currentTime + 0.1); osc2.stop(ctx.currentTime + 0.5);
}

export function playCountdownSound() {
  const ctx = initAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
  gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
}

export function playSoldSound() {
  const ctx = initAudio();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Three ascending notes: C5 → E5 → G5 (perfect major chord arpeggio)
  const notes = [523.25, 659.25, 783.99];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.18);

    gain.gain.setValueAtTime(0, now + i * 0.18);
    gain.gain.linearRampToValueAtTime(0.4, now + i * 0.18 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.18);
    osc.stop(now + i * 0.18 + 1.2);
  });
}