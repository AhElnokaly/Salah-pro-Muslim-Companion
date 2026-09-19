import { AppSettings } from '../types';
import { useAuthoritativeClock } from './useAuthoritativeClock';
import { calculatePrayerTimes, getCurrentAndNextPrayer, getArabicPrayerName, getTimezoneOffsetForLocation } from '../utils/prayerCalc';
import { getHijriDate, formatGregorianFullDateArabic } from '../utils/hijri';

export function usePrayerClock(settings: AppSettings) {
  const now = useAuthoritativeClock();

  const hijri = getHijriDate(now, settings.hijriOffset);
  const gregorianStr = formatGregorianFullDateArabic(now);
  const tzOffset = getTimezoneOffsetForLocation(now, settings.timezoneId);
  const times = calculatePrayerTimes(
    now,
    settings.latitude,
    settings.longitude,
    tzOffset,
    settings.calcMethod,
    settings.madhab,
    settings.prayerOffsets || {}
  );
  const { current, next, timeRemainingStr, remainingMs, targetTimestampMs } = getCurrentAndNextPrayer(times, now);
  const dayNamesArabic = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayNameArabic = dayNamesArabic[now.getDay()];

  return {
    now,
    hijri,
    gregorianStr,
    times,
    current,
    next,
    timeRemainingStr,
    dayNameArabic,
    remainingMs,
    targetTimestampMs,
  };
}
