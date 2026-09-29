/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sun, 
  Moon, 
  Clock, 
  Bell, 
  Check, 
  Volume2, 
  Sparkles,
  Sliders,
  Calendar
} from 'lucide-react';
import { AlarmConfig, AlarmSoundType } from '../../types';
import { safeGetJSON, safeSetJSON } from '../../utils/storage';
import { SOUND_OPTIONS } from '../alarms/alarmModalConstants';

interface AdhkarTimingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'morning' | 'evening';
  setToastMessage?: (msg: string) => void;
}

export const AdhkarTimingModal: React.FC<AdhkarTimingModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'morning',
  setToastMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>(initialTab);

  // Morning State
  const [morningEnabled, setMorningEnabled] = useState(true);
  const [morningMode, setMorningMode] = useState<'fixed' | 'relative'>('relative');
  const [morningFixedTime, setMorningFixedTime] = useState('06:30');
  const [morningPrayer, setMorningPrayer] = useState<'Sunrise' | 'Fajr'>('Sunrise');
  const [morningOffset, setMorningOffset] = useState<number>(15);
  const [morningSound, setMorningSound] = useState<AlarmSoundType>('speech');

  // Evening State
  const [eveningEnabled, setEveningEnabled] = useState(true);
  const [eveningMode, setEveningMode] = useState<'fixed' | 'relative'>('relative');
  const [eveningFixedTime, setEveningFixedTime] = useState('16:45');
  const [eveningPrayer, setEveningPrayer] = useState<'Asr' | 'Maghrib'>('Asr');
  const [eveningOffset, setEveningOffset] = useState<number>(20);
  const [eveningSound, setEveningSound] = useState<AlarmSoundType>('speech');

  // Load existing configuration on open
  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);

    try {
      const customAlarms = safeGetJSON<AlarmConfig[]>('salah_custom_alarms', []);
      const settings = safeGetJSON<any>('salah_settings', null);

      // 1. Morning Alarm
      const mAlarm = Array.isArray(customAlarms) ? customAlarms.find(a => a.id === 'alarm_morning_adhkar' || (a.title && a.title.includes('الصباح'))) : null;
      if (mAlarm) {
        setMorningEnabled(mAlarm.enabled !== false);
        const isFix = mAlarm.type === 'fixed' || (Boolean(mAlarm.time) && (!mAlarm.prayers || mAlarm.prayers.length === 0));
        setMorningMode(isFix ? 'fixed' : 'relative');
        if (mAlarm.time) setMorningFixedTime(mAlarm.time);
        if (mAlarm.prayers && mAlarm.prayers.length > 0) {
          setMorningPrayer(mAlarm.prayers[0] === 'Fajr' ? 'Fajr' : 'Sunrise');
        }
        if (mAlarm.offsetMinutes !== undefined) setMorningOffset(mAlarm.offsetMinutes);
        if (mAlarm.soundType) setMorningSound(mAlarm.soundType);
      } else if (settings?.contextualAdhkar?.morningTime) {
        setMorningFixedTime(settings.contextualAdhkar.morningTime);
      }

      // 2. Evening Alarm
      const eAlarm = Array.isArray(customAlarms) ? customAlarms.find(a => a.id === 'alarm_evening_adhkar' || (a.title && a.title.includes('المساء'))) : null;
      if (eAlarm) {
        setEveningEnabled(eAlarm.enabled !== false);
        const isFix = eAlarm.type === 'fixed' || (Boolean(eAlarm.time) && (!eAlarm.prayers || eAlarm.prayers.length === 0));
        setEveningMode(isFix ? 'fixed' : 'relative');
        if (eAlarm.time) setEveningFixedTime(eAlarm.time);
        if (eAlarm.prayers && eAlarm.prayers.length > 0) {
          setEveningPrayer(eAlarm.prayers[0] === 'Maghrib' ? 'Maghrib' : 'Asr');
        }
        if (eAlarm.offsetMinutes !== undefined) setEveningOffset(eAlarm.offsetMinutes);
        if (eAlarm.soundType) setEveningSound(eAlarm.soundType);
      } else if (settings?.contextualAdhkar?.eveningTime) {
        setEveningFixedTime(settings.contextualAdhkar.eveningTime);
      }
    } catch (e) {
      console.warn('Error reading adhkar timing config:', e);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const customAlarms = safeGetJSON<AlarmConfig[]>('salah_custom_alarms', []);
      let updatedAlarms = Array.isArray(customAlarms) ? [...customAlarms] : [];

      // Morning Alarm definition
      const newMorningAlarm: AlarmConfig = {
        id: 'alarm_morning_adhkar',
        title: 'أذكار الصباح',
        enabled: morningEnabled,
        type: morningMode === 'fixed' ? 'fixed' : 'prayer_relative',
        time: morningMode === 'fixed' ? morningFixedTime : undefined,
        prayers: morningMode === 'relative' ? [morningPrayer] : undefined,
        relation: 'after',
        offsetMinutes: morningMode === 'relative' ? morningOffset : undefined,
        offsetUnit: 'minutes',
        days: [0, 1, 2, 3, 4, 5, 6],
        soundType: morningSound,
        notifyMode: 'both'
      };

      // Evening Alarm definition
      const newEveningAlarm: AlarmConfig = {
        id: 'alarm_evening_adhkar',
        title: 'أذكار المساء',
        enabled: eveningEnabled,
        type: eveningMode === 'fixed' ? 'fixed' : 'prayer_relative',
        time: eveningMode === 'fixed' ? eveningFixedTime : undefined,
        prayers: eveningMode === 'relative' ? [eveningPrayer] : undefined,
        relation: 'after',
        offsetMinutes: eveningMode === 'relative' ? eveningOffset : undefined,
        offsetUnit: 'minutes',
        days: [0, 1, 2, 3, 4, 5, 6],
        soundType: eveningSound,
        notifyMode: 'both'
      };

      // Replace or insert Morning alarm
      const mIdx = updatedAlarms.findIndex(a => a.id === 'alarm_morning_adhkar' || (a.title && a.title.includes('الصباح') && a.id.startsWith('alarm_')));
      if (mIdx >= 0) {
        updatedAlarms[mIdx] = newMorningAlarm;
      } else {
        updatedAlarms.push(newMorningAlarm);
      }

      // Replace or insert Evening alarm
      const eIdx = updatedAlarms.findIndex(a => a.id === 'alarm_evening_adhkar' || (a.title && a.title.includes('المساء') && a.id.startsWith('alarm_')));
      if (eIdx >= 0) {
        updatedAlarms[eIdx] = newEveningAlarm;
      } else {
        updatedAlarms.push(newEveningAlarm);
      }

      // Save custom alarms
      safeSetJSON('salah_custom_alarms', updatedAlarms);
      window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: updatedAlarms }));

      // Sync settings.contextualAdhkar
      const settings = safeGetJSON<any>('salah_settings', null);
      if (settings && typeof settings === 'object') {
        if (!settings.contextualAdhkar) {
          settings.contextualAdhkar = {};
        }
        settings.contextualAdhkar.morningTime = morningFixedTime;
        settings.contextualAdhkar.eveningTime = eveningFixedTime;
        settings.contextualAdhkar.enabled = morningEnabled || eveningEnabled;
        safeSetJSON('salah_settings', settings);
        window.dispatchEvent(new CustomEvent('smart-notifications-settings-changed', { detail: settings }));
      }

      // Sync Push Settings
      const pushSettings = safeGetJSON<any>('salah_push_settings', null);
      if (pushSettings && typeof pushSettings === 'object') {
        pushSettings.morningTime = morningFixedTime;
        pushSettings.eveningTime = eveningFixedTime;
        pushSettings.adhkarMorning = morningEnabled;
        pushSettings.adhkarEvening = eveningEnabled;
        safeSetJSON('salah_push_settings', pushSettings);
      }

      if (setToastMessage) {
        setToastMessage('تم حفظ وتحديث مواعيد أذكار الصباح والمساء بنجاح ⏰✨');
      }
      onClose();
    } catch (err) {
      console.error('Failed to save adhkar timings:', err);
      if (setToastMessage) {
        setToastMessage('حدث خطأ أثناء حفظ الإعدادات.');
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#161d26] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-white text-base">
                التحكم بمواعيد أذكار الصباح والمساء
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تحديد أوقات التذكير والتنبيه الصوتي المناسب ليومك
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('morning')}
            className={`flex-1 py-2.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'morning'
                ? 'bg-amber-500 text-slate-950 shadow-md scale-100'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700/60'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>أذكار الصباح {morningEnabled ? '🔔' : '🔕'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('evening')}
            className={`flex-1 py-2.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'evening'
                ? 'bg-indigo-600 text-white shadow-md scale-100'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700/60'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>أذكار المساء {eveningEnabled ? '🔔' : '🔕'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-right">
          {activeTab === 'morning' ? (
            /* MORNING ADHKAR CONFIG */
            <div className="space-y-4">
              {/* Enable / Disable toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white">
                    تفعيل تنبيه أذكار الصباح
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    استلام تنبيه يومي بالموعد المحدد لبدء اليوم بذكر الله
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={morningEnabled}
                    onChange={(e) => setMorningEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {morningEnabled && (
                <>
                  {/* Mode Selector: Relative to Prayer vs Fixed Time */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      <span>طريقة تحديد موعد التنبيه:</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMorningMode('relative')}
                        className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                          morningMode === 'relative'
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>مرتبط بموعد الصلاة</span>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          (بعد الشروق أو الفجر)
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMorningMode('fixed')}
                        className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                          morningMode === 'fixed'
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>ساعة محددة ثابتة</span>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          (مثل 06:30 ص)
                        </span>
                      </button>
                    </div>
                  </div>

                  {morningMode === 'relative' ? (
                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          الارتباط بموعد:
                        </label>
                        <select
                          value={morningPrayer}
                          onChange={(e) => setMorningPrayer(e.target.value as 'Sunrise' | 'Fajr')}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-amber-600 dark:text-amber-400 outline-none"
                        >
                          <option value="Sunrise">شروق الشمس (المستحب)</option>
                          <option value="Fajr">صلاة الفجر مباشرة</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          التنبيه بعد الموعد بـ:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="120"
                            step="5"
                            value={morningOffset}
                            onChange={(e) => setMorningOffset(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-16 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-center text-slate-800 dark:text-white"
                          />
                          <span className="text-xs font-bold text-slate-500">دقيقة</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[5, 10, 15, 20, 30].map(mins => (
                          <button
                            key={`m_off_${mins}`}
                            type="button"
                            onClick={() => setMorningOffset(mins)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              morningOffset === mins
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            +{mins} دقيقة
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        تحديد الساعة والدقيقة:
                      </label>
                      <input
                        type="time"
                        value={morningFixedTime}
                        onChange={(e) => setMorningFixedTime(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-black text-slate-800 dark:text-white text-center outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  {/* Sound Type Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>صوت التنبيه:</span>
                    </label>
                    <select
                      value={morningSound}
                      onChange={(e) => setMorningSound(e.target.value as AlarmSoundType)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white outline-none"
                    >
                      {SOUND_OPTIONS.map(opt => (
                        <option key={opt.type} value={opt.type}>
                          {opt.label} - ({opt.desc})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* EVENING ADHKAR CONFIG */
            <div className="space-y-4">
              {/* Enable / Disable toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white">
                    تفعيل تنبيه أذكار المساء
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    استلام تنبيه يومي لتحصين النفس في المساء والليل
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eveningEnabled}
                    onChange={(e) => setEveningEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {eveningEnabled && (
                <>
                  {/* Mode Selector: Relative to Prayer vs Fixed Time */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      <span>طريقة تحديد موعد التنبيه:</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEveningMode('relative')}
                        className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                          eveningMode === 'relative'
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>مرتبط بموعد الصلاة</span>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          (بعد صلاة العصر أو المغرب)
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEveningMode('fixed')}
                        className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                          eveningMode === 'fixed'
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>ساعة محددة ثابتة</span>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          (مثل 16:45 م)
                        </span>
                      </button>
                    </div>
                  </div>

                  {eveningMode === 'relative' ? (
                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          الارتباط بموعد:
                        </label>
                        <select
                          value={eveningPrayer}
                          onChange={(e) => setEveningPrayer(e.target.value as 'Asr' | 'Maghrib')}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-indigo-600 dark:text-indigo-400 outline-none"
                        >
                          <option value="Asr">صلاة العصر (المستحب شرعاً)</option>
                          <option value="Maghrib">صلاة المغرب</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          التنبيه بعد الصلاة بـ:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="120"
                            step="5"
                            value={eveningOffset}
                            onChange={(e) => setEveningOffset(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-16 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-center text-slate-800 dark:text-white"
                          />
                          <span className="text-xs font-bold text-slate-500">دقيقة</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[5, 10, 15, 20, 30].map(mins => (
                          <button
                            key={`e_off_${mins}`}
                            type="button"
                            onClick={() => setEveningOffset(mins)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              eveningOffset === mins
                                ? 'bg-indigo-600 text-white font-black'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            +{mins} دقيقة
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        تحديد الساعة والدقيقة:
                      </label>
                      <input
                        type="time"
                        value={eveningFixedTime}
                        onChange={(e) => setEveningFixedTime(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-black text-slate-800 dark:text-white text-center outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* Sound Type Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>صوت التنبيه:</span>
                    </label>
                    <select
                      value={eveningSound}
                      onChange={(e) => setEveningSound(e.target.value as AlarmSoundType)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white outline-none"
                    >
                      {SOUND_OPTIONS.map(opt => (
                        <option key={opt.type} value={opt.type}>
                          {opt.label} - ({opt.desc})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="py-2.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>حفظ المواعيد وتفعيل التنبيهات</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdhkarTimingModal;
