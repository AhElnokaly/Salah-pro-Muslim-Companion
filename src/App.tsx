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
  Download,
  Share2
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
import WorshipAlarms from './components/WorshipAlarms';
import AthanOverlay from './components/AthanOverlay';
import { defaultMuezzins, getAudioUrl, archiveMuezzins, getCustomAudios } from './utils/audioStorage';

// Import companion icon
import companionIcon from './assets/images/muslim_companion_icon_1784362373898.jpg';

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
    text: "فَاذْكُرُونِي أَسْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
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
let spiritualOscs: OscillatorNode[] = [];
let spiritualGain: GainNode | null = null;

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

const toggleAmbientHealingFrequency = (isOn: boolean) => {
  try {
    if (!spiritualAudioCtx) {
      spiritualAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (!isOn) {
      if (spiritualGain) {
        const fadeTime = spiritualAudioCtx.currentTime;
        spiritualGain.gain.linearRampToValueAtTime(0, fadeTime + 1.5);
        setTimeout(() => {
          try {
            spiritualOscs.forEach(o => { o.stop(); o.disconnect(); });
            spiritualOscs = [];
            if (spiritualGain) {
              spiritualGain.disconnect();
              spiritualGain = null;
            }
          } catch (e) {}
        }, 1600);
      }
      return;
    }

    if (spiritualAudioCtx.state === 'suspended') {
      spiritualAudioCtx.resume();
    }

    spiritualOscs.forEach(o => { try { o.stop(); o.disconnect(); } catch (e) {} });
    spiritualOscs = [];

    const now = spiritualAudioCtx.currentTime;
    spiritualGain = spiritualAudioCtx.createGain();
    spiritualGain.gain.setValueAtTime(0, now);
    spiritualGain.gain.linearRampToValueAtTime(0.08, now + 2.5);

    const osc1 = spiritualAudioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(432, now);

    const osc2 = spiritualAudioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(216, now);

    const osc3 = spiritualAudioCtx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(433.5, now);

    const warmFilter = spiritualAudioCtx.createBiquadFilter();
    warmFilter.type = 'lowpass';
    warmFilter.frequency.setValueAtTime(250, now);

    osc1.connect(warmFilter);
    osc2.connect(warmFilter);
    osc3.connect(warmFilter);
    warmFilter.connect(spiritualGain);
    spiritualGain.connect(spiritualAudioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    spiritualOscs = [osc1, osc2, osc3];
  } catch (err) {
    console.warn("Ambient Healing Frequency failed:", err);
  }
};

const speakSpiritualText = (text: string) => {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      utterance.pitch = 1.05;
      
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.warn("Speech synthesis failed:", e);
  }
};

// Simple helper to parse "HH:MM" string to minutes of the day
const parseTimeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'salah' | 'quran' | 'adhkar' | 'qibla' | 'fasting' | 'settings' | 'calendar' | 'widgets' | 'alarms'>('home');
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

  // Alarms & Alerts Global State
  const [customAlarms, setCustomAlarms] = useState<any[]>(() => {
    const saved = localStorage.getItem('salah_custom_alarms');
    return saved ? JSON.parse(saved) : [];
  });

  const [alerts, setAlerts] = useState<any>(() => {
    const saved = localStorage.getItem('salah_alerts');
    return saved ? JSON.parse(saved) : {
      before: { enabled: true, minutes: 10, days: [0,1,2,3,4,5,6], prayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] },
      after: { enabled: true, minutes: 15, days: [0,1,2,3,4,5,6], prayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] },
      duha: { enabled: true, minutes: 15, days: [0,1,2,3,4,5,6] }
    };
  });

  const [audioVolume, setAudioVolume] = useState<number>(() => {
    const saved = localStorage.getItem('salah_audio_volume');
    return saved ? parseFloat(saved) : 0.8;
  });

  // Global Audio/Overlay States in App.tsx
  const [showAthanOverlay, setShowAthanOverlay] = useState<boolean>(false);
  const [athanOverlayPrayer, setAthanOverlayPrayer] = useState<PrayerName>('Asr');
  const [isAthanPlaying, setIsAthanPlaying] = useState<boolean>(false);
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState<number>(-1);
  const [customMuezzins, setCustomMuezzins] = useState<any[]>([]);

  const [currentMuezzin, setCurrentMuezzin] = useState<string>(() => {
    return localStorage.getItem('salah_general_muezzin') || 'makkah';
  });
  const [fajrMuezzin, setFajrMuezzin] = useState<string>(() => {
    return localStorage.getItem('salah_fajr_muezzin') || 'fajr_yusuf';
  });

  // Custom Alarm ringing overlay state
  const [activeRingingAlarm, setActiveRingingAlarm] = useState<any | null>(null);

  const globalAudioRef = React.useRef<HTMLAudioElement | null>(null);

  // Portal of Serenity & Spiritual Breath States
  const [showSpiritualModal, setShowSpiritualModal] = useState<boolean>(false);
  const [headerRippleActive, setHeaderRippleActive] = useState<boolean>(false);

  // Premium spiritual floating particles state
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
      // Create a beautiful upward arc layout
      const angle = (Math.random() * 120 + 30) * (Math.PI / 180); // 30 to 150 degrees
      const distance = Math.random() * 60 + 50; // 50px to 110px distance
      const x = Math.cos(angle) * distance;
      const y = -Math.sin(angle) * distance - 15; // Float upwards
      
      return {
        id: `${Date.now()}-${idx}-${Math.random()}`,
        x,
        y,
        rotate: Math.random() * 360 - 180,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        scale: Math.random() * 0.5 + 0.7 // 0.7 to 1.2
      };
    });
    
    setHeaderParticles(newParticles);
    // Auto clear after 1.5s
    setTimeout(() => {
      setHeaderParticles([]);
    }, 1500);
  };

  const [sessionTasbihCount, setSessionTasbihCount] = useState<number>(0);
  const [activeDhikrPhrase, setActiveDhikrPhrase] = useState<string>("سُبْحَانَ اللَّهِ");
  const [isAmbientSoundOn, setIsAmbientSoundOn] = useState<boolean>(false);
  const [currentCapsuleIndex, setCurrentCapsuleIndex] = useState<number>(0);

  // PWA states and event listeners
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showPwaInstallGuide, setShowPwaInstallGuide] = useState<boolean>(false);
  const [showManualSteps, setShowManualSteps] = useState<boolean>(false);

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
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Installation prompt failed:", err);
        setShowManualSteps(false);
        setShowPwaInstallGuide(true);
      }
    } else {
      setShowManualSteps(false);
      setShowPwaInstallGuide(true);
    }
  };

  const handleDirectInstallInsideModal = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response inside modal: ${outcome}`);
        setDeferredPrompt(null);
        setShowPwaInstallGuide(false);
      } catch (err) {
        console.error("Direct install inside modal failed:", err);
      }
    } else {
      setToastMessage("عذراً، متصفحك يمنع التثبيت التلقائي حالياً (أو أنك تتصفح من داخل إطار المعاينة). تم تفعيل وعرض خطوات التثبيت اليدوي بالأسفل 📲");
      setShowManualSteps(true);
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'رفيق المسلم - Muslim Companion',
      text: 'تطبيق رفيق المسلم: مواقيت الصلاة بدقة عالية، الأذكار اليومية، الختمات والقرآن الكريم، واتجاه القبلة مع ميزات رائعة وتصميم عصري!',
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

  useEffect(() => {
    localStorage.setItem('salah_custom_alarms', JSON.stringify(customAlarms));
  }, [customAlarms]);

  useEffect(() => {
    localStorage.setItem('salah_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('salah_audio_volume', audioVolume.toString());
  }, [audioVolume]);

  // Fetch custom muezzins on load
  useEffect(() => {
    getCustomAudios().then(tracks => {
      setCustomMuezzins(tracks);
    }).catch(err => {
      console.error('Failed to load custom muezzins in App:', err);
    });
  }, []);

  // Global Background Worker, Time-checking and Catch-up Engine
  const checkTimesAndAlarms = React.useCallback((checkDate: Date, isCatchup = false) => {
    const currentHour = checkDate.getHours();
    const currentMin = checkDate.getMinutes();
    const currentDay = checkDate.getDay();
    const timeKey = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
    const todayStr = checkDate.toISOString().split('T')[0];

    // Calculate prayer times for checkDate
    const currentTimes = calculatePrayerTimes(
      checkDate,
      settings.latitude,
      settings.longitude,
      -checkDate.getTimezoneOffset() / 60,
      settings.calcMethod,
      settings.madhab,
      settings.prayerOffsets || {}
    );

    // 1. Check Adhans
    const prayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (const prayer of prayers) {
      if (settings.adhanEnabled[prayer] === false) continue;
      const prayerTimeStr = currentTimes[prayer];
      if (prayerTimeStr) {
        let isMatch = false;
        if (isCatchup) {
          const prayerMins = parseTimeToMinutes(prayerTimeStr);
          const currentMins = currentHour * 60 + currentMin;
          isMatch = currentMins >= prayerMins && currentMins <= prayerMins + 15;
        } else {
          isMatch = prayerTimeStr === timeKey;
        }

        if (isMatch) {
          const playedKey = `salah_played_${todayStr}_${prayer}`;
          if (!localStorage.getItem(playedKey)) {
            localStorage.setItem(playedKey, 'true');
            triggerAthan(prayer, currentTimes[prayer]);
            break;
          }
        }
      }
    }

    // 2. Check Custom Alarms
    customAlarms.forEach(alarm => {
      if (!alarm.enabled) return;
      if (alarm.days.includes(currentDay)) {
        let isMatch = false;
        if (isCatchup) {
          const alarmMins = parseTimeToMinutes(alarm.time);
          const currentMins = currentHour * 60 + currentMin;
          isMatch = currentMins >= alarmMins && currentMins <= alarmMins + 15;
        } else {
          isMatch = alarm.time === timeKey;
        }

        if (isMatch) {
          const triggeredKey = `salah_triggered_${alarm.id}_${todayStr}`;
          if (!localStorage.getItem(triggeredKey)) {
            localStorage.setItem(triggeredKey, 'true');
            triggerCustomAlarm(alarm);
          }
        }
      }
    });

    // 3. Check Spiritual Alerts (Before/After/Duha)
    // Before Prayer Alert
    if (alerts.before?.enabled && alerts.before.days.includes(currentDay)) {
      alerts.before.prayers.forEach((prayer: PrayerName) => {
        const prayerTimeStr = currentTimes[prayer];
        if (prayerTimeStr) {
          const prayerMins = parseTimeToMinutes(prayerTimeStr);
          const alertMins = prayerMins - alerts.before.minutes;
          const currentMins = currentHour * 60 + currentMin;
          
          let isMatch = false;
          if (isCatchup) {
            isMatch = currentMins >= alertMins && currentMins <= alertMins + 10;
          } else {
            isMatch = currentMins === alertMins;
          }

          if (isMatch) {
            const triggeredKey = `alert_before_${prayer}_${todayStr}`;
            if (!localStorage.getItem(triggeredKey)) {
              localStorage.setItem(triggeredKey, 'true');
              triggerSpiritualAlert(`الاستعداد لصلاة ${getArabicPrayerName(prayer)}`, `حان موعد الاستعداد لصلاة ${getArabicPrayerName(prayer)} خلال ${alerts.before.minutes} دقائق.`);
            }
          }
        }
      });
    }

    // After Prayer Alert
    if (alerts.after?.enabled && alerts.after.days.includes(currentDay)) {
      alerts.after.prayers.forEach((prayer: PrayerName) => {
        const prayerTimeStr = currentTimes[prayer];
        if (prayerTimeStr) {
          const prayerMins = parseTimeToMinutes(prayerTimeStr);
          const alertMins = prayerMins + alerts.after.minutes;
          const currentMins = currentHour * 60 + currentMin;

          let isMatch = false;
          if (isCatchup) {
            isMatch = currentMins >= alertMins && currentMins <= alertMins + 10;
          } else {
            isMatch = currentMins === alertMins;
          }

          if (isMatch) {
            const triggeredKey = `alert_after_${prayer}_${todayStr}`;
            if (!localStorage.getItem(triggeredKey)) {
              localStorage.setItem(triggeredKey, 'true');
              triggerSpiritualAlert(`أذكار صلاة ${getArabicPrayerName(prayer)}`, `تذكير مبارك بقراءة الأذكار والسنن البعدية لصلاة ${getArabicPrayerName(prayer)}.`);
            }
          }
        }
      });
    }

    // Duha Prayer Alert
    if (alerts.duha?.enabled && alerts.duha.days.includes(currentDay)) {
      const sunriseStr = currentTimes['Sunrise'];
      if (sunriseStr) {
        const sunriseMins = parseTimeToMinutes(sunriseStr);
        const alertMins = sunriseMins + alerts.duha.minutes;
        const currentMins = currentHour * 60 + currentMin;

        let isMatch = false;
        if (isCatchup) {
          isMatch = currentMins >= alertMins && currentMins <= alertMins + 10;
        } else {
          isMatch = currentMins === alertMins;
        }

        if (isMatch) {
          const triggeredKey = `alert_duha_${todayStr}`;
          if (!localStorage.getItem(triggeredKey)) {
            localStorage.setItem(triggeredKey, 'true');
            triggerSpiritualAlert("صلاة الضحى (صلاة الأوابين) ☀️", `صلاة الضحى تجزئ عن صدقة كل سلامى من جسدك. حان الآن موعدها المبارك.`);
          }
        }
      }
    }
  }, [customAlarms, alerts, settings, fajrMuezzin, currentMuezzin, audioVolume, customMuezzins]);

  const triggerAthan = async (prayer: PrayerName, timeStr: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`حان الآن موعد صلاة ${getArabicPrayerName(prayer)}`, {
          body: `حسب توقيت مدينة ${settings.cityName || 'القاهرة'}. تقبل الله صلاتكم.`,
          icon: '/favicon.ico',
          dir: 'rtl'
        });
      } catch (e) {
        console.error(e);
      }
    }

    const activeMuezzinId = prayer === 'Fajr' ? fajrMuezzin : currentMuezzin;
    const tracks = [...defaultMuezzins, ...archiveMuezzins, ...customMuezzins];
    const muezzinObj = tracks.find(m => m.id === activeMuezzinId) || defaultMuezzins[0];
    
    if (globalAudioRef.current) {
      globalAudioRef.current.pause();
    }

    try {
      const resolvedUrl = await getAudioUrl(muezzinObj.url);
      const audio = new Audio(resolvedUrl);
      globalAudioRef.current = audio;
      audio.volume = audioVolume;

      const phraseTimings = [
        { start: 0, end: 12 },
        { start: 12, end: 24 },
        { start: 24, end: 34 },
        { start: 34, end: 44 },
        { start: 44, end: 54 },
        { start: 54, end: 64 },
        { start: 64, end: 72 },
        { start: 72, end: 80 },
        { start: 80, end: 90 },
        { start: 90, end: 100 },
        { start: 100, end: 110 },
        { start: 110, end: 120 }
      ];

      audio.addEventListener('play', () => {
        setIsAthanPlaying(true);
      });

      audio.addEventListener('pause', () => {
        setIsAthanPlaying(false);
        setCurrentPhraseIdx(-1);
      });

      audio.addEventListener('ended', () => {
        setIsAthanPlaying(false);
        setCurrentPhraseIdx(-1);
      });

      audio.addEventListener('timeupdate', () => {
        const time = audio.currentTime;
        const activeIdx = phraseTimings.findIndex(p => time >= p.start && time < p.end);
        setCurrentPhraseIdx(activeIdx);
      });

      setAthanOverlayPrayer(prayer);
      setShowAthanOverlay(true);

      audio.play().catch(e => {
        console.warn("Autoplay blocked or play failed:", e);
      });
    } catch (err) {
      console.error(err);
    }
  };

  const triggerCustomAlarm = (alarm: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`تنبيه مخصص: ${alarm.title}`, {
          body: `حان الآن موعد: ${alarm.title} (${toArabicNumbers(alarm.time)})`,
          icon: '/favicon.ico',
          dir: 'rtl'
        });
      } catch (e) {
        console.error(e);
      }
    }

    if (alarm.soundType !== 'silent') {
      let soundUrl = '/audio/azan3.mp3';
      if (alarm.soundType === 'beep') {
        soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav';
      } else if (alarm.soundType === 'vibrate') {
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }

      if (alarm.soundType !== 'vibrate') {
        if (globalAudioRef.current) {
          globalAudioRef.current.pause();
        }

        const audio = new Audio(soundUrl);
        globalAudioRef.current = audio;
        audio.volume = audioVolume;

        audio.play().catch(e => console.error(e));
      }
    }

    setActiveRingingAlarm(alarm);
  };

  const triggerSpiritualAlert = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: '/favicon.ico',
          dir: 'rtl'
        });
      } catch (e) {
        console.error(e);
      }
    }

    const chimeUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav';
    const audio = new Audio(chimeUrl);
    audio.volume = audioVolume * 0.5;
    audio.play().catch(e => console.error(e));

    setToastMessage(`⏰ ${title}: ${body}`);
  };

  const togglePlayAthanGlobal = async (muezzinId?: string) => {
    const activeMuezzinId = muezzinId || (athanOverlayPrayer === 'Fajr' ? fajrMuezzin : currentMuezzin);
    
    if (isAthanPlaying) {
      if (globalAudioRef.current) {
        globalAudioRef.current.pause();
      }
      setIsAthanPlaying(false);
      setCurrentPhraseIdx(-1);
    } else {
      const tracks = [...defaultMuezzins, ...archiveMuezzins, ...customMuezzins];
      const muezzinObj = tracks.find(m => m.id === activeMuezzinId) || defaultMuezzins[0];
      
      try {
        const resolvedUrl = await getAudioUrl(muezzinObj.url);
        const audio = new Audio(resolvedUrl);
        globalAudioRef.current = audio;
        audio.volume = audioVolume;

        audio.addEventListener('play', () => {
          setIsAthanPlaying(true);
        });

        audio.addEventListener('pause', () => {
          setIsAthanPlaying(false);
          setCurrentPhraseIdx(-1);
        });

        audio.addEventListener('ended', () => {
          setIsAthanPlaying(false);
          setCurrentPhraseIdx(-1);
        });

        audio.play().catch(e => console.error(e));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const stopAthanGlobal = () => {
    if (globalAudioRef.current) {
      globalAudioRef.current.pause();
    }
    setIsAthanPlaying(false);
    setCurrentPhraseIdx(-1);
  };

  // Background Web Worker and 1-second Interval Init
  useEffect(() => {
    let worker: Worker | null = null;
    try {
      const workerCode = `
        let intervalId = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(() => {
              self.postMessage('tick');
            }, 1000);
          } else if (e.data === 'stop') {
            if (intervalId) clearInterval(intervalId);
            intervalId = null;
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      worker = new Worker(URL.createObjectURL(blob));
      
      worker.onmessage = () => {
        window.dispatchEvent(new CustomEvent('background-tick'));
      };
      
      worker.postMessage('start');
    } catch (err) {
      console.warn("Background web worker failed to initialize:", err);
    }
    
    const handleTick = () => {
      const d = new Date();
      setNow(d);
      checkTimesAndAlarms(d, false);
    };

    window.addEventListener('background-tick', handleTick);

    const mainInterval = setInterval(handleTick, 1000);

    return () => {
      if (worker) {
        worker.postMessage('stop');
        worker.terminate();
      }
      window.removeEventListener('background-tick', handleTick);
      clearInterval(mainInterval);
    };
  }, [checkTimesAndAlarms]);

  // Page visibility & wake up Catch-up check
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const d = new Date();
        setNow(d);
        checkTimesAndAlarms(d, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkTimesAndAlarms]);

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
          <img src={companionIcon} alt="Muslim Companion Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                {/* Concentric Expanding Spiritual Ripples */}
                {headerRippleActive && (
                  <>
                    <motion.span
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute inset-0 rounded-xl border-2 border-indigo-500/60 pointer-events-none z-0"
                    />
                    <motion.span
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 3.2, opacity: 0 }}
                      transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
                      className="absolute inset-0 rounded-xl border-2 border-emerald-400/50 pointer-events-none z-0"
                    />
                    <motion.span
                      initial={{ scale: 1, opacity: 0.4 }}
                      animate={{ scale: 4.2, opacity: 0 }}
                      transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                      className="absolute inset-0 rounded-xl border border-teal-300/30 pointer-events-none z-0"
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
                        ease: [0.19, 1, 0.22, 1] // Premium ultra-smooth deceleration
                      }}
                      className="absolute text-sm pointer-events-none z-20 select-none drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
                    >
                      {p.emoji}
                    </motion.span>
                  ))}
                </AnimatePresence>
                
                <motion.button
                  whileHover={{ scale: 1.15, rotate: [0, -6, 6, -6, 0] }}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => {
                    setHeaderRippleActive(true);
                    triggerHeaderParticles();
                    setTimeout(() => setHeaderRippleActive(false), 1400);
                    playSpiritualChime(523.25);
                    setTimeout(() => {
                      setShowSpiritualModal(true);
                    }, 250);
                  }}
                  className="relative w-8 h-8 rounded-xl overflow-hidden border border-indigo-500/35 dark:border-indigo-400/40 flex items-center justify-center shrink-0 cursor-pointer shadow-[0_2px_10px_rgba(99,102,241,0.15)] focus:outline-hidden z-10"
                  title="اضغط لتفتح بوابة النفحات والسكينة الإيمانية 🌸"
                >
                  <img 
                    src={companionIcon} 
                    alt="رفيق المسلم" 
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute inset-0 bg-indigo-500/10 mix-blend-color-burn" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white dark:border-slate-900 rounded-full animate-ping" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white dark:border-slate-900 rounded-full shadow-[0_0_8px_#10b981]" />
                </motion.button>
              </div>
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
                      { id: 'alarms', label: 'منبهات العبادات والصلوات ⏰', icon: Bell },
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

                {/* Share App Action inside Sidebar */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/40 dark:from-indigo-950/10 dark:to-indigo-950/20 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-950/20 shadow-xs space-y-2 text-right">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-indigo-500 animate-pulse" />
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">نشر الخير ومشاركة التطبيق</span>
                  </div>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                    الدال على الخير كفاعله. شارك رفيق المسلم مع أصدقائك وعائلتك ليكتب الله لك الأجر! 🤍
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
                <span className="text-4xl block animate-bounce">⚡</span>
                <h3 className="text-sm font-black text-slate-800 dark:text-white">تثبيت تطبيق رفيق المسلم</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">استمتع بتجربة تطبيق كامل ومنفصل بمميزات رائعة وبأسرع وقت</p>
              </div>

              {/* Main Direct Install Action */}
              <div className="space-y-3 mb-4">
                <button
                  onClick={handleDirectInstallInsideModal}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-black text-xs rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>تثبيت التطبيق تلقائياً الآن 📥</span>
                </button>

                <button
                  onClick={() => setShowManualSteps(!showManualSteps)}
                  className="w-full py-2 px-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-extrabold text-[10px] bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-all cursor-pointer text-center"
                >
                  {showManualSteps ? "إخفاء خطوات التثبيت اليدوي ✕" : "مشاهدة خطوات التثبيت اليدوي البديلة 📋"}
                </button>
              </div>

              {/* Collapsible Manual Steps */}
              {showManualSteps && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 overflow-hidden"
                >
                  {/* Option 1: iOS Safari */}
                  <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                    <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1">
                      <span>🍎 أجهزة آيفون وآيباد (iOS Safari):</span>
                    </h4>
                    <ul className="text-[10px] text-slate-600 dark:text-slate-300 font-extrabold space-y-1 pr-4 list-decimal">
                      <li>اضغط على زر المشاركة 📤 في أسفل أو أعلى المتصفح.</li>
                      <li>اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen) ➕.</li>
                      <li>اضغط على "إضافة" (Add) في الزاوية لتثبيته.</li>
                    </ul>
                  </div>

                  {/* Option 2: Android / Chrome */}
                  <div className="pb-1">
                    <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                      <span>🤖 أجهزة أندرويد والكمبيوتر:</span>
                    </h4>
                    <ul className="text-[10px] text-slate-600 dark:text-slate-300 font-extrabold space-y-1 pr-4 list-decimal">
                      <li>انقر على قائمة المتصفح (الثلاث نقاط ⋮) في الزاوية.</li>
                      <li>اختر "تثبيت التطبيق" (Install App).</li>
                      <li>قم بتأكيد التثبيت ليظهر على الشاشة الرئيسية!</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-2">
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

      {/* بوابة السكينة والنفحات الإيمانية */}
      <AnimatePresence>
        {showSpiritualModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#0e131b] border-2 border-emerald-500/25 rounded-[2.5rem] p-6 max-w-sm w-full shadow-[0_0_50px_rgba(16,185,129,0.15)] relative text-right flex flex-col items-center gap-5 text-white overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 inset-x-0 h-40 bg-radial-[at_top] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />

              {/* Header inside Modal */}
              <div className="w-full flex items-center justify-between z-10">
                <button
                  onClick={() => {
                    setShowSpiritualModal(false);
                    setIsAmbientSoundOn(false);
                    toggleAmbientHealingFrequency(false);
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 flex items-center justify-center text-slate-300 transition-all cursor-pointer active:scale-95 text-sm font-black"
                >
                  ✕
                </button>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-black text-emerald-300 tracking-wide">بوابة السكينة والنفحات 🌸</span>
                </div>
              </div>

              {/* Glowing Interactive Brand Avatar */}
              <div className="relative mt-2 z-10 flex flex-col items-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  className="absolute inset-0 bg-emerald-500/10 rounded-full blur-md"
                />
                
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-400/40 p-1 bg-emerald-950/20 shadow-lg relative">
                  <img 
                    src={companionIcon} 
                    alt="رفيق المسلم" 
                    className="w-full h-full object-cover rounded-full select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <h3 className="text-sm font-black text-white mt-3 text-center">سكينة الروح والوجدان</h3>
                <p className="text-[10px] text-slate-400 font-extrabold text-center mt-1">«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ»</p>
              </div>

              {/* 1. Interactive Tasbih Rosary Bead */}
              <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 flex flex-col items-center gap-3.5 z-10">
                <span className="text-[10px] font-black text-emerald-400">مسبحة السكينة التفاعلية 📿</span>
                
                {/* Circular Bead Button */}
                <div className="relative flex items-center justify-center w-28 h-28">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0, 0.15] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                    className="absolute inset-0 rounded-full bg-emerald-500 border border-emerald-500/30"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute inset-2 rounded-full bg-indigo-500/10 border border-indigo-500/20"
                  />
                  
                  <motion.button
                    whileTap={{ scale: 0.90 }}
                    onClick={() => {
                      const nextCount = sessionTasbihCount + 1;
                      setSessionTasbihCount(nextCount);
                      if (navigator.vibrate) {
                        navigator.vibrate(45);
                      }
                      const pitch = 392.00 * Math.pow(1.059463, (nextCount - 1) % 33);
                      playSpiritualChime(pitch);
                    }}
                    className="relative w-22 h-22 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 hover:from-emerald-500 hover:to-teal-300 border-3 border-emerald-300/35 flex flex-col items-center justify-center cursor-pointer shadow-[0_10px_25px_rgba(16,185,129,0.3)] select-none focus:outline-hidden group"
                  >
                    <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest group-hover:scale-105 transition-all">اضغط وسبّح</span>
                    <span className="text-xl font-black text-white mt-1 tracking-tight">
                      {(() => {
                        const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
                        return sessionTasbihCount.toString().replace(/[0-9]/g, (w) => arabicDigits[parseInt(w)]);
                      })()}
                    </span>
                  </motion.button>
                </div>

                {/* Phrase pill switcher */}
                <div className="w-full flex flex-wrap items-center justify-center gap-1.5 pt-2">
                  {["سُبْحَانَ اللَّهِ", "الْحَمْدُ لِلَّهِ", "لَا إِلَٰهَ إِلَّا اللَّهُ", "اللَّهُ أَكْبَرُ", "أَسْتَغْفِرُ اللَّهَ"].map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => {
                        setActiveDhikrPhrase(phrase);
                        setSessionTasbihCount(0);
                        playSpiritualChime(523.25);
                      }}
                      className={`px-3 py-1 rounded-full text-[9px] font-black transition-all cursor-pointer ${
                        activeDhikrPhrase === phrase 
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20' 
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
                      }`}
                    >
                      {phrase}
                    </button>
                  ))}
                </div>

                {/* Reset button */}
                {sessionTasbihCount > 0 && (
                  <button
                    onClick={() => {
                      setSessionTasbihCount(0);
                      playSpiritualChime(329.63);
                    }}
                    className="text-[9px] font-black text-slate-400 hover:text-rose-400 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>تصفير العداد</span>
                  </button>
                )}
              </div>

              {/* 2. Daily Spiritual Capsule (النفحة الإيمانية) */}
              <div className="w-full bg-emerald-500/[0.03] border border-emerald-500/15 rounded-3xl p-4 relative text-center z-10">
                <span className="text-emerald-500/20 text-4xl font-serif absolute top-1 right-3 leading-none">“</span>
                <span className="text-[10px] font-black text-emerald-400/80 block mb-2">{SPIRITUAL_CAPSULES[currentCapsuleIndex].category}</span>
                <p className="text-xs font-black text-emerald-100/90 leading-relaxed px-2 py-1 select-text">
                  {SPIRITUAL_CAPSULES[currentCapsuleIndex].text}
                </p>
                <span className="text-[9px] text-emerald-400/75 font-extrabold block mt-2">
                  — {SPIRITUAL_CAPSULES[currentCapsuleIndex].source}
                </span>
                
                <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-emerald-500/10">
                  <button 
                    onClick={() => speakSpiritualText(SPIRITUAL_CAPSULES[currentCapsuleIndex].text)}
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 active:scale-95 rounded-xl transition-all cursor-pointer"
                    title="استمع للنفحة بصوت عذب 🔊"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${SPIRITUAL_CAPSULES[currentCapsuleIndex].text} - ${SPIRITUAL_CAPSULES[currentCapsuleIndex].source}`);
                      setToastMessage("تم نسخ النفحة الإيمانية بنجاح 📋");
                    }}
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 active:scale-95 rounded-xl transition-all cursor-pointer"
                    title="نسخ النفحة الإيمانية 📋"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => {
                      const nextIndex = (currentCapsuleIndex + 1) % SPIRITUAL_CAPSULES.length;
                      setCurrentCapsuleIndex(nextIndex);
                      playSpiritualChime(587.33);
                    }}
                    className="p-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 active:scale-95 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[9px] font-black px-3"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>نفحة أخرى ✨</span>
                  </button>
                </div>
              </div>

              {/* 3. Ambient Healing Frequency Toggle */}
              <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-4 flex items-center justify-between z-10">
                <div className="flex flex-col items-start text-right">
                  <span className="text-[11px] font-black text-indigo-300">تردد السكينة الكوني (432Hz) 🧘‍♂️</span>
                  <span className="text-[9px] text-slate-400 font-extrabold leading-normal mt-0.5">موجات إيمانية عميقة لطرد القلق ومساعدة الروح على التركيز</span>
                </div>
                <button
                  onClick={() => {
                    const nextState = !isAmbientSoundOn;
                    setIsAmbientSoundOn(nextState);
                    toggleAmbientHealingFrequency(nextState);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 ${
                    isAmbientSoundOn 
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/30' 
                      : 'bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700'
                  }`}
                >
                  <span>{isAmbientSoundOn ? "شغال 🟢" : "تشغيل ⏸️"}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setShowSpiritualModal(false);
                  setIsAmbientSoundOn(false);
                  toggleAmbientHealingFrequency(false);
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer text-center z-10"
              >
                العودة للتطبيق ومواصلة الذكر 🤲
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Immersive Athan Overlay Screen */}
      <AthanOverlay 
        isOpen={showAthanOverlay} 
        onClose={() => {
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
      />

      {/* Global Custom Alarm Ringing Modal */}
      {activeRingingAlarm && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-[#161d26] border border-indigo-500/30 w-full max-w-sm rounded-3xl p-6 text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -translate-x-5 -translate-y-5" />
            
            <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 animate-bounce">
              <Bell className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-800 dark:text-white">تنبيه مخصص: {activeRingingAlarm.title}</h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-black font-mono">الوقت الحالي: {toArabicNumbers(activeRingingAlarm.time)}</p>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed">
              تذكير مبارك من رفيق المسلم للقيام بالعبادة المخصصة والتقرب إلى الله سبحانه وتعالى.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
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
                  setCustomAlarms(prev => [...prev, snoozedAlarm]);
                  setActiveRingingAlarm(null);
                  setToastMessage("تم تأجيل المنبه لمدة ٥ دقائق ⏰");
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black cursor-pointer transition-all active:scale-95"
              >
                تأجيل ٥ دقائق
              </button>
              <button
                onClick={() => {
                  if (globalAudioRef.current) {
                    globalAudioRef.current.pause();
                  }
                  setActiveRingingAlarm(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
              >
                إيقاف الرنين
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
