import React from 'react';
import { Search, X } from 'lucide-react';
import { SearchCategory } from '../../data/spiritualSearchData';

interface SearchHeaderInputProps {
  query: string;
  setQuery: (val: string) => void;
  activeCategory: SearchCategory;
  setActiveCategory: (cat: SearchCategory) => void;
  onClose: () => void;
}

const CATEGORIES: { id: SearchCategory; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'quran', label: 'القرآن الكريم' },
  { id: 'adhkar', label: 'الأذكار والأدعية' },
  { id: 'prayers', label: 'المواقيت والسنن' },
  { id: 'events', label: 'المناسبات والصيام' },
];

export const SearchHeaderInput: React.FC<SearchHeaderInputProps> = ({
  query,
  setQuery,
  activeCategory,
  setActiveCategory,
  onClose,
}) => {
  return (
    <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 flex items-center">
          <Search 
            className="w-5 h-5 text-emerald-600 dark:text-emerald-400 absolute start-3.5 pointer-events-none" 
            aria-hidden="true" 
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن آية، سورة، ذكر، دعاء، أو صلاة..."
            autoFocus
            aria-label="حقل البحث الروحي الشامل"
            className="w-full bg-white dark:bg-[#18212e] text-slate-800 dark:text-slate-100 text-sm font-extrabold ps-11 pe-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute end-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label="مسح نص البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-2xl bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer font-bold text-xs"
          aria-label="إغلاق نافذة البحث"
        >
          إلغاء
        </button>
      </div>

      {/* Filter Tabs */}
      <div 
        className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold"
        role="tablist"
        aria-label="تصنيفات البحث"
      >
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/40'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SearchHeaderInput;
