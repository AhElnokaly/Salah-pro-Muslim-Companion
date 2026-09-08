/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  AppSettings, 
  PrayerLog, 
  PrayerName,
  TabId,
  SettingsSubTabId
} from './types';

// Eager Essential Components
import Onboarding from './components/Onboarding';
import AthanOverlay from './components/AthanOverlay';

import { safeGetItem } from './utils/storage';

import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar } from './components/layout/AppSidebar';
import { AppBottomNav } from './components/layout/AppBottomNav';
import { AppTabRouter } from './components/layout/AppTabRouter';
import { AppModalOutlets } from './components/layout/AppModalOutlets';
import { playSpiritualChime } from './utils/spiritualAudio';

// Modular App Subcomponents & Hooks
import { AppBanners } from './components/app/AppBanners';
import { AppFeedbackOverlays } from './components/app/AppFeedbackOverlays';
import { useAppGlobalEvents } from './components/app/useAppGlobalEvents';
import { useAppSync } from './components/app/useAppSync';
import { useAppPermissionsAndAlerts } from './components/app/useAppPermissionsAndAlerts';

// Custom Hooks
import { usePrayerClock } from './hooks/usePrayerClock';
import { useSpiritualState } from './hooks/useSpiritualState';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useAthanPlayer } from './hooks/useAthanPlayer';
import { usePrayerScheduler } from './hooks/usePrayerScheduler';
import { useAndroidBackButton } from './hooks/useAndroidBackButton';

import { formatDateKey } from './utils/prayerDayBoundary';
import { trackFeatureUsage } from './utils/analyticsStorage';
import { PrayerKey } from './utils/adhkarCalc';

// Import Hemmaty app logo icon
import companionIcon from './assets/images/hemmaty_logo.jpg';

// Calculations for standalone widget state synchronization
import { getArabicPrayerName } from './utils/prayerCalc';
import { toArabicNumbers } from './utils/hijri';
import { getUnreadVersionStatus } from './data/changelog';
import { checkForAppUpdates, AppReleaseInfo } from './services/updateChecker';
import UpdateNotificationModal from './components/common/UpdateNotificationModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<SettingsSubTabId>('prayer');
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<AppReleaseInfo | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(() => safeGetItem('salah_show_post_onboarding_welcome') === 'true');
  const [, setNotificationsCount] = useState<number>(0);

  // Modular App Permissions, Network & Auxiliary Alerts Hook
  const {
    toastMessage,
    setToastMessage,
    storageWarningAcknowledged,
    setStorageWarningAcknowledged,
    notifPermission,
    setNotifPermission,
    notifBannerDismissed,
    setNotifBannerDismissed,
    exactAlarmPermissionGranted,
    setExactAlarmPermissionGranted,
    exactAlarmBannerDismissed,
    setExactAlarmBannerDismissed,
    isOnline,
    isSyncing,
    headerParticles,
    triggerHeaderParticles,
    handleShareApp
  } = useAppPermissionsAndAlerts();

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

  // Auto-show "What's New" modal when a new frontend update is detected
  useEffect(() => {
    if (isLoaded) {
      const { isNew } = getUnreadVersionStatus();
      if (isNew) {
        const timer = setTimeout(() => {
          setIsVersionModalOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoaded]);

  // Background check for newer GitHub Release APK (throttled safely to avoid spamming API)
  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        checkForAppUpdates({ force: false })
          .then((result) => {
            if (result.hasUpdate && result.latestRelease) {
              setAvailableUpdate(result.latestRelease);
            }
          })
          .catch(() => {
            // Silently suppress network errors for background check
          });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

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
    setActiveRingingAlarm
  } = usePrayerScheduler({
    settings,
    isLoaded,
    triggerAthan,
    globalAudioRef,
    audioVolume,
    setToastMessage
  });

  // Portal of Serenity & Spiritual Breath States
  const [showSpiritualModal, setShowSpiritualModal] = useState<boolean>(false);
  const [isFabOpen, setIsFabOpen] = useState<boolean>(false);
  const [headerRippleActive, setHeaderRippleActive] = useState<boolean>(false);
  const [fiqhWarning, setFiqhWarning] = useState<{ title: string; removedReasons: string[] } | null>(null);
  const [targetAdhkarPrayer, setTargetAdhkarPrayer] = useState<PrayerKey | null>(null);
  const [isSpiritualSearchOpen, setIsSpiritualSearchOpen] = useState<boolean>(false);

  // Background audio pre-cache, schedule synchronization, theme sync, and fiqh fasting validation
  useAppSync({
    isLoaded,
    settings,
    fastingLogs,
    setFastingLogs,
    setFiqhWarning
  });

  const { now, hijri, gregorianStr, times, current, next, timeRemainingStr, dayNameArabic } = usePrayerClock(settings);
  const activePrayerName = current === 'Sunrise' ? 'Fajr' : (current || 'Dhuhr');

  // Window events, Service Worker messages, URL parameters, and Quick Logs
  useAppGlobalEvents({
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
  });

  // Register Android Hardware Back Button Handling (Task 26)
  useAndroidBackButton({
    activeTab,
    setActiveTab,
    setToastMessage: (msg) => setToastMessage(msg),
    overlays: [
      { id: 'isSpiritualSearchOpen', isOpen: isSpiritualSearchOpen, close: () => setIsSpiritualSearchOpen(false) },
      { 
        id: 'athanOverlay', 
        isOpen: showAthanOverlay, 
        close: () => {
          markAthanDismissed();
          setShowAthanOverlay(false);
          stopAthanGlobal();
        } 
      },
      { id: 'activeRingingAlarm', isOpen: Boolean(activeRingingAlarm), close: () => setActiveRingingAlarm(null) },
      { id: 'fiqhWarning', isOpen: Boolean(fiqhWarning), close: () => setFiqhWarning(null) },
      { id: 'isFabOpen', isOpen: isFabOpen, close: () => setIsFabOpen(false) },
      { id: 'isSidebarOpen', isOpen: isSidebarOpen, close: () => setIsSidebarOpen(false) },
      { id: 'isQuickSettingsOpen', isOpen: isQuickSettingsOpen, close: () => setIsQuickSettingsOpen(false) },
      { id: 'isTourModalOpen', isOpen: isTourModalOpen, close: () => setIsTourModalOpen(false) },
      { id: 'availableUpdate', isOpen: Boolean(availableUpdate), close: () => setAvailableUpdate(null) },
      { id: 'isVersionModalOpen', isOpen: isVersionModalOpen, close: () => setIsVersionModalOpen(false) },
      { id: 'showSpiritualModal', isOpen: showSpiritualModal, close: () => setShowSpiritualModal(false) },
      { id: 'showPwaInstallGuide', isOpen: showPwaInstallGuide, close: () => setShowPwaInstallGuide(false) },
      { id: 'showWelcomeModal', isOpen: showWelcomeModal, close: () => setShowWelcomeModal(false) }
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

  // Auto track feature usage whenever activeTab changes
  useEffect(() => {
    if (activeTab) {
      trackFeatureUsage(activeTab);
    }
  }, [activeTab]);

  // Handle completion of onboarding
  const handleOnboardingComplete = (
    finalSettings: AppSettings, 
    lastPrayerDone: { prayer: PrayerName; wasOnTime: boolean }
  ) => {
    setSettings(finalSettings);
    
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

    setSettings(prev => ({
      ...prev,
      trackingStartDate: todayStr,
      trackingStartPrayer: lastPrayerDone.prayer
    }));
    setShowWelcomeModal(true);
  };

  // While loading, display a clean loading pulse
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#faf7f0] dark:bg-[#0e1217] flex flex-col items-center justify-center text-center space-y-4" dir="rtl">
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-850 animate-pulse bg-[#16202c] shrink-0">
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
      <AppHeader
        settings={settings}
        setSettings={setSettings}
        setIsSidebarOpen={setIsSidebarOpen}
        setActiveTab={setActiveTab}
        setIsTourModalOpen={setIsTourModalOpen}
        setShowSpiritualModal={setShowSpiritualModal}
        headerRippleActive={headerRippleActive}
        setHeaderRippleActive={setHeaderRippleActive}
        headerParticles={headerParticles}
        triggerHeaderParticles={triggerHeaderParticles}
        playSpiritualChime={playSpiritualChime}
        isSyncing={isSyncing}
        isOnline={isOnline}
      />

      {/* 2. Main Content Stage Container */}
      <main className="w-full max-w-md p-4 space-y-6">
        <AppBanners
          storageWriteError={storageWriteError}
          storageWarningAcknowledged={storageWarningAcknowledged}
          onDismissStorageWarning={() => setStorageWarningAcknowledged(true)}
          notifPermission={notifPermission}
          notifBannerDismissed={notifBannerDismissed}
          onDismissNotifBanner={() => setNotifBannerDismissed(true)}
          setNotifPermission={setNotifPermission}
          exactAlarmPermissionGranted={exactAlarmPermissionGranted}
          exactAlarmBannerDismissed={exactAlarmBannerDismissed}
          onDismissExactAlarmBanner={() => setExactAlarmBannerDismissed(true)}
          setExactAlarmPermissionGranted={setExactAlarmPermissionGranted}
        />

        <AppTabRouter
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeSettingsSubTab={activeSettingsSubTab}
          setActiveSettingsSubTab={setActiveSettingsSubTab}
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
          quranSessions={quranSessions}
          setQuranSessions={setQuranSessions}
          khatmat={khatmat}
          setKhatmat={setKhatmat}
          dhikrLogs={dhikrLogs}
          setDhikrLogs={setDhikrLogs}
          customDuas={customDuas}
          setCustomDuas={setCustomDuas}
          customAlarms={customAlarms}
          setCustomAlarms={setCustomAlarms}
          alerts={alerts}
          setAlerts={setAlerts}
          audioVolume={audioVolume}
          setAudioVolume={setAudioVolume}
          targetAdhkarPrayer={targetAdhkarPrayer}
          handleNavigateToAdhkarForPrayer={handleNavigateToAdhkarForPrayer}
          handleInstallApp={handleInstallApp}
          isInstalled={isInstalled}
          times={times}
          current={current}
          next={next}
          timeRemainingStr={timeRemainingStr}
          hijri={hijri}
          dayNameArabic={dayNameArabic}
          gregorianStr={gregorianStr}
          now={now}
          toArabicNumbers={toArabicNumbers}
        />
      </main>

      {/* 4. Slide-out Sidebar Drawer */}
      <AppSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSettingsSubTab={activeSettingsSubTab}
        setActiveSettingsSubTab={setActiveSettingsSubTab}
        settings={settings}
        setSettings={setSettings}
        setIsQuickSettingsOpen={setIsQuickSettingsOpen}
        setIsTourModalOpen={setIsTourModalOpen}
        setIsVersionModalOpen={setIsVersionModalOpen}
        isInstalled={isInstalled}
        handleInstallApp={handleInstallApp}
        handleShareApp={handleShareApp}
        setToastMessage={setToastMessage}
      />

      {/* 3. Rebalanced Fixed Bottom Navigation with Central FAB Radial Menu */}
      <AppBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isFabOpen={isFabOpen}
        setIsFabOpen={setIsFabOpen}
        currentPrayerName={activePrayerName}
        nextPrayerName={typeof next === 'string' ? next : 'Asr'}
        prayerLogs={prayerLogs}
        setToastMessage={setToastMessage}
      />

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

      {/* In-App Toast and Fiqh Warning Modal */}
      <AppFeedbackOverlays
        toastMessage={toastMessage}
        fiqhWarning={fiqhWarning}
        onDismissFiqhWarning={() => setFiqhWarning(null)}
      />

      {/* Lazy Loaded Modal Dialogs */}
      <AppModalOutlets
        showPwaInstallGuide={showPwaInstallGuide}
        setShowPwaInstallGuide={setShowPwaInstallGuide}
        showManualSteps={showManualSteps}
        setShowManualSteps={setShowManualSteps}
        handleDirectInstallInsideModal={handleDirectInstallInsideModal}
        showSpiritualModal={showSpiritualModal}
        setShowSpiritualModal={setShowSpiritualModal}
        activeRingingAlarm={activeRingingAlarm}
        setActiveRingingAlarm={setActiveRingingAlarm}
        setCustomAlarms={setCustomAlarms}
        globalAudioRef={globalAudioRef}
        isTourModalOpen={isTourModalOpen}
        setIsTourModalOpen={setIsTourModalOpen}
        isQuickSettingsOpen={isQuickSettingsOpen}
        setIsQuickSettingsOpen={setIsQuickSettingsOpen}
        settings={settings}
        setSettings={setSettings}
        showWelcomeModal={showWelcomeModal}
        setShowWelcomeModal={setShowWelcomeModal}
        isSpiritualSearchOpen={isSpiritualSearchOpen}
        setIsSpiritualSearchOpen={setIsSpiritualSearchOpen}
        isVersionModalOpen={isVersionModalOpen}
        setIsVersionModalOpen={setIsVersionModalOpen}
        setActiveTab={setActiveTab}
        setActiveSettingsSubTab={setActiveSettingsSubTab}
        setToastMessage={setToastMessage}
      />

      {/* GitHub In-App Update Alert Modal */}
      {availableUpdate && (
        <UpdateNotificationModal
          isOpen={Boolean(availableUpdate)}
          releaseInfo={availableUpdate}
          onClose={() => setAvailableUpdate(null)}
        />
      )}

    </div>
  );
}
