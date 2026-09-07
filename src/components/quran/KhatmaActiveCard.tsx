/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Book, 
  Plus, 
  PlusCircle, 
  BookOpen, 
  Award, 
  RotateCcw,
  Sparkles,
  Sliders,
  Heart,
  CheckCircle2
} from 'lucide-react';
import { QuranKhatma, QuranSession } from '../../types';
import { toArabicNumbers, formatArabicDayCount } from '../../utils/hijri';
import { attributeKhatmaToHijriYear } from '../../utils/quranHelpers';
import { formatDateKey } from '../../utils/prayerDayBoundary';
import { safeUUID } from '../../utils/uuid';
import { AdaptiveKhatmaCalculator } from '../../domain/quran/AdaptiveKhatmaCalculator';

interface KhatmaActiveCardProps {
  activeKhatma?: QuranKhatma;
  setKhatmat: React.Dispatch<React.SetStateAction<QuranKhatma[]>>;
  quranSessions: QuranSession[];
  setQuranSessions: React.Dispatch<React.SetStateAction<QuranSession[]>>;
  onOpenAddKhatma: () => void;
  onOpenUpdatePage: (khatmaId: string, currentPage: number) => void;
  onOpenCatchUpModal: () => void;
  showCatchUpSuccessToast: boolean;
  setShowCatchUpSuccessToast: (show: boolean) => void;
  setPendingUserChoiceKhatma: (choice: { khatma: QuranKhatma; years: number[] } | null) => void;
  setCelebrationKhatma: (khatma: QuranKhatma | null) => void;
}

export default function KhatmaActiveCard({
  activeKhatma,
  setKhatmat,
  quranSessions,
  setQuranSessions,
  onOpenAddKhatma,
  onOpenUpdatePage,
  onOpenCatchUpModal,
  showCatchUpSuccessToast,
  setShowCatchUpSuccessToast,
  setPendingUserChoiceKhatma,
  setCelebrationKhatma
}: KhatmaActiveCardProps) {
  if (!activeKhatma) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
        <div className="inline-flex p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-full">
          <Book className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 dark:text-white">لا توجد ختمة نشطة حالياً</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ابدأ ختمتك المباركة لتقسيم ورد التلاوة ومتابعته بسهولة.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddKhatma}
          className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>بدء ختمة جديدة</span>
        </button>
      </div>
    );
  }

  const start = new Date(activeKhatma.startDate);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  const adaptivePlan = AdaptiveKhatmaCalculator.calculatePlan({
    totalPages: activeKhatma.totalPages,
    startPage: 1,
    currentPage: activeKhatma.currentPage,
    targetDays: activeKhatma.durationDays,
    daysPassed: diffDays,
  });

  const daysRemaining = adaptivePlan.remainingDays;
  const remainingPages = adaptivePlan.remainingPages;
  const suggestedPages = adaptivePlan.recommendedPagesPerDay;
  const originalDailyGoal = Math.max(1, Math.ceil(activeKhatma.totalPages / activeKhatma.durationDays));
  const perPrayerPages = Math.max(1, Math.ceil(suggestedPages / 5));
  const isAccumulated = suggestedPages >= originalDailyGoal + 3 || (suggestedPages > originalDailyGoal * 1.25 && suggestedPages > 8);

  const neededDaysFromToday = Math.ceil(remainingPages / originalDailyGoal);
  const extraDaysNeeded = Math.max(1, neededDaysFromToday - daysRemaining);

  const handleQuickAdd = (pagesToAdd: number) => {
    const newPage = Math.min(604, activeKhatma.currentPage + pagesToAdd);
    const isCompletedNow = newPage >= 604;
    const status: 'active' | 'completed' = isCompletedNow ? 'completed' : 'active';
    
    const newSession: QuranSession = {
      id: safeUUID(),
      date: formatDateKey(new Date()),
      sessionType: 'read',
      khatmaId: activeKhatma.id,
      unitType: 'pages',
      unitValue: pagesToAdd
    };
    setQuranSessions(prev => [newSession, ...prev]);

    const updatedK = {
      ...activeKhatma,
      currentPage: newPage,
      status,
      completedAt: isCompletedNow ? new Date().toISOString() : activeKhatma.completedAt
    };

    if (isCompletedNow) {
      const attr = attributeKhatmaToHijriYear(updatedK, quranSessions);
      if (attr.needsUserChoice && attr.pageShares) {
        setPendingUserChoiceKhatma({
          khatma: updatedK,
          years: attr.pageShares.map(p => p.year)
        });
      } else {
        updatedK.attributedHijriYear = attr.hijriYear;
      }
      setCelebrationKhatma(updatedK);
    }

    setKhatmat(prev => prev.map(k => k.id === activeKhatma.id ? updatedK : k));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="space-y-1 text-end">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white">{activeKhatma.name}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            مدة الختمة: <span className="font-bold text-slate-600 dark:text-slate-400">{formatArabicDayCount(activeKhatma.durationDays)}</span>
          </p>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
          <BookOpen className="w-6 h-6" />
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="font-bold text-emerald-700 dark:text-emerald-400">
            نسبة الإنجاز: {toArabicNumbers(Math.round((activeKhatma.currentPage / activeKhatma.totalPages) * 100))}%
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-semibold">
            الصفحة {toArabicNumbers(activeKhatma.currentPage)} من {toArabicNumbers(activeKhatma.totalPages)}
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${(activeKhatma.currentPage / activeKhatma.totalPages) * 100}%` }}
          />
        </div>
      </div>

      {/* Daily Target Calculation & Smart Catch-up */}
      <div className="space-y-4">
        {/* Success Toast */}
        {showCatchUpSuccessToast && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تم تحديث الجدول بنجاح! عدنا للمعدل اليومي المريح 🌱</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCatchUpSuccessToast(false)}
              aria-label="إغلاق إشعار تحديث الجدول"
              className="text-emerald-700 font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Target Banner */}
        {isAccumulated ? (
          <div className="p-4 bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-amber-50/80 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-amber-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 text-slate-800 dark:text-slate-200 space-y-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-emerald-600 animate-pulse" />
              <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                مساعد الورد المرن 🌸
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              وردك اليومي أصبح ({toArabicNumbers(suggestedPages)} صفحة/يوم). يمكنك تمديد الجدول بسهولة دون أي ضغط.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setKhatmat(prev => prev.map(k => k.id === activeKhatma.id ? { ...k, durationDays: k.durationDays + extraDaysNeeded } : k));
                  setShowCatchUpSuccessToast(true);
                }}
                className="flex-1 py-2.5 px-3 bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>تمديد (+{toArabicNumbers(extraDaysNeeded)} أيام) للعودة لـ {toArabicNumbers(originalDailyGoal)} ص/يوم</span>
              </button>

              <button
                type="button"
                onClick={onOpenCatchUpModal}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>تعديل الخطة</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/25 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                المعدل اليومي: <span className="font-bold text-amber-700 dark:text-amber-400">{toArabicNumbers(suggestedPages)} صفحة</span> (متبقي {toArabicNumbers(daysRemaining)} يوم)
              </span>
              <button
                type="button"
                onClick={onOpenCatchUpModal}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                تعديل الجدول 🛠️
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200">
                🕌 ورد الصلاة: {toArabicNumbers(perPrayerPages)} صفحة
              </span>
            </div>
          </div>
        )}

        {/* Quick Add Buttons */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">تسجيل إنجاز سريع:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleQuickAdd(1)}
              className="py-2 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>صفحة (+1)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(perPrayerPages)}
              className="py-2 px-2 bg-emerald-50/80 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 cursor-pointer flex items-center justify-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>ورد صلاة (+{toArabicNumbers(perPrayerPages)})</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(10)}
              className="py-2 px-2 bg-teal-50/80 dark:bg-teal-950/40 hover:bg-teal-100 text-teal-800 dark:text-teal-300 rounded-xl text-xs font-bold border border-teal-200 dark:border-teal-800 cursor-pointer flex items-center justify-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>نصف جزء (+10)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(20)}
              className="py-2 px-2 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800 cursor-pointer flex items-center justify-center gap-1"
            >
              <Award className="w-3.5 h-3.5" />
              <span>جزء (+20)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Update Current Page Button */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onOpenUpdatePage(activeKhatma.id, activeKhatma.currentPage)}
          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all cursor-pointer shadow-sm text-center"
        >
          تحديث الصفحة الحالية
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('هل أنت متأكد من أرشفة هذه الختمة لبدء واحدة جديدة؟')) {
              setKhatmat(prev => prev.map(k => k.id === activeKhatma.id ? { ...k, status: 'completed' as const } : k));
            }
          }}
          aria-label="أرشفة الختمة الحالية"
          className="py-3 px-4 bg-rose-50 dark:bg-rose-950/25 hover:bg-rose-100 text-rose-700 dark:text-rose-400 font-bold rounded-2xl text-xs cursor-pointer border border-rose-200 dark:border-rose-900/50"
          title="أرشفة الختمة"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
