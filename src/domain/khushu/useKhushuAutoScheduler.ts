/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import { KhushuSettings } from './khushuTypes';
import { PrayerTimes } from '../../types';
import { getIqamaWindowInfo, IqamaWindowInfo } from './khushuFlowUtils';

interface AutoSchedulerProps {
  settings: KhushuSettings;
  times: PrayerTimes | null | undefined;
  isActive: boolean;
  activate: (durationMinutes?: number) => Promise<boolean>;
}

const AUTO_TRIGGERED_KEY = 'hemmaty_khushu_auto_triggered_map';

export function useKhushuAutoScheduler({
  settings,
  times,
  isActive,
  activate,
}: AutoSchedulerProps): { iqamaInfo: IqamaWindowInfo | null } {
  const [iqamaInfo, setIqamaInfo] = useState<IqamaWindowInfo | null>(() =>
    getIqamaWindowInfo(times, settings, new Date())
  );

  const activateRef = useRef(activate);
  activateRef.current = activate;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  const timesKey = times
    ? `${times.Fajr}_${times.Sunrise}_${times.Dhuhr}_${times.Asr}_${times.Maghrib}_${times.Isha}`
    : '';

  useEffect(() => {
    if (!times) {
      setIqamaInfo((prev) => (prev === null ? prev : null));
      return;
    }

    const checkCycle = () => {
      const now = new Date();
      const currentInfo = getIqamaWindowInfo(times, settingsRef.current, now);

      setIqamaInfo((prev) => {
        if (!prev && !currentInfo) return prev;
        if (!prev || !currentInfo) return currentInfo;
        if (
          prev.prayerId === currentInfo.prayerId &&
          prev.minutesToIqama === currentInfo.minutesToIqama &&
          prev.isInAdhanIqamaWindow === currentInfo.isInAdhanIqamaWindow &&
          prev.isExactIqamaMoment === currentInfo.isExactIqamaMoment &&
          prev.suggestedDuration === currentInfo.suggestedDuration &&
          prev.athanDate.getTime() === currentInfo.athanDate.getTime() &&
          prev.iqamaDate.getTime() === currentInfo.iqamaDate.getTime()
        ) {
          return prev;
        }
        return currentInfo;
      });

      if (!currentInfo || isActiveRef.current || !settingsRef.current.autoWithIqama) {
        return;
      }

      if (currentInfo.isExactIqamaMoment) {
        const todayKey = now.toISOString().split('T')[0];
        const triggerKey = `${todayKey}_${currentInfo.prayerId}`;

        let triggeredMap: Record<string, boolean> = {};
        try {
          const raw = sessionStorage.getItem(AUTO_TRIGGERED_KEY);
          if (raw) triggeredMap = JSON.parse(raw);
        } catch {
          triggeredMap = {};
        }

        if (!triggeredMap[triggerKey]) {
          triggeredMap[triggerKey] = true;
          try {
            sessionStorage.setItem(AUTO_TRIGGERED_KEY, JSON.stringify(triggeredMap));
          } catch {
            // ignore
          }

          console.log(
            `[useKhushuAutoScheduler] Auto-activating Khushu for ${currentInfo.prayerId} at Iqama time (${currentInfo.suggestedDuration} mins)`
          );
          activateRef.current(currentInfo.suggestedDuration);
        }
      }
    };

    checkCycle();
    const interval = setInterval(checkCycle, 15000);

    return () => clearInterval(interval);
  }, [timesKey]);

  return { iqamaInfo };
}
