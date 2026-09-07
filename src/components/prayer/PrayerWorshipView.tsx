import React from 'react';
import { Calendar, Clock, BarChart3 } from 'lucide-react';
import { AppSettings, PrayerLog, PrayerName, PrayerStatus, VoluntaryPrayerLog } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';
import { PrayerTodayWorshipView } from './PrayerTodayWorshipView';
import { PrayerQadaView } from './PrayerQadaView';
import { PrayerHeatmapStats } from '../PrayerHeatmapStats';

interface PrayerWorshipViewProps {
  worshipTab: 'today' | 'qada' | 'heatmap';
  setWorshipTab: (tab: 'today' | 'qada' | 'heatmap') => void;
  // Today view props
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
  // Qada view props
  totalQadaCount: number;
  handleAddFullDayQada: () => void;
  handleResetAllQada: () => void;
  qadaPace: number;
  setQadaPace: (pace: number) => void;
  qadaCounts: Record<PrayerName, number>;
  handlePerformQada: (prayer: PrayerName) => void;
  handleAddManualQada: (prayer: PrayerName) => void;
  // Heatmap view props
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  voluntaryPrayerLogs?: VoluntaryPrayerLog[];
}

export const PrayerWorshipView: React.FC<PrayerWorshipViewProps> = ({
  worshipTab,
  setWorshipTab,
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
  totalQadaCount,
  handleAddFullDayQada,
  handleResetAllQada,
  qadaPace,
  setQadaPace,
  qadaCounts,
  handlePerformQada,
  handleAddManualQada,
  prayerLogs,
  voluntaryPrayerLogs,
}) => {
  return (
    <div className="space-y-6">
      {/* Sub-Navigation for Worship */}
      <div role="tablist" aria-label="تبويبات سجل الصلاة والعبادة" className="flex bg-[#f1f5f9] dark:bg-[#111720] p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 gap-1 text-xs font-bold">
        <button
          type="button"
          role="tab"
          aria-selected={worshipTab === 'today'}
          aria-label="عرض سجل اليوم والسنن"
          onClick={() => setWorshipTab('today')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            worshipTab === 'today'
              ? 'bg-white dark:bg-[#161d26] text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>اليوم والسنن</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={worshipTab === 'qada'}
          aria-label={`عرض سجل الفوائت وقضائها${totalQadaCount > 0 ? ` (${toArabicNumbers(totalQadaCount)} صلاة متبقية)` : ''}`}
          onClick={() => setWorshipTab('qada')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
            worshipTab === 'qada'
              ? 'bg-white dark:bg-[#161d26] text-amber-600 dark:text-amber-400 shadow-xs font-black'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>الفوائت وقضائها</span>
          {totalQadaCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-mono font-black">
              {toArabicNumbers(totalQadaCount)}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={worshipTab === 'heatmap'}
          aria-label="عرض خريطة الالتزام البيانية"
          onClick={() => setWorshipTab('heatmap')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            worshipTab === 'heatmap'
              ? 'bg-white dark:bg-[#161d26] text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>خريطة الالتزام</span>
        </button>
      </div>

      {/* SubTab 1: Today Worship View */}
      {worshipTab === 'today' && (
        <PrayerTodayWorshipView
          selectedDateOffset={selectedDateOffset}
          setSelectedDateOffset={setSelectedDateOffset}
          targetDate={targetDate}
          hijri={hijri}
          targetTimestamp={targetTimestamp}
          dayLogs={dayLogs}
          times={times}
          settings={settings}
          handleLogPrayerStatus={handleLogPrayerStatus}
          handleUpdateSunnah={handleUpdateSunnah}
          handleUpdateNafilah={handleUpdateNafilah}
          setShowDuhaModal={setShowDuhaModal}
          setLogSuccessMessage={setLogSuccessMessage}
          isPlaying={isPlaying}
          currentPhraseIdx={currentPhraseIdx}
          athanPhrases={athanPhrases}
          currentPlayingPrayer={currentPlayingPrayer}
        />
      )}

      {/* SubTab 2: Qada Missed Prayers View */}
      {worshipTab === 'qada' && (
        <PrayerQadaView
          totalQadaCount={totalQadaCount}
          handleAddFullDayQada={handleAddFullDayQada}
          handleResetAllQada={handleResetAllQada}
          qadaPace={qadaPace}
          setQadaPace={setQadaPace}
          qadaCounts={qadaCounts}
          handlePerformQada={handlePerformQada}
          handleAddManualQada={handleAddManualQada}
        />
      )}

      {/* SubTab 3: Prayer Heatmap & Monthly Commitment View */}
      {worshipTab === 'heatmap' && (
        <div className="animate-fade-in space-y-4">
          <PrayerHeatmapStats 
            prayerLogs={prayerLogs} 
            voluntaryPrayerLogs={voluntaryPrayerLogs} 
          />
        </div>
      )}
    </div>
  );
};
