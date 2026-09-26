/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Moon, 
  Bell, 
  Smartphone, 
  ShieldCheck, 
  Settings, 
  VolumeX, 
  RotateCcw, 
  X, 
  Briefcase 
} from 'lucide-react';
import { KhushuModeType } from '../../services/khushuModePlugin';
import { toArabicNumbers } from '../../utils/hijri';
import { IqamaWindowInfo } from '../../domain/khushu/khushuFlowUtils';

interface SmartActionStripProps {
  // Khushu Props
  isKhushuActive: boolean;
  khushuMode: KhushuModeType;
  khushuDuration: number;
  formatKhushuRemainingTime: () => string;
  onOpenKhushuSheet: () => void;
  onQuickActivateKhushu: (duration?: number) => Promise<boolean>;
  onDeactivateKhushu: () => Promise<void>;
  isKhushuLoading: boolean;
  iqamaInfo?: IqamaWindowInfo | null;

  // Widget preview
  onOpenWidgetSimulator: () => void;

  // Missing prayers
  missingPrayersCount: number;
  missingPrayerTitle?: string;
  onLogMissingPrayers: () => void;

  // Travel Mode
  showTravelPill: boolean;
  onDismissTravel: () => void;

  // Backup
  showBackupPill: boolean;
  onExportBackup: () => void;
  onDismissBackup: () => void;

  // Styling
  isFaithBright?: boolean;
}

export const SmartActionStrip: React.FC<SmartActionStripProps> = ({
  isKhushuActive,
  khushuMode: _khushuMode,
  khushuDuration,
  formatKhushuRemainingTime,
  onOpenKhushuSheet,
  onQuickActivateKhushu,
  onDeactivateKhushu,
  isKhushuLoading,
  iqamaInfo,
  onOpenWidgetSimulator,
  missingPrayersCount,
  missingPrayerTitle = 'صلوات لم تُسجل',
  onLogMissingPrayers,
  showTravelPill,
  onDismissTravel,
  showBackupPill,
  onExportBackup,
  onDismissBackup,
  isFaithBright = false,
}) => {
  const [showTravelModal, setShowTravelModal] = useState<boolean>(false);
  const isInIqamaWindow = !isKhushuActive && !!iqamaInfo?.isInAdhanIqamaWindow;

  return (
    <>
      <div
        id="smart-dashboard-action-strip"
        className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-0.5"
        dir="rtl"
      >
        {/* 1. KHUSHU PILL */}
        {isKhushuActive ? (
          <div className="h-8.5 px-3 rounded-full bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold shrink-0 shadow-xs flex items-center gap-2 backdrop-blur-md transition-all">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1">
              <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
              <span>الخشوع نشط</span>
            </div>
            <span className="font-mono text-[11px] font-black text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-md">
              {formatKhushuRemainingTime()}
            </span>
            <button
              type="button"
              onClick={onDeactivateKhushu}
              disabled={isKhushuLoading}
              className="ms-0.5 px-2 py-0.5 rounded-full bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 text-[10px] font-black cursor-pointer transition-colors flex items-center gap-0.5"
              title="إنهاء وضع الخشوع واستعادة الصوت"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>استعادة</span>
            </button>
          </div>
        ) : isInIqamaWindow && iqamaInfo ? (
          <div className="h-8.5 px-2.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-bold shrink-0 shadow-xs flex items-center gap-1.5 backdrop-blur-md transition-all">
            <button
              type="button"
              onClick={() => onQuickActivateKhushu(iqamaInfo.suggestedDuration)}
              disabled={isKhushuLoading}
              className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>أذان {iqamaInfo.prayerName}</span>
              <span className="text-[10px] font-black bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-full">
                كتم ({toArabicNumbers(iqamaInfo.suggestedDuration)}د)
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenKhushuSheet}
              className="w-5 h-5 rounded-full flex items-center justify-center text-amber-400 hover:text-white hover:bg-amber-500/30 transition-colors cursor-pointer"
              title="خيارات الخشوع"
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div
            className={`h-8.5 px-2.5 rounded-full border text-xs font-bold shrink-0 shadow-xs transition-all flex items-center gap-1.5 backdrop-blur-md ${
              isFaithBright
                ? 'bg-white/90 border-slate-200/90 text-slate-700 hover:bg-white'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800/90'
            }`}
          >
            <button
              type="button"
              onClick={() => onQuickActivateKhushu()}
              disabled={isKhushuLoading}
              className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-400 transition-colors"
              title="كتم مشتتات الهاتف أثناء الصلاة"
            >
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              <span>كتم الخشوع</span>
              <span className="text-[10.5px] text-slate-400 font-mono bg-slate-700/30 dark:bg-slate-700/50 px-1.5 py-0.2 rounded-md">
                {toArabicNumbers(khushuDuration)}د
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenKhushuSheet}
              className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="إعدادات وضع الخشوع"
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* 2. MISSING PRAYERS PILL */}
        {missingPrayersCount > 0 && (
          <button
            type="button"
            onClick={onLogMissingPrayers}
            className="h-8.5 px-3 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/35 text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 backdrop-blur-md"
            title={missingPrayerTitle}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>سجّل صلوات الأمس</span>
            <span className="bg-amber-500 text-slate-950 font-black text-[9.5px] px-1.5 py-0.2 rounded-full leading-none">
              {toArabicNumbers(missingPrayersCount)}
            </span>
          </button>
        )}

        {/* 3. WIDGET PREVIEW PILL */}
        <button
          type="button"
          onClick={onOpenWidgetSimulator}
          className={`h-8.5 px-3 rounded-full border text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 backdrop-blur-md ${
            isFaithBright
              ? 'bg-amber-50/90 border-amber-200 text-amber-800 hover:bg-amber-100'
              : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
          title="معاينة شكل الويدجيت على شاشة الهاتف"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>ويدجيت الهاتف</span>
        </button>

        {/* 4. TRAVEL MODE PILL */}
        {showTravelPill && (
          <button
            type="button"
            onClick={() => setShowTravelModal(true)}
            className="h-8.5 px-3 rounded-full bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 border border-sky-500/30 text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 backdrop-blur-md"
          >
            <Briefcase className="w-3.5 h-3.5 text-sky-400" />
            <span>رخصة السفر</span>
          </button>
        )}

        {/* 5. BACKUP REMINDER PILL */}
        {showBackupPill && (
          <div className="h-8.5 px-2.5 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 text-xs font-bold shrink-0 shadow-xs flex items-center gap-1.5 backdrop-blur-md transition-all">
            <button
              type="button"
              onClick={onExportBackup}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
              title="حفظ نسخة احتياطية من سجل عباداتك"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>نسخة احتياطية</span>
            </button>
            <button
              type="button"
              onClick={onDismissBackup}
              className="w-4 h-4 rounded-full flex items-center justify-center text-indigo-400 hover:text-white hover:bg-indigo-500/30 transition-colors cursor-pointer"
              title="إغلاق التنبيه"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>

      {/* TRAVEL FIQH MODAL */}
      {showTravelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-amber-500/40 rounded-3xl p-5 max-w-sm w-full text-right space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-amber-300">رخصة السفر والقصر والجمع</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTravelModal(false)}
                className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              في سفرك وتنقلاتك، يجوز لك قصر الصلاة الرباعية (الظهر والعصر والعشاء إلى ركعتين) وجمع الظهر مع العصر، والمغرب مع العشاء تقديماً أو تأخيراً رخصةً من الله وتيسيراً.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onDismissTravel();
                  setShowTravelModal(false);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                لا تذكرني اليوم
              </button>
              <button
                type="button"
                onClick={() => setShowTravelModal(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                فهمت (إغلاق)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
