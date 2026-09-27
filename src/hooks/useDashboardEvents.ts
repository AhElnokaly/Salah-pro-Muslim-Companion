import React, { useEffect } from 'react';
import { PrayerName, PrayerTimes } from '../types';
import { getDashboardSectionsConfig, DashboardSectionId } from '../components/dashboard/dashboardSections';
import { isPrayerInFuture } from '../utils/prayerCalc';

interface UseDashboardEventsProps {
  now: Date;
  times: PrayerTimes;
  setDashboardSections: React.Dispatch<React.SetStateAction<Record<DashboardSectionId, boolean>>>;
  setShowDuhaQuickLog: (show: boolean) => void;
  setFuturePrayerWarning: (p: PrayerName | null) => void;
  setSelectedPrayerToLog: (p: PrayerName | null) => void;
  handleGPSLocationSync: () => void;
}

export function useDashboardEvents({
  now,
  times,
  setDashboardSections,
  setShowDuhaQuickLog,
  setFuturePrayerWarning,
  setSelectedPrayerToLog,
  handleGPSLocationSync,
}: UseDashboardEventsProps) {
  useEffect(() => {
    const handleUpdate = () => {
      setDashboardSections(getDashboardSectionsConfig());
    };

    const handleQuickLogPrayerEvent = (e: Event) => {
      const customEv = e as CustomEvent<{ prayerKey?: string }>;
      const rawKey = customEv.detail?.prayerKey || 'Dhuhr';
      const keyMap: Record<string, PrayerName> = {
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
      const pKey: PrayerName = keyMap[rawKey] || keyMap[rawKey.toLowerCase()] || (rawKey.charAt(0).toUpperCase() + rawKey.slice(1).toLowerCase() as PrayerName);

      if (pKey === 'Sunrise') {
        setShowDuhaQuickLog(true);
        return;
      }

      if (isPrayerInFuture(pKey, now, times)) {
        setFuturePrayerWarning(pKey);
      } else {
        setSelectedPrayerToLog(pKey);
      }
    };

    const handleGPSTrigger = () => {
      handleGPSLocationSync();
    };

    window.addEventListener('salah_dashboard_sections_updated', handleUpdate);
    window.addEventListener('salah_quick_log_prayer', handleQuickLogPrayerEvent);
    window.addEventListener('trigger-gps-sync', handleGPSTrigger);

    return () => {
      window.removeEventListener('salah_dashboard_sections_updated', handleUpdate);
      window.removeEventListener('salah_quick_log_prayer', handleQuickLogPrayerEvent);
      window.removeEventListener('trigger-gps-sync', handleGPSTrigger);
    };
  }, [now, times, setDashboardSections, setShowDuhaQuickLog, setFuturePrayerWarning, setSelectedPrayerToLog, handleGPSLocationSync]);
}
