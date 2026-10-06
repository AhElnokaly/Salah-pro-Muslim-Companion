import { registerPlugin, Capacitor } from '@capacitor/core';
import { parseTimeToMinutes } from '../utils/prayerCalc';
import { PrayerTimes, AlarmConfig } from '../types';
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
  soundType?: string;
  notifyMode?: string;
  autoKhushu?: boolean;
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
    preAlertSound?: string;
    hasBeforeSalahCustom?: boolean;
    prayerPostAlert?: boolean;
    postAlertMinutes?: number;
    postAlertSound?: string;
    hasAfterSalahCustom?: boolean;
    khushuAutoWithIqama?: boolean;
    khushuMode?: string;
    athan_enabled_Fajr?: boolean;
    athan_enabled_Dhuhr?: boolean;
    athan_enabled_Asr?: boolean;
    athan_enabled_Maghrib?: boolean;
    athan_enabled_Isha?: boolean;
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
  stopAthan?(): Promise<{ stopped: boolean }>;
  isNativeAthanRunning?(): Promise<{ isRunning: boolean }>;
  setNativeAthanFiles?(options: {
    paths?: NativeAthanPathsMap;
    generalPath?: string;
    fajrPath?: string;
  }): Promise<{ saved: boolean }>;
  saveAthanFile?(options: { type: string; base64Data: string }): Promise<{ path: string; saved: boolean }>;
  saveAthanFileChunk?(options: {
    muezzinId: string;
    chunkBase64: string;
    index: number;
    isLast: boolean;
  }): Promise<{ path?: string; saved: boolean; chunk?: number }>;
  getNativeAthanFiles?(): Promise<Record<string, { path: string; exists: boolean; sizeBytes: number }>>;
  listAthanCache?(): Promise<Record<string, { exists: boolean; sizeBytes: number }>>;
  getLastAthanPlay?(): Promise<LastAthanPlayRecord>;
  getAlarmDiagnostics?(): Promise<AlarmDiagnosticsResult>;
  addListener?(eventName: string, listenerFunc: (data: any) => void): Promise<any>;
}

export interface SavedNativeAlarmItem {
  requestCode: number;
  prayerKey: string;
  prayerName: string;
  timeMs: number;
  alarmType: string;
  soundType?: string;
  isFajr?: boolean;
  isCurrentlyScheduled?: boolean;
}

export interface AthanFireEventRecord {
  timestampMs: number;
  prayerName: string;
  prayerKey: string;
  alarmType: string;
  decision: 'played' | 'skipped' | string;
  reason: string;
}

export interface AlarmDiagnosticsResult {
  savedAlarms: SavedNativeAlarmItem[];
  nextAlarmClockMs: number;
  fireEvents: AthanFireEventRecord[];
  isIgnoringBatteryOptimizations: boolean;
  canScheduleExactAlarms: boolean;
  standbyBucket: number;
}

export interface LastAthanPlayRecord {
  hasRecord: boolean;
  prayer?: string;
  source?: 'per-prayer' | 'fajr' | 'general' | 'raw' | string;
  track?: string;
  timestampMs?: number;
}

export interface NativeAthanPathsMap {
  general?: string;
  fajr?: string;
  dhuhr?: string;
  asr?: string;
  maghrib?: string;
  isha?: string;
}

let lastScheduledOptions: any = null;
export function getLastScheduledOptions(): any {
  return lastScheduledOptions;
}

const AthanAlarm = registerPlugin<AthanAlarmPlugin>('AthanAlarm', {
  web: {
    scheduleAthanAlarms: async (options) => {
      lastScheduledOptions = options;
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
    stopAthan: async () => {
      return { stopped: true };
    },
    isNativeAthanRunning: async () => {
      return { isRunning: false };
    },
    setNativeAthanFiles: async () => {
      return { saved: true };
    },
    saveAthanFile: async () => {
      return { path: '', saved: true };
    },
    saveAthanFileChunk: async (options) => {
      console.log('[AthanAlarm Plugin]: Web fallback saveAthanFileChunk:', options.muezzinId, options.index, options.isLast);
      return { path: `/simulated/${options.muezzinId}.audio`, saved: true, chunk: options.index };
    },
    getNativeAthanFiles: async () => {
      return {
        general: { path: '', exists: false, sizeBytes: 0 },
        fajr: { path: '', exists: false, sizeBytes: 0 },
        dhuhr: { path: '', exists: false, sizeBytes: 0 },
        asr: { path: '', exists: false, sizeBytes: 0 },
        maghrib: { path: '', exists: false, sizeBytes: 0 },
        isha: { path: '', exists: false, sizeBytes: 0 },
      };
    },
    listAthanCache: async () => {
      return {};
    },
    getLastAthanPlay: async () => {
      return { hasRecord: false };
    },
    getAlarmDiagnostics: async () => {
      return {
        savedAlarms: [],
        nextAlarmClockMs: 0,
        fireEvents: [],
        isIgnoringBatteryOptimizations: true,
        canScheduleExactAlarms: true,
        standbyBucket: 10,
      };
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
      if (Capacitor.isNativePlatform()) {
        return { success: false };
      }
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

export type NativeAlarmCalcParams = {
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
  preAlertSound?: string;
  prayerPostAlert?: boolean;
  postAlertMinutes?: number;
  postAlertSound?: string;
  khushuAutoWithIqama?: boolean;
  khushuSettings?: KhushuSettings;
  customAlarms?: AlarmConfig[];
  athanEnabledMap?: Record<string, boolean>;
};

/**
 * Builds list of native prayer time alarms including pre/post alerts, custom alarms, and khushu.
 */
export function buildNativePrayerTimeAlarms(
  daysListOrTodayMap: DailyPrayerTimesEntry[] | Record<string, string> | PrayerTimes,
  tomorrowPrayerTimesMap?: Record<string, string> | PrayerTimes,
  calcParams?: NativeAlarmCalcParams
): PrayerTimeAlarm[] {
  const times: PrayerTimeAlarm[] = [];
  const now = Date.now();

    const prayerArabicNames: Record<string, string> = {
      fajr: 'الفجر',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء',
      sunrise: 'الشروق',
    };

    const addCustomAlarmsForDay = (
      dayDate: Date,
      timesMap: Record<string, string> | PrayerTimes
    ) => {
      const customList = calcParams?.customAlarms;
      if (!customList || customList.length === 0) return;

      const dayOfWeek = dayDate.getDay();

      customList.forEach((alarm) => {
        if (!alarm.enabled) return;

        // If oneShot is set, it must ONLY be scheduled for its specific fireDate (never weekly via days[])
        if (alarm.oneShot) {
          if (!alarm.fireDate) return;
          const dayDateYear = dayDate.getFullYear();
          const dayDateMonth = (dayDate.getMonth() + 1).toString().padStart(2, '0');
          const dayDateDay = dayDate.getDate().toString().padStart(2, '0');
          const dayDateStr = `${dayDateYear}-${dayDateMonth}-${dayDateDay}`;
          if (dayDateStr !== alarm.fireDate) return;
        } else {
          if (!alarm.days?.includes(dayOfWeek)) return;
        }

        // Fixed Time Custom Alarm
        if (alarm.type === 'fixed' || (!alarm.prayers?.length && alarm.time)) {
          if (!alarm.time) return;
          const totalMins = parseTimeToMinutes(alarm.time);
          const hours = Math.floor(totalMins / 60);
          const minutes = totalMins % 60;
          const targetDate = new Date(dayDate);
          targetDate.setHours(hours, minutes, 0, 0);
          const timeMs = targetDate.getTime();
          if (timeMs > now) {
            times.push({
              prayerKey: `custom_${alarm.id}_${timeMs}`,
              prayerName: alarm.title || 'منبه مخصص',
              timeMs,
              isFajr: false,
              alarmType: 'custom',
              soundType: alarm.soundType || 'reminder',
              notifyMode: alarm.notifyMode || 'both',
              autoKhushu: Boolean(alarm.autoKhushu),
              durationMinutes: alarm.khushuDurationMinutes || 15,
            });
          }
          return;
        }

        // Prayer Relative Custom Alarm
        if (alarm.prayers && alarm.prayers.length > 0) {
          alarm.prayers.forEach((prayerTarget) => {
            const lowerTarget = prayerTarget.toLowerCase();
            const pTimeStr = (timesMap as any)?.[lowerTarget] || (timesMap as any)?.[prayerTarget];
            if (!pTimeStr) return;

            const basePrayerMins = parseTimeToMinutes(pTimeStr);
            const offsetMins = (alarm.offsetMinutes || 0) * (alarm.offsetUnit === 'hours' ? 60 : 1);
            let targetMins = basePrayerMins;

            if (alarm.relation === 'before') {
              targetMins -= offsetMins;
            } else if (alarm.relation === 'after') {
              targetMins += offsetMins;
            }

            const targetDate = new Date(dayDate);
            targetDate.setHours(0, 0, 0, 0);
            targetDate.setTime(targetDate.getTime() + targetMins * 60000);

            let timeMs = targetDate.getTime();

            // Task 6: Khushu collision check for custom post-prayer alarms
            if (khushuEnabled && lowerTarget !== 'sunrise' && alarm.relation === 'after') {
              const isFriday = dayDate.getDay() === 5;
              let iqamaOffset = (ks?.iqamaOffsets as any)?.[lowerTarget] ?? 15;
              let duration = (ks?.prayerDurations as any)?.[lowerTarget] ?? 15;
              if (isFriday && lowerTarget === 'dhuhr' && ks?.enableFridaySpecial) {
                iqamaOffset = ks.iqamaOffsets.friday || 25;
                duration = ks.prayerDurations.friday || 45;
              }
              const pBaseDate = new Date(dayDate);
              pBaseDate.setHours(0, 0, 0, 0);
              const prayerTimeMs = pBaseDate.getTime() + basePrayerMins * 60000;
              const iqamaTimeMs = prayerTimeMs + iqamaOffset * 60000;
              const khushuEndTimeMs = iqamaTimeMs + duration * 60000;

              if (timeMs >= iqamaTimeMs && timeMs < khushuEndTimeMs) {
                const oldTime = timeMs;
                timeMs = khushuEndTimeMs;
                console.log(`[ALARM] kind=custom shifted from=${new Date(oldTime).toISOString()} to=${new Date(timeMs).toISOString()} reason=khushu_window_collision`);
              }
            }

            if (timeMs > now) {
              const targetNameArabic = prayerArabicNames[lowerTarget] || prayerTarget;
              times.push({
                prayerKey: `custom_${alarm.id}_${lowerTarget}_${timeMs}`,
                prayerName: `${alarm.title || 'منبه'} (${targetNameArabic})`,
                timeMs,
                isFajr: lowerTarget === 'fajr',
                alarmType: 'custom',
                soundType: alarm.soundType || 'reminder',
                notifyMode: alarm.notifyMode || 'both',
                autoKhushu: Boolean(alarm.autoKhushu),
                durationMinutes: alarm.khushuDurationMinutes || 15,
              });
            }
          });
        }
      });
    };

    const ks = calcParams?.khushuSettings;
    const khushuEnabled = Boolean(calcParams?.khushuAutoWithIqama);
    const hasBeforeSalahCustom = Boolean(calcParams?.customAlarms?.some(a => a.id === 'alarm_before_salah'));
    const hasAfterSalahCustom = Boolean(calcParams?.customAlarms?.some(a => a.id === 'alarm_after_salah'));

    if (Array.isArray(daysListOrTodayMap)) {
      daysListOrTodayMap.forEach((entry) => {
        const dayDate = new Date(entry.date);
        const isFriday = dayDate.getDay() === 5;

        // Add custom alarms for this day
        addCustomAlarmsForDay(dayDate, entry.timesMap);

        Object.entries(entry.timesMap).forEach(([key, timeStr]) => {
          const lowerKey = key.toLowerCase();
          if (!prayerArabicNames[lowerKey] || lowerKey === 'sunrise') return;

          const totalMins = parseTimeToMinutes(timeStr);
          const hours = Math.floor(totalMins / 60);
          const minutes = totalMins % 60;

          const pDate = new Date(dayDate);
          pDate.setHours(hours, minutes, 0, 0);

          const timeMs = pDate.getTime();
          const canonicalKey = prayerCanonicalNames[lowerKey] || key;
          const isAthanItemEnabled = calcParams?.athanEnabledMap
            ? (calcParams.athanEnabledMap[canonicalKey] ?? calcParams.athanEnabledMap[key] ?? true)
            : true;

          if (timeMs > now && isAthanItemEnabled) {
            times.push({
              prayerKey: canonicalKey,
              prayerName: prayerArabicNames[lowerKey],
              timeMs,
              isFajr: lowerKey === 'fajr',
              alarmType: 'athan',
            });
          }

          if (calcParams?.prayerPreAlert && !hasBeforeSalahCustom && lowerKey !== 'sunrise') {
            const preMins = calcParams.preAlertMinutes || 15;
            const preTimeMs = timeMs - preMins * 60000;
            if (preTimeMs > now) {
              times.push({
                prayerKey: `${prayerCanonicalNames[lowerKey] || key}_prealert`,
                prayerName: prayerArabicNames[lowerKey],
                timeMs: preTimeMs,
                isFajr: lowerKey === 'fajr',
                alarmType: 'prealert',
                soundType: calcParams.preAlertSound || 'reminder',
              });
            }
          }

          if (calcParams?.prayerPostAlert && !hasAfterSalahCustom && lowerKey !== 'sunrise') {
            const postMins = calcParams.postAlertMinutes || 15;
            let postTimeMs = timeMs + postMins * 60000;

            if (khushuEnabled) {
              let iqamaOffset = (ks?.iqamaOffsets as any)?.[lowerKey] ?? 15;
              let duration = (ks?.prayerDurations as any)?.[lowerKey] ?? 15;
              if (isFriday && lowerKey === 'dhuhr' && ks?.enableFridaySpecial) {
                iqamaOffset = ks.iqamaOffsets.friday || 25;
                duration = ks.prayerDurations.friday || 45;
              }
              const iqamaTimeMs = timeMs + iqamaOffset * 60000;
              const khushuEndTimeMs = iqamaTimeMs + duration * 60000;

              if (postTimeMs >= iqamaTimeMs && postTimeMs < khushuEndTimeMs) {
                const oldTime = postTimeMs;
                postTimeMs = khushuEndTimeMs;
                console.log(`[ALARM] kind=postalert shifted from=${new Date(oldTime).toISOString()} to=${new Date(postTimeMs).toISOString()} reason=khushu_window_collision`);
              }
            }

            if (postTimeMs > now) {
              times.push({
                prayerKey: `${prayerCanonicalNames[lowerKey] || key}_postalert`,
                prayerName: prayerArabicNames[lowerKey],
                timeMs: postTimeMs,
                isFajr: lowerKey === 'fajr',
                alarmType: 'postalert',
                soundType: calcParams.postAlertSound || 'reminder',
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
      addCustomAlarmsForDay(today, daysListOrTodayMap);

      Object.entries(daysListOrTodayMap).forEach(([key, timeStr]) => {
        const lowerKey = key.toLowerCase();
        if (!prayerArabicNames[lowerKey] || lowerKey === 'sunrise') return;

        const totalMins = parseTimeToMinutes(timeStr);
        const hours = Math.floor(totalMins / 60);
        const minutes = totalMins % 60;

        const pDate = new Date(today);
        pDate.setHours(hours, minutes, 0, 0);

        const timeMs = pDate.getTime();
        const canonicalKey = prayerCanonicalNames[lowerKey] || key;
        const isAthanItemEnabled = calcParams?.athanEnabledMap
          ? (calcParams.athanEnabledMap[canonicalKey] ?? calcParams.athanEnabledMap[key] ?? true)
          : true;

        if (timeMs > now && isAthanItemEnabled) {
          times.push({
            prayerKey: canonicalKey,
            prayerName: prayerArabicNames[lowerKey],
            timeMs,
            isFajr: lowerKey === 'fajr',
            alarmType: 'athan',
          });
        }

        if (calcParams?.prayerPreAlert && !hasBeforeSalahCustom && lowerKey !== 'sunrise') {
          const preMins = calcParams.preAlertMinutes || 15;
          const preTimeMs = timeMs - preMins * 60000;
          if (preTimeMs > now) {
            times.push({
              prayerKey: `${prayerCanonicalNames[lowerKey] || key}_prealert`,
              prayerName: prayerArabicNames[lowerKey],
              timeMs: preTimeMs,
              isFajr: lowerKey === 'fajr',
              alarmType: 'prealert',
              soundType: calcParams.preAlertSound || 'reminder',
            });
          }
        }

        if (calcParams?.prayerPostAlert && !hasAfterSalahCustom && lowerKey !== 'sunrise') {
          const postMins = calcParams.postAlertMinutes || 15;
          let postTimeMs = timeMs + postMins * 60000;

          if (khushuEnabled) {
            let iqamaOffset = (ks?.iqamaOffsets as any)?.[lowerKey] ?? 15;
            let duration = (ks?.prayerDurations as any)?.[lowerKey] ?? 15;
            if (isTodayFriday && lowerKey === 'dhuhr' && ks?.enableFridaySpecial) {
              iqamaOffset = ks.iqamaOffsets.friday || 25;
              duration = ks.prayerDurations.friday || 45;
            }
            const iqamaTimeMs = timeMs + iqamaOffset * 60000;
            const khushuEndTimeMs = iqamaTimeMs + duration * 60000;

            if (postTimeMs >= iqamaTimeMs && postTimeMs < khushuEndTimeMs) {
              const oldTime = postTimeMs;
              postTimeMs = khushuEndTimeMs;
              console.log(`[ALARM] kind=postalert shifted from=${new Date(oldTime).toISOString()} to=${new Date(postTimeMs).toISOString()} reason=khushu_window_collision`);
            }
          }

          if (postTimeMs > now) {
            times.push({
              prayerKey: `${prayerCanonicalNames[lowerKey] || key}_postalert`,
              prayerName: prayerArabicNames[lowerKey],
              timeMs: postTimeMs,
              isFajr: lowerKey === 'fajr',
              alarmType: 'postalert',
              soundType: calcParams.postAlertSound || 'reminder',
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
        addCustomAlarmsForDay(tomorrow, tomorrowPrayerTimesMap);

        Object.entries(tomorrowPrayerTimesMap).forEach(([key, timeStr]) => {
          const lowerKey = key.toLowerCase();
          if (!prayerArabicNames[lowerKey] || lowerKey === 'sunrise') return;

          const totalMins = parseTimeToMinutes(timeStr);
          const hours = Math.floor(totalMins / 60);
          const minutes = totalMins % 60;

          const pDate = new Date(tomorrow);
          pDate.setHours(hours, minutes, 0, 0);

          const timeMs = pDate.getTime();
          const canonicalKey = prayerCanonicalNames[lowerKey] || key;
          const isAthanItemEnabled = calcParams?.athanEnabledMap
            ? (calcParams.athanEnabledMap[canonicalKey] ?? calcParams.athanEnabledMap[key] ?? true)
            : true;

          if (timeMs > now && isAthanItemEnabled) {
            times.push({
              prayerKey: canonicalKey,
              prayerName: prayerArabicNames[lowerKey],
              timeMs,
              isFajr: lowerKey === 'fajr',
              alarmType: 'athan',
            });
          }

          if (calcParams?.prayerPreAlert && !hasBeforeSalahCustom && lowerKey !== 'sunrise') {
            const preMins = calcParams.preAlertMinutes || 15;
            const preTimeMs = timeMs - preMins * 60000;
            if (preTimeMs > now) {
              times.push({
                prayerKey: `${prayerCanonicalNames[lowerKey] || key}_prealert`,
                prayerName: prayerArabicNames[lowerKey],
                timeMs: preTimeMs,
                isFajr: lowerKey === 'fajr',
                alarmType: 'prealert',
                soundType: calcParams.preAlertSound || 'reminder',
              });
            }
          }

          if (calcParams?.prayerPostAlert && !hasAfterSalahCustom && lowerKey !== 'sunrise') {
            const postMins = calcParams.postAlertMinutes || 15;
            let postTimeMs = timeMs + postMins * 60000;

            if (khushuEnabled) {
              let iqamaOffset = (ks?.iqamaOffsets as any)?.[lowerKey] ?? 15;
              let duration = (ks?.prayerDurations as any)?.[lowerKey] ?? 15;
              if (isTomorrowFriday && lowerKey === 'dhuhr' && ks?.enableFridaySpecial) {
                iqamaOffset = ks.iqamaOffsets.friday || 25;
                duration = ks.prayerDurations.friday || 45;
              }
              const iqamaTimeMs = timeMs + iqamaOffset * 60000;
              const khushuEndTimeMs = iqamaTimeMs + duration * 60000;

              if (postTimeMs >= iqamaTimeMs && postTimeMs < khushuEndTimeMs) {
                const oldTime = postTimeMs;
                postTimeMs = khushuEndTimeMs;
                console.log(`[ALARM] kind=postalert shifted from=${new Date(oldTime).toISOString()} to=${new Date(postTimeMs).toISOString()} reason=khushu_window_collision`);
              }
            }

            if (postTimeMs > now) {
              times.push({
                prayerKey: `${prayerCanonicalNames[lowerKey] || key}_postalert`,
                prayerName: prayerArabicNames[lowerKey],
                timeMs: postTimeMs,
                isFajr: lowerKey === 'fajr',
                alarmType: 'postalert',
                soundType: calcParams.postAlertSound || 'reminder',
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

  // Same-minute priority resolution: athan > prealert > postalert > khushu > custom
  const ALARM_PRIORITY: Record<string, number> = {
    athan: 1,
    prealert: 2,
    postalert: 3,
    khushu: 4,
    custom: 5,
  };
  const getPrio = (item: PrayerTimeAlarm) => ALARM_PRIORITY[item.alarmType || ''] || 5;

  let hasCollision = true;
  let iterations = 0;
  while (hasCollision && iterations < 500) {
    hasCollision = false;
    iterations++;

    times.sort((a, b) => {
      const minA = Math.floor(a.timeMs / 60000);
      const minB = Math.floor(b.timeMs / 60000);
      if (minA !== minB) return minA - minB;
      const prioDiff = getPrio(a) - getPrio(b);
      if (prioDiff !== 0) return prioDiff;
      return a.timeMs - b.timeMs;
    });

    for (let i = 1; i < times.length; i++) {
      const prev = times[i - 1];
      const curr = times[i];
      if (Math.floor(prev.timeMs / 60000) === Math.floor(curr.timeMs / 60000)) {
        const oldTime = curr.timeMs;
        curr.timeMs = (Math.floor(curr.timeMs / 60000) + 1) * 60000 + (curr.timeMs % 60000);
        console.log(`[ALARM] kind=${curr.alarmType || 'custom'} shifted from=${new Date(oldTime).toISOString()} to=${new Date(curr.timeMs).toISOString()} reason=same_minute_priority`);
        hasCollision = true;
        break;
      }
    }
  }

  // Final sort by timeMs ascending
  times.sort((a, b) => a.timeMs - b.timeMs);

  return times;
}

/**
 * Helper function to schedule native Android alarms for prayer times (up to 30 days).
 */
export async function scheduleNativeAthanAlarms(
  daysListOrTodayMap: DailyPrayerTimesEntry[] | Record<string, string> | PrayerTimes,
  tomorrowPrayerTimesMap?: Record<string, string> | PrayerTimes,
  calcParams?: NativeAlarmCalcParams
): Promise<number> {
  try {
    const times = buildNativePrayerTimeAlarms(daysListOrTodayMap, tomorrowPrayerTimesMap, calcParams);
    if (times.length === 0) {
      console.log('[AthanAlarm]: No upcoming prayer times to schedule on native alarm.');
      return 0;
    }

    const hasBeforeSalahCustom = Boolean(calcParams?.customAlarms?.some(a => a.id === 'alarm_before_salah'));
    const hasAfterSalahCustom = Boolean(calcParams?.customAlarms?.some(a => a.id === 'alarm_after_salah'));
    const athanMap = calcParams?.athanEnabledMap || {};

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
      preAlertSound: calcParams?.preAlertSound || 'reminder',
      hasBeforeSalahCustom,
      prayerPostAlert: calcParams?.prayerPostAlert,
      postAlertMinutes: calcParams?.postAlertMinutes,
      postAlertSound: calcParams?.postAlertSound || 'reminder',
      hasAfterSalahCustom,
      khushuAutoWithIqama: calcParams?.khushuAutoWithIqama,
      khushuMode: calcParams?.khushuSettings?.preferredMode || 'silent',
      athan_enabled_Fajr: athanMap['Fajr'] ?? true,
      athan_enabled_Dhuhr: athanMap['Dhuhr'] ?? true,
      athan_enabled_Asr: athanMap['Asr'] ?? true,
      athan_enabled_Maghrib: athanMap['Maghrib'] ?? true,
      athan_enabled_Isha: athanMap['Isha'] ?? true,
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
      sunrise: timesMapObj.Sunrise || timesMapObj.sunrise || timesMapObj.shurooq || timesMapObj.Shurooq || '06:40 ص',
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

export async function stopNativeAthan(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    if (AthanAlarm.stopAthan) {
      const res = await AthanAlarm.stopAthan();
      return res?.stopped ?? true;
    }
    return true;
  } catch (err) {
    console.warn('[AthanAlarmPlugin] stopNativeAthan error:', err);
    return false;
  }
}

let athanPluginBridgeForTesting: Partial<AthanAlarmPlugin> | null = null;
export function setAthanPluginBridgeForTesting(bridge: Partial<AthanAlarmPlugin> | null): void {
  athanPluginBridgeForTesting = bridge;
}

export async function isNativeAthanRunning(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const plugin = athanPluginBridgeForTesting || AthanAlarm;
    if (plugin.isNativeAthanRunning) {
      const res = await plugin.isNativeAthanRunning();
      return res?.isRunning ?? false;
    }
    return false;
  } catch (err) {
    console.warn('[AthanAlarmPlugin] isNativeAthanRunning error:', err);
    return false;
  }
}

export async function cancelNativeAlarm(options: { alarmId?: string; requestCode?: number }): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !AthanAlarm.cancelAlarm) return true;
  try {
    const res = await AthanAlarm.cancelAlarm(options);
    return res?.cancelled ?? false;
  } catch (err) {
    console.warn('[AthanAlarmPlugin] cancelAlarm error:', err);
    return false;
  }
}

export async function cancelAllNativeAlarms(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !AthanAlarm.cancelAllAlarms) return true;
  try {
    const res = await AthanAlarm.cancelAllAlarms();
    return res?.cancelled ?? false;
  } catch (err) {
    console.warn('[AthanAlarmPlugin] cancelAllAlarms error:', err);
    return false;
  }
}

export const ATHAN_CHUNK_SIZE = 512 * 1024; // 512 KB

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  const chunk = 8192;
  for (let i = 0; i < len; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, len)) as unknown as number[]);
  }
  return btoa(binary);
}

export function chunkBinaryData(
  bytes: Uint8Array,
  chunkSize: number = ATHAN_CHUNK_SIZE
): { chunkBase64: string; index: number; isLast: boolean }[] {
  const totalBytes = bytes.byteLength;
  if (totalBytes === 0) {
    return [{ chunkBase64: '', index: 0, isLast: true }];
  }
  const totalChunks = Math.ceil(totalBytes / chunkSize);
  const chunks: { chunkBase64: string; index: number; isLast: boolean }[] = [];
  for (let index = 0; index < totalChunks; index++) {
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, totalBytes);
    const slice = bytes.subarray(start, end);
    const chunkBase64 = arrayBufferToBase64(slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength));
    const isLast = index === totalChunks - 1;
    chunks.push({ chunkBase64, index, isLast });
  }
  return chunks;
}

export async function setNativeAthanFiles(options: {
  paths?: NativeAthanPathsMap;
  generalPath?: string;
  fajrPath?: string;
}): Promise<boolean> {
  const plugin = athanPluginBridgeForTesting || AthanAlarm;
  if (!Capacitor.isNativePlatform() && !athanPluginBridgeForTesting) return true;
  if (!plugin.setNativeAthanFiles) return true;
  try {
    const res = await plugin.setNativeAthanFiles(options);
    return res?.saved ?? false;
  } catch (err) {
    console.warn('[ATHAN] SOURCE=SYNC [AthanAlarmPlugin] setNativeAthanFiles error:', err);
    return false;
  }
}

export async function getNativeAthanFiles(): Promise<Record<string, { path: string; exists: boolean; sizeBytes: number }> | null> {
  const plugin = athanPluginBridgeForTesting || AthanAlarm;
  if (!Capacitor.isNativePlatform() && !athanPluginBridgeForTesting) return null;
  if (!plugin.getNativeAthanFiles) return null;
  try {
    return await plugin.getNativeAthanFiles();
  } catch (err) {
    console.warn('[ATHAN] SOURCE=SYNC [AthanAlarmPlugin] getNativeAthanFiles error:', err);
    return null;
  }
}

export async function getLastAthanPlay(): Promise<LastAthanPlayRecord | null> {
  const plugin = athanPluginBridgeForTesting || AthanAlarm;
  if (!Capacitor.isNativePlatform() && !athanPluginBridgeForTesting) return null;
  if (!plugin.getLastAthanPlay) return null;
  try {
    return await plugin.getLastAthanPlay();
  } catch (err) {
    console.warn('[ATHAN] SOURCE=SYNC [AthanAlarmPlugin] getLastAthanPlay error:', err);
    return null;
  }
}

export async function getAlarmDiagnostics(): Promise<AlarmDiagnosticsResult | null> {
  const plugin = athanPluginBridgeForTesting || AthanAlarm;
  if (!Capacitor.isNativePlatform() && !athanPluginBridgeForTesting) return null;
  if (!plugin.getAlarmDiagnostics) return null;
  try {
    return await plugin.getAlarmDiagnostics();
  } catch (err) {
    console.warn('[ATHAN] SOURCE=DIAGNOSTICS [AthanAlarmPlugin] getAlarmDiagnostics error:', err);
    return null;
  }
}

export async function saveAthanFileChunk(options: {
  muezzinId: string;
  chunkBase64: string;
  index: number;
  isLast: boolean;
}): Promise<{ path?: string; saved: boolean; chunk?: number } | null> {
  const plugin = athanPluginBridgeForTesting || AthanAlarm;
  if (!Capacitor.isNativePlatform() && !athanPluginBridgeForTesting) return null;
  if (!plugin.saveAthanFileChunk) return null;
  try {
    return await plugin.saveAthanFileChunk(options);
  } catch (err) {
    console.warn('[ATHAN] SOURCE=SYNC [AthanAlarmPlugin] saveAthanFileChunk error:', err);
    return null;
  }
}

export interface SyncPrayerMuezzinsResult {
  paths: NativeAthanPathsMap;
  failed: { muezzinId: string; reason: string }[];
}

export async function listAthanCache(): Promise<Record<string, { exists: boolean; sizeBytes: number }>> {
  const plugin = athanPluginBridgeForTesting || AthanAlarm;
  if (!Capacitor.isNativePlatform() && !athanPluginBridgeForTesting) return {};
  if (!plugin.listAthanCache) return {};
  try {
    return (await plugin.listAthanCache()) || {};
  } catch (err) {
    console.warn('[ATHAN] listAthanCache error:', err);
    return {};
  }
}

let isSyncRunning = false;
let isSyncDirty = false;
let currentSyncPromise: Promise<SyncPrayerMuezzinsResult> | null = null;

export async function syncPrayerMuezzinsToNative(): Promise<SyncPrayerMuezzinsResult> {
  if (isSyncRunning) {
    isSyncDirty = true;
    return currentSyncPromise!;
  }

  isSyncRunning = true;
  isSyncDirty = false;

  currentSyncPromise = (async () => {
    try {
      let result = await executeSyncPrayerMuezzins();
      while (isSyncDirty) {
        isSyncDirty = false;
        result = await executeSyncPrayerMuezzins();
      }
      return result;
    } finally {
      isSyncRunning = false;
      isSyncDirty = false;
      currentSyncPromise = null;
    }
  })();

  return currentSyncPromise;
}

async function executeSyncPrayerMuezzins(): Promise<SyncPrayerMuezzinsResult> {
  const failed: { muezzinId: string; reason: string }[] = [];
  const pathsMap: NativeAthanPathsMap = {};

  try {
    const plugin = athanPluginBridgeForTesting || AthanAlarm;
    if (!Capacitor.isNativePlatform() && !athanPluginBridgeForTesting) {
      return { paths: pathsMap, failed };
    }
    if (!plugin.saveAthanFileChunk || !plugin.setNativeAthanFiles) {
      console.warn('[ATHAN] SOURCE=SYNC ACTION=SKIP REASON=NO_PLUGIN_METHOD');
      return { paths: pathsMap, failed };
    }

    const { resolveMuezzinId } = await import('../utils/muezzinResolver');
    const { defaultMuezzins, archiveMuezzins, getCustomAudios, getAudioUrl } = await import('../utils/audioStorage');
    const { safeGetItem, safeSetItem } = await import('../utils/storage');

    const prayers: { key: keyof NativeAthanPathsMap; prayerName: string; isFajr: boolean }[] = [
      { key: 'fajr', prayerName: 'Fajr', isFajr: true },
      { key: 'dhuhr', prayerName: 'Dhuhr', isFajr: false },
      { key: 'asr', prayerName: 'Asr', isFajr: false },
      { key: 'maghrib', prayerName: 'Maghrib', isFajr: false },
      { key: 'isha', prayerName: 'Isha', isFajr: false },
      { key: 'general', prayerName: 'general', isFajr: false },
    ];

    // 1. Resolve muezzin id for each prayer + general
    const prayerMuezzinMap: Record<keyof NativeAthanPathsMap, { muezzinId: string; isFajr: boolean }> = {
      fajr: { muezzinId: resolveMuezzinId('Fajr'), isFajr: true },
      dhuhr: { muezzinId: resolveMuezzinId('Dhuhr'), isFajr: false },
      asr: { muezzinId: resolveMuezzinId('Asr'), isFajr: false },
      maghrib: { muezzinId: resolveMuezzinId('Maghrib'), isFajr: false },
      isha: { muezzinId: resolveMuezzinId('Isha'), isFajr: false },
      general: {
        muezzinId: safeGetItem('salah_general_muezzin') || resolveMuezzinId('Dhuhr') || 'prayer_default',
        isFajr: false,
      },
    };

    // 2. Fetch cache status and native files
    let cachedFiles: Record<string, { exists: boolean; sizeBytes: number }> = {};
    if (plugin.listAthanCache) {
      try {
        cachedFiles = (await plugin.listAthanCache()) || {};
      } catch (_e) {
        // ignore
      }
    }

    let nativeFiles: Record<string, { path: string; exists: boolean; sizeBytes: number }> | null = null;
    if (plugin.getNativeAthanFiles) {
      try {
        nativeFiles = await plugin.getNativeAthanFiles();
      } catch (_e) {
        // ignore
      }
    }

    // 3. Dedupe unique muezzins
    const uniqueMuezzins = new Map<string, { muezzinId: string; isFajr: boolean }>();
    for (const p of prayers) {
      const item = prayerMuezzinMap[p.key];
      if (!uniqueMuezzins.has(item.muezzinId)) {
        uniqueMuezzins.set(item.muezzinId, item);
      }
    }

    const customTracks = await getCustomAudios().catch(() => []);
    const allTracks = [...defaultMuezzins, ...archiveMuezzins, ...customTracks];
    const resolvedPathsByMuezzinId = new Map<string, string>();

    for (const [muezzinId, { isFajr }] of uniqueMuezzins.entries()) {
      const sanitizedId = muezzinId.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64) || 'athan';
      const markerKey = `salah_native_athan_${muezzinId}`;
      const pathMarkerKey = `salah_native_athan_path_${muezzinId}`;
      const savedMarker = safeGetItem(markerKey);
      const savedPath = safeGetItem(pathMarkerKey);

      // A. Check if <sanitizedId>.audio exists in native cache (from listAthanCache)
      const cacheEntry = cachedFiles[sanitizedId];
      if (cacheEntry && cacheEntry.exists && cacheEntry.sizeBytes > 10 * 1024) {
        let cachedPath = savedPath;
        if (!cachedPath && nativeFiles) {
          const match = Object.values(nativeFiles).find(e => e.path.includes(`${sanitizedId}.audio`));
          if (match?.path) cachedPath = match.path;
        }
        if (!cachedPath) {
          cachedPath = `/data/user/0/com.salahpro.app/files/athan/${sanitizedId}.audio`;
        }
        console.log(`[ATHAN] SOURCE=SYNC ACTION=REUSE MUEZZIN=${muezzinId} SIZE=${cacheEntry.sizeBytes}`);
        resolvedPathsByMuezzinId.set(muezzinId, cachedPath);
        safeSetItem(markerKey, cacheEntry.sizeBytes.toString());
        safeSetItem(pathMarkerKey, cachedPath);
        continue;
      }

      // B. Check if savedPath from local storage marker is still valid in nativeFiles
      if (savedPath && savedMarker) {
        let fileStillExists = false;
        if (nativeFiles) {
          const matched = Object.values(nativeFiles).find(e => e.path === savedPath);
          if (matched && matched.exists && matched.sizeBytes > 10 * 1024) {
            fileStillExists = true;
          }
        }
        if (fileStillExists) {
          console.log(`[ATHAN] SOURCE=SYNC ACTION=REUSE MUEZZIN=${muezzinId} PATH=${savedPath}`);
          resolvedPathsByMuezzinId.set(muezzinId, savedPath);
          continue;
        }
      }

      // C. Cache miss -> Fetch and transfer
      try {
        const track = allTracks.find(t => t.id === muezzinId)
          || defaultMuezzins.find(t => t.isFajr === isFajr)
          || defaultMuezzins[0];

        const resolvedUrl = await getAudioUrl(track.url, track.id, isFajr);
        const isLocalTrack = resolvedUrl.startsWith('blob:') || resolvedUrl.startsWith('data:') || resolvedUrl.startsWith('/');
        const isOnline = typeof navigator !== 'undefined' ? (navigator.onLine ?? true) : true;

        if (!isLocalTrack && !isOnline) {
          console.log(`[ATHAN] SOURCE=SYNC ACTION=SKIP REASON=OFFLINE MUEZZIN=${muezzinId}`);
          failed.push({ muezzinId, reason: 'offline' });
          continue;
        }

        let resp: Response;
        try {
          resp = await fetch(resolvedUrl);
          if (!resp.ok) {
            console.warn(`[ATHAN] SOURCE=SYNC ACTION=SKIP REASON=FETCH_HTTP_${resp.status} MUEZZIN=${muezzinId}`);
            failed.push({ muezzinId, reason: `http_${resp.status}` });
            continue;
          }
        } catch (fetchErr: any) {
          if (!isOnline) {
            console.log(`[ATHAN] SOURCE=SYNC ACTION=SKIP REASON=OFFLINE MUEZZIN=${muezzinId}`);
            failed.push({ muezzinId, reason: 'offline' });
          } else {
            console.warn(`[ATHAN] SOURCE=SYNC ACTION=SKIP REASON=FETCH_ERROR MUEZZIN=${muezzinId}:`, fetchErr);
            failed.push({ muezzinId, reason: fetchErr?.message || 'fetch_error' });
          }
          continue;
        }

        const blob = await resp.blob();
        const sizeStr = blob.size.toString();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const chunks = chunkBinaryData(bytes, ATHAN_CHUNK_SIZE);

        let finalPath = '';
        for (const chunk of chunks) {
          const res = await plugin.saveAthanFileChunk({
            muezzinId: sanitizedId,
            chunkBase64: chunk.chunkBase64,
            index: chunk.index,
            isLast: chunk.isLast,
          });
          if (chunk.isLast && res?.path) {
            finalPath = res.path;
          }
        }

        if (finalPath) {
          safeSetItem(markerKey, sizeStr);
          safeSetItem(pathMarkerKey, finalPath);
          resolvedPathsByMuezzinId.set(muezzinId, finalPath);
          console.log(`[ATHAN] SOURCE=SYNC ACTION=SAVED MUEZZIN=${muezzinId} CHUNKS=${chunks.length} PATH=${finalPath}`);
        } else {
          failed.push({ muezzinId, reason: 'save_failed' });
        }
      } catch (mErr: any) {
        console.warn(`[ATHAN] SOURCE=SYNC ACTION=ERROR MUEZZIN=${muezzinId}:`, mErr);
        failed.push({ muezzinId, reason: mErr?.message || 'error' });
      }
    }

    // 4. Assemble paths map: keep existing path for failed/offline prayers if available, never send ""
    for (const p of prayers) {
      const item = prayerMuezzinMap[p.key];
      const newPath = resolvedPathsByMuezzinId.get(item.muezzinId);
      if (newPath) {
        pathsMap[p.key] = newPath;
      } else {
        // Keep previous native path if present, never send ""
        const prevPath = nativeFiles?.[p.key]?.path || safeGetItem(`salah_native_athan_path_${item.muezzinId}`);
        if (prevPath && prevPath.length > 0) {
          pathsMap[p.key] = prevPath;
        }
      }
    }

    // 5. ONE setNativeAthanFiles call with pathsMap
    await plugin.setNativeAthanFiles({ paths: pathsMap });
    console.log('[ATHAN] SOURCE=SYNC ACTION=COMPLETE PATHS=', pathsMap, 'FAILED=', failed);
    return { paths: pathsMap, failed };
  } catch (err) {
    console.warn('[ATHAN] SOURCE=SYNC ACTION=FAIL:', err);
    return { paths: pathsMap, failed };
  }
}

export async function syncMuezzinIdToNative(
  type?: 'general' | 'fajr',
  _muezzinId?: string
): Promise<string | null> {
  try {
    const res = await syncPrayerMuezzinsToNative();
    const paths = res?.paths;
    if (!paths) return null;
    if (type === 'fajr') return paths.fajr || paths.general || null;
    return paths.general || paths.fajr || null;
  } catch (err) {
    console.warn('[ATHAN] SOURCE=SYNC syncMuezzinIdToNative delegation error:', err);
    return null;
  }
}

export async function syncAthanFileToNative(
  type: 'general' | 'fajr',
  audioUrlOrBlob: string | Blob
): Promise<string | null> {
  const plugin = athanPluginBridgeForTesting || AthanAlarm;
  if (!Capacitor.isNativePlatform() && !athanPluginBridgeForTesting) return null;
  if (!plugin.saveAthanFileChunk && !plugin.saveAthanFile) return null;
  try {
    let blob: Blob;
    if (typeof audioUrlOrBlob === 'string') {
      const resp = await fetch(audioUrlOrBlob);
      blob = await resp.blob();
    } else {
      blob = audioUrlOrBlob;
    }

    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const chunks = chunkBinaryData(bytes, ATHAN_CHUNK_SIZE);
    let finalPath = '';
    for (const chunk of chunks) {
      if (plugin.saveAthanFileChunk) {
        const res = await plugin.saveAthanFileChunk({
          muezzinId: type,
          chunkBase64: chunk.chunkBase64,
          index: chunk.index,
          isLast: chunk.isLast,
        });
        if (chunk.isLast && res?.path) finalPath = res.path;
      }
    }
    return finalPath || null;
  } catch (err) {
    console.warn(`[ATHAN] SOURCE=SYNC Failed to sync ${type} athan to native:`, err);
    return null;
  }
}

// 4. Deferred app start sync & event listeners
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncPrayerMuezzinsToNative().catch((err) => {
      console.warn('[ATHAN] SOURCE=SYNC App start sync error:', err);
    });
  }, 3000);

  let debouncedSyncTimeout: any = null;
  const scheduleDebouncedSync = () => {
    if (debouncedSyncTimeout) clearTimeout(debouncedSyncTimeout);
    debouncedSyncTimeout = setTimeout(() => {
      syncPrayerMuezzinsToNative().catch(() => {});
    }, 500);
  };

  try {
    window.addEventListener('salah-muezzin-changed', scheduleDebouncedSync);
    window.addEventListener('salah-muezzin-downloaded', scheduleDebouncedSync);
  } catch (_e) {
    // ignore
  }
}

export default AthanAlarm;
