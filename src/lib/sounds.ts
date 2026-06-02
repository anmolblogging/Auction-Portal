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
  
  // "Coin drop" sound
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  const gain2 = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'sine';

  osc1.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
  osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1); // E6

  gain1.gain.setValueAtTime(0, ctx.currentTime);
  gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.03);
  gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

  gain2.gain.setValueAtTime(0, ctx.currentTime + 0.1);
  gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.13);
  gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(ctx.currentTime);
  osc1.stop(ctx.currentTime + 0.4);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(ctx.currentTime + 0.1);
  osc2.stop(ctx.currentTime + 0.5);
}

export function playCountdownSound() {
  const ctx = initAudio();
  if (!ctx) return;
  
  // "Electronic Beep" sound
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime); // Standard beep frequency
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
  gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

export function playSoldSound() {
  const ctx = initAudio();
  if (!ctx) return;
  
  // "Fanfare / Sold" sound
  const playNote = (freq: number, startTime: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2500;
    
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
    gain.gain.setValueAtTime(0.15, startTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  };
  
  const now = ctx.currentTime;
  playNote(392.00, now, 0.15); // G4
  playNote(523.25, now + 0.15, 0.15); // C5
  playNote(659.25, now + 0.3, 0.15); // E5
  playNote(783.99, now + 0.45, 0.5); // G5
}
