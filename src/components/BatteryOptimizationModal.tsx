/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BatteryCharging, Settings, Info, CheckCircle2, Smartphone } from 'lucide-react';

interface BatteryOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatteryOptimizationModal: React.FC<BatteryOptimizationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedHint, setCopiedHint] = useState(false);

  if (!isOpen) return null;

  const handleOpenSettings = () => {
    // If native Capacitor app, attempt opening settings if available
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        // Native intent trigger or fallback
        if ((window as any).Capacitor?.Plugins?.App?.openUrl) {
          (window as any).Capacitor.Plugins.App.openUrl({ url: 'package:' + window.location.hostname });
        }
      }
    } catch {
      // Fallback gracefully
    }

    setCopiedHint(true);
    setTimeout(() => setCopiedHint(false), 3000);
  };

  return (
    <AnimatePresence>
      <div
        id="battery-optimization-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="battery-optimization-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-[#131b22] border border-cyan-900/40 text-white rounded-3xl p-5 sm:p-6 shadow-2xl my-auto select-none"
          dir="rtl"
        >
          {/* Close Button */}
          <button
            id="close-battery-modal-btn"
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer z-10 active:scale-95"
            aria-label="إغلاق نافذة إرشادات البطارية"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 pt-1 pb-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center shrink-0 shadow-inner">
              <BatteryCharging className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 id="battery-optimization-title" className="text-lg sm:text-xl font-black text-white">
                إشعارات الأذان والبطارية
              </h2>
              <span className="text-[11px] text-cyan-400/80 font-medium">
                دليل استقرار الأذان في الخلفية
              </span>
            </div>
          </div>

          {/* Main Description */}
          <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed pt-1 pb-3 font-medium">
            قد يوقف نظام أندرويد تطبيق <strong>همّتي</strong> في الخلفية لتوفير الطاقة، مما قد يؤخر وصول إشعارات الأذان أو يمنع سماعه عند إغلاق الشاشة. حتى تضمن سماع الأذان دائماً، اسمح باستخدام البطارية بدون قيود.
          </p>

          <div className="space-y-3 my-2 max-h-[50vh] overflow-y-auto pl-1 scrollbar-thin">
            {/* Card 1: Step by Step Guide */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1a252f] border border-cyan-900/30 space-y-2.5">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs sm:text-sm">
                <Settings className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>كيف تصلح ذلك؟</span>
              </div>

              <div className="space-y-2 text-xs text-slate-200">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-900/80 text-cyan-200 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>افتح <strong>إعدادات الهاتف</strong> ثم <strong>التطبيقات</strong> ثم اختر تطبيق <strong>همّتي</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-900/80 text-cyan-200 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>ادخل إلى قسم <strong>البطارية (Battery)</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-900/80 text-cyan-200 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>اختر وضع <strong>"غير مقيّد" (Unrestricted)</strong> بدلاً من "مُحسَّن".</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                هذا يسمح للتطبيق بالعمل بشكل موثوق في الخلفية، مع تأثير طفيف جداً على عمر البطارية.
              </p>
            </div>

            {/* Card 2: Samsung Deep Sleep Warning */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#142630] border border-cyan-800/40 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>هواتف سامسونج (تطبيقات في نوم عميق):</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                الإعدادات &gt; البطارية &gt; حدود الاستخدام في الخلفية &gt; تأكد من <strong>إزالة همّتي</strong> من قائمتي «التطبيقات النائمة» و«التطبيقات في نوم عميق».
              </p>
            </div>

            {/* Card 3: Xiaomi / Huawei / Oppo */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1f202b] border border-indigo-900/40 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>هواتف شاومي، ريدمي، وهواوي:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                تأكد من تفعيل <strong>«التشغيل التلقائي» (Autostart)</strong>، وقفل التطبيق في قائمة التطبيقات المفتوحة (Recent Apps) لمنع النظام من إغلاقه.
              </p>
            </div>
          </div>

          {/* Feedback message if clicked */}
          {copiedHint && (
            <div className="mt-2 py-1.5 px-3 rounded-xl bg-cyan-950/80 border border-cyan-600/50 text-cyan-200 text-xs text-center flex items-center justify-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>اتبع الخطوات أعلاه من إعدادات جهازك لتثبيت عمل الأذان ⚡</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              id="open-battery-settings-action-btn"
              type="button"
              onClick={handleOpenSettings}
              className="flex-1 py-3 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-black text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-cyan-950/50 text-center"
            >
              افتح الإعدادات
            </button>
            <button
              id="dismiss-battery-modal-btn"
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white font-bold text-xs sm:text-sm transition-all cursor-pointer border border-slate-700/60"
            >
              لاحقاً
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BatteryOptimizationModal;
