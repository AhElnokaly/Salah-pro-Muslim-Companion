/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { KhushuModeType } from '../../services/khushuModePlugin';
import { toArabicNumbers } from '../../utils/hijri';

interface KhushuModeDashboardCardProps {
  isActive: boolean;
  mode: KhushuModeType;
  durationMinutes: number;
  formatRemainingTime: () => string;
  onOpenSheet: () => void;
  onQuickActivate: () => Promise<boolean>;
  onDeactivate: () => Promise<void>;
  isLoading: boolean;
  appStyle?: string;
}

export const KhushuModeDashboardCard: React.FC<KhushuModeDashboardCardProps> = ({
  isActive,
  mode,
  durationMinutes,
  formatRemainingTime,
  onOpenSheet,
  onQuickActivate,
  onDeactivate,
  isLoading,
}) => {
  return (
    <div
      id="khushu-mode-card"
      dir="rtl"
      className="w-full rounded-2xl p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-md transition-all duration-300"
    >
      {isActive ? (
        /* Active Khushu State */
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg">
                🔕
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">وضع الخشوع نشط</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono font-bold">
                  {mode === 'dnd' ? 'عدم إزعاج' : 'صامت'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-400">الوقت المتبقي:</span>
                <span className="text-sm font-black font-mono tracking-wider text-emerald-400">
                  {formatRemainingTime()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onDeactivate}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              {isLoading ? '...' : 'استعادة'}
            </button>
            <button
              type="button"
              onClick={onOpenSheet}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="تعديل الإعدادات"
            >
              ⚙️
            </button>
          </div>
        </div>
      ) : (
        /* Inactive State - Quick Access */
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 text-slate-400 border border-slate-700/60 flex items-center justify-center text-lg shrink-0">
              🌙
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span>وضع الخشوع للصلاة</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                كتم مشتتات الهاتف لضمان السكينة واستعادتها تلقائياً
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onQuickActivate}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>{isLoading ? '...' : 'كتم'}</span>
              <span className="text-[10px] opacity-80">({toArabicNumbers(durationMinutes)}د)</span>
            </button>
            <button
              type="button"
              onClick={onOpenSheet}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-medium transition-all"
            >
              خيارات
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KhushuModeDashboardCard;
