import { useEffect } from 'react';

/**
 * Global Audio Unlocker on first user gesture
 * Silently plays a 1-sample data URI to unlock audio context on mobile web / iOS Safari
 */
export function useAudioUnlocker(): void {
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
        silentAudio.volume = 0.01;
        silentAudio.play().then(() => {
          console.log('[AudioUnlocker] Audio session successfully unlocked by user gesture.');
        }).catch(err => {
          console.warn('[AudioUnlocker] Could not unlock silent audio snippet:', err);
        });
      } catch (err) {
        console.warn('[AudioUnlocker] Exception during audio unlock:', err);
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);
}
