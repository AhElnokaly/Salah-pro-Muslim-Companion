/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { toArabicNumbers } from '../../../utils/hijri';
import { getMoonPhaseInfo } from '../../../utils/moonPhase';
import type { AppSettings, PrayerTimes } from '../../../types';
import { BellOff, Bell, Compass } from 'lucide-react';

export interface SimulatorCustomWidgetProps {
  themeClass: string;
  cardSize?: 'compact' | 'medium' | 'large';
  showDate: boolean;
  dayNameArabic: string;
  currentDayDigit: number;
  currentMonthName: string;
  currentYear: number;
  showMoonPhase: boolean;
  clockStyle: 'none' | 'digital' | 'analog';
  internalTime: Date;
  hrDeg: number;
  minDeg: number;
  secDeg: number;
  prayerDisplay: 'none' | 'next_only' | 'all_prayers';
  nextPrayer: string;
  currentPrayer: string;
  prayerTimes: PrayerTimes | Record<string, string>;
  showProgressBar: boolean;
  timeRemainingStr: string;
  getFormattedTimeRemaining: (tStr: string) => string;
  getPrayerProgressPercent: () => number;
  getArabicName: (p: string) => string;
  showKhushuBtn?: boolean;
  showDhikr: boolean;
  showAyah: boolean;
  showQibla: boolean;
  settings: AppSettings;
  showSubhaBtn: boolean;
  subhaCount: number;
  setSubhaCount: React.Dispatch<React.SetStateAction<number>>;
}

export const SimulatorCustomWidget: React.FC<SimulatorCustomWidgetProps> = ({
  themeClass,
  cardSize = 'medium',
  showDate,
  dayNameArabic,
  currentDayDigit,
  currentMonthName,
  currentYear,
  showMoonPhase,
  clockStyle,
  internalTime,
  hrDeg,
  minDeg,
  secDeg,
  prayerDisplay,
  nextPrayer,
  currentPrayer,
  prayerTimes,
  showProgressBar,
  timeRemainingStr,
  getFormattedTimeRemaining,
  getPrayerProgressPercent,
  getArabicName,
  showKhushuBtn = true,
  showDhikr,
  showAyah,
  showQibla,
  settings,
  showSubhaBtn,
  subhaCount,
  setSubhaCount,
}) => {
  const [isSimulatedKhushu, setIsSimulatedKhushu] = useState(false);

  const isCompact = cardSize === 'compact';
  const isLarge = cardSize === 'large';

  return (
    <div
      className={`w-full rounded-[22px] p-3 flex flex-col justify-between transition-all duration-300 border text-start select-none relative overflow-hidden backdrop-blur-md shadow-xl ${
        isCompact ? 'min-h-[140px] space-y-1.5' : isLarge ? 'min-h-[260px] space-y-2.5' : 'min-h-[175px] space-y-2'
      } ${themeClass}`}
      dir="rtl"
    >
      {/* Subtle decorative background glow */}
      <div className="absolute -top-10 -end-10 w-24 h-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

      {/* HEADER: Date, Hijri, Moon Phase */}
      {showDate && (
        <div className="flex justify-between items-center border-b border-white/10 pb-1.5 text-[8.5px] font-bold">
          <span className="text-white/95 flex items-center gap-1 truncate">
            <span>{dayNameArabic}</span>
            <span>•</span>
            <span className="text-amber-300 font-mono font-black">
              {toArabicNumbers(currentDayDigit)} {currentMonthName} {toArabicNumbers(currentYear)} هـ
            </span>
          </span>
          {showMoonPhase && (
            <span className="text-amber-300 bg-amber-400/15 px-1.5 py-0.5 rounded-full text-[7.5px] flex items-center gap-0.5 font-bold shrink-0 border border-amber-400/20">
              <span>{getMoonPhaseInfo(currentDayDigit).icon}</span>
              <span>{getMoonPhaseInfo(currentDayDigit).name}</span>
            </span>
          )}
        </div>
      )}

      {/* CLOCK SECTION (If enabled and appropriate for size) */}
      {clockStyle === 'digital' && (
        <div className="text-center py-1 bg-black/25 rounded-xl border border-white/5">
          <span className="text-[17px] font-black font-mono tracking-widest text-white leading-none block drop-shadow-xs">
            {toArabicNumbers(
              internalTime.toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
                second: isCompact ? undefined : '2-digit',
              })
            )}
          </span>
          {!isCompact && (
            <span className="text-[6.5px] font-bold text-amber-300/80 block mt-0.5">التوقيت المحلي</span>
          )}
        </div>
      )}

      {clockStyle === 'analog' && (
        <div className="flex items-center justify-center gap-2.5 py-1">
          <div className="w-[48px] h-[48px] rounded-full bg-black/40 border border-white/20 relative flex items-center justify-center shrink-0 shadow-inner">
            <span className="absolute top-0.5 text-[5.5px] font-black text-amber-400">١٢</span>
            <span className="absolute end-1 text-[5.5px] font-black text-white/40">٣</span>
            <span className="absolute bottom-0.5 text-[5.5px] font-black text-white/40">٦</span>
            <span className="absolute start-1 text-[5.5px] font-black text-white/40">٩</span>

            {/* Hour hand */}
            <div
              className="absolute bg-gradient-to-t from-amber-400 to-amber-200 rounded-full"
              style={{
                width: '2px',
                height: '13px',
                left: '50%',
                bottom: '50%',
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) rotate(${hrDeg}deg)`,
              }}
            />
            {/* Minute hand */}
            <div
              className="absolute bg-white rounded-full"
              style={{
                width: '1.5px',
                height: '17px',
                left: '50%',
                bottom: '50%',
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) rotate(${minDeg}deg)`,
              }}
            />
            {/* Second hand */}
            <div
              className="absolute bg-red-400 rounded-full"
              style={{
                width: '1px',
                height: '19px',
                left: '50%',
                bottom: '50%',
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) rotate(${secDeg}deg)`,
              }}
            />
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 border border-white z-10" />
          </div>
          <div className="text-start">
            <span className="text-[7px] font-bold text-amber-300/90 block">الساعة</span>
            <span className="text-[10.5px] font-mono font-black text-white">
              {toArabicNumbers(
                internalTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
              )}
            </span>
          </div>
        </div>
      )}

      {/* PRAYER DISPLAY: HERO OR ALL */}
      {prayerDisplay !== 'none' && (
        <div className="bg-black/30 p-2 rounded-xl border border-white/10 space-y-1.5">
          {/* Next Prayer Highlight */}
          <div className="flex justify-between items-center text-[9px] gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-xs shadow-emerald-400" />
              <span className="font-black text-white truncate">
                الصلاة القادمة: صلاة {getArabicName(nextPrayer)}
              </span>
            </div>
            <span className="text-[8.5px] font-mono font-black text-amber-300 bg-amber-400/15 px-1.5 py-0.5 rounded-md border border-amber-400/25 shrink-0">
              {toArabicNumbers(prayerTimes[nextPrayer] || '')}
            </span>
          </div>

          {/* Progress Bar & Countdown */}
          {showProgressBar && (
            <div className="space-y-1 pt-1 border-t border-white/5">
              <div className="flex justify-between items-center text-[7.5px] font-bold">
                <span className="text-amber-200/90 flex items-center gap-1">
                  <span>⏳ متبقي:</span>
                  <span className="font-mono font-black text-amber-300">
                    {getFormattedTimeRemaining(timeRemainingStr)}
                  </span>
                </span>
                <span className="text-white/60 font-mono text-[7px]">
                  ({toArabicNumbers(getPrayerProgressPercent())}%)
                </span>
              </div>
              <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 h-full rounded-full transition-all duration-700 shadow-xs"
                  style={{ width: `${getPrayerProgressPercent()}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ALL PRAYERS ROW (Shown when prayerDisplay === 'all_prayers' or on medium/large cards) */}
      {(prayerDisplay === 'all_prayers' || (!isCompact && prayerDisplay !== 'none')) && (
        <div className="grid grid-cols-5 gap-1 text-center bg-black/20 rounded-xl p-1 border border-white/10">
          {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
            const isCurrent = currentPrayer === pName;
            const isNext = nextPrayer === pName;
            const prayerTime = prayerTimes[pName] || '٠٠:٠٠';
            return (
              <div
                key={pName}
                className={`py-1 px-0.5 rounded-lg transition-all ${
                  isNext
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : isCurrent
                    ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-white/80'
                }`}
              >
                <span className="text-[6.5px] block font-bold leading-none truncate">
                  {getArabicName(pName)}
                </span>
                <span className="text-[7.5px] block font-black font-mono mt-0.5 leading-none">
                  {toArabicNumbers(prayerTime)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* SPIRITUAL CONTENT: Dhikr / Ayah (on medium and large cards) */}
      {!isCompact && showDhikr && (
        <div className="text-center py-0.5">
          <p className="text-[8.5px] font-black text-amber-100/95 font-serif leading-snug">
            «سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ»
          </p>
        </div>
      )}

      {isLarge && showAyah && (
        <div className="text-center py-1 bg-white/5 rounded-xl px-2 border border-white/5">
          <p className="text-[8px] font-bold text-emerald-200 font-serif leading-snug">
            «أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ» [الرعد: ٢٨]
          </p>
        </div>
      )}

      {/* QIBLA DIRECTION (On large or if enabled) */}
      {showQibla && (
        <div className="flex justify-between items-center bg-black/25 px-2 py-1 rounded-xl text-[7.5px] border border-white/5">
          <span className="font-bold text-amber-300 flex items-center gap-1">
            <Compass className="w-2.5 h-2.5" />
            <span>القبلة: ١٣٦° جنوب شرق</span>
          </span>
          <span className="text-white/60 truncate">{settings.cityName || 'الإسكندرية'}</span>
        </div>
      )}

      {/* BOTTOM ACTION BAR: Tasbeeh Button + Khushu Mode Quick Action */}
      {(showSubhaBtn || showKhushuBtn) && (
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          {showSubhaBtn && (
            <button
              type="button"
              onClick={() => setSubhaCount((c) => c + 1)}
              className="flex-1 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-[8.5px] py-1 px-2 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>📿 تسبيح ({toArabicNumbers(subhaCount)})</span>
            </button>
          )}

          {showKhushuBtn && (
            <button
              type="button"
              onClick={() => setIsSimulatedKhushu(!isSimulatedKhushu)}
              className={`py-1 px-2 rounded-lg text-[8px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 border ${
                isSimulatedKhushu
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm animate-pulse'
                  : 'bg-white/10 hover:bg-white/15 text-white/90 border-white/10'
              }`}
            >
              {isSimulatedKhushu ? <BellOff className="w-2.5 h-2.5" /> : <Bell className="w-2.5 h-2.5" />}
              <span>{isSimulatedKhushu ? 'الخشوع نشط 🔕' : 'وضع الخشوع'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SimulatorCustomWidget;
