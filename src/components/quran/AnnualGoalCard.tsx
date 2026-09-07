/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target } from 'lucide-react';
import ExpandableCard from './ExpandableCard';
import { toArabicNumbers } from '../../utils/hijri';

interface AnnualGoalCardProps {
  currentHijriYear: number;
  annualGoal: number;
  currentYearKhatmatCount: number;
  previousHijriYears: number[];
  khatmatByHijriYear: Record<number, number>;
  onOpenGoalModal: () => void;
}

export default function AnnualGoalCard({
  currentHijriYear,
  annualGoal,
  currentYearKhatmatCount,
  previousHijriYears,
  khatmatByHijriYear,
  onOpenGoalModal
}: AnnualGoalCardProps) {
  return (
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
          onClick={onOpenGoalModal}
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 cursor-pointer"
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
  );
}
