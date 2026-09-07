/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppModalVariant } from './shared/AppModal';
import { getDashboardSectionsConfig, DashboardSectionId } from './dashboard/dashboardSections';
import { 
  AppSettings, 
  PrayerLog, 
  PrayerName, 
  PendingQadaPrayer, 
  CustomDua, 
  QuranSession, 
  QuranKhatma, 
  RamadanQadaTracker, 
  VoluntaryPrayerLog, 
  DashboardTab 
} from '../types';
import { safeSetItem, safeGetItem } from '../utils/storage';
import { 
  getArabicPrayerName,
  isPrayerInFuture
} from '../utils/prayerCalc';
import { toArabicNumbers } from '../utils/hijri';
import { DashboardDailyShortcuts } from './dashboard/DashboardDailyShortcuts';
import { MainPrayerCardContainer } from './dashboard/MainPrayerCardContainer';
import { DashboardBanners } from './dashboard/DashboardBanners';
import { DashboardSummaryStrips } from './dashboard/DashboardSummaryStrips';
import { DashboardModalsContainer } from './dashboard/DashboardModalsContainer';
import { useDashboardPrayerActions } from '../hooks/useDashboardPrayerActions';
import { useLocationSync } from '../hooks/useLocationSync';
import { useDashboardActiveNudge } from '../hooks/useDashboardActiveNudge';
import { useDashboardSpiritualNotifications } from '../hooks/useDashboardSpiritualNotifications';
import { useDashboardClockFace } from '../hooks/useDashboardClockFace';
import { useDashboardEvents } from '../hooks/useDashboardEvents';
import { exportDashboardBackup } from '../utils/dashboardBackup';
import { BackdropType } from './MosqueBackdrop';
import FridayMode from './FridayMode';
import FeatureDiscoveryWidget from './FeatureDiscoveryWidget';
import { PinnedFavoriteWidget } from './PinnedFavoriteWidget';
import UnifiedProgressCard from './UnifiedProgressCard';
import { KhushuModeDashboardCard } from './dashboard/KhushuModeDashboardCard';
import { useKhushuMode } from '../hooks/useKhushuMode';
import { useKhushuAutoScheduler } from '../domain/khushu/useKhushuAutoScheduler';
import { DashboardKhushuModals } from './khushu/DashboardKhushuModals';
import { useDashboardTimeAndPrayers } from './dashboard/useDashboardTimeAndPrayers';
import { useDashboardBlockSharedProps } from './dashboard/useDashboardBlockSharedProps';
import { BACKDROP_IMAGES } from './dashboard/dashboardBackdropImages';
export { BACKDROP_IMAGES };

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
  setActiveTab?: React.Dispatch<React.SetStateAction<DashboardTab>>;
  onNavigateToAdhkarForPrayer?: (prayerName: string) => void;
  customDuas: CustomDua[];
  setCustomDuas: React.Dispatch<React.SetStateAction<CustomDua[]>>;
  quranSessions?: QuranSession[];
  khatmat?: QuranKhatma[];
  dhikrLogs?: Record<string, Record<string, number>>;
  voluntaryPrayerLogs?: VoluntaryPrayerLog[];
  setVoluntaryPrayerLogs?: React.Dispatch<React.SetStateAction<VoluntaryPrayerLog[]>>;
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
  onNavigateToAdhkarForPrayer,
  customDuas,
  setCustomDuas,
  quranSessions = [],
  khatmat = [],
  dhikrLogs = {},
  voluntaryPrayerLogs = [],
  setVoluntaryPrayerLogs,
  onInstallApp,
  isPwaInstalled = false
}: DashboardProps) {
  const [selectedPrayerToLog, setSelectedPrayerToLog] = useState<PrayerName | null>(null);
  const [showDuhaQuickLog, setShowDuhaQuickLog] = useState<boolean>(false);
  const [showNightPrayersQuickLog, setShowNightPrayersQuickLog] = useState<boolean>(false);
  const [dashboardSections, setDashboardSections] = useState<Record<DashboardSectionId, boolean>>(() => getDashboardSectionsConfig());
  const [appModal, setAppModal] = useState<{ message: string; variant: AppModalVariant } | null>(null);
  const [futurePrayerWarning, setFuturePrayerWarning] = useState<PrayerName | null>(null);
  const [showPushControlCenter, setShowPushControlCenter] = useState<boolean>(false);
  const [dismissedBackupBanner, setDismissedBackupBanner] = useState(false);

  const {
    now,
    todayStr,
    hijri,
    gregorianClean,
    times,
    current,
    next,
    timeRemainingStr,
    progressPercent,
    isFridayWindow,
    currentBackdropKey,
    activeCardGradient,
  } = useDashboardTimeAndPrayers({ settings });

  const [dismissedTravelBanner, setDismissedTravelBanner] = useState(() => {
    return safeGetItem('salah_dismissed_travel_banner') === todayStr;
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationToast, setLocationToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isKhushuSheetOpen, setIsKhushuSheetOpen] = useState<boolean>(false);

  const {
    isActive: isKhushuActive,
    currentMode: khushuMode,
    currentDuration: khushuDuration,
    remainingSeconds: khushuRemainingSeconds,
    formatRemainingTime: formatKhushuRemainingTime,
    hasPermission: hasKhushuPermission,
    isLoading: isKhushuLoading,
    settings: khushuSettings,
    updateSettings: updateKhushuSettings,
    shieldVisible: isKhushuShieldVisible,
    postPrayerModalOpen: isKhushuPostPrayerOpen,
    dismissShield: dismissKhushuShield,
    closePostPrayerModal: closeKhushuPostPrayerModal,
    activate: activateKhushu,
    deactivate: deactivateKhushu,
    requestPermission: requestKhushuPermission,
  } = useKhushuMode();

  const needsBackup = React.useMemo(() => {
    const lastBackup = safeGetItem('salah_last_backup_time');
    if (!lastBackup) return true;
    const days = (Date.now() - parseInt(lastBackup, 10)) / (1000 * 60 * 60 * 24);
    return days >= 14;
  }, []);

  // محرك أتمتة الخشوع التلقائي مع وقت الإقامة
  useKhushuAutoScheduler({
    settings: khushuSettings,
    times,
    isActive: isKhushuActive,
    activate: activateKhushu,
  });

  // Location GPS sync hook
  const { handleGPSLocationSync } = useLocationSync({
    setSettings,
    setIsLocating,
    setLocationToast,
  });

  // Global window and custom event listeners hook
  useDashboardEvents({
    now,
    times,
    setDashboardSections,
    setShowDuhaQuickLog,
    setFuturePrayerWarning,
    setSelectedPrayerToLog,
    handleGPSLocationSync,
  });

  // Spiritual notifications hook & header broadcast
  const {
    spiritualNotifications,
    showNotificationsModal,
    setShowNotificationsModal,
  } = useDashboardSpiritualNotifications({
    now,
    hijri,
    pendingQadaPrayers,
    setPendingQadaPrayers,
    ramadanQada,
    setRamadanQada,
    setFastingLogs,
    toArabicNumbers,
    setActiveTab,
  });

  // Status logs for today
  const todayLogs = prayerLogs[todayStr] || {};

  const isDarkTheme = settings.theme === 'dark' || 
    ((!settings.theme || settings.theme === 'system') && 
     (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayNameArabic = arabicDays[now.getDay()];

  // Active App Style (Automatically unifies Theme & Glass style)
  const currentStyle = isDarkTheme ? 'glass-dark' : 'faith-bright';

  // Analog Clock & Clock Face Hook
  const {
    clockFace,
    setClockFace,
    showAnalogClock,
    setShowAnalogClock,
    renderCardAnalogClock,
  } = useDashboardClockFace({
    settings,
    setSettings,
    now,
    currentStyle,
    dayNameArabic,
    toArabicNumbers,
  });

  // Active actionable nudge hook
  const { activeNudge, handleExecuteNudgeAction } = useDashboardActiveNudge({
    prayerLogs,
    pendingQadaPrayers,
    fastingLogs,
    quranSessions,
    dhikrLogs,
    setSettings,
    setAppModal,
  });

  // Action handlers for prayer logging, sunnah, nafilah, and fasting
  const {
    handleUpdateNafilah,
    handleLogPrayer,
    handleUpdateSunnah,
    toggleFasting,
    todayFast,
  } = useDashboardPrayerActions({
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
  });

  const handleExportBackup = () => {
    exportDashboardBackup({
      settings,
      prayerLogs,
      pendingQadaPrayers,
      voluntaryPrayerLogs,
      fastingLogs,
      ramadanQada,
      customDuas,
      quranSessions,
      khatmat,
      dhikrLogs,
      todayStr,
      setDismissedBackupBanner,
    });
  };

  const blockSharedProps = useDashboardBlockSharedProps({
    hijri,
    gregorianClean,
    dayNameArabic,
    setActiveTab,
    now,
    showAnalogClock,
    setShowAnalogClock,
    renderCardAnalogClock,
    clockFace,
    setClockFace,
    next,
    times,
    current,
    timeRemainingStr,
  });

  return (
    <div id="dashboard-root" className="space-y-6" dir="rtl">
      {/* 1. High-Fidelity Main Prayer Card with Custom Gradient & Elegant Image Backdrop */}
      <MainPrayerCardContainer
        activeCardGradient={activeCardGradient}
        currentBackdropKey={currentBackdropKey}
        settings={settings}
        blockSharedProps={blockSharedProps}
        current={current}
        times={times}
        todayLogs={todayLogs}
        now={now}
        getArabicPrayerName={getArabicPrayerName}
        toArabicNumbers={toArabicNumbers}
        isPrayerInFuture={isPrayerInFuture}
        setShowDuhaQuickLog={setShowDuhaQuickLog}
        setFuturePrayerWarning={setFuturePrayerWarning}
        setSelectedPrayerToLog={setSelectedPrayerToLog}
      />

      {/* Khushu Mode (Silence Phone Distractions During Prayer) */}
      <KhushuModeDashboardCard
        isActive={isKhushuActive}
        mode={khushuMode}
        durationMinutes={khushuDuration}
        formatRemainingTime={formatKhushuRemainingTime}
        onOpenSheet={() => setIsKhushuSheetOpen(true)}
        onQuickActivate={() => activateKhushu()}
        onDeactivate={deactivateKhushu}
        isLoading={isKhushuLoading}
        appStyle={currentStyle}
      />

      {/* Dashboard Banners & Notifications */}
      <DashboardBanners
        now={now}
        todayStr={todayStr}
        prayerLogs={prayerLogs}
        getArabicPrayerName={getArabicPrayerName}
        setActiveTab={setActiveTab}
        locationToast={locationToast}
        setLocationToast={setLocationToast}
        dhikrLogs={dhikrLogs}
        khatmat={khatmat}
        dismissedTravelBanner={dismissedTravelBanner}
        setDismissedTravelBanner={setDismissedTravelBanner}
        needsBackup={needsBackup}
        dismissedBackupBanner={dismissedBackupBanner}
        setDismissedBackupBanner={setDismissedBackupBanner}
        handleExportBackup={handleExportBackup}
        hijri={hijri}
        times={times}
        currentStyle={currentStyle}
        dashboardSections={dashboardSections}
      />

      {/* Unified Progress & Worship Portal Card (5 Daily/Weekly/Monthly Buttons - Always Visible) */}
      <UnifiedProgressCard
        prayerLogs={prayerLogs}
        fastingLogs={fastingLogs}
        dhikrLogs={dhikrLogs}
        quranSessions={quranSessions}
        khatmat={khatmat}
        isWomenExcuse={settings?.isWomenExcuse}
        onNavigateTab={(tab) => setActiveTab && setActiveTab(tab as DashboardTab)}
        appStyle={currentStyle}
        settings={settings}
      />

      {/* Summary strips (Quran, Khushu, Streaks) */}
      <DashboardSummaryStrips
        quranSummaryVisible={!!dashboardSections.quranSummary}
        khushuSummaryVisible={!!dashboardSections.khushuSummary}
        khatmat={khatmat}
        prayerLogs={prayerLogs}
        setActiveTab={setActiveTab}
        toArabicNumbers={toArabicNumbers}
      />

      {/* Feature Discovery Widget (Opt-in, default disabled) */}
      {dashboardSections.featureDiscovery && (
        <FeatureDiscoveryWidget
          onSelectTab={(tab, subTab) => {
            if (setActiveTab) {
              setActiveTab(tab as DashboardTab);
              if (tab === 'settings' && subTab) {
                window.dispatchEvent(new CustomEvent('change-settings-subtab', { detail: { subTab } }));
              }
            }
          }}
          onOpenTour={() => {
            window.dispatchEvent(new CustomEvent('open-feature-tour'));
          }}
        />
      )}

      {/* Pinned Favorite Widget (Opt-in, default disabled) */}
      {dashboardSections.pinnedFavorite && (
        <PinnedFavoriteWidget
          pinnedWidget={settings.pinnedWidget || { enabled: true, type: 'timeline', theme: 'dark-blue', wallpaper: 'slate' }}
          cityName={settings.cityName}
          now={now}
          hijri={hijri}
          times={times}
          current={current}
          next={next}
          timeRemainingStr={timeRemainingStr}
          dayNameArabic={dayNameArabic}
          gregorianClean={gregorianClean}
          toArabicNumbers={toArabicNumbers}
          isKhushuActive={isKhushuActive}
          onNavigateWidgets={() => setActiveTab && setActiveTab('widgets')}
        />
      )}

      {isFridayWindow && (
        <FridayMode 
          settings={settings} 
          onNavigateTab={(tab) => setActiveTab && setActiveTab(tab as DashboardTab)} 
        />
      )}

      {/* Daily Shortcuts & Actionables (Nafilah, Duas, Nudge, Fasting) */}
      <DashboardDailyShortcuts
        currentStyle={currentStyle}
        todayLogs={todayLogs}
        handleUpdateNafilah={handleUpdateNafilah}
        setActiveTab={setActiveTab}
        toArabicNumbers={toArabicNumbers}
        customDuas={customDuas}
        activeNudge={activeNudge}
        handleExecuteNudgeAction={handleExecuteNudgeAction}
        isFasted={todayFast.fasted}
        toggleFasting={toggleFasting}
      />

      {/* All Dashboard Modals & Quick Log Dialogs */}
      <DashboardModalsContainer
        futurePrayerWarning={futurePrayerWarning}
        setFuturePrayerWarning={setFuturePrayerWarning}
        selectedPrayerToLog={selectedPrayerToLog}
        setSelectedPrayerToLog={setSelectedPrayerToLog}
        todayLogs={todayLogs}
        todayStr={todayStr}
        hijri={hijri}
        settings={settings}
        pendingQadaPrayers={pendingQadaPrayers}
        prayerLogs={prayerLogs}
        setPrayerLogs={setPrayerLogs}
        setPendingQadaPrayers={setPendingQadaPrayers}
        voluntaryPrayerLogs={voluntaryPrayerLogs}
        setVoluntaryPrayerLogs={setVoluntaryPrayerLogs}
        handleUpdateSunnah={handleUpdateSunnah}
        handleUpdateNafilah={handleUpdateNafilah}
        showNightPrayersQuickLog={showNightPrayersQuickLog}
        setShowNightPrayersQuickLog={setShowNightPrayersQuickLog}
        showDuhaQuickLog={showDuhaQuickLog}
        setShowDuhaQuickLog={setShowDuhaQuickLog}
        showNotificationsModal={showNotificationsModal}
        setShowNotificationsModal={setShowNotificationsModal}
        showPushControlCenter={showPushControlCenter}
        setShowPushControlCenter={setShowPushControlCenter}
        spiritualNotifications={spiritualNotifications}
        appModal={appModal}
        setAppModal={setAppModal}
        onNavigateToAdhkarForPrayer={onNavigateToAdhkarForPrayer}
        setActiveTab={setActiveTab}
        now={now}
      />

      {/* Unified Khushu Mode Modals, Distraction Shield & Post-Prayer Flow */}
      <DashboardKhushuModals
        isKhushuSheetOpen={isKhushuSheetOpen}
        setIsKhushuSheetOpen={setIsKhushuSheetOpen}
        isKhushuActive={isKhushuActive}
        khushuMode={khushuMode}
        khushuDuration={khushuDuration}
        khushuRemainingSeconds={khushuRemainingSeconds}
        hasKhushuPermission={hasKhushuPermission}
        khushuSettings={khushuSettings}
        updateKhushuSettings={updateKhushuSettings}
        activateKhushu={activateKhushu}
        deactivateKhushu={deactivateKhushu}
        requestKhushuPermission={requestKhushuPermission}
        isKhushuShieldVisible={isKhushuShieldVisible}
        dismissKhushuShield={dismissKhushuShield}
        isKhushuPostPrayerOpen={isKhushuPostPrayerOpen}
        closeKhushuPostPrayerModal={closeKhushuPostPrayerModal}
        onOpenAthkar={() => {
          if (setActiveTab) setActiveTab('adhkar');
        }}
      />
    </div>
  );
}
