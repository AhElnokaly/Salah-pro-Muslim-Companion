/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ADHKAR_DATA } from './adhkarData';

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface AdhkarStation {
  id: 'morning' | 'fajr' | 'dhuhr' | 'asr' | 'evening' | 'maghrib' | 'isha';
  title: string;
  shortName: string;
  categoryType: 'morning' | 'evening' | 'after_prayer';
  prayerKey?: PrayerKey;
  icon: string;
  timeLabel: string;
}

export interface StationStatus extends AdhkarStation {
  totalItems: number;
  completedItems: number;
  percent: number;
  isDone: boolean;
  isPartial: boolean;
  isCurrentTimeStation?: boolean;
}

export const SEVEN_STATIONS: AdhkarStation[] = [
  { id: 'morning', title: 'أذكار الصباح', shortName: 'الصباح', categoryType: 'morning', icon: '🌅', timeLabel: 'من طلوع الفجر إلى صلاة الظهر' },
  { id: 'fajr', title: 'أذكار صلاة الفجر', shortName: 'الفجر', categoryType: 'after_prayer', prayerKey: 'fajr', icon: '🕌', timeLabel: 'عقب صلاة الفجر' },
  { id: 'dhuhr', title: 'أذكار صلاة الظهر', shortName: 'الظهر', categoryType: 'after_prayer', prayerKey: 'dhuhr', icon: '☀️', timeLabel: 'عقب صلاة الظهر' },
  { id: 'asr', title: 'أذكار صلاة العصر', shortName: 'العصر', categoryType: 'after_prayer', prayerKey: 'asr', icon: '🌤️', timeLabel: 'عقب صلاة العصر' },
  { id: 'evening', title: 'أذكار المساء', shortName: 'المساء', categoryType: 'evening', icon: '🌆', timeLabel: 'من العصر إلى منتصف الليل' },
  { id: 'maghrib', title: 'أذكار صلاة المغرب', shortName: 'المغرب', categoryType: 'after_prayer', prayerKey: 'maghrib', icon: '🌅', timeLabel: 'عقب صلاة المغرب' },
  { id: 'isha', title: 'أذكار صلاة العشاء', shortName: 'العشاء', categoryType: 'after_prayer', prayerKey: 'isha', icon: '🌌', timeLabel: 'عقب صلاة العشاء' },
];

export function getSevenStationsProgress(
  dayLogs: Record<string, number> = {},
  activePrayerKey?: PrayerKey
) {
  const morningCat = ADHKAR_DATA.find(c => c.id === 'morning');
  const eveningCat = ADHKAR_DATA.find(c => c.id === 'evening');
  const afterPrayerCat = ADHKAR_DATA.find(c => c.id === 'after_prayer');

  const stations: StationStatus[] = SEVEN_STATIONS.map(st => {
    let totalItems = 0;
    let completedItems = 0;

    if (st.categoryType === 'morning' && morningCat) {
      totalItems = morningCat.items.length;
      morningCat.items.forEach(it => {
        if ((dayLogs[it.id] || 0) >= it.count) completedItems++;
      });
      if (dayLogs['morning'] !== undefined && dayLogs['morning'] >= totalItems) {
        completedItems = totalItems;
      }
    } else if (st.categoryType === 'evening' && eveningCat) {
      totalItems = eveningCat.items.length;
      eveningCat.items.forEach(it => {
        if ((dayLogs[it.id] || 0) >= it.count) completedItems++;
      });
      if (dayLogs['evening'] !== undefined && dayLogs['evening'] >= totalItems) {
        completedItems = totalItems;
      }
    } else if (st.categoryType === 'after_prayer' && st.prayerKey && afterPrayerCat) {
      totalItems = afterPrayerCat.items.length;
      afterPrayerCat.items.forEach(it => {
        const itemKey = `${st.prayerKey}_${it.id}`;
        const currentVal = dayLogs[itemKey] !== undefined ? dayLogs[itemKey] : (dayLogs[it.id] || 0);
        if (currentVal >= it.count) completedItems++;
      });
      if (dayLogs[`after_prayer_${st.prayerKey}`] !== undefined && dayLogs[`after_prayer_${st.prayerKey}`] >= totalItems) {
        completedItems = totalItems;
      }
    }

    const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    const isDone = percent === 100;
    const isPartial = percent > 0 && percent < 100;

    let isCurrentTimeStation = false;
    if (activePrayerKey) {
      if (st.categoryType === 'after_prayer' && st.prayerKey === activePrayerKey) {
        isCurrentTimeStation = true;
      } else if (st.categoryType === 'morning' && activePrayerKey === 'fajr') {
        isCurrentTimeStation = true;
      } else if (st.categoryType === 'evening' && (activePrayerKey === 'asr' || activePrayerKey === 'maghrib')) {
        isCurrentTimeStation = true;
      }
    }

    return {
      ...st,
      totalItems,
      completedItems,
      percent,
      isDone,
      isPartial,
      isCurrentTimeStation,
    };
  });

  const completedStationsCount = stations.filter(s => s.isDone).length;
  const overallPercentage = Math.round((completedStationsCount / 7) * 100);

  return {
    stations,
    completedStationsCount,
    overallPercentage,
  };
}
