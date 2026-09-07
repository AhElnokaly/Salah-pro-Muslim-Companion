/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { DhikrCategory, DhikrItem } from '../../utils/adhkarData';
import { PrayerKey } from '../../utils/adhkarCalc';
import { toArabicNumbers } from '../../utils/hijri';

export interface AdhkarFocusModalProps {
  isOpen: boolean;
  selectedCategory: DhikrCategory | null;
  selectedPrayerForPostAdhkar: PrayerKey;
  currentDhikrIdx: number;
  onClose: () => void;
  onPrevDhikr: () => void;
  onNextDhikr: () => void;
  onIncrementItem: (item: DhikrItem) => void;
  getItemCurrentCount: (catId: string, itemId: string) => number;
  getItemTargetCount: (catId: string, item: DhikrItem, prayerKey: PrayerKey) => number;
  getCategoryVisibleItems: (cat: DhikrCategory, prayerKey: PrayerKey) => DhikrItem[];
}

export const AdhkarFocusModal: React.FC<AdhkarFocusModalProps> = ({
  isOpen,
  selectedCategory,
  selectedPrayerForPostAdhkar,
  currentDhikrIdx,
  onClose,
  onPrevDhikr,
  onNextDhikr,
  onIncrementItem,
  getItemCurrentCount,
  getItemTargetCount,
  getCategoryVisibleItems,
}) => {
  if (!isOpen || !selectedCategory) return null;

  const visibleCategoryItems = getCategoryVisibleItems(selectedCategory, selectedPrayerForPostAdhkar);
  const safeDhikrIdx = Math.min(currentDhikrIdx, visibleCategoryItems.length - 1);
  const currentItem = visibleCategoryItems[safeDhikrIdx] || visibleCategoryItems[0];
  if (!currentItem) return null;

  const currentCount = getItemCurrentCount(selectedCategory.id, currentItem.id);
  const targetCount = getItemTargetCount(selectedCategory.id, currentItem, selectedPrayerForPostAdhkar);
  const isCompleted = currentCount >= targetCount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-6 text-white text-right" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <button
          onClick={onClose}
          aria-label="إغلاق وضع التركيز"
          className="p-2 bg-white/10 hover:bg-white/20 rounded-2xl cursor-pointer text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h3 className="font-black text-lg text-amber-300">🏰 حصن المسلم: {selectedCategory.arabicName}</h3>
          <p className="text-xs text-slate-300">وضع التركيز بملء الشاشة</p>
        </div>
        <span className="text-xs font-bold text-slate-300 bg-white/10 px-3 py-1 rounded-full">
          {toArabicNumbers(safeDhikrIdx + 1)} / {toArabicNumbers(visibleCategoryItems.length)}
        </span>
      </div>

      {/* Body content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto space-y-6">
        <p className="text-2xl md:text-3xl font-black text-center leading-relaxed select-text">
          {currentItem.text}
        </p>

        {currentItem.reward && (
          <p className="text-xs text-emerald-300 bg-emerald-950/40 p-3 rounded-2xl border border-emerald-800/40 text-center max-w-md">
            ✨ {currentItem.reward}
          </p>
        )}

        {/* Huge Tap Button */}
        <button
          onClick={() => onIncrementItem(currentItem)}
          className={`w-48 h-48 rounded-full text-white flex flex-col items-center justify-center shadow-2xl transition-all cursor-pointer border-4 border-white/20 active:scale-95 ${
            isCompleted ? 'bg-emerald-600' : 'bg-indigo-600'
          }`}
        >
          <span className="text-5xl font-black">{toArabicNumbers(currentCount)}</span>
          <span className="text-xs font-extrabold mt-1 text-indigo-100">
            من {toArabicNumbers(targetCount)}
          </span>
          <span className="text-[11px] font-extrabold mt-2 bg-black/30 px-3 py-0.5 rounded-full">
            {isCompleted ? 'مكتمل ✓' : 'انقر للتسجيل'}
          </span>
        </button>
      </div>

      {/* Footer Controls */}
      <div className="flex justify-between items-center border-t border-white/10 pt-4 max-w-2xl mx-auto w-full">
        <button
          onClick={onPrevDhikr}
          disabled={safeDhikrIdx === 0}
          className="py-2.5 px-4 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-2xl text-xs font-bold cursor-pointer flex items-center gap-1"
        >
          <ChevronRight className="w-4 h-4" />
          <span>السابق</span>
        </button>

        <button
          onClick={onNextDhikr}
          disabled={safeDhikrIdx === visibleCategoryItems.length - 1}
          className="py-2.5 px-4 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-2xl text-xs font-bold cursor-pointer flex items-center gap-1"
        >
          <span>التالي</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AdhkarFocusModal;
