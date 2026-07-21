import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, X, Sparkles } from 'lucide-react';
import { toArabicNumbers } from '../utils/hijri';
import { defaultMuezzins, getCustomAudios, archiveMuezzins } from '../utils/audioStorage';

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
  const [muezzinOptions, setMuezzinOptions] = useState<any[]>(defaultMuezzins);

  useEffect(() => {
    getCustomAudios().then(tracks => {
      setMuezzinOptions([...defaultMuezzins, ...archiveMuezzins, ...tracks]);
    }).catch(err => {
      console.error('Failed to load custom muezzins in overlay:', err);
    });
  }, [isOpen]);

  const isFajr = prayerName === 'الفجر';
  const activeMuezzinId = isFajr ? fajrMuezzin : currentMuezzin;

  const activeMuezzin = React.useMemo(() => {
    return muezzinOptions.find(m => m.id === activeMuezzinId);
  }, [activeMuezzinId, muezzinOptions]);

  const isFajrTrack = activeMuezzin?.isFajr ?? false;

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

    if (isFajrTrack) {
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
  }, [isFajrTrack]);

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
      localStorage.setItem('salah_general_muezzin', muezzinId);
    }
    // Micro-delay to let audio release cleanly
    setTimeout(() => {
      togglePlayAthan(muezzinId);
    }, 120);
  };

  if (!isOpen) return null;

  const activePhraseIdx = currentPhraseIdx >= 0 && currentPhraseIdx < overlayPhrases.length ? currentPhraseIdx : 0;
  const activePhrase = overlayPhrases[activePhraseIdx];

  const filteredMuezzins = isFajr 
    ? muezzinOptions.filter(m => m.isFajr) 
    : muezzinOptions.filter(m => !m.isFajr);

  // Determine beautiful backdrop image based on selected Muezzin (Athan)
  const getMosqueBackground = (muezzinId: string) => {
    switch (muezzinId) {
      case 'makkah':
      case 'fajr_makkah':
        return 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&q=80&w=1200'; // Kaaba / Makkah
      case 'medina':
      case 'fajr_medina':
        return 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=1200'; // Masjid an-Nabawi Medina
      case 'aqsa':
      case 'fajr_aqsa':
        return 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&q=80&w=1200'; // Dome of the Rock / Jerusalem
      case 'fajr_yusuf':
      default:
        return 'https://images.unsplash.com/photo-1542640244-7e672d6cef21?auto=format&fit=crop&q=80&w=1200'; // Dawn silhouette mosque / general
    }
  };

  const bgImg = getMosqueBackground(activeMuezzinId);

  return (
    <div 
      id="athan-minimalist-overlay"
      className="fixed inset-0 z-50 bg-[#070b11] flex flex-col justify-between p-8 sm:p-12 text-white font-sans transition-all duration-500 overflow-hidden"
      dir="rtl"
    >
      {/* Dynamic Mosque Background with Ken Burns effect */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-in-out bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      {/* Spiritual gradient overlay to blend into dark, readable interface */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#04060a] via-[#070b11]/85 to-[#0b121c]/90 backdrop-blur-[2.5px] pointer-events-none" />

      {/* Soft, meditative radial background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-amber-500/10 dark:bg-amber-400/5 rounded-full blur-[80px] pointer-events-none" />
      </div>

      {/* Top Bar (Mute and Close) */}
      <div className="flex justify-between items-center z-10 w-full max-w-2xl mx-auto">
        <div className="text-right">
          <span className="text-[10px] tracking-widest text-emerald-400/70 font-black uppercase block">نداء الصلاة</span>
          <h2 className="text-sm font-black text-white/90">صلاة {prayerName}</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.05] cursor-pointer transition-colors text-white/70 hover:text-white"
            title={isMuted ? "إلغاء الكتم" : "كتم الصوت"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          
          <button
            type="button"
            onClick={() => {
              stopAthan();
              onClose();
            }}
            className="p-2.5 rounded-full bg-white/[0.04] hover:bg-rose-500/10 border border-white/[0.05] hover:border-rose-500/20 cursor-pointer transition-colors text-white/70 hover:text-rose-400"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col items-center justify-center text-center my-auto z-10 space-y-10 w-full max-w-xl mx-auto">
        
        {/* Subtle, beautiful pulsing circle */}
        <div className="relative flex items-center justify-center w-24 h-24 my-2">
          {!isMuted && isPlaying && (
            <>
              <div className="absolute inset-0 rounded-full border border-emerald-500/15 animate-ping" style={{ animationDuration: '4s' }} />
              <div className="absolute inset-2 rounded-full border border-amber-400/10 animate-ping" style={{ animationDuration: '6s' }} />
            </>
          )}
          <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-2xl select-none shadow-inner">
            🌙
          </div>
        </div>

        {/* Big Focal Phrase */}
        {!showDua ? (
          <div className="space-y-6 w-full py-4 min-h-[160px] flex flex-col justify-center">
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-amber-200 tracking-wide block transition-all duration-500 leading-relaxed font-sans drop-shadow-sm">
              {activePhrase?.arabic}
            </span>
            <span className="text-xs text-white/40 font-medium tracking-wide max-w-md mx-auto block leading-normal">
              {activePhrase?.english}
            </span>
          </div>
        ) : (
          /* Sleek Minimalist Post-Athan Du'a */
          <div className="space-y-4 w-full max-w-md py-6 px-8 bg-white/[0.02] border border-white/[0.05] rounded-3xl text-right animate-fade-in shadow-xl">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] tracking-wider font-extrabold block">دعاء ما بعد الأذان المبارك</span>
            </div>
            <p className="text-sm font-bold text-white/90 leading-relaxed font-sans">
              "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ."
            </p>
            <p className="text-[9px] text-emerald-400/80 font-medium leading-relaxed border-t border-white/5 pt-2">
              حلت لك شفاعة الحبيب المصطفى ﷺ يوم القيامة بإذن الله 🌿.
            </p>
          </div>
        )}

        {/* Quietly integrated muezzin controls */}
        <div className="space-y-3 w-full max-w-xs pt-4">
          <span className="text-[9px] text-white/30 font-bold block">مكثّف الصوت والمؤذن</span>
          <div className="flex justify-center gap-1.5 flex-wrap">
            {filteredMuezzins.map(opt => {
              const isSelected = activeMuezzinId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleMuezzinChange(opt.id)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-amber-400 text-slate-950 font-black' 
                      : 'bg-white/[0.03] text-white/50 border border-white/[0.04] hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {opt.name.replace('أذان الفجر ', '').replace('أذان مكة المكرمة ', '').replace('أذان المسجد النبوي ', '').replace('أذان المسجد الأقصى ', '')}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer minimal information & Close */}
      <div className="mt-auto z-10 w-full max-w-2xl mx-auto border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="text-[10px] text-white/40 font-medium text-center sm:text-right max-w-sm leading-relaxed">
          حُضوركَ في الصف الأول صلاة جماعة تزيد عن صلاتك منفرداً بسبعٍ وعشرين درجة مباركة. تقبل الله طاعتك.
        </span>
        <button
          type="button"
          onClick={() => {
            stopAthan();
            onClose();
          }}
          className="w-full sm:w-auto py-2.5 px-8 bg-white text-slate-950 font-black rounded-full text-xs transition-transform cursor-pointer hover:scale-105 active:scale-95 shadow-md hover:bg-slate-100"
        >
          تم الاستماع (الذهاب للمصلى)
        </button>
      </div>
    </div>
  );
}
