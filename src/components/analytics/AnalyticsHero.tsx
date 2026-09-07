/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Zap, CheckCircle2, Crown } from 'lucide-react';
import { FEATURES_LIST } from '../../utils/analyticsStorage';

interface AnalyticsHeroProps {
  period: 'daily' | 'weekly' | 'monthly' | 'all';
  setPeriod: (period: 'daily' | 'weekly' | 'monthly' | 'all') => void;
  womenExcuse: boolean;
  onToggleExcuse: (active: boolean) => void;
  totalLifetimeUsage: number;
  totalLifetime100: number;
  totalTodayUsage: number;
  totalTodayCompletion: number;
  crystalCount: number;
}

export default function AnalyticsHero({
  period,
  setPeriod,
  womenExcuse,
  onToggleExcuse,
  totalLifetimeUsage,
  totalLifetime100,
  totalTodayUsage,
  totalTodayCompletion,
  crystalCount
}: AnalyticsHeroProps) {
  return (
    <div className="space-y-4">
      {/* 1. HEADER HERO BANNER */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden border border-emerald-500/30">
        <div className="absolute -start-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 bg-emerald-500/20 rounded-2xl border border-emerald-400/30 text-emerald-300">
                <Trophy className="w-6 h-6 text-amber-300 animate-bounce" />
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full font-black">
                نظام الأوسمة والإتقان الإيماني التفاعلي 📊
              </span>
              {womenExcuse && (
                <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-3 py-1 rounded-full font-black animate-pulse flex items-center gap-1">
                  🤍 رخصة العذر الشرعي مُفعلة
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              لوحة تحليلات وإنجاز الخدمات الإيمانية
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl font-medium leading-relaxed">
              تستبدل الجداول النمطية ببطاقات تفاعلية وأوسمة إيمانية متدرجة (برنزي، فضي، ذهبي، كريستالي 💎) مع تتبع تلقائي للأيام والأسابيع والأشهر ومراعاة الظروف الشرعية.
            </p>
          </div>

          {/* Timeframe Selector Pills */}
          <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 flex items-center gap-1 shrink-0 self-stretch md:self-auto justify-center">
            {[
              { id: 'daily' as const, label: 'اليوم' },
              { id: 'weekly' as const, label: 'الأسبوع' },
              { id: 'monthly' as const, label: 'الشهر' },
              { id: 'all' as const, label: 'الإجمالي' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. OVERVIEW STAT CARDS & WOMEN EXCUSE TOGGLE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Usage */}
        <div className="bg-white dark:bg-[#161d26] rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 block truncate">
              استخدامات {period === 'daily' ? 'اليوم' : period === 'weekly' ? 'الأسبوع' : period === 'monthly' ? 'الشهر' : 'شاملة'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {period === 'daily' ? totalTodayUsage : totalLifetimeUsage}
              </span>
              <span className="text-[10px] font-bold text-slate-500">مرة</span>
            </div>
          </div>
        </div>

        {/* Total 100% Completions */}
        <div className="bg-white dark:bg-[#161d26] rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 block truncate">
              الإتقان الكامل 100%
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {period === 'daily' ? totalTodayCompletion : totalLifetime100}
              </span>
              <span className="text-[10px] font-bold text-slate-500">مرة</span>
            </div>
          </div>
        </div>

        {/* Crystal Badges Achieved */}
        <div className="bg-white dark:bg-[#161d26] rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl border border-cyan-500/20 shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 block truncate">
              الأوسمة الكريستالية 💎
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">
                {crystalCount}
              </span>
              <span className="text-[10px] font-bold text-slate-500">من {FEATURES_LIST.length}</span>
            </div>
          </div>
        </div>

        {/* Women Excuse Toggle Banner Card */}
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-2xl p-3.5 border border-indigo-500/30 shadow-xs flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 block truncate">
              رخصة العذر الشرعي 🤍
            </span>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate">
              استثناء أيام العذر للمرأة
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggleExcuse(!womenExcuse)}
            className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              womenExcuse
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
            }`}
          >
            {womenExcuse ? 'مُفعّلة ✨' : 'تفعيل'}
          </button>
        </div>
      </div>
    </div>
  );
}
