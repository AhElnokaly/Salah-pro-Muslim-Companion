import React, { useState } from 'react';
import { AppSettings, PrayerTimes } from '../types';
import { parseTimeToMinutes } from '../utils/prayerCalc';
import { getMoonPhaseInfo } from './WidgetSimulator';

interface PinnedFavoriteWidgetProps {
  pinnedWidget?: AppSettings['pinnedWidget'];
  cityName?: string;
  now?: Date;
  hijri?: any;
  times?: Record<string, string> | PrayerTimes;
  current?: string;
  next?: string;
  timeRemainingStr?: string;
  dayNameArabic?: string;
  gregorianClean?: string;
  toArabicNumbers?: (val: any) => string;
  onNavigateWidgets?: () => void;
}

export const PinnedFavoriteWidget: React.FC<PinnedFavoriteWidgetProps> = ({
  pinnedWidget,
  cityName,
  now = new Date(),
  hijri,
  times = {} as Record<string, string>,
  current = 'Dhuhr',
  next = 'Asr',
  timeRemainingStr = '',
  dayNameArabic = '',
  gregorianClean = '',
  toArabicNumbers = (val: any) => String(val),
  onNavigateWidgets,
}) => {
  const wType = pinnedWidget?.type || 'timeline';
  const wTheme = pinnedWidget?.theme || 'dark-blue';
  const [subhaCount, setSubhaCount] = useState(0);

  const themeClass = (() => {
    if (wType === 'teal') {
      return 'bg-gradient-to-tr from-[#029587] via-[#05ab95] to-[#0ea185] text-white border border-teal-400/30';
    }
    switch (wTheme) {
      case 'green':
        return 'bg-gradient-to-b from-emerald-950/95 via-emerald-900/95 to-teal-950/95 border border-emerald-500/30 text-white shadow-xl';
      case 'gold':
        return 'bg-gradient-to-b from-[#1c1b18]/95 via-[#23201a]/95 to-[#2b2720]/95 border border-amber-500/30 text-amber-100 shadow-xl';
      case 'glass':
        return 'bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-xl';
      case 'amber':
        return 'bg-gradient-to-tr from-[#2d1706]/95 via-[#452309]/95 to-[#1c0f04]/95 border border-amber-600/30 text-amber-100 shadow-xl';
      case 'onyx':
        return 'bg-gradient-to-b from-[#090d12]/95 via-[#111823]/95 to-[#080b0f]/95 border border-slate-700/40 text-slate-100 shadow-xl';
      case 'dark-blue':
      default:
        return 'bg-gradient-to-b from-[#0c1826]/95 to-[#112236]/95 border border-blue-900/40 text-white shadow-2xl';
    }
  })();

  const getArabicNameLocal = (p: string) => {
    const names: Record<string, string> = {
      Fajr: 'الفجر',
      Sunrise: 'الشروق',
      Dhuhr: 'الظهر',
      Asr: 'العصر',
      Maghrib: 'المغرب',
      Isha: 'العشاء'
    };
    if (p === 'Dhuhr' && now.getDay() === 5) return 'الجمعة';
    return names[p] || p;
  };

  const currentDayDigit = hijri?.day || now.getDate();
  const currentMonthName = hijri?.monthName || 'شوال';
  const currentYear = hijri?.year || 1448;

  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hr = now.getHours();

  const secDeg = sec * 6;
  const minDeg = min * 6 + sec * 0.1;
  const hrDeg = (hr % 12) * 30 + min * 0.5;

  const getFormattedTimeRemaining = (tStr: string) => {
    if (!tStr) return '';
    const clean = tStr.replace('-', '').trim();
    const parts = clean.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (h > 0) {
        return `${toArabicNumbers(h)} س و ${toArabicNumbers(m)} د`;
      }
      return `${toArabicNumbers(m)} دقيقة`;
    }
    return toArabicNumbers(clean);
  };

  const getPrayerProgressPercent = () => {
    if (!times || !current || !next) return 50;
    const currMin = parseTimeToMinutes((times as any)[current] || '');
    let nextMin = parseTimeToMinutes((times as any)[next] || '');
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nextMin <= currMin) nextMin += 24 * 60;
    let currentAdjusted = nowMin;
    if (currentAdjusted < currMin && nextMin > 24 * 60) currentAdjusted += 24 * 60;
    const total = nextMin - currMin;
    if (total <= 0) return 50;
    const elapsed = currentAdjusted - currMin;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  // Dhikr list sample
  const dhikrSample = "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ";

  return (
    <div className="rounded-3xl p-4 sm:p-5 border bg-white dark:bg-[#111723]/95 dark:backdrop-blur-md border-[#e2e8f0] dark:border-white/5 shadow-md dark:shadow-2xl text-slate-800 dark:text-slate-200 transition-all duration-300 relative overflow-hidden flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">📌</span>
          <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-700 dark:text-slate-300">
            أداتك المفضلة المثبتة (شاشة الهاتف)
          </span>
        </div>
        {onNavigateWidgets && (
          <button
            type="button"
            onClick={onNavigateWidgets}
            className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/40"
          >
            تخصيص الـ Widgets ⚙️
          </button>
        )}
      </div>

      {/* Widget frame on wallpaper backdrop */}
      <div className="w-full flex justify-center items-center">
        <div className={`relative w-full max-w-md rounded-2xl p-2 overflow-hidden shadow-lg flex items-center justify-center border border-white/10 ${
          pinnedWidget.wallpaper === 'slate' ? 'bg-slate-900' :
          pinnedWidget.wallpaper === 'desert' ? 'bg-gradient-to-tr from-[#1f1235] via-[#481d3d] to-[#99413b]' :
          pinnedWidget.wallpaper === 'forest' ? 'bg-gradient-to-b from-[#061f18] via-[#0c2e26] to-[#143d34]' :
          pinnedWidget.wallpaper === 'light' ? 'bg-gradient-to-br from-amber-50 via-sky-50 to-emerald-50' :
          'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950 via-slate-950 to-black'
        }`}>
          <div className="w-full">
            {/* STYLE 0: Custom Modular Card */}
            {wType === 'custom' && (
              <div className={`w-full rounded-xl p-3 flex flex-col justify-between border select-none gap-2 ${themeClass}`}>
                {/* Header: Date + Moon Phase */}
                {(pinnedWidget.showDate ?? true) && (
                  <div className="flex justify-between items-center border-b border-white/10 pb-1.5 text-[8.5px] font-black">
                    <span className="text-white flex items-center gap-1">
                      {dayNameArabic} • {toArabicNumbers(currentDayDigit)} {currentMonthName} {toArabicNumbers(currentYear)} هـ
                    </span>
                    {(pinnedWidget.showMoonPhase ?? true) && (
                      <span className="text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-full text-[7.5px] flex items-center gap-0.5 font-bold">
                        {getMoonPhaseInfo(currentDayDigit).icon} {getMoonPhaseInfo(currentDayDigit).name}
                      </span>
                    )}
                  </div>
                )}

                {/* Clock Block */}
                {(pinnedWidget.clockStyle || 'digital') === 'digital' && (
                  <div className="text-center py-1 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-[18px] font-black font-mono tracking-widest text-white leading-none block">
                      {toArabicNumbers(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))}
                    </span>
                    <span className="text-[6.5px] font-bold text-amber-400 block mt-0.5">التوقيت المحلي لمدينتك</span>
                  </div>
                )}

                {(pinnedWidget.clockStyle) === 'analog' && (
                  <div className="flex items-center justify-center gap-3 py-1">
                    <div className="w-[52px] h-[52px] rounded-full bg-[#0a1520] border-2 border-[#1e3448] relative flex items-center justify-center shrink-0 shadow-lg">
                      <div className="absolute inset-0.5 rounded-full border border-dashed border-white/10 pointer-events-none" />
                      <span className="absolute top-1 text-[6px] font-black text-amber-400/80 leading-none">١٢</span>
                      <span className="absolute end-1 text-[6px] font-black text-white/40 leading-none">٣</span>
                      <span className="absolute bottom-1 text-[6px] font-black text-white/40 leading-none">٦</span>
                      <span className="absolute start-1 text-[6px] font-black text-white/40 leading-none">٩</span>

                      {/* Hour Hand */}
                      <div 
                        className="absolute bg-gradient-to-t from-amber-400 to-amber-200 rounded-full shadow-xs"
                        style={{
                          width: '2.5px',
                          height: '14px',
                          left: '50%',
                          bottom: '50%',
                          transformOrigin: 'bottom center',
                          transform: `translateX(-50%) rotate(${hrDeg}deg)`
                        }}
                      />

                      {/* Minute Hand */}
                      <div 
                        className="absolute bg-white rounded-full shadow-xs"
                        style={{
                          width: '1.5px',
                          height: '19px',
                          left: '50%',
                          bottom: '50%',
                          transformOrigin: 'bottom center',
                          transform: `translateX(-50%) rotate(${minDeg}deg)`
                        }}
                      />

                      {/* Second Hand */}
                      <div 
                        className="absolute bg-red-500 rounded-full"
                        style={{
                          width: '1px',
                          height: '21px',
                          left: '50%',
                          bottom: '50%',
                          transformOrigin: 'bottom center',
                          transform: `translateX(-50%) rotate(${secDeg}deg)`
                        }}
                      />

                      {/* Center Pivot Dot */}
                      <div className="w-2 h-2 rounded-full bg-red-500 border border-white z-10 shadow-xs" />
                    </div>
                    <div className="text-right">
                      <span className="text-[7.5px] font-black text-amber-400 block">الساعة التناظرية</span>
                      <span className="text-[10px] font-mono font-bold text-white block">{toArabicNumbers(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }))}</span>
                    </div>
                  </div>
                )}

                {/* Prayer Display */}
                {(pinnedWidget.prayerDisplay || 'next_only') === 'next_only' && (
                  <div className="bg-black/25 p-2 rounded-xl border border-white/10 space-y-1.5 overflow-hidden">
                    <div className="flex justify-between items-center text-[8.5px] gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="font-black text-white truncate">
                          الصلاة القادمة: صلاة {getArabicNameLocal(next)}
                        </span>
                      </div>
                      <span className="text-[8px] font-mono font-black text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/20 shrink-0">
                        {toArabicNumbers(times[next] || '')}
                      </span>
                    </div>

                    {(pinnedWidget.showProgressBar ?? true) && (
                      <div className="space-y-1 pt-0.5 border-t border-white/5">
                        <div className="flex justify-between items-center text-[7.5px] font-bold px-0.5">
                          <span className="text-amber-200/90 flex items-center gap-1">
                            <span>⏳ متبقي للأذان:</span>
                            <span className="font-mono font-black text-amber-300">
                              {getFormattedTimeRemaining(timeRemainingStr)}
                            </span>
                          </span>
                          <span className="text-white/50 text-[7px] font-mono">
                            ({toArabicNumbers(getPrayerProgressPercent())}%)
                          </span>
                        </div>
                        <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 h-full rounded-full transition-all duration-700 shadow-sm"
                            style={{ width: `${getPrayerProgressPercent()}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(pinnedWidget.prayerDisplay) === 'all_prayers' && (
                  <div className="grid grid-cols-5 gap-0.5 text-center bg-black/25 rounded-xl p-1 border border-white/10">
                    {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
                      const isActive = current === pName;
                      const prayerTime = times[pName] || '٠٠:٠٠';
                      return (
                        <div key={pName} className={`p-0.5 rounded transition-all ${isActive ? 'bg-amber-400 text-slate-950 font-black' : 'text-white/80'}`}>
                          <span className="text-[6px] block font-bold leading-none">{getArabicNameLocal(pName)}</span>
                          <span className="text-[7px] block font-black font-mono mt-0.5 leading-none">{toArabicNumbers(prayerTime)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Dhikr Quote */}
                {(pinnedWidget.showDhikr ?? true) && (
                  <div className="text-center py-0.5">
                    <p className="text-[9px] font-black text-amber-100 font-serif leading-snug">
                      «سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ»
                    </p>
                  </div>
                )}

                {/* Quranic Ayah */}
                {(pinnedWidget.showAyah ?? false) && (
                  <div className="text-center py-0.5 bg-white/5 rounded-lg p-1 border border-white/5">
                    <p className="text-[8.5px] font-black text-emerald-200 font-serif leading-snug">
                      «أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ» [الرعد: ٢٨]
                    </p>
                  </div>
                )}

                {/* Qibla Indicator */}
                {(pinnedWidget.showQibla ?? false) && (
                  <div className="flex justify-between items-center bg-black/20 px-2 py-1 rounded-lg text-[7.5px]">
                    <span className="font-bold text-amber-300">🕋 اتجاه القبلة: ١٣٦° جنوب شرق</span>
                    <span className="text-white/60">موقعك: {cityName || 'الإسكندرية'}</span>
                  </div>
                )}

                {/* Subha Button */}
                {(pinnedWidget.showSubhaBtn ?? true) && (
                  <div className="flex justify-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => setSubhaCount(c => c + 1)}
                      className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-[9px] px-3 py-1 rounded-full shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>📿 تسبيح مباشر ({toArabicNumbers(subhaCount)})</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STYLE 1: Timeline */}
            {wType === 'timeline' && (
              <div className={`w-full rounded-xl p-3 flex flex-col justify-between border select-none ${themeClass}`}>
                <div className="flex justify-between items-start border-b border-white/10 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex flex-col items-center justify-center font-sans">
                      <span className="text-[11px] font-black leading-none">{toArabicNumbers(currentDayDigit)}</span>
                      <span className="text-[6px] font-bold leading-none">{currentMonthName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8.5px] font-black block text-white/90 leading-none">{dayNameArabic}</span>
                      <span className="text-[6.5px] font-bold block text-white/40 mt-0.5">{toArabicNumbers(gregorianClean.split(' ').slice(0, 2).join(' '))}</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="text-[6.5px] font-bold block text-white/40">متبقي للأذان</span>
                    <span className="text-[11px] font-extrabold block text-amber-400 font-mono leading-none mt-0.5" dir="ltr">
                      -{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}
                    </span>
                  </div>
                </div>

                <div className="relative py-2.5 my-0.5 flex items-center justify-between">
                  <div className="absolute inset-x-1.5 h-[1.5px] bg-white/20 top-1/2 -translate-y-1/2 z-0 rounded-full" />
                  {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
                    const isActive = current === pName;
                    const prayerTime = times[pName] || '٠٠:٠٠';
                    return (
                      <div key={pName} className="flex flex-col items-center relative z-10 scale-90">
                        <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-all ${
                          isActive ? 'bg-amber-400 text-slate-900 ring-2 ring-white scale-120 shadow-xs' : 'bg-[#1b2b3c] border border-white/10'
                        }`} />
                        <span className={`text-[7px] font-bold mt-1 block ${isActive ? 'text-amber-400 font-black' : 'text-white/60'}`}>{getArabicNameLocal(pName)}</span>
                        <span className={`text-[7.5px] font-black font-mono mt-0.2 block ${isActive ? 'text-white' : 'text-white/30'}`}>{toArabicNumbers(prayerTime)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-1.5 text-[7.5px] text-white/40 font-bold leading-none">
                  <span>📍 {cityName || 'الإسكندرية'}</span>
                  <span>الشروق {toArabicNumbers(times.Sunrise || '٠٦:٠٨')} ص</span>
                </div>
              </div>
            )}

            {/* STYLE 2: Grid */}
            {wType === 'grid' && (
              <div className={`w-full rounded-xl p-2.5 flex flex-col justify-between border select-none ${themeClass}`}>
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5 text-[8px] font-black">
                  <span className="text-white">{dayNameArabic} • {toArabicNumbers(currentDayDigit)} {currentMonthName}</span>
                  <span className="text-amber-400 flex items-center gap-0.5">📍 {cityName || 'الإسكندرية'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-1.5">
                  {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
                    const isActive = current === pName;
                    const prayerTime = times[pName] || '٠٠:٠٠';
                    return (
                      <div 
                        key={pName}
                        className={`p-1.5 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${
                          isActive ? 'bg-[#15273b]/95 border-amber-400 shadow-sm' : 'bg-white/[0.03] border-white/5'
                        }`}
                      >
                        <span className={`text-[7.5px] font-black ${isActive ? 'text-amber-400' : 'text-white/70'}`}>{getArabicNameLocal(pName)}</span>
                        <span className={`text-[8px] font-black font-mono mt-0.5 ${isActive ? 'text-white' : 'text-white/35'}`}>{toArabicNumbers(prayerTime)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center text-[6.5px] text-white/30 border-t border-white/5 pt-1 leading-none font-bold">
                  مواقيت الصلاة • تطبيق هِمَّتِي
                </div>
              </div>
            )}

            {/* STYLE 3: Teal */}
            {wType === 'teal' && (
              <div className="w-full rounded-xl p-3 flex flex-col justify-between bg-gradient-to-tr from-[#029587] via-[#05ab95] to-[#0ea185] text-white shadow-lg relative overflow-hidden select-none border border-teal-400/30 scale-100">
                <div className="flex justify-between items-center border-b border-white/15 pb-1 text-[8px] font-black">
                  <span className="flex items-center gap-0.5">📍 {cityName || 'الإسكندرية'}</span>
                  <span className="text-teal-100">{toArabicNumbers(currentDayDigit)} {currentMonthName}</span>
                </div>
                <div className="py-1.5 text-right space-y-0.5">
                  <span className="text-[6.5px] font-bold text-teal-100/70 block leading-none">الصلاة القادمة</span>
                  <h3 className="text-[11px] font-black text-white flex justify-between items-center leading-none">
                    <span>صلاة {getArabicNameLocal(next)}</span>
                    <span className="text-[12px] font-black font-mono text-amber-300" dir="ltr">{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}</span>
                  </h3>
                </div>
                <div className="grid grid-cols-5 gap-0.5 text-center bg-black/15 rounded-lg p-0.5 border border-white/5 scale-90">
                  {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
                    const isActive = current === pName;
                    const prayerTime = times[pName] || '٠٠:٠٠';
                    return (
                      <div key={pName} className={`p-0.5 rounded transition-all ${isActive ? 'bg-white/20 text-white font-extrabold' : ''}`}>
                        <span className="text-[6px] block font-bold opacity-80 leading-none">{getArabicNameLocal(pName)}</span>
                        <span className="text-[7px] block font-extrabold font-mono mt-0.5 leading-none">{toArabicNumbers(prayerTime)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STYLE 4: Analog */}
            {wType === 'analog' && (
              <div className={`w-full rounded-xl p-3 flex items-center justify-center gap-3 border select-none ${themeClass}`}>
                <div className="w-[56px] h-[56px] rounded-full bg-[#0a1520] border-2 border-[#1e3448] relative flex items-center justify-center shrink-0 shadow-md">
                  <div className="absolute inset-0.5 rounded-full border border-dashed border-white/10 pointer-events-none" />
                  <span className="absolute top-1 text-[6px] font-black text-amber-400/80 leading-none">١٢</span>
                  <span className="absolute end-1 text-[6px] font-black text-white/40 leading-none">٣</span>
                  <span className="absolute bottom-1 text-[6px] font-black text-white/40 leading-none">٦</span>
                  <span className="absolute start-1 text-[6px] font-black text-white/40 leading-none">٩</span>

                  {/* Hour Hand */}
                  <div 
                    className="absolute bg-gradient-to-t from-amber-400 to-amber-200 rounded-full shadow-xs"
                    style={{
                      width: '2.5px',
                      height: '15px',
                      left: '50%',
                      bottom: '50%',
                      transformOrigin: 'bottom center',
                      transform: `translateX(-50%) rotate(${hrDeg}deg)`
                    }}
                  />

                  {/* Minute Hand */}
                  <div 
                    className="absolute bg-white rounded-full shadow-xs"
                    style={{
                      width: '1.5px',
                      height: '21px',
                      left: '50%',
                      bottom: '50%',
                      transformOrigin: 'bottom center',
                      transform: `translateX(-50%) rotate(${minDeg}deg)`
                    }}
                  />

                  {/* Second Hand */}
                  <div 
                    className="absolute bg-red-500 rounded-full"
                    style={{
                      width: '1px',
                      height: '23px',
                      left: '50%',
                      bottom: '50%',
                      transformOrigin: 'bottom center',
                      transform: `translateX(-50%) rotate(${secDeg}deg)`
                    }}
                  />

                  <div className="w-2 h-2 rounded-full bg-red-500 border border-white z-10 shadow-xs" />
                </div>
                <div className="flex-1 space-y-1 text-right">
                  <span className="text-[7.5px] font-black text-amber-400 block uppercase leading-none">صلاة {getArabicNameLocal(next)}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold text-white/70">متبقي للأذان:</span>
                    <span className="text-[10px] font-black text-amber-300 font-mono leading-none">
                      {getFormattedTimeRemaining(timeRemainingStr)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STYLE 5: Compact */}
            {wType === 'compact' && (
              <div className="w-full bg-[#eeeeee] dark:bg-[#1a242d] text-slate-800 dark:text-white rounded-full py-2 px-4 flex items-center justify-between shadow-sm border border-slate-200 dark:border-white/5 select-none">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9.5px] font-extrabold font-sans">
                    {getArabicNameLocal(current)} -{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}
                  </span>
                </div>
                <span className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-0.5 leading-none">
                  📍 {cityName || 'الإسكندرية'}
                </span>
              </div>
            )}

            {/* NEW STYLE 6: Dhikr & Subha */}
            {wType === 'dhikr' && (
              <div className={`w-full rounded-xl p-3 flex flex-col justify-between border select-none ${themeClass}`}>
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5 text-[8px] font-black">
                  <span className="text-amber-400 flex items-center gap-1">✨ ذكر اليوم البركة</span>
                  <span className="text-white/60">{dayNameArabic}</span>
                </div>
                <div className="py-2 text-center space-y-1.5">
                  <p className="text-[10px] font-black leading-relaxed text-amber-100 font-serif">
                    «{dhikrSample}»
                  </p>
                  <div className="flex justify-center items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSubhaCount(c => c + 1)}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[9px] px-3 py-1 rounded-full shadow-sm active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span>📿 تسبيحة</span>
                      <span className="bg-slate-950/20 text-slate-950 px-1.5 py-0.2 rounded-full font-mono">{toArabicNumbers(subhaCount)}</span>
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-white/5 pt-1 text-[7px] text-white/40 font-bold">
                  <span>الصلاة القادمة: {getArabicNameLocal(next)}</span>
                  <span>📍 {cityName || 'مكة المكرمة'}</span>
                </div>
              </div>
            )}

            {/* NEW STYLE 7: Qibla Compass */}
            {wType === 'qibla' && (
              <div className={`w-full rounded-xl p-3 flex items-center justify-between border select-none ${themeClass}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md flex items-center justify-center shrink-0">
                    <div className="w-full h-full rounded-full bg-[#0d1622] flex flex-col items-center justify-center text-center relative">
                      <span className="text-[12px] leading-none">🕌</span>
                      <span className="text-[6px] font-black text-amber-400 font-mono mt-0.5">١٣٦°</span>
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[7px] font-black text-amber-400 block uppercase">بوصلة القبلة المباشرة</span>
                    <h4 className="text-[10px] font-black text-white">الكعبة المشرفة (جنوب شرق)</h4>
                    <span className="text-[7.5px] font-bold text-white/50 block">موقعك الحالي: {cityName || 'الإسكندرية'}</span>
                  </div>
                </div>
                <div className="text-end bg-black/20 px-2 py-1 rounded-lg border border-white/5">
                  <span className="text-[6px] font-bold text-white/40 block">الأذان القادم</span>
                  <span className="text-[9px] font-black text-amber-400 font-mono">{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}</span>
                </div>
              </div>
            )}

            {/* NEW STYLE 8: Full Islamic Calendar */}
            {wType === 'calendar' && (
              <div className={`w-full rounded-xl p-3 flex flex-col justify-between border select-none ${themeClass}`}>
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex flex-col items-center justify-center font-sans shadow-xs">
                      <span className="text-[12px] font-black leading-none">{toArabicNumbers(currentDayDigit)}</span>
                      <span className="text-[6px] font-bold leading-none">{currentMonthName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9.5px] font-black block text-white">{dayNameArabic}</span>
                      <span className="text-[7px] font-extrabold text-amber-300 block">{toArabicNumbers(currentYear)} هجرية</span>
                    </div>
                  </div>
                  <div className="text-end bg-white/10 px-2 py-1 rounded-lg border border-white/10">
                    <span className="text-[6.5px] font-bold text-emerald-200 block">حالة اليوم</span>
                    <span className="text-[8px] font-black text-white">مستحب الصيام 🌙</span>
                  </div>
                </div>
                <div className="py-1.5 flex justify-between items-center text-[7.5px] font-bold text-white/80 border-t border-b border-white/5 my-1">
                  <span>الظهر {toArabicNumbers(times.Dhuhr || '١٢:١٥')}</span>
                  <span>العصر {toArabicNumbers(times.Asr || '١٥:٤٥')}</span>
                  <span className="text-amber-300 font-black">المغرب {toArabicNumbers(times.Maghrib || '١٩:٠٢')}</span>
                  <span>العشاء {toArabicNumbers(times.Isha || '٢٠:٣٥')}</span>
                </div>
                <div className="flex justify-between items-center text-[7px] text-white/40 font-bold">
                  <span>📍 {cityName || 'مصر'}</span>
                  <span>{toArabicNumbers(gregorianClean)}</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

