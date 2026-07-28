import { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { calculatePrayerTimes, getCurrentAndNextPrayer, getArabicPrayerName } from '../utils/prayerCalc';
import { getHijriDate, formatGregorianFullDateArabic } from '../utils/hijri';

export function usePrayerClock(settings: AppSettings) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    // Update UI clock every 10 seconds to avoid unnecessary full component tree re-renders every second
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const hijri = getHijriDate(now, settings.hijriOffset);
  const gregorianStr = formatGregorianFullDateArabic(now);
  const times = calculatePrayerTimes(
    now,
    settings.latitude,
    settings.longitude,
    -now.getTimezoneOffset() / 60,
    settings.calcMethod,
    settings.madhab,
    settings.prayerOffsets || {}
  );
  const { current, next, timeRemainingStr } = getCurrentAndNextPrayer(times, now);
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
  };
}
