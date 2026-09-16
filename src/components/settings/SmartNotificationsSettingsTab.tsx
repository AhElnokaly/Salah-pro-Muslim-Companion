/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bell, 
  Clock, 
  BookOpen, 
  Volume2, 
  Moon, 
  Check, 
  Send, 
  ShieldCheck, 
  Flame, 
  Sparkles,
  Info
} from 'lucide-react';
import { 
  SmartNotificationsSettings, 
  QURAN_RECITERS 
} from '../../domain/smartNotifications/smartNotificationTypes';
import { 
  getSmartNotificationsSettings, 
  saveSmartNotificationsSettings,
  triggerSmartNotificationTest
} from '../../domain/smartNotifications/smartNotificationService';
import { requestPushPermission } from '../../utils/pushNotificationService';

export default function SmartNotificationsSettingsTab() {
  const [settings, setSettings] = useState<SmartNotificationsSettings>(() => getSmartNotificationsSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const updateSetting = <K extends keyof SmartNotificationsSettings>(
    section: K,
    updater: (prev: SmartNotificationsSettings[K]) => SmartNotificationsSettings[K]
  ) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        [section]: updater(prev[section]),
      };
      saveSmartNotificationsSettings(next);
      return next;
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleRequestPermission = async () => {
    const perm = await requestPushPermission();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
    if (perm === 'granted') {
      setTestStatus('تم منح الإذن للإشعارات بنجاح!');
    } else {
      setTestStatus('يرجى التحقق من إعدادات الإشعارات في النظام.');
    }
    setTimeout(() => setTestStatus(null), 3500);
  };

  const handleTestNotification = async (type: 'ongoing_prayer' | 'listening' | 'reading' | 'adhkar') => {
    const success = await triggerSmartNotificationTest(type, settings);
    if (success) {
      setTestStatus('تم إرسال الإشعار التجريبي بنجاح إلى هاتفك 🔔');
    } else {
      setTestStatus('تعذر إرسال الإشعار، يرجى تفعيل إذن الإشعارات.');
    }
    setTimeout(() => setTestStatus(null), 3500);
  };

  return (
    <div
      id="smart-notifications-settings-tab-root"
      className="space-y-6 text-right max-w-4xl mx-auto"
      dir="rtl"
    >
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-l from-indigo-900/20 via-slate-900/10 to-transparent border border-indigo-500/20 dark:border-indigo-500/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-sm shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>الإشعارات الذكية والورد اليومي</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                نمط One UI
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تخصيص شريط الصلاة الحي الدائم، ورد القراءة اليومي، ورد الاستماع الصوتي، وأذكار اليوم
            </p>
          </div>
        </div>

        {/* Permission Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {permissionStatus === 'granted' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>الإشعارات مفعلة</span>
            </div>
          ) : (
            <button
              type="button"
              id="btn-request-notif-perm-settings"
              onClick={handleRequestPermission}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>طلب إذن التنبيهات</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {testStatus && (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs font-semibold animate-in fade-in duration-200 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>{testStatus}</span>
        </div>
      )}

      {/* 1. ONGOING PRAYER BAR */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                شريط الصلاة الحي الدائم (Ongoing Prayer Bar)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                إشعار مستمر في ستارة الهاتف وشاشة القفل يعرض الصلاة القادمة وعدها التنازلي الحي
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="toggle-ongoing-bar-setting"
              checked={settings.ongoingPrayerBar.enabled}
              onChange={(e) =>
                updateSetting('ongoingPrayerBar', (prev) => ({
                  ...prev,
                  enabled: e.target.checked,
                }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
          </label>
        </div>

        {settings.ongoingPrayerBar.enabled && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ongoingPrayerBar.showSeconds}
                  onChange={(e) =>
                    updateSetting('ongoingPrayerBar', (prev) => ({
                      ...prev,
                      showSeconds: e.target.checked,
                    }))
                  }
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  عرض الثواني في العد التنازلي (+ 1:21:04)
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ongoingPrayerBar.showHijriDate}
                  onChange={(e) =>
                    updateSetting('ongoingPrayerBar', (prev) => ({
                      ...prev,
                      showHijriDate: e.target.checked,
                    }))
                  }
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  عرض التاريخ الهجري كاملاً بجوار اسم المدينة
                </span>
              </label>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => handleTestNotification('ongoing_prayer')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 text-xs font-bold transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال إشعار تجريبي للشريط الحي</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. DAILY QURAN READING PORTION */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                ورد القراءة اليومي المصغر (Reading Portion)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تنبيه يومي يحدد لك أرقام الصفحات بدقة وسورة التلاوة لتختم القرآن في موعدك
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="toggle-reading-portion-setting"
              checked={settings.readingPortion.enabled}
              onChange={(e) =>
                updateSetting('readingPortion', (prev) => ({
                  ...prev,
                  enabled: e.target.checked,
                }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {settings.readingPortion.enabled && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold">
                  المقدار اليومي المفضل
                </label>
                <select
                  value={settings.readingPortion.dailyPagesGoal}
                  onChange={(e) =>
                    updateSetting('readingPortion', (prev) => ({
                      ...prev,
                      dailyPagesGoal: Number(e.target.value),
                    }))
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value={1}>صفحة واحدة يومياً</option>
                  <option value={2}>صفحتان يومياً (ختمة سنوية)</option>
                  <option value={4}>4 صفحات يومياً</option>
                  <option value={10}>10 صفحات (نصف جزء)</option>
                  <option value={20}>20 صفحة (جزء كامل)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold">
                  رقم الصفحة الحالية (1 - 604)
                </label>
                <input
                  type="number"
                  min={1}
                  max={604}
                  value={settings.readingPortion.currentPage}
                  onChange={(e) =>
                    updateSetting('readingPortion', (prev) => ({
                      ...prev,
                      currentPage: Math.max(1, Math.min(604, Number(e.target.value))),
                    }))
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold">
                  موعد التنبيه اليومي
                </label>
                <input
                  type="time"
                  value={settings.readingPortion.scheduledTime}
                  onChange={(e) =>
                    updateSetting('readingPortion', (prev) => ({
                      ...prev,
                      scheduledTime: e.target.value,
                    }))
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Streak & Test */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Flame className="w-4 h-4 fill-current" />
                <span>رصيد التزامك المتواصل: {settings.readingPortion.streakDays || 0} أيام متتابعة</span>
              </div>
              <button
                type="button"
                onClick={() => handleTestNotification('reading')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال إشعار تجريبي لورد القراءة</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. DAILY QURAN LISTENING PORTION */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                ورد الاستماع القرآني اليومي (Listening Portion)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                مقطع صوتي عذب مكون من خمس آيات للتدبر السريع بصوت قارئك المفضل
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="toggle-listening-portion-setting"
              checked={settings.listeningPortion.enabled}
              onChange={(e) =>
                updateSetting('listeningPortion', (prev) => ({
                  ...prev,
                  enabled: e.target.checked,
                }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {settings.listeningPortion.enabled && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold">
                  القارئ المفضل
                </label>
                <select
                  value={settings.listeningPortion.reciterId}
                  onChange={(e) =>
                    updateSetting('listeningPortion', (prev) => ({
                      ...prev,
                      reciterId: e.target.value,
                    }))
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100"
                >
                  {QURAN_RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold">
                  عدد الآيات في المقطع
                </label>
                <select
                  value={settings.listeningPortion.versesPerPortion}
                  onChange={(e) =>
                    updateSetting('listeningPortion', (prev) => ({
                      ...prev,
                      versesPerPortion: Number(e.target.value),
                    }))
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value={3}>3 آيات</option>
                  <option value={5}>5 آيات (الموصى به للتدبر)</option>
                  <option value={7}>7 آيات</option>
                  <option value={10}>10 آيات</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold">
                  موعد التنبيه اليومي
                </label>
                <input
                  type="time"
                  value={settings.listeningPortion.scheduledTime}
                  onChange={(e) =>
                    updateSetting('listeningPortion', (prev) => ({
                      ...prev,
                      scheduledTime: e.target.value,
                    }))
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => handleTestNotification('listening')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-xs font-bold transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال إشعار تجريبي لورد الاستماع</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. CONTEXTUAL MORNING & EVENING ADHKAR */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                أذكار الصباح والمساء المقتبسة (Contextual Adhkar)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تضمين نص أول دعاء في الإشعار مباشرة (مثل «أمسينا وأمسى الملك لله») للترديد الفوري
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="toggle-adhkar-portion-setting"
              checked={settings.contextualAdhkar.enabled}
              onChange={(e) =>
                updateSetting('contextualAdhkar', (prev) => ({
                  ...prev,
                  enabled: e.target.checked,
                }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
          </label>
        </div>

        {settings.contextualAdhkar.enabled && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold">
                  موعد أذكار الصباح
                </label>
                <input
                  type="time"
                  value={settings.contextualAdhkar.morningTime}
                  onChange={(e) =>
                    updateSetting('contextualAdhkar', (prev) => ({
                      ...prev,
                      morningTime: e.target.value,
                    }))
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold">
                  موعد أذكار المساء
                </label>
                <input
                  type="time"
                  value={settings.contextualAdhkar.eveningTime}
                  onChange={(e) =>
                    updateSetting('contextualAdhkar', (prev) => ({
                      ...prev,
                      eveningTime: e.target.value,
                    }))
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={settings.contextualAdhkar.includeQuotes}
                onChange={(e) =>
                  updateSetting('contextualAdhkar', (prev) => ({
                    ...prev,
                    includeQuotes: e.target.checked,
                  }))
                }
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                تضمين نص الدعاء في الإشعار للترديد السريع بدون فتح التطبيق
              </span>
            </label>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => handleTestNotification('adhkar')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-xs font-bold transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال إشعار تجريبي للأذكار</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Save Notice */}
      {savedSuccess && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg animate-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4" />
          <span>تم حفظ الإعدادات تلقائياً بنجاح</span>
        </div>
      )}
    </div>
  );
}
