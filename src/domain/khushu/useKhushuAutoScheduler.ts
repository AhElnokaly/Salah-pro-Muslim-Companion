/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!times) {
      setIqamaInfo(null);
      return;
    }

    const checkCycle = () => {
      const now = new Date();
      const currentInfo = getIqamaWindowInfo(times, settings, now);
      setIqamaInfo(currentInfo);

      if (!currentInfo || isActive || !settings.autoWithIqama) {
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
          activate(currentInfo.suggestedDuration);
        }
      }
    };

    checkCycle();
    const interval = setInterval(checkCycle, 15000);

    return () => clearInterval(interval);
  }, [settings, times, isActive, activate]);

  return { iqamaInfo };
}
