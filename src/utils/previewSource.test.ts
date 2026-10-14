/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePreviewSource, describePreviewSource } from './previewSource';

const FALLBACKS = { fajr: '/audio/fajr-default.mp3', general: '/audio/prayer-default.mp3' };
const REMOTE = 'https://archive.org/download/x/041--.mp3';

describe('FIX 1a - local-first preview source', () => {
  test('bundled url is used as-is and the resolver is never called', async () => {
    let calls = 0;
    const r = await resolvePreviewSource({ id: 'b', url: '/audio/adhan.mp3' }, false, async () => { calls++; return ''; }, FALLBACKS);
    assert.deepEqual(r, { src: '/audio/adhan.mp3', kind: 'bundled' });
    assert.equal(calls, 0);
  });

  test('remote muezzin with a cached copy plays the local blob (offline case)', async () => {
    const r = await resolvePreviewSource({ id: 'archive_041', url: REMOTE }, false, async () => 'blob:abc', FALLBACKS);
    assert.deepEqual(r, { src: 'blob:abc', kind: 'local' });
  });

  test('remote muezzin without a cached copy streams the network url', async () => {
    const r = await resolvePreviewSource({ id: 'archive_041', url: REMOTE }, false, async (u) => u, FALLBACKS);
    assert.deepEqual(r, { src: REMOTE, kind: 'remote' });
  });

  test('resolver receives url, track id and isFajr so the cache key matches', async () => {
    let args: unknown[] = [];
    await resolvePreviewSource({ id: 'archive_042', url: REMOTE }, true, async (...a) => { args = a; return 'blob:x'; }, FALLBACKS);
    assert.deepEqual(args, [REMOTE, 'archive_042', true]);
  });

  test('db:// track resolves through the same path', async () => {
    const r = await resolvePreviewSource({ id: 'custom_1', url: 'db://custom_1' }, false, async () => 'blob:custom', FALLBACKS);
    assert.deepEqual(r, { src: 'blob:custom', kind: 'local' });
  });

  test('resolver failure falls back to the bundled default, per prayer type', async () => {
    const boom = async () => { throw new Error('offline'); };
    assert.deepEqual(await resolvePreviewSource({ id: 'a', url: REMOTE }, true, boom, FALLBACKS), { src: '/audio/fajr-default.mp3', kind: 'default' });
    assert.deepEqual(await resolvePreviewSource({ id: 'a', url: REMOTE }, false, boom, FALLBACKS), { src: '/audio/prayer-default.mp3', kind: 'default' });
  });

  test('resolver returning a bundled fallback or empty is reported as default', async () => {
    assert.equal((await resolvePreviewSource({ id: 'a', url: REMOTE }, false, async () => '/audio/prayer-default.mp3', FALLBACKS)).kind, 'default');
    assert.equal((await resolvePreviewSource({ id: 'a', url: REMOTE }, false, async () => '', FALLBACKS)).kind, 'default');
  });

  test('missing track or empty url uses the default and skips the resolver', async () => {
    let calls = 0;
    const res = async () => { calls++; return 'x'; };
    assert.deepEqual(await resolvePreviewSource(undefined, true, res, FALLBACKS), { src: '/audio/fajr-default.mp3', kind: 'default' });
    assert.deepEqual(await resolvePreviewSource({ id: 'a', url: '  ' }, false, res, FALLBACKS), { src: '/audio/prayer-default.mp3', kind: 'default' });
    assert.equal(calls, 0);
  });

  test('offline with a cached copy still plays the local blob', async () => {
    const r = await resolvePreviewSource({ id: 'archive_041', url: REMOTE }, false, async () => 'blob:cached', FALLBACKS, false);
    assert.deepEqual(r, { src: 'blob:cached', kind: 'local' });
  });

  test('offline without a cached copy goes straight to the default, per prayer type', async () => {
    const echo = async (u: string) => u; // getAudioUrl returns the https url even when offline
    assert.deepEqual(await resolvePreviewSource({ id: 'a', url: REMOTE }, true, echo, FALLBACKS, false), { src: '/audio/fajr-default.mp3', kind: 'default' });
    assert.deepEqual(await resolvePreviewSource({ id: 'a', url: REMOTE }, false, echo, FALLBACKS, false), { src: '/audio/prayer-default.mp3', kind: 'default' });
  });

  test('online without a cached copy still streams the network url (isOnline defaults to true)', async () => {
    const echo = async (u: string) => u;
    assert.deepEqual(await resolvePreviewSource({ id: 'a', url: REMOTE }, false, echo, FALLBACKS, true), { src: REMOTE, kind: 'remote' });
    assert.deepEqual(await resolvePreviewSource({ id: 'a', url: REMOTE }, false, echo, FALLBACKS), { src: REMOTE, kind: 'remote' });
  });

  test('offline never changes a bundled url', async () => {
    let calls = 0;
    const r = await resolvePreviewSource({ id: 'b', url: '/audio/adhan.mp3' }, false, async () => { calls++; return ''; }, FALLBACKS, false);
    assert.deepEqual(r, { src: '/audio/adhan.mp3', kind: 'bundled' });
    assert.equal(calls, 0);
  });

  test('source labels are user-readable', () => {
    assert.equal(describePreviewSource('local'), 'من التخزين المحلي');
    assert.equal(describePreviewSource('remote'), 'من الإنترنت');
    assert.equal(describePreviewSource('bundled'), 'الصوت المدمج');
    assert.equal(describePreviewSource('default'), 'الصوت الافتراضي لأن المؤذن المختار غير متاح');
    assert.notEqual(describePreviewSource('bundled'), describePreviewSource('default'));
  });
});
