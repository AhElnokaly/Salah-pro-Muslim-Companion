/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, BookOpen, Sun, Moon, Award, Layers, ChevronLeft, ListFilter, Sparkles, Copy, Check } from 'lucide-react';
import { ADHKAR_DATA, DhikrCategory, DhikrItem } from '../../utils/adhkarData';
import { PrayerKey } from '../../utils/adhkarCalc';
import { toArabicNumbers } from '../../utils/hijri';

interface DhikrFavoritesViewProps {
  favoriteCategoryIds: string[];
  favoriteDhikrIds: string[];
  allFavoriteDhikrObjects: Array<{ category: DhikrCategory; item: DhikrItem }>;
  fontSize: 'md' | 'lg' | 'xl';
  copiedItemId: string | null;
  activePrayerKey: PrayerKey | null;
  selectedPrayerForPostAdhkar: PrayerKey;
  getItemCurrentCount: (catId: string, itemId: string, prayerKey?: PrayerKey | null) => number;
  getItemTargetCount: (catId: string, item: DhikrItem, prayerKey?: PrayerKey | null) => number;
  getCategoryVisibleItems: (cat: DhikrCategory, prayerKey?: PrayerKey | null) => DhikrItem[];
  toggleFavoriteCategory: (catId: string, e: React.MouseEvent) => void;
  toggleFavoriteDhikr: (dhikrId: string, e: React.MouseEvent) => void;
  onOpenCategoryCards: (cat: DhikrCategory) => void;
  onOpenCategoryList: (cat: DhikrCategory) => void;
  onIncrementItem: (cat: DhikrCategory, item: DhikrItem) => void;
  onCopyText: (text: string, id: string) => void;
  onMarkItemDone: (cat: DhikrCategory, item: DhikrItem) => void;
}

export const DhikrFavoritesView: React.FC<DhikrFavoritesViewProps> = ({
  favoriteCategoryIds,
  favoriteDhikrIds,
  allFavoriteDhikrObjects,
  fontSize,
  copiedItemId,
  activePrayerKey,
  selectedPrayerForPostAdhkar,
  getItemCurrentCount,
  getItemTargetCount,
  getCategoryVisibleItems,
  toggleFavoriteCategory,
  toggleFavoriteDhikr,
  onOpenCategoryCards,
  onOpenCategoryList,
  onIncrementItem,
  onCopyText,
  onMarkItemDone,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-slate-900 p-5 rounded-3xl border border-amber-200/80 dark:border-amber-900/50 space-y-2 text-right shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-black text-amber-900 dark:text-amber-200 text-base flex items-center gap-2">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            <span>صفحات وأذكار المفضلة</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-900/60 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800/60">
              {toArabicNumbers(favoriteCategoryIds.length)} أقسام مفضلة ⭐
            </span>
            {favoriteDhikrIds.length > 0 && (
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-900/60 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800/60">
                {toArabicNumbers(favoriteDhikrIds.length)} أذكار فردية ⭐
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
          تظهر هذه الأقسام والصفحات بتميز في أعلى القائمة الرئيسية لحصن المسلم، ويمكنك فتح أي صفحة مباشرة من هنا.
        </p>
      </div>

      {/* Section 1: Favorited Category Pages */}
      <div className="space-y-3">
        <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2 px-1">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span>صفحات الأذكار المثبتة في الأعلى ({toArabicNumbers(favoriteCategoryIds.length)})</span>
        </h4>

        {favoriteCategoryIds.length === 0 ? (
          <div className="p-6 bg-white dark:bg-[#161d26] rounded-3xl text-center border border-slate-200/80 dark:border-slate-800 space-y-2">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">لم تقم بتثبيت أي صفحة أذكار في المفضلة بعد.</p>
            <p className="text-[11px] text-slate-400">انقر على رمز النجمة ⭐ بجوار اسم أذكار الصباح، المساء، النوم، إلخ لتظهر دائماً في الأعلى!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ADHKAR_DATA.filter(cat => favoriteCategoryIds.includes(cat.id)).map(cat => {
              const visibleItems = getCategoryVisibleItems(cat, activePrayerKey);
              let completedItems = 0;
              visibleItems.forEach(it => {
                const countVal = getItemCurrentCount(cat.id, it.id, activePrayerKey);
                const target = getItemTargetCount(cat.id, it, activePrayerKey);
                if (countVal >= target) completedItems++;
              });
              const percent = visibleItems.length > 0 ? Math.round((completedItems / visibleItems.length) * 100) : 0;

              return (
                <div
                  key={`fav_cat_${cat.id}`}
                  className="p-5 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/20 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-slate-900/90 rounded-3xl border-2 border-amber-300 dark:border-amber-700/80 ring-1 ring-amber-400/30 text-right flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-2xl shrink-0 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300">
                      {cat.id === 'morning' ? <Sun className="w-5 h-5" /> :
                       cat.id === 'evening' ? <Moon className="w-5 h-5" /> :
                       cat.id === 'after_prayer' ? <Award className="w-5 h-5" /> :
                       <BookOpen className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1.5 flex-grow">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-black text-slate-800 dark:text-white">{cat.arabicName}</span>
                        <button
                          type="button"
                          onClick={(e) => toggleFavoriteCategory(cat.id, e)}
                          aria-label={`إزالة فئة ${cat.arabicName} من المفضلة`}
                          className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 hover:scale-110 transition-transform cursor-pointer"
                          title="إزالة من المفضلة"
                        >
                          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{cat.description}</p>
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          الإنجاز: {toArabicNumbers(completedItems)} / {toArabicNumbers(visibleItems.length)} ({toArabicNumbers(percent)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full pt-3 border-t border-amber-200/60 dark:border-amber-900/40">
                    <button
                      onClick={() => onOpenCategoryCards(cat)}
                      className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>فتح الأذكار</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenCategoryList(cat)}
                      className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-amber-50 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs border border-amber-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ListFilter className="w-3.5 h-3.5" />
                      <span>قائمة</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Individual Favorited Dhikrs (if any) */}
      {allFavoriteDhikrObjects.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>الأذكار الفردية المميزة بنجمة ({toArabicNumbers(allFavoriteDhikrObjects.length)})</span>
          </h4>

          <div className="space-y-4">
            {allFavoriteDhikrObjects.map(({ category, item }) => {
              const currentCount = getItemCurrentCount(category.id, item.id);
              const targetCount = getItemTargetCount(category.id, item, selectedPrayerForPostAdhkar);
              const isCompleted = currentCount >= targetCount;

              return (
                <div
                  key={`fav_item_${category.id}_${item.id}`}
                  className={`p-5 rounded-3xl border transition-all space-y-3 text-right ${
                    isCompleted
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                      : 'bg-white dark:bg-[#161d26] border-slate-200 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => toggleFavoriteDhikr(item.id, e)}
                        aria-label={`إزالة ذكر ${item.title || category.arabicName} من المفضلة`}
                        className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                        title="إزالة من المفضلة"
                      >
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      </button>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-white">
                        {category.arabicName} • {item.title || 'ذكر مفضل'}
                      </span>
                    </div>

                    <span className={`text-xs font-black px-3 py-1 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                    }`}>
                      {toArabicNumbers(currentCount)} / {toArabicNumbers(targetCount)}
                    </span>
                  </div>

                  {/* Text */}
                  <p className={`font-bold text-slate-800 dark:text-slate-100 leading-relaxed py-1 ${
                    fontSize === 'md' ? 'text-base' : fontSize === 'lg' ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
                  }`}>
                    {item.text}
                  </p>

                  {/* Virtue */}
                  {item.reward && (
                    <div className="p-3 bg-amber-100/50 dark:bg-amber-950/30 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 border border-amber-200/50 dark:border-amber-900/30">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>الفضل:</strong> {item.reward}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onIncrementItem(category, item)}
                        className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>تسبيح (+1)</span>
                      </button>

                      <button
                        onClick={() => onCopyText(item.text, item.id)}
                        className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-slate-700/60 transition-colors cursor-pointer flex items-center gap-1"
                        title="نسخ الذكر"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedItemId === item.id ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">تم النسخ ✓</span> : <span>نسخ</span>}
                      </button>
                    </div>

                    <button
                      onClick={() => onMarkItemDone(category, item)}
                      className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{isCompleted ? 'مقروء ومكتمل ✓' : 'تعليم كـ مقروء'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DhikrFavoritesView;
