/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Plus, 
  Minus, 
  Settings, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Clock, 
  Calendar, 
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Award,
  BookOpen,
  Compass,
  AlertTriangle,
  Sliders,
  Bell,
  Heart,
  MapPin,
  Smartphone,
  Play,
  Pause,
  Music,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AppSettings, PendingQadaPrayer, PrayerLog, PrayerName, PrayerStatus } from '../types';
import { calculatePrayerTimes, getArabicPrayerName, parseTimeToMinutes } from '../utils/prayerCalc';
import { toArabicNumbers, getHijriDate } from '../utils/hijri';

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

const FIVE_DAILY_PRAYERS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

interface PrayerManagerProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
}

type SubTab = 'times' | 'worship' | 'settings';

export default function PrayerManager({
  settings,
  setSettings,
  prayerLogs,
  setPrayerLogs,
  pendingQadaPrayers,
  setPendingQadaPrayers
}: PrayerManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('times');
  const [worshipTab, setWorshipTab] = useState<'today' | 'qada'>('today');
  
  // Day selection for logging today or yesterday
  const [selectedDateOffset, setSelectedDateOffset] = useState<0 | -1>(0); // 0 = Today, -1 = Yesterday
  const [logSuccessMessage, setLogSuccessMessage] = useState<string>('');

  // Real-time ticking date/time
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Clock face selection state
  const [clockFace, setClockFace] = useState<'classic' | 'islamic' | 'minimal' | 'hybrid'>(() => {
    return (localStorage.getItem('salah_clock_face') as any) || 'classic';
  });

  useEffect(() => {
    localStorage.setItem('salah_clock_face', clockFace);
  }, [clockFace]);

  // Athan Audio Player States in PrayerManager
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentMuezzin, setCurrentMuezzin] = useState<string>(() => {
    return localStorage.getItem('salah_general_muezzin') || 'makkah';
  });
  const [fajrMuezzin, setFajrMuezzin] = useState<string>(() => {
    return localStorage.getItem('salah_fajr_muezzin') || 'fajr_yusuf';
  });
  const [prayerMuezzins, setPrayerMuezzins] = useState<Record<string, string>>(() => {
    const general = localStorage.getItem('salah_general_muezzin') || 'makkah';
    const fajr = localStorage.getItem('salah_fajr_muezzin') || 'fajr_yusuf';
    return {
      Fajr: localStorage.getItem('salah_muezzin_Fajr') || fajr,
      Dhuhr: localStorage.getItem('salah_muezzin_Dhuhr') || general,
      Asr: localStorage.getItem('salah_muezzin_Asr') || general,
      Maghrib: localStorage.getItem('salah_muezzin_Maghrib') || general,
      Isha: localStorage.getItem('salah_muezzin_Isha') || general,
    };
  });
  const [audioVolume, setAudioVolume] = useState<number>(() => {
    const saved = localStorage.getItem('salah_audio_volume');
    return saved ? parseFloat(saved) : 0.8;
  });
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState<number>(-1);
  const [autoPlayOnTime, setAutoPlayOnTime] = useState<boolean>(() => {
    return localStorage.getItem('salah_auto_play_athan') === 'true';
  });
  const [currentPlayingPrayer, setCurrentPlayingPrayer] = useState<PrayerName | null>(null);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Custom Muezzins State and definition
  const [customMuezzins, setCustomMuezzins] = useState<{ id: string; name: string; url: string; isFajr: boolean; isCustom?: boolean }[]>(() => {
    const saved = localStorage.getItem('salah_custom_muezzins');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('salah_custom_muezzins', JSON.stringify(customMuezzins));
  }, [customMuezzins]);

  const defaultMuezzins = [
    { id: 'fajr_yusuf', name: 'أذان الفجر (يوسف إسلام - بالتحية والتثويب)', url: 'https://www.islamcan.com/audio/adhan/azan20.mp3', isFajr: true },
    { id: 'makkah', name: 'أذان الحرم المكي الشريف', url: 'https://www.islamcan.com/audio/adhan/azan2.mp3', isFajr: false },
    { id: 'medina', name: 'أذان المسجد النبوي الشريف', url: 'https://www.islamcan.com/audio/adhan/azan3.mp3', isFajr: false },
    { id: 'aqsa', name: 'أذان المسجد الأقصى المبارك', url: 'https://www.islamcan.com/audio/adhan/azan1.mp3', isFajr: false },
  ];

  const muezzins = [...defaultMuezzins, ...customMuezzins];

  // Custom Alarms Interface & State
  interface CustomAlarm {
    id: string;
    title: string;
    time: string; // "HH:MM"
    days: number[]; // 0-6
    enabled: boolean;
    soundType: 'beep' | 'adhan' | 'vibrate' | 'silent';
  }

  const [customAlarms, setCustomAlarms] = useState<CustomAlarm[]>(() => {
    const saved = localStorage.getItem('salah_custom_alarms');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('salah_custom_alarms', JSON.stringify(customAlarms));
  }, [customAlarms]);

  // Alarms Form States
  const [alarmTitle, setAlarmTitle] = useState('');
  const [alarmTime, setAlarmTime] = useState('05:00');
  const [alarmDays, setAlarmDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [alarmSoundType, setAlarmSoundType] = useState<'beep' | 'adhan' | 'vibrate' | 'silent'>('beep');
  const [showAddAlarm, setShowAddAlarm] = useState(false);

  // Custom Muezzin Form States
  const [newMuezzinName, setNewMuezzinName] = useState('');
  const [newMuezzinUrl, setNewMuezzinUrl] = useState('');
  const [newMuezzinIsFajr, setNewMuezzinIsFajr] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [muezzinSourceType, setMuezzinSourceType] = useState<'url' | 'file'>('url');

  // Alarms triggered tracking
  const [lastTriggeredAlarms, setLastTriggeredAlarms] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('salah_last_triggered_alarms');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('salah_last_triggered_alarms', JSON.stringify(lastTriggeredAlarms));
  }, [lastTriggeredAlarms]);

  const handleAddCustomMuezzin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMuezzinName.trim()) {
      alert('الرجاء إدخال اسم المؤذن أو الصوت.');
      return;
    }
    if (!newMuezzinUrl.trim()) {
      alert('الرجاء إدخال رابط صوتي أو رفع ملف.');
      return;
    }

    const newMuezzin = {
      id: `custom_${Date.now()}`,
      name: `${newMuezzinName} (مخصص)`,
      url: newMuezzinUrl,
      isFajr: newMuezzinIsFajr,
      isCustom: true
    };

    try {
      const updated = [...customMuezzins, newMuezzin];
      localStorage.setItem('salah_custom_muezzins', JSON.stringify(updated));
      setCustomMuezzins(updated);
      setLogSuccessMessage(`تمت إضافة الصوت المخصص: "${newMuezzinName}" بنجاح!`);
      
      // Reset form
      setNewMuezzinName('');
      setNewMuezzinUrl('');
      setUploadFileName('');
    } catch (err) {
      console.error(err);
      alert('فشل حفظ الصوت في الذاكرة المحلية بسبب كبر حجم الملف المرفوع. يرجى استخدام رابط ويب (URL) لملف الصوت أو اختيار ملف ذي حجم أصغر جداً.');
    }
  };

  const handleDeleteCustomMuezzin = (id: string, name: string) => {
    if (window.confirm(`هل تريد حذف الصوت المخصص "${name}"؟`)) {
      setCustomMuezzins(prev => prev.filter(m => m.id !== id));
      setLogSuccessMessage(`تم حذف الصوت المخصص "${name}".`);
    }
  };

  const handleAddCustomAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alarmTitle.trim()) {
      alert('الرجاء إدخال اسم المنبه.');
      return;
    }

    const newAlarm: CustomAlarm = {
      id: `alarm_${Date.now()}`,
      title: alarmTitle,
      time: alarmTime,
      days: alarmDays,
      enabled: true,
      soundType: alarmSoundType
    };

    setCustomAlarms(prev => [...prev, newAlarm]);
    setLogSuccessMessage(`تمت إضافة المنبه: "${alarmTitle}" بنجاح.`);
    
    // Reset form
    setAlarmTitle('');
    setAlarmTime('05:00');
    setAlarmDays([0, 1, 2, 3, 4, 5, 6]);
    setAlarmSoundType('beep');
    setShowAddAlarm(false);
  };

  const handleToggleAlarm = (id: string, isEnabled: boolean) => {
    setCustomAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: isEnabled } : a));
    const alarm = customAlarms.find(a => a.id === id);
    if (alarm) {
      setLogSuccessMessage(isEnabled ? `تم تفعيل منبه "${alarm.title}"` : `تم تعطيل منبه "${alarm.title}"`);
    }
  };

  const handleDeleteAlarm = (id: string, title: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المنبه "${title}"؟`)) {
      setCustomAlarms(prev => prev.filter(a => a.id !== id));
      setLogSuccessMessage(`تم حذف المنبه "${title}" بنجاح.`);
    }
  };

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
    { text: 'الصلاة خير من النوم', duration: 15, isFajrOnly: true },
    { text: 'الصلاة خير من النوم', duration: 15, isFajrOnly: true },
    { text: 'الله أكبر، الله أكبر', duration: 10 },
    { text: 'لا إله إلا الله', duration: 10 },
  ];

  const togglePlayAthan = (prayerName?: PrayerName, forcedMuezzinId?: string) => {
    const isFajr = prayerName === 'Fajr';
    const activeMuezzinId = forcedMuezzinId || (prayerName ? prayerMuezzins[prayerName] : (isFajr ? fajrMuezzin : currentMuezzin));
    const muezzin = muezzins.find(m => m.id === activeMuezzinId);
    if (!muezzin) return;

    if (isPlaying && currentPlayingPrayer === prayerName) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setCurrentPlayingPrayer(null);
      setCurrentPhraseIdx(-1);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(muezzin.url);
      audioRef.current = audio;
      const vol = prayerName ? (settings.prayerVolumes?.[prayerName] ?? audioVolume) : audioVolume;
      audio.volume = vol;
      
      audio.addEventListener('play', () => {
        setIsPlaying(true);
        setCurrentPlayingPrayer(prayerName || null);
      });

      audio.addEventListener('pause', () => {
        setIsPlaying(false);
        setCurrentPlayingPrayer(null);
        setCurrentPhraseIdx(-1);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentPlayingPrayer(null);
        setCurrentPhraseIdx(-1);
      });

      const isFajrTrack = muezzin.isFajr || isFajr;
      const activePhrases = athanPhrases.filter(p => !p.isFajrOnly || isFajrTrack);

      let accumulatedTime = 0;
      const phraseTimings = activePhrases.map(p => {
        const start = accumulatedTime;
        const end = accumulatedTime + p.duration;
        accumulatedTime += p.duration;
        return { text: p.text, start, end, isFajrOnly: p.isFajrOnly };
      });

      audio.addEventListener('timeupdate', () => {
        const time = audio.currentTime;
        const activeIdx = phraseTimings.findIndex(p => time >= p.start && time < p.end);
        setCurrentPhraseIdx(activeIdx);
      });

      if (isFajr) {
        setFajrMuezzin(activeMuezzinId);
        localStorage.setItem('salah_fajr_muezzin', activeMuezzinId);
      } else {
        setCurrentMuezzin(activeMuezzinId);
        localStorage.setItem('salah_general_muezzin', activeMuezzinId);
      }

      audio.play().catch(err => {
        if (err.name === 'AbortError') {
          console.log('[Audio] Playback was aborted or interrupted safely.');
          return;
        }
        if (err.name === 'NotAllowedError') {
          console.warn('[Audio] Autoplay blocked by browser policy. User gesture required.');
          return;
        }
        console.error('[Audio] Playback failed', err);
      });
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Track last played prayer to prevent multi-triggering within the same minute
  const [lastAutoPlayedKey, setLastAutoPlayedKey] = useState<string>(() => {
    return localStorage.getItem('salah_last_auto_played_key') || '';
  });

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const now = new Date();
  const targetDate = new Date();
  if (selectedDateOffset === -1) {
    targetDate.setDate(now.getDate() - 1);
  }
  const dateStr = targetDate.toISOString().split('T')[0];
  const hijri = getHijriDate(targetDate, settings.hijriOffset);

  const times = calculatePrayerTimes(
    targetDate,
    settings.latitude,
    settings.longitude,
    -targetDate.getTimezoneOffset() / 60,
    settings.calcMethod,
    settings.madhab,
    settings.prayerOffsets || {}
  );

  useEffect(() => {
    if (!autoPlayOnTime) return;

    // Only check and play for today (current actual date/time)
    if (selectedDateOffset !== 0) return;

    const currentStr = formatDateToTimesStr(currentTime);
    const todayStr = currentTime.toISOString().split('T')[0];

    for (const prayer of FIVE_DAILY_PRAYERS) {
      // Check if this prayer has adhan enabled in settings
      const isAdhanEnabled = settings.adhanEnabled[prayer] !== false;
      if (!isAdhanEnabled) continue;

      const prayerTime = times[prayer];
      if (prayerTime && prayerTime === currentStr) {
        const uniqueKey = `${todayStr}_${prayer}`;
        if (lastAutoPlayedKey !== uniqueKey) {
          // Play Athan automatically!
          togglePlayAthan(prayer);
          setLastAutoPlayedKey(uniqueKey);
          localStorage.setItem('salah_last_auto_played_key', uniqueKey);

          // Trigger a beautiful push notification if supported and allowed
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`حان الآن موعد صلاة ${getArabicPrayerName(prayer)}`, {
                body: `حسب توقيت مدينة ${settings.cityName || 'الإسكندرية'}. تقبل الله صلاتكم.`,
                icon: '/favicon.ico',
                dir: 'rtl'
              });
            } catch (e) {
              console.error('Notification failed', e);
            }
          }
          break;
        }
      }
    }
  }, [currentTime, autoPlayOnTime, selectedDateOffset, times, lastAutoPlayedKey, settings.cityName, settings.adhanEnabled]);

  // Check and trigger Custom Alarms
  useEffect(() => {
    const currentHour = currentTime.getHours();
    const currentMin = currentTime.getMinutes();
    const currentDay = currentTime.getDay();
    const timeKey = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
    const todayStr = currentTime.toISOString().split('T')[0];

    customAlarms.forEach(alarm => {
      if (!alarm.enabled) return;
      if (alarm.time === timeKey && alarm.days.includes(currentDay)) {
        const uniqueKey = `${alarm.id}_${todayStr}`;
        if (lastTriggeredAlarms[alarm.id] !== uniqueKey) {
          // Trigger alarm!
          // 1. Show Web Push Notification if granted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`تنبيه مخصص: ${alarm.title}`, {
                body: `حان الآن موعد: ${alarm.title} (${toArabicNumbers(alarm.time)})`,
                icon: '/favicon.ico',
                dir: 'rtl'
              });
            } catch (e) {
              console.error('Notification failed', e);
            }
          }

          // 2. Play Sound based on soundType
          if (alarm.soundType !== 'silent') {
            let soundUrl = 'https://www.islamcan.com/audio/adhan/azan3.mp3'; // Medina adhan as default
            if (alarm.soundType === 'beep') {
              soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav'; // Standard beep sound
            } else if (alarm.soundType === 'vibrate') {
              if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
              }
            }
            
            if (audioRef.current) {
              audioRef.current.pause();
            }
            
            const audio = new Audio(soundUrl);
            audioRef.current = audio;
            audio.volume = audioVolume;

            audio.addEventListener('play', () => {
              setIsPlaying(true);
              setCurrentPlayingPrayer(null); // Setting to null denotes custom alarm
            });

            audio.addEventListener('ended', () => {
              setIsPlaying(false);
            });

            audio.play().catch(e => console.error('Play alarm failed', e));
          }

          setLogSuccessMessage(`تنبيه مخصص: حان الآن موعد "${alarm.title}"`);
          setLastTriggeredAlarms(prev => ({
            ...prev,
            [alarm.id]: uniqueKey
          }));
        }
      }
    });
  }, [currentTime, customAlarms, lastTriggeredAlarms, audioVolume]);

  // Alarms and alerts state
  interface AlertConfig {
    enabled: boolean;
    minutes: number;
    days: number[]; // 0 to 6
    prayers: PrayerName[];
  }
  
  const [alerts, setAlerts] = useState<{ before: AlertConfig; after: AlertConfig; duha: { enabled: boolean; minutes: number; days: number[] } }>(() => {
    const saved = localStorage.getItem('salah_alerts');
    return saved ? JSON.parse(saved) : {
      before: { enabled: true, minutes: 10, days: [0,1,2,3,4,5,6], prayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] },
      after: { enabled: true, minutes: 15, days: [0,1,2,3,4,5,6], prayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] },
      duha: { enabled: true, minutes: 15, days: [0,1,2,3,4,5,6] }
    };
  });

  useEffect(() => {
    localStorage.setItem('salah_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Sound Modes per prayer
  type SoundMode = 'adhan' | 'beep' | 'vibrate' | 'silent';
  const [soundModes, setSoundModes] = useState<Record<string, SoundMode>>(() => {
    const saved = localStorage.getItem('salah_sound_modes');
    return saved ? JSON.parse(saved) : {
      Fajr: 'adhan',
      Sunrise: 'silent',
      Dhuhr: 'adhan',
      Asr: 'adhan',
      Maghrib: 'adhan',
      Isha: 'adhan'
    };
  });

  useEffect(() => {
    localStorage.setItem('salah_sound_modes', JSON.stringify(soundModes));
  }, [soundModes]);

  const dayLogs = prayerLogs[dateStr] || {};
  const fiveDailyPrayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  // Clear success message after 3 seconds
  useEffect(() => {
    if (logSuccessMessage) {
      const timer = setTimeout(() => setLogSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [logSuccessMessage]);

  // Record/Log a prayer status
  const handleLogPrayerStatus = (prayer: PrayerName, status: PrayerStatus) => {
    const existingLog = dayLogs[prayer] || { status: 'not_yet' as PrayerStatus, sunnahBefore: 0, sunnahAfter: 0 };
    
    // Check if transition into missed 'D' status
    const wasMissed = existingLog.status === 'D';
    const isMissed = status === 'D';

    const updatedLogs = {
      ...prayerLogs,
      [dateStr]: {
        ...dayLogs,
        [prayer]: {
          ...existingLog,
          status,
        }
      }
    };
    setPrayerLogs(updatedLogs);

    // Sync with Qada List if missed status is added or removed
    if (isMissed && !wasMissed) {
      // Add Qada item
      const alreadyPending = pendingQadaPrayers.some(
        q => q.date === dateStr && q.prayerName === prayer
      );
      if (!alreadyPending) {
        const newQada: PendingQadaPrayer = {
          id: crypto.randomUUID(),
          date: dateStr,
          hijriDate: hijri.fullString,
          prayerName: prayer
        };
        setPendingQadaPrayers(prev => [...prev, newQada]);
      }
      setLogSuccessMessage(`تم تسجيل صلاة ${getArabicPrayerName(prayer)} كفائتة وإضافتها لقائمة القضاء.`);
    } else if (!isMissed && wasMissed) {
      // Remove Qada item
      setPendingQadaPrayers(prev => prev.filter(
        q => !(q.date === dateStr && q.prayerName === prayer)
      ));
      setLogSuccessMessage(`تم تحديث صلاة ${getArabicPrayerName(prayer)} وإلغاؤها من الفوائت.`);
    } else {
      setLogSuccessMessage(`تم حفظ حالة صلاة ${getArabicPrayerName(prayer)} بنجاح.`);
    }
  };

  // Record/Log Sunnah Rak'ahs
  const handleUpdateSunnah = (prayer: PrayerName, type: 'before' | 'after', delta: number) => {
    const existingLog = dayLogs[prayer] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0 };
    const key = type === 'before' ? 'sunnahBefore' : 'sunnahAfter';
    const currentVal = existingLog[key] ?? 0;
    const newVal = Math.max(0, currentVal + delta);

    setPrayerLogs(prev => ({
      ...prev,
      [dateStr]: {
        ...dayLogs,
        [prayer]: {
          ...existingLog,
          [key]: newVal
        }
      }
    }));
  };

  // Record/Log Extra Sunnah/Nafilah (Duha, Qiyam, Witr)
  const handleUpdateNafilah = (prayerKey: 'Duha' | 'Qiyam' | 'Witr', rakahs: number) => {
    const existingLog = dayLogs[prayerKey] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0, extraRakahs: 0 };
    
    // Set status to 'A' if rakahs > 0, otherwise 'not_yet'
    const newRakahs = Math.max(0, rakahs);
    const newStatus = newRakahs > 0 ? 'A' : 'not_yet';

    setPrayerLogs(prev => ({
      ...prev,
      [dateStr]: {
        ...dayLogs,
        [prayerKey]: {
          ...existingLog,
          status: newStatus,
          extraRakahs: newRakahs
        }
      }
    }));
    
    if (newRakahs > 0) {
      setLogSuccessMessage(`تم تسجيل صلاة ${prayerKey === 'Duha' ? 'الضحى' : prayerKey === 'Qiyam' ? 'قيام الليل' : 'الشفع والوتر'} (${toArabicNumbers(newRakahs)} ركعة) بنجاح.`);
    } else {
      setLogSuccessMessage(`تم إلغاء تسجيل صلاة ${prayerKey === 'Duha' ? 'الضحى' : prayerKey === 'Qiyam' ? 'قيام الليل' : 'الشفع والوتر'}.`);
    }
  };

  // --- Qada Section Logic ---
  const qadaCounts = {
    Fajr: pendingQadaPrayers.filter(q => q.prayerName === 'Fajr').length,
    Dhuhr: pendingQadaPrayers.filter(q => q.prayerName === 'Dhuhr').length,
    Asr: pendingQadaPrayers.filter(q => q.prayerName === 'Asr').length,
    Maghrib: pendingQadaPrayers.filter(q => q.prayerName === 'Maghrib').length,
    Isha: pendingQadaPrayers.filter(q => q.prayerName === 'Isha').length,
  };
  const totalQadaCount = pendingQadaPrayers.length;

  const handleAddManualQada = (prayer: PrayerName) => {
    const newQada: PendingQadaPrayer = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      hijriDate: 'يدوي',
      prayerName: prayer
    };
    setPendingQadaPrayers(prev => [...prev, newQada]);
    setLogSuccessMessage(`أضيفت صلاة ${getArabicPrayerName(prayer)} فائتة إلى سجل الفوائت.`);
  };

  const handlePerformQada = (prayer: PrayerName) => {
    const index = pendingQadaPrayers.findIndex(q => q.prayerName === prayer);
    if (index !== -1) {
      const updated = [...pendingQadaPrayers];
      updated.splice(index, 1);
      setPendingQadaPrayers(updated);
      
      // Also log it as standard late/qada in today's logs if they did it today
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLogs = prayerLogs[todayStr] || {};
      const existingToday = todayLogs[prayer] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0 };
      
      // We don't overwrite if already done, but if they want to trace Qada, we let them know it's recorded
      setLogSuccessMessage(`تقبل الله منك! تم قضاء صلاة ${getArabicPrayerName(prayer)} بنجاح.`);
    }
  };

  const handleAddFullDayQada = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newItems: PendingQadaPrayer[] = fiveDailyPrayers.map(p => ({
      id: crypto.randomUUID(),
      date: todayStr,
      hijriDate: 'يوم كامل',
      prayerName: p
    }));
    setPendingQadaPrayers(prev => [...prev, ...newItems]);
    setLogSuccessMessage('تم إضافة يوم كامل (٥ صلوات) إلى الفوائت.');
  };

  const handleResetAllQada = () => {
    if (window.confirm('هل أنت متأكد تماماً من تصفير وإلغاء جميع الصلوات الفائتة؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      setPendingQadaPrayers([]);
      setLogSuccessMessage('تم تصفير سجل الصلوات الفائتة بالكامل.');
    }
  };

  // --- Settings Section Logic ---
  const handleUpdateOffset = (prayer: PrayerName | 'Sunrise', amount: number) => {
    const currentOffsets = settings.prayerOffsets || {
      Fajr: 0,
      Sunrise: 0,
      Dhuhr: 0,
      Asr: 0,
      Maghrib: 0,
      Isha: 0
    };
    const updatedOffsets = {
      ...currentOffsets,
      [prayer]: (currentOffsets[prayer as PrayerName] || 0) + amount
    };
    setSettings(prev => ({
      ...prev,
      prayerOffsets: updatedOffsets
    }));
  };

  const handleUpdateVolume = (prayer: string, value: number) => {
    const currentVolumes = settings.prayerVolumes || {
      Fajr: 0.8,
      Dhuhr: 0.8,
      Asr: 0.8,
      Maghrib: 0.8,
      Isha: 0.8
    };
    const updatedVolumes = {
      ...currentVolumes,
      [prayer]: value
    };
    setSettings(prev => ({
      ...prev,
      prayerVolumes: updatedVolumes
    }));
    if (isPlaying && currentPlayingPrayer === prayer && audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  // Calculate total sunnahs prayed on selected date
  const duhaRakahs = dayLogs['Duha']?.status === 'A' ? (dayLogs['Duha']?.extraRakahs || 0) : 0;
  const qiyamRakahs = dayLogs['Qiyam']?.status === 'A' ? (dayLogs['Qiyam']?.extraRakahs || 0) : 0;
  const witrRakahs = dayLogs['Witr']?.status === 'A' ? (dayLogs['Witr']?.extraRakahs || 0) : 0;

  const totalSunnahsToday = fiveDailyPrayers.reduce((sum, p) => {
    const log = dayLogs[p];
    return sum + (log?.sunnahBefore || 0) + (log?.sunnahAfter || 0);
  }, 0) + duhaRakahs + qiyamRakahs + witrRakahs;

  // Status-Specific Badges/Styling
  const getStatusBtnClass = (prayer: PrayerName, status: PrayerStatus) => {
    const currentStatus = dayLogs[prayer]?.status;
    const isSelected = currentStatus === status;

    if (status === 'A') { // In time
      return isSelected 
        ? 'bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-600 font-extrabold shadow-sm' 
        : 'bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
    if (status === 'B') { // Late / Qada
      return isSelected 
        ? 'bg-amber-500 dark:bg-amber-600 text-white border-amber-500 font-extrabold shadow-sm' 
        : 'bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
    if (status === 'D') { // Missed
      return isSelected 
        ? 'bg-rose-500 dark:bg-rose-600 text-white border-rose-500 font-extrabold shadow-sm' 
        : 'bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 border-rose-500/20';
    }
    if (status === 'E') { // Excused / Religious License
      return isSelected 
        ? 'bg-purple-600 dark:bg-purple-700 text-white border-purple-600 font-extrabold shadow-sm animate-pulse' 
        : 'bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 border-purple-500/20';
    }
    return '';
  };

  // Helper to get precise countdown ticker
  const getExactCountdown = (prayerTimes: any, now: Date) => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const prayers: { name: PrayerName; timeStr: string }[] = [
      { name: 'Fajr', timeStr: prayerTimes.Fajr },
      { name: 'Sunrise', timeStr: prayerTimes.Sunrise },
      { name: 'Dhuhr', timeStr: prayerTimes.Dhuhr },
      { name: 'Asr', timeStr: prayerTimes.Asr },
      { name: 'Maghrib', timeStr: prayerTimes.Maghrib },
      { name: 'Isha', timeStr: prayerTimes.Isha },
    ];
    
    const parsed = prayers.map(p => {
      const mins = parseTimeToMinutes(p.timeStr);
      return { ...p, mins };
    });
    
    parsed.sort((a, b) => a.mins - b.mins);
    let nextObj = parsed.find(p => p.mins > currentMinutes);
    let isTomorrow = false;
    
    if (!nextObj) {
      nextObj = parsed[0];
      isTomorrow = true;
    }
    
    const nextDate = new Date(now);
    const nextMins = nextObj.mins;
    const targetHour = Math.floor(nextMins / 60);
    const targetMin = nextMins % 60;
    
    nextDate.setHours(targetHour, targetMin, 0, 0);
    if (isTomorrow) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    
    const diffMs = nextDate.getTime() - now.getTime();
    const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
    
    const h = Math.floor(diffSecs / 3600);
    const m = Math.floor((diffSecs % 3600) / 60);
    const s = diffSecs % 60;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    const toArabic = (str: string) => str.split('').map(char => arabicDigits[parseInt(char)] ?? char).join('');
    
    const countdownStr = `${toArabic(pad(h))} : ${toArabic(pad(m))} : ${toArabic(pad(s))}`;
    
    return {
      nextPrayerName: nextObj.name,
      countdownStr,
      arabicNextName: getArabicPrayerName(nextObj.name)
    };
  };

  const renderClock = () => {
    const sec = currentTime.getSeconds();
    const min = currentTime.getMinutes();
    const hr = currentTime.getHours();

    const secDeg = sec * 6;
    const minDeg = min * 6 + sec * 0.1;
    const hrDeg = (hr % 12) * 30 + min * 0.5;

    if (clockFace === 'classic') {
      return (
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[3px] sm:border-4 border-amber-500/40 bg-[#111720] flex items-center justify-center shadow-md transition-colors">
          <span className="absolute top-1 sm:top-1.5 text-[8px] sm:text-[10px] font-black text-amber-500 font-mono">١٢</span>
          <span className="absolute right-2 sm:right-2.5 text-[8px] sm:text-[10px] font-black text-amber-500 font-mono">٣</span>
          <span className="absolute bottom-1 sm:bottom-1.5 text-[8px] sm:text-[10px] font-black text-amber-500 font-mono">٦</span>
          <span className="absolute left-2 sm:left-2.5 text-[8px] sm:text-[10px] font-black text-amber-500 font-mono">٩</span>
          
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
            <line x1="50" y1="50" x2="50" y2="28" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="18" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="12" stroke="#f97316" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
            <circle cx="50" cy="50" r="2.5" fill="#f59e0b" />
          </svg>
        </div>
      );
    }
    if (clockFace === 'islamic') {
      return (
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[3px] sm:border-4 border-emerald-600/40 bg-[#fbf8f3] flex items-center justify-center shadow-md overflow-hidden transition-colors">
          <div className="absolute inset-0 opacity-15 flex items-center justify-center">
            <svg className="w-4/5 h-4/5" viewBox="0 0 100 100" fill="none" stroke="#047857" strokeWidth="0.5">
              <circle cx="50" cy="50" r="40" />
              <polygon points="50,10 90,50 50,90 10,50" />
              <polygon points="50,10 78,78 10,50 78,22" />
              <polygon points="50,10 22,78 90,50 22,22" />
            </svg>
          </div>
          <span className="absolute top-1 sm:top-1.5 text-[8px] sm:text-[10px] font-black text-emerald-800">١٢</span>
          <span className="absolute right-2 sm:right-2.5 text-[8px] sm:text-[10px] font-black text-emerald-800">٣</span>
          <span className="absolute bottom-1 sm:bottom-1.5 text-[8px] sm:text-[10px] font-black text-emerald-800">٦</span>
          <span className="absolute left-2 sm:left-2.5 text-[8px] sm:text-[10px] font-black text-emerald-800">٩</span>
          
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
            <line x1="50" y1="50" x2="50" y2="30" stroke="#047857" strokeWidth="3" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="18" stroke="#10b981" strokeWidth="2" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="12" stroke="#d4af37" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
            <circle cx="50" cy="50" r="3" fill="#047857" />
          </svg>
        </div>
      );
    }
    if (clockFace === 'minimal') {
      return (
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm transition-colors">
          <div className="absolute top-1 sm:top-1.5 w-0.5 sm:w-1 h-1.5 sm:h-2 bg-indigo-500 rounded" />
          <div className="absolute bottom-1 sm:bottom-1.5 w-0.5 sm:w-1 h-1.5 sm:h-2 bg-indigo-500 rounded" />
          <div className="absolute right-1 sm:right-1.5 h-0.5 sm:h-1 w-1.5 sm:w-2 bg-indigo-500 rounded" />
          <div className="absolute left-1 sm:left-1.5 h-0.5 sm:h-1 w-1.5 sm:w-2 bg-indigo-500 rounded" />
          
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
            <line x1="50" y1="50" x2="50" y2="32" stroke="currentColor" className="text-slate-800 dark:text-slate-100" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="16" stroke="currentColor" className="text-slate-600 dark:text-slate-300" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="10" stroke="#a855f7" strokeWidth="0.75" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
            <circle cx="50" cy="50" r="2" fill="#a855f7" />
          </svg>
        </div>
      );
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[3px] sm:border-4 border-cyan-500/30 bg-slate-950 flex flex-col items-center justify-center shadow-md overflow-hidden transition-colors">
        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-30">
          <span className="text-xs sm:text-sm font-black font-mono text-cyan-400 tracking-wider">
            {toArabicNumbers(pad(hr % 12 || 12))}:{toArabicNumbers(pad(min))}
          </span>
        </div>

        <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
          <line x1="50" y1="50" x2="50" y2="28" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="15" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="10" stroke="#0891b2" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
          <circle cx="50" cy="50" r="2.5" fill="#22d3ee" />
        </svg>
      </div>
    );
  };

  return (
    <div id="prayer-manager-root" className="space-y-4 text-right" dir="rtl">
      
      {/* Sleek, Space-Saving Top Navigation Sub-Tabs Bar */}
      <div className="flex bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/40 dark:border-slate-700/50 overflow-x-auto scrollbar-none gap-0.5 shrink-0">
        {[
          { id: 'times', label: 'مواقيت الصلاة', icon: Clock },
          { id: 'worship', label: `سجل العبادات والفوائت ${totalQadaCount > 0 ? `(${toArabicNumbers(totalQadaCount)})` : ''}`, icon: CheckCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeSubTab === tab.id || (activeSubTab === 'settings' && tab.id === 'worship');
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-[11px] sm:text-xs font-black rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-white dark:bg-[#111720] text-indigo-600 dark:text-indigo-400 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Success Toast Message */}
      {logSuccessMessage && (
        <div className="p-3 bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse justify-center">
          <CheckCircle className="w-4.5 h-4.5 text-indigo-500" />
          <span>{logSuccessMessage}</span>
        </div>
      )}

      {/* --- SubTab: Times with ticking clock & precise countdown --- */}
      {activeSubTab === 'times' && (() => {
        const { countdownStr, arabicNextName, nextPrayerName } = getExactCountdown(times, currentTime);
        return (
          <div className="space-y-6">
            
            {/* Clock Card */}
            <div className="flex flex-col items-center bg-white dark:bg-[#161d26] rounded-3xl p-4 sm:p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 shadow-xs space-y-3">
              
              {/* City & Date Info */}
              <div className="text-center space-y-0.5">
                <div className="flex items-center justify-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
                  <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">{settings.cityName || 'سان ستيفانو'}</span>
                </div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold">
                  {currentTime.toLocaleDateString('ar-EG', { weekday: 'long' })}، {toArabicNumbers(hijri.day)} {hijri.monthName} {toArabicNumbers(hijri.year)} هـ - {toArabicNumbers(currentTime.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }))}
                </p>
              </div>

              {/* Ticking Analog Clock */}
              <div className="relative py-1 flex justify-center">
                {renderClock()}
              </div>

              {/* Clock Face Customizer Carousel */}
              <div className="space-y-1 w-full">
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black text-right block">شكل وجه الساعة:</span>
                <div className="grid grid-cols-4 gap-1 w-full">
                  {[
                    { id: 'classic', label: 'كلاسيكي داكن' },
                    { id: 'islamic', label: 'زخرفة إسلامية' },
                    { id: 'minimal', label: 'حديث بسيط' },
                    { id: 'hybrid', label: 'هجين رقمي' },
                  ].map((face) => (
                    <button
                      key={face.id}
                      type="button"
                      onClick={() => setClockFace(face.id as any)}
                      className={`py-1 px-1 text-[9px] sm:text-[10px] font-black rounded-lg transition-all border cursor-pointer text-center truncate ${
                        clockFace === face.id
                          ? 'bg-indigo-600 border-indigo-600 text-white font-black shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {face.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Countdown Ticker Card */}
              <div className="w-full bg-slate-50/50 dark:bg-[#111720]/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl p-2.5 text-center space-y-1">
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black">الوقت المتبقي لـ {arabicNextName}</span>
                <div className="flex items-center justify-center gap-1.5 text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-widest" dir="ltr">
                  <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0 animate-pulse" />
                  <span>{countdownStr}</span>
                </div>
                <p className="text-[9px] text-slate-400 font-bold">الأذان القادم في تمام الساعة {toArabicNumbers(times[nextPrayerName as PrayerName] || '')}</p>
              </div>
            </div>

            {/* List of Prayer Times with Sound Mode Switcher */}
            <div className="space-y-2">
              {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as any[]).map((pName: string) => {
                const pTime = times[pName as PrayerName];
                const isNext = pName === nextPrayerName;
                const sMode = soundModes[pName] || 'adhan';
                
                const cycleSoundMode = () => {
                  const cycle: ('adhan' | 'beep' | 'vibrate' | 'silent')[] = ['adhan', 'beep', 'vibrate', 'silent'];
                  const nextIdx = (cycle.indexOf(sMode) + 1) % cycle.length;
                  const nextMode = cycle[nextIdx];
                  setSoundModes(prev => ({ ...prev, [pName]: nextMode }));
                  
                  const arabicName = getArabicPrayerName(pName as PrayerName) || (pName === 'Sunrise' ? 'الشروق' : pName);
                  const modesText = {
                    adhan: 'الأذان الكامل',
                    beep: 'رنين التنبيه',
                    vibrate: 'الاهتزاز فقط',
                    silent: 'الوضع الصامت'
                  };
                  setLogSuccessMessage(`تم تغيير وضع تنبيه صلاة ${arabicName} إلى: ${modesText[nextMode]}`);
                };

                const getSoundIcon = () => {
                  if (sMode === 'adhan') return <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
                  if (sMode === 'beep') return <Bell className="w-3.5 h-3.5 text-amber-500" />;
                  if (sMode === 'vibrate') return <Smartphone className="w-3.5 h-3.5 text-teal-500" />;
                  return <VolumeX className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />;
                };

                const getSoundText = () => {
                  if (sMode === 'adhan') return 'أذان كامل';
                  if (sMode === 'beep') return 'تنبيه فقط';
                  if (sMode === 'vibrate') return 'اهتزاز';
                  return 'صامت';
                };

                const getShortMuezzinName = (id: string) => {
                  if (id === 'fajr_yusuf') return 'يوسف إسلام';
                  if (id === 'makkah') return 'الحرم المكي';
                  if (id === 'medina') return 'المسجد النبوي';
                  if (id === 'aqsa') return 'المسجد الأقصى';
                  return id;
                };

                return (
                  <div 
                    key={pName}
                    className={`bg-white dark:bg-[#161d26] rounded-xl p-3 border transition-all duration-300 flex flex-col gap-2 ${
                      isNext 
                        ? 'border-indigo-500 ring-1 ring-indigo-500/10 shadow-sm bg-indigo-500/5' 
                        : 'border-[#e2e8f0]/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    {/* Row 1: Info & Sound Settings */}
                    <div className="flex items-center justify-between w-full">
                      {/* Right side: Dot, Name, Badge */}
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isNext ? 'bg-indigo-600 dark:bg-indigo-400 animate-ping' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <span className={`text-xs sm:text-sm font-black flex items-center gap-1.5 ${isNext ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-800 dark:text-white'}`}>
                          {getArabicPrayerName(pName as PrayerName) || (pName === 'Sunrise' ? 'الشروق' : pName)}
                          {isNext && (
                            <span className="text-[8px] sm:text-[9px] bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-1 py-0.5 rounded-md font-bold">
                              القادمة
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Left side: Time, Sound Mode, and Play Test */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black font-mono text-slate-800 dark:text-slate-200">
                          {toArabicNumbers(pTime)}
                        </span>

                        {/* Sound Mode Selector Button */}
                        <button
                          type="button"
                          onClick={cycleSoundMode}
                          className="py-1 px-1.5 sm:px-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-all border border-slate-100 dark:border-slate-800/40 cursor-pointer flex items-center gap-1 justify-center min-w-[65px] sm:min-w-[75px]"
                          title="اضغط لتغيير وضع الصوت والتنبيه"
                        >
                          {getSoundIcon()}
                          <span className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-400">{getSoundText()}</span>
                        </button>

                        {/* Play Test Button for Adhan */}
                        {pName !== 'Sunrise' && (
                          <button
                            type="button"
                            onClick={() => togglePlayAthan(pName as PrayerName)}
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                              isPlaying && currentPlayingPrayer === pName
                                ? 'bg-rose-500 text-white animate-pulse shadow-md'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                            }`}
                            title={isPlaying && currentPlayingPrayer === pName ? "إيقاف سماع الأذان" : "تجربة سماع الأذان"}
                          >
                            {isPlaying && currentPlayingPrayer === pName ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3 fill-current" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                     {/* Row 2: Settings & Adjustments */}
                     <div className="border-t border-slate-100 dark:border-slate-800/30 pt-2.5 mt-1 flex flex-col gap-2">
                       {/* First sub-row: Offset & Muezzin */}
                       <div className="flex items-center gap-2">
                         {/* Offset Adjuster (الضبط لأقرب مسجد) */}
                         <div className={`flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40 px-2 py-1 rounded-xl border border-slate-100 dark:border-slate-800/40 text-right ${pName === 'Sunrise' ? 'w-full' : 'flex-1'}`} title="الضبط لأقرب مسجد">
                           <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-extrabold ml-1.5 shrink-0">المسجد:</span>
                           <div className="flex items-center gap-1">
                             <button
                               type="button"
                               onClick={() => {
                                 handleUpdateOffset(pName as PrayerName, -1);
                                 setLogSuccessMessage(`تم تقليل وقت صلاة ${getArabicPrayerName(pName as PrayerName) || 'الشروق'} بمقدار دقيقة واحدة`);
                               }}
                               className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-slate-200/40 dark:border-slate-700/40 w-5.5 h-5.5 bg-white dark:bg-slate-800 shadow-3xs"
                               title="تأخير دقيقة"
                             >
                               <Minus className="w-2.5 h-2.5" />
                             </button>
                             
                             <span className="text-xs font-mono font-black text-slate-700 dark:text-slate-200 min-w-[24px] text-center">
                               {toArabicNumbers(((settings.prayerOffsets || {})[pName as PrayerName] || 0) > 0 ? `+${(settings.prayerOffsets || {})[pName as PrayerName]}` : `${(settings.prayerOffsets || {})[pName as PrayerName] || 0}`)} د
                             </span>
 
                             <button
                               type="button"
                               onClick={() => {
                                 handleUpdateOffset(pName as PrayerName, 1);
                                 setLogSuccessMessage(`تم تقديم وقت صلاة ${getArabicPrayerName(pName as PrayerName) || 'الشروق'} بمقدار دقيقة واحدة`);
                               }}
                               className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-slate-200/40 dark:border-slate-700/40 w-5.5 h-5.5 bg-white dark:bg-slate-800 shadow-3xs"
                               title="تقديم دقيقة"
                             >
                               <Plus className="w-2.5 h-2.5" />
                             </button>
                           </div>
                         </div>
 
                         {/* Muezzin Selector */}
                         {pName !== 'Sunrise' && (
                           <div className="flex-1 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-800/40 min-w-0">
                             <div className="flex items-center gap-1.5 min-w-0 w-full">
                               <Music className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                               <select
                                 value={prayerMuezzins[pName] || (pName === 'Fajr' ? fajrMuezzin : currentMuezzin)}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   setPrayerMuezzins(prev => ({ ...prev, [pName]: val }));
                                   localStorage.setItem(`salah_muezzin_${pName}`, val);
                                   if (pName === 'Fajr') {
                                     setFajrMuezzin(val);
                                     localStorage.setItem('salah_fajr_muezzin', val);
                                   } else {
                                     setCurrentMuezzin(val);
                                     localStorage.setItem('salah_general_muezzin', val);
                                   }
                                   setLogSuccessMessage(`تم تحديد المؤذن لصلاة ${getArabicPrayerName(pName as PrayerName)}`);
                                 }}
                                 className="bg-transparent text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer border-none p-0 pr-1 ml-0.5 min-w-0 flex-1 appearance-none"
                               >
                                 {muezzins.map((m) => (
                                   <option key={m.id} value={m.id} className="dark:bg-[#161d26] text-slate-800 dark:text-slate-200">
                                     {getShortMuezzinName(m.id)}
                                   </option>
                                 ))}
                               </select>
                             </div>
                           </div>
                         )}
                       </div>
 
                       {/* Second sub-row: Per-Prayer Volume Slider */}
                       {pName !== 'Sunrise' && (
                         <div className="flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40 px-2.5 py-1.5 rounded-xl border border-slate-100/40 dark:border-slate-800/40">
                           <div className="flex items-center gap-2 flex-1">
                             <Volume2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                             <input
                               type="range"
                               min="0"
                               max="1"
                               step="0.05"
                               value={settings.prayerVolumes?.[pName] ?? audioVolume}
                               onChange={(e) => {
                                 const val = parseFloat(e.target.value);
                                 handleUpdateVolume(pName, val);
                               }}
                               className="flex-1 h-1.5 accent-emerald-600 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                               title="حجم صوت الأذان لهذه الصلاة"
                             />
                           </div>
                           <span className="text-[10px] sm:text-xs font-mono text-slate-500 dark:text-slate-400 font-bold mr-3 min-w-[32px] text-left">
                             {toArabicNumbers(Math.round((settings.prayerVolumes?.[pName] ?? audioVolume) * 100))}%
                           </span>
                         </div>
                       )}
                     </div>
                  </div>
                );
              })}
            </div>

            {/* Integrated Calculation Method & Madhab Selector Card */}
            <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 shadow-xs space-y-4 text-right">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white">طريقة حساب المواقيت والمذهب الفقهي</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">تطبيق فوري على أوقات الفريضة الظاهرة أعلاه</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Calculation Method Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-450 dark:text-slate-500 font-black block">طريقة حساب مواقيت الصلاة:</label>
                  <select
                    value={settings.calcMethod}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettings(prev => ({ ...prev, calcMethod: val }));
                      setLogSuccessMessage('تم تطبيق طريقة الحساب الجديدة وإعادة حساب المواقيت فورا.');
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Egypt">الهيئة المصرية العامة للمساحة (مصر، السودان، الأردن)</option>
                    <option value="UmmAlQura">جامعة أم القرى - مكة المكرمة (المملكة العربية السعودية)</option>
                    <option value="MWL">رابطة العالم الإسلامي (أوروبا، أمريكا، بعض الدول العربية)</option>
                    <option value="ISNA">الجمعية الإسلامية لأمريكا الشمالية - ISNA (الولايات المتحدة وكندا)</option>
                    <option value="Karachi">جامعة العلوم الإسلامية بكراتشي (باكستان، الهند، بنغلاديش)</option>
                    <option value="Gulf">دبي ومنطقة الخليج العربي (الإمارات العربية المتحدة، الخليج)</option>
                  </select>
                </div>

                {/* Madhab Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-450 dark:text-slate-500 font-black block">المذهب الفقهي لصلاة العصر:</label>
                  <select
                    value={settings.madhab}
                    onChange={(e) => {
                      const val = e.target.value as 'standard' | 'hanafi';
                      setSettings(prev => ({ ...prev, madhab: val }));
                      setLogSuccessMessage('تم تطبيق المذهب الجديد لصلاة العصر وإعادة حساب المواقيت فورا.');
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="standard">جمهور الفقهاء - الشافعي، المالكي، الحنبلي (يبدأ العصر بظل مثل واحد)</option>
                    <option value="hanafi">المذهب الحنفي (يبدأ العصر بظل مثلين)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Holy Cities & Al-Aqsa Card */}
            <div className="bg-white dark:bg-[#161d26] rounded-3xl border border-[#e2e8f0]/80 dark:border-slate-800/80 shadow-xs p-5 transition-all duration-300 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <Compass className="w-5 h-5 text-indigo-500 animate-spin-slow" />
                <div className="text-right">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white">مواقيت الحرمين الشريفين والمسجد الأقصى</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">مواقيت الصلاة والعد التنازلي المباشر لأقدس بقاع الأرض</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { id: 'makkah', arabicName: 'مكة المكرمة', country: 'السعودية', lat: 21.4225, lng: 39.8262, desc: 'المسجد الحرام، كعبة المسلمين' },
                  { id: 'medina', arabicName: 'المدينة المنورة', country: 'السعودية', lat: 24.4673, lng: 39.6112, desc: 'المسجد النبوي الشريف' },
                  { id: 'quds', arabicName: 'القدس الشريف', country: 'فلسطين', lat: 31.7683, lng: 35.2137, desc: 'المسجد الأقصى المبارك' },
                  { id: 'cairo', arabicName: 'القاهرة', country: 'مصر', lat: 30.0444, lng: 31.2357, desc: 'جامع الأزهر الشريف' },
                ].map((city) => {
                  const cityTimes = calculatePrayerTimes(
                    targetDate,
                    city.lat,
                    city.lng,
                    3, // UTC+3 as default approximation for these holy areas
                    settings.calcMethod,
                    settings.madhab,
                    {}
                  );
                  const countdownInfo = getExactCountdown(cityTimes, currentTime);

                  return (
                    <div key={city.id} className="bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl p-3 border border-slate-100/50 dark:border-slate-800/40 space-y-2 text-right">
                      <div className="flex justify-between items-start gap-1">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-xs font-black text-slate-800 dark:text-white">{city.arabicName}</span>
                            <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 py-0.5 px-1.5 rounded-md font-bold">{city.country}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none">{city.desc}</p>
                        </div>
                        <div className="text-left leading-tight shrink-0">
                          <span className="text-[8px] text-slate-400 font-bold block">القادم: {countdownInfo.arabicNextName}</span>
                          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">+ {countdownInfo.countdownStr}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-1 pt-1.5 border-t border-slate-100/50 dark:border-slate-800/30 text-center">
                        {[
                          { key: 'Fajr', label: 'الفجر' },
                          { key: 'Dhuhr', label: new Date().getDay() === 5 ? 'الجمعة' : 'الظهر' },
                          { key: 'Asr', label: 'العصر' },
                          { key: 'Maghrib', label: 'المغرب' },
                          { key: 'Isha', label: 'العشاء' }
                        ].map((p) => (
                          <div key={p.key} className="bg-white dark:bg-slate-950/20 rounded-lg py-1 border border-slate-100/30">
                            <span className="text-[8px] text-slate-400 block font-bold">{p.label}</span>
                            <span className="text-[9px] text-slate-700 dark:text-slate-300 font-mono font-black">{toArabicNumbers(cityTimes[p.key as PrayerName] || '')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        );
      })()}

      {/* --- SubTab: Worship & Missed Prayers (سجل العبادات والفوائت) --- */}
      {activeSubTab === 'worship' && (
        <div className="space-y-6">
          {/* Internal sub-navigation for worship */}
          <div className="flex bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/20 dark:border-slate-700/30 gap-1">
            <button
              type="button"
              onClick={() => setWorshipTab('today')}
              className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                worshipTab === 'today'
                  ? 'bg-white dark:bg-[#111720] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 font-bold'
              }`}
            >
              <span>صلوات اليوم والسنن والرواتب</span>
            </button>
            <button
              type="button"
              onClick={() => setWorshipTab('qada')}
              className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                worshipTab === 'qada'
                  ? 'bg-white dark:bg-[#111720] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 font-bold'
              }`}
            >
              <span>قضاء الفوائت والصلوات الفائتة</span>
              {totalQadaCount > 0 && (
                <span className="bg-rose-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full">
                  {toArabicNumbers(totalQadaCount)}
                </span>
              )}
            </button>
          </div>

          {worshipTab === 'today' && (
        <div className="space-y-6">
          {/* Day Offset Selector */}
          <div className="bg-white dark:bg-[#161d26] p-4 rounded-3xl border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 flex justify-between items-center shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">تاريخ التسجيل الحالي:</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  {hijri.fullString}
                </span>
              </div>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => setSelectedDateOffset(0)}
                className={`py-1.5 px-4 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  selectedDateOffset === 0
                    ? 'bg-white dark:bg-[#111720] text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => setSelectedDateOffset(-1)}
                className={`py-1.5 px-4 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  selectedDateOffset === -1
                    ? 'bg-white dark:bg-[#111720] text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                الأمس
              </button>
            </div>
          </div>

          {/* Hadith Quote Card */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-500/10 dark:border-amber-500/20 p-4 rounded-3xl space-y-2 text-right">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 animate-spin-slow" />
              <span className="text-xs font-black text-amber-800 dark:text-amber-400">فضل الرواتب والسنن:</span>
            </div>
            <p className="text-[11px] text-amber-700/90 dark:text-amber-400/80 leading-relaxed font-semibold">
              قال رسول الله ﷺ: «مَنْ صَلَّى فِي يَوْمٍ وَلَيْلَةٍ ثِنْتَيْ عَشْرَةَ رَكْعَةً بُنِيَ لَهُ بَيْتٌ فِي الْجَنَّةِ» [رواه مسلم].
            </p>
            <div className="flex justify-between items-center pt-2 border-t border-amber-500/10 text-[10px] text-slate-500 dark:text-slate-400 font-extrabold">
              <span>سنن الرواتب التي صليتها اليوم:</span>
              <span className="text-amber-600 dark:text-amber-400 font-black bg-amber-500/10 px-2 py-0.5 rounded-full">
                {toArabicNumbers(totalSunnahsToday)} / ١٢ ركعة
              </span>
            </div>
          </div>

          {/* Interactive Player Live Subtitles Lyric Subcard */}
          {isPlaying && currentPhraseIdx !== -1 && (
            <div className="bg-slate-50/80 dark:bg-slate-900/40 p-4 rounded-3xl border border-dashed border-emerald-500/20 text-center space-y-1 animate-pulse">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 block">يردد المذياع الآن:</span>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {athanPhrases.filter(p => !p.isFajrOnly || currentPlayingPrayer === 'Fajr')[currentPhraseIdx]?.text}
              </p>
            </div>
          )}

          {/* Interactive Prayer Cards List */}
          <div className="space-y-4">
            {/* 1. Fajr Prayer */}
            {(() => {
              const prayer = 'Fajr';
              const log = dayLogs[prayer] || { status: 'not_yet' as PrayerStatus, sunnahBefore: 0, sunnahAfter: 0 };
              const status = log.status || 'not_yet';
              const timeStr = times[prayer];
              const currentSunnahBefore = log.sunnahBefore || 0;

              return (
                <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                      <h4 className="text-sm font-black text-slate-800 dark:text-white">
                        صلاة {getArabicPrayerName(prayer)}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/40 py-1 px-2.5 rounded-xl">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{toArabicNumbers(timeStr)}</span>
                    </div>
                  </div>

                  {/* Fard Status */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">حالة الفريضة:</span>
                    <div className={`grid ${settings.gender === 'female' ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
                      <button
                        type="button"
                        onClick={() => handleLogPrayerStatus(prayer, 'A')}
                        className={`py-2 px-1 text-center text-[11px] font-black rounded-2xl border cursor-pointer transition-all ${getStatusBtnClass(prayer, 'A')}`}
                      >
                        في وقتها
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLogPrayerStatus(prayer, 'B')}
                        className={`py-2 px-1 text-center text-[11px] font-black rounded-2xl border cursor-pointer transition-all ${getStatusBtnClass(prayer, 'B')}`}
                      >
                        متأخرة / قضاء
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLogPrayerStatus(prayer, 'D')}
                        className={`py-2 px-1 text-center text-[11px] font-black rounded-2xl border cursor-pointer transition-all ${getStatusBtnClass(prayer, 'D')}`}
                      >
                        فائتة
                      </button>
                      {settings.gender === 'female' && (
                        <button
                          type="button"
                          onClick={() => handleLogPrayerStatus(prayer, 'E')}
                          className={`py-2 px-1 text-center text-[11px] font-black rounded-2xl border cursor-pointer transition-all ${getStatusBtnClass(prayer, 'E')}`}
                        >
                          عذر شرعي 🌸
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sunnah Before */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 space-y-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">السنن التابعة:</span>
                    <div className="flex justify-between items-center bg-slate-50/50 dark:bg-[#111720]/40 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">سنة قبلية (ركعتان)</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleUpdateSunnah(prayer, 'before', -2)}
                          disabled={currentSunnahBefore <= 0}
                          className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-40"
                        >
                          <Minus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        </button>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-white font-mono min-w-10 text-center">
                          {toArabicNumbers(currentSunnahBefore)} / ٢ ركعات
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateSunnah(prayer, 'before', 2)}
                          disabled={currentSunnahBefore >= 2}
                          className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 2. Duha Prayer (Sunnah) - Styled with Amber/Gold Accent Background */}
            {(() => {
              const duhaLog = dayLogs['Duha'] || { status: 'not_yet', extraRakahs: 0 };
              const currentDuhaRakahs = duhaLog.status === 'A' ? (duhaLog.extraRakahs || 0) : 0;

              return (
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-500/20 dark:border-amber-500/30 rounded-3xl p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">☀️</span>
                      <div className="text-right">
                        <h4 className="text-sm font-black text-amber-800 dark:text-amber-400">
                          صلاة الضحى (سنة مؤكدة)
                        </h4>
                        <span className="text-[9px] text-amber-600 dark:text-amber-500 font-extrabold block">
                          {currentDuhaRakahs > 0 ? `تمت صلاة ${toArabicNumbers(currentDuhaRakahs)} ركعات الحمد لله` : 'صلاة الأوابين - من ركعتين إلى ثمان ركعات'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Direct Custom Increment/Decrement */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-amber-500/15" dir="ltr">
                      <button
                        type="button"
                        onClick={() => handleUpdateNafilah('Duha', Math.max(0, currentDuhaRakahs - 2))}
                        disabled={currentDuhaRakahs <= 0}
                        className="w-6 h-6 rounded-lg text-xs font-black bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-40 cursor-pointer text-slate-800 dark:text-white"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-black text-amber-700 dark:text-amber-400 min-w-[32px] text-center">
                        {toArabicNumbers(currentDuhaRakahs)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateNafilah('Duha', currentDuhaRakahs === 0 ? 2 : Math.min(12, currentDuhaRakahs + 2))}
                        disabled={currentDuhaRakahs >= 12}
                        className="w-6 h-6 rounded-lg text-xs font-black bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-40 cursor-pointer text-slate-800 dark:text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Predefined Quick Pill Selectors */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2, 4, 6, 8].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleUpdateNafilah('Duha', currentDuhaRakahs === r ? 0 : r)}
                        className={`py-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer ${
                          currentDuhaRakahs === r
                            ? 'bg-amber-500 text-white border-amber-500 font-black shadow-xs'
                            : 'bg-white/80 dark:bg-slate-800/50 border-amber-500/10 dark:border-amber-500/5 text-amber-700 dark:text-amber-400/80 hover:bg-amber-500/5'
                        }`}
                      >
                        {toArabicNumbers(r)} {r === 2 ? 'ركعتان' : 'ركعات'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Fard Prayers (Dhuhr, Asr, Maghrib, Isha) */}
            {['Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayerName) => {
              const prayer = prayerName as PrayerName;
              const log = dayLogs[prayer] || { status: 'not_yet' as PrayerStatus, sunnahBefore: 0, sunnahAfter: 0 };
              const status = log.status || 'not_yet';
              const timeStr = times[prayer];

              const hasSunnahBefore = prayer === 'Dhuhr';
              const hasSunnahAfter = prayer === 'Dhuhr' || prayer === 'Maghrib' || prayer === 'Isha';
              const sunnahBeforeMax = prayer === 'Dhuhr' ? 4 : 2;
              const sunnahAfterMax = 2;

              const currentSunnahBefore = log.sunnahBefore || 0;
              const currentSunnahAfter = log.sunnahAfter || 0;

              return (
                <div 
                  key={prayer}
                  className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 shadow-xs space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <h4 className="text-sm font-black text-slate-800 dark:text-white">
                        صلاة {getArabicPrayerName(prayer)}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/40 py-1 px-2.5 rounded-xl">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{toArabicNumbers(timeStr)}</span>
                    </div>
                  </div>

                  {/* Fard Status */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">حالة الفريضة:</span>
                    <div className={`grid ${settings.gender === 'female' ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
                      <button
                        type="button"
                        onClick={() => handleLogPrayerStatus(prayer, 'A')}
                        className={`py-2 px-1 text-center text-[11px] font-black rounded-2xl border cursor-pointer transition-all ${getStatusBtnClass(prayer, 'A')}`}
                      >
                        في وقتها
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLogPrayerStatus(prayer, 'B')}
                        className={`py-2 px-1 text-center text-[11px] font-black rounded-2xl border cursor-pointer transition-all ${getStatusBtnClass(prayer, 'B')}`}
                      >
                        متأخرة / قضاء
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLogPrayerStatus(prayer, 'D')}
                        className={`py-2 px-1 text-center text-[11px] font-black rounded-2xl border cursor-pointer transition-all ${getStatusBtnClass(prayer, 'D')}`}
                      >
                        فائتة
                      </button>
                      {settings.gender === 'female' && (
                        <button
                          type="button"
                          onClick={() => handleLogPrayerStatus(prayer, 'E')}
                          className={`py-2 px-1 text-center text-[11px] font-black rounded-2xl border cursor-pointer transition-all ${getStatusBtnClass(prayer, 'E')}`}
                        >
                          عذر شرعي 🌸
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sunnah Rowatib */}
                  {(hasSunnahBefore || hasSunnahAfter) && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 space-y-2.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">السنن والرواتب التابعة:</span>
                      
                      <div className="flex flex-col gap-2">
                        {/* Sunnah Before */}
                        {hasSunnahBefore && (
                          <div className="flex justify-between items-center bg-slate-50/50 dark:bg-[#111720]/40 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">سنة قبلية (٤ ركعات)</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleUpdateSunnah(prayer, 'before', -2)}
                                disabled={currentSunnahBefore <= 0}
                                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-40"
                              >
                                <Minus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              </button>
                              <span className="text-xs font-extrabold text-slate-800 dark:text-white font-mono min-w-10 text-center">
                                {toArabicNumbers(currentSunnahBefore)} / ٤ ركعات
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateSunnah(prayer, 'before', 2)}
                                disabled={currentSunnahBefore >= sunnahBeforeMax}
                                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer disabled:opacity-40"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Sunnah After */}
                        {hasSunnahAfter && (
                          <div className="flex justify-between items-center bg-slate-50/50 dark:bg-[#111720]/40 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">سنة بعدية (ركعتان)</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleUpdateSunnah(prayer, 'after', -2)}
                                disabled={currentSunnahAfter <= 0}
                                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-40"
                              >
                                <Minus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              </button>
                              <span className="text-xs font-extrabold text-slate-800 dark:text-white font-mono min-w-10 text-center">
                                {toArabicNumbers(currentSunnahAfter)} / ٢ ركعات
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateSunnah(prayer, 'after', 2)}
                                disabled={currentSunnahAfter >= sunnahAfterMax}
                                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer disabled:opacity-40"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 3. Qiyam al-Layl (Nafilah) - Styled with Deep Velvet Indigo Gradient Accent Background */}
            {(() => {
              const qiyamLog = dayLogs['Qiyam'] || { status: 'not_yet', extraRakahs: 0 };
              const currentQiyamRakahs = qiyamLog.status === 'A' ? (qiyamLog.extraRakahs || 0) : 0;

              return (
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 dark:from-indigo-950/20 dark:to-[#1e1233]/20 border border-indigo-500/20 dark:border-indigo-500/30 rounded-3xl p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌃</span>
                      <div className="text-right">
                        <h4 className="text-sm font-black text-indigo-800 dark:text-indigo-400">
                          صلاة قيام الليل والتهجد
                        </h4>
                        <span className="text-[9px] text-indigo-600 dark:text-indigo-500 font-extrabold block">
                          {currentQiyamRakahs > 0 ? `تم تسجيل صلاة قيام الليل ${toArabicNumbers(currentQiyamRakahs)} ركعة` : 'صلاة الليل والتهجد - مثنى مثنى'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Direct Custom Increment/Decrement */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-indigo-500/15" dir="ltr">
                      <button
                        type="button"
                        onClick={() => handleUpdateNafilah('Qiyam', Math.max(0, currentQiyamRakahs - 2))}
                        disabled={currentQiyamRakahs <= 0}
                        className="w-6 h-6 rounded-lg text-xs font-black bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-40 cursor-pointer text-slate-800 dark:text-white"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-black text-indigo-700 dark:text-indigo-400 min-w-[32px] text-center">
                        {toArabicNumbers(currentQiyamRakahs)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateNafilah('Qiyam', currentQiyamRakahs === 0 ? 2 : Math.min(40, currentQiyamRakahs + 2))}
                        disabled={currentQiyamRakahs >= 40}
                        className="w-6 h-6 rounded-lg text-xs font-black bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-40 cursor-pointer text-slate-800 dark:text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Predefined Quick Pill Selectors */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2, 4, 8, 11].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleUpdateNafilah('Qiyam', currentQiyamRakahs === r ? 0 : r)}
                        className={`py-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer ${
                          currentQiyamRakahs === r
                            ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-xs'
                            : 'bg-white/80 dark:bg-slate-800/50 border-indigo-500/10 dark:border-indigo-500/5 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/5'
                        }`}
                      >
                        {toArabicNumbers(r)} {r === 2 ? 'ركعتان' : 'ركعات'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 4. Shaf' & Witr (Nafilah) - Styled with Purple/Violet Accent Background */}
            {(() => {
              const witrLog = dayLogs['Witr'] || { status: 'not_yet', extraRakahs: 0 };
              const currentWitrRakahs = witrLog.status === 'A' ? (witrLog.extraRakahs || 0) : 0;

              return (
                <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/5 dark:from-purple-950/20 dark:to-indigo-950/10 border border-purple-500/20 dark:border-purple-500/30 rounded-3xl p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌟</span>
                      <div className="text-right">
                        <h4 className="text-sm font-black text-purple-800 dark:text-purple-400">
                          صلاة الشفع والوتر
                        </h4>
                        <span className="text-[9px] text-purple-600 dark:text-purple-500 font-extrabold block">
                          {currentWitrRakahs > 0 ? `تم تسجيل الوتر ${toArabicNumbers(currentWitrRakahs)} ركعة الحمد لله` : 'خاتمة صلاة الليل والتهجد - ركعات وترية'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Direct Custom Increment/Decrement */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-purple-500/15" dir="ltr">
                      <button
                        type="button"
                        onClick={() => handleUpdateNafilah('Witr', currentWitrRakahs <= 1 ? 0 : currentWitrRakahs - 2)}
                        disabled={currentWitrRakahs <= 0}
                        className="w-6 h-6 rounded-lg text-xs font-black bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-40 cursor-pointer text-slate-800 dark:text-white"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-black text-purple-700 dark:text-purple-400 min-w-[32px] text-center">
                        {toArabicNumbers(currentWitrRakahs)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateNafilah('Witr', currentWitrRakahs === 0 ? 1 : Math.min(15, currentWitrRakahs + 2))}
                        disabled={currentWitrRakahs >= 15}
                        className="w-6 h-6 rounded-lg text-xs font-black bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-40 cursor-pointer text-slate-800 dark:text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Predefined Quick Pill Selectors */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 3, 5, 7].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleUpdateNafilah('Witr', currentWitrRakahs === r ? 0 : r)}
                        className={`py-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer ${
                          currentWitrRakahs === r
                            ? 'bg-purple-600 text-white border-purple-600 font-black shadow-xs'
                            : 'bg-white/80 dark:bg-slate-800/50 border-purple-500/10 dark:border-purple-500/5 text-purple-700 dark:text-purple-400 hover:bg-purple-500/5'
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
      )}

      {/* --- SubTab 2: Qada Missed Prayers --- */}
      {worshipTab === 'qada' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="bg-white dark:bg-[#161d26] p-5 rounded-3xl border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 space-y-3.5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800 dark:text-white">جدول قضاء الصلوات الفائتة</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  قال النبي ﷺ: «مَنْ نَسِيَ صَلَاةً أَوْ نَامَ عَنْهَا فَكَفَّارَتُهَا أَنْ يُصَلِّيَهَا إِذَا ذَكَرَهَا» [متفق عليه].
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">مجموع الصلوات الفائتة:</span>
                <span className="text-xl font-black text-rose-500 dark:text-rose-400">
                  {toArabicNumbers(totalQadaCount)} صلاة
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddFullDayQada}
                  className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[11px] rounded-xl cursor-pointer transition-colors"
                >
                  + إضافة يوم كامل
                </button>
                {totalQadaCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAllQada}
                    className="p-2 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10 rounded-xl cursor-pointer transition-colors"
                    title="تصفير الصلوات"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Missed Counter Cards */}
          <div className="space-y-4">
            {fiveDailyPrayers.map((prayer) => {
              const count = qadaCounts[prayer];

              return (
                <div 
                  key={prayer}
                  className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 shadow-xs flex justify-between items-center"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-800 dark:text-white">
                      صلاة {getArabicPrayerName(prayer)} الفائتة
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">العدد المتبقي في ذمتك</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Count display */}
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#111720]/50 border border-slate-100 dark:border-slate-800/40 flex items-center justify-center font-black text-lg text-slate-800 dark:text-white font-mono">
                      {toArabicNumbers(count)}
                    </div>

                    {/* Increment / Decrement buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handlePerformQada(prayer)}
                        disabled={count <= 0}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تم القضاء</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddManualQada(prayer)}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer transition-colors"
                        title="أضف صلاة فائتة"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Spiritual Encouragement */}
          <div className="p-4 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-3xl border border-emerald-500/10 dark:border-emerald-500/20 text-center text-xs font-semibold text-emerald-800 dark:text-emerald-400 leading-relaxed">
            🌿 "أحب الأعمال إلى الله أدومها وإن قل"، واصل قضاء صلواتك الفائتة بانتظام، صلاةً بصلاة مع كل فريضة يومية، وبإذن الله تبرأ ذمتك وتطمئن روحك.
          </div>
        </div>
      )}
        </div>
      )}

      {/* --- SubTab 3: Integrated into Dedicated Settings Screens in the Sidebar --- */}
      {false && (
        <div className="space-y-6 animate-fade-in text-right">
          
          {/* General Audio Settings Card */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h4 className="text-sm font-black text-slate-800 dark:text-white">الأذان التلقائي ومستوى الصوت العام</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">التحكم في تشغيل الأذان التلقائي بالخلفية ومستوى الصوت العام للمنبهات</p>
              </div>
            </div>

            <div className="space-y-4">

                  {/* Volume Slider */}
                  <div className="p-3 bg-slate-50/50 dark:bg-[#111720]/20 rounded-2xl border border-slate-100/50 dark:border-slate-800/30 space-y-3.5">
                    <div className="space-y-1.5 text-right">
                      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span>مستوى صوت الأذان والتنبيهات</span>
                        <span className="font-mono">{toArabicNumbers(Math.round(audioVolume * 100))}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={audioVolume}
                        onChange={(e) => {
                          const vol = parseFloat(e.target.value);
                          setAudioVolume(vol);
                          localStorage.setItem('salah_audio_volume', vol.toString());
                          if (audioRef.current) {
                            audioRef.current.volume = vol;
                          }
                        }}
                        className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Auto-play Athan switch */}
                  <div className="flex justify-between items-center p-3.5 bg-slate-50/50 dark:bg-[#111720]/20 rounded-2xl border border-slate-100/50 dark:border-slate-800/30">
                    <div className="space-y-0.5 text-right">
                      <span className="text-xs font-black text-slate-800 dark:text-white block">تشغيل الأذان تلقائياً في الخلفية</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">تشغيل الأذان الكامل وإرسال تنبيه للمتصفح عند دخول وقت الصلاة تلقائياً</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !autoPlayOnTime;
                        setAutoPlayOnTime(nextVal);
                        localStorage.setItem('salah_auto_play_athan', nextVal ? 'true' : 'false');
                        if (nextVal) {
                          requestNotificationPermission();
                          setLogSuccessMessage('تم تفعيل تشغيل الأذان تلقائياً عند دخول الوقت.');
                        } else {
                          setLogSuccessMessage('تم إيقاف تشغيل الأذان تلقائياً.');
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        autoPlayOnTime ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          autoPlayOnTime ? '-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Muezzin Section */}
              <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <div className="text-right">
                    <h4 className="text-sm font-black text-slate-800 dark:text-white">إضافة صوت أو مؤذن مخصص</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">أضف أصوات أذان خاصة بك من روابط ويب أو ملفات محلية</p>
                  </div>
                </div>

                <form onSubmit={handleAddCustomMuezzin} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5 text-right">
                      <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black block">اسم المؤذن / الصوت:</label>
                      <input
                        type="text"
                        value={newMuezzinName}
                        onChange={(e) => setNewMuezzinName(e.target.value)}
                        placeholder="مثال: أذان الحرم المدني بصوت الشيخ..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Sound Type Toggle */}
                    <div className="space-y-1.5 text-right flex flex-col justify-end">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black block mb-2">نوع الصوت:</span>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={newMuezzinIsFajr}
                          onChange={(e) => setNewMuezzinIsFajr(e.target.checked)}
                          className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">هذا صوت خاص بأذان الفجر (يحتوي على التثويب)</span>
                      </label>
                    </div>
                  </div>

                  {/* Source Type Selector */}
                  <div className="flex gap-4 border-t border-b border-slate-50 dark:border-slate-800/40 py-3">
                    <button
                      type="button"
                      onClick={() => { setMuezzinSourceType('url'); setNewMuezzinUrl(''); setUploadFileName(''); }}
                      className={`flex-1 py-2 text-center text-xs font-bold rounded-xl cursor-pointer border transition-all ${muezzinSourceType === 'url' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-black' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                    >
                      إدخال رابط ويب مباشر (URL)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMuezzinSourceType('file'); setNewMuezzinUrl(''); setUploadFileName(''); }}
                      className={`flex-1 py-2 text-center text-xs font-bold rounded-xl cursor-pointer border transition-all ${muezzinSourceType === 'file' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-black' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                    >
                      رفع ملف صوتي من الجهاز (MP3)
                    </button>
                  </div>

                  {/* Input Based on Source Type */}
                  {muezzinSourceType === 'url' ? (
                    <div className="space-y-1.5 text-right">
                      <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black block">رابط الملف الصوتي المباشر (MP3):</label>
                      <input
                        type="url"
                        value={newMuezzinUrl}
                        onChange={(e) => setNewMuezzinUrl(e.target.value)}
                        placeholder="https://example.com/audio/adhan.mp3"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-mono text-left focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        dir="ltr"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 text-right">
                      <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black block">اختر ملفاً صوتياً من جهازك:</label>
                      <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all relative">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 8 * 1024 * 1024) {
                                alert('حجم الملف كبير جداً! الحد الأقصى هو 8 ميجابايت لضمان الأداء السلس.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64Data = event.target?.result as string;
                                setNewMuezzinUrl(base64Data);
                                setUploadFileName(file.name);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="space-y-1.5">
                          <Plus className="w-6 h-6 text-slate-400 mx-auto" />
                          <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                            {uploadFileName ? `الملف المختار: ${uploadFileName}` : 'اضغط هنا لاختيار ملف صوتي أو سحبه وإفلاته'}
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold">صيغة MP3 أو WAV، الحجم الأقصى 8 ميجابايت</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-800/40">
                    <span className="text-[9px] text-amber-600 dark:text-amber-500 font-semibold flex items-center gap-1 leading-relaxed">
                      💡 نصيحة: استخدام روابط الويب (URL) لا يستهلك أي مساحة تخزينية، وهو الخيار الأفضل دوماً.
                    </span>
                    <button
                      type="submit"
                      className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة المؤذن</span>
                    </button>
                  </div>
                </form>

                {/* List of Custom Muezzins */}
                {customMuezzins.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black block">قائمة الأصوات المخصصة المضافة:</span>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {customMuezzins.map((m) => (
                        <div key={m.id} className="bg-slate-50/70 dark:bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/40 flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2 text-right min-w-0 flex-1">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{m.name}</span>
                            <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-extrabold shrink-0">
                              {m.isFajr ? 'أذان فجر' : 'أذان عام'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => togglePlayAthan('Dhuhr', m.id)}
                              className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 flex items-center justify-center cursor-pointer text-xs"
                              title="تجربة تشغيل الصوت"
                            >
                              {isPlaying && audioRef.current?.src === m.url ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomMuezzin(m.id, m.name)}
                              className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 flex items-center justify-center cursor-pointer text-xs font-black"
                              title="حذف الصوت"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            {/* Worship Alarms Section */}
            <div className="space-y-4 text-right">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-500/10 dark:border-indigo-500/20 p-4 rounded-3xl space-y-1.5 text-right">
                <div className="flex items-center gap-2">
                  <Bell className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 animate-bounce" />
                  <span className="text-xs font-black text-indigo-800 dark:text-indigo-400">منبهات الأذكار والصلوات:</span>
                </div>
                <p className="text-[11px] text-indigo-700/90 dark:text-indigo-400/80 leading-relaxed font-semibold">
                  اضبط التنبيهات والأذكار التلقائية قبل وبعد الصلوات المكتوبة لتستعد للوقوف بين يدي الله، وتحافظ على الأذكار اللاحقة للصلاة.
                </p>
              </div>

              {/* 1. Before Prayer Alarm */}
              <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-black text-slate-800 dark:text-white">تنبيه قبل الصلاة</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlerts(prev => ({
                      ...prev,
                      before: { ...prev.before, enabled: !prev.before.enabled }
                    }))}
                    className={`py-1 px-3 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                      alerts.before.enabled 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {alerts.before.enabled ? 'مفعّل' : 'معطّل'}
                  </button>
                </div>

                {alerts.before.enabled && (
                  <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800/40">
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">وقت التنبيه (قبل الأذان بـ):</span>
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setAlerts(prev => ({
                            ...prev,
                            before: { ...prev.before, minutes: Math.max(5, prev.before.minutes - 5) }
                          }))}
                          className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                        >
                          <Minus className="w-4 h-4 text-slate-600" />
                        </button>
                        <span className="text-xs font-black text-slate-800 dark:text-white font-mono flex-1 text-center">
                          {toArabicNumbers(alerts.before.minutes)} دقائق قبل الصلاة
                        </span>
                        <button
                          type="button"
                          onClick={() => setAlerts(prev => ({
                            ...prev,
                            before: { ...prev.before, minutes: Math.min(30, prev.before.minutes + 5) }
                          }))}
                          className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">أيام التنبيه:</span>
                      <div className="flex justify-between gap-1">
                        {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map((dayName, idx) => {
                          const isIncluded = alerts.before.days.includes(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setAlerts(prev => {
                                const days = prev.before.days.includes(idx)
                                  ? prev.before.days.filter(d => d !== idx)
                                  : [...prev.before.days, idx];
                                return { ...prev, before: { ...prev.before, days } };
                              })}
                              className={`w-8 h-8 rounded-full text-xs font-black cursor-pointer transition-all border flex items-center justify-center ${
                                isIncluded
                                  ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-500'
                              }`}
                            >
                              {dayName}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">صلوات التنبيه:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((pName) => {
                          const isChecked = alerts.before.prayers.includes(pName as PrayerName);
                          return (
                            <button
                              key={pName}
                              type="button"
                              onClick={() => setAlerts(prev => {
                                const prayers = prev.before.prayers.includes(pName as PrayerName)
                                  ? prev.before.prayers.filter(p => p !== pName)
                                  : [...prev.before.prayers, pName as PrayerName];
                                return { ...prev, before: { ...prev.before, prayers } };
                              })}
                              className={`py-1.5 px-3 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-300 font-extrabold'
                                  : 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50 text-slate-400'
                              }`}
                            >
                              {getArabicPrayerName(pName as PrayerName)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. After Prayer Alarm */}
              <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-black text-slate-800 dark:text-white">تنبيه بعد الصلاة (أذكار الصلاة)</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlerts(prev => ({
                      ...prev,
                      after: { ...prev.after, enabled: !prev.after.enabled }
                    }))}
                    className={`py-1 px-3 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                      alerts.after.enabled 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {alerts.after.enabled ? 'مفعّل' : 'معطّل'}
                  </button>
                </div>

                {alerts.after.enabled && (
                  <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800/40">
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">وقت التنبيه (بعد التسليم بـ):</span>
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setAlerts(prev => ({
                            ...prev,
                            after: { ...prev.after, minutes: Math.max(5, prev.after.minutes - 5) }
                          }))}
                          className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                        >
                          <Minus className="w-4 h-4 text-slate-600" />
                        </button>
                        <span className="text-xs font-black text-slate-800 dark:text-white font-mono flex-1 text-center">
                          {toArabicNumbers(alerts.after.minutes)} دقائق بعد الصلاة
                        </span>
                        <button
                          type="button"
                          onClick={() => setAlerts(prev => ({
                            ...prev,
                            after: { ...prev.after, minutes: Math.min(30, prev.after.minutes + 5) }
                          }))}
                          className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">أيام التنبيه:</span>
                      <div className="flex justify-between gap-1">
                        {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map((dayName, idx) => {
                          const isIncluded = alerts.after.days.includes(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setAlerts(prev => {
                                const days = prev.after.days.includes(idx)
                                  ? prev.after.days.filter(d => d !== idx)
                                  : [...prev.after.days, idx];
                                return { ...prev, after: { ...prev.after, days } };
                              })}
                              className={`w-8 h-8 rounded-full text-xs font-black cursor-pointer transition-all border flex items-center justify-center ${
                                isIncluded
                                  ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-500'
                              }`}
                            >
                              {dayName}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">صلوات التنبيه:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((pName) => {
                          const isChecked = alerts.after.prayers.includes(pName as PrayerName);
                          return (
                            <button
                              key={pName}
                              type="button"
                              onClick={() => setAlerts(prev => {
                                const prayers = prev.after.prayers.includes(pName as PrayerName)
                                  ? prev.after.prayers.filter(p => p !== pName)
                                  : [...prev.after.prayers, pName as PrayerName];
                                return { ...prev, after: { ...prev.after, prayers } };
                              })}
                              className={`py-1.5 px-3 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-300 font-extrabold'
                                  : 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50 text-slate-400'
                              }`}
                            >
                              {getArabicPrayerName(pName as PrayerName)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Duha Prayer Alarm */}
              <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-black text-slate-800 dark:text-white">تنبيه صلاة الضحى (صلاة الأوابين)</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlerts(prev => ({
                      ...prev,
                      duha: { ...prev.duha, enabled: !prev.duha.enabled }
                    }))}
                    className={`py-1 px-3 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                      alerts.duha.enabled 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {alerts.duha.enabled ? 'مفعّل' : 'معطّل'}
                  </button>
                </div>

                {alerts.duha.enabled && (
                  <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800/40">
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">وقت التنبيه (بعد الشروق بـ):</span>
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setAlerts(prev => ({
                            ...prev,
                            duha: { ...prev.duha, minutes: Math.max(10, prev.duha.minutes - 5) }
                          }))}
                          className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                        >
                          <Minus className="w-4 h-4 text-slate-600" />
                        </button>
                        <span className="text-xs font-black text-slate-800 dark:text-white font-mono flex-1 text-center">
                          {toArabicNumbers(alerts.duha.minutes)} دقيقة بعد الشروق
                        </span>
                        <button
                          type="button"
                          onClick={() => setAlerts(prev => ({
                            ...prev,
                            duha: { ...prev.duha, minutes: Math.min(60, prev.duha.minutes + 5) }
                          }))}
                          className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">أيام التنبيه:</span>
                      <div className="flex justify-between gap-1">
                        {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map((dayName, idx) => {
                          const isIncluded = alerts.duha.days.includes(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setAlerts(prev => {
                                const days = prev.duha.days.includes(idx)
                                  ? prev.duha.days.filter(d => d !== idx)
                                  : [...prev.duha.days, idx];
                                return { ...prev, duha: { ...prev.duha, days } };
                              })}
                              className={`w-8 h-8 rounded-full text-xs font-black cursor-pointer transition-all border flex items-center justify-center ${
                                isIncluded
                                  ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-500'
                              }`}
                            >
                              {dayName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Custom Additional Alarms Section */}
              <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 shadow-xs space-y-4 text-right">
                <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white">المنبهات الإضافية والخاصة</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">اضبط منبهات مخصصة لأي عبادة أو نشاط يومي</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddAlarm(!showAddAlarm)}
                    className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {showAddAlarm ? 'إلغاء' : <Plus className="w-3.5 h-3.5" />}
                    <span>{showAddAlarm ? 'إلغاء' : 'إضافة منبه'}</span>
                  </button>
                </div>

                {/* Add Alarm Form */}
                {showAddAlarm && (
                  <form onSubmit={handleAddCustomAlarm} className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Title */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-450 dark:text-slate-500 font-black block">اسم المنبه (مثال: قيام الليل، أذكار المساء):</label>
                        <input
                          type="text"
                          value={alarmTitle}
                          onChange={(e) => setAlarmTitle(e.target.value)}
                          placeholder="مثال: الاستعداد لصلاة الفجر، قراءة الورد اليومي..."
                          className="w-full bg-white dark:bg-[#161d26] border border-slate-150 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>

                      {/* Time */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-450 dark:text-slate-500 font-black block">وقت التنبيه (بتوقيتك المحلي):</label>
                        <input
                          type="time"
                          value={alarmTime}
                          onChange={(e) => setAlarmTime(e.target.value)}
                          className="w-full bg-white dark:bg-[#161d26] border border-slate-150 dark:border-slate-800 rounded-xl py-1.5 px-3 text-xs font-bold font-mono text-center text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Alarm Days */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-450 dark:text-slate-500 font-black block">تكرار المنبه في الأيام التالية:</label>
                      <div className="flex justify-between gap-1">
                        {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((dayName, idx) => {
                          const isIncluded = alarmDays.includes(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                const days = alarmDays.includes(idx)
                                  ? alarmDays.filter(d => d !== idx)
                                  : [...alarmDays, idx];
                                setAlarmDays(days);
                              }}
                              className={`flex-1 py-2 text-center text-[10px] sm:text-xs font-bold rounded-xl cursor-pointer border transition-all ${
                                isIncluded
                                  ? 'bg-indigo-600 border-indigo-600 text-white font-black shadow-xs'
                                  : 'bg-white dark:bg-[#161d26] border-slate-100 dark:border-slate-800 text-slate-500'
                              }`}
                            >
                              {dayName.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Alarm Sound Type */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-450 dark:text-slate-500 font-black block">طريقة التنبيه والصوت:</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { type: 'beep', label: 'رنين منبه (Beep)' },
                          { type: 'adhan', label: 'صوت الأذان كامل' },
                          { type: 'vibrate', label: 'اهتزاز فقط' },
                          { type: 'silent', label: 'تنبيه صامت (إشعار)' },
                        ].map((sound) => {
                          const isSelected = alarmSoundType === sound.type;
                          return (
                            <button
                              key={sound.type}
                              type="button"
                              onClick={() => setAlarmSoundType(sound.type as any)}
                              className={`py-2 text-center text-xs font-bold rounded-xl cursor-pointer border transition-all ${
                                isSelected
                                  ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-black'
                                  : 'bg-white dark:bg-[#161d26] border-slate-100 dark:border-slate-800 text-slate-555'
                              }`}
                            >
                              {sound.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                      <button
                        type="submit"
                        className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>إضافة وتفعيل المنبه</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* List of Custom Alarms */}
                {customAlarms.length === 0 ? (
                  <div className="text-center py-6 text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-normal">
                    لا يوجد منبهات إضافية مضافة حالياً. يمكنك استخدام زر "إضافة منبه" بالأعلى لضبط منبهات مخصصة لقيام الليل، السحور، أو قراءة الورد اليومي.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {customAlarms.map((a) => {
                      const soundLabel = a.soundType === 'beep' ? 'رنين' : a.soundType === 'adhan' ? 'أذان' : a.soundType === 'vibrate' ? 'اهتزاز' : 'صامت';
                      const daysText = a.days.length === 7 ? 'يومياً' : a.days.map(d => ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][d]).join('، ');
                      return (
                        <div key={a.id} className="bg-slate-50/70 dark:bg-[#111720]/30 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex justify-between items-center gap-4">
                          <div className="space-y-1 text-right min-w-0 flex-1">
                            <span className="text-xs font-black text-slate-800 dark:text-white block">{a.title}</span>
                            <div className="flex flex-wrap gap-x-2 gap-y-1 items-center text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">
                              <span className="text-indigo-600 dark:text-indigo-400 font-black">{toArabicNumbers(a.time)}</span>
                              <span>•</span>
                              <span>{daysText}</span>
                              <span>•</span>
                              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-[9px] text-slate-500">{soundLabel}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Toggle switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleAlarm(a.id, !a.enabled)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                a.enabled ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  a.enabled ? '-translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteAlarm(a.id, a.title)}
                              className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 flex items-center justify-center cursor-pointer text-xs font-black"
                              title="حذف المنبه"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

        </div>
      )}

    </div>
  );
}
