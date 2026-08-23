import { registerPlugin } from '@capacitor/core';
import { parseTimeToMinutes } from '../utils/prayerCalc';

export interface PrayerTimeAlarm {
  prayerKey: string;
  prayerName: string;
  timeMs: number;
  isFajr?: boolean;
}

export interface ScheduleAthanResult {
  scheduledCount: number;
  exactAlarmPermissionMissing?: boolean;
}

export interface AthanAlarmPlugin {
  scheduleAthanAlarms(options: {
    times: PrayerTimeAlarm[];
    lat?: number;
    lng?: number;
    calcMethod?: string;
    madhab?: string;
    timeZoneId?: string;
    fajrOffset?: number;
    dhuhrOffset?: number;
    asrOffset?: number;
    maghribOffset?: number;
    ishaOffset?: number;
  }): Promise<ScheduleAthanResult>;
  cancelAllAlarms(): Promise<{ cancelled: boolean }>;
  updateWidgetData(options: { data: Record<string, string>; cityName: string }): Promise<{ updated: boolean }>;
  checkExactAlarmPermission(): Promise<{ granted: boolean }>;
  requestExactAlarmPermission(): Promise<{ requested: boolean }>;
  checkNotificationPermission(): Promise<{ granted: boolean; status: string }>;
  requestNotificationPermission(): Promise<{ granted: boolean; status: string }>;
}

const AthanAlarm = registerPlugin<AthanAlarmPlugin>('AthanAlarm', {
  web: {
    scheduleAthanAlarms: async (options) => {
      console.log('[AthanAlarm Plugin]: Web fallback simulation for scheduling native alarms:', options.times.length);
      return { scheduledCount: options.times.length };
    },
    cancelAllAlarms: async () => {
      console.log('[AthanAlarm Plugin]: Web fallback simulation for cancelling native alarms');
      return { cancelled: true };
    },
    updateWidgetData: async (options) => {
      console.log('[AthanAlarm Plugin]: Web fallback for updating widget data:', options);
      return { updated: true };
    },
    checkExactAlarmPermission: async () => {
      return { granted: true };
    },
    requestExactAlarmPermission: async () => {
      return { requested: true };
    },
    checkNotificationPermission: async () => {
      const isGranted = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
      return { granted: isGranted, status: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied' };
    },
    requestNotificationPermission: async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const res = await Notification.requestPermission();
        return { granted: res === 'granted', status: res };
      }
      return { granted: false, status: 'denied' };
    }
  }
});

export async function checkNotificationPermission(): Promise<boolean> {
  try {
    const res = await AthanAlarm.checkNotificationPermission();
    return res.granted ?? true;
  } catch (err) {
    console.warn('[AthanAlarm]: Failed to check notification permission:', err);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return true;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const res = await AthanAlarm.requestNotificationPermission();
    return res.granted ?? false;
  } catch (err) {
    console.warn('[AthanAlarm]: Failed to request notification permission:', err);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
    return false;
  }
}

export async function checkExactAlarmPermission(): Promise<boolean> {
  try {
    const res = await AthanAlarm.checkExactAlarmPermission();
    return res.granted ?? true;
  } catch (err) {
    console.warn('[AthanAlarm]: Failed to check exact alarm permission:', err);
    return false;
  }
}

export async function requestExactAlarmPermission(): Promise<boolean> {
  try {
    const res = await AthanAlarm.requestExactAlarmPermission();
    return res.requested ?? false;
  } catch (err) {
    console.warn('[AthanAlarm]: Failed to request exact alarm permission:', err);
    return false;
  }
}

export interface DailyPrayerTimesEntry {
  date: Date;
  timesMap: Record<string, string>;
}

/**
 * Helper function to schedule native Android alarms for prayer times (up to 30 days).
 */
export async function scheduleNativeAthanAlarms(
  daysListOrTodayMap: DailyPrayerTimesEntry[] | Record<string, string>,
  tomorrowPrayerTimesMap?: Record<string, string>,
  calcParams?: {
    lat?: number;
    lng?: number;
    calcMethod?: string;
    madhab?: string;
    timeZoneId?: string;
    fajrOffset?: number;
    dhuhrOffset?: number;
    asrOffset?: number;
    maghribOffset?: number;
    ishaOffset?: number;
  }
): Promise<number> {
  try {
    const times: PrayerTimeAlarm[] = [];
    const now = Date.now();

    const prayerArabicNames: Record<string, string> = {
      fajr: 'الفجر',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء',
    };

    if (Array.isArray(daysListOrTodayMap)) {
      daysListOrTodayMap.forEach((entry, dayIndex) => {
        const dayDate = new Date(entry.date);
        Object.entries(entry.timesMap).forEach(([key, timeStr]) => {
          const lowerKey = key.toLowerCase();
          if (!prayerArabicNames[lowerKey]) return;

          const totalMins = parseTimeToMinutes(timeStr);
          const hours = Math.floor(totalMins / 60);
          const minutes = totalMins % 60;

          const pDate = new Date(dayDate);
          pDate.setHours(hours, minutes, 0, 0);

          const timeMs = pDate.getTime();
          if (timeMs > now) {
            times.push({
              prayerKey: `day_${dayIndex}_${lowerKey}`,
              prayerName: prayerArabicNames[lowerKey],
              timeMs,
              isFajr: lowerKey === 'fajr',
            });
          }
        });
      });
    } else {
      // Fallback for single today/tomorrow maps
      const today = new Date();
      Object.entries(daysListOrTodayMap).forEach(([key, timeStr]) => {
        const lowerKey = key.toLowerCase();
        if (!prayerArabicNames[lowerKey]) return;

        const totalMins = parseTimeToMinutes(timeStr);
        const hours = Math.floor(totalMins / 60);
        const minutes = totalMins % 60;

        const pDate = new Date(today);
        pDate.setHours(hours, minutes, 0, 0);

        const timeMs = pDate.getTime();
        if (timeMs > now) {
          times.push({
            prayerKey: `today_${lowerKey}`,
            prayerName: prayerArabicNames[lowerKey],
            timeMs,
            isFajr: lowerKey === 'fajr',
          });
        }
      });

      if (tomorrowPrayerTimesMap) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        Object.entries(tomorrowPrayerTimesMap).forEach(([key, timeStr]) => {
          const lowerKey = key.toLowerCase();
          if (!prayerArabicNames[lowerKey]) return;

          const totalMins = parseTimeToMinutes(timeStr);
          const hours = Math.floor(totalMins / 60);
          const minutes = totalMins % 60;

          const pDate = new Date(tomorrow);
          pDate.setHours(hours, minutes, 0, 0);

          const timeMs = pDate.getTime();
          if (timeMs > now) {
            times.push({
              prayerKey: `tomorrow_${lowerKey}`,
              prayerName: prayerArabicNames[lowerKey],
              timeMs,
              isFajr: lowerKey === 'fajr',
            });
          }
        });
      }
    }

    if (times.length === 0) {
      console.log('[AthanAlarm]: No upcoming prayer times to schedule on native alarm.');
      return 0;
    }

    // Sort by timeMs ascending
    times.sort((a, b) => a.timeMs - b.timeMs);

    const res = await AthanAlarm.scheduleAthanAlarms({
      times,
      lat: calcParams?.lat,
      lng: calcParams?.lng,
      calcMethod: calcParams?.calcMethod,
      madhab: calcParams?.madhab,
      timeZoneId: calcParams?.timeZoneId,
      fajrOffset: calcParams?.fajrOffset,
      dhuhrOffset: calcParams?.dhuhrOffset,
      asrOffset: calcParams?.asrOffset,
      maghribOffset: calcParams?.maghribOffset,
      ishaOffset: calcParams?.ishaOffset,
    });
    if (res.exactAlarmPermissionMissing) {
      console.warn('[AthanAlarm]: Exact alarm permission is missing on Android 12+');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('exact-alarm-permission-missing'));
      }
      return 0;
    }
    console.log(`[AthanAlarm]: Successfully scheduled ${res.scheduledCount} native alarms.`);
    return res.scheduledCount;
  } catch (err) {
    console.warn('[AthanAlarm]: Error scheduling native athan alarms:', err);
    return 0;
  }
}

export async function updateNativeWidgetData(prayerTimesMap: Record<string, string>, cityName: string, nextPrayerText?: string): Promise<boolean> {
  try {
    const data: Record<string, string> = {
      fajr: prayerTimesMap.Fajr || prayerTimesMap.fajr || '04:30',
      dhuhr: prayerTimesMap.Dhuhr || prayerTimesMap.dhuhr || '12:15',
      asr: prayerTimesMap.Asr || prayerTimesMap.asr || '15:45',
      maghrib: prayerTimesMap.Maghrib || prayerTimesMap.maghrib || '19:02',
      isha: prayerTimesMap.Isha || prayerTimesMap.isha || '20:35',
      nextPrayer: nextPrayerText || 'الفجر',
    };
    await AthanAlarm.updateWidgetData({ data, cityName });
    return true;
  } catch (e) {
    console.warn('[AthanAlarm]: Failed to update widget data:', e);
    return false;
  }
}

export default AthanAlarm;
