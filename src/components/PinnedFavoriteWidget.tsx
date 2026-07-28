import React from 'react';
import { AppSettings } from '../types';

interface PinnedFavoriteWidgetProps {
  pinnedWidget: NonNullable<AppSettings['pinnedWidget']>;
  cityName?: string;
  now: Date;
  hijri?: any;
  times: Record<string, string>;
  current: string;
  next: string;
  timeRemainingStr: string;
  dayNameArabic: string;
  gregorianClean: string;
  toArabicNumbers: (val: any) => string;
  onNavigateWidgets?: () => void;
}

export const PinnedFavoriteWidget: React.FC<PinnedFavoriteWidgetProps> = ({
  pinnedWidget,
  cityName,
  now,
  hijri,
  times,
  current,
  next,
  timeRemainingStr,
  dayNameArabic,
  gregorianClean,
  toArabicNumbers,
  onNavigateWidgets,
}) => {
  const wType = pinnedWidget.type || 'timeline';
  const wTheme = pinnedWidget.theme || 'dark-blue';

  const themeClass = (() => {
    if (wType === 'teal') {
      return 'bg-gradient-to-tr from-[#029587] via-[#05ab95] to-[#0ea185] text-white border border-teal-400/30';
    }
    switch (wTheme) {
      case 'green':
        return 'bg-gradient-to-b from-emerald-950/95 to-teal-900/95 border border-emerald-500/30 text-white';
      case 'gold':
        return 'bg-gradient-to-b from-[#1c1b18]/95 via-[#23201a]/95 to-[#2b2720]/95 border border-amber-500/20 text-amber-100';
      case 'glass':
        return 'bg-white/10 backdrop-blur-xl border border-white/20 text-white';
      case 'dark-blue':
      default:
        return 'bg-gradient-to-b from-[#0c1826]/95 to-[#112236]/95 border border-blue-900/40 text-white';
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

  return (
    <div className="rounded-3xl p-4 sm:p-5 border bg-white dark:bg-[#111723]/95 dark:backdrop-blur-md border-[#e2e8f0] dark:border-white/5 shadow-md dark:shadow-2xl text-slate-800 dark:text-slate-200 transition-all duration-300 relative overflow-hidden flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">📌</span>
          <span className="text-[10px] font-black tracking-wider uppercase opacity-80">أداتك المفضلة المثبتة (شاشة الهاتف)</span>
        </div>
        {onNavigateWidgets && (
          <button
            type="button"
            onClick={onNavigateWidgets}
            className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
          >
            تعديل المكون ←
          </button>
        )}
      </div>

      {/* Widget frame on wallpaper backdrop */}
      <div className="w-full flex justify-center items-center">
        <div className={`relative w-full max-w-sm rounded-2xl p-1.5 overflow-hidden shadow-md flex items-center justify-center border border-white/5 ${
          pinnedWidget.wallpaper === 'slate' ? 'bg-slate-900' :
          pinnedWidget.wallpaper === 'desert' ? 'bg-gradient-to-tr from-[#1f1235] via-[#481d3d] to-[#99413b]' :
          pinnedWidget.wallpaper === 'forest' ? 'bg-gradient-to-b from-[#061f18] via-[#0c2e26] to-[#143d34]' :
          'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950 via-slate-950 to-black'
        }`}>
          <div className="w-full">
            {/* STYLE 1: Timeline */}
            {wType === 'timeline' && (
              <div className={`w-full rounded-xl p-3 flex flex-col justify-between border select-none ${themeClass}`}>
                <div className="flex justify-between items-start border-b border-white/10 pb-1.5">
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex flex-col items-center justify-center font-sans scale-90">
                      <span className="text-[10px] font-black leading-none">{toArabicNumbers(currentDayDigit)}</span>
                      <span className="text-[6px] font-bold leading-none">{currentMonthName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black block text-white/90 leading-none">{dayNameArabic}</span>
                      <span className="text-[6px] font-bold block text-white/40 mt-0.5">{toArabicNumbers(gregorianClean.split(' ').slice(0, 2).join(' '))}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-[6px] font-bold block text-white/40">متبقي للأذان</span>
                    <span className="text-[10px] font-extrabold block text-amber-400 font-mono leading-none mt-0.5" dir="ltr">
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
                          isActive ? 'bg-amber-400 text-slate-900 ring-2 ring-white scale-110' : 'bg-[#1b2b3c] border border-white/10'
                        }`} />
                        <span className={`text-[6.5px] font-bold mt-1 block ${isActive ? 'text-amber-400' : 'text-white/60'}`}>{getArabicNameLocal(pName)}</span>
                        <span className={`text-[7px] font-black font-mono mt-0.2 block ${isActive ? 'text-white' : 'text-white/30'}`}>{toArabicNumbers(prayerTime)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-1.5 text-[7px] text-white/40 font-bold leading-none">
                  <span>📍 {cityName || 'الإسكندرية'}</span>
                  <span>الشروق {toArabicNumbers(times.Sunrise || '٠٦:٠٨')} ص</span>
                </div>
              </div>
            )}

            {/* STYLE 2: Grid */}
            {wType === 'grid' && (
              <div className={`w-full rounded-xl p-2.5 flex flex-col justify-between border select-none ${themeClass}`}>
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5 text-[7.5px] font-black">
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
                        className={`p-1 rounded-lg border flex flex-col items-center justify-center text-center transition-all scale-95 ${
                          isActive ? 'bg-[#15273b]/95 border-amber-400' : 'bg-white/[0.03] border-white/5'
                        }`}
                      >
                        <span className={`text-[7px] font-black ${isActive ? 'text-amber-400' : 'text-white/70'}`}>{getArabicNameLocal(pName)}</span>
                        <span className={`text-[7px] font-black font-mono mt-0.5 ${isActive ? 'text-white' : 'text-white/35'}`}>{toArabicNumbers(prayerTime)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center text-[6px] text-white/30 border-t border-white/5 pt-1 leading-none font-bold">
                  مواقيت الصلاة • رفيق المسلم المطور
                </div>
              </div>
            )}

            {/* STYLE 3: Teal */}
            {wType === 'teal' && (
              <div className="w-full rounded-xl p-3 flex flex-col justify-between bg-gradient-to-tr from-[#029587] via-[#05ab95] to-[#0ea185] text-white shadow-lg relative overflow-hidden select-none border border-teal-400/30 scale-100">
                <div className="flex justify-between items-center border-b border-white/15 pb-1 text-[7.5px] font-black">
                  <span className="flex items-center gap-0.5">📍 {cityName || 'الإسكندرية'}</span>
                  <span className="text-teal-100">{toArabicNumbers(currentDayDigit)} {currentMonthName}</span>
                </div>
                <div className="py-1.5 text-right space-y-0.5">
                  <span className="text-[6px] font-bold text-teal-100/70 block leading-none">الصلاة القادمة</span>
                  <h3 className="text-[10px] font-black text-white flex justify-between items-center leading-none">
                    <span>صلاة {getArabicNameLocal(next)}</span>
                    <span className="text-[11px] font-black font-mono text-amber-300" dir="ltr">{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}</span>
                  </h3>
                </div>
                <div className="grid grid-cols-5 gap-0.5 text-center bg-black/15 rounded-lg p-0.5 border border-white/5 scale-90">
                  {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
                    const isActive = current === pName;
                    const prayerTime = times[pName] || '٠٠:٠٠';
                    return (
                      <div key={pName} className={`p-0.5 rounded transition-all ${isActive ? 'bg-white/20 text-white font-extrabold' : ''}`}>
                        <span className="text-[5.5px] block font-bold opacity-80 leading-none">{getArabicNameLocal(pName)}</span>
                        <span className="text-[6.5px] block font-extrabold font-mono mt-0.5 leading-none">{toArabicNumbers(prayerTime)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STYLE 4: Analog */}
            {wType === 'analog' && (
              <div className={`w-full rounded-xl p-3 flex items-center justify-center gap-3 border select-none ${themeClass}`}>
                <div className="w-[54px] h-[54px] rounded-full bg-[#0a1520] border border-[#192f44] relative flex items-center justify-center shrink-0">
                  <div className="absolute inset-0.5 rounded-full border border-dashed border-white/5 pointer-events-none" />
                  <span className="absolute top-0.5 text-[5px] font-black text-white/30">١٢</span>
                  <span className="absolute right-0.5 text-[5px] font-black text-white/30">٣</span>
                  <span className="absolute bottom-0.5 text-[5px] font-black text-white/30">٦</span>
                  <span className="absolute left-0.5 text-[5px] font-black text-white/30">٩</span>
                  
                  {/* Hands */}
                  <div className="absolute w-[1.5px] h-3.5 bg-white rounded-full origin-bottom" style={{ transform: `rotate(${(now.getHours() % 12) * 30 + now.getMinutes() * 0.5}deg)`, top: 'calc(50% - 3.5px)' }} />
                  <div className="absolute w-[1px] h-5.5 bg-white rounded-full origin-bottom" style={{ transform: `rotate(${now.getMinutes() * 6}deg)`, top: 'calc(50% - 5.5px)' }} />
                  <div className="w-1 h-1 rounded-full bg-red-500 border border-white z-10" />
                </div>
                <div className="flex-1 space-y-0.5 text-right">
                  <span className="text-[6px] font-black text-amber-400 block uppercase leading-none">صلاة {getArabicNameLocal(next)}</span>
                  <h4 className="text-[8px] font-black text-white leading-none">متبقي للأذان</h4>
                  <span className="text-[9px] font-black text-white block font-mono leading-none mt-0.5" dir="ltr">
                    {toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}
                  </span>
                </div>
              </div>
            )}

            {/* STYLE 5: Compact */}
            {wType === 'compact' && (
              <div className="w-full bg-[#eeeeee] dark:bg-[#1a242d] text-slate-800 dark:text-white rounded-full py-2 px-4 flex items-center justify-between shadow-sm border border-slate-200 dark:border-white/5 select-none">
                <div className="flex items-center gap-1 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-extrabold font-sans">
                    {getArabicNameLocal(current)} -{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}
                  </span>
                </div>
                <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-0.5 leading-none">
                  📍 {cityName || 'الإسكندرية'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
