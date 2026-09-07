import { useEffect } from 'react';
import { KhushuSettings } from './khushuTypes';
import { PrayerTimes } from '../../types';

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
}: AutoSchedulerProps) {
  useEffect(() => {
    if (!settings.autoWithIqama || isActive || !times) {
      return;
    }

    const checkIqamaAutoTrigger = () => {
      const now = new Date();
      const isFriday = now.getDay() === 5;
      const todayKey = now.toISOString().split('T')[0];

      // قراءة سجل التفعيلات التلقائية لليوم
      let triggeredMap: Record<string, boolean> = {};
      try {
        const raw = sessionStorage.getItem(AUTO_TRIGGERED_KEY);
        if (raw) triggeredMap = JSON.parse(raw);
      } catch {
        triggeredMap = {};
      }

      const prayersToCheck: Array<{ id: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; timeStr: string }> = [
        { id: 'fajr', timeStr: times.Fajr },
        { id: 'dhuhr', timeStr: times.Dhuhr },
        { id: 'asr', timeStr: times.Asr },
        { id: 'maghrib', timeStr: times.Maghrib },
        { id: 'isha', timeStr: times.Isha },
      ];

      for (const item of prayersToCheck) {
        if (!item.timeStr) continue;
        const prayerId = item.id;

        const [pTime, modifier] = item.timeStr.trim().split(/\s+/);
        if (!pTime) continue;
        const [hStr, mStr] = pTime.split(':');
        let hours = parseInt(hStr, 10);
        const minutes = parseInt(mStr, 10);

        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        const athanDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

        // تحديد فارق الإقامة ومدة الصلاة
        let iqamaOffset = settings.iqamaOffsets[prayerId] || 15;
        let prayerDuration = settings.prayerDurations[prayerId] || 15;

        // استثناء صلاة الجمعة
        if (isFriday && prayerId === 'dhuhr' && settings.enableFridaySpecial) {
          iqamaOffset = settings.iqamaOffsets.friday || 25;
          prayerDuration = settings.prayerDurations.friday || 45;
        }

        const iqamaTime = new Date(athanDate.getTime() + iqamaOffset * 60 * 1000);
        const diffSeconds = Math.round((now.getTime() - iqamaTime.getTime()) / 1000);

        // تفعيل إذا كانت اللحظة الحالية في نافذة الإقامة (خلال 90 ثانية من وقت الإقامة المحسوب)
        const triggerKey = `${todayKey}_${prayerId}`;
        if (diffSeconds >= 0 && diffSeconds <= 90 && !triggeredMap[triggerKey]) {
          triggeredMap[triggerKey] = true;
          try {
            sessionStorage.setItem(AUTO_TRIGGERED_KEY, JSON.stringify(triggeredMap));
          } catch {
            // ignore
          }

          console.log(`[useKhushuAutoScheduler] Auto-activating Khushu for ${prayerId} at Iqama time (${prayerDuration} mins)`);
          activate(prayerDuration);
          break;
        }
      }
    };

    const interval = setInterval(checkIqamaAutoTrigger, 30000);
    checkIqamaAutoTrigger();

    return () => clearInterval(interval);
  }, [settings, times, isActive, activate]);
}
