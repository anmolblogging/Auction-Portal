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

  // 1. The sharp "crack" of the wood
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(800, now);
  osc1.frequency.exponentialRampToValueAtTime(100, now + 0.05);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(1, now + 0.01);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  osc1.connect(gain1); gain1.connect(ctx.destination);
  osc1.start(now); osc1.stop(now + 0.1);

  // 2. The deep "thunk" resonance of the block
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(300, now);
  osc2.frequency.exponentialRampToValueAtTime(50, now + 0.15);
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(1.5, now + 0.02);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  osc2.connect(gain2); gain2.connect(ctx.destination);
  osc2.start(now); osc2.stop(now + 0.2);

  // 3. Short high-frequency noise burst for impact realism
  const bufferSize = ctx.sampleRate * 0.1;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 1000;
  noiseFilter.Q.value = 1;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(1.5, now + 0.01);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(ctx.destination);
  noise.start(now); noise.stop(now + 0.1);
}