/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, Sparkles } from 'lucide-react';
import { toArabicNumbers } from '../../utils/hijri';

export interface AdhkarNavigationTabsProps {
  activeTab: 'categories' | 'favorites' | 'smart_suggestions' | 'tasbeeh';
  setActiveTab: (tab: 'categories' | 'favorites' | 'smart_suggestions' | 'tasbeeh') => void;
  favoritesCount: number;
}

export const AdhkarNavigationTabs: React.FC<AdhkarNavigationTabsProps> = ({
  activeTab,
  setActiveTab,
  favoritesCount,
}) => {
  return (
    <div role="tablist" aria-label="أقسام الأذكار والتسبيح" className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'categories'}
        aria-label="قسم حصن المسلم"
        onClick={() => setActiveTab('categories')}
        className={`flex-1 min-w-[130px] py-3 text-center text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
          activeTab === 'categories'
            ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-black'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        🏰 حصن المسلم
      </button>
      
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'favorites'}
        aria-label={`الأذكار المفضلة (${toArabicNumbers(favoritesCount)} عنصر)`}
        onClick={() => setActiveTab('favorites')}
        className={`flex-1 min-w-[130px] py-3 text-center text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
          activeTab === 'favorites'
            ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-black'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <Star className={`w-4 h-4 ${favoritesCount > 0 ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
        <span>المفضلة ⭐ ({toArabicNumbers(favoritesCount)})</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'smart_suggestions'}
        aria-label="الاقتراحات الذكية"
        onClick={() => setActiveTab('smart_suggestions')}
        className={`flex-1 min-w-[130px] py-3 text-center text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
          activeTab === 'smart_suggestions'
            ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-black'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span>اقتراحات ذكية</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'tasbeeh'}
        aria-label="المسبحة الإلكترونية"
        onClick={() => setActiveTab('tasbeeh')}
        className={`flex-1 min-w-[130px] py-3 text-center text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
          activeTab === 'tasbeeh'
            ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-black'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        المسبحة الإلكترونية
      </button>
    </div>
  );
};

export default AdhkarNavigationTabs;
