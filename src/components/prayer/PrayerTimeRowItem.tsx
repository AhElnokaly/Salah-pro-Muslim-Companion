/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Volume2, 
  VolumeX, 
  Bell, 
  Smartphone, 
  Play, 
  Pause, 
  Plus, 
  Minus, 
  Music,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { PrayerName } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';
import { AudioTrack } from '../../utils/audioStorage';

export interface PrayerTimeRowItemProps {
  pName: PrayerName | 'Sunrise';
  pTime: string;
  isNext: boolean;
  sMode: 'adhan' | 'beep' | 'vibrate' | 'silent';
  arabicName: string;
  isPlaying: boolean;
  currentPlayingPrayer: string | null;
  activeHijriMonth: number;
  prayerOffset: number;
  activeMuezzinId: string;
  muezzins: AudioTrack[];
  downloadedTrackIds: Set<string>;
  prayerVolume: number;
  onCycleSoundMode: () => void;
  onTogglePlayAthan: () => void;
  onOpenDuhaModal: () => void;
  onOpenNightPrayersModal: () => void;
  onUpdateOffset: (amount: number) => void;
  onSelectMuezzin: (muezzinId: string) => void;
  onUpdateVolume: (volume: number) => void;
}

export const PrayerTimeRowItem: React.FC<PrayerTimeRowItemProps> = ({
  pName,
  pTime,
  isNext,
  sMode,
  arabicName,
  isPlaying,
  currentPlayingPrayer,
  activeHijriMonth,
  prayerOffset,
  activeMuezzinId,
  muezzins,
  downloadedTrackIds,
  prayerVolume,
  onCycleSoundMode,
  onTogglePlayAthan,
  onOpenDuhaModal,
  onOpenNightPrayersModal,
  onUpdateOffset,
  onSelectMuezzin,
  onUpdateVolume,
}) => {
  const isCurrentlyPlaying = isPlaying && currentPlayingPrayer === pName;

  const getSoundIcon = () => {
    if (sMode === 'adhan') return <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
    if (sMode === 'beep') return <Bell className="w-3.5 h-3.5 text-amber-500" />;
    if (sMode === 'vibrate') return <Smartphone className="w-3.5 h-3.5 text-teal-500" />;
    return <VolumeX className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />;
  };

  const getSoundText = () => {
    if (sMode === 'adhan') return pName === 'Sunrise' ? 'تنبيه الشروق' : 'أذان كامل';
    if (sMode === 'beep') return 'رنين التنبيه';
    if (sMode === 'vibrate') return 'اهتزاز';
    return 'صامت';
  };

  const getShortMuezzinName = (id: string) => {
    const found = muezzins.find(m => m.id === id);
    if (found) {
      const isDownloaded = downloadedTrackIds.has(id) || found.isCustom;
      return isDownloaded ? `⚡ ${found.name}` : found.name;
    }
    return id;
  };

  return (
    <div 
      id={`prayer_card_${pName}`}
      className={`bg-white dark:bg-[#161d26] rounded-2xl p-3.5 sm:p-4 border transition-all duration-300 flex flex-col gap-2.5 ${
        isNext 
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/20 dark:bg-indigo-950/20' 
          : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
      }`}
    >
      {/* Row 1: Info & Sound Settings */}
      <div className="flex items-center justify-between w-full">
        {/* Right side: Dot, Name, Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${isNext ? 'bg-indigo-600 dark:bg-indigo-400 animate-ping' : 'bg-slate-300 dark:bg-slate-700'}`} />
          <span className={`text-xs sm:text-sm font-black flex items-center gap-1.5 ${isNext ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>
            {arabicName}
            {isNext && (
              <span className="text-[9px] sm:text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md font-bold">
                القادمة
              </span>
            )}
          </span>
        </div>

        {/* Left side: Time, Sound Mode, and Play Test */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs sm:text-sm font-black font-mono text-slate-800 dark:text-slate-100">
            {toArabicNumbers(pTime)}
          </span>

          {/* Sound Mode Selector Button */}
          <button
            id={`sound_mode_btn_${pName}`}
            type="button"
            onClick={onCycleSoundMode}
            className="py-1.5 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700/60 cursor-pointer flex items-center gap-1 justify-center min-w-[75px] sm:min-w-[85px] active:scale-95 shadow-2xs"
            title="اضغط لتغيير وضع الصوت والتنبيه"
            aria-label={`تغيير وضع تنبيه ${arabicName}`}
          >
            {getSoundIcon()}
            <span className="text-[9px] sm:text-[10px] font-black text-slate-600 dark:text-slate-300">{getSoundText()}</span>
          </button>

          {/* Play Test Button for Adhan / Sunrise Sound */}
          <button
            id={`play_athan_btn_${pName}`}
            type="button"
            onClick={onTogglePlayAthan}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${
              isCurrentlyPlaying
                ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/20'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-2xs'
            }`}
            title={isCurrentlyPlaying ? "إيقاف سماع الصوت" : "تجربة سماع الصوت"}
            aria-label={isCurrentlyPlaying ? `إيقاف صوت أذان ${arabicName}` : `تجربة الاستماع لصوت أذان ${arabicName}`}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ms-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Voluntary Prayer Action Buttons */}
      {pName === 'Sunrise' && (
        <button
          id="duha_quick_log_btn"
          type="button"
          onClick={onOpenDuhaModal}
          className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-300/50 dark:border-amber-700/50 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs mt-0.5 active:scale-[0.98]"
          aria-label="تسجيل صلاة الضحى"
        >
          <Sun className="w-4 h-4 text-amber-500 shrink-0" />
          <span>☀️ تسجيل صلاة الضحى (صلاة الأوابين)</span>
        </button>
      )}

      {pName === 'Isha' && (
        <button
          id="night_prayers_quick_log_btn"
          type="button"
          onClick={onOpenNightPrayersModal}
          className="w-full py-2 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-900 dark:text-indigo-200 border border-indigo-300/50 dark:border-indigo-700/50 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs mt-0.5 active:scale-[0.98]"
          aria-label="تسجيل صلوات الليل والقيام والشفع والوتر"
        >
          <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>🌃 تسجيل صلوات الليل (قيام، شفع، وتر{activeHijriMonth === 9 ? '، تراويح' : ''})</span>
        </button>
      )}

      {/* Row 2: Settings & Adjustments */}
      <div className="border-t border-slate-100 dark:border-slate-800/60 pt-2.5 mt-0.5 flex flex-col gap-2.5">
        {/* First sub-row: Offset & Muezzin */}
        <div className="flex items-center gap-2">
          {/* Offset Adjuster (الضبط لأقرب مسجد) */}
          <div 
            id={`offset_container_${pName}`}
            className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800"
            title="الضبط لأقرب مسجد"
          >
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-extrabold shrink-0">المسجد:</span>
            <div className="flex items-center gap-1">
              <button
                id={`offset_minus_btn_${pName}`}
                type="button"
                onClick={() => onUpdateOffset(-1)}
                className="w-7 h-7 sm:w-8 sm:h-8 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-xs active:scale-90"
                title="تأخير دقيقة"
                aria-label={`تأخير دقيقة لوقت صلاة ${arabicName}`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              
              <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-100 min-w-[28px] text-center">
                {toArabicNumbers(prayerOffset > 0 ? `+${prayerOffset}` : `${prayerOffset}`)} د
              </span>

              <button
                id={`offset_plus_btn_${pName}`}
                type="button"
                onClick={() => onUpdateOffset(1)}
                className="w-7 h-7 sm:w-8 sm:h-8 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-xs active:scale-90"
                title="تقديم دقيقة"
                aria-label={`تقديم دقيقة لوقت صلاة ${arabicName}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Muezzin / Audio Selector */}
          <div 
            id={`muezzin_select_box_${pName}`}
            className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 min-w-0 relative"
          >
            <div className="flex items-center gap-1.5 min-w-0 w-full">
              <Music className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <select
                id={`muezzin_select_${pName}`}
                value={activeMuezzinId}
                onChange={(e) => onSelectMuezzin(e.target.value)}
                aria-label={`اختيار صوت أذان ${arabicName}`}
                className="bg-transparent text-[11px] sm:text-xs font-black text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer border-none p-0 pe-4 ms-0.5 min-w-0 flex-1 truncate"
              >
                {muezzins.map((m) => (
                  <option key={m.id} value={m.id} className="dark:bg-[#161d26] text-slate-800 dark:text-slate-200">
                    {getShortMuezzinName(m.id)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2 pointer-events-none shrink-0" />
            </div>
          </div>
        </div>

        {/* Second sub-row: Per-Prayer Volume Slider */}
        <div 
          id={`volume_container_${pName}`}
          className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800"
        >
          <div className="flex items-center gap-2.5 flex-1">
            <Volume2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <input
              id={`volume_slider_${pName}`}
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={prayerVolume}
              onChange={(e) => onUpdateVolume(parseFloat(e.target.value))}
              aria-label={`تحديد حجم صوت ${arabicName}`}
              className="flex-1 h-2 accent-emerald-600 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              title="حجم الصوت لهذا التنبيه"
            />
          </div>
          <span className="text-[11px] sm:text-xs font-mono text-slate-600 dark:text-slate-300 font-bold me-2 min-w-[34px] text-start">
            {toArabicNumbers(Math.round(prayerVolume * 100))}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default PrayerTimeRowItem;
