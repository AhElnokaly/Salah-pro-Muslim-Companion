/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { stopAudioSafely } from '../../utils/audioUtils';

describe('TASK 1b - Preview Race Condition Protection', () => {
  test('fake audio whose play() stays pending; second tap must stop it, then reject with AbortError; assert no src assignment and no play() afterwards', async () => {
    let playCallCount = 0;
    let playingPrayer: string | null = null;
    let previewAudio: any = null;
    let previewReq = 0;
    let fallbackAssignedCount = 0;

    let rejectPlayPromise: ((err: any) => void) | null = null;

    // Simulate handleRowTogglePlay matching PrayerTimesView
    const handleTogglePlay = async (pName: string, remoteUrl: string) => {
      const req = ++previewReq;

      if (playingPrayer === pName) {
        previewReq++;
        if (previewAudio) {
          stopAudioSafely(previewAudio);
          previewAudio = null;
        }
        playingPrayer = null;
        return;
      }

      if (previewAudio) {
        stopAudioSafely(previewAudio);
        previewAudio = null;
      }

      // Immediately mark playingPrayer so second tap hits stop branch
      playingPrayer = pName;

      let finalSrc = remoteUrl;
      const fakeAudio = {
        src: finalSrc,
        currentTime: 0,
        volume: 1,
        onerror: null as any,
        onended: null as any,
        onstalled: null as any,
        pause() {},
        removeAttribute(attr: string) {
          if (attr === 'src') {
            this.src = '';
          }
        },
        load() {},
        play() {
          playCallCount++;
          return new Promise<void>((_, reject) => {
            rejectPlayPromise = reject;
          });
        }
      };

      previewAudio = fakeAudio;

      try {
        await fakeAudio.play();
        if (req !== previewReq || previewAudio !== fakeAudio) return;
        playingPrayer = pName;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        if (req !== previewReq || previewAudio !== fakeAudio) return;

        // Fallback logic
        fallbackAssignedCount++;
        fakeAudio.src = '/audio/fallback.mp3';
        fakeAudio.play();
      }
    };

    // 1. First tap: start preview of Fajr
    const playPromise = handleTogglePlay('Fajr', 'https://remote.example/fajr.mp3');

    // Assert immediately marked as playing before await completes
    assert.equal(playingPrayer, 'Fajr', 'setPlayingPrayer must be called immediately');
    assert.equal(playCallCount, 1, 'First play() initiated');

    // 2. Second tap while play() is still pending: should hit stop branch
    await handleTogglePlay('Fajr', 'https://remote.example/fajr.mp3');

    assert.equal(playingPrayer, null, 'playingPrayer must be reset to null on stop');
    assert.equal(previewAudio, null, 'previewAudio must be cleared on stop');

    // 3. Now the original pending play() rejects with AbortError (simulating browser pause abort)
    const abortErr = new Error('The play() request was interrupted by a call to pause().');
    abortErr.name = 'AbortError';
    const rejectFn = rejectPlayPromise as ((err: any) => void) | null;
    if (rejectFn) {
      rejectFn(abortErr);
    }

    await playPromise;

    // 4. Assert no fallback assigned and play() was NEVER called again afterwards
    assert.equal(fallbackAssignedCount, 0, 'Fallback must not be assigned when AbortError occurs');
    assert.equal(playCallCount, 1, 'play() must not be called again after stop');
    assert.equal(playingPrayer, null, 'playingPrayer must remain null');
  });

  test('rapid switching between prayers cancels earlier pending play without triggering fallback', async () => {
    let playCallCount = 0;
    let playingPrayer: string | null = null;
    let previewAudio: any = null;
    let previewReq = 0;
    let fallbackAssigned = false;

    let rejectFajr: ((err: any) => void) | null = null;
    let resolveDhuhr: (() => void) | null = null;

    const handleTogglePlay = async (pName: string, remoteUrl: string) => {
      const req = ++previewReq;

      if (playingPrayer === pName) {
        previewReq++;
        if (previewAudio) {
          stopAudioSafely(previewAudio);
          previewAudio = null;
        }
        playingPrayer = null;
        return;
      }

      if (previewAudio) {
        stopAudioSafely(previewAudio);
        previewAudio = null;
      }

      playingPrayer = pName;

      let finalSrc = remoteUrl;
      const fakeAudio = {
        src: finalSrc,
        currentTime: 0,
        volume: 1,
        onerror: null as any,
        onended: null as any,
        pause() {},
        removeAttribute(attr: string) {
          if (attr === 'src') this.src = '';
        },
        load() {},
        play() {
          playCallCount++;
          if (pName === 'Fajr') {
            return new Promise<void>((_, reject) => {
              rejectFajr = reject;
            });
          }
          return new Promise<void>((resolve) => {
            resolveDhuhr = resolve;
          });
        }
      };

      previewAudio = fakeAudio;

      try {
        await fakeAudio.play();
        if (req !== previewReq || previewAudio !== fakeAudio) return;
        playingPrayer = pName;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        if (req !== previewReq || previewAudio !== fakeAudio) return;

        fallbackAssigned = true;
        fakeAudio.src = '/audio/fallback.mp3';
        fakeAudio.play();
      }
    };

    // Tap Fajr
    const fajrPromise = handleTogglePlay('Fajr', 'https://remote.example/fajr.mp3');
    assert.equal(playingPrayer, 'Fajr');

    // Immediately tap Dhuhr while Fajr play() is still pending
    const dhuhrPromise = handleTogglePlay('Dhuhr', 'https://remote.example/dhuhr.mp3');
    assert.equal(playingPrayer, 'Dhuhr');

    // Reject Fajr with AbortError
    const abortErr = new Error('Interrupted');
    abortErr.name = 'AbortError';
    const rejectFajrFn = rejectFajr as ((err: any) => void) | null;
    if (rejectFajrFn) rejectFajrFn(abortErr);
    await fajrPromise;

    // Resolve Dhuhr
    const resolveDhuhrFn = resolveDhuhr as (() => void) | null;
    if (resolveDhuhrFn) resolveDhuhrFn();
    await dhuhrPromise;

    assert.equal(fallbackAssigned, false, 'Fajr fallback must not trigger');
    assert.equal(playingPrayer, 'Dhuhr', 'Dhuhr must remain the active playing prayer');
  });

  test('onerror on stale discarded audio element does not trigger fallback', () => {
    let previewAudio: any = null;
    let previewReq = 0;
    let fallbackTriggered = false;

    // Simulate setup of audio 1
    const req1 = ++previewReq;
    const audio1 = {
      src: 'https://bad.example/track1.mp3',
      onerror: null as any,
      play() { return Promise.resolve(); }
    };
    previewAudio = audio1;

    audio1.onerror = () => {
      if (previewAudio !== audio1 || req1 !== previewReq) return;
      fallbackTriggered = true;
    };

    // User switches to audio 2 (stale req1)
    const req2 = ++previewReq;
    const audio2 = { src: 'https://good.example/track2.mp3' };
    previewAudio = audio2;

    // Stale audio1 onerror fires late
    audio1.onerror();

    assert.equal(fallbackTriggered, false, 'Late onerror on discarded audio must be ignored');
  });
});
