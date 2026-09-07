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
  Music 
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
  currentPlayingPrayer: PrayerName | null;
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
  const getSoundIcon = () => {
    if (sMode === 'adhan') return <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
    if (sMode === 'beep') return <Bell className="w-3.5 h-3.5 text-amber-500" />;
    if (sMode === 'vibrate') return <Smartphone className="w-3.5 h-3.5 text-teal-500" />;
    return <VolumeX className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />;
  };

  const getSoundText = () => {
    if (sMode === 'adhan') return 'أذان كامل';
    if (sMode === 'beep') return 'تنبيه فقط';
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
      className={`bg-white dark:bg-[#161d26] rounded-xl p-3 border transition-all duration-300 flex flex-col gap-2 ${
        isNext 
          ? 'border-indigo-500 ring-1 ring-indigo-500/10 shadow-sm bg-indigo-500/5' 
          : 'border-[#e2e8f0]/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
      }`}
    >
      {/* Row 1: Info & Sound Settings */}
      <div className="flex items-center justify-between w-full">
        {/* Right side: Dot, Name, Badge */}
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isNext ? 'bg-indigo-600 dark:bg-indigo-400 animate-ping' : 'bg-slate-300 dark:bg-slate-700'}`} />
          <span className={`text-xs sm:text-sm font-black flex items-center gap-1.5 ${isNext ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-800 dark:text-white'}`}>
            {arabicName}
            {isNext && (
              <span className="text-[8px] sm:text-[9px] bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-1 py-0.5 rounded-md font-bold">
                القادمة
              </span>
            )}
          </span>
        </div>

        {/* Left side: Time, Sound Mode, and Play Test */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-black font-mono text-slate-800 dark:text-slate-200">
            {toArabicNumbers(pTime)}
          </span>

          {/* Sound Mode Selector Button */}
          <button
            type="button"
            onClick={onCycleSoundMode}
            className="py-1 px-1.5 sm:px-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-all border border-slate-100 dark:border-slate-800/40 cursor-pointer flex items-center gap-1 justify-center min-w-[65px] sm:min-w-[75px]"
            title="اضغط لتغيير وضع الصوت والتنبيه"
            aria-label={`تغيير وضع تنبيه ${arabicName}`}
          >
            {getSoundIcon()}
            <span className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-400">{getSoundText()}</span>
          </button>

          {/* Play Test Button for Adhan / Sunrise Sound */}
          <button
            type="button"
            onClick={onTogglePlayAthan}
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-all flex items-center justify-center cursor-pointer shrink-0 ${
              isPlaying && currentPlayingPrayer === pName
                ? 'bg-rose-500 text-white animate-pulse shadow-md'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
            }`}
            title={isPlaying && currentPlayingPrayer === pName ? "إيقاف سماع الصوت" : "تجربة سماع الصوت"}
            aria-label={isPlaying && currentPlayingPrayer === pName ? `إيقاف صوت أذان ${arabicName}` : `تجربة الاستماع لصوت أذان ${arabicName}`}
          >
            {isPlaying && currentPlayingPrayer === pName ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Voluntary Prayer Action Buttons */}
      {pName === 'Sunrise' && (
        <button
          type="button"
          onClick={onOpenDuhaModal}
          className="w-full py-1.5 px-3 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs mt-1"
          aria-label="تسجيل صلاة الضحى"
        >
          <span>☀️ تسجيل صلاة الضحى (صلاة الأوابين)</span>
        </button>
      )}

      {pName === 'Isha' && (
        <button
          type="button"
          onClick={onOpenNightPrayersModal}
          className="w-full py-1.5 px-3 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs mt-1"
          aria-label="تسجيل صلوات الليل والقيام والشفع والوتر"
        >
          <span>🌃 تسجيل صلوات الليل (قيام، شفع، وتر{activeHijriMonth === 9 ? '، تراويح' : ''})</span>
        </button>
      )}

      {/* Row 2: Settings & Adjustments */}
      <div className="border-t border-slate-100 dark:border-slate-800/30 pt-2.5 mt-1 flex flex-col gap-2">
        {/* First sub-row: Offset & Muezzin */}
        <div className="flex items-center gap-2">
          {/* Offset Adjuster (الضبط لأقرب مسجد) */}
          <div className="flex-1 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40 px-2 py-1 rounded-xl border border-slate-100 dark:border-slate-800/40 text-end" title="الضبط لأقرب مسجد">
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-extrabold ms-1.5 shrink-0">المسجد:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdateOffset(-1)}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-slate-200/40 dark:border-slate-700/40 w-5.5 h-5.5 bg-white dark:bg-slate-800 shadow-3xs"
                title="تأخير دقيقة"
                aria-label={`تأخير دقيقة لوقت صلاة ${arabicName}`}
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              
              <span className="text-xs font-mono font-black text-slate-700 dark:text-slate-200 min-w-[24px] text-center">
                {toArabicNumbers(prayerOffset > 0 ? `+${prayerOffset}` : `${prayerOffset}`)} د
              </span>

              <button
                type="button"
                onClick={() => onUpdateOffset(1)}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-slate-200/40 dark:border-slate-700/40 w-5.5 h-5.5 bg-white dark:bg-slate-800 shadow-3xs"
                title="تقديم دقيقة"
                aria-label={`تقديم دقيقة لوقت صلاة ${arabicName}`}
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Muezzin / Audio Selector */}
          <div className="flex-1 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-800/40 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 w-full">
              <Music className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <select
                value={activeMuezzinId}
                onChange={(e) => onSelectMuezzin(e.target.value)}
                className="bg-transparent text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer border-none p-0 pe-1 ms-0.5 min-w-0 flex-1 appearance-none"
              >
                {muezzins.map((m) => (
                  <option key={m.id} value={m.id} className="dark:bg-[#161d26] text-slate-800 dark:text-slate-200">
                    {getShortMuezzinName(m.id)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Second sub-row: Per-Prayer Volume Slider */}
        <div className="flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40 px-2.5 py-1.5 rounded-xl border border-slate-100/40 dark:border-slate-800/40">
          <div className="flex items-center gap-2 flex-1">
            <Volume2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={prayerVolume}
              onChange={(e) => onUpdateVolume(parseFloat(e.target.value))}
              className="flex-1 h-1.5 accent-emerald-600 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              title="حجم الصوت لهذا التنبيه"
            />
          </div>
          <span className="text-[10px] sm:text-xs font-mono text-slate-500 dark:text-slate-400 font-bold me-3 min-w-[32px] text-start">
            {toArabicNumbers(Math.round(prayerVolume * 100))}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default PrayerTimeRowItem;
