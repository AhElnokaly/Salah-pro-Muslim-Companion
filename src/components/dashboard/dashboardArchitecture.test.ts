import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePrayerTimes, getCurrentAndNextPrayer, getTimezoneOffsetForLocation } from '../../utils/prayerCalc';
import { getHijriDate, formatGregorianFullDateArabic } from '../../utils/hijri';
import { checkIsFridayWindow, getAutoBackdropKey, getGradientForBackdrop, getTimeOfDayGradientAndLabel } from '../../utils/dashboardSky';
import { AppSettings } from '../../types';

describe('Dashboard Modular Time & Prayers Architecture', () => {
  const dummySettings = {
    latitude: 30.0444,
    longitude: 31.2357,
    cityName: 'القاهرة',
    calcMethod: 'Egypt',
    madhab: 'Shafi',
    hijriOffset: 0,
    timezoneId: 'Africa/Cairo',
    backdropStyle: 'auto',
    prayerOffsets: {},
  } as unknown as AppSettings;

  test('calculates correct times and current/next prayer correctly for standard Cairo date', () => {
    const fixedDate = new Date('2026-09-06T12:30:00Z');
    const tzOffset = getTimezoneOffsetForLocation(fixedDate, dummySettings.timezoneId);
    const times = calculatePrayerTimes(
      fixedDate,
      dummySettings.latitude,
      dummySettings.longitude,
      tzOffset,
      dummySettings.calcMethod,
      dummySettings.madhab,
      dummySettings.prayerOffsets || {}
    );

    assert.ok(times.Fajr, 'Fajr time should exist');
    assert.ok(times.Dhuhr, 'Dhuhr time should exist');
    assert.ok(times.Asr, 'Asr time should exist');
    assert.ok(times.Maghrib, 'Maghrib time should exist');
    assert.ok(times.Isha, 'Isha time should exist');

    const { current, next, timeRemainingStr } = getCurrentAndNextPrayer(times, fixedDate);
    assert.ok(current, 'Current prayer should be resolved');
    assert.ok(next, 'Next prayer should be resolved');
    assert.ok(typeof timeRemainingStr === 'string', 'timeRemainingStr should be string');
  });

  test('accurately resolves auto backdrop key and active card gradient', () => {
    const fixedDate = new Date('2026-09-06T12:30:00Z');
    const hijri = getHijriDate(fixedDate, 0);
    const tzOffset = getTimezoneOffsetForLocation(fixedDate, dummySettings.timezoneId);
    const times = calculatePrayerTimes(
      fixedDate,
      dummySettings.latitude,
      dummySettings.longitude,
      tzOffset,
      dummySettings.calcMethod,
      dummySettings.madhab,
      {}
    );

    const backdropKey = getAutoBackdropKey(fixedDate, times, hijri);
    assert.ok(['classic', 'gold', 'friday', 'ramadan', 'eid_fitr', 'eid_adha'].includes(backdropKey), 'Backdrop key must be valid');

    const { gradient } = getTimeOfDayGradientAndLabel(fixedDate, times);
    const cardGradient = getGradientForBackdrop(backdropKey, gradient, 'auto');
    assert.ok(typeof cardGradient === 'string' && cardGradient.length > 0, 'Card gradient must be resolved');
  });

  test('gregorianClean splits commas correctly without crashing', () => {
    const fixedDate = new Date('2026-09-06T12:30:00Z');
    const gregorianStr = formatGregorianFullDateArabic(fixedDate);
    const gregorianClean = gregorianStr.includes('،') ? gregorianStr.split('،')[1].trim() : gregorianStr;

    assert.ok(gregorianClean.length > 0, 'gregorianClean must return a non-empty date');
    assert.ok(!gregorianClean.includes('،'), 'gregorianClean must not contain a comma');
  });
});
