/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { History, Info, Trash2 } from 'lucide-react';
import { FastingLog } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';

interface FastingHistoryLogProps {
  fastingLogsList: FastingLog[];
  onDeleteLog: (dateStr: string) => void;
}

export default function FastingHistoryLog({
  fastingLogsList,
  onDeleteLog
}: FastingHistoryLogProps) {
  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 space-y-4 transition-colors duration-300">
      <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
        <History className="w-5 h-5 text-indigo-500" />
        سجل صيامك التاريخي
      </h3>

      {fastingLogsList.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs font-bold">لا توجد أيام صيام مسجلة حتى الآن.</p>
          <p className="text-[10px] mt-1">ابدأ بتسجيل صيام اليوم لتراه هنا!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[250px] overflow-y-auto pe-1">
          {fastingLogsList.sort((a, b) => b.date.localeCompare(a.date)).map((log) => (
            <div 
              key={log.date}
              className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                    {log.fastType === 'Sunnah' && 'صيام نافلة (سنة)'}
                    {log.fastType === 'Qada' && 'قضاء رمضان'}
                    {log.fastType === 'Ramadan' && 'صيام رمضان الفريضة'}
                    {log.fastType === 'Kaffarah' && 'صيام كفارة'}
                    {log.fastType === 'Nazar' && 'صيام نذر'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                    ({toArabicNumbers(log.date)})
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                  الموافق للهجري: {toArabicNumbers(log.hijriDate || '')}
                </p>
                {log.reason && (
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">
                    ملاحظة: {log.reason}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDeleteLog(log.date)}
                aria-label={`حذف سجل صيام يوم ${toArabicNumbers(log.date)}`}
                className="p-2 hover:bg-rose-500/10 rounded-xl text-rose-500 cursor-pointer transition-colors"
                title="حذف هذا السجل"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
