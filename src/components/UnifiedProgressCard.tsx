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
  ProgressItemData, 
  ProgressTierInfo, 
  UnifiedPeriodProgress 
} from '../utils/progressEngine';
import BadgesShowcaseModal from './BadgesShowcaseModal';
import { PrayerLog, QuranSession, QuranKhatma } from '../types';
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
}

export default function UnifiedProgressCard({
  prayerLogs,
  fastingLogs,
  dhikrLogs,
  quranSessions = [],
  khatmat = [],
  isWomenExcuse = false,
  onNavigateTab,
  appStyle = 'faith-bright'
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
    isWomenExcuse
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
        <div className="flex items-center justify-between gap-1 pt-3 pb-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 w-full sm:w-auto">
            <button
              type="button"
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

          <span className="hidden md:inline-block text-[11px] font-mono font-black text-emerald-600 dark:text-emerald-400 shrink-0">
            معدل اليوم: {toArabicNumbers(dailyProgress.overallPercentage)}%
          </span>
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

// Single Circular Progress Item Card Component
interface ProgressCircularItemProps {
  key?: React.Key;
  item: ProgressItemData;
  isDark: boolean;
  onNavigateTab?: (tab: string) => void;
}

function CircularProgressRing({
  percentage,
  tier,
  icon
}: {
  percentage: number;
  tier: ProgressTierInfo;
  icon: string;
}) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius; // 94.24778
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  const strokeColorMap: Record<number, string> = {
    0: 'stroke-slate-300 dark:stroke-slate-700',
    1: 'stroke-amber-700 dark:stroke-amber-600',
    2: 'stroke-orange-600 dark:stroke-orange-500',
    3: 'stroke-slate-400 dark:stroke-slate-300',
    4: 'stroke-amber-400 dark:stroke-amber-400',
    5: 'stroke-cyan-400 dark:stroke-cyan-300',
    6: 'stroke-purple-400 dark:stroke-amber-300'
  };

  const strokeClass = strokeColorMap[tier.tierLevel] || 'stroke-emerald-500';

  return (
    <div className="relative w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 flex items-center justify-center shrink-0 my-0.5">
      <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 36 36">
        {/* Background Track Circle */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          className="stroke-slate-200/80 dark:stroke-slate-800"
          strokeWidth="3"
          fill="transparent"
        />
        {/* Animated Progress Circle */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          className={`${strokeClass} transition-all duration-1000 ease-out`}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      {/* Icon and percentage in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-0.5 pointer-events-none">
        <span className="text-[11px] xs:text-xs sm:text-base leading-none drop-shadow-xs">{icon}</span>
        <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black font-mono text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
          {toArabicNumbers(percentage)}%
        </span>
      </div>
    </div>
  );
}

function ProgressRowItem({ item, isDark, onNavigateTab }: ProgressCircularItemProps) {
  const tier: ProgressTierInfo = item.tier;

  const handleClick = () => {
    if (!onNavigateTab) return;
    if (item.id === 'salah' || item.id === 'sunnah') onNavigateTab('salah');
    else if (item.id === 'adhkar') onNavigateTab('adhkar');
    else if (item.id === 'fasting') onNavigateTab('fasting');
    else if (item.id === 'quran') onNavigateTab('quran');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`p-1 sm:p-2.5 rounded-2xl sm:rounded-3xl border transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer group flex flex-col items-center justify-between text-center relative overflow-hidden shadow-xs focus:outline-none w-full ${
        isDark ? 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]' : 'bg-slate-50/90 border-slate-200/80 hover:bg-white hover:shadow-md'
      }`}
    >
      {/* Top Badge Pill */}
      <div className={`px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black flex items-center justify-center gap-0.5 shadow-2xs ${tier.colorClasses.badgeBg} ${tier.colorClasses.glow}`}>
        <span className="text-[9px]">{tier.badgeSymbol}</span>
        <span className="text-[8px] font-bold">{tier.shortLabel.split(' ')[0]}</span>
      </div>

      {/* Responsive SVG Circular Ring */}
      <CircularProgressRing
        percentage={item.percentage}
        tier={tier}
        icon={item.icon}
      />

      {/* Titles & Details */}
      <div className="space-y-0.5 w-full flex flex-col items-center justify-center text-center">
        <h4 className="text-[10.5px] xs:text-[11.5px] sm:text-xs font-black text-slate-900 dark:text-slate-100 leading-tight">
          {item.categoryName}
        </h4>
        <p className="text-[8.5px] xs:text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-tight whitespace-nowrap">
          {item.detailText}
        </p>
      </div>
    </button>
  );
}
