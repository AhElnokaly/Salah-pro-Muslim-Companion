import React from 'react';
import { PrayerName } from '../../../types';
import { toArabicNumbers } from '../../../utils/hijri';

interface PrayerContextualGatewaysProps {
  selectedPrayerToLog: PrayerName;
  prayerDisplayName: string;
  isLoggedDone: boolean;
  qadaCount: number;
  onNavigateToAdhkar: () => void;
  onResolveQuickQada: () => void;
}

export const PrayerContextualGateways: React.FC<PrayerContextualGatewaysProps> = ({
  selectedPrayerToLog,
  prayerDisplayName,
  isLoggedDone,
  qadaCount,
  onNavigateToAdhkar,
  onResolveQuickQada,
}) => {
  if (!isLoggedDone && qadaCount === 0) return null;

  const getAdhkarTitle = () => {
    if (selectedPrayerToLog === 'Fajr') return 'أذكار الصباح وأذكار الصلاة';
    if (selectedPrayerToLog === 'Asr' || selectedPrayerToLog === 'Maghrib') return 'أذكار المساء وأذكار الصلاة';
    return 'أذكار ما بعد الصلاة';
  };

  return (
    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
      {/* 1. Contextual Adhkar Gateway Prompt */}
      {isLoggedDone && (
        <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden="true">📿</span>
            <div className="text-right">
              <span className="font-extrabold text-emerald-900 dark:text-emerald-300 block text-right">
                {getAdhkarTitle()}
              </span>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-bold text-right block">
                هل أتممت أذكارك المباركة؟
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToAdhkar}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-[11px] cursor-pointer transition-all shrink-0 active:scale-95 shadow-2xs"
            aria-label={`الانتقال إلى ${getAdhkarTitle()}`}
          >
            اذهب للأذكار ✨
          </button>
        </div>
      )}

      {/* 2. Fast Qada Offset Gateway */}
      {qadaCount > 0 && (
        <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-500/20 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden="true">⚡</span>
            <div className="text-right">
              <span className="font-extrabold text-amber-900 dark:text-amber-300 block text-right">
                لديك {toArabicNumbers(qadaCount)} صلاة {prayerDisplayName} فائتة
              </span>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-bold text-right block">
                هل قضيت صلاة سابقة مع هذه الفريضة؟
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onResolveQuickQada}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-[11px] cursor-pointer transition-all shrink-0 active:scale-95 shadow-2xs"
            aria-label={`تسجيل قضاء صلاة واحدة من صلوات ${prayerDisplayName} الفائتة`}
          >
            سجل قضاء (-١)
          </button>
        </div>
      )}
    </div>
  );
};
