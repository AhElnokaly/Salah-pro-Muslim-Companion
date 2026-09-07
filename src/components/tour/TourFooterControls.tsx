/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { TourStep } from '../../data/featureTourData';

interface TourFooterControlsProps {
  steps: TourStep[];
  currentStepIndex: number;
  onSetStepIndex: (index: number) => void;
  onJumpToFeature: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const TourFooterControls: React.FC<TourFooterControlsProps> = ({
  steps,
  currentStepIndex,
  onSetStepIndex,
  onJumpToFeature,
  onPrev,
  onNext,
}) => {
  const isLast = currentStepIndex === steps.length - 1;

  return (
    <div className="p-4 bg-slate-50 dark:bg-[#0f141b] border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
      {/* Step Progress Dots */}
      <div 
        role="tablist" 
        aria-label="مؤشرات خطوات الجولة" 
        className="flex items-center gap-1.5"
      >
        {steps.map((step, idx) => (
          <button
            key={idx}
            type="button"
            role="tab"
            aria-selected={idx === currentStepIndex}
            onClick={() => onSetStepIndex(idx)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              idx === currentStepIndex
                ? 'w-6 bg-emerald-600 dark:bg-emerald-400'
                : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
            }`}
            title={`الذهاب للخطوة ${idx + 1}`}
            aria-label={`الذهاب للخطوة ${idx + 1}: ${step.title}`}
          />
        ))}
      </div>

      {/* Buttons Row */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {/* Direct Jump to Feature */}
        <button
          type="button"
          onClick={onJumpToFeature}
          className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ms-auto sm:ms-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
          <span>جرب هذه الميزة الآن 👈</span>
        </button>

        {/* Back Step */}
        {currentStepIndex > 0 && (
          <button
            type="button"
            onClick={onPrev}
            className="py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
            aria-label="الخطوة السابقة"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
            <span>السابق</span>
          </button>
        )}

        {/* Next / Finish */}
        <button
          type="button"
          onClick={onNext}
          className="py-2.5 px-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1"
          aria-label={isLast ? 'إنهاء الجولة' : 'الخطوة التالية'}
        >
          <span>{isLast ? 'إنهاء الجولة ✨' : 'التالي'}</span>
          {!isLast && <ChevronLeft className="w-4 h-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
};

export default TourFooterControls;
