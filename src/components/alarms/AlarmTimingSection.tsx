/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Clock } from 'lucide-react';
import type { 
  AlarmTimingType, 
  PrayerAlarmRelation, 
  RelativePrayerTarget 
} from '../../types';
import { 
  ALL_PRAYER_NAMES, 
  FIVE_PRAYERS_ONLY, 
  getArabicPrayerOrEventName 
} from '../../utils/alarmUtils';
import { toArabicNumbers } from '../../utils/hijri';
import { MINUTE_PRESETS } from './alarmModalConstants';

interface AlarmTimingSectionProps {
  timingType: AlarmTimingType;
  setTimingType: (type: AlarmTimingType) => void;
  prayers: RelativePrayerTarget[];
  setPrayers: React.Dispatch<React.SetStateAction<RelativePrayerTarget[]>>;
  relation: PrayerAlarmRelation;
  setRelation: (relation: PrayerAlarmRelation) => void;
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
  const handleTogglePrayer = (p: RelativePrayerTarget) => {
    if (prayers.includes(p)) {
      if (prayers.length > 1) {
        setPrayers(prayers.filter(item => item !== p));
      }
    } else {
      setPrayers([...prayers, p]);
    }
  };

  return (
    <>
      {/* Timing Type Segmented Tabs */}
      <div className="space-y-1.5">
        <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
          طريقة احتساب الموعد:
        </label>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setTimingType('prayer_relative')}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              timingType === 'prayer_relative'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            مرتبط بمواقيت الصلاة
          </button>
          <button
            type="button"
            onClick={() => setTimingType('fixed')}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              timingType === 'fixed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            وقت محدد بالساعة
          </button>
        </div>
      </div>

      {/* Prayer Relative Settings Section */}
      {timingType === 'prayer_relative' ? (
        <div className="space-y-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f2a]/70 border border-slate-200/80 dark:border-slate-800">
          {/* Prayers Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                الصلوات المستهدفة:
              </span>
              <button
                type="button"
                onClick={() => setPrayers(prayers.length === 5 ? ALL_PRAYER_NAMES : FIVE_PRAYERS_ONLY)}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {prayers.length === 5 ? '+ إضافة الشروق' : 'الصلوات الخمس فقط'}
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {ALL_PRAYER_NAMES.map((p) => {
                const isSelected = prayers.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleTogglePrayer(p)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#1a232e] border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                    }`}
                  >
                    {getArabicPrayerOrEventName(p)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Relation: Before / After / At */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
              علاقة المنبه بموعد الصلاة:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'before' as PrayerAlarmRelation, label: 'قبل الصلاة ⏳' },
                { val: 'at' as PrayerAlarmRelation, label: 'عند الأذان 🕌' },
                { val: 'after' as PrayerAlarmRelation, label: 'بعد الصلاة 🤲' },
              ].map((rel) => {
                const isSelected = relation === rel.val;
                return (
                  <button
                    key={rel.val}
                    type="button"
                    onClick={() => setRelation(rel.val)}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#1a232e] border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                    }`}
                  >
                    {rel.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Offset Minutes (When not 'at') */}
          {relation !== 'at' && (
            <div className="space-y-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-slate-700 dark:text-slate-300">
                  الفارق الزمني ({relation === 'before' ? 'قبل الموعد بـ' : 'بعد الموعد بـ'}):
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
                  {toArabicNumbers(offsetMinutes)} دقيقة
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={offsetMinutes}
                onChange={(e) => setOffsetMinutes(parseInt(e.target.value) || 1)}
                className="w-full accent-emerald-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />

              <div className="flex gap-1.5 overflow-x-auto pb-0.5 pt-1 no-scrollbar">
                {MINUTE_PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setOffsetMinutes(m)}
                    className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      offsetMinutes === m
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white dark:bg-[#1a232e] border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
                    }`}
                  >
                    {toArabicNumbers(m)} د
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Fixed Clock Time Section */
        <div className="space-y-2 p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f2a]/70 border border-slate-200/80 dark:border-slate-800">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
            حدد الوقت بالساعة والدقيقة:
          </label>
          <div className="flex items-center gap-3">
            <input
              type="time"
              required
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              className="flex-1 bg-white dark:bg-[#1a232e] border border-slate-200 dark:border-slate-750 rounded-2xl py-2.5 px-4 text-base font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
            />
            <span className="text-xs font-bold text-slate-400">
              نظام ٢٤ ساعة
            </span>
          </div>
        </div>
      )}
    </>
  );
};
