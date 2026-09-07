import React, { useEffect } from 'react';
import { AppSettings, FastingLog } from '../../types';
import { safeGetItem } from '../../utils/storage';
import { defaultMuezzins, archiveMuezzins, silentlyCacheAudio } from '../../utils/audioStorage';
import { syncUpcomingPrayerSchedule } from '../../utils/prayerScheduleSync';
import { syncPrayerScheduleWithSW } from '../../utils/pushNotificationService';
import { getHijriDate } from '../../utils/hijri';

interface UseAppSyncProps {
  isLoaded: boolean;
  settings: AppSettings;
  fastingLogs: Record<string, FastingLog>;
  setFastingLogs: React.Dispatch<React.SetStateAction<Record<string, FastingLog>>>;
  setFiqhWarning: (warning: { title: string; removedReasons: string[] } | null) => void;
}

export function useAppSync({
  isLoaded,
  settings,
  fastingLogs,
  setFastingLogs,
  setFiqhWarning
}: UseAppSyncProps) {
  // Pre-cache preferred muezzins on app load
  useEffect(() => {
    if (!isLoaded || !navigator.onLine) return;
    const fajrMuezzinId = safeGetItem('salah_fajr_muezzin') || 'fajr_makkah';
    const generalMuezzinId = safeGetItem('salah_general_muezzin') || 'makkah';
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
  }, [fastingLogs, isLoaded, settings.hijriOffset, setFastingLogs, setFiqhWarning]);
}
