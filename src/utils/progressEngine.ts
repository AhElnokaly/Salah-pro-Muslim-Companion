/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PrayerLog, QuranSession, QuranKhatma } from '../types';
import { formatDateKey, subtractDays } from './prayerDayBoundary';

export interface ProgressTierInfo {
  tierLevel: number;
  badgeSymbol: string;
  shortLabel: string;
  title?: string;
  colorClasses: {
    badgeBg: string;
    glow: string;
    text: string;
    stroke: string;
    trackStroke?: string;
    bg?: string;
    border?: string;
    barGradient?: string;
  };
}

export interface ProgressItemData {
  id: string;
  categoryName: string;
  percentage: number;
  detailText: string;
  icon: string;
  tier: ProgressTierInfo;
  lateValue?: number;
  onTimeValue?: number;
  onTimePercentage?: number;
  latePercentage?: number;
  title?: string;
}

export interface UnifiedPeriodProgress {
  overallPercentage: number;
  overallTier: ProgressTierInfo & { title: string };
  items: ProgressItemData[];
}

export const PROGRESS_TIERS_MAP: Record<string, ProgressTierInfo & { title: string }> = {
  perfect: {
    tierLevel: 6,
    badgeSymbol: '👑',
    shortLabel: 'مثالي',
    title: 'الإتقان المثالي 👑',
    colorClasses: {
      badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
      text: 'text-emerald-600 dark:text-emerald-400',
      stroke: 'stroke-emerald-500',
      trackStroke: 'stroke-emerald-500/20',
      bg: 'bg-emerald-500/10 dark:bg-emerald-950/30',
      border: 'border-emerald-500/30',
      barGradient: 'from-emerald-500 to-teal-400',
    },
  },
  crystal: {
    tierLevel: 5,
    badgeSymbol: '💎',
    shortLabel: 'ممتاز',
    title: 'المرتبة الكريستالية 💎',
    colorClasses: {
      badgeBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30',
      glow: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]',
      text: 'text-cyan-600 dark:text-cyan-400',
      stroke: 'stroke-cyan-500',
      trackStroke: 'stroke-cyan-500/20',
      bg: 'bg-cyan-500/10 dark:bg-cyan-950/30',
      border: 'border-cyan-500/30',
      barGradient: 'from-cyan-500 to-blue-500',
    },
  },
  gold: {
    tierLevel: 4,
    badgeSymbol: '⭐',
    shortLabel: 'جيد جداً',
    title: 'المرتبة الذهبية ⭐',
    colorClasses: {
      badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
      glow: 'shadow-[0_0_8px_rgba(245,158,11,0.25)]',
      text: 'text-amber-600 dark:text-amber-400',
      stroke: 'stroke-amber-400',
      trackStroke: 'stroke-amber-400/20',
      bg: 'bg-amber-500/10 dark:bg-amber-950/30',
      border: 'border-amber-500/30',
      barGradient: 'from-amber-400 to-yellow-500',
    },
  },
  silver: {
    tierLevel: 3,
    badgeSymbol: '🌱',
    shortLabel: 'جيد',
    title: 'المرتبة الفضية 🌱',
    colorClasses: {
      badgeBg: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/30',
      glow: 'shadow-xs',
      text: 'text-slate-600 dark:text-slate-300',
      stroke: 'stroke-slate-400',
      trackStroke: 'stroke-slate-400/20',
      bg: 'bg-slate-500/10 dark:bg-slate-800/40',
      border: 'border-slate-400/30',
      barGradient: 'from-slate-400 to-slate-500',
    },
  },
  bronze: {
    tierLevel: 2,
    badgeSymbol: '⚡',
    shortLabel: 'مقبول',
    title: 'المرتبة البرونزية ⚡',
    colorClasses: {
      badgeBg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30',
      glow: '',
      text: 'text-orange-600 dark:text-orange-400',
      stroke: 'stroke-orange-500',
      trackStroke: 'stroke-orange-500/20',
      bg: 'bg-orange-500/10 dark:bg-orange-950/30',
      border: 'border-orange-500/30',
      barGradient: 'from-orange-400 to-amber-600',
    },
  },
  initial: {
    tierLevel: 1,
    badgeSymbol: '⏳',
    shortLabel: 'بداية',
    title: 'بداية الانطلاق ⏳',
    colorClasses: {
      badgeBg: 'bg-amber-700/15 text-amber-700 dark:text-amber-600 border border-amber-700/30',
      glow: '',
      text: 'text-amber-700 dark:text-amber-600',
      stroke: 'stroke-amber-600',
      trackStroke: 'stroke-amber-600/20',
      bg: 'bg-amber-700/10 dark:bg-amber-950/20',
      border: 'border-amber-700/20',
      barGradient: 'from-amber-600 to-orange-700',
    },
  },
};

export function getProgressTier(percentage: number): ProgressTierInfo & { title: string } {
  const p = Math.max(0, Math.min(100, Math.round(percentage)));
  if (p >= 100) return PROGRESS_TIERS_MAP.perfect;
  if (p >= 80) return PROGRESS_TIERS_MAP.crystal;
  if (p >= 60) return PROGRESS_TIERS_MAP.gold;
  if (p >= 40) return PROGRESS_TIERS_MAP.silver;
  if (p >= 20) return PROGRESS_TIERS_MAP.bronze;
  return PROGRESS_TIERS_MAP.initial;
}

export interface CalculateUnifiedProgressOptions {
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  fastingLogs: Record<string, { date: string; fasted: boolean; fastType: string }>;
  dhikrLogs: Record<string, Record<string, number>>;
  quranSessions?: QuranSession[];
  khatmat?: QuranKhatma[];
  isWomenExcuse?: boolean;
  latitude?: number;
  longitude?: number;
  calcMethod?: string;
  madhab?: string;
  prayerOffsets?: any;
}

const PRAYER_KEYS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function computePeriodProgress(
  daysCount: number,
  options: CalculateUnifiedProgressOptions
): UnifiedPeriodProgress {
  const { prayerLogs, fastingLogs, dhikrLogs, quranSessions = [], isWomenExcuse = false } = options;

  const now = new Date();
  const dateKeys: string[] = [];
  for (let i = 0; i < daysCount; i++) {
    dateKeys.push(formatDateKey(subtractDays(now, i)));
  }

  // 1. Five Obligatory Prayers
  let onTimePrayers = 0;
  let latePrayers = 0;
  const totalExpectedPrayers = daysCount * 5;

  for (const dk of dateKeys) {
    const dayLog = prayerLogs[dk] || {};
    for (const pk of PRAYER_KEYS) {
      const p = dayLog[pk];
      if (p?.status === 'A' || p?.status === 'done') {
        onTimePrayers++;
      } else if (p?.status === 'B') {
        latePrayers++;
      } else if (p?.status === 'E') {
        onTimePrayers++;
      }
    }
  }

  const completedPrayers = onTimePrayers + latePrayers;
  let prayerPercentage = isWomenExcuse
    ? 100
    : totalExpectedPrayers > 0
    ? Math.min(100, Math.round((completedPrayers / totalExpectedPrayers) * 100))
    : 0;

  const onTimePct = totalExpectedPrayers > 0 ? Math.round((onTimePrayers / totalExpectedPrayers) * 100) : 0;
  const latePct = totalExpectedPrayers > 0 ? Math.round((latePrayers / totalExpectedPrayers) * 100) : 0;

  const salahItem: ProgressItemData = {
    id: 'salah',
    categoryName: 'الصلوات الخمس',
    percentage: prayerPercentage,
    detailText: `${completedPrayers}/${totalExpectedPrayers} صلاة`,
    icon: '🕌',
    tier: getProgressTier(prayerPercentage),
    onTimeValue: onTimePrayers,
    lateValue: latePrayers,
    onTimePercentage: onTimePct,
    latePercentage: latePct,
    title: 'الصلوات المكتوبة',
  };

  // 2. Sunnah & Voluntary Prayers
  let completedSunnah = 0;
  const targetSunnah = daysCount * 12; // 12 Rawatib daily target
  for (const dk of dateKeys) {
    const dayLog = prayerLogs[dk] || {};
    for (const [k, v] of Object.entries(dayLog)) {
      if (!PRAYER_KEYS.includes(k) && (v?.status === 'A' || v?.status === 'done' || (v?.status as any) === 'prayed')) {
        completedSunnah += (v?.extraRakahs || 2);
      }
    }
  }
  const sunnahPercentage = Math.min(100, Math.round((completedSunnah / Math.max(1, targetSunnah)) * 100));
  const sunnahItem: ProgressItemData = {
    id: 'sunnah',
    categoryName: 'السنن والرواتب',
    percentage: sunnahPercentage,
    detailText: `${completedSunnah} ركعة وسنة`,
    icon: '✨',
    tier: getProgressTier(sunnahPercentage),
    onTimeValue: completedSunnah,
    lateValue: 0,
    onTimePercentage: sunnahPercentage,
    latePercentage: 0,
    title: 'السنن والنوافل',
  };

  // 3. Adhkar
  let totalDhikrCount = 0;
  const targetDhikr = daysCount * 100;
  for (const dk of dateKeys) {
    const dayDhikr = dhikrLogs[dk] || {};
    for (const count of Object.values(dayDhikr)) {
      if (typeof count === 'number') totalDhikrCount += count;
    }
  }
  const dhikrPercentage = Math.min(100, Math.round((totalDhikrCount / Math.max(1, targetDhikr)) * 100));
  const dhikrItem: ProgressItemData = {
    id: 'dhikr',
    categoryName: 'الأذكار اليومية',
    percentage: dhikrPercentage,
    detailText: `${totalDhikrCount} ذكر وتسبيح`,
    icon: '📿',
    tier: getProgressTier(dhikrPercentage),
    onTimeValue: totalDhikrCount,
    lateValue: 0,
    onTimePercentage: dhikrPercentage,
    latePercentage: 0,
    title: 'الأوراد والأذكار',
  };

  // 4. Fasting
  let fastedDays = 0;
  for (const dk of dateKeys) {
    if (fastingLogs[dk]?.fasted) fastedDays++;
  }
  const expectedFastDays = daysCount === 1 ? 1 : Math.max(1, Math.round(daysCount * (2 / 7))); // ~2 days/week
  const fastingPercentage = Math.min(100, Math.round((fastedDays / expectedFastDays) * 100));
  const fastingItem: ProgressItemData = {
    id: 'fasting',
    categoryName: 'الصيام المبارك',
    percentage: fastingPercentage,
    detailText: `${fastedDays} يوم صيام`,
    icon: '🌾',
    tier: getProgressTier(fastingPercentage),
    onTimeValue: fastedDays,
    lateValue: 0,
    onTimePercentage: fastingPercentage,
    latePercentage: 0,
    title: 'صيام الفرض والنفل',
  };

  // 5. Quran Reading
  let quranPages = 0;
  const targetPages = daysCount * 4; // 4 pages daily target
  for (const sess of quranSessions) {
    if (dateKeys.includes(sess.date)) {
      const val = (sess as any).pagesRead || (sess.unitType === 'pages' ? sess.unitValue : (sess.unitType === 'juz' ? sess.unitValue * 20 : sess.unitValue)) || 0;
      quranPages += val;
    }
  }
  const quranPercentage = Math.min(100, Math.round((quranPages / Math.max(1, targetPages)) * 100));
  const quranItem: ProgressItemData = {
    id: 'quran',
    categoryName: 'القرآن الكريم',
    percentage: quranPercentage,
    detailText: `${quranPages} صفحة مقروءة`,
    icon: '📖',
    tier: getProgressTier(quranPercentage),
    onTimeValue: quranPages,
    lateValue: 0,
    onTimePercentage: quranPercentage,
    latePercentage: 0,
    title: 'الورد القرآني',
  };

  const items = [salahItem, sunnahItem, dhikrItem, fastingItem, quranItem];
  const overallPercentage = Math.round(
    items.reduce((acc, it) => acc + it.percentage, 0) / items.length
  );
  const overallTier = getProgressTier(overallPercentage);

  return {
    overallPercentage,
    overallTier,
    items,
  };
}

export function calculateUnifiedProgress(options: CalculateUnifiedProgressOptions): {
  daily: UnifiedPeriodProgress;
  weekly: UnifiedPeriodProgress;
  monthly: UnifiedPeriodProgress;
} {
  return {
    daily: computePeriodProgress(1, options),
    weekly: computePeriodProgress(7, options),
    monthly: computePeriodProgress(30, options),
  };
}
