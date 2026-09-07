/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  toArabicNumbers,
  getHijriDate,
  isForbiddenFastDay,
  formatArabicDayCount,
  getArabicDayOfWeek,
  getArabicMonthNameGregorian,
  formatGregorianFullDateArabic,
} from './hijri';
import {
  formatDateKey,
  getDateFromPrayerDay,
  addDays,
  subtractDays,
  getAppPrayerDay,
} from './prayerDayBoundary';

describe('Hijri Calendar & Arabic Utilities Engine', () => {
  describe('toArabicNumbers', () => {
    test('converts western digits to Eastern Arabic numerals correctly', () => {
      assert.equal(toArabicNumbers('0123456789'), '٠١٢٣٤٥٦٧٨٩');
      assert.equal(toArabicNumbers(1448), '١٤٤٨');
      assert.equal(toArabicNumbers(2026), '٢٠٢٦');
    });

    test('handles empty, zero, null, and undefined values safely', () => {
      assert.equal(toArabicNumbers(0), '٠');
      assert.equal(toArabicNumbers(''), '');
      assert.equal(toArabicNumbers(null), '');
      assert.equal(toArabicNumbers(undefined), '');
    });

    test('leaves non-digit Arabic or Latin characters unchanged', () => {
      assert.equal(toArabicNumbers('اليوم 15 رمضان'), 'اليوم ١٥ رمضان');
      assert.equal(toArabicNumbers('Page 42 of 604'), 'Page ٤٢ of ٦٠٤');
    });
  });

  describe('getHijriDate', () => {
    test('computes complete Hijri information structure', () => {
      const fixedDate = new Date(2026, 6, 17); // July 17, 2026
      const hijri = getHijriDate(fixedDate);

      assert.ok(typeof hijri.day === 'number' && hijri.day >= 1 && hijri.day <= 30);
      assert.ok(typeof hijri.month === 'number' && hijri.month >= 1 && hijri.month <= 12);
      assert.ok(typeof hijri.year === 'number' && hijri.year >= 1447 && hijri.year <= 1449);
      assert.ok(typeof hijri.monthName === 'string' && hijri.monthName.length > 0);
      assert.match(hijri.fullString, /هـ$/);
    });

    test('manual offset days shift the Hijri date accurately', () => {
      const baseDate = new Date(2026, 8, 4); // September 4, 2026
      const normal = getHijriDate(baseDate, 0);
      const plusOne = getHijriDate(baseDate, 1);
      const minusOne = getHijriDate(baseDate, -1);

      assert.notEqual(normal.day, plusOne.day, 'Adding 1 day must change Hijri day');
      assert.notEqual(normal.day, minusOne.day, 'Subtracting 1 day must change Hijri day');
    });
  });

  describe('isForbiddenFastDay (Islamic Sharia Fasting Rules)', () => {
    test('Eid al-Fitr (1 Shawwal) is strictly forbidden for fasting', () => {
      assert.equal(isForbiddenFastDay(1, 10), true, '1 Shawwal must be forbidden');
    });

    test('Eid al-Adha (10 Dhu al-Hijjah) is strictly forbidden for fasting', () => {
      assert.equal(isForbiddenFastDay(10, 12), true, '10 Dhu al-Hijjah must be forbidden');
    });

    test('Tashreeq days (11, 12, 13 Dhu al-Hijjah) are strictly forbidden for fasting', () => {
      assert.equal(isForbiddenFastDay(11, 12), true, '11 Dhu al-Hijjah must be forbidden');
      assert.equal(isForbiddenFastDay(12, 12), true, '12 Dhu al-Hijjah must be forbidden');
      assert.equal(isForbiddenFastDay(13, 12), true, '13 Dhu al-Hijjah must be forbidden');
    });

    test('Normal voluntary fasting days (Ashura, Arafah, White Days) are allowed', () => {
      assert.equal(isForbiddenFastDay(10, 1), false, 'Ashura (10 Muharram) is permissible/encouraged');
      assert.equal(isForbiddenFastDay(9, 12), false, 'Arafah (9 Dhu al-Hijjah) is permissible/encouraged');
      assert.equal(isForbiddenFastDay(14, 7), false, 'White day (14 Rajab) is permissible/encouraged');
      assert.equal(isForbiddenFastDay(15, 8), false, 'White day (15 Shaban) is permissible/encouraged');
      assert.equal(isForbiddenFastDay(2, 10), false, '2 Shawwal (6 days of Shawwal) is permissible');
    });
  });

  describe('Arabic Grammatical Formatting', () => {
    test('formatArabicDayCount applies proper Arabic dual and plural grammar', () => {
      assert.equal(formatArabicDayCount(1), 'يوم واحد');
      assert.equal(formatArabicDayCount(2), 'يومين');
      assert.equal(formatArabicDayCount(3), '٣ أيام');
      assert.equal(formatArabicDayCount(7), '٧ أيام');
      assert.equal(formatArabicDayCount(10), '١٠ أيام');
      assert.equal(formatArabicDayCount(11), '١١ يوماً');
      assert.equal(formatArabicDayCount(30), '٣٠ يوماً');
    });

    test('getArabicDayOfWeek returns localized names for all 7 days', () => {
      // 2026-09-04 was Friday
      const friday = new Date(2026, 8, 4);
      assert.equal(getArabicDayOfWeek(friday), 'الجمعة');

      const saturday = new Date(2026, 8, 5);
      assert.equal(getArabicDayOfWeek(saturday), 'السبت');

      const sunday = new Date(2026, 8, 6);
      assert.equal(getArabicDayOfWeek(sunday), 'الأحد');
    });

    test('getArabicMonthNameGregorian returns proper Arabic month transliteration', () => {
      assert.equal(getArabicMonthNameGregorian(new Date(2026, 0, 1)), 'يناير');
      assert.equal(getArabicMonthNameGregorian(new Date(2026, 6, 1)), 'يوليو');
      assert.equal(getArabicMonthNameGregorian(new Date(2026, 11, 31)), 'ديسمبر');
    });

    test('formatGregorianFullDateArabic formats day name and date together', () => {
      const date = new Date(2026, 6, 17); // Friday, July 17, 2026
      const formatted = formatGregorianFullDateArabic(date);
      assert.match(formatted, /الجمعة/);
      assert.match(formatted, /١٧/);
      assert.match(formatted, /يوليو/);
    });
  });

  describe('Prayer Day Boundary & Calendar Date Utilities', () => {
    test('formatDateKey outputs standard YYYY-MM-DD padded format', () => {
      const d = new Date(2026, 3, 5); // April 5, 2026
      assert.equal(formatDateKey(d), '2026-04-05');
    });

    test('formatDateKey handles invalid dates gracefully with current date fallback', () => {
      const invalid = new Date(NaN);
      const res = formatDateKey(invalid);
      assert.match(res, /^\d{4}-\d{2}-\d{2}$/);
    });

    test('getDateFromPrayerDay reconstructs Date object at noon', () => {
      const date = getDateFromPrayerDay('2026-09-05');
      assert.equal(date.getFullYear(), 2026);
      assert.equal(date.getMonth(), 8); // 0-indexed September
      assert.equal(date.getDate(), 5);
      assert.equal(date.getHours(), 12, 'Must be at noon to avoid timezone shift');
    });

    test('addDays and subtractDays add and subtract exact day counts', () => {
      const base = new Date(2026, 8, 10);
      const added = addDays(base, 5);
      assert.equal(added.getDate(), 15);

      const subtracted = subtractDays(base, 3);
      assert.equal(subtracted.getDate(), 7);
    });

    test('getAppPrayerDay returns uniform midnight calendar date string', () => {
      const d = new Date(2026, 8, 5, 23, 45);
      assert.equal(getAppPrayerDay(d), '2026-09-05');
    });
  });
});
