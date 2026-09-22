/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Send,
  X,
  AlertTriangle,
  HelpCircle,
  Settings as SettingsIcon,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { 
  PushNotificationSettings, 
  getPushSettings, 
  savePushSettings, 
  requestPushPermission, 
  getPushPermissionStatus,
  sendPushNotification 
} from '../utils/pushNotificationService';
import { openAppNotificationSettings } from '../services/athanAlarmPlugin';
import { safeGetJSON, safeSetJSON } from '../utils/storage';
import { AlarmConfig } from '../types';
import { DEFAULT_WORSHIP_ALARMS } from '../utils/alarmUtils';
import { StorageFacade } from '../domain/storage/StorageFacade';
import ToggleSwitch from './ui/ToggleSwitch';

interface PushNotificationManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function PushNotificationManager({ isOpen = true, onClose }: PushNotificationManagerProps) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatusMsg, setTestStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const isNative = typeof window !== 'undefined' && Boolean((window as any).Capacitor?.isNativePlatform());

  // Initialize settings with sync from custom worship alarms
  const [settings, setSettings] = useState<PushNotificationSettings>(() => {
    const pushSet = getPushSettings();
    const alarms = safeGetJSON<AlarmConfig[] | null>('salah_custom_alarms', null);
    const beforeAlarm = alarms?.find(a => a.id === 'alarm_before_salah');
    if (beforeAlarm) {
      pushSet.prayerPreAlert = beforeAlarm.enabled;
      pushSet.preAlertMinutes = beforeAlarm.offsetMinutes || 15;
    }
    const afterAlarm = alarms?.find(a => a.id === 'alarm_after_salah');
    if (afterAlarm) {
      pushSet.prayerPostAlert = afterAlarm.enabled;
      pushSet.postAlertMinutes = afterAlarm.offsetMinutes || 15;
    }
    return pushSet;
  });

  // Re-check permissions on mount and when app regains focus/visibility
  const checkStatus = useCallback(async () => {
    try {
      const status = await getPushPermissionStatus();
      setPermissionStatus(status);
    } catch {
      setPermissionStatus('denied');
    }
  }, []);

  useEffect(() => {
    checkStatus();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStatus();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkStatus);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkStatus);
    };
  }, [checkStatus]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setTestStatusMsg(null);
    try {
      const result = await requestPushPermission();
      setPermissionStatus(result);

      if (result === 'granted') {
        await sendPushNotification('تم تفعيل إشعارات تطبيق هِمَّتِي بنجاح 🕌', {
          body: 'ستصلك الآن تنبيهات الأذان والأذكار الفورية في المواعيد المحددة.',
          soundType: 'athan'
        });
        setTestStatusMsg({
          type: 'success',
          text: 'تم منح الإذن وتفعيل الإشعارات الفورية بنجاح!'
        });
      } else if (result === 'denied') {
        if (isNative) {
          setTestStatusMsg({
            type: 'error',
            text: 'الإشعارات معطلة في الهاتف. اضغط على زر "فتح إعدادات الهاتف" أدناه للسماح بالإشعارات لتطبيق هِمَّتِي.'
          });
        } else {
          setTestStatusMsg({
            type: 'error',
            text: 'تم رفض الإذن من المتصفح. يمكنك تفعيله يدوياً من إعدادات الموقع بالمتصفح (أيقونة القفل 🔒).'
          });
        }
      }
    } catch (e) {
      console.error('[PushNotificationManager] Request error:', e);
      setTestStatusMsg({
        type: 'error',
        text: 'حدث خطأ أثناء طلب الإذن. يرجى مراجعة إعدادات الإشعارات في جهازك.'
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = async () => {
    if (isNative) {
      await openAppNotificationSettings();
    } else {
      setTestStatusMsg({
        type: 'info',
        text: 'في المتصفح: اضغط على أيقونة القفل 🔒 أو علامة الإعدادات بجانب رابط الموقع في شريط العناوين، ثم اختر "سماح للإشعارات".'
      });
    }
  };

  const handleSettingToggle = <K extends keyof PushNotificationSettings>(key: K, value: PushNotificationSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    savePushSettings(updated);

    // Sync Adhan toggle with AppSettings
    if (key === 'prayerAthan') {
      try {
        const appSettings = StorageFacade.getSettings<any>(null);
        if (appSettings && appSettings.adhanEnabled) {
          const updatedAdhan = { ...appSettings.adhanEnabled };
          Object.keys(updatedAdhan).forEach(p => {
            updatedAdhan[p] = Boolean(value);
          });
          StorageFacade.saveSettings({
            ...appSettings,
            adhanEnabled: updatedAdhan
          });
        }
      } catch (err) {
        console.warn('[PushNotificationManager] Failed to sync prayerAthan with AppSettings:', err);
      }
    }
  };

  // Synchronize pre-alert minutes and toggle with actual salah_custom_alarms
  const handlePreAlertChange = (mins: number, enabled: boolean) => {
    const updated = { ...settings, preAlertMinutes: mins, prayerPreAlert: enabled };
    setSettings(updated);
    savePushSettings(updated);

    try {
      const currentAlarms = safeGetJSON<AlarmConfig[] | null>('salah_custom_alarms', null) || DEFAULT_WORSHIP_ALARMS;
      const updatedAlarms = currentAlarms.map(alarm => {
        if (alarm.id === 'alarm_before_salah') {
          return {
            ...alarm,
            enabled,
            offsetMinutes: mins
          };
        }
        return alarm;
      });
      safeSetJSON('salah_custom_alarms', updatedAlarms);
    } catch (err) {
      console.warn('[PushNotificationManager] Failed to sync pre-alert with custom alarms:', err);
    }
  };

  // Synchronize post-alert (worship reminder) minutes and toggle with actual salah_custom_alarms
  const handlePostAlertChange = (mins: number, enabled: boolean) => {
    const updated = { ...settings, postAlertMinutes: mins, prayerPostAlert: enabled };
    setSettings(updated);
    savePushSettings(updated);

    try {
      const currentAlarms = safeGetJSON<AlarmConfig[] | null>('salah_custom_alarms', null) || DEFAULT_WORSHIP_ALARMS;
      const updatedAlarms = currentAlarms.map(alarm => {
        if (alarm.id === 'alarm_after_salah') {
          return {
            ...alarm,
            enabled,
            offsetMinutes: mins
          };
        }
        return alarm;
      });
      safeSetJSON('salah_custom_alarms', updatedAlarms);
    } catch (err) {
      console.warn('[PushNotificationManager] Failed to sync post-alert with custom alarms:', err);
    }
  };

  const handleTestPush = async () => {
    setIsTesting(true);
    setTestStatusMsg(null);
    try {
      const success = await sendPushNotification('اختبار إشعار تطبيق هِمَّتِي 🔔', {
        body: 'هذا إشعار تجريبي لاختبار وصول التنبيهات الفورية إلى جهازك بنجاح 🕌',
        soundType: 'athan'
      });

      if (success) {
        setTestStatusMsg({
          type: 'success',
          text: 'تم إرسال الإشعار التجريبي بنجاح! تفقد أعلى الشاشة أو ستارة الإشعارات في جهازك.'
        });
      } else {
        if (permissionStatus === 'denied') {
          setTestStatusMsg({
            type: 'error',
            text: isNative 
              ? 'الإشعارات معطلة في الهاتف. اضغط على "فتح إعدادات الهاتف" للسماح بالإشعارات.'
              : 'الإشعارات معطلة في المتصفح. يرجى تفعيل الإذن أولاً.'
          });
        } else if (!settings.enabled) {
          setTestStatusMsg({
            type: 'error',
            text: 'نظام الإشعارات الرئيسي معطل حالياً. يرجى تفعيله من الخيار الأول أدناه.'
          });
        } else {
          setTestStatusMsg({
            type: 'error',
            text: 'لم نتمكن من إرسال الإشعار. تأكد من منح الإذن وعدم تفعيل وضع عدم الإزعاج (Do Not Disturb).'
          });
        }
      }
    } catch (e) {
      console.error('[PushNotificationManager] Test push error:', e);
      setTestStatusMsg({
        type: 'error',
        text: 'حدث خطأ أثناء محاولة إرسال الإشعار التجريبي.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="push_notification_manager_modal" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn" 
      dir="rtl"
    >
      <div 
        id="push_notification_manager_card"
        className="bg-white dark:bg-[#161d26] w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col text-right"
      >
        
        {/* MODAL HEADER */}
        <div 
          id="push_notification_header"
          className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-[#111720] text-white flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-2xl border border-amber-400/30 shrink-0">
              <BellRing className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">إدارة الإشعارات الفورية (Push Notifications)</h2>
              <p className="text-[11px] sm:text-xs text-indigo-200">تخصيص تنبيهات الأذان، أذكار الصباح والمساء، والورود اليومي</p>
            </div>
          </div>

          {onClose && (
            <button
              id="push_notification_close_header_btn"
              type="button"
              onClick={onClose}
              aria-label="إغلاق نافذة إدارة الإشعارات الفورية"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* MODAL BODY */}
        <div 
          id="push_notification_body"
          className="p-4 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5 flex-1 overscroll-contain"
        >
          
          {/* ADAPTIVE PERMISSION BANNER */}
          <div 
            id="push_notification_permission_banner"
            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              permissionStatus === 'granted'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : permissionStatus === 'denied'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              {permissionStatus === 'granted' ? (
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
              ) : permissionStatus === 'denied' ? (
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              )}

              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-black">
                  {permissionStatus === 'granted' 
                    ? (isNative ? 'إشعارات تطبيق هِمَّتِي مفعّلة في هاتفك ✓' : 'الإشعارات الفورية مفعّلة في متصفحك ✓')
                    : permissionStatus === 'denied'
                    ? (isNative ? 'إشعارات التطبيق غير مسموح بها في إعدادات الهاتف' : 'الإشعارات محظورة من إعدادات المتصفح')
                    : 'الإشعارات الفورية غير مفعّلة بعد'}
                </h3>
                <p className="text-[11px] sm:text-xs opacity-90 leading-relaxed">
                  {permissionStatus === 'granted'
                    ? 'تصلك التنبيهات والأذكار حتى عند إغلاق التطبيق أو استخدام تطبيق آخر.'
                    : permissionStatus === 'denied'
                    ? (isNative 
                        ? 'يرجى فتح إعدادات الهاتف والسماح بإشعارات تطبيق هِمَّتِي لتصلك تنبيهات الأذان والأوراد.'
                        : 'اضغط على أيقونة القفل 🔒 بجانب رابط الموقع في المتصفح ثم اختر "سماح للإشعارات".')
                    : 'اضغط على الزر لمنح الإذن واستلام تنبيهات الأذان والأوراد فوراً.'}
                </p>
              </div>
            </div>

            {permissionStatus !== 'granted' && (
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end pt-1 sm:pt-0">
                <button
                  id="push_notification_request_perm_btn"
                  type="button"
                  onClick={handleRequestPermission}
                  disabled={isRequesting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جارٍ التفعيل...</span>
                    </>
                  ) : (
                    <span>تفعيل الإشعارات الآن ⚡</span>
                  )}
                </button>

                {isNative && (
                  <button
                    id="push_notification_open_settings_btn"
                    type="button"
                    onClick={handleOpenSettings}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="فتح إعدادات إشعارات التطبيق في النظام"
                  >
                    <SettingsIcon className="w-3.5 h-3.5" />
                    <span>إعدادات الهاتف</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* STATUS NOTIFICATION MESSAGE */}
          {testStatusMsg && (
            <div 
              id="push_notification_status_msg"
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
                testStatusMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                  : testStatusMsg.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800'
              }`}
            >
              <span>{testStatusMsg.text}</span>
              <button
                type="button"
                onClick={() => setTestStatusMsg(null)}
                aria-label="إغلاق التنبيه"
                className="p-1 hover:opacity-75 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* MAIN TOGGLES */}
          <div className="space-y-3.5 sm:space-y-4">
            
            {/* Master Toggle */}
            <div 
              id="push_master_toggle_card"
              className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-white">تفعيل نظام الإشعارات الرئيسي</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">إيقاف هذا الخيار يعطل جميع الإشعارات الفورية</p>
                </div>
              </div>

              <ToggleSwitch
                checked={settings.enabled}
                onChange={(checked) => handleSettingToggle('enabled', checked)}
                activeColor="bg-indigo-600"
              />
            </div>

            {/* CHANNEL 1: PRAYER & PRE-ALERT */}
            <div 
              id="push_prayer_channel_card"
              className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🕌</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white">إشعارات الأذان ومواقيت الصلوات</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">تنبيه فوري عند حان موعد الصلاة في مدينتك</p>
                  </div>
                </div>

                <ToggleSwitch
                  checked={settings.prayerAthan}
                  onChange={(checked) => handleSettingToggle('prayerAthan', checked)}
                  activeColor="bg-emerald-600"
                />
              </div>

              {/* Pre-prayer alert */}
              <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 min-w-0">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">تنبيه الاستعداد قبل الأذان:</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    id="pre_alert_minutes_select"
                    value={settings.preAlertMinutes}
                    onChange={(e) => handlePreAlertChange(Number(e.target.value), settings.prayerPreAlert)}
                    aria-label="تحديد وقت تنبيه الاستعداد قبل الأذان بالدقائق"
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-800 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value={5}>قبل ٥ دقائق</option>
                    <option value={10}>قبل ١٠ دقائق</option>
                    <option value={15}>قبل ١٥ دقيقة</option>
                    <option value={20}>قبل ٢٠ دقيقة</option>
                  </select>

                  <ToggleSwitch
                    checked={settings.prayerPreAlert}
                    onChange={(checked) => handlePreAlertChange(settings.preAlertMinutes, checked)}
                    activeColor="bg-amber-600"
                    size="sm"
                  />
                </div>
              </div>

              {/* Post-prayer worship alert */}
              <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 min-w-0">
                  <span className="text-sm shrink-0">📿</span>
                  <span className="truncate">تذكير العبادة والأذكار بعد الصلاة:</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    id="post_alert_minutes_select"
                    value={settings.postAlertMinutes}
                    onChange={(e) => handlePostAlertChange(Number(e.target.value), settings.prayerPostAlert)}
                    aria-label="تحديد وقت تذكير العبادة بعد الأذان بالدقائق"
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-800 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value={5}>بعد ٥ دقائق</option>
                    <option value={10}>بعد ١٠ دقائق</option>
                    <option value={15}>بعد ١٥ دقيقة</option>
                    <option value={20}>بعد ٢٠ دقيقة</option>
                    <option value={30}>بعد ٣٠ دقيقة</option>
                  </select>

                  <ToggleSwitch
                    checked={settings.prayerPostAlert}
                    onChange={(checked) => handlePostAlertChange(settings.postAlertMinutes, checked)}
                    activeColor="bg-emerald-600"
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* CHANNEL 2: MORNING & EVENING ADHKAR */}
            <div 
              id="push_adhkar_channel_card"
              className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌅</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white">أذكار الصباح والمساء</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">تنبيهات مخصصة بمواعيد الأذكار اليومية</p>
                  </div>
                </div>

                <ToggleSwitch
                  checked={settings.adhkarMorning && settings.adhkarEvening}
                  onChange={(checked) => {
                    handleSettingToggle('adhkarMorning', checked);
                    handleSettingToggle('adhkarEvening', checked);
                  }}
                  activeColor="bg-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-700/60 border border-slate-200/60 dark:border-slate-600">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">موعد الصباح:</span>
                  <input
                    type="time"
                    value={settings.morningTime}
                    onChange={(e) => handleSettingToggle('morningTime', e.target.value)}
                    aria-label="تحديد موعد أذكار الصباح"
                    className="text-xs font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-700/60 border border-slate-200/60 dark:border-slate-600">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">موعد المساء:</span>
                  <input
                    type="time"
                    value={settings.eveningTime}
                    onChange={(e) => handleSettingToggle('eveningTime', e.target.value)}
                    aria-label="تحديد موعد أذكار المساء"
                    className="text-xs font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* CHANNEL 3: PERIODIC ISTIGHFAR & QUIET HOURS */}
            <div 
              id="push_periodic_channel_card"
              className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📿</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white">التذكير الدوري بالاستغفار والصلوات</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">إشعار لطيف كل عدة ساعات لتعطير لسانك بالذكر</p>
                  </div>
                </div>

                <ToggleSwitch
                  checked={settings.adhkarPeriodic}
                  onChange={(checked) => handleSettingToggle('adhkarPeriodic', checked)}
                  activeColor="bg-indigo-600"
                />
              </div>

              {/* Quiet hours setting */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>ساعات الهدوء (إيقاف الإشعارات ليلاً):</span>
                </div>

                <ToggleSwitch
                  checked={settings.quietHours}
                  onChange={(checked) => handleSettingToggle('quietHours', checked)}
                  activeColor="bg-indigo-600"
                  size="sm"
                />
              </div>
            </div>

          </div>
        </div>

        {/* MODAL FOOTER */}
        <div 
          id="push_notification_footer"
          className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shrink-0"
        >
          <button
            id="push_notification_send_test_btn"
            type="button"
            onClick={handleTestPush}
            disabled={isTesting}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جارٍ الإرسال...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>إرسال إشعار تجريبي الآن 🔔</span>
              </>
            )}
          </button>

          {onClose && (
            <button
              id="push_notification_close_btn"
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-black text-xs rounded-xl transition-all cursor-pointer"
            >
              إغلاق
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
