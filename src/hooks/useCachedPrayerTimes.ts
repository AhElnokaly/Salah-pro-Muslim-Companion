import { useRef, useCallback } from 'react';
import { PrayerName, AppSettings } from '../types';
import { calculatePrayerTimes, getTimezoneOffsetForLocation } from '../utils/prayerCalc';
import { getLocalDateStr } from './prayerSchedulerUtils';

export function useCachedPrayerTimes(
  settings: Pick<AppSettings, 'latitude' | 'longitude' | 'timezoneId' | 'calcMethod' | 'madhab' | 'prayerOffsets'>
) {
  const prayerTimesCacheRef = useRef<{ key: string; times: Record<PrayerName | 'Sunrise', string> } | null>(null);

  const getCachedPrayerTimes = useCallback((checkDate: Date): Record<PrayerName | 'Sunrise', string> => {
    const todayStr = getLocalDateStr(checkDate);
    const key = `${todayStr}_${settings.latitude}_${settings.longitude}_${settings.calcMethod}_${settings.madhab}_${JSON.stringify(settings.prayerOffsets || {})}`;

    if (prayerTimesCacheRef.current && prayerTimesCacheRef.current.key === key) {
      return prayerTimesCacheRef.current.times;
    }

    const tzOffset = getTimezoneOffsetForLocation(checkDate, settings.timezoneId);
    const times = calculatePrayerTimes(
      checkDate,
      settings.latitude,
      settings.longitude,
      tzOffset,
      settings.calcMethod,
      settings.madhab,
      settings.prayerOffsets || {}
    );

    prayerTimesCacheRef.current = { key, times };
    return times;
  }, [settings.latitude, settings.longitude, settings.timezoneId, settings.calcMethod, settings.madhab, settings.prayerOffsets]);

  return getCachedPrayerTimes;
}
