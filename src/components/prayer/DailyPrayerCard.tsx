/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Minus, Plus } from 'lucide-react';
import { AppSettings, PrayerLog, PrayerName, PrayerStatus } from '../../types';
import { getArabicPrayerName } from '../../utils/prayerCalc';
import { toArabicNumbers } from '../../utils/hijri';

export interface DailyPrayerCardProps {
  prayer: PrayerName;
  targetTimestamp: number;
  log?: PrayerLog;
  timeStr: string;
  settings: AppSettings;
  handleLogPrayerStatus: (prayer: PrayerName, status: PrayerStatus) => void;
  handleUpdateSunnah: (prayer: PrayerName, type: 'before' | 'after', amount: number) => void;
  getStatusBtnClass: (prayer: PrayerName, status: PrayerStatus) => string;
}

export const DailyPrayerCard: React.FC<DailyPrayerCardProps> = ({
  prayer,
  targetTimestamp,
  log = { status: 'not_yet' as PrayerStatus, sunnahBefore: 0, sunnahAfter: 0 },
  timeStr,
  settings,
  handleLogPrayerStatus,
  handleUpdateSunnah,
  getStatusBtnClass,
}) => {
  const isFajr = prayer === 'Fajr';
  const hasSunnahBefore = isFajr || prayer === 'Dhuhr';
  const hasSunnahAfter = prayer === 'Dhuhr' || prayer === 'Maghrib' || prayer === 'Isha';
  const sunnahBeforeMax = prayer === 'Dhuhr' ? 4 : 2;
  const sunnahAfterMax = 2;

  const currentSunnahBefore = log.sunnahBefore || 0;
  const currentSunnahAfter = log.sunnahAfter || 0;

  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 shadow-xs space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isFajr ? 'bg-[#3b82f6]' : 'bg-indigo-500'}`} />
          <h4 className="text-sm font-black text-slate-800 dark:text-white">
            صلاة {getArabicPrayerName(prayer, targetTimestamp)}
          </h4>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/40 py-1 px-2.5 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{toArabicNumbers(timeStr)}</span>
        </div>
      </div>

      {/* Fard Status */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">حالة الفريضة:</span>
        <div className={`grid ${settings.gender === 'female' ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
          <button
            type="button"
            onClick={() => handleLogPrayerStatus(prayer, 'A')}
            className={`py-2 px-1 text-center text-[11px] font-black rounded-2xl border cursor-pointer transition-all ${getStatusBtnClass(prayer, 'A')}`}
          >
            حاضر
          </button>
          <button
            type="button"
            onClick={() => handleLogPrayerStatus(prayer, 'B')}
            className={`py-2 px-1 text-center text-[11px] font-black rounded-2xl border cursor-pointer transition-all ${getStatusBtnClass(prayer, 'B')}`}
          >
            صليتها متأخر ⏱️
          </button>
          <button
            type="button"
            onClick={() => handleLogPrayerStatus(prayer, 'D')}
            className={`py-2 px-1 text-center text-[11px] font-black rounded-2xl border cursor-pointer transition-all ${getStatusBtnClass(prayer, 'D')}`}
          >
            قضاء ❌
          </button>
          {settings.gender === 'female' && (
            <button
              type="button"
              onClick={() => handleLogPrayerStatus(prayer, 'E')}
              className={`py-2 px-1 text-center text-[11px] font-black rounded-2xl border cursor-pointer transition-all ${getStatusBtnClass(prayer, 'E')}`}
            >
              عذر شرعي 🌸
            </button>
          )}
        </div>
      </div>

      {/* Sunnah Rowatib */}
      {(hasSunnahBefore || hasSunnahAfter) && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 space-y-2.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">
            {isFajr ? 'السنن التابعة:' : 'السنن والرواتب التابعة:'}
          </span>
          
          <div className="flex flex-col gap-2">
            {/* Sunnah Before */}
            {hasSunnahBefore && (
              <div className="flex justify-between items-center bg-slate-50/50 dark:bg-[#111720]/40 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isFajr ? 'سنة قبلية (ركعتان)' : 'سنة قبلية (٤ ركعات)'}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleUpdateSunnah(prayer, 'before', -2)}
                    disabled={currentSunnahBefore <= 0}
                    className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  </button>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white font-mono min-w-10 text-center">
                    {toArabicNumbers(currentSunnahBefore)} / {toArabicNumbers(sunnahBeforeMax)} ركعات
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateSunnah(prayer, 'before', 2)}
                    disabled={currentSunnahBefore >= sunnahBeforeMax}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Sunnah After */}
            {hasSunnahAfter && (
              <div className="flex justify-between items-center bg-slate-50/50 dark:bg-[#111720]/40 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">سنة بعدية</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleUpdateSunnah(prayer, 'after', -2)}
                    disabled={currentSunnahAfter <= 0}
                    className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  </button>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white font-mono min-w-10 text-center">
                    {toArabicNumbers(currentSunnahAfter)} ركعات
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateSunnah(prayer, 'after', 2)}
                    disabled={currentSunnahAfter >= sunnahAfterMax}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyPrayerCard;
