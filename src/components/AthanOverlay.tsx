import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, X, Sparkles, RotateCcw, AlertTriangle } from 'lucide-react';
import { toArabicNumbers } from '../utils/hijri';
import { defaultMuezzins, getCustomAudios, archiveMuezzins, getDownloadedTrackIds } from '../utils/audioStorage';

interface AthanOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  prayerName: string; // e.g. "الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء"
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
  audioError?: string | null;
  onRetryWithLocal?: () => void;
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
  stopAthan,
  audioError,
  onRetryWithLocal
}: AthanOverlayProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [showDua, setShowDua] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [muezzinOptions, setMuezzinOptions] = useState<any[]>(defaultMuezzins);
  const [downloadedTrackIds, setDownloadedTrackIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getCustomAudios().then(tracks => {
      setMuezzinOptions([...defaultMuezzins, ...archiveMuezzins, ...tracks]);
    }).catch(err => {
      console.error('Failed to load custom muezzins in overlay:', err);
    });
    getDownloadedTrackIds().then(setDownloadedTrackIds).catch(console.error);
  }, [isOpen]);

  const isFajr = prayerName === 'الفجر' || prayerName === 'Fajr';
  const isSunrise = prayerName === 'الشروق' || prayerName === 'تنبيه شروق الشمس' || prayerName === 'Sunrise';

  const prayerKeyMap: Record<string, string> = {
    'الفجر': 'Fajr',
    'الشروق': 'Sunrise',
    'تنبيه شروق الشمس': 'Sunrise',
    'الظهر': 'Dhuhr',
    'العصر': 'Asr',
    'المغرب': 'Maghrib',
    'العشاء': 'Isha',
  };
  const pKey = prayerKeyMap[prayerName] || prayerName;
  const savedPrayerMuezzin = localStorage.getItem(`salah_muezzin_${pKey}`);
  const activeMuezzinId = savedPrayerMuezzin || (isFajr ? fajrMuezzin : currentMuezzin);

  const activeMuezzin = React.useMemo(() => {
    return muezzinOptions.find(m => m.id === activeMuezzinId);
  }, [activeMuezzinId, muezzinOptions]);

  const isFajrTrack = activeMuezzin?.isFajr ?? false;

  const overlayPhrases = React.useMemo(() => {
    if (isSunrise) {
      return [
        { arabic: "أَشْرَقَتِ الشَّمْسُ وَأَشْرَقَ المُلْكُ لِلَّهِ رَبِّ العَالَمِينَ", english: "The sun has risen and the kingdom belongs to Allah" },
        { arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ العَظِيمِ", english: "Glory be to Allah and His praise, Glory be to Allah the Supreme" }
      ];
    }

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
  }, [isFajrTrack, isSunrise]);

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
    if (isOpen && hasStartedPlaying && !isPlaying && !isSunrise) {
      setShowDua(true);
    }
  }, [isOpen, isPlaying, hasStartedPlaying, isSunrise]);

  // Sync volume mute with HTMLAudioElement
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted, audioRef, isPlaying]);

  if (!isOpen) return null;

  const activePhraseIdx = currentPhraseIdx >= 0 && currentPhraseIdx < overlayPhrases.length ? currentPhraseIdx : 0;
  const activePhrase = overlayPhrases[activePhraseIdx];

  // Determine beautiful backdrop image
  const getMosqueBackground = (muezzinId: string) => {
    if (isSunrise) {
      return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200';
    }
    switch (muezzinId) {
      case 'makkah':
      case 'fajr_makkah':
        return 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&q=80&w=1200';
      case 'medina':
      case 'fajr_medina':
        return 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=1200';
      case 'aqsa':
      case 'fajr_aqsa':
        return 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&q=80&w=1200';
      case 'fajr_yusuf':
      default:
        return 'https://images.unsplash.com/photo-1542640244-7e672d6cef21?auto=format&fit=crop&q=80&w=1200';
    }
  };

  const bgImg = getMosqueBackground(activeMuezzinId);

  const handleRetry = () => {
    if (onRetryWithLocal) {
      onRetryWithLocal();
    } else {
      togglePlayAthan(activeMuezzinId);
    }
  };

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
          <span className="text-[10px] tracking-widest text-emerald-400/70 font-black uppercase block">
            {isSunrise ? 'تنبيه الشروق' : 'نداء الصلاة'}
          </span>
          <h2 className="text-sm font-black text-white/90">
            {isSunrise ? 'شروق الشمس (نهاية وقت الفجر)' : `صلاة ${prayerName}`}
          </h2>
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
      <div className="flex flex-col items-center justify-center text-center my-auto z-10 space-y-8 w-full max-w-xl mx-auto">
        
        {/* Subtle, beautiful pulsing circle */}
        <div className="relative flex items-center justify-center w-24 h-24 my-2">
          {!isMuted && isPlaying && (
            <>
              <div className="absolute inset-0 rounded-full border border-emerald-500/15 animate-ping" style={{ animationDuration: '4s' }} />
              <div className="absolute inset-2 rounded-full border border-amber-400/10 animate-ping" style={{ animationDuration: '6s' }} />
            </>
          )}
          <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-2xl select-none shadow-inner">
            {isSunrise ? '🌅' : '🌙'}
          </div>
        </div>

        {/* Big Focal Phrase */}
        {!showDua ? (
          <div className="space-y-6 w-full py-4 min-h-[140px] flex flex-col justify-center">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-amber-200 tracking-wide block transition-all duration-500 leading-relaxed font-sans drop-shadow-sm">
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

        {/* Audio Error Alert & Retry Action */}
        <div className="space-y-3 w-full max-w-md pt-2">
          {audioError && (
            <div className="w-full p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-right text-amber-200 text-xs space-y-2 animate-fade-in shadow-lg">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>تنبيه خطأ تشغيل الصوت:</span>
              </div>
              <p className="leading-relaxed text-[11px] opacity-90">{audioError}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-2 w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-98"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة المحاولة (تحميل وتشغيل الصوت المدمج)</span>
              </button>
            </div>
          )}

          {!isPlaying && !audioError && (
            <button
              type="button"
              onClick={handleRetry}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer animate-bounce"
            >
              <Volume2 className="w-4 h-4" />
              <span>🔊 انقر هنا لتشغيل الصوت فوراً (إعادة المحاولة / فتح الصوت)</span>
            </button>
          )}

          {!isSunrise && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xs text-[11px] text-amber-300 font-bold mx-auto shadow-sm">
              <span className="text-white/50 font-normal">المؤذن:</span>
              <select
                value={activeMuezzinId}
                onChange={(e) => {
                  const newId = e.target.value;
                  localStorage.setItem(`salah_muezzin_${pKey}`, newId);
                  if (isFajr) {
                    setFajrMuezzin(newId);
                    localStorage.setItem('salah_fajr_muezzin', newId);
                  } else {
                    setCurrentMuezzin(newId);
                    localStorage.setItem('salah_general_muezzin', newId);
                  }
                  togglePlayAthan(newId);
                }}
                className="bg-transparent text-amber-300 font-bold cursor-pointer outline-none border-none pr-1 focus:ring-0"
              >
                {muezzinOptions.map(m => {
                  const isDownloaded = downloadedTrackIds.has(m.id) || m.id.startsWith('custom_');
                  const tag = isDownloaded ? '⚡ ' : '';
                  return (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {tag + m.name}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

      </div>

      {/* Footer minimal information & Close */}
      <div className="mt-auto z-10 w-full max-w-2xl mx-auto border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="text-[10px] text-white/40 font-medium text-center sm:text-right max-w-sm leading-relaxed">
          {isSunrise
            ? 'قال النبي ﷺ: "من صلى الفجر في جماعة ثم قعد يذكر الله حتى تطلع الشمس ثم صلى ركعتين كانت له كأجر حجة وعمرة تامّتين".'
            : 'حُضوركَ في الصف الأول صلاة جماعة تزيد عن صلاتك منفرداً بسبعٍ وعشرين درجة مباركة. تقبل الله طاعتك.'}
        </span>
        <button
          type="button"
          onClick={() => {
            stopAthan();
            onClose();
          }}
          className="w-full sm:w-auto py-2.5 px-8 bg-white text-slate-950 font-black rounded-full text-xs transition-transform cursor-pointer hover:scale-105 active:scale-95 shadow-md hover:bg-slate-100"
        >
          {isSunrise ? 'تمت القراءة / إغلاق' : 'تم الاستماع (الذهاب للمصلى)'}
        </button>
      </div>
    </div>
  );
}
