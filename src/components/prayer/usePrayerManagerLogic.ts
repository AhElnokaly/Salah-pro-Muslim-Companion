/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  AppSettings, 
  PendingQadaPrayer, 
  PrayerLog, 
  PrayerName, 
  PrayerStatus, 
  ClockFace, 
  VoluntaryPrayerLog, 
} from '../../types';
import { calculatePrayerTimes, getArabicPrayerName, getTimezoneOffsetForLocation } from '../../utils/prayerCalc';
import { getHijriDate, toArabicNumbers } from '../../utils/hijri';
import { getDateFromPrayerDay, formatDateKey } from '../../utils/prayerDayBoundary';
import { trackFeatureCompletion } from '../../utils/analyticsStorage';
import { safeUUID } from '../../utils/uuid';
import { safeSetItem, safeGetItem } from '../../utils/storage';
import { 
  defaultMuezzins, 
  getCustomAudios, 
  archiveMuezzins 
} from '../../utils/audioStorage';
import { FIVE_DAILY_PRAYERS } from './prayerUtils';

export type SubTab = 'times' | 'worship';

export interface UsePrayerManagerLogicProps {
  settings: AppSettings;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
  voluntaryPrayerLogs?: VoluntaryPrayerLog[];
  setVoluntaryPrayerLogs?: React.Dispatch<React.SetStateAction<VoluntaryPrayerLog[]>>;
}

export function usePrayerManagerLogic({
  settings,
  prayerLogs,
  setPrayerLogs,
  pendingQadaPrayers,
  setPendingQadaPrayers,
}: UsePrayerManagerLogicProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('times');
  const [worshipTab, setWorshipTab] = useState<'today' | 'qada' | 'heatmap'>('today');
  const [qadaPace, setQadaPace] = useState<number>(5);
  
  // Day selection for logging past days (0 = Today, -1 = Yesterday, down to -90)
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(0);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string>('');

  // Voluntary Prayers BottomSheets / Modals state
  const [showDuhaModal, setShowDuhaModal] = useState<boolean>(false);
  const [showNightPrayersModal, setShowNightPrayersModal] = useState<boolean>(false);

  // Real-time ticking date/time
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleSubtabNav = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail === 'worship' || customEvent.detail === 'times') {
        setActiveSubTab(customEvent.detail as SubTab);
        if (customEvent.detail === 'worship') {
          setWorshipTab('today');
        }
      }
    };
    const handleYesterdayNav = () => {
      setActiveSubTab('worship');
      setWorshipTab('today');
      setSelectedDateOffset(-1);
    };
    window.addEventListener('navigate-salah-subtab', handleSubtabNav);
    window.addEventListener('open-prayer-worship-yesterday', handleYesterdayNav);
    return () => {
      window.removeEventListener('navigate-salah-subtab', handleSubtabNav);
      window.removeEventListener('open-prayer-worship-yesterday', handleYesterdayNav);
    };
  }, []);

  useEffect(() => {
    const handleAndroidBack = (e: Event) => {
      if (showDuhaModal) {
        e.preventDefault();
        setShowDuhaModal(false);
      } else if (showNightPrayersModal) {
        e.preventDefault();
        setShowNightPrayersModal(false);
      }
    };
    window.addEventListener('salah_android_back', handleAndroidBack);
    return () => window.removeEventListener('salah_android_back', handleAndroidBack);
  }, [showDuhaModal, showNightPrayersModal]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Clock face selection state
  const [clockFace, setClockFace] = useState<ClockFace>(() => {
    return (safeGetItem('salah_clock_face') as ClockFace) || 'classic';
  });

  useEffect(() => {
    safeSetItem('salah_clock_face', clockFace);
  }, [clockFace]);

  // Athan Audio Player States in PrayerManager
  const [isPlaying] = useState<boolean>(false);
  const [currentMuezzin] = useState<string>(() => {
    return safeGetItem('salah_general_muezzin') || 'makkah';
  });
  const [fajrMuezzin] = useState<string>(() => {
    return safeGetItem('salah_fajr_muezzin') || 'fajr_yusuf';
  });
  const [prayerMuezzins] = useState<Record<string, string>>(() => {
    const general = safeGetItem('salah_general_muezzin') || 'makkah';
    const fajr = safeGetItem('salah_fajr_muezzin') || 'fajr_yusuf';
    return {
      Fajr: safeGetItem('salah_muezzin_Fajr') || fajr,
      Sunrise: safeGetItem('salah_muezzin_Sunrise') || general,
      Dhuhr: safeGetItem('salah_muezzin_Dhuhr') || general,
      Asr: safeGetItem('salah_muezzin_Asr') || general,
      Maghrib: safeGetItem('salah_muezzin_Maghrib') || general,
      Isha: safeGetItem('salah_muezzin_Isha') || general,
    };
  });

  // Custom Muezzins State
  const [customMuezzins, setCustomMuezzins] = useState<{ id: string; name: string; url: string; isFajr: boolean; isCustom?: boolean; fileName?: string }[]>([]);

  useEffect(() => {
    getCustomAudios().then(tracks => {
      setCustomMuezzins(tracks);
    }).catch(err => {
      console.error('Failed to load custom muezzins from IndexedDB:', err);
    });
  }, []);

  const muezzins = [...defaultMuezzins, ...archiveMuezzins, ...customMuezzins];

  const togglePlayAthan = async (prayerName?: PrayerName, forcedMuezzinId?: string) => {
    const pName = prayerName || 'Dhuhr';
    const isFajr = pName === 'Fajr';
    const activeMuezzinId = forcedMuezzinId || (prayerName && prayerMuezzins[prayerName]) || (isFajr ? fajrMuezzin : currentMuezzin);
    window.dispatchEvent(new CustomEvent('trigger-athan-simulation', {
      detail: { prayerName: pName, muezzinId: activeMuezzinId }
    }));
  };

  const now = new Date();
  const targetTimestamp = new Date();
  targetTimestamp.setDate(now.getDate() + selectedDateOffset);

  const dateStr = formatDateKey(targetTimestamp);
  const targetDate = getDateFromPrayerDay(dateStr);
  const hijri = getHijriDate(targetDate, settings.hijriOffset);

  const tzOffset = getTimezoneOffsetForLocation(targetDate, settings.timezoneId);
  const times = calculatePrayerTimes(
    targetDate,
    settings.latitude,
    settings.longitude,
    tzOffset,
    settings.calcMethod,
    settings.madhab,
    settings.prayerOffsets || {}
  );

  const dayLogs = prayerLogs[dateStr] || {};

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

    if (status === 'A') {
      trackFeatureCompletion('salah');
      trackFeatureCompletion('home');
    }

    // Sync with Qada List if missed status is added or removed
    if (isMissed && !wasMissed) {
      const alreadyPending = pendingQadaPrayers.some(
        q => q.date === dateStr && q.prayerName === prayer
      );
      if (!alreadyPending) {
        const newQada: PendingQadaPrayer = {
          id: safeUUID(),
          date: dateStr,
          hijriDate: hijri.fullString,
          prayerName: prayer
        };
        setPendingQadaPrayers(prev => [...prev, newQada]);
      }
      setLogSuccessMessage(`تم تسجيل صلاة ${getArabicPrayerName(prayer, targetTimestamp)} كقضاء وإضافتها للفوائت.`);
    } else if (!isMissed && wasMissed) {
      setPendingQadaPrayers(prev => prev.filter(
        q => !(q.date === dateStr && q.prayerName === prayer)
      ));
      setLogSuccessMessage(`تم تسجيل صلاة ${getArabicPrayerName(prayer, targetTimestamp)} وإزالتها من الفوائت.`);
    } else {
      setLogSuccessMessage(`تم حفظ حالة صلاة ${getArabicPrayerName(prayer, targetTimestamp)} بنجاح.`);
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

  // Qada Counts & Calculations
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
      id: safeUUID(),
      date: formatDateKey(new Date()),
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
      setLogSuccessMessage(`تقبل الله منك! تم قضاء صلاة ${getArabicPrayerName(prayer)} بنجاح.`);
    }
  };

  const handleAddFullDayQada = () => {
    const todayStr = formatDateKey(new Date());
    const newItems: PendingQadaPrayer[] = FIVE_DAILY_PRAYERS.map(p => ({
      id: safeUUID(),
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

  return {
    activeSubTab,
    setActiveSubTab,
    worshipTab,
    setWorshipTab,
    qadaPace,
    setQadaPace,
    selectedDateOffset,
    setSelectedDateOffset,
    logSuccessMessage,
    setLogSuccessMessage,
    showDuhaModal,
    setShowDuhaModal,
    showNightPrayersModal,
    setShowNightPrayersModal,
    currentTime,
    clockFace,
    setClockFace,
    isPlaying,
    prayerMuezzins,
    muezzins,
    togglePlayAthan,
    dateStr,
    targetDate,
    targetTimestamp,
    hijri,
    times,
    dayLogs,
    handleLogPrayerStatus,
    handleUpdateSunnah,
    handleUpdateNafilah,
    qadaCounts,
    totalQadaCount,
    handleAddManualQada,
    handlePerformQada,
    handleAddFullDayQada,
    handleResetAllQada,
  };
}
