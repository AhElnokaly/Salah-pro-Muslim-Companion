import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  chunkBinaryData,
  ATHAN_CHUNK_SIZE,
  setAthanPluginBridgeForTesting,
  syncPrayerMuezzinsToNative,
  NativeAthanPathsMap,
  buildNativePrayerTimeAlarms,
  DailyPrayerTimesEntry,
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
      const res = await syncPrayerMuezzinsToNative();

      assert.ok(res, 'Sync result must not be null');
      const paths = res.paths;

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

  test('TASK 4C: cached file (from listAthanCache) => zero fetch calls and immediate reuse', async () => {
    safeSetItem('salah_fajr_muezzin', 'fajr_default');
    safeSetItem('salah_general_muezzin', 'prayer_default');

    let fetchCalls = 0;
    const mockPlugin = {
      listAthanCache: async () => ({
        fajr_default: { exists: true, sizeBytes: 20480 },
        prayer_default: { exists: true, sizeBytes: 20480 },
      }),
      getNativeAthanFiles: async () => ({
        general: { path: '/data/user/0/com.salahpro.app/files/athan/prayer_default.audio', exists: true, sizeBytes: 20480 },
        fajr: { path: '/data/user/0/com.salahpro.app/files/athan/fajr_default.audio', exists: true, sizeBytes: 20480 },
        dhuhr: { path: '', exists: false, sizeBytes: 0 },
        asr: { path: '', exists: false, sizeBytes: 0 },
        maghrib: { path: '', exists: false, sizeBytes: 0 },
        isha: { path: '', exists: false, sizeBytes: 0 },
      }),
      saveAthanFileChunk: async () => ({ saved: true }),
      setNativeAthanFiles: async () => ({ saved: true }),
    };

    setAthanPluginBridgeForTesting(mockPlugin as any);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      fetchCalls++;
      return new Response(new Uint8Array(20480), { status: 200 });
    };

    try {
      const res = await syncPrayerMuezzinsToNative();
      assert.equal(fetchCalls, 0, 'Cached file in listAthanCache must make zero fetch calls');
      assert.ok(res.paths.fajr?.includes('fajr_default.audio'));
      assert.ok(res.paths.general?.includes('prayer_default.audio'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('TASK 4C: failed download keeps old path and returns failed item', async () => {
    // Isha was using an existing track
    safeSetItem('salah_muezzin_Isha', 'broken_track');

    let setNativeFilesCalledWith: NativeAthanPathsMap | undefined;
    const mockPlugin = {
      listAthanCache: async () => ({
        fajr_default: { exists: true, sizeBytes: 20480 },
        prayer_default: { exists: true, sizeBytes: 20480 },
      }),
      getNativeAthanFiles: async () => ({
        general: { path: '/data/user/0/com.salahpro.app/files/athan/prayer_default.audio', exists: true, sizeBytes: 20480 },
        fajr: { path: '/data/user/0/com.salahpro.app/files/athan/fajr_default.audio', exists: true, sizeBytes: 20480 },
        dhuhr: { path: '/data/user/0/com.salahpro.app/files/athan/prayer_default.audio', exists: true, sizeBytes: 20480 },
        asr: { path: '/data/user/0/com.salahpro.app/files/athan/prayer_default.audio', exists: true, sizeBytes: 20480 },
        maghrib: { path: '/data/user/0/com.salahpro.app/files/athan/prayer_default.audio', exists: true, sizeBytes: 20480 },
        isha: { path: '/data/user/0/com.salahpro.app/files/athan/old_working_isha.audio', exists: true, sizeBytes: 20480 },
      }),
      saveAthanFileChunk: async () => {
        throw new Error('Save error');
      },
      setNativeAthanFiles: async (options: { paths?: NativeAthanPathsMap }) => {
        setNativeFilesCalledWith = options.paths;
        return { saved: true };
      },
    };

    setAthanPluginBridgeForTesting(mockPlugin as any);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any) => {
      if (typeof url === 'string' && url.includes('broken')) {
        return new Response(null, { status: 500, statusText: 'Server Error' });
      }
      return new Response(new Uint8Array(20480), { status: 200 });
    };

    try {
      const res = await syncPrayerMuezzinsToNative();
      assert.ok(res.failed.length > 0, 'Must record failure in failed[]');
      assert.equal(res.failed[0].muezzinId, 'broken_track');
      // Failed download must retain previous working path in pathsMap
      assert.equal(
        setNativeFilesCalledWith?.isha,
        '/data/user/0/com.salahpro.app/files/athan/old_working_isha.audio',
        'Failed download must retain previously saved working path'
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('TASK 4C: offline sync sends no "" keys to native bridge', async () => {
    safeSetItem('salah_muezzin_Isha', 'makkah');

    let setNativeFilesCalledWith: NativeAthanPathsMap | undefined;
    const mockPlugin = {
      listAthanCache: async () => ({}),
      getNativeAthanFiles: async () => null,
      saveAthanFileChunk: async () => ({ saved: true }),
      setNativeAthanFiles: async (options: { paths?: NativeAthanPathsMap }) => {
        setNativeFilesCalledWith = options.paths;
        return { saved: true };
      },
    };

    setAthanPluginBridgeForTesting(mockPlugin as any);

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
      const res = await syncPrayerMuezzinsToNative();
      assert.ok(res, 'Sync should complete gracefully');
      // Verify no key in paths is empty string ""
      if (setNativeFilesCalledWith) {
        for (const [key, val] of Object.entries(setNativeFilesCalledWith)) {
          assert.notEqual(val, '', `Path for key ${key} must never be sent as empty string ""`);
        }
      }
      assert.ok(res.failed.some(f => f.reason === 'offline'));
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
      globalThis.fetch = originalFetch;
    }
  });

  test('TASK 4C: second call during in-flight triggers one re-run with latest selection', async () => {
    safeSetItem('salah_fajr_muezzin', 'fajr_default');
    safeSetItem('salah_general_muezzin', 'prayer_default');

    let syncExecutionCount = 0;
    const mockPlugin = {
      listAthanCache: async () => ({
        fajr_default: { exists: true, sizeBytes: 20480 },
        prayer_default: { exists: true, sizeBytes: 20480 },
        abdulbasit: { exists: true, sizeBytes: 20480 },
      }),
      getNativeAthanFiles: async () => ({
        general: { path: '/data/user/0/com.salahpro.app/files/athan/prayer_default.audio', exists: true, sizeBytes: 20480 },
        fajr: { path: '/data/user/0/com.salahpro.app/files/athan/fajr_default.audio', exists: true, sizeBytes: 20480 },
        dhuhr: { path: '/data/user/0/com.salahpro.app/files/athan/prayer_default.audio', exists: true, sizeBytes: 20480 },
        asr: { path: '', exists: false, sizeBytes: 0 },
        maghrib: { path: '', exists: false, sizeBytes: 0 },
        isha: { path: '', exists: false, sizeBytes: 0 },
      }),
      saveAthanFileChunk: async () => ({ saved: true }),
      setNativeAthanFiles: async () => {
        syncExecutionCount++;
        // Small delay to simulate async work
        await new Promise(r => setTimeout(r, 20));
        return { saved: true };
      },
    };

    setAthanPluginBridgeForTesting(mockPlugin as any);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(new Uint8Array(20480), { status: 200 });

    try {
      // Call 1
      const p1 = syncPrayerMuezzinsToNative();
      // Change selection while Call 1 is in-flight
      safeSetItem('salah_muezzin_Asr', 'abdulbasit');
      // Call 2
      const p2 = syncPrayerMuezzinsToNative();

      const [res1, res2] = await Promise.all([p1, p2]);
      assert.equal(syncExecutionCount, 2, 'In-flight collision must trigger exactly one re-run (2 executions total)');
      assert.ok(res2.paths.asr?.includes('abdulbasit.audio'), 'Second sync must reflect latest selection for Asr');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('TASK 6: Post-prayer alert vs Khushu collision & Same-minute priority', () => {
  const futureDate = new Date(Date.now() + 86400000 * 2); // 2 days in future
  const baseEntry: DailyPrayerTimesEntry = {
    date: futureDate,
    timesMap: {
      fajr: '05:00',
      dhuhr: '12:00',
      asr: '15:30',
      maghrib: '18:00',
      isha: '19:30',
    },
  };

  test('default offsets (iqama 15m, duration 15m): postalert (15m) moves from +15m to +30m (end of Khushu window)', () => {
    const alarms = buildNativePrayerTimeAlarms([baseEntry], undefined, {
      prayerPostAlert: true,
      postAlertMinutes: 15,
      khushuAutoWithIqama: true,
      khushuSettings: {
        autoWithIqama: true,
        defaultDurationMinutes: 15,
        iqamaOffsets: { fajr: 15, dhuhr: 15, asr: 15, maghrib: 15, isha: 15, friday: 25 },
        prayerDurations: { fajr: 15, dhuhr: 15, asr: 15, maghrib: 15, isha: 15, friday: 45 },
        preferredMode: 'silent',
        enableGentleHapticPulse: true,
        enableDistractionShield: true,
        enableEmergencyCallBypass: true,
        enablePostPrayerAthkar: true,
        enableFridaySpecial: true,
      },
    });

    const dhuhrAthan = alarms.find(a => a.prayerKey === 'Dhuhr' && a.alarmType === 'athan');
    const dhuhrPost = alarms.find(a => a.prayerKey === 'Dhuhr_postalert');
    const dhuhrKhushu = alarms.find(a => a.prayerKey === 'Dhuhr_khushu');

    assert.ok(dhuhrAthan && dhuhrPost && dhuhrKhushu);
    // Dhuhr is at 12:00
    // Khushu is at 12:15 with duration 15m (ends at 12:30)
    // Postalert should be shifted from 12:15 to 12:30 (30m after athan)
    assert.equal(dhuhrPost.timeMs, dhuhrAthan.timeMs + 30 * 60000, 'Postalert must be moved to the end of Khushu window (+30m)');
    assert.equal(dhuhrKhushu.timeMs, dhuhrAthan.timeMs + 15 * 60000);
  });

  test('custom offsets (iqama 10m, duration 20m): postalert at +15m collides and moves to +30m', () => {
    const alarms = buildNativePrayerTimeAlarms([baseEntry], undefined, {
      prayerPostAlert: true,
      postAlertMinutes: 15,
      khushuAutoWithIqama: true,
      khushuSettings: {
        autoWithIqama: true,
        defaultDurationMinutes: 15,
        iqamaOffsets: { fajr: 10, dhuhr: 10, asr: 10, maghrib: 10, isha: 10, friday: 25 },
        prayerDurations: { fajr: 20, dhuhr: 20, asr: 20, maghrib: 20, isha: 20, friday: 45 },
        preferredMode: 'silent',
        enableGentleHapticPulse: true,
        enableDistractionShield: true,
        enableEmergencyCallBypass: true,
        enablePostPrayerAthkar: true,
        enableFridaySpecial: true,
      },
    });

    const dhuhrAthan = alarms.find(a => a.prayerKey === 'Dhuhr' && a.alarmType === 'athan');
    const dhuhrPost = alarms.find(a => a.prayerKey === 'Dhuhr_postalert');

    assert.ok(dhuhrAthan && dhuhrPost);
    // Window is [12:10, 12:30). 12:15 is inside window -> shifted to 12:30.
    assert.equal(dhuhrPost.timeMs, dhuhrAthan.timeMs + 30 * 60000);
  });

  test('Khushu disabled (khushuAutoWithIqama: false): postalert stays at +15m without shifting', () => {
    const alarms = buildNativePrayerTimeAlarms([baseEntry], undefined, {
      prayerPostAlert: true,
      postAlertMinutes: 15,
      khushuAutoWithIqama: false,
    });

    const dhuhrAthan = alarms.find(a => a.prayerKey === 'Dhuhr' && a.alarmType === 'athan');
    const dhuhrPost = alarms.find(a => a.prayerKey === 'Dhuhr_postalert');

    assert.ok(dhuhrAthan && dhuhrPost);
    // Postalert remains at +15m
    assert.equal(dhuhrPost.timeMs, dhuhrAthan.timeMs + 15 * 60000);
  });

  test('Friday Dhuhr special case: (iqama 25m, duration 45m => window [25m, 70m]), postalert at 30m shifts to +70m', () => {
    // Construct a Friday date
    const fridayDate = new Date();
    fridayDate.setDate(fridayDate.getDate() + ((7 - fridayDate.getDay() + 5) % 7 || 7)); // Next Friday
    fridayDate.setHours(0, 0, 0, 0);

    const fridayEntry: DailyPrayerTimesEntry = {
      date: fridayDate,
      timesMap: {
        fajr: '05:00',
        dhuhr: '12:00',
        asr: '15:30',
        maghrib: '18:00',
        isha: '19:30',
      },
    };

    const alarms = buildNativePrayerTimeAlarms([fridayEntry], undefined, {
      prayerPostAlert: true,
      postAlertMinutes: 30, // 12:30 is inside [12:25, 13:10)
      khushuAutoWithIqama: true,
      khushuSettings: {
        autoWithIqama: true,
        defaultDurationMinutes: 15,
        iqamaOffsets: { fajr: 15, dhuhr: 15, asr: 15, maghrib: 15, isha: 15, friday: 25 },
        prayerDurations: { fajr: 15, dhuhr: 15, asr: 15, maghrib: 15, isha: 15, friday: 45 },
        preferredMode: 'silent',
        enableGentleHapticPulse: true,
        enableDistractionShield: true,
        enableEmergencyCallBypass: true,
        enablePostPrayerAthkar: true,
        enableFridaySpecial: true,
      },
    });

    const dhuhrAthan = alarms.find(a => a.prayerKey === 'Dhuhr' && a.alarmType === 'athan');
    const dhuhrPost = alarms.find(a => a.prayerKey === 'Dhuhr_postalert');

    assert.ok(dhuhrAthan && dhuhrPost);
    // 25m iqama + 45m duration = 70m
    assert.equal(dhuhrPost.timeMs, dhuhrAthan.timeMs + 70 * 60000, 'Friday Dhuhr postalert must shift to +70m');
  });

  test('Same-minute priority: athan > prealert > postalert > khushu > custom (lower priority gets +1 min)', () => {
    // Setup a custom alarm at exactly the same minute as Dhuhr athan (12:00)
    const customAtDhuhr = {
      id: 'custom_lunch',
      title: 'Lunch Reminder',
      enabled: true,
      type: 'fixed' as const,
      time: '12:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      soundType: 'beep' as const,
    };

    const alarms = buildNativePrayerTimeAlarms([baseEntry], undefined, {
      customAlarms: [customAtDhuhr],
    });

    const dhuhrAthan = alarms.find(a => a.prayerKey === 'Dhuhr' && a.alarmType === 'athan');
    const customAlarm = alarms.find(a => a.alarmType === 'custom' && a.prayerName === 'Lunch Reminder');

    assert.ok(dhuhrAthan && customAlarm);
    // Dhuhr athan has priority 1, custom has priority 5. Custom gets shifted to 12:01.
    assert.equal(customAlarm.timeMs, dhuhrAthan.timeMs + 60000, 'Custom alarm in same minute as athan must get shifted +1 min');
  });
});

describe('TASK 7: System pre/post prayer alerts sound selection and deduplication', () => {
  const futureDate = new Date(Date.now() + 86400000 * 2);
  const baseEntry: DailyPrayerTimesEntry = {
    date: futureDate,
    timesMap: {
      fajr: '05:00',
      dhuhr: '12:00',
      asr: '15:30',
      maghrib: '18:00',
      isha: '19:30',
    },
  };

  test('building native items with preAlertSound="hayya" yields soundType="hayya"; default is "reminder"', () => {
    const alarmsWithCustomSound = buildNativePrayerTimeAlarms([baseEntry], undefined, {
      prayerPreAlert: true,
      preAlertMinutes: 15,
      preAlertSound: 'hayya',
    });

    const preAlertItem = alarmsWithCustomSound.find(a => a.alarmType === 'prealert');
    assert.ok(preAlertItem, 'Prealert item should be present');
    assert.equal(preAlertItem.soundType, 'hayya');

    const alarmsWithDefaultSound = buildNativePrayerTimeAlarms([baseEntry], undefined, {
      prayerPreAlert: true,
      preAlertMinutes: 15,
    });
    const defaultPreAlertItem = alarmsWithDefaultSound.find(a => a.alarmType === 'prealert');
    assert.ok(defaultPreAlertItem);
    assert.equal(defaultPreAlertItem.soundType, 'reminder');
  });

  test('building native items with postAlertSound="ayat_kursi" yields soundType="ayat_kursi"; default is "reminder"', () => {
    const alarmsWithCustomSound = buildNativePrayerTimeAlarms([baseEntry], undefined, {
      prayerPostAlert: true,
      postAlertMinutes: 20,
      postAlertSound: 'ayat_kursi',
    });

    const postAlertItem = alarmsWithCustomSound.find(a => a.alarmType === 'postalert');
    assert.ok(postAlertItem, 'Postalert item should be present');
    assert.equal(postAlertItem.soundType, 'ayat_kursi');
  });

  test('with a custom alarm_before_salah present, no system prealert items are built', () => {
    const customBeforeAlarm = {
      id: 'alarm_before_salah',
      title: 'Custom Pre Salah',
      enabled: true,
      type: 'prayer_relative' as const,
      relation: 'before' as const,
      prayers: ['Dhuhr'] as any,
      offsetMinutes: 10,
      days: [0, 1, 2, 3, 4, 5, 6],
      soundType: 'hayya' as const,
    };

    const alarms = buildNativePrayerTimeAlarms([baseEntry], undefined, {
      prayerPreAlert: true,
      preAlertMinutes: 15,
      preAlertSound: 'reminder',
      customAlarms: [customBeforeAlarm],
    });

    const systemPreAlerts = alarms.filter(a => a.alarmType === 'prealert');
    assert.equal(systemPreAlerts.length, 0, 'System prealerts must not be scheduled when custom alarm_before_salah is present');

    const customPreAlerts = alarms.filter(a => a.alarmType === 'custom' && a.prayerKey.includes('alarm_before_salah'));
    assert.ok(customPreAlerts.length > 0, 'Custom before prayer alarm must be scheduled');
  });

  test('with a custom alarm_after_salah present, no system postalert items are built', () => {
    const customAfterAlarm = {
      id: 'alarm_after_salah',
      title: 'Custom Post Salah',
      enabled: true,
      type: 'prayer_relative' as const,
      relation: 'after' as const,
      prayers: ['Dhuhr'] as any,
      offsetMinutes: 15,
      days: [0, 1, 2, 3, 4, 5, 6],
      soundType: 'salawat' as const,
    };

    const alarms = buildNativePrayerTimeAlarms([baseEntry], undefined, {
      prayerPostAlert: true,
      postAlertMinutes: 15,
      customAlarms: [customAfterAlarm],
    });

    const systemPostAlerts = alarms.filter(a => a.alarmType === 'postalert');
    assert.equal(systemPostAlerts.length, 0, 'System postalerts must not be scheduled when custom alarm_after_salah is present');
  });
});
