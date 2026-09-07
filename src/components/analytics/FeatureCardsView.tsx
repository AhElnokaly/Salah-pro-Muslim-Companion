/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Award, PlusCircle, ChevronLeft, Clock } from 'lucide-react';
import { trackFeatureCompletion } from '../../utils/analyticsStorage';
import type { CardFeatureSummaryItem } from '../../utils/analyticsEngine';
import { ICON_MAP } from './analyticsIcons';

interface FeatureCardsViewProps {
  key?: React.Key;
  filteredCards: CardFeatureSummaryItem[];
  onSelectTab: (tab: string, subTab?: string) => void;
}

export default function FeatureCardsView({ filteredCards, onSelectTab }: FeatureCardsViewProps) {
  return (
    <motion.div
      key="cards-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {filteredCards.map((item) => {
        const IconComp = ICON_MAP[item.feature.iconName] || Clock;
        const tier = item.badgeTier;

        return (
          <div
            key={item.feature.id}
            className={`bg-white dark:bg-[#161d26] rounded-3xl p-5 border-2 shadow-sm transition-all hover:shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden group ${tier.colorClasses.border}`}
          >
            {/* Top Badge Glow Accent Line */}
            <div className={`absolute top-0 start-0 end-0 h-1.5 ${tier.colorClasses.bg}`} />

            {/* Header Row: Icon + Title + Category Badge */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl border ${item.feature.color.bg} ${item.feature.color.border} shrink-0`}>
                    <IconComp className={`w-6 h-6 ${item.feature.color.text}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                      {item.feature.name}
                    </h3>
                    <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md inline-block mt-0.5 ${item.feature.color.badge}`}>
                      {item.feature.category}
                    </span>
                  </div>
                </div>

                {/* Quick Manual +1 Test Button */}
                <button
                  type="button"
                  onClick={() => trackFeatureCompletion(item.feature.id)}
                  aria-label={`تسجيل إتقان 100% لبند ${item.feature.name}`}
                  className="p-2 bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-950/80 text-slate-500 hover:text-emerald-600 dark:text-slate-400 rounded-xl transition-all cursor-pointer active:scale-90"
                  title="تسجيل إتقان 100% (+1)"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                {item.feature.description}
              </p>
            </div>

            {/* BADGE TIER SHOWCASE BANNER */}
            <div className={`p-3 rounded-2xl border flex flex-col space-y-1.5 ${tier.colorClasses.bg} ${tier.colorClasses.border}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Award className={`w-4 h-4 ${tier.colorClasses.iconColor}`} />
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {tier.title}
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${tier.colorClasses.badgeBg}`}>
                  %{item.completionRate}
                </span>
              </div>

              {/* Progress Bar to next level */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 via-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.completionRate}%` }}
                />
              </div>

              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold italic truncate">
                «{tier.quranQuote}»
              </span>
            </div>

            {/* MICRO COUNTERS GRID (اليوم، الأسبوع، الشهر، الإجمالي، الإتقان) */}
            <div className="grid grid-cols-3 gap-2 text-center bg-slate-50/80 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              {/* اليوم */}
              <div className="space-y-0.5">
                <span className="text-[9.5px] font-extrabold text-slate-400 dark:text-slate-500 block">
                  اليوم
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                  {item.todayCount} <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">({item.todayCompletion})</span>
                </span>
              </div>

              {/* الأسبوع */}
              <div className="space-y-0.5 border-e border-s border-slate-200/80 dark:border-slate-800 px-1">
                <span className="text-[9.5px] font-extrabold text-slate-400 dark:text-slate-500 block" title="يتراكم ويصفر أسبوعياً مع حفظ الإجمالي">
                  الأسبوع 🔄
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                  {item.weeklyCount}
                </span>
              </div>

              {/* الشهر */}
              <div className="space-y-0.5">
                <span className="text-[9.5px] font-extrabold text-slate-400 dark:text-slate-500 block" title="يتراكم ويصفر شهرياً مع حفظ الإجمالي">
                  الشهر 🔄
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                  {item.monthlyCount}
                </span>
              </div>

              {/* إجمالي المرات */}
              <div className="col-span-1 border-t border-slate-200/80 dark:border-slate-800 pt-1.5 mt-1">
                <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 block">
                  الإجمالي
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  {item.lifetimeCount}
                </span>
              </div>

              {/* مرات الإتقان 100% */}
              <div className="col-span-2 border-t border-slate-200/80 dark:border-slate-800 pt-1.5 mt-1 pe-1">
                <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 block">
                  الإتقان الكامل 100%
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                  {item.lifetime100Completion} مرة 🌟
                </span>
              </div>
            </div>

            {/* MAIN CTA BUTTON / RESULT BADGE */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onSelectTab(item.feature.id)}
                className={`w-full py-2.5 px-4 rounded-2xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-between gap-2 ${item.smartCTA.badgeStyle}`}
              >
                <span className="truncate">{item.smartCTA.buttonText}</span>
                <ChevronLeft className="w-4 h-4 shrink-0 group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
