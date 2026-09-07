/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import AppModal, { AppModalVariant } from './shared/AppModal';
import { AppSettings, RamadanQadaTracker, FastingLog } from '../types';
import { getHijriDate, isForbiddenFastDay, toArabicNumbers } from '../utils/hijri';
import { calculatePrayerTimes, parseTimeToMinutes, getTimezoneOffsetForLocation } from '../utils/prayerCalc';
import { formatDateKey } from '../utils/prayerDayBoundary';
import FastingHeroBanner from './fasting/FastingHeroBanner';
import FastingMoonSynergy from './fasting/FastingMoonSynergy';
import FastingTodayCountdown from './fasting/FastingTodayCountdown';
import FastingRecommendations, { RecommendedFastItem } from './fasting/FastingRecommendations';
import FastingManualEntryForm from './fasting/FastingManualEntryForm';
import FastingHistoryLog from './fasting/FastingHistoryLog';

interface FastingTrackerProps {
  settings: AppSettings;
  fastingLogs: Record<string, FastingLog>;
  setFastingLogs: React.Dispatch<React.SetStateAction<Record<string, FastingLog>>>;
  ramadanQada: RamadanQadaTracker;
  setRamadanQada: React.Dispatch<React.SetStateAction<RamadanQadaTracker>>;
  onNavigateTab?: (tab: string) => void;
}

export default function FastingTracker({
  settings,
  fastingLogs,
  setFastingLogs,
  ramadanQada,
  setRamadanQada,
  onNavigateTab
}: FastingTrackerProps) {
  const [now, setNow] = useState(new Date());
  const [fastType, setFastType] = useState<'Ramadan' | 'Sunnah' | 'Qada' | 'Kaffarah' | 'Nazar'>('Sunnah');
  const [customDate, setCustomDate] = useState(formatDateKey(new Date()));
  const [note, setNote] = useState('');
  const [appModal, setAppModal] = useState<{ message: string; variant: AppModalVariant } | null>(null);

  // Keep clock updated
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = formatDateKey(now);
  const hijriToday = getHijriDate(now, settings.hijriOffset);

  // Calculate prayer times to get Iftar (Maghrib) and Imsak (Fajr) times
  const tzOffset = getTimezoneOffsetForLocation(now, settings.timezoneId);
  const times = calculatePrayerTimes(
    now,
    settings.latitude,
    settings.longitude,
    tzOffset,
    settings.calcMethod,
    settings.madhab,
    settings.prayerOffsets || {}
  );

  // Fasting Status for Today
  const todayLog = fastingLogs[todayStr];
  const isFastingToday = todayLog?.fasted || false;

  // Countdown calculations
  const getFastingCountdown = () => {
    if (!times.Fajr || !times.Maghrib) return { label: '', timeStr: '' };

    const parseTimeToDate = (timeStr: string) => {
      if (!timeStr) return new Date(now);
      const totalMins = parseTimeToMinutes(timeStr);
      const d = new Date(now);
      d.setHours(Math.floor(totalMins / 60), totalMins % 60, 0, 0);
      return d;
    };

    const imsakTime = parseTimeToDate(times.Fajr);
    const iftarTime = parseTimeToDate(times.Maghrib);

    // Subtract 10 mins for safe Imsak from Fajr
    const imsakLimit = new Date(imsakTime.getTime() - 10 * 60 * 1000);

    if (isFastingToday) {
      if (now < iftarTime && now >= imsakLimit) {
        // Currently fasting, counting down to Iftar
        const diffMs = iftarTime.getTime() - now.getTime();
        const hrs = Math.floor(diffMs / (3600 * 1000));
        const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
        const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
        return {
          label: 'الوقت المتبقي للإفطار (صلاة المغرب)',
          timeStr: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
          percent: Math.max(0, Math.min(100, 100 - (diffMs / (iftarTime.getTime() - imsakLimit.getTime())) * 100))
        };
      } else if (now >= iftarTime) {
        return {
          label: 'تقبل الله صيامكم! ذهب الظمأ وابتلت العروق',
          timeStr: '00:00:00',
          percent: 100
        };
      } else {
        // Before imsak limit
        const diffMs = imsakLimit.getTime() - now.getTime();
        const hrs = Math.floor(diffMs / (3600 * 1000));
        const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
        const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
        return {
          label: 'الوقت المتبقي لبدء الصيام (الإمساك)',
          timeStr: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
          percent: 0
        };
      }
    } else {
      // Not fasting today, countdown to tomorrow's Fajr/Imsak
      let nextImsak = new Date(imsakLimit);
      if (now >= imsakLimit) {
        nextImsak.setDate(nextImsak.getDate() + 1);
      }
      const diffMs = nextImsak.getTime() - now.getTime();
      const hrs = Math.floor(diffMs / (3600 * 1000));
      const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
      const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
      return {
        label: 'الوقت المتبقي للإمساك التالي',
        timeStr: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
        percent: 0
      };
    }
  };

  const countdown = getFastingCountdown();

  // Handle Fasting Action Today
  const handleToggleFastToday = (type: 'Ramadan' | 'Sunnah' | 'Qada' | 'Kaffarah' | 'Nazar') => {
    const isCurrentlyFasting = fastingLogs[todayStr]?.fasted || false;
    
    // Check if today is a forbidden fasting day
    const isForbidden = isForbiddenFastDay(hijriToday.day, hijriToday.month);
    if (isForbidden && !isCurrentlyFasting) {
      let reasonStr = '';
      if (hijriToday.month === 10 && hijriToday.day === 1) {
        reasonStr = 'أول أيام عيد الفطر المبارك (١ شوال)';
      } else if (hijriToday.month === 12 && hijriToday.day === 10) {
        reasonStr = 'أول أيام عيد الأضحى المبارك (١٠ ذو الحجة)';
      } else {
        const dayArabic = hijriToday.day === 11 ? 'الحادي عشر' : hijriToday.day === 12 ? 'الثاني عشر' : 'الثالث عشر';
        reasonStr = `أيام التشريق المباركة (يوم ${dayArabic} ذو الحجة)`;
      }
      setAppModal({ message: `تنبيه شرعي: لا يجوز صيام هذا اليوم لأنه يصادف ${reasonStr}. الصيام في العيد وأيام التشريق محرّم شرعاً.`, variant: 'warning' });
      return;
    }

    // Create copy
    const updated = { ...fastingLogs };
    
    if (isCurrentlyFasting) {
      delete updated[todayStr];
      // If it was a qada fast, decrease ramadan qada completed
      if (fastingLogs[todayStr]?.fastType === 'Qada') {
        setRamadanQada(prev => ({
          ...prev,
          daysCompleted: Math.max(0, prev.daysCompleted - 1)
        }));
      }
    } else {
      updated[todayStr] = {
        date: todayStr,
        hijriDate: hijriToday.fullString,
        fastType: type,
        fasted: true,
        isQada: type === 'Qada'
      };
      
      if (type === 'Qada') {
        setRamadanQada(prev => ({
          ...prev,
          daysCompleted: prev.daysCompleted + 1
        }));
      }
    }
    setFastingLogs(updated);
  };

  // Add custom past fast record
  const handleAddPastFast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDate) return;

    const hDate = getHijriDate(new Date(customDate), settings.hijriOffset);
    const isForbidden = isForbiddenFastDay(hDate.day, hDate.month);
    if (isForbidden) {
      let reasonStr = '';
      if (hDate.month === 10 && hDate.day === 1) {
        reasonStr = 'أول أيام عيد الفطر المبارك (١ شوال)';
      } else if (hDate.month === 12 && hDate.day === 10) {
        reasonStr = 'أول أيام عيد الأضحى المبارك (١٠ ذو الحجة)';
      } else {
        const dayArabic = hDate.day === 11 ? 'الحادي عشر' : hDate.day === 12 ? 'الثاني عشر' : 'الثالث عشر';
        reasonStr = `أيام التشريق المباركة (يوم ${dayArabic} ذو الحجة)`;
      }
      setAppModal({ message: `تنبيه شرعي: لا يجوز تسجيل صيام في هذا التاريخ لأنه يصادف ${reasonStr}. الصيام في العيد وأيام التشريق محرّم شرعاً.`, variant: 'warning' });
      return;
    }

    setFastingLogs(prev => ({
      ...prev,
      [customDate]: {
        date: customDate,
        hijriDate: hDate.fullString,
        fastType,
        fasted: true,
        isQada: fastType === 'Qada',
        reason: note || undefined
      }
    }));

    if (fastType === 'Qada') {
      setRamadanQada(prev => ({
        ...prev,
        daysCompleted: prev.daysCompleted + 1
      }));
    }

    setNote('');
    setAppModal({ message: 'تم تسجيل يوم الصيام بنجاح! تقبل الله طاعاتكم.', variant: 'success' });
  };

  // Delete a fast log
  const handleDeleteLog = (dateStr: string) => {
    const log = fastingLogs[dateStr];
    if (!log) return;

    if (log.fastType === 'Qada') {
      setRamadanQada(prev => ({
        ...prev,
        daysCompleted: Math.max(0, prev.daysCompleted - 1)
      }));
    }

    const updated = { ...fastingLogs };
    delete updated[dateStr];
    setFastingLogs(updated);
  };

  // Generate Recommended upcoming fasts
  const getRecommendedFasts = (): RecommendedFastItem[] => {
    const list: RecommendedFastItem[] = [];

    // Scan next 14 days
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const h = getHijriDate(d, settings.hijriOffset);

      // Check Monday or Thursday
      const dayIdx = d.getDay();
      if (dayIdx === 1) {
        list.push({
          name: 'صيام الإثنين',
          date: new Date(d),
          type: 'Sunnah',
          desc: 'سنة مؤكدة عن النبي ﷺ ترفع فيها الأعمال'
        });
      } else if (dayIdx === 4) {
        list.push({
          name: 'صيام الخميس',
          date: new Date(d),
          type: 'Sunnah',
          desc: 'سنة مؤكدة عن النبي ﷺ ترفع فيها الأعمال'
        });
      }

      // Check White Days (الأيام البيض: 13, 14, 15 of Hijri Month)
      if (h.day === 13 || h.day === 14 || h.day === 15) {
        list.push({
          name: `الأيام البيض (${toArabicNumbers(h.day)} ${h.monthName})`,
          date: new Date(d),
          type: 'Sunnah',
          desc: 'صيامها كصيام الدهر كله كما ورد في السنّة'
        });
      }

      // Ashura, Arafah checks based on month names
      if (h.monthName === 'ذو الحجة' && h.day === 9) {
        list.push({
          name: 'يوم عرفة',
          date: new Date(d),
          type: 'Sunnah',
          desc: 'يكفر السنة الماضية والسنة القابلة'
        });
      } else if (h.monthName === 'محرم' && h.day === 10) {
        list.push({
          name: 'يوم عاشوراء',
          date: new Date(d),
          type: 'Sunnah',
          desc: 'يكفر ذنوب السنة الماضية'
        });
      } else if (h.monthName === 'محرم' && h.day === 9) {
        list.push({
          name: 'تاسوعاء (9 محرم)',
          date: new Date(d),
          type: 'Sunnah',
          desc: 'مستحب صيامها مع عاشوراء لمخالفة أهل الكتاب'
        });
      }
    }

    // Filter duplicates
    const seenDates = new Set<string>();
    return list.filter(item => {
      const dStr = formatDateKey(item.date);
      const key = `${dStr}-${item.name}`;
      if (seenDates.has(key)) return false;
      seenDates.add(key);
      return true;
    }).slice(0, 5);
  };

  const recommendations = getRecommendedFasts();

  // Statistics
  const fastingLogsList = Object.values(fastingLogs).filter(l => l.fasted);
  const totalFastedDays = fastingLogsList.length;
  const sunnahFasted = fastingLogsList.filter(l => l.fastType === 'Sunnah').length;
  const ramadanFasted = fastingLogsList.filter(l => l.fastType === 'Ramadan').length;
  const qadaFasted = fastingLogsList.filter(l => l.fastType === 'Qada').length;

  return (
    <div id="fasting-tracker-root" className="space-y-6 text-end pb-10" dir="rtl">
      {/* 1. Ramadan / Qada Summary & Main Tracker Banner */}
      <FastingHeroBanner
        hijriToday={hijriToday}
        totalFastedDays={totalFastedDays}
        sunnahFasted={sunnahFasted}
        qadaFasted={qadaFasted}
        ramadanQada={ramadanQada}
        setRamadanQada={setRamadanQada}
      />

      {/* 2. Moon Phase & White Days Synergy Widget */}
      <FastingMoonSynergy
        hijriToday={hijriToday}
        onNavigateTab={onNavigateTab}
      />

      {/* 3. Today's Fasting & Countdown */}
      <FastingTodayCountdown
        isFastingToday={isFastingToday}
        todayLog={todayLog}
        countdown={countdown}
        onToggleFastToday={handleToggleFastToday}
      />

      {/* 4. Recommended Days to Fast */}
      <FastingRecommendations
        recommendations={recommendations}
        fastingLogs={fastingLogs}
        setFastingLogs={setFastingLogs}
        hijriOffset={settings.hijriOffset}
      />

      {/* 5. Manual Past Fast Entry */}
      <FastingManualEntryForm
        customDate={customDate}
        setCustomDate={setCustomDate}
        fastType={fastType}
        setFastType={setFastType}
        note={note}
        setNote={setNote}
        onSubmit={handleAddPastFast}
      />

      {/* 6. Fasting History Log */}
      <FastingHistoryLog
        fastingLogsList={fastingLogsList}
        onDeleteLog={handleDeleteLog}
      />

      {appModal && (
        <AppModal
          message={appModal.message}
          variant={appModal.variant}
          onClose={() => setAppModal(null)}
        />
      )}
    </div>
  );
}
