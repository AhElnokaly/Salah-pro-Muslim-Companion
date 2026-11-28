/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCustomAlarmNativeKey,
  buildNativePrayerTimeAlarms,
  RingDiagnosticEvent,
} from '../services/athanAlarmPlugin';
import { AlarmConfig } from '../types';
import {
  computeCustomAlarmScheduledMs,
  findNativeCustomFireMatch,
  floorToMinuteMs,
  readRingLogWithTimeout,
  RING_DIAG_READ_TIMEOUT_MS,
} from './customAlarmReplayGuard';

describe('customAlarmReplayGuard - Key Builder Parity & Pure Matching', () => {
  it('buildCustomAlarmNativeKey produces identical output to buildNativePrayerTimeAlarms for relative, fixed, and snooze keys', () => {
    const futureDay = new Date(Date.now() + 2 * 86_400_000);
    futureDay.setHours(0, 0, 0, 0);
    const yyyy = futureDay.getFullYear();
    const mm = String(futureDay.getMonth() + 1).padStart(2, '0');
    const dd = String(futureDay.getDate()).padStart(2, '0');
    const fireDate = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = futureDay.getDay();

    const relativeAlarm: AlarmConfig = {
      id: 'custom_alarm_1794234903378',
      title: 'صلاة على النبي',
      enabled: true,
      type: 'prayer_relative',
      prayers: ['Dhuhr'],
      relation: 'before',
      offsetMinutes: 15,
      offsetUnit: 'minutes',
      days: [dayOfWeek],
      soundType: 'salawat',
      notifyMode: 'both',
    };

    const fixedAlarm: AlarmConfig = {
      id: 'custom_alarm_fixed_99',
      title: 'قيام',
      enabled: true,
      type: 'fixed',
      time: '04:15',
      days: [dayOfWeek],
      soundType: 'reminder',
      notifyMode: 'both',
    };

    const snoozeAlarm: AlarmConfig = {
      id: 'snooze_1795167360000',
      snoozeOf: 'custom_alarm_1794234903378',
      title: 'غفوة',
      enabled: true,
      type: 'fixed',
      oneShot: true,
      fireDate,
      time: '14:20',
      days: [dayOfWeek],
      soundType: 'salawat',
      notifyMode: 'both',
    };

    const builtAlarms = buildNativePrayerTimeAlarms(
      [{ date: futureDay, timesMap: { fajr: '05:00', dhuhr: '11:51', asr: '15:00', maghrib: '17:30', isha: '19:00' } }],
      undefined,
      {
        customAlarms: [relativeAlarm, fixedAlarm, snoozeAlarm],
        athanEnabledMap: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false },
      }
    );

    const relNative = builtAlarms.find((a) => a.alarmType === 'custom' && a.prayerKey.includes(relativeAlarm.id));
    const fixedNative = builtAlarms.find((a) => a.alarmType === 'custom' && a.prayerKey.includes(fixedAlarm.id));
    const snoozeNative = builtAlarms.find((a) => a.alarmType === 'custom' && a.prayerKey.includes(snoozeAlarm.id));

    assert.ok(relNative, 'Expected relative native alarm to be built');
    assert.ok(fixedNative, 'Expected fixed native alarm to be built');
    assert.ok(snoozeNative, 'Expected snooze native alarm to be built');

    assert.equal(
      buildCustomAlarmNativeKey({ alarmId: relativeAlarm.id, timeMs: relNative.timeMs, targetPrayer: 'Dhuhr' }),
      relNative.prayerKey
    );
    assert.equal(
      buildCustomAlarmNativeKey({ alarmId: fixedAlarm.id, timeMs: fixedNative.timeMs }),
      fixedNative.prayerKey
    );
    assert.equal(
      buildCustomAlarmNativeKey({ alarmId: snoozeAlarm.id, timeMs: snoozeNative.timeMs, snoozeOf: snoozeAlarm.snoozeOf }),
      snoozeNative.prayerKey
    );
  });

  it('computeCustomAlarmScheduledMs matches timeMs embedded in buildNativePrayerTimeAlarms keys for relative (before/after), fixed, and snooze alarms', () => {
    const futureDay = new Date(Date.now() + 2 * 86_400_000);
    futureDay.setHours(0, 0, 0, 0);
    const yyyy = futureDay.getFullYear();
    const mm = String(futureDay.getMonth() + 1).padStart(2, '0');
    const dd = String(futureDay.getDate()).padStart(2, '0');
    const fireDate = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = futureDay.getDay();
    const prayerTimesMap = { fajr: '05:00', dhuhr: '11:51', asr: '15:00', maghrib: '17:30', isha: '19:00' };

    const relBeforeAlarm: AlarmConfig = {
      id: 'parity_rel_before',
      title: 'قبل الظهر',
      enabled: true,
      type: 'prayer_relative',
      prayers: ['Dhuhr'],
      relation: 'before',
      offsetMinutes: 15,
      offsetUnit: 'minutes',
      days: [dayOfWeek],
      soundType: 'salawat',
      notifyMode: 'both',
    };

    const relAfterAlarm: AlarmConfig = {
      id: 'parity_rel_after',
      title: 'بعد العصر',
      enabled: true,
      type: 'prayer_relative',
      prayers: ['Asr'],
      relation: 'after',
      offsetMinutes: 20,
      offsetUnit: 'minutes',
      days: [dayOfWeek],
      soundType: 'reminder',
      notifyMode: 'both',
    };

    const fixedAlarm: AlarmConfig = {
      id: 'parity_fixed',
      title: 'قيام',
      enabled: true,
      type: 'fixed',
      time: '04:15',
      days: [dayOfWeek],
      soundType: 'reminder',
      notifyMode: 'both',
    };

    const snoozeAlarm: AlarmConfig = {
      id: 'snooze_parity_123',
      snoozeOf: 'parity_rel_before',
      title: 'غفوة',
      enabled: true,
      type: 'fixed',
      oneShot: true,
      fireDate,
      time: '14:20',
      days: [dayOfWeek],
      soundType: 'salawat',
      notifyMode: 'both',
    };

    const builtAlarms = buildNativePrayerTimeAlarms(
      [{ date: futureDay, timesMap: prayerTimesMap }],
      undefined,
      {
        customAlarms: [relBeforeAlarm, relAfterAlarm, fixedAlarm, snoozeAlarm],
        athanEnabledMap: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false },
      }
    );

    const extractEmbeddedTimeMs = (prayerKey: string): number => {
      const idx = prayerKey.lastIndexOf('_');
      assert.ok(idx > 0, `Expected trailing _timeMs in ${prayerKey}`);
      return Number(prayerKey.slice(idx + 1));
    };

    const nativeBefore = builtAlarms.find((a) => a.alarmType === 'custom' && a.prayerKey.includes(relBeforeAlarm.id));
    const nativeAfter = builtAlarms.find((a) => a.alarmType === 'custom' && a.prayerKey.includes(relAfterAlarm.id));
    const nativeFixed = builtAlarms.find((a) => a.alarmType === 'custom' && a.prayerKey.includes(fixedAlarm.id));
    const nativeSnooze = builtAlarms.find((a) => a.alarmType === 'custom' && a.prayerKey.includes(snoozeAlarm.id));

    assert.ok(nativeBefore && nativeAfter && nativeFixed && nativeSnooze);

    assert.equal(computeCustomAlarmScheduledMs(relBeforeAlarm, futureDay, prayerTimesMap.dhuhr), extractEmbeddedTimeMs(nativeBefore.prayerKey));
    assert.equal(computeCustomAlarmScheduledMs(relAfterAlarm, futureDay, prayerTimesMap.asr), extractEmbeddedTimeMs(nativeAfter.prayerKey));
    assert.equal(computeCustomAlarmScheduledMs(fixedAlarm, futureDay), extractEmbeddedTimeMs(nativeFixed.prayerKey));
    assert.equal(computeCustomAlarmScheduledMs(snoozeAlarm, futureDay), extractEmbeddedTimeMs(nativeSnooze.prayerKey));
  });

  it('returns null when prayer-relative alarm crosses midnight or prayer time is missing', () => {
    const checkDate = new Date(2026, 10, 20, 0, 20, 0, 0);

    const beforeMidnightAlarm: AlarmConfig = {
      id: 'custom_cross_before',
      title: 'قبل الفجر',
      enabled: true,
      type: 'prayer_relative',
      prayers: ['Fajr'],
      relation: 'before',
      offsetMinutes: 30,
      days: [0, 1, 2, 3, 4, 5, 6],
      soundType: 'reminder',
    };
    assert.equal(computeCustomAlarmScheduledMs(beforeMidnightAlarm, checkDate, '00:10'), null);

    const afterMidnightAlarm: AlarmConfig = {
      id: 'custom_cross_after',
      title: 'بعد العشاء',
      enabled: true,
      type: 'prayer_relative',
      prayers: ['Isha'],
      relation: 'after',
      offsetMinutes: 30,
      days: [0, 1, 2, 3, 4, 5, 6],
      soundType: 'reminder',
    };
    assert.equal(computeCustomAlarmScheduledMs(afterMidnightAlarm, checkDate, '23:45'), null);
    assert.equal(computeCustomAlarmScheduledMs(afterMidnightAlarm, checkDate, undefined), null);
    assert.equal(computeCustomAlarmScheduledMs(afterMidnightAlarm, checkDate, ''), null);
  });

  it('matches custom_notif_post with minute flooring, counts silent=true, and ignores receiver_on_receive alone', () => {
    const scheduledLocalMs = new Date(2026, 10, 20, 11, 36, 0, 0).getTime();
    const expectedMinuteMs = floorToMinuteMs(scheduledLocalMs);
    const expectedKey = buildCustomAlarmNativeKey({
      alarmId: 'custom_alarm_1794234903378',
      timeMs: expectedMinuteMs,
      targetPrayer: 'dhuhr',
    });

    const receiverOnly: RingDiagnosticEvent[] = [
      {
        timeMs: scheduledLocalMs + 100,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: expectedKey,
        stage: 'receiver_on_receive',
        details: 'requestCode=1001, soundType=salawat',
      },
    ];
    assert.equal(findNativeCustomFireMatch(receiverOnly, expectedKey), null);

    const subMinuteKey = `custom_custom_alarm_1794234903378_dhuhr_${expectedMinuteMs + 420}`;
    const silentNotifPost: RingDiagnosticEvent[] = [
      {
        timeMs: scheduledLocalMs + 224,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: subMinuteKey,
        stage: 'custom_notif_post',
        details: 'soundType=salawat, notifyMode=both, channelId=salah_custom_alarms_silent, isKhushuActive=true, silent=true',
      },
    ];
    const matched = findNativeCustomFireMatch(silentNotifPost, expectedKey);
    assert.ok(matched);
    assert.equal(matched.alarmId, subMinuteKey);
  });

  it('readRingLogWithTimeout exposes named 500ms timeout constant and fails open on throw or hang', async () => {
    assert.equal(RING_DIAG_READ_TIMEOUT_MS, 500);

    const onThrow = await readRingLogWithTimeout(async () => {
      throw new Error('Bridge error');
    }, 50);
    assert.deepEqual(onThrow, []);

    const onTimeout = await readRingLogWithTimeout(
      () => new Promise<RingDiagnosticEvent[]>(() => {}),
      20
    );
    assert.deepEqual(onTimeout, []);
  });
});
