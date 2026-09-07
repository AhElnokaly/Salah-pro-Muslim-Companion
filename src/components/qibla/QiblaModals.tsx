/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCw, Smartphone } from 'lucide-react';

export interface QiblaModalsProps {
  showCalibrateModal: boolean;
  setShowCalibrateModal: (show: boolean) => void;
  showBraveHelp: boolean;
  setShowBraveHelp: (show: boolean) => void;
}

export const QiblaModals: React.FC<QiblaModalsProps> = ({
  showCalibrateModal,
  setShowCalibrateModal,
  showBraveHelp,
  setShowBraveHelp,
}) => {
  return (
    <>
      {/* 1. Calibration Guidance Modal Overlay */}
      <AnimatePresence>
        {showCalibrateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-pointer" 
              onClick={() => setShowCalibrateModal(false)}
            />

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b1722] border border-white/10 w-full max-w-xs rounded-3xl p-5 relative z-10 shadow-2xl text-end flex flex-col gap-4 text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <h3 className="text-sm font-black text-amber-400">طريقة معايرة البوصلة</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCalibrateModal(false)}
                  aria-label="إغلاق نافذة المعايرة"
                  className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs font-semibold leading-relaxed text-white/95">
                <p>لضمان الحصول على أدق اتجاه للقبلة الشريفة، يرجى اتباع الآتي:</p>
                <ol className="list-decimal list-inside space-y-2 pe-1 text-[11px] text-white/80">
                  <li>ضع الهاتف بشكل <span className="text-amber-300 font-bold">مستوٍ وموازٍ للأرض</span> تماماً في كف يدك.</li>
                  <li>قم بتحريك هاتفك في الهواء برسم مسار دائري متقاطع على شكل رقم ثمانية بالإنجليزية (<span className="text-amber-300 font-black">∞</span>) عدة مرات.</li>
                  <li>تجنب التواجد بالقرب من الأجهزة الإلكترونية أو الأجسام المعدنية والمغناطيسية لأنها تسبب تشتيت المستشعر.</li>
                </ol>
              </div>

              {/* Animated Infinity SVG calibration pattern */}
              <div className="flex justify-center py-2">
                <svg className="w-24 h-12 text-amber-400/35" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M 25 25 C 10 5, 5 45, 25 25 C 45 5, 50 45, 25 25 Z" className="animate-dash" strokeDasharray="100" strokeDashoffset="100" style={{ animation: 'dash 3s linear infinite' }} />
                  <circle cx="25" cy="25" r="3" className="fill-amber-300 animate-pulse" />
                </svg>
              </div>

              <button
                type="button"
                onClick={() => setShowCalibrateModal(false)}
                className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all active:scale-95 text-center shadow-md shadow-amber-500/10"
              >
                حسناً، فهمت
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Brave / Chrome Sensor Activation Help Modal */}
      <AnimatePresence>
        {showBraveHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-pointer" 
              onClick={() => setShowBraveHelp(false)}
            />

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b1722] border border-white/10 w-full max-w-xs rounded-3xl p-5 relative z-10 shadow-2xl text-end flex flex-col gap-4 text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-black text-cyan-400">تفعيل بوصلة الهاتف (Brave / Chrome)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBraveHelp(false)}
                  aria-label="إغلاق نافذة المساعدة"
                  className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs font-semibold leading-relaxed text-white/95">
                <p>متصفحات مثل <span className="text-amber-400 font-bold">Brave</span> و <span className="text-amber-400 font-bold">Chrome</span> تقوم بحظر حساسات الهاتف افتراضياً لحمايتك. لتشغيل البوصلة تلقائياً، يرجى اتباع هذه الخطوة البسيطة:</p>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-2 text-end">
                  <p className="font-bold text-amber-300">من شريط العنوان بالمتصفح (في الأعلى أو الأسفل):</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-white/80">
                    <li>اضغط على <span className="text-white font-bold">أيقونة القفل 🔒</span> أو <span className="text-white font-bold">أيقونة الإعدادات ⚙️</span> الموجودة بجانب رابط الموقع.</li>
                    <li>ابحث عن إذن <span className="text-white font-bold">"المسشعر" (Sensors)</span> أو <span className="text-white font-bold">"الحركة والاتجاه" (Motion)</span>.</li>
                    <li>قم بتغيير الإعداد إلى <span className="text-emerald-400 font-bold">"سماح" (Allow)</span>.</li>
                    <li>أعد تحميل الصفحة، وستعمل البوصلة تلقائياً بنسبة 100%!</li>
                  </ol>
                </div>
                <p className="text-[10px] text-white/60 text-center">أو يمكنك تدوير البوصلة يدوياً الآن بالمسح والسحب بإصبعك على شاشة الهاتف!</p>
              </div>

              <button
                type="button"
                onClick={() => setShowBraveHelp(false)}
                className="w-full py-2 bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all active:scale-95 text-center shadow-md"
              >
                فهمت، شكراً لك
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default QiblaModals;
