/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Bell, Check } from 'lucide-react';
import type { 
  AlarmTimingType, 
  PrayerAlarmRelation, 
  RelativePrayerTarget 
} from '../../types';
import { ALL_PRAYER_NAMES, getArabicPrayerOrEventName } from '../../utils/alarmUtils';
import { MINUTE_PRESETS } from './alarmModalConstants';

export interface AlarmTimingSectionProps {
  timingType: AlarmTimingType;
  setTimingType: (type: AlarmTimingType) => void;
  prayers: RelativePrayerTarget[];
  setPrayers: React.Dispatch<React.SetStateAction<RelativePrayerTarget[]>>;
  relation: PrayerAlarmRelation;
  setRelation: (rel: PrayerAlarmRelation) => void;
  offsetMinutes: number;
  setOffsetMinutes: (min: number) => void;
  timeStr: string;
  setTimeStr: (time: string) => void;
}

export const AlarmTimingSection: React.FC<AlarmTimingSectionProps> = ({
  timingType,
  setTimingType,
  prayers,
  setPrayers,
  relation,
  setRelation,
  offsetMinutes,
  setOffsetMinutes,
  timeStr,
  setTimeStr,
}) => {
  const togglePrayer = (p: RelativePrayerTarget) => {
    if (prayers.includes(p)) {
      if (prayers.length > 1) {
        setPrayers(prayers.filter((x) => x !== p));
      }
    } else {
      setPrayers([...prayers, p]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Timing Type Selector (Segmented control) */}
      <div className="space-y-1.5">
        <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
          طريقة ضبط الموعد:
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-750">
          <button
            type="button"
            onClick={() => setTimingType('prayer_relative')}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              timingType === 'prayer_relative'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>مرتبط بالصلاة 🕌</span>
          </button>
          <button
            type="button"
            onClick={() => setTimingType('fixed')}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              timingType === 'fixed'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>وقت محدد بالساعة ⏱️</span>
          </button>
        </div>
      </div>

      {timingType === 'fixed' ? (
        /* Fixed Clock Time Input */
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
            الساعة المحددة للتنبيه:
          </label>
          <input
            type="time"
            value={timeStr}
            onChange={(e) => setTimeStr(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#1a232e] border border-slate-200 dark:border-slate-750 rounded-2xl py-2.5 px-4 text-base font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-center"
          />
        </div>
      ) : (
        /* Relative to Prayer Controls */
        <div className="space-y-3.5">
          {/* Target Prayers Multi-select */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
              الصلوات والمواقيت المستهدفة:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {ALL_PRAYER_NAMES.map((prayer) => {
                const isSelected = prayers.includes(prayer);
                return (
                  <button
                    key={prayer}
                    type="button"
                    onClick={() => togglePrayer(prayer)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100'
                    }`}
                  >
                    <span>{getArabicPrayerOrEventName(prayer)}</span>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Relation: Before / After / At */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
              توقيت التنبيه بالنسبة للصلاة:
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-750">
              <button
                type="button"
                onClick={() => setRelation('before')}
                className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  relation === 'before'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                قبل الأذان
              </button>
              <button
                type="button"
                onClick={() => setRelation('at')}
                className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  relation === 'at'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                مع الأذان تماماً
              </button>
              <button
                type="button"
                onClick={() => setRelation('after')}
                className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  relation === 'after'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                بعد الصلاة
              </button>
            </div>
          </div>

          {/* Offset Minutes (hidden if 'at') */}
          {relation !== 'at' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                  الفارق الزمني (بالدقائق):
                </label>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {offsetMinutes} دقيقة
                </span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {MINUTE_PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setOffsetMinutes(m)}
                    className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      offsetMinutes === m
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750'
                    }`}
                  >
                    {m} د
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlarmTimingSection;
