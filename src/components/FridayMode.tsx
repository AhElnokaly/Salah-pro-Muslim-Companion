/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Flame, RotateCcw, Volume2, VolumeX, Heart, Share2 } from 'lucide-react';
import { AppSettings } from '../types';
import { toArabicNumbers } from '../utils/hijri';

interface FridayModeProps {
  settings: AppSettings;
}

export default function FridayMode({ settings }: FridayModeProps) {
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

  // State for Prophet prayer counter (Tasbeeh on Prophet ﷺ)
  const [salawatCount, setSalawatCount] = useState<number>(() => {
    const saved = localStorage.getItem('mc_friday_salawat_count');
    const savedDate = localStorage.getItem('mc_friday_salawat_date');
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (saved && savedDate === todayStr) {
      return parseInt(saved) || 0;
    }
    return 0;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mc_friday_sound') !== 'false';
  });

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
    
    // Play subtle audio click if sound enabled
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
    } catch (e) {
      // Audio context block browser safeguard
    }
  };

  const handleIncrementSalawat = () => {
    setSalawatCount(prev => prev + 1);
    
    // Play sweet bubble chime
    if (soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // C6 note
        osc.frequency.exponentialRampToValueAtTime(1318.5, audioCtx.currentTime + 0.12); // E6
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        // safe ignore
      }
    }

    // Gentle vibe/haptic if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  // Determine encouragement based on count
  const getEncouragement = () => {
    if (salawatCount >= 1000) return 'تبارك الرحمن! من المقرّبين مجلساً يوم القيامة ﷺ 👑';
    if (salawatCount >= 500) return 'يا له من نور ساطع! صلوات تسرّ الخاطر ﷺ 🌟';
    if (salawatCount >= 100) return 'رائع! مائة صلاة ترفعك مائة درجة وتغفر ذنبك ﷺ 🤍';
    if (salawatCount >= 50) return 'ما شاء الله، رطب الله لسانك وقلبك بالصلاة والسلام ﷺ ✨';
    if (salawatCount >= 10) return 'خطوات ميمونة، واصل الصلاة عليه لتكفى همك ﷺ 👍';
    return 'صلّ عليه لتُكفى همك ويُغفر ذنبك ﷺ';
  };

  const isTodayFriday = new Date().getDay() === 5;

  return (
    <div 
      id="friday-mode-root" 
      className={`rounded-3xl p-6 border relative overflow-hidden transition-all duration-300 space-y-5 text-right ${
        currentStyle === 'glass-dark'
          ? 'bg-gradient-to-br from-[#1b3c22] via-[#111723] to-[#122216] border-emerald-500/10 shadow-2xl text-slate-100'
          : 'bg-gradient-to-br from-[#f4faf5] via-white to-[#f0f8f2] border-emerald-500/20 shadow-md text-slate-800'
      }`}
    >
      {/* Decorative Friday background stars or subtle crescent */}
      <div className="absolute top-2 left-3 select-none opacity-20 pointer-events-none">
        <span className="text-3xl">🕌</span>
      </div>

      {/* Header section */}
      <div className="flex justify-between items-start pb-2.5 border-b border-emerald-500/10">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">✨</span>
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {isTodayFriday ? 'يوم الجمعة المبارك 🌟' : 'معاينة وضع يوم الجمعة 🌟'}
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">
            «إن من أفضل أيامكم يوم الجمعة، فأكثروا عليّ من الصلاة فيه...»
          </p>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-1.5 rounded-xl border transition-colors ${
            currentStyle === 'glass-dark' 
              ? 'bg-white/5 border-white/5 text-slate-300' 
              : 'bg-slate-100 border-slate-200 text-slate-650'
          }`}
          title={soundEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
              className={`p-3 rounded-2xl border text-right flex items-start gap-3 transition-all ${
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

      {/* Prophet Salawat Interactive Counter */}
      <div className={`p-4 rounded-3xl border text-center relative overflow-hidden transition-all ${
        currentStyle === 'glass-dark'
          ? 'bg-slate-950/40 border-white/5'
          : 'bg-emerald-500/5 border-emerald-500/10'
      }`}>
        <div className="flex flex-col items-center justify-center space-y-2">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
            عداد الصلاة على النبي ﷺ
          </span>
          
          <div className="text-4xl font-black text-amber-500 dark:text-amber-400 font-mono tracking-widest py-1">
            {toArabicNumbers(salawatCount)}
          </div>
          
          <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold leading-relaxed">
            {getEncouragement()}
          </p>

          <div className="flex gap-2.5 w-full pt-1.5">
            <button
              type="button"
              onClick={handleIncrementSalawat}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all shadow-md active:scale-95 text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Flame className="w-4 h-4 animate-bounce" />
              صلّ على محمد ﷺ
            </button>

            {salawatCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('هل ترغب في تصفير العداد للبدء من جديد؟')) {
                    setSalawatCount(0);
                  }
                }}
                className={`py-3 px-3.5 rounded-xl border transition-colors ${
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
