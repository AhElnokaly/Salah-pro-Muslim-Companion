import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculatePrayerTimes, 
  parseTimeToMinutes, 
  getCurrentAndNextPrayer, 
  getArabicPrayerName,
  POPULAR_CITIES 
} from './prayerCalc';

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
  });

  test('getArabicPrayerName returns proper localized name and detects Friday', () => {
    // Thursday (non-Friday)
    const thursday = new Date(2026, 8, 3);
    assert.equal(getArabicPrayerName('Dhuhr', thursday), 'الظهر');

    // Friday
    const friday = new Date(2026, 8, 4);
    assert.equal(getArabicPrayerName('Dhuhr', friday), 'الجمعة');

    assert.equal(getArabicPrayerName('Fajr'), 'الفجر');
    assert.equal(getArabicPrayerName('Asr'), 'العصر');
    assert.equal(getArabicPrayerName('Maghrib'), 'المغرب');
    assert.equal(getArabicPrayerName('Isha'), 'العشاء');
  });
});
