/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppSettings } from '../../types';
import { calculatePrayerTimes, parseTimeToMinutes, getTimezoneOffsetForLocation } from '../../utils/prayerCalc';
import { toArabicNumbers } from '../../utils/hijri';

export interface NightCalcResult {
  totalNightDurationMinutes: number;
  nightDurationHours: string;
  midnightStr: string;
  lastThirdStartStr: string;
  isCurrentlyInLastThird: boolean;
  maghribStr: string;
  fajrStr: string;
}

export function calculateNightThirds(currentTime: Date, settings: AppSettings): NightCalcResult {
  const getTimes = (d: Date) => {
    const tzOffset = getTimezoneOffsetForLocation(d, settings.timezoneId);
    return calculatePrayerTimes(
      d,
      settings.latitude,
      settings.longitude,
      tzOffset,
      settings.calcMethod,
      settings.madhab,
      settings.prayerOffsets || {}
    );
  };

  const todayTimes = getTimes(currentTime);
  const tomorrow = new Date(currentTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = getTimes(tomorrow);

  const maghribMin = parseTimeToMinutes(todayTimes.Maghrib);
  const nextFajrMin = parseTimeToMinutes(tomorrowTimes.Fajr) + 24 * 60;

  const totalNightDurationMinutes = nextFajrMin - maghribMin;
  const oneThirdMinutes = Math.floor(totalNightDurationMinutes / 3);
  const halfNightMinutes = Math.floor(totalNightDurationMinutes / 2);

  const midnightTotalMinutes = (maghribMin + halfNightMinutes) % (24 * 60);
  const lastThirdStartTotalMinutes = (maghribMin + 2 * oneThirdMinutes) % (24 * 60);

  const formatMinToTime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const period = h >= 12 ? 'م' : 'ص';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${toArabicNumbers(displayH)}:${toArabicNumbers(m.toString().padStart(2, '0'))} ${period}`;
  };

  const midnightStr = formatMinToTime(midnightTotalMinutes);
  const lastThirdStartStr = formatMinToTime(lastThirdStartTotalMinutes);

  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const isCurrentlyInLastThird = (nowMinutes >= lastThirdStartTotalMinutes && nowMinutes < parseTimeToMinutes(todayTimes.Fajr)) ||
    (lastThirdStartTotalMinutes > parseTimeToMinutes(todayTimes.Fajr) && (nowMinutes >= lastThirdStartTotalMinutes || nowMinutes < parseTimeToMinutes(todayTimes.Fajr)));

  return {
    totalNightDurationMinutes,
    nightDurationHours: (totalNightDurationMinutes / 60).toFixed(1),
    midnightStr,
    lastThirdStartStr,
    isCurrentlyInLastThird,
    maghribStr: todayTimes.Maghrib,
    fajrStr: todayTimes.Fajr,
  };
}
