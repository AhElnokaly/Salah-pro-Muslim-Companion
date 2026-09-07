/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import VerseCardMaker from './VerseCardMaker';
import JuzDetailModal from './JuzDetailModal';
import AddRoutineModal from './AddRoutineModal';
import { JuzProgress, MemorizationRoutine, QuranSession } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';
import { formatDateKey } from '../../utils/prayerDayBoundary';
import { safeUUID } from '../../utils/uuid';
import { SURAHS_LIST } from '../../data/quranData';
import DailyQuickMemorizationCard from './memorization/DailyQuickMemorizationCard';
import SpacedReviewAlert from './memorization/SpacedReviewAlert';
import MemorizationMapGrid from './memorization/MemorizationMapGrid';
import ActiveRoutinesSection from './memorization/ActiveRoutinesSection';

interface MemorizationTabProps {
  quranSessions: QuranSession[];
  setQuranSessions: React.Dispatch<React.SetStateAction<QuranSession[]>>;
  juzProgressList: JuzProgress[];
  setJuzProgressList: React.Dispatch<React.SetStateAction<JuzProgress[]>>;
  routines: MemorizationRoutine[];
  setRoutines: React.Dispatch<React.SetStateAction<MemorizationRoutine[]>>;
}

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
  const [verseCardSurah] = useState<number>(1);

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

  // Handle Quick Daily Completion Toggles
  const handleToggleDailyMemorize = () => {
    if (hasMemorizedToday) {
      setQuranSessions(prev => prev.filter(s => !(s.date === todayStr && s.sessionType === 'memorize')));
      setHasMemorizedToday(false);
    } else {
      const newSession: QuranSession = {
        id: safeUUID(),
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
        id: safeUUID(),
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

    const session: QuranSession = {
      id: safeUUID(),
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

  const handleToggleJuzStatus = (juzNumber: number) => {
    if (!selectedJuzDetail) return;
    const newStatus = selectedJuzDetail.status === 'memorized' ? 'not_started' : 'memorized';
    setJuzProgressList(prev => {
      const exists = prev.some(j => j.juzNumber === juzNumber);
      if (exists) {
        return prev.map(j => j.juzNumber === juzNumber ? {
          ...j,
          status: newStatus,
          memorizedDate: newStatus === 'memorized' ? todayStr : undefined
        } : j);
      } else {
        return [...prev, {
          juzNumber,
          status: newStatus,
          memorizedDate: todayStr,
          lastReviewedDate: todayStr,
          reviewIntervalDays: 30
        }];
      }
    });
    setSelectedJuzDetail(prev => prev ? { ...prev, status: newStatus } : null);
  };

  const handleDeleteRoutine = (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-5 animate-fadeIn" dir="rtl">
      {/* 1. Daily Quick Logging Card */}
      <DailyQuickMemorizationCard
        hasMemorizedToday={hasMemorizedToday}
        hasReviewedToday={hasReviewedToday}
        onToggleDailyMemorize={handleToggleDailyMemorize}
        onToggleDailyReview={handleToggleDailyReview}
      />

      {/* 2. Spaced Repetition Review Suggestion Alert */}
      {reviewSuggestions.length > 0 && (
        <SpacedReviewAlert
          topSuggestion={reviewSuggestions[0]}
          onLogReview={(juzNum) => handleLogJuzReview(juzNum, 'medium')}
        />
      )}

      {/* 3. Memorization Map Grid (30 Juz) */}
      <MemorizationMapGrid
        juzProgressList={juzProgressList}
        memorizedJuzCount={memorizedJuzCount}
        onSelectJuz={(juz) => setSelectedJuzDetail(juz)}
      />

      {/* 4. Active Routines List */}
      <ActiveRoutinesSection
        routines={routines}
        onOpenAddModal={() => setShowAddModal(true)}
        onDeleteRoutine={handleDeleteRoutine}
        onOpenVerseCardMaker={() => setShowVerseCardMaker(true)}
      />

      {/* JUZ DETAIL MODAL */}
      {selectedJuzDetail && (
        <JuzDetailModal
          selectedJuzDetail={selectedJuzDetail}
          onClose={() => setSelectedJuzDetail(null)}
          onToggleStatus={() => handleToggleJuzStatus(selectedJuzDetail.juzNumber)}
          onLogReview={(rating) => handleLogJuzReview(selectedJuzDetail.juzNumber, rating)}
        />
      )}

      {/* ADD ROUTINE / SESSION MODAL */}
      {showAddModal && (
        <AddRoutineModal
          todayStr={todayStr}
          onClose={() => setShowAddModal(false)}
          onSave={(newRoutine) => {
            setRoutines(prev => [newRoutine, ...prev]);
            setShowAddModal(false);
          }}
          onOpenCardMaker={() => {
            setShowAddModal(false);
            setShowVerseCardMaker(true);
          }}
        />
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
