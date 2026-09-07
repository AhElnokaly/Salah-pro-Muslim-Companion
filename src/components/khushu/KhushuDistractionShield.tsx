import React, { useState, useEffect } from 'react';
import { Shield, Volume2, X, Sparkles, Moon } from 'lucide-react';
import { toArabicNumbers } from '../../utils/hijri';

interface KhushuDistractionShieldProps {
  isActive: boolean;
  remainingSeconds: number;
  durationMinutes: number;
  mode: 'silent' | 'dnd';
  onDeactivate: () => void;
  onDismiss: () => void;
}

const KHUSHU_AYAT = [
  { ayah: 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ • الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ', surah: 'سورة المؤمنون' },
  { ayah: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ', surah: 'سورة البقرة' },
  { ayah: 'أَلَمْ يَأْنِ لِلَّذِينَ آمَنُوا أَن تَخْشَعَ قُلُوبُهُمْ لِذِكْرِ اللَّهِ', surah: 'سورة الحديد' },
  { ayah: 'حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ', surah: 'سورة البقرة' },
];

export const KhushuDistractionShield: React.FC<KhushuDistractionShieldProps> = ({
  isActive,
  remainingSeconds,
  durationMinutes,
  mode,
  onDeactivate,
  onDismiss,
}) => {
  const [selectedAyahIndex, setSelectedAyahIndex] = useState(0);

  useEffect(() => {
    // اختيار آية عشوائية هادئة عند فتح الشاشة
    const randomIndex = Math.floor(Math.random() * KHUSHU_AYAT.length);
    setSelectedAyahIndex(randomIndex);
  }, [isActive]);

  if (!isActive) return null;

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeFormatted = `${toArabicNumbers(mins)}:${toArabicNumbers(secs < 10 ? `0${secs}` : secs)}`;
  const currentAyah = KHUSHU_AYAT[selectedAyahIndex] || KHUSHU_AYAT[0];

  return (
    <div
      id="khushu-distraction-shield"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl text-white flex flex-col items-center justify-between p-6 select-none overflow-y-auto"
      dir="rtl"
    >
      {/* الشريط العلوي الهادئ */}
      <div className="w-full flex items-center justify-between max-w-md pt-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
          <Shield className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
          <span>وضع الخشوع قائم • {mode === 'dnd' ? 'عدم الإزعاج' : 'صامت'}</span>
        </div>
        <button
          id="btn-dismiss-shield"
          onClick={onDismiss}
          className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="متابعة استخدام التطبيق"
          aria-label="إغلاق الشاشة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* المحتوى المركزي التعبدي */}
      <div className="w-full max-w-md flex flex-col items-center text-center my-auto py-8">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Moon className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-600 text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* الآية الكريمة */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 w-full shadow-2xl">
          <p className="text-xl md:text-2xl font-serif leading-loose text-amber-200/90 mb-3">
            «{currentAyah.ayah}»
          </p>
          <span className="text-xs text-slate-400 block font-sans">
            — {currentAyah.surah}
          </span>
        </div>

        {/* العداد التنازلي التناغمي */}
        <div className="flex flex-col items-center mb-6">
          <span className="text-xs text-slate-400 mb-1">الوقت المتبقي لانتهاء الصلاة</span>
          <div className="text-5xl md:text-6xl font-black tracking-widest text-emerald-400 font-mono">
            {timeFormatted}
          </div>
          <span className="text-xs text-slate-500 mt-2">
            من إجمالي {toArabicNumbers(durationMinutes)} دقيقة
          </span>
        </div>
      </div>

      {/* الشريط السفلي لإجراءات الخشوع */}
      <div className="w-full max-w-md flex flex-col gap-3 pb-4">
        <button
          id="btn-end-khushu-shield"
          onClick={onDeactivate}
          className="w-full py-3.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800/80 text-red-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <Volume2 className="w-4 h-4 shrink-0" />
          <span>إنهاء وضع الخشوع واستعادة الصوت الآن</span>
        </button>

        <button
          id="btn-continue-shield"
          onClick={onDismiss}
          className="w-full py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 text-xs transition-colors"
        >
          متابعة استخدام التطبيق (يبقى الهاتف صامتاً)
        </button>
      </div>
    </div>
  );
};
