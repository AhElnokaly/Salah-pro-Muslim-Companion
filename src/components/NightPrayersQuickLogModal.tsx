/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { PrayerLog, VoluntaryPrayerLog } from '../types';
import { toArabicNumbers, getHijriDate } from '../utils/hijri';
import { formatDateKey } from '../utils/prayerDayBoundary';
import { calculatePrayerTimes, parseTimeToMinutes, getTimezoneOffsetForLocation } from '../utils/prayerCalc';

export interface NightPrayersQuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr?: string;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  voluntaryPrayerLogs?: VoluntaryPrayerLog[];
  setVoluntaryPrayerLogs?: React.Dispatch<React.SetStateAction<VoluntaryPrayerLog[]>>;
  onSuccess?: (msg: string) => void;
}

export const NightPrayersQuickLogModal: React.FC<NightPrayersQuickLogModalProps> = ({
  isOpen,
  onClose,
  dateStr = formatDateKey(new Date()),
  prayerLogs,
  setPrayerLogs,
  voluntaryPrayerLogs = [],
  setVoluntaryPrayerLogs,
  onSuccess
}) => {
  const [qiyamEnabled, setQiyamEnabled] = useState<boolean>(false);
  const [qiyamRakaat, setQiyamRakaat] = useState<number>(2);
  const [shafiEnabled, setShafiEnabled] = useState<boolean>(false);
  const [witrEnabled, setWitrEnabled] = useState<boolean>(false);
  const [witrRakaat, setWitrRakaat] = useState<number>(1);
  const [taraweehEnabled, setTaraweehEnabled] = useState<boolean>(false);
  const [taraweehRakaat, setTaraweehRakaat] = useState<number>(8);
  const [allowTravelOverride, setAllowTravelOverride] = useState<boolean>(false);

  const hijri = getHijriDate();

  useEffect(() => {
    if (isOpen) {
      const qiyamLog = voluntaryPrayerLogs.find(l => l.appPrayerDay === dateStr && l.type === 'qiyam') || (prayerLogs[dateStr]?.['Qiyam']?.status === 'A' ? { rakaat: prayerLogs[dateStr]?.['Qiyam']?.extraRakahs } : undefined);
      const shafiLog = voluntaryPrayerLogs.find(l => l.appPrayerDay === dateStr && l.type === 'shafi');
      const witrLog = voluntaryPrayerLogs.find(l => l.appPrayerDay === dateStr && l.type === 'witr') || (prayerLogs[dateStr]?.['Witr']?.status === 'A' ? { rakaat: prayerLogs[dateStr]?.['Witr']?.extraRakahs } : undefined);
      const taraweehLog = voluntaryPrayerLogs.find(l => l.appPrayerDay === dateStr && l.type === 'taraweeh');

      setQiyamEnabled(Boolean(qiyamLog));
      setQiyamRakaat(qiyamLog?.rakaat || 2);

      setShafiEnabled(Boolean(shafiLog));

      setWitrEnabled(Boolean(witrLog));
      setWitrRakaat(witrLog?.rakaat || 1);

      setTaraweehEnabled(Boolean(taraweehLog));
      setTaraweehRakaat(taraweehLog?.rakaat || 8);
    } else {
      setAllowTravelOverride(false);
    }
  }, [isOpen, dateStr, prayerLogs, voluntaryPrayerLogs]);

  if (!isOpen) return null;

  // Check if current time is before Isha on today's date
  const isToday = dateStr === formatDateKey(new Date());
  let isBeforeIsha = false;

  if (isToday) {
    const savedSettings = localStorage.getItem('salah_settings');
    let lat = 30.0444, lng = 31.2357, calcMethod = 'Egypt', madhab: 'standard' | 'hanafi' = 'standard', offsets = {}, timezoneId: string | undefined;
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.latitude) lat = parsed.latitude;
        if (parsed.longitude) lng = parsed.longitude;
        if (parsed.calcMethod) calcMethod = parsed.calcMethod;
        if (parsed.madhab) madhab = parsed.madhab;
        if (parsed.prayerOffsets) offsets = parsed.prayerOffsets;
        if (parsed.timezoneId) timezoneId = parsed.timezoneId;
      } catch (e) {}
    }
    const now = new Date();
    const tzOffset = getTimezoneOffsetForLocation(now, timezoneId);
    const times = calculatePrayerTimes(now, lat, lng, tzOffset, calcMethod, madhab, offsets);
    const fajrMins = parseTimeToMinutes(times.Fajr);
    const ishaMins = parseTimeToMinutes(times.Isha);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (nowMins >= fajrMins && nowMins < ishaMins) {
      isBeforeIsha = true;
    }
  }

  if (isBeforeIsha && !allowTravelOverride) {
    return (
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
        <div className="bg-white dark:bg-[#161d26] w-full max-w-sm rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-2xl">
            ✈️
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-800 dark:text-white">
              لم يحن وقت صلاة العشاء بعد
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              مواقيت الصلاة محددة شرعاً بمواعيد فلكية دقيقة لموقعك الحالي. لا يصح شرعاً أداء الصلاة أو تسجيلها قبل دخول وقتها إلا في حالات السفر (الجمع والقصر).
            </p>
          </div>
          
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold rounded-xl text-xs transition-all cursor-pointer"
            >
              حسناً، سأسجلها في وقتها
            </button>
            <button
              type="button"
              onClick={() => setAllowTravelOverride(true)}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-[11px] transition-all cursor-pointer border border-indigo-100/30 dark:border-indigo-950/50"
            >
              أنا في سفر (رخصة الجمع والقصر)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    const newLogs: VoluntaryPrayerLog[] = [];
    const dayLogs = prayerLogs[dateStr] || {};

    let qiyamR = 0;
    if (qiyamEnabled) {
      qiyamR = qiyamRakaat;
      newLogs.push({
        id: crypto.randomUUID(),
        appPrayerDay: dateStr,
        type: 'qiyam',
        rakaat: qiyamRakaat,
        loggedAt: Date.now()
      });
    }

    if (shafiEnabled) {
      newLogs.push({
        id: crypto.randomUUID(),
        appPrayerDay: dateStr,
        type: 'shafi',
        rakaat: 2,
        loggedAt: Date.now()
      });
    }

    let witrR = 0;
    if (witrEnabled) {
      witrR = witrRakaat;
      newLogs.push({
        id: crypto.randomUUID(),
        appPrayerDay: dateStr,
        type: 'witr',
        rakaat: witrRakaat,
        loggedAt: Date.now()
      });
    }

    if (taraweehEnabled && hijri.month === 9) {
      newLogs.push({
        id: crypto.randomUUID(),
        appPrayerDay: dateStr,
        type: 'taraweeh',
        rakaat: taraweehRakaat,
        loggedAt: Date.now()
      });
    }

    if (setVoluntaryPrayerLogs) {
      setVoluntaryPrayerLogs(prev => [
        ...prev.filter(l => !(l.appPrayerDay === dateStr && ['qiyam', 'shafi', 'witr', 'taraweeh'].includes(l.type))),
        ...newLogs
      ]);
    }

    setPrayerLogs(prev => {
      const existingQiyam = dayLogs['Qiyam'] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0, extraRakahs: 0 };
      const existingWitr = dayLogs['Witr'] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0, extraRakahs: 0 };
      return {
        ...prev,
        [dateStr]: {
          ...dayLogs,
          'Qiyam': {
            ...existingQiyam,
            status: qiyamR > 0 ? 'A' : 'not_yet',
            extraRakahs: qiyamR
          },
          'Witr': {
            ...existingWitr,
            status: witrR > 0 ? 'A' : 'not_yet',
            extraRakahs: witrR
          }
        }
      };
    });

    const msg = 'تم حفظ صلوات الليل بنجاح ✓';
    if (onSuccess) onSuccess(msg);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-[#161d26] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-base">
              🌃
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">صلوات الليل والتهجد</h3>
              <span className="text-[10px] text-slate-400 font-bold block">تُنسب لليوم الصلاتي الحالي (حتى الفجر)</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* 1. Qiyam al-Layl */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={qiyamEnabled}
                  onChange={(e) => setQiyamEnabled(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <span className="text-xs font-black text-slate-800 dark:text-white">قيام الليل والتهجد</span>
              </label>
              {qiyamEnabled && (
                <span className="text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-400">
                  {toArabicNumbers(qiyamRakaat)} ركعة
                </span>
              )}
            </div>

            {qiyamEnabled && (
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[2, 4, 8, 12].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setQiyamRakaat(r)}
                    className={`py-1.5 text-[10px] font-black rounded-xl border transition-all cursor-pointer ${
                      qiyamRakaat === r
                        ? 'bg-indigo-600 text-white border-indigo-600 font-black'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {toArabicNumbers(r)} ركعات
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Shafi */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shafiEnabled}
                onChange={(e) => setShafiEnabled(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-black text-slate-800 dark:text-white">صلاة الشفع (ركعتان)</span>
            </label>
            <span className="text-[10px] font-bold text-slate-400">سنة مؤكدة</span>
          </div>

          {/* 3. Witr */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={witrEnabled}
                  onChange={(e) => setWitrEnabled(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500 border-slate-300 cursor-pointer"
                />
                <span className="text-xs font-black text-slate-800 dark:text-white">صلاة الوتر</span>
              </label>
              {witrEnabled && (
                <span className="text-[10px] font-mono font-black text-purple-600 dark:text-purple-400">
                  {toArabicNumbers(witrRakaat)} ركعة
                </span>
              )}
            </div>

            {witrEnabled && (
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[1, 3, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setWitrRakaat(r)}
                    className={`py-1.5 text-[10px] font-black rounded-xl border transition-all cursor-pointer ${
                      witrRakaat === r
                        ? 'bg-purple-600 text-white border-purple-600 font-black'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {toArabicNumbers(r)} {r === 1 ? 'ركعة' : 'ركعات'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Taraweeh (Ramadan Only) */}
          {hijri.month === 9 && (
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taraweehEnabled}
                    onChange={(e) => setTaraweehEnabled(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-300">صلاة التراويح (شهر رمضان المبارك 🌙)</span>
                </label>
                {taraweehEnabled && (
                  <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {toArabicNumbers(taraweehRakaat)} ركعة
                  </span>
                )}
              </div>

              {taraweehEnabled && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[8, 20].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTaraweehRakaat(r)}
                      className={`py-1.5 text-[10px] font-black rounded-xl border transition-all cursor-pointer ${
                        taraweehRakaat === r
                          ? 'bg-emerald-600 text-white border-emerald-600 font-black'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {toArabicNumbers(r)} ركعة
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>حفظ صلوات الليل ✓</span>
          </button>
        </div>
      </div>
    </div>
  );
};
