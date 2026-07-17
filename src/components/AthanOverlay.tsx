import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, X, BellRing, Sparkles } from 'lucide-react';
import { toArabicNumbers } from '../utils/hijri';

interface AthanOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  prayerName: string; // e.g. "الفجر", "الظهر", "العصر", "المغرب", "العشاء"
  prayerTime: string;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  currentPhraseIdx: number;
  currentMuezzin: string;
  fajrMuezzin: string;
  setCurrentMuezzin: (id: string) => void;
  setFajrMuezzin: (id: string) => void;
  togglePlayAthan: (muezzinId?: string) => void;
  stopAthan: () => void;
}

export default function AthanOverlay({
  isOpen,
  onClose,
  prayerName,
  prayerTime,
  audioRef,
  isPlaying,
  currentPhraseIdx,
  currentMuezzin,
  fajrMuezzin,
  setCurrentMuezzin,
  setFajrMuezzin,
  togglePlayAthan,
  stopAthan
}: AthanOverlayProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [showDua, setShowDua] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  const isFajr = prayerName === 'الفجر';
  const activeMuezzinId = isFajr ? fajrMuezzin : currentMuezzin;

  const overlayPhrases = React.useMemo(() => {
    const phrases = [
      { arabic: "الله أكبر .. الله أكبر", english: "Allah is the Greatest, Allah is the Greatest" },
      { arabic: "الله أكبر .. الله أكبر", english: "Allah is the Greatest, Allah is the Greatest" },
      { arabic: "أشهد أن لا إله إلا الله", english: "I bear witness that there is no deity but Allah" },
      { arabic: "أشهد أن لا إله إلا الله", english: "I bear witness that there is no deity but Allah" },
      { arabic: "أشهد أن محمداً رسول الله", english: "I bear witness that Muhammad is the Messenger of Allah" },
      { arabic: "أشهد أن محمداً رسول الله", english: "I bear witness that Muhammad is the Messenger of Allah" },
      { arabic: "حي على الصلاة", english: "Hasten to prayer" },
      { arabic: "حي على الصلاة", english: "Hasten to prayer" },
      { arabic: "حي على الفلاح", english: "Hasten to success" },
      { arabic: "حي على الفلاح", english: "Hasten to success" },
    ];

    if (isFajr) {
      phrases.push(
        { arabic: "الصلاة خير من النوم", english: "Prayer is better than sleep" },
        { arabic: "الصلاة خير من النوم", english: "Prayer is better than sleep" }
      );
    }

    phrases.push(
      { arabic: "الله أكبر .. الله أكبر", english: "Allah is the Greatest, Allah is the Greatest" },
      { arabic: "لا إله إلا الله", english: "There is no deity but Allah" }
    );

    return phrases;
  }, [isFajr]);

  // Handle auto-starting Athan if not yet playing
  useEffect(() => {
    if (isOpen) {
      setShowDua(false);
      setHasStartedPlaying(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isPlaying) {
      setHasStartedPlaying(true);
    }
  }, [isOpen, isPlaying]);

  // When Athan ends, transition to Du'a screen automatically
  useEffect(() => {
    if (isOpen && hasStartedPlaying && !isPlaying) {
      setShowDua(true);
    }
  }, [isOpen, isPlaying, hasStartedPlaying]);

  // Sync volume mute with HTMLAudioElement
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted, audioRef, isPlaying]);

  const handleMuezzinChange = (muezzinId: string) => {
    stopAthan();
    if (isFajr) {
      setFajrMuezzin(muezzinId);
      localStorage.setItem('salah_fajr_muezzin', muezzinId);
    } else {
      setCurrentMuezzin(muezzinId);
      localStorage.setItem('salah_current_muezzin', muezzinId);
    }
    // Micro-delay to let audio release cleanly
    setTimeout(() => {
      togglePlayAthan(muezzinId);
    }, 120);
  };

  if (!isOpen) return null;

  const activePhraseIdx = currentPhraseIdx >= 0 && currentPhraseIdx < overlayPhrases.length ? currentPhraseIdx : 0;
  const activePhrase = overlayPhrases[activePhraseIdx];

  const muezzinOptions = [
    { id: 'fajr_yusuf', name: 'أذان الفجر (يوسف إسلام)', isFajrOnly: true },
    { id: 'makkah', name: 'أذان مكة المكرمة (الحرم المكي)', isFajrOnly: false },
    { id: 'medina', name: 'أذان المدينة المنورة (المسجد النبوي)', isFajrOnly: false },
    { id: 'aqsa', name: 'أذان المسجد الأقصى المبارك', isFajrOnly: false },
  ];

  const filteredMuezzins = isFajr ? muezzinOptions : muezzinOptions.filter(m => !m.isFajrOnly);

  return (
    <div 
      id="athan-full-screen-overlay"
      className="fixed inset-0 z-50 bg-slate-950/98 flex flex-col justify-between p-6 overflow-y-auto text-white"
      dir="rtl"
    >
      {/* Absolute Beautiful Starry Overlay and glowing particle effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-10 right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        {/* Simple geometric Islamic patterns */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* Header section */}
      <div className="flex justify-between items-center z-10 w-full max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl animate-pulse">
            <BellRing className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-white/50 block font-bold">نداء الصلاة الآن</span>
            <h3 className="text-xs font-black text-emerald-300 leading-none">مؤذن الرفيق الإلكتروني</h3>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/5 cursor-pointer transition-colors text-amber-300"
            title={isMuted ? "إلغاء كتم الصوت" : "كتم صوت الأذان"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400 animate-pulse" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          
          <button
            type="button"
            onClick={() => {
              stopAthan();
              onClose();
            }}
            className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 cursor-pointer transition-all text-rose-300"
            title="إغلاق التنبيه"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Immersive Visualizer */}
      <div className="flex flex-col items-center justify-center text-center my-auto z-10 space-y-6 w-full max-w-lg mx-auto">
        {/* Mosque Dome Silhouette & Audio Waves */}
        <div className="relative flex items-center justify-center w-36 h-36">
          {/* Pulsing golden rings simulating sonic waves */}
          {!isMuted && isPlaying && (
            <>
              <span className="absolute inset-0 rounded-full border border-amber-400/25 animate-ping-slow scale-[1.5]" />
              <span className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping-slow scale-[2]" />
            </>
          )}
          
          <div className="w-28 h-28 rounded-full bg-gradient-to-b from-emerald-600/30 to-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center relative shadow-2xl overflow-hidden">
            <span className="text-4xl">🕌</span>
          </div>
        </div>

        {/* Current Active Prayer Call */}
        <div className="space-y-1">
          <span className="text-[10px] text-amber-400/80 font-black tracking-widest block">حان الآن موعد أذان</span>
          <h1 className="text-3xl font-black text-white leading-tight drop-shadow-md">
            صلاة {prayerName}
          </h1>
          <p className="text-xs text-white/60 font-semibold">
            حسب التوقيت المحلي لمدينتك في تمام الساعة <span className="font-mono text-amber-300 font-extrabold">{toArabicNumbers(prayerTime)}</span>
          </p>
        </div>

        {/* Active Phrase Translation & Display */}
        {!showDua ? (
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 w-full shadow-inner space-y-4 min-h-[140px] flex flex-col justify-center">
            {/* Arabic Lyric */}
            <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-wide block transition-all duration-300 leading-normal">
              {activePhrase?.arabic}
            </span>
            {/* Meaning */}
            <p className="text-xs text-white/50 italic leading-relaxed max-w-sm mx-auto font-medium">
              {activePhrase?.english}
            </p>
            {/* Indicators dot bar */}
            <div className="flex justify-center gap-1 mt-2">
              {overlayPhrases.map((_, i) => (
                <span 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activePhraseIdx ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Post-Athan Du'a screen */
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-3xl p-6 w-full shadow-xl space-y-3 text-right max-w-md animate-fade-in">
            <div className="flex items-center gap-1.5 text-amber-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
              <span className="text-[10px] font-black uppercase">دعاء ما بعد الأذان</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-white/95 leading-relaxed font-sans">
              "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ."
            </p>
            <p className="text-[10px] text-emerald-400 font-semibold leading-relaxed border-t border-white/5 pt-2">
              💡 من قال هذا الدعاء حين يسمع النداء حلت له شفاعة النبي ﷺ يوم القيامة.
            </p>
          </div>
        )}

        {/* Muadhin Selector - Fully Integrated with Real Audio streams */}
        <div className="flex flex-col gap-2 w-full max-w-sm items-center">
          <span className="text-[9px] text-white/40 font-bold block">تغيير صوت المؤذن الحالي:</span>
          <div className="bg-black/45 backdrop-blur-md rounded-2xl p-1 border border-white/5 flex flex-wrap gap-1 justify-center w-fit">
            {filteredMuezzins.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleMuezzinChange(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black cursor-pointer transition-all ${
                  activeMuezzinId === opt.id 
                    ? 'bg-amber-400 text-slate-950 font-extrabold' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {opt.name.replace('أذان الفجر ', '').replace('أذان مكة المكرمة ', '').replace('أذان المدينة المنورة ', '').replace('أذان المسجد الأقصى ', '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer controls & sunnah recommendation */}
      <div className="mt-auto z-10 w-full max-w-lg mx-auto border-t border-white/10 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="text-[10px] text-white/50 font-semibold text-center sm:text-right leading-relaxed">
          🕌 صلاة الجماعة تفضل صلاة الفرد بسبع وعشرين درجة، احرص على الصف الأول!
        </span>
        <button
          type="button"
          onClick={() => {
            stopAthan();
            onClose();
          }}
          className="w-full sm:w-auto py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs transition-transform cursor-pointer hover:scale-105 active:scale-95 shadow-lg shadow-emerald-950/25 text-center"
        >
          أشهدت الأذان (الذهاب للمصلى)
        </button>
      </div>
    </div>
  );
}
