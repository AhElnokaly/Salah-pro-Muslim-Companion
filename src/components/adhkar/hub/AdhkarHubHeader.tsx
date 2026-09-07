/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Volume2, Search, X } from 'lucide-react';

interface AdhkarHubHeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export const AdhkarHubHeader: React.FC<AdhkarHubHeaderProps> = ({
  soundEnabled,
  onToggleSound,
  searchQuery,
  onSearchQueryChange,
}) => {
  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="space-y-1 text-right">
          <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>مركز الأدعية والأذكار الشامل «حصن المسلم»</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تصفح الأذكار والأدعية الشاملة، أو ابحث في كافة أذكار السنة النبوية بدون الحاجة لاتصال بالإنترنت.
          </p>
        </div>
        <button
          onClick={onToggleSound}
          className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
            soundEnabled
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
          }`}
          title={soundEnabled ? 'كتم الصوت التفاعلي' : 'تفعيل الصوت التفاعلي'}
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="ابحث في جميع الأذكار والأدعية (مثال: الاستغفار، السفر، المطر، العافية)... 🔍"
          className="w-full py-2.5 pr-10 pl-9 bg-slate-50 dark:bg-[#111720] border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchQueryChange('')}
            className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AdhkarHubHeader;
