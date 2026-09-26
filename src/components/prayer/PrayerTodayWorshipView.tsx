/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppSettings, PrayerLog, PrayerName, PrayerStatus } from '../../types';
import { FIVE_PRAYERS_ONLY } from '../../utils/alarmUtils';
import { PrayerDayNavigationHeader } from './PrayerDayNavigationHeader';
import { DailyPrayerCard } from './DailyPrayerCard';
import { NafilahWorshipCards } from './NafilahWorshipCards';

export interface PrayerTodayWorshipViewProps {
  selectedDateOffset: number;
  setSelectedDateOffset: React.Dispatch<React.SetStateAction<number>>;
  targetDate: Date;
  hijri: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    fullString: string;
  };
  targetTimestamp: number;
  dayLogs: Record<string, PrayerLog>;
  times: Record<PrayerName, string>;
  settings: AppSettings;
  handleLogPrayerStatus: (prayer: PrayerName, status: PrayerStatus) => void;
  handleUpdateSunnah: (prayer: PrayerName, type: 'before' | 'after', amount: number) => void;
  handleUpdateNafilah: (prayerKey: 'Duha' | 'Qiyam' | 'Witr', rakahs: number) => void;
  setShowDuhaModal: (show: boolean) => void;
  setLogSuccessMessage: (msg: string) => void;
  isPlaying?: boolean;
  currentPhraseIdx?: number;
  athanPhrases?: { text: string; duration: number; isFajrOnly?: boolean }[];
  currentPlayingPrayer?: PrayerName | null;
}

export const PrayerTodayWorshipView: React.FC<PrayerTodayWorshipViewProps> = ({
  selectedDateOffset,
  setSelectedDateOffset,
  targetDate,
  hijri,
  targetTimestamp,
  dayLogs,
  times,
  settings,
  handleLogPrayerStatus,
  handleUpdateSunnah,
  handleUpdateNafilah,
  setShowDuhaModal,
  setLogSuccessMessage,
}) => {
  const getStatusBtnClass = (prayer: PrayerName, status: PrayerStatus): string => {
    const currentStatus = dayLogs[prayer]?.status;
    const isSelected = currentStatus === status;

    if (isSelected) {
      if (status === 'A') return 'bg-emerald-600 text-white shadow-xs font-black';
      if (status === 'B') return 'bg-indigo-600 text-white shadow-xs font-black';
      if (status === 'C') return 'bg-amber-600 text-white shadow-xs font-black';
      if (status === 'D') return 'bg-rose-600 text-white shadow-xs font-black';
      if (status === 'E') return 'bg-purple-600 text-white shadow-xs font-black';
    }

    return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Date Navigation Header */}
      <PrayerDayNavigationHeader
        selectedDateOffset={selectedDateOffset}
        setSelectedDateOffset={setSelectedDateOffset}
        targetDate={targetDate}
        hijri={hijri}
        setLogSuccessMessage={setLogSuccessMessage}
      />

      {/* 5 Daily Obligatory Prayers */}
      <div className="space-y-3">
        {FIVE_PRAYERS_ONLY.map((pName) => (
          <DailyPrayerCard
            key={pName}
            prayer={pName}
            targetTimestamp={targetTimestamp}
            log={dayLogs[pName]}
            timeStr={times[pName] || '--:--'}
            settings={settings}
            handleLogPrayerStatus={handleLogPrayerStatus}
            handleUpdateSunnah={handleUpdateSunnah}
            getStatusBtnClass={getStatusBtnClass}
          />
        ))}
      </div>

      {/* Nafilah Cards: Duha & Qiyam/Witr */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <NafilahWorshipCards
          type="duha"
          dayLogs={dayLogs}
          handleUpdateNafilah={handleUpdateNafilah}
          setShowDuhaModal={setShowDuhaModal}
        />
        <NafilahWorshipCards
          type="qiyam"
          dayLogs={dayLogs}
          handleUpdateNafilah={handleUpdateNafilah}
        />
      </div>
    </div>
  );
};

export default PrayerTodayWorshipView;
