/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { stopAudioSafely } from './audioUtils';

describe('Audio Utils - stopAudioSafely', () => {
  test('clears all error and lifecycle listeners, pauses, and unloads audio', () => {
    let paused = false;
    let loaded = false;
    let removedSrc = false;

    const mockAudio = {
      src: 'https://archive.org/download/athan.mp3',
      onerror: () => {},
      onended: () => {},
      onstalled: () => {},
      onplay: () => {},
      onpause: () => {},
      ontimeupdate: () => {},
      ondurationchange: () => {},
      onloadedmetadata: () => {},
      pause() {
        paused = true;
      },
      removeAttribute(attr: string) {
        if (attr === 'src') {
          removedSrc = true;
          this.src = '';
        }
      },
      load() {
        loaded = true;
      },
      currentTime: 10,
    } as unknown as HTMLAudioElement;

    stopAudioSafely(mockAudio);

    assert.equal(mockAudio.onerror, null);
    assert.equal(mockAudio.onended, null);
    assert.equal(mockAudio.onstalled, null);
    assert.equal(mockAudio.onplay, null);
    assert.equal(mockAudio.onpause, null);
    assert.equal(mockAudio.ontimeupdate, null);
    assert.equal(paused, true);
    assert.equal(removedSrc, true);
    assert.equal(loaded, true);
  });

  test('stopping a preview whose src is a remote URL must NOT call audio.play() afterwards', () => {
    let playCallCount = 0;
    const remoteUrl = 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/016---2.mp3';

    // Simulate an Audio element like in PrayerTimesView preview
    const audio = {
      src: remoteUrl,
      currentTime: 15,
      onerror: null as ((ev: any) => any) | null,
      onended: null as ((ev: any) => any) | null,
      onstalled: null as ((ev: any) => any) | null,
      pause() {},
      play() {
        playCallCount++;
        return Promise.resolve();
      },
      removeAttribute(attr: string) {
        if (attr === 'src') {
          this.src = '';
          // If onerror was NOT cleared before removing src, browser would invoke onerror here
          if (typeof this.onerror === 'function') {
            this.onerror(new Event('error'));
          }
        }
      },
      load() {},
    } as unknown as HTMLAudioElement;

    // Attach the fallback handler (identical to PrayerTimesView:168-178)
    let finalSrc = remoteUrl;
    audio.onerror = () => {
      if (!finalSrc.startsWith('/audio/')) {
        const fallbackSrc = '/audio/prayer-default.mp3';
        finalSrc = fallbackSrc;
        audio.src = fallbackSrc;
        audio.play();
      }
    };

    // User presses stop
    stopAudioSafely(audio);

    // Assert that audio.play() was NEVER called afterwards
    assert.equal(playCallCount, 0, 'audio.play() must not be called after stopAudioSafely');
    assert.equal(audio.onerror, null, 'onerror must be nullified to prevent late execution');
    assert.notEqual(finalSrc, '/audio/prayer-default.mp3', 'finalSrc must not have transitioned to fallback');
  });

  test('handles null and undefined gracefully without throwing', () => {
    assert.doesNotThrow(() => stopAudioSafely(null));
    assert.doesNotThrow(() => stopAudioSafely(undefined));
  });
});
