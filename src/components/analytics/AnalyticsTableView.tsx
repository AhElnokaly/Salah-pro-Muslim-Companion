/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Clock } from 'lucide-react';
import type { CardFeatureSummaryItem } from '../../utils/analyticsEngine';
import { ICON_MAP } from './analyticsIcons';

interface AnalyticsTableViewProps {
  key?: React.Key;
  filteredCards: CardFeatureSummaryItem[];
  onSelectTab: (tab: string, subTab?: string) => void;
}

export default function AnalyticsTableView({ filteredCards, onSelectTab }: AnalyticsTableViewProps) {
  return (
    <motion.div
      key="table-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white dark:bg-[#161d26] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
            جدول المتابعة والإحصائيات المباشرة (+1)
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            عرض مكثف للخدمات والأرقام المتراكمة
          </p>
        </div>

        <span className="text-xs font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/60">
          {filteredCards.length} خدمة
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-end border-collapse">
          <thead>
            <tr className="bg-slate-100/70 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 text-[11px] font-black border-b border-slate-200/80 dark:border-slate-800">
              <th className="p-3.5 pe-5">الخدمة الإيمانية</th>
              <th className="p-3.5 text-center">اليوم</th>
              <th className="p-3.5 text-center">الأسبوع 🔄</th>
              <th className="p-3.5 text-center">الشهر 🔄</th>
              <th className="p-3.5 text-center">الإجمالي</th>
              <th className="p-3.5 text-center">الإتقان 100%</th>
              <th className="p-3.5 text-center">وسام المستوى</th>
              <th className="p-3.5 text-start ps-5">الجراء والتفاعل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredCards.map(item => {
              const Icon = ICON_MAP[item.feature.iconName] || Clock;
              return (
                <tr key={item.feature.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 pe-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${item.feature.color.bg} ${item.feature.color.border} shrink-0`}>
                        <Icon className={`w-4 h-4 ${item.feature.color.text}`} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white">
                          {item.feature.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 block">
                          {item.feature.category}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5 text-center font-black text-xs text-slate-800 dark:text-slate-200">
                    {item.todayCount}
                  </td>

                  <td className="p-3.5 text-center font-black text-xs text-slate-800 dark:text-slate-200">
                    {item.weeklyCount}
                  </td>

                  <td className="p-3.5 text-center font-black text-xs text-slate-800 dark:text-slate-200">
                    {item.monthlyCount}
                  </td>

                  <td className="p-3.5 text-center font-black text-xs text-slate-800 dark:text-slate-200">
                    {item.lifetimeCount}
                  </td>

                  <td className="p-3.5 text-center font-black text-xs text-emerald-600 dark:text-emerald-400">
                    {item.lifetime100Completion}
                  </td>

                  <td className="p-3.5 text-center">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${item.badgeTier.colorClasses.badgeBg}`}>
                      {item.badgeTier.title}
                    </span>
                  </td>

                  <td className="p-3.5 text-start ps-5">
                    <button
                      type="button"
                      onClick={() => onSelectTab(item.feature.id)}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 inline-flex"
                    >
                      <span>فتح الميزة</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
