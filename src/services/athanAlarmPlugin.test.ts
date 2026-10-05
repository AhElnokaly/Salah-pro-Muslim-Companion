import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  chunkBinaryData,
  ATHAN_CHUNK_SIZE,
  setAthanPluginBridgeForTesting,
  syncPrayerMuezzinsToNative,
  NativeAthanPathsMap,
} from './athanAlarmPlugin';
import { safeSetItem, safeRemoveItem } from '../utils/storage';

// Ensure localStorage mock exists for node test environment
class MockStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number { return this.store.size; }
  clear(): void { this.store.clear(); }
  getItem(key: string): string | null { return this.store.has(key) ? this.store.get(key)! : null; }
  key(index: number): string | null { return Array.from(this.store.keys())[index] ?? null; }
  removeItem(key: string): void { this.store.delete(key); }
  setItem(key: string, value: string): void { this.store.set(key, String(value)); }
}

if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = new MockStorage();
}

describe('TASK 4: Native athan file bridge (Kotlin + JS)', () => {
  beforeEach(() => {
    // Clear storage keys
    const keysToClean = [
      'salah_general_muezzin',
      'salah_fajr_muezzin',
      'salah_muezzin_Fajr',
      'salah_muezzin_Dhuhr',
      'salah_muezzin_Asr',
      'salah_muezzin_Maghrib',
      'salah_muezzin_Isha',
      'salah_native_athan_fajr_default',
      'salah_native_athan_prayer_default',
      'salah_native_athan_path_fajr_default',
      'salah_native_athan_path_prayer_default',
      'salah_native_athan_custom_offline',
      'salah_native_athan_path_custom_offline',
    ];
    for (const k of keysToClean) {
      safeRemoveItem(k);
    }
  });

  afterEach(() => {
    setAthanPluginBridgeForTesting(null);
  });

  test('chunkBinaryData correctly slices bytes into 512KB chunks with accurate index and isLast', () => {
    // Create a 1.2 MB buffer (1,258,291 bytes)
    const totalBytes = 1024 * 1024 + 200 * 1024; // 1,228,800 bytes
    const buffer = new Uint8Array(totalBytes);
    for (let i = 0; i < totalBytes; i++) {
      buffer[i] = i % 256;
    }

    const chunks = chunkBinaryData(buffer, ATHAN_CHUNK_SIZE);
    // Expected chunks: 1,228,800 / 524,288 = 2.34 -> 3 chunks
    assert.equal(chunks.length, 3, 'Must produce exactly 3 chunks for 1.2MB');

    assert.equal(chunks[0].index, 0);
    assert.equal(chunks[0].isLast, false);

    assert.equal(chunks[1].index, 1);
    assert.equal(chunks[1].isLast, false);

    assert.equal(chunks[2].index, 2);
    assert.equal(chunks[2].isLast, true);

    // Verify non-empty base64 strings
    for (const chunk of chunks) {
      assert.ok(chunk.chunkBase64.length > 0, 'Chunk base64 must not be empty');
    }
  });

  test('chunkBinaryData handles empty buffer gracefully', () => {
    const empty = new Uint8Array(0);
    const chunks = chunkBinaryData(empty);
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].index, 0);
    assert.equal(chunks[0].isLast, true);
    assert.equal(chunks[0].chunkBase64, '');
  });

  test('syncPrayerMuezzinsToNative dedupes transfers by muezzin id and produces correct paths map shape', async () => {
    // Fajr uses 'fajr_default', other 4 prayers + general use 'prayer_default'
    safeSetItem('salah_fajr_muezzin', 'fajr_default');
    safeSetItem('salah_general_muezzin', 'prayer_default');

    const savedChunks: { muezzinId: string; index: number; isLast: boolean }[] = [];
    let receivedPaths: NativeAthanPathsMap | undefined;

    const mockPlugin = {
      saveAthanFileChunk: async (options: {
        muezzinId: string;
        chunkBase64: string;
        index: number;
        isLast: boolean;
      }) => {
        savedChunks.push({
          muezzinId: options.muezzinId,
          index: options.index,
          isLast: options.isLast,
        });
        return {
          path: `/data/user/0/com.salahpro.app/files/athan/${options.muezzinId}.audio`,
          saved: true,
          chunk: options.index,
        };
      },
      setNativeAthanFiles: async (options: { paths?: NativeAthanPathsMap }) => {
        receivedPaths = options.paths;
        return { saved: true };
      },
      getNativeAthanFiles: async () => ({
        general: { path: '', exists: false, sizeBytes: 0 },
        fajr: { path: '', exists: false, sizeBytes: 0 },
        dhuhr: { path: '', exists: false, sizeBytes: 0 },
        asr: { path: '', exists: false, sizeBytes: 0 },
        maghrib: { path: '', exists: false, sizeBytes: 0 },
        isha: { path: '', exists: false, sizeBytes: 0 },
      }),
    };

    setAthanPluginBridgeForTesting(mockPlugin as any);

    // Mock global fetch for local bundled audio
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any) => {
      // Return a dummy 20KB audio blob
      const dummyData = new Uint8Array(20 * 1024);
      return new Response(dummyData, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      });
    };

    try {
      const paths = await syncPrayerMuezzinsToNative();

      assert.ok(paths, 'Sync result must not be null');

      // Verify deduplication: only 2 unique muezzins ('fajr_default' and 'prayer_default') should be sent
      const transferredMuezzins = Array.from(new Set(savedChunks.map(c => c.muezzinId)));
      assert.deepEqual(
        transferredMuezzins.sort(),
        ['fajr_default', 'prayer_default'].sort(),
        'Only distinct muezzins should be transferred via bridge'
      );

      // Verify paths map shape
      assert.ok(receivedPaths, 'setNativeAthanFiles must be called with paths');
      assert.equal(typeof receivedPaths?.fajr, 'string');
      assert.equal(typeof receivedPaths?.dhuhr, 'string');
      assert.equal(typeof receivedPaths?.asr, 'string');
      assert.equal(typeof receivedPaths?.maghrib, 'string');
      assert.equal(typeof receivedPaths?.isha, 'string');
      assert.equal(typeof receivedPaths?.general, 'string');

      assert.ok(receivedPaths!.fajr!.includes('fajr_default.audio'));
      assert.ok(receivedPaths!.dhuhr!.includes('prayer_default.audio'));
      assert.ok(receivedPaths!.general!.includes('prayer_default.audio'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('syncPrayerMuezzinsToNative skips re-sending when native already has the same muezzin id (size marker matches)', async () => {
    safeSetItem('salah_fajr_muezzin', 'fajr_default');
    safeSetItem('salah_general_muezzin', 'prayer_default');

    let chunkCalls = 0;
    const mockPlugin = {
      saveAthanFileChunk: async (options: any) => {
        chunkCalls++;
        return {
          path: `/data/user/0/com.salahpro.app/files/athan/${options.muezzinId}.audio`,
          saved: true,
          chunk: options.index,
        };
      },
      setNativeAthanFiles: async () => ({ saved: true }),
      getNativeAthanFiles: async () => ({
        general: { path: '/data/user/0/com.salahpro.app/files/athan/prayer_default.audio', exists: true, sizeBytes: 20480 },
        fajr: { path: '/data/user/0/com.salahpro.app/files/athan/fajr_default.audio', exists: true, sizeBytes: 20480 },
        dhuhr: { path: '', exists: false, sizeBytes: 0 },
        asr: { path: '', exists: false, sizeBytes: 0 },
        maghrib: { path: '', exists: false, sizeBytes: 0 },
        isha: { path: '', exists: false, sizeBytes: 0 },
      }),
    };

    setAthanPluginBridgeForTesting(mockPlugin as any);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      const dummyData = new Uint8Array(20 * 1024);
      return new Response(dummyData, { status: 200 });
    };

    try {
      // First sync: transfers files and sets markers
      await syncPrayerMuezzinsToNative();
      const firstCalls = chunkCalls;
      assert.ok(firstCalls > 0, 'First sync should transfer chunks');

      // Second sync: markers exist, so chunk calls should NOT increase
      await syncPrayerMuezzinsToNative();
      assert.equal(chunkCalls, firstCalls, 'Second sync must reuse existing files and make zero chunk calls');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('syncPrayerMuezzinsToNative skips prayer when offline and audio is not local', async () => {
    // Set a prayer to use an online remote track
    safeSetItem('salah_muezzin_Isha', 'makkah'); // Online URL

    let setNativeFilesCalledWith: NativeAthanPathsMap | undefined;

    const mockPlugin = {
      saveAthanFileChunk: async (options: any) => {
        return {
          path: `/data/user/0/com.salahpro.app/files/athan/${options.muezzinId}.audio`,
          saved: true,
        };
      },
      setNativeAthanFiles: async (options: { paths?: NativeAthanPathsMap }) => {
        setNativeFilesCalledWith = options.paths;
        return { saved: true };
      },
      getNativeAthanFiles: async () => null,
    };

    setAthanPluginBridgeForTesting(mockPlugin as any);

    // Simulate offline
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: false },
      configurable: true,
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any) => {
      if (typeof url === 'string' && url.startsWith('http')) {
        throw new TypeError('Failed to fetch (offline)');
      }
      return new Response(new Uint8Array(20480), { status: 200 });
    };

    try {
      const paths = await syncPrayerMuezzinsToNative();
      assert.ok(paths, 'Sync should complete gracefully');
      // Isha was set to online track 'makkah', which cannot be fetched offline
      assert.equal(paths?.isha, undefined, 'Isha must be skipped when offline with undownloaded track');
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
      globalThis.fetch = originalFetch;
    }
  });
});
