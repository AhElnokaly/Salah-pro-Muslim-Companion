import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { isAthanEnabled, getAthanEnabledMap } from '../../utils/athanEnabled';
import { 
  scheduleNativeAthanAlarms, 
  buildNativePrayerTimeAlarms, 
  getLastScheduledOptions,
  DailyPrayerTimesEntry 
} from '../../services/athanAlarmPlugin';

describe('TASK 8: Authoritative Athan Disabled Everywhere', () => {
  const tomorrow = new Date(Date.now() + 86400000);
  const daysEntry: DailyPrayerTimesEntry[] = [
    {
      date: tomorrow,
      timesMap: {
        Fajr: '05:00',
        Sunrise: '06:30',
        Dhuhr: '12:30',
        Asr: '15:45',
        Maghrib: '18:15',
        Isha: '19:45',
      }
    }
  ];

  describe('isAthanEnabled unit tests', () => {
    test('returns false when pushSettings.prayerAthan is false (global athan toggle OFF)', () => {
      const pushSettings = { prayerAthan: false };
      const settings = {
        adhanEnabled: {
          Fajr: true,
          Dhuhr: true,
          Asr: true,
          Maghrib: true,
          Isha: true,
        }
      };

      assert.equal(isAthanEnabled('Fajr', settings, pushSettings), false);
      assert.equal(isAthanEnabled('Dhuhr', settings, pushSettings), false);
      assert.equal(isAthanEnabled('Asr', settings, pushSettings), false);
      assert.equal(isAthanEnabled('Maghrib', settings, pushSettings), false);
      assert.equal(isAthanEnabled('Isha', settings, pushSettings), false);

      const map = getAthanEnabledMap(settings, pushSettings);
      assert.deepEqual(map, {
        Fajr: false,
        Dhuhr: false,
        Asr: false,
        Maghrib: false,
        Isha: false,
      });
    });

    test('returns false for single prayer when adhanEnabled[prayer] is false', () => {
      const pushSettings = { prayerAthan: true };
      const settings = {
        adhanEnabled: {
          Fajr: false,
          Dhuhr: true,
          Asr: true,
          Maghrib: true,
          Isha: true,
        }
      };

      assert.equal(isAthanEnabled('Fajr', settings, pushSettings), false);
      assert.equal(isAthanEnabled('fajr', settings, pushSettings), false);
      assert.equal(isAthanEnabled('Dhuhr', settings, pushSettings), true);
      assert.equal(isAthanEnabled('Asr', settings, pushSettings), true);
      assert.equal(isAthanEnabled('Maghrib', settings, pushSettings), true);
      assert.equal(isAthanEnabled('Isha', settings, pushSettings), true);

      const map = getAthanEnabledMap(settings, pushSettings);
      assert.equal(map['Fajr'], false);
      assert.equal(map['Dhuhr'], true);
      assert.equal(map['Asr'], true);
      assert.equal(map['Maghrib'], true);
      assert.equal(map['Isha'], true);
    });

    test('returns true when undefined / missing (undefined = enabled)', () => {
      assert.equal(isAthanEnabled('Fajr', undefined, undefined), true);
      assert.equal(isAthanEnabled('Dhuhr', null, null), true);
      assert.equal(isAthanEnabled('Asr', { adhanEnabled: {} }, {}), true);
      assert.equal(isAthanEnabled('Maghrib', {}, { prayerAthan: true }), true);
      assert.equal(isAthanEnabled('Isha', { adhanEnabled: null }, null), true);

      const map = getAthanEnabledMap(undefined, undefined);
      assert.deepEqual(map, {
        Fajr: true,
        Dhuhr: true,
        Asr: true,
        Maghrib: true,
        Isha: true,
      });
    });
  });

  describe('scheduleNativeAthanAlarms with athanEnabledMap', () => {
    test('with athanEnabledMap {Fajr:false, others true} produces no Fajr athan items and still produces the other four', async () => {
      const athanEnabledMap = {
        Fajr: false,
        Dhuhr: true,
        Asr: true,
        Maghrib: true,
        Isha: true,
      };

      await scheduleNativeAthanAlarms(daysEntry, undefined, {
        athanEnabledMap,
        prayerPreAlert: false,
        prayerPostAlert: false,
      });

      const options = getLastScheduledOptions();
      assert.ok(options, 'Options should be passed to AthanAlarm plugin');
      const scheduledTimes = options.times as any[];

      const athanItems = scheduledTimes.filter(t => (t.alarmType || 'athan') === 'athan');
      const fajrAthanItems = athanItems.filter(t => t.prayerKey === 'Fajr');
      const dhuhrAthanItems = athanItems.filter(t => t.prayerKey === 'Dhuhr');
      const asrAthanItems = athanItems.filter(t => t.prayerKey === 'Asr');
      const maghribAthanItems = athanItems.filter(t => t.prayerKey === 'Maghrib');
      const ishaAthanItems = athanItems.filter(t => t.prayerKey === 'Isha');

      assert.equal(fajrAthanItems.length, 0, 'Must produce NO Fajr athan items');
      assert.equal(dhuhrAthanItems.length, 1, 'Must still produce Dhuhr athan item');
      assert.equal(asrAthanItems.length, 1, 'Must still produce Asr athan item');
      assert.equal(maghribAthanItems.length, 1, 'Must still produce Maghrib athan item');
      assert.equal(ishaAthanItems.length, 1, 'Must still produce Isha athan item');
      assert.equal(athanItems.length, 4, 'Total athan items must be exactly 4');

      // Also verify per-prayer native flags passed to native plugin
      assert.equal(options.athan_enabled_Fajr, false);
      assert.equal(options.athan_enabled_Dhuhr, true);
      assert.equal(options.athan_enabled_Asr, true);
      assert.equal(options.athan_enabled_Maghrib, true);
      assert.equal(options.athan_enabled_Isha, true);
    });

    test('with all false, zero athan items but pre/post alerts and custom alarms are still scheduled', async () => {
      const athanEnabledMap = {
        Fajr: false,
        Dhuhr: false,
        Asr: false,
        Maghrib: false,
        Isha: false,
      };

      const customAlarm = {
        id: 'custom_tahajjud',
        title: 'قيام الليل',
        enabled: true,
        type: 'fixed' as const,
        time: '04:00',
        days: [0, 1, 2, 3, 4, 5, 6],
        soundType: 'reminder' as const,
      };

      await scheduleNativeAthanAlarms(daysEntry, undefined, {
        athanEnabledMap,
        prayerPreAlert: true,
        preAlertMinutes: 15,
        preAlertSound: 'hayya',
        prayerPostAlert: true,
        postAlertMinutes: 15,
        postAlertSound: 'salawat',
        customAlarms: [customAlarm],
      });

      const options = getLastScheduledOptions();
      assert.ok(options, 'Options should be passed to AthanAlarm plugin');
      const scheduledTimes = options.times as any[];

      const athanItems = scheduledTimes.filter(t => (t.alarmType || 'athan') === 'athan');
      const preAlertItems = scheduledTimes.filter(t => t.alarmType === 'prealert');
      const postAlertItems = scheduledTimes.filter(t => t.alarmType === 'postalert');
      const customItems = scheduledTimes.filter(t => t.alarmType === 'custom');

      assert.equal(athanItems.length, 0, 'With all false, zero athan items must be produced');
      assert.ok(preAlertItems.length > 0, 'Pre-alert items must still be scheduled when athan is disabled');
      assert.ok(postAlertItems.length > 0, 'Post-alert items must still be scheduled when athan is disabled');
      assert.ok(customItems.length > 0, 'Custom alarms must still be scheduled when athan is disabled');

      // Verify all five per-prayer flags are false
      assert.equal(options.athan_enabled_Fajr, false);
      assert.equal(options.athan_enabled_Dhuhr, false);
      assert.equal(options.athan_enabled_Asr, false);
      assert.equal(options.athan_enabled_Maghrib, false);
      assert.equal(options.athan_enabled_Isha, false);
    });
  });
});
