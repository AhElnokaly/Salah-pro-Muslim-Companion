/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, Copy, Sparkles, Check } from 'lucide-react';
import { DhikrItem } from '../../utils/adhkarData';
import { toArabicNumbers } from '../../utils/hijri';

export interface DhikrListItemProps {
  item: DhikrItem;
  idx: number;
  currentCount: number;
  targetCount: number;
  isCompleted: boolean;
  isFavorited: boolean;
  fontSize: 'md' | 'lg' | 'xl';
  isCopied: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onCopyText: () => void;
  onIncrement: () => void;
  onMarkDone: () => void;
}

export const DhikrListItem: React.FC<DhikrListItemProps> = ({
  item,
  idx,
  currentCount,
  targetCount,
  isCompleted,
  isFavorited,
  fontSize,
  isCopied,
  onToggleFavorite,
  onCopyText,
  onIncrement,
  onMarkDone,
}) => {
  return (
    <div
      className={`p-5 rounded-3xl border transition-all space-y-3 text-right ${
        isCompleted
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
          : isFavorited
          ? 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/30'
          : 'bg-white dark:bg-[#161d26] border-slate-200/80 dark:border-slate-800/80'
      }`}
    >
      {/* Title bar */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={isFavorited ? `إزالة ${item.title || `الذكر رقم ${toArabicNumbers(idx + 1)}`} من المفضلة` : `إضافة ${item.title || `الذكر رقم ${toArabicNumbers(idx + 1)}`} إلى المفضلة`}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
              isFavorited
                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200/60 dark:border-slate-700/60'
            }`}
            title={isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>

          <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
            {toArabicNumbers(idx + 1)}
          </span>
          <span className="font-extrabold text-sm text-slate-800 dark:text-white">
            {item.title || `الذكر ${toArabicNumbers(idx + 1)}`}
          </span>
        </div>

        <span
          className={`text-xs font-black px-3 py-1 rounded-full ${
            isCompleted
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          {toArabicNumbers(currentCount)} / {toArabicNumbers(targetCount)}
        </span>
      </div>

      {/* Timing note */}
      {(item.timingNote || item.description) && (
        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 rounded-md inline-block">
          {item.timingNote || item.description}
        </span>
      )}

      {/* Arabic text */}
      <p
        className={`font-bold text-slate-800 dark:text-slate-100 leading-relaxed py-1 ${
          fontSize === 'md' ? 'text-base' : fontSize === 'lg' ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
        }`}
      >
        {item.text}
      </p>

      {/* Virtue */}
      {item.reward && (
        <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>
            <strong>الفضل:</strong> {item.reward}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onIncrement}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>تسبيح (+1)</span>
          </button>

          <button
            onClick={onCopyText}
            className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            title="نسخ الذكر"
          >
            <Copy className="w-3.5 h-3.5" />
            {isCopied ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">تم النسخ ✓</span>
            ) : (
              <span>نسخ</span>
            )}
          </button>
        </div>

        <button
          onClick={onMarkDone}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            isCompleted
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>{isCompleted ? 'مقروء ومكتمل ✓' : 'تعليم كـ مقروء'}</span>
        </button>
      </div>
    </div>
  );
};

export default DhikrListItem;
