// ============================================================
// BREACH//REWIND — Web Audio Synthesizer Hook
// ============================================================

import { useCallback, useRef, useState } from 'react';

export function useAudio() {
  const [isMuted, setIsMuted] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08) => {
      if (isMuted) return;
      try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Silently fail if audio context is blocked
      }
    },
    [isMuted, getCtx]
  );

  const playEventPulse = useCallback(() => {
    playTone(220, 0.15, 'sine', 0.05);
  }, [playTone]);

  const playSpike = useCallback(() => {
    playTone(880, 0.08, 'square', 0.06);
    setTimeout(() => playTone(1320, 0.06, 'sine', 0.04), 50);
  }, [playTone]);

  const playAlert = useCallback(() => {
    playTone(440, 0.2, 'sawtooth', 0.04);
    setTimeout(() => playTone(660, 0.15, 'sawtooth', 0.03), 100);
    setTimeout(() => playTone(880, 0.1, 'sawtooth', 0.02), 200);
  }, [playTone]);

  const playScrub = useCallback(() => {
    playTone(1200, 0.03, 'sine', 0.02);
  }, [playTone]);

  const toggleMute = useCallback(() => {
    setIsMuted((p) => !p);
  }, []);

  return {
    isMuted,
    toggleMute,
    playEventPulse,
    playSpike,
    playAlert,
    playScrub,
  };
}
