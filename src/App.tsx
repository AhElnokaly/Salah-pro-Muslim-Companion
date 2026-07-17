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
  Smartphone
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

  // Clock State & Real-time Prayer/Date Synchronizations
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
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
      <div className="min-h-screen bg-[#faf7f0] flex flex-col items-center justify-center text-center space-y-3" dir="rtl">
        <Moon className="w-12 h-12 text-indigo-600 animate-spin" style={{ animationDuration: '3s' }} />
        <h2 className="text-xl font-bold text-slate-800">رفيق المسلم</h2>
        <p className="text-xs text-slate-400">تحميل السجلات المباركة...</p>
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
      <header className="w-full max-w-md bg-white dark:bg-[#161d26]/90 backdrop-blur-md border-b border-[#e2e8f0]/85 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors duration-300 rounded-b-3xl">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-center"
          title="افتح القائمة الجانبية"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <MosqueIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-sm font-black text-slate-800 dark:text-white">رفيق المسلم</h1>
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-lg font-extrabold">
            {settings.cityName}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Notifications Bell Button */}
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-spiritual-notifications'));
            }}
            className="p-2 rounded-xl bg-amber-50 dark:bg-[#282114]/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-[#282114]/80 border border-amber-500/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="النفحات والإشعارات الإيمانية 🔔"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* Minaret / Athan Simulator Button */}
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('trigger-athan-simulation'));
            }}
            className="p-2 rounded-xl bg-emerald-50 dark:bg-[#14231b]/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-[#14231b]/80 border border-emerald-500/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="محاكاة تجربة الأذان الكاملة 🕌"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a1.5 1.5 0 0 0-1.5 1.5v2h3v-2A1.5 1.5 0 0 0 12 2z" />
              <path d="M9 7c0-2 1.5-3 3-3s3 1 3 3v2H9V7z" />
              <path d="M8 9h8v3H8z" />
              <path d="M9 12h6v8H9z" />
              <path d="M11 15v3h2v-3z" />
              <path d="M6 20h12v2H6z" />
            </svg>
          </button>

          <button 
            onClick={() => {
              const nextTheme = settings.theme === 'light' ? 'dark' : settings.theme === 'dark' ? 'system' : 'light';
              setSettings(prev => ({ ...prev, theme: nextTheme }));
            }}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="تغيير المظهر"
          >
            {settings.theme === 'light' ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : settings.theme === 'dark' ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Monitor className="w-5 h-5 text-slate-400" />
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

    </div>
  );
}
