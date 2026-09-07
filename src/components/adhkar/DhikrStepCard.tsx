/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, Copy, Sparkles, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DhikrItem } from '../../utils/adhkarData';
import { toArabicNumbers } from '../../utils/hijri';

export interface DhikrStepCardProps {
  currentItem: DhikrItem;
  safeDhikrIdx: number;
  totalItems: number;
  currentCount: number;
  targetCount: number;
  isCompleted: boolean;
  isFavorited: boolean;
  fontSize: 'md' | 'lg' | 'xl';
  isCopied: boolean;
  particles: Array<{ id: number; text: string; x: number; y: number }>;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onCopyText: () => void;
  onIncrement: () => void;
  onMarkDone: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const DhikrStepCard: React.FC<DhikrStepCardProps> = ({
  currentItem,
  safeDhikrIdx,
  totalItems,
  currentCount,
  targetCount,
  isCompleted,
  isFavorited,
  fontSize,
  isCopied,
  particles,
  onToggleFavorite,
  onCopyText,
  onIncrement,
  onMarkDone,
  onPrev,
  onNext,
}) => {
  return (
    <div
      className={`rounded-3xl p-6 border transition-colors overflow-hidden space-y-6 flex flex-col items-center ${
        isFavorited
          ? 'bg-gradient-to-b from-amber-50/80 to-amber-100/40 dark:from-amber-950/30 dark:to-orange-950/10 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/30'
          : 'bg-white dark:bg-[#161d26] border-[#e2e8f0] dark:border-slate-800/80'
      }`}
    >
      {/* Current Item Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={safeDhikrIdx}
          initial={{ opacity: 0, x: 50, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="w-full space-y-6 flex flex-col items-center"
        >
          <div
            className={`w-full relative rounded-3xl p-6 md:p-8 border overflow-hidden shadow-inner flex flex-col items-center text-right ${
              isFavorited
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50'
                : 'bg-slate-50/70 dark:bg-[#111720]/90 border-slate-200/60 dark:border-slate-800/80'
            }`}
          >
            {/* Title & Timing Notes */}
            <div className="w-full flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3 mb-4 gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  aria-label={isFavorited ? 'إزالة هذا الذكر من المفضلة' : 'إضافة هذا الذكر إلى المفضلة'}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                    isFavorited
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200/60 dark:border-slate-700/60'
                  }`}
                  title={isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                >
                  <Star className={`w-4 h-4 ${isFavorited ? 'fill-amber-400 text-amber-500' : ''}`} />
                </button>

                <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/30 truncate max-w-[180px] sm:max-w-none">
                  {currentItem.title || `الذكر ${toArabicNumbers(safeDhikrIdx + 1)}`}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={onCopyText}
                  className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-2xs transition-all"
                  title="نسخ نص الذكر"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {isCopied ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">تم النسخ ✓</span>
                  ) : (
                    <span>نسخ</span>
                  )}
                </button>

                <span className="text-xs font-black px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                  {toArabicNumbers(safeDhikrIdx + 1)} من {toArabicNumbers(totalItems)}
                </span>
              </div>
            </div>

            {/* Special Timing Note Badge */}
            {(currentItem.timingNote || currentItem.description) && (
              <div className="w-full text-right mb-3">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30 inline-block">
                  {currentItem.timingNote || currentItem.description}
                </span>
              </div>
            )}

            {/* Full Arabic Text */}
            <p
              className={`font-black text-slate-800 dark:text-slate-100 leading-relaxed text-center py-4 select-text max-w-xl w-full ${
                fontSize === 'md'
                  ? 'text-base md:text-lg'
                  : fontSize === 'lg'
                  ? 'text-lg md:text-xl'
                  : 'text-xl md:text-2xl'
              }`}
            >
              {currentItem.text}
            </p>

            {/* Virtue / Reward Box */}
            {currentItem.reward && (
              <div className="mt-3 p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-300 text-right w-full leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block mb-0.5">الفضل والبركة:</span>
                  <span>{currentItem.reward}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Interactive Counter Tap Button */}
      <div className="relative flex flex-col items-center gap-4 pt-2">
        {/* Particles overlay */}
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center overflow-visible z-30">
          <AnimatePresence>
            {particles.map((p) => (
              <motion.span
                key={p.id}
                initial={{ opacity: 0, scale: 0.5, y: 0, x: p.x }}
                animate={{ opacity: 1, scale: 1.25, y: p.y }}
                exit={{ opacity: 0, scale: 0.8, y: p.y - 15 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute text-xs font-black px-2.5 py-1 bg-indigo-600 dark:bg-indigo-700 text-white rounded-full shadow-md select-none pointer-events-none whitespace-nowrap"
              >
                {p.text}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* Tap Button */}
        <button
          onClick={onIncrement}
          className={`w-44 h-44 rounded-full text-white flex flex-col items-center justify-center shadow-xl transition-all cursor-pointer border-4 border-white dark:border-slate-800 relative overflow-hidden group select-none active:scale-95 ${
            isCompleted
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-200/50 dark:shadow-none'
              : 'bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-200/50 dark:shadow-none'
          }`}
        >
          {/* Circular SVG Ring Progress */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="5" className="text-white/20" fill="transparent" />
            <circle
              cx="80"
              cy="80"
              r="72"
              stroke="currentColor"
              strokeWidth="7"
              className="text-white transition-all duration-300"
              strokeDasharray={2 * Math.PI * 72}
              strokeDashoffset={2 * Math.PI * 72 * (1 - Math.min(1, currentCount / targetCount))}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="text-4xl font-black tracking-tight z-10 flex flex-col items-center">
            <span>{toArabicNumbers(currentCount)}</span>
            <span className="text-xs font-extrabold text-indigo-100 border-t border-white/20 mt-1.5 pt-1 w-16 text-center">
              من {toArabicNumbers(targetCount)}
            </span>
          </div>

          <span className="text-[11px] font-extrabold mt-2 tracking-wide z-10 bg-black/20 px-3 py-0.5 rounded-full">
            {isCompleted ? 'تم الذكر بنجاح ✓' : 'انقر للتسجيل 📿'}
          </span>
        </button>

        {/* Quick Navigation & Mark Done Controls */}
        <div className="flex items-center gap-3 w-full justify-between pt-2">
          <button
            onClick={onPrev}
            disabled={safeDhikrIdx === 0}
            className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4" />
            <span>السابق</span>
          </button>

          <button
            onClick={onMarkDone}
            className="py-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1 border border-emerald-200 dark:border-emerald-900/40"
          >
            <Check className="w-4 h-4" />
            <span>تسجيل كـ مكتمل</span>
          </button>

          <button
            onClick={onNext}
            disabled={safeDhikrIdx === totalItems - 1}
            className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DhikrStepCard;
