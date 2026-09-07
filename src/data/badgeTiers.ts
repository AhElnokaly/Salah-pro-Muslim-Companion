/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BadgeTierInfo {
  tierLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  tierKey: 'gray' | 'bronze' | 'copper' | 'silver' | 'gold' | 'crystal' | 'luminous';
  title: string;
  shortLabel: string;
  percentageThreshold: number;
  colorClasses: {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    glow: string;
    iconColor: string;
  };
  quranQuote: string;
}

export const BADGE_TIERS_MAP: Record<number, BadgeTierInfo> = {
  0: {
    tierLevel: 0,
    tierKey: 'gray',
    title: 'لم يبدأ / قيد الانتظار ⚪',
    shortLabel: '0% قيد البداية',
    percentageThreshold: 0,
    colorClasses: {
      bg: 'bg-slate-100 dark:bg-slate-800/60',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700',
      badgeBg: 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      glow: 'shadow-none',
      iconColor: 'text-slate-400',
    },
    quranQuote: 'وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ',
  },
  1: {
    tierLevel: 1,
    tierKey: 'bronze',
    title: 'وسام برونزي 🥉',
    shortLabel: 'برونزي (حتى 10%)',
    percentageThreshold: 0.1,
    colorClasses: {
      bg: 'bg-amber-950/10 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-400',
      border: 'border-amber-700/30 dark:border-amber-600/30',
      badgeBg: 'bg-amber-800/15 text-amber-900 dark:text-amber-300 border border-amber-700/40 font-black',
      glow: 'shadow-amber-900/10',
      iconColor: 'text-amber-700',
    },
    quranQuote: 'إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ',
  },
  2: {
    tierLevel: 2,
    tierKey: 'copper',
    title: 'وسام نحاسي 🪙',
    shortLabel: 'نحاسي (10% - 25%)',
    percentageThreshold: 10,
    colorClasses: {
      bg: 'bg-orange-950/10 dark:bg-orange-950/40',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-600/40 dark:border-orange-500/40',
      badgeBg: 'bg-orange-600/20 text-orange-950 dark:text-orange-200 border border-orange-500/50 font-black',
      glow: 'shadow-orange-700/15',
      iconColor: 'text-orange-600',
    },
    quranQuote: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا',
  },
  3: {
    tierLevel: 3,
    tierKey: 'silver',
    title: 'وسام فضي 🥈',
    shortLabel: 'فضي (25% - 50%)',
    percentageThreshold: 25,
    colorClasses: {
      bg: 'bg-slate-200/50 dark:bg-slate-800/80',
      text: 'text-slate-800 dark:text-slate-200',
      border: 'border-slate-400/50 dark:border-slate-600',
      badgeBg: 'bg-slate-300/80 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-400 font-black',
      glow: 'shadow-slate-400/20',
      iconColor: 'text-slate-300',
    },
    quranQuote: 'وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ',
  },
  4: {
    tierLevel: 4,
    tierKey: 'gold',
    title: 'وسام ذهبي 🥇',
    shortLabel: 'ذهبي (50% - 75%)',
    percentageThreshold: 50,
    colorClasses: {
      bg: 'bg-gradient-to-br from-amber-500/15 to-yellow-500/10 dark:from-amber-950/60 dark:to-yellow-950/40',
      text: 'text-amber-600 dark:text-amber-300',
      border: 'border-amber-400/60 dark:border-amber-500/50',
      badgeBg: 'bg-amber-400/30 text-amber-900 dark:text-amber-200 border border-amber-400 font-black',
      glow: 'shadow-amber-500/20',
      iconColor: 'text-amber-500',
    },
    quranQuote: 'فَاسْتَبِقُوا الْخَيْرَاتِ',
  },
  5: {
    tierLevel: 5,
    tierKey: 'crystal',
    title: 'تاج بلوري ناصع 💎',
    shortLabel: 'بلوري (75% - 100%)',
    percentageThreshold: 75,
    colorClasses: {
      bg: 'bg-gradient-to-br from-cyan-500/20 via-teal-500/15 to-emerald-500/20 dark:from-cyan-950/70 dark:to-teal-950/60',
      text: 'text-cyan-600 dark:text-cyan-300',
      border: 'border-cyan-400/80 dark:border-cyan-400/60',
      badgeBg: 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-black shadow-md border border-cyan-300 animate-pulse',
      glow: 'shadow-cyan-500/30 shadow-lg',
      iconColor: 'text-cyan-400',
    },
    quranQuote: 'أُولَٰئِكَ هُمُ السَّابِقُونَ 🌟 أُولَٰئِكَ الْمُقَرَّبُونَ',
  },
  6: {
    tierLevel: 6,
    tierKey: 'luminous',
    title: 'وسام مضيء متألق 🌟✨',
    shortLabel: 'مضيء (> 100%)',
    percentageThreshold: 100.1,
    colorClasses: {
      bg: 'bg-gradient-to-r from-purple-900/30 via-emerald-900/30 to-amber-900/30 dark:from-purple-950/80 dark:via-emerald-950/80 dark:to-amber-950/80',
      text: 'text-amber-600 dark:text-amber-200',
      border: 'border-amber-400/80 dark:border-amber-300/80',
      badgeBg: 'bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 text-slate-950 font-black shadow-xl border-2 border-yellow-200 animate-bounce',
      glow: 'shadow-[0_0_20px_rgba(250,204,21,0.6)]',
      iconColor: 'text-amber-300',
    },
    quranQuote: 'لِّلَّذِينَ أَحْسَنُوا الْحُسْنَىٰ وَزِيَادَةٌ ✨',
  },
};

export function getBadgeTierForRate(rate: number, completionCount: number = 0): BadgeTierInfo {
  if (rate > 100) return BADGE_TIERS_MAP[6];
  if (rate >= 75) return BADGE_TIERS_MAP[5];
  if (rate >= 50) return BADGE_TIERS_MAP[4];
  if (rate >= 25) return BADGE_TIERS_MAP[3];
  if (rate >= 10) return BADGE_TIERS_MAP[2];
  if (rate > 0) return BADGE_TIERS_MAP[1];
  return BADGE_TIERS_MAP[0];
}
