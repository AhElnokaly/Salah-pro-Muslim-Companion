/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Heart,
  Flame,
  CheckCheck,
  Star,
  Compass,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ADHKAR_DATA, FREE_TASBEEH_PRESETS, DhikrCategory, DhikrItem } from '../utils/adhkarData';
import { getSevenStationsProgress } from '../utils/adhkarCalc';
import { toArabicNumbers } from '../utils/hijri';
import SmartAdhkarSuggestions from './SmartAdhkarSuggestions';

interface AdhkarTrackerProps {
  dhikrLogs: Record<string, Record<string, number>>;
  setDhikrLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  currentPrayer?: string;
  prayerTimes?: any;
}

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface AdhkarStation {
  id: 'morning' | 'fajr' | 'dhuhr' | 'asr' | 'evening' | 'maghrib' | 'isha';
  title: string;
  shortName: string;
  categoryType: 'morning' | 'evening' | 'after_prayer';
  prayerKey?: PrayerKey;
  icon: string;
  timeLabel: string;
}

export const SEVEN_STATIONS: AdhkarStation[] = [
  { id: 'morning', title: 'أذكار الصباح', shortName: 'الصباح', categoryType: 'morning', icon: '🌅', timeLabel: 'من طلوع الفجر إلى صلاة الظهر' },
  { id: 'fajr', title: 'أذكار صلاة الفجر', shortName: 'الفجر', categoryType: 'after_prayer', prayerKey: 'fajr', icon: '🕌', timeLabel: 'عقب صلاة الفجر' },
  { id: 'dhuhr', title: 'أذكار صلاة الظهر', shortName: 'الظهر', categoryType: 'after_prayer', prayerKey: 'dhuhr', icon: '☀️', timeLabel: 'عقب صلاة الظهر' },
  { id: 'asr', title: 'أذكار صلاة العصر', shortName: 'العصر', categoryType: 'after_prayer', prayerKey: 'asr', icon: '🌤️', timeLabel: 'عقب صلاة العصر' },
  { id: 'evening', title: 'أذكار المساء', shortName: 'المساء', categoryType: 'evening', icon: '🌆', timeLabel: 'من العصر إلى منتصف الليل' },
  { id: 'maghrib', title: 'أذكار صلاة المغرب', shortName: 'المغرب', categoryType: 'after_prayer', prayerKey: 'maghrib', icon: '🌅', timeLabel: 'عقب صلاة المغرب' },
  { id: 'isha', title: 'أذكار صلاة العشاء', shortName: 'العشاء', categoryType: 'after_prayer', prayerKey: 'isha', icon: '🌌', timeLabel: 'عقب صلاة العشاء' },
];

export const PRAYER_SWITCHER: Array<{ key: PrayerKey; name: string; icon: string }> = [
  { key: 'fajr', name: 'الفجر', icon: '🌅' },
  { key: 'dhuhr', name: 'الظهر', icon: '☀️' },
  { key: 'asr', name: 'العصر', icon: '🌤️' },
  { key: 'maghrib', name: 'المغرب', icon: '🌆' },
  { key: 'isha', name: 'العشاء', icon: '🌌' },
];

/**
 * Component for rendering the 7-Station Segmented Progress Bar
 */
const SevenSegmentProgressBar: React.FC<{
  dayLogs: Record<string, number>;
  activePrayerKey: PrayerKey;
  onStationSelect: (station: AdhkarStation) => void;
}> = ({ dayLogs, activePrayerKey, onStationSelect }) => {
  // Calculate completion for each of the 7 stations
  const { stations: stationsData, completedStationsCount, overallPercentage } = useMemo(() => {
    return getSevenStationsProgress(dayLogs, activePrayerKey);
  }, [dayLogs, activePrayerKey]);

  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-4 text-right transition-all">
      {/* Top Header & Daily Completion Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">📿</span>
            <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
              <span>شريط محطات الأذكار السبع اليومية</span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                {toArabicNumbers(completedStationsCount)} من ٧ محطات ({toArabicNumbers(overallPercentage)}%)
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            أذكار الصباح والمساء بالإضافة لأذكار الصلوات الخمس. تتجدد أذكار كل صلاة مع دخول وقتها وتظل أذكار الصباح والمساء لليوم كاملاً.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {completedStationsCount === 7 && (
            <span className="text-xs font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-900/40 flex items-center gap-1 animate-pulse">
              <Award className="w-4 h-4 text-amber-500" />
              <span>تاج الورد اليومي مكتمل! 🏆</span>
            </span>
          )}
        </div>
      </div>

      {/* 7-Segment Bar Buttons */}
      <div className="grid grid-cols-7 gap-1.5 md:gap-2 pt-1">
        {stationsData.map((st) => (
          <button
            key={st.id}
            onClick={() => onStationSelect(st)}
            title={`${st.title}: ${toArabicNumbers(st.completedItems)}/${toArabicNumbers(st.totalItems)} ذكر (${toArabicNumbers(st.percent)}%)`}
            className={`group relative flex flex-col items-center justify-between p-2 md:p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
              st.isDone
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                : st.isPartial
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : st.isCurrentTimeStation
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400/50'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between w-full text-[10px] font-bold opacity-90">
              <span>{st.icon}</span>
              {st.isDone ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : st.isCurrentTimeStation ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              ) : null}
            </div>

            {/* Label */}
            <span className="text-[11px] font-black my-1 truncate w-full text-center">
              {st.shortName}
            </span>

            {/* Progress Percentage or Bar Fill */}
            <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mt-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  st.isDone ? 'bg-white' : 'bg-emerald-500 dark:bg-emerald-400'
                }`}
                style={{ width: `${st.percent}%` }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Segment Legend Notes */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>مكتمل بالكامل</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>قيد القراءة</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            <span>الوقت الحالي</span>
          </span>
        </div>
        <span>انقر على أي محطة للانتقال المباشر إليها ⚡</span>
      </div>
    </div>
  );
};

export default function AdhkarTracker({
  dhikrLogs,
  setDhikrLogs,
  currentPrayer = 'Fajr',
}: AdhkarTrackerProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'smart_suggestions' | 'tasbeeh'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<DhikrCategory | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Map string currentPrayer ('Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha') to PrayerKey
  const activePrayerKey: PrayerKey = useMemo(() => {
    const p = (currentPrayer || '').toLowerCase();
    if (p.includes('dhuhr') || p.includes('zuhr')) return 'dhuhr';
    if (p.includes('asr')) return 'asr';
    if (p.includes('maghrib')) return 'maghrib';
    if (p.includes('isha')) return 'isha';
    return 'fajr';
  }, [currentPrayer]);

  // Selected Prayer for Post-Prayer Adhkar (أذكار بعد الصلاة)
  const [selectedPrayerForPostAdhkar, setSelectedPrayerForPostAdhkar] = useState<PrayerKey>(activePrayerKey);

  // Keep post-prayer selection aligned when current active prayer changes
  useEffect(() => {
    setSelectedPrayerForPostAdhkar(activePrayerKey);
  }, [activePrayerKey]);

  // States for Category Sequence Reader
  const [currentDhikrIdx, setCurrentDhikrIdx] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  // States for interactive particles
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; text: string }>>([]);
  const [tasbeehSuccessModal, setTasbeehSuccessModal] = useState(false);

  // States for Electronic Tasbeeh
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

  const todayStr = new Date().toISOString().split('T')[0];
  const dayLogs = dhikrLogs[todayStr] || {};

  // Feedback Trigger
  const triggerFeedback = (type: 'tap' | 'completed_dhikr' | 'completed_category' = 'tap') => {
    if (navigator.vibrate) {
      if (type === 'tap') navigator.vibrate(15);
      else if (type === 'completed_dhikr') navigator.vibrate([45, 65, 45]);
      else if (type === 'completed_category') navigator.vibrate([90, 55, 90, 55, 130]);
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
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime);
          osc3.frequency.setValueAtTime(783.99, ctx.currentTime);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
          osc.start(); osc2.start(); osc3.start();
          osc.stop(ctx.currentTime + 0.6); osc2.stop(ctx.currentTime + 0.6); osc3.stop(ctx.currentTime + 0.6);
        } else if (type === 'completed_dhikr') {
          osc.frequency.setValueAtTime(659.25, ctx.currentTime);
          osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        } else {
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
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

  /**
   * Helper to resolve item key depending on category
   */
  const getItemStorageKey = (catId: string, itemId: string, prayerKey: PrayerKey = selectedPrayerForPostAdhkar) => {
    if (catId === 'after_prayer') {
      return `${prayerKey}_${itemId}`;
    }
    return itemId;
  };

  /**
   * Read current count of item
   */
  const getItemCurrentCount = (catId: string, itemId: string, prayerKey: PrayerKey = selectedPrayerForPostAdhkar) => {
    const storageKey = getItemStorageKey(catId, itemId, prayerKey);
    if (dayLogs[storageKey] !== undefined) {
      return dayLogs[storageKey];
    }
    // Fallback if user logged before without prayer prefix
    if (catId === 'after_prayer' && dayLogs[itemId] !== undefined) {
      return dayLogs[itemId];
    }
    return 0;
  };

  /**
   * Helper to update single item count in dhikrLogs state
   */
  const updateItemCount = (cat: DhikrCategory, item: DhikrItem, delta: number = 1, setExact?: number) => {
    const storageKey = getItemStorageKey(cat.id, item.id, selectedPrayerForPostAdhkar);

    setDhikrLogs(prev => {
      const currentDay = prev[todayStr] || {};
      const currentItemCount = currentDay[storageKey] !== undefined ? currentDay[storageKey] : (currentDay[item.id] || 0);
      
      let updatedCount = setExact !== undefined ? setExact : currentItemCount + delta;
      if (updatedCount < 0) updatedCount = 0;

      const updatedDay = {
        ...currentDay,
        [storageKey]: updatedCount
      };

      // Recalculate completed count for category
      let completedCount = 0;
      cat.items.forEach(it => {
        const k = getItemStorageKey(cat.id, it.id, selectedPrayerForPostAdhkar);
        const countVal = updatedDay[k] !== undefined ? updatedDay[k] : (updatedDay[it.id] || 0);
        if (countVal >= it.count) {
          completedCount++;
        }
      });

      const catSummaryKey = cat.id === 'after_prayer' ? `after_prayer_${selectedPrayerForPostAdhkar}` : cat.id;
      updatedDay[catSummaryKey] = completedCount;

      return {
        ...prev,
        [todayStr]: updatedDay
      };
    });
  };

  // Increment current Category item count
  const handleIncrementCategoryItem = (item: DhikrItem) => {
    if (!selectedCategory) return;
    const currentCount = getItemCurrentCount(selectedCategory.id, item.id);
    
    handleSpawnTapParticles();

    if (currentCount + 1 < item.count) {
      triggerFeedback('tap');
      updateItemCount(selectedCategory, item, 1);
    } else {
      // Completed this item!
      triggerFeedback('completed_dhikr');
      updateItemCount(selectedCategory, item, 1);

      // Check if all items in category for this prayer are now done
      let allDone = true;
      selectedCategory.items.forEach(it => {
        const countVal = it.id === item.id ? item.count : getItemCurrentCount(selectedCategory.id, it.id);
        if (countVal < it.count) allDone = false;
      });

      if (allDone) {
        triggerFeedback('completed_category');
        setShowCelebration(true);
      } else if (currentDhikrIdx + 1 < selectedCategory.items.length) {
        // Automatically advance to next unfinished item
        let nextIdx = currentDhikrIdx + 1;
        while (nextIdx < selectedCategory.items.length) {
          const nextItem = selectedCategory.items[nextIdx];
          const c = getItemCurrentCount(selectedCategory.id, nextItem.id);
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
      const c = it.id === item.id ? item.count : getItemCurrentCount(cat.id, it.id);
      if (c < it.count) allDone = false;
    });

    if (allDone) {
      triggerFeedback('completed_category');
      setShowCelebration(true);
    }
  };

  // Reset category items for current selection/prayer
  const handleResetCategory = (cat: DhikrCategory) => {
    setDhikrLogs(prev => {
      const currentDay = { ...(prev[todayStr] || {}) };
      cat.items.forEach(it => {
        const k = getItemStorageKey(cat.id, it.id, selectedPrayerForPostAdhkar);
        delete currentDay[k];
      });
      const catSummaryKey = cat.id === 'after_prayer' ? `after_prayer_${selectedPrayerForPostAdhkar}` : cat.id;
      delete currentDay[catSummaryKey];
      return {
        ...prev,
        [todayStr]: currentDay
      };
    });
    setCurrentDhikrIdx(0);
    setShowCelebration(false);
  };

  // Select station from 7-Segment Bar
  const handleStationSelect = (station: AdhkarStation) => {
    const cat = ADHKAR_DATA.find(c => c.id === station.categoryType);
    if (cat) {
      if (station.prayerKey) {
        setSelectedPrayerForPostAdhkar(station.prayerKey);
      }
      setSelectedCategory(cat);
      setCurrentDhikrIdx(0);
      setShowCelebration(false);
      setViewMode('cards');
    }
  };

  // Electronic Tasbeeh Handler
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

  return (
    <div id="adhkar-tracker-root" className="space-y-6 text-right" dir="rtl">
      
      {/* Header Navigation Tabs */}
      {!selectedCategory && (
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-3 text-center text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            محطات الأذكار السبع
          </button>
          <button
            onClick={() => setActiveTab('smart_suggestions')}
            className={`flex-1 py-3 text-center text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'smart_suggestions'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>اقتراحات ذكية واستشارات</span>
          </button>
          <button
            onClick={() => setActiveTab('tasbeeh')}
            className={`flex-1 py-3 text-center text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'tasbeeh'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            المسبحة الإلكترونية
          </button>
        </div>
      )}

      {/* VIEW: Main Categories List with 7-Segment Progress Bar */}
      {activeTab === 'categories' && !selectedCategory && (
        <div className="space-y-6">
          
          {/* THE 7-SEGMENT DAILY PROGRESS BAR */}
          <SevenSegmentProgressBar 
            dayLogs={dayLogs}
            activePrayerKey={activePrayerKey}
            onStationSelect={handleStationSelect}
          />

          {/* Contextual Smart Suggestion Banner */}
          <div className="p-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl shadow-md border border-indigo-700/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-300/30 text-xl">
                ✨
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-300 block mb-0.5">المرشد الإيماني للوقت الحالي:</span>
                <h4 className="text-sm font-black">
                  {activePrayerKey === 'fajr' && 'قد حان وقت أذكار صلاة الفجر المكتوبة وأذكار الصباح 🌅'}
                  {activePrayerKey === 'dhuhr' && 'قد حان وقت أذكار صلاة الظهر المكتوبة ☀️'}
                  {activePrayerKey === 'asr' && 'قد حان وقت أذكار صلاة العصر وأذكار المساء 🌆'}
                  {activePrayerKey === 'maghrib' && 'قد حان وقت أذكار صلاة المغرب المكتوبة <ctrl42>'}
                  {activePrayerKey === 'isha' && 'قد حان وقت أذكار صلاة العشاء المكتوبة 🌌'}
                </h4>
              </div>
            </div>

            <button
              onClick={() => {
                const targetStation = SEVEN_STATIONS.find(s => s.prayerKey === activePrayerKey) || SEVEN_STATIONS[0];
                handleStationSelect(targetStation);
              }}
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>ابدأ ورد الصلاة الحالي الآن</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Header Bar */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 flex items-center justify-between transition-colors duration-300 shadow-xs">
            <div className="space-y-1 text-right">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>أقسام الأوراد والأذكار المكتوبة</span>
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                اختر الفئة المطلوبة أو تصفح بطاقات الأذكار مع توضيح الفضل والتكرار.
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

          {/* Categories Grid */}
          <div className="grid grid-cols-1 gap-4">
            {ADHKAR_DATA.map((cat) => {
              // Calculate completed count
              let completedItems = 0;
              cat.items.forEach(it => {
                const countVal = getItemCurrentCount(cat.id, it.id, activePrayerKey);
                if (countVal >= it.count) completedItems++;
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
                      <span>فتح وقراءة الأذكار</span>
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
                      <span>عرض القائمة</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: Selected Category Details */}
      {selectedCategory && (
        <div className="space-y-5">
          {/* Top Bar navigation */}
          <div className="flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-[#161d26] p-4 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
            <button
              onClick={() => setSelectedCategory(null)}
              className="py-2 px-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>رجوع للمحطات</span>
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
                >
                  قائمة
                </button>
              </div>

              <button
                onClick={() => setIsFocusMode(true)}
                className="py-2 px-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-colors cursor-pointer text-xs font-black flex items-center gap-1"
                title="وضع التركيز بملء الشاشة"
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

          {/* POST-PRAYER SWITCHER PILLS (In Post-Prayer Category) */}
          {selectedCategory.id === 'after_prayer' && (
            <div className="bg-white dark:bg-[#161d26] p-3.5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>اختر الصلاة التي تتلو أذكارها الآن:</span>
              </span>
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                {PRAYER_SWITCHER.map(p => {
                  const isSelected = selectedPrayerForPostAdhkar === p.key;
                  const isCurrentActive = activePrayerKey === p.key;
                  
                  // Calculate prayer completion
                  let prayerDone = true;
                  selectedCategory.items.forEach(it => {
                    const c = getItemCurrentCount('after_prayer', it.id, p.key);
                    if (c < it.count) prayerDone = false;
                  });

                  return (
                    <button
                      key={p.key}
                      onClick={() => {
                        setSelectedPrayerForPostAdhkar(p.key);
                        setCurrentDhikrIdx(0);
                        setShowCelebration(false);
                      }}
                      className={`py-2 px-1.5 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-600 text-white shadow-md' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-sm">{p.icon}</span>
                      <span>{p.name}</span>
                      {prayerDone && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                      )}
                      {isCurrentActive && !prayerDone && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                    const currentCount = getItemCurrentCount(selectedCategory.id, currentItem.id);
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
                    const currentCount = getItemCurrentCount(selectedCategory.id, item.id);
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
                  لقد أتممت قراءة {selectedCategory.arabicName} {selectedCategory.id === 'after_prayer' ? `لصلاة (${PRAYER_SWITCHER.find(p => p.key === selectedPrayerForPostAdhkar)?.name})` : ''} بنجاح، جعلها الله حصناً حصيناً وحفظاً مباركاً 🤍
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 italic font-bold bg-indigo-50/50 dark:bg-indigo-950/20 py-2 px-4 rounded-xl inline-block mt-2">
                  "ألا بذكرِ الله تطمئنُّ القلوب"
                </p>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="py-3 px-8 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                العودة لمحطات الأذكار الأخرى
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* VIEW: Smart Suggestions & AI Assistant */}
      {activeTab === 'smart_suggestions' && (
        <SmartAdhkarSuggestions
          onAddToCustomTasbeeh={(text) => {
            setCustomTasbeehs(prev => [...prev, text]);
            setActiveTab('tasbeeh');
            setIsCustomTasbeeh(true);
          }}
          completedStationsCount={
            SEVEN_STATIONS.filter(st => {
              const catKey = st.categoryType === 'after_prayer' ? `after_prayer_${selectedPrayerForPostAdhkar}` : st.id;
              return (dayLogs[catKey] || 0) > 0;
            }).length
          }
          activePrayerName={activePrayerKey}
          isPushGranted={'Notification' in window && Notification.permission === 'granted'}
        />
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
                    value={customTasbeehText}
                    onChange={(e) => setCustomTasbeehText(e.target.value)}
                    placeholder="اكتب صيغة الذكر الخاص بك..."
                    className="flex-1 py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => {
                      if (customTasbeehText.trim()) {
                        setCustomTasbeehs(prev => [...prev, customTasbeehText.trim()]);
                      }
                    }}
                    className="py-2 px-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    حفظ
                  </button>
                </div>

                {customTasbeehs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {customTasbeehs.map((txt) => (
                      <span
                        key={txt}
                        onClick={() => {
                          setCustomTasbeehText(txt);
                          setTasbeehCount(0);
                        }}
                        className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer hover:bg-slate-200"
                      >
                        <span>{txt}</span>
                        <Trash2 
                          className="w-3 h-3 text-red-500 hover:text-red-700" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomTasbeehs(prev => prev.filter(t => t !== txt));
                          }}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive Counter Ring */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center justify-center space-y-6 shadow-xs relative overflow-hidden">
            
            {/* Target Selectors */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الهدف:</span>
              {[33, 100, 1000].map(tgt => (
                <button
                  key={tgt}
                  onClick={() => {
                    setTasbeehTarget(tgt);
                    setTasbeehCount(0);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                    tasbeehTarget === tgt 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {toArabicNumbers(tgt)}
                </button>
              ))}
            </div>

            {/* Main Tasbeeh Button */}
            <button
              onClick={handleIncrementTasbeeh}
              className="w-52 h-52 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white flex flex-col items-center justify-center shadow-xl shadow-indigo-200/50 dark:shadow-none border-4 border-white dark:border-slate-800 cursor-pointer active:scale-95 transition-all relative select-none"
            >
              <span className="text-5xl font-black">{toArabicNumbers(tasbeehCount)}</span>
              <span className="text-xs font-extrabold text-indigo-100 mt-1 border-t border-white/20 pt-1 px-4">
                من {toArabicNumbers(tasbeehTarget)}
              </span>
              <span className="text-[11px] font-extrabold mt-2 bg-black/20 px-3 py-0.5 rounded-full">
                اضغط للتسبيح 📿
              </span>
            </button>

            {/* Current Text Display */}
            <p className="text-base font-black text-slate-800 dark:text-white text-center max-w-sm">
              {isCustomTasbeeh ? (customTasbeehText || 'سُبْحَانَ اللهِ') : FREE_TASBEEH_PRESETS[tasbeehPresetIdx].text}
            </p>

            <button
              onClick={() => setTasbeehCount(0)}
              className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة العداد</span>
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Focus Mode Modal */}
      {isFocusMode && selectedCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-6 text-white text-right" dir="rtl">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <button
              onClick={() => setIsFocusMode(false)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-2xl cursor-pointer text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center">
              <h3 className="font-black text-lg text-amber-300">{selectedCategory.arabicName}</h3>
              <p className="text-xs text-slate-300">وضع التركيز بملء الشاشة</p>
            </div>
            <span className="text-xs font-bold text-slate-300 bg-white/10 px-3 py-1 rounded-full">
              {toArabicNumbers(currentDhikrIdx + 1)} / {toArabicNumbers(selectedCategory.items.length)}
            </span>
          </div>

          {/* Body content */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto space-y-6">
            <p className="text-2xl md:text-3xl font-black text-center leading-relaxed select-text">
              {selectedCategory.items[currentDhikrIdx].text}
            </p>

            {selectedCategory.items[currentDhikrIdx].reward && (
              <p className="text-xs text-emerald-300 bg-emerald-950/40 p-3 rounded-2xl border border-emerald-800/40 text-center max-w-md">
                ✨ {selectedCategory.items[currentDhikrIdx].reward}
              </p>
            )}

            {/* Huge Tap Button */}
            {(() => {
              const currentItem = selectedCategory.items[currentDhikrIdx];
              const currentCount = getItemCurrentCount(selectedCategory.id, currentItem.id);
              const isCompleted = currentCount >= currentItem.count;

              return (
                <button
                  onClick={() => handleIncrementCategoryItem(currentItem)}
                  className={`w-48 h-48 rounded-full text-white flex flex-col items-center justify-center shadow-2xl transition-all cursor-pointer border-4 border-white/20 active:scale-95 ${
                    isCompleted ? 'bg-emerald-600' : 'bg-indigo-600'
                  }`}
                >
                  <span className="text-5xl font-black">{toArabicNumbers(currentCount)}</span>
                  <span className="text-xs font-extrabold mt-1 text-indigo-100">
                    من {toArabicNumbers(currentItem.count)}
                  </span>
                  <span className="text-[11px] font-extrabold mt-2 bg-black/30 px-3 py-0.5 rounded-full">
                    {isCompleted ? 'مكتمل ✓' : 'انقر للتسجيل'}
                  </span>
                </button>
              );
            })()}
          </div>

          {/* Footer Controls */}
          <div className="flex justify-between items-center border-t border-white/10 pt-4 max-w-2xl mx-auto w-full">
            <button
              onClick={() => setCurrentDhikrIdx(prev => Math.max(0, prev - 1))}
              disabled={currentDhikrIdx === 0}
              className="py-2.5 px-4 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-2xl text-xs font-bold cursor-pointer flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              onClick={() => setCurrentDhikrIdx(prev => Math.min(selectedCategory.items.length - 1, prev + 1))}
              disabled={currentDhikrIdx === selectedCategory.items.length - 1}
              className="py-2.5 px-4 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-2xl text-xs font-bold cursor-pointer flex items-center gap-1"
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
