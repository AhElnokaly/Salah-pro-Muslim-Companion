import React, { useEffect } from 'react';
import { 
  TabId, 
  SettingsSubTabId, 
  DashboardTab, 
  QuranSession, 
  PrayerName 
} from '../../types';
import { safeSetItem } from '../../utils/storage';
import { getLocalDateStr } from '../../hooks/usePrayerScheduler';

interface UseAppGlobalEventsProps {
  setActiveTab: (tab: TabId) => void;
  setActiveSettingsSubTab: (subTab: SettingsSubTabId) => void;
  setIsTourModalOpen: (open: boolean) => void;
  setIsSpiritualSearchOpen: (open: boolean) => void;
  setNotificationsCount: (count: number) => void;
  quranSessions: QuranSession[];
  setQuranSessions: React.Dispatch<React.SetStateAction<QuranSession[]>>;
  current: PrayerName | 'Sunrise' | null;
  next: PrayerName | 'Sunrise' | null;
  setAthanOverlayPrayer: (prayer: PrayerName) => void;
  setShowAthanOverlay: (show: boolean) => void;
  globalAudioRef: React.RefObject<HTMLAudioElement | null>;
  togglePlayAthanGlobal: (muezzinId?: string, prayerName?: PrayerName) => void;
}

export function useAppGlobalEvents({
  setActiveTab,
  setActiveSettingsSubTab,
  setIsTourModalOpen,
  setIsSpiritualSearchOpen,
  setNotificationsCount,
  quranSessions,
  setQuranSessions,
  current,
  next,
  setAthanOverlayPrayer,
  setShowAthanOverlay,
  globalAudioRef,
  togglePlayAthanGlobal
}: UseAppGlobalEventsProps) {
  // Navigation, subtabs, tour, and search event triggers
  useEffect(() => {
    const handleKhushuTrigger = () => {
      setActiveTab('khushu');
    };
    const handleTourTrigger = () => {
      setIsTourModalOpen(true);
    };
    const handleSettingsSubtabTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ subTab?: SettingsSubTabId }>;
      if (customEvent.detail?.subTab) {
        setActiveSettingsSubTab(customEvent.detail.subTab);
        setActiveTab('settings');
      }
    };
    const handleMainTabTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: DashboardTab }>;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
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
  }, [setActiveTab, setActiveSettingsSubTab, setIsTourModalOpen, setIsSpiritualSearchOpen]);

  // Listen to spiritual notifications count and prayer settings jump
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
  }, [setActiveTab, setActiveSettingsSubTab, setNotificationsCount]);

  // Quick Log Event Handlers (Triggered by Smart FAB or Quick Actions)
  useEffect(() => {
    const handleQuickLogPrayer = () => {
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
  }, [quranSessions, setQuranSessions, setActiveTab]);

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
}
