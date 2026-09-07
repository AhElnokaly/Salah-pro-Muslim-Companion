/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { AppSettings } from '../types';
import { safeSetItem, safeGetItem, safeGetJSON } from '../utils/storage';
import fridayBackdrop from '../assets/images/friday_mosque_backdrop.jpg';
import { FridayKahfCard } from './friday/FridayKahfCard';
import { FridayHourOfDuaAlert } from './friday/FridayHourOfDuaAlert';
import { FridaySunnahChecklist } from './friday/FridaySunnahChecklist';
import { FridaySalawatCounter } from './friday/FridaySalawatCounter';

interface FridayModeProps {
  settings: AppSettings;
  todayPrayerTimes?: Record<string, string>;
  onNavigateTab?: (tab: string) => void;
}

export default function FridayMode({ settings, onNavigateTab }: FridayModeProps) {
  const isDarkTheme = settings.theme === 'dark' || 
    ((!settings.theme || settings.theme === 'system') && 
     window.matchMedia('(prefers-color-scheme: dark)').matches);
  const currentStyle = isDarkTheme ? 'glass-dark' : 'faith-bright';
  
  // State for Friday checklist
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const savedDate = safeGetItem('mc_friday_checklist_date');
    
    if (savedDate === todayStr) {
      return safeGetJSON<Record<string, boolean>>('mc_friday_checklist', {
        ghusl: false,
        perfume: false,
        kahf: false,
        early: false,
        dua: false,
      });
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
    const saved = safeGetItem('mc_friday_salawat_count');
    const savedDate = safeGetItem('mc_friday_salawat_date');
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (saved && savedDate === todayStr) {
      return parseInt(saved, 10) || 0;
    }
    return 0;
  });

  const [salawatGoal, setSalawatGoal] = useState<number>(300);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return safeGetItem('mc_friday_sound') !== 'false';
  });

  // Save checklist
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    safeSetItem('mc_friday_checklist', JSON.stringify(checklist));
    safeSetItem('mc_friday_checklist_date', todayStr);
  }, [checklist]);

  // Save salawat count
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    safeSetItem('mc_friday_salawat_count', salawatCount.toString());
    safeSetItem('mc_friday_salawat_date', todayStr);
  }, [salawatCount]);

  // Save sound setting
  useEffect(() => {
    safeSetItem('mc_friday_sound', soundEnabled.toString());
  }, [soundEnabled]);

  const playSubtleClick = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
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

  const handleToggleCheck = (key: string) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    if (soundEnabled) {
      playSubtleClick();
    }
  };

  const handleIncrementSalawat = () => {
    setSalawatCount(prev => prev + 1);
    
    if (soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const audioCtx = new AudioCtx();
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

  const handleResetSalawat = () => {
    if (confirm('هل ترغب في تصفير العداد للبدء من جديد؟')) {
      setSalawatCount(0);
    }
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
  const now = new Date();
  const currentHour = now.getHours();
  const isHourOfAcceptanceTime = isTodayFriday && currentHour >= 16 && currentHour < 19;

  return (
    <div 
      id="friday-mode-root" 
      dir="rtl"
      className={`rounded-3xl p-6 border relative overflow-hidden transition-all duration-300 space-y-6 text-right ${
        currentStyle === 'glass-dark'
          ? 'bg-gradient-to-br from-[#1b3c22] via-[#111723] to-[#122216] border-emerald-500/20 shadow-2xl text-slate-100'
          : 'bg-gradient-to-br from-[#f4faf5] via-white to-[#f0f8f2] border-emerald-500/30 shadow-md text-slate-800'
      }`}
    >
      {/* Background Decorative Image & Element adhering to canonical asset rules */}
      <div className="absolute inset-0 select-none opacity-10 dark:opacity-20 pointer-events-none overflow-hidden shrink-0">
        <img 
          src={fridayBackdrop} 
          alt="Friday Mosque" 
          className="w-full h-full object-cover object-center scale-105 filter blur-[0.5px]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 via-transparent to-transparent" />
      </div>

      {/* Header section */}
      <div className="flex justify-between items-start pb-3 border-b border-emerald-500/15" dir="rtl">
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h3 className="text-lg font-black text-emerald-700 dark:text-emerald-400 text-right">
              {isTodayFriday ? 'يوم الجمعة المبارك 🌟' : 'معاينة أجواء سنن يوم الجمعة 🌟'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1 text-right leading-relaxed">
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
      <FridayKahfCard
        isKahfRead={!!checklist['kahf']}
        onToggleKahf={() => handleToggleCheck('kahf')}
        onNavigateTab={onNavigateTab}
      />

      {/* HOUR OF ACCEPTANCE (ساعة الاستجابة) SPECIAL ALERT */}
      <FridayHourOfDuaAlert
        isHourOfAcceptanceTime={isHourOfAcceptanceTime}
      />

      {/* CHECKLIST ITEMS WITH PROGRESS BAR */}
      <FridaySunnahChecklist
        checklist={checklist}
        onToggleCheck={handleToggleCheck}
        currentStyle={currentStyle}
      />

      {/* PROPHET SALAWAT INTERACTIVE COUNTER WITH GOALS */}
      <FridaySalawatCounter
        salawatCount={salawatCount}
        salawatGoal={salawatGoal}
        setSalawatGoal={setSalawatGoal}
        onIncrementSalawat={handleIncrementSalawat}
        onResetSalawat={handleResetSalawat}
        encouragementText={getEncouragement()}
        currentStyle={currentStyle}
      />
    </div>
  );
}
