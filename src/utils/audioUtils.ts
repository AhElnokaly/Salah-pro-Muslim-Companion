/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Safely stops an HTMLAudioElement without triggering onerror/onended fallbacks.
 * Clears event listeners, pauses playback, removes the src attribute, and calls load().
 */
export function stopAudioSafely(audio: HTMLAudioElement | null | undefined): void {
  if (!audio) return;
  try {
    audio.onerror = null;
    audio.onended = null;
    audio.onstalled = null;
    audio.onplay = null;
    audio.onpause = null;
    audio.ontimeupdate = null;
    audio.ondurationchange = null;
    audio.onloadedmetadata = null;
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      // In some environments, resetting currentTime after pause may throw if no src
    }
    if (typeof audio.removeAttribute === 'function') {
      audio.removeAttribute('src');
    } else {
      audio.src = '';
    }
    if (typeof audio.load === 'function') {
      audio.load();
    }
  } catch (e) {
    console.warn('[audioUtils] Error in stopAudioSafely:', e);
  }
}
