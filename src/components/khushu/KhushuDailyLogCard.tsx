/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, Star, CheckCircle2 } from 'lucide-react';
import { toArabicNumbers } from '../../utils/hijri';

interface KhushuDailyLogCardProps {
  qiyamDaysCount: number;
  qiyamRakahs: number;
  setQiyamRakahs: (r: number) => void;
  witrRakahs: number;
  setWitrRakahs: (r: number) => void;
  khushuRating: number;
  setKhushuRating: (rating: number) => void;
  surahsRead: string;
  setSurahsRead: (surahs: string) => void;
  personalNotes: string;
  setPersonalNotes: (notes: string) => void;
  onSaveQiyam: (qiyam: number, witr: number) => void;
}

export const KhushuDailyLogCard: React.FC<KhushuDailyLogCardProps> = ({
  qiyamDaysCount,
  qiyamRakahs,
  setQiyamRakahs,
  witrRakahs,
  setWitrRakahs,
  khushuRating,
  setKhushuRating,
  surahsRead,
  setSurahsRead,
  personalNotes,
  setPersonalNotes,
  onSaveQiyam,
}) => {
  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              تسجيل صلاة القيام والتهجد لليوم
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              وثق ركعاتك، مستوى الخشوع، والآيات التي تلوتها في خلوة الليل
            </p>
          </div>
        </div>

        <div className="text-start">
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
            {toArabicNumbers(qiyamDaysCount)} ليلة في الشهر 🌙
          </span>
        </div>
      </div>

      {/* Qiyam & Witr Rakahs Counter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Qiyam Rakahs */}
        <div className="p-3.5 bg-gradient-to-br from-indigo-50/80 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
              عدد ركعات القيام والتهجد:
            </span>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {toArabicNumbers(qiyamRakahs)} ركعة
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1 pt-1">
            {[2, 4, 6, 8, 10].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setQiyamRakahs(r)}
                className={`py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                  qiyamRakahs === r
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-indigo-100 dark:border-indigo-900/50'
                }`}
              >
                {toArabicNumbers(r)}
              </button>
            ))}
          </div>
        </div>

        {/* Witr Rakahs */}
        <div className="p-3.5 bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/40 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-amber-900 dark:text-amber-200">
              صلاة الشفع والوتر:
            </span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
              {toArabicNumbers(witrRakahs)} ركعات
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[1, 3, 5].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setWitrRakahs(r)}
                className={`py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                  witrRakahs === r
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-amber-100 dark:border-amber-900/50'
                }`}
              >
                {toArabicNumbers(r)} {r === 1 ? 'وتر' : 'ركعات'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Khushu Rating Stars Selector */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>تقييم الخشوع وحضور القلب في الصلاة:</span>
          </span>
          <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {toArabicNumbers(khushuRating)} / ٥
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 py-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setKhushuRating(star)}
              aria-label={`تقييم مستوى الخشوع ${star} من 5 نجوم`}
              className="p-1 text-2xl transition-all transform hover:scale-125 cursor-pointer active:scale-95"
              title={`مستوى خشوع ${star}`}
            >
              {star <= khushuRating ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {/* Surahs & Notes Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 dark:text-slate-400 font-black block">السور والآيات التي تلوتها:</label>
          <input
            type="text"
            value={surahsRead}
            onChange={e => setSurahsRead(e.target.value)}
            placeholder="مثال: سورة البقرة، يٰس، الملك..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 dark:text-slate-400 font-black block">خواطر ومناجاة خلوة الليل:</label>
          <input
            type="text"
            value={personalNotes}
            onChange={e => setPersonalNotes(e.target.value)}
            placeholder="دعوات خاصة، استغفار، شكر..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={() => onSaveQiyam(qiyamRakahs, witrRakahs)}
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>حفظ سجل القيام والخشوع لليوم</span>
      </button>
    </div>
  );
};
