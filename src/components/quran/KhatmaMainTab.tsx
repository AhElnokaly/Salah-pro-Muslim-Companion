/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { QuranKhatma, QuranSession } from '../../types';
import AnnualGoalCard from './AnnualGoalCard';
import KhatmaActiveCard from './KhatmaActiveCard';

interface KhatmaMainTabProps {
  currentHijriYear: number;
  annualGoal: number;
  currentYearKhatmatCount: number;
  previousHijriYears: number[];
  khatmatByHijriYear: Record<number, number>;
  onOpenGoalModal: () => void;
  activeKhatma: QuranKhatma | undefined;
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

export const KhatmaMainTab: React.FC<KhatmaMainTabProps> = ({
  currentHijriYear,
  annualGoal,
  currentYearKhatmatCount,
  previousHijriYears,
  khatmatByHijriYear,
  onOpenGoalModal,
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
  setCelebrationKhatma,
}) => {
  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. ANNUAL GOAL CARD ("ختمات ١٤٤٧هـ") */}
      <AnnualGoalCard
        currentHijriYear={currentHijriYear}
        annualGoal={annualGoal}
        currentYearKhatmatCount={currentYearKhatmatCount}
        previousHijriYears={previousHijriYears}
        khatmatByHijriYear={khatmatByHijriYear}
        onOpenGoalModal={onOpenGoalModal}
      />

      {/* 2. ACTIVE KHATMA CARD */}
      <KhatmaActiveCard
        activeKhatma={activeKhatma}
        setKhatmat={setKhatmat}
        quranSessions={quranSessions}
        setQuranSessions={setQuranSessions}
        onOpenAddKhatma={onOpenAddKhatma}
        onOpenUpdatePage={onOpenUpdatePage}
        onOpenCatchUpModal={onOpenCatchUpModal}
        showCatchUpSuccessToast={showCatchUpSuccessToast}
        setShowCatchUpSuccessToast={setShowCatchUpSuccessToast}
        setPendingUserChoiceKhatma={setPendingUserChoiceKhatma}
        setCelebrationKhatma={setCelebrationKhatma}
      />

      {/* Floating Action Button at bottom for New Khatma */}
      {activeKhatma && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onOpenAddKhatma}
            className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>+ ختمة جديدة</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default KhatmaMainTab;
