/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';

export type FeedbackType = 'tap' | 'completed_dhikr' | 'completed_category';

/**
 * Custom hook for audio and haptic feedback during dhikr recitation and tasbeeh
 */
export function useAdhkarFeedback(soundEnabled: boolean = true) {
  const triggerFeedback = useCallback(
    (type: FeedbackType = 'tap') => {
      // Haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          if (type === 'tap') navigator.vibrate(15);
          else if (type === 'completed_dhikr') navigator.vibrate([45, 65, 45]);
          else if (type === 'completed_category') navigator.vibrate([90, 55, 90, 55, 130]);
        } catch {
          // Ignore vibration errors if not supported or disallowed
        }
      }

      // Audio feedback using Web Audio API synthesis
      if (typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (soundEnabled && AudioContextClass) {
        try {
          const ctx = new AudioContextClass();
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          if (type === 'completed_category') {
            const osc2 = ctx.createOscillator();
            const osc3 = ctx.createOscillator();
            osc2.connect(gain);
            osc3.connect(gain);
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc2.frequency.setValueAtTime(659.25, ctx.currentTime);
            osc3.frequency.setValueAtTime(783.99, ctx.currentTime);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.start();
            osc2.start();
            osc3.start();
            osc.stop(ctx.currentTime + 0.6);
            osc2.stop(ctx.currentTime + 0.6);
            osc3.stop(ctx.currentTime + 0.6);
          } else if (type === 'completed_dhikr') {
            osc.frequency.setValueAtTime(659.25, ctx.currentTime);
            osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
          } else {
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            gain.gain.setValueAtTime(0.03, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
          }
        } catch (e) {
          console.error('Audio feedback error', e);
        }
      }
    },
    [soundEnabled]
  );

  return { triggerFeedback };
}

export default useAdhkarFeedback;
