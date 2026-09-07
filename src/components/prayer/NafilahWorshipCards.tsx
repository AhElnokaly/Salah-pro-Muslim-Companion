/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PrayerLog } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';

export interface NafilahWorshipCardsProps {
  type: 'duha' | 'qiyam' | 'witr';
  dayLogs: Record<string, PrayerLog>;
  handleUpdateNafilah: (prayerKey: 'Duha' | 'Qiyam' | 'Witr', rakahs: number) => void;
  setShowDuhaModal?: (show: boolean) => void;
}

export const NafilahWorshipCards: React.FC<NafilahWorshipCardsProps> = ({
  type,
  dayLogs,
  handleUpdateNafilah,
  setShowDuhaModal,
}) => {
  if (type === 'duha') {
    const duhaLog = dayLogs['Duha'] || { status: 'not_yet', extraRakahs: 0 };
    const currentDuhaRakahs = duhaLog.status === 'A' ? (duhaLog.extraRakahs || 0) : 0;

    return (
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-500/20 dark:border-amber-500/30 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">☀️</span>
            <div className="text-end">
              <h4 className="text-sm font-black text-amber-800 dark:text-amber-400">
                صلاة الضحى (سنة مؤكدة)
              </h4>
              <span className="text-[9px] text-amber-600 dark:text-amber-500 font-extrabold block">
                {currentDuhaRakahs > 0 ? `تمت صلاة ${toArabicNumbers(currentDuhaRakahs)} ركعات الحمد لله` : 'صلاة الأوابين - من ركعتين إلى ثمان ركعات'}
              </span>
            </div>
          </div>
          
          {/* Direct Custom Increment/Decrement */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-amber-500/15" dir="ltr">
            <button
              type="button"
              onClick={() => handleUpdateNafilah('Duha', Math.max(0, currentDuhaRakahs - 2))}
              disabled={currentDuhaRakahs <= 0}
              className="w-6 h-6 rounded-lg text-xs font-black bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-40 cursor-pointer text-slate-800 dark:text-white"
            >
              -
            </button>
            <span className="text-xs font-mono font-black text-amber-700 dark:text-amber-400 min-w-[32px] text-center">
              {toArabicNumbers(currentDuhaRakahs)}
            </span>
            <button
              type="button"
              onClick={() => handleUpdateNafilah('Duha', currentDuhaRakahs === 0 ? 2 : Math.min(12, currentDuhaRakahs + 2))}
              disabled={currentDuhaRakahs >= 12}
              className="w-6 h-6 rounded-lg text-xs font-black bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-40 cursor-pointer text-slate-800 dark:text-white"
            >
              +
            </button>
          </div>
        </div>

        {/* Predefined Quick Pill Selectors */}
        <div className="grid grid-cols-4 gap-1.5">
          {[2, 4, 6, 8].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleUpdateNafilah('Duha', currentDuhaRakahs === r ? 0 : r)}
              className={`py-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer ${
                currentDuhaRakahs === r
                  ? 'bg-amber-500 text-white border-amber-500 font-black shadow-xs'
                  : 'bg-white/80 dark:bg-slate-800/50 border-amber-500/10 dark:border-amber-500/5 text-amber-700 dark:text-amber-400/80 hover:bg-amber-500/5'
              }`}
            >
              {toArabicNumbers(r)} {r === 2 ? 'ركعتان' : 'ركعات'}
            </button>
          ))}
        </div>

        {setShowDuhaModal && (
          <button
            type="button"
            onClick={() => setShowDuhaModal(true)}
            className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/20 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <span>فتح نافذة تسجيل صلاة الضحى بالتفصيل ✨</span>
          </button>
        )}
      </div>
    );
  }

  if (type === 'qiyam') {
    const qiyamLog = dayLogs['Qiyam'] || { status: 'not_yet', extraRakahs: 0 };
    const currentQiyamRakahs = qiyamLog.status === 'A' ? (qiyamLog.extraRakahs || 0) : 0;

    return (
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 dark:from-indigo-950/20 dark:to-[#1e1233]/20 border border-indigo-500/20 dark:border-indigo-500/30 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌃</span>
            <div className="text-end">
              <h4 className="text-sm font-black text-indigo-800 dark:text-indigo-400">
                صلاة قيام الليل والتهجد
              </h4>
              <span className="text-[9px] text-indigo-600 dark:text-indigo-500 font-extrabold block">
                {currentQiyamRakahs > 0 ? `تم تسجيل صلاة قيام الليل ${toArabicNumbers(currentQiyamRakahs)} ركعة` : 'صلاة الليل والتهجد - مثنى مثنى'}
              </span>
            </div>
          </div>
          
          {/* Direct Custom Increment/Decrement */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-indigo-500/15" dir="ltr">
            <button
              type="button"
              onClick={() => handleUpdateNafilah('Qiyam', Math.max(0, currentQiyamRakahs - 2))}
              disabled={currentQiyamRakahs <= 0}
              className="w-6 h-6 rounded-lg text-xs font-black bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-40 cursor-pointer text-slate-800 dark:text-white"
            >
              -
            </button>
            <span className="text-xs font-mono font-black text-indigo-700 dark:text-indigo-400 min-w-[32px] text-center">
              {toArabicNumbers(currentQiyamRakahs)}
            </span>
            <button
              type="button"
              onClick={() => handleUpdateNafilah('Qiyam', currentQiyamRakahs === 0 ? 2 : Math.min(40, currentQiyamRakahs + 2))}
              disabled={currentQiyamRakahs >= 40}
              className="w-6 h-6 rounded-lg text-xs font-black bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-40 cursor-pointer text-slate-800 dark:text-white"
            >
              +
            </button>
          </div>
        </div>

        {/* Predefined Quick Pill Selectors */}
        <div className="grid grid-cols-4 gap-1.5">
          {[2, 4, 8, 10].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleUpdateNafilah('Qiyam', currentQiyamRakahs === r ? 0 : r)}
              className={`py-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer ${
                currentQiyamRakahs === r
                  ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-xs'
                  : 'bg-white/80 dark:bg-slate-800/50 border-indigo-500/10 dark:border-indigo-500/5 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/5'
              }`}
            >
              {toArabicNumbers(r)} {r === 2 ? 'ركعتان' : 'ركعات'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'witr') {
    const witrLog = dayLogs['Witr'] || { status: 'not_yet', extraRakahs: 0 };
    const currentWitrRakahs = witrLog.status === 'A' ? (witrLog.extraRakahs || 0) : 0;

    return (
      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/5 dark:from-purple-950/20 dark:to-indigo-950/10 border border-purple-500/20 dark:border-purple-500/30 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌟</span>
            <div className="text-end">
              <h4 className="text-sm font-black text-purple-800 dark:text-purple-400">
                صلاة الشفع والوتر
              </h4>
              <span className="text-[9px] text-purple-600 dark:text-purple-500 font-extrabold block">
                {currentWitrRakahs > 0 ? `تم تسجيل الوتر ${toArabicNumbers(currentWitrRakahs)} ركعة الحمد لله` : 'خاتمة صلاة الليل والتهجد - ركعات وترية'}
              </span>
            </div>
          </div>
          
          {/* Direct Custom Increment/Decrement */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-purple-500/15" dir="ltr">
            <button
              type="button"
              onClick={() => handleUpdateNafilah('Witr', currentWitrRakahs <= 1 ? 0 : currentWitrRakahs - 2)}
              disabled={currentWitrRakahs <= 0}
              className="w-6 h-6 rounded-lg text-xs font-black bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-40 cursor-pointer text-slate-800 dark:text-white"
            >
              -
            </button>
            <span className="text-xs font-mono font-black text-purple-700 dark:text-purple-400 min-w-[32px] text-center">
              {toArabicNumbers(currentWitrRakahs)}
            </span>
            <button
              type="button"
              onClick={() => handleUpdateNafilah('Witr', currentWitrRakahs === 0 ? 1 : Math.min(15, currentWitrRakahs + 2))}
              disabled={currentWitrRakahs >= 15}
              className="w-6 h-6 rounded-lg text-xs font-black bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-40 cursor-pointer text-slate-800 dark:text-white"
            >
              +
            </button>
          </div>
        </div>

        {/* Predefined Quick Pill Selectors */}
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 3, 5, 7].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleUpdateNafilah('Witr', currentWitrRakahs === r ? 0 : r)}
              className={`py-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer ${
                currentWitrRakahs === r
                  ? 'bg-purple-600 text-white border-purple-600 font-black shadow-xs'
                  : 'bg-white/80 dark:bg-slate-800/50 border-purple-500/10 dark:border-purple-500/5 text-purple-700 dark:text-purple-400 hover:bg-purple-500/5'
              }`}
            >
              {toArabicNumbers(r)} {r === 1 ? 'ركعة' : 'ركعات'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default NafilahWorshipCards;
