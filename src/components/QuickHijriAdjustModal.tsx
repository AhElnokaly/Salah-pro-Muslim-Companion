/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Calendar, RotateCcw } from 'lucide-react';
import { AppSettings, DashboardTab } from '../types';
import { getHijriDate, toArabicNumbers } from '../utils/hijri';

interface QuickHijriAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  now?: Date;
  setActiveTab?: (tab: DashboardTab) => void;
}

export const QuickHijriAdjustModal: React.FC<QuickHijriAdjustModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings,
  now = new Date(),
  setActiveTab,
}) => {
  if (!isOpen) return null;

  const currentOffset = settings.hijriOffset ?? 0;
  // Base date (without offset)
  const baseHijri = getHijriDate(now, 0);
  // Adjusted date (with current offset)
  const adjustedHijri = getHijriDate(now, currentOffset);

  const formatDayPadded = (d: number) => String(d).padStart(2, '0');

  const handleAdjust = (delta: number) => {
    const newOffset = Math.max(-3, Math.min(3, currentOffset + delta));
    setSettings((prev) => ({
      ...prev,
      hijriOffset: newOffset,
    }));
  };

  const handleReset = () => {
    setSettings((prev) => ({
      ...prev,
      hijriOffset: 0,
    }));
  };

  return (
    <AnimatePresence>
      <div 
        id="quick-hijri-adjust-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hijri-adjust-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#102d38] via-[#0d222b] to-[#08151b] border border-cyan-700/40 text-white rounded-3xl p-6 shadow-2xl overflow-hidden select-none"
          dir="rtl"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            id="close-hijri-adjust-btn"
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-200 hover:text-white flex items-center justify-center transition-all cursor-pointer z-10 active:scale-95"
            aria-label="إغلاق نافذة تعديل التاريخ الهجري"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center pt-2 pb-4 space-y-1.5">
            <h2 id="hijri-adjust-title" className="text-xl sm:text-2xl font-black text-white tracking-wide">
              اضبط التاريخ الهجري
            </h2>
            <p className="text-xs sm:text-sm text-cyan-200/70 font-medium">
              اليوم {toArabicNumbers(formatDayPadded(baseHijri.day))} {baseHijri.monthName} {toArabicNumbers(baseHijri.year)} هـ
            </p>
          </div>

          {/* Central Adjustment Control (Matching Reference Screenshot) */}
          <div className="my-6 py-4 px-3 bg-[#0a1820]/70 rounded-2xl border border-cyan-800/30 flex items-center justify-between gap-3 shadow-inner">
            {/* Minus Button */}
            <button
              id="hijri-adjust-minus-btn"
              type="button"
              onClick={() => handleAdjust(-1)}
              disabled={currentOffset <= -3}
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 active:scale-90 ${
                currentOffset <= -3
                  ? 'bg-cyan-950/40 text-cyan-800/40 border border-cyan-900/30 cursor-not-allowed'
                  : 'bg-cyan-700/60 hover:bg-cyan-600 text-white border border-cyan-500/40 hover:scale-105'
              }`}
              title="تأخير يوم واحد (-1)"
              aria-label="تأخير يوم واحد"
            >
              <Minus className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Date Display with Highlighted Day Number */}
            <div className="flex-1 text-center space-y-1">
              <div className="flex items-baseline justify-center gap-2 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black text-amber-400 drop-shadow-[0_2px_10px_rgba(251,191,36,0.35)]">
                  {toArabicNumbers(formatDayPadded(adjustedHijri.day))}
                </span>
                <span className="text-base sm:text-lg font-bold text-white">
                  {adjustedHijri.monthName}
                </span>
                <span className="text-sm sm:text-base font-bold text-cyan-200/90">
                  {toArabicNumbers(adjustedHijri.year)}
                </span>
              </div>

              {/* Offset Indicator Badge */}
              <div className="pt-1">
                {currentOffset === 0 ? (
                  <span className="inline-block text-[11px] font-bold text-cyan-300/80 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
                    تطابق الحساب الفلكي (0)
                  </span>
                ) : currentOffset > 0 ? (
                  <span className="inline-block text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-700/50">
                    +{toArabicNumbers(currentOffset)} يوم (تقديم)
                  </span>
                ) : (
                  <span className="inline-block text-[11px] font-bold text-rose-300 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-700/50">
                    {toArabicNumbers(currentOffset)} يوم (تأخير)
                  </span>
                )}
              </div>
            </div>

            {/* Plus Button */}
            <button
              id="hijri-adjust-plus-btn"
              type="button"
              onClick={() => handleAdjust(1)}
              disabled={currentOffset >= 3}
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 active:scale-90 ${
                currentOffset >= 3
                  ? 'bg-cyan-950/40 text-cyan-800/40 border border-cyan-900/30 cursor-not-allowed'
                  : 'bg-cyan-700/60 hover:bg-cyan-600 text-white border border-cyan-500/40 hover:scale-105'
              }`}
              title="تقديم يوم واحد (+1)"
              aria-label="تقديم يوم واحد"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {currentOffset !== 0 ? (
              <button
                id="hijri-reset-btn"
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة للأصل</span>
              </button>
            ) : (
              <span className="text-[11px] text-cyan-400/60">يُحفظ التعديل تلقائياً</span>
            )}

            {setActiveTab && (
              <button
                id="open-full-calendar-btn"
                type="button"
                onClick={() => {
                  onClose();
                  setActiveTab('calendar');
                }}
                className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer mr-auto"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>التقويم الكامل</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickHijriAdjustModal;
