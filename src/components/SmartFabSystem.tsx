/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { safeSetItem, safeSetJSON, safeGetItem, safeGetJSON } from '../utils/storage';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  Compass, 
  Moon, 
  Calendar, 
  Settings, 
  X, 
  ChevronUp, 
  Zap, 
  Check, 
  Flame, 
  Sun,
  Award,
  Sliders,
  Home,
  Clock,
  Heart,
  Plus,
  Search,
  Bell
} from 'lucide-react';
import { TabId, PrayerLog } from '../types';
import { formatDateKey } from '../utils/prayerDayBoundary';
import { MosqueIcon } from './fab/MosqueIcon';
import { FabQuickActionSheet } from './fab/FabQuickActionSheet';
import { FabRadialMenu, NavItemType } from './fab/FabRadialMenu';

export interface SmartFabSystemProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isFabOpen: boolean;
  setIsFabOpen: (open: boolean) => void;
  currentPrayerArabic?: string;
  currentPrayerKey?: string;
  nextPrayerArabic?: string;
  nextPrayerKey?: string;
  prayerLogs?: Record<string, Record<string, PrayerLog>>;
  setToastMessage: (msg: string | null) => void;
}

export const SmartFabSystem: React.FC<SmartFabSystemProps> = ({
  activeTab,
  setActiveTab,
  isFabOpen,
  setIsFabOpen,
  currentPrayerArabic,
  currentPrayerKey,
  nextPrayerArabic,
  nextPrayerKey,
  prayerLogs,
  setToastMessage
}) => {
  const [isLongPressSheetOpen, setIsLongPressSheetOpen] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activePrayerArabic = currentPrayerArabic || nextPrayerArabic || 'الظهر';
  const activePrayerKey = currentPrayerKey || nextPrayerKey || 'Dhuhr';

  // Check if current/active prayer is logged for today
  const isPrayerLogged = (() => {
    try {
      const todayStr = formatDateKey(new Date());
      const logsToUse = prayerLogs || safeGetJSON<Record<string, Record<string, PrayerLog>>>('mc_prayer_logs', {});
      const todayLog = logsToUse[todayStr] || {};
      const keyMap: Record<string, string> = {
        fajr: 'Fajr',
        dhuhr: 'Dhuhr',
        asr: 'Asr',
        maghrib: 'Maghrib',
        isha: 'Isha',
        sunrise: 'Sunrise',
        Fajr: 'Fajr',
        Dhuhr: 'Dhuhr',
        Asr: 'Asr',
        Maghrib: 'Maghrib',
        Isha: 'Isha',
        Sunrise: 'Sunrise',
      };
      const canonicalKey = keyMap[activePrayerKey] || keyMap[activePrayerKey.toLowerCase()] || activePrayerKey;
      const currentLog = todayLog[canonicalKey] || todayLog[activePrayerKey] || todayLog[activePrayerKey.toLowerCase()];
      return currentLog?.status === 'A' || currentLog?.status === 'B' || currentLog?.status === 'done';
    } catch (e) {
      return false;
    }
  })();

  // Determine time of day for dynamic Adhkar suggestion
  const currentHour = new Date().getHours();
  const isMorning = currentHour >= 4 && currentHour < 12;
  const adhkarText = isMorning ? 'أذكار الصباح' : 'أذكار المساء';

  // -----------------------------------------------------------------
  // LONG-PRESS COACHMARK BUBBLE STATE & STORAGE
  // -----------------------------------------------------------------
  const COACHMARK_KEY = 'mc_fab_longpress_coachmark';
  const THREE_AND_HALF_DAYS_MS = 3.5 * 24 * 60 * 60 * 1000;

  const [showCoachmarkTooltip, setShowCoachmarkTooltip] = useState(false);

  const getCoachmarkData = () => {
    return safeGetJSON<{ dismissed?: boolean; firstShownAt?: number | null; tappedFirstTime?: boolean }>(
      COACHMARK_KEY,
      { dismissed: false, firstShownAt: null, tappedFirstTime: false }
    );
  };

  const saveCoachmarkData = (data: { dismissed?: boolean; firstShownAt?: number | null; tappedFirstTime?: boolean }) => {
    try {
      const current = getCoachmarkData();
      const updated = { ...current, ...data };
      safeSetJSON(COACHMARK_KEY, updated);
      return updated;
    } catch (e) {
      return data;
    }
  };

  const dismissCoachmarkPermanently = () => {
    saveCoachmarkData({ dismissed: true });
    setShowCoachmarkTooltip(false);
  };

  // Expiration check on mount
  useEffect(() => {
    const data = getCoachmarkData();
    if (data.firstShownAt && !data.dismissed) {
      if (Date.now() - data.firstShownAt > THREE_AND_HALF_DAYS_MS) {
        dismissCoachmarkPermanently();
      }
    }
  }, []);

  // Global window tap/click listener to close coachmark when visible
  useEffect(() => {
    if (!showCoachmarkTooltip) return;

    const handleGlobalClick = () => {
      dismissCoachmarkPermanently();
    };

    const timer = setTimeout(() => {
      window.addEventListener('click', handleGlobalClick, { capture: true });
      window.addEventListener('touchstart', handleGlobalClick, { capture: true });
    }, 150);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleGlobalClick, { capture: true });
      window.removeEventListener('touchstart', handleGlobalClick, { capture: true });
    };
  }, [showCoachmarkTooltip]);

  // Haptic feedback helper
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(35);
      } catch (e) {
        // ignore
      }
    }
  };

  // Long press handlers
  const handleTouchStart = () => {
    setIsHolding(true);
    holdTimerRef.current = setTimeout(() => {
      triggerHaptic();
      setIsHolding(false);
      setIsFabOpen(false);
      handleOpenSpiritualSearch();
    }, 400);
  };

  const handleTouchEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHolding(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Toggle radial menu on normal short tap
    triggerHaptic();
    setIsFabOpen(!isFabOpen);

    // Trigger coachmark sequence ONLY AFTER user interacts with normal tap
    const data = getCoachmarkData();
    if (!data.dismissed) {
      if (data.firstShownAt && Date.now() - data.firstShownAt > THREE_AND_HALF_DAYS_MS) {
        dismissCoachmarkPermanently();
        return;
      }

      if (!data.tappedFirstTime) {
        saveCoachmarkData({ tappedFirstTime: true });
      }

      // Delay ~1.5s after first tap interaction before presenting coachmark bubble
      setTimeout(() => {
        const currentData = getCoachmarkData();
        if (!currentData.dismissed) {
          const now = Date.now();
          const firstShownAt = currentData.firstShownAt || now;
          saveCoachmarkData({ firstShownAt, tappedFirstTime: true });
          setShowCoachmarkTooltip(true);
        }
      }, 1500);
    }
  };

  // Close sheet on backdrop or back press
  useEffect(() => {
    const handleBack = () => {
      if (isLongPressSheetOpen) {
        setIsLongPressSheetOpen(false);
      }
    };
    window.addEventListener('salah_android_back', handleBack);
    return () => window.removeEventListener('salah_android_back', handleBack);
  }, [isLongPressSheetOpen]);

  // Handle Quick Action Log
  const handleQuickLogPrayer = () => {
    triggerHaptic();
    setIsFabOpen(false);
    setIsLongPressSheetOpen(false);
    window.dispatchEvent(new CustomEvent('salah_quick_log_prayer', { detail: { prayerKey: activePrayerKey } }));
  };

  const handleQuickLogAdhkar = () => {
    triggerHaptic();
    setIsFabOpen(false);
    setIsLongPressSheetOpen(false);
    setActiveTab('adhkar');
    setToastMessage(`بارك الله فيك! تم فتح ${adhkarText} 📿✨`);
  };

  const handleQuickLogQuran = () => {
    triggerHaptic();
    setIsFabOpen(false);
    setIsLongPressSheetOpen(false);
    window.dispatchEvent(new CustomEvent('salah_quick_log_quran'));
    setToastMessage(`تم تسجيل قراءة الورد اليومي للقرآن الكريم 📖🌸`);
  };

  const handleQuickTasbeeh = () => {
    triggerHaptic();
    const currentCount = parseInt(safeGetItem('mc_quick_tasbeeh_today') || '0', 10) + 10;
    safeSetItem('mc_quick_tasbeeh_today', currentCount.toString());
    setToastMessage(`سبحان الله وبحمده 📿 (+10 تسبيحات) | المجموع اليوم: ${currentCount}`);
  };

  const handleOpenSpiritualSearch = () => {
    triggerHaptic();
    setIsFabOpen(false);
    setIsLongPressSheetOpen(false);
    dismissCoachmarkPermanently();
    window.dispatchEvent(new CustomEvent('salah_open_spiritual_search'));
  };

  // Main menu items for radial speed dial (9-grid hub)
  const navItems: { id: TabId; label: string; icon: React.ElementType; color: string; badge?: string }[] = [
    { id: 'home', label: 'الرئيسية', icon: Home, color: 'emerald' },
    { id: 'quran', label: 'القرآن الكريم', icon: BookOpen, color: 'emerald', badge: 'الورد' },
    { id: 'adhkar', label: 'الأذكار والورد', icon: Sparkles, color: 'indigo' },
    { id: 'calendar', label: 'التقويم الهجري', icon: Calendar, color: 'indigo', badge: 'جديد' },
    { id: 'salah', label: 'المواقيت', icon: MosqueIcon, color: 'amber' },
    { id: 'fasting', label: 'الصيام والنوافل', icon: Moon, color: 'cyan' },
    { id: 'khushu', label: 'السنن والتهجد', icon: Flame, color: 'purple' },
    { id: 'alarms', label: 'المنبهات', icon: Bell, color: 'amber' },
    { id: 'settings', label: 'الإعدادات', icon: Settings, color: 'slate' },
  ];

  return (
    <div className="relative flex flex-col items-center z-40">
      {/* Backdrop overlay when Radial or LongPress Sheet is active */}
      <AnimatePresence>
        {(isFabOpen || isLongPressSheetOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsFabOpen(false);
              setIsLongPressSheetOpen(false);
            }}
            className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs z-40"
          />
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 1. RADIAL SPEED DIAL FAN & TOP QUICK ACTION PILLS             */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        <FabRadialMenu
          isOpen={isFabOpen}
          activePrayerArabic={activePrayerArabic}
          isPrayerLogged={isPrayerLogged}
          adhkarText={adhkarText}
          activeTab={activeTab}
          navItems={navItems}
          onOpenSpiritualSearch={handleOpenSpiritualSearch}
          onQuickLogPrayer={handleQuickLogPrayer}
          onQuickLogAdhkar={handleQuickLogAdhkar}
          onQuickLogQuran={handleQuickLogQuran}
          onQuickTasbeeh={handleQuickTasbeeh}
          onSelectTab={(tabId) => {
            triggerHaptic();
            setIsFabOpen(false);
            setActiveTab(tabId);
          }}
        />
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 2. LONG PRESS SMART QUICK COMPLETION FLOATING SHEET           */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        <FabQuickActionSheet
          isOpen={isLongPressSheetOpen}
          onClose={() => setIsLongPressSheetOpen(false)}
          activePrayerArabic={activePrayerArabic}
          isPrayerLogged={isPrayerLogged}
          adhkarText={adhkarText}
          onQuickLogPrayer={handleQuickLogPrayer}
          onQuickLogAdhkar={handleQuickLogAdhkar}
          onQuickLogQuran={handleQuickLogQuran}
          onQuickTasbeeh={handleQuickTasbeeh}
        />
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN ELEVATED FAB BUTTON WITH PULSE AND LONG-PRESS FILL     */}
      {/* ------------------------------------------------------------- */}
      <div className="relative group">
        {/* Long-Press Discovery Speech Bubble Coachmark */}
        <AnimatePresence>
          {showCoachmarkTooltip && !isFabOpen && !isLongPressSheetOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenSpiritualSearch();
              }}
              className="absolute -top-24 start-1/2 -translate-x-1/2 z-50 cursor-pointer pointer-events-auto"
            >
              <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 text-amber-300 border border-amber-500/40 shadow-2xl rounded-2xl p-2.5 px-3 flex items-center gap-2.5 whitespace-nowrap min-w-[210px] backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-xs">
                  <Search className="w-4 h-4" />
                </div>
                <div className="flex-1 text-start">
                  <div className="text-[11px] font-black text-amber-300 leading-tight flex items-center gap-1">
                    <span>💬 اضغط مطوّلاً للبحث الروحي</span>
                  </div>
                  <div className="text-[8.5px] text-slate-300 dark:text-slate-400 font-bold mt-0.5">
                    قرآن، أذكار، ومواقيت الصلاة 🔍
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissCoachmarkPermanently();
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors cursor-pointer shrink-0"
                  title="إغلاق التلميح"
                  aria-label="إغلاق تلميح البحث الروحي"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Downward Speech Bubble Triangle/Tail */}
                <div className="absolute -bottom-1.5 start-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 dark:bg-slate-800 rotate-45 border-r border-b border-amber-500/40" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle hold animation ring when holding */}
        {isHolding && (
          <motion.div
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.4, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-amber-500/50 blur-xs"
          />
        )}

        <button
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          aria-expanded={isFabOpen}
          aria-haspopup="menu"
          aria-label={isFabOpen ? "إغلاق القائمة السريعة للعبادات" : "فتح القائمة السريعة للعبادات والإنجاز الفوري"}
          className={`-top-5 relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 active:scale-90 cursor-pointer border-4 border-white dark:border-[#161d26] z-50 ${
            isFabOpen
              ? 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-600/40 dark:shadow-rose-950/60 rotate-90'
              : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-emerald-600/50 dark:shadow-emerald-950/70 hover:shadow-emerald-500/60 ring-4 ring-emerald-500/20'
          }`}
        >
          {isFabOpen ? (
            <X className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <div className="relative flex items-center justify-center">
              <ChevronUp className="w-6 h-6 animate-pulse" />
              <Zap className="w-3 h-3 text-amber-300 absolute -top-1 -end-1 fill-current animate-bounce" />
            </div>
          )}
        </button>

      </div>
    </div>
  );
};

export default SmartFabSystem;
