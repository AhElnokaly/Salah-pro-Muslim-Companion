/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Sparkles, Bell, Volume2, VolumeX } from 'lucide-react';
import { toArabicNumbers } from '../../utils/hijri';

interface NightCalcData {
  nightDurationHours: string;
  midnightStr: string;
  lastThirdStartStr: string;
  isCurrentlyInLastThird: boolean;
  maghribStr?: string;
  fajrStr?: string;
}

interface KhushuNightCalculatorCardProps {
  nightCalc: NightCalcData;
  activeAmbient: 'none' | 'rain' | 'breeze' | 'stream';
  onAddTahajjudAlarm: (minutesBeforeFajr: number, label: string) => void;
  onPlayAmbientAudio: (type: 'rain' | 'breeze' | 'stream') => void;
  onStopAmbientAudio: () => void;
}

export const KhushuNightCalculatorCard: React.FC<KhushuNightCalculatorCardProps> = ({
  nightCalc,
  activeAmbient,
  onAddTahajjudAlarm,
  onPlayAmbientAudio,
  onStopAmbientAudio,
}) => {
  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              حاسبة ثلث الليل الآخر ومنتصف الليل الشرعي
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              حساب دقيق لوقت النزول الإلهي وموعد إجابة الدعاء حسب موقعك الجغرافي
            </p>
          </div>
        </div>

        {nightCalc.isCurrentlyInLastThird ? (
          <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl text-[10px] font-black animate-pulse flex items-center gap-1">
            <span>✨ ثلث الليل الآن!</span>
          </span>
        ) : (
          <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-xl text-[10px] font-black">
            محسوب تلقائياً
          </span>
        )}
      </div>

      {/* Live Status Alert Box */}
      {nightCalc.isCurrentlyInLastThird ? (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/15 border border-amber-500/30 rounded-2xl space-y-1 text-center">
          <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>أنت الآن في وقت ثلث الليل الآخر المبارك! 🌌</span>
          </span>
          <p className="text-[11px] text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
            «يَنْزِلُ رَبُّنَا تَبَارَك وَتَعَالَى كُلَّ لَيْلَةٍ إِلَى السَّمَاءِ الدُّنْيَا حِينَ يَبْقَى ثُلُثُ اللَّيْلِ الآخِرُ يَقُولُ: مَنْ يَدْعُونِي فَأَسْتَجِيبَ لَهُ؟ مَنْ يَسْأَلُنِي فَأُعْطِيَهُ؟ مَنْ يَسْتَغْفِرُنِي فَأَغْفِرَ لَهُ؟»
          </p>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs">
          <span className="font-bold text-slate-600 dark:text-slate-400">طول ليلة اليوم:</span>
          <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {toArabicNumbers(nightCalc.nightDurationHours)} ساعة
          </span>
        </div>
      )}

      {/* Timings Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="p-3 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/60">
          <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold block mb-1">غروب الشمس (المغرب)</span>
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
            {toArabicNumbers(nightCalc.maghribStr || '')}
          </span>
        </div>

        <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
          <span className="text-[9.5px] text-indigo-600 dark:text-indigo-300 font-bold block mb-1">منتصف الليل الشرعي</span>
          <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 font-mono">
            {nightCalc.midnightStr}
          </span>
        </div>

        <div className="p-3 bg-amber-500/10 dark:bg-amber-950/40 rounded-2xl border border-amber-500/20">
          <span className="text-[9.5px] text-amber-700 dark:text-amber-400 font-black block mb-1">بداية ثلث الليل الآخر 🌟</span>
          <span className="text-xs font-black text-amber-800 dark:text-amber-300 font-mono">
            {nightCalc.lastThirdStartStr}
          </span>
        </div>

        <div className="p-3 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/60">
          <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold block mb-1">أذان الفجر الصادق</span>
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
            {toArabicNumbers(nightCalc.fajrStr || '')}
          </span>
        </div>
      </div>

      {/* Quick Tahajjud Alarm Launcher */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <Bell className="w-3.5 h-3.5 text-amber-500" />
          <span>ضبط منبه التهجد الذكي بنقرة واحدة:</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onAddTahajjudAlarm(45, '45 دقيقة قبل الفجر')}
            className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer text-center"
          >
            ⏰ قبل الفجر بـ 45 دقيقة
          </button>
          <button
            type="button"
            onClick={() => onAddTahajjudAlarm(30, '30 دقيقة قبل الفجر')}
            className="py-2 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-800 transition-all cursor-pointer text-center"
          >
            ⏰ قبل الفجر بـ 30 دقيقة
          </button>
          <button
            type="button"
            onClick={() => onAddTahajjudAlarm(15, '15 دقيقة قبل الفجر')}
            className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer text-center"
          >
            ⏰ قبل الفجر بـ 15 دقيقة
          </button>
        </div>
      </div>

      {/* Ambient Background Audio Controls */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>صوتيات خفيفة لخشوع التهجد (بدون إنترنت):</span>
          </span>

          {activeAmbient !== 'none' && (
            <button
              type="button"
              onClick={onStopAmbientAudio}
              className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-1 cursor-pointer"
            >
              <VolumeX className="w-3 h-3" />
              <span>إيقاف الصوت</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onPlayAmbientAudio('rain')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1 ${
              activeAmbient === 'rain'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400'
            }`}
          >
            <span>🌧️ مطر خفيف</span>
          </button>

          <button
            type="button"
            onClick={() => onPlayAmbientAudio('breeze')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1 ${
              activeAmbient === 'breeze'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
            }`}
          >
            <span>🍃 نسيم السحر</span>
          </button>

          <button
            type="button"
            onClick={() => onPlayAmbientAudio('stream')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1 ${
              activeAmbient === 'stream'
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-teal-400'
            }`}
          >
            <span>جداول الماء</span>
          </button>
        </div>
      </div>
    </div>
  );
};
