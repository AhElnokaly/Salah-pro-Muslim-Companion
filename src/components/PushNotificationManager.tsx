/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { 
  PushNotificationSettings, 
  getPushSettings, 
  savePushSettings, 
  requestPushPermission, 
  sendPushNotification 
} from '../utils/pushNotificationService';
import { toArabicNumbers } from '../utils/hijri';

interface PushNotificationManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function PushNotificationManager({ isOpen = true, onClose }: PushNotificationManagerProps) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<PushNotificationSettings>(() => getPushSettings());
  const [testStatusMsg, setTestStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestPushPermission();
    setPermissionStatus(result);
    if (result === 'granted') {
      sendPushNotification('تم تفعيل إشعارات رفيق المسلم بنجاح 🕌', {
        body: 'ستصلك الآن تنبيهات الأذان والأذكار الفورية في المواعيد المحددة.',
        soundType: 'athan'
      });
      setTestStatusMsg('تم منح الإذن وتفعيل الإشعارات الفورية بنجاح!');
    } else if (result === 'denied') {
      setTestStatusMsg('تم رفض الإذن من المتصفح. يمكنك تفعيله يدوياً من إعدادات الموقع بالمتصفح.');
    }
  };

  const handleSettingToggle = (key: keyof PushNotificationSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    savePushSettings(updated);
  };

  const handleTestPush = async () => {
    setTestStatusMsg(null);
    const success = await sendPushNotification('اختبار إشعار رفيق المسلم 🔔', {
      body: 'هذا إشعار تجريبي لاختبار التنبيهات الفورية على جهازك.',
      soundType: 'athan'
    });

    if (success) {
      setTestStatusMsg('تم إرسال الإشعار التجريبي بنجاح! تحقق من أعلى الشاشة أو مركز الإشعارات.');
    } else {
      setTestStatusMsg('لم نتمكن من إرسال الإشعار. تأكد من قبول الإذن وعدم تفعيل وضع عدم الإزعاج.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-[#161d26] w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col text-right">
        
        {/* MODAL HEADER */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-[#111720] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-2xl border border-amber-400/30">
              <BellRing className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">إدارة الإشعارات الفورية (Push Notifications)</h2>
              <p className="text-xs text-indigo-200">تخصيص تنبيهات الأذان، أذكار الصباح والمساء، والورود اليومي</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="p-5 overflow-y-auto space-y-6">
          
          {/* PERMISSION BANNER */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            permissionStatus === 'granted'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : permissionStatus === 'denied'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              {permissionStatus === 'granted' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : permissionStatus === 'denied' ? (
                <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
              )}

              <div className="space-y-0.5">
                <h3 className="text-sm font-black">
                  {permissionStatus === 'granted' 
                    ? 'الإشعارات الفورية مفعّلة في متصفحك ✓' 
                    : permissionStatus === 'denied'
                    ? 'الإشعارات محظورة من إعدادات المتصفح'
                    : 'الإشعارات الفورية غير مفعّلة بعد'}
                </h3>
                <p className="text-xs opacity-90 leading-relaxed">
                  {permissionStatus === 'granted'
                    ? 'تصلك التنبيهات حتى عند إغلاق التطبيق أو استخدام تطبيق آخر.'
                    : permissionStatus === 'denied'
                    ? 'اضغط على أيقونة القفل 🔒 بجانب رابط الموقع في المتصفح ثم اختر "سماح للإشعارات".'
                    : 'اضغط على الزر أدناه لمنح الإذن واستلام التنبيهات فوراً.'}
                </p>
              </div>
            </div>

            {permissionStatus !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
              >
                تفعيل الإشعارات الآن ⚡
              </button>
            )}
          </div>

          {testStatusMsg && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-extrabold flex items-center justify-between">
              <span>{testStatusMsg}</span>
              <button onClick={() => setTestStatusMsg(null)} className="text-indigo-500 hover:text-indigo-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* MAIN TOGGLES */}
          <div className="space-y-4">
            
            {/* Master Toggle */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-white">تفعيل نظام الإشعارات الرئيسي</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">إيقاف هذا الخيار يعطل جميع الإشعارات الفورية</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleSettingToggle('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* CHANNEL 1: PRAYER & PRE-ALERT */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🕌</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white">إشعارات الأذان ومواقيت الصلوات</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">تنبيه فوري عند حان موعد الصلاة</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.prayerAthan}
                    onChange={(e) => handleSettingToggle('prayerAthan', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Pre-prayer alert */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>تنبيه الاستعداد قبل الأذان:</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={settings.preAlertMinutes}
                    onChange={(e) => handleSettingToggle('preAlertMinutes', Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value={5}>قبل ٥ دقائق</option>
                    <option value={10}>قبل ١٠ دقائق</option>
                    <option value={15}>قبل ١٥ دقيقة</option>
                    <option value={20}>قبل ٢٠ دقيقة</option>
                  </select>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.prayerPreAlert}
                      onChange={(e) => handleSettingToggle('prayerPreAlert', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* CHANNEL 2: MORNING & EVENING ADHKAR */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌅</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white">أذكار الصباح والمساء</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">تنبيهات مخصصة بمواعيد الأذكار اليومية</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.adhkarMorning && settings.adhkarEvening}
                    onChange={(e) => {
                      handleSettingToggle('adhkarMorning', e.target.checked);
                      handleSettingToggle('adhkarEvening', e.target.checked);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-700/60 border border-slate-200/60 dark:border-slate-600">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">موعد الصباح:</span>
                  <input
                    type="time"
                    value={settings.morningTime}
                    onChange={(e) => handleSettingToggle('morningTime', e.target.value)}
                    className="text-xs font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-700/60 border border-slate-200/60 dark:border-slate-600">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">موعد المساء:</span>
                  <input
                    type="time"
                    value={settings.eveningTime}
                    onChange={(e) => handleSettingToggle('eveningTime', e.target.value)}
                    className="text-xs font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* CHANNEL 3: PERIODIC ISTIGHFAR & FRIDAY */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📿</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white">التذكير الدوري بالاستغفار والصلوات</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">إشعار لطيف كل عدة ساعات لتعطير لسانك بالذكر</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.adhkarPeriodic}
                    onChange={(e) => handleSettingToggle('adhkarPeriodic', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Quiet hours setting */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>ساعات الهدوء (إيقاف الإشعارات ليلاً):</span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.quietHours}
                    onChange={(e) => handleSettingToggle('quietHours', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleTestPush}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>إرسال إشعار تجريبي الآن 🔔</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="py-2.5 px-5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-black text-xs rounded-xl transition-all cursor-pointer"
            >
              إغلاق
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
