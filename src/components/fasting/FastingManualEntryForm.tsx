/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlusCircle } from 'lucide-react';
import { FastingLog } from '../../types';

interface FastingManualEntryFormProps {
  customDate: string;
  setCustomDate: (date: string) => void;
  fastType: 'Ramadan' | 'Sunnah' | 'Qada' | 'Kaffarah' | 'Nazar';
  setFastType: (type: 'Ramadan' | 'Sunnah' | 'Qada' | 'Kaffarah' | 'Nazar') => void;
  note: string;
  setNote: (note: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function FastingManualEntryForm({
  customDate,
  setCustomDate,
  fastType,
  setFastType,
  note,
  setNote,
  onSubmit
}: FastingManualEntryFormProps) {
  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 space-y-4 transition-colors duration-300">
      <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
        <PlusCircle className="w-5 h-5 text-emerald-500" />
        تسجيل يوم صيام سابق
      </h3>

      <form onSubmit={onSubmit} className="space-y-3.5">
        <div>
          <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mb-1.5">تاريخ الصيام:</label>
          <input 
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mb-1.5">نوع الصيام:</label>
            <select
              value={fastType}
              onChange={(e) => setFastType(e.target.value as FastingLog['fastType'])}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
            >
              <option value="Sunnah">سنة / تطوع</option>
              <option value="Qada">قضاء رمضان</option>
              <option value="Ramadan">رمضان الفريضة</option>
              <option value="Kaffarah">كفارة</option>
              <option value="Nazar">نذر</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mb-1.5">ملاحظة / سبب الصوم:</label>
            <input 
              type="text"
              placeholder="أيام البيض، كفارة يمين..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-transform active:scale-98"
        >
          حفظ يوم الصيام في السجل المبارك
        </button>
      </form>
    </div>
  );
}
