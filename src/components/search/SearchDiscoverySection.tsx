import React from 'react';
import { History, Trash2, Zap, Search, Sparkles, BookOpen, Clock, Moon } from 'lucide-react';
import { SearchCategory, QUICK_SUGGESTIONS } from '../../data/spiritualSearchData';

interface SearchDiscoverySectionProps {
  recentSearches: string[];
  onSelectTerm: (term: string) => void;
  onClearRecentSearches: () => void;
  onSelectCategoryExplore: (category: SearchCategory, initialQuery: string) => void;
}

export const SearchDiscoverySection: React.FC<SearchDiscoverySectionProps> = ({
  recentSearches,
  onSelectTerm,
  onClearRecentSearches,
  onSelectCategoryExplore,
}) => {
  return (
    <div className="space-y-5 py-2">
      {/* 1. Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <span>عمليات البحث الأخيرة</span>
            </div>
            <button
              type="button"
              onClick={onClearRecentSearches}
              className="text-[10px] text-rose-500 hover:text-rose-600 flex items-center gap-1 font-extrabold cursor-pointer"
              aria-label="مسح سجل البحث الأخير بالكامل"
            >
              <Trash2 className="w-3 h-3" />
              <span>مسح السجل</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectTerm(term)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                aria-label={`البحث عن: ${term}`}
              >
                <History className="w-3 h-3 text-slate-400" aria-hidden="true" />
                <span>{term}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Popular Quick Suggestions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400">
          <Zap className="w-4 h-4 text-amber-500 fill-current" aria-hidden="true" />
          <span>مقترحات البحث السريع الشائعة</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_SUGGESTIONS.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectTerm(sug)}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              aria-label={`اقتراح سريع: ${sug}`}
            >
              <Search className="w-3 h-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>{sug}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Explore App Highlights Grid */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <span>استكشف محتويات التطبيق الشاملة</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-start">
          <button
            type="button"
            onClick={() => onSelectCategoryExplore('quran', 'سورة')}
            className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl transition-all cursor-pointer"
            aria-label="استكشاف سور وآيات القرآن الكريم"
          >
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>القرآن الكريم (١١٤ سورة)</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
              بحث في أسماء السور والآيات والمقاطع
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectCategoryExplore('adhkar', 'أذكار')}
            className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl transition-all cursor-pointer"
            aria-label="استكشاف الأذكار والأدعية النبوية"
          >
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>الأذكار والأدعية (١٧٦+)</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
              أذكار الصباح، المساء، النوم، والأدعية
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectCategoryExplore('prayers', 'صلاة')}
            className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl transition-all cursor-pointer"
            aria-label="استكشاف الصلوات والسنن والنوافل"
          >
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>الصلوات والسنن</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
              الفرائض، الضحى، قيام الليل، والوتر
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectCategoryExplore('events', 'صيام')}
            className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl transition-all cursor-pointer"
            aria-label="استكشاف مواسم الصيام والتقويم الهجري"
          >
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-black text-xs">
              <Moon className="w-4 h-4" aria-hidden="true" />
              <span>الصيام والتقويم</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
              الأيام البيض، الإثنين والخميس، وعاشوراء
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchDiscoverySection;
