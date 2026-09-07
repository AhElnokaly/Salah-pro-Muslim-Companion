import React from 'react';
import { CardBlockId, CardBlockSize, CardBlockAccent, PrayerName, PrayerTimes, ClockFaceType, DashboardTab } from '../../../types';
import DateHeaderBlock from './DateHeaderBlock';
import EventTagBlock from './EventTagBlock';
import GreetingBlock from './GreetingBlock';
import ClockBlock from './ClockBlock';
import NextPrayerBlock from './NextPrayerBlock';
import ProgressBarBlock from './ProgressBarBlock';
import SunnahQuoteBlock from './SunnahQuoteBlock';

export interface CardBlockSharedProps {
  size?: CardBlockSize;
  accent?: CardBlockAccent;
  hijri?: { day: number; month: number; year: number; monthName?: string; fullString: string };
  gregorianClean?: string;
  dayNameArabic?: string;
  setActiveTab?: (tab: DashboardTab | string) => void;
  onNavigateTab?: (tab: string, subTab?: string) => void;
  getMoonPhaseInfo?: (day: number) => { name: string; icon: string; illumination: number };
  toArabicNumbers?: (str: string | number) => string;
  timePeriodLabel?: string;
  activeNudge?: { text: string; icon?: React.ReactNode; actionLabel?: string; onAction?: () => void } | null;
  now?: Date;
  showAnalogClock?: boolean;
  setShowAnalogClock?: React.Dispatch<React.SetStateAction<boolean>>;
  renderCardAnalogClock?: () => React.ReactNode;
  clockFace?: ClockFaceType;
  setClockFace?: (face: ClockFaceType) => void;
  next?: PrayerName;
  times?: PrayerTimes;
  getArabicPrayerName?: (prayer: PrayerName, date?: Date) => string;
  timeRemainingStr?: string;
  current?: PrayerName;
  getPrayerProgressPercentage?: () => number;
}

export const CARD_BLOCK_REGISTRY: Record<CardBlockId, { component: React.ComponentType<CardBlockSharedProps>; label: string }> = {
  dateHeader:  { component: DateHeaderBlock as React.ComponentType<CardBlockSharedProps>,  label: 'التاريخ والهجري' },
  eventTag:    { component: EventTagBlock as React.ComponentType<CardBlockSharedProps>,    label: 'شارة المناسبة' },
  greeting:    { component: GreetingBlock as React.ComponentType<CardBlockSharedProps>,    label: 'رسالة الترحيب' },
  clock:       { component: ClockBlock as React.ComponentType<CardBlockSharedProps>,       label: 'الساعة' },
  nextPrayer:  { component: NextPrayerBlock as React.ComponentType<CardBlockSharedProps>,  label: 'الصلاة القادمة' },
  progressBar: { component: ProgressBarBlock as React.ComponentType<CardBlockSharedProps>, label: 'شريط التقدم' },
  sunnahQuote: { component: SunnahQuoteBlock as React.ComponentType<CardBlockSharedProps>, label: 'نصيحة السنن' },
};

export {
  DateHeaderBlock,
  EventTagBlock,
  GreetingBlock,
  ClockBlock,
  NextPrayerBlock,
  ProgressBarBlock,
  SunnahQuoteBlock
};
