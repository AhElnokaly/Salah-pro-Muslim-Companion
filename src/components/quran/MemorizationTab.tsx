/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Clock, 
  Calendar, 
  BookOpen, 
  RotateCcw, 
  Trash2, 
  Share2, 
  X, 
  Check, 
  Award,
  Bell,
  Sliders,
  ChevronRight
} from 'lucide-react';
import ExpandableCard from './ExpandableCard';
import VerseCardMaker from './VerseCardMaker';
import { JuzProgress, MemorizationRoutine, QuranSession } from '../../types';
import { toArabicNumbers, formatArabicDayCount } from '../../utils/hijri';
import { formatDateKey } from '../../utils/prayerDayBoundary';
import { SURAHS_LIST } from '../../data/quranData';

interface MemorizationTabProps {
  quranSessions: QuranSession[];
  setQuranSessions: React.Dispatch<React.SetStateAction<QuranSession[]>>;
  juzProgressList: JuzProgress[];
  setJuzProgressList: React.Dispatch<React.SetStateAction<JuzProgress[]>>;
  routines: MemorizationRoutine[];
  setRoutines: React.Dispatch<React.SetStateAction<MemorizationRoutine[]>>;
}

// Names of 30 Juz
const JUZ_NAMES = [
  'الم (البقرة ١)', 'سيقول (البقرة ١٤٢)', 'تلك الرسل (البقرة ٢٥٣)', 'لن تنالوا (آل عمران ٩٣)',
  'المحصنات (النساء ٢٤)', 'لا يحب الله (النساء ١٤٨)', 'وإذا سمعوا (المائدة ٨٣)', 'ولو أننا (الأنعام ١١١)',
  'قال الملأ (الأعراف ٨٩)', 'واعلموا (الأنفال ٤١)', 'يعتذرون (التوبة ٩٣)', 'وما من دابة (هود ٦)',
  'وما أبرئ (يوسف ٥٣)', 'ربما (الحجر ١)', 'سبحان الذي (الإسراء ١)', 'قال ألم (الكهف ٧٥)',
  'اقترب للناس (الأنبياء ١)', 'قد أفلح (المؤمنون ١)', 'وقال الذين لا يرجون (الفرقان ٢١)', 'أمن خلق (النمل ٥٦)',
  'اتل ما أوحي (العنكبوت ٤٥)', 'ومن يقنت (الأحزاب ٣١)', 'وما لي لا أعبد (يس ٢٢)', 'فمن أظلم (الزمر ٣٢)',
  'إليه يرد (فصلت ٤٧)', 'حم (الأحقاف ١)', 'قال فما خطبكم (الذاريات ٣١)', 'قد سمع الله (المجادلة ١)',
  'تبارك الذي (الملك ١)', 'عم (النبأ ١)'
];

export default function MemorizationTab({
  quranSessions,
  setQuranSessions,
  juzProgressList,
  setJuzProgressList,
  routines,
  setRoutines,
}: MemorizationTabProps) {
  const todayStr = formatDateKey(new Date());

  // Quick Daily State
  const [hasMemorizedToday, setHasMemorizedToday] = useState<boolean>(() => {
    return quranSessions.some(s => s.date === todayStr && s.sessionType === 'memorize');
  });
  const [hasReviewedToday, setHasReviewedToday] = useState<boolean>(() => {
    return quranSessions.some(s => s.date === todayStr && s.sessionType === 'review');
  });

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedJuzDetail, setSelectedJuzDetail] = useState<JuzProgress | null>(null);
  const [showVerseCardMaker, setShowVerseCardMaker] = useState(false);
  const [verseCardSurah, setVerseCardSurah] = useState<number>(1);

  useEffect(() => {
    const handleAndroidBack = (e: Event) => {
      if (showAddModal) {
        e.preventDefault();
        setShowAddModal(false);
      } else if (selectedJuzDetail) {
        e.preventDefault();
        setSelectedJuzDetail(null);
      } else if (showVerseCardMaker) {
        e.preventDefault();
        setShowVerseCardMaker(false);
      }
    };
    window.addEventListener('salah_android_back', handleAndroidBack);
    return () => window.removeEventListener('salah_android_back', handleAndroidBack);
  }, [showAddModal, selectedJuzDetail, showVerseCardMaker]);

  // Form States for Add Routine / Session
  const [routineType, setRoutineType] = useState<'memorize' | 'review'>('memorize');
  const [unitType, setUnitType] = useState<'verses' | 'pages' | 'juz'>('pages');
  const [unitValue, setUnitValue] = useState<number>(5);
  const [selectedSurah, setSelectedSurah] = useState<string>('سورة البقرة');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [reminderTime, setReminderTime] = useState<string>('20:00');
  const [enableNotification, setEnableNotification] = useState<boolean>(false);

  // Handle Quick Daily Completion Toggles
  const handleToggleDailyMemorize = () => {
    if (hasMemorizedToday) {
      // Remove today's quick memorize session
      setQuranSessions(prev => prev.filter(s => !(s.date === todayStr && s.sessionType === 'memorize')));
      setHasMemorizedToday(false);
    } else {
      const newSession: QuranSession = {
        id: crypto.randomUUID(),
        date: todayStr,
        sessionType: 'memorize',
        unitType: 'pages',
        unitValue: 1,
        surahOrJuzName: 'ورِد الحفظ اليومي'
      };
      setQuranSessions(prev => [newSession, ...prev]);
      setHasMemorizedToday(true);
    }
  };

  const handleToggleDailyReview = () => {
    if (hasReviewedToday) {
      setQuranSessions(prev => prev.filter(s => !(s.date === todayStr && s.sessionType === 'review')));
      setHasReviewedToday(false);
    } else {
      const newSession: QuranSession = {
        id: crypto.randomUUID(),
        date: todayStr,
        sessionType: 'review',
        unitType: 'pages',
        unitValue: 5,
        surahOrJuzName: 'ورِد المراجعة اليومي'
      };
      setQuranSessions(prev => [newSession, ...prev]);
      setHasReviewedToday(true);
    }
  };

  // Calculate Spaced Repetition Suggestion
  const calculateReviewSuggestions = () => {
    const today = new Date();
    const suggestions: Array<{ juz: JuzProgress; daysSince: number; priority: number }> = [];

    juzProgressList.forEach(jp => {
      if (jp.status === 'memorized') {
        const lastDate = jp.lastReviewedDate ? new Date(jp.lastReviewedDate) : new Date(jp.memorizedDate || todayStr);
        const diffDays = Math.max(1, Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)));
        const interval = jp.reviewIntervalDays || 30;
        const priority = diffDays / interval;

        if (diffDays >= 12 || priority >= 0.8) {
          suggestions.push({ juz: jp, daysSince: diffDays, priority });
        }
      }
    });

    suggestions.sort((a, b) => b.priority - a.priority);
    return suggestions.slice(0, 2);
  };

  const reviewSuggestions = calculateReviewSuggestions();

  // Count memorized Juz
  const memorizedJuzCount = juzProgressList.filter(j => j.status === 'memorized').length;

  // Handle Quick Juz Review Log
  const handleLogJuzReview = (juzNumber: number, rating?: 'excellent' | 'medium' | 'needs_repeat') => {
    const todayDate = formatDateKey(new Date());
    
    setJuzProgressList(prev => prev.map(j => {
      if (j.juzNumber === juzNumber) {
        let newInterval = j.reviewIntervalDays || 30;
        if (rating === 'excellent') newInterval = Math.min(60, newInterval + 7);
        if (rating === 'needs_repeat') newInterval = Math.max(7, newInterval - 7);

        return {
          ...j,
          status: 'memorized' as const,
          lastReviewedDate: todayDate,
          reviewIntervalDays: newInterval,
          reviewRating: rating || j.reviewRating
        };
      }
      return j;
    }));

    // Log a review session
    const session: QuranSession = {
      id: crypto.randomUUID(),
      date: todayDate,
      sessionType: 'review',
      unitType: 'juz',
      unitValue: 1,
      surahOrJuzName: `الجزء ${toArabicNumbers(juzNumber)}`
    };
    setQuranSessions(prev => [session, ...prev]);
    setHasReviewedToday(true);
    setSelectedJuzDetail(null);
  };

  // Create new Routine
  const handleSaveRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoutine: MemorizationRoutine = {
      id: crypto.randomUUID(),
      type: routineType,
      unitType,
      unitValue: Number(unitValue) || 1,
      surahOrJuz: selectedSurah,
      reminderDays: selectedDays,
      reminderTime,
      notificationEnabled: enableNotification,
      createdAt: todayStr
    };

    setRoutines(prev => [newRoutine, ...prev]);
    setShowAddModal(false);
  };

  const handleDeleteRoutine = (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  const toggleDaySelection = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn" dir="rtl">
      {/* 1. DAILY QUICK LOGGING CARD */}
      <div className="p-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl shadow-md border border-emerald-700/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-800/80 text-amber-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-emerald-50">
              إنجاز الحفظ والمراجعة اليومي
            </h3>
          </div>
          <span className="text-xs text-emerald-200/80 font-medium">
            {toArabicNumbers(new Date().getDate())} {new Date().toLocaleDateString('ar-EG', { month: 'short' })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleToggleDailyMemorize}
            className={`p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer border ${
              hasMemorizedToday
                ? 'bg-emerald-800/90 border-emerald-400/80 text-white shadow-sm'
                : 'bg-emerald-950/50 border-emerald-800/50 text-emerald-200/80 hover:bg-emerald-900/40'
            }`}
          >
            <span className="text-xs font-bold">حفظت جديد اليوم؟</span>
            {hasMemorizedToday ? (
              <CheckCircle2 className="w-5 h-5 text-amber-300 fill-amber-300/20" />
            ) : (
              <Circle className="w-5 h-5 text-emerald-400/60" />
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleDailyReview}
            className={`p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer border ${
              hasReviewedToday
                ? 'bg-teal-800/90 border-teal-400/80 text-white shadow-sm'
                : 'bg-emerald-950/50 border-emerald-800/50 text-emerald-200/80 hover:bg-emerald-900/40'
            }`}
          >
            <span className="text-xs font-bold">راجعت اليوم؟</span>
            {hasReviewedToday ? (
              <CheckCircle2 className="w-5 h-5 text-amber-300 fill-amber-300/20" />
            ) : (
              <Circle className="w-5 h-5 text-emerald-400/60" />
            )}
          </button>
        </div>
      </div>

      {/* 2. SPACED REPETITION REVIEW SUGGESTION BANNER */}
      {reviewSuggestions.length > 0 && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="text-xs font-medium truncate">
              <span className="font-bold">اقتراح المراجعة: </span>
              الجزء {toArabicNumbers(reviewSuggestions[0].juz.juzNumber)} ({reviewSuggestions[0].daysSince} يوم بدون مراجعة)
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleLogJuzReview(reviewSuggestions[0].juz.juzNumber, 'medium')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer shadow-sm"
          >
            سجّل مراجعة سريعة
          </button>
        </div>
      )}

      {/* 3. MEMORIZATION MAP GRID (30 JUZ) */}
      <ExpandableCard
        defaultExpanded={true}
        title={
          <div className="flex items-center justify-between w-full">
            <span>خريطة الحفظ</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold me-2">
              {toArabicNumbers(memorizedJuzCount)} / ٣٠ جزء
            </span>
          </div>
        }
        subtitle="تابع حفظ الأجزاء وتواريخ المراجعة"
        icon={<BookOpen className="w-5 h-5" />}
      >
        <div className="space-y-3 pt-2">
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              محفوظ ومُراجَع
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
              محتاج مراجعة
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-700 inline-block" />
              غير محفوظ
            </span>
          </div>

          {/* 30 Juz Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {Array.from({ length: 30 }, (_, i) => i + 1).map(num => {
              const jp = juzProgressList.find(j => j.juzNumber === num);
              const isMemorized = jp?.status === 'memorized';
              
              const today = new Date();
              const lastReview = jp?.lastReviewedDate ? new Date(jp.lastReviewedDate) : (jp?.memorizedDate ? new Date(jp.memorizedDate) : null);
              const daysSince = lastReview ? Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 3600 * 24)) : 999;
              const needsReview = isMemorized && daysSince >= 30;

              let bgClass = 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
              if (isMemorized) {
                if (needsReview) {
                  bgClass = 'bg-amber-500 text-white border-amber-600 shadow-sm';
                } else {
                  bgClass = 'bg-emerald-600 text-white border-emerald-700 shadow-sm';
                }
              }

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedJuzDetail(jp || { juzNumber: num, status: 'not_started' })}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border text-xs font-bold hover:scale-105 active:scale-95 ${bgClass}`}
                >
                  <span>جـ {toArabicNumbers(num)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </ExpandableCard>

      {/* 4. ACTIVE ROUTINES LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
            أوراد الحفظ والمراجعة النشطة
          </h3>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ورد جديد</span>
          </button>
        </div>

        {routines.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 text-xs">
            لا توجد أوراد حفظ أو مراجعة مخصصة بعد. اضغط على (+ ورد جديد) لبدء خطتك.
          </div>
        ) : (
          routines.map(routine => (
            <ExpandableCard
              key={routine.id}
              title={
                <div className="flex items-center justify-between">
                  <span>{routine.type === 'memorize' ? '📗 حفظ جديد' : '📘 مراجعة'} — {routine.surahOrJuz || 'الورد العام'}</span>
                </div>
              }
              subtitle={`${toArabicNumbers(routine.unitValue)} ${routine.unitType === 'pages' ? 'صفحة' : routine.unitType === 'verses' ? 'آية' : 'جزء'} · ${routine.reminderDays.length === 7 ? 'يومياً' : `${routine.reminderDays.length} أيام في الأسبوع`}`}
              icon={routine.type === 'memorize' ? <BookOpen className="w-4 h-4 text-emerald-600" /> : <RotateCcw className="w-4 h-4 text-teal-600" />}
              headerAction={
                <button
                  type="button"
                  onClick={() => handleDeleteRoutine(routine.id)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="حذف الورد"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              }
            >
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>أيام التذكير:</span>
                  <span className="font-bold">
                    {routine.reminderDays.length === 7 ? 'كل أيام الأسبوع' : routine.reminderDays.map(d => ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][d]).join('، ')}
                  </span>
                </div>

                {routine.reminderTime && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span>وقت التنبيه:</span>
                    <span className="font-bold">{routine.reminderTime}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVerseCardSurah(1);
                      setShowVerseCardMaker(true);
                    }}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>شارك كبطاقة آية</span>
                  </button>
                </div>
              </div>
            </ExpandableCard>
          ))
        )}
      </div>

      {/* JUZ DETAIL MODAL */}
      {selectedJuzDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  تفاصيل الجزء {toArabicNumbers(selectedJuzDetail.juzNumber)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJuzDetail(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              مطلع الجزء: <span className="font-bold text-slate-800 dark:text-slate-200">{JUZ_NAMES[selectedJuzDetail.juzNumber - 1]}</span>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span>حالة الحفظ:</span>
                <button
                  type="button"
                  onClick={() => {
                    const newStatus = selectedJuzDetail.status === 'memorized' ? 'not_started' : 'memorized';
                    setJuzProgressList(prev => {
                      const exists = prev.some(j => j.juzNumber === selectedJuzDetail.juzNumber);
                      if (exists) {
                        return prev.map(j => j.juzNumber === selectedJuzDetail.juzNumber ? {
                          ...j,
                          status: newStatus,
                          memorizedDate: newStatus === 'memorized' ? todayStr : undefined
                        } : j);
                      } else {
                        return [...prev, {
                          juzNumber: selectedJuzDetail.juzNumber,
                          status: newStatus,
                          memorizedDate: todayStr,
                          lastReviewedDate: todayStr,
                          reviewIntervalDays: 30
                        }];
                      }
                    });
                    setSelectedJuzDetail(prev => prev ? { ...prev, status: newStatus } : null);
                  }}
                  className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                    selectedJuzDetail.status === 'memorized'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {selectedJuzDetail.status === 'memorized' ? '✓ محفوظ' : '+ تعليم كمحفوظ'}
                </button>
              </div>

              {selectedJuzDetail.status === 'memorized' && (
                <>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span>آخر مراجعة:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {selectedJuzDetail.lastReviewedDate || selectedJuzDetail.memorizedDate || 'لم تسجل'}
                    </span>
                  </div>

                  <div className="pt-2">
                    <div className="font-semibold mb-2 text-slate-700 dark:text-slate-200">
                      سجل مراجعة الجزء الآن وقَيّم الحفظ:
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleLogJuzReview(selectedJuzDetail.juzNumber, 'excellent')}
                        className="py-2 px-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold rounded-xl text-[11px] cursor-pointer"
                      >
                        ممتاز ✨
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLogJuzReview(selectedJuzDetail.juzNumber, 'medium')}
                        className="py-2 px-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold rounded-xl text-[11px] cursor-pointer"
                      >
                        متوسط ⚖️
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLogJuzReview(selectedJuzDetail.juzNumber, 'needs_repeat')}
                        className="py-2 px-1 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold rounded-xl text-[11px] cursor-pointer"
                      >
                        تكرار قريب 🔄
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedJuzDetail(null)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ADD ROUTINE / SESSION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveRoutine} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                إضافة ورد حفظ أو مراجعة
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type: Memorize vs Review */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                نوع الورد
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRoutineType('memorize')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                    routineType === 'memorize'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  📗 حفظ جديد
                </button>

                <button
                  type="button"
                  onClick={() => setRoutineType('review')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                    routineType === 'review'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  📘 مراجعة
                </button>
              </div>
            </div>

            {/* Unit & Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  الوحدة
                </label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100"
                >
                  <option value="verses">آيات</option>
                  <option value="pages">صفحات</option>
                  <option value="juz">أجزاء</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  الكمية
                </label>
                <input
                  type="number"
                  min="1"
                  max="604"
                  value={unitValue}
                  onChange={(e) => setUnitValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Surah Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                السورة / الجزء (اختياري)
              </label>
              <select
                value={selectedSurah}
                onChange={(e) => setSelectedSurah(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100"
              >
                {SURAHS_LIST.map(s => (
                  <option key={s.number} value={`سورة ${s.name}`}>
                    سورة {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Days Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                أيام التذكير
              </label>
              <div className="flex items-center justify-between gap-1">
                {['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].map((dayChar, idx) => {
                  const dayNum = (idx + 1) % 7; // Map S -> 1, M -> 2, ..., Sat -> 0
                  const isSelected = selectedDays.includes(dayNum);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDaySelection(dayNum)}
                      className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {dayChar}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time & Notification */}
            <div className="grid grid-cols-2 gap-3 items-center pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  وقت التذكير
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="notifToggle"
                  checked={enableNotification}
                  onChange={(e) => setEnableNotification(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="notifToggle" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  تفعيل التنبيه
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-sm"
              >
                حفظ الورد
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setShowVerseCardMaker(true);
                }}
                className="py-3 px-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-amber-200 dark:border-amber-800"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>شارك كبطاقة</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VERSE CARD MAKER MODAL */}
      {showVerseCardMaker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-5 shadow-xl my-auto animate-fadeIn">
            <VerseCardMaker
              initialConfig={{
                surahNumber: verseCardSurah,
                surahName: `سورة ${SURAHS_LIST[verseCardSurah - 1]?.name || ''}`
              }}
              onClose={() => setShowVerseCardMaker(false)}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
