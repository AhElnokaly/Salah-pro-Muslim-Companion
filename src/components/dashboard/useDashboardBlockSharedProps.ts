/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DashboardTab, PrayerTimes } from '../../types';
import { getMoonPhaseInfo } from '../../utils/moonPhases';
import { toArabicNumbers } from '../../utils/hijri';
import { getIslamicEventLabel, getPrayerProgressPercentage } from '../../utils/dashboardSky';
import { getArabicPrayerName } from '../../utils/prayerCalc';

export interface UseDashboardBlockSharedPropsParams {
  hijri: any;
  gregorianClean: string;
  dayNameArabic: string;
  setActiveTab?: (tab: DashboardTab) => void;
  now: Date;
  showAnalogClock: boolean;
  setShowAnalogClock: (show: boolean) => void;
  renderCardAnalogClock: (props: any) => React.ReactNode;
  clockFace: any;
  setClockFace: (face: any) => void;
  next: any;
  times: PrayerTimes;
  current: any;
  timeRemainingStr: string;
}

export function useDashboardBlockSharedProps(params: UseDashboardBlockSharedPropsParams) {
  const {
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
  } = params;

  return {
    hijri,
    gregorianClean,
    dayNameArabic,
    setActiveTab,
    onNavigateTab: (tab: string, subTab?: string) => {
      if (tab && setActiveTab) setActiveTab(tab as DashboardTab);
      if (subTab) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('navigate-salah-subtab', { detail: subTab }));
        }, 50);
      }
    },
    getMoonPhaseInfo,
    toArabicNumbers,
    getIslamicEventLabel: () => getIslamicEventLabel(now, hijri),
    now,
    showAnalogClock,
    setShowAnalogClock,
    renderCardAnalogClock,
    clockFace,
    setClockFace,
    next,
    times,
    getArabicPrayerName,
    timeRemainingStr,
    current,
    getPrayerProgressPercentage: () => getPrayerProgressPercentage(now, times),
  };
}
