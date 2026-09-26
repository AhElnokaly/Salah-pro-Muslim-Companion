/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerPlugin } from '@capacitor/core';
import { safeGetJSON, safeSetJSON } from '../utils/storage';

export interface PrayerTimeAlarm {
  prayerKey: string;
  prayerName: string;
  timeMs: number;
  requestCode?: number;
  soundType?: string;
  notifyMode?: string;
  autoKhushu?: boolean;
  khushuDurationMinutes?: number;
  isFajr?: boolean;
  alarmType?: string;
  durationMinutes?: number;
  khushuMode?: string;
}

export interface DailyPrayerTimesEntry {
  date: Date | string;
  timesMap?: Record<string, string>;
  prayers?: Record<string, string>;
  [key: string]: any;
}

export interface ScheduledAlarmItem {
  requestCode: number;
  prayerKey: string;
  prayerName: string;
  timeMs: number;
  formattedTime?: string;
}

export interface ReconcileAlarmsResult {
  scheduledCount: number;
  addedCount: number;
  removedCount: number;
  retainedCount: number;
  exactAlarmPermissionMissing?: boolean;
}

export interface ScheduleAthanAlarmsOptions {
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
  prayerPreAlert?: boolean | number;
  preAlertMinutes?: number;
  prayerPostAlert?: boolean | number;
  postAlertMinutes?: number;
  khushuAutoWithIqama?: boolean;
  khushuMode?: string;
  khushuSettings?: any;
  customAlarms?: any;
  [key: string]: any;
}

export interface AthanAlarmPluginInterface {
  checkExactAlarmPermission(): Promise<{ granted: boolean }>;
  requestExactAlarmPermission(): Promise<{ requested: boolean }>;
  checkBatteryOptimization(): Promise<{ isOptimized: boolean; isIgnoringBatteryOptimizations: boolean }>;
  requestIgnoreBatteryOptimization(): Promise<{ requested: boolean }>;
  checkNotificationPermission(): Promise<{ granted: boolean; status: string }>;
  requestNotificationPermission(): Promise<{ granted: boolean; status: string }>;
  openNotificationSettings(): Promise<{ opened: boolean }>;
  sendNotification(options: { title: string; body: string; soundType?: string; [key: string]: any }): Promise<{ success: boolean; notificationId?: number }>;
  updateWidgetData(options: { data: Record<string, any>; cityName?: string; options?: Record<string, any>; [key: string]: any }): Promise<{ updated: boolean }>;
  updateOngoingPrayerNotification(options: {
    enabled: boolean;
    title?: string;
    body?: string;
    targetTimestamp?: number;
  }): Promise<{ success: boolean; posted?: boolean; cleared?: boolean }>;
  scheduleAthanAlarms(options: ScheduleAthanAlarmsOptions): Promise<ReconcileAlarmsResult>;
  getScheduledAlarms(): Promise<{ alarms: ScheduledAlarmItem[]; count: number }>;
  reconcileAthanAlarms(options: { times: PrayerTimeAlarm[] }): Promise<ReconcileAlarmsResult>;
  cancelAllAlarms(): Promise<{ cancelled: boolean }>;
  cancelAlarm(options: { alarmId?: string; requestCode?: number }): Promise<{ cancelled: boolean; requestCode?: number }>;
  canRequestPackageInstalls(): Promise<{ canInstall: boolean }>;
  openInstallPermissionSettings(): Promise<{ opened: boolean }>;
  downloadAndInstallApk(options: { url: string }): Promise<{ success: boolean; message?: string }>;
}

// Resilient Web Fallback Implementation
class AthanAlarmWebFallback implements AthanAlarmPluginInterface {
  private STORAGE_KEY = 'hemmaty_web_scheduled_alarms';

  async checkExactAlarmPermission(): Promise<{ granted: boolean }> {
    return { granted: true };
  }

  async requestExactAlarmPermission(): Promise<{ requested: boolean }> {
    return { requested: true };
  }

  async checkBatteryOptimization(): Promise<{ isOptimized: boolean; isIgnoringBatteryOptimizations: boolean }> {
    return { isOptimized: false, isIgnoringBatteryOptimizations: true };
  }

  async requestIgnoreBatteryOptimization(): Promise<{ requested: boolean }> {
    return { requested: true };
  }

  async checkNotificationPermission(): Promise<{ granted: boolean; status: string }> {
    if (typeof Notification !== 'undefined') {
      const p = Notification.permission;
      return { granted: p === 'granted', status: p };
    }
    return { granted: true, status: 'granted' };
  }

  async requestNotificationPermission(): Promise<{ granted: boolean; status: string }> {
    if (typeof Notification !== 'undefined') {
      const p = await Notification.requestPermission();
      return { granted: p === 'granted', status: p };
    }
    return { granted: true, status: 'granted' };
  }

  async openNotificationSettings(): Promise<{ opened: boolean }> {
    return { opened: false };
  }

  async sendNotification(options: { title: string; body: string }): Promise<{ success: boolean; notificationId?: number }> {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(options.title, { body: options.body, icon: '/icon-192.png' });
        return { success: true, notificationId: Math.floor(Math.random() * 10000) };
      } catch (e) {
        console.warn('[AthanAlarm Web] Failed to send web notification:', e);
      }
    }
    return { success: true };
  }

  async updateWidgetData(_options: { data: Record<string, any>; cityName?: string }): Promise<{ updated: boolean }> {
    return { updated: true };
  }

  async updateOngoingPrayerNotification(_options: {
    enabled: boolean;
    title?: string;
    body?: string;
    targetTimestamp?: number;
  }): Promise<{ success: boolean; posted?: boolean; cleared?: boolean }> {
    return { success: true, posted: true };
  }

  async scheduleAthanAlarms(options: {
    times: PrayerTimeAlarm[];
    lat?: number;
    lng?: number;
    calcMethod?: string;
    madhab?: string;
    timeZoneId?: string;
  }): Promise<ReconcileAlarmsResult> {
    const items: ScheduledAlarmItem[] = options.times.map((t, idx) => ({
      requestCode: t.requestCode || idx + 1000,
      prayerKey: t.prayerKey,
      prayerName: t.prayerName,
      timeMs: t.timeMs,
      formattedTime: new Date(t.timeMs).toLocaleTimeString(),
    }));
    safeSetJSON(this.STORAGE_KEY, items);
    return {
      scheduledCount: items.length,
      addedCount: items.length,
      removedCount: 0,
      retainedCount: 0,
      exactAlarmPermissionMissing: false,
    };
  }

  async getScheduledAlarms(): Promise<{ alarms: ScheduledAlarmItem[]; count: number }> {
    const items = safeGetJSON<ScheduledAlarmItem[]>(this.STORAGE_KEY, []);
    return { alarms: items, count: items.length };
  }

  async reconcileAthanAlarms(options: { times: PrayerTimeAlarm[] }): Promise<ReconcileAlarmsResult> {
    return this.scheduleAthanAlarms({ times: options.times });
  }

  async cancelAllAlarms(): Promise<{ cancelled: boolean }> {
    safeSetJSON(this.STORAGE_KEY, []);
    return { cancelled: true };
  }

  async cancelAlarm(options: { alarmId?: string; requestCode?: number }): Promise<{ cancelled: boolean; requestCode?: number }> {
    const items = safeGetJSON<ScheduledAlarmItem[]>(this.STORAGE_KEY, []);
    const filtered = items.filter((i) => i.requestCode !== options.requestCode);
    safeSetJSON(this.STORAGE_KEY, filtered);
    return { cancelled: true, requestCode: options.requestCode };
  }

  async canRequestPackageInstalls(): Promise<{ canInstall: boolean }> {
    return { canInstall: false };
  }

  async openInstallPermissionSettings(): Promise<{ opened: boolean }> {
    return { opened: false };
  }

  async downloadAndInstallApk(options: { url: string }): Promise<{ success: boolean; message?: string }> {
    if (typeof window !== 'undefined') {
      window.open(options.url, '_blank');
      return { success: true };
    }
    return { success: false, message: 'Platform not supported' };
  }
}

export const AthanAlarm = registerPlugin<AthanAlarmPluginInterface>('AthanAlarm', {
  web: () => new AthanAlarmWebFallback(),
});

export default AthanAlarm;

// Exported Helper Methods for Direct Usage
export async function scheduleNativeAthanAlarms(
  timesOrDays: PrayerTimeAlarm[] | DailyPrayerTimesEntry[] | any[],
  optionsOrUndefined?: any,
  extraOptions?: any
): Promise<ReconcileAlarmsResult> {
  let times: PrayerTimeAlarm[] = [];
  let options: any = {};

  if (extraOptions && typeof extraOptions === 'object') {
    options = { ...extraOptions };
  } else if (optionsOrUndefined && typeof optionsOrUndefined === 'object') {
    options = { ...optionsOrUndefined };
  }

  if (Array.isArray(timesOrDays)) {
    if (timesOrDays.length > 0 && typeof timesOrDays[0] === 'object' && 'timeMs' in timesOrDays[0]) {
      times = timesOrDays as PrayerTimeAlarm[];
    } else {
      for (const day of timesOrDays) {
        const prayers = day.timesMap || day.prayers || {};
        const dStr = day.date instanceof Date ? day.date.toISOString().split('T')[0] : String(day.date).split('T')[0];
        const [y, m, d] = dStr.split('-').map(Number);
        for (const [key, val] of Object.entries(prayers)) {
          if (typeof val === 'string' && val.includes(':')) {
            const [hh, mm] = val.split(':').map(Number);
            if (!isNaN(hh) && !isNaN(mm)) {
              const dateObj = new Date(y, m - 1, d, hh, mm, 0, 0);
              times.push({
                prayerKey: key,
                prayerName: key,
                timeMs: dateObj.getTime(),
                isFajr: key.toLowerCase() === 'fajr',
              });
            }
          }
        }
      }
    }
  }

  return await AthanAlarm.scheduleAthanAlarms({ times, ...options });
}

export async function updateNativeWidgetData(
  data: Record<string, any>,
  cityName: string = 'مواقيت الصلاة',
  options?: Record<string, any>
): Promise<boolean> {
  try {
    const payload = { ...data, ...(options || {}) };
    const res = await AthanAlarm.updateWidgetData({ data: payload, cityName, options });
    return res.updated;
  } catch (err) {
    console.warn('[AthanAlarmPlugin] updateNativeWidgetData error:', err);
    return false;
  }
}

export async function checkExactAlarmPermission(): Promise<boolean> {
  try {
    const res = await AthanAlarm.checkExactAlarmPermission();
    return res.granted;
  } catch (err) {
    console.warn('[AthanAlarmPlugin] checkExactAlarmPermission error:', err);
    return true;
  }
}

export async function requestExactAlarmPermission(): Promise<boolean> {
  try {
    const res = await AthanAlarm.requestExactAlarmPermission();
    return res.requested;
  } catch (err) {
    console.warn('[AthanAlarmPlugin] requestExactAlarmPermission error:', err);
    return false;
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  try {
    const res = await AthanAlarm.checkNotificationPermission();
    return res.granted;
  } catch (err) {
    console.warn('[AthanAlarmPlugin] checkNotificationPermission error:', err);
    return false;
  }
}

export async function requestNotificationPermission(): Promise<{ granted: boolean; status: string }> {
  try {
    return await AthanAlarm.requestNotificationPermission();
  } catch (err) {
    console.warn('[AthanAlarmPlugin] requestNotificationPermission error:', err);
    return { granted: false, status: 'denied' };
  }
}

export async function openAppNotificationSettings(): Promise<boolean> {
  try {
    const res = await AthanAlarm.openNotificationSettings();
    return res.opened;
  } catch (err) {
    console.warn('[AthanAlarmPlugin] openAppNotificationSettings error:', err);
    return false;
  }
}

export async function downloadAndInstallAppUpdate(
  apkUrl: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; message?: string }> {
  try {
    if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()) {
      if (onProgress) onProgress(50);
      const res = await AthanAlarm.downloadAndInstallApk({ url: apkUrl });
      if (onProgress) onProgress(100);
      return res;
    } else {
      window.open(apkUrl, '_blank');
      return { success: true };
    }
  } catch (err: any) {
    console.error('[AthanAlarmPlugin] downloadAndInstallAppUpdate error:', err);
    return { success: false, message: err.message || 'فشل التنزيل' };
  }
}
