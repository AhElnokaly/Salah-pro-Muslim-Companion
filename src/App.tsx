/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  BookOpen, 
  Sparkles, 
  Compass, 
  Settings, 
  Heart,
  Moon,
  Volume2,
  Sun,
  Monitor,
  Menu,
  Sliders,
  Calendar,
  RotateCcw,
  Clock,
  Bell,
  Smartphone,
  MapPin,
  Download
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  AppSettings, 
  PrayerLog, 
  PendingQadaPrayer, 
  RamadanQadaTracker, 
  QuranSession, 
  QuranKhatma,
  PrayerName,
  CustomDua
} from './types';

// Component imports
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import QuranTracker from './components/QuranTracker';
import AdhkarTracker from './components/AdhkarTracker';
import QiblaCompass from './components/QiblaCompass';
import MoreSettings from './components/MoreSettings';
import PrayerManager from './components/PrayerManager';
import FastingTracker from './components/FastingTracker';
import IslamicCalendar from './components/IslamicCalendar';
import WidgetSimulator from './components/WidgetSimulator';

// Calculations for standalone widget state synchronization
import { calculatePrayerTimes, getCurrentAndNextPrayer } from './utils/prayerCalc';
import { getHijriDate, formatGregorianFullDateArabic } from './utils/hijri';

// Premium Custom Mosque Icon SVG
const MosqueIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
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

// Default mock/starting values
const DEFAULT_SETTINGS: AppSettings = {
  latitude: 30.0444,
  longitude: 31.2357,
  cityName: 'القاهرة',
  calcMethod: 'Egypt',
  madhab: 'standard',
  hijriOffset: 0,
  adhanEnabled: {
    Fajr: true,
    Sunrise: false,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true
  },
  hasCompletedOnboarding: false,
  backdropStyle: 'auto',
  clockStyle: 'digital'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'salah' | 'quran' | 'adhkar' | 'qibla' | 'fasting' | 'settings' | 'calendar' | 'widgets'>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<'qada' | 'prayer' | 'adhan' | 'calendar' | 'theme' | 'backup' | 'duas'>('prayer');
  const [isLoaded, setIsLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // App states
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [prayerLogs, setPrayerLogs] = useState<Record<string, Record<string, PrayerLog>>>({});
  const [pendingQadaPrayers, setPendingQadaPrayers] = useState<PendingQadaPrayer[]>([]);
  const [fastingLogs, setFastingLogs] = useState<Record<string, any>>({});
  const [ramadanQada, setRamadanQada] = useState<RamadanQadaTracker>({
    daysOwed: 0,
    daysCompleted: 0,
    trackMode: 'fasting',
    fidyaTarget: 30,
    fidyaCompleted: 0
  });
  const [quranSessions, setQuranSessions] = useState<QuranSession[]>([]);
  const [khatmat, setKhatmat] = useState<QuranKhatma[]>([]);
  const [dhikrLogs, setDhikrLogs] = useState<Record<string, Record<string, number>>>({});
  const [customDuas, setCustomDuas] = useState<CustomDua[]>([]);
  const [notificationsCount, setNotificationsCount] = useState<number>(0);

  // PWA states and event listeners
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showPwaInstallGuide, setShowPwaInstallGuide] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if running in standalone mode (already installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      setShowPwaInstallGuide(true);
    }
  };

  // Clock State & Real-time Prayer/Date Synchronizations
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to spiritual notifications count dispatched from Dashboard
  useEffect(() => {
    const handleUpdateCount = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setNotificationsCount(customEvent.detail || 0);
    };
    window.addEventListener('update-spiritual-notifications-count', handleUpdateCount);
    return () => {
      window.removeEventListener('update-spiritual-notifications-count', handleUpdateCount);
    };
  }, []);

  const hijri = getHijriDate(now, settings.hijriOffset);
  const gregorianStr = formatGregorianFullDateArabic(now);
  const times = calculatePrayerTimes(
    now,
    settings.latitude,
    settings.longitude,
    -now.getTimezoneOffset() / 60,
    settings.calcMethod,
    settings.madhab,
    settings.prayerOffsets || {}
  );
  const { current, next, timeRemainingStr } = getCurrentAndNextPrayer(times, now);
  const dayNamesArabic = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayNameArabic = dayNamesArabic[now.getDay()];

  // 1. Load data from LocalStorage on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('mc_settings');
      const storedPrayerLogs = localStorage.getItem('mc_prayer_logs');
      const storedPendingQada = localStorage.getItem('mc_pending_qada');
      const storedFasting = localStorage.getItem('mc_fasting_logs');
      const storedRamadanQada = localStorage.getItem('mc_ramadan_qada');
      const storedQuranSessions = localStorage.getItem('mc_quran_sessions');
      const storedKhatmat = localStorage.getItem('mc_khatmat');
      const storedDhikrLogs = localStorage.getItem('mc_dhikr_logs');
      const storedCustomDuas = localStorage.getItem('mc_custom_duas');

      if (storedSettings) {
        try {
          const parsed = JSON.parse(storedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error(e);
        }
      }
      if (storedPrayerLogs) {
        try {
          setPrayerLogs(JSON.parse(storedPrayerLogs));
        } catch (e) {
          console.error(e);
        }
      }
      if (storedPendingQada) {
        try {
          setPendingQadaPrayers(JSON.parse(storedPendingQada));
        } catch (e) {
          console.error(e);
        }
      }
      if (storedFasting) {
        try {
          setFastingLogs(JSON.parse(storedFasting));
        } catch (e) {
          console.error(e);
        }
      }
      if (storedRamadanQada) {
        try {
          const parsed = JSON.parse(storedRamadanQada);
          setRamadanQada(prev => ({
            daysOwed: typeof parsed.daysOwed === 'number' ? parsed.daysOwed : prev.daysOwed,
            daysCompleted: typeof parsed.daysCompleted === 'number' ? parsed.daysCompleted : prev.daysCompleted,
            trackMode: parsed.trackMode || prev.trackMode,
            fidyaTarget: typeof parsed.fidyaTarget === 'number' ? parsed.fidyaTarget : prev.fidyaTarget,
            fidyaCompleted: typeof parsed.fidyaCompleted === 'number' ? parsed.fidyaCompleted : prev.fidyaCompleted,
          }));
        } catch (e) {
          console.error(e);
        }
      }
      if (storedQuranSessions) {
        try {
          setQuranSessions(JSON.parse(storedQuranSessions));
        } catch (e) {
          console.error(e);
        }
      }
      if (storedKhatmat) {
        try {
          setKhatmat(JSON.parse(storedKhatmat));
        } catch (e) {
          console.error(e);
        }
      }
      if (storedDhikrLogs) {
        try {
          setDhikrLogs(JSON.parse(storedDhikrLogs));
        } catch (e) {
          console.error(e);
        }
      }
      if (storedCustomDuas) {
        try {
          setCustomDuas(JSON.parse(storedCustomDuas));
        } catch (e) {
          console.error(e);
        }
      }
    } catch (e) {
      console.error('Error loading states from localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  // Sync theme setting with document element classes
  useEffect(() => {
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (!settings.theme || settings.theme === 'system') {
        if (e.matches) {
          document.documentElement.classList.add('dark');
          document.body.style.backgroundColor = '#0e1217';
        } else {
          document.documentElement.classList.remove('dark');
          document.body.style.backgroundColor = '#faf7f0';
        }
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    const isDark = settings.theme === 'dark' || 
      ((!settings.theme || settings.theme === 'system') && mediaQuery.matches);
       
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0e1217';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#faf7f0';
    }

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [settings.theme]);

  // 2. Persist state changes to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('mc_settings', JSON.stringify(settings));
  }, [settings, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('mc_prayer_logs', JSON.stringify(prayerLogs));
  }, [prayerLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('mc_pending_qada', JSON.stringify(pendingQadaPrayers));
  }, [pendingQadaPrayers, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('mc_fasting_logs', JSON.stringify(fastingLogs));
  }, [fastingLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('mc_ramadan_qada', JSON.stringify(ramadanQada));
  }, [ramadanQada, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('mc_quran_sessions', JSON.stringify(quranSessions));
  }, [quranSessions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('mc_khatmat', JSON.stringify(khatmat));
  }, [khatmat, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('mc_dhikr_logs', JSON.stringify(dhikrLogs));
  }, [dhikrLogs, isLoaded]);
 
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('mc_custom_duas', JSON.stringify(customDuas));
  }, [customDuas, isLoaded]);

  // Prohibited Fasting Days check and automatic cancellation
  useEffect(() => {
    if (!isLoaded) return;
    
    const dates = Object.keys(fastingLogs);
    let logsModified = false;
    const newFastingLogs = { ...fastingLogs };
    const removedReasons: string[] = [];

    dates.forEach(dateStr => {
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        const h = getHijriDate(d, settings.hijriOffset);

        // Eid al-Fitr (1 Shawwal)
        const isEidFitr = h.month === 10 && h.day === 1;
        // Eid al-Adha (10 Dhu al-Hijjah) & Tashreeq days (11, 12, 13 Dhu al-Hijjah)
        const isEidAdhaOrTashreeq = h.month === 12 && (h.day === 10 || h.day === 11 || h.day === 12 || h.day === 13);

        if ((isEidFitr || isEidAdhaOrTashreeq) && fastingLogs[dateStr]?.fasted) {
          delete newFastingLogs[dateStr];
          logsModified = true;
          
          let reasonStr = '';
          if (isEidFitr) {
            reasonStr = `يوم عيد الفطر المبارك (١ شوال)`;
          } else if (h.day === 10) {
            reasonStr = `يوم عيد الأضحى المبارك (١٠ ذو الحجة)`;
          } else {
            const dayArabic = h.day === 11 ? 'الحادي عشر' : h.day === 12 ? 'الثاني عشر' : 'الثالث عشر';
            reasonStr = `أيام التشريق المباركة (يوم ${dayArabic} ذو الحجة)`;
          }
          removedReasons.push(`التاريخ: ${dateStr} (${reasonStr})`);
        }
      } catch (err) {
        console.error(err);
      }
    });

    if (logsModified) {
      setFastingLogs(newFastingLogs);
      // Show warning to the user
      alert(
        `⚠️ تنبيه فقهي هام:\n\nيَحْرُم صيام أيام العيدين وأيام التشريق شرعاً.\nتم إلغاء صيام الأيام التالية تلقائياً من جدولك:\n\n${removedReasons.join('\n')}\n\nنسأل الله أن يتقبل طاعتكم وفرحكم بالعيد! 🤲🌸`
      );
    }
  }, [fastingLogs, isLoaded, settings.hijriOffset]);

  // Handle completion of onboarding
  const handleOnboardingComplete = (
    finalSettings: AppSettings, 
    lastPrayerDone: { prayer: PrayerName; wasOnTime: boolean }
  ) => {
    setSettings(finalSettings);
    
    // Log the starting prayer so they don't start with empty logs
    const todayStr = new Date().toISOString().split('T')[0];
    const initialLog: PrayerLog = {
      status: lastPrayerDone.wasOnTime ? 'A' : 'B',
      sunnahBefore: 0,
      sunnahAfter: 0
    };
    
    setPrayerLogs({
      [todayStr]: {
        [lastPrayerDone.prayer]: initialLog
      }
    });

    // Save tracking start points
    setSettings(prev => ({
      ...prev,
      trackingStartDate: todayStr,
      trackingStartPrayer: lastPrayerDone.prayer
    }));
  };

  // While loading, display a gorgeous, clean loading pulse
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#faf7f0] dark:bg-[#0e1217] flex flex-col items-center justify-center text-center space-y-4" dir="rtl">
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-850 animate-pulse">
          <img src="/src/assets/images/muslim_companion_icon_1784362373898.jpg" alt="Muslim Companion Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">رفيق المسلم</h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">Muslim Companion</p>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold animate-pulse">جاري تحميل السجلات المباركة...</p>
      </div>
    );
  }

  // Render Onboarding if they haven't finished it yet
  if (!settings.hasCompletedOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#faf7f0] dark:bg-[#0e1217] pb-24 text-right flex flex-col items-center font-sans transition-colors duration-300 text-slate-800 dark:text-slate-100 w-full" dir="rtl">
      
      {/* 1. Sticky Top Header Bar */}
      <header className="w-full max-w-md bg-white/90 dark:bg-[#121820]/90 backdrop-blur-md border-b border-[#e2e8f0]/60 dark:border-slate-800/60 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-colors duration-300 rounded-b-3xl">
        {/* Right side: Menu + Logo & Location Vertical Stack */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/50 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
            title="افتح القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-1.5">
              <MosqueIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-xs font-black text-slate-800 dark:text-white tracking-wide">رفيق المسلم</h1>
            </div>
            
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('trigger-gps-sync'));
              }}
              className="text-[9px] bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300 active:scale-95 transition-all cursor-pointer border border-slate-100 dark:border-slate-800/50 shadow-3xs"
              title="اضغط لتحديث موقعك ومزامنة المواقيت تلقائياً عبر الـ GPS 📡"
            >
              <MapPin className="w-2 h-2 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span>{settings.cityName}</span>
            </button>
          </div>
        </div>
        
        {/* Left side: Integrated Actions Panel */}
        <div className="flex items-center gap-2">
          {/* Download / Install App Button (disappears when installed) */}
          {!isInstalled && (
            <button 
              onClick={handleInstallApp}
              className="w-10 h-10 rounded-2xl bg-amber-500/[0.08] dark:bg-amber-500/[0.06] text-amber-600 dark:text-amber-400 hover:bg-amber-500/[0.15] dark:hover:bg-amber-500/[0.12] border border-amber-500/25 dark:border-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 relative animate-gentle-wiggle shadow-sm"
              title="تنزيل رفيق المسلم كـ App 📱"
            >
              <Download className="w-4.5 h-4.5" />
            </button>
          )}

          {/* Notifications Bell Button */}
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-spiritual-notifications'));
            }}
            className="w-10 h-10 rounded-2xl bg-amber-500/[0.04] dark:bg-amber-500/[0.03] text-amber-600 dark:text-amber-400 hover:bg-amber-500/[0.08] dark:hover:bg-amber-500/[0.06] border border-amber-500/15 dark:border-amber-500/10 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 relative"
            title="النفحات والإشعارات الإيمانية 🔔"
          >
            <Bell className="w-4.5 h-4.5" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(239,68,68,0.4)] border-2 border-white dark:border-[#121820] animate-pulse">
                {(() => {
                  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
                  return notificationsCount.toString().replace(/[0-9]/g, (w) => arabicDigits[parseInt(w)]);
                })()}
              </span>
            )}
          </button>

          {/* Minaret / Athan Simulator Button */}
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('trigger-athan-simulation'));
            }}
            className="w-10 h-10 rounded-2xl bg-emerald-500/[0.04] dark:bg-emerald-500/[0.03] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/[0.08] dark:hover:bg-emerald-500/[0.06] border border-emerald-500/15 dark:border-emerald-500/10 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
            title="محاكاة تجربة الأذان الكاملة 🕌"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a1.5 1.5 0 0 0-1.5 1.5v2h3v-2A1.5 1.5 0 0 0 12 2z" />
              <path d="M9 7c0-2 1.5-3 3-3s3 1 3 3v2H9V7z" />
              <path d="M8 9h8v3H8z" />
              <path d="M9 12h6v8H9z" />
              <path d="M11 15v3h2v-3z" />
              <path d="M6 20h12v2H6z" />
            </svg>
          </button>

          {/* Theme toggle button */}
          <button 
            onClick={() => {
              const nextTheme = settings.theme === 'light' ? 'dark' : settings.theme === 'dark' ? 'system' : 'light';
              setSettings(prev => ({ ...prev, theme: nextTheme }));
            }}
            className="w-10 h-10 rounded-2xl bg-indigo-500/[0.04] dark:bg-indigo-500/[0.03] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/[0.08] dark:hover:bg-indigo-500/[0.06] border border-indigo-500/15 dark:border-indigo-500/10 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
            title="تغيير المظهر"
          >
            {settings.theme === 'light' ? (
              <Sun className="w-4.5 h-4.5 text-amber-500" />
            ) : settings.theme === 'dark' ? (
              <Moon className="w-4.5 h-4.5 text-indigo-400" />
            ) : (
              <Monitor className="w-4.5 h-4.5 text-slate-400" />
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Content Stage Container */}
      <main className="w-full max-w-md p-4 space-y-6">
        {activeTab !== 'home' && activeTab !== 'calendar' && activeTab !== 'qibla' && (
          <button
            onClick={() => setActiveTab('home')}
            className="w-full flex items-center justify-between p-3 bg-white dark:bg-[#161d26] rounded-2xl border border-[#e2e8f0] dark:border-slate-800/80 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">↩️</span>
              <span>العودة للرئيسية</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">اللوحة الرئيسية ←</span>
          </button>
        )}

        {activeTab === 'home' && (
          <Dashboard 
            settings={settings}
            setSettings={setSettings}
            prayerLogs={prayerLogs}
            setPrayerLogs={setPrayerLogs}
            pendingQadaPrayers={pendingQadaPrayers}
            setPendingQadaPrayers={setPendingQadaPrayers}
            fastingLogs={fastingLogs}
            setFastingLogs={setFastingLogs}
            ramadanQada={ramadanQada}
            setRamadanQada={setRamadanQada}
            setActiveTab={setActiveTab}
            customDuas={customDuas}
            setCustomDuas={setCustomDuas}
            quranSessions={quranSessions}
            khatmat={khatmat}
            dhikrLogs={dhikrLogs}
            onInstallApp={handleInstallApp}
            isPwaInstalled={isInstalled}
          />
        )}

        {activeTab === 'calendar' && (
          <div className="pb-12 space-y-6">
            <IslamicCalendar 
              settings={settings}
              setSettings={setSettings}
              prayerLogs={prayerLogs}
              fastingLogs={fastingLogs}
              dhikrLogs={dhikrLogs}
              quranSessions={quranSessions}
              khatmat={khatmat}
            />
          </div>
        )}

        {activeTab === 'salah' && (
          <PrayerManager
            settings={settings}
            setSettings={setSettings}
            prayerLogs={prayerLogs}
            setPrayerLogs={setPrayerLogs}
            pendingQadaPrayers={pendingQadaPrayers}
            setPendingQadaPrayers={setPendingQadaPrayers}
          />
        )}

        {activeTab === 'quran' && (
          <QuranTracker 
            khatmat={khatmat}
            setKhatmat={setKhatmat}
            quranSessions={quranSessions}
            setQuranSessions={setQuranSessions}
          />
        )}

        {activeTab === 'adhkar' && (
          <AdhkarTracker 
            dhikrLogs={dhikrLogs}
            setDhikrLogs={setDhikrLogs}
          />
        )}

        {activeTab === 'qibla' && (
          <QiblaCompass 
            settings={settings}
            setSettings={setSettings}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'fasting' && (
          <FastingTracker 
            settings={settings}
            fastingLogs={fastingLogs}
            setFastingLogs={setFastingLogs}
            ramadanQada={ramadanQada}
            setRamadanQada={setRamadanQada}
          />
        )}

        {activeTab === 'settings' && (
          <MoreSettings 
            subTab={activeSettingsSubTab}
            setSubTab={setActiveSettingsSubTab}
            settings={settings}
            setSettings={setSettings}
            pendingQadaPrayers={pendingQadaPrayers}
            setPendingQadaPrayers={setPendingQadaPrayers}
            ramadanQada={ramadanQada}
            setRamadanQada={setRamadanQada}
            prayerLogs={prayerLogs}
            setPrayerLogs={setPrayerLogs}
            fastingLogs={fastingLogs}
            setFastingLogs={setFastingLogs}
            quranSessions={quranSessions}
            setQuranSessions={setQuranSessions}
            khatmat={khatmat}
            setKhatmat={setKhatmat}
            customDuas={customDuas}
            setCustomDuas={setCustomDuas}
          />
        )}

        {activeTab === 'widgets' && (
          <div className="pb-12 space-y-6">
            <WidgetSimulator 
              prayerTimes={times} 
              settings={settings}
              currentPrayer={current}
              nextPrayer={next}
              timeRemainingStr={timeRemainingStr}
              hijri={hijri}
              dayNameArabic={dayNameArabic}
              gregorianStr={gregorianStr}
            />
          </div>
        )}
      </main>

      {/* 4. Slide-out Sidebar Drawer with motion */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />

            {/* Sidebar Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white dark:bg-[#161d26] z-50 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
              dir="rtl"
            >
              <div className="space-y-6">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                  <div className="flex items-center gap-2">
                    <MosqueIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-black text-slate-800 dark:text-white">القائمة والضبط</span>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="py-1 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer text-xs font-bold"
                  >
                    إغلاق
                  </button>
                </div>

                {/* Gender/Spiritual Identity Selection Card - Placed at the very top for quick & instant access */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/20 dark:to-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">تخصيص الهوية الإيمانية</span>
                    </div>
                    <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-black">ذكي</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSettings(prev => ({ ...prev, gender: 'male' }));
                        setToastMessage("تم تخصيص فقه وأحكام الرجال: مواقيت الجمعة، سنن الجماعة، والأذكار المخصصة تلقائياً 🕌");
                      }}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 border ${
                        (settings.gender || 'male') === 'male'
                          ? 'bg-indigo-600 text-white shadow-sm border-indigo-500 font-black'
                          : 'bg-white dark:bg-[#161d26] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-slate-100 dark:border-slate-800/60'
                      }`}
                    >
                      <span>ذكر 👨</span>
                    </button>
                    <button
                      onClick={() => {
                        setSettings(prev => ({ ...prev, gender: 'female' }));
                        setToastMessage("تم تخصيص فقه وأحكام النساء: تتبع الأعذار الشرعية، أيام قضاء الصيام، وتخصيص الصلوات تلقائياً 🌸");
                      }}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 border ${
                        settings.gender === 'female'
                          ? 'bg-rose-600 text-white shadow-sm border-rose-500 font-black'
                          : 'bg-white dark:bg-[#161d26] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-slate-100 dark:border-slate-800/60'
                      }`}
                    >
                      <span>أنثى 👩</span>
                    </button>
                  </div>

                  {/* Smart Dynamic helper tip */}
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`p-2 rounded-xl border text-[9.5px] leading-relaxed font-bold ${
                      settings.gender === 'female'
                        ? 'bg-rose-50/50 dark:bg-rose-950/10 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-950/20'
                        : 'bg-indigo-50/50 dark:bg-indigo-950/10 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-950/20'
                    }`}
                  >
                    {settings.gender === 'female' ? (
                      <span>وضع المرأة نشط: تفعيل تتبع الأعذار، قضاء الصيام، وسنن الصلوات النسائية تلقائياً. 🌸</span>
                    ) : (
                      <span>وضع الرجل نشط: تفعيل سنن الجماعة بالمسجد، شعائر الجمعة، والأحكام المخصصة تلقائياً. 🕌</span>
                    )}
                  </motion.div>
                </div>

                {/* Main Worship Navigation */}
                <div className="space-y-2 text-right">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">الأقسام والعبادات</span>
                  <div className="grid grid-cols-1 gap-1">
                    {[
                      { id: 'home', label: 'الرئيسية ولوحة التحكم', icon: Home },
                      { id: 'calendar', label: 'التقويم والتقرير الإحصائي', icon: Calendar },
                      { id: 'salah', label: 'مواقيت الصلاة ومتابعتها', icon: MosqueIcon },
                      { id: 'quran', label: 'القرآن الكريم والختمات', icon: BookOpen },
                      { id: 'fasting', label: 'متابعة وتتبع الصيام', icon: Moon },
                      { id: 'adhkar', label: 'الأذكار اليومية والاستغفار', icon: Sparkles },
                      { id: 'qibla', label: 'تحديد اتجاه القبلة', icon: Compass },
                      { id: 'widgets', label: 'أدوات الشاشة الذكية (Widgets) 📱', icon: Smartphone },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id as any);
                            setIsSidebarOpen(false);
                          }}
                          className={`flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-right transition-all cursor-pointer w-full ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-slate-500 dark:text-slate-450" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dedicated Settings Pages Section */}
                <div className="space-y-2 text-right">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">إعدادات وضبط التطبيق</span>
                  <div className="grid grid-cols-1 gap-1">
                    {[
                      { id: 'prayer', label: 'إعدادات الصلاة والمذهب', icon: Sliders },
                      { id: 'adhan', label: 'أصوات الأذان وتنبيهات المؤذنين', icon: Volume2 },
                      { id: 'calendar', label: 'تعديل التقويم الهجري', icon: Calendar },
                      { id: 'theme', label: 'مظهر التطبيق والموقع الجغرافي', icon: Settings },
                      { id: 'qada', label: 'سجل القضاء وتتبع الفوائت', icon: Clock },
                      { id: 'duas', label: 'الأدعية المخصصة المحفوظة', icon: Heart },
                      { id: 'backup', label: 'نسخ احتياطي واسترداد البيانات', icon: RotateCcw },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeTab === 'settings' && activeSettingsSubTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab('settings');
                            setActiveSettingsSubTab(item.id as any);
                            setIsSidebarOpen(false);
                          }}
                          className={`flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-right transition-all cursor-pointer w-full ${
                            isSelected
                              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-black border border-amber-500/20'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-slate-500 dark:text-slate-450" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PWA Install Promo inside Sidebar */}
                {!isInstalled && (
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/10 dark:to-amber-950/20 p-3.5 rounded-2xl border border-amber-100 dark:border-amber-950/20 shadow-xs space-y-2 text-right">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-amber-500 animate-bounce" />
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">تنزيل رفيق المسلم كـ App</span>
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                      ثبّت التطبيق على جهازك للوصول السريع، وتلقي تنبيهات الأذان حتى بدون إنترنت!
                    </p>
                    <button
                      onClick={() => {
                        setIsSidebarOpen(false);
                        handleInstallApp();
                      }}
                      className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-[10.5px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تثبيت التطبيق الآن 📱</span>
                    </button>
                  </div>
                )}

              </div>

              {/* Sidebar Footer */}
              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 text-center">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold">رفيق المسلم 🤍</span>
                <span className="text-[9px] text-slate-400/80 dark:text-slate-500/80 block mt-0.5">يعمل بالكامل دون خوادم لخصوصية تامة</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Standard Fixed Bottom Navigation (Exactly 3 focused tabs: Home, Calendar, and Qibla) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#161d26] border-t border-[#e2e8f0] dark:border-slate-800/80 py-2.5 px-2 shadow-lg z-40 flex justify-around items-center w-full max-w-md mx-auto rounded-t-3xl transition-colors duration-300">
        
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            activeTab === 'home' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] leading-none font-bold">الرئيسية</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            activeTab === 'calendar' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] leading-none font-bold">التقويم</span>
        </button>

        <button
          onClick={() => setActiveTab('qibla')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            activeTab === 'qibla' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] leading-none font-bold">القبلة</span>
        </button>

      </nav>

      {/* Premium Glassmorphic In-App Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-slate-900/95 dark:bg-[#161d26]/98 backdrop-blur-md text-white px-5 py-4 rounded-2xl border border-slate-700/50 shadow-2xl z-50 flex items-start gap-3.5 text-right font-sans"
            dir="rtl"
          >
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
            </div>
            <div className="space-y-1">
              <h5 className="text-[10px] font-black tracking-wider text-indigo-300 uppercase">مساعد التخصيص الذكي</h5>
              <p className="text-xs text-slate-100 font-extrabold leading-relaxed">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Installation Guide Modal */}
      <AnimatePresence>
        {showPwaInstallGuide && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#161d26] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-right"
            >
              <button
                onClick={() => setShowPwaInstallGuide(false)}
                className="absolute top-4 left-4 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer text-xs font-bold"
              >
                ✕
              </button>

              <div className="text-center space-y-2 mb-5">
                <span className="text-4xl block animate-bounce">📥</span>
                <h3 className="text-sm font-black text-slate-800 dark:text-white">تثبيت تطبيق رفيق المسلم</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">استمتع بتجربة تطبيق كامل ومنفصل بمميزات رائعة</p>
              </div>

              <div className="space-y-4">
                {/* Option 1: iOS Safari */}
                <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1">
                    <span>🍎 أجهزة آيفون وآيباد (iOS Safari):</span>
                  </h4>
                  <ul className="text-[10px] text-slate-600 dark:text-slate-300 font-extrabold space-y-1 pr-4 list-decimal">
                    <li>اضغط على زر المشاركة 📤 في أسفل أو أعلى المتصفح.</li>
                    <li>اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen) ➕.</li>
                    <li>اضغط على "إضافة" (Add) في الزاوية العلوية لتثبيته كتطبيق منفصل.</li>
                  </ul>
                </div>

                {/* Option 2: Android / Chrome */}
                <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                    <span>🤖 أجهزة أندرويد والكمبيوتر (Android & PC):</span>
                  </h4>
                  <ul className="text-[10px] text-slate-600 dark:text-slate-300 font-extrabold space-y-1 pr-4 list-decimal">
                    <li>انقر على قائمة المتصفح (الثلاث نقاط ⋮) في الزاوية.</li>
                    <li>اختر "تثبيت التطبيق" (Install App) أو "إضافة إلى الشاشة الرئيسية".</li>
                    <li>قم بتأكيد التثبيت ليظهر فوراً على شاشتك الرئيسية أو سطح المكتب!</li>
                  </ul>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-2">
                <button
                  onClick={() => setShowPwaInstallGuide(false)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-all shadow-sm cursor-pointer text-center"
                >
                  فهمت، شكراً لك 🤍
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
