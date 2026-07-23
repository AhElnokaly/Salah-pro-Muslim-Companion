/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  RotateCcw, 
  Sun, 
  Moon, 
  BookOpen, 
  Volume2, 
  CheckCircle2, 
  Maximize2, 
  Plus, 
  Trash2,
  ListFilter,
  Layers,
  Award,
  Check,
  Clock,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ADHKAR_DATA, FREE_TASBEEH_PRESETS, DhikrCategory, DhikrItem } from '../utils/adhkarData';
import { toArabicNumbers } from '../utils/hijri';

interface AdhkarTrackerProps {
  dhikrLogs: Record<string, Record<string, number>>;
  setDhikrLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
}

/**
 * Component for rendering the segmented progress bar where each segment corresponds to a Dhikr item.
 */
const SegmentedProgressBar: React.FC<{
  items: DhikrItem[];
  dayLogs: Record<string, number>;
  onSegmentClick?: (idx: number) => void;
  activeIdx?: number;
}> = ({ items, dayLogs, onSegmentClick, activeIdx }) => {
  return (
    <div className="w-full space-y-1.5">
      <div className="flex w-full gap-1 items-center h-2.5">
        {items.map((item, idx) => {
          const current = dayLogs[item.id] || 0;
          const isDone = current >= item.count;
          const isPartial = current > 0 && current < item.count;
          const isActive = activeIdx === idx;

          return (
            <button
              key={item.id}
              onClick={() => onSegmentClick && onSegmentClick(idx)}
              title={`${item.title || 'ذكر'} (${toArabicNumbers(current)}/${toArabicNumbers(item.count)})`}
              className={`flex-1 h-full rounded-full transition-all duration-300 relative cursor-pointer ${
                isActive
                  ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-[#161d26] scale-y-125 z-10'
                  : ''
              } ${
                isDone
                  ? 'bg-emerald-500 dark:bg-emerald-400 shadow-xs'
                  : isPartial
                  ? 'bg-amber-400 dark:bg-amber-500 animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-700/80 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default function AdhkarTracker({
  dhikrLogs,
  setDhikrLogs,
}: AdhkarTrackerProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'tasbeeh'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<DhikrCategory | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // States for Category Sequence Reader
  const [currentDhikrIdx, setCurrentDhikrIdx] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  // States for interactive particles
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; text: string }>>([]);
  const [focusParticles, setFocusParticles] = useState<Array<{ id: number; x: number; y: number; text: string }>>([]);
  const [tasbeehSuccessModal, setTasbeehSuccessModal] = useState(false);

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
  const dayLogs = dhikrLogs[todayStr] || {};

  // Sound/haptic feedback trigger
  const triggerFeedback = (type: 'tap' | 'completed_dhikr' | 'completed_category' = 'tap') => {
    if (navigator.vibrate) {
      if (type === 'tap') {
        navigator.vibrate(15);
      } else if (type === 'completed_dhikr') {
        navigator.vibrate([45, 65, 45]);
      } else if (type === 'completed_category') {
        navigator.vibrate([90, 55, 90, 55, 130]);
      }
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
        if (type === 'completed_category') {
          const osc2 = ctx.createOscillator();
          const osc3 = ctx.createOscillator();
          osc2.connect(gain);
          osc3.connect(gain);
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
          osc3.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
          osc.start();
          osc2.start();
          osc3.start();
          osc.stop(ctx.currentTime + 0.6);
          osc2.stop(ctx.currentTime + 0.6);
          osc3.stop(ctx.currentTime + 0.6);
        } else if (type === 'completed_dhikr') {
          osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
          osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        } else {
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          gain.gain.setValueAtTime(0.03, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        }
      } catch (e) {
        console.error('Audio feedback error', e);
      }
    }
  };

  const spawnParticle = (text: string) => {
    const id = Date.now() + Math.random();
    const x = Math.random() * 80 - 40;
    const y = -40 - Math.random() * 30;
    const newParticle = { id, x, y, text };
    setParticles(prev => [...prev, newParticle]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, 900);
  };

  const handleSpawnTapParticles = () => {
    const sparks = ['+١', '✨', '🤍', '📿', 'أجر', 'نور'];
    const randomSpark = sparks[Math.floor(Math.random() * sparks.length)];
    spawnParticle(randomSpark);
  };

  const spawnFocusParticle = (text: string, x: number, y: number) => {
    const id = Date.now() + Math.random();
    const newParticle = { id, x, y, text };
    setFocusParticles(prev => [...prev, newParticle]);
    setTimeout(() => {
      setFocusParticles(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };

  /**
   * Helper to update single item count in dhikrLogs state
   */
  const updateItemCount = (cat: DhikrCategory, item: DhikrItem, delta: number = 1, setExact?: number) => {
    setDhikrLogs(prev => {
      const currentDay = prev[todayStr] || {};
      const currentItemCount = currentDay[item.id] || 0;
      
      let updatedCount = setExact !== undefined ? setExact : currentItemCount + delta;
      if (updatedCount < 0) updatedCount = 0;

      const updatedDay = {
        ...currentDay,
        [item.id]: updatedCount
      };

      // Recalculate completed count for category
      let completedCount = 0;
      cat.items.forEach(it => {
        if ((updatedDay[it.id] || 0) >= it.count) {
          completedCount++;
        }
      });
      updatedDay[cat.id] = completedCount;

      return {
        ...prev,
        [todayStr]: updatedDay
      };
    });
  };

  // Increment current Category item count in card mode
  const handleIncrementCategoryItem = (item: DhikrItem) => {
    if (!selectedCategory) return;
    const currentCount = dayLogs[item.id] || 0;
    
    handleSpawnTapParticles();

    if (currentCount + 1 < item.count) {
      triggerFeedback('tap');
      updateItemCount(selectedCategory, item, 1);
    } else {
      // Completed this item!
      triggerFeedback('completed_dhikr');
      updateItemCount(selectedCategory, item, 1);

      // Check if all items in category are now done
      let allDone = true;
      selectedCategory.items.forEach(it => {
        const c = it.id === item.id ? item.count : (dayLogs[it.id] || 0);
        if (c < it.count) allDone = false;
      });

      if (allDone) {
        triggerFeedback('completed_category');
        setShowCelebration(true);
      } else if (currentDhikrIdx + 1 < selectedCategory.items.length) {
        // Automatically advance to next unfinished item
        let nextIdx = currentDhikrIdx + 1;
        while (nextIdx < selectedCategory.items.length) {
          const nextItem = selectedCategory.items[nextIdx];
          const c = dayLogs[nextItem.id] || 0;
          if (c < nextItem.count) {
            break;
          }
          nextIdx++;
        }
        if (nextIdx < selectedCategory.items.length) {
          setCurrentDhikrIdx(nextIdx);
        }
      }
    }
  };

  // Mark an item as completely done
  const handleMarkItemDone = (cat: DhikrCategory, item: DhikrItem) => {
    triggerFeedback('completed_dhikr');
    updateItemCount(cat, item, 0, item.count);

    let allDone = true;
    cat.items.forEach(it => {
      const c = it.id === item.id ? item.count : (dayLogs[it.id] || 0);
      if (c < it.count) allDone = false;
    });

    if (allDone) {
      triggerFeedback('completed_category');
      setShowCelebration(true);
    }
  };

  const handleResetCategory = (cat: DhikrCategory) => {
    setDhikrLogs(prev => {
      const currentDay = { ...(prev[todayStr] || {}) };
      cat.items.forEach(it => {
        delete currentDay[it.id];
      });
      delete currentDay[cat.id];
      return {
        ...prev,
        [todayStr]: currentDay
      };
    });
    setCurrentDhikrIdx(0);
    setShowCelebration(false);
  };

  const handleIncrementTasbeeh = () => {
    handleSpawnTapParticles();
    
    if (tasbeehCount + 1 >= tasbeehTarget) {
      setTasbeehCount(tasbeehTarget);
      triggerFeedback('completed_category');
      setTasbeehSuccessModal(true);
      setTasbeehCount(0);
    } else {
      triggerFeedback('tap');
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
      
      {/* Header Tabs Navigation */}
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
            الأوراد المأثورة والتحصين اليومي
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

      {/* VIEW: List of Adhkar Categories */}
      {activeTab === 'categories' && !selectedCategory && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 flex items-center justify-between transition-colors duration-300 shadow-xs">
            <div className="space-y-1 text-right">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>أذكار اليوم والليلة المكتوبة</span>
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                أذكار الصباح والمساء والأذكار المفروضة بعد الصلاة مع بيان عدد التكرار والفضل.
              </p>
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

          <div className="grid grid-cols-1 gap-4">
            {ADHKAR_DATA.map((cat) => {
              // Calculate completed count and total items
              let completedItems = 0;
              cat.items.forEach(it => {
                const c = dayLogs[it.id] || 0;
                if (c >= it.count) completedItems++;
              });

              const percent = Math.round((completedItems / cat.items.length) * 100);

              return (
                <div
                  key={cat.id}
                  className="p-5 bg-white dark:bg-[#161d26] rounded-3xl border border-[#e2e8f0] dark:border-slate-800/80 text-right flex flex-col gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
                >
                  {/* Category Header */}
                  <div className="flex items-start gap-4">
                    <div className={`p-3.5 rounded-2xl shrink-0 ${
                      cat.id === 'morning' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' :
                      cat.id === 'evening' ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' :
                      cat.id === 'after_prayer' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {cat.id === 'morning' ? <Sun className="w-6 h-6" /> :
                       cat.id === 'evening' ? <Moon className="w-6 h-6" /> :
                       cat.id === 'after_prayer' ? <Award className="w-6 h-6" /> :
                       <BookOpen className="w-6 h-6" />}
                    </div>

                    <div className="space-y-1.5 flex-grow">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-slate-800 dark:text-white">{cat.arabicName}</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          percent === 100 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {toArabicNumbers(completedItems)} / {toArabicNumbers(cat.items.length)} ذكر ({toArabicNumbers(percent)}%)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{cat.description}</p>
                      
                      {cat.timeRangeNote && (
                        <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 mt-1 border border-amber-100 dark:border-amber-900/30">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{cat.timeRangeNote}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divided / Segmented Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500">
                      <span>شريط التقدم التفاعلي لكل ذكر:</span>
                      <span>{percent === 100 ? 'تمت القراءة بنجاح ✓' : 'انقر على أي ذكر لبدء التسجيل'}</span>
                    </div>
                    <SegmentedProgressBar
                      items={cat.items}
                      dayLogs={dayLogs}
                      onSegmentClick={(idx) => {
                        setSelectedCategory(cat);
                        setCurrentDhikrIdx(idx);
                        setShowCelebration(false);
                      }}
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="flex gap-2 w-full pt-3 border-t border-slate-100 dark:border-slate-800/40">
                    <button
                      onClick={() => {
                        setSelectedCategory(cat);
                        setViewMode('cards');
                        setCurrentDhikrIdx(0);
                        setShowCelebration(false);
                      }}
                      className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-black rounded-2xl text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Layers className="w-4 h-4" />
                      <span>بدء التلاوة بالتتابع (بطاقات)</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCategory(cat);
                        setViewMode('list');
                        setShowCelebration(false);
                      }}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ListFilter className="w-4 h-4" />
                      <span>عرض القائمة الكاملة</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: Selected Category Experience */}
      {selectedCategory && (
        <div className="space-y-5">
          {/* Top Bar navigation */}
          <div className="flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-[#161d26] p-4 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
            <button
              onClick={() => setSelectedCategory(null)}
              className="py-2 px-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>رجوع للقائمة</span>
            </button>

            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base">{selectedCategory.arabicName}</h3>
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* View mode toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  title="وضع البطاقات المتتابعة"
                >
                  بطاقات
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  title="وضع القائمة الكاملة المكتوبة"
                >
                  قائمة
                </button>
              </div>

              <button
                onClick={() => setIsFocusMode(true)}
                className="py-2 px-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-colors cursor-pointer text-xs font-black flex items-center gap-1"
                title="تفعيل وضع التركيز بملء الشاشة"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تركيز</span>
              </button>
              
              <button
                onClick={() => handleResetCategory(selectedCategory)}
                className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="إعادة ضبط أذكار هذه الفئة"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Divided / Segmented Progress Bar (Always Visible inside category) */}
          <div className="bg-white dark:bg-[#161d26] p-4 rounded-3xl border border-slate-100 dark:border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span>تقدم قراءة الأذكار:</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {toArabicNumbers(
                    selectedCategory.items.filter(it => (dayLogs[it.id] || 0) >= it.count).length
                  )} / {toArabicNumbers(selectedCategory.items.length)} ذكر
                </span>
              </span>
              <span className="text-slate-400 text-[11px]">انقر أي جزء للانتقال المباشر</span>
            </div>

            <SegmentedProgressBar
              items={selectedCategory.items}
              dayLogs={dayLogs}
              activeIdx={viewMode === 'cards' ? currentDhikrIdx : undefined}
              onSegmentClick={(idx) => {
                setCurrentDhikrIdx(idx);
                setViewMode('cards');
              }}
            />
          </div>

          {!showCelebration ? (
            <>
              {/* MODE 1: Interactive Step-by-Step Cards */}
              {viewMode === 'cards' && (
                <div className="bg-white dark:bg-[#161d26] rounded-3xl p-6 border border-[#e2e8f0] dark:border-slate-800/80 space-y-6 flex flex-col items-center transition-colors overflow-hidden">
                  
                  {/* Current Item Card */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentDhikrIdx}
                      initial={{ opacity: 0, x: 50, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -50, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      className="w-full space-y-6 flex flex-col items-center"
                    >
                      <div className="w-full relative bg-slate-50/70 dark:bg-[#111720]/90 rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/80 overflow-hidden shadow-inner flex flex-col items-center text-right">
                        
                        {/* Title & Timing Notes */}
                        <div className="w-full flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3 mb-4">
                          <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/30">
                            {selectedCategory.items[currentDhikrIdx].title || `الذكر ${toArabicNumbers(currentDhikrIdx + 1)}`}
                          </span>

                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                            {toArabicNumbers(currentDhikrIdx + 1)} من {toArabicNumbers(selectedCategory.items.length)}
                          </span>
                        </div>

                        {/* Special Timing Note Badge */}
                        {(selectedCategory.items[currentDhikrIdx].timingNote || selectedCategory.items[currentDhikrIdx].description) && (
                          <div className="w-full text-right mb-3">
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30 inline-block">
                              {selectedCategory.items[currentDhikrIdx].timingNote || selectedCategory.items[currentDhikrIdx].description}
                            </span>
                          </div>
                        )}

                        {/* Full Arabic Text */}
                        <p className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 leading-relaxed text-center py-4 select-text max-w-xl w-full">
                          {selectedCategory.items[currentDhikrIdx].text}
                        </p>

                        {/* Virtue / Reward Box */}
                        {selectedCategory.items[currentDhikrIdx].reward && (
                          <div className="mt-3 p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-300 text-right w-full leading-relaxed flex items-start gap-2.5">
                            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-black block mb-0.5">الفضل والبركة:</span>
                              <span>{selectedCategory.items[currentDhikrIdx].reward}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Interactive Counter Tap Button */}
                  {(() => {
                    const currentItem = selectedCategory.items[currentDhikrIdx];
                    const currentCount = dayLogs[currentItem.id] || 0;
                    const isCompleted = currentCount >= currentItem.count;

                    return (
                      <div className="relative flex flex-col items-center gap-4 pt-2">
                        {/* Particles overlay */}
                        <div className="absolute pointer-events-none inset-0 flex items-center justify-center overflow-visible z-30">
                          <AnimatePresence>
                            {particles.map(p => (
                              <motion.span
                                key={p.id}
                                initial={{ opacity: 0, scale: 0.5, y: 0, x: p.x }}
                                animate={{ opacity: 1, scale: 1.25, y: p.y }}
                                exit={{ opacity: 0, scale: 0.8, y: p.y - 15 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="absolute text-xs font-black px-2.5 py-1 bg-indigo-600 dark:bg-indigo-700 text-white rounded-full shadow-md select-none pointer-events-none whitespace-nowrap"
                              >
                                {p.text}
                              </motion.span>
                            ))}
                          </AnimatePresence>
                        </div>

                        {/* Tap Button */}
                        <button
                          onClick={() => handleIncrementCategoryItem(currentItem)}
                          className={`w-44 h-44 rounded-full text-white flex flex-col items-center justify-center shadow-xl transition-all cursor-pointer border-4 border-white dark:border-slate-800 relative overflow-hidden group select-none active:scale-95 ${
                            isCompleted 
                              ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-200/50 dark:shadow-none' 
                              : 'bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-200/50 dark:shadow-none'
                          }`}
                        >
                          <div className="text-4xl font-black tracking-tight z-10 flex flex-col items-center">
                            <span>{toArabicNumbers(currentCount)}</span>
                            <span className="text-xs font-extrabold text-indigo-100 border-t border-white/20 mt-1.5 pt-1 w-16 text-center">
                              من {toArabicNumbers(currentItem.count)}
                            </span>
                          </div>

                          <span className="text-[11px] font-extrabold mt-2 tracking-wide z-10 bg-black/20 px-3 py-0.5 rounded-full">
                            {isCompleted ? 'تم الذكر بنجاح ✓' : 'انقر للتسجيل 📿'}
                          </span>
                        </button>

                        {/* Quick Navigation & Mark Done Controls */}
                        <div className="flex items-center gap-3 w-full justify-between pt-2">
                          <button
                            onClick={() => setCurrentDhikrIdx(prev => Math.max(0, prev - 1))}
                            disabled={currentDhikrIdx === 0}
                            className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <ChevronRight className="w-4 h-4" />
                            <span>السابق</span>
                          </button>

                          <button
                            onClick={() => handleMarkItemDone(selectedCategory, currentItem)}
                            className="py-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1 border border-emerald-200 dark:border-emerald-900/40"
                          >
                            <Check className="w-4 h-4" />
                            <span>تسجيل كـ مكتمل</span>
                          </button>

                          <button
                            onClick={() => setCurrentDhikrIdx(prev => Math.min(selectedCategory.items.length - 1, prev + 1))}
                            disabled={currentDhikrIdx === selectedCategory.items.length - 1}
                            className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>التالي</span>
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              )}

              {/* MODE 2: Full List Mode */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {selectedCategory.items.map((item, idx) => {
                    const currentCount = dayLogs[item.id] || 0;
                    const isCompleted = currentCount >= item.count;

                    return (
                      <div
                        key={item.id}
                        className={`p-5 rounded-3xl border transition-all space-y-3 text-right ${
                          isCompleted
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                            : 'bg-white dark:bg-[#161d26] border-slate-200/80 dark:border-slate-800/80'
                        }`}
                      >
                        {/* Title bar */}
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {toArabicNumbers(idx + 1)}
                            </span>
                            <span className="font-extrabold text-sm text-slate-800 dark:text-white">
                              {item.title || `الذكر ${toArabicNumbers(idx + 1)}`}
                            </span>
                          </div>

                          <span className={`text-xs font-black px-3 py-1 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            {toArabicNumbers(currentCount)} / {toArabicNumbers(item.count)}
                          </span>
                        </div>

                        {/* Timing note */}
                        {(item.timingNote || item.description) && (
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 rounded-md inline-block">
                            {item.timingNote || item.description}
                          </span>
                        )}

                        {/* Arabic text */}
                        <p className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed py-1">
                          {item.text}
                        </p>

                        {/* Virtue */}
                        {item.reward && (
                          <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span><strong>الفضل:</strong> {item.reward}</span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-2">
                          <button
                            onClick={() => handleIncrementCategoryItem(item)}
                            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span>تسبيح (+1)</span>
                          </button>

                          <button
                            onClick={() => handleMarkItemDone(selectedCategory, item)}
                            className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                              isCompleted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            <span>{isCompleted ? 'مكتمل ✓' : 'تسجيل كـ مكتمل'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-[#161d26] rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center space-y-6 flex flex-col items-center shadow-lg"
            >
              <div className="inline-flex p-5 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white rounded-full shadow-lg shadow-emerald-100 dark:shadow-none animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">تقبل الله طاعاتكم وغفر ذنوبكم!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed font-semibold">
                  لقد أتممت قراءة {selectedCategory.arabicName} لليوم بنجاح، جعلها الله حصناً حصيناً وحفظاً مباركاً في يومك وليلتك 🤍
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 italic font-bold bg-indigo-50/50 dark:bg-indigo-950/20 py-2 px-4 rounded-xl inline-block mt-2">
                  "ألا بذكرِ الله تطمئنُّ القلوب"
                </p>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="py-3 px-8 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                العودة لقائمة الأذكار الأخرى
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* VIEW: Electronic Tasbeeh (المسبحة الإلكترونية) */}
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

            {/* Circular counter button with particles */}
            <div className="relative flex items-center justify-center">
              {/* Sparkle particle overlays */}
              <div className="absolute pointer-events-none inset-0 flex items-center justify-center overflow-visible z-30">
                <AnimatePresence>
                  {particles.map(p => (
                    <motion.span
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.5, y: 0, x: p.x }}
                      animate={{ opacity: 1, scale: 1.25, y: p.y }}
                      exit={{ opacity: 0, scale: 0.8, y: p.y - 15 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute text-xs font-black px-2.5 py-1 bg-indigo-600 dark:bg-indigo-700 text-white rounded-full shadow-md select-none pointer-events-none whitespace-nowrap"
                    >
                      {p.text}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>

              {/* Outer Breathing rings */}
              <div className="absolute w-56 h-56 rounded-full border border-indigo-500/25 dark:border-indigo-500/10 animate-ping pointer-events-none" />

              <button
                onClick={handleIncrementTasbeeh}
                className="w-56 h-56 rounded-full bg-slate-50 dark:bg-[#111720] border border-[#e2e8f0] dark:border-slate-800 hover:scale-105 active:scale-95 flex flex-col items-center justify-center transition-all cursor-pointer relative shadow-inner group overflow-hidden"
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

                <div className="text-center space-y-1 z-10 select-none">
                  <span className="text-5xl font-black text-slate-800 dark:text-white tracking-tight">
                    {toArabicNumbers(tasbeehCount)}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">
                    الهدف: {toArabicNumbers(tasbeehTarget)}
                  </span>
                </div>
              </button>
            </div>

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
            const x = e.clientX;
            const y = e.clientY;
            const sparks = ['+١', '✨', 'سُبْحَانَ اللهِ', 'الْحَمْدُ للهِ', 'اللهُ أَكْبَرُ', 'أَسْتَغْفِرُ اللهَ', '🤍', 'أجر'];
            const randomSpark = sparks[Math.floor(Math.random() * sparks.length)];
            spawnFocusParticle(randomSpark, x, y);

            if (selectedCategory) {
              if (!showCelebration) {
                const currentItem = selectedCategory.items[currentDhikrIdx];
                handleIncrementCategoryItem(currentItem);
              }
            } else if (activeTab === 'tasbeeh') {
              handleIncrementTasbeeh();
            }
          }}
          className="fixed inset-0 z-50 flex flex-col justify-between p-6 cursor-pointer select-none text-right transition-all duration-500 bg-[#faf7f0] dark:bg-[#0c1017] text-slate-800 dark:text-slate-100 overflow-hidden"
          dir="rtl"
        >
          {/* Floating focus particles */}
          <AnimatePresence>
            {focusParticles.map(p => (
              <motion.span
                key={p.id}
                initial={{ opacity: 0, scale: 0.5, x: p.x, y: p.y }}
                animate={{ opacity: 1, scale: 1.3, y: p.y - 100 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="fixed z-50 text-sm font-extrabold px-3 py-1.5 bg-indigo-600 dark:bg-indigo-700 text-white rounded-full shadow-lg pointer-events-none whitespace-nowrap"
                style={{ left: p.x - 40, top: p.y }}
              >
                {p.text}
              </motion.span>
            ))}
          </AnimatePresence>

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
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto px-4 text-center">
            {selectedCategory ? (
              <div className="space-y-6">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-wider uppercase block">
                  {selectedCategory.arabicName} • الذكر {toArabicNumbers(currentDhikrIdx + 1)} من {toArabicNumbers(selectedCategory.items.length)}
                </span>
                <h1 className="text-xl md:text-2xl font-black leading-relaxed text-slate-800 dark:text-slate-100">
                  {selectedCategory.items[currentDhikrIdx].text}
                </h1>
                {selectedCategory.items[currentDhikrIdx].reward && (
                  <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 leading-relaxed font-semibold max-w-lg mx-auto">
                    {selectedCategory.items[currentDhikrIdx].reward}
                  </p>
                )}
                
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-6xl font-black text-indigo-700 dark:text-indigo-400 font-mono tracking-tight animate-pulse">
                    {toArabicNumbers(dayLogs[selectedCategory.items[currentDhikrIdx].id] || 0)} / {toArabicNumbers(selectedCategory.items[currentDhikrIdx].count)}
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">انقر في أي مكان على الشاشة للتكرار</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-wider uppercase block">
                  المسبحة الإلكترونية التفاعلية
                </span>
                <h1 className="text-2xl md:text-3xl font-black leading-relaxed text-slate-800 dark:text-slate-100">
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

      {/* Celebration Modal for Tasbeeh */}
      <AnimatePresence>
        {tasbeehSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="bg-white dark:bg-[#161d26] rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 text-center max-w-sm w-full space-y-5 shadow-2xl relative overflow-hidden"
              dir="rtl"
            >
              <div className="inline-flex p-4 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-100 dark:shadow-none animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-white">ما شاء الله، إنجاز رائع!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  لقد أتممت تسبيح ({activeTasbeehText}) للعدد المستهدف ({toArabicNumbers(tasbeehTarget)}) بنجاح 🤍
                </p>
              </div>
              <button
                onClick={() => setTasbeehSuccessModal(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all cursor-pointer"
              >
                متابعة الذكر والتسبيح
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
