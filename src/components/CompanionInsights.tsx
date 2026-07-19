/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, TrendingUp, Heart, Award, Calendar, AlertCircle } from 'lucide-react';
import { PrayerLog, QuranSession, QuranKhatma, AppSettings } from '../types';
import { toArabicNumbers, formatArabicDayCount } from '../utils/hijri';

interface CompanionInsightsProps {
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  fastingLogs: Record<string, { date: string; fasted: boolean; fastType: string }>;
  dhikrLogs?: Record<string, Record<string, number>>;
  quranSessions?: QuranSession[];
  khatmat?: QuranKhatma[];
  settings: AppSettings;
}

export default function CompanionInsights({
  prayerLogs,
  fastingLogs,
  dhikrLogs = {},
  quranSessions = [],
  khatmat = [],
  settings,
}: CompanionInsightsProps) {
  const isDarkTheme = settings.theme === 'dark' || 
    ((!settings.theme || settings.theme === 'system') && 
     window.matchMedia('(prefers-color-scheme: dark)').matches);
  const currentStyle = isDarkTheme ? 'glass-dark' : 'faith-bright';

  // Helper to calculate various stats
  const getInsights = () => {
    const today = new Date();
    const insightsList: string[] = [];
    let positiveHighlight = '';
    let totalPrayersLogged = 0;
    let onTimeCount = 0;
    let totalSunnahs = 0;
    let totalTasbeeh = 0;

    // Get last 30 days dates
    const last30Days: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      last30Days.push(d.toISOString().split('T')[0]);
    }

    // 1. Analyze Prayer logs
    last30Days.forEach(dateStr => {
      const dayLog = prayerLogs[dateStr];
      if (dayLog) {
        Object.entries(dayLog).forEach(([pName, log]) => {
          if (pName !== 'Duha' && pName !== 'Qiyam' && pName !== 'Witr') {
            totalPrayersLogged++;
            if (log.status === 'A') onTimeCount++;
          }
          totalSunnahs += (log.sunnahBefore || 0) + (log.sunnahAfter || 0);
        });
      }
    });

    // 2. Analyze Tasbeeh logs
    Object.values(dhikrLogs).forEach(dayLogs => {
      Object.values(dayLogs).forEach(count => {
        totalTasbeeh += count;
      });
    });

    // 3. Fajr special streak or callout
    let fajrOnTimeStreak = 0;
    for (const dateStr of last30Days.slice(0, 7)) {
      const dayLog = prayerLogs[dateStr];
      if (dayLog && dayLog['Fajr'] && dayLog['Fajr'].status === 'A') {
        fajrOnTimeStreak++;
      } else {
        break;
      }
    }

    if (fajrOnTimeStreak >= 3) {
      insightsList.push(`ما شاء الله! حافظت على صلاة الفجر في وقتها لـ ${formatArabicDayCount(fajrOnTimeStreak)} متتالية مؤخراً. ثبتك الله وبارك في همتك! 🌅`);
    }

    // 4. Sunnah rawatib callout
    if (totalSunnahs > 10) {
      insightsList.push(`السنن الرواتب تزيد صلاتك نوراً وجبراً. صليت ${toArabicNumbers(totalSunnahs)} ركعة سنة راتبة خلال الـ ٣٠ يوماً الأخيرة! ✨`);
    }

    // 5. Quran sessions callout
    const recentQuranRead = quranSessions.filter(s => {
      const diffTime = Math.abs(today.getTime() - new Date(s.date).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && s.sessionType === 'read';
    });

    const pagesReadInLast7Days = recentQuranRead.reduce((sum, s) => {
      if (s.unitType === 'pages') return sum + s.unitValue;
      if (s.unitType === 'juz') return sum + s.unitValue * 20;
      if (s.unitType === 'surah') return sum + 5;
      return sum;
    }, 0);

    if (pagesReadInLast7Days > 0) {
      insightsList.push(`أحسنت! تلوت ${toArabicNumbers(pagesReadInLast7Days)} صفحة من كتاب الله خلال الأيام السبعة الماضية. تلاوة هادئة تغذي الروح 📖`);
    } else {
      insightsList.push('القرآن ربيع القلوب، ولو تلاوة صفحة واحدة يومياً. ما رأيك بورد خفيف اليوم يربت على قلبك؟ ❤️');
    }

    // 6. Fasting callout
    let fastingDaysCount = 0;
    Object.values(fastingLogs).forEach(log => {
      if (log.fasted) fastingDaysCount++;
    });

    if (fastingDaysCount > 0) {
      insightsList.push(`أكرمك الله! صمت ${toArabicNumbers(fastingDaysCount)} يوماً (فرضاً أو نفلاً) مسجلاً بالتطبيق. هنيئاً لك باب الريان! 🌙`);
    }

    // Tasbeeh highlight
    if (totalTasbeeh > 100) {
      positiveHighlight = `رطب لسانك بذكر الله وتجاوزت تسبحاتك المحفوظة ${toArabicNumbers(totalTasbeeh)} مرة! 📿`;
    } else {
      positiveHighlight = 'خطوات صغيرة مستمرة تصنع فارقاً روحياً عظيماً. المساعد هنا ليحتفل بتقدمك بهدوء ودون أدنى ضغط.';
    }

    // Filter list to keep it neat
    const filteredInsights = insightsList.filter(Boolean).slice(0, 3);
    if (filteredInsights.length === 0) {
      filteredInsights.push('أهلاً بك في رفيقك الروحي اليومي. بمجرد تسجيل عباداتك اليومية بهدوء، سيقوم المساعد بتحليل تقدمك بلطف وتقديم لفتات تزيدك همة 🤍');
    }

    return {
      insights: filteredInsights,
      positiveHighlight,
      onTimePercent: totalPrayersLogged > 0 ? Math.round((onTimeCount / totalPrayersLogged) * 100) : null,
      totalSunnahs,
      totalTasbeeh
    };
  };

  const { insights, positiveHighlight, onTimePercent, totalSunnahs, totalTasbeeh } = getInsights();

  return (
    <div 
      id="companion-insights-root" 
      className={`rounded-3xl p-5 border transition-all duration-300 space-y-4 text-right ${
        currentStyle === 'glass-dark'
          ? 'bg-[#111723]/90 backdrop-blur-md border-white/5 shadow-2xl text-slate-200'
          : 'bg-white border-[#e2e8f0] shadow-md text-slate-800'
      }`}
    >
      <div className="flex justify-between items-center pb-2 border-b border-slate-200/40 dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white leading-none">مساعدك الروحي الذكي</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">لفتات وتأملات إيمانية مبنية على عاداتك بهدوء</p>
          </div>
        </div>
      </div>

      {/* Main motivational line */}
      <div className="p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30 text-xs leading-relaxed text-emerald-900 dark:text-emerald-200">
        <p className="font-semibold">{positiveHighlight}</p>
      </div>

      {/* Small bullet list of custom observations */}
      <div className="space-y-2.5">
        {insights.map((insight, idx) => (
          <div 
            key={idx} 
            className={`p-3 rounded-2xl border flex gap-3 items-start transition-colors ${
              currentStyle === 'glass-dark'
                ? 'bg-white/[0.01] border-white/[0.04]'
                : 'bg-slate-50/50 border-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
              {insight}
            </p>
          </div>
        ))}
      </div>

      {/* Beautiful Progress Mini Dashboard */}
      {(onTimePercent !== null || totalSunnahs > 0 || totalTasbeeh > 0) && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          {onTimePercent !== null && (
            <div className={`p-2.5 rounded-2xl text-center border ${
              currentStyle === 'glass-dark' ? 'bg-slate-950/30 border-white/5' : 'bg-slate-50 border-slate-100'
            }`}>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold mb-0.5">الصلوات في وقتها</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                %{toArabicNumbers(onTimePercent)}
              </span>
            </div>
          )}
          <div className={`p-2.5 rounded-2xl text-center border ${
            currentStyle === 'glass-dark' ? 'bg-slate-950/30 border-white/5' : 'bg-slate-50 border-slate-100'
          }`}>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold mb-0.5">إجمالي السنن</span>
            <span className="text-sm font-black text-amber-500 dark:text-amber-400 font-mono">
              {toArabicNumbers(totalSunnahs)} ركعة
            </span>
          </div>
          <div className={`p-2.5 rounded-2xl text-center border ${
            currentStyle === 'glass-dark' ? 'bg-slate-950/30 border-white/5' : 'bg-slate-50 border-slate-100'
          }`}>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold mb-0.5">إجمالي التسببيح</span>
            <span className="text-sm font-black text-indigo-500 dark:text-indigo-400 font-mono">
              {toArabicNumbers(totalTasbeeh)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
