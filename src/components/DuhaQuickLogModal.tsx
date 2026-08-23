/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Check, X, Sun, Volume2, VolumeX, Sparkles, Clock, BookOpen, RotateCcw } from 'lucide-react';
import { PrayerLog, VoluntaryPrayerLog } from '../types';
import { toArabicNumbers } from '../utils/hijri';
import { formatDateKey } from '../utils/prayerDayBoundary';
import { defaultMuezzins, getAudioUrlSync } from '../utils/audioStorage';

export interface DuhaQuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr?: string;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  voluntaryPrayerLogs?: VoluntaryPrayerLog[];
  setVoluntaryPrayerLogs?: React.Dispatch<React.SetStateAction<VoluntaryPrayerLog[]>>;
  onSuccess?: (msg: string) => void;
}

export const DuhaQuickLogModal: React.FC<DuhaQuickLogModalProps> = ({
  isOpen,
  onClose,
  dateStr = formatDateKey(new Date()),
  prayerLogs,
  setPrayerLogs,
  voluntaryPrayerLogs = [],
  setVoluntaryPrayerLogs,
  onSuccess
}) => {
  const [duhaRakaat, setDuhaRakaat] = useState<number>(2);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const vol = voluntaryPrayerLogs.find(l => l.appPrayerDay === dateStr && l.type === 'duha');
      const dayLog = prayerLogs[dateStr]?.['Duha'];
      if (vol && vol.rakaat) {
        setDuhaRakaat(vol.rakaat);
      } else if (dayLog && dayLog.extraRakahs) {
        setDuhaRakaat(dayLog.extraRakahs);
      } else {
        setDuhaRakaat(2);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      }
    }
  }, [isOpen, dateStr, prayerLogs, voluntaryPrayerLogs]);

  if (!isOpen) return null;

  const toggleSoundTest = () => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingAudio(false);
    } else {
      const sunriseMuezzinKey = localStorage.getItem('salah_muezzin_Sunrise') || 'mishary';
      const muezzinObj = defaultMuezzins.find(m => m.id === sunriseMuezzinKey) || defaultMuezzins[0];
      const audioUrl = getAudioUrlSync(muezzinObj?.url || './audio/azan1.mp3');

      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
      } else {
        audioRef.current.src = audioUrl;
      }

      audioRef.current.play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => setIsPlayingAudio(false));

      audioRef.current.onended = () => setIsPlayingAudio(false);
    }
  };

  const handleSave = (rakaat: number) => {
    if (setVoluntaryPrayerLogs) {
      setVoluntaryPrayerLogs(prev => [
        ...prev.filter(l => !(l.appPrayerDay === dateStr && l.type === 'duha')),
        ...(rakaat > 0 ? [{
          id: crypto.randomUUID(),
          appPrayerDay: dateStr,
          type: 'duha' as const,
          rakaat,
          loggedAt: Date.now()
        }] : [])
      ]);
    }

    setPrayerLogs(prev => {
      const dayLogs = prev[dateStr] || {};
      const existingLog = dayLogs['Duha'] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0, extraRakahs: 0 };
      return {
        ...prev,
        [dateStr]: {
          ...dayLogs,
          'Duha': {
            ...existingLog,
            status: rakaat > 0 ? 'A' : 'not_yet',
            extraRakahs: rakaat
          }
        }
      };
    });

    const msg = rakaat > 0 
      ? `تم تسجيل صلاة الضحى (${toArabicNumbers(rakaat)} ركعات) بنجاح ✓`
      : `تم إلغاء تسجيل صلاة الضحى`;
    if (onSuccess) onSuccess(msg);
    onClose();
  };

  const isLogged = duhaRakaat > 0 && prayerLogs[dateStr]?.['Duha']?.status === 'A';

  return (
    <div className="fixed inset-0 bg-black/65 dark:bg-black/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-[#161d26] w-full max-w-md rounded-t-[2.2rem] sm:rounded-[2.2rem] p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header & Top Action Bar */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            ☀️ الشروق وسُنّة الضحى
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Badge & Title (Centered) */}
        <div className="text-center space-y-2 py-1">
          <div className="relative w-16 h-16 bg-gradient-to-br from-amber-400/20 via-amber-500/15 to-orange-500/10 text-amber-500 dark:text-amber-400 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-inner border border-amber-500/20">
            <Sun className="w-8 h-8 animate-spin-slow text-amber-500" />
            <div className="absolute inset-0 rounded-3xl bg-amber-400/10 blur-md -z-10" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight">
              شروق الشمس وصلاة الضحى
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block mt-1">
              صلاة الأوابين — يبدأ وقتها بعد الشروق بـ ١٥ دقيقة
            </p>
          </div>
        </div>

        {/* Educational Info Card */}
        <div className="p-4 bg-gradient-to-b from-amber-500/8 to-amber-500/3 dark:from-amber-500/15 dark:to-amber-500/5 border border-amber-500/20 dark:border-amber-500/25 rounded-2xl space-y-3 text-xs shadow-2xs">
          <div className="flex items-start gap-2.5 text-right">
            <span className="text-base shrink-0 mt-0.5">🌅</span>
            <div className="space-y-0.5">
              <span className="font-black text-amber-900 dark:text-amber-300 block text-xs">
                شروق الشمس (نهاية وقت صلاة الفجر):
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                يمثل شروق الشمس نهاية وقت صلاة الفجر شرعاً، وتُستحب بعد الشروق بـ ١٥-٢٠ دقيقة صلاة الضحى.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-500/15 flex items-start gap-2.5 text-right">
            <span className="text-base shrink-0 mt-0.5">💡</span>
            <div className="space-y-0.5">
              <span className="font-black text-amber-900 dark:text-amber-300 block text-xs">
                فضل صلاة الضحى:
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                سنة مؤكدة مباركة تُعادل صدقة عن كل سلامى (مفصل) في جسد الإنسان (٣٦٠ صدقة يومياً)، أقلها ركعتان وأكثرها ثمان ركعات.
              </p>
            </div>
          </div>
        </div>

        {/* Audio Sound Test Button */}
        <button
          type="button"
          onClick={toggleSoundTest}
          className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 font-extrabold rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs active:scale-98"
        >
          {isPlayingAudio ? (
            <>
              <VolumeX className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>إيقاف صوت تنبيه الشروق</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-amber-500" />
              <span>تجربة سماع صوت تنبيه الشروق 🔔</span>
            </>
          )}
        </button>

        {/* Interactive Rakaat Selector */}
        <div className="space-y-2.5 pt-1">
          <label className="text-xs font-black text-slate-700 dark:text-slate-200 block text-center sm:text-right">
            اختر عدد الركعات التي صليتها:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[2, 4, 6, 8].map((r) => {
              const isSelected = duhaRakaat === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDuhaRakaat(r)}
                  className={`py-3 text-xs font-black rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-white border-amber-600 shadow-md scale-105 ring-2 ring-amber-400/40 font-black'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-500/10'
                  }`}
                >
                  <span>{toArabicNumbers(r)} {r === 2 ? 'ركعتان' : 'ركعات'}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={() => handleSave(duhaRakaat)}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs sm:text-sm rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-98"
          >
            <Check className="w-4.5 h-4.5" />
            <span>تسجيل صلاة الضحى ({toArabicNumbers(duhaRakaat)} ركعات) ✓</span>
          </button>

          {isLogged && (
            <button
              type="button"
              onClick={() => handleSave(0)}
              className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إلغاء تسجيل صلاة الضحى</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs transition-all cursor-pointer"
          >
            حسناً، جزاكم الله خيراً
          </button>
        </div>

      </div>
    </div>
  );
};

