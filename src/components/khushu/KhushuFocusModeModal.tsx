/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Moon, Minus, Plus, X } from 'lucide-react';
import { toArabicNumbers } from '../../utils/hijri';
import { QIYAM_DUAS } from './khushuConstants';

interface KhushuFocusModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveRakahCounter: number;
  setLiveRakahCounter: React.Dispatch<React.SetStateAction<number>>;
  selectedFocusDua: string;
  setSelectedFocusDua: (dua: string) => void;
  activeAmbient: 'none' | 'rain' | 'breeze' | 'stream';
  playAmbientAudio: (type: 'rain' | 'breeze' | 'stream') => void;
  onSaveAndTransfer: (rakahs: number, witr: number) => void;
  witrRakahs: number;
}

export const KhushuFocusModeModal: React.FC<KhushuFocusModeModalProps> = ({
  isOpen,
  onClose,
  liveRakahCounter,
  setLiveRakahCounter,
  selectedFocusDua,
  setSelectedFocusDua,
  activeAmbient,
  playAmbientAudio,
  onSaveAndTransfer,
  witrRakahs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#080d1a]/95 backdrop-blur-xl text-white p-4 sm:p-8 flex flex-col justify-between overflow-y-auto animate-fade-in" dir="rtl">
      {/* Focus Mode Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          <h3 className="text-base font-black text-amber-200">وضع الخلوة المتبتلة والتهجد المباشر</h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق وضع الخلوة والتهجد"
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
          title="إغلاق وضع الخلوة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Focus Mode Central Content */}
      <div className="my-auto max-w-2xl mx-auto w-full space-y-6 py-6 text-center">
        {/* Pulsing Breathing Circle */}
        <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping duration-1000 pointer-events-none" />
          <div className="absolute inset-2 bg-purple-500/30 rounded-full blur-md pointer-events-none" />
          <div className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-900 to-purple-800 border-2 border-indigo-400/50 flex flex-col items-center justify-center space-y-1 shadow-2xl">
            <Moon className="w-8 h-8 text-amber-300" />
            <span className="text-xs font-black text-indigo-100">بَيْنَ يَدَيِ اللَّهِ</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-lg font-black text-amber-100">«واستشعر قرب السميع العليم في خلوتك»</h4>
          <p className="text-xs text-slate-300 font-medium max-w-md mx-auto leading-relaxed">
            فرّغ قلبك من الشواغل، وصَلِّ ركعتين خفيفتين افتتاحاً ثم تبتل في محرابك مثنى مثنى.
          </p>
        </div>

        {/* Live Rakah Counter */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-3xl max-w-md mx-auto space-y-3">
          <span className="text-xs font-extrabold text-indigo-300 block">عدّاد ركعات التهجد الحالية:</span>
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => setLiveRakahCounter(prev => Math.max(0, prev - 2))}
              aria-label="إنقاص ركعتين من عداد التهجد الحالي"
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-black transition-all active:scale-95 cursor-pointer"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="text-3xl font-black text-amber-300 font-mono">
              {toArabicNumbers(liveRakahCounter)} ركعة
            </span>
            <button
              type="button"
              onClick={() => setLiveRakahCounter(prev => prev + 2)}
              aria-label="إضافة ركعتين إلى عداد التهجد الحالي"
              className="p-3 bg-amber-500 hover:bg-amber-600 rounded-2xl text-white font-black transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-bold">صلاة الليل مثنى مثنى (ركعتان ركعتان)</p>
        </div>

        {/* Live Supplication Selection Box */}
        <div className="p-4 bg-indigo-950/60 border border-indigo-500/30 rounded-3xl text-end space-y-2">
          <span className="text-xs font-black text-indigo-300 block text-center">دعاء ومناجاة حية للمحراب:</span>
          <p className="text-sm font-black text-amber-100 leading-relaxed font-serif text-center py-2">
            «{selectedFocusDua}»
          </p>
          <div className="flex justify-center gap-2 flex-wrap pt-2">
            {QIYAM_DUAS.map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedFocusDua(d.arabic)}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[10px] font-bold rounded-xl border border-white/10 text-slate-200 transition-all cursor-pointer"
              >
                {d.title}
              </button>
            ))}
          </div>
        </div>

        {/* Ambient Sound Toggles in Focus Mode */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => playAmbientAudio('rain')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeAmbient === 'rain' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300'
            }`}
          >
            🌧️ مطر خفيف
          </button>
          <button
            type="button"
            onClick={() => playAmbientAudio('breeze')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeAmbient === 'breeze' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300'
            }`}
          >
            🍃 نسيم السحر
          </button>
        </div>
      </div>

      {/* Focus Mode Bottom Bar */}
      <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-bold">
          تقبل الله طاعتك وقيامك 🌿
        </span>
        <button
          type="button"
          onClick={() => {
            onSaveAndTransfer(liveRakahCounter, witrRakahs || 1);
            onClose();
          }}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl cursor-pointer transition-all active:scale-95"
        >
          حفظ ونقل لركعات اليوم ({toArabicNumbers(liveRakahCounter)} ركعة)
        </button>
      </div>
    </div>
  );
};
