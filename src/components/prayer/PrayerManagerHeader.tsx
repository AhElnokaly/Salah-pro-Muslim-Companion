/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { toArabicNumbers } from '../../utils/hijri';
import { SubTab } from './usePrayerManagerLogic';

interface PrayerManagerHeaderProps {
  activeSubTab: SubTab;
  setActiveSubTab: (tab: SubTab) => void;
  totalQadaCount: number;
  logSuccessMessage: string;
}

export const PrayerManagerHeader: React.FC<PrayerManagerHeaderProps> = ({
  activeSubTab,
  setActiveSubTab,
  totalQadaCount,
  logSuccessMessage,
}) => {
  const tabs = [
    { id: 'times' as SubTab, label: 'مواقيت الصلاة', icon: Clock },
    { 
      id: 'worship' as SubTab, 
      label: `سجل العبادات والفوائت ${totalQadaCount > 0 ? `(${toArabicNumbers(totalQadaCount)})` : ''}`, 
      icon: CheckCircle 
    },
  ];

  return (
    <div className="space-y-3">
      {/* Sleek, Space-Saving Top Navigation Sub-Tabs Bar */}
      <div 
        role="tablist" 
        aria-label="تبويبات إدارة ومواقيت الصلاة" 
        className="flex bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/40 dark:border-slate-700/50 overflow-x-auto scrollbar-none gap-0.5 shrink-0"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-label={tab.label}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-[11px] sm:text-xs font-black rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-white dark:bg-[#111720] text-indigo-600 dark:text-indigo-400 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Success Toast Message */}
      {logSuccessMessage && (
        <div 
          role="status"
          aria-live="polite"
          className="p-3 bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse justify-center"
        >
          <CheckCircle className="w-4.5 h-4.5 text-indigo-500" aria-hidden="true" />
          <span>{logSuccessMessage}</span>
        </div>
      )}
    </div>
  );
};

export default PrayerManagerHeader;
