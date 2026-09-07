/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AppSettings, PrayerTimes } from '../../types';
import { 
  calculatePrayerTimes, 
  getCurrentAndNextPrayer, 
  getTimezoneOffsetForLocation 
} from '../../utils/prayerCalc';
import { formatDateKey } from '../../utils/prayerDayBoundary';
import { 
  getHijriDate, 
  formatGregorianFullDateArabic 
} from '../../utils/hijri';
import { 
  getTimeOfDayGradientAndLabel, 
  getAutoBackdropKey, 
  getGradientForBackdrop, 
  checkIsFridayWindow 
} from '../../utils/dashboardSky';
import { BackdropType } from '../MosqueBackdrop';

export interface UseDashboardTimeAndPrayersProps {
  settings: AppSettings;
}

export function useDashboardTimeAndPrayers({ settings }: UseDashboardTimeAndPrayersProps) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = formatDateKey(now);
  const hijri = getHijriDate(now, settings.hijriOffset);
  const gregorianStr = formatGregorianFullDateArabic(now);
  const gregorianClean = gregorianStr.includes('،') ? gregorianStr.split('،')[1].trim() : gregorianStr;

  const tzOffset = getTimezoneOffsetForLocation(now, settings.timezoneId);
  const times: PrayerTimes = calculatePrayerTimes(
    now,
    settings.latitude,
    settings.longitude,
    tzOffset,
    settings.calcMethod,
    settings.madhab,
    settings.prayerOffsets || {}
  );

  const { current, next, timeRemainingStr, progressPercent } = getCurrentAndNextPrayer(times, now);
  const isFridayWindow = checkIsFridayWindow(now, times);

  const { gradient: currentGradient, label: timePeriodLabel } = getTimeOfDayGradientAndLabel(now, times);

  const currentBackdropKey: BackdropType = !settings.backdropStyle || settings.backdropStyle === 'auto'
    ? getAutoBackdropKey(now, times, hijri)
    : settings.backdropStyle;

  const activeCardGradient = getGradientForBackdrop(currentBackdropKey, currentGradient, settings.backdropStyle);

  return {
    now,
    todayStr,
    hijri,
    gregorianStr,
    gregorianClean,
    times,
    current,
    next,
    timeRemainingStr,
    progressPercent,
    isFridayWindow,
    timePeriodLabel,
    currentBackdropKey,
    activeCardGradient,
  };
}
