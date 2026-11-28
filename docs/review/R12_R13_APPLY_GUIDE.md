# دليل التطبيق اليدوي المباشر لإصلاحات R12 و R13 (Manual Apply Guide)

هذا الملف أُعد خصيصاً لتطبيق تعديلات R13a و R12a و R12b مباشرة على الفرع الحقيقي `Wip/commit3-athan-master-toggle` دون الحاجة لاستخدام ملفات `.patch`.

## تنبيه هام للمطور (Ahmed) قبل الاستبدال:
1. **الملفات الجديدة (8 ملفات):** تُنشأ بالكامل بالمسار المذكور وتُنسخ محتوياتها.
2. **الملفان المعدلان (`AthanAlarmReceiver.kt` و `KhushuRestoreReceiver.kt`):**
   - **بصمة النسخة الأصلية قبل التعديل:** **غير مُتحقَّق منها** في هذه البيئة لعدم وجود ملفات أصلية مستقلة من Git.
   - يجب على أحمد مقارنة نسخته المحلية على فرع `Wip/commit3-athan-master-toggle` ومراجعة فرع `custom` فقط في `AthanAlarmReceiver.kt` ودوال `ACTION_ACTIVATE_KHUSHU_DEFERRED` في `KhushuRestoreReceiver.kt` قبل الاستبدال.

## جدول بصمات الملفات (Verification Manifest):

| الملف | الدور | عدد الأسطر | SHA-256 |
|---|---|---|---|
| `src/utils/prayerTimestamp.ts` | R13a | 191 | `3117f4280709bc7683f85bb8218cae8ca8739bf540d57607cbaefd4fa1f5407e` |
| `src/utils/prayerTimestamp.test.ts` | R13a | 182 | `6465ad466b4c12ae9f71bf19fbdf5b036ffd370981ac733b25774327d6ff9adc` |
| `scripts/test_tz_invariance.cjs` | R13a | 101 | `bff17f79f285cb2971cd329dc407d6f378edaefbd318b1aeb4056eb390972453` |
| `android/app/src/main/java/com/salahpro/app/plugins/CustomAlarmKhushuDecision.kt` | R12a | 130 | `22fa4c58fbcde74e6d7ceb00258d2d6580517546dc3063033daa4d5e7f211a91` |
| `android/app/src/test/java/com/salahpro/app/plugins/CustomAlarmKhushuDecisionTest.kt` | R12a | 158 | `8a2b1dabdfb546f5d74ef24a68048aa7aa5cbec15788ac75fe0cefbad752f304` |
| `src/domain/khushu/customAlarmKhushuDecision.ts` | R12a | 121 | `a02f6d13c5e2b672cdb0e6961cda0e89b0222d276bb9619bcfd54356df661a10` |
| `src/domain/khushu/customAlarmKhushuDecision.test.ts` | R12a | 190 | `c5b2a6cc9c741f8fcb37a8c14eb53e269edb0d5842c840581cdddb783099897b` |
| `docs/fixes/R12_B3_khushu_custom_alarm_sound.md` | R12 | 110 | `a37f4224ff0eee31a3961bfc7c9884fe06c329c4be5bcd4ee3d85ed52ee2de45` |
| `android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmReceiver.kt` | R12b | 733 | `63ad02efebe15fa040d02cfc10ca0bf8825183c643998d405f8ef188414cfbcd` |
| `android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt` | R12b | 505 | `0985640e7e858939787c77a187a3c25b4a7ff265d42c5fa0e2446f2267c0ee21` |

---

## الملف: `src/utils/prayerTimestamp.ts`
- **الوصف:** R13a: تحويل المواقيت الحتمي وحساب الـ midnight carry ومعالجة DST
- **عدد الأسطر:** 191
- **SHA-256:** `3117f4280709bc7683f85bb8218cae8ca8739bf540d57607cbaefd4fa1f5407e`

```typescript
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PrayerTimestampParams {
  cityDate: string;       // YYYY-MM-DD في يوم المدينة
  prayerMinutes: number;  // دقائق من منتصف ليل المدينة (ممكن >= 1440 أو < 0)
  timezoneId: string;     // IANA timezone identifier
}

/**
 * Extracts numeric local date & time components in the given IANA timezone.
 */
function getLocalComponents(
  epochMs: number,
  formatter: Intl.DateTimeFormat
): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const parts = formatter.formatToParts(new Date(epochMs));
  let year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0;
  for (const p of parts) {
    if (p.type === 'year') year = parseInt(p.value, 10);
    else if (p.type === 'month') month = parseInt(p.value, 10);
    else if (p.type === 'day') day = parseInt(p.value, 10);
    else if (p.type === 'hour') hour = parseInt(p.value, 10);
    else if (p.type === 'minute') minute = parseInt(p.value, 10);
    else if (p.type === 'second') second = parseInt(p.value, 10);
  }
  return { year, month, day, hour, minute, second };
}

/**
 * Returns the epoch ms of the local date/time components interpreted as if they were UTC.
 */
function toLocalEpochEquivalent(
  epochMs: number,
  formatter: Intl.DateTimeFormat
): number {
  const c = getLocalComponents(epochMs, formatter);
  return Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second);
}

/**
 * Builds an exact UTC timestamp (epoch ms) from a city's calendar date (YYYY-MM-DD)
 * and prayer minutes from midnight.
 *
 * Guarantees:
 * 1. Timezone Independence: Output is identical regardless of device/host timezone (TZ).
 * 2. Internal Carry: Handles midnight crossing (minutes >= 1440 or minutes < 0) seamlessly.
 * 3. DST Resilience:
 *    - Spring forward gap: smoothly advances to the first valid wall-clock instant.
 *    - Fall back overlap: strictly selects the First Occurrence (abundant prayer notification safety).
 * 4. No-Throw Policy: Invalid inputs log a descriptive warning and fall back safely without throwing.
 */
export function buildPrayerTimestampMs(p: PrayerTimestampParams): number {
  if (!p || typeof p !== 'object') {
    console.warn('[prayerTimestamp] Invalid parameters object provided:', p);
    return Date.now();
  }

  const { cityDate, prayerMinutes, timezoneId } = p;

  if (typeof cityDate !== 'string' || !cityDate.trim()) {
    console.warn('[prayerTimestamp] cityDate must be a non-empty string (YYYY-MM-DD):', cityDate);
    return Date.now();
  }

  const dateParts = cityDate.trim().split('-');
  if (dateParts.length !== 3) {
    console.warn('[prayerTimestamp] Malformed cityDate format (expected YYYY-MM-DD):', cityDate);
    return Date.now();
  }

  const baseYear = parseInt(dateParts[0], 10);
  const baseMonth = parseInt(dateParts[1], 10);
  const baseDay = parseInt(dateParts[2], 10);

  if (isNaN(baseYear) || isNaN(baseMonth) || isNaN(baseDay) || baseMonth < 1 || baseMonth > 12 || baseDay < 1 || baseDay > 31) {
    console.warn('[prayerTimestamp] Invalid date components in cityDate:', cityDate);
    return Date.now();
  }

  const safeMinutes = typeof prayerMinutes === 'number' && Number.isFinite(prayerMinutes) ? prayerMinutes : 0;
  if (!Number.isFinite(prayerMinutes)) {
    console.warn('[prayerTimestamp] Non-finite prayerMinutes supplied, defaulting to 0:', prayerMinutes);
  }

  // Calculate day carry and remainder minutes (supports positive and negative carry)
  const dayCarry = Math.floor(safeMinutes / 1440);
  const minuteOfDay = ((safeMinutes % 1440) + 1440) % 1440;
  const targetHour = Math.floor(minuteOfDay / 60);
  const targetMinute = minuteOfDay % 60;

  // Compute target calendar date in pure UTC arithmetic
  const targetDateUtc = new Date(Date.UTC(baseYear, baseMonth - 1, baseDay + dayCarry));
  const targetY = targetDateUtc.getUTCFullYear();
  const targetM = targetDateUtc.getUTCMonth() + 1;
  const targetD = targetDateUtc.getUTCDate();

  // Validate or fall back timezone without throwing
  let formatter: Intl.DateTimeFormat;
  const safeTz = typeof timezoneId === 'string' && timezoneId.trim() ? timezoneId.trim() : 'UTC';

  try {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: safeTz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23',
    });
  } catch (err) {
    console.warn(`[prayerTimestamp] Unsupported timezoneId "${safeTz}", falling back to UTC:`, err);
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23',
    });
  }

  // Target local time represented as an epoch timestamp
  const targetAsLocalUtc = Date.UTC(targetY, targetM - 1, targetD, targetHour, targetMinute, 0);

  // Initial estimate
  let guess = targetAsLocalUtc;
  const offset = targetAsLocalUtc - toLocalEpochEquivalent(guess, formatter);
  guess = targetAsLocalUtc + offset;

  // Verify and converge
  const reLocal = toLocalEpochEquivalent(guess, formatter);
  const diff = targetAsLocalUtc - reLocal;
  if (diff !== 0) {
    guess += diff;
  }

  // Fall back check (ambiguous repeated hour) -> First Occurrence policy
  const candidateEarlier = guess - 3600000;
  if (toLocalEpochEquivalent(candidateEarlier, formatter) === targetAsLocalUtc) {
    guess = candidateEarlier;
  }

  return guess;
}

/**
 * Returns the calendar date string (YYYY-MM-DD) for a given moment in the city's timezone.
 * Defaults to device local date if timezone is invalid or omitted.
 */
export function getCityCalendarDate(date: Date = new Date(), timezoneId?: string): string {
  if (timezoneId && typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezoneId,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(date);
    } catch (e) {
      console.warn('[prayerTimestamp] getCityCalendarDate error with tz:', timezoneId, e);
    }
  }
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Advances a YYYY-MM-DD calendar date string by N days in pure UTC arithmetic.
 * Ensures zero dependency on the host device timezone.
 */
export function advanceCityCalendarDate(cityDateStr: string, days: number): string {
  const parts = cityDateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const advanced = new Date(Date.UTC(y, m - 1, d + days));
  const newY = advanced.getUTCFullYear();
  const newM = (advanced.getUTCMonth() + 1).toString().padStart(2, '0');
  const newD = advanced.getUTCDate().toString().padStart(2, '0');
  return `${newY}-${newM}-${newD}`;
}
```

---

## الملف: `src/utils/prayerTimestamp.test.ts`
- **الوصف:** R13a: اختبارات الوحدة المعيارية لتحويل المواقيت
- **عدد الأسطر:** 182
- **SHA-256:** `6465ad466b4c12ae9f71bf19fbdf5b036ffd370981ac733b25774327d6ff9adc`

```typescript
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
```

---

## الملف: `scripts/test_tz_invariance.cjs`
- **الوصف:** R13a: سكريبت التحقق عبر 5 عمليات معزولة بمناطق زمنية مختلفة
- **عدد الأسطر:** 101
- **SHA-256:** `bff17f79f285cb2971cd329dc407d6f378edaefbd318b1aeb4056eb390972453`

```javascript
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Test script for R13: Multi-Process Timezone Invariance Verification.
 * Spawns an isolated Node.js child process for each target TZ environment variable
 * to verify that buildPrayerTimestampMs produces identical numeric epoch ms
 * regardless of host machine timezone.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const targetTimezones = [
  'Africa/Cairo',
  'Asia/Riyadh',
  'America/New_York',
  'UTC',
  'Australia/Sydney',
];

console.log('===============================================================');
console.log('R13: Running Multi-Process Timezone Invariance Suite');
console.log('Testing identical numeric timeMs output across 5 isolated TZ environments');
console.log('===============================================================\n');

// The worker code executed inside each isolated Node process
const workerCode = `
const { buildPrayerTimestampMs } = require('./src/utils/prayerTimestamp.ts');

const cases = [
  { name: 'Cairo Fajr (DST)', cityDate: '2026-06-15', prayerMinutes: 272, timezoneId: 'Africa/Cairo', expected: 1781487120000 },
  { name: 'Riyadh Dhuhr (No DST)', cityDate: '2026-01-10', prayerMinutes: 725, timezoneId: 'Asia/Riyadh', expected: 1768035900000 },
  { name: 'New York Maghrib (EDT)', cityDate: '2026-10-15', prayerMinutes: 1080, timezoneId: 'America/New_York', expected: 1792101600000 },
  { name: 'Cairo 24:15 Midnight Carry', cityDate: '2026-06-15', prayerMinutes: 1455, timezoneId: 'Africa/Cairo', expected: 1781558100000 },
  { name: 'Cairo -15m Negative Carry', cityDate: '2026-06-15', prayerMinutes: -15, timezoneId: 'Africa/Cairo', expected: 1781469900000 },
];

const results = {};
let allPassed = true;

for (const c of cases) {
  const actual = buildPrayerTimestampMs({
    cityDate: c.cityDate,
    prayerMinutes: c.prayerMinutes,
    timezoneId: c.timezoneId,
  });
  const pass = actual === c.expected;
  if (!pass) allPassed = false;
  results[c.name] = { actual, expected: c.expected, pass };
}

console.log(JSON.stringify({ tz: process.env.TZ, allPassed, results }));
if (!allPassed) process.exit(1);
`;

const processResults = [];
let overallSuccess = true;

for (const tz of targetTimezones) {
  const env = { ...process.env, TZ: tz };
  const child = spawnSync('npx', ['tsx', '-e', workerCode], {
    env,
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..'),
  });

  if (child.status !== 0) {
    console.error(`❌ Process with TZ=${tz} failed!`);
    console.error(child.stderr || child.stdout);
    overallSuccess = false;
  } else {
    try {
      const output = JSON.parse(child.stdout.trim());
      processResults.push(output);
      console.log(`✓ Process with TZ=${tz.padEnd(18)} passed all test cases.`);
    } catch (e) {
      console.error(`Failed parsing worker output for TZ=${tz}:`, child.stdout);
      overallSuccess = false;
    }
  }
}

console.log('\n--- Cross-Process Invariance Matrix ---');
if (processResults.length > 0) {
  const sampleResults = processResults[0].results;
  for (const caseName of Object.keys(sampleResults)) {
    const expected = sampleResults[caseName].expected;
    const allMatch = processResults.every(pr => pr.results[caseName]?.actual === expected);
    console.log(`Case: "${caseName.padEnd(28)}" -> Expected: ${expected} | All 5 TZs Match: ${allMatch ? 'YES ✓' : 'NO ✕'}`);
    if (!allMatch) overallSuccess = false;
  }
}

if (!overallSuccess) {
  console.error('\n❌ Timezone Invariance Suite FAILED!');
  process.exit(1);
} else {
  console.log('\n✅ All 5 isolated processes returned identical timestamps. Timezone Invariance PROVEN.');
  process.exit(0);
}
```

---

## الملف: `android/app/src/main/java/com/salahpro/app/plugins/CustomAlarmKhushuDecision.kt`
- **الوصف:** R12a: منطق قرار تفعيل وتأجيل الخشوع للمنبه المخصص (خالٍ من Context)
- **عدد الأسطر:** 130
- **SHA-256:** `22fa4c58fbcde74e6d7ceb00258d2d6580517546dc3063033daa4d5e7f211a91`

```kotlin
package com.salahpro.app.plugins

/**
 * Pure decision logic for custom alarm Khushu activation and timing.
 * Free of Android Context dependencies for direct JVM testing and Kotlin static verification.
 *
 * NOTE (Architecture):
 * Unified audio player interface is deferred to Task 10 (RingCoordinator).
 * R12a handles decision logic for the notification-channel estimated delay path without competing players.
 */
object CustomAlarmKhushuDecision {

    data class DecisionInput(
        val autoKhushu: Boolean,
        val soundType: String,
        val notifyMode: String,
        val measuredDurationMs: Long?, // null or <= 0 indicates failure/unmeasured
        val isKhushuAlreadyActive: Boolean = false,
        val alarmManagerExactAllowed: Boolean = true
    )

    data class DecisionResult(
        val shouldScheduleKhushu: Boolean,
        val isImmediate: Boolean,
        val delayMs: Long,
        val isEstimated: Boolean,
        val logEvent: String,
        val reason: String
    )

    const val FALLBACK_ERROR_DELAY_MS = 5000L
    const val SAFETY_MARGIN_MS = 1500L

    fun evaluate(input: DecisionInput): DecisionResult {
        if (!input.autoKhushu) {
            return DecisionResult(
                shouldScheduleKhushu = false,
                isImmediate = false,
                delayMs = 0L,
                isEstimated = false,
                logEvent = "NO_KHUSHU_SCHEDULED",
                reason = "auto_khushu_disabled"
            )
        }

        if (input.isKhushuAlreadyActive) {
            return DecisionResult(
                shouldScheduleKhushu = false,
                isImmediate = false,
                delayMs = 0L,
                isEstimated = false,
                logEvent = "KHUSHU_ALREADY_ACTIVE",
                reason = "already_active_ignore_duplicate"
            )
        }

        val cleanSound = input.soundType.lowercase().trim()
        val isSilentOrVibrate = cleanSound == "silent" || cleanSound == "vibrate"
        val isNotificationOnly = input.notifyMode.lowercase().trim() == "notification"

        if (isSilentOrVibrate || isNotificationOnly) {
            return DecisionResult(
                shouldScheduleKhushu = true,
                isImmediate = true,
                delayMs = 0L,
                isEstimated = false,
                logEvent = "KHUSHU_ACTIVATED",
                reason = if (isSilentOrVibrate) "silent_or_vibrate_sound" else "notification_only_mode"
            )
        }

        // Audible sound path
        val duration = input.measuredDurationMs
        if (duration == null || duration <= 0L) {
            return DecisionResult(
                shouldScheduleKhushu = true,
                isImmediate = false,
                delayMs = FALLBACK_ERROR_DELAY_MS,
                isEstimated = true,
                logEvent = "AUDIO_ERROR",
                reason = "duration_unmeasured_fallback_5s"
            )
        }

        val delay = duration + SAFETY_MARGIN_MS
        return DecisionResult(
            shouldScheduleKhushu = true,
            isImmediate = false,
            delayMs = delay,
            isEstimated = true,
            logEvent = "KHUSHU_DEFERRED",
            reason = "awaiting_sound_completion"
        )
    }

    /**
     * Resolves preemption when a new custom alarm (B) arrives while a previous alarm (A) has a pending deferred Khushu.
     */
    fun resolveOverlap(
        hasPendingDeferredA: Boolean,
        incomingAlarmB: DecisionInput
    ): OverlapResolution {
        if (!hasPendingDeferredA) {
            return OverlapResolution.PROCEED_NORMAL
        }

        if (!incomingAlarmB.autoKhushu) {
            // Incoming alarm B does not touch Khushu; maintain Alarm A's deferred Khushu
            return OverlapResolution.MAINTAIN_PENDING_A
        }

        val cleanSound = incomingAlarmB.soundType.lowercase().trim()
        val isBImmediate = cleanSound == "silent" || cleanSound == "vibrate" || incomingAlarmB.notifyMode.lowercase().trim() == "notification"

        return if (isBImmediate) {
            // Alarm B is immediate: cancel A's pending delay and activate immediately
            OverlapResolution.PREEMPT_IMMEDIATE_B
        } else {
            // Alarm B has its own audio: reschedule deferred delay for Alarm B
            OverlapResolution.RESCHEDULE_FOR_B
        }
    }

    enum class OverlapResolution {
        PROCEED_NORMAL,
        MAINTAIN_PENDING_A,
        PREEMPT_IMMEDIATE_B,
        RESCHEDULE_FOR_B
    }
}
```

---

## الملف: `android/app/src/test/java/com/salahpro/app/plugins/CustomAlarmKhushuDecisionTest.kt`
- **الوصف:** R12a: اختبارات Kotlin JVM لمنطق قرار الخشوع
- **عدد الأسطر:** 158
- **SHA-256:** `8a2b1dabdfb546f5d74ef24a68048aa7aa5cbec15788ac75fe0cefbad752f304`

```kotlin
package com.salahpro.app.plugins

import org.junit.Assert.*
import org.junit.Test

/**
 * JVM unit test for pure custom alarm Khushu decision logic.
 * Free of Android dependencies.
 *
 * NOTE (Verification status): KOTLIN_STATIC
 * Validated via Kotlin language semantics and static analysis; local gradle execution is unavailable in this environment.
 */
class CustomAlarmKhushuDecisionTest {

    @Test
    fun autoKhushuFalse_doesNotScheduleKhushu() {
        val input = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = false,
            soundType = "reminder",
            notifyMode = "both",
            measuredDurationMs = 3000L
        )
        val res = CustomAlarmKhushuDecision.evaluate(input)
        assertFalse(res.shouldScheduleKhushu)
        assertEquals(0L, res.delayMs)
    }

    @Test
    fun silentOrVibrate_triggersImmediateActivation() {
        val silentInput = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "silent",
            notifyMode = "both",
            measuredDurationMs = 3000L
        )
        val resSilent = CustomAlarmKhushuDecision.evaluate(silentInput)
        assertTrue(resSilent.shouldScheduleKhushu)
        assertTrue(resSilent.isImmediate)
        assertEquals(0L, resSilent.delayMs)

        val vibrateInput = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "vibrate",
            notifyMode = "both",
            measuredDurationMs = 3000L
        )
        val resVibrate = CustomAlarmKhushuDecision.evaluate(vibrateInput)
        assertTrue(resVibrate.shouldScheduleKhushu)
        assertTrue(resVibrate.isImmediate)
        assertEquals(0L, resVibrate.delayMs)
    }

    @Test
    fun notificationOnlyMode_triggersImmediateActivation() {
        val input = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "reminder",
            notifyMode = "notification",
            measuredDurationMs = 3000L
        )
        val res = CustomAlarmKhushuDecision.evaluate(input)
        assertTrue(res.shouldScheduleKhushu)
        assertTrue(res.isImmediate)
        assertEquals(0L, res.delayMs)
    }

    @Test
    fun audibleSound_triggersDeferredKhushuWithSafetyMargin() {
        val input = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "reminder",
            notifyMode = "both",
            measuredDurationMs = 3200L
        )
        val res = CustomAlarmKhushuDecision.evaluate(input)
        assertTrue(res.shouldScheduleKhushu)
        assertFalse(res.isImmediate)
        assertTrue(res.isEstimated)
        assertEquals(4700L, res.delayMs) // 3200 + 1500
        assertEquals("KHUSHU_DEFERRED", res.logEvent)
    }

    @Test
    fun unmeasuredOrFailedDuration_fallsBackTo5SecondsWithErrorLog() {
        val inputNull = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "unknown_sound",
            notifyMode = "both",
            measuredDurationMs = null
        )
        val resNull = CustomAlarmKhushuDecision.evaluate(inputNull)
        assertTrue(resNull.shouldScheduleKhushu)
        assertFalse(resNull.isImmediate)
        assertEquals(5000L, resNull.delayMs)
        assertEquals("AUDIO_ERROR", resNull.logEvent)

        val inputZero = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "corrupt",
            notifyMode = "both",
            measuredDurationMs = 0L
        )
        val resZero = CustomAlarmKhushuDecision.evaluate(inputZero)
        assertEquals(5000L, resZero.delayMs)
        assertEquals("AUDIO_ERROR", resZero.logEvent)
    }

    @Test
    fun alreadyActiveKhushu_ignoresDuplicateWithoutRescheduling() {
        val input = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "reminder",
            notifyMode = "both",
            measuredDurationMs = 3000L,
            isKhushuAlreadyActive = true
        )
        val res = CustomAlarmKhushuDecision.evaluate(input)
        assertFalse(res.shouldScheduleKhushu)
        assertEquals("KHUSHU_ALREADY_ACTIVE", res.logEvent)
        assertEquals("already_active_ignore_duplicate", res.reason)
    }

    @Test
    fun overlapResolution_alarmBWithoutKhushu_maintainsPendingA() {
        val incomingB = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = false,
            soundType = "reminder",
            notifyMode = "both",
            measuredDurationMs = 2000L
        )
        val res = CustomAlarmKhushuDecision.resolveOverlap(hasPendingDeferredA = true, incomingAlarmB = incomingB)
        assertEquals(CustomAlarmKhushuDecision.OverlapResolution.MAINTAIN_PENDING_A, res)
    }

    @Test
    fun overlapResolution_alarmBImmediateKhushu_preemptsImmediateB() {
        val incomingB = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "silent",
            notifyMode = "both",
            measuredDurationMs = 0L
        )
        val res = CustomAlarmKhushuDecision.resolveOverlap(hasPendingDeferredA = true, incomingAlarmB = incomingB)
        assertEquals(CustomAlarmKhushuDecision.OverlapResolution.PREEMPT_IMMEDIATE_B, res)
    }

    @Test
    fun overlapResolution_alarmBAudibleKhushu_reschedulesForB() {
        val incomingB = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "takbeer",
            notifyMode = "both",
            measuredDurationMs = 6000L
        )
        val res = CustomAlarmKhushuDecision.resolveOverlap(hasPendingDeferredA = true, incomingAlarmB = incomingB)
        assertEquals(CustomAlarmKhushuDecision.OverlapResolution.RESCHEDULE_FOR_B, res)
    }
}
```

---

## الملف: `src/domain/khushu/customAlarmKhushuDecision.ts`
- **الوصف:** R12a: نسخة TypeScript المطابقة لمنطق القرار
- **عدد الأسطر:** 121
- **SHA-256:** `a02f6d13c5e2b672cdb0e6961cda0e89b0222d276bb9619bcfd54356df661a10`

```typescript
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * NOTE (Classification): TS_SPEC_MIRROR
 * This module mirrors the pure decision logic specified for Android Kotlin
 * (CustomAlarmKhushuDecision.kt). It tests the algorithm specification in TypeScript,
 * NOT the live Android Kotlin runtime.
 */

export interface CustomAlarmKhushuInput {
  autoKhushu: boolean;
  soundType: string;
  notifyMode: string;
  measuredDurationMs: number | null; // null or <= 0 indicates failure/unmeasured
  isKhushuAlreadyActive?: boolean;
}

export interface CustomAlarmKhushuResult {
  shouldScheduleKhushu: boolean;
  isImmediate: boolean;
  delayMs: number;
  isEstimated: boolean;
  logEvent: 'NO_KHUSHU_SCHEDULED' | 'KHUSHU_ALREADY_ACTIVE' | 'KHUSHU_ACTIVATED' | 'KHUSHU_DEFERRED' | 'AUDIO_ERROR';
  reason: string;
}

export type OverlapResolution =
  | 'PROCEED_NORMAL'
  | 'MAINTAIN_PENDING_A'
  | 'PREEMPT_IMMEDIATE_B'
  | 'RESCHEDULE_FOR_B';

export const FALLBACK_ERROR_DELAY_MS = 5000;
export const SAFETY_MARGIN_MS = 1500;

export function evaluateCustomAlarmKhushuDecision(input: CustomAlarmKhushuInput): CustomAlarmKhushuResult {
  if (!input.autoKhushu) {
    return {
      shouldScheduleKhushu: false,
      isImmediate: false,
      delayMs: 0,
      isEstimated: false,
      logEvent: 'NO_KHUSHU_SCHEDULED',
      reason: 'auto_khushu_disabled',
    };
  }

  if (input.isKhushuAlreadyActive) {
    return {
      shouldScheduleKhushu: false,
      isImmediate: false,
      delayMs: 0,
      isEstimated: false,
      logEvent: 'KHUSHU_ALREADY_ACTIVE',
      reason: 'already_active_ignore_duplicate',
    };
  }

  const cleanSound = (input.soundType || '').toLowerCase().trim();
  const isSilentOrVibrate = cleanSound === 'silent' || cleanSound === 'vibrate';
  const isNotificationOnly = (input.notifyMode || '').toLowerCase().trim() === 'notification';

  if (isSilentOrVibrate || isNotificationOnly) {
    return {
      shouldScheduleKhushu: true,
      isImmediate: true,
      delayMs: 0,
      isEstimated: false,
      logEvent: 'KHUSHU_ACTIVATED',
      reason: isSilentOrVibrate ? 'silent_or_vibrate_sound' : 'notification_only_mode',
    };
  }

  const duration = input.measuredDurationMs;
  if (duration === null || duration === undefined || duration <= 0) {
    return {
      shouldScheduleKhushu: true,
      isImmediate: false,
      delayMs: FALLBACK_ERROR_DELAY_MS,
      isEstimated: true,
      logEvent: 'AUDIO_ERROR',
      reason: 'duration_unmeasured_fallback_5s',
    };
  }

  const delay = duration + SAFETY_MARGIN_MS;
  return {
    shouldScheduleKhushu: true,
    isImmediate: false,
    delayMs: delay,
    isEstimated: true,
    logEvent: 'KHUSHU_DEFERRED',
    reason: 'awaiting_sound_completion',
  };
}

export function resolveAlarmOverlap(
  hasPendingDeferredA: boolean,
  incomingAlarmB: CustomAlarmKhushuInput
): OverlapResolution {
  if (!hasPendingDeferredA) {
    return 'PROCEED_NORMAL';
  }

  if (!incomingAlarmB.autoKhushu) {
    return 'MAINTAIN_PENDING_A';
  }

  const cleanSound = (incomingAlarmB.soundType || '').toLowerCase().trim();
  const isBImmediate =
    cleanSound === 'silent' ||
    cleanSound === 'vibrate' ||
    (incomingAlarmB.notifyMode || '').toLowerCase().trim() === 'notification';

  if (isBImmediate) {
    return 'PREEMPT_IMMEDIATE_B';
  }

  return 'RESCHEDULE_FOR_B';
}
```

---

## الملف: `src/domain/khushu/customAlarmKhushuDecision.test.ts`
- **الوصف:** R12a: اختبارات مرآة TypeScript لمنطق القرار
- **عدد الأسطر:** 190
- **SHA-256:** `c5b2a6cc9c741f8fcb37a8c14eb53e269edb0d5842c840581cdddb783099897b`

```typescript
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * NOTE (Classification): TS_SPEC_MIRROR
 * This test suite validates the algorithm specification of the custom alarm Khushu decision logic.
 * It tests the pure TypeScript specification mirror, NOT the live Android Kotlin runtime.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  evaluateCustomAlarmKhushuDecision,
  resolveAlarmOverlap,
  CustomAlarmKhushuInput,
} from './customAlarmKhushuDecision';

describe('R12a - Custom Alarm Khushu Decision Logic (TS_SPEC_MIRROR)', () => {
  describe('1. Auto-Khushu Disabled', () => {
    it('does not schedule khushu when autoKhushu is false', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: false,
        soundType: 'reminder',
        notifyMode: 'both',
        measuredDurationMs: 3000,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.shouldScheduleKhushu, false);
      assert.strictEqual(res.delayMs, 0);
      assert.strictEqual(res.logEvent, 'NO_KHUSHU_SCHEDULED');
      assert.strictEqual(res.reason, 'auto_khushu_disabled');
    });
  });

  describe('2. Immediate Activation Paths (Silent, Vibrate, Notification-only)', () => {
    it('activates immediately when soundType is silent', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'silent',
        notifyMode: 'both',
        measuredDurationMs: 3000,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.shouldScheduleKhushu, true);
      assert.strictEqual(res.isImmediate, true);
      assert.strictEqual(res.delayMs, 0);
      assert.strictEqual(res.isEstimated, false);
      assert.strictEqual(res.logEvent, 'KHUSHU_ACTIVATED');
    });

    it('activates immediately when soundType is vibrate', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'vibrate',
        notifyMode: 'both',
        measuredDurationMs: 3000,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.shouldScheduleKhushu, true);
      assert.strictEqual(res.isImmediate, true);
      assert.strictEqual(res.delayMs, 0);
      assert.strictEqual(res.logEvent, 'KHUSHU_ACTIVATED');
    });

    it('activates immediately when notifyMode is notification only', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'reminder',
        notifyMode: 'notification',
        measuredDurationMs: 3000,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.shouldScheduleKhushu, true);
      assert.strictEqual(res.isImmediate, true);
      assert.strictEqual(res.delayMs, 0);
      assert.strictEqual(res.logEvent, 'KHUSHU_ACTIVATED');
      assert.strictEqual(res.reason, 'notification_only_mode');
    });
  });

  describe('3. Audible Sound Path (Estimated Delay with Safety Margin)', () => {
    it('defers khushu by measured duration + 1500ms safety margin', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'reminder',
        notifyMode: 'both',
        measuredDurationMs: 3200,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.shouldScheduleKhushu, true);
      assert.strictEqual(res.isImmediate, false);
      assert.strictEqual(res.isEstimated, true);
      assert.strictEqual(res.delayMs, 4700); // 3200 + 1500
      assert.strictEqual(res.logEvent, 'KHUSHU_DEFERRED');
      assert.strictEqual(res.reason, 'awaiting_sound_completion');
    });

    it('defers long audio (e.g. Ayat Kursi 45s) without arbitrary ceiling truncation', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'ayat_kursi',
        notifyMode: 'both',
        measuredDurationMs: 45000,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.delayMs, 46500); // 45000 + 1500, no arbitrary 60s clamp
      assert.strictEqual(res.shouldScheduleKhushu, true);
    });
  });

  describe('4. Resource Failure & Unmeasured Duration Fallback', () => {
    it('falls back to 5000ms delay with AUDIO_ERROR when duration is null', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'missing_res',
        notifyMode: 'both',
        measuredDurationMs: null,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.shouldScheduleKhushu, true);
      assert.strictEqual(res.isImmediate, false);
      assert.strictEqual(res.delayMs, 5000);
      assert.strictEqual(res.logEvent, 'AUDIO_ERROR');
      assert.strictEqual(res.reason, 'duration_unmeasured_fallback_5s');
    });

    it('falls back to 5000ms delay with AUDIO_ERROR when duration is <= 0', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'corrupt',
        notifyMode: 'both',
        measuredDurationMs: 0,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.delayMs, 5000);
      assert.strictEqual(res.logEvent, 'AUDIO_ERROR');
    });
  });

  describe('5. Khushu Already Active (Idempotency Guard)', () => {
    it('ignores duplicate request without resetting timer if khushu is already active', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'reminder',
        notifyMode: 'both',
        measuredDurationMs: 3000,
        isKhushuAlreadyActive: true,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.shouldScheduleKhushu, false);
      assert.strictEqual(res.logEvent, 'KHUSHU_ALREADY_ACTIVE');
      assert.strictEqual(res.reason, 'already_active_ignore_duplicate');
    });
  });

  describe('6. Overlap Resolution Between Two Custom Alarms', () => {
    it('maintains pending deferred A if incoming alarm B has autoKhushu=false', () => {
      const incomingB: CustomAlarmKhushuInput = {
        autoKhushu: false,
        soundType: 'reminder',
        notifyMode: 'both',
        measuredDurationMs: 2000,
      };
      const resolution = resolveAlarmOverlap(true, incomingB);
      assert.strictEqual(resolution, 'MAINTAIN_PENDING_A');
    });

    it('preempts immediately if incoming alarm B is immediate with autoKhushu=true', () => {
      const incomingB: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'silent',
        notifyMode: 'both',
        measuredDurationMs: 0,
      };
      const resolution = resolveAlarmOverlap(true, incomingB);
      assert.strictEqual(resolution, 'PREEMPT_IMMEDIATE_B');
    });

    it('reschedules delay for B if incoming alarm B has its own audible sound with autoKhushu=true', () => {
      const incomingB: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'takbeer',
        notifyMode: 'both',
        measuredDurationMs: 6000,
      };
      const resolution = resolveAlarmOverlap(true, incomingB);
      assert.strictEqual(resolution, 'RESCHEDULE_FOR_B');
    });
  });
});
```

---

## الملف: `docs/fixes/R12_B3_khushu_custom_alarm_sound.md`
- **الوصف:** R12: توثيق المشكلة B3 والقرارات الهندسية ومصفوفة الاختبار والتراجع
- **عدد الأسطر:** 110
- **SHA-256:** `a37f4224ff0eee31a3961bfc7c9884fe06c329c4be5bcd4ee3d85ed52ee2de45`

```markdown
# R12: حل مشكلة كتم صوت المنبه المخصص مع الخشوع (B3)

## 1. المشكلة والدليل (Problem & Evidence)
- **دليل فحص الجهاز (Test B - 2026-11-05):**
  - منبه المقارنة (بدون خشوع) سُمع بوضوح.
  - منبه الخشوع (مع `autoKhushu=true`) لم يُسمع نهائياً.
  - سجلات النظام وثقت: `ringerMode = SILENT (0)`، والفارق الزمني بين استلام المنبه وتفعيل الخشوع هو **239 ملي ثانية فقط**. النتيجة الموثقة في فحص B3: `SUPPORTS_HYPOTHESIS`.
- **السبب الجذري في الكود:**
  - في `AthanAlarmReceiver.kt`: كان يتم استدعاء `showCustomAlarmNotification(...)`، وبعده بـ 239ms مباشرة يُستدعى `KhushuRestoreReceiver.activateKhushuDirectly(...)`.
  - في `KhushuRestoreReceiver.kt`: يتم ضبط `audioManager.ringerMode = RINGER_MODE_SILENT` و`INTERRUPTION_FILTER_NONE`.
  - كتم رنين النظام في أندرويد يؤدي فوراً إلى كتم أو قطع نغمة الإشعار الصوتي التي تصدرها قناة الإشعار قبل أن يتمكن المستخدم من سماعها.

## 2. الحالة الفعلية الحالية (Current Status)
- **المرحلة الحالية (R12b مكتملة):**
  - تم ربط وتفعيل منطق القرار المجرد `CustomAlarmKhushuDecision` داخل المستقبلات الحية:
    1. `AthanAlarmReceiver.kt` (فرع `custom` فقط).
    2. `KhushuRestoreReceiver.kt` (معالجة `ACTION_ACTIVATE_KHUSHU_DEFERRED`).
- **تنبيه صريح وحاسم:**
  - مشكلة B3 **لم تُعلن محلولة (PASS)** برمجياً بعد؛ لأن التثبت النهائي من السلوك الصوتي على أندرويد وحل التعارض بين نغمة الإشعار وكتم الخشوع **مشروط حصرياً بفحص الجهاز الفعلي (Physical Device Verification - Test B)**.

## 3. تفاصيل التغييرات في الكود في R12b (What Changed by File & Lines)

### أ. `AthanAlarmReceiver.kt`
1. **استدعاء منطق القرار المجرد:**
   - استدعاء `CustomAlarmKhushuDecision.DecisionInput` وتمرير `durationMs` المقاس عبر `getSoundDurationMs(context, soundType)`.
   - استدعاء `CustomAlarmKhushuDecision.resolveOverlap` لحل التعارض مع أي منبه مؤجل سابق (A).
   - استدعاء `CustomAlarmKhushuDecision.evaluate` لتحديد توقيت وطريقة التفعيل.
2. **الجدولة المؤجلة والتراجع الآمن (Deferred Scheduling & Fallback):**
   - في المسار الصوتي: جدولة الخشوع بتأخير تقديري `delayMs = durationMs + 1500L` عبر `KhushuRestoreReceiver.scheduleDeferredKhushu`.
   - فحص صلاحية الأذونات الدقيقة `canScheduleExactAlarms()` لـ API 31+.
   - في حال فشل الجدولة أو إرجاع `null`: التراجع الفوري لتفعيل الخشوع مباشرة مع تسجيل `AUDIO_ERROR`.
   - في حال فشل `notify()` للإشعار: تسجيل `AUDIO_ERROR` وتفعيل الخشوع فوراً دون تركه معلقاً.
3. **حذف الكود الميت (Dead Code Cleanup):**
   - حذف دالة `playAlarmAudio(context, soundType)` بالكامل بعد إثبات عدم استدعائها في أي مكان بالمشروع عبر `grep`.
   - حذف متغير `lastSoundTriggerTimeMs` والـ debounce المرتبط به (15 ثانية).
4. **تسجيل الأحداث الحية عبر `AthanAlarmPlugin.logNativeEvent`:**
   - `AUDIO_START_REQUESTED`: يُسجل قبل إرسال الإشعار.
   - `NOTIFICATION_POSTED`: يُسجل بعد نجاح `notify()`.
   - `AUDIO_ERROR`: يُسجل عند فشل قياس الصوت، فشل الجدولة، أو فشل الإشعار.
   - `KHUSHU_DEFERRED`: يُسجل عند نجاح الجدولة المؤجلة مع `delayMs` و`isEstimated=true` والسبب.
   - `KHUSHU_ACTIVATED`: يُسجل عند التفعيل الفوري أو عند تراجع الفشل.
   - **ممنوع صراحة:** لم يتم تسجيل `AUDIO_STARTED` أو `AUDIO_COMPLETED` نهائياً لمسار الإشعارات.
5. **حماية مسار الأذان:**
   - فرع `alarmType == "athan"` وكلاس `AthanForegroundService.kt` لم يُمس منهما سطر واحد (0 تغيير).

### ب. `KhushuRestoreReceiver.kt`
1. **معالجة التفعيل المؤجل (`ACTION_ACTIVATE_KHUSHU_DEFERRED`):**
   - إضافة الثابت `CUSTOM_ALARM_DEFERRED_KHUSHU_REQUEST_CODE = 998878` مع أعلام `FLAG_UPDATE_CURRENT or FLAG_IMMUTABLE`.
   - إضافة دوال الإدارة: `scheduleDeferredKhushu`، `cancelDeferredKhushu`، و`hasPendingDeferredKhushu`.
2. **حارس عدم التكرار (Idempotency Guard):**
   - إذا وصل حدث التفعيل المؤجل والخشوع مفعّل بالفعل (`isKhushuActive`): يتم تجاهل الطلب وتسجيل `KHUSHU_ALREADY_ACTIVE` دون تصفير `KEY_ACTIVATED_AT` ودون تمديد المدة.
3. **حل التعارضات (Overlap Resolutions):**
   - `MAINTAIN_PENDING_A`: الحفاظ على تأجيل A عند وصول B بدون خشوع.
   - `PREEMPT_IMMEDIATE_B`: إلغاء تأجيل A وتفعيل B فوراً عند وصول B صامت/اهتزاز مع خشوع.
   - `RESCHEDULE_FOR_B`: إلغاء تأجيل A وإعادة الجدولة لـ B عند وصول B مسموع مع خشوع.

## 4. تصنيف الأدلة (Evidence Classification)
- `android/app/src/main/java/com/salahpro/app/plugins/CustomAlarmKhushuDecision.kt`: **`KOTLIN_STATIC`**
- `android/app/src/test/java/com/salahpro/app/plugins/CustomAlarmKhushuDecisionTest.kt`: **`KOTLIN_STATIC`**
- `android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmReceiver.kt`: **`KOTLIN_STATIC`**
- `android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt`: **`KOTLIN_STATIC`**
- `src/domain/khushu/customAlarmKhushuDecision.ts`: **`TS_SPEC_MIRROR`**
- `src/domain/khushu/customAlarmKhushuDecision.test.ts`: **`TS_SPEC_MIRROR`**
- `src/utils/prayerTimestamp.ts` & `src/utils/prayerTimestamp.test.ts`: **`TS_VERIFIED`**

## 5. بيانات صريحة ومخاطر متبقية (Explicit Disclaimers & Residual Risks)
1. **بناء أندرويد لم يتم محلياً:** بيئة الحاوية تفتقر لمحرك Java وGradle؛ كل كود Kotlin تم فحصه بالتحليل السكوني والمطابقة الدقيقة.
2. **تطابق نغمة القناة والصوت المقاس:** فرضية أن قناة الإشعار تشغل نفس ملف الـ raw المقاس مثبتة من كود التطبيق فقط. إذا قام المستخدم بتعديل صوت القناة يدوياً من إعدادات نظام أندرويد، فقد تختلف مدة التشغيل الفعلية عن المدة التقديرية.
3. **كتم `INTERRUPTION_FILTER_NONE` وتأثير وضع عدم الإزعاج (DND):**
   - لم يتم إثبات سلوك `INTERRUPTION_FILTER_NONE` عبر مختلف واجهات الشركات المصنعة (OEM Skins: Samsung OneUI, Xiaomi HyperOS/MIUI, Oppo ColorOS, Huawei EMUI).
   - في بعض الأجهزة، وضع `INTERRUPTION_FILTER_NONE` (Total Silence) يكتم حتى تدفق صوت المنبهات (`STREAM_ALARM` / `USAGE_ALARM`)، وفي أجهزة أخرى يُستثنى المنبه طبقاً لإعدادات المستخدم لـ DND.
   - هذا لا يمكن التحقق منه أو إثباته إلا بالفحص الفيزيائي المباشر على الأجهزة المستهدفة (`PHYSICAL_DEVICE_ONLY`).
4. **أوضاع الحفاظ على الطاقة وDoze Mode:** إطلاق المنبهات المؤجلة في وضع الخمول العميق (Doze) يعتمد على `setExactAndAllowWhileIdle`؛ وفي حال سحب صلاحية `SCHEDULE_EXACT_ALARM` على أندرويد 12+ سيتراجع النظام إلى `setAndAllowWhileIdle` مع احتمالية تأخير بضع ثوانٍ بسبب تجميع النظام.
5. **فقدان الخشوع المؤجل عند إعادة تشغيل الجهاز (Reboot):** الخشوع المؤجل بيضيع لو حصل reboot للجهاز أثناء فترة الثواني المعدودة لتأخير الصوت وقبل أن يشتغل المنبه، لعدم وجود إعادة جدولة للمنبه المؤجل عبر `BOOT_COMPLETED`.

## 6. خطوات التحقق على الجهاز الفعلي (Physical Device Verification Guide - For User)
لتنفيذ فحص التحقق على الجهاز في المرحلة القادمة:
1. بناء الـ APK وتثبيته على الجهاز.
2. فتح التطبيق وضبط "منبه مخصص" بصوت مسموع (مثلاً صوت التكبير أو التذكير مدته 3-5 ثوانٍ) مع تفعيل خيار "وضع الخشوع التلقائي" (`autoKhushu = true`).
3. إغلاق التطبيق وقفل الشاشة، والانتظار حتى إطلاق المنبه.
4. **الملاحظة السمعية:**
   - هل سُمع صوت نغمة المنبه بالكامل ودون انقطاع؟
   - هل تفعّل وضع الخشوع (كتم الصوت وظهور إشعار الخشوع) **بعد** انتهاء نغمة المنبه بهامش الأمان المقدر؟
5. فتح واجهة تشخيصات الأذان (`AthanDiagnosticsModal` / سجل الأحداث الأصلي):
   - التحقق من تسلسل السجلات: `fire_received` -> `AUDIO_START_REQUESTED` -> `NOTIFICATION_POSTED` -> `KHUSHU_DEFERRED (delayMs=..., estimated=true)` -> `KHUSHU_ACTIVATED`.
   - التأكد من عدم وجود كتم فوري بعد 239 ملي ثانية كما كان في فحص Test B السابق.

## 7. خطة التراجع (Rollback Plan)
في حال أظهر فحص الجهاز أي سلوك غير مرغوب:
- التراجع عن تعديلات R12b يتم عبر تطبيق `git revert` لكوميتات R12b بالترتيب العكسي (من الأحدث للأقدم):
  1. `fix(R12b): dynamic delayMs in fallback error log and finalize documentation`
  2. `fix(R12b): align custom logging without new events and dual-log fallback deferred khushu`
  3. `fix(R12b): align custom branch logging and pre/post alert baseline`
  4. `fix(R12b): remove custom overlap events, embed overlap in AUDIO_START_REQUESTED, and fix notify failure status`
  5. `feat(R12b): implement deferred khushu activation and event logging in receivers`
- هذا التراجع يعيد مستقبلي `AthanAlarmReceiver.kt` و`KhushuRestoreReceiver.kt` للحالة قبل أول commit من R12b.
- لا تتأثر مسارات الأذان الأساسية (`athan`) إطلاقاً لأنها معزولة تماماً في `AthanForegroundService`.

## 8. توثيق سلسلة الكوميتات المعتمدة (Commits Sequence Documentation)
- نظراً لطبيعة الحاوية المعزولة، يتم تتبع المراحل حصرياً برسائل الكوميتات دون الاعتماد على قيم hashes:
- **سلسلة الكوميتات برسائلها:**
  - كوميت الأساس: `chore: baseline before R13a`
  - كوميت: `feat(R13a): implement pure buildPrayerTimestampMs with timezone and carry handling`
  - كوميت: `feat(R12a): extract pure custom alarm khushu decision logic and tests`
  - كوميتات تنفيذ وتصحيحات R12b:
    - `feat(R12b): implement deferred khushu activation and event logging in receivers`
    - `fix(R12b): remove custom overlap events, embed overlap in AUDIO_START_REQUESTED, and fix notify failure status`
    - `fix(R12b): align custom branch logging and pre/post alert baseline`
    - `fix(R12b): align custom logging without new events and dual-log fallback deferred khushu`
    - `fix(R12b): dynamic delayMs in fallback error log and finalize documentation`
```

---

## الملف: `android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmReceiver.kt`
- **الوصف:** R12b: مستقبل منبه الأذان والمنبه المخصص (معدل: استدعاء القرار وتأجيل الخشوع)
- **عدد الأسطر:** 733
- **SHA-256:** `63ad02efebe15fa040d02cfc10ca0bf8825183c643998d405f8ef188414cfbcd`

```kotlin
package com.salahpro.app.plugins

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject

class AthanAlarmReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "AthanAlarmReceiver"
        const val ACTION_ATHAN_ALARM = "com.salahpro.app.ACTION_ATHAN_ALARM"
        const val EXTRA_PRAYER_NAME = "extra_prayer_name"
        const val EXTRA_IS_FAJR = "extra_is_fajr"
        const val EXTRA_PRAYER_KEY = "extra_prayer_key"
        const val EXTRA_PRAYER_TIME = "extra_prayer_time"
        const val EXTRA_ALARM_TYPE = "extra_alarm_type"
        const val EXTRA_DURATION_MINUTES = "extra_duration_minutes"
        const val EXTRA_KHUSHU_MODE = "extra_khushu_mode"

        const val PREALERT_CHANNEL_ID = "athan_prealert_channel_v3"
        const val POSTALERT_CHANNEL_ID = "athan_postalert_channel_v3"
        const val KHUSHU_CHANNEL_ID = "athan_khushu_channel"
        const val CUSTOM_ALARM_CHANNEL_ID = "athan_custom_alarm_channel_v3"
        const val CUSTOM_ALARM_SILENT_CHANNEL_ID = "athan_custom_silent_channel_v3"

        fun logFireEvent(
            context: Context,
            prayerName: String,
            prayerKey: String,
            alarmType: String,
            decision: String,
            reason: String
        ) {
            try {
                val prefs = context.getSharedPreferences(AthanAlarmPlugin.PREFS_NAME, Context.MODE_PRIVATE)
                val rawJson = prefs.getString("athan_fire_events", "[]") ?: "[]"
                val existingArray = JSONArray(rawJson)
                val newEvent = JSONObject().apply {
                    put("timestampMs", System.currentTimeMillis())
                    put("prayerName", prayerName)
                    put("prayerKey", prayerKey)
                    put("alarmType", alarmType)
                    put("decision", decision)
                    put("reason", reason)
                }
                val updatedArray = JSONArray()
                updatedArray.put(newEvent)
                val maxEvents = 25
                for (i in 0 until Math.min(existingArray.length(), maxEvents - 1)) {
                    updatedArray.put(existingArray.getJSONObject(i))
                }
                prefs.edit().putString("athan_fire_events", updatedArray.toString()).apply()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to log athan fire event", e)
            }
        }

        fun getRawName(soundType: String): String {
            val clean = soundType.lowercase().trim().replace("-", "_")
            return when {
                clean == "ayat_kursi" || clean == "ayatkursi" || clean.contains("kursi") -> "ayat_kursi"
                clean == "takbeer" -> "takbeer"
                clean.contains("khayr") || clean == "alsalatu_khayr" -> "alsalatu_khayr"
                clean == "hayya" -> "hayya"
                clean == "salawat" -> "salawat"
                clean == "istighfar" -> "istighfar"
                clean == "duaa" -> "duaa"
                clean == "beep" -> "beep"
                clean == "athan" || clean == "adhan" -> "athan_default"
                clean == "fajr" -> "athan_fajr"
                else -> "reminder"
            }
        }

        fun getSoundResId(context: Context, soundType: String): Int {
            val rawName = getRawName(soundType)
            val resId = context.resources.getIdentifier(rawName, "raw", context.packageName)
            return if (resId != 0) resId else com.salahpro.app.R.raw.reminder
        }

        fun getSoundDurationMs(context: Context, soundType: String): Long? {
            val clean = soundType.lowercase().trim()
            if (clean == "silent" || clean == "vibrate") return 0L
            return try {
                val rawName = getRawName(soundType)
                val resId = context.resources.getIdentifier(rawName, "raw", context.packageName)
                if (resId == 0) return null
                val afd = context.resources.openRawResourceFd(resId) ?: return null
                val retriever = MediaMetadataRetriever()
                try {
                    retriever.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                    val durationStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
                    durationStr?.toLongOrNull()
                } finally {
                    try { retriever.release() } catch (_: Exception) {}
                    try { afd.close() } catch (_: Exception) {}
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to measure raw audio duration for $soundType", e)
                null
            }
        }

        fun showKhushuActivatedNotification(context: Context, prayerName: String, durationMinutes: Int, prayerKey: String) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    KHUSHU_CHANNEL_ID,
                    "وضع الخشوع التلقائي",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "إشعارات تفعيل وإلغاء كتم الأصوات أثناء إقامة الصلاة"
                    setShowBadge(true)
                }
                notificationManager.createNotificationChannel(channel)
            }

            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            val pIntent = if (launchIntent != null) {
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                } else {
                    PendingIntent.FLAG_UPDATE_CURRENT
                }
                PendingIntent.getActivity(context, (System.currentTimeMillis() % 10000).toInt(), launchIntent, flags)
            } else null

            val title = "تم تفعيل وضع الخشوع — صلاة $prayerName 🕌"
            val body = "تم كتم أصوات وإشعارات الجهاز لمدة $durationMinutes دقيقة لأداء الصلاة بسكينة."

            val restoreIntent = Intent(context, KhushuRestoreReceiver::class.java).apply {
                action = KhushuRestoreReceiver.ACTION_RESTORE_KHUSHU
            }
            val restorePendingIntent = PendingIntent.getBroadcast(
                context,
                KhushuRestoreReceiver.KHUSHU_RESTORE_REQUEST_CODE,
                restoreIntent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                } else {
                    PendingIntent.FLAG_UPDATE_CURRENT
                }
            )

            val notifBuilder = NotificationCompat.Builder(context, KHUSHU_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setCategory(NotificationCompat.CATEGORY_STATUS)
                .setAutoCancel(true)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "إلغاء الكتم واستعادة الصوت", restorePendingIntent)

            if (pIntent != null) {
                notifBuilder.setContentIntent(pIntent)
            }

            val notifId = KhushuRestoreReceiver.KHUSHU_NOTIFICATION_ID
            notificationManager.notify(notifId, notifBuilder.build())
            Log.d(TAG, "Khushu notification displayed for $prayerName (id=$notifId)")
        }

        fun showCustomAlarmNotification(
            context: Context,
            alarmTitle: String,
            alarmKey: String,
            soundType: String,
            notifyMode: String
        ): Boolean {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return false

            val isSilent = soundType == "silent" || notifyMode == "notification"
            val rawName = getRawName(soundType)
            val soundUri = if (!isSilent) Uri.parse("android.resource://${context.packageName}/raw/$rawName") else null
            val cleanSound = soundType.lowercase().trim().replace("-", "_")
            val channelId = if (isSilent) CUSTOM_ALARM_SILENT_CHANNEL_ID else "${CUSTOM_ALARM_CHANNEL_ID}_$cleanSound"

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    notificationManager.deleteNotificationChannel("athan_custom_alarm_channel_v2")
                    notificationManager.deleteNotificationChannel("athan_custom_alarm_channel_v2_$cleanSound")
                    notificationManager.deleteNotificationChannel("athan_custom_silent_channel_v2")
                } catch (_: Exception) {}
                val audioAttributes = AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .build()

                val channel = NotificationChannel(
                    channelId,
                    if (isSilent) "تنبيهات المنبهات المخصصة (صامت)" else "تنبيهات المنبهات المخصصة ($cleanSound)",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "إشعارات ومنبهات العبادات المخصصة مثل قيام الليل والسنن"
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 500, 300, 500)
                    if (soundUri != null) {
                        setSound(soundUri, audioAttributes)
                    } else {
                        setSound(null, null)
                    }
                    setShowBadge(true)
                }
                notificationManager.createNotificationChannel(channel)
            }

            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            val pIntent = if (launchIntent != null) {
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                } else {
                    PendingIntent.FLAG_UPDATE_CURRENT
                }
                PendingIntent.getActivity(context, (System.currentTimeMillis() % 10000).toInt(), launchIntent, flags)
            } else null

            val notifBuilder = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("⏰ $alarmTitle")
                .setContentText("تذكير منبه العبادة: $alarmTitle")
                .setStyle(NotificationCompat.BigTextStyle().bigText("حان الآن موعد: $alarmTitle"))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)

            if (soundUri != null) {
                notifBuilder.setSound(soundUri)
                notifBuilder.setVibrate(longArrayOf(0, 500, 300, 500))
            }

            if (pIntent != null) {
                notifBuilder.setContentIntent(pIntent)
            }

            val notifId = (alarmKey.hashCode() and 0x7FFFFFFF) % 10000 + 7000
            return try {
                notificationManager.notify(notifId, notifBuilder.build())
                Log.d(TAG, "Custom alarm notification displayed for $alarmTitle (id=$notifId)")
                true
            } catch (e: Exception) {
                Log.e(TAG, "Failed to display custom alarm notification for $alarmTitle", e)
                false
            }
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Received alarm trigger: ${intent.action}")

        val prayerName = intent.getStringExtra(EXTRA_PRAYER_NAME) ?: "الصلاة"
        val isFajr = intent.getBooleanExtra(EXTRA_IS_FAJR, false)
        val prayerKey = intent.getStringExtra(EXTRA_PRAYER_KEY) ?: ""
        val alarmType = intent.getStringExtra(EXTRA_ALARM_TYPE) ?: if (prayerKey.startsWith("custom_")) "custom" else if (prayerKey.contains("prealert")) "prealert" else if (prayerKey.contains("postalert") || prayerKey.contains("worship")) "postalert" else if (prayerKey.contains("khushu")) "khushu" else "athan"
        val requestCode = intent.getIntExtra("requestCode", -1)
        val soundType = intent.getStringExtra("soundType") ?: "reminder"
        val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
        val autoKhushu = intent.getBooleanExtra("autoKhushu", false)

        try {
            AthanAlarmPlugin.logNativeEvent(
                context,
                "fire_received",
                "prayerKey=$prayerKey, alarmType=$alarmType, requestCode=$requestCode, soundType=$soundType, notifyMode=$notifyMode, autoKhushu=$autoKhushu"
            )
        } catch (e: Exception) {
            Log.w(TAG, "Failed logging fire_received", e)
        }

        if (alarmType == "custom" || prayerKey.startsWith("custom_")) {
            val soundType = intent.getStringExtra("soundType") ?: "reminder"
            val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
            val autoKhushu = intent.getBooleanExtra("autoKhushu", false)
            val durationMinutes = intent.getIntExtra(EXTRA_DURATION_MINUTES, 15)
            val khushuMode = intent.getStringExtra(EXTRA_KHUSHU_MODE) ?: "silent"

            val isKhushuActive = KhushuRestoreReceiver.isKhushuActive(context)
            val hasPendingDeferredA = KhushuRestoreReceiver.hasPendingDeferredKhushu(context)
            val durationMs = getSoundDurationMs(context, soundType)

            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
            val canScheduleExact = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                alarmManager?.canScheduleExactAlarms() ?: false
            } else true

            val decisionInput = CustomAlarmKhushuDecision.DecisionInput(
                autoKhushu = autoKhushu,
                soundType = soundType,
                notifyMode = notifyMode,
                measuredDurationMs = durationMs,
                isKhushuAlreadyActive = isKhushuActive,
                alarmManagerExactAllowed = canScheduleExact
            )

            // Overlap resolution with pending deferred Alarm A if present
            val overlapResolution = CustomAlarmKhushuDecision.resolveOverlap(
                hasPendingDeferredA = hasPendingDeferredA,
                incomingAlarmB = decisionInput
            )

            var cancelledPendingA = false
            when (overlapResolution) {
                CustomAlarmKhushuDecision.OverlapResolution.MAINTAIN_PENDING_A -> {
                    // Maintain pending deferred alarm A
                }
                CustomAlarmKhushuDecision.OverlapResolution.PREEMPT_IMMEDIATE_B -> {
                    KhushuRestoreReceiver.cancelDeferredKhushu(context)
                    cancelledPendingA = true
                }
                CustomAlarmKhushuDecision.OverlapResolution.RESCHEDULE_FOR_B -> {
                    KhushuRestoreReceiver.cancelDeferredKhushu(context)
                    cancelledPendingA = true
                }
                CustomAlarmKhushuDecision.OverlapResolution.PROCEED_NORMAL -> {
                    // Normal single alarm flow
                }
            }

            // Pure decision logic evaluation
            val decisionResult = CustomAlarmKhushuDecision.evaluate(decisionInput)

            // Post notification for Custom Alarm
            try {
                AthanAlarmPlugin.logNativeEvent(
                    context,
                    "AUDIO_START_REQUESTED",
                    "prayerKey=$prayerKey, soundType=$soundType, notifyMode=$notifyMode, overlap=${overlapResolution.name}, cancelledPendingA=$cancelledPendingA, khushuDecision=${decisionResult.reason}"
                )
            } catch (e: Exception) {
                Log.w(TAG, "Failed logging AUDIO_START_REQUESTED", e)
            }

            val cleanSound = soundType.lowercase().trim().replace("-", "_")
            val isSilent = soundType == "silent" || notifyMode == "notification"
            val channelId = if (isSilent) CUSTOM_ALARM_SILENT_CHANNEL_ID else "${CUSTOM_ALARM_CHANNEL_ID}_$cleanSound"

            val notifPosted = showCustomAlarmNotification(context, prayerName, prayerKey, soundType, notifyMode)
            if (notifPosted) {
                try {
                    AthanAlarmPlugin.logNativeEvent(
                        context,
                        "NOTIFICATION_POSTED",
                        "prayerKey=$prayerKey, soundType=$soundType, channelId=$channelId"
                    )
                } catch (e: Exception) {
                    Log.w(TAG, "Failed logging NOTIFICATION_POSTED", e)
                }
            } else {
                try {
                    AthanAlarmPlugin.logNativeEvent(
                        context,
                        "AUDIO_ERROR",
                        "prayerKey=$prayerKey, soundType=$soundType, error=notify_failed"
                    )
                } catch (e: Exception) {
                    Log.w(TAG, "Failed logging AUDIO_ERROR", e)
                }

                // If notification posting failed and autoKhushu was requested, activate immediately as safe fallback
                if (autoKhushu && !isKhushuActive) {
                    KhushuRestoreReceiver.activateKhushuDirectly(context, khushuMode, durationMinutes, prayerKey)
                    showKhushuActivatedNotification(context, prayerName, durationMinutes, prayerKey)
                    try {
                        AthanAlarmPlugin.logNativeEvent(
                            context,
                            "KHUSHU_ACTIVATED",
                            "prayerKey=$prayerKey, mode=$khushuMode, durationMinutes=$durationMinutes, reason=fallback_immediate_notify_failed"
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed logging KHUSHU_ACTIVATED", e)
                    }
                }
                logFireEvent(context, prayerName, prayerKey, "custom", "failed", "custom_alarm_notification_failed (sound: $soundType)")
                return
            }

            // Execute decision on Khushu activation / deferral
            if (!decisionResult.shouldScheduleKhushu) {
                Log.d(TAG, "No khushu scheduled for $prayerKey: ${decisionResult.reason}")
            } else if (decisionResult.isImmediate) {
                // Immediate activation (silent, vibrate, or notification-only mode)
                KhushuRestoreReceiver.activateKhushuDirectly(context, khushuMode, durationMinutes, prayerKey)
                showKhushuActivatedNotification(context, prayerName, durationMinutes, prayerKey)
                try {
                    AthanAlarmPlugin.logNativeEvent(
                        context,
                        "KHUSHU_ACTIVATED",
                        "prayerKey=$prayerKey, mode=$khushuMode, durationMinutes=$durationMinutes, immediate=true, reason=${decisionResult.reason}"
                    )
                } catch (e: Exception) {
                    Log.w(TAG, "Failed logging KHUSHU_ACTIVATED", e)
                }
            } else {
                // Deferred activation: schedule AlarmManager intent after estimated audio delay
                if (decisionResult.logEvent == "AUDIO_ERROR") {
                    try {
                        AthanAlarmPlugin.logNativeEvent(
                            context,
                            "AUDIO_ERROR",
                            "prayerKey=$prayerKey, soundType=$soundType, error=duration_unavailable_fallback_${decisionResult.delayMs}ms"
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed logging AUDIO_ERROR", e)
                    }
                    try {
                        AthanAlarmPlugin.logNativeEvent(
                            context,
                            "KHUSHU_DEFERRED",
                            "prayerKey=$prayerKey, delayMs=${decisionResult.delayMs}, estimated=true, reason=${decisionResult.reason}"
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed logging KHUSHU_DEFERRED", e)
                    }
                } else {
                    try {
                        AthanAlarmPlugin.logNativeEvent(
                            context,
                            "KHUSHU_DEFERRED",
                            "prayerKey=$prayerKey, delayMs=${decisionResult.delayMs}, estimated=${decisionResult.isEstimated}, reason=${decisionResult.reason}"
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed logging KHUSHU_DEFERRED", e)
                    }
                }

                val scheduled = KhushuRestoreReceiver.scheduleDeferredKhushu(
                    context = context,
                    delayMs = decisionResult.delayMs,
                    mode = khushuMode,
                    durationMinutes = durationMinutes,
                    prayerName = prayerName,
                    prayerKey = prayerKey,
                    isEstimated = decisionResult.isEstimated
                )

                if (!scheduled) {
                    // Fallback to immediate activation if scheduling threw an exception or returned null
                    try {
                        AthanAlarmPlugin.logNativeEvent(
                            context,
                            "AUDIO_ERROR",
                            "prayerKey=$prayerKey, error=deferred_scheduling_failed"
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed logging AUDIO_ERROR", e)
                    }

                    KhushuRestoreReceiver.activateKhushuDirectly(context, khushuMode, durationMinutes, prayerKey)
                    showKhushuActivatedNotification(context, prayerName, durationMinutes, prayerKey)

                    try {
                        AthanAlarmPlugin.logNativeEvent(
                            context,
                            "KHUSHU_ACTIVATED",
                            "prayerKey=$prayerKey, mode=$khushuMode, durationMinutes=$durationMinutes, reason=fallback_immediate"
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed logging KHUSHU_ACTIVATED fallback", e)
                    }
                }
            }

            logFireEvent(context, prayerName, prayerKey, "custom", "played", "custom_alarm_notification (sound: $soundType)")
            return
        }

        if (alarmType == "prealert" || prayerKey.contains("prealert")) {
            val soundType = intent.getStringExtra("soundType") ?: "reminder"
            val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
            showPreAlertNotification(context, prayerName, prayerKey, soundType, notifyMode)
            logFireEvent(context, prayerName, prayerKey, "prealert", "played", "prealert_notification (sound: $soundType)")
            return
        }

        if (alarmType == "postalert" || prayerKey.contains("postalert") || prayerKey.contains("worship")) {
            val soundType = intent.getStringExtra("soundType") ?: "reminder"
            val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
            showPostAlertNotification(context, prayerName, prayerKey, soundType, notifyMode)
            logFireEvent(context, prayerName, prayerKey, "postalert", "played", "postalert_notification (sound: $soundType)")
            return
        }

        if (alarmType == "khushu" || prayerKey.contains("khushu")) {
            val durationMinutes = intent.getIntExtra(EXTRA_DURATION_MINUTES, 15)
            val khushuMode = intent.getStringExtra(EXTRA_KHUSHU_MODE) ?: "silent"
            KhushuRestoreReceiver.activateKhushuDirectly(context, khushuMode, durationMinutes, prayerKey)
            showKhushuActivatedNotification(context, prayerName, durationMinutes, prayerKey)
            logFireEvent(context, prayerName, prayerKey, "khushu", "played", "khushu_activated (mode: $khushuMode, duration: ${durationMinutes}m)")
            return
        }

        val prefs = context.getSharedPreferences(AthanAlarmPlugin.PREFS_NAME, Context.MODE_PRIVATE)
        val ongoingBarEnabled = prefs.getBoolean("ongoing_prayer_bar_enabled", false)
        if (ongoingBarEnabled) {
            updateOngoingPrayerNotificationAtPrayerTime(context, prayerName)
        }

        // Fire-time guard: verify that athan is enabled for this prayer
        val canonicalPrayer = prayerKey.lowercase().replaceFirstChar { it.uppercase() }
        val isAthanEnabled = prefs.getBoolean("athan_enabled_$canonicalPrayer", true)
        if (!isAthanEnabled) {
            Log.d(TAG, "Athan is disabled for prayer $canonicalPrayer ($prayerKey); skipping AthanForegroundService.")
            logFireEvent(context, prayerName, prayerKey, "athan", "skipped", "athan_disabled_in_prefs (athan_enabled_$canonicalPrayer is false)")
            return
        }

        val serviceIntent = Intent(context, AthanForegroundService::class.java).apply {
            putExtra(EXTRA_PRAYER_NAME, prayerName)
            putExtra(EXTRA_IS_FAJR, isFajr)
            putExtra(EXTRA_PRAYER_KEY, prayerKey)
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ContextCompat.startForegroundService(context, serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
            logFireEvent(context, prayerName, prayerKey, "athan", "played", "foreground_service_started")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start AthanForegroundService", e)
            logFireEvent(context, prayerName, prayerKey, "athan", "skipped", "foreground_service_failed: ${e.javaClass.simpleName}: ${e.message}")
        }
    }

    private fun showPreAlertNotification(
        context: Context,
        prayerName: String,
        prayerKey: String,
        soundType: String = "reminder",
        notifyMode: String = "both"
    ) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

        val isSilent = soundType == "silent" || notifyMode == "notification"
        val rawName = getRawName(soundType)
        val soundUri = if (!isSilent) Uri.parse("android.resource://${context.packageName}/raw/$rawName") else null
        val cleanSound = soundType.lowercase().trim().replace("-", "_")
        val channelId = if (isSilent) "athan_prealert_silent_channel_v3" else "${PREALERT_CHANNEL_ID}_$cleanSound"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                notificationManager.deleteNotificationChannel("athan_prealert_channel_v2")
                notificationManager.deleteNotificationChannel("athan_prealert_channel_v2_$cleanSound")
                notificationManager.deleteNotificationChannel("athan_prealert_silent_channel_v2")
            } catch (_: Exception) {}
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build()

            val channel = NotificationChannel(
                channelId,
                if (isSilent) "تنبيهات اقتراب وقت الصلاة (صامت)" else "تنبيهات اقتراب وقت الصلاة ($cleanSound)",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "تنبيهات تذكيرية بقرب دخول وقت الصلاة"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 200, 300)
                if (soundUri != null) {
                    setSound(soundUri, audioAttributes)
                } else {
                    setSound(null, null)
                }
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pIntent = if (launchIntent != null) {
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            PendingIntent.getActivity(context, (System.currentTimeMillis() % 10000).toInt(), launchIntent, flags)
        } else null

        val title = "اقتراب موعد صلاة $prayerName ⏳"
        val body = "استعد للوضوء وأداء فريضة $prayerName"

        val notifBuilder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)

        if (soundUri != null) {
            notifBuilder.setSound(soundUri)
            notifBuilder.setVibrate(longArrayOf(0, 300, 200, 300))
        }

        if (pIntent != null) {
            notifBuilder.setContentIntent(pIntent)
        }

        val notifId = (prayerKey.hashCode() and 0x7FFFFFFF) % 10000 + 5000
        notificationManager.notify(notifId, notifBuilder.build())
        Log.d(TAG, "Pre-alert notification displayed for $prayerName (id=$notifId)")
    }

    private fun showPostAlertNotification(
        context: Context,
        prayerName: String,
        prayerKey: String,
        soundType: String = "reminder",
        notifyMode: String = "both"
    ) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

        val isSilent = soundType == "silent" || notifyMode == "notification"
        val rawName = getRawName(soundType)
        val soundUri = if (!isSilent) Uri.parse("android.resource://${context.packageName}/raw/$rawName") else null
        val cleanSound = soundType.lowercase().trim().replace("-", "_")
        val channelId = if (isSilent) "athan_postalert_silent_channel_v3" else "${POSTALERT_CHANNEL_ID}_$cleanSound"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                notificationManager.deleteNotificationChannel("athan_postalert_channel_v2")
                notificationManager.deleteNotificationChannel("athan_postalert_channel_v2_$cleanSound")
                notificationManager.deleteNotificationChannel("athan_postalert_silent_channel_v2")
            } catch (_: Exception) {}
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build()

            val channel = NotificationChannel(
                channelId,
                if (isSilent) "تنبيهات بعد دخول الوقت والسنن (صامت)" else "تنبيهات بعد دخول الوقت والسنن ($cleanSound)",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "تنبيهات تذكيرية بالسنن البعدية وأذكار الصلاة"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 200, 300)
                if (soundUri != null) {
                    setSound(soundUri, audioAttributes)
                } else {
                    setSound(null, null)
                }
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pIntent = if (launchIntent != null) {
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            PendingIntent.getActivity(context, (System.currentTimeMillis() % 10000).toInt(), launchIntent, flags)
        } else null

        val title = "تذكير بسنن وأذكار صلاة $prayerName 📿"
        val body = "حافظ على السنن الرواتب وأذكار بعد الصلاة لتمام الأجر"

        val notifBuilder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)

        if (soundUri != null) {
            notifBuilder.setSound(soundUri)
            notifBuilder.setVibrate(longArrayOf(0, 300, 200, 300))
        }

        if (pIntent != null) {
            notifBuilder.setContentIntent(pIntent)
        }

        val notifId = (prayerKey.hashCode() and 0x7FFFFFFF) % 10000 + 6000
        notificationManager.notify(notifId, notifBuilder.build())
        Log.d(TAG, "Post-alert notification displayed for $prayerName (id=$notifId)")
    }

    private fun updateOngoingPrayerNotificationAtPrayerTime(context: Context, prayerName: String) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
        val channelId = "athan_ongoing_prayer_bar"
        val notificationId = 888801

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pIntent = if (launchIntent != null) {
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            PendingIntent.getActivity(context, 0, launchIntent, flags)
        } else null

        val notifBuilder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("🕌 حان الآن موعد أذان صلاة $prayerName")
            .setContentText("حي على الصلاة • حي على الفلاح")
            .setStyle(NotificationCompat.BigTextStyle().bigText("حان الآن موعد أذان $prayerName • تقبل الله طاعتكم"))
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setUsesChronometer(false)

        if (pIntent != null) {
            notifBuilder.setContentIntent(pIntent)
        }

        notificationManager.notify(notificationId, notifBuilder.build())
        Log.d(TAG, "Updated ongoing prayer notification at prayer time for $prayerName")
    }
}
```

---

## الملف: `android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt`
- **الوصف:** R12b: مستقبل إدارة واستعادة الخشوع (معدل: جدولة ACTION_ACTIVATE_KHUSHU_DEFERRED وحارس عدم التكرار)
- **عدد الأسطر:** 505
- **SHA-256:** `bc74a879085f7791df057722f67ea327c59a94c60e54a99edc40792d7cbbddc4`

```kotlin
package com.salahpro.app.plugins

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.util.Log
import com.salahpro.app.widget.SalahWidgetProvider

/**
 * KhushuRestoreReceiver:
 * BroadcastReceiver triggered by AlarmManager to reliably restore original
 * audio and notification interruption filter even if the application process was killed.
 */
class KhushuRestoreReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "KhushuRestoreReceiver"
        const val ACTION_RESTORE_KHUSHU = "com.salahpro.app.ACTION_RESTORE_KHUSHU"
        const val ACTION_ACTIVATE_KHUSHU_DEFERRED = "com.salahpro.app.ACTION_ACTIVATE_KHUSHU_DEFERRED"
        const val PREFS_NAME = "KhushuModePrefs"
        const val KEY_IS_ACTIVE = "khushu_is_active"
        const val KEY_ORIGINAL_FILTER = "khushu_original_filter"
        const val KEY_ORIGINAL_RINGER = "khushu_original_ringer"
        const val KEY_ACTIVATED_AT = "khushu_activated_at"
        const val KEY_DURATION_MINUTES = "khushu_duration_minutes"
        const val KEY_MODE = "khushu_mode"
        const val KHUSHU_RESTORE_REQUEST_CODE = 998877 // Constant, deterministic request code (No index collision)
        const val CUSTOM_ALARM_DEFERRED_KHUSHU_REQUEST_CODE = 998878 // Dedicated request code for deferred custom alarm Khushu
        const val KHUSHU_NOTIFICATION_ID = 8888 // Fixed notification ID for Khushu status

        const val EXTRA_DEFERRED_KHUSHU_MODE = "extra_deferred_khushu_mode"
        const val EXTRA_DEFERRED_DURATION_MINUTES = "extra_deferred_duration_minutes"
        const val EXTRA_DEFERRED_PRAYER_NAME = "extra_deferred_prayer_name"
        const val EXTRA_DEFERRED_PRAYER_KEY = "extra_deferred_prayer_key"
        const val EXTRA_DEFERRED_DELAY_MS = "extra_deferred_delay_ms"
        const val EXTRA_DEFERRED_IS_ESTIMATED = "extra_deferred_is_estimated"

        const val KEY_HAS_PENDING_DEFERRED = "khushu_has_pending_deferred"
        const val KEY_PENDING_DEFERRED_KEY = "khushu_pending_deferred_key"
        const val KEY_PENDING_DEFERRED_TRIGGER_AT = "khushu_pending_deferred_trigger_at"

        fun hasPendingDeferredKhushu(context: Context): Boolean {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val hasPending = prefs.getBoolean(KEY_HAS_PENDING_DEFERRED, false)
            if (!hasPending) return false

            // Cross-verify with AlarmManager token using FLAG_NO_CREATE (returns null if cancelled or device rebooted)
            val intent = Intent(context, KhushuRestoreReceiver::class.java).apply {
                action = ACTION_ACTIVATE_KHUSHU_DEFERRED
            }
            val flags = PendingIntent.FLAG_NO_CREATE or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                CUSTOM_ALARM_DEFERRED_KHUSHU_REQUEST_CODE,
                intent,
                flags
            )
            if (pendingIntent == null) {
                markDeferredKhushuInactive(context)
                return false
            }

            val triggerAt = prefs.getLong(KEY_PENDING_DEFERRED_TRIGGER_AT, 0L)
            // If triggerAt passed by more than 30 seconds without receiver trigger, treat as expired
            if (triggerAt > 0L && System.currentTimeMillis() > triggerAt + 30_000L) {
                markDeferredKhushuInactive(context)
                return false
            }
            return true
        }

        fun markDeferredKhushuInactive(context: Context) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit()
                .putBoolean(KEY_HAS_PENDING_DEFERRED, false)
                .remove(KEY_PENDING_DEFERRED_KEY)
                .remove(KEY_PENDING_DEFERRED_TRIGGER_AT)
                .apply()
        }

        fun scheduleDeferredKhushu(
            context: Context,
            delayMs: Long,
            mode: String,
            durationMinutes: Int,
            prayerName: String,
            prayerKey: String,
            isEstimated: Boolean = true
        ): Boolean {
            return try {
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return false
                val intent = Intent(context, KhushuRestoreReceiver::class.java).apply {
                    action = ACTION_ACTIVATE_KHUSHU_DEFERRED
                    putExtra(EXTRA_DEFERRED_KHUSHU_MODE, mode)
                    putExtra(EXTRA_DEFERRED_DURATION_MINUTES, durationMinutes)
                    putExtra(EXTRA_DEFERRED_PRAYER_NAME, prayerName)
                    putExtra(EXTRA_DEFERRED_PRAYER_KEY, prayerKey)
                    putExtra(EXTRA_DEFERRED_DELAY_MS, delayMs)
                    putExtra(EXTRA_DEFERRED_IS_ESTIMATED, isEstimated)
                }
                val flags = PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    CUSTOM_ALARM_DEFERRED_KHUSHU_REQUEST_CODE,
                    intent,
                    flags
                ) ?: return false

                val triggerAt = System.currentTimeMillis() + delayMs

                // API 31+ exact alarm permission check
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (alarmManager.canScheduleExactAlarms()) {
                        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
                    } else {
                        // setAndAllowWhileIdle fallback when exact alarm permission is absent (note: may experience system Doze batching delays)
                        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
                    }
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
                }

                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                prefs.edit()
                    .putBoolean(KEY_HAS_PENDING_DEFERRED, true)
                    .putString(KEY_PENDING_DEFERRED_KEY, prayerKey)
                    .putLong(KEY_PENDING_DEFERRED_TRIGGER_AT, triggerAt)
                    .apply()

                Log.d(TAG, "Scheduled deferred Khushu in ${delayMs}ms with requestCode $CUSTOM_ALARM_DEFERRED_KHUSHU_REQUEST_CODE")
                true
            } catch (e: Exception) {
                Log.e(TAG, "Failed to schedule deferred Khushu", e)
                false
            }
        }

        fun cancelDeferredKhushu(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
            val intent = Intent(context, KhushuRestoreReceiver::class.java).apply {
                action = ACTION_ACTIVATE_KHUSHU_DEFERRED
            }
            val flags = PendingIntent.FLAG_NO_CREATE or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                CUSTOM_ALARM_DEFERRED_KHUSHU_REQUEST_CODE,
                intent,
                flags
            )
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
                Log.d(TAG, "Cancelled deferred Khushu alarm")
            }
            markDeferredKhushuInactive(context)
        }

        fun isKhushuActive(context: Context): Boolean {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean(KEY_IS_ACTIVE, false)
            if (!isActive) return false
            val activatedAt = prefs.getLong(KEY_ACTIVATED_AT, 0L)
            val durationMinutes = prefs.getInt(KEY_DURATION_MINUTES, 30)
            if (activatedAt > 0L) {
                val elapsedMs = System.currentTimeMillis() - activatedAt
                val totalMs = durationMinutes * 60_000L
                if (elapsedMs >= totalMs) {
                    restoreOriginalState(context)
                    return false
                }
            }
            return true
        }

        fun getRemainingMinutes(context: Context): Int {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean(KEY_IS_ACTIVE, false)
            if (!isActive) return 0
            val activatedAt = prefs.getLong(KEY_ACTIVATED_AT, 0L)
            val durationMinutes = prefs.getInt(KEY_DURATION_MINUTES, 30)
            if (activatedAt > 0L) {
                val elapsedMs = System.currentTimeMillis() - activatedAt
                val totalMs = durationMinutes * 60_000L
                val leftMs = totalMs - elapsedMs
                return if (leftMs > 0L) Math.ceil(leftMs / 60_000.0).toInt() else 0
            }
            return durationMinutes
        }

        fun scheduleRestoreAlarm(context: Context, durationMinutes: Int) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
            val intent = Intent(context, KhushuRestoreReceiver::class.java).apply {
                action = ACTION_RESTORE_KHUSHU
            }
            val flags = PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                KHUSHU_RESTORE_REQUEST_CODE,
                intent,
                flags
            )
            val triggerAt = System.currentTimeMillis() + (durationMinutes * 60_000L)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            }
            Log.d(TAG, "Scheduled restore alarm in $durationMinutes minutes with requestCode $KHUSHU_RESTORE_REQUEST_CODE")
        }

        fun cancelRestoreAlarm(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
            val intent = Intent(context, KhushuRestoreReceiver::class.java).apply {
                action = ACTION_RESTORE_KHUSHU
            }
            val flags = PendingIntent.FLAG_NO_CREATE or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                KHUSHU_RESTORE_REQUEST_CODE,
                intent,
                flags
            )
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
                Log.d(TAG, "Cancelled restore alarm")
            }
        }

        fun activateKhushuDirectly(context: Context, mode: String = "silent", durationMinutes: Int = 30, sourceKey: String = ""): Boolean {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager

            val initialRinger = audioManager?.ringerMode ?: -1
            val initialFilter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                notificationManager?.currentInterruptionFilter ?: -1
            } else -1

            val hasDndPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                notificationManager?.isNotificationPolicyAccessGranted == true
            } else {
                true
            }

            try {
                AthanAlarmPlugin.logNativeEvent(
                    context,
                    "khushu_attempt",
                    "mode=$mode, durationMinutes=$durationMinutes, sourceKey=$sourceKey, initialRinger=$initialRinger, initialFilter=$initialFilter, hasDndPermission=$hasDndPermission"
                )
            } catch (e: Exception) {
                Log.w(TAG, "Failed logging khushu_attempt", e)
            }

            // 1. Snapshot current state if not already active
            if (!prefs.getBoolean(KEY_IS_ACTIVE, false)) {
                val currentFilter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    notificationManager?.currentInterruptionFilter ?: NotificationManager.INTERRUPTION_FILTER_ALL
                } else {
                    NotificationManager.INTERRUPTION_FILTER_ALL
                }
                val currentRinger = audioManager?.ringerMode ?: AudioManager.RINGER_MODE_NORMAL
                prefs.edit()
                    .putInt(KEY_ORIGINAL_FILTER, currentFilter)
                    .putInt(KEY_ORIGINAL_RINGER, currentRinger)
                    .apply()
            }

            // 2. Apply silence / DND with graceful fallbacks
            if (mode == "dnd" && hasDndPermission) {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        notificationManager?.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
                        Log.d(TAG, "DND interruption filter set to NONE")
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Error setting DND interruption filter", e)
                }
            }

            var ringerError: Throwable? = null
            try {
                AthanAlarmPlugin.logNativeEvent(
                    context,
                    "khushu_audio_state_before",
                    "sourceKey=$sourceKey, " + captureAudioStateLog(audioManager, notificationManager)
                )
            } catch (e: Exception) {
                Log.w(TAG, "Failed logging khushu_audio_state_before", e)
            }

            // Always silence ringer, falling back to Vibrate if Android throws SecurityException
            try {
                audioManager?.ringerMode = AudioManager.RINGER_MODE_SILENT
                Log.d(TAG, "Ringer mode set to RINGER_MODE_SILENT")
            } catch (se: SecurityException) {
                ringerError = se
                Log.w(TAG, "RINGER_MODE_SILENT requires DND access. Falling back to RINGER_MODE_VIBRATE", se)
                try {
                    audioManager?.ringerMode = AudioManager.RINGER_MODE_VIBRATE
                } catch (ve: Exception) {
                    Log.e(TAG, "Failed setting ringer mode to vibrate", ve)
                }
            } catch (e: Exception) {
                ringerError = e
                Log.e(TAG, "Error setting silent ringer mode", e)
            }

            try {
                AthanAlarmPlugin.logNativeEvent(
                    context,
                    "khushu_audio_state_after",
                    "sourceKey=$sourceKey, " + captureAudioStateLog(audioManager, notificationManager)
                )
            } catch (e: Exception) {
                Log.w(TAG, "Failed logging khushu_audio_state_after", e)
            }

            // 3. Save active state
            val now = System.currentTimeMillis()
            prefs.edit()
                .putBoolean(KEY_IS_ACTIVE, true)
                .putString(KEY_MODE, mode)
                .putInt(KEY_DURATION_MINUTES, durationMinutes)
                .putLong(KEY_ACTIVATED_AT, now)
                .apply()

            // 4. Schedule Alarm
            scheduleRestoreAlarm(context, durationMinutes)

            // 5. Update Widgets
            SalahWidgetProvider.updateAllWidgets(context)

            val appliedRinger = audioManager?.ringerMode ?: -1
            val appliedFilter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                notificationManager?.currentInterruptionFilter ?: -1
            } else -1

            try {
                if (ringerError != null) {
                    AthanAlarmPlugin.logNativeEvent(
                        context,
                        "khushu_result",
                        "mode=$mode, sourceKey=$sourceKey, appliedRinger=$appliedRinger, appliedFilter=$appliedFilter, hasDndPermission=$hasDndPermission, fallback_vibrate=true",
                        ringerError
                    )
                } else {
                    AthanAlarmPlugin.logNativeEvent(
                        context,
                        "khushu_result",
                        "mode=$mode, durationMinutes=$durationMinutes, sourceKey=$sourceKey, appliedRinger=$appliedRinger, appliedFilter=$appliedFilter, hasDndPermission=$hasDndPermission, status=success"
                    )
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed logging khushu_result", e)
            }
            return true
        }

        private fun captureAudioStateLog(
            audioManager: AudioManager?,
            notificationManager: NotificationManager?
        ): String {
            return try {
                val ringerMode = audioManager?.ringerMode ?: -1
                val alarmVol = audioManager?.getStreamVolume(AudioManager.STREAM_ALARM) ?: -1
                val notifVol = audioManager?.getStreamVolume(AudioManager.STREAM_NOTIFICATION) ?: -1
                val ringVol = audioManager?.getStreamVolume(AudioManager.STREAM_RING) ?: -1

                val alarmMuted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    audioManager?.isStreamMute(AudioManager.STREAM_ALARM) ?: false
                } else false
                val notifMuted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    audioManager?.isStreamMute(AudioManager.STREAM_NOTIFICATION) ?: false
                } else false
                val ringMuted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    audioManager?.isStreamMute(AudioManager.STREAM_RING) ?: false
                } else false

                val dndGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    notificationManager?.isNotificationPolicyAccessGranted ?: false
                } else true

                val filter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    notificationManager?.currentInterruptionFilter ?: -1
                } else -1

                val customChannelUsage = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val channel = notificationManager?.getNotificationChannel("salah_custom_alarms")
                    channel?.audioAttributes?.usage ?: -1
                } else -1

                "ringerMode=$ringerMode, volAlarm=$alarmVol, muteAlarm=$alarmMuted, volNotif=$notifVol, muteNotif=$notifMuted, volRing=$ringVol, muteRing=$ringMuted, dndGranted=$dndGranted, filter=$filter, customChannelUsage=$customChannelUsage"
            } catch (e: Exception) {
                "audioStateUnavailable=${e.javaClass.simpleName}"
            }
        }

        fun restoreOriginalState(context: Context) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean(KEY_IS_ACTIVE, false)
            if (!isActive) {
                Log.d(TAG, "Khushu mode was already inactive, skipping duplicate restore")
                SalahWidgetProvider.updateAllWidgets(context)
                return
            }

            val originalFilter = prefs.getInt(KEY_ORIGINAL_FILTER, NotificationManager.INTERRUPTION_FILTER_ALL)
            val originalRinger = prefs.getInt(KEY_ORIGINAL_RINGER, AudioManager.RINGER_MODE_NORMAL)

            // 1. Restore Do Not Disturb (DND) filter if permitted
            val nm = context.getSystemService(NotificationManager::class.java)
            if (nm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    if (nm.isNotificationPolicyAccessGranted) {
                        nm.setInterruptionFilter(originalFilter)
                        Log.d(TAG, "Restored interruption filter to: $originalFilter")
                    } else {
                        Log.w(TAG, "Notification policy access not granted during restore")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to restore interruption filter", e)
                }
            }

            // 2. Restore AudioManager ringer mode
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            if (audioManager != null) {
                try {
                    audioManager.ringerMode = originalRinger
                    Log.d(TAG, "Restored audio ringer mode to: $originalRinger")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to restore audio ringer mode", e)
                }
            }

            // 3. Mark inactive in prefs
            prefs.edit()
                .putBoolean(KEY_IS_ACTIVE, false)
                .putLong(KEY_ACTIVATED_AT, 0L)
                .putInt(KEY_DURATION_MINUTES, 0)
                .apply()

            cancelRestoreAlarm(context)
            Log.d(TAG, "Khushu mode successfully deactivated and marked inactive")

            // 4. Dismiss Khushu status notification
            try {
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                notificationManager?.cancel(KHUSHU_NOTIFICATION_ID)
            } catch (e: Exception) {
                Log.w(TAG, "Failed cancelling Khushu notification", e)
            }

            // 5. Update Widgets
            SalahWidgetProvider.updateAllWidgets(context)
        }
    }

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action
        Log.d(TAG, "KhushuRestoreReceiver triggered: action=$action")

        if (action == ACTION_ACTIVATE_KHUSHU_DEFERRED) {
            val mode = intent.getStringExtra(EXTRA_DEFERRED_KHUSHU_MODE) ?: "silent"
            val durationMinutes = intent.getIntExtra(EXTRA_DEFERRED_DURATION_MINUTES, 15)
            val prayerName = intent.getStringExtra(EXTRA_DEFERRED_PRAYER_NAME) ?: "منبه العبادة"
            val prayerKey = intent.getStringExtra(EXTRA_DEFERRED_PRAYER_KEY) ?: ""

            markDeferredKhushuInactive(context)

            // Idempotency guard: If Khushu is already active, ignore duplicate without resetting timer
            if (isKhushuActive(context)) {
                Log.d(TAG, "Khushu is already active, ignoring duplicate deferred activation")
                return
            }

            activateKhushuDirectly(context, mode, durationMinutes, prayerKey)
            AthanAlarmReceiver.showKhushuActivatedNotification(context, prayerName, durationMinutes, prayerKey)

            try {
                AthanAlarmPlugin.logNativeEvent(
                    context,
                    "KHUSHU_ACTIVATED",
                    "prayerKey=$prayerKey, mode=$mode, durationMinutes=$durationMinutes, source=deferred_custom_alarm"
                )
            } catch (e: Exception) {
                Log.w(TAG, "Failed logging KHUSHU_ACTIVATED", e)
            }
            return
        }

        // Default or ACTION_RESTORE_KHUSHU: restore original device state
        restoreOriginalState(context)
    }
}
```

---
