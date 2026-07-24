/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  Flame, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Clock, 
  Heart, 
  Share2, 
  ChevronLeft,
  Copy,
  CheckCircle2,
  Trophy
} from 'lucide-react';
import { AppSettings } from '../types';
import { toArabicNumbers } from '../utils/hijri';

interface FridayModeProps {
  settings: AppSettings;
  todayPrayerTimes?: Record<string, string>;
  onNavigateTab?: (tab: string) => void;
}

const FRIDAY_DUAS = [
  'اللَّهُمَّ فِي يَوْمِ الْجُمُعَةِ ارْحَمْ مَوْتَانَا، وَاشْفِ مَرْضَانَا، وَفَرِّجْ هُمُومَنَا، وَاغْفِرْ لَنَا وَلِوَالِدَيْنَا.',
  'اللَّهُمَّ آتِ نُفُوسَنَا تَقْوَاهَا، وَزَكِّهَا أَنْتَ خَيْرُ مَنْ زَكَّاهَا، أَنْتَ وَلِيُّهَا وَمَوْلاَهَا.',
  'اللَّهُمَّ اكْفِنَا بِحَلاَلِكَ عَنْ حَرَامِكَ، وَأَغْنِنَا بِفَضْلِكَ عَمَّنْ سِوَاكَ، وَاهْدِنَا لِأَحْسَنِ الأَخْلاَقِ.',
  'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ.'
];

export default function FridayMode({ settings, todayPrayerTimes, onNavigateTab }: FridayModeProps) {
  const isDarkTheme = settings.theme === 'dark' || 
    ((!settings.theme || settings.theme === 'system') && 
     window.matchMedia('(prefers-color-scheme: dark)').matches);
  const currentStyle = isDarkTheme ? 'glass-dark' : 'faith-bright';
  
  // State for Friday checklist
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('mc_friday_checklist');
    const savedDate = localStorage.getItem('mc_friday_checklist_date');
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (saved && savedDate === todayStr) {
      return JSON.parse(saved);
    }
    return {
      ghusl: false,
      perfume: false,
      kahf: false,
      early: false,
      dua: false,
    };
  });

  // Salawat counter state
  const [salawatCount, setSalawatCount] = useState<number>(() => {
    const saved = localStorage.getItem('mc_friday_salawat_count');
    const savedDate = localStorage.getItem('mc_friday_salawat_date');
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (saved && savedDate === todayStr) {
      return parseInt(saved) || 0;
    }
    return 0;
  });

  const [salawatGoal, setSalawatGoal] = useState<number>(300);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mc_friday_sound') !== 'false';
  });

  const [copiedDuaIndex, setCopiedDuaIndex] = useState<number | null>(null);

  // Save checklist
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('mc_friday_checklist', JSON.stringify(checklist));
    localStorage.setItem('mc_friday_checklist_date', todayStr);
  }, [checklist]);

  // Save salawat count
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('mc_friday_salawat_count', salawatCount.toString());
    localStorage.setItem('mc_friday_salawat_date', todayStr);
  }, [salawatCount]);

  // Save sound setting
  useEffect(() => {
    localStorage.setItem('mc_friday_sound', soundEnabled.toString());
  }, [soundEnabled]);

  const handleToggleCheck = (key: string) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    if (soundEnabled) {
      playSubtleClick();
    }
  };

  const playSubtleClick = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}
  };

  const handleIncrementSalawat = () => {
    setSalawatCount(prev => prev + 1);
    
    if (soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // C6
        osc.frequency.exponentialRampToValueAtTime(1318.5, audioCtx.currentTime + 0.12); // E6
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {}
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  const handleCopyDua = (duaText: string, index: number) => {
    navigator.clipboard.writeText(duaText);
    setCopiedDuaIndex(index);
    setTimeout(() => setCopiedDuaIndex(null), 2000);
  };

  // Determine encouragement based on count
  const getEncouragement = () => {
    if (salawatCount >= 1000) return 'تبارك الرحمن! من المقرّبين مجلساً يوم القيامة ﷺ 👑';
    if (salawatCount >= 500) return 'يا له من نور ساطع! صلوات تسرّ الخاطر ﷺ 🌟';
    if (salawatCount >= 300) return 'رائع جداً! حققت هدف الجمعة ونور طريقك بالصلاة عليه ﷺ ✨';
    if (salawatCount >= 100) return 'متاحة ومباركة! مائة صلاة ترفعك مائة درجة ﷺ 🤍';
    if (salawatCount >= 50) return 'ما شاء الله، رطب الله لسانك وقلبك بالصلاة والسلام ﷺ';
    return 'صلّ عليه لتُكفى همك ويُغفر ذنبك ﷺ';
  };

  const isTodayFriday = new Date().getDay() === 5;

  // Calculate Sunnah Checklist Progress
  const totalItems = 5;
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const completionPercentage = Math.round((completedCount / totalItems) * 100);

  // Hour of Acceptance check
  const now = new Date();
  const currentHour = now.getHours();
  const isHourOfAcceptanceTime = isTodayFriday && currentHour >= 16 && currentHour < 19;

  return (
    <div 
      id="friday-mode-root" 
      className={`rounded-3xl p-6 border relative overflow-hidden transition-all duration-300 space-y-6 text-right ${
        currentStyle === 'glass-dark'
          ? 'bg-gradient-to-br from-[#1b3c22] via-[#111723] to-[#122216] border-emerald-500/20 shadow-2xl text-slate-100'
          : 'bg-gradient-to-br from-[#f4faf5] via-white to-[#f0f8f2] border-emerald-500/30 shadow-md text-slate-800'
      }`}
    >
      {/* Background Decorative Element */}
      <div className="absolute top-2 left-3 select-none opacity-20 pointer-events-none">
        <span className="text-4xl">🕌</span>
      </div>

      {/* Header section */}
      <div className="flex justify-between items-start pb-3 border-b border-emerald-500/15">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h3 className="text-lg font-black text-emerald-700 dark:text-emerald-400">
              {isTodayFriday ? 'يوم الجمعة المبارك 🌟' : 'معاينة أجواء سنن يوم الجمعة 🌟'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
            «إن من أفضل أيامكم يوم الجمعة، فأكثروا عليّ من الصلاة فيه...»
          </p>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            currentStyle === 'glass-dark' 
              ? 'bg-white/5 border-white/5 text-slate-300' 
              : 'bg-slate-100 border-slate-200 text-slate-650'
          }`}
          title={soundEnabled ? 'كتم التنبيهات الصوتية' : 'تفعيل التنبيهات الصوتية'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {/* SURAH AL-KAHF FEATURED CARD */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md shrink-0">
            <BookOpen className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h4 className="text-sm font-black flex items-center gap-1.5">
              <span>سورة الكهف المباركة</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30">نور ما بين الجمعتين</span>
            </h4>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              {checklist['kahf'] ? 'تمت قراءتها اليوم بحمد الله ✓' : 'احرص على تلاوتها أو الاستماع إليها اليوم'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggleCheck('kahf')}
            className={`py-2 px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              checklist['kahf']
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{checklist['kahf'] ? 'تمت القراءة ✓' : 'تميلها كقراءة'}</span>
          </button>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('quran')}
              className="py-2 px-3.5 bg-white text-emerald-900 font-black text-xs rounded-xl shadow-sm hover:bg-emerald-50 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>فتح المصحف</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* HOUR OF ACCEPTANCE (ساعة الاستجابة) SPECIAL ALERT */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isHourOfAcceptanceTime 
          ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200 animate-pulse'
          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
      }`}>
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-black">
              {isHourOfAcceptanceTime ? '🤲 حانت الآن ساعة الاستجابة المباركة!' : '⏳ ساعة الاستجابة يوم الجمعة'}
            </h4>
          </div>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
            آخر ساعة قبل المغرب
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          «فِيهِ سَاعَةٌ لاَ يُوَافِقُهَا عَبْدٌ مُسْلِمٌ، وَهُوَ قَائِمٌ يُصَلِّي، يَسْأَلُ اللَّهَ تَعَالَى شَيْئًا، إِلاَّ أَعْطَاهُ إِيَّاهُ»
        </p>

        {/* Quick Duas List */}
        <div className="mt-3 space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 block">
            أدعية مأثورة جامعة لمساء يوم الجمعة:
          </span>

          <div className="grid grid-cols-1 gap-2">
            {FRIDAY_DUAS.map((dua, idx) => (
              <div 
                key={idx}
                className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs"
              >
                <p className="font-bold text-slate-800 dark:text-slate-200 leading-relaxed text-right flex-1 select-text">
                  {dua}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopyDua(dua, idx)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 cursor-pointer shrink-0 transition-colors"
                  title="نسخ الدعاء"
                >
                  {copiedDuaIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHECKLIST ITEMS WITH PROGRESS BAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>جدول سنن وآداب يوم الجمعة ({toArabicNumbers(completedCount)} / {toArabicNumbers(totalItems)}):</span>
          </span>

          <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
            %{toArabicNumbers(completionPercentage)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {[
            { key: 'ghusl', label: 'الاغتسال والتطهر السني', desc: 'غسل الجمعة سنة مؤكدة', emoji: '🛁' },
            { key: 'perfume', label: 'التطيب ولبس أحسن الثياب', desc: 'للرجل لشهود صلاة الجماعة', emoji: '🪔' },
            { key: 'kahf', label: 'قراءة سورة الكهف المباركة', desc: 'نور ما بين الجمعتين', emoji: '📖' },
            { key: 'early', label: 'التبكير لصلاة الجمعة', desc: 'أجر عظيم وفضل جزيل', emoji: '🚶‍♂️' },
            { key: 'dua', label: 'تحري ساعة الاستجابة', desc: 'آخر ساعة قبل المغرب', emoji: '🤲' },
          ].map((item) => {
            const isChecked = checklist[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleToggleCheck(item.key)}
                className={`p-3 rounded-2xl border text-right flex items-start gap-3 transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold'
                    : currentStyle === 'glass-dark'
                    ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                    : 'bg-white border-slate-200/60 hover:bg-slate-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  isChecked 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : 'border-slate-300 dark:border-slate-700'
                }`}>
                  {isChecked && <Check className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <span className="text-xs font-black block leading-none">
                    {item.emoji} {item.label}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-1">
                    {item.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PROPHET SALAWAT INTERACTIVE COUNTER WITH GOALS */}
      <div className={`p-5 rounded-3xl border text-center relative overflow-hidden transition-all ${
        currentStyle === 'glass-dark'
          ? 'bg-slate-950/40 border-white/5'
          : 'bg-emerald-500/5 border-emerald-500/10'
      }`}>
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="flex items-center justify-between w-full border-b border-emerald-500/10 pb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              عداد الصلاة على النبي ﷺ
            </span>

            {/* Goal selector */}
            <div className="flex gap-1">
              {[100, 300, 500, 1000].map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setSalawatGoal(goal)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    salawatGoal === goal
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {toArabicNumbers(goal)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-4xl md:text-5xl font-black text-amber-500 dark:text-amber-400 font-mono tracking-widest py-1">
            {toArabicNumbers(salawatCount)}
          </div>

          <p className="text-xs text-emerald-800 dark:text-emerald-300 font-bold leading-relaxed">
            {getEncouragement()}
          </p>

          {/* Goal progress bar */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, (salawatCount / salawatGoal) * 100)}%` }}
            />
          </div>

          <div className="flex gap-2.5 w-full pt-1.5">
            <button
              type="button"
              onClick={handleIncrementSalawat}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black text-sm rounded-2xl transition-all shadow-md active:scale-95 text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Flame className="w-4 h-4 animate-bounce text-amber-300" />
              <span>صلّ على محمد ﷺ (+١)</span>
            </button>

            {salawatCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('هل ترغب في تصفير العداد للبدء من جديد؟')) {
                    setSalawatCount(0);
                  }
                }}
                className={`py-3 px-3.5 rounded-2xl border transition-colors cursor-pointer ${
                  currentStyle === 'glass-dark'
                    ? 'bg-white/5 border-white/5 text-rose-400 hover:bg-white/10'
                    : 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50'
                }`}
                title="تصفير العداد"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
