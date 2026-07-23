/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ChevronLeft, 
  Compass, 
  Moon, 
  Sun, 
  HelpCircle,
  Calendar,
  Sparkles,
  Award,
  Heart,
  MapPin,
  Clock,
  Monitor,
  BookOpen,
  Volume2,
  Play,
  Pause,
  VolumeX
} from 'lucide-react';
import { 
  AppSettings, 
  PrayerLog, 
  PrayerName, 
  PrayerStatus, 
  ActiveNudge, 
  PendingQadaPrayer, 
  CustomDua,
  QuranSession,
  QuranKhatma,
  RamadanQadaTracker
} from '../types';
import { 
  calculatePrayerTimes, 
  getCurrentAndNextPrayer, 
  getArabicPrayerName,
  parseTimeToMinutes
} from '../utils/prayerCalc';
import { 
  getHijriDate, 
  formatGregorianFullDateArabic, 
  toArabicNumbers 
} from '../utils/hijri';
import { generateActiveNudge } from '../utils/nudgeRules';
import CompanionInsights from './CompanionInsights';
import FridayMode from './FridayMode';
import AthanOverlay from './AthanOverlay';
import MosqueBackdrop, { BackdropType } from './MosqueBackdrop';
import { defaultMuezzins, getCustomAudios, getAudioUrl, getAudioUrlSync, archiveMuezzins } from '../utils/audioStorage';

// Import transparent elegant mosque backdrop options
import goldBackdrop from '../assets/images/mosque_backdrop_gold_1784097866777.jpg';
import classicBackdrop from '../assets/images/mosque_backdrop_1784095267677.jpg';
import bannerBackdrop from '../assets/images/mosque_banner_1784014914575.jpg';

const formatDateToTimesStr = (date: Date): string => {
  const finalHour = date.getHours();
  const finalMin = date.getMinutes();
  
  const ampm = finalHour >= 12 ? 'م' : 'ص';
  const displayHour = finalHour % 12 === 0 ? 12 : finalHour % 12;
  const padMin = finalMin.toString().padStart(2, '0');
  
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const displayHourStr = displayHour.toString().split('').map(d => arabicDigits[parseInt(d)] ?? d).join('');
  const padMinStr = padMin.split('').map(d => arabicDigits[parseInt(d)] ?? d).join('');
  
  return `${displayHourStr}:${padMinStr} ${ampm}`;
};

// Import transparent elegant mosque backdrop options
export const BACKDROP_IMAGES = {
  gold: goldBackdrop,
  classic: classicBackdrop,
  banner: bannerBackdrop,
  ramadan: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?q=80&w=1200&auto=format&fit=crop',
  eid_fitr: 'https://images.unsplash.com/photo-1581078426770-6d336e5de7bf?q=80&w=1200&auto=format&fit=crop',
  eid_adha: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1200&auto=format&fit=crop',
  friday: 'https://images.unsplash.com/photo-1590075865003-e48277faa558?q=80&w=1200&auto=format&fit=crop'
};

interface DashboardProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
  fastingLogs: Record<string, { date: string; fasted: boolean; fastType: string }>;
  setFastingLogs: React.Dispatch<React.SetStateAction<Record<string, { date: string; fasted: boolean; fastType: string }>>>;
  ramadanQada?: RamadanQadaTracker;
  setRamadanQada?: React.Dispatch<React.SetStateAction<RamadanQadaTracker>>;
  setActiveTab?: React.Dispatch<React.SetStateAction<'home' | 'salah' | 'quran' | 'adhkar' | 'qibla' | 'fasting' | 'settings' | 'calendar'>>;
  customDuas: CustomDua[];
  setCustomDuas: React.Dispatch<React.SetStateAction<CustomDua[]>>;
  quranSessions?: QuranSession[];
  khatmat?: QuranKhatma[];
  dhikrLogs?: Record<string, Record<string, number>>;
  onInstallApp?: () => void;
  isPwaInstalled?: boolean;
}

export default function Dashboard({
  settings,
  setSettings,
  prayerLogs,
  setPrayerLogs,
  pendingQadaPrayers,
  setPendingQadaPrayers,
  fastingLogs,
  setFastingLogs,
  ramadanQada,
  setRamadanQada,
  setActiveTab,
  customDuas,
  setCustomDuas,
  quranSessions = [],
  khatmat = [],
  dhikrLogs = {},
  onInstallApp,
  isPwaInstalled = false
}: DashboardProps) {
  const [selectedPrayerToLog, setSelectedPrayerToLog] = useState<PrayerName | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [homeDuaIdx, setHomeDuaIdx] = useState(0);
  const showAnalogClock = (settings.clockStyle || 'digital') === 'analog';
  const setShowAnalogClock = (val: boolean | ((p: boolean) => boolean)) => {
    setSettings(prev => {
      const nextVal = typeof val === 'function' ? val(prev.clockStyle === 'analog') : val;
      return { ...prev, clockStyle: nextVal ? 'analog' : 'digital' };
    });
  };
  const [futurePrayerWarning, setFuturePrayerWarning] = useState<PrayerName | null>(null);
  const [clockFace, setClockFaceState] = useState<'classic' | 'islamic' | 'minimal' | 'cyber' | 'salatuk'>(() => {
    const saved = localStorage.getItem('salah_clock_face');
    if (saved === 'classic' || saved === 'islamic' || saved === 'minimal' || saved === 'cyber' || saved === 'salatuk') {
      return saved;
    }
    return 'classic';
  });

  const setClockFace = (val: 'classic' | 'islamic' | 'minimal' | 'cyber' | 'salatuk') => {
    setClockFaceState(val);
    localStorage.setItem('salah_clock_face', val);
  };

  const [showAthanOverlay, setShowAthanOverlay] = useState<boolean>(false);
  const [athanOverlayPrayer, setAthanOverlayPrayer] = useState<PrayerName>('Asr');
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);

  // Athan Audio Player States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentMuezzin, setCurrentMuezzin] = useState<string>(() => {
    return localStorage.getItem('salah_general_muezzin') || 'makkah';
  });
  const [fajrMuezzin, setFajrMuezzin] = useState<string>(() => {
    return localStorage.getItem('salah_fajr_muezzin') || 'fajr_yusuf';
  });
  const [audioVolume, setAudioVolume] = useState<number>(() => {
    const saved = localStorage.getItem('salah_audio_volume');
    return saved ? parseFloat(saved) : 0.8;
  });
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState<number>(-1);
  const [autoPlayOnTime, setAutoPlayOnTime] = useState<boolean>(() => {
    return localStorage.getItem('salah_auto_play_athan') !== 'false';
  });
  const [showSunriseModal, setShowSunriseModal] = useState<boolean>(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const lastTriggeredMin = React.useRef<string>('');

  const [customMuezzins, setCustomMuezzins] = useState<any[]>([]);

  React.useEffect(() => {
    getCustomAudios().then(tracks => {
      setCustomMuezzins(tracks);
    }).catch(err => {
      console.error('Failed to load custom muezzins in Dashboard:', err);
    });
  }, []);

  const muezzins = [...defaultMuezzins, ...archiveMuezzins, ...customMuezzins];

  const athanPhrases = [
    { text: 'الله أكبر، الله أكبر', duration: 12 },
    { text: 'الله أكبر، الله أكبر', duration: 12 },
    { text: 'أشهد أن لا إله إلا الله', duration: 12 },
    { text: 'أشهد أن لا إله إلا الله', duration: 12 },
    { text: 'أشهد أن محمداً رسول الله', duration: 12 },
    { text: 'أشهد أن محمداً رسول الله', duration: 12 },
    { text: 'حي على الصلاة', duration: 10 },
    { text: 'حي على الصلاة', duration: 10 },
    { text: 'حي على الفلاح', duration: 10 },
    { text: 'حي على الفلاح', duration: 10 },
    // If it is Fajr:
    { text: 'الصلاة خير من النوم', duration: 15, isFajrOnly: true },
    { text: 'الصلاة خير من النوم', duration: 15, isFajrOnly: true },
    // End
    { text: 'الله أكبر، الله أكبر', duration: 10 },
    { text: 'لا إله إلا الله', duration: 10 },
  ];

  const togglePlayAthan = (muezzinId?: string) => {
    const activePrayer = next || 'Dhuhr';
    window.dispatchEvent(new CustomEvent('trigger-athan-simulation', {
      detail: { prayerName: activePrayer, muezzinId }
    }));
  };

  const stopAthan = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentPhraseIdx(-1);
  };

  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Timer to keep clock updated
  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000); // update every 1s
    return () => clearInterval(timer);
  }, []);

  const todayStr = now.toISOString().split('T')[0];
  const hijri = getHijriDate(now, settings.hijriOffset);
  const gregorianStr = formatGregorianFullDateArabic(now);
  const gregorianClean = gregorianStr.includes('،') ? gregorianStr.split('،')[1].trim() : gregorianStr;

  const times = calculatePrayerTimes(
    now,
    settings.latitude,
    settings.longitude,
    -now.getTimezoneOffset() / 60,
    settings.calcMethod,
    settings.madhab,
    settings.prayerOffsets || {}
  );

  const { current, next, timeRemainingStr, progressPercent } = getCurrentAndNextPrayer(times, now);

  // Check if current time is between Thursday Maghrib and Friday Maghrib
  const isFridayWindow = (() => {
    const day = now.getDay();
    if (day !== 4 && day !== 5) return false;
    if (!times || !times.Maghrib) return false;

    const [maghribH, maghribM] = times.Maghrib.split(':').map(Number);
    const maghribDate = new Date(now);
    maghribDate.setHours(maghribH, maghribM, 0, 0);

    if (day === 4) {
      // Thursday: from Maghrib onwards
      return now >= maghribDate;
    } else {
      // Friday: until Maghrib
      return now < maghribDate;
    }
  })();

  // Bypassed local auto-play checker to prevent duplicate audio triggers.
  // Consolidated under the unified Global Root Prayer & Alarm Service inside App.tsx.
  /*
  React.useEffect(() => {
    if (!autoPlayOnTime) return;

    const currentStr = formatDateToTimesStr(now);
    
    const matchingPrayer = Object.entries(times).find(([key, val]) => {
      if (key === 'Sunrise') return false;
      return val === currentStr;
    });

    if (matchingPrayer && lastTriggeredMin.current !== currentStr) {
      lastTriggeredMin.current = currentStr;
      
      const pName = matchingPrayer[0] as PrayerName;
      // Check if this prayer has adhan enabled in settings
      const isAdhanEnabled = settings.adhanEnabled[pName] !== false;
      if (!isAdhanEnabled) return;

      const isFajr = pName === 'Fajr';
      const targetMuezzinId = isFajr ? fajrMuezzin : currentMuezzin;
      
      togglePlayAthan(targetMuezzinId);
      setAthanOverlayPrayer(pName);
      setShowAthanOverlay(true);

      // Trigger standard browser notification if allowed
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`حان الآن موعد صلاة ${getArabicPrayerName(pName)}`, {
            body: `حسب توقيت مدينة ${settings.cityName || 'الإسكندرية'}. تقبل الله صلاتكم.`,
            icon: '/favicon.ico',
            dir: 'rtl'
          });
        } catch (e) {
          console.error('Notification failed', e);
        }
      }
    }
  }, [now, autoPlayOnTime, times, settings.cityName, settings.adhanEnabled, fajrMuezzin, currentMuezzin]);
  */



  // Handle global header notifications modal trigger
  React.useEffect(() => {
    const handleNotificationsTrigger = () => {
      setShowNotificationsModal(true);
    };
    window.addEventListener('open-spiritual-notifications', handleNotificationsTrigger);
    return () => {
      window.removeEventListener('open-spiritual-notifications', handleNotificationsTrigger);
    };
  }, []);

  // Handle global header GPS sync trigger
  React.useEffect(() => {
    const handleGPSTrigger = () => {
      handleGPSLocationSync();
    };
    window.addEventListener('trigger-gps-sync', handleGPSTrigger);
    return () => {
      window.removeEventListener('trigger-gps-sync', handleGPSTrigger);
    };
  }, []);

  // Dispatch spiritual notifications count to header
  React.useEffect(() => {
    const count = getSpiritualNotifications().length;
    const event = new CustomEvent('update-spiritual-notifications-count', { detail: count });
    window.dispatchEvent(event);
  }, [pendingQadaPrayers, ramadanQada?.daysOwed, ramadanQada?.daysCompleted, now.getDay(), now.getHours()]);

  interface SpiritualNotification {
    id: string;
    type: 'qada' | 'fasting_make_up' | 'sunnah_fast' | 'spiritual_advice' | 'friday';
    title: string;
    description: string;
    icon: string;
    actionLabel?: string;
    action?: () => void;
  }

  const getSpiritualNotifications = (): SpiritualNotification[] => {
    const list: SpiritualNotification[] = [];

    // 1. Pending Qada Prayers
    if (pendingQadaPrayers.length > 0) {
      const breakdown: Record<string, number> = {};
      pendingQadaPrayers.forEach(p => {
        breakdown[p.prayerName] = (breakdown[p.prayerName] || 0) + 1;
      });
      const namesArabic: Record<string, string> = {
        Fajr: 'الفجر',
        Dhuhr: 'الظهر',
        Asr: 'العصر',
        Maghrib: 'المغرب',
        Isha: 'العشاء'
      };
      const breakdownStr = Object.entries(breakdown)
        .map(([name, count]) => `${namesArabic[name]} (${toArabicNumbers(count)})`)
        .join('، ');

      list.push({
        id: 'qada-prayers',
        type: 'qada',
        title: 'الصلوات الفوائت المتبقية (القضاء)',
        description: `لديك صلوات فائتة مسجلة في ذمتك متبقي قضاؤها: ${breakdownStr}.`,
        icon: '⏱️',
        actionLabel: 'قضاء صلاة الآن',
        action: () => {
          const firstPending = pendingQadaPrayers[0];
          if (firstPending) {
            setPendingQadaPrayers(prev => prev.filter(p => p.id !== firstPending.id));
          }
        }
      });
    }

    // 2. Ramadan Fasting Make up
    const owed = ramadanQada?.daysOwed || 0;
    const completed = ramadanQada?.daysCompleted || 0;
    const remainingFasts = Math.max(0, owed - completed);
    if (remainingFasts > 0) {
      list.push({
        id: 'ramadan-qada',
        type: 'fasting_make_up',
        title: 'قضاء أيام صيام رمضان',
        description: `متبقي عليك قضاء ${toArabicNumbers(remainingFasts)} أيام من رمضان المبارك. تذكر صيامها قضاءً وابتغِ الأجر من الله.`,
        icon: '🌙',
        actionLabel: 'تسجيل صيام يوم قضاء',
        action: () => {
          if (setRamadanQada) {
            setRamadanQada(prev => ({
              ...prev,
              daysCompleted: Math.min(prev.daysOwed, prev.daysCompleted + 1)
            }));
            
            const dStr = new Date().toISOString().split('T')[0];
            setFastingLogs(prev => ({
              ...prev,
              [dStr]: {
                date: dStr,
                hijriDate: hijri.fullString,
                fastType: 'Qada',
                fasted: true,
                isQada: true
              }
            }));
          }
        }
      });
    }

    // 3. Upcoming Sunnah Fast
    const dayOfWeek = now.getDay();
    const hDay = hijri.day;

    if (hDay === 12 || hDay === 13 || hDay === 14) {
      const tomorrowDay = hDay + 1;
      list.push({
        id: 'white-days-fast',
        type: 'sunnah_fast',
        title: 'تذكير صيام الأيام البيض',
        description: `غداً هو يوم (${toArabicNumbers(tomorrowDay)}) من الأيام البيض لشهر ${hijri.monthName}. هنيئاً لمن نوى وصام!`,
        icon: '✨',
        actionLabel: 'سجل صيام الغد تبرعاً',
        action: () => {
          const dStr = new Date().toISOString().split('T')[0];
          setFastingLogs(prev => ({
            ...prev,
            [dStr]: {
              date: dStr,
              hijriDate: hijri.fullString,
              fastType: 'Sunnah',
              fasted: true,
              isQada: false
            }
          }));
        }
      });
    } else if (dayOfWeek === 0) {
      list.push({
        id: 'monday-fast-rem',
        type: 'sunnah_fast',
        title: 'صيام سنة الإثنين غداً',
        description: 'تذكير بصيام غد الإثنين؛ تُعرض فيه الأعمال على رب العالمين، فكن من الصائمين لتنال عظيم الأجر.',
        icon: '📅'
      });
    } else if (dayOfWeek === 3) {
      list.push({
        id: 'thursday-fast-rem',
        type: 'sunnah_fast',
        title: 'صيام سنة الخميس غداً',
        description: 'تذكير بصيام غد الخميس؛ صيام تطوع تبتغي به القرب والزلفى من الرحمن سبحانه وتعالى.',
        icon: '📅'
      });
    }

    // 4. Spiritual advice based on hour
    const hrs = now.getHours();
    if (hrs >= 22 || hrs < 3) {
      list.push({
        id: 'night-prayer-advice',
        type: 'spiritual_advice',
        title: 'قيام الليل والوتر',
        description: 'ينزل ربنا تبارك وتعالى كل ليلة إلى السماء الدنيا فيقول: هل من سائل فأعطيه؟ صَلِّ ركعة الوتر وتوسل بالدعاء.',
        icon: '🌌'
      });
    } else if (hrs >= 7 && hrs < 11) {
      list.push({
        id: 'duha-prayer-advice',
        type: 'spiritual_advice',
        title: 'صلاة الضحى والصدقة',
        description: 'صلاة الضحى تجزئ عن صدقة ٣٦٠ مفصلاً من مفاصل جسدك. ركعتان يكتبانك من الأوابين الذاكرين.',
        icon: '☀️'
      });
    }

    // 5. Friday recommendations
    if (dayOfWeek === 4 && hrs >= 18) {
      list.push({
        id: 'friday-night-advice',
        type: 'friday',
        title: 'ليلة الجمعة الغراء',
        description: 'بدأت ليلة الجمعة؛ أكثروا من الصلاة والسلام على الحبيب المصطفى ﷺ، واستنيروا بنورها وضياؤها.',
        icon: '🕌'
      });
    } else if (dayOfWeek === 5) {
      list.push({
        id: 'friday-day-advice',
        type: 'friday',
        title: 'سنن الجمعة المباركة',
        description: 'اليوم جمعة عظيمة؛ لا تنسَ الاغتسال والتطيب والتبكير للمسجد وقراءة سورة الكهف الشريفة والدعاء ساعة الإجابة قبل المغرب.',
        icon: '🕌'
      });
    }

    // General beautiful tips
    list.push({
      id: 'general-adhkar-rem',
      type: 'spiritual_advice',
      title: 'أذكار الصباح والمساء',
      description: 'قال رسول الله ﷺ: "مثل الذي يذكر ربه والذي لا يذكر ربه، مثل الحي والميت". يمكنك الآن الاستماع للأذكار بصوت الشيخ مشاري العفاسي مباشرة.',
      icon: '🎧',
      actionLabel: 'استمع للأذكار بصوت مشاري العفاسي 🎧',
      action: () => {
        if (setActiveTab) setActiveTab('adhkar');
      }
    });

    list.push({
      id: 'general-quran-rem',
      type: 'spiritual_advice',
      title: 'وردك اليومي من القرآن',
      description: 'القرآن ربيع القلوب وجلاء الهموم والغموم، تلاوة صفحة واحدة يومياً بانتظام تنير بصيرتك وحياتك كلها ببركته.',
      icon: '📖',
      actionLabel: 'تصفح القرآن 📖',
      action: () => {
        if (setActiveTab) setActiveTab('quran');
      }
    });

    return list;
  };

  // Status logs for today
  const todayLogs = prayerLogs[todayStr] || {};

  // Count completed prayers (status A or B, or E for excused)
  const fiveDailyPrayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const completedCount = fiveDailyPrayers.filter(p => 
    todayLogs[p]?.status === 'A' || todayLogs[p]?.status === 'B' || todayLogs[p]?.status === 'E'
  ).length;

  const isDarkTheme = settings.theme === 'dark' || 
    ((!settings.theme || settings.theme === 'system') && 
     (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  // The currentGradient variable is now computed dynamically down below in getTimeOfDayGradientAndLabel based on actual time-of-day slots.

  // Generate local active nudge
  const mockRecentData = {
    prayerLogs,
    pendingQadaPrayers,
    fastingLogs: Object.fromEntries(
      Object.entries(fastingLogs).map(([k, v]) => [k, { ...v, hijriDate: '', isQada: false }])
    ),
    quranSessions: [],
    dhikrLogs: {}
  };
  const activeNudge = generateActiveNudge(mockRecentData as any);

  const handleExecuteNudgeAction = () => {
    if (activeNudge.actionKey?.startsWith('enable_alarm_')) {
      const pName = activeNudge.actionKey.replace('enable_alarm_', '') as PrayerName;
      setSettings(prev => ({
        ...prev,
        adhanEnabled: {
          ...prev.adhanEnabled,
          [pName]: true
        }
      }));
      alert(`تم تفعيل تنبيهات صلاة ${getArabicPrayerName(pName)} بنجاح!`);
    } else {
      alert('بارك الله في سعيكم ومداومتكم على الخير 🤍');
    }
  };

  // Status mapping
  const getStatusColorClass = (status: PrayerStatus | undefined) => {
    if (!status || status === 'future' || status === 'not_yet') return 'bg-gray-300';
    if (status === 'A') return 'bg-emerald-500'; // in time
    if (status === 'B') return 'bg-amber-500'; // late
    if (status === 'C' || status === 'D') return 'bg-rose-500'; // missed
    return 'bg-gray-300';
  };

  const getStatusLabelArabic = (status: PrayerStatus | undefined) => {
    if (!status || status === 'future' || status === 'not_yet') return 'لم يحن بعد';
    if (status === 'A') return 'حاضر';
    if (status === 'B') return 'صليتها متأخر ⏱️';
    if (status === 'C' || status === 'D') return 'قضاء ❌';
    return 'غير مسجل';
  };

  // Handle logging extra sunnah/nafilah prayers (Duha, Qiyam, Witr)
  const handleUpdateNafilah = (prayerKey: 'Duha' | 'Qiyam' | 'Witr', rakahs: number) => {
    const existingLog = todayLogs[prayerKey] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0, extraRakahs: 0 };
    const newRakahs = Math.max(0, rakahs);
    const newStatus = newRakahs > 0 ? 'A' : 'not_yet';

    setPrayerLogs(prev => ({
      ...prev,
      [todayStr]: {
        ...todayLogs,
        [prayerKey]: {
          ...existingLog,
          status: newStatus,
          extraRakahs: newRakahs
        }
      }
    }));
  };

  // Handle logging a prayer
  const handleLogPrayer = (status: PrayerStatus) => {
    if (!selectedPrayerToLog) return;
    
    const existingLog = todayLogs[selectedPrayerToLog] || { sunnahBefore: 0, sunnahAfter: 0 };
    
    const updatedLogs = {
      ...prayerLogs,
      [todayStr]: {
        ...todayLogs,
        [selectedPrayerToLog]: {
          ...existingLog,
          status,
        }
      }
    };
    
    setPrayerLogs(updatedLogs);

    // If status is missed ('D'), we add it to the pending Qada list
    if (status === 'D') {
      const alreadyPending = pendingQadaPrayers.some(
        q => q.date === todayStr && q.prayerName === selectedPrayerToLog
      );
      if (!alreadyPending) {
        const newQada: PendingQadaPrayer = {
          id: crypto.randomUUID(),
          date: todayStr,
          hijriDate: hijri.fullString,
          prayerName: selectedPrayerToLog
        };
        setPendingQadaPrayers(prev => [...prev, newQada]);
      }
    } else {
      // If status was 'D' previously but now resolved to 'A' or 'B', remove from pending Qada
      setPendingQadaPrayers(prev => prev.filter(
        q => !(q.date === todayStr && q.prayerName === selectedPrayerToLog)
      ));
    }
    
    setSelectedPrayerToLog(null);
  };

  // Sunnah counter
  const handleUpdateSunnah = (prayer: PrayerName, type: 'before' | 'after', amount: number) => {
    const existingLog = todayLogs[prayer] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0 };
    const key = type === 'before' ? 'sunnahBefore' : 'sunnahAfter';
    const currentVal = existingLog[key] ?? 0;
    const newVal = Math.max(0, currentVal + amount);

    setPrayerLogs(prev => ({
      ...prev,
      [todayStr]: {
        ...todayLogs,
        [prayer]: {
          ...existingLog,
          [key]: newVal
        }
      }
    }));
  };

  // Fasting quick tracker
  const todayFast = fastingLogs[todayStr] || { date: todayStr, fasted: false, fastType: 'Sunnah' };
  const toggleFasting = () => {
    // Check if today is a forbidden fasting day
    const hToday = getHijriDate(now, settings.hijriOffset);
    const isEidFitr = hToday.month === 10 && hToday.day === 1;
    const isEidAdhaOrTashreeq = hToday.month === 12 && (hToday.day === 10 || hToday.day === 11 || hToday.day === 12 || hToday.day === 13);
    
    if ((isEidFitr || isEidAdhaOrTashreeq) && !todayFast.fasted) {
      let reasonStr = '';
      if (isEidFitr) {
        reasonStr = 'أول أيام عيد الفطر المبارك (١ شوال)';
      } else if (hToday.day === 10) {
        reasonStr = 'أول أيام عيد الأضحى المبارك (١٠ ذو الحجة)';
      } else {
        const dayArabic = hToday.day === 11 ? 'الحادي عشر' : hToday.day === 12 ? 'الثاني عشر' : 'الثالث عشر';
        reasonStr = `أيام التشريق المباركة (يوم ${dayArabic} ذو الحجة)`;
      }
      alert(`⚠️ تنبيه شرعي: لا يجوز صيام اليوم لأنه يصادف ${reasonStr}. الصيام في العيد وأيام التشريق محرّم شرعاً.`);
      return;
    }

    setFastingLogs(prev => ({
      ...prev,
      [todayStr]: {
        ...todayFast,
        fasted: !todayFast.fasted
      }
    }));
  };

  const handleGPSLocationSync = () => {
    if (!navigator.geolocation) {
      alert('جهازك لا يدعم تحديد الموقع التلقائي.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSettings(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          cityName: 'موقعي الحالي'
        }));
        alert('تم مزامنة الموقع وتحديث مواقيت الصلاة بنجاح طبقاً لموقع هاتفك الفعلي! 📍');
      },
      (err) => {
        console.error(err);
        alert('فشل تحديد الموقع تلقائياً. يرجى تفعيل الـ GPS وصلاحية الموقع في المتصفح.');
      }
    );
  };

  const getTimeOfDayGradientAndLabel = (): { gradient: string; label: string } => {
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const fajrMins = parseTimeToMinutes(times.Fajr);
    const sunriseMins = parseTimeToMinutes(times.Sunrise);
    const duhaMins = sunriseMins + 20;
    const dhuhrMins = parseTimeToMinutes(times.Dhuhr);
    const asrMins = parseTimeToMinutes(times.Asr);
    const maghribMins = parseTimeToMinutes(times.Maghrib);
    const ishaMins = parseTimeToMinutes(times.Isha);
    const isFriday = now.getDay() === 5;

    if (nowMins >= fajrMins && nowMins < sunriseMins) {
      return {
        gradient: 'from-[#1c2e4a] via-[#2a456c] to-[#483d8b]',
        label: 'من الفجر للشروق'
      };
    } else if (nowMins >= sunriseMins && nowMins < duhaMins) {
      return {
        gradient: 'from-[#ff7e5f] via-[#feb47b] to-[#e9c46a]',
        label: 'من الشروق للضحى'
      };
    } else if (nowMins >= duhaMins && nowMins < dhuhrMins) {
      return {
        gradient: 'from-[#2a9d8f] via-[#3a7bd5] to-[#3a6073]',
        label: isFriday ? 'من الضحى للجمعة' : 'من الضحى للظهر'
      };
    } else if (nowMins >= dhuhrMins && nowMins < asrMins) {
      return {
        gradient: 'from-[#2193b0] via-[#3a7bd5] to-[#6dd5ed]',
        label: isFriday ? 'من الجمعة للعصر' : 'من الظهر للعصر'
      };
    } else if (nowMins >= asrMins && nowMins < maghribMins) {
      return {
        gradient: 'from-[#f12711] via-[#f5af19] to-[#ff9f43]',
        label: 'من العصر للمغرب'
      };
    } else if (nowMins >= maghribMins && nowMins < ishaMins) {
      return {
        gradient: 'from-[#741543] via-[#411b5c] to-[#1f1640]',
        label: 'من المغرب للعشاء'
      };
    } else if (nowMins >= ishaMins && nowMins < 1440) {
      return {
        gradient: 'from-[#0f172a] via-[#1e1b4b] to-[#0f172a]',
        label: 'من العشاء لمنتصف الليل'
      };
    } else {
      return {
        gradient: 'from-[#050508] via-[#090d22] to-[#11111d]',
        label: 'من منتصف الليل للفجر'
      };
    }
  };

  const { gradient: currentGradient, label: timePeriodLabel } = getTimeOfDayGradientAndLabel();

  // Calculate dynamic backdrop style key above the card
  const getAutoBackdropKey = (): BackdropType => {
    const isFriday = now.getDay() === 5;
    const hijri = getHijriDate(now, settings.hijriOffset);

    // Ramadan (Month 9)
    if (hijri.month === 9) return 'ramadan';
    // Eid al-Fitr (Month 10, days 1-3)
    if (hijri.month === 10 && hijri.day <= 3) return 'eid_fitr';
    // Eid al-Adha (Month 12, days 9-13)
    if (hijri.month === 12 && hijri.day >= 9 && hijri.day <= 13) return 'eid_adha';
    // Friday
    if (isFriday) return 'friday';

    // Day/Night check based on current time
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const fajrMins = parseTimeToMinutes(times.Fajr);
    const maghribMins = parseTimeToMinutes(times.Maghrib);

    const isNight = nowMins < fajrMins || nowMins >= maghribMins;
    if (isNight) {
      return 'classic'; // Midnight/deep blue silhouette
    } else {
      return 'gold'; // Golden sunlit mosque backdrop
    }
  };

  const getIslamicEventLabel = () => {
    const isFriday = now.getDay() === 5;
    const isThursdayNight = now.getDay() === 4 && now.getHours() >= 18;
    const hijri = getHijriDate(now, settings.hijriOffset);

    if (hijri.month === 9) {
      return { text: '🌙 شهر رمضان المبارك', desc: 'شهر القرآن والرحمة والقيام والبركات' };
    }
    if (hijri.month === 10 && hijri.day <= 3) {
      return { text: '✨ عيد الفطر المبارك', desc: 'تقبل الله طاعتكم وكل عام وأنتم بخير' };
    }
    if (hijri.month === 12 && hijri.day === 9) {
      return { text: '🕋 يوم عرفة المبارك', desc: 'لبيك اللهم لبيك، يوم المغفرة والرحمة' };
    }
    if (hijri.month === 12 && hijri.day >= 10 && hijri.day <= 13) {
      return { text: '🕋 عيد الأضحى المبارك', desc: 'كل عام وأنتم بخير وعافية وسعادة' };
    }
    if (hijri.month === 1 && hijri.day === 1) {
      return { text: '✨ رأس السنة الهجرية الجديدة', desc: 'عام هجري جديد يحمل الخير والسلام' };
    }
    if (hijri.month === 3 && hijri.day === 12) {
      return { text: '🕌 المولد النبوي الشريف', desc: 'صلوات ربي وسلامه عليك يا نبي الرحمة' };
    }
    if (isFriday) {
      return { text: '🕌 يوم الجمعة المبارك', desc: 'أكثروا من الصلاة على الحبيب ﷺ وقراءة الكهف' };
    }
    if (isThursdayNight) {
      return { text: '🌙 ليلة الجمعة المباركة', desc: 'ساعة إجابة ونور يمتد بين الجمعتين' };
    }
    return null;
  };

  const getPrayerProgressPercentage = () => {
    const fajrMins = parseTimeToMinutes(times.Fajr);
    const sunriseMins = parseTimeToMinutes(times.Sunrise);
    const dhuhrMins = parseTimeToMinutes(times.Dhuhr);
    const asrMins = parseTimeToMinutes(times.Asr);
    const maghribMins = parseTimeToMinutes(times.Maghrib);
    const ishaMins = parseTimeToMinutes(times.Isha);

    const nowMins = now.getHours() * 60 + now.getMinutes();

    let prevMins = 0;
    let nextMins = 0;

    if (nowMins >= fajrMins && nowMins < sunriseMins) {
      prevMins = fajrMins;
      nextMins = sunriseMins;
    } else if (nowMins >= sunriseMins && nowMins < dhuhrMins) {
      prevMins = sunriseMins;
      nextMins = dhuhrMins;
    } else if (nowMins >= dhuhrMins && nowMins < asrMins) {
      prevMins = dhuhrMins;
      nextMins = asrMins;
    } else if (nowMins >= asrMins && nowMins < maghribMins) {
      prevMins = asrMins;
      nextMins = maghribMins;
    } else if (nowMins >= maghribMins && nowMins < ishaMins) {
      prevMins = maghribMins;
      nextMins = ishaMins;
    } else {
      if (nowMins >= ishaMins) {
        prevMins = ishaMins;
        nextMins = fajrMins + 1440;
      } else {
        prevMins = ishaMins - 1440;
        nextMins = fajrMins;
      }
    }

    const currentAdjusted = nowMins < prevMins ? nowMins + 1440 : nowMins;
    const totalDiff = nextMins - prevMins;
    const elapsed = currentAdjusted - prevMins;

    if (totalDiff <= 0) return 0;
    return Math.min(100, Math.max(0, (elapsed / totalDiff) * 100));
  };

  const currentBackdropKey: BackdropType = !settings.backdropStyle || settings.backdropStyle === 'auto'
    ? getAutoBackdropKey()
    : settings.backdropStyle;

  const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayNameArabic = arabicDays[now.getDay()];

  // Active App Style (Automatically unifies Theme & Glass style)
  const currentStyle = isDarkTheme ? 'glass-dark' : 'faith-bright';

  // 1. Salah progress (obligatory)
  const salahPercent = isNaN(completedCount)
    ? 0
    : Math.min(100, Math.round((completedCount / 5) * 100));

  // Sunnah progress calculation
  const completedSunnahRawatib = fiveDailyPrayers.reduce((sum, p) => {
    const log = (todayLogs[p] || {}) as any;
    return sum + (log.sunnahBefore || 0) + (log.sunnahAfter || 0);
  }, 0);

  const duhaRakahs = todayLogs['Duha']?.status === 'A' ? (todayLogs['Duha']?.extraRakahs || 0) : 0;
  const qiyamRakahs = todayLogs['Qiyam']?.status === 'A' ? (todayLogs['Qiyam']?.extraRakahs || 0) : 0;
  const witrRakahs = todayLogs['Witr']?.status === 'A' ? (todayLogs['Witr']?.extraRakahs || 0) : 0;

  const completedSunnah = completedSunnahRawatib + duhaRakahs + qiyamRakahs + witrRakahs;
  const sunnahPercent = Math.min(100, Math.round((completedSunnah / 12) * 100));

  // 2. Fasting progress & countdown
  const fastingPercent = todayFast.fasted ? 100 : 0;

  const getFastingProgressAndCountdown = () => {
    if (!todayFast.fasted) {
      return {
        label: 'غير صائم اليوم',
        countdownStr: 'غير مسجل',
        percent: 0
      };
    }

    const nowMins = now.getHours() * 60 + now.getMinutes();
    const fajrMins = parseTimeToMinutes(times.Fajr);
    const maghribMins = parseTimeToMinutes(times.Maghrib);
    
    if (nowMins >= fajrMins && nowMins <= maghribMins) {
      const totalFastingMins = maghribMins - fajrMins;
      const passed = nowMins - fajrMins;
      const percent = Math.min(100, Math.max(0, Math.round((passed / totalFastingMins) * 100)));
      const remainingMins = maghribMins - nowMins;
      const h = Math.floor(remainingMins / 60);
      const m = remainingMins % 60;
      return {
        label: 'متبقي للإفطار',
        countdownStr: `${toArabicNumbers(h)}س و ${toArabicNumbers(m)}د`,
        percent
      };
    } else {
      let remainingMins = 0;
      if (nowMins > maghribMins) {
        remainingMins = (1440 - nowMins) + fajrMins;
      } else {
        remainingMins = fajrMins - nowMins;
      }
      const h = Math.floor(remainingMins / 60);
      const m = remainingMins % 60;
      return {
        label: 'متبقي للإمساك',
        countdownStr: `${toArabicNumbers(h)}س و ${toArabicNumbers(m)}د`,
        percent: 100 - Math.min(100, Math.round((remainingMins / 600) * 100))
      };
    }
  };
  const fastingProgress = getFastingProgressAndCountdown();

  // 3. Quran progress
  const todaySessions = quranSessions?.filter(s => s.date === todayStr) || [];
  const pagesReadToday = todaySessions.reduce((sum, s) => {
    if (s.unitType === 'pages') return sum + (s.unitValue || 0);
    if (s.unitType === 'juz') return sum + ((s.unitValue || 0) * 20); // 1 Juz = 20 pages
    if (s.unitType === 'surah') return sum + 5; // average surah = 5 pages
    return sum;
  }, 0);
  const activeKhatma = khatmat?.find(k => k.status === 'active');
  const rawDailyGoal = activeKhatma ? Math.ceil(604 / activeKhatma.durationDays) : 4;
  const quranDailyGoal = isNaN(rawDailyGoal) || rawDailyGoal <= 0 ? 4 : rawDailyGoal;
  const quranPercent = isNaN(pagesReadToday) || isNaN(quranDailyGoal) || quranDailyGoal <= 0
    ? 0
    : Math.min(100, Math.round((pagesReadToday / quranDailyGoal) * 100));

  // Quran Divided Progress calculations
  const quranReadToday = todaySessions.filter(s => s.sessionType === 'read' || !s.sessionType).reduce((sum, s) => {
    if (s.unitType === 'pages') return sum + (s.unitValue || 0);
    if (s.unitType === 'juz') return sum + ((s.unitValue || 0) * 20);
    if (s.unitType === 'surah') return sum + 5;
    return sum;
  }, 0);
  const quranReadPercent = Math.min(100, Math.round((quranReadToday / quranDailyGoal) * 100));

  const quranMemorizeToday = todaySessions.filter(s => s.sessionType === 'memorize').reduce((sum, s) => {
    if (s.unitType === 'pages') return sum + (s.unitValue || 0);
    if (s.unitType === 'juz') return sum + ((s.unitValue || 0) * 20);
    if (s.unitType === 'surah') return sum + 5;
    return sum;
  }, 0);
  const quranMemorizePercent = Math.min(100, Math.round((quranMemorizeToday / 1) * 100)); // Default goal: 1 page

  const quranReviewToday = todaySessions.filter(s => s.sessionType === 'review').reduce((sum, s) => {
    if (s.unitType === 'pages') return sum + (s.unitValue || 0);
    if (s.unitType === 'juz') return sum + ((s.unitValue || 0) * 20);
    if (s.unitType === 'surah') return sum + 5;
    return sum;
  }, 0);
  const quranReviewPercent = Math.min(100, Math.round((quranReviewToday / 5) * 100)); // Default goal: 5 pages

  // 4. Adhkar progress
  const todayDhikrLogs = dhikrLogs?.[todayStr] || {};
  const totalDhikrsCompletedToday = Object.values(todayDhikrLogs).reduce((sum, val) => sum + (val as number), 0);
  const dhikrDailyGoal = 3;
  const dhikrPercent = isNaN(totalDhikrsCompletedToday) || isNaN(dhikrDailyGoal) || dhikrDailyGoal <= 0
    ? 0
    : Math.min(100, Math.round((totalDhikrsCompletedToday / dhikrDailyGoal) * 100));

  // Celestial sun/moon track position
  const getCelestialPositionAndType = () => {
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const fajrMins = parseTimeToMinutes(times.Fajr);
    const dhuhrMins = parseTimeToMinutes(times.Dhuhr);
    const maghribMins = parseTimeToMinutes(times.Maghrib);
    
    if (nowMins >= fajrMins && nowMins <= maghribMins) {
      const totalDayMins = maghribMins - fajrMins;
      const passedMins = nowMins - fajrMins;
      const percent = totalDayMins > 0 ? (passedMins / totalDayMins) : 0.5;
      const glow = Math.max(0, 1 - Math.abs(percent - 0.5) * 2);
      return {
        type: 'sun' as const,
        percent: percent * 100,
        glow
      };
    } else {
      let passedMins = 0;
      let totalNightMins = 0;
      if (nowMins > maghribMins) {
        passedMins = nowMins - maghribMins;
        totalNightMins = (1440 - maghribMins) + fajrMins;
      } else {
        passedMins = (1440 - maghribMins) + nowMins;
        totalNightMins = (1440 - maghribMins) + fajrMins;
      }
      const percent = totalNightMins > 0 ? (passedMins / totalNightMins) : 0.5;
      return {
        type: 'moon' as const,
        percent: percent * 100,
        glow: 0.5
      };
    }
  };
  const celestial = getCelestialPositionAndType();

  // Calculated position of the Sun/Moon relative to the 5 column R-to-L prayer list:
  const getCelestialRightPercentage = () => {
    const currentIdx = fiveDailyPrayers.indexOf(current);
    const nextIdx = fiveDailyPrayers.indexOf(next);
    
    if (currentIdx === -1 || nextIdx === -1) return 50; // fallback
    
    const currentMins = parseTimeToMinutes(times[current]);
    const nextMins = parseTimeToMinutes(times[next]);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    
    let fraction = 0;
    if (nextMins > currentMins) {
      const total = nextMins - currentMins;
      const passed = nowMins - currentMins;
      fraction = Math.min(1, Math.max(0, passed / total));
    } else {
      // Wrap around (Isha to Fajr next day)
      const total = (1440 - currentMins) + nextMins;
      const passed = nowMins >= currentMins ? (nowMins - currentMins) : ((1440 - currentMins) + nowMins);
      fraction = Math.min(1, Math.max(0, passed / total));
    }
    
    // R-to-L positioning:
    // Index 0 (Fajr) -> 10%
    // Index 1 (Dhuhr) -> 30%
    // Index 2 (Asr) -> 50%
    // Index 3 (Maghrib) -> 70%
    // Index 4 (Isha) -> 90%
    const currentPos = 10 + currentIdx * 20;
    const nextPos = 10 + nextIdx * 20;
    
    return currentPos + fraction * (nextPos - currentPos);
  };

  // Helper to render analog clock face in the main card
  const renderCardAnalogClock = () => {
    const sec = now.getSeconds();
    const min = now.getMinutes();
    const hr = now.getHours();

    const secDeg = sec * 6;
    const minDeg = min * 6 + sec * 0.1;
    const hrDeg = (hr % 12) * 30 + min * 0.5;

    if (clockFace === 'classic') {
      const isFaithBright = currentStyle === 'faith-bright';
      return (
        <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-lg ${
          isFaithBright 
            ? 'bg-[#fdfbf7] border-amber-500 shadow-amber-100/50' 
            : 'bg-slate-950 border-amber-400 shadow-black/60'
        }`}>
          {/* Numbers */}
          <span className={`absolute top-1 text-[9px] font-black font-mono ${isFaithBright ? 'text-amber-800' : 'text-amber-300'}`}>١٢</span>
          <span className={`absolute right-1 text-[9px] font-black font-mono ${isFaithBright ? 'text-amber-800' : 'text-amber-300'}`}>٣</span>
          <span className={`absolute bottom-1 text-[9px] font-black font-mono ${isFaithBright ? 'text-amber-800' : 'text-amber-300'}`}>٦</span>
          <span className={`absolute left-1 text-[9px] font-black font-mono ${isFaithBright ? 'text-amber-800' : 'text-amber-300'}`}>٩</span>
          
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
            {/* 12 dial tick marks */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = i * 30;
              const isQuarter = i % 3 === 0;
              return (
                <line
                  key={i}
                  x1="50"
                  y1={isQuarter ? "6" : "8"}
                  x2="50"
                  y2="12"
                  stroke={isQuarter ? (isFaithBright ? '#b45309' : '#f59e0b') : (isFaithBright ? '#fef3c7' : '#78350f')}
                  strokeWidth={isQuarter ? "2" : "1"}
                  transform={`rotate(${angle} 50 50)`}
                />
              );
            })}
            {/* Hands */}
            <line x1="50" y1="50" x2="50" y2="28" stroke={isFaithBright ? '#78350f' : '#f59e0b'} strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="18" stroke={isFaithBright ? '#1e293b' : '#cbd5e1'} strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="12" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
            <circle cx="50" cy="50" r="3.5" fill={isFaithBright ? '#78350f' : '#f59e0b'} />
            <circle cx="50" cy="50" r="1.5" fill="#fff" />
          </svg>
        </div>
      );
    }
    if (clockFace === 'islamic') {
      const isFaithBright = currentStyle === 'faith-bright';
      return (
        <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-lg overflow-hidden ${
          isFaithBright 
            ? 'bg-[#fdfbf2] border-emerald-600 shadow-emerald-100/50' 
            : 'bg-emerald-950/80 border-emerald-500 shadow-black/50'
        }`}>
          {/* Islamic Star watermark in background */}
          <div className="absolute inset-0 opacity-[0.12] flex items-center justify-center pointer-events-none">
            <svg className="w-4/5 h-4/5" viewBox="0 0 100 100" fill="none" stroke={isFaithBright ? '#047857' : '#10b981'} strokeWidth="0.75">
              <polygon points="50,10 78,22 90,50 78,78 50,90 22,78 10,50 22,22" />
              <polygon points="50,10 90,50 50,90 10,50" />
              <circle cx="50" cy="50" r="30" />
            </svg>
          </div>
          
          <span className={`absolute top-1 text-[9px] font-black ${isFaithBright ? 'text-emerald-900' : 'text-emerald-300'}`}>١٢</span>
          <span className={`absolute right-1 text-[9px] font-black ${isFaithBright ? 'text-emerald-900' : 'text-emerald-300'}`}>٣</span>
          <span className={`absolute bottom-1 text-[9px] font-black ${isFaithBright ? 'text-emerald-900' : 'text-emerald-300'}`}>٦</span>
          <span className={`absolute left-1 text-[9px] font-black ${isFaithBright ? 'text-emerald-900' : 'text-emerald-300'}`}>٩</span>
          
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
            {/* 12 Islamic dots or tiny stars as ticks */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = i * 30;
              const isQuarter = i % 3 === 0;
              return (
                <circle
                  key={i}
                  cx="50"
                  cy={isQuarter ? "9" : "10"}
                  r={isQuarter ? "1.8" : "1"}
                  fill={isQuarter ? '#d4af37' : (isFaithBright ? '#10b981' : '#047857')}
                  transform={`rotate(${angle} 50 50)`}
                />
              );
            })}
            {/* Calligraphic styled hands */}
            <line x1="50" y1="50" x2="50" y2="30" stroke={isFaithBright ? '#064e3b' : '#34d399'} strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="18" stroke={isFaithBright ? '#047857' : '#10b981'} strokeWidth="2.2" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="12" stroke="#d4af37" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
            {/* Beautiful center dome node */}
            <circle cx="50" cy="50" r="4.5" fill="#d4af37" />
            <circle cx="50" cy="50" r="2.5" fill={isFaithBright ? '#064e3b' : '#047857'} />
          </svg>
        </div>
      );
    }
    if (clockFace === 'minimal') {
      const isFaithBright = currentStyle === 'faith-bright';
      return (
        <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border transition-all duration-300 flex items-center justify-center shadow-md ${
          isFaithBright 
            ? 'bg-white/40 border-slate-200/80 shadow-slate-100/30' 
            : 'bg-black/30 border-white/10 shadow-black/30'
        }`}>
          {/* Subtle central minute circle */}
          <div className="absolute w-12 h-12 rounded-full border border-dashed border-white/5 opacity-40" />
          
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
            {/* Ultra minimal hour lines */}
            {[0, 90, 180, 270].map((angle) => (
              <line
                key={angle}
                x1="50"
                y1="6"
                x2="50"
                y2="11"
                stroke={isFaithBright ? '#64748b' : '#cbd5e1'}
                strokeWidth="2.2"
                strokeLinecap="round"
                transform={`rotate(${angle} 50 50)`}
              />
            ))}
            {/* Other 8 dots */}
            {[30, 60, 120, 150, 210, 240, 300, 330].map((angle) => (
              <circle
                key={angle}
                cx="50"
                cy="8"
                r="1"
                fill={isFaithBright ? '#94a3b8' : '#64748b'}
                transform={`rotate(${angle} 50 50)`}
              />
            ))}
            
            {/* Modern thin needle hands */}
            <line x1="50" y1="50" x2="50" y2="31" stroke={isFaithBright ? '#1e293b' : '#f8fafc'} strokeWidth="2" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="17" stroke={isFaithBright ? '#475569' : '#94a3b8'} strokeWidth="1.2" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
            <circle cx="50" cy="12" r="2.2" fill="#8b5cf6" transform={`rotate(${secDeg} 50 50)`} /> {/* Sweeping ball indicator */}
            <circle cx="50" cy="50" r="2.5" fill="#8b5cf6" />
          </svg>
        </div>
      );
    }
    if (clockFace === 'salatuk') {
      const isFaithBright = currentStyle === 'faith-bright';
      const padVal = (n: number) => n.toString().padStart(2, '0');
      return (
        <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-lg overflow-hidden ${
          isFaithBright 
            ? 'bg-[#edf2f7] border-blue-600 shadow-blue-100/40' 
            : 'bg-[#0b1724] border-[#1b2f44] shadow-black/60'
        }`}>
          {/* Numbers */}
          <span className={`absolute top-1 text-[9px] font-black font-sans ${isFaithBright ? 'text-blue-900' : 'text-white/40'}`}>١٢</span>
          <span className={`absolute right-1 text-[9px] font-black font-sans ${isFaithBright ? 'text-blue-900' : 'text-white/40'}`}>٣</span>
          <span className={`absolute bottom-1 text-[9px] font-black font-sans ${isFaithBright ? 'text-blue-900' : 'text-white/40'}`}>٦</span>
          <span className={`absolute left-1 text-[9px] font-black font-sans ${isFaithBright ? 'text-blue-900' : 'text-white/40'}`}>٩</span>
          
          {/* Center Digital Clock Readout & Calligraphic Arabic Day Name */}
          <div className="absolute top-1/2 -translate-y-1/2 text-center select-none pointer-events-none">
            <span className={`text-[9px] font-black font-mono tracking-tight block pt-4.5 ${isFaithBright ? 'text-blue-800' : 'text-sky-400'}`}>
              {toArabicNumbers(padVal(hr % 12 || 12))}:{toArabicNumbers(padVal(min))}
            </span>
            <span className="text-[7.5px] font-black text-amber-500/95 leading-none block mt-0.5 font-sans">
              {dayNameArabic}
            </span>
          </div>

          <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
            {/* 12 Salatuk clean dial ticks */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = i * 30;
              const isQuarter = i % 3 === 0;
              return (
                <line
                  key={i}
                  x1="50"
                  y1={isQuarter ? "6" : "8"}
                  x2="50"
                  y2="12"
                  stroke={isQuarter ? (isFaithBright ? '#1e3a8a' : '#38bdf8') : (isFaithBright ? '#cbd5e1' : '#1e293b')}
                  strokeWidth={isQuarter ? "2" : "1"}
                  transform={`rotate(${angle} 50 50)`}
                />
              );
            })}
            {/* Premium Salatuk white & red needle hands */}
            <line x1="50" y1="50" x2="50" y2="30" stroke={isFaithBright ? '#1e3a8a' : '#ffffff'} strokeWidth="3.2" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="18" stroke={isFaithBright ? '#3b82f6' : '#ffffff'} strokeWidth="2.2" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="12" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
            <circle cx="50" cy="50" r="3.5" fill="#ef4444" />
            <circle cx="50" cy="50" r="1.5" fill="#fff" />
          </svg>
        </div>
      );
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-cyan-500 bg-slate-950 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Holographic scanner active line */}
        <div className="absolute inset-x-0 h-[1px] bg-cyan-400/30 animate-pulse top-1/2" />
        
        {/* Background Digital HUD readout */}
        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-20">
          <span className="text-xs sm:text-sm font-black font-mono text-cyan-400 tracking-wider">
            {toArabicNumbers(pad(hr % 12 || 12))}:{toArabicNumbers(pad(min))}
          </span>
        </div>

        <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
          {/* Circular HUD segments */}
          <circle cx="50" cy="50" r="45" stroke="#0891b2" strokeWidth="0.5" strokeDasharray="5,15" fill="none" className="animate-spin-slow opacity-30" />
          <circle cx="50" cy="50" r="41" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="30,10" fill="none" className="animate-spin-reverse opacity-25" />
          
          {/* Hour markers as glowing ticks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30;
            const isQuarter = i % 3 === 0;
            return (
              <line
                key={i}
                x1="50"
                y1={isQuarter ? "5" : "7"}
                x2="50"
                y2="10"
                stroke={isQuarter ? '#22d3ee' : '#0891b2'}
                strokeWidth={isQuarter ? "2" : "1"}
                transform={`rotate(${angle} 50 50)`}
              />
            );
          })}
          
          {/* Cyberpunk Laser hands with drop shadows/glows */}
          <line x1="50" y1="50" x2="50" y2="28" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="15" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="10" stroke="#f43f5e" strokeWidth="0.75" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
          
          {/* Glowing central node */}
          <circle cx="50" cy="50" r="3.5" fill="#22d3ee" className="animate-pulse" />
          <circle cx="50" cy="50" r="1.5" fill="#f43f5e" />
        </svg>
      </div>
    );
  };

  return (
    <div id="dashboard-root" className="space-y-6" dir="rtl">

      {/* 1. High-Fidelity Main Prayer Card with Custom Gradient & Elegant Image Backdrop */}
      <div 
        id="main-prayer-card"
        className={`w-full bg-gradient-to-b ${currentGradient} text-white rounded-3xl p-4 sm:p-5 gap-4 min-h-[260px] sm:min-h-[280px] shadow-xl relative overflow-hidden flex flex-col justify-between transition-all duration-500 ease-in-out`}
      >
        {/* High-Precision Islamic Mosque Vector Backdrop (Offline, Sharp, No Checkerboard, No Broken Alt Text) */}
        <div className="absolute inset-0 pointer-events-none select-none opacity-40 overflow-hidden">
          <MosqueBackdrop type={currentBackdropKey} />
        </div>

        {/* Centered Premium Header Section with Location, Date & Controls */}
        <div className="flex flex-col items-center justify-center text-center gap-2.5 z-10 w-full border-b border-white/10 pb-3">
          {/* Centered Date Widget (Hijri | Day | Gregorian without day name) */}
          <div className="flex items-center justify-center gap-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10 text-white shadow-xs max-w-full flex-wrap">
            <Calendar className="w-3 h-3 text-amber-300 shrink-0" />
            <span className="text-[11px] font-black leading-none" title="التاريخ الهجري">{hijri.fullString}</span>
            <span className="text-white/20 text-[11px] font-light">|</span>
            <span className="text-[11px] font-black text-amber-200 leading-none">{dayNameArabic}</span>
            <span className="text-white/20 text-[11px] font-light">|</span>
            <span className="text-[11px] font-extrabold text-white/95 leading-none" title="التاريخ الميلادي">{gregorianClean}</span>
          </div>
        </div>

        {/* Central Glowing Prayer Meta & Clock Dashboard Grid */}
        <div className="z-10 py-1 w-full">
          {/* Dual-Column Responsive Dashboard */}
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 md:gap-6 px-1">
            
            {/* Column 1: The Focal Spiritual Clock */}
            <div className="flex flex-col items-center text-center space-y-2.5 flex-1 w-full order-1 md:order-2">
              {/* Event Tag */}
              {(() => {
                const ev = getIslamicEventLabel();
                if (!ev) return null;
                return (
                  <div className="bg-gradient-to-r from-amber-500/10 via-emerald-600/25 to-amber-500/10 border border-amber-400/15 backdrop-blur-md px-3 py-0.5 rounded-full text-center animate-pulse">
                    <span className="font-black text-amber-300 text-[9px] block leading-normal">{ev.text}</span>
                  </div>
                );
              })()}

              {/* Heartwarming spiritual greeting */}
              <span className="text-[11px] sm:text-xs font-extrabold text-amber-200/95 tracking-wide drop-shadow-sm">
                {(() => {
                  const hr = now.getHours();
                  if (hr >= 4 && hr < 12) return "صباحك بذكر الله أجمل 🌸";
                  if (hr >= 12 && hr < 16) return "يومك مبارك وسعيد ☀️";
                  if (hr >= 16 && hr < 19) return "مساؤك عامر بالرضا والطاعة ✨";
                  return "ليلتك هادئة بذكر الله 🌙";
                })()}
              </span>

              {/* Clock Display */}
              {showAnalogClock ? (
                <div className="flex flex-col items-center gap-1.5 py-0.5 transition-all duration-500 scale-90 sm:scale-95">
                  {renderCardAnalogClock()}
                </div>
              ) : (
                /* Giant Digital Current Time Clock */
                <div className="flex items-baseline gap-1 select-all py-0.5 justify-center">
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.35)]">
                    {(() => {
                      let hrs = now.getHours();
                      const mins = now.getMinutes().toString().padStart(2, '0');
                      hrs = hrs % 12 || 12;
                      return `${toArabicNumbers(hrs.toString())}:${toArabicNumbers(mins)}`;
                    })()}
                  </span>
                  <span className="text-[9px] font-black text-amber-300 bg-black/20 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/5">
                    {now.getHours() >= 12 ? 'م' : 'ص'}
                  </span>
                </div>
              )}

              {/* Segmented Clock Mode Button underneath */}
              <button
                type="button"
                onClick={() => setShowAnalogClock(!showAnalogClock)}
                className="text-[9px] font-black text-white/50 hover:text-amber-300 transition-all cursor-pointer bg-white/5 px-2 py-0.5 rounded-md border border-white/5 active:scale-95"
              >
                {showAnalogClock ? 'عرض الساعة الرقمية 🕒' : 'عرض ساعة العقارب 🕰️'}
              </button>

              {/* Analog Clock Face Options Selector - Shown under clock button when analog clock is active */}
              {showAnalogClock && (
                <div className="flex items-center justify-center gap-1 z-10 w-full animate-fade-in mt-1 scale-90">
                  <div className="flex bg-black/25 backdrop-blur-md p-0.5 rounded-lg border border-white/5 shadow-inner">
                    {(['classic', 'islamic', 'minimal', 'cyber', 'salatuk'] as const).map(face => (
                      <button
                        key={face}
                        type="button"
                        onClick={() => setClockFace(face)}
                        className={`px-1.5 py-0.5 rounded text-[7.5px] font-black cursor-pointer transition-all ${
                          clockFace === face
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {face === 'classic' ? 'كلاسيك' : face === 'islamic' ? 'إسلامي' : face === 'minimal' ? 'بسيط' : face === 'cyber' ? 'سايبر' : 'صلاتك'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subtle vertical separator for tablet/desktop */}
            <div className="hidden md:block w-[1px] h-28 bg-white/10 shrink-0 order-2" />

            {/* Column 2: Prayer Status Hub */}
            <div className="flex flex-col items-center md:items-start text-center md:text-right space-y-3.5 flex-1 w-full order-3 md:order-1 max-w-sm mx-auto md:mx-0">
              {/* Glassmorphic Upcoming Prayer Status Pill */}
              <div className="bg-black/35 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 flex flex-col items-center md:items-start gap-1 shadow-md w-full hover:border-white/20 transition-all duration-300">
                <div className="flex items-center gap-1.5 justify-center md:justify-start w-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-white/60 text-[9.5px] font-extrabold tracking-wider">الصلاة القادمة</span>
                  <span className="text-amber-300 text-xs font-black">
                    {getArabicPrayerName(next, now)}
                  </span>
                  <span className="text-[9.5px] text-white/50 font-mono">({toArabicNumbers(times[next])})</span>
                </div>
                
                <div className="text-[11px] font-black text-white flex items-center gap-1 border-t border-white/15 pt-1.5 w-full justify-center md:justify-start">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                  <span>متبقي {toArabicNumbers(timeRemainingStr)}</span>
                </div>
              </div>

              {/* Prayer Progress Bar */}
              <div className="w-full space-y-1.5">
                <div className="flex justify-between items-center text-[9.5px] text-white/75 font-bold px-1">
                  <div className="flex items-center gap-1">
                    <span className="text-white/50">الحالية:</span>
                    <span className="text-emerald-300 font-extrabold">{getArabicPrayerName(current, now)}</span>
                  </div>
                  <span className="text-amber-300 font-black bg-white/10 px-1 py-0.5 rounded-md text-[8.5px]">{toArabicNumbers(Math.round(getPrayerProgressPercentage()))}%</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white/50">التالية:</span>
                    <span className="text-amber-200 font-extrabold">{getArabicPrayerName(next, now)}</span>
                  </div>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative border border-white/5 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${getPrayerProgressPercentage()}%` }}
                  />
                </div>
              </div>

              {/* Sunnah & Remembrance motivational quote or quick recommendation */}
              <div className="text-[9.5px] font-bold text-white/80 bg-white/5 border border-white/5 rounded-xl px-2.5 py-1.5 w-full leading-relaxed flex items-start gap-1.5 shadow-sm text-right">
                <span className="text-amber-300 text-[11px] shrink-0 mt-0.5">💡</span>
                <span className="leading-normal">
                  {(() => {
                    const hr = now.getHours();
                    if (hr >= 4 && hr < 11) return "سنة الضحى صلاة الأوابين، تجزئ عن ٣٦٠ صدقة من مفاصل جسدك.";
                    if (hr >= 11 && hr < 15) return "رواتب الظهر: أربع ركعات قبلها وركعتان بعدها تبني لك بيتًا في الجنة.";
                    if (hr >= 15 && hr < 18) return "أربع ركعات قبل العصر رحم الله امرءاً صلى قبل العصر أربعاً.";
                    return "احرص على ركعة الوتر قبل النوم ليكون مسك ختام يومك المبارك.";
                  })()}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Horizontal list of 6 prayers inside the card */}
        <div className="w-full z-10 pt-1 flex flex-col gap-1.5">
          {(() => {
            const currentLog = current && current !== 'Sunrise' ? todayLogs[current] : undefined;
            const isCurrentLogged = currentLog && (currentLog.status === 'A' || currentLog.status === 'B' || currentLog.status === 'D' || currentLog.status === 'E');
            const needsAttention = current && current !== 'Sunrise' && !isCurrentLogged;
            
            return needsAttention ? (
              <p className="text-[9.5px] text-center text-amber-300 font-extrabold leading-none animate-pulse flex items-center justify-center gap-1">
                <span className="inline-block animate-bounce text-[10px]">👇</span>
                <span>حان وقت صلاة {getArabicPrayerName(current, now)}! اضغط لتسجيل صلاتك وسننك</span>
              </p>
            ) : (
              <p className="text-[8px] text-center text-white/40 font-bold leading-none animate-fade-in">
                انقر على صلاة لتسجيل الفريضة والسنن
              </p>
            );
          })()}
          
          <div className="grid grid-cols-6 gap-1 text-center">
            {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as PrayerName[]).map((pName) => {
              const isActive = current === pName;
              const isSunrise = pName === 'Sunrise';
              const log = !isSunrise ? todayLogs[pName] : undefined;
              const status = log?.status || 'future';
              const isLogged = !isSunrise && (status === 'A' || status === 'B' || status === 'D' || status === 'E');
              const shouldNudge = isActive && !isSunrise && !isLogged;

              // Interactive styling based on status and active
              let bgClass = '';
              let borderClass = 'border-transparent';
              let textNameClass = 'text-white/90';
              let textTimeClass = 'text-white/60';

              if (isActive) {
                bgClass = 'bg-white dark:bg-amber-400 text-slate-900 dark:text-slate-950 shadow-md font-bold';
                if (shouldNudge) {
                  bgClass += ' animate-gentle-wiggle animate-dynamic-glow ring-2 ring-amber-500 dark:ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
                }
                textNameClass = 'text-slate-900 dark:text-slate-950';
                textTimeClass = 'text-slate-900/80 dark:text-slate-950/85';
              } else {
                if (isSunrise) {
                   bgClass = 'bg-white/5 hover:bg-white/12 text-white/80';
                } else if (status === 'A') {
                  bgClass = 'bg-emerald-500/15 text-white';
                  borderClass = 'border-emerald-500/30';
                } else if (status === 'B') {
                  bgClass = 'bg-amber-500/15 text-white';
                  borderClass = 'border-amber-500/30';
                } else if (status === 'D') {
                  bgClass = 'bg-rose-500/15 text-white';
                  borderClass = 'border-rose-500/30';
                } else if (status === 'E') {
                  bgClass = 'bg-purple-500/15 text-white';
                  borderClass = 'border-purple-500/30';
                } else {
                  bgClass = 'bg-white/5 hover:bg-white/15 text-white/80';
                }
              }

              // Sunnah existence
              const hasSunnahBefore = !isSunrise && (pName === 'Fajr' || pName === 'Dhuhr');
              const hasSunnahAfter = !isSunrise && (pName === 'Dhuhr' || pName === 'Maghrib' || pName === 'Isha');
              const sunnahBeforeMax = pName === 'Dhuhr' ? 4 : 2;
              const sunnahAfterMax = 2;

              const currentSunnahBefore = log?.sunnahBefore || 0;
              const currentSunnahAfter = log?.sunnahAfter || 0;

              const isBeforeDone = currentSunnahBefore >= sunnahBeforeMax;
              const isAfterDone = currentSunnahAfter >= sunnahAfterMax;
              const isBeforeStarted = currentSunnahBefore > 0 && !isBeforeDone;
              const isAfterStarted = currentSunnahAfter > 0 && !isAfterDone;

              return (
                <button 
                  key={pName} 
                  type="button"
                  onClick={() => {
                    if (isSunrise) {
                      setShowSunriseModal(true);
                      return;
                    }
                    const nowMins = now.getHours() * 60 + now.getMinutes();
                    const prayerMins = parseTimeToMinutes(times[pName]);
                    if (nowMins < prayerMins) {
                      setFuturePrayerWarning(pName);
                    } else {
                      setSelectedPrayerToLog(pName);
                    }
                  }}
                  className={`flex flex-col items-center py-1.5 px-0.5 rounded-xl transition-all duration-300 border ${borderClass} ${bgClass} cursor-pointer focus:outline-none relative`}
                >
                  {/* Small absolute indicator dot for logged prayers */}
                  {!isActive && !isSunrise && status !== 'future' && (
                    <span className={`w-1 h-1 rounded-full absolute top-1 right-1 ${
                      status === 'A' ? 'bg-emerald-400 animate-pulse' : status === 'B' ? 'bg-amber-400' : status === 'E' ? 'bg-purple-400' : 'bg-rose-400'
                    }`} />
                  )}
                  
                  {/* Small gold dot indicator for the current active prayer */}
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-amber-500 dark:bg-amber-950 absolute top-1 right-1" />
                  )}

                  <span className={`text-[9px] block font-black leading-none ${textNameClass}`}>
                    {getArabicPrayerName(pName, now)}
                  </span>
                  <span className={`text-[8px] block mt-0.5 font-extrabold ${textTimeClass}`}>
                    {toArabicNumbers(times[pName])}
                  </span>

                  {/* Tiny Sunnah Indicators */}
                  {!isSunrise && (hasSunnahBefore || hasSunnahAfter) ? (
                    <div className="flex gap-0.5 mt-1 justify-center items-center">
                      {hasSunnahBefore && (
                        <span 
                          title={`سنة قبلية: ${toArabicNumbers(currentSunnahBefore)}/${toArabicNumbers(sunnahBeforeMax)} ركعات`}
                          className={`w-1 h-1 rounded-full transition-all ${
                            isBeforeDone
                              ? isActive ? 'bg-amber-800' : 'bg-amber-400'
                              : isBeforeStarted
                              ? isActive ? 'bg-amber-800/60 border-[0.5px] border-amber-900' : 'bg-amber-400/50 border-[0.5px] border-amber-400/80'
                              : isActive ? 'bg-slate-400' : 'bg-white/20'
                          }`} 
                        />
                      )}
                      {hasSunnahAfter && (
                        <span 
                          title={`سنة بعدية: ${toArabicNumbers(currentSunnahAfter)}/${toArabicNumbers(sunnahAfterMax)} ركعات`}
                          className={`w-1 h-1 rounded-full transition-all ${
                            isAfterDone
                              ? isActive ? 'bg-amber-800' : 'bg-amber-400'
                              : isAfterStarted
                              ? isActive ? 'bg-amber-800/60 border-[0.5px] border-amber-900' : 'bg-amber-400/50 border-[0.5px] border-amber-400/80'
                              : isActive ? 'bg-slate-400' : 'bg-white/20'
                          }`} 
                        />
                      )}
                    </div>
                  ) : (
                    <div className="h-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 1.5. Pinned Favorite Widget Section */}
      {settings.pinnedWidget && (
        <div className={`rounded-3xl p-4 sm:p-5 border transition-all duration-300 relative overflow-hidden flex flex-col gap-3 ${
          currentStyle === 'glass-dark'
            ? 'bg-[#111723]/95 backdrop-blur-md border-white/5 shadow-2xl text-slate-200'
            : 'bg-white border-[#e2e8f0] shadow-md text-slate-800'
        }`}>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">📌</span>
              <span className="text-[10px] font-black tracking-wider uppercase opacity-80">أداتك المفضلة المثبتة (شاشة الهاتف)</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab && setActiveTab('widgets')}
              className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              تعديل المكون ←
            </button>
          </div>

          {/* Widget frame on wallpaper backdrop */}
          <div className="w-full flex justify-center items-center">
            <div className={`relative w-full max-w-sm rounded-2xl p-1.5 overflow-hidden shadow-md flex items-center justify-center border border-white/5 ${
              settings.pinnedWidget.wallpaper === 'slate' ? 'bg-slate-900' :
              settings.pinnedWidget.wallpaper === 'desert' ? 'bg-gradient-to-tr from-[#1f1235] via-[#481d3d] to-[#99413b]' :
              settings.pinnedWidget.wallpaper === 'forest' ? 'bg-gradient-to-b from-[#061f18] via-[#0c2e26] to-[#143d34]' :
              'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950 via-slate-950 to-black'
            }`}>
              {/* Dynamic Theme calculations */}
              {(() => {
                const wType = settings.pinnedWidget.type || 'timeline';
                const wTheme = settings.pinnedWidget.theme || 'dark-blue';
                
                const themeClass = (() => {
                  if (wType === 'teal') {
                    return 'bg-gradient-to-tr from-[#029587] via-[#05ab95] to-[#0ea185] text-white border border-teal-400/30';
                  }
                  switch (wTheme) {
                    case 'green':
                      return 'bg-gradient-to-b from-emerald-950/95 to-teal-900/95 border border-emerald-500/30 text-white';
                    case 'gold':
                      return 'bg-gradient-to-b from-[#1c1b18]/95 via-[#23201a]/95 to-[#2b2720]/95 border border-amber-500/20 text-amber-100';
                    case 'glass':
                      return 'bg-white/10 backdrop-blur-xl border border-white/20 text-white';
                    case 'dark-blue':
                    default:
                      return 'bg-gradient-to-b from-[#0c1826]/95 to-[#112236]/95 border border-blue-900/40 text-white';
                  }
                })();

                const getArabicNameLocal = (p: string) => {
                  const names: Record<string, string> = {
                    Fajr: 'الفجر',
                    Sunrise: 'الشروق',
                    Dhuhr: 'الظهر',
                    Asr: 'العصر',
                    Maghrib: 'المغرب',
                    Isha: 'العشاء'
                  };
                  if (p === 'Dhuhr' && now.getDay() === 5) return 'الجمعة';
                  return names[p] || p;
                };

                const currentDayDigit = hijri?.day || now.getDate();
                const currentMonthName = hijri?.monthName || 'شوال';

                return (
                  <div className="w-full">
                    {/* STYLE 1: Timeline */}
                    {wType === 'timeline' && (
                      <div className={`w-full rounded-xl p-3 flex flex-col justify-between border select-none ${themeClass}`}>
                        <div className="flex justify-between items-start border-b border-white/10 pb-1.5">
                          <div className="flex items-center gap-1">
                            <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex flex-col items-center justify-center font-sans scale-90">
                              <span className="text-[10px] font-black leading-none">{toArabicNumbers(currentDayDigit)}</span>
                              <span className="text-[6px] font-bold leading-none">{currentMonthName}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] font-black block text-white/90 leading-none">{dayNameArabic}</span>
                              <span className="text-[6px] font-bold block text-white/40 mt-0.5">{toArabicNumbers(gregorianClean.split(' ').slice(0, 2).join(' '))}</span>
                            </div>
                          </div>
                          <div className="text-left">
                            <span className="text-[6px] font-bold block text-white/40">متبقي للأذان</span>
                            <span className="text-[10px] font-extrabold block text-amber-400 font-mono leading-none mt-0.5" dir="ltr">
                              -{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}
                            </span>
                          </div>
                        </div>

                        <div className="relative py-2.5 my-0.5 flex items-center justify-between">
                          <div className="absolute inset-x-1.5 h-[1.5px] bg-white/20 top-1/2 -translate-y-1/2 z-0 rounded-full" />
                          {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
                            const isActive = current === pName;
                            const prayerTime = times[pName] || '٠٠:٠٠';
                            return (
                              <div key={pName} className="flex flex-col items-center relative z-10 scale-90">
                                <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-all ${
                                  isActive ? 'bg-amber-400 text-slate-900 ring-2 ring-white scale-110' : 'bg-[#1b2b3c] border border-white/10'
                                }`} />
                                <span className={`text-[6.5px] font-bold mt-1 block ${isActive ? 'text-amber-400' : 'text-white/60'}`}>{getArabicNameLocal(pName)}</span>
                                <span className={`text-[7px] font-black font-mono mt-0.2 block ${isActive ? 'text-white' : 'text-white/30'}`}>{toArabicNumbers(prayerTime)}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-between items-center border-t border-white/5 pt-1.5 text-[7px] text-white/40 font-bold leading-none">
                          <span>📍 {settings.cityName || 'الإسكندرية'}</span>
                          <span>الشروق {toArabicNumbers(times.Sunrise || '٠٦:٠٨')} ص</span>
                        </div>
                      </div>
                    )}

                    {/* STYLE 2: Grid */}
                    {wType === 'grid' && (
                      <div className={`w-full rounded-xl p-2.5 flex flex-col justify-between border select-none ${themeClass}`}>
                        <div className="flex justify-between items-center border-b border-white/10 pb-1.5 text-[7.5px] font-black">
                          <span className="text-white">{dayNameArabic} • {toArabicNumbers(currentDayDigit)} {currentMonthName}</span>
                          <span className="text-amber-400 flex items-center gap-0.5">📍 {settings.cityName || 'الإسكندرية'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 py-1.5">
                          {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
                            const isActive = current === pName;
                            const prayerTime = times[pName] || '٠٠:٠٠';
                            return (
                              <div 
                                key={pName}
                                className={`p-1 rounded-lg border flex flex-col items-center justify-center text-center transition-all scale-95 ${
                                  isActive ? 'bg-[#15273b]/95 border-amber-400' : 'bg-white/[0.03] border-white/5'
                                }`}
                              >
                                <span className={`text-[7px] font-black ${isActive ? 'text-amber-400' : 'text-white/70'}`}>{getArabicNameLocal(pName)}</span>
                                <span className={`text-[7px] font-black font-mono mt-0.5 ${isActive ? 'text-white' : 'text-white/35'}`}>{toArabicNumbers(prayerTime)}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-center text-[6px] text-white/30 border-t border-white/5 pt-1 leading-none font-bold">
                          مواقيت الصلاة • رفيق المسلم المطور
                        </div>
                      </div>
                    )}

                    {/* STYLE 3: Teal */}
                    {wType === 'teal' && (
                      <div className="w-full rounded-xl p-3 flex flex-col justify-between bg-gradient-to-tr from-[#029587] via-[#05ab95] to-[#0ea185] text-white shadow-lg relative overflow-hidden select-none border border-teal-400/30 scale-100">
                        <div className="flex justify-between items-center border-b border-white/15 pb-1 text-[7.5px] font-black">
                          <span className="flex items-center gap-0.5">📍 {settings.cityName || 'الإسكندرية'}</span>
                          <span className="text-teal-100">{toArabicNumbers(currentDayDigit)} {currentMonthName}</span>
                        </div>
                        <div className="py-1.5 text-right space-y-0.5">
                          <span className="text-[6px] font-bold text-teal-100/70 block leading-none">الصلاة القادمة</span>
                          <h3 className="text-[10px] font-black text-white flex justify-between items-center leading-none">
                            <span>صلاة {getArabicNameLocal(next)}</span>
                            <span className="text-[11px] font-black font-mono text-amber-300" dir="ltr">{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}</span>
                          </h3>
                        </div>
                        <div className="grid grid-cols-5 gap-0.5 text-center bg-black/15 rounded-lg p-0.5 border border-white/5 scale-90">
                          {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
                            const isActive = current === pName;
                            const prayerTime = times[pName] || '٠٠:٠٠';
                            return (
                              <div key={pName} className={`p-0.5 rounded transition-all ${isActive ? 'bg-white/20 text-white font-extrabold' : ''}`}>
                                <span className="text-[5.5px] block font-bold opacity-80 leading-none">{getArabicNameLocal(pName)}</span>
                                <span className="text-[6.5px] block font-extrabold font-mono mt-0.5 leading-none">{toArabicNumbers(prayerTime)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* STYLE 4: Analog */}
                    {wType === 'analog' && (
                      <div className={`w-full rounded-xl p-3 flex items-center justify-center gap-3 border select-none ${themeClass}`}>
                        <div className="w-[54px] h-[54px] rounded-full bg-[#0a1520] border border-[#192f44] relative flex items-center justify-center shrink-0">
                          <div className="absolute inset-0.5 rounded-full border border-dashed border-white/5 pointer-events-none" />
                          <span className="absolute top-0.5 text-[5px] font-black text-white/30">١٢</span>
                          <span className="absolute right-0.5 text-[5px] font-black text-white/30">٣</span>
                          <span className="absolute bottom-0.5 text-[5px] font-black text-white/30">٦</span>
                          <span className="absolute left-0.5 text-[5px] font-black text-white/30">٩</span>
                          
                          {/* Hands */}
                          <div className="absolute w-[1.5px] h-3.5 bg-white rounded-full origin-bottom" style={{ transform: `rotate(${(now.getHours() % 12) * 30 + now.getMinutes() * 0.5}deg)`, top: 'calc(50% - 3.5px)' }} />
                          <div className="absolute w-[1px] h-5.5 bg-white rounded-full origin-bottom" style={{ transform: `rotate(${now.getMinutes() * 6}deg)`, top: 'calc(50% - 5.5px)' }} />
                          <div className="w-1 h-1 rounded-full bg-red-500 border border-white z-10" />
                        </div>
                        <div className="flex-1 space-y-0.5 text-right">
                          <span className="text-[6px] font-black text-amber-400 block uppercase leading-none">صلاة {getArabicNameLocal(next)}</span>
                          <h4 className="text-[8px] font-black text-white leading-none">متبقي للأذان</h4>
                          <span className="text-[9px] font-black text-white block font-mono leading-none mt-0.5" dir="ltr">
                            {toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* STYLE 5: Compact */}
                    {wType === 'compact' && (
                      <div className="w-full bg-[#eeeeee] dark:bg-[#1a242d] text-slate-800 dark:text-white rounded-full py-2 px-4 flex items-center justify-between shadow-sm border border-slate-200 dark:border-white/5 select-none">
                        <div className="flex items-center gap-1 leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-extrabold font-sans">
                            {getArabicNameLocal(current)} -{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}
                          </span>
                        </div>
                        <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-0.5 leading-none">
                          📍 {settings.cityName || 'الإسكندرية'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 4 Elegant Dynamic Bento Circular Widgets as Quick worship center portal */}
      <div className={`rounded-3xl p-4 border transition-all duration-300 grid grid-cols-4 gap-2 sm:gap-4 text-center ${
        currentStyle === 'glass-dark'
          ? 'bg-[#111723]/90 backdrop-blur-md border-white/5 shadow-2xl text-slate-200'
          : 'bg-white border-[#e2e8f0] shadow-sm text-slate-800'
      }`}>
        
        {/* Widget 1: Al-Salah with Segmented + Gold Sunnah concentric circle */}
        <button 
          onClick={() => {
            if (setActiveTab) {
              setActiveTab('salah');
            } else {
              const el = document.getElementById('main-prayer-card');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
        >
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* SVG Segmented Obligatory Rings + Gold Sunnah Ring */}
            <svg className="absolute w-full h-full" viewBox="0 0 36 36">
              {/* Obligatory segmented arcs (Radius 16) */}
              {fiveDailyPrayers.map((p, idx) => {
                const log = todayLogs[p];
                const status = log?.status || 'future';
                let strokeColor = currentStyle === 'glass-dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(148, 163, 184, 0.15)';
                if (status === 'A') strokeColor = '#10b981';
                else if (status === 'B') strokeColor = '#f59e0b';
                else if (status === 'C' || status === 'D') strokeColor = '#ef4444';
                else if (status === 'E') strokeColor = '#a855f7'; // Lavender/Purple for Excused status

                const r = 16;
                const c = 100.53;
                const segmentLength = (c / 5) - 1.5;
                const gapLength = c - segmentLength;
                const offset = (c / 4) - (idx * (c / 5)); // start from top and rotate clockwise

                return (
                  <circle
                    key={p}
                    cx="18"
                    cy="18"
                    r={r}
                    stroke={strokeColor}
                    strokeWidth="2.2"
                    fill="transparent"
                    strokeDasharray={`${segmentLength} ${gapLength}`}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                );
              })}

              {/* Inner Golden Sunnah Ring (Radius 11.5) */}
              <circle
                cx="18"
                cy="18"
                r="11.5"
                stroke={currentStyle === 'glass-dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(148, 163, 184, 0.1)'}
                strokeWidth="1.5"
                fill="transparent"
              />
              <circle
                cx="18"
                cy="18"
                r="11.5"
                stroke="#d4af37"
                strokeWidth="1.5"
                fill="transparent"
                strokeDasharray="72.25"
                strokeDashoffset={72.25 - (72.25 * sunnahPercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center z-10 shadow-xs group-hover:scale-105 transition-transform">
              <span className="text-sm leading-none">🕌</span>
            </div>
          </div>
          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-none">الصلاة</span>
          <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 font-mono leading-none">
            {toArabicNumbers(salahPercent)}%
          </span>
        </button>

        {/* Widget 2: Al-Siyam with fast progression live countdown ring */}
        <button 
          onClick={() => {
            if (setActiveTab) {
              setActiveTab('fasting');
            } else {
              const el = document.getElementById('fasting-tracker-container');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
        >
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" stroke={currentStyle === 'glass-dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(14, 165, 233, 0.12)'} strokeWidth="2.2" fill="transparent" />
              <circle 
                cx="18" 
                cy="18" 
                r="16" 
                stroke="#0ea5e9" 
                strokeWidth="2.2" 
                fill="transparent" 
                strokeDasharray="100.53" 
                strokeDashoffset={100.53 - (100.53 * fastingProgress.percent) / 100} 
                strokeLinecap="round" 
                className="transition-all duration-1000 ease-out" 
              />
            </svg>
            <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center z-10 shadow-xs group-hover:scale-105 transition-transform">
              <span className="text-sm leading-none">🌙</span>
            </div>
          </div>
          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-none">الصيام</span>
          <span className="text-[9px] font-extrabold text-sky-600 dark:text-sky-400 font-mono leading-none">
            {fastingProgress.countdownStr}
          </span>
        </button>

        {/* Widget 3: Al-Quran with 3 nested concentric rings (Reading, Memorization, Revision) */}
        <button 
          onClick={() => setActiveTab && setActiveTab('quran')}
          className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
        >
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* SVG 3 Concentric Nested Rings */}
            <svg className="absolute w-full h-full" viewBox="0 0 36 36">
              {/* Outer Ring: Reading */}
              <circle cx="18" cy="18" r="16" stroke={currentStyle === 'glass-dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(148, 163, 184, 0.1)'} strokeWidth="1.8" fill="transparent" />
              <circle
                cx="18"
                cy="18"
                r="16"
                stroke="#f59e0b"
                strokeWidth="1.8"
                fill="transparent"
                strokeDasharray="100.53"
                strokeDashoffset={100.53 - (100.53 * quranReadPercent) / 100}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
                className="transition-all duration-1000 ease-out"
              />

              {/* Middle Ring: Memorization */}
              <circle cx="18" cy="18" r="12.5" stroke={currentStyle === 'glass-dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(148, 163, 184, 0.1)'} strokeWidth="1.8" fill="transparent" />
              <circle
                cx="18"
                cy="18"
                r="12.5"
                stroke="#06b6d4"
                strokeWidth="1.8"
                fill="transparent"
                strokeDasharray="78.54"
                strokeDashoffset={78.54 - (78.54 * quranMemorizePercent) / 100}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
                className="transition-all duration-1000 ease-out"
              />

              {/* Inner Ring: Revision */}
              <circle cx="18" cy="18" r="9.0" stroke={currentStyle === 'glass-dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(148, 163, 184, 0.1)'} strokeWidth="1.8" fill="transparent" />
              <circle
                cx="18"
                cy="18"
                r="9.0"
                stroke="#a855f7"
                strokeWidth="1.8"
                fill="transparent"
                strokeDasharray="56.55"
                strokeDashoffset={56.55 - (56.55 * quranReviewPercent) / 100}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center z-10 shadow-xs group-hover:scale-105 transition-transform">
              <span className="text-[13px] leading-none">📖</span>
            </div>
          </div>
          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-none">القرآن</span>
          <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 font-mono leading-none">
            {toArabicNumbers(quranPercent)}%
          </span>
        </button>

        {/* Widget 4: Al-Adhkar with double progress rings */}
        <button 
          onClick={() => setActiveTab && setActiveTab('adhkar')}
          className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
        >
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" stroke={currentStyle === 'glass-dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(168, 85, 247, 0.12)'} strokeWidth="2.2" fill="transparent" />
              <circle 
                cx="18" 
                cy="18" 
                r="16" 
                stroke="#a855f7" 
                strokeWidth="2.2" 
                fill="transparent" 
                strokeDasharray="100.53" 
                strokeDashoffset={100.53 - (100.53 * dhikrPercent) / 100} 
                strokeLinecap="round" 
                className="transition-all duration-1000 ease-out" 
              />
              {/* Inner ring for sub-target */}
              <circle cx="18" cy="18" r="11.5" stroke={currentStyle === 'glass-dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(168, 85, 247, 0.06)'} strokeWidth="1.2" fill="transparent" />
              <circle 
                cx="18" 
                cy="18" 
                r="11.5" 
                stroke="#ec4899" 
                strokeWidth="1.2" 
                fill="transparent" 
                strokeDasharray="72.25" 
                strokeDashoffset={72.25 - (72.25 * Math.min(100, (totalDhikrsCompletedToday / 3) * 100)) / 100} 
                strokeLinecap="round" 
                className="transition-all duration-1000 ease-out" 
              />
            </svg>
            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center z-10 shadow-xs group-hover:scale-105 transition-transform">
              <span className="text-sm leading-none">📿</span>
            </div>
          </div>
          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-none">الأذكار</span>
          <span className="text-[9px] font-extrabold text-purple-600 dark:text-purple-400 font-mono leading-none">
            {toArabicNumbers(dhikrPercent)}%
          </span>
        </button>

      </div>

      {/* 5. Smart Companion Insights & Friday Mode */}
      <CompanionInsights 
        prayerLogs={prayerLogs}
        fastingLogs={fastingLogs}
        dhikrLogs={dhikrLogs}
        quranSessions={quranSessions}
        khatmat={khatmat}
        settings={settings}
      />

      {isFridayWindow && <FridayMode settings={settings} />}

      {/* Nafilah & Optional Prayers Card (Home Quick Access) */}
      <div className={`rounded-3xl p-5 border transition-all duration-300 space-y-4 ${
        currentStyle === 'glass-dark'
          ? 'bg-[#111723]/80 backdrop-blur-md border-white/5 shadow-2xl text-slate-100'
          : 'bg-white border-[#e2e8f0] shadow-sm text-slate-800'
      }`}>
        <div className="flex justify-between items-center pb-2 border-b border-slate-200/40 dark:border-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div className="text-right">
              <h3 className="text-sm font-black text-slate-800 dark:text-white leading-none">السنن الإضافية والنوافل</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">سجل سنن الضحى، قيام الليل، والوتر مباشرة</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* 1. Duha Prayer */}
          {(() => {
            const duhaLog = todayLogs['Duha'] || { status: 'not_yet', extraRakahs: 0 };
            const currentDuhaRakahs = duhaLog.status === 'A' ? (duhaLog.extraRakahs || 0) : 0;
            return (
              <div className={`p-3 rounded-2xl border transition-all ${
                currentStyle === 'glass-dark' 
                  ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]' 
                  : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/50'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-base">☀️</span>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 block">صلاة الضحى</span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold block">
                        {currentDuhaRakahs > 0 ? `تمت صلاة ${toArabicNumbers(currentDuhaRakahs)} ركعات` : 'الضحى (٢، ٤، ٦، ٨)'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Direct Custom Increment/Decrement */}
                  <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
                    currentStyle === 'glass-dark' 
                      ? 'bg-slate-950/40 border-white/5' 
                      : 'bg-white border-slate-200/50'
                  }`} dir="ltr">
                    <button
                      type="button"
                      onClick={() => handleUpdateNafilah('Duha', Math.max(0, currentDuhaRakahs - 2))}
                      disabled={currentDuhaRakahs <= 0}
                      className="w-5.5 h-5.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-slate-800 dark:text-white"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-black text-slate-800 dark:text-white min-w-[28px] text-center">
                      {toArabicNumbers(currentDuhaRakahs)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateNafilah('Duha', currentDuhaRakahs === 0 ? 2 : Math.min(12, currentDuhaRakahs + 2))}
                      disabled={currentDuhaRakahs >= 12}
                      className="w-5.5 h-5.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-slate-800 dark:text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Predefined Quick Pill Selectors */}
                <div className="grid grid-cols-4 gap-1.5 pt-2">
                  {[2, 4, 6, 8].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleUpdateNafilah('Duha', currentDuhaRakahs === r ? 0 : r)}
                      className={`py-1 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                        currentDuhaRakahs === r
                          ? 'bg-amber-500/15 border-amber-500/45 text-amber-600 dark:text-amber-400 font-black shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200/40 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {toArabicNumbers(r)} {r === 2 ? 'ركعتان' : 'ركعات'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 2. Qiyam al-Layl */}
          {(() => {
            const qiyamLog = todayLogs['Qiyam'] || { status: 'not_yet', extraRakahs: 0 };
            const currentQiyamRakahs = qiyamLog.status === 'A' ? (qiyamLog.extraRakahs || 0) : 0;
            return (
              <div className={`p-3 rounded-2xl border transition-all ${
                currentStyle === 'glass-dark' 
                  ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]' 
                  : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/50'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌃</span>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 block">قيام الليل والتهجد</span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold block">
                        {currentQiyamRakahs > 0 ? `تمت صلاة ${toArabicNumbers(currentQiyamRakahs)} ركعة` : 'التهجد (٢، ٤، ٦، ٨+)'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Direct Custom Increment/Decrement */}
                  <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
                    currentStyle === 'glass-dark' 
                      ? 'bg-slate-950/40 border-white/5' 
                      : 'bg-white border-slate-200/50'
                  }`} dir="ltr">
                    <button
                      type="button"
                      onClick={() => handleUpdateNafilah('Qiyam', Math.max(0, currentQiyamRakahs - 2))}
                      disabled={currentQiyamRakahs <= 0}
                      className="w-5.5 h-5.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-slate-800 dark:text-white"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-black text-slate-800 dark:text-white min-w-[28px] text-center">
                      {toArabicNumbers(currentQiyamRakahs)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateNafilah('Qiyam', currentQiyamRakahs === 0 ? 2 : Math.min(40, currentQiyamRakahs + 2))}
                      disabled={currentQiyamRakahs >= 40}
                      className="w-5.5 h-5.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-slate-800 dark:text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Predefined Quick Pill Selectors */}
                <div className="grid grid-cols-4 gap-1.5 pt-2">
                  {[2, 4, 8, 10].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleUpdateNafilah('Qiyam', currentQiyamRakahs === r ? 0 : r)}
                      className={`py-1 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                        currentQiyamRakahs === r
                          ? 'bg-amber-500/15 border-amber-500/45 text-amber-600 dark:text-amber-400 font-black shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200/40 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {toArabicNumbers(r)} {r === 2 ? 'ركعتان' : 'ركعات'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 3. Witr & Shaf' */}
          {(() => {
            const witrLog = todayLogs['Witr'] || { status: 'not_yet', extraRakahs: 0 };
            const currentWitrRakahs = witrLog.status === 'A' ? (witrLog.extraRakahs || 0) : 0;
            return (
              <div className={`p-3 rounded-2xl border transition-all ${
                currentStyle === 'glass-dark' 
                  ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]' 
                  : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/50'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌟</span>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 block">الشفع والوتر</span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold block">
                        {currentWitrRakahs > 0 ? `تمت صلاة ${toArabicNumbers(currentWitrRakahs)} ركعة` : 'الوتر (١، ٣، ٥، ٧)'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Direct Custom Increment/Decrement */}
                  <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
                    currentStyle === 'glass-dark' 
                      ? 'bg-slate-950/40 border-white/5' 
                      : 'bg-white border-slate-200/50'
                  }`} dir="ltr">
                    <button
                      type="button"
                      onClick={() => handleUpdateNafilah('Witr', currentWitrRakahs <= 1 ? 0 : currentWitrRakahs - 2)}
                      disabled={currentWitrRakahs <= 0}
                      className="w-5.5 h-5.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-slate-800 dark:text-white"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-black text-slate-800 dark:text-white min-w-[28px] text-center">
                      {toArabicNumbers(currentWitrRakahs)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateNafilah('Witr', currentWitrRakahs === 0 ? 1 : Math.min(15, currentWitrRakahs + 2))}
                      disabled={currentWitrRakahs >= 15}
                      className="w-5.5 h-5.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-slate-800 dark:text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Predefined Quick Pill Selectors (Odd values only for Witr) */}
                <div className="grid grid-cols-4 gap-1.5 pt-2">
                  {[1, 3, 5, 7].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleUpdateNafilah('Witr', currentWitrRakahs === r ? 0 : r)}
                      className={`py-1 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                        currentWitrRakahs === r
                          ? 'bg-amber-500/15 border-amber-500/45 text-amber-600 dark:text-amber-400 font-black shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200/40 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {toArabicNumbers(r)} {r === 1 ? 'ركعة' : 'ركعات'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Sunrise (Shuruq) Educational Dialog */}
      {showSunriseModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-[#161d26] w-full max-w-sm rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-2xl animate-spin-slow">
              ☀️
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                شروق الشمس (نهاية وقت الفجر)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                يمثل شروق الشمس نهاية وقت صلاة الفجر وموعد شروقها، ولا يصح أداء صلاة الفجر بعد هذا الوقت كأداء بل تُصلى قضاءً.
              </p>
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl mt-2 text-right">
                <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 block mb-1">💡 سنة الضحى (صلاة الأوابين):</span>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                  يُستحب بعد شروق الشمس بثلث ساعة تقريباً صلاة الضحى، وهي سنة مؤكدة مباركة تُعادل صدقة عن كل سلامى (مفصل) في جسد الإنسان. أقلها ركعتان وأكثرها ثمان ركعات.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const sunriseMuezzin = localStorage.getItem('salah_muezzin_Sunrise') || currentMuezzin;
                togglePlayAthan(sunriseMuezzin);
              }}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Volume2 className="w-4 h-4" />
              <span>تجربة سماع صوت تنبيه الشروق</span>
            </button>
            
            <button
              type="button"
              onClick={() => setShowSunriseModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold rounded-xl text-xs transition-all cursor-pointer"
            >
              حسناً، جزاكم الله خيراً
            </button>
          </div>
        </div>
      )}

      {/* 1.5. Custom Duas Home Widget */}
      {(() => {
        const homeDuas = customDuas.filter(d => d.showOnHome);
        if (homeDuas.length === 0) return null;
        
        // Ensure index is valid in case list shrunk
        const activeIdx = homeDuaIdx >= homeDuas.length ? 0 : homeDuaIdx;
        const activeDua = homeDuas[activeIdx];
        if (!activeDua) return null;
        
        return (
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-5 border border-indigo-900/30 space-y-4 shadow-lg relative overflow-hidden transition-all duration-300">
            {/* Background design accents */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none flex justify-center items-center">
              <span className="text-[140px] font-black">🤍</span>
            </div>
            
            <div className="flex justify-between items-center relative z-10">
              <h3 className="text-xs font-black flex items-center gap-1.5 text-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                أدعيتك المخصصة اليومية
              </h3>
              <span className="text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded-full font-bold">
                {toArabicNumbers(homeDuas.length)} {homeDuas.length === 1 ? 'دعاء' : 'أدعية'}
              </span>
            </div>

            {/* Content card */}
            <div className="relative z-10 space-y-4">
              <p className="text-sm font-semibold leading-relaxed text-right text-indigo-50/90 whitespace-pre-line font-sans">
                {activeDua.text}
              </p>
              
              {homeDuas.length > 1 && (
                <div className="flex justify-between items-center pt-2.5 border-t border-indigo-900/40">
                  {/* Indicators */}
                  <div className="flex gap-1">
                    {homeDuas.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-1 rounded-full transition-all duration-300 ${
                          idx === activeIdx ? 'w-4 bg-amber-400' : 'w-1.5 bg-indigo-950'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Navigation Arrow buttons */}
                  <div className="flex gap-1.5" dir="ltr">
                    <button
                      type="button"
                      onClick={() => setHomeDuaIdx(prev => (prev - 1 + homeDuas.length) % homeDuas.length)}
                      className="w-7 h-7 rounded-lg bg-indigo-950/40 hover:bg-indigo-950/80 text-indigo-200 hover:text-white flex items-center justify-center border border-indigo-900/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setHomeDuaIdx(prev => (prev + 1) % homeDuas.length)}
                      className="w-7 h-7 rounded-lg bg-indigo-950/40 hover:bg-indigo-950/80 text-indigo-200 hover:text-white flex items-center justify-center border border-indigo-900/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Warning Dialog for Future Prayers */}
      {futurePrayerWarning && (() => {
        const pName = futurePrayerWarning;
        return (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
            <div className="bg-white dark:bg-[#161d26] w-full max-w-sm rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl text-center space-y-4">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                ✈️
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800 dark:text-white">
                  لم يحن وقت صلاة {getArabicPrayerName(pName, now)} بعد
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  مواقيت الصلاة محددة شرعاً بمواعيد فلكية دقيقة لموقعك الحالي. لا يصح شرعاً أداء الصلاة أو تسجيلها قبل دخول وقتها إلا في حالات السفر (الجمع والقصر).
                </p>
              </div>
              
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFuturePrayerWarning(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold rounded-xl text-xs transition-all cursor-pointer"
                >
                  حسناً، سأسجلها في وقتها
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Bypass safety check for travel cases (exceptional login)
                    setSelectedPrayerToLog(pName);
                    setFuturePrayerWarning(null);
                  }}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-[11px] transition-all cursor-pointer border border-indigo-100/30 dark:border-indigo-950/50"
                >
                  أنا في سفر (رخصة الجمع والقصر)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Logging Dialog / Bottom Sheet Modal */}
      {selectedPrayerToLog && (() => {
        const log = todayLogs[selectedPrayerToLog] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0 };
        const status = log.status || 'not_yet';
        
        const hasSunnahBefore = selectedPrayerToLog === 'Fajr' || selectedPrayerToLog === 'Dhuhr';
        const hasSunnahAfter = selectedPrayerToLog === 'Dhuhr' || selectedPrayerToLog === 'Maghrib' || selectedPrayerToLog === 'Isha';
        
        const sunnahBeforeMax = selectedPrayerToLog === 'Dhuhr' ? 4 : 2;
        const sunnahAfterMax = 2;

        return (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
            <div className="bg-white dark:bg-[#161d26] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-5">
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-2 sm:hidden" />
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center justify-center gap-2">
                  <span>🕌</span>
                  صلاة {getArabicPrayerName(selectedPrayerToLog, now)}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">سجل فريضة وسنن صلاة {getArabicPrayerName(selectedPrayerToLog, now)} في مكان واحد</p>
              </div>

              {/* 1. Obligatory Prayer Section */}
              <div className="space-y-2.5">
                <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 block">الفريضة المكتوبة</span>
                <div className={`grid ${settings.gender === 'female' ? 'grid-cols-4 gap-1.5' : 'grid-cols-3 gap-2'}`}>
                  {/* option A: In Time */}
                  <button
                    type="button"
                    onClick={() => {
                      const existingLog = todayLogs[selectedPrayerToLog] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0 };
                      setPrayerLogs(prev => ({
                        ...prev,
                        [todayStr]: {
                          ...todayLogs,
                          [selectedPrayerToLog]: { ...existingLog, status: 'A' }
                        }
                      }));
                      // Remove from pending Qada
                      setPendingQadaPrayers(prev => prev.filter(
                        q => !(q.date === todayStr && q.prayerName === selectedPrayerToLog)
                      ));
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      status === 'A'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-xs scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100/50'
                    }`}
                  >
                    <span className="text-lg">✅</span>
                    <span className="text-[10px] leading-none whitespace-nowrap">حاضر</span>
                  </button>

                  {/* option B: Late */}
                  <button
                    type="button"
                    onClick={() => {
                      const existingLog = todayLogs[selectedPrayerToLog] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0 };
                      setPrayerLogs(prev => ({
                        ...prev,
                        [todayStr]: {
                          ...todayLogs,
                          [selectedPrayerToLog]: { ...existingLog, status: 'B' }
                        }
                      }));
                      // Remove from pending Qada
                      setPendingQadaPrayers(prev => prev.filter(
                        q => !(q.date === todayStr && q.prayerName === selectedPrayerToLog)
                      ));
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      status === 'B'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold shadow-xs scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100/50'
                    }`}
                  >
                    <span className="text-lg">⏱️</span>
                    <span className="text-[10px] leading-none whitespace-nowrap">صليتها متأخر</span>
                  </button>

                  {/* option D: Missed/Qada */}
                  <button
                    type="button"
                    onClick={() => {
                      const existingLog = todayLogs[selectedPrayerToLog] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0 };
                      setPrayerLogs(prev => ({
                        ...prev,
                        [todayStr]: {
                          ...todayLogs,
                          [selectedPrayerToLog]: { ...existingLog, status: 'D' }
                        }
                      }));
                      // Add to pending Qada if not already pending
                      const alreadyPending = pendingQadaPrayers.some(
                        q => q.date === todayStr && q.prayerName === selectedPrayerToLog
                      );
                      if (!alreadyPending) {
                        const newQada: PendingQadaPrayer = {
                          id: crypto.randomUUID(),
                          date: todayStr,
                          hijriDate: hijri.fullString,
                          prayerName: selectedPrayerToLog
                        };
                        setPendingQadaPrayers(prev => [...prev, newQada]);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      status === 'D'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-extrabold shadow-xs scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100/50'
                    }`}
                  >
                    <span className="text-lg">❌</span>
                    <span className="text-[10px] leading-none whitespace-nowrap">قضاء</span>
                  </button>

                  {/* option E: Excused (Only visible if female) */}
                  {settings.gender === 'female' && (
                    <button
                      type="button"
                      onClick={() => {
                        const existingLog = todayLogs[selectedPrayerToLog] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0 };
                        setPrayerLogs(prev => ({
                          ...prev,
                          [todayStr]: {
                            ...todayLogs,
                            [selectedPrayerToLog]: { ...existingLog, status: 'E' }
                          }
                        }));
                        // Remove from pending Qada
                        setPendingQadaPrayers(prev => prev.filter(
                          q => !(q.date === todayStr && q.prayerName === selectedPrayerToLog)
                        ));
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        status === 'E'
                          ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 font-extrabold shadow-xs scale-[1.02]'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100/50'
                      }`}
                    >
                      <span className="text-lg">🌸</span>
                      <span className="text-[10px] leading-none whitespace-nowrap">عذر شرعي</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Sunnah Prayers Section */}
              {(hasSunnahBefore || hasSunnahAfter) && (
                <div className="space-y-2.5 pt-1">
                  <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 block">السنن الرواتب المصاحبة</span>
                  
                  <div className="space-y-2">
                    {/* Sunnah Before */}
                    {hasSunnahBefore && (
                      <div className="flex items-center justify-between p-3 bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/10 dark:border-amber-400/10 rounded-2xl transition-all">
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">سنة قبلية ({toArabicNumbers(sunnahBeforeMax)} ركعات)</span>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                            {(log.sunnahBefore ?? 0) >= sunnahBeforeMax ? '✨ اكتملت السنة القبلية' : (log.sunnahBefore ?? 0) > 0 ? `تمت صلاة ${toArabicNumbers(log.sunnahBefore ?? 0)} ركعات` : 'لم تصلَّ بعد'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateSunnah(selectedPrayerToLog, 'before', -2)}
                            className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center font-black text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-black text-slate-800 dark:text-white text-xs font-mono">
                            {toArabicNumbers(log.sunnahBefore || 0)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateSunnah(selectedPrayerToLog, 'before', 2)}
                            className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center font-black text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
                          >
                            +
                          </button>
                          {/* Quick Max Out Button for easy 1-click completion */}
                          <button
                            type="button"
                            onClick={() => {
                              const amount = (log.sunnahBefore || 0) >= sunnahBeforeMax ? 0 : sunnahBeforeMax;
                              setPrayerLogs(prev => ({
                                ...prev,
                                [todayStr]: {
                                  ...todayLogs,
                                  [selectedPrayerToLog]: {
                                    ...log,
                                    sunnahBefore: amount
                                  }
                                }
                              }));
                            }}
                            className={`px-2 py-1 text-[10px] font-black rounded-md cursor-pointer transition-all ${
                              (log.sunnahBefore || 0) >= sunnahBeforeMax 
                                ? 'bg-emerald-500/25 text-emerald-700 dark:text-emerald-400' 
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {(log.sunnahBefore || 0) >= sunnahBeforeMax ? 'تراجع' : 'كاملة'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sunnah After */}
                    {hasSunnahAfter && (
                      <div className="flex items-center justify-between p-3 bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/10 dark:border-amber-400/10 rounded-2xl transition-all">
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">سنة بعدية ({toArabicNumbers(sunnahAfterMax)} ركعات)</span>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                            {(log.sunnahAfter ?? 0) >= sunnahAfterMax ? '✨ اكتملت السنة البعدية' : 'لم تصلَّ بعد'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateSunnah(selectedPrayerToLog, 'after', -2)}
                            className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center font-black text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-black text-slate-800 dark:text-white text-xs font-mono">
                            {toArabicNumbers(log.sunnahAfter || 0)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateSunnah(selectedPrayerToLog, 'after', 2)}
                            className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center font-black text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
                          >
                            +
                          </button>
                          {/* Quick Max Out Button for easy 1-click completion */}
                          <button
                            type="button"
                            onClick={() => {
                              const amount = (log.sunnahAfter || 0) >= sunnahAfterMax ? 0 : sunnahAfterMax;
                              setPrayerLogs(prev => ({
                                ...prev,
                                [todayStr]: {
                                  ...todayLogs,
                                  [selectedPrayerToLog]: {
                                    ...log,
                                    sunnahAfter: amount
                                  }
                                }
                              }));
                            }}
                            className={`px-2 py-1 text-[10px] font-black rounded-md cursor-pointer transition-all ${
                              (log.sunnahAfter || 0) >= sunnahAfterMax 
                                ? 'bg-emerald-500/25 text-emerald-700 dark:text-emerald-400' 
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {(log.sunnahAfter || 0) >= sunnahAfterMax ? 'تراجع' : 'كاملة'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPrayerToLog(null)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-center transition-all cursor-pointer shadow-md shadow-emerald-200/50 dark:shadow-none hover:scale-[1.01] active:scale-[0.99]"
                >
                  حفظ وإغلاق
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPrayerToLog(null)}
                  className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. Actionable Local Nudges */}
      {activeNudge && (
        <div id="nudge-banner" className="bg-emerald-50/70 dark:bg-[#132c23] border border-emerald-100 dark:border-[#234237] rounded-3xl p-5 flex items-start gap-4 transition-colors duration-300">
          <div className="p-3 bg-emerald-100 dark:bg-[#1e4638] text-emerald-700 dark:text-emerald-300 rounded-2xl">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-3 flex-1 text-right">
            <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-300">توجيه رفيق مبارك</h4>
            <p className="text-sm text-emerald-800 dark:text-emerald-100 leading-relaxed font-semibold">
              {activeNudge.message}
            </p>
            {activeNudge.actionKey && activeNudge.actionKey !== 'general' && (
              <button
                onClick={handleExecuteNudgeAction}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-200/50 dark:shadow-none transition-all cursor-pointer"
              >
                {activeNudge.actionKey.startsWith('enable_alarm_') ? 'تفعيل تنبيهات الأذان' : 'موافق'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fasting Tracker Bar - Compact Full-Width */}
      <div id="fasting-tracker-container" className="bg-white dark:bg-[#161d26] rounded-3xl p-4 border border-[#e2e8f0]/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors duration-300 shadow-xs">
        <div className="flex items-center gap-3 text-right">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl shrink-0">
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              تتبع الصيام اليومي والسنن
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {todayFast.fasted ? 'تم تسجيل صيامك اليوم، تقبل الله منكم صالح الأعمال 🤍' : 'لم تسجل صياماً لليوم بعد (رمضان، الإثنين والخميس، الأيام البيض، إلخ).'}
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={toggleFasting}
          className={`py-2 px-5 rounded-xl font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer ${
            todayFast.fasted 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100 dark:shadow-none'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 dark:shadow-none'
          }`}
        >
          {todayFast.fasted ? 'صائم بفضل الله ✓' : 'تسجيل صيام اليوم'}
        </button>
      </div>



      {/* 7. High-Fidelity Spiritual Notifications & النفحات الإيمانية Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={() => setShowNotificationsModal(false)}
          />

          {/* Modal Container */}
          <div className="bg-white dark:bg-[#161d26] w-full max-w-sm rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl p-5 flex flex-col gap-4 relative z-10 animate-scale-up text-right">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-850 dark:text-white">النفحات والإشعارات الإيمانية</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">توجيهات روحية تناسب يومك وعبادتك</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className="py-1 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-black transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            {/* List */}
            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {getSpiritualNotifications().map((notif, idx) => (
                <div 
                  key={notif.id || idx}
                  className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800/50 flex items-start gap-3 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/40"
                >
                  <span className="text-2xl shrink-0 p-2 bg-white dark:bg-[#161d26] rounded-xl shadow-xs border border-slate-100 dark:border-slate-800/50">
                    {notif.icon}
                  </span>
                  <div className="space-y-2 flex-1">
                    <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                      {notif.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {notif.description}
                    </p>
                    {notif.actionLabel && (
                      <button
                        type="button"
                        onClick={() => {
                          if (notif.action) {
                            notif.action();
                          }
                          if (notif.id.includes('rem') || notif.id.includes('advice')) {
                            setShowNotificationsModal(false);
                          }
                        }}
                        className="py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[10px] shadow-xs cursor-pointer transition-all active:scale-95"
                      >
                        {notif.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer wisdom */}
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 text-center">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-normal">
                "إنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا" 🤍
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
