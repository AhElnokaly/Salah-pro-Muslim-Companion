/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { toArabicNumbers } from '../../../utils/hijri';
import { JuzProgress } from '../../../types';

interface SpacedReviewAlertProps {
  topSuggestion?: { juz: JuzProgress; daysSince: number; priority: number };
  onLogReview: (juzNumber: number) => void;
}

export const SpacedReviewAlert: React.FC<SpacedReviewAlertProps> = ({
  topSuggestion,
  onLogReview,
}) => {
  if (!topSuggestion) return null;

  return (
    <div 
      role="region" 
      aria-label="تنبيه المراجعة الذكية المتباعدة"
      className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 animate-fadeIn"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="text-xs font-medium truncate">
          <span className="font-bold">اقتراح المراجعة: </span>
          الجزء {toArabicNumbers(topSuggestion.juz.juzNumber)} ({topSuggestion.daysSince} يوم بدون مراجعة)
        </div>
      </div>

      <button
        type="button"
        onClick={() => onLogReview(topSuggestion.juz.juzNumber)}
        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer shadow-sm"
        aria-label={`تسجيل مراجعة سريعة للجزء ${toArabicNumbers(topSuggestion.juz.juzNumber)}`}
      >
        سجّل مراجعة سريعة
      </button>
    </div>
  );
};

export default SpacedReviewAlert;
