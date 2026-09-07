/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Moon, 
  CheckCircle2, 
  Maximize2
} from 'lucide-react';
import { AppSettings, PrayerLog, AlarmConfig } from '../types';
import { calculatePrayerTimes, parseTimeToMinutes, getTimezoneOffsetForLocation } from '../utils/prayerCalc';
import { toArabicNumbers, getHijriDate } from '../utils/hijri';
import { trackFeatureCompletion } from '../utils/analyticsStorage';
import { safeSetItem, safeSetJSON, safeGetItem, safeGetJSON } from '../utils/storage';
import { formatDateKey } from '../utils/prayerDayBoundary';
import {
  QIYAM_DUAS,
  QiyamJournalEntry,
  KhushuStepItem
} from './khushu/khushuConstants';
import { useKhushuAudio } from './khushu/useKhushuAudio';
import { calculateNightThirds } from './khushu/nightCalcUtils';
import { KhushuFocusModeModal } from './khushu/KhushuFocusModeModal';
import { KhushuNightCalculatorCard } from './khushu/KhushuNightCalculatorCard';
import { KhushuDailyLogCard } from './khushu/KhushuDailyLogCard';
import { KhushuGuidelinesCard } from './khushu/KhushuGuidelinesCard';
import { KhushuSurahsCard } from './khushu/KhushuSurahsCard';
import { KhushuDuasCard } from './khushu/KhushuDuasCard';
import { KhushuGuidesAndJournal } from './khushu/KhushuGuidesAndJournal';

interface KhushuQiyamTrackerProps {
  settings: AppSettings;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  setCustomAlarms?: React.Dispatch<React.SetStateAction<AlarmConfig[]>>;
  onNavigateTab?: (tab: string) => void;
}

export default function KhushuQiyamTracker({
  settings,
  prayerLogs,
  setPrayerLogs,
  setCustomAlarms,
  onNavigateTab
}: KhushuQiyamTrackerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [copiedDuaId, setCopiedDuaId] = useState<string | null>(null);
  const [logSuccessMsg, setLogSuccessMsg] = useState<string>('');

  // Live Focus Mode State
  const [isFocusModeActive, setIsFocusModeActive] = useState<boolean>(false);
  const [liveRakahCounter, setLiveRakahCounter] = useState<number>(2);
  const [selectedFocusDua, setSelectedFocusDua] = useState<string>(QIYAM_DUAS[1].arabic);

  // Khushu Step Category Filter & Selection
  const [stepCategoryFilter, setStepCategoryFilter] = useState<'all' | 'preparation' | 'during' | 'post'>('all');
  const [selectedStepDetail, setSelectedStepDetail] = useState<KhushuStepItem | null>(null);

  // Khushu Checklist State
  const [completedKhushuSteps, setCompletedKhushuSteps] = useState<Set<string>>(() => {
    try {
      const saved = safeGetJSON<string[]>('khushu_completed_steps', []);
      return new Set(saved);
    } catch {
      return new Set();
    }
  });

  // Khushu Checklist Auto-Reset Mode ('prayer' vs 'daily')
  const [khushuResetMode, setKhushuResetMode] = useState<'prayer' | 'daily'>(() => {
    return (safeGetItem('khushu_reset_mode') as 'prayer' | 'daily') || 'prayer';
  });

  // Daily Qiyam Logging Inputs
  const [qiyamRakahs, setQiyamRakahs] = useState<number>(2);
  const [witrRakahs, setWitrRakahs] = useState<number>(1);
  const [khushuRating, setKhushuRating] = useState<number>(5);
  const [surahsRead, setSurahsRead] = useState<string>('');
  const [personalNotes, setPersonalNotes] = useState<string>('');

  // Duas Category Filter
  const [duaCategoryFilter, setDuaCategoryFilter] = useState<'all' | 'istiftah' | 'qunut' | 'istighfar' | 'munajat'>('all');

  // Ambient Audio synthesized via custom hook
  const { activeAmbient, playAmbientAudio, stopAmbientAudio } = useKhushuAudio();

  // Qiyam Journal History
  const [qiyamJournalHistory, setQiyamJournalHistory] = useState<QiyamJournalEntry[]>(() => {
    try {
      return safeGetJSON<QiyamJournalEntry[]>('qiyam_journal_history', []);
    } catch {
      return [];
    }
  });

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Sync completed steps to localStorage
  useEffect(() => {
    try {
      safeSetJSON('khushu_completed_steps', Array.from(completedKhushuSteps));
    } catch (e) {
      console.error(e);
    }
  }, [completedKhushuSteps]);

  // Handle Mode Change
  const handleModeChange = (mode: 'prayer' | 'daily') => {
    setKhushuResetMode(mode);
    safeSetItem('khushu_reset_mode', mode);
  };

  // Reset steps manually
  const handleResetKhushuSteps = () => {
    setCompletedKhushuSteps(new Set());
    safeSetJSON('khushu_completed_steps', []);
  };

  // Helper to calculate prayer times with current settings
  const getTimesForDate = (date: Date) => {
    const tzOffset = getTimezoneOffsetForLocation(date, settings.timezoneId);
    return calculatePrayerTimes(
      date,
      settings.latitude,
      settings.longitude,
      tzOffset,
      settings.calcMethod,
      settings.madhab,
      settings.prayerOffsets || {}
    );
  };

  // Check and perform auto-resets based on mode
  useEffect(() => {
    const todayKey = formatDateKey(currentTime);
    const lastResetDate = safeGetItem('khushu_last_reset_date');
    const lastResetPrayer = safeGetItem('khushu_last_reset_prayer');

    if (khushuResetMode === 'daily') {
      if (lastResetDate !== todayKey) {
        setCompletedKhushuSteps(new Set());
        safeSetItem('khushu_last_reset_date', todayKey);
      }
    } else if (khushuResetMode === 'prayer') {
      const todayTimes = getTimesForDate(currentTime);
      const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      
      const prayerOrder = [
        { name: 'Fajr', time: parseTimeToMinutes(todayTimes.Fajr) },
        { name: 'Dhuhr', time: parseTimeToMinutes(todayTimes.Dhuhr) },
        { name: 'Asr', time: parseTimeToMinutes(todayTimes.Asr) },
        { name: 'Maghrib', time: parseTimeToMinutes(todayTimes.Maghrib) },
        { name: 'Isha', time: parseTimeToMinutes(todayTimes.Isha) },
      ];

      let currentActivePrayer = 'Isha';
      for (let i = prayerOrder.length - 1; i >= 0; i--) {
        if (nowMinutes >= prayerOrder[i].time) {
          currentActivePrayer = prayerOrder[i].name;
          break;
        }
      }

      const compositeKey = `${todayKey}_${currentActivePrayer}`;
      if (lastResetPrayer !== compositeKey) {
        setCompletedKhushuSteps(new Set());
        safeSetItem('khushu_last_reset_prayer', compositeKey);
        safeSetItem('khushu_last_reset_date', todayKey);
      }
    }
  }, [currentTime, khushuResetMode, settings]);

  const nightCalc = calculateNightThirds(currentTime, settings);
  const hijri = getHijriDate(currentTime, settings.hijriOffset);
  const todayStr = formatDateKey(currentTime);

  const toggleKhushuStep = (id: string) => {
    setCompletedKhushuSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        trackFeatureCompletion('khushu_step');
      }
      return next;
    });
  };

  const handleCopyDua = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDuaId(id);
    setTimeout(() => setCopiedDuaId(null), 2500);
  };

  const handleAddTahajjudAlarm = (minutesBeforeFajr: number, label: string) => {
    if (!setCustomAlarms) return;

    const todayTimes = getTimesForDate(currentTime);
    const fajrMinutes = parseTimeToMinutes(todayTimes.Fajr);
    let targetMinutes = fajrMinutes - minutesBeforeFajr;
    if (targetMinutes < 0) targetMinutes += 24 * 60;

    const h = Math.floor(targetMinutes / 60).toString().padStart(2, '0');
    const m = (targetMinutes % 60).toString().padStart(2, '0');
    const alarmTime = `${h}:${m}`;

    const newAlarm: AlarmConfig = {
      id: `tahajjud_${Date.now()}`,
      title: `منبه التهجد (${label})`,
      time: alarmTime,
      type: 'fixed',
      enabled: true,
      soundType: 'adhan',
      notifyMode: 'both',
      days: [0, 1, 2, 3, 4, 5, 6]
    };

    setCustomAlarms(prev => [...prev, newAlarm]);
    setLogSuccessMsg(`تم ضبط منبه التهجد بنجاح في الساعة ${toArabicNumbers(alarmTime)}!`);
    setTimeout(() => setLogSuccessMsg(''), 4000);
  };

  const handleSaveQiyam = (qCount: number, wCount: number) => {
    const dStr = todayStr;
    const currentDayLogs = prayerLogs[dStr] || {};

    const updatedQiyamLog: PrayerLog = {
      status: 'A',
      extraRakahs: qCount,
      notes: `قيام: ${qCount} ركعات، وتر: ${wCount} ركعات. الخشوع: ${khushuRating}/5. السور: ${surahsRead || 'لم تحدد'}`
    };

    const newPrayerLogs = {
      ...prayerLogs,
      [dStr]: {
        ...currentDayLogs,
        'Qiyam': updatedQiyamLog
      }
    };

    setPrayerLogs(newPrayerLogs);

    const newEntry: QiyamJournalEntry = {
      date: dStr,
      hijriDate: hijri.fullString,
      rakahs: qCount,
      witrRakahs: wCount,
      rating: khushuRating,
      surahs: surahsRead,
      notes: personalNotes
    };

    const updatedJournal = [newEntry, ...qiyamJournalHistory.filter(e => e.date !== dStr)];
    setQiyamJournalHistory(updatedJournal);

    try {
      safeSetJSON('qiyam_journal_history', updatedJournal);
      trackFeatureCompletion('qiyam_tracker');
      setLogSuccessMsg('تم حفظ وتوثيق قيام الليلة بنجاح! تقبل الله طاعتك 🌙');
      setTimeout(() => setLogSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const getQiyamStats = () => {
    let qiyamDaysCount = 0;
    let totalRakahsSum = 0;
    
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(currentTime.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const log = prayerLogs[dStr];
      if (log && log['Qiyam'] && log['Qiyam'].status === 'A') {
        qiyamDaysCount++;
        totalRakahsSum += log['Qiyam'].extraRakahs || 2;
      }
    }

    return { qiyamDaysCount, totalRakahsSum };
  };

  const { qiyamDaysCount } = getQiyamStats();

  return (
    <div className="space-y-6 text-end pb-12 animate-fade-in" dir="rtl">
      {/* 1. HERO BANNER & LIVE FOCUS MODE TRIGGER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c121e] via-[#151c2d] to-[#1f1636] p-6 text-white border border-indigo-500/30 shadow-xl">
        <div className="absolute top-0 end-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner">
                <Moon className="w-7 h-7 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>الخشوع وقيام الليل والتهجد</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    شرف المؤمن 🌙
                  </span>
                </h2>
                <p className="text-[11px] text-slate-300 font-medium">
                  حاسبة ثلث الليل الآخر، وضع الخلوة والتركيز المباشر، ودليل الخشوع والمناجاة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFocusModeActive(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95 border border-amber-400/30"
              >
                <Maximize2 className="w-4 h-4 text-amber-200" />
                <span>وضع الخلوة والتهجد الحية ✨</span>
              </button>

              <div className="text-start font-mono bg-white/5 px-3 py-1.5 rounded-2xl border border-white/10 hidden sm:block">
                <span className="text-xs text-indigo-300 font-bold block">{hijri.fullString}</span>
                <span className="text-[10px] text-slate-400 font-bold">{toArabicNumbers(todayStr)}</span>
              </div>
            </div>
          </div>

          {/* Hadith Quote Banner */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-1">
            <p className="text-xs sm:text-sm font-black text-amber-200 leading-relaxed font-serif">
              «عَلَيْكُمْ بِقِيَامِ اللَّيْلِ فَإِنَّهُ دَأَبُ الصَّالِحِينَ قَبْلَكُمْ، وَقُرْبَةٌ إِلَى رَبِّكُمْ، وَمَكْفَرَةٌ لِلسَّيِّئَاتِ»
            </p>
            <span className="text-[9.5px] text-slate-400 block font-bold">
              [جامع الترمذي] - قيام الليل نورٌ في الوجه وسكينةٌ في القلب وطمأنينةٌ في الروح.
            </span>
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIVE FOCUS MODE MODAL */}
      <KhushuFocusModeModal
        isOpen={isFocusModeActive}
        onClose={() => setIsFocusModeActive(false)}
        liveRakahCounter={liveRakahCounter}
        setLiveRakahCounter={setLiveRakahCounter}
        selectedFocusDua={selectedFocusDua}
        setSelectedFocusDua={setSelectedFocusDua}
        activeAmbient={activeAmbient}
        playAmbientAudio={playAmbientAudio}
        onSaveAndTransfer={handleSaveQiyam}
        witrRakahs={witrRakahs}
      />

      {/* SUCCESS TOAST NOTIFICATION */}
      {logSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-black flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{logSuccessMsg}</span>
        </div>
      )}

      {/* 2. NIGHT THIRD CALCULATOR & LIVE TIMER CARD */}
      <KhushuNightCalculatorCard
        nightCalc={nightCalc}
        activeAmbient={activeAmbient}
        onAddTahajjudAlarm={handleAddTahajjudAlarm}
        onPlayAmbientAudio={playAmbientAudio}
        onStopAmbientAudio={stopAmbientAudio}
      />

      {/* 3. DAILY QIYAM & TAHAJJUD LOGGING CARD */}
      <KhushuDailyLogCard
        qiyamDaysCount={qiyamDaysCount}
        qiyamRakahs={qiyamRakahs}
        setQiyamRakahs={setQiyamRakahs}
        witrRakahs={witrRakahs}
        setWitrRakahs={setWitrRakahs}
        khushuRating={khushuRating}
        setKhushuRating={setKhushuRating}
        surahsRead={surahsRead}
        setSurahsRead={setSurahsRead}
        personalNotes={personalNotes}
        setPersonalNotes={setPersonalNotes}
        onSaveQiyam={handleSaveQiyam}
      />

      {/* 4. KHUSHU' STEP-BY-STEP GUIDELINES & CHECKLIST */}
      <KhushuGuidelinesCard
        khushuResetMode={khushuResetMode}
        onModeChange={handleModeChange}
        completedKhushuSteps={completedKhushuSteps}
        onResetKhushuSteps={handleResetKhushuSteps}
        stepCategoryFilter={stepCategoryFilter}
        setStepCategoryFilter={setStepCategoryFilter}
        onToggleKhushuStep={toggleKhushuStep}
        selectedStepDetail={selectedStepDetail}
        setSelectedStepDetail={setSelectedStepDetail}
      />

      {/* 5. RECOMMENDED SURAHS CARD */}
      <KhushuSurahsCard
        onAddSurahToReading={(surahName) => {
          setSurahsRead(prev => prev ? `${prev}، ${surahName}` : surahName);
          setLogSuccessMsg(`تم إدراج ${surahName} في قائمة تلاوتك لليوم!`);
        }}
      />

      {/* 6. DUAS & SUPPLICATIONS CARD */}
      <KhushuDuasCard
        duaCategoryFilter={duaCategoryFilter}
        setDuaCategoryFilter={setDuaCategoryFilter}
        copiedDuaId={copiedDuaId}
        onCopyDua={handleCopyDua}
      />

      {/* 7-10. PLANS, JOURNAL, HADITHS, AND TARGETS */}
      <KhushuGuidesAndJournal
        onSelectPlan={(planTitle) => {
          setLogSuccessMsg(`تم اختيار ${planTitle}! استعن بالله وتبتل في محرابك.`);
        }}
        qiyamJournalHistory={qiyamJournalHistory}
      />
    </div>
  );
}
