/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Heart, 
  Award, 
  Calendar, 
  ChevronLeft, 
  Clock, 
  Compass, 
  CheckCircle2, 
  Circle, 
  RotateCcw, 
  Volume2, 
  Zap,
  Bot,
  BookOpen,
  Check,
  Flame,
  Copy,
  Trophy
} from 'lucide-react';
import { PrayerLog, QuranSession, QuranKhatma, AppSettings } from '../types';
import { toArabicNumbers, formatArabicDayCount } from '../utils/hijri';

interface CompanionInsightsProps {
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  fastingLogs: Record<string, { date: string; fasted: boolean; fastType: string }>;
  dhikrLogs?: Record<string, Record<string, number>>;
  quranSessions?: QuranSession[];
  khatmat?: QuranKhatma[];
  settings: AppSettings;
  isFridayWindow?: boolean;
  onNavigateTab?: (tab: string) => void;
}

interface SpiritualMoodOption {
  id: string;
  name: string;
  icon: string;
  dhikrText: string;
  rewardText: string;
  suggestedActionText: string;
  targetTab: string;
}

const SPIRITUAL_MOODS: SpiritualMoodOption[] = [
  {
    id: 'tranquility',
    name: 'راحة البال والسكينة',
    icon: '🕊️',
    dhikrText: 'أَلا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    rewardText: 'سورة الرعد: الذكر أسرع مخرج لضيق الصدر وحيرة البال.',
    suggestedActionText: 'دقيقة طمأنينة وتأمل 🕊️',
    targetTab: 'adhkar'
  },
  {
    id: 'relief',
    name: 'تيسير وتفريج الهموم',
    icon: '⚡',
    dhikrText: 'لاَّ إِلَهَ إِلاَّ أَنتَ سُبْحَانَكِ إِنِّي كُنتُ مِنَ الظَّالِمِينَ',
    rewardText: 'دعوة ذي النون: لم يدعُ بها مسلم في كرب إلا فرج الله عنه.',
    suggestedActionText: 'بدء ورد التسبيح 📿',
    targetTab: 'adhkar'
  },
  {
    id: 'quran_light',
    name: 'هداية وورد القرآن',
    icon: '📖',
    dhikrText: 'وَقُرْآنَ الْفَجْرِ ۖ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا',
    rewardText: 'تلاوة آية بتدبر خير من قيام ليلة بلا تفكر.',
    suggestedActionText: 'فتح المصحف الشريف 📖',
    targetTab: 'quran'
  },
  {
    id: 'rizq_barakah',
    name: 'بركة وتوسيع الرزق',
    icon: '🌿',
    dhikrText: 'فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا',
    rewardText: 'سورة نوح: الاستغفار مجلبة للرزق والبركة في المال والولد.',
    suggestedActionText: 'تكرار الاستغفار الآن 🤍',
    targetTab: 'adhkar'
  },
  {
    id: 'forgiveness',
    name: 'تجديد العهد والاستغفار',
    icon: '🤍',
    dhikrText: 'اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ خَلَقْتَنِي...',
    rewardText: 'سيد الاستغفار: من قالها موقناً بها ومات في يومه دخل الجنة.',
    suggestedActionText: 'تلاوة سيد الاستغفار 🌟',
    targetTab: 'adhkar'
  },
  {
    id: 'night_qiyam',
    name: 'خشوع وقيام الليل',
    icon: '🌙',
    dhikrText: 'وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَّكَ',
    rewardText: 'قيام الليل شرف المؤمن ونورٌ في الوجه وهدوء في النفس.',
    suggestedActionText: 'صفحة الخشوع وقيام الليل 🕌',
    targetTab: 'khushu'
  }
];

export default function CompanionInsights({
  prayerLogs,
  fastingLogs,
  dhikrLogs = {},
  quranSessions = [],
  khatmat = [],
  settings,
  isFridayWindow = false,
  onNavigateTab
}: CompanionInsightsProps) {
  const isDarkTheme = settings.theme === 'dark' || 
    ((!settings.theme || settings.theme === 'system') && 
     window.matchMedia('(prefers-color-scheme: dark)').matches);
  const currentStyle = isDarkTheme ? 'glass-dark' : 'faith-bright';

  // Selected spiritual mood state
  const [selectedMoodId, setSelectedMoodId] = useState<string>('tranquility');

  // 1-Minute Quiet Meditation Timer State
  const [showQuietMode, setShowQuietMode] = useState<boolean>(false);
  const [quietTimerSeconds, setQuietTimerSeconds] = useState<number>(60);
  const [isQuietTimerRunning, setIsQuietTimerRunning] = useState<boolean>(false);
  const [quietDhikrCount, setQuietDhikrCount] = useState<number>(0);

  // Micro Daily Habits Checklist State
  const [completedMicroHabits, setCompletedMicroHabits] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('companion_micro_habits_today');
      const todayKey = new Date().toISOString().split('T')[0];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayKey) {
          return new Set(parsed.completed);
        }
      }
    } catch (e) {}
    return new Set();
  });

  // Save micro habits to local storage
  const toggleMicroHabit = (id: string) => {
    setCompletedMicroHabits(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (navigator.vibrate) navigator.vibrate(25);
      }
      const todayKey = new Date().toISOString().split('T')[0];
      localStorage.setItem('companion_micro_habits_today', JSON.stringify({
        date: todayKey,
        completed: Array.from(next)
      }));
      return next;
    });
  };

  // Timer Effect for 1-Minute Contemplation
  useEffect(() => {
    let interval: any = null;
    if (isQuietTimerRunning && quietTimerSeconds > 0) {
      interval = setInterval(() => {
        setQuietTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (quietTimerSeconds === 0) {
      setIsQuietTimerRunning(false);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
    return () => clearInterval(interval);
  }, [isQuietTimerRunning, quietTimerSeconds]);

  const handleStartQuietTimer = () => {
    setQuietTimerSeconds(60);
    setQuietDhikrCount(0);
    setIsQuietTimerRunning(true);
  };

  const handleQuietDhikrTap = () => {
    if (!isQuietTimerRunning && quietTimerSeconds === 60) {
      setIsQuietTimerRunning(true);
    }
    setQuietDhikrCount(prev => prev + 1);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  // Helper to calculate general stats
  const getInsights = () => {
    const today = new Date();
    let totalPrayersLogged = 0;
    let onTimeCount = 0;
    let totalSunnahs = 0;
    let totalTasbeeh = 0;

    const last30Days: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      last30Days.push(d.toISOString().split('T')[0]);
    }

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

    Object.values(dhikrLogs).forEach(dayLogs => {
      Object.values(dayLogs).forEach(count => {
        totalTasbeeh += count;
      });
    });

    return {
      onTimePercent: totalPrayersLogged > 0 ? Math.round((onTimeCount / totalPrayersLogged) * 100) : null,
      totalSunnahs,
      totalTasbeeh
    };
  };

  const { onTimePercent, totalSunnahs, totalTasbeeh } = getInsights();
  const currentMood = SPIRITUAL_MOODS.find(m => m.id === selectedMoodId) || SPIRITUAL_MOODS[0];

  const MICRO_DAILY_HABITS = [
    { id: 'h_fajr_sunnah', title: 'سنة الفجر (خير من الدنيا)', category: 'sunnah' },
    { id: 'h_ayath_kursi', title: 'آية الكرسي دبر الصلاة', category: 'dhikr' },
    { id: 'h_salawat', title: 'الصلاة على النبي (١٠ مرات)', category: 'dhikr' },
    { id: 'h_quran_page', title: 'تلاوة صفحة من المصحف', category: 'quran' },
  ];

  return (
    <div 
      id="companion-insights-root" 
      className={`rounded-2xl p-4 border transition-all duration-300 space-y-4 text-right overflow-hidden ${
        currentStyle === 'glass-dark'
          ? 'bg-[#111723]/95 backdrop-blur-md border-white/10 shadow-xl text-slate-200'
          : 'bg-white border-slate-200/80 shadow-xs text-slate-800'
      }`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/70">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl shrink-0 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
            <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white leading-tight truncate">
                المساعد الروحي الذكي
              </h3>
              {isFridayWindow ? (
                <span className="text-[8.5px] px-1.5 py-0.2 rounded-full font-bold border shrink-0 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                  بركات الجمعة 🕌
                </span>
              ) : (
                <span className="text-[8.5px] px-1.5 py-0.2 rounded-full font-bold border shrink-0 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                  محلي 100%
                </span>
              )}
            </div>
            <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 truncate">
              إرشادات مخصصة لسكينة وطمأنينة قلبك
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isFridayWindow && (
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('friday-mode-root');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="py-1 px-2 bg-emerald-50 text-emerald-700 border border-emerald-300 text-[9.5px] font-extrabold rounded-lg transition-all cursor-pointer hover:bg-emerald-100"
            >
              جدول الجمعة 🕌
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowQuietMode(!showQuietMode)}
            className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black rounded-lg border border-emerald-200/70 dark:border-emerald-800/60 transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
          >
            <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>طمأنينة 🕊️</span>
          </button>
        </div>
      </div>

      {/* FRIDAY SPIRITUAL NUDGE BANNER */}
      {isFridayWindow && (
        <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-between gap-2 text-right">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <div>
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 block leading-tight">
                نفحات يوم الجمعة المبارك
              </span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold block mt-0.5">
                الصلاة على النبي ﷺ وقراءة سورة الكهف وتحري ساعة الاستجابة.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('friday-mode-root');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1"
          >
            <span>جدول السنن</span>
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 1-MINUTE QUIET MEDITATION MODE */}
      {showQuietMode && (
        <div className="p-4 bg-gradient-to-br from-emerald-900/95 via-slate-900 to-indigo-950 text-white rounded-xl border border-emerald-500/30 shadow-lg space-y-3 text-center relative overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[11px] font-black text-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>دقيقة طمأنينة وتأمل إيماني</span>
            </span>

            <button
              type="button"
              onClick={() => setShowQuietMode(false)}
              className="text-[10px] text-slate-300 hover:text-white font-bold cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/10"
            >
              إغلاق ✕
            </button>
          </div>

          <div className="py-1 space-y-2">
            <p className="text-sm font-black text-emerald-100 leading-snug">
              «أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ»
            </p>
            <p className="text-[10px] text-slate-300">
              اضغط على الدائرة مع كل تسبيحة بهدوء وخشوع.
            </p>

            <div className="flex flex-col items-center justify-center py-1">
              <button
                type="button"
                onClick={handleQuietDhikrTap}
                className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-90 shadow-lg ${
                  isQuietTimerRunning
                    ? 'border-emerald-400 bg-emerald-600/30 shadow-emerald-500/20 animate-pulse'
                    : 'border-slate-600 bg-slate-800/50'
                }`}
              >
                <span className="text-xl font-black font-mono text-emerald-300">
                  {toArabicNumbers(quietDhikrCount)}
                </span>
                <span className="text-[9px] text-emerald-200 font-bold">
                  {quietTimerSeconds > 0 ? `${toArabicNumbers(quietTimerSeconds)}ث` : 'تمت!'}
                </span>
              </button>
            </div>

            <div className="flex justify-center gap-2">
              {!isQuietTimerRunning ? (
                <button
                  type="button"
                  onClick={handleStartQuietTimer}
                  className="py-1.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[10px] rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {quietTimerSeconds === 0 ? 'إعادة 🔄' : 'بدء المؤقت ⏱️'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsQuietTimerRunning(false)}
                  className="py-1.5 px-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                >
                  إيقاف مؤقت ⏸️
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GENERAL SPIRITUAL MOODS & INSIGHTS VIEW */}
      <div className="space-y-3.5">
          {/* SPIRITUAL MOOD / NEED SELECTOR */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>اختر حاجتك أو شعورك الإيماني الآن:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {SPIRITUAL_MOODS.map((mood) => {
                const isSelected = selectedMoodId === mood.id;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => setSelectedMoodId(mood.id)}
                    className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-start gap-1.5 border text-right leading-tight ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-1 ring-indigo-400/30 font-black'
                        : 'bg-slate-50/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                    }`}
                  >
                    <span className="text-sm shrink-0">{mood.icon}</span>
                    <span className="truncate">{mood.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SELECTED MOOD DYNAMIC ADVICE & ACTION CARD */}
          <div className="p-3.5 bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-emerald-50/50 dark:from-indigo-950/50 dark:via-purple-950/30 dark:to-emerald-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-indigo-100/80 dark:border-indigo-900/50 pb-2">
              <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                <span className="text-sm">{currentMood.icon}</span>
                <span>توجيه مبارك لـ {currentMood.name}</span>
              </span>

              <span className="text-[9px] text-indigo-700 dark:text-indigo-300 font-extrabold bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/50">
                سُنّة وتنزيل
              </span>
            </div>

            <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-relaxed text-center py-0.5 font-serif">
              «{currentMood.dhikrText}»
            </p>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal flex items-start gap-1 bg-white/60 dark:bg-slate-900/40 p-2 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30">
              <span className="shrink-0">💡</span>
              <span className="font-semibold">{currentMood.rewardText}</span>
            </p>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab(currentMood.targetTab)}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{currentMood.suggestedActionText}</span>
                <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>

          {/* MICRO DAILY HABITS CHECKLIST */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/70">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>عاداتك الإيمانية السريعة ({toArabicNumbers(completedMicroHabits.size)} / {toArabicNumbers(MICRO_DAILY_HABITS.length)}):</span>
              </span>

              {completedMicroHabits.size === MICRO_DAILY_HABITS.length && (
                <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-800">
                  أكملت التاج اليومي! 🏆
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {MICRO_DAILY_HABITS.map((habit) => {
                const isDone = completedMicroHabits.has(habit.id);
                return (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => toggleMicroHabit(habit.id)}
                    className={`p-2 rounded-lg text-right text-[11px] transition-all cursor-pointer flex items-center gap-2 border ${
                      isDone
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70 font-bold'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={`truncate ${isDone ? 'line-through opacity-80' : ''}`}>
                      {habit.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STATS MINI DASHBOARD */}
          {(onTimePercent !== null || totalSunnahs > 0 || totalTasbeeh > 0) && (
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/70">
              {onTimePercent !== null && (
                <div className={`p-2 rounded-xl text-center border ${
                  currentStyle === 'glass-dark' ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50/80 border-slate-100'
                }`}>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold mb-0.5">في وقتها</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    %{toArabicNumbers(onTimePercent)}
                  </span>
                </div>
              )}
              <div className={`p-2 rounded-xl text-center border ${
                currentStyle === 'glass-dark' ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50/80 border-slate-100'
              }`}>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold mb-0.5">إجمالي السنن</span>
                <span className="text-xs font-black text-amber-500 dark:text-amber-400 font-mono">
                  {toArabicNumbers(totalSunnahs)} ركعة
                </span>
              </div>
              <div className={`p-2 rounded-xl text-center border ${
                currentStyle === 'glass-dark' ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-100'
              }`}>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold mb-0.5">إجمالي التسبيح</span>
                <span className="text-xs font-black text-indigo-500 dark:text-indigo-400 font-mono">
                  {toArabicNumbers(totalTasbeeh)}
                </span>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
