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
