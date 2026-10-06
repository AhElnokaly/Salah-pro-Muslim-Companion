import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AlarmConfig } from '../../types';
import { buildNativePrayerTimeAlarms, DailyPrayerTimesEntry } from '../../services/athanAlarmPlugin';

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

describe('TASK 5: Custom Alarm Snooze & One-Shot Scheduling', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('onSnooze logic keeps original recurring alarm untouched and removes only older snooze of the same original', () => {
    const originalAlarm: AlarmConfig = {
      id: 'alarm_daily_quran',
      title: 'ورد القرآن اليومي',
      enabled: true,
      type: 'fixed',
      time: '14:30',
      days: [0, 1, 2, 3, 4, 5, 6],
      soundType: 'beep',
      notifyMode: 'both',
    };

    let customAlarms: AlarmConfig[] = [originalAlarm];

    // Helper simulating the onSnooze logic in AppModalOutlets.tsx
    const simulateSnooze = (ringing: AlarmConfig) => {
      const targetDate = new Date(Date.now() + 5 * 60 * 1000);
      const snoozeHours = targetDate.getHours().toString().padStart(2, '0');
      const snoozeMins = targetDate.getMinutes().toString().padStart(2, '0');
      const snoozeTime = `${snoozeHours}:${snoozeMins}`;
      const snoozeDay = targetDate.getDay();
      const fireYear = targetDate.getFullYear();
      const fireMonth = (targetDate.getMonth() + 1).toString().padStart(2, '0');
      const fireDayStr = targetDate.getDate().toString().padStart(2, '0');
      const fireDate = `${fireYear}-${fireMonth}-${fireDayStr}`;

      const rawTitle = ringing.title || 'منبه';
      const cleanTitle = rawTitle.replace(/\s*\(غفوة\)/g, '').trim();
      const originalId = ringing.snoozeOf || ringing.id;

      const snoozedAlarm: AlarmConfig = {
        id: `snooze_${Date.now()}`,
        title: `${cleanTitle} (غفوة)`,
        type: 'fixed',
        time: snoozeTime,
        days: [snoozeDay],
        enabled: true,
        soundType: ringing.soundType || 'reminder',
        notifyMode: ringing.notifyMode || 'both',
        oneShot: true,
        snoozeOf: originalId,
        fireDate,
      };

      const filtered = customAlarms.filter(a => {
        if (a.snoozeOf && a.snoozeOf === originalId) return false;
        if (a.id.startsWith('snooze_') && (a.id === ringing.id || a.snoozeOf === originalId)) return false;
        return true;
      });

      customAlarms = [...filtered, snoozedAlarm];
      return snoozedAlarm;
    };

    // First Snooze:
    const firstSnooze = simulateSnooze(originalAlarm);

    // 1. Verify original alarm is strictly preserved
    const foundOriginal = customAlarms.find(a => a.id === originalAlarm.id);
    assert.ok(foundOriginal, 'Original alarm must remain in customAlarms');
    assert.equal(foundOriginal?.title, 'ورد القرآن اليومي', 'Original title must not be modified or renamed');
    assert.equal(foundOriginal?.time, '14:30', 'Original time must not be modified');
    assert.deepEqual(foundOriginal?.days, [0, 1, 2, 3, 4, 5, 6], 'Original recurring days must remain intact');
    assert.equal(foundOriginal?.enabled, true, 'Original enabled state must be untouched');

    // 2. Verify snooze alarm properties
    assert.equal(customAlarms.length, 2, 'Should now have original alarm + 1 snooze alarm');
    assert.ok(firstSnooze.id.startsWith('snooze_'));
    assert.equal(firstSnooze.snoozeOf, originalAlarm.id);
    assert.equal(firstSnooze.oneShot, true);
    assert.ok(firstSnooze.fireDate);

    // Second Snooze (user snoozes the snooze):
    const secondSnooze = simulateSnooze(firstSnooze);

    // Verify older snooze was removed and only the newest snooze remains, along with original
    assert.equal(customAlarms.length, 2, 'Still exactly 2 alarms: original + newest snooze');
    assert.ok(!customAlarms.some(a => a.id === firstSnooze.id), 'Older snooze must be removed');
    assert.ok(customAlarms.some(a => a.id === secondSnooze.id), 'Newest snooze must be present');
    assert.ok(customAlarms.some(a => a.id === originalAlarm.id), 'Original alarm must still be present');
  });

  test('onStop dismisses and deletes snooze alarm without deleting the original alarm', () => {
    const originalAlarm: AlarmConfig = {
      id: 'alarm_evening_adhkar',
      title: 'أذكار المساء',
      enabled: true,
      type: 'fixed',
      time: '17:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      soundType: 'reminder',
    };

    const snoozeAlarm: AlarmConfig = {
      id: 'snooze_12345678',
      title: 'أذكار المساء (غفوة)',
      enabled: true,
      type: 'fixed',
      time: '17:05',
      days: [1],
      soundType: 'reminder',
      oneShot: true,
      snoozeOf: 'alarm_evening_adhkar',
      fireDate: '2026-10-05',
    };

    let customAlarms: AlarmConfig[] = [originalAlarm, snoozeAlarm];

    // Simulate onStop when snooze alarm rings
    const simulateStop = (ringing: AlarmConfig) => {
      if (ringing.oneShot || ringing.snoozeOf || ringing.id.startsWith('snooze_')) {
        customAlarms = customAlarms.filter(a => a.id !== ringing.id);
      }
    };

    simulateStop(snoozeAlarm);

    assert.equal(customAlarms.length, 1, 'Snooze alarm must be deleted');
    assert.equal(customAlarms[0].id, originalAlarm.id, 'Original alarm must remain untouched');
  });

  test('Native scheduler: oneShot fixed alarm is scheduled ONLY for fireDate and NEVER repeats weekly', () => {
    // Construct a 28-day schedule starting on next Monday
    const today = new Date();
    const daysUntilNextMonday = (1 - today.getDay() + 7) % 7 || 7;
    const baseDate = new Date(today);
    baseDate.setDate(today.getDate() + daysUntilNextMonday);
    baseDate.setHours(0, 0, 0, 0);

    const daysList: DailyPrayerTimesEntry[] = [];
    for (let i = 0; i < 28; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      daysList.push({
        date: d,
        timesMap: {
          Fajr: '05:00',
          Sunrise: '06:15',
          Dhuhr: '12:30',
          Asr: '15:45',
          Maghrib: '18:10',
          Isha: '19:30',
        }
      });
    }

    const fireDateYear = baseDate.getFullYear();
    const fireDateMonth = (baseDate.getMonth() + 1).toString().padStart(2, '0');
    const fireDateDay = baseDate.getDate().toString().padStart(2, '0');
    const fireDateStr = `${fireDateYear}-${fireDateMonth}-${fireDateDay}`; // Only Day 0
    const oneShotAlarm: AlarmConfig = {
      id: 'snooze_test_1',
      title: 'تنبيه غفوة مؤقت',
      enabled: true,
      type: 'fixed',
      time: '23:59',
      days: [1], // Monday
      soundType: 'reminder',
      oneShot: true,
      fireDate: fireDateStr,
    };

    const recurringAlarm: AlarmConfig = {
      id: 'recurring_monday_alarm',
      title: 'منبه متكرر كل إثنين',
      enabled: true,
      type: 'fixed',
      time: '23:59',
      days: [1], // Every Monday
      soundType: 'reminder',
    };

    const scheduledTimes = buildNativePrayerTimeAlarms(daysList, undefined, {
      customAlarms: [oneShotAlarm, recurringAlarm]
    });

    const oneShotItems = scheduledTimes.filter(t => t.prayerKey.startsWith('custom_snooze_test_1'));
    const recurringItems = scheduledTimes.filter(t => t.prayerKey.startsWith('custom_recurring_monday_alarm'));

    // The 28-day window has 4 Mondays
    assert.equal(
      recurringItems.length,
      4,
      'Recurring alarm must repeat weekly on all 4 Mondays in the 28-day window'
    );

    // The oneShot alarm must appear EXACTLY ONCE on its fireDate
    assert.equal(
      oneShotItems.length,
      1,
      'OneShot alarm must be scheduled EXACTLY once across the entire window and never repeat weekly'
    );

    const oneShotDate = new Date(oneShotItems[0].timeMs);
    const oneShotDateStr = `${oneShotDate.getFullYear()}-${(oneShotDate.getMonth() + 1).toString().padStart(2, '0')}-${oneShotDate.getDate().toString().padStart(2, '0')}`;
    assert.equal(oneShotDateStr, fireDateStr, 'OneShot alarm must fire on the exact fireDate');
  });

  test('Reconciliation: when custom alarm is disabled or deleted, buildNativePrayerTimeAlarms omits it completely', () => {
    const today = new Date();
    const daysUntilNextMonday = (1 - today.getDay() + 7) % 7 || 7;
    const baseDate = new Date(today);
    baseDate.setDate(today.getDate() + daysUntilNextMonday);
    baseDate.setHours(0, 0, 0, 0);

    const daysList: DailyPrayerTimesEntry[] = [{
      date: baseDate,
      timesMap: {
        Fajr: '05:00',
        Sunrise: '06:15',
        Dhuhr: '12:30',
        Asr: '15:45',
        Maghrib: '18:10',
        Isha: '19:30',
      }
    }];

    const activeAlarm: AlarmConfig = {
      id: 'custom_alarm_to_delete',
      title: 'منبه مخصص للتجربة',
      enabled: true,
      type: 'fixed',
      time: '23:59',
      days: [1],
      soundType: 'reminder',
    };

    // 1. When enabled, it is in the scheduled output
    const withActive = buildNativePrayerTimeAlarms(daysList, undefined, {
      customAlarms: [activeAlarm]
    });
    assert.ok(
      withActive.some(t => t.prayerKey.startsWith('custom_custom_alarm_to_delete')),
      'Enabled custom alarm must be included in scheduled alarms'
    );

    // 2. When disabled, buildNativePrayerTimeAlarms omits it
    const withDisabled = buildNativePrayerTimeAlarms(daysList, undefined, {
      customAlarms: [{ ...activeAlarm, enabled: false }]
    });
    assert.ok(
      !withDisabled.some(t => t.prayerKey.startsWith('custom_custom_alarm_to_delete')),
      'Disabled custom alarm must be omitted from scheduled alarms (triggering native cancellation in reconciliation)'
    );

    // 3. When deleted (empty array or filtered out), buildNativePrayerTimeAlarms omits it
    const withDeleted = buildNativePrayerTimeAlarms(daysList, undefined, {
      customAlarms: []
    });
    assert.ok(
      !withDeleted.some(t => t.prayerKey.startsWith('custom_custom_alarm_to_delete')),
      'Deleted custom alarm must be omitted from scheduled alarms (triggering native cancellation in reconciliation)'
    );
  });

  test('App start cleanup: expired one-shot / snooze alarms are pruned while future alarms remain intact', () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1).toString().padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}`;
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tomorrowStr = `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;

    const expiredSnooze: AlarmConfig = {
      id: 'snooze_expired_1',
      title: 'منبه غفوة قديم منتهي',
      enabled: true,
      type: 'fixed',
      time: '10:00',
      days: [yesterday.getDay()],
      soundType: 'reminder',
      oneShot: true,
      snoozeOf: 'original_1',
      fireDate: yesterdayStr,
    };

    const futureSnooze: AlarmConfig = {
      id: 'snooze_future_1',
      title: 'منبه غفوة قادم',
      enabled: true,
      type: 'fixed',
      time: '23:59',
      days: [tomorrow.getDay()],
      soundType: 'reminder',
      oneShot: true,
      snoozeOf: 'original_1',
      fireDate: tomorrowStr,
    };

    const recurringAlarm: AlarmConfig = {
      id: 'recurring_alarm_keep',
      title: 'منبه يومي دائم',
      enabled: true,
      type: 'fixed',
      time: '08:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      soundType: 'reminder',
    };

    const alarmsList = [expiredSnooze, futureSnooze, recurringAlarm];

    // Simulate the cleanup logic from usePrayerScheduler
    const nowMins = today.getHours() * 60 + today.getMinutes();
    const cleaned = alarmsList.filter(a => {
      if (!a.oneShot && !a.fireDate && !a.id.startsWith('snooze_')) return true;
      if (a.fireDate) {
        if (a.fireDate < todayStr) return false;
        if (a.fireDate === todayStr && a.time) {
          const [h, m] = a.time.split(':').map(Number);
          if (!isNaN(h) && !isNaN(m) && (h * 60 + m) < (nowMins - 2)) return false;
        }
      } else if (a.oneShot || a.id.startsWith('snooze_')) {
        return false;
      }
      return true;
    });

    assert.equal(cleaned.length, 2, 'Should prune exactly 1 expired snooze');
    assert.ok(cleaned.some(a => a.id === 'recurring_alarm_keep'), 'Recurring alarm must be kept');
    assert.ok(cleaned.some(a => a.id === 'snooze_future_1'), 'Future snooze alarm must be kept');
    assert.ok(!cleaned.some(a => a.id === 'snooze_expired_1'), 'Expired snooze alarm must be removed');
  });
});
