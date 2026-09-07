import React from 'react';
import { Sparkles } from 'lucide-react';
import { AppSettings, PrayerLog, PrayerName, PrayerStatus } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';
import { FIVE_DAILY_PRAYERS } from './prayerUtils';
import PrayerDayNavigationHeader from './PrayerDayNavigationHeader';
import DailyPrayerCard from './DailyPrayerCard';
import NafilahWorshipCards from './NafilahWorshipCards';

interface PrayerTodayWorshipViewProps {
  selectedDateOffset: number;
  setSelectedDateOffset: React.Dispatch<React.SetStateAction<number>>;
  targetDate: Date;
  hijri: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    fullString: string;
  };
  targetTimestamp: number;
  dayLogs: Record<string, PrayerLog>;
  times: Record<PrayerName, string>;
  settings: AppSettings;
  handleLogPrayerStatus: (prayer: PrayerName, status: PrayerStatus) => void;
  handleUpdateSunnah: (prayer: PrayerName, type: 'before' | 'after', amount: number) => void;
  handleUpdateNafilah: (prayerKey: 'Duha' | 'Qiyam' | 'Witr', rakahs: number) => void;
  setShowDuhaModal: (show: boolean) => void;
  setLogSuccessMessage: (msg: string) => void;
  isPlaying: boolean;
  currentPhraseIdx: number;
  athanPhrases: { text: string; duration: number; isFajrOnly?: boolean }[];
  currentPlayingPrayer: PrayerName | null;
}

export const PrayerTodayWorshipView: React.FC<PrayerTodayWorshipViewProps> = ({
  selectedDateOffset,
  setSelectedDateOffset,
  targetDate,
  hijri,
  targetTimestamp,
  dayLogs,
  times,
  settings,
  handleLogPrayerStatus,
  handleUpdateSunnah,
  handleUpdateNafilah,
  setShowDuhaModal,
  setLogSuccessMessage,
  isPlaying,
  currentPhraseIdx,
  athanPhrases,
  currentPlayingPrayer,
}) => {
  // Calculate total sunnahs prayed on selected date
  const duhaRakahs = dayLogs['Duha']?.status === 'A' ? (dayLogs['Duha']?.extraRakahs || 0) : 0;
  const qiyamRakahs = dayLogs['Qiyam']?.status === 'A' ? (dayLogs['Qiyam']?.extraRakahs || 0) : 0;
  const witrRakahs = dayLogs['Witr']?.status === 'A' ? (dayLogs['Witr']?.extraRakahs || 0) : 0;

  const totalSunnahsToday = FIVE_DAILY_PRAYERS.reduce((sum, p) => {
    const log = dayLogs[p];
    return sum + (log?.sunnahBefore || 0) + (log?.sunnahAfter || 0);
  }, 0) + duhaRakahs + qiyamRakahs + witrRakahs;

  const getStatusBtnClass = (prayer: PrayerName, status: PrayerStatus) => {
    const currentStatus = dayLogs[prayer]?.status;
    const isSelected = currentStatus === status;

    if (status === 'A') {
      return isSelected 
        ? 'bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-600 font-extrabold shadow-sm' 
        : 'bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
    if (status === 'B') {
      return isSelected 
        ? 'bg-amber-500 dark:bg-amber-600 text-white border-amber-500 font-extrabold shadow-sm' 
        : 'bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
    if (status === 'D') {
      return isSelected 
        ? 'bg-rose-500 dark:bg-rose-600 text-white border-rose-500 font-extrabold shadow-sm' 
        : 'bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 border-rose-500/20';
    }
    if (status === 'E') {
      return isSelected 
        ? 'bg-purple-600 dark:bg-purple-700 text-white border-purple-600 font-extrabold shadow-sm animate-pulse' 
        : 'bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 border-purple-500/20';
    }
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Day Navigation Header (أسهم التنقل بين الأيام) */}
      <PrayerDayNavigationHeader
        selectedDateOffset={selectedDateOffset}
        setSelectedDateOffset={setSelectedDateOffset}
        targetDate={targetDate}
        hijri={hijri}
        setLogSuccessMessage={setLogSuccessMessage}
      />

      {/* Hadith Quote Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-500/10 dark:border-amber-500/20 p-4 rounded-3xl space-y-2 text-end">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 animate-spin-slow" />
          <span className="text-xs font-black text-amber-800 dark:text-amber-400">فضل الرواتب والسنن:</span>
        </div>
        <p className="text-[11px] text-amber-700/90 dark:text-amber-400/80 leading-relaxed font-semibold">
          قال رسول الله ﷺ: «مَنْ صَلَّى فِي يَوْمٍ وَلَيْلَةٍ ثِنْتَيْ عَشْرَةَ رَكْعَةً بُنِيَ لَهُ بَيْتٌ فِي الْجَنَّةِ» [رواه مسلم].
        </p>
        <div className="flex justify-between items-center pt-2 border-t border-amber-500/10 text-[10px] text-slate-500 dark:text-slate-400 font-extrabold">
          <span>سنن الرواتب التي صليتها اليوم:</span>
          <span className="text-amber-600 dark:text-amber-400 font-black bg-amber-500/10 px-2 py-0.5 rounded-full">
            {toArabicNumbers(totalSunnahsToday)} / ١٢ ركعة
          </span>
        </div>
      </div>

      {/* Interactive Player Live Subtitles Lyric Subcard */}
      {isPlaying && currentPhraseIdx !== -1 && (
        <div className="bg-slate-50/80 dark:bg-slate-900/40 p-4 rounded-3xl border border-dashed border-emerald-500/20 text-center space-y-1 animate-pulse">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 block">يردد المذياع الآن:</span>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
            {athanPhrases.filter(p => !p.isFajrOnly || currentPlayingPrayer === 'Fajr')[currentPhraseIdx]?.text}
          </p>
        </div>
      )}

      {/* Interactive Prayer Cards List */}
      <div className="space-y-4">
        {/* 1. Fajr Prayer */}
        <DailyPrayerCard
          prayer="Fajr"
          targetTimestamp={targetTimestamp}
          log={dayLogs['Fajr']}
          timeStr={times['Fajr']}
          settings={settings}
          handleLogPrayerStatus={handleLogPrayerStatus}
          handleUpdateSunnah={handleUpdateSunnah}
          getStatusBtnClass={getStatusBtnClass}
        />

        {/* 2. Duha Prayer (Sunnah) */}
        <NafilahWorshipCards
          type="duha"
          dayLogs={dayLogs}
          handleUpdateNafilah={handleUpdateNafilah}
          setShowDuhaModal={setShowDuhaModal}
        />

        {/* Fard Prayers (Dhuhr, Asr, Maghrib, Isha) */}
        {(['Dhuhr', 'Asr', 'Maghrib', 'Isha'] as PrayerName[]).map((prayer) => (
          <DailyPrayerCard
            key={prayer}
            prayer={prayer}
            targetTimestamp={targetTimestamp}
            log={dayLogs[prayer]}
            timeStr={times[prayer]}
            settings={settings}
            handleLogPrayerStatus={handleLogPrayerStatus}
            handleUpdateSunnah={handleUpdateSunnah}
            getStatusBtnClass={getStatusBtnClass}
          />
        ))}

        {/* 3. Qiyam al-Layl (Nafilah) */}
        <NafilahWorshipCards
          type="qiyam"
          dayLogs={dayLogs}
          handleUpdateNafilah={handleUpdateNafilah}
        />

        {/* 4. Shaf' & Witr (Nafilah) */}
        <NafilahWorshipCards
          type="witr"
          dayLogs={dayLogs}
          handleUpdateNafilah={handleUpdateNafilah}
        />
      </div>
    </div>
  );
};
