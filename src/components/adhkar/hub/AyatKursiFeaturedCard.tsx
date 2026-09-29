/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ShieldCheck, 
  ChevronLeft,
  Copy,
  Check
} from 'lucide-react';
import { DhikrCategory } from '../../../utils/adhkarData';

interface AyatKursiFeaturedCardProps {
  onSelectCategory: (category: DhikrCategory) => void;
  ayatKursiCategory: DhikrCategory;
}

const AYAT_KURSI_AUDIO_URL = 'https://everyayah.com/data/Alafasy_128kbps/002255.mp3';

export const AyatKursiFeaturedCard: React.FC<AyatKursiFeaturedCardProps> = ({
  onSelectCategory,
  ayatKursiCategory,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAudioError(false);

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current) {
      const audio = new Audio(AYAT_KURSI_AUDIO_URL);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        // Fallback to local offline audio file if remote fails
        if (audio.src !== window.location.origin + '/audio/ayat_kursi.mp3') {
          audio.src = '/audio/ayat_kursi.mp3';
          audio.play().then(() => setIsPlaying(true)).catch(() => {
            setIsPlaying(false);
            setAudioError(true);
          });
        } else {
          setIsPlaying(false);
          setAudioError(true);
        }
      };
      audioRef.current = audio;
    }

    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch((err) => {
      console.warn('Ayat al-kursi remote audio play error, attempting local fallback:', err);
      if (audioRef.current) {
        audioRef.current.src = '/audio/ayat_kursi.mp3';
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
          setAudioError(true);
        });
      }
    });
  };

  const handleCopyVerse = (e: React.MouseEvent) => {
    e.stopPropagation();
    const verseText = '«اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ»';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(verseText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div 
      onClick={() => onSelectCategory(ayatKursiCategory)}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 text-white p-5 sm:p-6 border-2 border-amber-500/40 shadow-xl shadow-emerald-950/30 cursor-pointer group transition-all hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-500/10"
    >
      {/* Decorative Islamic Background Ornament */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="absolute -top-12 -left-12 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badges & Actions */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-amber-300 drop-shadow-xs flex items-center gap-1.5">
                <span>آية الكرسي المباركة</span>
                <span className="text-xs font-normal text-emerald-300/80">(سورة البقرة • الآية ٢٥٥)</span>
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-200/80 font-medium">
              أعظم آية في كتاب الله تعالى • سيدة آي القرآن الكريم وحصن المسلم الحصين
            </p>
          </div>
        </div>

        {/* Audio Recitation & Copy Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlayAudio}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                : 'bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-500/30'
            }`}
            title="استماع لتلاوة آية الكرسي بصوت الشيخ مشاري العفاسي"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'إيقاف التلاوة' : 'استماع خاشع 🎧'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyVerse}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 border border-white/10 transition-all cursor-pointer"
            title="نسخ الآية الكريمة"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Verse Calligraphy Display */}
      <div className="relative z-10 my-3 p-4 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-xs text-right">
        <p className="text-base sm:text-lg md:text-xl font-arabic font-extrabold text-white leading-loose select-all tracking-wide drop-shadow-xs">
          «اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ»
        </p>

        {audioError && (
          <p className="text-[11px] text-amber-300 mt-2 font-medium">
            ⚠️ تعذر تشغيل الصوت عبر الإنترنت، يمكنك قراءة الآية الكريمة وترديدها.
          </p>
        )}
      </div>

      {/* Virtues & Badges row */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-white/10 text-xs font-bold">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>حفظ وحرز من الجن والشياطين</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px]">
            <span>موجبة للجنة دبر كل صلاة</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px]">
            <span>حفظ عند النوم حتى الصباح</span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-amber-300 font-extrabold group-hover:translate-x-[-4px] transition-transform">
          <span>قراءة الآية والتحصين الشامل</span>
          <ChevronLeft className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default AyatKursiFeaturedCard;
