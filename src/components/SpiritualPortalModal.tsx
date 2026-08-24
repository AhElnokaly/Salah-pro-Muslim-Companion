import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, RotateCcw } from 'lucide-react';
import companionIcon from '../assets/images/hemmaty_logo.jpg';

export const SPIRITUAL_CAPSULES = [
  {
    text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    source: "سورة الرعد - الآية ٢٨",
    category: "طمأنينة وطمأنة الروح"
  },
  {
    text: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ",
    source: "سورة غافر - الآية ٦٠",
    category: "يقين بالإجابة والفرج"
  },
  {
    text: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
    source: "سورة البقرة - الآية ١٥٢",
    category: "ذكر رباني وشكر النعمة"
  },
  {
    text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
    source: "سورة الطلاق - الآية ٢ - ٣",
    category: "سعة الرزق والفرج العاجل"
  },
  {
    text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    source: "سورة الشرح - الآية ٦",
    category: "بشرى وتيسير العسير"
  },
  {
    text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    source: "سورة الطلاق - الآية ٣",
    category: "قوة التوكل والاعتماد على الله"
  },
  {
    text: "وَاصْبِرْ لِحُكْمِ رَبِّكَ فَإِنَّكَ بِأَعْيُنِنَا",
    source: "سورة الطور - الآية ٤٨",
    category: "معية الله ورحمته ولطفه"
  },
  {
    text: "كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلَتَانِ فِي الْمِيزَانِ، حَبِيبَتَانِ إِلَى الرَّحْمَنِ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
    source: "حديث شريف - متفق عليه",
    category: "كنز الميزان والذكر العظيم"
  },
  {
    text: "مَنْ لَزِمَ الاِسْتِغْفَارَ جَعَلَ اللَّهُ لَهُ مِنْ كُلِّ ضِيقٍ مَخْرَجًا، وَمِنْ كُلِّ هَمٍّ فَرَجًا، وَرَزَقَهُ مِنْ حَيْثُ لاَ يَحْتَسِبُ",
    source: "حديث شريف - رواه أبو داود",
    category: "مفتاح الفرَج والنماء"
  },
  {
    text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
    source: "من دعاء النبي ﷺ الكنز",
    category: "الستر والسلامة الشاملة"
  }
];

interface SpiritualPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  setToastMessage?: (msg: string) => void;
}

export const SpiritualPortalModal: React.FC<SpiritualPortalModalProps> = ({
  isOpen,
  onClose,
  setToastMessage
}) => {
  const [sessionTasbihCount, setSessionTasbihCount] = useState<number>(0);
  const [activeDhikrPhrase, setActiveDhikrPhrase] = useState<string>("سُبْحَانَ اللَّهِ");
  const [currentCapsuleIndex, setCurrentCapsuleIndex] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSpiritualChime = (pitch: number = 523.25) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const delayNode = ctx.createDelay();
      const delayGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(pitch, now);
      osc1.frequency.exponentialRampToValueAtTime(pitch / 2, now + 1.5);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(pitch / 2, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      gainNode.gain.setValueAtTime(0.25, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      delayNode.delayTime.value = 0.3;
      delayGain.gain.value = 0.15;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);

      gainNode.connect(delayNode);
      delayNode.connect(delayGain);
      delayGain.connect(delayNode);
      delayGain.connect(ctx.destination);

      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.8);
      osc2.stop(now + 1.8);
    } catch (err) {
      console.warn('AudioContext chime error:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="bg-[#0e131b] border-2 border-emerald-500/25 rounded-[2.5rem] p-6 max-w-sm w-full shadow-[0_0_50px_rgba(16,185,129,0.15)] relative text-end flex flex-col items-center gap-5 text-white overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute top-0 inset-x-0 h-40 bg-radial-[at_top] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />

          {/* Header inside Modal */}
          <div className="w-full flex items-center justify-between z-10">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 flex items-center justify-center text-slate-300 transition-all cursor-pointer active:scale-95 text-sm font-black"
            >
              ✕
            </button>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-black text-emerald-300 tracking-wide">بوابة النفحات الإيمانية 🌸</span>
            </div>
          </div>

          {/* Glowing Interactive Brand Avatar */}
          <div className="relative mt-2 z-10 flex flex-col items-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-emerald-500/10 rounded-full blur-md"
            />
            
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-400/40 bg-[#121d2a] shadow-lg relative">
              <img 
                src={companionIcon} 
                alt="هِمَّتِي" 
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/hemmaty_logo.jpg';
                }}
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <h3 className="text-sm font-black text-white mt-3 text-center">سكينة الروح والوجدان</h3>
            <p className="text-[10px] text-slate-400 font-extrabold text-center mt-1">«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ»</p>
          </div>

          {/* 1. Interactive Tasbih Rosary Bead */}
          <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 flex flex-col items-center gap-3.5 z-10">
            <span className="text-[10px] font-black text-emerald-400">مسبحة السكينة التفاعلية 📿</span>
            
            {/* Circular Bead Button */}
            <div className="relative flex items-center justify-center w-28 h-28">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0, 0.15] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                className="absolute inset-0 rounded-full bg-emerald-500 border border-emerald-500/30"
              />
              <motion.div
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute inset-2 rounded-full bg-indigo-500/10 border border-indigo-500/20"
              />
              
              <motion.button
                whileTap={{ scale: 0.90 }}
                onClick={() => {
                  const nextCount = sessionTasbihCount + 1;
                  setSessionTasbihCount(nextCount);
                  if (navigator.vibrate) {
                    navigator.vibrate(45);
                  }
                  const pitch = 392.00 * Math.pow(1.059463, (nextCount - 1) % 33);
                  playSpiritualChime(pitch);
                }}
                className="relative w-22 h-22 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 hover:from-emerald-500 hover:to-teal-300 border-3 border-emerald-300/35 flex flex-col items-center justify-center cursor-pointer shadow-[0_10px_25px_rgba(16,185,129,0.3)] select-none focus:outline-hidden group"
              >
                <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest group-hover:scale-105 transition-all">اضغط وسبّح</span>
                <span className="text-xl font-black text-white mt-1 tracking-tight">
                  {(() => {
                    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
                    return sessionTasbihCount.toString().replace(/[0-9]/g, (w) => arabicDigits[parseInt(w)]);
                  })()}
                </span>
              </motion.button>
            </div>

            {/* Phrase pill switcher */}
            <div className="w-full flex flex-wrap items-center justify-center gap-1.5 pt-2">
              {["سُبْحَانَ اللَّهِ", "الْحَمْدُ لِلَّهِ", "لَا إِلَٰهَ إِلَّا اللَّهُ", "اللَّهُ أَكْبَرُ", "أَسْتَغْفِرُ اللَّهَ"].map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => {
                    setActiveDhikrPhrase(phrase);
                    setSessionTasbihCount(0);
                    playSpiritualChime(523.25);
                  }}
                  className={`px-3 py-1 rounded-full text-[9px] font-black transition-all cursor-pointer ${
                    activeDhikrPhrase === phrase 
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20' 
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
                  }`}
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Reset button */}
            {sessionTasbihCount > 0 && (
              <button
                onClick={() => {
                  setSessionTasbihCount(0);
                  playSpiritualChime(329.63);
                }}
                className="text-[9px] font-black text-slate-400 hover:text-rose-400 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>تصفير العداد</span>
              </button>
            )}
          </div>

          {/* 2. Daily Spiritual Capsule (النفحة الإيمانية) */}
          <div className="w-full bg-emerald-500/[0.03] border border-emerald-500/15 rounded-3xl p-4 relative text-center z-10">
            <span className="text-emerald-500/20 text-4xl font-serif absolute top-1 end-3 leading-none">“</span>
            <span className="text-[10px] font-black text-emerald-400/80 block mb-2">{SPIRITUAL_CAPSULES[currentCapsuleIndex].category}</span>
            <p className="text-xs font-black text-emerald-100/90 leading-relaxed px-2 py-1 select-text">
              {SPIRITUAL_CAPSULES[currentCapsuleIndex].text}
            </p>
            <span className="text-[9px] text-emerald-400/75 font-extrabold block mt-2">
              — {SPIRITUAL_CAPSULES[currentCapsuleIndex].source}
            </span>
            
            <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-emerald-500/10">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${SPIRITUAL_CAPSULES[currentCapsuleIndex].text} - ${SPIRITUAL_CAPSULES[currentCapsuleIndex].source}`);
                  if (setToastMessage) {
                    setToastMessage("تم نسخ النفحة الإيمانية بنجاح 📋");
                  }
                }}
                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 active:scale-95 rounded-xl transition-all cursor-pointer"
                title="نسخ النفحة الإيمانية 📋"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              
              <button 
                onClick={() => {
                  const nextIndex = (currentCapsuleIndex + 1) % SPIRITUAL_CAPSULES.length;
                  setCurrentCapsuleIndex(nextIndex);
                  playSpiritualChime(587.33);
                }}
                className="p-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 active:scale-95 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[9px] font-black px-3"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>نفحة أخرى ✨</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer text-center z-10"
          >
            العودة للتطبيق ومواصلة الذكر 🤲
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SpiritualPortalModal;
