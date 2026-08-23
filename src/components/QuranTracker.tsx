/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { safeSetJSON } from '../utils/storage';
import { 
  Book, 
  Plus, 
  Trash2, 
  PlusCircle, 
  BookOpen, 
  Award, 
  RotateCcw,
  Sparkles,
  Sliders,
  Calendar,
  Heart,
  Zap,
  RefreshCw,
  CheckCircle2,
  Share2,
  ChevronDown,
  X,
  Target
} from 'lucide-react';
import { QuranKhatma, QuranSession, JuzProgress, MemorizationRoutine } from '../types';
import { toArabicNumbers, formatArabicDayCount, getHijriDate } from '../utils/hijri';
import ExpandableCard from './quran/ExpandableCard';
import MemorizationTab from './quran/MemorizationTab';
import QuranHistoryTab from './quran/QuranHistoryTab';
import VerseCardMaker from './quran/VerseCardMaker';
import KhatmaCelebrationModal from './quran/KhatmaCelebrationModal';
import { attributeKhatmaToHijriYear } from '../utils/quranHelpers';
import { formatDateKey } from '../utils/prayerDayBoundary';

interface QuranTrackerProps {
  khatmat: QuranKhatma[];
  setKhatmat: React.Dispatch<React.SetStateAction<QuranKhatma[]>>;
  quranSessions: QuranSession[];
  setQuranSessions: React.Dispatch<React.SetStateAction<QuranSession[]>>;
  annualKhatmaGoal?: number;
  setAnnualKhatmaGoal?: (goal: number) => void;
}

export default function QuranTracker({
  khatmat,
  setKhatmat,
  quranSessions,
  setQuranSessions,
  annualKhatmaGoal: propAnnualGoal = 12,
  setAnnualKhatmaGoal: propSetAnnualGoal,
}: QuranTrackerProps) {
  const [activeTab, setActiveTab] = useState<'khatma' | 'memorization' | 'history'>('khatma');

  // Annual Goal State
  const [annualGoal, setAnnualGoal] = useState<number>(propAnnualGoal);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<number>(annualGoal);

  // Memorization State (Persisted in localStorage)
  const [juzProgressList, setJuzProgressList] = useState<JuzProgress[]>(() => {
    try {
      const saved = localStorage.getItem('quran_juz_progress');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return Array.from({ length: 30 }, (_, i) => ({
      juzNumber: i + 1,
      status: 'not_started' as const,
      reviewIntervalDays: 30
    }));
  });

  const [routines, setRoutines] = useState<MemorizationRoutine[]>(() => {
    try {
      const saved = localStorage.getItem('quran_routines');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: '1',
        type: 'memorize',
        unitType: 'pages',
        unitValue: 1,
        surahOrJuz: 'جزء عمّ',
        reminderDays: [0, 1, 2, 3, 4, 5, 6],
        reminderTime: '20:00',
        notificationEnabled: false,
        createdAt: formatDateKey(new Date())
      }
    ];
  });

  useEffect(() => {
    safeSetJSON('quran_juz_progress', juzProgressList);
  }, [juzProgressList]);

  useEffect(() => {
    safeSetJSON('quran_routines', routines);
  }, [routines]);

  // Modals & Popups
  const [showAddKhatma, setShowAddKhatma] = useState(false);
  const [khatmaName, setKhatmaName] = useState('ختمتي المباركة');
  const [durationDays, setDurationDays] = useState(30);

  const [updatingKhatmaId, setUpdatingKhatmaId] = useState<string | null>(null);
  const [newPageVal, setNewPageVal] = useState<number>(0);

  const [showCatchUpModal, setShowCatchUpModal] = useState(false);
  const [targetPagesInput, setTargetPagesInput] = useState<number>(20);
  const [showSplitDetail, setShowSplitDetail] = useState(false);
  const [showCatchUpSuccessToast, setShowCatchUpSuccessToast] = useState(false);

  // Verse Card Maker Standalone Modal
  const [showVerseCardMaker, setShowVerseCardMaker] = useState(false);

  // Khatma Celebration Modal
  const [celebrationKhatma, setCelebrationKhatma] = useState<QuranKhatma | null>(null);

  // User Choice for 50/50 Hijri Year Attribution
  const [pendingUserChoiceKhatma, setPendingUserChoiceKhatma] = useState<{
    khatma: QuranKhatma;
    years: number[];
  } | null>(null);

  const activeKhatma = khatmat.find(k => k.status === 'active');
  const currentHijriYear = getHijriDate(new Date()).year;

  // Handle Create Khatma
  const handleCreateKhatma = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedKhatmat = khatmat.map(k => k.status === 'active' ? { ...k, status: 'completed' as const } : k);
    
    const finalDuration = isNaN(durationDays) || durationDays <= 0 ? 30 : durationDays;
    const newKhatma: QuranKhatma = {
      id: crypto.randomUUID(),
      name: khatmaName,
      startDate: formatDateKey(new Date()),
      durationDays: finalDuration,
      totalPages: 604,
      currentPage: 0,
      status: 'active'
    };

    setKhatmat([...updatedKhatmat, newKhatma]);
    setShowAddKhatma(false);
  };

  // Handle Update Page
  const handleUpdatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingKhatmaId) return;

    setKhatmat(prev => prev.map(k => {
      if (k.id === updatingKhatmaId) {
        const val = isNaN(newPageVal) ? k.currentPage : newPageVal;
        const page = Math.min(604, Math.max(0, val));
        const isCompletedNow = page >= 604;
        const status: 'active' | 'completed' = isCompletedNow ? 'completed' : 'active';
        
        const delta = page - k.currentPage;
        if (delta !== 0) {
          const newSession: QuranSession = {
            id: crypto.randomUUID(),
            date: formatDateKey(new Date()),
            sessionType: 'read',
            khatmaId: k.id,
            unitType: 'pages',
            unitValue: delta,
            isCorrection: true
          };
          setQuranSessions(prevSess => [newSession, ...prevSess]);
        }

        const updatedK = {
          ...k,
          currentPage: page,
          status,
          completedAt: isCompletedNow ? new Date().toISOString() : k.completedAt
        };

        if (isCompletedNow) {
          // Trigger Hijri Attribution calculation
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

        return updatedK;
      }
      return k;
    }));

    setUpdatingKhatmaId(null);
  };

  // Save Annual Goal
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const g = isNaN(goalInput) || goalInput <= 0 ? 12 : goalInput;
    setAnnualGoal(g);
    if (propSetAnnualGoal) propSetAnnualGoal(g);
    setShowGoalModal(false);
  };

  // Calculate Khatmat count grouped by Hijri Year
  const completedKhatmat = khatmat.filter(k => k.status === 'completed');
  
  const khatmatByHijriYear: Record<number, number> = {};
  completedKhatmat.forEach(k => {
    const yr = k.attributedHijriYear || (k.completedAt ? getHijriDate(new Date(k.completedAt)).year : currentHijriYear);
    khatmatByHijriYear[yr] = (khatmatByHijriYear[yr] || 0) + 1;
  });

  const currentYearKhatmatCount = khatmatByHijriYear[currentHijriYear] || 0;
  const previousHijriYears = Object.keys(khatmatByHijriYear)
    .map(Number)
    .filter(y => y !== currentHijriYear)
    .sort((a, b) => b - a);

  return (
    <div id="quran-tracker-root" className="space-y-5 text-end" dir="rtl">

      {/* CENTER TOP HEADER BAR & TABS */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('khatma')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'khatma'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            الختمة
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('memorization')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'memorization'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            الحفظ والمراجعة
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            السجل
          </button>
        </div>

        {/* Standalone Button: Verse Card Maker */}
        <button
          type="button"
          onClick={() => setShowVerseCardMaker(true)}
          className="py-1.5 px-3 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">صانع البطاقات</span>
        </button>
      </div>

      {/* ==================== TAB 1: KHATMA ==================== */}
      {activeTab === 'khatma' && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* 1. ANNUAL GOAL CARD ("ختمات ١٤٤٧هـ") */}
          <ExpandableCard
            defaultExpanded={false}
            title={
              <div className="flex items-center justify-between w-full">
                <span>ختمات {toArabicNumbers(currentHijriYear)}هـ</span>
                <span className="text-xs px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-extrabold border border-amber-300 dark:border-amber-800 me-2">
                  {annualGoal > 0 ? `${toArabicNumbers(currentYearKhatmatCount)} / ${toArabicNumbers(annualGoal)}` : `عدد الختمات: ${toArabicNumbers(currentYearKhatmatCount)}`}
                </span>
              </div>
            }
            subtitle={annualGoal > 0 ? `الهدف السنوي: ${toArabicNumbers(annualGoal)} ختمة` : 'حدد هدفك السنوي للختمات'}
            icon={<Target className="w-5 h-5 text-amber-600" />}
            headerAction={
              <button
                type="button"
                onClick={() => {
                  setGoalInput(annualGoal);
                  setShowGoalModal(true);
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1"
              >
                {annualGoal > 0 ? 'تعديل الهدف' : 'حدد هدفك'}
              </button>
            }
          >
            <div className="space-y-3 pt-2 text-xs text-slate-600 dark:text-slate-300">
              {annualGoal > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>نسبة إنجاز هدف سنة {toArabicNumbers(currentHijriYear)}هـ:</span>
                    <span className="font-bold text-amber-600">
                      {toArabicNumbers(Math.min(100, Math.round((currentYearKhatmatCount / annualGoal) * 100)))}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (currentYearKhatmatCount / annualGoal) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Collapsible History for Past Hijri Years */}
              {previousHijriYears.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    سجل ختمات السنوات السابقة:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previousHijriYears.map(yr => (
                      <span key={yr} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700">
                        {toArabicNumbers(yr)}هـ: {toArabicNumbers(khatmatByHijriYear[yr])} {khatmatByHijriYear[yr] === 1 ? 'ختمة' : 'ختمات'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ExpandableCard>

          {/* 2. ACTIVE KHATMA CARD */}
          {activeKhatma ? (
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
              {(() => {
                const start = new Date(activeKhatma.startDate);
                const now = new Date();
                start.setHours(0,0,0,0);
                now.setHours(0,0,0,0);
                const diffTime = now.getTime() - start.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const daysRemaining = Math.max(1, activeKhatma.durationDays - diffDays);
                const remainingPages = Math.max(0, activeKhatma.totalPages - activeKhatma.currentPage);
                const suggestedPages = Math.ceil(remainingPages / daysRemaining);
                const originalDailyGoal = Math.max(1, Math.ceil(activeKhatma.totalPages / activeKhatma.durationDays));
                const perPrayerPages = Math.max(1, Math.ceil(suggestedPages / 5));
                const isAccumulated = suggestedPages >= originalDailyGoal + 3 || (suggestedPages > originalDailyGoal * 1.25 && suggestedPages > 8);

                const handleQuickAdd = (pagesToAdd: number) => {
                  const newPage = Math.min(604, activeKhatma.currentPage + pagesToAdd);
                  const isCompletedNow = newPage >= 604;
                  const status: 'active' | 'completed' = isCompletedNow ? 'completed' : 'active';
                  
                  const newSession: QuranSession = {
                    id: crypto.randomUUID(),
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
                          {(() => {
                            const neededDaysFromToday = Math.ceil(remainingPages / originalDailyGoal);
                            const extraDaysNeeded = Math.max(1, neededDaysFromToday - daysRemaining);
                            return (
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
                            );
                          })()}

                          <button
                            type="button"
                            onClick={() => setShowCatchUpModal(true)}
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
                            onClick={() => setShowCatchUpModal(true)}
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
                );
              })()}

              {/* Update Current Page Button */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setUpdatingKhatmaId(activeKhatma.id);
                    setNewPageVal(activeKhatma.currentPage);
                  }}
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
                  className="py-3 px-4 bg-rose-50 dark:bg-rose-950/25 hover:bg-rose-100 text-rose-700 dark:text-rose-400 font-bold rounded-2xl text-xs cursor-pointer border border-rose-200 dark:border-rose-900/50"
                  title="أرشفة الختمة"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
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
                onClick={() => setShowAddKhatma(true)}
                className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>بدء ختمة جديدة</span>
              </button>
            </div>
          )}

          {/* Floating / Action Button at bottom for New Khatma */}
          {activeKhatma && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowAddKhatma(true)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>+ ختمة جديدة</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: MEMORIZATION ==================== */}
      {activeTab === 'memorization' && (
        <MemorizationTab
          quranSessions={quranSessions}
          setQuranSessions={setQuranSessions}
          juzProgressList={juzProgressList}
          setJuzProgressList={setJuzProgressList}
          routines={routines}
          setRoutines={setRoutines}
        />
      )}

      {/* ==================== TAB 3: HISTORY LOG ==================== */}
      {activeTab === 'history' && (
        <QuranHistoryTab
          quranSessions={quranSessions}
          setQuranSessions={setQuranSessions}
        />
      )}

      {/* POPUP: Annual Goal Form Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveGoal} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-600" />
                تحديد الهدف السنوي للختمات
              </h3>
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                كام ختمة ناوي تخلصها لسنة {toArabicNumbers(currentHijriYear)}هـ؟
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={goalInput}
                onChange={(e) => setGoalInput(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 text-center"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-sm"
              >
                حفظ الهدف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP: Create Khatma Modal */}
      {showAddKhatma && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateKhatma} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                تخطيط وبدء ختمة جديدة
              </h3>
              <button
                type="button"
                onClick={() => setShowAddKhatma(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">اسم الختمة:</label>
                <input
                  type="text"
                  required
                  value={khatmaName}
                  onChange={(e) => setKhatmaName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">المدة المقترحة (يوم):</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={365}
                  value={isNaN(durationDays) ? '' : durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddKhatma(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-sm"
              >
                بدء الختمة المباركة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP: Update Current Page Modal */}
      {updatingKhatmaId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleUpdatePage} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-xl animate-fadeIn">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 text-center">
              تحديث الصفحة الحالية
            </h3>
            
            <div className="text-center space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                أدخل رقم الصفحة الأخيرة التي قرأتها (من ١ إلى ٦٠٤):
              </label>
              <input
                type="number"
                required
                min={0}
                max={604}
                value={isNaN(newPageVal) ? '' : newPageVal}
                onChange={(e) => setNewPageVal(parseInt(e.target.value))}
                className="w-24 text-center mx-auto p-2.5 bg-slate-50 dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xl font-extrabold text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUpdatingKhatmaId(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-sm"
              >
                حفظ الورد
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP: Catch Up Assistant Modal */}
      {showCatchUpModal && activeKhatma && (() => {
        const start = new Date(activeKhatma.startDate);
        const now = new Date();
        start.setHours(0,0,0,0);
        now.setHours(0,0,0,0);
        const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(1, activeKhatma.durationDays - diffDays);
        const remainingPages = Math.max(0, activeKhatma.totalPages - activeKhatma.currentPage);
        const originalDailyGoal = Math.max(1, Math.ceil(activeKhatma.totalPages / activeKhatma.durationDays));
        const neededDaysForOriginalTarget = Math.ceil(remainingPages / originalDailyGoal);
        const extraDaysNeededForOriginal = Math.max(1, neededDaysForOriginalTarget - daysRemaining);

        const handleApplyExtendDays = (addDays: number) => {
          setKhatmat(prev => prev.map(k => k.id === activeKhatma.id ? { ...k, durationDays: k.durationDays + addDays } : k));
          setShowCatchUpSuccessToast(true);
          setShowCatchUpModal(false);
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    تعديل الجدول والورد المرن 🌸
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCatchUpModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl space-y-2 border border-emerald-200/80">
                  <span className="font-bold text-emerald-950 dark:text-emerald-200 block">
                    العودة للهدف المريح الأصلي ({toArabicNumbers(originalDailyGoal)} صفحة/يوم)
                  </span>
                  <p className="text-slate-600 dark:text-slate-300">
                    إضافة +{toArabicNumbers(extraDaysNeededForOriginal)} أيام لجدول الختمة للعودة لمعدل مريح.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleApplyExtendDays(extraDaysNeededForOriginal)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    تطبيق التمديد المريح ✨
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCatchUpModal(false)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        );
      })()}

      {/* POPUP: Khatma Completion Celebration Modal */}
      {celebrationKhatma && (
        <KhatmaCelebrationModal
          khatma={celebrationKhatma}
          onClose={() => setCelebrationKhatma(null)}
          onShareKhatma={() => {
            setCelebrationKhatma(null);
            setShowVerseCardMaker(true);
          }}
        />
      )}

      {/* POPUP: 50/50 Hijri Year Attribution User Choice Modal */}
      {pendingUserChoiceKhatma && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-xl text-center">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              نسب السنة الهجرية للختمة
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              تم إنجاز جهد هذه الختمة مناصفة بين سنتين هجريتين. تحب تحسبها على أي سنة؟
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {pendingUserChoiceKhatma.years.map(yr => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => {
                    const chosenYr = yr;
                    setKhatmat(prev => prev.map(k => k.id === pendingUserChoiceKhatma.khatma.id ? { ...k, attributedHijriYear: chosenYr } : k));
                    setPendingUserChoiceKhatma(null);
                  }}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-sm"
                >
                  سنة {toArabicNumbers(yr)}هـ
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STANDALONE VERSE CARD MAKER MODAL */}
      {showVerseCardMaker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-5 shadow-xl my-auto animate-fadeIn">
            <VerseCardMaker
              onClose={() => setShowVerseCardMaker(false)}
              isModal={true}
            />
          </div>
        </div>
      )}

    </div>
  );
}
