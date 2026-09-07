/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, CheckCircle2, ChevronRight, Maximize2, RotateCcw } from 'lucide-react';
import { DhikrCategory, DhikrItem } from '../../utils/adhkarData';
import { PrayerKey } from '../../utils/adhkarCalc';

export interface PrayerSwitcherItem {
  key: PrayerKey;
  name: string;
  icon: string;
}

export interface DhikrCategoryHeaderProps {
  category: DhikrCategory;
  viewMode: 'cards' | 'list';
  fontSize: 'md' | 'lg' | 'xl';
  selectedPrayerForPostAdhkar: PrayerKey;
  activePrayerKey: string | null;
  prayerSwitcher: PrayerSwitcherItem[];
  onBack: () => void;
  onChangeViewMode: (mode: 'cards' | 'list') => void;
  onChangeFontSize: (size: 'md' | 'lg' | 'xl') => void;
  onMarkAllDone: () => void;
  onOpenFocusMode: () => void;
  onResetCategory: () => void;
  onSelectPostPrayer: (key: PrayerKey) => void;
  getItemCurrentCount: (catId: string, itemId: string, prayerKey?: PrayerKey) => number;
  getItemTargetCount: (catId: string, item: DhikrItem, prayerKey?: PrayerKey) => number;
  getCategoryVisibleItems: (cat: DhikrCategory, prayerKey: PrayerKey) => DhikrItem[];
}

export const DhikrCategoryHeader: React.FC<DhikrCategoryHeaderProps> = ({
  category,
  viewMode,
  fontSize,
  selectedPrayerForPostAdhkar,
  activePrayerKey,
  prayerSwitcher,
  onBack,
  onChangeViewMode,
  onChangeFontSize,
  onMarkAllDone,
  onOpenFocusMode,
  onResetCategory,
  onSelectPostPrayer,
  getItemCurrentCount,
  getItemTargetCount,
  getCategoryVisibleItems,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Bar navigation & Category Header */}
      <div className="bg-white dark:bg-[#161d26] p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-3.5 transition-all">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="py-2 px-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
            <span>رجوع للمحطات</span>
          </button>

          <div className="text-right truncate">
            <h3 className="font-black text-slate-800 dark:text-white text-sm sm:text-base flex items-center justify-end gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">حصن المسلم: {category.arabicName}</span>
            </h3>
          </div>
        </div>

        {/* Controls Toolbar Bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 scrollbar-none">
          {/* Left Side Controls: View mode & Font size */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View mode toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => onChangeViewMode('cards')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                بطاقات
              </button>
              <button
                onClick={() => onChangeViewMode('list')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                قائمة
              </button>
            </div>

            {/* Font Size Selector */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl items-center gap-0.5">
              <button
                onClick={() => onChangeFontSize('md')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-black cursor-pointer ${
                  fontSize === 'md'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400'
                }`}
                title="خط صغير"
              >
                صغير
              </button>
              <button
                onClick={() => onChangeFontSize('lg')}
                className={`px-2 py-0.5 rounded-lg text-xs font-black cursor-pointer ${
                  fontSize === 'lg'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400'
                }`}
                title="خط متوسط"
              >
                وسط
              </button>
              <button
                onClick={() => onChangeFontSize('xl')}
                className={`px-2 py-0.5 rounded-lg text-xs font-black cursor-pointer ${
                  fontSize === 'xl'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400'
                }`}
                title="خط كبير"
              >
                كبير
              </button>
            </div>
          </div>

          {/* Right Side Controls: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mark All as Read button */}
            <button
              onClick={onMarkAllDone}
              className="py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl transition-colors cursor-pointer text-xs font-black flex items-center gap-1 border border-emerald-200 dark:border-emerald-900/40"
              title="تعليم كافة أذكار هذا القسم كـ مقروءة"
              aria-label={`إكمال كافة أذكار ${category.arabicName}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">إكمال الكل</span>
            </button>

            <button
              onClick={onOpenFocusMode}
              className="py-1.5 px-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-colors cursor-pointer text-xs font-black flex items-center gap-1 border border-indigo-100 dark:border-indigo-900/30"
              title="وضع التركيز بملء الشاشة"
              aria-label="تفعيل وضع التركيز بملء الشاشة"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">تركيز</span>
            </button>

            <button
              onClick={onResetCategory}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="إعادة ضبط أذكار هذه الفئة"
              aria-label={`إعادة ضبط عدادات أذكار ${category.arabicName}`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* POST-PRAYER SWITCHER PILLS (In Post-Prayer Category) */}
      {category.id === 'after_prayer' && (
        <div className="bg-white dark:bg-[#161d26] p-3.5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <span>اختر الصلاة التي تتلو أذكارها الآن:</span>
          </span>
          <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            {prayerSwitcher.map((p) => {
              const isSelected = selectedPrayerForPostAdhkar === p.key;
              const isCurrentActive = activePrayerKey === p.key;

              // Calculate prayer completion for visible items
              const prayerVisibleItems = getCategoryVisibleItems(category, p.key);
              let prayerDone = prayerVisibleItems.length > 0;
              prayerVisibleItems.forEach((it) => {
                const c = getItemCurrentCount('after_prayer', it.id, p.key);
                const req = getItemTargetCount('after_prayer', it, p.key);
                if (c < req) prayerDone = false;
              });

              return (
                <button
                  key={p.key}
                  onClick={() => onSelectPostPrayer(p.key)}
                  className={`py-2 px-1.5 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-sm">{p.icon}</span>
                  <span>{p.name}</span>
                  {prayerDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 shrink-0" />}
                  {isCurrentActive && !prayerDone && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DhikrCategoryHeader;
