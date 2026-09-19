import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculatePrayerTimes, 
  parseTimeToMinutes, 
  getCurrentAndNextPrayer, 
  getArabicPrayerName,
  POPULAR_CITIES 
} from './prayerCalc';
import { calculateTriggerMinutes, DEFAULT_WORSHIP_ALARMS } from './alarmUtils';

describe('Prayer Calculation Engine', () => {
  const testDate = new Date(2026, 8, 4); // September 4, 2026

  test('calculates all 6 prayer times for Cairo with Egyptian General Authority', () => {
    const cairo = POPULAR_CITIES.find(c => c.name === 'Cairo')!;
    const times = calculatePrayerTimes(testDate, cairo.lat, cairo.lng, 2, 'Egypt', 'standard', {});

    assert.ok(times.Fajr && times.Fajr !== '--:--', 'Fajr should exist');
    assert.ok(times.Sunrise && times.Sunrise !== '--:--', 'Sunrise should exist');
    assert.ok(times.Dhuhr && times.Dhuhr !== '--:--', 'Dhuhr should exist');
    assert.ok(times.Asr && times.Asr !== '--:--', 'Asr should exist');
    assert.ok(times.Maghrib && times.Maghrib !== '--:--', 'Maghrib should exist');
    assert.ok(times.Isha && times.Isha !== '--:--', 'Isha should exist');

    // Verify format contains Arabic digits or valid hour:minute
    assert.match(times.Fajr, /[:]/);
    assert.match(times.Dhuhr, /[:]/);
  });

  test('Hanafi Asr time is strictly later than Shafi/Standard Asr time', () => {
    const lat = 30.0444;
    const lng = 31.2357;
    const standardTimes = calculatePrayerTimes(testDate, lat, lng, 2, 'Egypt', 'standard', {});
    const hanafiTimes = calculatePrayerTimes(testDate, lat, lng, 2, 'Egypt', 'hanafi', {});

    const standardAsrMin = parseTimeToMinutes(standardTimes.Asr);
    const hanafiAsrMin = parseTimeToMinutes(hanafiTimes.Asr);

    assert.ok(
      hanafiAsrMin > standardAsrMin, 
      `Hanafi Asr (${hanafiAsrMin}m) must be later than Standard Asr (${standardAsrMin}m)`
    );
  });

  test('manual prayer offsets apply accurately', () => {
    const lat = 30.0444;
    const lng = 31.2357;
    const baseTimes = calculatePrayerTimes(testDate, lat, lng, 2, 'Egypt', 'standard', {});
    const offsetTimes = calculatePrayerTimes(testDate, lat, lng, 2, 'Egypt', 'standard', { Fajr: 5, Maghrib: -3 });

    const baseFajrMin = parseTimeToMinutes(baseTimes.Fajr);
    const offsetFajrMin = parseTimeToMinutes(offsetTimes.Fajr);
    assert.equal(offsetFajrMin, baseFajrMin + 5, 'Fajr should be 5 minutes later');

    const baseMaghribMin = parseTimeToMinutes(baseTimes.Maghrib);
    const offsetMaghribMin = parseTimeToMinutes(offsetTimes.Maghrib);
    assert.equal(offsetMaghribMin, baseMaghribMin - 3, 'Maghrib should be 3 minutes earlier');
  });

  test('parseTimeToMinutes parses Arabic numerals and Latin numerals correctly', () => {
    const parsedArabic = parseTimeToMinutes('٠٤:٣٠ ص');
    assert.equal(parsedArabic, 4 * 60 + 30);

    const parsedLatin = parseTimeToMinutes('04:30 ص');
    assert.equal(parsedLatin, 4 * 60 + 30);

    const parsedPm = parseTimeToMinutes('٠١:١٥ م');
    assert.equal(parsedPm, 13 * 60 + 15);
  });

  test('getCurrentAndNextPrayer identifies prayer order correctly', () => {
    const cairo = POPULAR_CITIES.find(c => c.name === 'Cairo')!;
    const times = calculatePrayerTimes(testDate, cairo.lat, cairo.lng, 2, 'Egypt', 'standard', {});

    // Test at noon (12:00)
    const noonDate = new Date(2026, 8, 4, 12, 0, 0);
    const prayerInfo = getCurrentAndNextPrayer(times, noonDate);

    assert.ok(prayerInfo.current, 'Should have current prayer');
    assert.ok(prayerInfo.next, 'Should have next prayer');
    assert.ok(prayerInfo.timeRemainingStr, 'Should have remaining time string');
    assert.ok(prayerInfo.targetTimestampMs > noonDate.getTime(), 'targetTimestampMs must be strictly in the future');
    assert.equal(prayerInfo.remainingMs, prayerInfo.targetTimestampMs - noonDate.getTime(), 'remainingMs must equal target - now');
  });

  test('getCurrentAndNextPrayer recalculates accurately after simulated device pause/sleep', () => {
    const cairo = POPULAR_CITIES.find(c => c.name === 'Cairo')!;
    const times = calculatePrayerTimes(testDate, cairo.lat, cairo.lng, 2, 'Egypt', 'standard', {});

    // Initial check at 12:00
    const t0 = new Date(2026, 8, 4, 12, 0, 0);
    const info0 = getCurrentAndNextPrayer(times, t0);

    // Simulated 45 minutes background freeze
    const t1 = new Date(2026, 8, 4, 12, 45, 0);
    const info1 = getCurrentAndNextPrayer(times, t1);

    // Difference in remaining time must match exactly 45 minutes (2700000 ms)
    assert.equal(info0.remainingMs - info1.remainingMs, 45 * 60 * 1000);
    assert.equal(info1.targetTimestampMs, info0.targetTimestampMs);
  });

  test('getArabicPrayerName returns proper localized name and detects Friday', () => {
    // Thursday (non-Friday)
    const thursday = new Date(2026, 8, 3);
    assert.equal(getArabicPrayerName('Dhuhr', thursday), 'الظهر');

    // Friday
    const friday = new Date(2026, 8, 4);
    assert.equal(getArabicPrayerName('Dhuhr', friday), 'الجمعة');
    assert.equal(getArabicPrayerName('Dhuhr', friday.getTime()), 'الجمعة');
    assert.equal(getArabicPrayerName('Dhuhr', thursday.getTime()), 'الظهر');

    assert.equal(getArabicPrayerName('Fajr'), 'الفجر');
    assert.equal(getArabicPrayerName('Asr'), 'العصر');
    assert.equal(getArabicPrayerName('Maghrib'), 'المغرب');
    assert.equal(getArabicPrayerName('Isha'), 'العشاء');
  });

  test('calculateTriggerMinutes accurately computes trigger times from Arabic prayer times', () => {
    const beforeAlarm = DEFAULT_WORSHIP_ALARMS[0]; // 10 minutes before salah
    assert.equal(beforeAlarm.relation, 'before');
    assert.equal(beforeAlarm.offsetMinutes, 10);

    // Isha at 7:13 PM ("٧:١٣ م" = 1153 mins)
    const triggerIsha = calculateTriggerMinutes(beforeAlarm, '٧:١٣ م');
    assert.equal(triggerIsha, 1153 - 10, '10 minutes before Isha should be 1143 (19:03)');

    // Fajr at 4:15 AM ("٤:١٥ ص" = 255 mins)
    const triggerFajr = calculateTriggerMinutes(beforeAlarm, '٤:١٥ ص');
    assert.equal(triggerFajr, 255 - 10, '10 minutes before Fajr should be 245 (04:05)');

    // After salah alarm (15 minutes after)
    const afterAlarm = DEFAULT_WORSHIP_ALARMS[1];
    const triggerAfterIsha = calculateTriggerMinutes(afterAlarm, '٧:١٣ م');
    assert.equal(triggerAfterIsha, 1153 + 15, '15 minutes after Isha should be 1168 (19:28)');
  });
});
