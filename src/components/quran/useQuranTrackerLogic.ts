/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { safeSetJSON, safeGetJSON } from '../../utils/storage';
import { QuranKhatma, QuranSession, JuzProgress, MemorizationRoutine } from '../../types';
import { getHijriDate } from '../../utils/hijri';
import { attributeKhatmaToHijriYear } from '../../utils/quranHelpers';
import { formatDateKey } from '../../utils/prayerDayBoundary';
import { safeUUID } from '../../utils/uuid';

export interface UseQuranTrackerLogicProps {
  khatmat: QuranKhatma[];
  setKhatmat: React.Dispatch<React.SetStateAction<QuranKhatma[]>>;
  quranSessions: QuranSession[];
  setQuranSessions: React.Dispatch<React.SetStateAction<QuranSession[]>>;
  propAnnualGoal?: number;
  propSetAnnualGoal?: (goal: number) => void;
}

export function useQuranTrackerLogic({
  khatmat,
  setKhatmat,
  quranSessions,
  setQuranSessions,
  propAnnualGoal = 12,
  propSetAnnualGoal,
}: UseQuranTrackerLogicProps) {
  const [activeTab, setActiveTab] = useState<'khatma' | 'memorization' | 'history'>('khatma');

  // Annual Goal State
  const [annualGoal, setAnnualGoal] = useState<number>(propAnnualGoal);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<number>(annualGoal);

  // Memorization State (Persisted in localStorage)
  const [juzProgressList, setJuzProgressList] = useState<JuzProgress[]>(() => {
    return safeGetJSON<JuzProgress[]>('quran_juz_progress', Array.from({ length: 30 }, (_, i) => ({
      juzNumber: i + 1,
      status: 'not_started' as const,
      reviewIntervalDays: 30,
    })));
  });

  const [routines, setRoutines] = useState<MemorizationRoutine[]>(() => {
    return safeGetJSON<MemorizationRoutine[]>('quran_routines', [
      {
        id: '1',
        type: 'memorize',
        unitType: 'pages',
        unitValue: 1,
        surahOrJuz: 'جزء عمّ',
        reminderDays: [0, 1, 2, 3, 4, 5, 6],
        reminderTime: '20:00',
        notificationEnabled: false,
        createdAt: formatDateKey(new Date()),
      },
    ]);
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

  useEffect(() => {
    const handleAndroidBack = (e: Event) => {
      if (showVerseCardMaker) {
        e.preventDefault();
        setShowVerseCardMaker(false);
      } else if (celebrationKhatma) {
        e.preventDefault();
        setCelebrationKhatma(null);
      } else if (pendingUserChoiceKhatma) {
        e.preventDefault();
        setPendingUserChoiceKhatma(null);
      } else if (showCatchUpModal) {
        e.preventDefault();
        setShowCatchUpModal(false);
      } else if (updatingKhatmaId) {
        e.preventDefault();
        setUpdatingKhatmaId(null);
      } else if (showAddKhatma) {
        e.preventDefault();
        setShowAddKhatma(false);
      } else if (showGoalModal) {
        e.preventDefault();
        setShowGoalModal(false);
      }
    };
    window.addEventListener('salah_android_back', handleAndroidBack);
    return () => window.removeEventListener('salah_android_back', handleAndroidBack);
  }, [
    showVerseCardMaker,
    celebrationKhatma,
    pendingUserChoiceKhatma,
    showCatchUpModal,
    updatingKhatmaId,
    showAddKhatma,
    showGoalModal,
  ]);

  const activeKhatma = khatmat.find((k) => k.status === 'active');
  const currentHijriYear = getHijriDate(new Date()).year;

  // Handle Create Khatma
  const handleCreateKhatma = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedKhatmat = khatmat.map((k) => (k.status === 'active' ? { ...k, status: 'completed' as const } : k));

    const finalDuration = isNaN(durationDays) || durationDays <= 0 ? 30 : durationDays;
    const newKhatma: QuranKhatma = {
      id: safeUUID(),
      name: khatmaName,
      startDate: formatDateKey(new Date()),
      durationDays: finalDuration,
      totalPages: 604,
      currentPage: 0,
      status: 'active',
    };

    setKhatmat([...updatedKhatmat, newKhatma]);
    setShowAddKhatma(false);
  };

  // Handle Update Page
  const handleUpdatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingKhatmaId) return;

    setKhatmat((prev) =>
      prev.map((k) => {
        if (k.id === updatingKhatmaId) {
          const val = isNaN(newPageVal) ? k.currentPage : newPageVal;
          const page = Math.min(604, Math.max(0, val));
          const isCompletedNow = page >= 604;
          const status: 'active' | 'completed' = isCompletedNow ? 'completed' : 'active';

          const delta = page - k.currentPage;
          if (delta !== 0) {
            const newSession: QuranSession = {
              id: safeUUID(),
              date: formatDateKey(new Date()),
              sessionType: 'read',
              khatmaId: k.id,
              unitType: 'pages',
              unitValue: delta,
              isCorrection: true,
            };
            setQuranSessions((prevSess) => [newSession, ...prevSess]);
          }

          const updatedK = {
            ...k,
            currentPage: page,
            status,
            completedAt: isCompletedNow ? new Date().toISOString() : k.completedAt,
          };

          if (isCompletedNow) {
            const attr = attributeKhatmaToHijriYear(updatedK, quranSessions);
            if (attr.needsUserChoice && attr.pageShares) {
              setPendingUserChoiceKhatma({
                khatma: updatedK,
                years: attr.pageShares.map((p) => p.year),
              });
            } else {
              updatedK.attributedHijriYear = attr.hijriYear;
            }
            setCelebrationKhatma(updatedK);
          }

          return updatedK;
        }
        return k;
      })
    );

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
  const completedKhatmat = khatmat.filter((k) => k.status === 'completed');

  const khatmatByHijriYear: Record<number, number> = {};
  completedKhatmat.forEach((k) => {
    const yr = k.attributedHijriYear || (k.completedAt ? getHijriDate(new Date(k.completedAt)).year : currentHijriYear);
    khatmatByHijriYear[yr] = (khatmatByHijriYear[yr] || 0) + 1;
  });

  const currentYearKhatmatCount = khatmatByHijriYear[currentHijriYear] || 0;
  const previousHijriYears = Object.keys(khatmatByHijriYear)
    .map(Number)
    .filter((y) => y !== currentHijriYear)
    .sort((a, b) => b - a);

  return {
    activeTab,
    setActiveTab,
    annualGoal,
    showGoalModal,
    setShowGoalModal,
    goalInput,
    setGoalInput,
    juzProgressList,
    setJuzProgressList,
    routines,
    setRoutines,
    showAddKhatma,
    setShowAddKhatma,
    khatmaName,
    setKhatmaName,
    durationDays,
    setDurationDays,
    updatingKhatmaId,
    setUpdatingKhatmaId,
    newPageVal,
    setNewPageVal,
    showCatchUpModal,
    setShowCatchUpModal,
    showCatchUpSuccessToast,
    setShowCatchUpSuccessToast,
    showVerseCardMaker,
    setShowVerseCardMaker,
    celebrationKhatma,
    setCelebrationKhatma,
    pendingUserChoiceKhatma,
    setPendingUserChoiceKhatma,
    activeKhatma,
    currentHijriYear,
    currentYearKhatmatCount,
    previousHijriYears,
    khatmatByHijriYear,
    handleCreateKhatma,
    handleUpdatePage,
    handleSaveGoal,
  };
}
