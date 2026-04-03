import { useCallback } from 'react';

export function useAudioEffects() {
  const playSound = useCallback((type: 'hover' | 'click' | 'success' | 'pulse') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'hover') {
        // Subtle high-end blip
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.1);
        gainNode.gain.setValueAtTime(0.02, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
      } else if (type === 'click') {
        // Snappy metallic click
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(120, now);
        oscillator.frequency.exponentialRampToValueAtTime(10, now + 0.05);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
      } else if (type === 'pulse') {
        // Low frequency hum
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(60, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
      }

    } catch (e) {
      // Audio context might be blocked by browser policy until user interaction
      console.warn("Audio effect blocked", e);
    }
  }, []);

  return { playSound };
}
