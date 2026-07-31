import React from 'react';
import { CardBlockId } from '../../../types';
import DateHeaderBlock from './DateHeaderBlock';
import EventTagBlock from './EventTagBlock';
import GreetingBlock from './GreetingBlock';
import ClockBlock from './ClockBlock';
import NextPrayerBlock from './NextPrayerBlock';
import ProgressBarBlock from './ProgressBarBlock';
import SunnahQuoteBlock from './SunnahQuoteBlock';

export const CARD_BLOCK_REGISTRY: Record<CardBlockId, { component: React.FC<any>; label: string }> = {
  dateHeader:  { component: DateHeaderBlock,  label: 'التاريخ والهجري' },
  eventTag:    { component: EventTagBlock,    label: 'شارة المناسبة' },
  greeting:    { component: GreetingBlock,    label: 'رسالة الترحيب' },
  clock:       { component: ClockBlock,       label: 'الساعة' },
  nextPrayer:  { component: NextPrayerBlock,  label: 'الصلاة القادمة' },
  progressBar: { component: ProgressBarBlock, label: 'شريط التقدم' },
  sunnahQuote: { component: SunnahQuoteBlock, label: 'نصيحة السنن' },
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
