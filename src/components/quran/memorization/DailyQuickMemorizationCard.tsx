/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, CheckCircle2, Circle } from 'lucide-react';
import { toArabicNumbers } from '../../../utils/hijri';

interface DailyQuickMemorizationCardProps {
  hasMemorizedToday: boolean;
  hasReviewedToday: boolean;
  onToggleDailyMemorize: () => void;
  onToggleDailyReview: () => void;
}

export const DailyQuickMemorizationCard: React.FC<DailyQuickMemorizationCardProps> = ({
  hasMemorizedToday,
  hasReviewedToday,
  onToggleDailyMemorize,
  onToggleDailyReview,
}) => {
  const today = new Date();
  const dateStr = `${toArabicNumbers(today.getDate())} ${today.toLocaleDateString('ar-EG', { month: 'short' })}`;

  return (
    <div className="p-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl shadow-md border border-emerald-700/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-800/80 text-amber-300 flex items-center justify-center">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-emerald-50">
            إنجاز الحفظ والمراجعة اليومي
          </h3>
        </div>
        <span className="text-xs text-emerald-200/80 font-medium">
          {dateStr}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onToggleDailyMemorize}
          className={`p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer border ${
            hasMemorizedToday
              ? 'bg-emerald-800/90 border-emerald-400/80 text-white shadow-sm'
              : 'bg-emerald-950/50 border-emerald-800/50 text-emerald-200/80 hover:bg-emerald-900/40'
          }`}
          aria-label={hasMemorizedToday ? 'إلغاء حفظ اليوم' : 'تسجيل حفظ اليوم'}
        >
          <span className="text-xs font-bold">حفظت جديد اليوم؟</span>
          {hasMemorizedToday ? (
            <CheckCircle2 className="w-5 h-5 text-amber-300 fill-amber-300/20" aria-hidden="true" />
          ) : (
            <Circle className="w-5 h-5 text-emerald-400/60" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={onToggleDailyReview}
          className={`p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer border ${
            hasReviewedToday
              ? 'bg-teal-800/90 border-teal-400/80 text-white shadow-sm'
              : 'bg-emerald-950/50 border-emerald-800/50 text-emerald-200/80 hover:bg-emerald-900/40'
          }`}
          aria-label={hasReviewedToday ? 'إلغاء مراجعة اليوم' : 'تسجيل مراجعة اليوم'}
        >
          <span className="text-xs font-bold">راجعت اليوم؟</span>
          {hasReviewedToday ? (
            <CheckCircle2 className="w-5 h-5 text-amber-300 fill-amber-300/20" aria-hidden="true" />
          ) : (
            <Circle className="w-5 h-5 text-emerald-400/60" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
};

export default DailyQuickMemorizationCard;
