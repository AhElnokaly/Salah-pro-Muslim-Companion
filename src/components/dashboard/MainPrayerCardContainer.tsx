import React from 'react';
import MosqueBackdrop, { BackdropType } from '../MosqueBackdrop';
import { CARD_BLOCK_REGISTRY, CardBlockSharedProps } from './blocks';
import { MainPrayerCardPrayersRow } from './MainPrayerCardPrayersRow';
import { AppSettings, PrayerName, PrayerTimes, PrayerLog, DEFAULT_CARD_LAYOUT } from '../../types';

interface MainPrayerCardContainerProps {
  activeCardGradient: string;
  currentBackdropKey: BackdropType;
  settings: AppSettings;
  blockSharedProps: CardBlockSharedProps;
  current: PrayerName;
  times: PrayerTimes;
  todayLogs: Record<string, PrayerLog>;
  now: Date;
  getArabicPrayerName: (p: PrayerName) => string;
  toArabicNumbers: (n: number | string) => string;
  isPrayerInFuture: (pName: PrayerName, now: Date, times: PrayerTimes) => boolean;
  setShowDuhaQuickLog: (show: boolean) => void;
  setFuturePrayerWarning: (p: PrayerName | null) => void;
  setSelectedPrayerToLog: (p: PrayerName | null) => void;
}

export const MainPrayerCardContainer: React.FC<MainPrayerCardContainerProps> = ({
  activeCardGradient,
  currentBackdropKey,
  settings,
  blockSharedProps,
  current,
  times,
  todayLogs,
  now,
  getArabicPrayerName,
  toArabicNumbers,
  isPrayerInFuture,
  setShowDuhaQuickLog,
  setFuturePrayerWarning,
  setSelectedPrayerToLog
}) => {
  const cardLayout = settings.mainCardLayout ?? DEFAULT_CARD_LAYOUT;
  const visibleBlocks = [...cardLayout.blocks]
    .filter(b => b.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div 
      id="main-prayer-card"
      role="region"
      aria-label="بطاقة مواقيت الصلاة والعد التنازلي"
      className={`w-full bg-gradient-to-b ${activeCardGradient} text-white rounded-3xl p-4 sm:p-5 gap-3 min-h-[260px] sm:min-h-[280px] shadow-xl relative overflow-hidden flex flex-col justify-between transition-all duration-500 ease-in-out`}
    >
      {/* High-Precision Islamic Mosque Vector Backdrop (Offline, Sharp, No Checkerboard, No Broken Alt Text) */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <MosqueBackdrop type={currentBackdropKey} renderMode={settings.backdropRenderMode} opacity={settings.backdropOpacity} />
      </div>

      {/* Dynamic Configurable Card Blocks System */}
      <div className="z-10 w-full flex flex-col items-center justify-between gap-1.5">
        {visibleBlocks.map(blockConfig => {
          const registryEntry = CARD_BLOCK_REGISTRY[blockConfig.id];
          if (!registryEntry) return null;
          const BlockComponent = registryEntry.component;
          return (
            <BlockComponent
              key={blockConfig.id}
              size={blockConfig.size}
              accent={blockConfig.accent}
              {...blockSharedProps}
            />
          );
        })}
      </div>

      {/* Horizontal list of 6 prayers inside the card */}
      <MainPrayerCardPrayersRow
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
    </div>
  );
};
