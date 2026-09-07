/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Award, ChevronLeft } from 'lucide-react';
import type { CardFeatureSummaryItem } from '../../utils/analyticsEngine';

interface BadgesGalleryViewProps {
  key?: React.Key;
  filteredCards: CardFeatureSummaryItem[];
  cardSummaries: CardFeatureSummaryItem[];
  selectedTierFilter: number | 'all';
  setSelectedTierFilter: (tier: number | 'all') => void;
  crystalCount: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  onSelectTab: (tab: string, subTab?: string) => void;
}

export default function BadgesGalleryView({
  filteredCards,
  cardSummaries,
  selectedTierFilter,
  setSelectedTierFilter,
  crystalCount,
  goldCount,
  silverCount,
  bronzeCount,
  onSelectTab
}: BadgesGalleryViewProps) {
  return (
    <motion.div
      key="badges-view"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-6"
    >
      {/* Tiers Summary Bar */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                معرض الشارات والأوسمة الإيمانية 🏆
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              احرز الأوسمة الذهبية والبلورية بالاستمرار على العبادات وتوثيق إنجازاتك اليومية.
            </p>
          </div>

          {/* Tier Filter Buttons */}
          <div className="w-full md:w-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pb-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedTierFilter('all')}
              className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                selectedTierFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              الكل ({cardSummaries.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTierFilter(4)}
              className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                selectedTierFilter === 4
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
              }`}
            >
              💎 الكريستالي ({crystalCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTierFilter(3)}
              className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                selectedTierFilter === 3
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              🥇 الذهبي ({goldCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTierFilter(2)}
              className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                selectedTierFilter === 2
                  ? 'bg-slate-400 text-white shadow-md'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              🥈 الفضي ({silverCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTierFilter(1)}
              className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                selectedTierFilter === 1
                  ? 'bg-amber-900 text-white shadow-md'
                  : 'bg-amber-900/10 text-amber-700 dark:text-amber-400'
              }`}
            >
              🥉 البرنزي ({bronzeCount})
            </button>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map((item) => {
          const tier = item.badgeTier;

          return (
            <div
              key={item.feature.id}
              className={`rounded-3xl p-5 border-2 shadow-sm relative overflow-hidden transition-all hover:scale-102 ${tier.colorClasses.bg} ${tier.colorClasses.border}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-3.5 rounded-2xl border shadow-inner ${tier.colorClasses.badgeBg}`}>
                    <Award className={`w-7 h-7 ${tier.colorClasses.iconColor}`} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 block">
                      وسام ميزة ({item.feature.name})
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {tier.title}
                    </h3>
                  </div>
                </div>

                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${tier.colorClasses.badgeBg}`}>
                  %{item.completionRate}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  <span>التقدم لنيل تاج الكريستال (100%)</span>
                  <span>{item.lifetime100Completion} إتقان كامل</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 via-teal-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.completionRate}%` }}
                  />
                </div>
              </div>

              <p className="text-[10.5px] text-slate-600 dark:text-slate-300 font-bold italic mt-3 text-center">
                «{tier.quranQuote}»
              </p>

              <button
                type="button"
                onClick={() => onSelectTab(item.feature.id)}
                className="w-full mt-3 py-2 px-3 bg-white/80 dark:bg-slate-900/80 hover:bg-white text-slate-900 dark:text-white font-black text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>الانتقال لخدمة {item.feature.name}</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
