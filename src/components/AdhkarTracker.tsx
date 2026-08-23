/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { safeSetItem } from '../utils/storage';
import type { PrayerTimes } from '../types';
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
  X,
  Search,
  Copy,
  Share2,
  Type,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ADHKAR_DATA, FREE_TASBEEH_PRESETS, DhikrCategory, DhikrItem, isDhikrItemVisible, getDhikrItemRequiredCount } from '../utils/adhkarData';
import { getSevenStationsProgress, SEVEN_STATIONS, PrayerKey, AdhkarStation } from '../utils/adhkarCalc';
import { toArabicNumbers } from '../utils/hijri';
import SmartAdhkarSuggestions from './SmartAdhkarSuggestions';
import { trackFeatureCompletion } from '../utils/analyticsStorage';
import { formatDateKey } from '../utils/prayerDayBoundary';

interface AdhkarTrackerProps {
  dhikrLogs: Record<string, Record<string, number>>;
  setDhikrLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  currentPrayer?: string;
  prayerTimes?: PrayerTimes;
  onNavigateTab?: (tab: string) => void;
  onOpenNotificationsModal?: () => void;
  targetPrayerKey?: PrayerKey | null;
}



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
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-4 text-right transition-all">
      {/* Top Header & Daily Completion Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-lg shadow-md shadow-emerald-500/20 shrink-0">
              📿
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-800 dark:text-white">
                  شريط محطات الأذكار السبع اليومية
                </h3>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                  {toArabicNumbers(completedStationsCount)} من ٧ محطات ({toArabicNumbers(overallPercentage)}%)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                أذكار الصباح والمساء بالإضافة لأذكار الصلوات الخمس المكتوبة.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {completedStationsCount === 7 ? (
            <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-3 py-1.5 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex items-center gap-1.5 shadow-sm animate-pulse">
              <Award className="w-4 h-4 text-amber-500 shrink-0" />
              <span>تاج الورد اليومي مكتمل! 🏆</span>
            </span>
          ) : (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>تتجدد محطة كل صلاة بوقتها</span>
            </div>
          )}
        </div>
      </div>

      {/* Overall Progress Micro-Bar */}
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/50">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-full transition-all duration-700 shadow-sm"
          style={{ width: `${overallPercentage}%` }}
        />
      </div>

      {/* 7-Station Cards Strip (Scrollable on Mobile, 7-Grid on Desktop) */}
      <div className="flex md:grid md:grid-cols-7 gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pt-1 pb-1 -mx-1 px-1">
        {stationsData.map((st) => (
          <motion.button
            key={st.id}
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -2 }}
            onClick={() => onStationSelect(st)}
            title={`${st.title}: ${toArabicNumbers(st.completedItems)}/${toArabicNumbers(st.totalItems)} ذكر (${toArabicNumbers(st.percent)}%)`}
            className={`group relative flex-1 min-w-[76px] md:min-w-0 snap-center flex flex-col items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden text-right ${
              st.isDone
                ? 'bg-gradient-to-b from-emerald-500 via-emerald-600 to-teal-700 text-white border-emerald-400/80 shadow-md shadow-emerald-500/20'
                : st.isPartial
                ? 'bg-gradient-to-b from-amber-500 via-amber-600 to-orange-600 text-white border-amber-300/80 shadow-md shadow-amber-500/20'
                : st.isCurrentTimeStation
                ? 'bg-gradient-to-b from-indigo-50/90 to-blue-50/90 dark:from-indigo-950/80 dark:to-slate-900 border-2 border-indigo-500 dark:border-indigo-400 text-indigo-950 dark:text-indigo-100 shadow-md shadow-indigo-500/15 ring-2 ring-indigo-400/30'
                : 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-emerald-50/50 dark:hover:bg-slate-750 hover:border-emerald-300/60'
            }`}
          >
            {/* Top Row: Icon + Badge Status */}
            <div className="flex items-center justify-between w-full text-[11px] font-extrabold gap-1">
              <span className="text-sm select-none">{st.icon}</span>
              {st.isDone ? (
                <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                </span>
              ) : st.isCurrentTimeStation ? (
                <span className="text-[9px] font-black bg-indigo-500 text-white px-1.5 py-0.2 rounded-full animate-pulse shadow-xs shrink-0">
                  الآن
                </span>
              ) : st.isPartial ? (
                <span className="text-[9px] font-black bg-white/20 text-white px-1.5 py-0.2 rounded-full shrink-0">
                  {toArabicNumbers(st.completedItems)}/{toArabicNumbers(st.totalItems)}
                </span>
              ) : (
                <span className="text-[9px] font-bold opacity-40">
                  {toArabicNumbers(st.totalItems)}
                </span>
              )}
            </div>

            {/* Station Label */}
            <span className="text-[11px] font-black my-1.5 whitespace-nowrap truncate w-full text-center tracking-tight">
              {st.shortName}
            </span>

            {/* Bottom Progress Line */}
            <div className="w-full h-1.5 bg-black/15 dark:bg-white/15 rounded-full overflow-hidden mt-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  st.isDone 
                    ? 'bg-white' 
                    : st.isPartial 
                    ? 'bg-white/90' 
                    : st.isCurrentTimeStation 
                    ? 'bg-indigo-500 dark:bg-indigo-400' 
                    : 'bg-emerald-500 dark:bg-emerald-400'
                }`}
                style={{ width: `${st.percent}%` }}
              />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Segment Legend Notes */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs" />
            <span>مكتملة بالكامل</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs" />
            <span>قيد القراءة</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shadow-xs" />
            <span>المحطة الحالية</span>
          </span>
        </div>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
          <span>اضغط على أي محطة للانتقال المباشر إليها</span>
          <span>⚡</span>
        </span>
      </div>
    </div>
  );
};

export default function AdhkarTracker({
  dhikrLogs,
  setDhikrLogs,
  currentPrayer = 'Fajr',
  onNavigateTab,
  onOpenNotificationsModal,
  targetPrayerKey,
}: AdhkarTrackerProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'favorites' | 'smart_suggestions' | 'tasbeeh'>('categories');
  const [hubSection, setHubSection] = useState<'main' | 'adhkar' | 'duas' | 'ruqyah' | 'hisn'>('main');
  const [selectedCategory, setSelectedCategory] = useState<DhikrCategory | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Search & Category Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilterGroup, setCategoryFilterGroup] = useState<'all' | 'favorites' | 'daily' | 'worship' | 'life' | 'distress' | 'misc'>('all');
  const [fontSize, setFontSize] = useState<'md' | 'lg' | 'xl'>('lg');
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  // Persistent Favorite Dhikr Category Pages list
  const [favoriteCategoryIds, setFavoriteCategoryIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mc_favorite_dhikr_categories');
      return saved ? JSON.parse(saved) : ['morning', 'evening', 'after_prayer'];
    } catch {
      return ['morning', 'evening', 'after_prayer'];
    }
  });

  useEffect(() => {
    safeSetItem('mc_favorite_dhikr_categories', JSON.stringify(favoriteCategoryIds));
  }, [favoriteCategoryIds]);

  const toggleFavoriteCategory = (catId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteCategoryIds(prev =>
      prev.includes(catId)
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    );
    triggerFeedback('tap');
  };

  // Persistent Favorite Dhikrs list
  const [favoriteDhikrIds, setFavoriteDhikrIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mc_favorite_dhikrs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    safeSetItem('mc_favorite_dhikrs', JSON.stringify(favoriteDhikrIds));
  }, [favoriteDhikrIds]);

  const toggleFavoriteDhikr = (dhikrId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteDhikrIds(prev =>
      prev.includes(dhikrId)
        ? prev.filter(id => id !== dhikrId)
        : [...prev, dhikrId]
    );
    triggerFeedback('tap');
  };

  const allFavoriteDhikrObjects = useMemo(() => {
    if (favoriteDhikrIds.length === 0) return [];
    const result: Array<{ category: DhikrCategory; item: DhikrItem }> = [];
    ADHKAR_DATA.forEach(cat => {
      cat.items.forEach(item => {
        if (favoriteDhikrIds.includes(item.id)) {
          result.push({ category: cat, item });
        }
      });
    });
    return result;
  }, [favoriteDhikrIds]);

  const handleCopyText = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedItemId(id);
      setTimeout(() => setCopiedItemId(null), 2000);
    }
  };

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

  // Keep post-prayer selection aligned when targetPrayerKey or current active prayer changes
  useEffect(() => {
    if (targetPrayerKey) {
      setSelectedPrayerForPostAdhkar(targetPrayerKey);
      const afterPrayerCat = ADHKAR_DATA.find(c => c.id === 'after_prayer');
      if (afterPrayerCat) {
        setSelectedCategory(afterPrayerCat);
        setActiveTab('categories');
        setViewMode('cards');
        setCurrentDhikrIdx(0);
      }
    } else {
      setSelectedPrayerForPostAdhkar(activePrayerKey);
    }
  }, [targetPrayerKey, activePrayerKey]);

  // States for Category Sequence Reader
  const [currentDhikrIdx, setCurrentDhikrIdx] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  // Computed filtered categories
  const filteredCategories = useMemo(() => {
    if (categoryFilterGroup === 'favorites') {
      return ADHKAR_DATA.filter(c => favoriteCategoryIds.includes(c.id));
    }
    if (categoryFilterGroup === 'daily') {
      return ADHKAR_DATA.filter(c => ['morning', 'evening', 'after_prayer', 'sleep', 'wake', 'insomnia'].includes(c.id));
    }
    if (categoryFilterGroup === 'worship') {
      return ADHKAR_DATA.filter(c => ['wudu', 'toilet', 'home', 'walk', 'mosque', 'adhan', 'istiftah', 'ruku'].includes(c.id));
    }
    if (categoryFilterGroup === 'life') {
      return ADHKAR_DATA.filter(c => ['dress', 'rain', 'travel', 'food', 'anger', 'istikhara', 'salawat'].includes(c.id));
    }
    if (categoryFilterGroup === 'distress') {
      return ADHKAR_DATA.filter(c => ['sick', 'worry', 'hajj', 'funeral', 'misc'].includes(c.id));
    }
    return ADHKAR_DATA;
  }, [categoryFilterGroup, favoriteCategoryIds]);

  // Sorted categories where starred/favorite pages rise to the top
  const sortedCategories = useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      const aFav = favoriteCategoryIds.includes(a.id);
      const bFav = favoriteCategoryIds.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  }, [filteredCategories, favoriteCategoryIds]);

  // Computed global search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    const results: Array<{ category: DhikrCategory; item: DhikrItem; itemIndex: number }> = [];

    ADHKAR_DATA.forEach(cat => {
      cat.items.forEach((item, idx) => {
        if (
          (item.title && item.title.toLowerCase().includes(query)) ||
          (item.text && item.text.toLowerCase().includes(query)) ||
          (item.reward && item.reward.toLowerCase().includes(query)) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
          (cat.arabicName && cat.arabicName.toLowerCase().includes(query))
        ) {
          results.push({ category: cat, item, itemIndex: idx });
        }
      });
    });
    return results;
  }, [searchQuery]);

  // States for interactive particles
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; text: string }>>([]);
  const [tasbeehSuccessModal, setTasbeehSuccessModal] = useState(false);

  // States for Electronic Tasbeeh
  const [tasbeehPresetIdx, setTasbeehPresetIdx] = useState(0);
  const [customTasbeehText, setCustomTasbeehText] = useState('');
  const [isCustomTasbeeh, setIsCustomTasbeeh] = useState(false);
  const [tasbeehCount, setTasbeehCount] = useState(0);
  const [tasbeehTarget, setTasbeehTarget] = useState(33);
  const [tasbeehColor, setTasbeehColor] = useState<string>(() => {
    try {
      return localStorage.getItem('salah_tasbih_color') || 'indigo';
    } catch {
      return 'indigo';
    }
  });

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
    safeSetItem('mc_custom_tasbeehs', JSON.stringify(customTasbeehs));
  }, [customTasbeehs]);

  const todayStr = formatDateKey(new Date());
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
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
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
   * Helper to filter visible items for a category based on selected prayer
   */
  const getCategoryVisibleItems = (cat: DhikrCategory, prayerKey: PrayerKey = selectedPrayerForPostAdhkar) => {
    if (cat.id === 'after_prayer') {
      return cat.items.filter(it => isDhikrItemVisible(it, prayerKey));
    }
    return cat.items;
  };

  /**
   * Helper to get target count for an item in a category
   */
  const getItemTargetCount = (catId: string, item: DhikrItem, prayerKey: PrayerKey = selectedPrayerForPostAdhkar) => {
    if (catId === 'after_prayer') {
      return getDhikrItemRequiredCount(item, prayerKey);
    }
    return item.count;
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
    return dayLogs[storageKey] !== undefined ? dayLogs[storageKey] : 0;
  };

  /**
   * Helper to update single item count in dhikrLogs state
   */
  const updateItemCount = (cat: DhikrCategory, item: DhikrItem, delta: number = 1, setExact?: number) => {
    const storageKey = getItemStorageKey(cat.id, item.id, selectedPrayerForPostAdhkar);
    const visibleItems = getCategoryVisibleItems(cat, selectedPrayerForPostAdhkar);

    setDhikrLogs(prev => {
      const currentDay = prev[todayStr] || {};
      const currentItemCount = currentDay[storageKey] !== undefined ? currentDay[storageKey] : 0;
      
      let updatedCount = setExact !== undefined ? setExact : currentItemCount + delta;
      if (updatedCount < 0) updatedCount = 0;

      const updatedDay = {
        ...currentDay,
        [storageKey]: updatedCount
      };

      // Recalculate completed count for category
      let completedCount = 0;
      visibleItems.forEach(it => {
        const k = getItemStorageKey(cat.id, it.id, selectedPrayerForPostAdhkar);
        const countVal = updatedDay[k] !== undefined ? updatedDay[k] : 0;
        const target = getItemTargetCount(cat.id, it, selectedPrayerForPostAdhkar);
        if (countVal >= target) {
          completedCount++;
        }
      });

      const catSummaryKey = cat.id === 'after_prayer' ? `after_prayer_${selectedPrayerForPostAdhkar}` : cat.id;
      updatedDay[catSummaryKey] = completedCount;

      if (completedCount === visibleItems.length && visibleItems.length > 0) {
        trackFeatureCompletion('adhkar');
      }

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
    const targetCount = getItemTargetCount(selectedCategory.id, item, selectedPrayerForPostAdhkar);
    const visibleItems = getCategoryVisibleItems(selectedCategory, selectedPrayerForPostAdhkar);
    
    handleSpawnTapParticles();

    if (currentCount + 1 < targetCount) {
      triggerFeedback('tap');
      updateItemCount(selectedCategory, item, 1);
    } else {
      // Completed this item!
      triggerFeedback('completed_dhikr');
      updateItemCount(selectedCategory, item, 1);

      // Check if all visible items in category for this prayer are now done
      let allDone = true;
      visibleItems.forEach(it => {
        const req = getItemTargetCount(selectedCategory.id, it, selectedPrayerForPostAdhkar);
        const countVal = it.id === item.id ? req : getItemCurrentCount(selectedCategory.id, it.id);
        if (countVal < req) allDone = false;
      });

      if (allDone) {
        triggerFeedback('completed_category');
        setShowCelebration(true);
      } else if (currentDhikrIdx + 1 < visibleItems.length) {
        // Automatically advance to next unfinished item
        let nextIdx = currentDhikrIdx + 1;
        while (nextIdx < visibleItems.length) {
          const nextItem = visibleItems[nextIdx];
          const req = getItemTargetCount(selectedCategory.id, nextItem, selectedPrayerForPostAdhkar);
          const c = getItemCurrentCount(selectedCategory.id, nextItem.id);
          if (c < req) {
            break;
          }
          nextIdx++;
        }
        if (nextIdx < visibleItems.length) {
          setCurrentDhikrIdx(nextIdx);
        }
      }
    }
  };

  // Mark an item as completely done
  const handleMarkItemDone = (cat: DhikrCategory, item: DhikrItem) => {
    const targetCount = getItemTargetCount(cat.id, item, selectedPrayerForPostAdhkar);
    const visibleItems = getCategoryVisibleItems(cat, selectedPrayerForPostAdhkar);

    triggerFeedback('completed_dhikr');
    updateItemCount(cat, item, 0, targetCount);

    let allDone = true;
    visibleItems.forEach(it => {
      const req = getItemTargetCount(cat.id, it, selectedPrayerForPostAdhkar);
      const c = it.id === item.id ? req : getItemCurrentCount(cat.id, it.id);
      if (c < req) allDone = false;
    });

    if (allDone) {
      triggerFeedback('completed_category');
      setShowCelebration(true);
    }
  };

  // Mark all items in category as done
  const handleMarkAllCategoryItemsDone = (cat: DhikrCategory) => {
    const visibleItems = getCategoryVisibleItems(cat, selectedPrayerForPostAdhkar);

    setDhikrLogs(prev => {
      const currentDay = { ...(prev[todayStr] || {}) };
      visibleItems.forEach(it => {
        const k = getItemStorageKey(cat.id, it.id, selectedPrayerForPostAdhkar);
        const target = getItemTargetCount(cat.id, it, selectedPrayerForPostAdhkar);
        currentDay[k] = target;
      });
      const catSummaryKey = cat.id === 'after_prayer' ? `after_prayer_${selectedPrayerForPostAdhkar}` : cat.id;
      currentDay[catSummaryKey] = visibleItems.length;
      return {
        ...prev,
        [todayStr]: currentDay
      };
    });

    triggerFeedback('completed_category');
    setShowCelebration(true);
  };

  // Reset category items for current selection/prayer
  const handleResetCategory = (cat: DhikrCategory) => {
    const visibleItems = getCategoryVisibleItems(cat, selectedPrayerForPostAdhkar);
    setDhikrLogs(prev => {
      const currentDay = { ...(prev[todayStr] || {}) };
      visibleItems.forEach(it => {
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
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 min-w-[130px] py-3 text-center text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            🏰 حصن المسلم
          </button>
          
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 min-w-[130px] py-3 text-center text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Star className={`w-4 h-4 ${(favoriteCategoryIds.length + favoriteDhikrIds.length) > 0 ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
            <span>المفضلة ⭐ ({toArabicNumbers(favoriteCategoryIds.length + favoriteDhikrIds.length)})</span>
          </button>

          <button
            onClick={() => setActiveTab('smart_suggestions')}
            className={`flex-1 min-w-[130px] py-3 text-center text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'smart_suggestions'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>اقتراحات ذكية</span>
          </button>

          <button
            onClick={() => setActiveTab('tasbeeh')}
            className={`flex-1 min-w-[130px] py-3 text-center text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tasbeeh'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            المسبحة الإلكترونية
          </button>
        </div>
      )}

      {/* VIEW: Favorite Dhikrs & Categories Tab */}
      {activeTab === 'favorites' && !selectedCategory && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-slate-900 p-5 rounded-3xl border border-amber-200/80 dark:border-amber-900/50 space-y-2 text-right shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-black text-amber-900 dark:text-amber-200 text-base flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                <span>صفحات وأذكار المفضلة</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-900/60 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800/60">
                  {toArabicNumbers(favoriteCategoryIds.length)} أقسام مفضلة ⭐
                </span>
                {favoriteDhikrIds.length > 0 && (
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-900/60 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800/60">
                    {toArabicNumbers(favoriteDhikrIds.length)} أذكار فردية ⭐
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
              تظهر هذه الأقسام والصفحات بتميز في أعلى القائمة الرئيسية لحصن المسلم، ويمكنك فتح أي صفحة مباشرة من هنا.
            </p>
          </div>

          {/* Section 1: Favorited Category Pages */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2 px-1">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>صفحات الأذكار المثبتة في الأعلى ({toArabicNumbers(favoriteCategoryIds.length)})</span>
            </h4>

            {favoriteCategoryIds.length === 0 ? (
              <div className="p-6 bg-white dark:bg-[#161d26] rounded-3xl text-center border border-slate-200/80 dark:border-slate-800 space-y-2">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">لم تقم بتثبيت أي صفحة أذكار في المفضلة بعد.</p>
                <p className="text-[11px] text-slate-400">انقر على رمز النجمة ⭐ بجوار اسم أذكار الصباح، المساء، النوم، إلخ لتظهر دائماً في الأعلى!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ADHKAR_DATA.filter(cat => favoriteCategoryIds.includes(cat.id)).map(cat => {
                  const visibleItems = getCategoryVisibleItems(cat, activePrayerKey);
                  let completedItems = 0;
                  visibleItems.forEach(it => {
                    const countVal = getItemCurrentCount(cat.id, it.id, activePrayerKey);
                    const target = getItemTargetCount(cat.id, it, activePrayerKey);
                    if (countVal >= target) completedItems++;
                  });
                  const percent = visibleItems.length > 0 ? Math.round((completedItems / visibleItems.length) * 100) : 0;

                  return (
                    <div
                      key={`fav_cat_${cat.id}`}
                      className="p-5 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/20 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-slate-900/90 rounded-3xl border-2 border-amber-300 dark:border-amber-700/80 ring-1 ring-amber-400/30 text-right flex flex-col justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-3 rounded-2xl shrink-0 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300">
                          {cat.id === 'morning' ? <Sun className="w-5 h-5" /> :
                           cat.id === 'evening' ? <Moon className="w-5 h-5" /> :
                           cat.id === 'after_prayer' ? <Award className="w-5 h-5" /> :
                           <BookOpen className="w-5 h-5" />}
                        </div>

                        <div className="space-y-1.5 flex-grow">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-black text-slate-800 dark:text-white">{cat.arabicName}</span>
                            <button
                              onClick={(e) => toggleFavoriteCategory(cat.id, e)}
                              className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 hover:scale-110 transition-transform cursor-pointer"
                              title="إزالة من المفضلة"
                            >
                              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{cat.description}</p>
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                              الإنجاز: {toArabicNumbers(completedItems)} / {toArabicNumbers(visibleItems.length)} ({toArabicNumbers(percent)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full pt-3 border-t border-amber-200/60 dark:border-amber-900/40">
                        <button
                          onClick={() => {
                            setSelectedCategory(cat);
                            setViewMode('cards');
                            setCurrentDhikrIdx(0);
                            setShowCelebration(false);
                          }}
                          className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>فتح الأذكار</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCategory(cat);
                            setViewMode('list');
                            setShowCelebration(false);
                          }}
                          className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-amber-50 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs border border-amber-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <ListFilter className="w-3.5 h-3.5" />
                          <span>قائمة</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Individual Favorited Dhikrs (if any) */}
          {allFavoriteDhikrObjects.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2 px-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>الأذكار الفردية المميزة بنجمة ({toArabicNumbers(allFavoriteDhikrObjects.length)})</span>
              </h4>

              <div className="space-y-4">
                {allFavoriteDhikrObjects.map(({ category, item }) => {
                  const currentCount = getItemCurrentCount(category.id, item.id);
                  const targetCount = getItemTargetCount(category.id, item, selectedPrayerForPostAdhkar);
                  const isCompleted = currentCount >= targetCount;

                  return (
                    <div
                      key={`fav_item_${category.id}_${item.id}`}
                      className={`p-5 rounded-3xl border transition-all space-y-3 text-right ${
                        isCompleted
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                          : 'bg-white dark:bg-[#161d26] border-slate-200 dark:border-slate-800 shadow-xs'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => toggleFavoriteDhikr(item.id, e)}
                            className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                            title="إزالة من المفضلة"
                          >
                            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                          </button>
                          <span className="font-extrabold text-sm text-slate-800 dark:text-white">
                            {category.arabicName} • {item.title || 'ذكر مفضل'}
                          </span>
                        </div>

                        <span className={`text-xs font-black px-3 py-1 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                        }`}>
                          {toArabicNumbers(currentCount)} / {toArabicNumbers(targetCount)}
                        </span>
                      </div>

                      {/* Text */}
                      <p className={`font-bold text-slate-800 dark:text-slate-100 leading-relaxed py-1 ${
                        fontSize === 'md' ? 'text-base' : fontSize === 'lg' ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
                      }`}>
                        {item.text}
                      </p>

                      {/* Virtue */}
                      {item.reward && (
                        <div className="p-3 bg-amber-100/50 dark:bg-amber-950/30 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 border border-amber-200/50 dark:border-amber-900/30">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span><strong>الفضل:</strong> {item.reward}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateItemCount(category, item, 1)}
                            className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>تسبيح (+1)</span>
                          </button>

                          <button
                            onClick={() => handleCopyText(item.text, item.id)}
                            className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-slate-700/60 transition-colors cursor-pointer flex items-center gap-1"
                            title="نسخ الذكر"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            {copiedItemId === item.id ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">تم النسخ ✓</span> : <span>نسخ</span>}
                          </button>
                        </div>

                        <button
                          onClick={() => handleMarkItemDone(category, item)}
                          className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                            isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>{isCompleted ? 'مقروء ومكتمل ✓' : 'تعليم كـ مقروء'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
                  {activePrayerKey === 'maghrib' && 'قد حان وقت أذكار صلاة المغرب المكتوبة 🌅'}
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

          {/* Header Bar & Global Search Input */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-right">
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>مركز الأدعية والأذكار الشامل «حصن المسلم»</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  تصفح الأذكار والأدعية الشاملة، أو ابحث في كافة أذكار السنة النبوية بدون الحاجة لاتصال بالإنترنت.
                </p>
              </div>
              <button
                onClick={() => setSoundEnabled(prev => !prev)}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  soundEnabled 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                }`}
                title={soundEnabled ? 'كتم الصوت التفاعلي' : 'تفعيل الصوت التفاعلي'}
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في جميع الأذكار والأدعية (مثال: الاستغفار، السفر، المطر، العافية)... 🔍"
                className="w-full py-2.5 pr-10 pl-9 bg-slate-50 dark:bg-[#111720] border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* SEARCH RESULTS MODE */}
          {searchQuery.trim() ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                <span>عثرنا على ({toArabicNumbers(searchResults.length)}) نص/ذكر مطابق للبحث</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  مسح البحث
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-8 bg-white dark:bg-[#161d26] rounded-3xl text-center border border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">لم نعثر على نتيجة تطابق كلمة "{searchQuery}"</p>
                  <p className="text-xs text-slate-400">جرب البحث بكلمة أخرى مثل (التسبيح، الشفاء، الاستغفار)</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {searchResults.map(({ category, item, itemIndex }) => {
                    const isFavorited = favoriteDhikrIds.includes(item.id);
                    return (
                      <div
                        key={`${category.id}_${item.id}`}
                        className={`p-4 rounded-3xl border text-right space-y-2 transition-all shadow-xs ${
                          isFavorited
                            ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/20'
                            : 'bg-white dark:bg-[#161d26] border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-300 dark:hover:border-emerald-700'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => toggleFavoriteDhikr(item.id, e)}
                              className={`p-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                                isFavorited
                                  ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200/60 dark:border-slate-700/60'
                              }`}
                              title={isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                            >
                              <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-400 text-amber-500' : ''}`} />
                            </button>

                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                              {category.arabicName} • {item.title || `الذكر ${toArabicNumbers(itemIndex + 1)}`}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCategory(category);
                              setCurrentDhikrIdx(itemIndex);
                              setViewMode('cards');
                              setSearchQuery('');
                            }}
                            className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>قراءة الذكر</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed py-1">
                          {item.text}
                        </p>

                        {item.reward && (
                          <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong>الفضل:</strong> {item.reward}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : hubSection === 'main' ? (
            /* LEVEL 1: MAIN HUB GRID */
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>الأقسام الرئيسية لمكتبة الأدعية والأذكار</span>
                </h4>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40">
                  ٥ أقسام شاملة
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 md:gap-4">
                {/* 1. الأذكار */}
                <div
                  onClick={() => setHubSection('adhkar')}
                  className="bg-white dark:bg-[#161d26] p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-4 group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>دون إنترنت</span>
                    </span>
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 group-hover:scale-110 transition-transform">
                      <Sun className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-base text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      الأذكار اليومية والصلوات
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      أذكار الصباح، المساء، الوضوء، المسجد، الصلاة واليوم والليلة
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <span>١١ فئة • أذكار مباركة</span>
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 2. الأدعية */}
                <div
                  onClick={() => setHubSection('duas')}
                  className="bg-white dark:bg-[#161d26] p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-4 group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>دون إنترنت</span>
                    </span>
                    <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 group-hover:scale-110 transition-transform">
                      <Heart className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-base text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      الأدعية المأثورة والجامعة
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      أدعية الصلاة، السفر، الطعام، الكرب، الشدائد، والاستخارة
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                    <span>١٤ فئة • أدعية مأثورة</span>
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 3. الرقية الشرعية */}
                <div
                  onClick={() => setHubSection('ruqyah')}
                  className="bg-white dark:bg-[#161d26] p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-4 group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>دون إنترنت</span>
                    </span>
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-base text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      الرقية الشرعية وشفاء المريض
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      أدعية الشفاء، عيادة المريض، ورقية الوقاية والحصن المأثور
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <span>قسم مخصص • الشفاء والتحصين</span>
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 4. التسبيح */}
                <div
                  onClick={() => setActiveTab('tasbeeh')}
                  className="bg-white dark:bg-[#161d26] p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-4 group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>دون إنترنت</span>
                    </span>
                    <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 group-hover:scale-110 transition-transform">
                      <Award className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-base text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      المسبحة الإلكترونية التفاعلية
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      عداد الذكر والتسبيح الحر مع اهتزاز تفاعلي وأدعية مخصصة
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs font-bold text-purple-700 dark:text-purple-400">
                    <span>تسبيح واستغفار تفاعلي</span>
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 5. حصن المسلم */}
                <div
                  onClick={() => setHubSection('hisn')}
                  className="bg-white dark:bg-[#161d26] p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-4 group relative overflow-hidden col-span-1 sm:col-span-2 md:col-span-1"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>دون إنترنت</span>
                    </span>
                    <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-base text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      فهرس كتاب «حصن المسلم» الشامل
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      عرض مرجعي كامل لجميع أقسام الكتاب الـ 26 بالترتيب الأصلي
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs font-bold text-teal-700 dark:text-teal-400">
                    <span>٢٦ قسماً كاملاً بالترقيم الأصلي</span>
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* LEVEL 2: SECTION VIEW WITH CIRCULAR SUB-CATEGORIES */
            <div className="space-y-5">
              {/* Back to Hub Header Button */}
              <button
                onClick={() => setHubSection('main')}
                className="py-2 px-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
                <span>العودة إلى Hub الأدعية والأذكار الرئيسي</span>
              </button>

              {/* Section Header Dark Green Banner */}
              <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-5 rounded-3xl border border-emerald-800/60 shadow-md space-y-2.5 text-right">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-emerald-800/80 text-emerald-300 border border-emerald-700/50">
                      {hubSection === 'adhkar' ? <Sun className="w-5 h-5" /> :
                       hubSection === 'duas' ? <Heart className="w-5 h-5" /> :
                       hubSection === 'ruqyah' ? <Sparkles className="w-5 h-5" /> :
                       <BookOpen className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-white">
                        {hubSection === 'adhkar' && 'قسم الأذكار اليومية والصلوات'}
                        {hubSection === 'duas' && 'قسم الأدعية المأثورة والجامعة'}
                        {hubSection === 'ruqyah' && 'قسم الرقية الشرعية وأدعية الشفاء'}
                        {hubSection === 'hisn' && 'فهرس كتاب حصن المسلم الكامل (٢٦ قسماً)'}
                      </h3>
                      <p className="text-xs text-emerald-200/80 font-medium">
                        {hubSection === 'adhkar' && '﴿فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ﴾ — سورة البقرة'}
                        {hubSection === 'duas' && '﴿وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ﴾ — سورة البقرة'}
                        {hubSection === 'ruqyah' && '﴿وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ﴾ — سورة الإسراء'}
                        {hubSection === 'hisn' && 'فهرس الكتاب المرجعي مرتب بالترقيم الأصلي للدكتور سعيد بن علي بن وهف القحطاني رحمه الله'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold bg-emerald-800/60 text-emerald-200 px-3 py-1 rounded-full border border-emerald-700/50">
                    ● دون إنترنت
                  </span>
                </div>

                {/* Counter bar */}
                <div className="pt-2 border-t border-emerald-800/50 flex justify-between items-center text-xs font-bold text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <ListFilter className="w-4 h-4" />
                    <span>
                      إجمالي الفئات: {toArabicNumbers(
                        hubSection === 'adhkar' ? 11 :
                        hubSection === 'duas' ? 14 :
                        hubSection === 'ruqyah' ? 1 : 26
                      )} فئة فرعية
                    </span>
                  </span>
                  <span className="text-[11px] text-emerald-200/70">انقر على الفئة المحددة لاستعراض وقراءة أذكارها</span>
                </div>
              </div>

              {/* LEVEL 2 CIRCULAR SUB-CATEGORIES GRID */}
              <div className="bg-white dark:bg-[#161d26] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>الفئات الفرعية (اختر فئة للقراءة):</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-center">
                  {ADHKAR_DATA.filter(cat => {
                    if (hubSection === 'adhkar') return ['morning', 'evening', 'after_prayer', 'sleep', 'wake', 'wudu', 'toilet', 'home', 'walk', 'mosque', 'adhan'].includes(cat.id);
                    if (hubSection === 'duas') return ['istiftah', 'ruku', 'weather', 'travel', 'food', 'distress', 'anger', 'istikhara', 'hajj', 'funeral', 'salawat', 'misc', 'insomnia', 'clothes'].includes(cat.id);
                    if (hubSection === 'ruqyah') return ['sick'].includes(cat.id);
                    return true; // hisn = all 26
                  }).map((cat, idx) => {
                    const visibleItems = getCategoryVisibleItems(cat, activePrayerKey);
                    const isFavorited = favoriteCategoryIds.includes(cat.id);

                    return (
                      <div
                        key={`sub_cat_${cat.id}`}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setViewMode('cards');
                          setCurrentDhikrIdx(0);
                        }}
                        className="group flex flex-col items-center justify-between p-3.5 rounded-3xl border border-slate-100 dark:border-slate-800/80 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all cursor-pointer space-y-2"
                      >
                        {/* Level 2 Circular Icon */}
                        <div className="relative">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-emerald-600 bg-emerald-900 text-white flex items-center justify-center font-black text-2xl shadow-md group-hover:scale-105 transition-transform">
                            {cat.id === 'morning' ? '🌅' :
                             cat.id === 'evening' ? '🌆' :
                             cat.id === 'after_prayer' ? '📿' :
                             cat.id === 'sleep' ? '🌌' :
                             cat.id === 'travel' ? '✈️' :
                             cat.id === 'food' ? '🍲' :
                             cat.id === 'sick' ? '🌿' :
                             cat.id === 'distress' ? '🤲' : '📖'}
                          </div>
                          {isFavorited && (
                            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 p-1 rounded-full text-[10px] shadow-xs">
                              ⭐
                            </span>
                          )}
                        </div>

                        {/* Category Name & Small Decorative Line */}
                        <div className="space-y-0.5 text-center w-full">
                          <h5 className="font-black text-xs sm:text-sm text-slate-800 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {cat.arabicName}
                          </h5>
                          {/* Decorative Line below name */}
                          <div className="w-7 h-1 bg-emerald-500 rounded-full mx-auto my-1 group-hover:w-12 transition-all" />
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">
                            {toArabicNumbers(visibleItems.length)} نصاً/ذكراً
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: Selected Category Details */}
      {selectedCategory && (
        <div className="space-y-5">
          {/* Top Bar navigation & Category Header */}
          <div className="bg-white dark:bg-[#161d26] p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-3.5 transition-all">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className="py-2 px-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
                <span>رجوع للمحطات</span>
              </button>

              <div className="text-right truncate">
                <h3 className="font-black text-slate-800 dark:text-white text-sm sm:text-base flex items-center justify-end gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">حصن المسلم: {selectedCategory.arabicName}</span>
                </h3>
              </div>
            </div>

            {/* Controls Toolbar Bar */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 scrollbar-none">
              {/* Left Side Controls: View mode & Font size */}
              <div className="flex items-center gap-2 shrink-0">
                {/* View mode toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      viewMode === 'cards'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    بطاقات
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    قائمة
                  </button>
                </div>

                {/* Font Size Selector */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl items-center gap-0.5">
                  <button
                    onClick={() => setFontSize('md')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-black cursor-pointer ${fontSize === 'md' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-400'}`}
                    title="خط صغير"
                  >
                    صغير
                  </button>
                  <button
                    onClick={() => setFontSize('lg')}
                    className={`px-2 py-0.5 rounded-lg text-xs font-black cursor-pointer ${fontSize === 'lg' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-400'}`}
                    title="خط متوسط"
                  >
                    وسط
                  </button>
                  <button
                    onClick={() => setFontSize('xl')}
                    className={`px-2 py-0.5 rounded-lg text-xs font-black cursor-pointer ${fontSize === 'xl' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-400'}`}
                    title="خط كبير"
                  >
                    كبير
                  </button>
                </div>
              </div>

              {/* Right Side Controls: Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Mark All as Read button */}
                <button
                  onClick={() => handleMarkAllCategoryItemsDone(selectedCategory)}
                  className="py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl transition-colors cursor-pointer text-xs font-black flex items-center gap-1 border border-emerald-200 dark:border-emerald-900/40"
                  title="تعليم كافة أذكار هذا القسم كـ مقروءة"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">إكمال الكل</span>
                </button>

                <button
                  onClick={() => setIsFocusMode(true)}
                  className="py-1.5 px-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-colors cursor-pointer text-xs font-black flex items-center gap-1 border border-indigo-100 dark:border-indigo-900/30"
                  title="وضع التركيز بملء الشاشة"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">تركيز</span>
                </button>
                
                <button
                  onClick={() => handleResetCategory(selectedCategory)}
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="إعادة ضبط أذكار هذه الفئة"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
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
                  
                  // Calculate prayer completion for visible items
                  const prayerVisibleItems = getCategoryVisibleItems(selectedCategory, p.key);
                  let prayerDone = prayerVisibleItems.length > 0;
                  prayerVisibleItems.forEach(it => {
                    const c = getItemCurrentCount('after_prayer', it.id, p.key);
                    const req = getItemTargetCount('after_prayer', it, p.key);
                    if (c < req) prayerDone = false;
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
              {viewMode === 'cards' && (() => {
                const visibleCategoryItems = getCategoryVisibleItems(selectedCategory, selectedPrayerForPostAdhkar);
                const safeDhikrIdx = Math.min(currentDhikrIdx, visibleCategoryItems.length - 1);
                const currentItem = visibleCategoryItems[safeDhikrIdx] || visibleCategoryItems[0];
                if (!currentItem) return null;

                const currentCount = getItemCurrentCount(selectedCategory.id, currentItem.id);
                const targetCount = getItemTargetCount(selectedCategory.id, currentItem, selectedPrayerForPostAdhkar);
                const isCompleted = currentCount >= targetCount;
                const isFavorited = favoriteDhikrIds.includes(currentItem.id);

                return (
                  <div className={`rounded-3xl p-6 border transition-colors overflow-hidden space-y-6 flex flex-col items-center ${
                    isFavorited
                      ? 'bg-gradient-to-b from-amber-50/80 to-amber-100/40 dark:from-amber-950/30 dark:to-orange-950/10 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/30'
                      : 'bg-white dark:bg-[#161d26] border-[#e2e8f0] dark:border-slate-800/80'
                  }`}>
                    
                    {/* Current Item Card */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={safeDhikrIdx}
                        initial={{ opacity: 0, x: 50, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                        className="w-full space-y-6 flex flex-col items-center"
                      >
                        <div className={`w-full relative rounded-3xl p-6 md:p-8 border overflow-hidden shadow-inner flex flex-col items-center text-right ${
                          isFavorited
                            ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50'
                            : 'bg-slate-50/70 dark:bg-[#111720]/90 border-slate-200/60 dark:border-slate-800/80'
                        }`}>
                          
                          {/* Title & Timing Notes */}
                          <div className="w-full flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3 mb-4 gap-2 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => toggleFavoriteDhikr(currentItem.id, e)}
                                className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                                  isFavorited
                                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 shadow-2xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200/60 dark:border-slate-700/60'
                                }`}
                                title={isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                              >
                                <Star className={`w-4 h-4 ${isFavorited ? 'fill-amber-400 text-amber-500' : ''}`} />
                              </button>

                              <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/30 truncate max-w-[180px] sm:max-w-none">
                                {currentItem.title || `الذكر ${toArabicNumbers(safeDhikrIdx + 1)}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleCopyText(currentItem.text, currentItem.id)}
                                className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-2xs transition-all"
                                title="نسخ نص الذكر"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                {copiedItemId === currentItem.id ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">تم النسخ ✓</span> : <span>نسخ</span>}
                              </button>

                              <span className="text-xs font-black px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                                {toArabicNumbers(safeDhikrIdx + 1)} من {toArabicNumbers(visibleCategoryItems.length)}
                              </span>
                            </div>
                          </div>

                          {/* Special Timing Note Badge */}
                          {(currentItem.timingNote || currentItem.description) && (
                            <div className="w-full text-right mb-3">
                              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30 inline-block">
                                {currentItem.timingNote || currentItem.description}
                              </span>
                            </div>
                          )}

                          {/* Full Arabic Text */}
                          <p className={`font-black text-slate-800 dark:text-slate-100 leading-relaxed text-center py-4 select-text max-w-xl w-full ${
                            fontSize === 'md' ? 'text-base md:text-lg' : fontSize === 'lg' ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
                          }`}>
                            {currentItem.text}
                          </p>

                          {/* Virtue / Reward Box */}
                          {currentItem.reward && (
                            <div className="mt-3 p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-300 text-right w-full leading-relaxed flex items-start gap-2.5">
                              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-black block mb-0.5">الفضل والبركة:</span>
                                <span>{currentItem.reward}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Interactive Counter Tap Button */}
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
                        {/* Circular SVG Ring Progress */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1" viewBox="0 0 160 160">
                          <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="5" className="text-white/20" fill="transparent" />
                          <circle
                            cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="7"
                            className="text-white transition-all duration-300"
                            strokeDasharray={2 * Math.PI * 72}
                            strokeDashoffset={(2 * Math.PI * 72) * (1 - Math.min(1, currentCount / targetCount))}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>

                        <div className="text-4xl font-black tracking-tight z-10 flex flex-col items-center">
                          <span>{toArabicNumbers(currentCount)}</span>
                          <span className="text-xs font-extrabold text-indigo-100 border-t border-white/20 mt-1.5 pt-1 w-16 text-center">
                            من {toArabicNumbers(targetCount)}
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
                          disabled={safeDhikrIdx === 0}
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
                          onClick={() => setCurrentDhikrIdx(prev => Math.min(visibleCategoryItems.length - 1, prev + 1))}
                          disabled={safeDhikrIdx === visibleCategoryItems.length - 1}
                          className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>التالي</span>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* MODE 2: Full List Mode */}
              {viewMode === 'list' && (() => {
                const visibleCategoryItems = getCategoryVisibleItems(selectedCategory, selectedPrayerForPostAdhkar);

                return (
                  <div className="space-y-4">
                    {visibleCategoryItems.map((item, idx) => {
                      const currentCount = getItemCurrentCount(selectedCategory.id, item.id);
                      const targetCount = getItemTargetCount(selectedCategory.id, item, selectedPrayerForPostAdhkar);
                      const isCompleted = currentCount >= targetCount;
                      const isFavorited = favoriteDhikrIds.includes(item.id);

                      return (
                        <div
                          key={item.id}
                          className={`p-5 rounded-3xl border transition-all space-y-3 text-right ${
                            isCompleted
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                              : isFavorited
                              ? 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/30'
                              : 'bg-white dark:bg-[#161d26] border-slate-200/80 dark:border-slate-800/80'
                          }`}
                        >
                          {/* Title bar */}
                          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => toggleFavoriteDhikr(item.id, e)}
                                className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                                  isFavorited
                                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 shadow-2xs'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200/60 dark:border-slate-700/60'
                                }`}
                                title={isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                              >
                                <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-400 text-amber-500' : ''}`} />
                              </button>

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
                              {toArabicNumbers(currentCount)} / {toArabicNumbers(targetCount)}
                            </span>
                          </div>

                          {/* Timing note */}
                          {(item.timingNote || item.description) && (
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 rounded-md inline-block">
                              {item.timingNote || item.description}
                            </span>
                          )}

                          {/* Arabic text */}
                          <p className={`font-bold text-slate-800 dark:text-slate-100 leading-relaxed py-1 ${
                            fontSize === 'md' ? 'text-base' : fontSize === 'lg' ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
                          }`}>
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleIncrementCategoryItem(item)}
                                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <span>تسبيح (+1)</span>
                              </button>

                              <button
                                onClick={() => handleCopyText(item.text, item.id)}
                                className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title="نسخ الذكر"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                {copiedItemId === item.id ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">تم النسخ ✓</span> : <span>نسخ</span>}
                              </button>
                            </div>

                            <button
                              onClick={() => handleMarkItemDone(selectedCategory, item)}
                              className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                              <span>{isCompleted ? 'مقروء ومكتمل ✓' : 'تعليم كـ مقروء'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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
          onNavigateTab={(tab) => {
            if (tab === 'adhkar' || tab === 'categories' || tab === 'stations') {
              setActiveTab('categories');
            } else if (tab === 'tasbeeh') {
              setActiveTab('tasbeeh');
            } else if (onNavigateTab) {
              onNavigateTab(tab);
            }
          }}
          onOpenNotificationsModal={() => {
            if (onOpenNotificationsModal) {
              onOpenNotificationsModal();
            } else {
              window.dispatchEvent(new CustomEvent('open-spiritual-notifications'));
            }
          }}
          completedStationsCount={
            getSevenStationsProgress(dayLogs, activePrayerKey).completedStationsCount
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
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto no-scrollbar pe-1">
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
          {(() => {
            const TASBEEH_COLORS: Record<string, { bg: string; shadow: string; targetBtn: string; dot: string; name: string }> = {
              emerald: {
                bg: 'bg-gradient-to-tr from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600',
                shadow: 'shadow-emerald-200/50',
                targetBtn: 'bg-emerald-600 text-white',
                dot: 'bg-emerald-600',
                name: 'زمردي'
              },
              indigo: {
                bg: 'bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600',
                shadow: 'shadow-indigo-200/50',
                targetBtn: 'bg-indigo-600 text-white',
                dot: 'bg-indigo-600',
                name: 'نيلي'
              },
              amber: {
                bg: 'bg-gradient-to-tr from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600',
                shadow: 'shadow-amber-200/50',
                targetBtn: 'bg-amber-600 text-white',
                dot: 'bg-amber-600',
                name: 'كهرماني'
              },
              rose: {
                bg: 'bg-gradient-to-tr from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600',
                shadow: 'shadow-rose-200/50',
                targetBtn: 'bg-rose-600 text-white',
                dot: 'bg-rose-600',
                name: 'وردي'
              },
              slate: {
                bg: 'bg-gradient-to-tr from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800',
                shadow: 'shadow-slate-300/50',
                targetBtn: 'bg-slate-800 text-white',
                dot: 'bg-slate-800',
                name: 'ملكي'
              }
            };

            const activeColor = TASBEEH_COLORS[tasbeehColor] || TASBEEH_COLORS.indigo;

            return (
              <div className="bg-white dark:bg-[#161d26] rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center justify-center space-y-5 shadow-xs relative overflow-hidden">
                
                {/* Controls Bar: Target & Color Selectors */}
                <div className="flex flex-wrap items-center justify-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 w-full">
                  {/* Target Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الهدف:</span>
                    {[33, 100, 1000].map(tgt => (
                      <button
                        key={tgt}
                        type="button"
                        onClick={() => {
                          setTasbeehTarget(tgt);
                          setTasbeehCount(0);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                          tasbeehTarget === tgt 
                            ? `${activeColor.targetBtn} shadow-xs` 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {toArabicNumbers(tgt)}
                      </button>
                    ))}
                  </div>

                  {/* Color Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">اللون:</span>
                    <div className="flex items-center gap-1.5">
                      {Object.keys(TASBEEH_COLORS).map((cKey) => {
                        const cObj = TASBEEH_COLORS[cKey];
                        const isSelected = tasbeehColor === cKey;
                        return (
                          <button
                            key={cKey}
                            type="button"
                            onClick={() => {
                              setTasbeehColor(cKey);
                              safeSetItem('salah_tasbih_color', cKey);
                            }}
                            title={cObj.name}
                            className={`w-5 h-5 rounded-full ${cObj.dot} border-2 transition-all cursor-pointer ${
                              isSelected ? 'border-white ring-2 ring-slate-400 scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Main Tasbeeh Button */}
                <button
                  type="button"
                  onClick={handleIncrementTasbeeh}
                  className={`w-52 h-52 rounded-full ${activeColor.bg} text-white flex flex-col items-center justify-center shadow-xl ${activeColor.shadow} dark:shadow-none border-4 border-white dark:border-slate-800 cursor-pointer active:scale-95 transition-all relative select-none`}
                >
                  <span className="text-5xl font-black">{toArabicNumbers(tasbeehCount)}</span>
                  <span className="text-xs font-extrabold text-white/90 mt-1 border-t border-white/20 pt-1 px-4">
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
                  type="button"
                  onClick={() => setTasbeehCount(0)}
                  className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة العداد</span>
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Fullscreen Focus Mode Modal */}
      {isFocusMode && selectedCategory && (() => {
        const visibleCategoryItems = getCategoryVisibleItems(selectedCategory, selectedPrayerForPostAdhkar);
        const safeDhikrIdx = Math.min(currentDhikrIdx, visibleCategoryItems.length - 1);
        const currentItem = visibleCategoryItems[safeDhikrIdx] || visibleCategoryItems[0];
        if (!currentItem) return null;

        const currentCount = getItemCurrentCount(selectedCategory.id, currentItem.id);
        const targetCount = getItemTargetCount(selectedCategory.id, currentItem, selectedPrayerForPostAdhkar);
        const isCompleted = currentCount >= targetCount;

        return (
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
                <h3 className="font-black text-lg text-amber-300">🏰 حصن المسلم: {selectedCategory.arabicName}</h3>
                <p className="text-xs text-slate-300">وضع التركيز بملء الشاشة</p>
              </div>
              <span className="text-xs font-bold text-slate-300 bg-white/10 px-3 py-1 rounded-full">
                {toArabicNumbers(safeDhikrIdx + 1)} / {toArabicNumbers(visibleCategoryItems.length)}
              </span>
            </div>

            {/* Body content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto space-y-6">
              <p className="text-2xl md:text-3xl font-black text-center leading-relaxed select-text">
                {currentItem.text}
              </p>

              {currentItem.reward && (
                <p className="text-xs text-emerald-300 bg-emerald-950/40 p-3 rounded-2xl border border-emerald-800/40 text-center max-w-md">
                  ✨ {currentItem.reward}
                </p>
              )}

              {/* Huge Tap Button */}
              <button
                onClick={() => handleIncrementCategoryItem(currentItem)}
                className={`w-48 h-48 rounded-full text-white flex flex-col items-center justify-center shadow-2xl transition-all cursor-pointer border-4 border-white/20 active:scale-95 ${
                  isCompleted ? 'bg-emerald-600' : 'bg-indigo-600'
                }`}
              >
                <span className="text-5xl font-black">{toArabicNumbers(currentCount)}</span>
                <span className="text-xs font-extrabold mt-1 text-indigo-100">
                  من {toArabicNumbers(targetCount)}
                </span>
                <span className="text-[11px] font-extrabold mt-2 bg-black/30 px-3 py-0.5 rounded-full">
                  {isCompleted ? 'مكتمل ✓' : 'انقر للتسجيل'}
                </span>
              </button>
            </div>

            {/* Footer Controls */}
            <div className="flex justify-between items-center border-t border-white/10 pt-4 max-w-2xl mx-auto w-full">
              <button
                onClick={() => setCurrentDhikrIdx(prev => Math.max(0, prev - 1))}
                disabled={safeDhikrIdx === 0}
                className="py-2.5 px-4 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-2xl text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>

              <button
                onClick={() => setCurrentDhikrIdx(prev => Math.min(visibleCategoryItems.length - 1, prev + 1))}
                disabled={safeDhikrIdx === visibleCategoryItems.length - 1}
                className="py-2.5 px-4 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-2xl text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <span>التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
