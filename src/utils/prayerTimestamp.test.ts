/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildPrayerTimestampMs,
  getCityCalendarDate,
  advanceCityCalendarDate,
} from './prayerTimestamp';

describe('R13a - buildPrayerTimestampMs Pure Function Tests', () => {
  describe('1. Golden Reference Values (Exact Timestamp Parity)', () => {
    it('accurately converts Cairo 2026-06-15 04:32 AM (DST UTC+3)', () => {
      // Cairo on June 15, 2026 is UTC+3 (Egypt DST)
      // 04:32 AM Cairo = 01:32 AM UTC
      // 2026-06-15T01:32:00.000Z
      const expected = Date.UTC(2026, 5, 15, 1, 32, 0); // 1781487120000
      const actual = buildPrayerTimestampMs({
        cityDate: '2026-06-15',
        prayerMinutes: 272, // 4 * 60 + 32
        timezoneId: 'Africa/Cairo',
      });
      assert.strictEqual(actual, expected, 'Cairo 4:32 AM UTC timestamp must match golden value');
    });

    it('accurately converts Riyadh 2026-01-10 12:05 PM (Standard UTC+3, No DST)', () => {
      // Riyadh is always UTC+3 year-round
      // 12:05 PM Riyadh = 09:05 AM UTC
      const expected = Date.UTC(2026, 0, 10, 9, 5, 0); // 1768035900000
      const actual = buildPrayerTimestampMs({
        cityDate: '2026-01-10',
        prayerMinutes: 725, // 12 * 60 + 5
        timezoneId: 'Asia/Riyadh',
      });
      assert.strictEqual(actual, expected, 'Riyadh 12:05 PM UTC timestamp must match golden value');
    });

    it('accurately converts New York 2026-10-15 18:00 (EDT UTC-4)', () => {
      // New York on Oct 15, 2026 is EDT (UTC-4)
      // 18:00 NY = 22:00 UTC
      const expected = Date.UTC(2026, 9, 15, 22, 0, 0); // 1792101600000
      const actual = buildPrayerTimestampMs({
        cityDate: '2026-10-15',
        prayerMinutes: 1080, // 18 * 60
        timezoneId: 'America/New_York',
      });
      assert.strictEqual(actual, expected, 'New York 18:00 UTC timestamp must match golden value');
    });
  });

  describe('2. Midnight Carries (Positive & Negative)', () => {
    it('handles exact 24:00 (1440 mins) carry into next day 00:00', () => {
      // 2026-06-15 at 24:00 = 2026-06-16 at 00:00 Cairo (UTC+3) -> 2026-06-15 21:00 UTC
      const expected = Date.UTC(2026, 5, 15, 21, 0, 0);
      const actual = buildPrayerTimestampMs({
        cityDate: '2026-06-15',
        prayerMinutes: 1440,
        timezoneId: 'Africa/Cairo',
      });
      assert.strictEqual(actual, expected, '1440 mins must cleanly advance to next day midnight');
    });

    it('handles 24:15 (1455 mins) carry into next day 00:15 (e.g. Isha offset)', () => {
      // 2026-06-15 at 24:15 = 2026-06-16 at 00:15 Cairo (UTC+3) -> 2026-06-15 21:15 UTC
      const expected = Date.UTC(2026, 5, 15, 21, 15, 0);
      const actual = buildPrayerTimestampMs({
        cityDate: '2026-06-15',
        prayerMinutes: 1455,
        timezoneId: 'Africa/Cairo',
      });
      assert.strictEqual(actual, expected, '1455 mins must cleanly advance to next day 00:15');
    });

    it('handles negative carry -15 mins into previous day 23:45', () => {
      // 2026-06-15 at -15 mins = 2026-06-14 at 23:45 Cairo (UTC+3) -> 2026-06-14 20:45 UTC
      const expected = Date.UTC(2026, 5, 14, 20, 45, 0);
      const actual = buildPrayerTimestampMs({
        cityDate: '2026-06-15',
        prayerMinutes: -15,
        timezoneId: 'Africa/Cairo',
      });
      assert.strictEqual(actual, expected, '-15 mins must cleanly roll back to previous day 23:45');
    });

    it('handles large carry (+2 days)', () => {
      // 2026-06-15 at +2880 mins (48 hours) = 2026-06-17 at 00:00 Cairo -> 2026-06-16 21:00 UTC
      const expected = Date.UTC(2026, 5, 16, 21, 0, 0);
      const actual = buildPrayerTimestampMs({
        cityDate: '2026-06-15',
        prayerMinutes: 2880,
        timezoneId: 'Africa/Cairo',
      });
      assert.strictEqual(actual, expected, '2880 mins must advance by 2 full days');
    });
  });

  describe('3. Daylight Saving Time (DST) Transitions', () => {
    it('handles spring forward gap without throwing (advances to valid instant)', () => {
      // In New York on 2026-03-08, at 02:00 the clock jumps to 03:00.
      // A local time of 02:30 does not exist on the clock.
      const ms = buildPrayerTimestampMs({
        cityDate: '2026-03-08',
        prayerMinutes: 150, // 02:30
        timezoneId: 'America/New_York',
      });
      assert.ok(Number.isFinite(ms), 'Must return a valid finite epoch number');
      assert.ok(ms > 0, 'Timestamp must be positive');
    });

    it('handles fall back overlap by strictly choosing First Occurrence', () => {
      // In London on 2026-10-25, at 02:00 the clock falls back to 01:00.
      // 01:30 repeats twice:
      // Instance 1 (BST, UTC+1): 00:30 UTC
      // Instance 2 (GMT, UTC+0): 01:30 UTC
      // First occurrence is 00:30 UTC = Date.UTC(2026, 9, 25, 0, 30, 0)
      const expectedFirstOccurrence = Date.UTC(2026, 9, 25, 0, 30, 0);
      const actual = buildPrayerTimestampMs({
        cityDate: '2026-10-25',
        prayerMinutes: 90, // 01:30
        timezoneId: 'Europe/London',
      });
      assert.strictEqual(actual, expectedFirstOccurrence, 'Fall back must strictly pick the first occurrence');
    });
  });

  describe('4. Fault Tolerance & No-Throw Policy', () => {
    it('returns a fallback timestamp when timezoneId is invalid and does not throw', () => {
      assert.doesNotThrow(() => {
        const ms = buildPrayerTimestampMs({
          cityDate: '2026-06-15',
          prayerMinutes: 300,
          timezoneId: 'Invalid/NonExistent_Zone',
        });
        assert.ok(Number.isFinite(ms));
      });
    });

    it('returns a fallback timestamp when cityDate format is malformed and does not throw', () => {
      assert.doesNotThrow(() => {
        const ms = buildPrayerTimestampMs({
          cityDate: 'not-a-date',
          prayerMinutes: 300,
          timezoneId: 'Africa/Cairo',
        });
        assert.ok(Number.isFinite(ms));
      });
    });

    it('handles non-finite prayerMinutes safely', () => {
      assert.doesNotThrow(() => {
        const ms = buildPrayerTimestampMs({
          cityDate: '2026-06-15',
          prayerMinutes: NaN,
          timezoneId: 'Africa/Cairo',
        });
        assert.ok(Number.isFinite(ms));
      });
    });
  });

  describe('5. City Calendar Date Helpers', () => {
    it('getCityCalendarDate returns the correct city date across timezone day boundaries', () => {
      // At 2026-11-04 23:00 UTC:
      // In New York (UTC-5): 2026-11-04 18:00 -> Date is 2026-11-04
      // In Riyadh (UTC+3): 2026-11-05 02:00 -> Date is 2026-11-05!
      const instant = new Date('2026-11-04T23:00:00.000Z');
      const nyDate = getCityCalendarDate(instant, 'America/New_York');
      const riyadhDate = getCityCalendarDate(instant, 'Asia/Riyadh');
      assert.strictEqual(nyDate, '2026-11-04');
      assert.strictEqual(riyadhDate, '2026-11-05');
    });

    it('advanceCityCalendarDate advances across month and year boundaries in pure UTC', () => {
      assert.strictEqual(advanceCityCalendarDate('2026-01-31', 1), '2026-02-01');
      assert.strictEqual(advanceCityCalendarDate('2026-12-31', 1), '2027-01-01');
      assert.strictEqual(advanceCityCalendarDate('2026-02-28', 1), '2026-03-01');
    });
  });
});
