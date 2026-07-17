/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronLeft, 
  RotateCcw, 
  Compass, 
  Sun, 
  Moon, 
  BookOpen, 
  Activity, 
  Volume2, 
  CheckCircle2, 
  Grid,
  Maximize2,
  Plus,
  Trash2
} from 'lucide-react';
import { ADHKAR_DATA, FREE_TASBEEH_PRESETS, DhikrCategory } from '../utils/adhkarData';
import { toArabicNumbers } from '../utils/hijri';

interface AdhkarTrackerProps {
  dhikrLogs: Record<string, Record<string, number>>;
  setDhikrLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
}

export default function AdhkarTracker({
  dhikrLogs,
  setDhikrLogs,
}: AdhkarTrackerProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'tasbeeh'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<DhikrCategory | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // States for Category Sequence Reader
  const [currentDhikrIdx, setCurrentDhikrIdx] = useState(0);
  const [currentDhikrCount, setCurrentDhikrCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  // States for Electronic Tasbeeh (المسبحة الإلكترونية)
  const [tasbeehPresetIdx, setTasbeehPresetIdx] = useState(0);
  const [customTasbeehText, setCustomTasbeehText] = useState('');
  const [isCustomTasbeeh, setIsCustomTasbeeh] = useState(false);
  const [tasbeehCount, setTasbeehCount] = useState(0);
  const [tasbeehTarget, setTasbeehTarget] = useState(33);

  // Persistent Custom Tasbeehs list
  const [customTasbeehs, setCustomTasbeehs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mc_custom_tasbeehs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('mc_custom_tasbeehs', JSON.stringify(customTasbeehs));
  }, [customTasbeehs]);

  const handleAddCustomTasbeeh = () => {
    const text = customTasbeehText.trim();
    if (!text) return;
    if (!customTasbeehs.includes(text)) {
      setCustomTasbeehs(prev => [...prev, text]);
    }
  };

  const handleDeleteCustomTasbeeh = (text: string) => {
    setCustomTasbeehs(prev => prev.filter(t => t !== text));
    if (customTasbeehText === text) {
      setCustomTasbeehText('');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Sound/haptic feedback trigger
  const triggerFeedback = () => {
    // Attempt standard vibration
    if (navigator.vibrate) {
      navigator.vibrate(35);
    }
    
    // Play a synthetic pleasant audio beep if sound enabled
    if (soundEnabled && (window.AudioContext || (window as any).webkitAudioContext)) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 pleasant tone
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch (e) {
        console.error('Audio feedback error', e);
      }
    }
  };

  const playCompletionSound = () => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    if (soundEnabled && (window.AudioContext || (window as any).webkitAudioContext)) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36); // C6
        
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Increment current Category item
  const handleIncrementCategoryCount = () => {
    if (!selectedCategory) return;
    const item = selectedCategory.items[currentDhikrIdx];
    
    triggerFeedback();

    if (currentDhikrCount + 1 < item.count) {
      setCurrentDhikrCount(prev => prev + 1);
    } else {
      // Completed this specific item!
      // Update global logs
      setDhikrLogs(prev => {
        const dayLogs = prev[todayStr] || {};
        const catCount = dayLogs[selectedCategory.id] || 0;
        return {
          ...prev,
          [todayStr]: {
            ...dayLogs,
            [selectedCategory.id]: catCount + 1
          }
        };
      });

      if (currentDhikrIdx + 1 < selectedCategory.items.length) {
        // Advance to next item
        setCurrentDhikrIdx(prev => prev + 1);
        setCurrentDhikrCount(0);
      } else {
        // Category Fully Completed!
        playCompletionSound();
        setShowCelebration(true);
      }
    }
  };

  const handleResetCategory = () => {
    setCurrentDhikrIdx(0);
    setCurrentDhikrCount(0);
    setShowCelebration(false);
  };

  const handleIncrementTasbeeh = () => {
    triggerFeedback();
    
    if (tasbeehCount + 1 >= tasbeehTarget) {
      setTasbeehCount(tasbeehTarget);
      playCompletionSound();
      alert('تمت المسبحة بنجاح! تقبل الله منكم الصالحات ✨');
      setTasbeehCount(0); // Reset
    } else {
      setTasbeehCount(prev => prev + 1);
    }
  };

  const activeTasbeehText = isCustomTasbeeh 
    ? (customTasbeehText || 'سُبْحَانَ اللهِ وبِحَمْدِهِ') 
    : FREE_TASBEEH_PRESETS[tasbeehPresetIdx].text;

  const activeTasbeehDesc = isCustomTasbeeh 
    ? 'تسبيح مخصص' 
    : FREE_TASBEEH_PRESETS[tasbeehPresetIdx].description;

  return (
    <div id="adhkar-tracker-root" className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Header with Tab selection */}
      {!selectedCategory && (
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            الأوراد المأثورة والتحصين
          </button>
          <button
            onClick={() => setActiveTab('tasbeeh')}
            className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'tasbeeh'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            المسبحة الإلكترونية التفاعلية
          </button>
        </div>
      )}

      {/* VIEW: List of Categories */}
      {activeTab === 'categories' && !selectedCategory && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 flex items-center justify-between transition-colors duration-300">
            <div className="space-y-1 text-right">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">الأذكار اليومية</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">حافظ على أورادك لتحصين نفسك وبيتك طوال اليوم.</p>
            </div>
            <button
              onClick={() => setSoundEnabled(prev => !prev)}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled 
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400' 
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
              }`}
              title={soundEnabled ? 'كتم الصوت التفاعلي' : 'تفعيل الصوت التفاعلي'}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {ADHKAR_DATA.map((cat) => {
              const completedItemsCount = dhikrLogs[todayStr]?.[cat.id] || 0;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentDhikrIdx(0);
                    setCurrentDhikrCount(0);
                    setShowCelebration(false);
                  }}
                  className="p-5 bg-white dark:bg-[#161d26] rounded-2xl border border-[#e2e8f0] dark:border-slate-800/80 text-right flex justify-between items-center hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      cat.id === 'morning' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' :
                      cat.id === 'evening' ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' :
                      cat.id === 'sleep' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {cat.id === 'morning' ? <Sun className="w-6 h-6" /> :
                       cat.id === 'evening' ? <Moon className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                      <span className="text-base font-black text-slate-800 dark:text-white">{cat.arabicName}</span>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs">{cat.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                      {toArabicNumbers(completedItemsCount)}/{toArabicNumbers(cat.items.length)}
                    </span>
                    <ChevronLeft className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: Category Sequence Reader */}
      {selectedCategory && (
        <div className="space-y-6">
          {/* Top Bar navigation */}
          <div className="flex justify-between items-center bg-white dark:bg-[#161d26] p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 transition-colors">
            <button
              onClick={() => setSelectedCategory(null)}
              className="py-2 px-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>رجوع للقائمة</span>
            </button>
            <h3 className="font-extrabold text-slate-800 dark:text-white">{selectedCategory.arabicName}</h3>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsFocusMode(true)}
                className="py-2 px-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-colors cursor-pointer text-xs font-black flex items-center gap-1"
                title="تفعيل وضع التركيز بملء الشاشة"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>تركيز</span>
              </button>
              
              <button
                onClick={handleResetCategory}
                className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="إعادة تشغيل الذكر من الأول"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!showCelebration ? (
            <div className="bg-white dark:bg-[#161d26] rounded-3xl p-6 border border-[#e2e8f0] dark:border-slate-800/80 space-y-6 flex flex-col items-center transition-colors">
              {/* Progress counter */}
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                الذكر {toArabicNumbers(currentDhikrIdx + 1)} من {toArabicNumbers(selectedCategory.items.length)}
              </div>

              {/* Main text box */}
              <div className="w-full bg-[#faf7f0]/40 dark:bg-[#111720] rounded-2xl p-6 border border-slate-50 dark:border-slate-800/50 text-center leading-loose text-lg font-bold text-slate-800 dark:text-slate-100 select-all transition-colors">
                {selectedCategory.items[currentDhikrIdx].text}
              </div>

              {/* Explanation / Reward */}
              {selectedCategory.items[currentDhikrIdx].reward && (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-900 dark:text-indigo-200 text-right w-full leading-relaxed">
                  <Sparkles className="w-4 h-4 text-indigo-500 inline-block ml-1.5 shrink-0" />
                  <span>{selectedCategory.items[currentDhikrIdx].reward}</span>
                </div>
              )}

              {/* Interactive Counter Tap Button */}
              <button
                onClick={handleIncrementCategoryCount}
                className="w-44 h-44 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 hover:scale-105 active:scale-95 text-white flex flex-col items-center justify-center shadow-xl shadow-indigo-100/40 dark:shadow-none transition-all cursor-pointer border-4 border-indigo-100 dark:border-indigo-950/50"
              >
                <span className="text-4xl font-black">
                  {toArabicNumbers(currentDhikrCount)}/{toArabicNumbers(selectedCategory.items[currentDhikrIdx].count)}
                </span>
                <span className="text-xs font-bold text-indigo-100 mt-2">انقر للتكرار</span>
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#161d26] rounded-3xl p-8 border border-[#e2e8f0] dark:border-slate-800 text-center space-y-6 transition-colors">
              <div className="inline-flex p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">تقبل الله طاعاتكم!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed font-medium">
                  لقد أتممت قراءة {selectedCategory.arabicName} لليوم بنجاح، جعلها الله في ميزان حسناتك وحفظك بها طوال اليوم.
                </p>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                العودة للأذكار الأخرى
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW: Electronic Tasbeeh */}
      {activeTab === 'tasbeeh' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">اختر الذكر المفضل:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCustomTasbeeh(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    !isCustomTasbeeh 
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 font-extrabold' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  الرئيسية
                </button>
                <button
                  onClick={() => setIsCustomTasbeeh(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    isCustomTasbeeh 
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 font-extrabold' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  كتابة مخصص
                </button>
              </div>
            </div>

            {/* Presets vs Custom input */}
            {!isCustomTasbeeh ? (
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto no-scrollbar pr-1">
                {FREE_TASBEEH_PRESETS.map((preset, i) => (
                  <button
                    key={preset.text}
                    onClick={() => {
                      setTasbeehPresetIdx(i);
                      setTasbeehCount(0);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-right transition-all cursor-pointer ${
                      tasbeehPresetIdx === i 
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-extrabold' 
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {preset.text}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="اكتب تسبيحاً مخصصاً هنا..."
                    value={customTasbeehText}
                    onChange={(e) => {
                      setCustomTasbeehText(e.target.value);
                      setTasbeehCount(0);
                    }}
                    className="flex-grow p-3 bg-slate-50 dark:bg-[#111720] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 focus:outline-none text-right font-semibold"
                  />
                  <button
                    onClick={handleAddCustomTasbeeh}
                    disabled={!customTasbeehText.trim()}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl flex items-center gap-1 transition-colors cursor-pointer text-xs font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    حفظ
                  </button>
                </div>

                {customTasbeehs.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">تسبيحاتك المحفوظة:</span>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto no-scrollbar pr-1">
                      {customTasbeehs.map((text) => (
                        <div 
                          key={text} 
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                            customTasbeehText === text 
                              ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-extrabold' 
                              : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <button
                            onClick={() => {
                              setCustomTasbeehText(text);
                              setTasbeehCount(0);
                            }}
                            className="font-semibold text-right text-xs cursor-pointer"
                          >
                            {text}
                          </button>
                          <button
                            onClick={() => handleDeleteCustomTasbeeh(text)}
                            className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Target Select */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">العدد المستهدف:</span>
              <div className="flex gap-1.5">
                {[33, 100, 1000].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTasbeehTarget(t);
                      setTasbeehCount(0);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      tasbeehTarget === t 
                        ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-700 dark:border-indigo-700 text-white' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {toArabicNumbers(t)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Large Tap Area */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-6 border border-[#e2e8f0] dark:border-slate-800/80 flex flex-col items-center justify-center space-y-6 transition-colors duration-300">
            
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{activeTasbeehText}</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{activeTasbeehDesc}</p>
            </div>

            {/* Circular counter button */}
            <button
              onClick={handleIncrementTasbeeh}
              className="w-56 h-56 rounded-full bg-slate-50 dark:bg-[#111720] border border-[#e2e8f0] dark:border-slate-800 hover:scale-105 active:scale-95 flex flex-col items-center justify-center transition-all cursor-pointer relative shadow-inner"
              style={{
                background: 'radial-gradient(circle, var(--tw-radial-start, #ffffff) 60%, var(--tw-radial-end, #f1f5f9) 100%)'
              }}
            >
              {/* Ring Progress border */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray="289"
                  strokeDashoffset={289 - (289 * tasbeehCount) / tasbeehTarget}
                  strokeLinecap="round"
                  className="text-indigo-600 dark:text-indigo-500 transition-all duration-300"
                />
              </svg>

              <div className="text-center space-y-1 z-10">
                <span className="text-5xl font-black text-slate-800 dark:text-white tracking-tight">
                  {toArabicNumbers(tasbeehCount)}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">
                  الهدف: {toArabicNumbers(tasbeehTarget)}
                </span>
              </div>
            </button>

            {/* Reset & Focus Buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={() => setTasbeehCount(0)}
                className="py-2 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تصفير العداد</span>
              </button>

              <button
                onClick={() => setIsFocusMode(true)}
                className="py-2 px-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-black rounded-xl text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>وضع التركيز 🧘‍♂️</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Focus Mode absolute overlays */}
      {isFocusMode && (
        <div 
          onClick={(e) => {
            if (selectedCategory) {
              if (!showCelebration) handleIncrementCategoryCount();
            } else if (activeTab === 'tasbeeh') {
              handleIncrementTasbeeh();
            }
          }}
          className="fixed inset-0 z-50 flex flex-col justify-between p-6 cursor-pointer select-none text-right transition-all duration-500 bg-[#faf7f0] dark:bg-[#0c1017] text-slate-800 dark:text-slate-100"
          dir="rtl"
        >
          {/* Header Controls */}
          <div className="flex justify-between items-center w-full pb-4 border-b border-slate-200/50 dark:border-slate-800/40" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsFocusMode(false)}
              className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              خروج من وضع التركيز ✕
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSoundEnabled(prev => !prev)}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  soundEnabled 
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-full">
                وضع التركيز 🧘‍♂️
              </span>
            </div>
          </div>

          {/* Center content */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-10 max-w-2xl mx-auto px-4 text-center">
            {selectedCategory ? (
              <div className="space-y-8">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-wider uppercase block">
                  {selectedCategory.arabicName} • الذكر {toArabicNumbers(currentDhikrIdx + 1)} من {toArabicNumbers(selectedCategory.items.length)}
                </span>
                <h1 className="text-2xl md:text-3xl font-black leading-relaxed text-slate-800 dark:text-slate-100">
                  {selectedCategory.items[currentDhikrIdx].text}
                </h1>
                {selectedCategory.items[currentDhikrIdx].reward && (
                  <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 leading-relaxed font-semibold max-w-lg mx-auto">
                    {selectedCategory.items[currentDhikrIdx].reward}
                  </p>
                )}
                
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-6xl font-black text-indigo-700 dark:text-indigo-400 font-mono tracking-tight animate-pulse">
                    {toArabicNumbers(currentDhikrCount)} / {toArabicNumbers(selectedCategory.items[currentDhikrIdx].count)}
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">انقر في أي مكان على الشاشة للتكرار</span>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-wider uppercase block">
                  المسبحة الإلكترونية التفاعلية
                </span>
                <h1 className="text-3xl md:text-4xl font-black leading-relaxed text-slate-800 dark:text-slate-100">
                  {activeTasbeehText}
                </h1>
                <p className="text-sm text-slate-400 dark:text-slate-500 font-bold">
                  {activeTasbeehDesc}
                </p>

                <div className="flex flex-col items-center space-y-2">
                  <div className="text-7xl font-black text-indigo-700 dark:text-indigo-400 font-mono tracking-tight animate-pulse">
                    {toArabicNumbers(tasbeehCount)} / {toArabicNumbers(tasbeehTarget)}
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">انقر في أي مكان على الشاشة للتسبيح</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Instructions */}
          <div className="text-center pb-4 text-[10px] text-slate-400 dark:text-slate-500 font-bold border-t border-slate-200/30 dark:border-slate-800/30 pt-4" onClick={(e) => e.stopPropagation()}>
            شاشة كاملة خالية من المشتتات تماماً لمساعدتك على التركيز في الذكر والتدبر 🤍
          </div>
        </div>
      )}

    </div>
  );
}
