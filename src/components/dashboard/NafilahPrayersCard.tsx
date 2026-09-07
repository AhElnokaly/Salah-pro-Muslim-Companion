import React from 'react';
import { DailyPrayerLogs, DashboardTab } from '../../types';

interface NafilahPrayersCardProps {
  currentStyle: string;
  todayLogs: DailyPrayerLogs;
  handleUpdateNafilah: (prayerName: string, count: number) => void;
  setActiveTab?: (tab: DashboardTab) => void;
  toArabicNumbers: (n: number | string) => string;
}

export const NafilahPrayersCard: React.FC<NafilahPrayersCardProps> = ({
  currentStyle,
  todayLogs,
  handleUpdateNafilah,
  setActiveTab,
  toArabicNumbers,
}) => {
  const duhaLog = todayLogs['Duha'] || { status: 'not_yet', extraRakahs: 0 };
  const currentDuhaRakahs = duhaLog.status === 'A' ? (duhaLog.extraRakahs || 0) : 0;

  const qiyamLog = todayLogs['Qiyam'] || { status: 'not_yet', extraRakahs: 0 };
  const currentQiyamRakahs = qiyamLog.status === 'A' ? (qiyamLog.extraRakahs || 0) : 0;

  const witrLog = todayLogs['Witr'] || { status: 'not_yet', extraRakahs: 0 };
  const currentWitrRakahs = witrLog.status === 'A' ? (witrLog.extraRakahs || 0) : 0;

  return (
    <div
      dir="rtl"
      className={`rounded-3xl p-5 border transition-all duration-300 space-y-4 text-right ${
        currentStyle === 'glass-dark'
          ? 'bg-[#111723]/80 backdrop-blur-md border-white/5 shadow-2xl text-slate-100'
          : 'bg-white border-[#e2e8f0] shadow-sm text-slate-800'
      }`}
    >
      <div className="flex justify-between items-center pb-2 border-b border-slate-200/40 dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <div className="text-right">
            <h3 className="text-sm font-black text-slate-800 dark:text-white leading-none text-right">السنن الإضافية والنوافل</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 text-right">سجل سنن الضحى، قيام الليل، والوتر مباشرة</p>
          </div>
        </div>
      </div>

      {/* Dedicated Khushu & Qiyam Al-Layl Quick Entry Banner */}
      <button
        type="button"
        onClick={() => setActiveTab && setActiveTab('khushu')}
        className="w-full p-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/15 border border-indigo-500/20 dark:border-indigo-500/30 rounded-2xl flex items-center justify-between text-xs font-black text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🌙</span>
          <span>صفحة الخشوع وقيام الليل والتهجد</span>
        </div>
        <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-xl font-black flex items-center gap-1">
          <span>افتح الصفحة ➔</span>
        </span>
      </button>

      <div className="space-y-3">
        {/* 1. Duha Prayer */}
        <div 
          id="duha-card-section"
          className={`p-3 rounded-2xl border transition-all duration-300 ${
            currentStyle === 'glass-dark' 
              ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]' 
              : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/50'
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-base">☀️</span>
              <div className="text-right">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 block text-right">صلاة الضحى</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold block text-right">
                  {currentDuhaRakahs > 0 ? `تمت صلاة ${toArabicNumbers(currentDuhaRakahs)} ركعات` : 'الضحى (٢، ٤، ٦، ٨)'}
                </span>
              </div>
            </div>
            
            {/* Direct Custom Increment/Decrement */}
            <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
              currentStyle === 'glass-dark' 
                ? 'bg-slate-950/40 border-white/5' 
                : 'bg-white border-slate-200/50'
            }`} dir="ltr">
              <button
                type="button"
                onClick={() => handleUpdateNafilah('Duha', Math.max(0, currentDuhaRakahs - 2))}
                disabled={currentDuhaRakahs <= 0}
                className="w-5.5 h-5.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-slate-800 dark:text-white"
              >
                -
              </button>
              <span className="text-xs font-mono font-black text-slate-800 dark:text-white min-w-[28px] text-center">
                {toArabicNumbers(currentDuhaRakahs)}
              </span>
              <button
                type="button"
                onClick={() => handleUpdateNafilah('Duha', currentDuhaRakahs === 0 ? 2 : Math.min(12, currentDuhaRakahs + 2))}
                disabled={currentDuhaRakahs >= 12}
                className="w-5.5 h-5.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-slate-800 dark:text-white"
              >
                +
              </button>
            </div>
          </div>

          {/* Predefined Quick Pill Selectors */}
          <div className="grid grid-cols-4 gap-1.5 pt-2">
            {[2, 4, 6, 8].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleUpdateNafilah('Duha', currentDuhaRakahs === r ? 0 : r)}
                className={`py-1 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                  currentDuhaRakahs === r
                    ? 'bg-amber-500/15 border-amber-500/45 text-amber-600 dark:text-amber-400 font-black shadow-xs'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200/40 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {toArabicNumbers(r)} {r === 2 ? 'ركعتان' : 'ركعات'}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Qiyam al-Layl */}
        <div className={`p-3 rounded-2xl border transition-all ${
          currentStyle === 'glass-dark' 
            ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]' 
            : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/50'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-base">🌃</span>
              <div className="text-right">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 block text-right">قيام الليل والتهجد</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold block text-right">
                  {currentQiyamRakahs > 0 ? `تمت صلاة ${toArabicNumbers(currentQiyamRakahs)} ركعة` : 'التهجد (٢، ٤، ٦، ٨+)'}
                </span>
              </div>
            </div>
            
            {/* Direct Custom Increment/Decrement */}
            <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
              currentStyle === 'glass-dark' 
                ? 'bg-slate-950/40 border-white/5' 
                : 'bg-white border-slate-200/50'
            }`} dir="ltr">
              <button
                type="button"
                onClick={() => handleUpdateNafilah('Qiyam', Math.max(0, currentQiyamRakahs - 2))}
                disabled={currentQiyamRakahs <= 0}
                className="w-5.5 h-5.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-slate-800 dark:text-white"
              >
                -
              </button>
              <span className="text-xs font-mono font-black text-slate-800 dark:text-white min-w-[28px] text-center">
                {toArabicNumbers(currentQiyamRakahs)}
              </span>
              <button
                type="button"
                onClick={() => handleUpdateNafilah('Qiyam', currentQiyamRakahs === 0 ? 2 : Math.min(40, currentQiyamRakahs + 2))}
                disabled={currentQiyamRakahs >= 40}
                className="w-5.5 h-5.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-slate-800 dark:text-white"
              >
                +
              </button>
            </div>
          </div>

          {/* Predefined Quick Pill Selectors */}
          <div className="grid grid-cols-4 gap-1.5 pt-2">
            {[2, 4, 8, 10].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleUpdateNafilah('Qiyam', currentQiyamRakahs === r ? 0 : r)}
                className={`py-1 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                  currentQiyamRakahs === r
                    ? 'bg-amber-500/15 border-amber-500/45 text-amber-600 dark:text-amber-400 font-black shadow-xs'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200/40 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {toArabicNumbers(r)} {r === 2 ? 'ركعتان' : 'ركعات'}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Witr & Shaf' */}
        <div className={`p-3 rounded-2xl border transition-all ${
          currentStyle === 'glass-dark' 
            ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]' 
            : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/50'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-base">🌟</span>
              <div className="text-right">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 block text-right">الشفع والوتر</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold block text-right">
                  {currentWitrRakahs > 0 ? `تمت صلاة ${toArabicNumbers(currentWitrRakahs)} ركعة` : 'الوتر (١، ٣، ٥، ٧)'}
                </span>
              </div>
            </div>
            
            {/* Direct Custom Increment/Decrement */}
            <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
              currentStyle === 'glass-dark' 
                ? 'bg-slate-950/40 border-white/5' 
                : 'bg-white border-slate-200/50'
            }`} dir="ltr">
              <button
                type="button"
                onClick={() => handleUpdateNafilah('Witr', currentWitrRakahs <= 1 ? 0 : currentWitrRakahs - 2)}
                disabled={currentWitrRakahs <= 0}
                className="w-5.5 h-5.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-slate-800 dark:text-white"
              >
                -
              </button>
              <span className="text-xs font-mono font-black text-slate-800 dark:text-white min-w-[28px] text-center">
                {toArabicNumbers(currentWitrRakahs)}
              </span>
              <button
                type="button"
                onClick={() => handleUpdateNafilah('Witr', currentWitrRakahs === 0 ? 1 : Math.min(15, currentWitrRakahs + 2))}
                disabled={currentWitrRakahs >= 15}
                className="w-5.5 h-5.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-slate-800 dark:text-white"
              >
                +
              </button>
            </div>
          </div>

          {/* Predefined Quick Pill Selectors (Odd values only for Witr) */}
          <div className="grid grid-cols-4 gap-1.5 pt-2">
            {[1, 3, 5, 7].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleUpdateNafilah('Witr', currentWitrRakahs === r ? 0 : r)}
                className={`py-1 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                  currentWitrRakahs === r
                    ? 'bg-amber-500/15 border-amber-500/45 text-amber-600 dark:text-amber-400 font-black shadow-xs'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200/40 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {toArabicNumbers(r)} {r === 1 ? 'ركعة' : 'ركعات'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
