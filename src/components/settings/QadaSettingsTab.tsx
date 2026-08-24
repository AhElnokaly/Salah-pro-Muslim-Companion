import React from 'react';
import { Clock, Moon, AlertCircle } from 'lucide-react';
import { RamadanQadaTracker, PendingQadaPrayer, PrayerName } from '../../types';
import { AppModalVariant } from '../shared/AppModal';
import { toArabicNumbers } from '../../utils/hijri';
import { formatDateKey } from '../../utils/prayerDayBoundary';

interface QadaSettingsTabProps {
  ramadanQada: RamadanQadaTracker;
  setRamadanQada: React.Dispatch<React.SetStateAction<RamadanQadaTracker>>;
  setFastingLogs: React.Dispatch<React.SetStateAction<Record<string, { date: string; fasted: boolean; fastType: string }>>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
  setAppModal: (modal: { message: string; variant: AppModalVariant } | null) => void;
}

export default function QadaSettingsTab({
  ramadanQada,
  setRamadanQada,
  setFastingLogs,
  pendingQadaPrayers,
  setPendingQadaPrayers,
  setAppModal,
}: QadaSettingsTabProps) {
  const handleAddRamadanQadaDays = (num: number) => {
    setRamadanQada(prev => ({
      ...prev,
      daysOwed: Math.max(0, prev.daysOwed + num)
    }));
  };

  const handleCompleteRamadanQadaDay = () => {
    if (ramadanQada.daysOwed > 0) {
      setRamadanQada(prev => ({
        ...prev,
        daysOwed: prev.daysOwed - 1,
        daysCompleted: prev.daysCompleted + 1
      }));

      const todayStr = formatDateKey(new Date());
      setFastingLogs(prev => ({
        ...prev,
        [todayStr]: {
          date: todayStr,
          fasted: true,
          fastType: 'Qada'
        }
      }));
      setAppModal({ message: 'بشرى! تم قضاء يوم واحد وتسجيله في صيام اليوم المبارك. تقبل الله منك 🤍', variant: 'success' });
    }
  };

  const handleToggleFidyaMode = () => {
    setRamadanQada(prev => ({
      ...prev,
      trackMode: prev.trackMode === 'fasting' ? 'fidya' : 'fasting'
    }));
  };

  const handleUpdateFidyaCompleted = (amount: number) => {
    setRamadanQada(prev => ({
      ...prev,
      fidyaCompleted: Math.max(0, (prev.fidyaCompleted || 0) + amount)
    }));
  };

  const handleRemoveQadaItem = (qadaId: string) => {
    setPendingQadaPrayers(prev => prev.filter(q => q.id !== qadaId));
    setAppModal({ message: 'تم تأدية الفريضة الفائتة بنجاح بفضل الله وتقبله 🤍', variant: 'success' });
  };

  const handleAddManualMissedPrayer = (prayerName: PrayerName) => {
    const todayStr = formatDateKey(new Date());
    const newQada: PendingQadaPrayer = {
      id: crypto.randomUUID(),
      date: todayStr,
      hijriDate: 'يدوي',
      prayerName
    };
    setPendingQadaPrayers(prev => [...prev, newQada]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-black text-slate-800 dark:text-white">سجل القضاء وتتبع الفوائت</h2>
      </div>

      {/* Section A: Fasting Qada */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-3">
          <div className="flex items-center gap-1.5">
            <Moon className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black text-slate-800 dark:text-white">قضاء صيام رمضان</h3>
          </div>
          <button
            type="button"
            onClick={handleToggleFidyaMode}
            className="text-[10px] bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-300 py-1 px-2.5 rounded-lg font-bold border border-slate-100 dark:border-slate-800/40 cursor-pointer"
          >
            {ramadanQada.trackMode === 'fasting' ? 'التحويل لإخراج الفدية' : 'التحويل لنية الصيام والعد'}
          </button>
        </div>

        {ramadanQada.trackMode === 'fasting' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/10 p-4 rounded-2xl border border-amber-500/10 text-end">
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200">الأيام المتبقية في ذمتك</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold block">سجل الأيام التي أفطرتها بعذر شرعي لقضائها</span>
              </div>
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {toArabicNumbers(ramadanQada.daysOwed)} <span className="text-xs font-bold">أيام</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-[#111720] rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-800/40">
                <span className="font-bold text-slate-600 dark:text-slate-400">عدد الأيام المقضية:</span>
                <span className="font-extrabold text-slate-800 dark:text-white">{toArabicNumbers(ramadanQada.daysCompleted)}</span>
              </div>
              <button
                type="button"
                onClick={handleCompleteRamadanQadaDay}
                disabled={ramadanQada.daysOwed === 0}
                className="p-3 bg-indigo-600 disabled:opacity-40 hover:bg-indigo-700 text-white font-bold rounded-xl text-center cursor-pointer transition-colors"
              >
                صمت وقضيت يوماً!
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-500 dark:text-slate-450">تعديل الأيام المطلوبة يدوياً:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddRamadanQadaDays(-1)}
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  -١
                </button>
                <button
                  type="button"
                  onClick={() => handleAddRamadanQadaDays(1)}
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  +١
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/10 p-4 rounded-2xl border border-emerald-500/10 text-end">
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-750 dark:text-slate-200">فدية إطعام مسكين</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">للعاجز عن الصوم بمرض مستمر أو كبر سن.</span>
              </div>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {toArabicNumbers(ramadanQada.fidyaCompleted || 0)} <span className="text-xs font-bold">مسكين</span>
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-50 dark:bg-[#111720] p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 text-xs">
              <span className="font-bold text-slate-500">تعديل إطعام مسكين:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateFidyaCompleted(-1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  -١
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateFidyaCompleted(1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  +١
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section B: Missed Prayer Qada */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/40 pb-3">
          <Clock className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white">قضاء الصلوات والفرائض الفائتة</h3>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
          عند إيقاظك متأخراً أو فوات صلاة بعذر، يتم إضافتها في ذمتك هنا. صلها قضاءً فور استحضارها ثم احذفها بالضغط عليها.
        </p>

        {/* List of pending qada */}
        {pendingQadaPrayers.length === 0 ? (
          <div className="p-6 bg-slate-50/50 dark:bg-[#111720]/40 rounded-2xl text-center space-y-1.5 border border-dashed border-slate-200 dark:border-slate-800/70">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">الحمد لله! لا توجد عليك أي صلاة فائتة في السجل 🌿</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 block">سجل الفوائت المبارك خالٍ من التقصير والحمد لله الحفيظ.</span>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 block uppercase">الصلوات المطلوبة في ذمتك حالياً:</span>
            <div className="grid grid-cols-1 gap-2">
              {pendingQadaPrayers.map((qada) => {
                const nameAr =
                  qada.prayerName === 'Fajr' ? 'الفجر' :
                  qada.prayerName === 'Dhuhr' ? 'الظهر' :
                  qada.prayerName === 'Asr' ? 'العصر' :
                  qada.prayerName === 'Maghrib' ? 'المغرب' : 'العشاء';
                return (
                  <div
                    key={qada.id}
                    onClick={() => handleRemoveQadaItem(qada.id)}
                    className="p-3 bg-rose-50/30 dark:bg-rose-950/10 hover:bg-rose-100/40 dark:hover:bg-rose-950/20 border border-rose-500/10 rounded-2xl flex items-center justify-between cursor-pointer transition-all"
                    title="اضغط لإزالتها وتأكيد القضاء"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">قضاء صلاة {nameAr}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                      <span>بتاريخ: {toArabicNumbers(qada.date)}</span>
                      <span className="bg-rose-100/60 dark:bg-rose-950/40 text-rose-600 px-2 py-0.5 rounded-md">قضاء الآن</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick manual missed adder */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 space-y-2.5">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 block">إضافة صلاة فائتة في ذمتك يدوياً:</span>
          <div className="grid grid-cols-5 gap-1.5">
            {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as PrayerName[]).map((p) => {
              const ar = p === 'Fajr' ? 'فجر' : p === 'Dhuhr' ? 'ظهر' : p === 'Asr' ? 'عصر' : p === 'Maghrib' ? 'مغرب' : 'عشاء';
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleAddManualMissedPrayer(p)}
                  className="py-2.5 px-1 bg-slate-50 hover:bg-rose-50/30 dark:bg-[#111720] dark:hover:bg-rose-950/10 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-100 dark:border-slate-800/40 rounded-xl text-[11px] font-black cursor-pointer transition-colors"
                >
                  {ar}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
