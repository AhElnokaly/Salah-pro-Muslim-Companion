/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Share2, X, BookOpen, Award, CheckCircle2 } from 'lucide-react';
import { QuranKhatma } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';
import darkMosqueBackdrop from '../../assets/images/mosque_backdrop_dark_1785869917166.jpg';

interface KhatmaCelebrationModalProps {
  khatma: QuranKhatma;
  onClose: () => void;
  onShareKhatma: () => void;
}

export default function KhatmaCelebrationModal({
  khatma,
  onClose,
  onShareKhatma
}: KhatmaCelebrationModalProps) {
  useEffect(() => {
    // Elegant spiritual confetti trigger (gold/emerald gentle particles)
    const count = 200;
    const defaults = {
      origin: { y: 0.6 }
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        colors: ['#10B981', '#F59E0B', '#107B57', '#FBBF24', '#D97706']
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-md p-6 text-center text-white space-y-5 shadow-2xl animate-scaleUp relative overflow-hidden"
      >
        {/* Celebratory Mosque Background Watermark */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden select-none">
          <img 
            src={darkMosqueBackdrop} 
            alt="Grand Mosque" 
            className="w-full h-full object-cover object-center scale-110 filter blur-[0.5px]" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900" />
        </div>

        {/* Subtle decorative glow background */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/50 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto shadow-inner animate-bounce">
          <Award className="w-8 h-8" />
        </div>

        {/* Main Title */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-amber-300 font-serif">
            بارك الله لك، ختمة مباركة 🌙
          </h2>
          <p className="text-xs text-emerald-200/90 font-medium">
            تم بحمد الله وتوفيقه إتمام {khatma.name || 'الختمة الشريفة'}
          </p>
        </div>

        {/* Quran Completion Traditional Dua Text */}
        <div className="bg-slate-950/70 border border-amber-500/30 p-4 rounded-2xl text-xs sm:text-sm text-amber-100 font-serif leading-relaxed space-y-2 shadow-inner">
          <p className="font-bold text-amber-300">
            « اللَّهُمَّ ارْحَمْنِي بِالْقُرْآنِ وَاجْعَلْهُ لِي إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً »
          </p>
          <p className="text-[11px] text-amber-200/80 leading-normal">
            « اللَّهُمَّ ذَكِّرْنِي مِنْهُ مَا نَسِيتُ وَعَلِّمْنِي مِنْهُ مَا جَهِلْتُ وَارْزُقْنِي تِلَاوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ وَاجْعَلْهُ لِي حُجَّةً يَا رَبَّ الْعَالَمِينَ »
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onShareKhatma}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>شارك إنجازك (بطاقة)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs transition-all cursor-pointer border border-slate-700"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
