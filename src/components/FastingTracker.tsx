/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { AppSettings, RamadanQadaTracker, FastingLog } from '../types';
import { getHijriDate, toArabicNumbers } from '../utils/hijri';
import { formatDateKey } from '../utils/prayerDayBoundary';
import { calculatePrayerTimes } from '../utils/prayerCalc';
import FastingHeroBanner from './fasting/FastingHeroBanner';
import FastingTodayCountdown from './fasting/FastingTodayCountdown';
import FastingRecommendations, { RecommendedFastItem } from './fasting/FastingRecommendations';
import FastingManualEntryForm from './fasting/FastingManualEntryForm';
import FastingHistoryLog from './fasting/FastingHistoryLog';
import FastingMoonSynergy from './fasting/FastingMoonSynergy';

export interface FastingTrackerProps {
  settings: AppSettings;
  fastingLogs: Record<string, any>;
  setFastingLogs: React.Dispatch<React.SetStateAction<any>>;
  ramadanQada: RamadanQadaTracker;
  setRamadanQada: React.Dispatch<React.SetStateAction<RamadanQadaTracker>>;
  onNavigateTab?: (tab: any) => void;
}

export default function FastingTracker({
  settings,
  fastingLogs,
  setFastingLogs,
  ramadanQada,
  setRamadanQada,
}: FastingTrackerProps) {
  const [customDate, setCustomDate] = useState<string>(() => formatDateKey(new Date()));
  const [fastType, setFastType] = useState<'Ramadan' | 'Sunnah' | 'Qada' | 'Kaffarah' | 'Nazar'>('Sunnah');
  const [note, setNote] = useState<string>('');

  const now = new Date();
  const todayKey = formatDateKey(now);
  const hijriToday = getHijriDate(now, settings.hijriOffset || 0);

  // Normalize fastingLogs to Record<string, FastingLog>
  const normalizedLogs: Record<string, FastingLog> = useMemo(() => {
    const res: Record<string, FastingLog> = {};
    Object.entries(fastingLogs || {}).forEach(([k, v]) => {
      if (typeof v === 'boolean') {
        if (v) {
          res[k] = { date: k, isFasting: true, type: 'Sunnah', fasted: true };
        }
      } else if (v && typeof v === 'object') {
        res[k] = v as FastingLog;
      }
    });
    return res;
  }, [fastingLogs]);

  const fastingLogsList = useMemo(() => {
    return Object.values(normalizedLogs)
      .filter((l) => l.isFasting || l.fasted)
      .sort((a, b) => (b.date > a.date ? 1 : -1));
  }, [normalizedLogs]);

  const isFastingToday = Boolean(normalizedLogs[todayKey]?.isFasting || normalizedLogs[todayKey]?.fasted);
  const todayLog = normalizedLogs[todayKey];

  const totalFastedDays = fastingLogsList.length;
  const sunnahFasted = fastingLogsList.filter((l) => l.type === 'Sunnah' || l.fastType === 'Sunnah').length;
  const qadaFasted = fastingLogsList.filter((l) => l.type === 'Qada' || l.fastType === 'Qada').length;

  // Prayer times for today for Suhur/Iftar countdown
  const tzOffset = (settings as any).timezoneOffset ?? 2;
  const times = calculatePrayerTimes(
    now,
    settings.latitude || 30.0444,
    settings.longitude || 31.2357,
    tzOffset,
    settings.calcMethod,
    settings.madhab
  );

  const countdown = useMemo(() => {
    const maghribStr = times.Maghrib || '18:00';
    return {
      label: 'موعد أذان المغرب والإفطار',
      timeStr: maghribStr,
      percent: 65,
    };
  }, [times]);

  const handleToggleFastToday = (type: 'Ramadan' | 'Sunnah' | 'Qada' | 'Kaffarah' | 'Nazar') => {
    setFastingLogs((prev: any) => {
      const copy = { ...prev };
      if (isFastingToday) {
        delete copy[todayKey];
      } else {
        copy[todayKey] = {
          date: todayKey,
          isFasting: true,
          type,
          timestamp: Date.now(),
        };
      }
      return copy;
    });
  };

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDate) return;
    setFastingLogs((prev: any) => ({
      ...prev,
      [customDate]: {
        date: customDate,
        isFasting: true,
        type: fastType,
        note,
        timestamp: Date.now(),
      },
    }));
    setNote('');
  };

  const handleDeleteLog = (dateStr: string) => {
    setFastingLogs((prev: any) => {
      const copy = { ...prev };
      delete copy[dateStr];
      return copy;
    });
  };

  // Recommended upcoming sunnah fasts (Mondays, Thursdays, White Days: 13, 14, 15)
  const recommendations: RecommendedFastItem[] = useMemo(() => {
    const items: RecommendedFastItem[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dayOfWeek = d.getDay(); // 1=Mon, 4=Thu
      const h = getHijriDate(d, settings.hijriOffset || 0);

      if (h.day === 13 || h.day === 14 || h.day === 15) {
        items.push({
          name: `الأيام البيض (${toArabicNumbers(h.day)} ${h.monthName})`,
          date: d,
          type: 'Sunnah',
          desc: 'صيام ثلاثة أيام من كل شهر كصيام الدهر كله',
        });
      } else if (dayOfWeek === 1) {
        items.push({
          name: 'صيام يوم الإثنين المبارك',
          date: d,
          type: 'Sunnah',
          desc: 'تعرض فيه الأعمال على الله تعالى ويوم ولد فيه النبي ﷺ',
        });
      } else if (dayOfWeek === 4) {
        items.push({
          name: 'صيام يوم الخميس المبارك',
          date: d,
          type: 'Sunnah',
          desc: 'تعرض فيه الأعمال وتستحب فيه الطاعة والصيام',
        });
      }
    }
    return items.slice(0, 4);
  }, [settings.hijriOffset]);

  return (
    <div className="pb-16 space-y-5 animate-fade-in" dir="rtl">
      {/* 1. Hero Summary & Ramadan Qada Tracking */}
      <FastingHeroBanner
        hijriToday={hijriToday}
        totalFastedDays={totalFastedDays}
        sunnahFasted={sunnahFasted}
        qadaFasted={qadaFasted}
        ramadanQada={ramadanQada}
        setRamadanQada={setRamadanQada}
      />

      {/* 2. Today's Fasting Status & Countdown */}
      <FastingTodayCountdown
        isFastingToday={isFastingToday}
        todayLog={todayLog}
        countdown={countdown}
        onToggleFastToday={handleToggleFastToday}
      />

      {/* 3. Fasting Moon Synergy */}
      <FastingMoonSynergy hijriToday={hijriToday} />

      {/* 4. Upcoming Sunnah Fast Recommendations */}
      <FastingRecommendations
        recommendations={recommendations}
        fastingLogs={normalizedLogs}
        setFastingLogs={setFastingLogs}
        hijriOffset={settings.hijriOffset || 0}
      />

      {/* 5. Manual Entry Form */}
      <FastingManualEntryForm
        customDate={customDate}
        setCustomDate={setCustomDate}
        fastType={fastType}
        setFastType={setFastType}
        note={note}
        setNote={setNote}
        onSubmit={handleManualEntry}
      />

      {/* 6. Historical Fasting Records */}
      <FastingHistoryLog
        fastingLogsList={fastingLogsList}
        onDeleteLog={handleDeleteLog}
      />
    </div>
  );
}
