import React from 'react';
import { 
  PrayerLog, 
  PrayerName, 
  PrayerStatus, 
  PendingQadaPrayer, 
  AppSettings 
} from '../types';
import { getHijriDate } from '../utils/hijri';
import { safeUUID } from '../utils/uuid';

interface UseDashboardPrayerActionsProps {
  todayStr: string;
  now: Date;
  hijri: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    fullString: string;
  };
  settings: AppSettings;
  todayLogs: Record<string, PrayerLog>;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
  fastingLogs: Record<string, { date: string; fasted: boolean; fastType: string }>;
  setFastingLogs: React.Dispatch<React.SetStateAction<Record<string, { date: string; fasted: boolean; fastType: string }>>>;
  selectedPrayerToLog: PrayerName | null;
  setSelectedPrayerToLog: (p: PrayerName | null) => void;
  setAppModal: (modal: { message: string; variant?: 'info' | 'warning' | 'danger' | 'success' } | null) => void;
}

export function useDashboardPrayerActions({
  todayStr,
  now,
  hijri,
  settings,
  todayLogs,
  prayerLogs,
  setPrayerLogs,
  pendingQadaPrayers,
  setPendingQadaPrayers,
  fastingLogs,
  setFastingLogs,
  selectedPrayerToLog,
  setSelectedPrayerToLog,
  setAppModal,
}: UseDashboardPrayerActionsProps) {

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
          id: safeUUID(),
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
      setAppModal({ message: `تنبيه شرعي: لا يجوز صيام اليوم لأنه يصادف ${reasonStr}. الصيام في العيد وأيام التشريق محرّم شرعاً.`, variant: 'warning' });
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

  return {
    handleUpdateNafilah,
    handleLogPrayer,
    handleUpdateSunnah,
    toggleFasting,
    todayFast,
  };
}
