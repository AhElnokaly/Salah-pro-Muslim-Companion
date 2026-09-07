import React, { Suspense, RefObject } from 'react';
import { safeRemoveItem } from '../../utils/storage';
import { safeLazy } from '../../utils/safeLazy';
import { TabId, SettingsSubTabId, AppSettings, AlarmConfig } from '../../types';

// Lazy Loaded Modal Dialogs
const PwaInstallModal = safeLazy(() => import('../PwaInstallModal').then(m => ({ default: m.PwaInstallModal })));
const SpiritualPortalModal = safeLazy(() => import('../SpiritualPortalModal').then(m => ({ default: m.SpiritualPortalModal })));
const CustomAlarmOverlay = safeLazy(() => import('../CustomAlarmOverlay').then(m => ({ default: m.CustomAlarmOverlay })));
const FeatureTourModal = safeLazy(() => import('../FeatureTourModal'));
const QuickSettingsModal = safeLazy(() => import('../QuickSettingsModal').then(m => ({ default: m.QuickSettingsModal })));
const PostOnboardingWelcomeModal = safeLazy(() => import('../PostOnboardingWelcomeModal'));
const SpiritualSearchModal = safeLazy(() => import('../SpiritualSearchModal'));
const VersionInfoModal = safeLazy(() => import('../VersionInfoModal'));

export interface AppModalOutletsProps {
  showPwaInstallGuide: boolean;
  setShowPwaInstallGuide: (show: boolean) => void;
  showManualSteps: boolean;
  setShowManualSteps: (show: boolean) => void;
  handleDirectInstallInsideModal: (setToast: (msg: string | null) => void) => void;
  showSpiritualModal: boolean;
  setShowSpiritualModal: (show: boolean) => void;
  activeRingingAlarm: AlarmConfig | null;
  setActiveRingingAlarm: (alarm: AlarmConfig | null) => void;
  setCustomAlarms: React.Dispatch<React.SetStateAction<AlarmConfig[]>>;
  globalAudioRef: RefObject<HTMLAudioElement | null>;
  isTourModalOpen: boolean;
  setIsTourModalOpen: (open: boolean) => void;
  isQuickSettingsOpen: boolean;
  setIsQuickSettingsOpen: (open: boolean) => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;
  isSpiritualSearchOpen: boolean;
  setIsSpiritualSearchOpen: (open: boolean) => void;
  isVersionModalOpen: boolean;
  setIsVersionModalOpen: (open: boolean) => void;
  setActiveTab: (tab: TabId) => void;
  setActiveSettingsSubTab: (subTab: SettingsSubTabId) => void;
  setToastMessage: (msg: string | null) => void;
}

export const AppModalOutlets: React.FC<AppModalOutletsProps> = ({
  showPwaInstallGuide,
  setShowPwaInstallGuide,
  showManualSteps,
  setShowManualSteps,
  handleDirectInstallInsideModal,
  showSpiritualModal,
  setShowSpiritualModal,
  activeRingingAlarm,
  setActiveRingingAlarm,
  setCustomAlarms,
  globalAudioRef,
  isTourModalOpen,
  setIsTourModalOpen,
  isQuickSettingsOpen,
  setIsQuickSettingsOpen,
  settings,
  setSettings,
  showWelcomeModal,
  setShowWelcomeModal,
  isSpiritualSearchOpen,
  setIsSpiritualSearchOpen,
  isVersionModalOpen,
  setIsVersionModalOpen,
  setActiveTab,
  setActiveSettingsSubTab,
  setToastMessage,
}) => {
  return (
    <Suspense fallback={null}>
      {/* PWA Installation Guide Modal */}
      {showPwaInstallGuide && (
        <PwaInstallModal
          isOpen={showPwaInstallGuide}
          onClose={() => setShowPwaInstallGuide(false)}
          showManualSteps={showManualSteps}
          setShowManualSteps={setShowManualSteps}
          onDirectInstall={() => handleDirectInstallInsideModal(setToastMessage)}
        />
      )}

      {/* بوابة النفحات الإيمانية */}
      {showSpiritualModal && (
        <SpiritualPortalModal
          isOpen={showSpiritualModal}
          onClose={() => setShowSpiritualModal(false)}
          setToastMessage={setToastMessage}
        />
      )}

      {/* Global Custom Alarm Ringing Modal */}
      {activeRingingAlarm && (
        <CustomAlarmOverlay
          activeRingingAlarm={activeRingingAlarm}
          onSnooze={() => {
            if (globalAudioRef.current) {
              globalAudioRef.current.pause();
            }
            const snoozedAlarm: AlarmConfig = {
              ...activeRingingAlarm,
              id: `snooze_${Date.now()}`,
              title: `${activeRingingAlarm.title} (غفوة)`,
              time: (() => {
                const d = new Date();
                d.setMinutes(d.getMinutes() + 5);
                return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
              })(),
              days: [new Date().getDay()],
              enabled: true,
              soundType: activeRingingAlarm.soundType
            };
            setCustomAlarms((prev: AlarmConfig[]) => [...prev, snoozedAlarm]);
            setActiveRingingAlarm(null);
            setToastMessage("تم تأجيل المنبه لمدة ٥ دقائق ⏰");
          }}
          onStop={() => {
            if (globalAudioRef.current) {
              globalAudioRef.current.pause();
            }
            setActiveRingingAlarm(null);
          }}
        />
      )}

      {/* Feature Tour Guide Modal */}
      {isTourModalOpen && (
        <FeatureTourModal
          isOpen={isTourModalOpen}
          onClose={() => setIsTourModalOpen(false)}
          onSelectTab={(tab, subTab) => {
            setActiveTab(tab as TabId);
            if (subTab) {
              setActiveSettingsSubTab(subTab as SettingsSubTabId);
            }
          }}
        />
      )}

      {/* Quick Interactive Settings Modal */}
      {isQuickSettingsOpen && (
        <QuickSettingsModal
          isOpen={isQuickSettingsOpen}
          onClose={() => setIsQuickSettingsOpen(false)}
          settings={settings}
          setSettings={setSettings}
          setToastMessage={setToastMessage}
          onOpenFullSettings={() => {
            setActiveTab('settings');
            setActiveSettingsSubTab('prayer');
          }}
        />
      )}

      {/* Post Onboarding Welcome Modal */}
      {showWelcomeModal && (
        <PostOnboardingWelcomeModal
          isOpen={showWelcomeModal}
          onStartTour={() => {
            safeRemoveItem('salah_show_post_onboarding_welcome');
            setShowWelcomeModal(false);
            setIsTourModalOpen(true);
          }}
          onExploreOnOwn={() => {
            safeRemoveItem('salah_show_post_onboarding_welcome');
            setShowWelcomeModal(false);
          }}
        />
      )}

      {/* Spiritual Search Modal (Unified Search across Quran, Adhkar, Prayers & Events) */}
      {isSpiritualSearchOpen && (
        <SpiritualSearchModal
          isOpen={isSpiritualSearchOpen}
          onClose={() => setIsSpiritualSearchOpen(false)}
          setActiveTab={setActiveTab}
          setToastMessage={setToastMessage}
        />
      )}

      {/* Version Information & Changelog Modal */}
      {isVersionModalOpen && (
        <VersionInfoModal
          isOpen={isVersionModalOpen}
          onClose={() => setIsVersionModalOpen(false)}
        />
      )}
    </Suspense>
  );
};
