import React, { Suspense, RefObject } from 'react';
import { safeRemoveItem } from '../../utils/storage';
import { safeLazy } from '../../utils/safeLazy';
import { TabId, SettingsSubTabId, AppSettings, AlarmConfig } from '../../types';
import { stopSpiritualSound } from '../../utils/spiritualAudio';

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
            stopSpiritualSound(globalAudioRef);
            const now = new Date();
            const targetDate = new Date(now.getTime() + 5 * 60 * 1000);
            const snoozeHours = targetDate.getHours().toString().padStart(2, '0');
            const snoozeMins = targetDate.getMinutes().toString().padStart(2, '0');
            const snoozeTime = `${snoozeHours}:${snoozeMins}`;
            const snoozeDay = targetDate.getDay();

            // Clean title of any previous (غفوة) tag
            const rawTitle = activeRingingAlarm.title || 'منبه';
            const cleanTitle = rawTitle.replace(/\s*\(غفوة\)/g, '').trim();

            // Create a strictly FIXED-TIME one-shot alarm without relative prayer fields
            const snoozedAlarm: AlarmConfig = {
              id: `snooze_${Date.now()}`,
              title: `${cleanTitle} (غفوة)`,
              type: 'fixed',
              time: snoozeTime,
              days: [snoozeDay],
              enabled: true,
              soundType: activeRingingAlarm.soundType || 'takbeer',
              notifyMode: activeRingingAlarm.notifyMode || 'both',
              autoKhushu: activeRingingAlarm.autoKhushu,
              khushuDurationMinutes: activeRingingAlarm.khushuDurationMinutes,
            };

            setCustomAlarms((prev: AlarmConfig[]) => {
              const filtered = prev.filter(a => a.id !== activeRingingAlarm.id && !a.id.startsWith('snooze_'));
              const nextAlarms = [...filtered, snoozedAlarm];
              window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: nextAlarms }));
              return nextAlarms;
            });

            setActiveRingingAlarm(null);
            setToastMessage("تم تأجيل المنبه لمدة ٥ دقائق ⏰");
          }}
          onStop={() => {
            stopSpiritualSound(globalAudioRef);
            if (activeRingingAlarm.id.startsWith('snooze_')) {
              setCustomAlarms((prev: AlarmConfig[]) => {
                const nextAlarms = prev.filter(a => a.id !== activeRingingAlarm.id);
                window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: nextAlarms }));
                return nextAlarms;
              });
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
