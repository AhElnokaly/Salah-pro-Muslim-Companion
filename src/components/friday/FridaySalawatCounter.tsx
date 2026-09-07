/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, RotateCcw } from 'lucide-react';
import { toArabicNumbers } from '../../utils/hijri';

interface FridaySalawatCounterProps {
  salawatCount: number;
  salawatGoal: number;
  setSalawatGoal: (goal: number) => void;
  onIncrementSalawat: () => void;
  onResetSalawat: () => void;
  encouragementText: string;
  currentStyle: 'glass-dark' | 'faith-bright';
}

export function FridaySalawatCounter({
  salawatCount,
  salawatGoal,
  setSalawatGoal,
  onIncrementSalawat,
  onResetSalawat,
  encouragementText,
  currentStyle
}: FridaySalawatCounterProps) {
  return (
    <div className={`p-5 rounded-3xl border text-center relative overflow-hidden transition-all ${
      currentStyle === 'glass-dark'
        ? 'bg-slate-950/40 border-white/5'
        : 'bg-emerald-500/5 border-emerald-500/10'
    }`}>
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="flex items-center justify-between w-full border-b border-emerald-500/10 pb-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
            عداد الصلاة على النبي ﷺ
          </span>

          {/* Goal selector */}
          <div className="flex gap-1">
            {[100, 300, 500, 1000].map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => setSalawatGoal(goal)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  salawatGoal === goal
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {toArabicNumbers(goal)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="text-4xl md:text-5xl font-black text-amber-500 dark:text-amber-400 font-mono tracking-widest py-1">
          {toArabicNumbers(salawatCount)}
        </div>

        <p className="text-xs text-emerald-800 dark:text-emerald-300 font-bold leading-relaxed">
          {encouragementText}
        </p>

        {/* Goal progress bar */}
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-500 transition-all duration-300 rounded-full"
            style={{ width: `${Math.min(100, (salawatCount / salawatGoal) * 100)}%` }}
          />
        </div>

        <div className="flex gap-2.5 w-full pt-1.5">
          <button
            type="button"
            onClick={onIncrementSalawat}
            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black text-sm rounded-2xl transition-all shadow-md active:scale-95 text-center cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Flame className="w-4 h-4 animate-bounce text-amber-300" />
            <span>صلّ على محمد ﷺ (+١)</span>
          </button>

          {salawatCount > 0 && (
            <button
              type="button"
              onClick={onResetSalawat}
              className={`py-3 px-3.5 rounded-2xl border transition-colors cursor-pointer ${
                currentStyle === 'glass-dark'
                  ? 'bg-white/5 border-white/5 text-rose-400 hover:bg-white/10'
                  : 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50'
              }`}
              title="تصفير العداد"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
