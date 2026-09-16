/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Bell, Moon, BookOpen, Volume2, Clock, Check, Save } from 'lucide-react';
import { 
  SmartNotificationsSettings,
  QURAN_RECITERS 
} from '../../domain/smartNotifications/smartNotificationTypes';

interface SmartNotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SmartNotificationsSettings;
  onSaveSettings: (updater: (prev: SmartNotificationsSettings) => SmartNotificationsSettings) => void;
}

export const SmartNotificationSettingsModal: React.FC<SmartNotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="smart-notification-settings-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        id="smart-notification-settings-content"
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                إعدادات الإشعارات الذكية والورد اليومي
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تخصيص شريط الصلاة الدائم، ورد القراءة، وورد الاستماع
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-smart-notif-settings"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-700 dark:text-slate-200 text-sm">
          
          {/* 1. ONGOING PRAYER BAR */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    شريط الصلاة الحي الدائم
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    إشعار ثابت أعلى ستارة الهاتف يعرض العد التنازلي والتاريخ الهجري
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ongoingPrayerBar.enabled}
                  onChange={(e) =>
                    onSaveSettings((prev) => ({
                      ...prev,
                      ongoingPrayerBar: { ...prev.ongoingPrayerBar, enabled: e.target.checked },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {settings.ongoingPrayerBar.enabled && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.ongoingPrayerBar.showSeconds}
                    onChange={(e) =>
                      onSaveSettings((prev) => ({
                        ...prev,
                        ongoingPrayerBar: { ...prev.ongoingPrayerBar, showSeconds: e.target.checked },
                      }))
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>عرض الثواني في العد التنازلي</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.ongoingPrayerBar.showHijriDate}
                    onChange={(e) =>
                      onSaveSettings((prev) => ({
                        ...prev,
                        ongoingPrayerBar: { ...prev.ongoingPrayerBar, showHijriDate: e.target.checked },
                      }))
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>عرض التاريخ الهجري كاملاً</span>
                </label>
              </div>
            )}
          </div>

          {/* 2. DAILY QURAN READING PORTION */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    ورد القراءة اليومي المصغر
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    تنبيه يومي محدد بالصفحات والسورة (مثال: من ص 220 إلى 222 — يونس)
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.readingPortion.enabled}
                  onChange={(e) =>
                    onSaveSettings((prev) => ({
                      ...prev,
                      readingPortion: { ...prev.readingPortion, enabled: e.target.checked },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {settings.readingPortion.enabled && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    المقدار اليومي (صفحات)
                  </label>
                  <select
                    value={settings.readingPortion.dailyPagesGoal}
                    onChange={(e) =>
                      onSaveSettings((prev) => ({
                        ...prev,
                        readingPortion: { ...prev.readingPortion, dailyPagesGoal: Number(e.target.value) },
                      }))
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value={1}>صفحة واحدة يومياً</option>
                    <option value={2}>صفحتان يومياً (ختمة سنوية)</option>
                    <option value={4}>4 صفحات يومياً</option>
                    <option value={10}>10 صفحات (نصف جزء)</option>
                    <option value={20}>20 صفحة (جزء كامل)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    الصفحة الحالية
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={604}
                    value={settings.readingPortion.currentPage}
                    onChange={(e) =>
                      onSaveSettings((prev) => ({
                        ...prev,
                        readingPortion: { ...prev.readingPortion, currentPage: Math.max(1, Math.min(604, Number(e.target.value))) },
                      }))
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    موعد التنبيه اليومي
                  </label>
                  <input
                    type="time"
                    value={settings.readingPortion.scheduledTime}
                    onChange={(e) =>
                      onSaveSettings((prev) => ({
                        ...prev,
                        readingPortion: { ...prev.readingPortion, scheduledTime: e.target.value },
                      }))
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. DAILY QURAN LISTENING PORTION */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    ورد الاستماع القرآني اليومي
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    مقطع صوتي قصير (خمس آيات بصوت القارئ المفضل للتدبر السريع)
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.listeningPortion.enabled}
                  onChange={(e) =>
                    onSaveSettings((prev) => ({
                      ...prev,
                      listeningPortion: { ...prev.listeningPortion, enabled: e.target.checked },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {settings.listeningPortion.enabled && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    القارئ المفضل
                  </label>
                  <select
                    value={settings.listeningPortion.reciterId}
                    onChange={(e) =>
                      onSaveSettings((prev) => ({
                        ...prev,
                        listeningPortion: { ...prev.listeningPortion, reciterId: e.target.value },
                      }))
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    {QURAN_RECITERS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    عدد الآيات في المقطع
                  </label>
                  <select
                    value={settings.listeningPortion.versesPerPortion}
                    onChange={(e) =>
                      onSaveSettings((prev) => ({
                        ...prev,
                        listeningPortion: { ...prev.listeningPortion, versesPerPortion: Number(e.target.value) },
                      }))
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value={3}>3 آيات يومياً</option>
                    <option value={5}>5 آيات يومياً (الموصى به)</option>
                    <option value={7}>7 آيات يومياً</option>
                    <option value={10}>10 آيات يومياً</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    موعد التنبيه اليومي
                  </label>
                  <input
                    type="time"
                    value={settings.listeningPortion.scheduledTime}
                    onChange={(e) =>
                      onSaveSettings((prev) => ({
                        ...prev,
                        listeningPortion: { ...prev.listeningPortion, scheduledTime: e.target.value },
                      }))
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. CONTEXTUAL ADHKAR QUOTES */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    أذكار الصباح والمساء المقتبسة
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    تضمين نص أول دعاء في الإشعار («أمسينا وأمسى الملك لله») للترديد السريع
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.contextualAdhkar.includeQuotes}
                  onChange={(e) =>
                    onSaveSettings((prev) => ({
                      ...prev,
                      contextualAdhkar: { ...prev.contextualAdhkar, includeQuotes: e.target.checked },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-end">
          <button
            type="button"
            id="btn-save-smart-notif-settings"
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>حفظ الإعدادات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
