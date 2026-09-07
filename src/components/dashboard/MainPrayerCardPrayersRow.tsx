import React from 'react';
import { Volume2 } from 'lucide-react';
import { PrayerName, DailyPrayerLogs } from '../../types';

interface MainPrayerCardPrayersRowProps {
  current: PrayerName | null;
  times: Record<string, string>;
  todayLogs: DailyPrayerLogs;
  now: Date;
  getArabicPrayerName: (p: PrayerName, date?: Date) => string;
  toArabicNumbers: (n: number | string) => string;
  isPrayerInFuture: (p: PrayerName, date: Date, times: Record<string, string>) => boolean;
  setShowDuhaQuickLog: (show: boolean) => void;
  setFuturePrayerWarning: (p: PrayerName | null) => void;
  setSelectedPrayerToLog: (p: PrayerName | null) => void;
}

export const MainPrayerCardPrayersRow: React.FC<MainPrayerCardPrayersRowProps> = ({
  current,
  times,
  todayLogs,
  now,
  getArabicPrayerName,
  toArabicNumbers,
  isPrayerInFuture,
  setShowDuhaQuickLog,
  setFuturePrayerWarning,
  setSelectedPrayerToLog,
}) => {
  const currentLog = current && current !== 'Sunrise' ? todayLogs[current] : undefined;
  const isCurrentLogged = currentLog && (currentLog.status === 'A' || currentLog.status === 'B' || currentLog.status === 'D' || currentLog.status === 'E');
  const needsAttention = current && current !== 'Sunrise' && !isCurrentLogged;

  return (
    <div className="w-full z-10 pt-1 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 px-1">
        {needsAttention ? (
          <p className="text-[9.5px] text-amber-300 font-extrabold leading-tight animate-pulse flex items-center gap-1">
            <span className="inline-block animate-bounce text-[10px]">👇</span>
            <span>حان وقت صلاة {getArabicPrayerName(current, now)}! اضغط لتسجيل صلاتك</span>
          </p>
        ) : (
          <p className="text-[8px] text-white/50 font-bold leading-none animate-fade-in">
            انقر على صلاة لتسجيل الفريضة والسنن
          </p>
        )}
        {current && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent('trigger-athan-simulation', { detail: { prayerName: current } }));
            }}
            className="py-1 px-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black rounded-lg text-[10px] shadow-sm flex items-center gap-1 cursor-pointer transition-all shrink-0"
            title="استماع لأذان الصلاة الحالية"
          >
            <Volume2 className="w-3 h-3 text-slate-950 shrink-0" />
            <span>الأذان 🔊</span>
          </button>
        )}
      </div>

      <div role="list" aria-label="أوقات الصلوات الخمس والشروق" className="grid grid-cols-6 gap-1 text-center">
        {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as PrayerName[]).map((pName) => {
          const isActive = current === pName;
          const isSunrise = pName === 'Sunrise';
          const log = !isSunrise ? todayLogs[pName] : undefined;
          const status = log?.status || 'future';
          const isLogged = !isSunrise && (status === 'A' || status === 'B' || status === 'D' || status === 'E');
          const shouldNudge = isActive && !isSunrise && !isLogged;

          let bgClass = '';
          let borderClass = 'border-transparent';
          let textNameClass = 'text-white/90';
          let textTimeClass = 'text-white/80';

          if (isActive) {
            bgClass = 'bg-white dark:bg-amber-400 text-slate-900 dark:text-slate-950 shadow-md font-bold';
            if (shouldNudge) {
              bgClass += ' animate-gentle-wiggle animate-dynamic-glow ring-2 ring-amber-500 dark:ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
            }
            textNameClass = 'text-slate-900 dark:text-slate-950';
            textTimeClass = 'text-slate-900/80 dark:text-slate-950/85';
          } else {
            if (isSunrise) {
              bgClass = 'bg-white/5 hover:bg-white/12 text-white/80';
            } else if (status === 'A') {
              bgClass = 'bg-emerald-500/15 text-white';
              borderClass = 'border-emerald-500/30';
            } else if (status === 'B') {
              bgClass = 'bg-amber-500/15 text-white';
              borderClass = 'border-amber-500/30';
            } else if (status === 'D') {
              bgClass = 'bg-rose-500/15 text-white';
              borderClass = 'border-rose-500/30';
            } else if (status === 'E') {
              bgClass = 'bg-purple-500/15 text-white';
              borderClass = 'border-purple-500/30';
            } else {
              bgClass = 'bg-white/5 hover:bg-white/15 text-white/80';
            }
          }

          const hasSunnahBefore = !isSunrise && (pName === 'Fajr' || pName === 'Dhuhr');
          const hasSunnahAfter = !isSunrise && (pName === 'Dhuhr' || pName === 'Maghrib' || pName === 'Isha');
          const sunnahBeforeMax = pName === 'Dhuhr' ? 4 : 2;
          const sunnahAfterMax = 2;

          const currentSunnahBefore = log?.sunnahBefore || 0;
          const currentSunnahAfter = log?.sunnahAfter || 0;

          const isBeforeDone = currentSunnahBefore >= sunnahBeforeMax;
          const isAfterDone = currentSunnahAfter >= sunnahAfterMax;
          const isBeforeStarted = currentSunnahBefore > 0 && !isBeforeDone;
          const isAfterStarted = currentSunnahAfter > 0 && !isAfterDone;

          return (
            <button 
              key={pName} 
              type="button"
              role="listitem"
              aria-current={isActive ? 'time' : undefined}
              aria-label={isSunrise ? `وقت الشروق ${toArabicNumbers(times[pName])} - تسجيل صلاة الضحى` : `صلاة ${getArabicPrayerName(pName, now)} الساعة ${toArabicNumbers(times[pName])}${isActive ? ' (الصلاة الحالية)' : ''} - تسجيل الفريضة والسنن`}
              onClick={() => {
                if (isSunrise) {
                  setShowDuhaQuickLog(true);
                  return;
                }
                if (isPrayerInFuture(pName, now, times)) {
                  setFuturePrayerWarning(pName);
                } else {
                  setSelectedPrayerToLog(pName);
                }
              }}
              className={`flex flex-col items-center py-1.5 px-0.5 rounded-xl transition-all duration-300 border ${borderClass} ${bgClass} cursor-pointer focus:outline-none relative`}
            >
              {!isActive && !isSunrise && status !== 'future' && (
                <span className={`w-1 h-1 rounded-full absolute top-1 end-1 ${
                  status === 'A' ? 'bg-emerald-400 animate-pulse' : status === 'B' ? 'bg-amber-400' : status === 'E' ? 'bg-purple-400' : 'bg-rose-400'
                }`} />
              )}
              
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-amber-500 dark:bg-amber-950 absolute top-1 end-1" />
              )}

              <span className={`text-[9px] block font-black leading-none ${textNameClass}`}>
                {getArabicPrayerName(pName, now)}
              </span>
              <span className={`text-[8px] block mt-0.5 font-extrabold ${textTimeClass}`}>
                {toArabicNumbers(times[pName])}
              </span>

              {!isSunrise && (hasSunnahBefore || hasSunnahAfter) ? (
                <div className="flex gap-0.5 mt-1 justify-center items-center">
                  {hasSunnahBefore && (
                    <span 
                      title={`سنة قبلية: ${toArabicNumbers(currentSunnahBefore)}/${toArabicNumbers(sunnahBeforeMax)} ركعات`}
                      className={`w-1 h-1 rounded-full transition-all ${
                        isBeforeDone
                          ? isActive ? 'bg-amber-800' : 'bg-amber-400'
                          : isBeforeStarted
                          ? isActive ? 'bg-amber-800/60 border-[0.5px] border-amber-900' : 'bg-amber-400/50 border-[0.5px] border-amber-400/80'
                          : isActive ? 'bg-slate-400' : 'bg-white/20'
                      }`} 
                    />
                  )}
                  {hasSunnahAfter && (
                    <span 
                      title={`سنة بعدية: ${toArabicNumbers(currentSunnahAfter)}/${toArabicNumbers(sunnahAfterMax)} ركعات`}
                      className={`w-1 h-1 rounded-full transition-all ${
                        isAfterDone
                          ? isActive ? 'bg-amber-800' : 'bg-amber-400'
                          : isAfterStarted
                          ? isActive ? 'bg-amber-800/60 border-[0.5px] border-amber-900' : 'bg-amber-400/50 border-[0.5px] border-amber-400/80'
                          : isActive ? 'bg-slate-400' : 'bg-white/20'
                      }`} 
                    />
                  )}
                </div>
              ) : (
                <div className="h-2" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
