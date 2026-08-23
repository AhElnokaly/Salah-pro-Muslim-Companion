/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { safeSetItem, safeSetJSON } from '../utils/storage';
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

// Mosque SVG icon
const MosqueIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M12 2v4M12 6a4 4 0 0 0-4 4v3h8v-3a4 4 0 0 0-4-4zM6 13h12v7H6zM3 13v7M21 13v7M12 16h.01" />
  </svg>
);

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
      const logsToUse = prayerLogs || (localStorage.getItem('mc_prayer_logs') ? JSON.parse(localStorage.getItem('mc_prayer_logs') || '{}') : {});
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
    try {
      const raw = localStorage.getItem(COACHMARK_KEY);
      if (raw) {
        return JSON.parse(raw) as { dismissed?: boolean; firstShownAt?: number | null; tappedFirstTime?: boolean };
      }
    } catch (e) {
      // ignore
    }
    return { dismissed: false, firstShownAt: null, tappedFirstTime: false };
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
    const currentCount = parseInt(localStorage.getItem('mc_quick_tasbeeh_today') || '0', 10) + 10;
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
        {isFabOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            className="absolute bottom-20 flex flex-col items-center gap-3 z-50 w-80 max-w-[92vw]"
            dir="rtl"
          >
            {/* Top Dynamic Quick Completion Pills */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="w-full bg-white/95 dark:bg-[#121924]/95 backdrop-blur-xl p-2.5 rounded-3xl border border-amber-500/30 shadow-2xl space-y-2 text-center"
            >
              {/* Spiritual Search Quick Trigger */}
              <button
                onClick={handleOpenSpiritualSearch}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer text-start active:scale-98 border border-emerald-400/30"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Search className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black leading-tight">البحث الروحي الشامل</div>
                    <div className="text-[8.5px] text-emerald-100 font-bold">قرآن، أذكار، مواقيت وتقويم 🔍</div>
                  </div>
                </div>
                <div className="px-2 py-0.5 bg-amber-400 text-slate-900 rounded-lg text-[9px] font-black">
                  ضغط مطوّل ⚡
                </div>
              </button>

              <div className="flex items-center justify-between px-2 text-[10px] font-black text-amber-600 dark:text-amber-400 pt-1">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  الإنجاز السريع المباشر
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">بلمسة واحدة</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {/* Quick Log Prayer Pill */}
                <button
                  onClick={handleQuickLogPrayer}
                  className={`flex items-center justify-between p-2 rounded-2xl active:scale-95 transition-all cursor-pointer text-start border ${
                    isPrayerLogged
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 border-emerald-500/40 shadow-xs'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/20'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-black leading-tight">أتممت صلاة {activePrayerArabic}</div>
                    <div className={`text-[8.5px] font-bold ${
                      isPrayerLogged ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-600/80 dark:text-amber-400/80'
                    }`}>
                      {isPrayerLogged ? 'تم تسجيل الصلاة ✔️' : 'تسجيل فوري 🕌'}
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs transition-colors ${
                    isPrayerLogged ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* Quick Log Adhkar Pill */}
                <button
                  onClick={handleQuickLogAdhkar}
                  className="flex items-center justify-between p-2 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 transition-all cursor-pointer text-start"
                >
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-black leading-tight">{adhkarText}</div>
                    <div className="text-[8.5px] text-indigo-600/80 dark:text-indigo-400/80 font-bold">فتح الورد 📿</div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>

              {/* Quran Quick Pill & Quick Tasbeeh Pill */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={handleQuickLogQuran}
                  className="flex items-center justify-between p-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition-all cursor-pointer text-start"
                >
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-black leading-tight">ورد القرآن</div>
                    <div className="text-[8.5px] text-emerald-600/80 dark:text-emerald-400/80 font-bold">+1 صفحة 📖</div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                </button>

                <button
                  onClick={handleQuickTasbeeh}
                  className="flex items-center justify-between p-2 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 active:scale-95 text-teal-700 dark:text-teal-300 border border-teal-500/20 transition-all cursor-pointer text-start"
                >
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-black leading-tight">تسبيح سريع</div>
                    <div className="text-[8.5px] text-teal-600/80 dark:text-teal-400/80 font-bold">+10 تسبيحات 📿</div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Radial Fan / Grid of Main Worship Hubs (3x3 Grid) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full bg-white/95 dark:bg-[#121924]/95 backdrop-blur-xl p-3 rounded-3xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl grid grid-cols-3 gap-2"
            >
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isCurrent = activeTab === item.id;

                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => {
                      triggerHaptic();
                      setIsFabOpen(false);
                      setActiveTab(item.id);
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl border transition-all cursor-pointer relative ${
                      isCurrent
                        ? 'bg-gradient-to-b from-emerald-600 to-teal-700 text-white border-emerald-400 shadow-md font-black'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/50 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    {item.badge && (
                      <span className="absolute -top-1 -start-1 bg-amber-500 text-white text-[7.5px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                        {item.badge}
                      </span>
                    )}
                    <div className={`p-1.5 rounded-xl ${isCurrent ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9.5px] font-extrabold leading-tight text-center">
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 2. LONG PRESS SMART QUICK COMPLETION FLOATING SHEET           */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isLongPressSheetOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-24 start-4 end-4 md:start-auto md:end-auto md:w-96 bg-white dark:bg-[#151c27] border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl z-50 space-y-4"
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">لوحة الإنجاز السريع الفوري</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">سجّل عبادتك الآن دون مغادرة الصفحة</p>
                </div>
              </div>

              <button
                onClick={() => setIsLongPressSheetOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleQuickLogPrayer}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer text-start active:scale-98 ${
                  isPrayerLogged
                    ? 'bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-md transition-colors ${
                    isPrayerLogged ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}>
                    <MosqueIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800 dark:text-slate-100">أتممت صلاة {activePrayerArabic} 🕌</div>
                    <div className={`text-[10px] font-bold ${
                      isPrayerLogged ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {isPrayerLogged ? 'تم تسجيل الصلاة في وقتها بنجاح 🌟' : 'تسجيل الصلاة في وقتها بالجماعة'}
                    </div>
                  </div>
                </div>
                <div className={`px-2.5 py-1 text-white rounded-xl text-[10px] font-black shadow-xs transition-colors ${
                  isPrayerLogged ? 'bg-emerald-600' : 'bg-amber-500'
                }`}>
                  {isPrayerLogged ? 'تمت ✔️' : 'تسجيل ⚡'}
                </div>
              </button>

              <button
                onClick={handleQuickLogAdhkar}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-indigo-500/5 to-transparent border border-indigo-500/30 hover:bg-indigo-500/20 transition-all cursor-pointer text-start active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800 dark:text-slate-100">{adhkarText} 📿</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">الانتقال الفوري لقائمة الأذكار</div>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-xs">
                  انتقال ⚡
                </div>
              </button>

              <button
                onClick={handleQuickLogQuran}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer text-start active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800 dark:text-slate-100">ورد القرآن اليومي 📖</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">إضافة صفحة/جلسة قراءة اليوم</div>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-emerald-600 text-white rounded-xl text-[10px] font-black shadow-xs">
                  إضافة 📖
                </div>
              </button>

              <button
                onClick={handleQuickTasbeeh}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-teal-500/15 via-teal-500/5 to-transparent border border-teal-500/30 hover:bg-teal-500/20 transition-all cursor-pointer text-start active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800 dark:text-slate-100">تسبيح واستغفار سريع 📿</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">تسجيل +10 تسبيحات فورية من أي مكان</div>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-teal-600 text-white rounded-xl text-[10px] font-black shadow-xs">
                  +10 تسبيح ⚡
                </div>
              </button>
            </div>
          </motion.div>
        )}
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
