/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PrayerLog, QuranSession, FastingLog } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';

interface WorshipProgressHubProps {
  statsPeriod: 'weekly' | 'monthly';
  setStatsPeriod: (period: 'weekly' | 'monthly') => void;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  fastingLogs: Record<string, FastingLog>;
  dhikrLogs: Record<string, Record<string, number>>;
  quranSessions: QuranSession[];
}

export default function WorshipProgressHub({
  statsPeriod,
  setStatsPeriod,
  prayerLogs,
  fastingLogs,
  dhikrLogs,
  quranSessions
}: WorshipProgressHubProps) {
  const periodDays = statsPeriod === 'weekly' ? 7 : 30;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  // Generate dates in the range
  const dates: string[] = [];
  for (let i = 0; i < periodDays; i++) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }

  // 1. Prayer stats
  const totalPrayersPossible = periodDays * 5;
  let prayersDone = 0;
  dates.forEach(dateStr => {
    const dayLog = prayerLogs[dateStr] || {};
    const prayers: ('Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha')[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    prayers.forEach(p => {
      const log = dayLog[p];
      if (log && (log.status === 'A' || log.status === 'B')) {
        prayersDone++;
      }
    });
  });
  const prayerPercent = totalPrayersPossible > 0 ? Math.round((prayersDone / totalPrayersPossible) * 100) : 0;

  // 2. Quran pages read
  let quranPages = 0;
  const startDate = new Date();
  startDate.setDate(now.getDate() - periodDays);
  quranSessions.forEach(session => {
    const sessionDate = new Date(session.date);
    if (sessionDate >= startDate) {
      if (session.unitType === 'pages') {
        quranPages += session.unitValue || 0;
      } else if (session.unitType === 'juz') {
        quranPages += (session.unitValue || 0) * 20;
      } else if (session.unitType === 'surah') {
        quranPages += 5;
      }
    }
  });

  // 3. Dhikr counts
  let totalDhikr = 0;
  dates.forEach(dateStr => {
    const dayLog = dhikrLogs[dateStr] || {};
    Object.values(dayLog).forEach(count => {
      totalDhikr += count;
    });
  });

  // 4. Fasting days
  let fastingDays = 0;
  dates.forEach(dateStr => {
    const dayLog = fastingLogs[dateStr];
    if (dayLog && dayLog.fasted) {
      fastingDays++;
    }
  });

  const hasNoActivity = prayersDone === 0 && quranPages === 0 && totalDhikr === 0 && fastingDays === 0;

  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-5 transition-colors duration-300 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/40 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📈</span>
          <div className="text-end">
            <h3 className="text-sm font-black text-slate-800 dark:text-white leading-none">مؤشر التقدم والعبادات</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">حصاد طاعاتك ودرجة التزامك بالأوراد</p>
          </div>
        </div>

        {/* Segmented Period Switcher */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-0.5 rounded-xl flex">
          <button
            type="button"
            onClick={() => setStatsPeriod('weekly')}
            className={`py-1 px-3 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
              statsPeriod === 'weekly'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            أسبوعي
          </button>
          <button
            type="button"
            onClick={() => setStatsPeriod('monthly')}
            className={`py-1 px-3 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
              statsPeriod === 'monthly'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            شهري
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Prayers */}
        <div className="p-3 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/10 dark:border-emerald-900/20 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">الصلوات المفروضة</span>
            <span className="text-sm">🕌</span>
          </div>
          <div>
            <div className="text-lg font-black text-slate-800 dark:text-white font-mono">
              {toArabicNumbers(prayersDone)} / {toArabicNumbers(totalPrayersPossible)}
            </div>
            <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 mt-1">
              معدل الالتزام: {toArabicNumbers(prayerPercent)}%
            </div>
          </div>
        </div>

        {/* Quran */}
        <div className="p-3 bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/10 dark:border-amber-900/20 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-amber-700 dark:text-amber-400">قراءة القرآن الكريم</span>
            <span className="text-sm">📖</span>
          </div>
          <div>
            <div className="text-lg font-black text-slate-800 dark:text-white font-mono">
              {toArabicNumbers(quranPages)} <span className="text-xs font-bold font-sans">صفحة</span>
            </div>
            <div className="text-[9px] font-bold text-amber-600 dark:text-amber-500 mt-1">
              خلال آخر {statsPeriod === 'weekly' ? '٧ أيام' : '٣٠ يوماً'}
            </div>
          </div>
        </div>

        {/* Adhkar */}
        <div className="p-3 bg-purple-500/5 dark:bg-purple-950/10 border border-purple-500/10 dark:border-purple-900/20 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-purple-700 dark:text-purple-400">الأذكار والتسابيح</span>
            <span className="text-sm">📿</span>
          </div>
          <div>
            <div className="text-lg font-black text-slate-800 dark:text-white font-mono">
              {toArabicNumbers(totalDhikr)} <span className="text-xs font-bold font-sans">ذكر</span>
            </div>
            <div className="text-[9px] font-bold text-purple-600 dark:text-purple-500 mt-1">
              إجمالي تكرارات الذكر
            </div>
          </div>
        </div>

        {/* Fasting */}
        <div className="p-3 bg-sky-500/5 dark:bg-sky-950/10 border border-sky-500/10 dark:border-sky-900/20 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-sky-700 dark:text-sky-400">صيام التطوع والفرض</span>
            <span className="text-sm">🌙</span>
          </div>
          <div>
            <div className="text-lg font-black text-slate-800 dark:text-white font-mono">
              {toArabicNumbers(fastingDays)} <span className="text-xs font-bold font-sans">{fastingDays === 1 ? 'يوم' : fastingDays === 2 ? 'يومان' : 'أيام'}</span>
            </div>
            <div className="text-[9px] font-bold text-sky-600 dark:text-sky-500 mt-1">
              تقبل الله طاعاتكم
            </div>
          </div>
        </div>
      </div>

      {/* Encouraging non-judgmental prompt */}
      <div className="p-3 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 text-[10px] leading-relaxed font-semibold text-indigo-900 dark:text-indigo-200">
        {hasNoActivity ? (
          <span>
            💡 <b>بداية جديدة مباركة!</b> ابدأ بتسجيل صلواتك وقراءتك للقرآن اليوم لتشاهد حصاد التزامك ينمو هنا يوماً بعد يوم بهدوء وتوفيق 🤍
          </span>
        ) : (
          <span>
            🌟 <b>ما شاء الله!</b> طاعات مستمرة مباركة. الاستمرار على العمل وإن قلّ هو أحب الأعمال إلى الله، وخطواتك المتزنة تصنع فارقاً عظيماً في قلبك ويومك 🤲
          </span>
        )}
      </div>
    </div>
  );
}
