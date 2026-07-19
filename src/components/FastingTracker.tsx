/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Moon, 
  Sun, 
  Clock, 
  Award, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  Flame, 
  PlusCircle, 
  History,
  Info
} from 'lucide-react';
import { AppSettings, RamadanQadaTracker, FastingLog } from '../types';
import { toArabicNumbers, getHijriDate, isForbiddenFastDay } from '../utils/hijri';
import { calculatePrayerTimes } from '../utils/prayerCalc';

interface FastingTrackerProps {
  settings: AppSettings;
  fastingLogs: Record<string, FastingLog>;
  setFastingLogs: React.Dispatch<React.SetStateAction<Record<string, FastingLog>>>;
  ramadanQada: RamadanQadaTracker;
  setRamadanQada: React.Dispatch<React.SetStateAction<RamadanQadaTracker>>;
}

export default function FastingTracker({
  settings,
  fastingLogs,
  setFastingLogs,
  ramadanQada,
  setRamadanQada
}: FastingTrackerProps) {
  const [now, setNow] = useState(new Date());
  const [fastType, setFastType] = useState<'Ramadan' | 'Sunnah' | 'Qada' | 'Kaffarah' | 'Nazar'>('Sunnah');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Keep clock updated
  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = now.toISOString().split('T')[0];
  const hijriToday = getHijriDate(now, settings.hijriOffset);

  // Calculate prayer times to get Iftar (Maghrib) and Imsak (Fajr) times
  const times = calculatePrayerTimes(
    now,
    settings.latitude,
    settings.longitude,
    -now.getTimezoneOffset() / 60,
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
      const digitsMap: Record<string, string> = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
      };
      
      let normalized = '';
      for (let i = 0; i < timeStr.length; i++) {
        const char = timeStr[i];
        normalized += digitsMap[char] ?? char;
      }
      
      const parts = normalized.split(':');
      if (parts.length < 2) {
        return new Date(now);
      }
      
      let hours = parseInt(parts[0], 10);
      const minutesPart = parts[1].trim();
      const mins = parseInt(minutesPart.substring(0, 2), 10);
      
      if (isNaN(hours) || isNaN(mins)) {
        return new Date(now);
      }
      
      const isPM = normalized.includes('م');
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      
      const d = new Date(now);
      d.setHours(hours, mins, 0, 0);
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
      alert(`⚠️ تنبيه شرعي: لا يجوز صيام هذا اليوم لأنه يصادف ${reasonStr}. الصيام في العيد وأيام التشريق محرّم شرعاً.`);
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
      alert(`⚠️ تنبيه شرعي: لا يجوز تسجيل صيام في هذا التاريخ لأنه يصادف ${reasonStr}. الصيام في العيد وأيام التشريق محرّم شرعاً.`);
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
    alert('تم تسجيل يوم الصيام بنجاح! تقبل الله طاعاتكم.');
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
  const getRecommendedFasts = () => {
    const list: { name: string; date: Date; type: string; desc: string }[] = [];
    const weekdays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

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
      const dStr = item.date.toISOString().split('T')[0];
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
    <div id="fasting-tracker-root" className="space-y-6 text-right pb-10" dir="rtl">
      
      {/* 1. Ramadan / Qada Summary & Main Tracker Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-5 border border-indigo-500/20 shadow-xl relative overflow-hidden">
        {/* Dynamic stars backdrop */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] text-indigo-300 font-bold tracking-widest block uppercase">سجل الصيام المبارك</span>
              <h2 className="text-xl font-black flex items-center gap-2">
                <Moon className="w-5 h-5 text-amber-300 animate-pulse" />
                تتبع وقضاء الصيام
              </h2>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10">
              {hijriToday.day} {hijriToday.monthName} {hijriToday.year} هـ
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-2 text-center pt-2">
            <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-2.5 border border-white/5">
              <span className="text-[10px] text-indigo-200 block font-semibold">إجمالي الأيام</span>
              <span className="text-lg font-black text-amber-300 font-mono block mt-0.5">{toArabicNumbers(totalFastedDays)}</span>
            </div>
            <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-2.5 border border-white/5">
              <span className="text-[10px] text-indigo-200 block font-semibold">صيام النوافل</span>
              <span className="text-lg font-black text-amber-300 font-mono block mt-0.5">{toArabicNumbers(sunnahFasted)}</span>
            </div>
            <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-2.5 border border-white/5">
              <span className="text-[10px] text-indigo-200 block font-semibold">القضاء المنجز</span>
              <span className="text-lg font-black text-emerald-400 font-mono block mt-0.5">{toArabicNumbers(qadaFasted)}</span>
            </div>
            <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-2.5 border border-white/5">
              <span className="text-[10px] text-indigo-200 block font-semibold">المتبقي عليا</span>
              <span className="text-lg font-black text-rose-400 font-mono block mt-0.5">
                {toArabicNumbers(Math.max(0, ramadanQada.daysOwed - ramadanQada.daysCompleted))}
              </span>
            </div>
          </div>

          {/* Ramadan Qada Progress Slider */}
          <div className="bg-black/30 rounded-2xl p-3.5 border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-indigo-200">تقدم قضاء أيام رمضان الفائتة:</span>
              <span className="font-mono font-black text-amber-300">
                {toArabicNumbers(ramadanQada.daysCompleted)} / {toArabicNumbers(ramadanQada.daysOwed)} أيام
              </span>
            </div>
            
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-700"
                style={{ width: `${ramadanQada.daysOwed > 0 ? (ramadanQada.daysCompleted / ramadanQada.daysOwed) * 100 : 0}%` }}
              />
            </div>

            <div className="flex items-center gap-2 pt-1 justify-between">
              <span className="text-[10px] text-white/50">تحتاج لتعديل الأيام المطلوبة منك؟</span>
              <button
                type="button"
                onClick={() => {
                  const val = prompt('كم عدد الأيام المطلوبة منك لقضائها؟', (ramadanQada?.daysOwed ?? 0).toString());
                  if (val !== null) {
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed)) {
                      setRamadanQada(prev => ({ ...prev, daysOwed: parsed }));
                    }
                  }
                }}
                className="text-[10px] text-amber-300 hover:underline font-bold"
              >
                تعديل الأيام المطلوبة ⚙️
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Today's Fasting & Countdown */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 space-y-4 transition-colors duration-300">
        <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
          <Clock className="w-5 h-5 text-indigo-500" />
          حالة الصيام اليوم
        </h3>

        {/* Big Circular Ring for Fasting Progress */}
        <div className="flex flex-col items-center justify-center py-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Outer Progress Tracker Ring */}
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="44" 
                stroke="rgba(99, 102, 241, 0.1)" 
                strokeWidth="4" 
                fill="transparent" 
              />
              <circle 
                cx="50" 
                cy="50" 
                r="44" 
                stroke="#f59e0b" 
                strokeWidth="4" 
                fill="transparent" 
                strokeDasharray="276.46" 
                strokeDashoffset={276.46 - (276.46 * (countdown.percent ?? 0)) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="text-center space-y-1">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">
                {isFastingToday ? 'أنت صائم اليوم 🤲' : 'لم تسجل صياماً اليوم'}
              </span>
              <div className="text-2xl font-black font-mono tracking-widest text-slate-800 dark:text-white leading-none">
                {toArabicNumbers(countdown.timeStr)}
              </div>
              <span className="text-[9px] bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold inline-block">
                {countdown.percent !== undefined ? `اكتمل ${toArabicNumbers(Math.round(countdown.percent))}%` : 'تتبع المسير'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center px-4 font-semibold">
            {countdown.label}
          </p>
        </div>

        {/* Quick Log Buttons */}
        <div className="space-y-2">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">تسجيل سريع لصيام اليوم:</p>
          {isFastingToday ? (
            <button
              onClick={() => handleToggleFastToday(todayLog.fastType)}
              className="w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center gap-2 font-black cursor-pointer shadow-xs transition-transform active:scale-98"
            >
              <Trash2 className="w-4 h-4" />
              إلغاء صيام اليوم
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleToggleFastToday('Sunnah')}
                className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/20 hover:bg-indigo-100/50 text-center font-extrabold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-bold">صيام نافلة (سنة)</span>
              </button>
              <button
                onClick={() => handleToggleFastToday('Qada')}
                className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/20 hover:bg-amber-100/50 text-center font-extrabold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Moon className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-bold">صيام قضاء رمضان</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Recommended Days to Fast */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 space-y-4 transition-colors duration-300">
        <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
          <Sparkles className="w-5 h-5 text-amber-500" />
          مواعيد الصيام المستحبة القادمة
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500">أيام يسن ويستحب صيامها وفقاً للتقويم الهجري والميلادي القادم:</p>

        <div className="space-y-2.5">
          {recommendations.map((item, idx) => {
            const dateKey = item.date.toISOString().split('T')[0];
            const isLogged = fastingLogs[dateKey]?.fasted || false;
            const itemHijri = getHijriDate(item.date, settings.hijriOffset);

            return (
              <div 
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all flex justify-between items-center ${
                  isLogged 
                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                    : 'bg-slate-50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/80'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-800 dark:text-white">{item.name}</span>
                    <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                      مستحب
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                  <p className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold">
                    الموافق: {toArabicNumbers(item.date.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }))}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (isLogged) {
                      const updated = { ...fastingLogs };
                      delete updated[dateKey];
                      setFastingLogs(updated);
                    } else {
                      setFastingLogs(prev => ({
                        ...prev,
                        [dateKey]: {
                          date: dateKey,
                          hijriDate: itemHijri.fullString,
                          fastType: 'Sunnah',
                          fasted: true,
                          isQada: false
                        }
                      }));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isLogged 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                      : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {isLogged ? 'تم الصيام ✓' : 'أخطط للصيام'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Manual Past Fast Entry */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 space-y-4 transition-colors duration-300">
        <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
          <PlusCircle className="w-5 h-5 text-emerald-500" />
          تسجيل يوم صيام سابق
        </h3>

        <form onSubmit={handleAddPastFast} className="space-y-3.5">
          <div>
            <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mb-1.5">تاريخ الصيام:</label>
            <input 
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mb-1.5">نوع الصيام:</label>
              <select
                value={fastType}
                onChange={(e) => setFastType(e.target.value as any)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
              >
                <option value="Sunnah">سنة / تطوع</option>
                <option value="Qada">قضاء رمضان</option>
                <option value="Ramadan">رمضان الفريضة</option>
                <option value="Kaffarah">كفارة</option>
                <option value="Nazar">نذر</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mb-1.5">ملاحظة / سبب الصوم:</label>
              <input 
                type="text"
                placeholder="أيام البيض، كفارة يمين..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-transform active:scale-98"
          >
            حفظ يوم الصيام في السجل المبارك
          </button>
        </form>
      </div>

      {/* 5. Fasting History Log */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 space-y-4 transition-colors duration-300">
        <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
          <History className="w-5 h-5 text-indigo-500" />
          سجل صيامك التاريخي
        </h3>

        {fastingLogsList.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold">لا توجد أيام صيام مسجلة حتى الآن.</p>
            <p className="text-[10px] mt-1">ابدأ بتسجيل صيام اليوم لتراه هنا!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {fastingLogsList.sort((a,b) => b.date.localeCompare(a.date)).map((log) => (
              <div 
                key={log.date}
                className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                      {log.fastType === 'Sunnah' && 'صيام نافلة (سنة)'}
                      {log.fastType === 'Qada' && 'قضاء رمضان'}
                      {log.fastType === 'Ramadan' && 'صيام رمضان الفريضة'}
                      {log.fastType === 'Kaffarah' && 'صيام كفارة'}
                      {log.fastType === 'Nazar' && 'صيام نذر'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                      ({toArabicNumbers(log.date)})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    الموافق للهجري: {toArabicNumbers(log.hijriDate)}
                  </p>
                  {log.reason && (
                    <p className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">
                      ملاحظة: {log.reason}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteLog(log.date)}
                  className="p-2 hover:bg-rose-500/10 rounded-xl text-rose-500 cursor-pointer transition-colors"
                  title="حذف هذا السجل"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
