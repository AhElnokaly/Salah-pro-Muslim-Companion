/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, ChevronLeft, Sparkles } from 'lucide-react';
import { DhikrCategory, DhikrItem } from '../../../utils/adhkarData';
import { toArabicNumbers } from '../../../utils/hijri';

interface SearchResultItem {
  category: DhikrCategory;
  item: DhikrItem;
  itemIndex: number;
}

interface AdhkarSearchResultsListProps {
  searchQuery: string;
  searchResults: SearchResultItem[];
  favoriteDhikrIds: string[];
  onToggleFavoriteDhikr: (id: string, e: React.MouseEvent) => void;
  onSelectCategory: (category: DhikrCategory, itemIndex?: number) => void;
  onClearSearch: () => void;
}

export const AdhkarSearchResultsList: React.FC<AdhkarSearchResultsListProps> = ({
  searchQuery,
  searchResults,
  favoriteDhikrIds,
  onToggleFavoriteDhikr,
  onSelectCategory,
  onClearSearch,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
        <span>عثرنا على ({toArabicNumbers(searchResults.length)}) نص/ذكر مطابق للبحث</span>
        <button
          onClick={onClearSearch}
          className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
        >
          مسح البحث
        </button>
      </div>

      {searchResults.length === 0 ? (
        <div className="p-8 bg-white dark:bg-[#161d26] rounded-3xl text-center border border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            لم نعثر على نتيجة تطابق كلمة "{searchQuery}"
          </p>
          <p className="text-xs text-slate-400">جرب البحث بكلمة أخرى مثل (التسبيح، الشفاء، الاستغفار)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {searchResults.map(({ category, item, itemIndex }) => {
            const isFavorited = favoriteDhikrIds.includes(item.id);
            return (
              <div
                key={`${category.id}_${item.id}`}
                className={`p-4 rounded-3xl border text-right space-y-2 transition-all shadow-xs ${
                  isFavorited
                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/20'
                    : 'bg-white dark:bg-[#161d26] border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => onToggleFavoriteDhikr(item.id, e)}
                      className={`p-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                        isFavorited
                          ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200/60 dark:border-slate-700/60'
                      }`}
                      title={isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>

                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                      {category.arabicName} • {item.title || `الذكر ${toArabicNumbers(itemIndex + 1)}`}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onSelectCategory(category, itemIndex);
                      onClearSearch();
                    }}
                    className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>قراءة الذكر</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed py-1">
                  {item.text}
                </p>

                {item.reward && (
                  <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>الفضل:</strong> {item.reward}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdhkarSearchResultsList;
