/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen } from 'lucide-react';
import ExpandableCard from '../ExpandableCard';
import { JuzProgress } from '../../../types';
import { toArabicNumbers } from '../../../utils/hijri';

interface MemorizationMapGridProps {
  juzProgressList: JuzProgress[];
  memorizedJuzCount: number;
  onSelectJuz: (juz: JuzProgress) => void;
}

export const MemorizationMapGrid: React.FC<MemorizationMapGridProps> = ({
  juzProgressList,
  memorizedJuzCount,
  onSelectJuz,
}) => {
  return (
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
      icon={<BookOpen className="w-5 h-5" aria-hidden="true" />}
    >
      <div className="space-y-3 pt-2">
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" aria-hidden="true" />
            محفوظ ومُراجَع
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" aria-hidden="true" />
            محتاج مراجعة
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-700 inline-block" aria-hidden="true" />
            غير محفوظ
          </span>
        </div>

        {/* 30 Juz Grid */}
        <div 
          role="grid" 
          aria-label="خريطة حفظ أجزاء القرآن الكريم الثلاثين"
          className="grid grid-cols-6 sm:grid-cols-10 gap-2"
        >
          {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => {
            const jp = juzProgressList.find((j) => j.juzNumber === num);
            const isMemorized = jp?.status === 'memorized';

            const today = new Date();
            const lastReview = jp?.lastReviewedDate
              ? new Date(jp.lastReviewedDate)
              : jp?.memorizedDate
              ? new Date(jp.memorizedDate)
              : null;
            const daysSince = lastReview
              ? Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 3600 * 24))
              : 999;
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
                onClick={() => onSelectJuz(jp || { juzNumber: num, status: 'not_started' })}
                aria-label={`الجزء ${toArabicNumbers(num)}: ${
                  isMemorized
                    ? needsReview
                      ? 'محفوظ ويحتاج مراجعة'
                      : 'محفوظ ومتقن'
                    : 'لم يبدأ بعد'
                }`}
                className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border text-xs font-bold hover:scale-105 active:scale-95 ${bgClass}`}
              >
                <span>جـ {toArabicNumbers(num)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </ExpandableCard>
  );
};

export default MemorizationMapGrid;
