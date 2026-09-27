/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PrayerLog, PrayerName, FastingLog, QuranSession, QuranKhatma } from '../types';
import { getSevenStationsProgress, PrayerKey } from './adhkarCalc';
import { getDateFromPrayerDay, formatDateKey } from './prayerDayBoundary';

export interface ProgressTierInfo {
  tierLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  tierKey: 'gray' | 'bronze' | 'copper' | 'silver' | 'gold' | 'crystal' | 'luminous';
  title: string;
  shortLabel: string;
  badgeSymbol: string;
  minPercent: number;
  maxPercent: number;
  colorClasses: {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    glow: string;
    barGradient: string;
    iconColor: string;
  };
  quranQuote: string;
}

export const PROGRESS_TIERS_MAP: Record<number, ProgressTierInfo> = {
  0: {
    tierLevel: 0,
    tierKey: 'gray',
    title: 'لم يبدأ / قيد الانتظار ⚪',
    shortLabel: '0% قيد البداية',
    badgeSymbol: '⚪',
    minPercent: 0,
    maxPercent: 0,
    colorClasses: {
      bg: 'bg-slate-100 dark:bg-slate-800/60',
      text: 'text-slate-500 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700/60',
      badgeBg: 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/40 dark:border-slate-700',
      glow: 'shadow-none',
      barGradient: 'from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600',
      iconColor: 'text-slate-400'
    },
    quranQuote: 'وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ'
  },
  1: {
    tierLevel: 1,
    tierKey: 'bronze',
    title: 'وسام برونزي 🥉',
    shortLabel: 'برونزي (حتى 10%)',
    badgeSymbol: '🥉',
    minPercent: 0.1,
    maxPercent: 10,
    colorClasses: {
      bg: 'bg-amber-950/10 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-400',
      border: 'border-amber-700/30 dark:border-amber-600/30',
      badgeBg: 'bg-amber-800/15 text-amber-900 dark:text-amber-300 border border-amber-700/40 font-black',
      glow: 'shadow-amber-900/10',
      barGradient: 'from-amber-700 via-amber-600 to-amber-800',
      iconColor: 'text-amber-700'
    },
    quranQuote: 'إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ'
  },
  2: {
    tierLevel: 2,
    tierKey: 'copper',
    title: 'وسام نحاسي 🪙',
    shortLabel: 'نحاسي (10% - 25%)',
    badgeSymbol: '🪙',
    minPercent: 10.1,
    maxPercent: 25,
    colorClasses: {
      bg: 'bg-orange-950/10 dark:bg-orange-950/40',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-600/40 dark:border-orange-500/40',
      badgeBg: 'bg-orange-600/20 text-orange-950 dark:text-orange-200 border border-orange-500/50 font-black',
      glow: 'shadow-orange-700/15',
      barGradient: 'from-orange-600 via-amber-600 to-orange-700',
      iconColor: 'text-orange-600'
    },
    quranQuote: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا'
  },
  3: {
    tierLevel: 3,
    tierKey: 'silver',
    title: 'وسام فضي 🥈',
    shortLabel: 'فضي (25% - 50%)',
    badgeSymbol: '🥈',
    minPercent: 25.1,
    maxPercent: 50,
    colorClasses: {
      bg: 'bg-slate-200/60 dark:bg-slate-800/80',
      text: 'text-slate-900 dark:text-slate-100',
      border: 'border-slate-400/60 dark:border-slate-500/60',
      badgeBg: 'bg-slate-300/80 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-400 font-black shadow-xs',
      glow: 'shadow-slate-400/20',
      barGradient: 'from-slate-400 via-slate-300 to-slate-500 dark:from-slate-500 dark:via-slate-300 dark:to-slate-600',
      iconColor: 'text-slate-400'
    },
    quranQuote: 'وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ'
  },
  4: {
    tierLevel: 4,
    tierKey: 'gold',
    title: 'وسام ذهبي 🥇',
    shortLabel: 'ذهبي (50% - 75%)',
    badgeSymbol: '🥇',
    minPercent: 50.1,
    maxPercent: 75,
    colorClasses: {
      bg: 'bg-gradient-to-br from-amber-500/15 to-yellow-500/10 dark:from-amber-950/60 dark:to-yellow-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-400/70 dark:border-amber-500/60',
      badgeBg: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-sm border border-amber-300',
      glow: 'shadow-amber-500/25',
      barGradient: 'from-amber-500 via-yellow-400 to-amber-600',
      iconColor: 'text-amber-500'
    },
    quranQuote: 'فَاسْتَبِقُوا الْخَيْرَاتِ'
  },
  5: {
    tierLevel: 5,
    tierKey: 'crystal',
    title: 'تاج بلوري ناصع 💎',
    shortLabel: 'بلوري (75% - 100%)',
    badgeSymbol: '💎',
    minPercent: 75.1,
    maxPercent: 100,
    colorClasses: {
      bg: 'bg-gradient-to-br from-cyan-500/20 via-teal-500/15 to-emerald-500/20 dark:from-cyan-950/70 dark:to-teal-950/60',
      text: 'text-cyan-700 dark:text-cyan-300',
      border: 'border-cyan-400/80 dark:border-cyan-400/60',
      badgeBg: 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 text-white font-black shadow-md border border-cyan-200 animate-pulse',
      glow: 'shadow-cyan-500/35 shadow-lg',
      barGradient: 'from-cyan-400 via-teal-300 to-emerald-400',
      iconColor: 'text-cyan-400'
    },
    quranQuote: 'أُولَٰئِكَ هُمُ السَّابِقُونَ 🌟 أُولَٰئِكَ الْمُقَرَّبُونَ'
  },
  6: {
    tierLevel: 6,
    tierKey: 'luminous',
    title: 'وسام مضيء متألق 🌟✨',
    shortLabel: 'مضيء (> 100%)',
    badgeSymbol: '🌟',
    minPercent: 100.1,
    maxPercent: 9999,
    colorClasses: {
      bg: 'bg-gradient-to-r from-purple-900/30 via-emerald-900/30 to-amber-900/30 dark:from-purple-950/80 dark:via-emerald-950/80 dark:to-amber-950/80',
      text: 'text-amber-600 dark:text-amber-200',
      border: 'border-amber-400/80 dark:border-amber-300/80',
      badgeBg: 'bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 text-slate-950 font-black shadow-xl border-2 border-yellow-200 animate-bounce',
      glow: 'shadow-[0_0_20px_rgba(250,204,21,0.6)]',
      barGradient: 'from-amber-400 via-emerald-400 to-cyan-400 animate-pulse',
      iconColor: 'text-amber-300'
    },
    quranQuote: 'لِّلَّذِينَ أَحْسَنُوا الْحُسْنَىٰ وَزِيَادَةٌ ✨'
  }
};

export function getProgressTier(percentage: number): ProgressTierInfo {
  if (percentage <= 0) return PROGRESS_TIERS_MAP[0];
  if (percentage <= 10) return PROGRESS_TIERS_MAP[1];
  if (percentage <= 25) return PROGRESS_TIERS_MAP[2];
  if (percentage <= 50) return PROGRESS_TIERS_MAP[3];
  if (percentage <= 75) return PROGRESS_TIERS_MAP[4];
  if (percentage <= 100) return PROGRESS_TIERS_MAP[5];
  return PROGRESS_TIERS_MAP[6];
}

export interface ProgressItemData {
  id: 'salah' | 'sunnah' | 'adhkar' | 'fasting' | 'quran';
  title: string;
  categoryName: string;
  icon: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  percentage: number; // calculated raw
  displayPercentage: number; // bounded or exact percentage
  isCappedAt100: boolean; // Fard prayers cap at 100%
  tier: ProgressTierInfo;
  detailText: string;
  onTimeValue?: number;
  lateValue?: number;
  onTimePercentage?: number;
  latePercentage?: number;
}

export interface UnifiedPeriodProgress {
  period: 'daily' | 'weekly' | 'monthly';
  items: ProgressItemData[];
  overallPercentage: number;
  overallTier: ProgressTierInfo;
}

// Helper to format Arabic date YYYY-MM-DD
export function getFormattedDateStr(d: Date = new Date()): string {
  if (!d || isNaN(d.getTime())) {
    d = new Date();
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Helper to get array of past N dates strings
export function getPastNDates(n: number, endDate: Date = new Date()): string[] {
  const safeEndDate = (endDate && !isNaN(endDate.getTime())) ? endDate : new Date();
  const list: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(safeEndDate);
    d.setDate(d.getDate() - i);
    list.push(getFormattedDateStr(d));
  }
  return list;
}

interface CalculateProgressParams {
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  fastingLogs: Record<string, { date: string; fasted: boolean; fastType: string }>;
  dhikrLogs: Record<string, Record<string, number>>;
  quranSessions?: QuranSession[];
  khatmat?: QuranKhatma[];
  isWomenExcuse?: boolean;
  effectiveDateStr?: string;
  latitude?: number;
  longitude?: number;
  calcMethod?: string;
  madhab?: 'standard' | 'hanafi';
  prayerOffsets?: Record<string, number>;
}

export function calculateUnifiedProgress({
  prayerLogs,
  fastingLogs,
  dhikrLogs,
  quranSessions = [],
  khatmat = [],
  isWomenExcuse = false,
  effectiveDateStr,
  latitude,
  longitude,
  calcMethod,
  madhab,
  prayerOffsets
}: CalculateProgressParams): Record<'daily' | 'weekly' | 'monthly', UnifiedPeriodProgress> {
  const todayStr = effectiveDateStr || formatDateKey(new Date());
  const targetDate = getDateFromPrayerDay(todayStr);
  const past7Days = getPastNDates(7, targetDate);
  const past30Days = getPastNDates(30, targetDate);

  const fiveDailyPrayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  // --- 1. SALAH (Obligatory Prayers - 5/day) ---
  const countFardPrayersDetailedForDate = (dateStr: string): { onTime: number; late: number; total: number } => {
    if (isWomenExcuse) return { onTime: 5, late: 0, total: 5 };
    const dateLogs = prayerLogs[dateStr] || {};
    let onTime = 0;
    let late = 0;
    fiveDailyPrayers.forEach(p => {
      const st = dateLogs[p]?.status;
      if (st === 'A' || st === 'E') onTime++;
      else if (st === 'B') late++;
    });
    return { onTime, late, total: onTime + late };
  };

  const dailyFardDetailed = countFardPrayersDetailedForDate(todayStr);
  const weeklyFardDetailed = past7Days.reduce(
    (acc, d) => {
      const res = countFardPrayersDetailedForDate(d);
      return { onTime: acc.onTime + res.onTime, late: acc.late + res.late, total: acc.total + res.total };
    },
    { onTime: 0, late: 0, total: 0 }
  );
  const monthlyFardDetailed = past30Days.reduce(
    (acc, d) => {
      const res = countFardPrayersDetailedForDate(d);
      return { onTime: acc.onTime + res.onTime, late: acc.late + res.late, total: acc.total + res.total };
    },
    { onTime: 0, late: 0, total: 0 }
  );

  const dailyFardCount = dailyFardDetailed.total;
  const weeklyFardCount = weeklyFardDetailed.total;
  const monthlyFardCount = monthlyFardDetailed.total;

  // --- 2. SUNNAH & NAWAFIL (12 rak'ahs target/day) ---
  const countSunnahRakahsForDate = (dateStr: string): number => {
    const dateLogs = prayerLogs[dateStr] || {};
    const rawatib = fiveDailyPrayers.reduce((sum, p) => {
      const log = dateLogs[p];
      return sum + (log?.sunnahBefore || 0) + (log?.sunnahAfter || 0);
    }, 0);
    const duha = dateLogs['Duha']?.status === 'A' ? (dateLogs['Duha']?.extraRakahs || 2) : 0;
    const qiyam = dateLogs['Qiyam']?.status === 'A' ? (dateLogs['Qiyam']?.extraRakahs || 2) : 0;
    const witr = dateLogs['Witr']?.status === 'A' ? (dateLogs['Witr']?.extraRakahs || 1) : 0;
    return rawatib + duha + qiyam + witr;
  };

  const dailySunnahRakahs = countSunnahRakahsForDate(todayStr);
  const weeklySunnahRakahs = past7Days.reduce((sum, d) => sum + countSunnahRakahsForDate(d), 0);
  const monthlySunnahRakahs = past30Days.reduce((sum, d) => sum + countSunnahRakahsForDate(d), 0);

  // --- 3. ADHKAR & REMEMBRANCE (7 core stations target/day) ---
  const countAdhkarStationsForDate = (dateStr: string): number => {
    const dayDhikr = dhikrLogs[dateStr] || {};
    const res = getSevenStationsProgress(dayDhikr, 'fajr');
    return res.completedStationsCount;
  };

  const dailyAdhkarCount = countAdhkarStationsForDate(todayStr);
  const weeklyAdhkarCount = past7Days.reduce((sum, d) => sum + countAdhkarStationsForDate(d), 0);
  const monthlyAdhkarCount = past30Days.reduce((sum, d) => sum + countAdhkarStationsForDate(d), 0);

  // --- 4. FASTING (Suggested days: 2 days/week on Mon/Thu or White Days) ---
  const isFastedDate = (dateStr: string): boolean => {
    return fastingLogs[dateStr]?.fasted === true;
  };

  const dailyFastingCount = isFastedDate(todayStr) ? 1 : 0;
  const weeklyFastingCount = past7Days.filter(d => isFastedDate(d)).length;
  const monthlyFastingCount = past30Days.filter(d => isFastedDate(d)).length;

  // --- 5. QURAN (Daily page target calculated as of 12 AM start-of-day, locking daily goal) ---
  const countQuranPagesForDate = (dateStr: string): number => {
    const daySessions = quranSessions.filter(s => s.date === dateStr);
    const total = daySessions.reduce((sum, s) => {
      if (s.unitType === 'pages') return sum + (s.unitValue || 0);
      if (s.unitType === 'juz') return sum + ((s.unitValue || 0) * 20);
      if (s.unitType === 'surah') return sum + 5;
      return sum;
    }, 0);
    return Math.max(0, total);
  };

  const dailyQuranPages = countQuranPagesForDate(todayStr);
  const weeklyQuranPages = past7Days.reduce((sum, d) => sum + countQuranPagesForDate(d), 0);
  const monthlyQuranPages = past30Days.reduce((sum, d) => sum + countQuranPagesForDate(d), 0);

  const activeKhatma = khatmat.find(k => k.status === 'active');
  let dailyQuranGoal = 4;
  if (activeKhatma) {
    const start = new Date(activeKhatma.startDate);
    const now = new Date();
    start.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(1, activeKhatma.durationDays - diffDays);
    // Page count at the start of today (before today's logged pages)
    const currentPageAtStartOfDay = Math.max(0, activeKhatma.currentPage - dailyQuranPages);
    const remainingPagesAtStartOfDay = Math.max(0, activeKhatma.totalPages - currentPageAtStartOfDay);
    dailyQuranGoal = Math.max(1, Math.ceil(remainingPagesAtStartOfDay / daysRemaining));
  }

  // Build structure for period
  const buildPeriod = (
    periodKey: 'daily' | 'weekly' | 'monthly',
    multiplier: number, // 1 for daily, 7 for weekly, 30 for monthly
    salahDetailed: { onTime: number; late: number; total: number },
    sunnahVal: number,
    adhkarVal: number,
    fastingVal: number,
    quranVal: number
  ): UnifiedPeriodProgress => {
    // Targets
    const salahTarget = 5 * multiplier;
    const sunnahTarget = 12 * multiplier;
    const adhkarTarget = 7 * multiplier;
    const fastingTarget = Math.max(1, Math.round(2 * (multiplier / 7))); // 1 day for daily (if fasting), 2 days for weekly, 8 for monthly
    const quranTarget = dailyQuranGoal * multiplier;

    const salahVal = salahDetailed.total;
    const salahOnTimeVal = salahDetailed.onTime;
    const salahLateVal = salahDetailed.late;

    // Percentages
    const salahPct = Math.min(100, Math.round((salahVal / salahTarget) * 100)); // Capped at 100%
    const salahOnTimePct = Math.min(100, Math.round((salahOnTimeVal / salahTarget) * 100));
    const salahLatePct = Math.min(100, Math.round((salahLateVal / salahTarget) * 100));

    const sunnahPct = Math.round((sunnahVal / sunnahTarget) * 100); // Uncapped!
    const adhkarPct = Math.round((adhkarVal / adhkarTarget) * 100); // Uncapped!
    const fastingPct = periodKey === 'daily' 
      ? (salahVal > 0 && fastingVal > 0 ? 100 : fastingVal > 0 ? 100 : 0)
      : Math.round((fastingVal / fastingTarget) * 100); // Uncapped!
    const quranPct = Math.round((quranVal / quranTarget) * 100); // Uncapped!

    const salahDetailText = `${salahVal} من ${salahTarget} صلاة`;

    const items: ProgressItemData[] = [
      {
        id: 'salah',
        title: 'الصلوات المفروضة',
        categoryName: 'الصلاة',
        icon: '🕌',
        currentValue: salahVal,
        targetValue: salahTarget,
        unit: 'صلوات',
        percentage: salahPct,
        displayPercentage: Math.min(100, salahPct),
        isCappedAt100: true,
        tier: getProgressTier(salahPct),
        detailText: salahDetailText,
        onTimeValue: salahOnTimeVal,
        lateValue: salahLateVal,
        onTimePercentage: salahOnTimePct,
        latePercentage: salahLatePct
      },
      {
        id: 'sunnah',
        title: 'السنن والنوافل',
        categoryName: 'السنن',
        icon: '✨',
        currentValue: sunnahVal,
        targetValue: sunnahTarget,
        unit: 'ركعات',
        percentage: sunnahPct,
        displayPercentage: sunnahPct,
        isCappedAt100: false,
        tier: getProgressTier(sunnahPct),
        detailText: `${sunnahVal} من ${sunnahTarget} ركعة`
      },
      {
        id: 'adhkar',
        title: 'الأذكار والأوراد',
        categoryName: 'الأذكار',
        icon: '📿',
        currentValue: adhkarVal,
        targetValue: adhkarTarget,
        unit: 'محطات',
        percentage: adhkarPct,
        displayPercentage: adhkarPct,
        isCappedAt100: false,
        tier: getProgressTier(adhkarPct),
        detailText: `${adhkarVal} من ${adhkarTarget} محطة`
      },
      {
        id: 'fasting',
        title: 'الصيام وتطوع الأيام',
        categoryName: 'الصيام',
        icon: '🌙',
        currentValue: fastingVal,
        targetValue: fastingTarget,
        unit: 'أيام',
        percentage: fastingPct,
        displayPercentage: fastingPct,
        isCappedAt100: false,
        tier: getProgressTier(fastingPct),
        detailText: periodKey === 'daily' ? (fastingVal > 0 ? 'صائم اليوم' : 'غير صائم') : `${fastingVal} من ${fastingTarget} أيام`
      },
      {
        id: 'quran',
        title: 'القرآن الكريم',
        categoryName: 'القرآن',
        icon: '📖',
        currentValue: quranVal,
        targetValue: quranTarget,
        unit: 'صفحات',
        percentage: quranPct,
        displayPercentage: quranPct,
        isCappedAt100: false,
        tier: getProgressTier(quranPct),
        detailText: `${quranVal} من ${quranTarget} صفحة`
      }
    ];

    // Overall Average calculation
    const overallPercentage = Math.round((salahPct + Math.min(100, sunnahPct) + Math.min(100, adhkarPct) + Math.min(100, fastingPct) + Math.min(100, quranPct)) / 5);
    const overallTier = getProgressTier(overallPercentage);

    return {
      period: periodKey,
      items,
      overallPercentage,
      overallTier
    };
  };

  return {
    daily: buildPeriod('daily', 1, dailyFardDetailed, dailySunnahRakahs, dailyAdhkarCount, dailyFastingCount, dailyQuranPages),
    weekly: buildPeriod('weekly', 7, weeklyFardDetailed, weeklySunnahRakahs, weeklyAdhkarCount, weeklyFastingCount, weeklyQuranPages),
    monthly: buildPeriod('monthly', 30, monthlyFardDetailed, monthlySunnahRakahs, monthlyAdhkarCount, monthlyFastingCount, monthlyQuranPages)
  };
}
