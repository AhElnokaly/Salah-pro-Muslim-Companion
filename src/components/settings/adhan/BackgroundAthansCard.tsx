/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppModalVariant } from '../../shared/AppModal';

export interface BackgroundAthansCardProps {
  setAppModal: React.Dispatch<React.SetStateAction<{ message: string; variant: AppModalVariant } | null>>;
}

export const BackgroundAthansCard: React.FC<BackgroundAthansCardProps> = ({ setAppModal }) => {
  return (
    <div className="p-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-emerald-500/10 dark:from-indigo-950/30 dark:to-slate-900 rounded-2xl border border-indigo-500/20 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
              🔔 تنبيهات الأذان والمواقيت في الخلفية
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              ⚡ 30 يوم جاهزة
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            يتم تحضير مواقيت الـ 30 يومًا القادمة آليًا في خلفية جهازك لضمان تنبيهك بدقة حتى لو كان المتصفح مغلقًا.
          </p>
        </div>
      </div>

      {/* Privacy Badge Banner */}
      <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
        <span className="text-sm shrink-0">🔒</span>
        <span>
          <strong>خصوصية تامة:</strong> مواقيت صلواتك تُحسب بالكامل محليًا على جهازك، وتُحفظ كرموز زمنية مجردة (UTC) دون مشاركة إحداثيات موقعك الجغرافي.
        </span>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          حالة إذن الإشعارات:{' '}
          {typeof window !== 'undefined' && 'Notification' in window
            ? Notification.permission === 'granted'
              ? '✅ مُفعلة ومُصرح بها'
              : Notification.permission === 'denied'
              ? '❌ محظورة من إعدادات المتصفح'
              : '⚠️ بانتظار الإذن'
            : 'غير مدعوم'}
        </span>
        <button
          type="button"
          onClick={async () => {
            if (typeof window !== 'undefined' && 'Notification' in window) {
              const res = await Notification.requestPermission();
              if (res === 'granted') {
                setAppModal({
                  message: 'تم تفعيل إذن الإشعارات بنجاح! سيصلك تنبيه دخول وقت الصلاة في موعده.',
                  variant: 'success',
                });
              } else if (res === 'denied') {
                setAppModal({
                  message: 'تم رفض الإذن. يرجى السماح بالإشعارات من إعدادات المتصفح/الموقع.',
                  variant: 'error',
                });
              }
            } else {
              setAppModal({ message: 'المتصفح لا يدعم إشعارات النظام.', variant: 'info' });
            }
          }}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
        >
          تفعيل الإشعارات
        </button>
      </div>
    </div>
  );
};

export default BackgroundAthansCard;
