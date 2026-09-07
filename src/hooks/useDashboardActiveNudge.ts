import React from 'react';
import { 
  PrayerName, 
  PrayerLog, 
  PendingQadaPrayer, 
  FastingLog, 
  RecentUserData, 
  AppSettings,
  QuranSession
} from '../types';
import { generateActiveNudge } from '../utils/nudgeRules';
import { getArabicPrayerName } from '../utils/prayerCalc';

interface UseDashboardActiveNudgeProps {
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  fastingLogs: Record<string, { date: string; fasted: boolean; fastType: string }>;
  quranSessions?: QuranSession[];
  dhikrLogs?: Record<string, Record<string, number>>;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setAppModal: (modal: { message: string; variant?: 'info' | 'warning' | 'danger' | 'success' } | null) => void;
}

export function useDashboardActiveNudge({
  prayerLogs,
  pendingQadaPrayers,
  fastingLogs,
  quranSessions = [],
  dhikrLogs = {},
  setSettings,
  setAppModal,
}: UseDashboardActiveNudgeProps) {
  const recentData: RecentUserData = {
    prayerLogs,
    pendingQadaPrayers,
    fastingLogs: Object.fromEntries(
      Object.entries(fastingLogs).map(([k, v]) => [k, { ...v, hijriDate: '', isQada: false } as FastingLog])
    ),
    quranSessions,
    dhikrLogs
  };

  const activeNudge = generateActiveNudge(recentData);

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
      setAppModal({ message: `تم تفعيل تنبيهات صلاة ${getArabicPrayerName(pName)} بنجاح!`, variant: 'success' });
    } else {
      setAppModal({ message: 'بارك الله في سعيكم ومداومتكم على الخير 🤍', variant: 'success' });
    }
  };

  return {
    activeNudge,
    handleExecuteNudgeAction,
  };
}
