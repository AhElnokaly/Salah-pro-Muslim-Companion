/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { KhushuModeType } from '../../services/khushuModePlugin';
import { KhushuSettings } from '../../domain/khushu/khushuTypes';
import { KhushuModeSheet } from '../KhushuModeSheet';
import { KhushuDistractionShield } from './KhushuDistractionShield';
import { KhushuPostPrayerModal } from './KhushuPostPrayerModal';

export interface DashboardKhushuModalsProps {
  isKhushuSheetOpen: boolean;
  setIsKhushuSheetOpen: (open: boolean) => void;
  isKhushuActive: boolean;
  khushuMode: KhushuModeType;
  khushuDuration: number;
  khushuRemainingSeconds: number;
  hasKhushuPermission: boolean;
  khushuSettings: KhushuSettings;
  updateKhushuSettings: (newSettings: Partial<KhushuSettings>) => void;
  activateKhushu: (durationMinutes?: number, modeOverride?: KhushuModeType) => Promise<boolean>;
  deactivateKhushu: () => Promise<boolean>;
  requestKhushuPermission: () => Promise<void>;
  isKhushuShieldVisible: boolean;
  dismissKhushuShield: () => void;
  isKhushuPostPrayerOpen: boolean;
  closeKhushuPostPrayerModal: () => void;
  onOpenAthkar?: () => void;
}

export const DashboardKhushuModals: React.FC<DashboardKhushuModalsProps> = ({
  isKhushuSheetOpen,
  setIsKhushuSheetOpen,
  isKhushuActive,
  khushuMode,
  khushuDuration,
  khushuRemainingSeconds,
  hasKhushuPermission,
  khushuSettings,
  updateKhushuSettings,
  activateKhushu,
  deactivateKhushu,
  requestKhushuPermission,
  isKhushuShieldVisible,
  dismissKhushuShield,
  isKhushuPostPrayerOpen,
  closeKhushuPostPrayerModal,
  onOpenAthkar,
}) => {
  return (
    <>
      {/* Khushu Mode Settings & Activation Sheet */}
      <KhushuModeSheet
        isOpen={isKhushuSheetOpen}
        onClose={() => setIsKhushuSheetOpen(false)}
        isActive={isKhushuActive}
        currentMode={khushuMode}
        currentDuration={khushuDuration}
        remainingSeconds={khushuRemainingSeconds}
        hasPermission={hasKhushuPermission}
        settings={khushuSettings}
        onUpdateSettings={updateKhushuSettings}
        onActivate={activateKhushu}
        onDeactivate={deactivateKhushu}
        onRequestPermission={requestKhushuPermission}
      />

      {/* شاشة السكون الإيماني عند فتح التطبيق أثناء الصلاة */}
      <KhushuDistractionShield
        isActive={isKhushuActive && isKhushuShieldVisible}
        remainingSeconds={khushuRemainingSeconds}
        durationMinutes={khushuDuration}
        mode={khushuMode}
        onDeactivate={deactivateKhushu}
        onDismiss={dismissKhushuShield}
      />

      {/* نافذة أذكار ما بعد الصلاة عند انقضاء وقت الخشوع */}
      <KhushuPostPrayerModal
        isOpen={isKhushuPostPrayerOpen}
        onClose={closeKhushuPostPrayerModal}
        onOpenAthkar={onOpenAthkar}
      />
    </>
  );
};
