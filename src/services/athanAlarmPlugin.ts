import { registerPlugin, Capacitor } from '@capacitor/core';
import { parseTimeToMinutes } from '../utils/prayerCalc';
import { PrayerTimes } from '../types';
import { prayerCanonicalNames } from '../domain/notifications/prayerCanonicalNames';
import { KhushuSettings } from '../domain/khushu/khushuTypes';

export interface PrayerTimeAlarm {
  prayerKey: string;
  prayerName: string;
  timeMs: number;
  isFajr?: boolean;
  alarmType?: string;
  durationMinutes?: number;
  khushuMode?: string;
}

export interface ScheduleAthanResult {
  scheduledCount: number;
  addedCount?: number;
  removedCount?: number;
  retainedCount?: number;
  exactAlarmPermissionMissing?: boolean;
}

export interface ReconcileAthanResult {
  scheduledCount: number;
  addedCount: number;
  removedCount: number;
  retainedCount: number;
  exactAlarmPermissionMissing?: boolean;
}

export interface ScheduledAlarmItem extends PrayerTimeAlarm {
  requestCode: number;
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
    prayerPreAlert?: boolean;
    preAlertMinutes?: number;
    khushuAutoWithIqama?: boolean;
  }): Promise<ScheduleAthanResult>;
  reconcileAthanAlarms(options: {
    times: PrayerTimeAlarm[];
  }): Promise<ReconcileAthanResult>;
  getScheduledAlarms(): Promise<{ alarms: ScheduledAlarmItem[]; count: number }>;
  cancelAllAlarms(): Promise<{ cancelled: boolean }>;
  cancelAlarm(options: { alarmId?: string; requestCode?: number }): Promise<{ cancelled: boolean; requestCode?: number }>;
  updateWidgetData(options: { data: Record<string, any>; cityName: string }): Promise<{ updated: boolean }>;
  checkExactAlarmPermission(): Promise<{ granted: boolean }>;
  requestExactAlarmPermission(): Promise<{ requested: boolean }>;
  checkBatteryOptimization(): Promise<{ isOptimized: boolean; isIgnoringBatteryOptimizations: boolean }>;
  requestIgnoreBatteryOptimization(): Promise<{ requested: boolean }>;
  checkNotificationPermission(): Promise<{ granted: boolean; status: string }>;
  requestNotificationPermission(): Promise<{ granted: boolean; status: string }>;
  openNotificationSettings?(): Promise<{ opened: boolean }>;
  sendNotification?(options: { title: string; body: string; soundType?: string }): Promise<{ success: boolean; notificationId?: number }>;
  updateOngoingPrayerNotification?(options: { enabled: boolean; title?: string; body?: string; targetTimestamp?: number }): Promise<{ success: boolean; posted?: boolean; cleared?: boolean }>;
  canRequestPackageInstalls?(): Promise<{ canInstall: boolean }>;
  openInstallPermissionSettings?(): Promise<{ opened: boolean }>;
  downloadAndInstallApk?(options: { url: string }): Promise<{ success: boolean; message?: string }>;
  addListener?(eventName: string, listenerFunc: (data: any) => void): Promise<any>;
}

const AthanAlarm = registerPlugin<AthanAlarmPlugin>('AthanAlarm', {
  web: {
    scheduleAthanAlarms: async (options) => {
      console.log('[AthanAlarm Plugin]: Web fallback simulation for scheduling native alarms:', options.times.length);
      return { scheduledCount: options.times.length, addedCount: options.times.length, removedCount: 0, retainedCount: 0 };
    },
    reconcileAthanAlarms: async (options) => {
      console.log('[AthanAlarm Plugin]: Web fallback simulation for reconciling native alarms:', options.times.length);
      return { scheduledCount: options.times.length, addedCount: options.times.length, removedCount: 0, retainedCount: 0 };
    },
    getScheduledAlarms: async () => {
      console.log('[AthanAlarm Plugin]: Web fallback getScheduledAlarms');
      return { alarms: [], count: 0 };
    },
    cancelAllAlarms: async () => {
      console.log('[AthanAlarm Plugin]: Web fallback simulation for cancelling native alarms');
      return { cancelled: true };
    },
    cancelAlarm: async (options) => {
      console.log('[AthanAlarm Plugin]: Web fallback simulation for cancelling single alarm:', options);
      return { cancelled: true, requestCode: options.requestCode };
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
    checkBatteryOptimization: async () => {
      return { isOptimized: false, isIgnoringBatteryOptimizations: true };
    },
    requestIgnoreBatteryOptimization: async () => {
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
    },
    openNotificationSettings: async () => {
      return { opened: true };
    },
    sendNotification: async (options) => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(options.title, { body: options.body });
        return { success: true };
      }
      return { success: false };
    },
    canRequestPackageInstalls: async () => {
      return { canInstall: true };
    },
    openInstallPermissionSettings: async () => {
      return { opened: true };
    },
    downloadAndInstallApk: async (options) => {
      if (typeof window !== 'undefined') {
        window.open(options.url, '_blank', 'noopener,noreferrer');
      }
      return { success: true };
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

export async function openAppNotificationSettings(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform() && AthanAlarm.openNotificationSettings) {
      const res = await AthanAlarm.openNotificationSettings();
      return res.opened ?? false;
    }
    return false;
  } catch (err) {
    console.warn('[AthanAlarm]: Failed to open notification settings:', err);
    return false;
  }
}

export async function sendNativeNotification(title: string, body: string, soundType?: string): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform() && AthanAlarm.sendNotification) {
      const res = await AthanAlarm.sendNotification({ title, body, soundType });
      return res.success ?? false;
    }
    return false;
  } catch (err) {
    console.warn('[AthanAlarm]: Failed to send native notification:', err);
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

export async function checkBatteryOptimization(): Promise<{ isOptimized: boolean; isIgnoringBatteryOptimizations: boolean }> {
  try {
    const res = await AthanAlarm.checkBatteryOptimization();
    return {
      isOptimized: res.isOptimized ?? false,
      isIgnoringBatteryOptimizations: res.isIgnoringBatteryOptimizations ?? true,
    };
  } catch (err) {
    console.warn('[AthanAlarm]: Failed to check battery optimization:', err);
    return { isOptimized: false, isIgnoringBatteryOptimizations: true };
  }
}

export async function requestIgnoreBatteryOptimization(): Promise<boolean> {
  try {
    const res = await AthanAlarm.requestIgnoreBatteryOptimization();
    return res.requested ?? false;
  } catch (err) {
    console.warn('[AthanAlarm]: Failed to request ignore battery optimization:', err);
    return false;
  }
}

export interface DailyPrayerTimesEntry {
  date: Date;
  timesMap: Record<string, string> | PrayerTimes;
}

/**
 * Helper function to schedule native Android alarms for prayer times (up to 30 days).
 */
export async function scheduleNativeAthanAlarms(
  daysListOrTodayMap: DailyPrayerTimesEntry[] | Record<string, string> | PrayerTimes,
  tomorrowPrayerTimesMap?: Record<string, string> | PrayerTimes,
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
    prayerPreAlert?: boolean;
    preAlertMinutes?: number;
    khushuAutoWithIqama?: boolean;
    khushuSettings?: KhushuSettings;
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

    const ks = calcParams?.khushuSettings;
    const khushuEnabled = Boolean(calcParams?.khushuAutoWithIqama);

    if (Array.isArray(daysListOrTodayMap)) {
      daysListOrTodayMap.forEach((entry) => {
        const dayDate = new Date(entry.date);
        const isFriday = dayDate.getDay() === 5;

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
              prayerKey: prayerCanonicalNames[lowerKey] || key,
              prayerName: prayerArabicNames[lowerKey],
              timeMs,
              isFajr: lowerKey === 'fajr',
            });
          }

          if (calcParams?.prayerPreAlert && lowerKey !== 'sunrise') {
            const preMins = calcParams.preAlertMinutes || 15;
            const preTimeMs = timeMs - preMins * 60000;
            if (preTimeMs > now) {
              times.push({
                prayerKey: `${prayerCanonicalNames[lowerKey] || key}_prealert`,
                prayerName: prayerArabicNames[lowerKey],
                timeMs: preTimeMs,
                isFajr: lowerKey === 'fajr',
                alarmType: 'prealert',
              });
            }
          }

          if (khushuEnabled && lowerKey !== 'sunrise') {
            let iqamaOffset = (ks?.iqamaOffsets as any)?.[lowerKey] ?? 15;
            let duration = (ks?.prayerDurations as any)?.[lowerKey] ?? 15;
            if (isFriday && lowerKey === 'dhuhr' && ks?.enableFridaySpecial) {
              iqamaOffset = ks.iqamaOffsets.friday || 25;
              duration = ks.prayerDurations.friday || 45;
            }
            const iqamaTimeMs = timeMs + iqamaOffset * 60000;
            if (iqamaTimeMs > now) {
              times.push({
                prayerKey: `${prayerCanonicalNames[lowerKey] || key}_khushu`,
                prayerName: prayerArabicNames[lowerKey],
                timeMs: iqamaTimeMs,
                isFajr: lowerKey === 'fajr',
                alarmType: 'khushu',
                durationMinutes: duration,
                khushuMode: ks?.preferredMode || 'silent',
              });
            }
          }
        });
      });
    } else {
      // Fallback for single today/tomorrow maps
      const today = new Date();
      const isTodayFriday = today.getDay() === 5;

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
            prayerKey: prayerCanonicalNames[lowerKey] || key,
            prayerName: prayerArabicNames[lowerKey],
            timeMs,
            isFajr: lowerKey === 'fajr',
          });
        }

        if (calcParams?.prayerPreAlert && lowerKey !== 'sunrise') {
          const preMins = calcParams.preAlertMinutes || 15;
          const preTimeMs = timeMs - preMins * 60000;
          if (preTimeMs > now) {
            times.push({
              prayerKey: `${prayerCanonicalNames[lowerKey] || key}_prealert`,
              prayerName: prayerArabicNames[lowerKey],
              timeMs: preTimeMs,
              isFajr: lowerKey === 'fajr',
              alarmType: 'prealert',
            });
          }
        }

        if (khushuEnabled && lowerKey !== 'sunrise') {
          let iqamaOffset = (ks?.iqamaOffsets as any)?.[lowerKey] ?? 15;
          let duration = (ks?.prayerDurations as any)?.[lowerKey] ?? 15;
          if (isTodayFriday && lowerKey === 'dhuhr' && ks?.enableFridaySpecial) {
            iqamaOffset = ks.iqamaOffsets.friday || 25;
            duration = ks.prayerDurations.friday || 45;
          }
          const iqamaTimeMs = timeMs + iqamaOffset * 60000;
          if (iqamaTimeMs > now) {
            times.push({
              prayerKey: `${prayerCanonicalNames[lowerKey] || key}_khushu`,
              prayerName: prayerArabicNames[lowerKey],
              timeMs: iqamaTimeMs,
              isFajr: lowerKey === 'fajr',
              alarmType: 'khushu',
              durationMinutes: duration,
              khushuMode: ks?.preferredMode || 'silent',
            });
          }
        }
      });

      if (tomorrowPrayerTimesMap) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrowFriday = tomorrow.getDay() === 5;

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
              prayerKey: prayerCanonicalNames[lowerKey] || key,
              prayerName: prayerArabicNames[lowerKey],
              timeMs,
              isFajr: lowerKey === 'fajr',
            });
          }

          if (calcParams?.prayerPreAlert && lowerKey !== 'sunrise') {
            const preMins = calcParams.preAlertMinutes || 15;
            const preTimeMs = timeMs - preMins * 60000;
            if (preTimeMs > now) {
              times.push({
                prayerKey: `${prayerCanonicalNames[lowerKey] || key}_prealert`,
                prayerName: prayerArabicNames[lowerKey],
                timeMs: preTimeMs,
                isFajr: lowerKey === 'fajr',
                alarmType: 'prealert',
              });
            }
          }

          if (khushuEnabled && lowerKey !== 'sunrise') {
            let iqamaOffset = (ks?.iqamaOffsets as any)?.[lowerKey] ?? 15;
            let duration = (ks?.prayerDurations as any)?.[lowerKey] ?? 15;
            if (isTomorrowFriday && lowerKey === 'dhuhr' && ks?.enableFridaySpecial) {
              iqamaOffset = ks.iqamaOffsets.friday || 25;
              duration = ks.prayerDurations.friday || 45;
            }
            const iqamaTimeMs = timeMs + iqamaOffset * 60000;
            if (iqamaTimeMs > now) {
              times.push({
                prayerKey: `${prayerCanonicalNames[lowerKey] || key}_khushu`,
                prayerName: prayerArabicNames[lowerKey],
                timeMs: iqamaTimeMs,
                isFajr: lowerKey === 'fajr',
                alarmType: 'khushu',
                durationMinutes: duration,
                khushuMode: ks?.preferredMode || 'silent',
              });
            }
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
      prayerPreAlert: calcParams?.prayerPreAlert,
      preAlertMinutes: calcParams?.preAlertMinutes,
      khushuAutoWithIqama: calcParams?.khushuAutoWithIqama,
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

export interface NativeWidgetPayload {
  fajr?: string;
  dhuhr?: string;
  asr?: string;
  maghrib?: string;
  isha?: string;
  nextPrayer?: string;
  activePrayer?: string;
  hijriDate?: string;
  moonPhase?: string;
  currentTime?: string;
  nextPrayerTitle?: string;
  nextPrayerTime?: string;
  remainingText?: string;
  progressPercent?: number;
  isJumuah?: boolean;
  dhikrText?: string;
  timePeriod?: string;
  theme?: string;
  widgetTheme?: string;
  clockStyle?: string;
  showMoonPhase?: boolean;
  prayerDisplay?: string;
  showDate?: boolean;
  showDhikr?: boolean;
  showSubhaBtn?: boolean;
  showKhushuBtn?: boolean;
  showProgressBar?: boolean;
  cardSize?: string;
  pinnedWidget?: any;
}

export async function updateNativeWidgetData(
  prayerTimesMap: Record<string, string> | PrayerTimes,
  cityName: string,
  extra?: Partial<NativeWidgetPayload> | string
): Promise<boolean> {
  try {
    const timesMapObj = prayerTimesMap as Record<string, string>;
    const extraObj = typeof extra === 'string' ? { nextPrayer: extra } : (extra || {});
    const data: Record<string, any> = {
      fajr: timesMapObj.Fajr || timesMapObj.fajr || '05:18 ص',
      dhuhr: timesMapObj.Dhuhr || timesMapObj.dhuhr || '12:54 م',
      asr: timesMapObj.Asr || timesMapObj.asr || '04:23 م',
      maghrib: timesMapObj.Maghrib || timesMapObj.maghrib || '07:02 م',
      isha: timesMapObj.Isha || timesMapObj.isha || '08:21 م',
      nextPrayer: extraObj.nextPrayer || 'الفجر',
      activePrayer: extraObj.activePrayer || extraObj.nextPrayer || 'dhuhr',
      ...extraObj,
    };
    await AthanAlarm.updateWidgetData({ data, cityName });
    return true;
  } catch (e) {
    console.warn('[AthanAlarm]: Failed to update widget data:', e);
    return false;
  }
}

export async function downloadAndInstallAppUpdate(
  apkUrl: string,
  onProgress?: (progress: number, downloadedBytes: number, totalBytes: number) => void
): Promise<{ success: boolean; message?: string }> {
  try {
    if (Capacitor.isNativePlatform() && AthanAlarm.downloadAndInstallApk) {
      let removeListener: any = null;
      if (onProgress && AthanAlarm.addListener) {
        removeListener = await AthanAlarm.addListener('apkDownloadProgress', (data: any) => {
          onProgress(data.progress || 0, data.downloadedBytes || 0, data.totalBytes || 0);
        });
      }

      // Check if install from unknown sources is allowed
      if (AthanAlarm.canRequestPackageInstalls) {
        const { canInstall } = await AthanAlarm.canRequestPackageInstalls();
        if (!canInstall && AthanAlarm.openInstallPermissionSettings) {
          await AthanAlarm.openInstallPermissionSettings();
        }
      }

      const res = await AthanAlarm.downloadAndInstallApk({ url: apkUrl });
      if (removeListener && typeof removeListener.remove === 'function') {
        removeListener.remove();
      }
      return { success: res.success, message: res.message };
    } else {
      if (typeof window !== 'undefined') {
        window.open(apkUrl, '_blank', 'noopener,noreferrer');
      }
      return { success: true, message: 'Browser download opened' };
    }
  } catch (error: any) {
    console.error('[AthanAlarmPlugin] downloadAndInstallAppUpdate failed:', error);
    if (typeof window !== 'undefined') {
      window.open(apkUrl, '_blank', 'noopener,noreferrer');
    }
    return { success: false, message: error?.message || 'Error occurred during in-app update' };
  }
}

export default AthanAlarm;
