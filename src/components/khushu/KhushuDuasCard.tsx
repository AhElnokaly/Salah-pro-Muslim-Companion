/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bookmark, Copy, Check } from 'lucide-react';
import { QIYAM_DUAS } from './khushuConstants';

interface KhushuDuasCardProps {
  duaCategoryFilter: 'all' | 'istiftah' | 'qunut' | 'istighfar' | 'munajat';
  setDuaCategoryFilter: (filter: 'all' | 'istiftah' | 'qunut' | 'istighfar' | 'munajat') => void;
  copiedDuaId: string | null;
  onCopyDua: (duaId: string, text: string) => void;
}

export const KhushuDuasCard: React.FC<KhushuDuasCardProps> = ({
  duaCategoryFilter,
  setDuaCategoryFilter,
  copiedDuaId,
  onCopyDua,
}) => {
  const filteredDuas = duaCategoryFilter === 'all'
    ? QIYAM_DUAS
    : QIYAM_DUAS.filter(d => d.category === duaCategoryFilter);

  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              أدعية ومناجاة قيام الليل والوتر والأسحار
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              الأدعية المأثورة للتهجد والقنوت والاستغفار في السحر
            </p>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setDuaCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
              duaCategoryFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            الكل
          </button>
          <button
            type="button"
            onClick={() => setDuaCategoryFilter('istiftah')}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
              duaCategoryFilter === 'istiftah'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            الاستفتاح
          </button>
          <button
            type="button"
            onClick={() => setDuaCategoryFilter('qunut')}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
              duaCategoryFilter === 'qunut'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            القنوت
          </button>
          <button
            type="button"
            onClick={() => setDuaCategoryFilter('istighfar')}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
              duaCategoryFilter === 'istighfar'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            الاستغفار
          </button>
          <button
            type="button"
            onClick={() => setDuaCategoryFilter('munajat')}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
              duaCategoryFilter === 'munajat'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            المناجاة
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredDuas.map((dua) => {
          const isCopied = copiedDuaId === dua.id;
          return (
            <div 
              key={dua.id}
              className="p-4 bg-gradient-to-br from-slate-50/90 to-indigo-50/30 dark:from-slate-900/60 dark:to-indigo-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/70 space-y-2"
            >
              <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
                <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                  {dua.title}
                </span>

                <button
                  type="button"
                  onClick={() => onCopyDua(dua.id, dua.arabic)}
                  className="py-1 px-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-600 font-black">تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>نسخ الدعاء</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-relaxed font-serif py-1">
                «{dua.arabic}»
              </p>

              <span className="text-[9.5px] text-slate-400 font-bold block">
                المصدر: {dua.source}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
