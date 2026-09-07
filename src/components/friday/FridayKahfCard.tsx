/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, CheckCircle2, ChevronLeft } from 'lucide-react';

interface FridayKahfCardProps {
  isKahfRead: boolean;
  onToggleKahf: () => void;
  onNavigateTab?: (tab: string) => void;
}

export function FridayKahfCard({
  isKahfRead,
  onToggleKahf,
  onNavigateTab
}: FridayKahfCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-md flex flex-wrap items-center justify-between gap-3" dir="rtl">
      <div className="flex items-center gap-3 text-right">
        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md shrink-0">
          <BookOpen className="w-6 h-6 text-amber-300" />
        </div>
        <div className="text-right">
          <h4 className="text-sm font-black flex items-center gap-1.5 flex-wrap">
            <span>سورة الكهف المباركة</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30">نور ما بين الجمعتين</span>
          </h4>
          <p className="text-xs text-emerald-100/90 mt-0.5 text-right">
            {isKahfRead ? 'تمت قراءتها اليوم بحمد الله ✓' : 'احرص على تلاوتها أو الاستماع إليها اليوم'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleKahf}
          className={`py-2 px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            isKahfRead
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isKahfRead ? 'تمت القراءة ✓' : 'تعليمها كقراءة'}</span>
        </button>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('quran')}
            className="py-2 px-3.5 bg-white text-emerald-900 font-black text-xs rounded-xl shadow-sm hover:bg-emerald-50 transition-all cursor-pointer flex items-center gap-1"
          >
            <span>فتح المصحف</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
