/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BellOff, CheckCircle2, ChevronLeft, ExternalLink, Shield, Sparkles, VolumeX, X } from 'lucide-react';

interface KhushuPermissionOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPermission: () => void;
  onSelectSilentFallback: () => void;
}

export const KhushuPermissionOnboardingModal: React.FC<KhushuPermissionOnboardingModalProps> = ({
  isOpen,
  onClose,
  onRequestPermission,
  onSelectSilentFallback,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="khushu-permission-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      dir="rtl"
    >
      <div
        id="khushu-permission-modal-card"
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 text-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <BellOff className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                إذن وضع عدم الإزعاج (DND)
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                لضمان صلاة هادئة وخاشعة بلا أي تشويش
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits Card */}
        <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4 mb-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <Shield className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>لماذا يحتاج التطبيق هذا الإذن؟</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 pe-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>كتم رنين المكالمات والإشعارات المزعجة أثناء أداء الفريضة في المسجد.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>استعادة الوضع الطبيعي والصوت تلقائياً فور انقضاء الصلاة دون أن تنسى.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>حماية خصوصيتك التامة، لا يتم الاطلاع على محتوى أي إشعارات نهائياً.</span>
            </li>
          </ul>
        </div>

        {/* Steps Guide */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5 space-y-3 text-xs">
          <span className="font-bold text-amber-300 block">خطوات التفعيل البسيطة:</span>
          <div className="space-y-2 text-slate-300">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0">١</span>
              <span>اضغط على زر «فتح إعدادات النظام» أدناه.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0">٢</span>
              <span>ابحث عن تطبيق <strong className="text-white">«همّتي»</strong> من قائمة التطبيقات.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0">٣</span>
              <span>قم بتفعيل مفتاح السماح، ثم ارجع للتطبيق.</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            id="btn-khushu-open-system-settings"
            onClick={() => {
              onRequestPermission();
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>فتح إعدادات النظام وتفعيل الإذن</span>
          </button>

          <button
            id="btn-khushu-use-silent-fallback"
            onClick={() => {
              onSelectSilentFallback();
              onClose();
            }}
            className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <VolumeX className="w-4 h-4 shrink-0 text-slate-400" />
            <span>استخدام الوضع الصامت المعتاد بدلاً من ذلك</span>
          </button>
        </div>
      </div>
    </div>
  );
};
