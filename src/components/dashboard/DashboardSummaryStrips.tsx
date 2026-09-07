import React from 'react';
import { BookOpen, Moon } from 'lucide-react';
import { calculateStreaks } from '../PrayerHeatmapStats';
import { DailyPrayerLogs, DashboardTab, QuranKhatma } from '../../types';

interface DashboardSummaryStripsProps {
  quranSummaryVisible: boolean;
  khushuSummaryVisible: boolean;
  khatmat?: QuranKhatma[];
  prayerLogs: DailyPrayerLogs;
  setActiveTab?: (tab: DashboardTab) => void;
  toArabicNumbers: (n: number | string) => string;
}

export const DashboardSummaryStrips: React.FC<DashboardSummaryStripsProps> = ({
  quranSummaryVisible,
  khushuSummaryVisible,
  khatmat,
  prayerLogs,
  setActiveTab,
  toArabicNumbers
}) => {
  const streaks = calculateStreaks(prayerLogs);

  return (
    <>
      {/* 1-Line Quran Summary Strip */}
      {quranSummaryVisible && (
        <button
          type="button"
          onClick={() => setActiveTab && setActiveTab('quran')}
          className="w-full p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-2 text-xs font-black text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/15 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px] font-black truncate">
              📖 القرآن الكريم: {khatmat && khatmat.length > 0 ? `الختمة الحالية قائمة • انقر للمتابعة والقراءة` : 'تابع وردك اليومي وتلاوة القرآن • انقر للبدء'}
            </span>
          </div>
          <span className="text-[10px] bg-emerald-600/15 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-xl font-bold shrink-0 flex items-center gap-1">
            متابعة ➔
          </span>
        </button>
      )}

      {/* 1-Line Khushu & Sunan Summary Strip */}
      {khushuSummaryVisible && (
        <button
          type="button"
          onClick={() => setActiveTab && setActiveTab('khushu')}
          className="w-full p-3.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-500/20 rounded-2xl flex items-center justify-between gap-2 text-xs font-black text-indigo-800 dark:text-indigo-200 hover:bg-indigo-500/15 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-[11px] font-black truncate">
              🌙 السنن وقيام الليل والخشوع: سجّل صلاة الضحى، الوتر، والقيام • انقر للسجل
            </span>
          </div>
          <span className="text-[10px] bg-indigo-600/15 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-xl font-bold shrink-0 flex items-center gap-1">
            سجّل الآن ➔
          </span>
        </button>
      )}

      {/* Streak Summary Line */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 dark:from-emerald-950/40 dark:via-amber-950/30 dark:to-emerald-950/40 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 shadow-xs flex items-center justify-between gap-3 text-xs text-right" dir="rtl">
        <div className="flex items-center gap-2.5 text-right w-full">
          <span className="text-base shrink-0">🔥</span>
          <span className="font-extrabold text-slate-800 dark:text-slate-100 text-right leading-relaxed">
            سلسلتك المستمرة: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{toArabicNumbers(streaks.current)}</span> يوماً متتالياً — واصل بثبات وزد من حسناتك!
          </span>
        </div>
      </div>
    </>
  );
};
