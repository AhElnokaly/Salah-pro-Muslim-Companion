/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sun, Moon, Sparkles, Check, ArrowLeft } from 'lucide-react';
import { DashboardTab, PrayerLog } from '../../types';

export interface NafilahPrayersCardProps {
  currentStyle?: any;
  todayLogs: Record<string, PrayerLog>;
  handleUpdateNafilah: (nafilahKey: string, completed: boolean) => void;
  setActiveTab?: (tab: DashboardTab) => void;
  toArabicNumbers: (n: number | string) => string;
}

export const NafilahPrayersCard: React.FC<NafilahPrayersCardProps> = ({
  todayLogs,
  handleUpdateNafilah,
  setActiveTab,
  toArabicNumbers,
}) => {
  const duhaLog = todayLogs['Duha'];
  const qiyamLog = todayLogs['Qiyam'];
  const witrLog = todayLogs['Witr'];

  const isDuhaDone = duhaLog?.status === 'A' || (duhaLog?.extraRakahs ?? 0) > 0;
  const isQiyamDone = qiyamLog?.status === 'A' || (qiyamLog?.extraRakahs ?? 0) > 0;
  const isWitrDone = witrLog?.status === 'A' || (witrLog?.extraRakahs ?? 0) > 0;

  const nafilahItems = [
    {
      key: 'Duha',
      title: 'صلاة الضحى',
      subtitle: 'ركعتان فأكثر',
      icon: Sun,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      activeBg: 'bg-amber-500 text-white',
      border: 'border-amber-500/20',
      done: isDuhaDone,
      rakahs: duhaLog?.extraRakahs || (isDuhaDone ? 2 : 0),
    },
    {
      key: 'Qiyam',
      title: 'قيام الليل',
      subtitle: 'شرف المؤمن',
      icon: Moon,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      activeBg: 'bg-indigo-600 text-white',
      border: 'border-indigo-500/20',
      done: isQiyamDone,
      rakahs: qiyamLog?.extraRakahs || (isQiyamDone ? 2 : 0),
    },
    {
      key: 'Witr',
      title: 'صلاة الوتر',
      subtitle: 'ختام صلاة الليل',
      icon: Sparkles,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      activeBg: 'bg-emerald-600 text-white',
      border: 'border-emerald-500/20',
      done: isWitrDone,
      rakahs: witrLog?.extraRakahs || (isWitrDone ? 1 : 0),
    },
  ];

  return (
    <div className="bg-white/80 dark:bg-[#121922]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
            النوافل والصلوات المستحبة
          </h3>
        </div>
        {setActiveTab && (
          <button
            type="button"
            onClick={() => setActiveTab('salah')}
            className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>التفاصيل</span>
            <ArrowLeft className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {nafilahItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleUpdateNafilah(item.key, !item.done)}
              className={`p-2.5 rounded-2xl border transition-all duration-200 flex flex-col items-center text-center gap-1 cursor-pointer active:scale-95 ${
                item.done
                  ? `${item.activeBg} border-transparent shadow-sm`
                  : `${item.bg} ${item.border} hover:opacity-90`
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <Icon className={`w-4 h-4 ${item.done ? 'text-white' : item.color}`} />
                {item.done && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-[11px] font-black leading-tight ${item.done ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                {item.title}
              </span>
              <span className={`text-[9px] font-bold ${item.done ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                {item.done && item.rakahs > 0 ? `${toArabicNumbers(item.rakahs)} ركعات` : item.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NafilahPrayersCard;
