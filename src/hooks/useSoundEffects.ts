import { useCallback, useRef } from 'react';

export function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const playSubmitSound = useCallback(() => {
    try {
      const ctx = getCtx();
      const len = Math.floor(ctx.sampleRate * 0.15);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const t = i / ctx.sampleRate;
        d[i] = Math.exp(-t * 20) * (Math.random() * 2 - 1) * 0.15;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2000;
      const gain = ctx.createGain();
      gain.gain.value = 0.3;
      src.connect(hp).connect(gain).connect(ctx.destination);
      src.start();
    } catch {}
  }, [getCtx]);

  const playScoreSound = useCallback((score: number) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (score >= 80) {
        // Celebratory rising chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (score >= 50) {
        // Neutral double tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(523, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Low tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(294, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {}
  }, [getCtx]);

  return { playSubmitSound, playScoreSound };
}
