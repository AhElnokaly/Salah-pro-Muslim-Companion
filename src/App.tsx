/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
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
  Download,
  Share2,
  Lightbulb,
  HelpCircle,
  Zap,
  BarChart3,
  AlertTriangle,
  ChevronUp,
  X,
  Plus,
  Loader2
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
  CustomDua,
  AlarmConfig,
  TabId,
  SettingsSubTabId
} from './types';

// Eager Essential Components
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import AthanOverlay from './components/AthanOverlay';
import SmartFabSystem from './components/SmartFabSystem';
import { WeatherWidget } from './components/WeatherWidget';

// Helper for safe lazy loading with retry mechanism
function safeLazy<T extends React.ComponentType<any>>(
  importFn: () => Promise<any>
) {
  return lazy(async () => {
    try {
      const module = await importFn();
      if (module.default) {
        return { default: module.default as T };
      }
      const firstExport = Object.values(module)[0];
      if (firstExport) {
        return { default: firstExport as T };
      }
      throw new Error('No valid component export found');
    } catch (err) {
      console.warn('[safeLazy] Dynamic import failed, retrying once...', err);
      await new Promise((resolve) => setTimeout(resolve, 400));
      const retryModule = await importFn();
      if (retryModule && retryModule.default) {
        return { default: retryModule.default as T };
      }
      const firstExport = retryModule ? Object.values(retryModule)[0] : null;
      if (firstExport) {
        return { default: firstExport as T };
      }
      throw err;
    }
  });
}

// Code-split Lazy Secondary Tabs & Features
const QuranTracker = safeLazy(() => import('./components/QuranTracker'));
const AdhkarTracker = safeLazy(() => import('./components/AdhkarTracker'));
const QiblaCompass = safeLazy(() => import('./components/QiblaCompass'));
const MoreSettings = safeLazy(() => import('./components/MoreSettings'));
const PrayerManager = safeLazy(() => import('./components/PrayerManager'));
const FastingTracker = safeLazy(() => import('./components/FastingTracker'));
const IslamicCalendar = safeLazy(() => import('./components/IslamicCalendar'));
const WidgetSimulator = safeLazy(() => import('./components/WidgetSimulator'));
const WorshipAlarms = safeLazy(() => import('./components/WorshipAlarms'));
const KhushuQiyamTracker = safeLazy(() => import('./components/KhushuQiyamTracker'));
const AnalyticsDashboard = safeLazy(() => import('./components/AnalyticsDashboard'));
const MoonPhases = safeLazy(() => import('./components/MoonPhases'));

// Lazy Modals
const QuickSettingsModal = safeLazy(() => import('./components/QuickSettingsModal'));
const FeatureTourModal = safeLazy(() => import('./components/FeatureTourModal'));
const PostOnboardingWelcomeModal = safeLazy(() => import('./components/PostOnboardingWelcomeModal'));
const SpiritualPortalModal = safeLazy(() => import('./components/SpiritualPortalModal'));
const SpiritualSearchModal = safeLazy(() => import('./components/SpiritualSearchModal'));
const PwaInstallModal = safeLazy(() => import('./components/PwaInstallModal'));
const CustomAlarmOverlay = safeLazy(() => import('./components/CustomAlarmOverlay'));
const VersionInfoModal = safeLazy(() => import('./components/VersionInfoModal'));
import { APP_VERSION } from './version';

import { PrayerKey } from './utils/adhkarCalc';

// Custom Hooks
import { usePrayerClock } from './hooks/usePrayerClock';
import { useSpiritualState } from './hooks/useSpiritualState';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useAthanPlayer } from './hooks/useAthanPlayer';
import { usePrayerScheduler, getLocalDateStr } from './hooks/usePrayerScheduler';
import { useAndroidBackButton } from './hooks/useAndroidBackButton';

import { safeSetItem } from './utils/storage';
import { syncUpcomingPrayerSchedule } from './utils/prayerScheduleSync';
import { formatDateKey } from './utils/prayerDayBoundary';
import { syncPrayerScheduleWithSW } from './utils/pushNotificationService';
import { checkExactAlarmPermission, requestExactAlarmPermission, checkNotificationPermission, requestNotificationPermission } from './services/athanAlarmPlugin';
import { trackFeatureUsage } from './utils/analyticsStorage';
import { defaultMuezzins, getAudioUrl, getAudioUrlSync, archiveMuezzins, getCustomAudios, silentlyCacheAudio } from './utils/audioStorage';

// Minimal Loading Fallback
const TabLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[45vh] p-8 text-center" dir="rtl">
    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 shadow-xs">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
    </div>
    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">جاري التحميل...</span>
  </div>
);

// Import Hemmaty app logo icon
import companionIcon from './assets/images/hemmaty_logo.jpg';

// Calculations for standalone widget state synchronization
import { calculatePrayerTimes, getCurrentAndNextPrayer, getArabicPrayerName } from './utils/prayerCalc';
import { getHijriDate, formatGregorianFullDateArabic, toArabicNumbers } from './utils/hijri';

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
  backdropOpacity: 75,
  clockStyle: 'digital'
};

// --- GLOBAL DEEP REMEMBRANCE & AUDIO SYNTHESIS ENGINE ---
const SPIRITUAL_CAPSULES = [
  {
    text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    source: "سورة الرعد - الآية ٢٨",
    category: "طمأنينة وطمأنة الروح"
  },
  {
    text: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ",
    source: "سورة غافر - الآية ٦٠",
    category: "يقين بالإجابة والفرج"
  },
  {
    text: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
    source: "سورة البقرة - الآية ١٥٢",
    category: "ذكر رباني وشكر النعمة"
  },
  {
    text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
    source: "سورة الطلاق - الآية ٢ - ٣",
    category: "سعة الرزق والفرج العاجل"
  },
  {
    text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    source: "سورة الشرح - الآية ٦",
    category: "بشرى وتيسير العسير"
  },
  {
    text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    source: "سورة الطلاق - الآية ٣",
    category: "قوة التوكل والاعتماد على الله"
  },
  {
    text: "وَاصْبِرْ لِحُكْمِ رَبِّكَ فَإِنَّكَ بِأَعْيُنِنَا",
    source: "سورة الطور - الآية ٤٨",
    category: "معية الله ورحمته ولطفه"
  },
  {
    text: "كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلَتَانِ فِي الْمِيزَانِ، حَبِيبَتَانِ إِلَى الرَّحْمَنِ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
    source: "حديث شريف - متفق عليه",
    category: "كنز الميزان والذكر العظيم"
  },
  {
    text: "مَنْ لَزِمَ الاسْتِغْفَارَ جَعَلَ اللهُ لَهُ مِنْ كُلِّ ضِيقٍ مَخْرَجاً، وَمِنْ كُلِّ هَمٍّ فَرَجاً، وَرَزَقَهُ مِنْ حَيْثُ لا يَحْتَسِبُ",
    source: "حديث شريف - رواه أبو داود",
    category: "سر الاستغفار وجلاء الهموم"
  },
  {
    text: "أَقْرَبُ ما يَكونُ العَبْدُ مِن رَبِّهِ وهو ساجِدٌ، فأكْثِرُوا الدُّعاءَ",
    source: "حديث شريف - رواه مسلم",
    category: "قرب ومناجاة حارة في السجود"
  }
];

let spiritualAudioCtx: AudioContext | null = null;

const playSpiritualChime = (pitch: number = 523.25) => {
  try {
    if (!spiritualAudioCtx) {
      spiritualAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (spiritualAudioCtx.state === 'suspended') {
      spiritualAudioCtx.resume();
    }
    
    const now = spiritualAudioCtx.currentTime;
    const osc1 = spiritualAudioCtx.createOscillator();
    const osc2 = spiritualAudioCtx.createOscillator();
    const gainNode = spiritualAudioCtx.createGain();
    const delayNode = spiritualAudioCtx.createDelay();
    const delayGain = spiritualAudioCtx.createGain();
    const filter = spiritualAudioCtx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(pitch, now);
    osc1.frequency.exponentialRampToValueAtTime(pitch / 2, now + 1.5);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(pitch / 2, now);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    delayNode.delayTime.setValueAtTime(0.4, now);
    delayGain.gain.setValueAtTime(0.06, now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    
    gainNode.connect(delayNode);
    delayNode.connect(delayGain);
    delayGain.connect(spiritualAudioCtx.destination);
    delayGain.connect(delayNode);

    gainNode.connect(spiritualAudioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    
    osc1.stop(now + 2.0);
    osc2.stop(now + 2.0);
  } catch (err) {
    console.warn("Spiritual chime audio failed:", err);
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<SettingsSubTabId>('prayer');
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(() => localStorage.getItem('salah_show_post_onboarding_welcome') === 'true');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notificationsCount, setNotificationsCount] = useState<number>(0);
  const [storageWarningAcknowledged, setStorageWarningAcknowledged] = useState<boolean>(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() => 
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [notifBannerDismissed, setNotifBannerDismissed] = useState<boolean>(false);
  const [exactAlarmPermissionGranted, setExactAlarmPermissionGranted] = useState<boolean>(true);
  const [exactAlarmBannerDismissed, setExactAlarmBannerDismissed] = useState<boolean>(false);

  // Proactive check and listener for exact alarm permission and notification permission
  useEffect(() => {
    checkExactAlarmPermission().then(granted => {
      setExactAlarmPermissionGranted(granted);
    });

    checkNotificationPermission().then(granted => {
      if (granted) {
        setNotifPermission('granted');
      }
    });

    const handleMissingPerm = () => {
      setExactAlarmPermissionGranted(false);
    };
    window.addEventListener('exact-alarm-permission-missing', handleMissingPerm);
    return () => {
      window.removeEventListener('exact-alarm-permission-missing', handleMissingPerm);
    };
  }, []);

  // Custom Hooks Extraction
  const {
    settings,
    setSettings,
    prayerLogs,
    setPrayerLogs,
    pendingQadaPrayers,
    setPendingQadaPrayers,
    voluntaryPrayerLogs,
    setVoluntaryPrayerLogs,
    fastingLogs,
    setFastingLogs,
    ramadanQada,
    setRamadanQada,
    quranSessions,
    setQuranSessions,
    khatmat,
    setKhatmat,
    dhikrLogs,
    setDhikrLogs,
    customDuas,
    setCustomDuas,
    isLoaded,
    storageWriteError
  } = useSpiritualState();

  const {
    isInstalled,
    showPwaInstallGuide,
    setShowPwaInstallGuide,
    showManualSteps,
    setShowManualSteps,
    handleInstallApp,
    handleDirectInstallInsideModal
  } = usePwaInstall();

  const {
    globalAudioRef,
    isAthanPlaying,
    showAthanOverlay,
    setShowAthanOverlay,
    athanOverlayPrayer,
    setAthanOverlayPrayer,
    currentPhraseIdx,
    audioError,
    audioVolume,
    setAudioVolume,
    currentMuezzin,
    setCurrentMuezzin,
    fajrMuezzin,
    setFajrMuezzin,
    customMuezzins,
    markAthanDismissed,
    triggerAthan,
    stopAthanGlobal,
    togglePlayAthanGlobal,
    handleRetryAudioWithLocal
  } = useAthanPlayer();

  const {
    customAlarms,
    setCustomAlarms,
    alerts,
    setAlerts,
    activeRingingAlarm,
    setActiveRingingAlarm,
    checkTimesAndAlarms
  } = usePrayerScheduler({
    settings,
    isLoaded,
    triggerAthan,
    globalAudioRef,
    audioVolume,
    setToastMessage
  });

  // Pre-cache preferred muezzins on app load
  useEffect(() => {
    if (!isLoaded || !navigator.onLine) return;
    const fajrMuezzinId = localStorage.getItem('salah_fajr_muezzin') || 'fajr_makkah';
    const generalMuezzinId = localStorage.getItem('salah_general_muezzin') || 'makkah';
    const tracks = [...defaultMuezzins, ...archiveMuezzins];

    [
      { id: fajrMuezzinId, isFajr: true },
      { id: generalMuezzinId, isFajr: false },
    ].forEach(({ id, isFajr }) => {
      const track = tracks.find(t => t.id === id);
      if (track) {
        silentlyCacheAudio(track.id, track.url, isFajr).catch(() => {});
      }
    });
  }, [isLoaded]);

  // Portal of Serenity & Spiritual Breath States
  const [showSpiritualModal, setShowSpiritualModal] = useState<boolean>(false);
  const [isFabOpen, setIsFabOpen] = useState<boolean>(false);
  const [headerRippleActive, setHeaderRippleActive] = useState<boolean>(false);
  const [fiqhWarning, setFiqhWarning] = useState<{ title: string; removedReasons: string[] } | null>(null);
  const [targetAdhkarPrayer, setTargetAdhkarPrayer] = useState<PrayerKey | null>(null);
  const [isSpiritualSearchOpen, setIsSpiritualSearchOpen] = useState<boolean>(false);

  // Register Android Hardware Back Button Handling (Task 26)
  useAndroidBackButton({
    activeTab,
    setActiveTab,
    setToastMessage: (msg) => setToastMessage(msg),
    overlays: [
      {
        id: 'isSpiritualSearchOpen',
        isOpen: isSpiritualSearchOpen,
        close: () => setIsSpiritualSearchOpen(false)
      },
      {
        id: 'athanOverlay',
        isOpen: showAthanOverlay,
        close: () => {
          markAthanDismissed();
          setShowAthanOverlay(false);
          stopAthanGlobal();
        }
      },
      {
        id: 'activeRingingAlarm',
        isOpen: Boolean(activeRingingAlarm),
        close: () => setActiveRingingAlarm(null)
      },
      {
        id: 'fiqhWarning',
        isOpen: Boolean(fiqhWarning),
        close: () => setFiqhWarning(null)
      },
      {
        id: 'isFabOpen',
        isOpen: isFabOpen,
        close: () => setIsFabOpen(false)
      },
      {
        id: 'isSidebarOpen',
        isOpen: isSidebarOpen,
        close: () => setIsSidebarOpen(false)
      },
      {
        id: 'isQuickSettingsOpen',
        isOpen: isQuickSettingsOpen,
        close: () => setIsQuickSettingsOpen(false)
      },
      {
        id: 'isTourModalOpen',
        isOpen: isTourModalOpen,
        close: () => setIsTourModalOpen(false)
      },
      {
        id: 'isVersionModalOpen',
        isOpen: isVersionModalOpen,
        close: () => setIsVersionModalOpen(false)
      },
      {
        id: 'showSpiritualModal',
        isOpen: showSpiritualModal,
        close: () => setShowSpiritualModal(false)
      },
      {
        id: 'showPwaInstallGuide',
        isOpen: showPwaInstallGuide,
        close: () => setShowPwaInstallGuide(false)
      },
      {
        id: 'showWelcomeModal',
        isOpen: showWelcomeModal,
        close: () => setShowWelcomeModal(false)
      }
    ]
  });

  const handleNavigateToAdhkarForPrayer = (prayerName: string) => {
    const p = (prayerName || '').toLowerCase();
    let key: PrayerKey = 'fajr';
    if (p.includes('dhuhr') || p.includes('zuhr')) key = 'dhuhr';
    else if (p.includes('asr')) key = 'asr';
    else if (p.includes('maghrib')) key = 'maghrib';
    else if (p.includes('isha')) key = 'isha';
    else if (p.includes('fajr')) key = 'fajr';

    setTargetAdhkarPrayer(key);
    setActiveTab('adhkar');
  };

  // Smart Network & Sync Status Indicator State (Online = Green 🟢, Syncing/Loading = Yellow 🟡, Offline = Red 🔴)
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleGpsSync = () => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 2200);
    };
    window.addEventListener('trigger-gps-sync', handleGpsSync);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('trigger-gps-sync', handleGpsSync);
    };
  }, []);

  // Floating particles state
  interface HeaderParticle {
    id: string;
    x: number;
    y: number;
    rotate: number;
    emoji: string;
    scale: number;
  }
  const [headerParticles, setHeaderParticles] = useState<HeaderParticle[]>([]);

  const triggerHeaderParticles = () => {
    const emojis = ['✨', '⭐', '🌸', '🤍', '💚', '🕌'];
    const newParticles: HeaderParticle[] = Array.from({ length: 10 }).map((_, idx) => {
      const angle = (Math.random() * 120 + 30) * (Math.PI / 180);
      const distance = Math.random() * 60 + 50;
      const x = Math.cos(angle) * distance;
      const y = -Math.sin(angle) * distance - 15;
      
      return {
        id: `${Date.now()}-${idx}-${Math.random()}`,
        x,
        y,
        rotate: Math.random() * 360 - 180,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        scale: Math.random() * 0.5 + 0.7
      };
    });
    
    setHeaderParticles(newParticles);
    setTimeout(() => {
      setHeaderParticles([]);
    }, 1500);
  };

  // Auto track feature usage whenever activeTab changes
  useEffect(() => {
    if (activeTab) {
      trackFeatureUsage(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    const handleKhushuTrigger = () => {
      setActiveTab('khushu');
    };
    const handleTourTrigger = () => {
      setIsTourModalOpen(true);
    };
    const handleSettingsSubtabTrigger = (e: any) => {
      if (e.detail?.subTab) {
        setActiveSettingsSubTab(e.detail.subTab);
        setActiveTab('settings');
      }
    };
    const handleMainTabTrigger = (e: any) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    const handleOpenSpiritualSearch = () => {
      setIsSpiritualSearchOpen(true);
    };

    window.addEventListener('open-khushu-page', handleKhushuTrigger);
    window.addEventListener('open-feature-tour', handleTourTrigger);
    window.addEventListener('change-settings-subtab', handleSettingsSubtabTrigger);
    window.addEventListener('change-main-tab', handleMainTabTrigger);
    window.addEventListener('salah_open_spiritual_search', handleOpenSpiritualSearch);

    return () => {
      window.removeEventListener('open-khushu-page', handleKhushuTrigger);
      window.removeEventListener('open-feature-tour', handleTourTrigger);
      window.removeEventListener('change-settings-subtab', handleSettingsSubtabTrigger);
      window.removeEventListener('change-main-tab', handleMainTabTrigger);
      window.removeEventListener('salah_open_spiritual_search', handleOpenSpiritualSearch);
    };
  }, []);

  const handleShareApp = async () => {
    const shareData = {
      title: 'هِمَّتِي Hemmaty',
      text: 'تطبيق هِمَّتِي: مواقيت الصلاة بدقة عالية، الأذكار اليومية، الختمات والقرآن الكريم، واتجاه القبلة مع ميزات رائعة وتصميم عصري!',
      url: 'https://salah-pro-muslim-companion.vercel.app/',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setToastMessage("تم فتح قائمة المشاركة بنجاح 📤");
      } catch (err) {
        console.log("Share failed or was canceled:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setToastMessage("تم نسخ رابط التطبيق بنجاح! شاركه الآن مع أحبابك 🔗🤍");
      } catch (err) {
        console.error("Clipboard copy failed:", err);
        setToastMessage("عذراً، لم نتمكن من نسخ الرابط تلقائياً. يمكنك مشاركة هذا الرابط: https://salah-pro-muslim-companion.vercel.app/");
      }
    }
  };

  // Listen to spiritual notifications count dispatched from Dashboard
  useEffect(() => {
    const handleUpdateCount = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setNotificationsCount(customEvent.detail || 0);
    };
    const handlePrayerSettings = () => {
      setActiveTab('settings');
      setActiveSettingsSubTab('prayer');
    };
    window.addEventListener('update-spiritual-notifications-count', handleUpdateCount);
    window.addEventListener('open-prayer-settings', handlePrayerSettings);
    return () => {
      window.removeEventListener('update-spiritual-notifications-count', handleUpdateCount);
      window.removeEventListener('open-prayer-settings', handlePrayerSettings);
    };
  }, []);

  const { now, hijri, gregorianStr, times, current, next, timeRemainingStr, dayNameArabic } = usePrayerClock(settings);
  const activePrayerName = current === 'Sunrise' ? 'Fajr' : (current || 'Dhuhr');

  // Quick Log Event Handlers (Triggered by Smart FAB or Quick Actions)
  useEffect(() => {
    const handleQuickLogPrayer = () => {
      // Ensure user is navigated to home tab where the prayer logging modal is displayed
      setActiveTab('home');
    };

    const handleQuickLogQuran = () => {
      const today = getLocalDateStr(new Date());
      const newSession: QuranSession = {
        id: `qs_${Date.now()}`,
        date: today,
        sessionType: 'read',
        unitType: 'pages',
        unitValue: 1
      };
      const updated = [newSession, ...quranSessions];
      setQuranSessions(updated);
      safeSetItem('mc_quran_sessions', JSON.stringify(updated));
    };

    window.addEventListener('salah_quick_log_prayer', handleQuickLogPrayer);
    window.addEventListener('salah_quick_log_quran', handleQuickLogQuran);

    return () => {
      window.removeEventListener('salah_quick_log_prayer', handleQuickLogPrayer);
      window.removeEventListener('salah_quick_log_quran', handleQuickLogQuran);
    };
  }, [prayerLogs, setPrayerLogs, quranSessions, setQuranSessions, next]);

  // Sync 30-day prayer schedule in local background storage
  useEffect(() => {
    if (isLoaded) {
      try {
        syncUpcomingPrayerSchedule(settings);
      } catch (e) {
        console.error('Failed to sync 30-day prayer schedule:', e);
      }
    }
  }, [isLoaded, settings.latitude, settings.longitude, settings.calcMethod, settings.madhab]);

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

  // Listen to simulation trigger globally
  useEffect(() => {
    const handleSimulationTrigger = (e: Event) => {
      const customEv = e as CustomEvent;
      const detail = customEv?.detail || {};
      const activePrayer = (detail.prayerName as PrayerName) || (current && current !== 'Sunrise' ? current : (next === 'Sunrise' ? 'Dhuhr' : next)) || 'Dhuhr';
      const muezzinId = detail.muezzinId as string | undefined;

      setAthanOverlayPrayer(activePrayer);
      setShowAthanOverlay(true);

      if (globalAudioRef.current) {
        try {
          globalAudioRef.current.pause();
          globalAudioRef.current.currentTime = 0;
        } catch (err) {
          console.warn('Error pausing audio:', err);
        }
      }

      togglePlayAthanGlobal(muezzinId, activePrayer);
    };

    window.addEventListener('trigger-athan-simulation', handleSimulationTrigger);
    return () => {
      window.removeEventListener('trigger-athan-simulation', handleSimulationTrigger);
    };
  }, [current, next, togglePlayAthanGlobal, setAthanOverlayPrayer, setShowAthanOverlay, globalAudioRef]);

  // Synchronize prayer schedule with Service Worker for background notifications
  useEffect(() => {
    if (isLoaded) {
      syncPrayerScheduleWithSW(settings);
    }
  }, [
    isLoaded,
    settings.latitude,
    settings.longitude,
    settings.cityName,
    settings.calcMethod,
    settings.madhab,
    settings.prayerOffsets,
    settings.adhanEnabled
  ]);

  // Handle autoAthan URL parameter and Service Worker notification clicks
  useEffect(() => {
    // 1. Check URL parameters (e.g. ?autoAthan=true&prayer=Maghrib)
    const params = new URLSearchParams(window.location.search);
    if (params.get('autoAthan') === 'true') {
      const p = (params.get('prayer') as PrayerName) || 'Dhuhr';
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('trigger-athan-simulation', { detail: { prayerName: p } }));
      }, 300);
    }

    // 2. Listen to SW messages when app is active
    if ('serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'TRIGGER_ATHAN_FROM_NOTIFICATION') {
          const prayerName = event.data.prayerName as PrayerName;
          if (prayerName) {
            window.dispatchEvent(new CustomEvent('trigger-athan-simulation', { detail: { prayerName } }));
          }
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
  }, []);

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
      setFiqhWarning({
        title: 'تنبيه فقهي هام',
        removedReasons
      });
    }
  }, [fastingLogs, isLoaded, settings.hijriOffset]);

  // Handle completion of onboarding
  const handleOnboardingComplete = (
    finalSettings: AppSettings, 
    lastPrayerDone: { prayer: PrayerName; wasOnTime: boolean }
  ) => {
    setSettings(finalSettings);
    
    // Log the starting prayer so they don't start with empty logs
    const todayStr = formatDateKey(new Date());
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
    setShowWelcomeModal(true);
  };

  // While loading, display a gorgeous, clean loading pulse
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#faf7f0] dark:bg-[#0e1217] flex flex-col items-center justify-center text-center space-y-4" dir="rtl">
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-850 animate-pulse bg-[#16202c]">
          <img 
            src={companionIcon} 
            alt="Hemmaty Logo" 
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/hemmaty_logo.jpg';
            }}
            className="w-full h-full object-cover select-none" 
            referrerPolicy="no-referrer" 
          />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">هِمَّتِي</h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">Hemmaty</p>
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
    <div className="min-h-screen bg-[#faf7f0] dark:bg-[#0e1217] pb-24 text-end flex flex-col items-center font-sans transition-colors duration-300 text-slate-800 dark:text-slate-100 w-full" dir="rtl">
      
      {/* 1. Sticky Top Header Bar */}
      <header className="w-full max-w-md md:max-w-xl bg-white/95 dark:bg-[#121820]/95 backdrop-blur-md border-b border-[#e2e8f0]/80 dark:border-slate-800/80 px-3 md:px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors duration-300 rounded-b-3xl">
        {/* Right side: Menu + App Brand & Location */}
        <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
            title="افتح القائمة الجانبية"
            aria-label="فتح القائمة الجانبية والضبط"
          >
            <Menu className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>
          
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex items-center justify-center shrink-0">
              {/* Concentric Expanding Spiritual Ripples */}
              {headerRippleActive && (
                <>
                  <motion.span
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute inset-0 rounded-2xl border-2 border-indigo-500/60 pointer-events-none z-0"
                  />
                  <motion.span
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 3.2, opacity: 0 }}
                    transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
                    className="absolute inset-0 rounded-2xl border-2 border-emerald-400/50 pointer-events-none z-0"
                  />
                  <motion.span
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 4.2, opacity: 0 }}
                    transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                    className="absolute inset-0 rounded-2xl border border-teal-300/30 pointer-events-none z-0"
                  />
                </>
              )}

              {/* Floating Spiritual Particles */}
              <AnimatePresence>
                {headerParticles.map((p) => (
                  <motion.span
                    key={p.id}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 0.1, rotate: 0 }}
                    animate={{ 
                      opacity: 0, 
                      x: p.x, 
                      y: p.y, 
                      scale: p.scale, 
                      rotate: p.rotate 
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      duration: 1.3, 
                      ease: [0.19, 1, 0.22, 1]
                    }}
                    className="absolute text-sm pointer-events-none z-20 select-none drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
                  >
                    {p.emoji}
                  </motion.span>
                ))}
              </AnimatePresence>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setHeaderRippleActive(true);
                  triggerHeaderParticles();
                  setTimeout(() => setHeaderRippleActive(false), 1400);
                  playSpiritualChime(523.25);
                  setTimeout(() => {
                    setShowSpiritualModal(true);
                  }, 250);
                }}
                className="relative w-10 h-10 md:w-11 md:h-11 rounded-2xl overflow-hidden border-2 border-emerald-500/40 dark:border-amber-400/50 flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-emerald-500/20 focus:outline-hidden z-10 transition-all duration-300 bg-[#121d2a]"
                title="اضغط لتفتح بوابة النفحات الإيمانية 🌸"
              >
                <img 
                  src={companionIcon} 
                  alt="هِمَّتِي" 
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/hemmaty_logo.jpg';
                  }}
                  className="w-full h-full object-cover select-none transition-transform duration-300 hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-2xl pointer-events-none" />
                
                {/* Dynamic Smart Network & Sync Status Indicator Dot */}
                {isSyncing ? (
                  <span 
                    className="absolute bottom-0.5 end-0.5 w-3 h-3 bg-amber-400 border-2 border-white dark:border-slate-900 rounded-full shadow-[0_0_10px_#f59e0b] animate-ping"
                    title="جاري التحديث ومزامنة المواقيت أونلاين... 🟡"
                  />
                ) : isOnline ? (
                  <span 
                    className="absolute bottom-0.5 end-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-[0_0_8px_#10b981]"
                    title="متصل بالشبكة - الخدمة أونلاين 🟢"
                  />
                ) : (
                  <span 
                    className="absolute bottom-0.5 end-0.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full shadow-[0_0_8px_#f43f5e] animate-pulse"
                    title="غير متصل بالشبكة - يعمل أوفلاين بالكامل 🔴"
                  />
                )}
              </motion.button>
            </div>

            <div className="flex flex-col text-end min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <h1 className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">هِمَّتِي</h1>
              </div>
              <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('trigger-gps-sync'));
                  }}
                  className="text-[9px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-0.5 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer truncate"
                  title="اضغط لتحديث موقعك ومزامنة المواقيت تلقائياً عبر الـ GPS 📡"
                  aria-label="مزامنة وتحديث الموقع الجغرافي والمواقيت"
                >
                  <MapPin className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                  <span className="truncate max-w-[80px] sm:max-w-[120px]">{settings.cityName || 'الإسكندرية'}</span>
                </button>
                <WeatherWidget lat={settings.latitude} lng={settings.longitude} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Left side: Streamlined High-Priority Action Panel */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {/* Worship Alarms Shortcut Button */}
          <button 
            onClick={() => setActiveTab('alarms')}
            className="w-8.5 h-8.5 md:w-9.5 md:h-9.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
            title="منبهات العبادات والصلوات ⏰"
            aria-label="منبهات العبادات والصلوات"
          >
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </button>

          {/* Minaret / Athan Simulator Button */}
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('trigger-athan-simulation'));
            }}
            className="w-8.5 h-8.5 md:w-9.5 md:h-9.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
            title="محاكاة تجربة الأذان الكاملة 🕌"
            aria-label="تشغيل محاكاة تجربة الأذان الكاملة"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a1.5 1.5 0 0 0-1.5 1.5v2h3v-2A1.5 1.5 0 0 0 12 2z" />
              <path d="M9 7c0-2 1.5-3 3-3s3 1 3 3v2H9V7z" />
              <path d="M8 9h8v3H8z" />
              <path d="M9 12h6v8H9z" />
              <path d="M11 15v3h2v-3z" />
              <path d="M6 20h12v2H6z" />
            </svg>
          </button>

          {/* Interactive Feature Guide Tour Button */}
          <button 
            onClick={() => setIsTourModalOpen(true)}
            className="w-8.5 h-8.5 md:w-9.5 md:h-9.5 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 relative shadow-2xs group"
            title="جولة تفاعلية في مزايا التطبيق 💡"
            aria-label="بدء جولة تفاعلية في مزايا التطبيق"
          >
            <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-300 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
          </button>

          {/* Theme toggle button */}
          <button 
            onClick={() => {
              const nextTheme = settings.theme === 'light' ? 'dark' : settings.theme === 'dark' ? 'system' : 'light';
              setSettings(prev => ({ ...prev, theme: nextTheme }));
            }}
            className="w-8.5 h-8.5 md:w-9.5 md:h-9.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/50 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
            title="تغيير المظهر"
            aria-label="تغيير مظهر التطبيق (ليلي / نهاري / نظام)"
          >
            {settings.theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : settings.theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Monitor className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Content Stage Container */}
      <main className="w-full max-w-md p-4 space-y-6">
        {storageWriteError && !storageWarningAcknowledged && (
          <div className="w-full p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 rounded-2xl text-rose-900 dark:text-rose-100 space-y-2 text-end text-xs shadow-md">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="text-base">⚠️</span>
              <span>تنبيه هام: تعذر حفظ البيانات</span>
            </div>
            <p className="leading-relaxed">
              تعذر حفظ البيانات في ذاكرة الجهاز المحلية (قد تكون المساحة ممتلئة أو التصفح الخاص مفعّلاً). يرجى تفريغ مساحة على جهازك أو إغلاق الوضع الخاص لضمان حفظ سجلاتك وطاعاتك.
            </p>
            <button
              onClick={() => setStorageWarningAcknowledged(true)}
              className="mt-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              حسناً، فهمت
            </button>
          </div>
        )}

        {notifPermission === 'default' && !notifBannerDismissed && (
          <div className="w-full p-3.5 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-indigo-900 dark:text-indigo-100 flex items-center justify-between gap-3 text-end text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🔔</span>
              <div>
                <p className="font-bold text-sm">تفعيل التنبيهات</p>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">احصل على تذكير في مواقيت الصلاة والأذكار</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={async () => {
                  try {
                    await requestNotificationPermission();
                  } catch (e) {
                    console.warn('Native notification request error:', e);
                  }
                  if ('Notification' in window) {
                    const res = await Notification.requestPermission();
                    setNotifPermission(res);
                  }
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                فعّل تذكير الصلاة
              </button>
              <button
                onClick={() => setNotifBannerDismissed(true)}
                className="p-1.5 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 transition-colors cursor-pointer"
                aria-label="إغلاق التنبيه"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {!exactAlarmPermissionGranted && !exactAlarmBannerDismissed && (
          <div className="w-full p-3.5 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-900 dark:text-amber-100 flex items-center justify-between gap-3 text-end text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-base">⏰</span>
              <div>
                <p className="font-bold text-sm">تنبيه الأذان الدقيق</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  يتطلب إطلاق الأذان في الوقت المظبوط منح صلاحية المنبهات والتذكيرات في إعدادات النظام
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={async () => {
                  await requestExactAlarmPermission();
                  setTimeout(async () => {
                    const isGranted = await checkExactAlarmPermission();
                    setExactAlarmPermissionGranted(isGranted);
                  }, 1200);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                منح الصلاحية
              </button>
              <button
                onClick={() => setExactAlarmBannerDismissed(true)}
                className="p-1.5 text-amber-400 hover:text-amber-600 dark:hover:text-amber-200 transition-colors cursor-pointer"
                aria-label="إغلاق التنبيه"
              >
                ✕
              </button>
            </div>
          </div>
        )}

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
            voluntaryPrayerLogs={voluntaryPrayerLogs}
            setVoluntaryPrayerLogs={setVoluntaryPrayerLogs}
            fastingLogs={fastingLogs}
            setFastingLogs={setFastingLogs}
            ramadanQada={ramadanQada}
            setRamadanQada={setRamadanQada}
            setActiveTab={setActiveTab}
            onNavigateToAdhkarForPrayer={handleNavigateToAdhkarForPrayer}
            customDuas={customDuas}
            setCustomDuas={setCustomDuas}
            quranSessions={quranSessions}
            khatmat={khatmat}
            dhikrLogs={dhikrLogs}
            onInstallApp={handleInstallApp}
            isPwaInstalled={isInstalled}
          />
        )}

        <Suspense fallback={<TabLoadingFallback />}>
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
                onNavigateTab={(tab) => setActiveTab(tab as TabId)}
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
              voluntaryPrayerLogs={voluntaryPrayerLogs}
              setVoluntaryPrayerLogs={setVoluntaryPrayerLogs}
              customAlarms={customAlarms}
              setCustomAlarms={setCustomAlarms}
              alerts={alerts}
              setAlerts={setAlerts}
              onNavigateTab={(tab, subTab) => {
                if (tab) setActiveTab(tab as TabId);
                if (subTab && tab === 'settings') setActiveSettingsSubTab(subTab as SettingsSubTabId);
              }}
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
              currentPrayer={current}
              prayerTimes={times}
              targetPrayerKey={targetAdhkarPrayer}
              onNavigateTab={(tab) => {
                if (tab === 'settings' || tab === 'prayer' || tab === 'adhan') {
                  setActiveTab('settings');
                  if (tab === 'prayer' || tab === 'adhan') {
                    setActiveSettingsSubTab(tab as SettingsSubTabId);
                  }
                } else {
                  setActiveTab(tab as TabId);
                }
              }}
              onOpenNotificationsModal={() => {
                window.dispatchEvent(new CustomEvent('open-spiritual-notifications'));
              }}
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
              onNavigateTab={(tab) => setActiveTab(tab as TabId)}
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
              voluntaryPrayerLogs={voluntaryPrayerLogs}
              setVoluntaryPrayerLogs={setVoluntaryPrayerLogs}
              fastingLogs={fastingLogs}
              setFastingLogs={setFastingLogs}
              quranSessions={quranSessions}
              setQuranSessions={setQuranSessions}
              khatmat={khatmat}
              setKhatmat={setKhatmat}
              dhikrLogs={dhikrLogs}
              setDhikrLogs={setDhikrLogs}
              customDuas={customDuas}
              setCustomDuas={setCustomDuas}
            />
          )}

          {activeTab === 'widgets' && (
            <div className="pb-12 space-y-6">
              <WidgetSimulator 
                prayerTimes={times} 
                settings={settings}
                setSettings={setSettings}
                currentPrayer={current}
                nextPrayer={next}
                timeRemainingStr={timeRemainingStr}
                hijri={hijri}
                dayNameArabic={dayNameArabic}
                gregorianStr={gregorianStr}
              />
            </div>
          )}

          {activeTab === 'alarms' && (
            <WorshipAlarms
              settings={settings}
              setSettings={setSettings}
              customAlarms={customAlarms}
              setCustomAlarms={setCustomAlarms}
              alerts={alerts}
              setAlerts={setAlerts}
              audioVolume={audioVolume}
              setAudioVolume={setAudioVolume}
            />
          )}

          {activeTab === 'khushu' && (
            <KhushuQiyamTracker
              settings={settings}
              prayerLogs={prayerLogs}
              setPrayerLogs={setPrayerLogs}
              setCustomAlarms={setCustomAlarms}
              onNavigateTab={(tab) => setActiveTab(tab as TabId)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              onSelectTab={(tab) => setActiveTab(tab as TabId)}
            />
          )}

          {activeTab === 'moon' && (
            <MoonPhases
              now={now}
              hijriDay={hijri.day}
              hijriMonthName={hijri.monthName}
              hijriYear={hijri.year}
              cityName={settings.cityName}
              toArabicNumbers={toArabicNumbers}
              onNavigateTab={(tab) => setActiveTab(tab as TabId)}
            />
          )}
        </Suspense>
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
                    aria-label="إغلاق القائمة الجانبية"
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
                      aria-label="اختيار الهوية الإيمانية: ذكر"
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
                      aria-label="اختيار الهوية الإيمانية: أنثى"
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

                {/* Single Clean Menu Item for Quick Settings Page/Modal */}
                <button
                  onClick={() => {
                    setIsQuickSettingsOpen(true);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-500/20 dark:via-indigo-500/10 dark:to-transparent border border-indigo-200/80 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 font-extrabold hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 transition-all cursor-pointer shadow-xs active:scale-98"
                  aria-label="التحكم والإعدادات السريعة"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black">التحكم والإعدادات السريعة ⚙️</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">المظهر، خلفية البطاقات، المذهب والساعة</div>
                    </div>
                  </div>
                </button>

                {/* Main Worship Navigation */}
                <div className="space-y-2 text-right">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-right">الأقسام والعبادات</span>
                  <div className="grid grid-cols-1 gap-1">
                    {(
                      [
                        { id: 'home', label: 'الرئيسية ولوحة التحكم', icon: Home },
                        { id: 'moon', label: 'أطوار ومنازل القمر 🌙✨', icon: Moon },
                        { id: 'analytics', label: 'جدول الاستخدام والإتقان 📊', icon: BarChart3 },
                        { id: 'khushu', label: 'الخشوع وقيام الليل والتهجد 🌙', icon: Moon },
                        { id: 'calendar', label: 'التقويم والتقرير الإحصائي', icon: Calendar },
                        { id: 'salah', label: 'مواقيت الصلاة ومتابعتها', icon: MosqueIcon },
                        { id: 'quran', label: 'القرآن الكريم والختمات', icon: BookOpen },
                        { id: 'fasting', label: 'متابعة وتتبع الصيام', icon: Moon },
                        { id: 'adhkar', label: 'الأذكار اليومية والاستغفار', icon: Sparkles },
                        { id: 'alarms', label: 'منبهات العبادات والصلوات ⏰', icon: Bell },
                        { id: 'qibla', label: 'تحديد اتجاه القبلة', icon: Compass },
                        { id: 'widgets', label: 'أدوات الشاشة الذكية (Widgets) 📱', icon: Smartphone },
                      ] as { id: TabId; label: string; icon: React.ElementType }[]
                    ).map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsSidebarOpen(false);
                          }}
                          className={`flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-right transition-all cursor-pointer w-full ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-slate-500 dark:text-slate-450 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dedicated Settings Pages Section */}
                <div className="space-y-2 text-right">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-right">إعدادات وضبط التطبيق</span>
                  <div className="grid grid-cols-1 gap-1">
                    {(
                      [
                        { id: 'dashboard', label: 'تخصيص الشاشة الرئيسية', icon: Sliders },
                        { id: 'prayer', label: 'إعدادات الصلاة والمذهب', icon: Sliders },
                        { id: 'location', label: 'إعدادات الموقع الجغرافي والـ GPS', icon: MapPin },
                        { id: 'adhan', label: 'أصوات الأذان وتنبيهات المؤذنين', icon: Volume2 },
                        { id: 'calendar', label: 'تعديل التقويم الهجري', icon: Calendar },
                        { id: 'theme', label: 'مظهر التطبيق وشكل الساعة', icon: Settings },
                        { id: 'qada', label: 'سجل القضاء وتتبع الفوائت', icon: Clock },
                        { id: 'duas', label: 'الأدعية المخصصة المحفوظة', icon: Heart },
                        { id: 'backup', label: 'نسخ احتياطي واسترداد البيانات', icon: RotateCcw },
                      ] as { id: SettingsSubTabId; label: string; icon: React.ElementType }[]
                    ).map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeTab === 'settings' && activeSettingsSubTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab('settings');
                            setActiveSettingsSubTab(item.id);
                            setIsSidebarOpen(false);
                          }}
                          className={`flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-right transition-all cursor-pointer w-full ${
                            isSelected
                              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-black border border-amber-500/20'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-slate-500 dark:text-slate-450 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Feature Discovery Tour Launch Card inside Sidebar */}
                <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/30 dark:to-teal-950/20 p-3.5 rounded-2xl border border-emerald-500/20 shadow-xs space-y-2 text-right">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">دليل وجولة مزايا التطبيق 💡</span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold text-right">
                    تعرف على كافة الخدمات المميزة خطوة بخطوة عبر جولة تفاعلية سريعة وشاملة.
                  </p>
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setIsTourModalOpen(true);
                    }}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[10.5px] rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>بدء الجولة التفاعلية ✨</span>
                  </button>
                </div>

                {/* Share App Action inside Sidebar */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/40 dark:from-indigo-950/10 dark:to-indigo-950/20 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-950/20 shadow-xs space-y-2 text-right">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-indigo-500 animate-pulse shrink-0" />
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">نشر الخير ومشاركة التطبيق</span>
                  </div>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold text-right">
                    الدال على الخير كفاعله. شارك تطبيق هِمَّتِي مع أصدقائك وعائلتك ليكتب الله لك الأجر! 🤍
                  </p>
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      handleShareApp();
                    }}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-[10.5px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>مشاركة رابط التطبيق 📤</span>
                  </button>
                </div>

                {/* PWA Install Promo inside Sidebar */}
                {!isInstalled && (
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/10 dark:to-amber-950/20 p-3.5 rounded-2xl border border-amber-100 dark:border-amber-950/20 shadow-xs space-y-2 text-right">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-amber-500 animate-bounce shrink-0" />
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">تنزيل تطبيق هِمَّتِي كـ App</span>
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold text-right">
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

              {/* Sidebar Footer with App Version Badge */}
              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 text-center space-y-2">
                {/* App Version Tag Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setIsVersionModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full text-[10px] font-black border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer active:scale-95"
                  title="عرض تفاصيل الإصدار وسجل التحديثات"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>هِمَّتِي v{APP_VERSION.version} (بناء {APP_VERSION.buildNumber})</span>
                </button>

                <span className="text-[9px] text-slate-400/80 dark:text-slate-500/80 block">
                  يعمل بالكامل دون خوادم لخصوصية تامة 🤍
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Rebalanced Fixed Bottom Navigation with Central FAB Radial Menu */}
      <nav className="fixed bottom-0 start-0 end-0 bg-white/95 dark:bg-[#161d26]/95 backdrop-blur-md border-t border-[#e2e8f0] dark:border-slate-800/80 py-2 px-1 shadow-xl z-40 flex justify-around items-center w-full max-w-md mx-auto rounded-t-3xl transition-colors duration-300">
        
        {/* Backdrop overlay when FAB fan menu is open */}
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFabOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30"
            />
          )}
        </AnimatePresence>

        {/* 1. Home Dashboard */}
        <button
          onClick={() => {
            setIsFabOpen(false);
            setActiveTab('home');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl cursor-pointer transition-all active:scale-95 ${
            activeTab === 'home' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/30' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
          aria-label="الذهاب للرئيسية"
        >
          <Home className="w-5 h-5" />
          <span className="text-[9.5px] leading-none font-bold">الرئيسية</span>
        </button>

        {/* 2. Adhkar & Remembrance */}
        <button
          onClick={() => {
            setIsFabOpen(false);
            setActiveTab('adhkar');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl cursor-pointer transition-all active:scale-95 ${
            activeTab === 'adhkar' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/30' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
          aria-label="الذهاب لتبويب الأذكار"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9.5px] leading-none font-bold">الأذكار</span>
        </button>

        {/* 3. Central Raised FAB (Smart Radial Speed-Dial & Quick Log System) */}
        <SmartFabSystem
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isFabOpen={isFabOpen}
          setIsFabOpen={setIsFabOpen}
          currentPrayerArabic={getArabicPrayerName(activePrayerName)}
          currentPrayerKey={activePrayerName}
          nextPrayerArabic={getArabicPrayerName(typeof next === 'string' ? next : 'Asr')}
          nextPrayerKey={typeof next === 'string' ? next : 'Asr'}
          prayerLogs={prayerLogs}
          setToastMessage={setToastMessage}
        />

        {/* 4. Qibla Compass */}
        <button
          onClick={() => {
            setIsFabOpen(false);
            setActiveTab('qibla');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl cursor-pointer transition-all active:scale-95 ${
            activeTab === 'qibla' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/30' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
          aria-label="الذهاب لتبويب تحديد القبلة"
        >
          <Compass className="w-5 h-5" />
          <span className="text-[9.5px] leading-none font-bold">القبلة</span>
        </button>

        {/* 5. Hijri Calendar */}
        <button
          onClick={() => {
            setIsFabOpen(false);
            setActiveTab('calendar');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl cursor-pointer transition-all active:scale-95 ${
            activeTab === 'calendar' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/30' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
          aria-label="الذهاب لتبويب التقويم الهجري"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[9.5px] leading-none font-bold">التقويم</span>
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
            className="fixed bottom-24 start-4 end-4 md:start-auto md:end-4 md:max-w-md bg-slate-900/95 dark:bg-[#161d26]/98 backdrop-blur-md text-white px-5 py-4 rounded-2xl border border-slate-700/50 shadow-2xl z-50 flex items-start gap-3.5 text-end font-sans"
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

      {/* Global Immersive Athan Overlay Screen */}
      <AthanOverlay 
        isOpen={showAthanOverlay} 
        onClose={() => {
          markAthanDismissed();
          setShowAthanOverlay(false);
          stopAthanGlobal();
        }} 
        prayerName={getArabicPrayerName(athanOverlayPrayer)} 
        prayerTime={times[athanOverlayPrayer]} 
        audioRef={globalAudioRef}
        isPlaying={isAthanPlaying}
        currentPhraseIdx={currentPhraseIdx}
        currentMuezzin={currentMuezzin}
        fajrMuezzin={fajrMuezzin}
        setCurrentMuezzin={setCurrentMuezzin}
        setFajrMuezzin={setFajrMuezzin}
        togglePlayAthan={togglePlayAthanGlobal}
        stopAthan={stopAthanGlobal}
        audioError={audioError}
        onRetryWithLocal={handleRetryAudioWithLocal}
      />

      {/* Fiqh Warning Modal for prohibited fasting days */}
      {fiqhWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white dark:bg-[#18202c] border border-amber-500/30 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-end">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-black text-base">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <h3>{fiqhWarning.title}</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed">
              يَحْرُم صيام أيام العيدين وأيام التشريق شرعاً. تم إلغاء صيام الأيام التالية تلقائياً من جدولك:
            </p>
            <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 font-bold space-y-1">
              {fiqhWarning.removedReasons.map((reason, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span>•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-black text-center">
              نسأل الله أن يتقبل طاعتكم وفرحكم بالعيد! 🤲🌸
            </p>
            <button
              onClick={() => setFiqhWarning(null)}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              فهمت
            </button>
          </div>
        </div>
      )}

      {/* Lazy Loaded Modal Dialogs */}
      <Suspense fallback={null}>
        {/* PWA Installation Guide Modal */}
        <PwaInstallModal
          isOpen={showPwaInstallGuide}
          onClose={() => setShowPwaInstallGuide(false)}
          showManualSteps={showManualSteps}
          setShowManualSteps={setShowManualSteps}
          onDirectInstall={() => handleDirectInstallInsideModal(setToastMessage)}
        />

        {/* بوابة النفحات الإيمانية */}
        <SpiritualPortalModal
          isOpen={showSpiritualModal}
          onClose={() => setShowSpiritualModal(false)}
          setToastMessage={setToastMessage}
        />

        {/* Global Custom Alarm Ringing Modal */}
        <CustomAlarmOverlay
          activeRingingAlarm={activeRingingAlarm}
          onSnooze={() => {
            if (globalAudioRef.current) {
              globalAudioRef.current.pause();
            }
            const snoozedAlarm = {
              ...activeRingingAlarm,
              id: `snooze_${Date.now()}`,
              title: `${activeRingingAlarm.title} (غفوة)`,
              time: (() => {
                const d = new Date();
                d.setMinutes(d.getMinutes() + 5);
                return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
              })(),
              days: [new Date().getDay()],
              enabled: true,
              soundType: activeRingingAlarm.soundType
            };
            setCustomAlarms((prev: AlarmConfig[]) => [...prev, snoozedAlarm]);
            setActiveRingingAlarm(null);
            setToastMessage("تم تأجيل المنبه لمدة ٥ دقائق ⏰");
          }}
          onStop={() => {
            if (globalAudioRef.current) {
              globalAudioRef.current.pause();
            }
            setActiveRingingAlarm(null);
          }}
        />

        {/* Feature Tour Guide Modal */}
        <FeatureTourModal
          isOpen={isTourModalOpen}
          onClose={() => setIsTourModalOpen(false)}
          onSelectTab={(tab, subTab) => {
            setActiveTab(tab as TabId);
            if (subTab) {
              setActiveSettingsSubTab(subTab as SettingsSubTabId);
            }
          }}
        />

        {/* Quick Interactive Settings Modal */}
        <QuickSettingsModal
          isOpen={isQuickSettingsOpen}
          onClose={() => setIsQuickSettingsOpen(false)}
          settings={settings}
          setSettings={setSettings}
          setToastMessage={setToastMessage}
          onOpenFullSettings={() => {
            setActiveTab('settings');
            setActiveSettingsSubTab('prayer');
          }}
        />

        {/* Post Onboarding Welcome Modal */}
        <PostOnboardingWelcomeModal
          isOpen={showWelcomeModal}
          onStartTour={() => {
            localStorage.removeItem('salah_show_post_onboarding_welcome');
            setShowWelcomeModal(false);
            setIsTourModalOpen(true);
          }}
          onExploreOnOwn={() => {
            localStorage.removeItem('salah_show_post_onboarding_welcome');
            setShowWelcomeModal(false);
          }}
        />

        {/* Spiritual Search Modal (Unified Search across Quran, Adhkar, Prayers & Events) */}
        <SpiritualSearchModal
          isOpen={isSpiritualSearchOpen}
          onClose={() => setIsSpiritualSearchOpen(false)}
          setActiveTab={setActiveTab}
          setToastMessage={setToastMessage}
        />

        {/* Version Information & Changelog Modal */}
        <VersionInfoModal
          isOpen={isVersionModalOpen}
          onClose={() => setIsVersionModalOpen(false)}
        />
      </Suspense>

    </div>
  );
}
