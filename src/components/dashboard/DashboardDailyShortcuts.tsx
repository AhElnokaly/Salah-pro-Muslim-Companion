/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NafilahPrayersCard } from './NafilahPrayersCard';
import { CustomDuasHomeWidget } from './CustomDuasHomeWidget';
import { ActionableNudgeBanner } from './ActionableNudgeBanner';
import { FastingTrackerBar } from './FastingTrackerBar';
import { DashboardTab, PrayerLog } from '../../types';

export interface DashboardDailyShortcutsProps {
  currentStyle: any;
  todayLogs: Record<string, PrayerLog>;
  handleUpdateNafilah: (nafilahKey: string, completed: boolean) => void;
  setActiveTab?: (tab: DashboardTab) => void;
  toArabicNumbers: (n: number | string) => string;
  customDuas: any[];
  activeNudge: any;
  handleExecuteNudgeAction: (actionId: string) => void;
  isFasted: boolean;
  toggleFasting: () => void;
}

export const DashboardDailyShortcuts: React.FC<DashboardDailyShortcutsProps> = ({
  currentStyle,
  todayLogs,
  handleUpdateNafilah,
  setActiveTab,
  toArabicNumbers,
  customDuas,
  activeNudge,
  handleExecuteNudgeAction,
  isFasted,
  toggleFasting,
}) => {
  return (
    <>
      {/* Nafilah & Optional Prayers Card (Home Quick Access) */}
      <NafilahPrayersCard
        currentStyle={currentStyle}
        todayLogs={todayLogs}
        handleUpdateNafilah={handleUpdateNafilah}
        setActiveTab={setActiveTab}
        toArabicNumbers={toArabicNumbers}
      />

      {/* Custom Duas Home Widget */}
      <CustomDuasHomeWidget
        customDuas={customDuas}
        toArabicNumbers={toArabicNumbers}
      />

      {/* Actionable Local Nudges */}
      <ActionableNudgeBanner
        activeNudge={activeNudge}
        onExecuteAction={handleExecuteNudgeAction}
      />

      {/* Fasting Tracker Bar - Compact Full-Width */}
      <FastingTrackerBar
        isFasted={isFasted}
        onToggleFasting={toggleFasting}
      />
    </>
  );
};
