/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Calendar, 
  Flame, 
  ShieldCheck, 
  ArrowLeft,
  Info,
  CheckCircle2
} from 'lucide-react';
import { 
  calculateUnifiedProgress, 
  UnifiedPeriodProgress 
} from '../utils/progressEngine';
import BadgesShowcaseModal from './BadgesShowcaseModal';
import { ProgressRowItem } from './progress/ProgressRowItem';
import { PrayerLog, QuranSession, QuranKhatma, AppSettings } from '../types';
import { toArabicNumbers } from '../utils/hijri';

interface UnifiedProgressCardProps {
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  fastingLogs: Record<string, { date: string; fasted: boolean; fastType: string }>;
  dhikrLogs: Record<string, Record<string, number>>;
  quranSessions?: QuranSession[];
  khatmat?: QuranKhatma[];
  isWomenExcuse?: boolean;
  onNavigateTab?: (tab: string) => void;
  appStyle?: 'glass-dark' | 'faith-bright';
  settings?: AppSettings;
}

export default function UnifiedProgressCard({
  prayerLogs,
  fastingLogs,
  dhikrLogs,
  quranSessions = [],
  khatmat = [],
  isWomenExcuse = false,
  onNavigateTab,
  appStyle = 'faith-bright',
  settings
}: UnifiedProgressCardProps) {
  const [activePeriod, setActivePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('daily');
  const [showBadgesModal, setShowBadgesModal] = useState(false);

  // Compute unified progress metrics
  const progressData = calculateUnifiedProgress({
    prayerLogs,
    fastingLogs,
    dhikrLogs,
    quranSessions,
    khatmat,
    isWomenExcuse,
    latitude: settings?.latitude,
    longitude: settings?.longitude,
    calcMethod: settings?.calcMethod,
    madhab: settings?.madhab,
    prayerOffsets: settings?.prayerOffsets,
  });

  const dailyProgress = progressData.daily;
  const weeklyProgress = progressData.weekly;
  const monthlyProgress = progressData.monthly;

  const isDark = appStyle === 'glass-dark';

  return (
    <div id="unified-progress-section" className="w-full space-y-4 font-sans" dir="rtl">
      
      {/* Primary Card Container */}
      <div className={`rounded-3xl p-3.5 sm:p-5 border transition-all duration-300 shadow-md relative overflow-hidden ${
        isDark
          ? 'bg-[#111723]/90 backdrop-blur-md border-white/10 text-slate-100 shadow-2xl'
          : 'bg-white border-slate-200/80 text-slate-800 shadow-sm'
      }`}>
        
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -start-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header: Title, Overall Badge & Showcase Trigger */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200/50 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-lg sm:text-xl shadow-xs shrink-0 ${
              dailyProgress.overallTier.colorClasses.badgeBg
            }`}>
              {dailyProgress.overallTier.badgeSymbol}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                  مؤشر الإتقان والإنتاج الإيماني
                </h3>
                {isWomenExcuse && (
                  <span className="text-[9px] sm:text-[9.5px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold border border-purple-300 dark:border-purple-800">
                    رخصة العذر الشرعي 🌸
                  </span>
                )}
              </div>
              <p className="text-[9.5px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                متابعة الصلوات، السنن، الأذكار، الصيام والقرآن بالأوسمة والدوائر المضيئة
              </p>
            </div>
          </div>

          {/* Overall Badge & Badges Modal Button */}
          <button
            type="button"
            onClick={() => setShowBadgesModal(true)}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-2xl text-[10.5px] sm:text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 hover:scale-105 active:scale-95 ${
              dailyProgress.overallTier.colorClasses.badgeBg
            } ${dailyProgress.overallTier.colorClasses.glow}`}
            title="افتح معرض الأوسمة والبادجات الإيمانية"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>{dailyProgress.overallTier.title}</span>
            <span className="text-[9.5px] bg-black/20 text-white px-1.5 py-0.2 rounded-lg font-mono">
              {toArabicNumbers(dailyProgress.overallPercentage)}%
            </span>
          </button>
        </div>

        {/* Period Selector Tabs (Daily, Weekly, Monthly, Show All) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 pb-1">
          <div role="tablist" aria-label="فترة الإنجاز" className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              type="button"
              role="tab"
              aria-selected={activePeriod === 'daily'}
              aria-label="عرض الإنجاز اليومي"
              onClick={() => setActivePeriod('daily')}
              className={`flex-1 sm:flex-none px-2.5 py-1 rounded-xl text-[10.5px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activePeriod === 'daily'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>☀️</span>
              <span>اليومي</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activePeriod === 'weekly'}
              aria-label="عرض الإنجاز الأسبوعي"
              onClick={() => setActivePeriod('weekly')}
              className={`flex-1 sm:flex-none px-2.5 py-1 rounded-xl text-[10.5px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activePeriod === 'weekly'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>📅</span>
              <span>الأسبوعي</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activePeriod === 'monthly'}
              aria-label="عرض الإنجاز الشهري"
              onClick={() => setActivePeriod('monthly')}
              className={`flex-1 sm:flex-none px-2.5 py-1 rounded-xl text-[10.5px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activePeriod === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🌙</span>
              <span>الشهري</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activePeriod === 'all'}
              aria-label="عرض الإنجاز الإجمالي للجميع"
              onClick={() => setActivePeriod('all')}
              className={`flex-1 sm:flex-none px-2.5 py-1 rounded-xl text-[10.5px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activePeriod === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>📊</span>
              <span>عرض الجميع</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-[9.5px] font-bold">
            {/* Prayer Status Dual Legend */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                حاضر
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-extrabold">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                صليتها متأخر ⏱️
              </span>
            </div>

            <span className="hidden md:inline-block text-[11px] font-mono font-black text-emerald-600 dark:text-emerald-400 shrink-0">
              معدل اليوم: {toArabicNumbers(dailyProgress.overallPercentage)}%
            </span>
          </div>
        </div>

        {/* PROGRESS SECTIONS */}
        <div className="space-y-4 pt-2">
          
          {/* 1. DAILY PROGRESS ROW */}
          {(activePeriod === 'daily' || activePeriod === 'all') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>التقدم اليومي (٥ عبادات أساسية):</span>
                </span>
                <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 sm:hidden">
                  المعدل: {toArabicNumbers(dailyProgress.overallPercentage)}%
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1 sm:gap-3">
                {dailyProgress.items.map((item) => (
                  <ProgressRowItem
                    key={item.id}
                    item={item}
                    isDark={isDark}
                    onNavigateTab={onNavigateTab}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. WEEKLY PROGRESS ROW */}
          {(activePeriod === 'weekly' || activePeriod === 'all') && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>📅 التقدم الأسبوعي التراكمي:</span>
                </span>
                <div className={`px-2 py-0.2 rounded-full text-[9px] font-black ${weeklyProgress.overallTier.colorClasses.badgeBg}`}>
                  <span>{weeklyProgress.overallTier.badgeSymbol} {weeklyProgress.overallTier.shortLabel}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1 sm:gap-3">
                {weeklyProgress.items.map((item) => (
                  <ProgressRowItem
                    key={`weekly-${item.id}`}
                    item={item}
                    isDark={isDark}
                    onNavigateTab={onNavigateTab}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 3. MONTHLY PROGRESS ROW */}
          {(activePeriod === 'monthly' || activePeriod === 'all') && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>🌙 التقدم الشهري (الهجري):</span>
                </span>
                <div className={`px-2 py-0.2 rounded-full text-[9px] font-black ${monthlyProgress.overallTier.colorClasses.badgeBg}`}>
                  <span>{monthlyProgress.overallTier.badgeSymbol} {monthlyProgress.overallTier.shortLabel}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1 sm:gap-3">
                {monthlyProgress.items.map((item) => (
                  <ProgressRowItem
                    key={`monthly-${item.id}`}
                    item={item}
                    isDark={isDark}
                    onNavigateTab={onNavigateTab}
                  />
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Badges Showcase Modal */}
      <BadgesShowcaseModal
        isOpen={showBadgesModal}
        onClose={() => setShowBadgesModal(false)}
        progressData={progressData}
        onNavigateTab={onNavigateTab}
      />

    </div>
  );
}

