/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { QuranKhatma, QuranSession } from '../types';
import MemorizationTab from './quran/MemorizationTab';
import QuranHistoryTab from './quran/QuranHistoryTab';
import { KhatmaMainTab } from './quran/KhatmaMainTab';
import { QuranModalsContainer } from './quran/QuranModalsContainer';
import { useQuranTrackerLogic } from './quran/useQuranTrackerLogic';

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
  const logic = useQuranTrackerLogic({
    khatmat,
    setKhatmat,
    quranSessions,
    setQuranSessions,
    propAnnualGoal,
    propSetAnnualGoal,
  });

  return (
    <div id="quran-tracker-root" className="space-y-5 text-end" dir="rtl">
      {/* CENTER TOP HEADER BAR & TABS */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => logic.setActiveTab('khatma')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              logic.activeTab === 'khatma'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            الختمة
          </button>

          <button
            type="button"
            onClick={() => logic.setActiveTab('memorization')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              logic.activeTab === 'memorization'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            الحفظ والمراجعة
          </button>

          <button
            type="button"
            onClick={() => logic.setActiveTab('history')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              logic.activeTab === 'history'
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
          onClick={() => logic.setShowVerseCardMaker(true)}
          className="py-1.5 px-3 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">صانع البطاقات</span>
        </button>
      </div>

      {/* ==================== TAB 1: KHATMA ==================== */}
      {logic.activeTab === 'khatma' && (
        <KhatmaMainTab
          currentHijriYear={logic.currentHijriYear}
          annualGoal={logic.annualGoal}
          currentYearKhatmatCount={logic.currentYearKhatmatCount}
          previousHijriYears={logic.previousHijriYears}
          khatmatByHijriYear={logic.khatmatByHijriYear}
          onOpenGoalModal={() => {
            logic.setGoalInput(logic.annualGoal);
            logic.setShowGoalModal(true);
          }}
          activeKhatma={logic.activeKhatma}
          setKhatmat={setKhatmat}
          quranSessions={quranSessions}
          setQuranSessions={setQuranSessions}
          onOpenAddKhatma={() => logic.setShowAddKhatma(true)}
          onOpenUpdatePage={(khatmaId, currentPage) => {
            logic.setUpdatingKhatmaId(khatmaId);
            logic.setNewPageVal(currentPage);
          }}
          onOpenCatchUpModal={() => logic.setShowCatchUpModal(true)}
          showCatchUpSuccessToast={logic.showCatchUpSuccessToast}
          setShowCatchUpSuccessToast={logic.setShowCatchUpSuccessToast}
          setPendingUserChoiceKhatma={logic.setPendingUserChoiceKhatma}
          setCelebrationKhatma={logic.setCelebrationKhatma}
        />
      )}

      {/* ==================== TAB 2: MEMORIZATION ==================== */}
      {logic.activeTab === 'memorization' && (
        <MemorizationTab
          quranSessions={quranSessions}
          setQuranSessions={setQuranSessions}
          juzProgressList={logic.juzProgressList}
          setJuzProgressList={logic.setJuzProgressList}
          routines={logic.routines}
          setRoutines={logic.setRoutines}
        />
      )}

      {/* ==================== TAB 3: HISTORY LOG ==================== */}
      {logic.activeTab === 'history' && (
        <QuranHistoryTab
          quranSessions={quranSessions}
          setQuranSessions={setQuranSessions}
        />
      )}

      {/* ALL MODALS & CELEBRATIONS */}
      <QuranModalsContainer
        showGoalModal={logic.showGoalModal}
        onCloseGoalModal={() => logic.setShowGoalModal(false)}
        currentHijriYear={logic.currentHijriYear}
        goalInput={logic.goalInput}
        setGoalInput={logic.setGoalInput}
        onSaveGoal={logic.handleSaveGoal}
        showAddKhatma={logic.showAddKhatma}
        onCloseAddKhatma={() => logic.setShowAddKhatma(false)}
        khatmaName={logic.khatmaName}
        setKhatmaName={logic.setKhatmaName}
        durationDays={logic.durationDays}
        setDurationDays={logic.setDurationDays}
        onCreateKhatma={logic.handleCreateKhatma}
        updatingKhatmaId={logic.updatingKhatmaId}
        onCloseUpdatePage={() => logic.setUpdatingKhatmaId(null)}
        newPageVal={logic.newPageVal}
        setNewPageVal={logic.setNewPageVal}
        onUpdatePage={logic.handleUpdatePage}
        showCatchUpModal={logic.showCatchUpModal}
        onCloseCatchUpModal={() => logic.setShowCatchUpModal(false)}
        activeKhatma={logic.activeKhatma}
        onApplyExtendDays={(addDays) => {
          if (logic.activeKhatma) {
            setKhatmat((prev) =>
              prev.map((k) => (k.id === logic.activeKhatma?.id ? { ...k, durationDays: k.durationDays + addDays } : k))
            );
            logic.setShowCatchUpSuccessToast(true);
            logic.setShowCatchUpModal(false);
          }
        }}
        celebrationKhatma={logic.celebrationKhatma}
        onCloseCelebration={() => logic.setCelebrationKhatma(null)}
        onShareKhatma={() => {
          logic.setCelebrationKhatma(null);
          logic.setShowVerseCardMaker(true);
        }}
        pendingUserChoiceKhatma={logic.pendingUserChoiceKhatma}
        onChooseYear={(chosenYr) => {
          if (logic.pendingUserChoiceKhatma) {
            setKhatmat((prev) =>
              prev.map((k) =>
                k.id === logic.pendingUserChoiceKhatma?.khatma.id ? { ...k, attributedHijriYear: chosenYr } : k
              )
            );
            logic.setPendingUserChoiceKhatma(null);
          }
        }}
        showVerseCardMaker={logic.showVerseCardMaker}
        onCloseVerseCardMaker={() => logic.setShowVerseCardMaker(false)}
      />
    </div>
  );
}
