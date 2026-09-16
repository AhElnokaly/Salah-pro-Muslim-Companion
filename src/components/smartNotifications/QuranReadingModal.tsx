/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, BookOpen, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Volume2 } from 'lucide-react';
import { ReadingPortionInfo } from '../../domain/smartNotifications/smartNotificationService';
import { getSurahForPage } from '../../data/quranSurahPageRanges';

interface QuranReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  readingInfo: ReadingPortionInfo;
  onComplete: () => void;
  streakDays: number;
}

export const QuranReadingModal: React.FC<QuranReadingModalProps> = ({
  isOpen,
  onClose,
  readingInfo,
  onComplete,
  streakDays,
}) => {
  const [currentPage, setCurrentPage] = useState(readingInfo.startPage);
  const [completed, setCompleted] = useState(false);

  if (!isOpen) return null;

  const currentSurah = getSurahForPage(currentPage);

  const handleFinish = () => {
    setCompleted(true);
    setTimeout(() => {
      onComplete();
      onClose();
      setCompleted(false);
    }, 900);
  };

  return (
    <div
      id="quran-reading-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        id="quran-reading-modal-content"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                ورد القراءة اليومي المصغر
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                صفحة {readingInfo.startPage} إلى {readingInfo.endPage} — سورة {readingInfo.surahName}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-reading-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reading Body Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-center">
          {/* Header Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>سورة {currentSurah} • الجزء {Math.ceil(currentPage / 20)} • صفحة {currentPage}</span>
          </div>

          {/* Basmalah */}
          <div className="py-2">
            <p className="font-serif text-lg text-slate-700 dark:text-slate-200 font-semibold tracking-wide">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>

          {/* Reading Presentation Box */}
          <div className="p-6 sm:p-8 rounded-2xl bg-amber-50/40 dark:bg-slate-800/60 border border-amber-200/50 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 font-serif leading-loose text-lg sm:text-xl space-y-4 shadow-xs">
            <p className="text-justify leading-loose" style={{ lineHeight: '2.4' }}>
              ﴿ يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا ۝ وَسَبِّحُوهُ بُكْرَةً وَأَصِيلًا ۝ هُوَ الَّذِي يُصَلِّي عَلَيْكُمْ وَمَلَائِكَتُهُ لِيُخْرِجَكُم مِّنَ الظُّلُمَاتِ إِلَى النُّورِ ۚ وَكَانَ بِالْمُؤْمِنِينَ رَحِيمًا ۝ تَحِيَّتُهُمْ يَوْمَ يَلْقَوْنَهُ سَلَامٌ ۚ وَأَعَدَّ لَهُمْ أَجْرًا كَرِيمًا ﴾
            </p>
            <div className="pt-4 text-xs font-sans text-slate-500 dark:text-slate-400 border-t border-amber-200/40 dark:border-slate-700/40">
              «أفضل الأعمال عند الله أدومها وإن قل» — قراءة صفحتين يومياً تضمن لك ختم القرآن كاملاً في عام واحد بإذن الله.
            </div>
          </div>

          {/* Streak notification */}
          <div className="flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span>🔥 رصيد التزامك المتواصل: {streakDays} أيام من الورد المنتظم</span>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Page step controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
              <span>الصفحة السابقة</span>
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {currentPage} / {readingInfo.endPage}
            </span>
            <button
              type="button"
              disabled={currentPage >= 604}
              onClick={() => setCurrentPage((p) => Math.min(604, p + 1))}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50"
            >
              <span>الصفحة التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Mark Complete Button */}
          <button
            type="button"
            id="btn-complete-daily-reading"
            onClick={handleFinish}
            disabled={completed}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{completed ? 'تم تسجيل الإنجاز مبارك! 🎉' : 'أتممت قراءة الورد اليومي'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
