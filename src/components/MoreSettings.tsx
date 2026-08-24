/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import AppModal, { AppModalVariant } from './shared/AppModal';
import { 
  Settings, 
  Trash2, 
  BookOpen, 
  Volume2, 
  Check, 
  RotateCcw,
  RotateCw,
  Sparkles,
  Download,
  Upload,
  Calendar,
  AlertCircle,
  Clock,
  Heart,
  Plus,
  Sun,
  Moon,
  Monitor,
  Sliders,
  Play,
  Pause,
  VolumeX,
  Volume1,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  MapPin,
  Navigation,
  Compass,
  HelpCircle,
  Info,
  Globe,
  Edit3,
  FileJson,
  FileUp
} from 'lucide-react';
import { AppSettings, BackdropRenderMode, PendingQadaPrayer, RamadanQadaTracker, PrayerLog, PrayerName, CustomDua, QuranSession, QuranKhatma, MuezzinOption, SettingsSubTabId } from '../types';
import { toArabicNumbers, formatArabicDayCount, getHijriDate } from '../utils/hijri';
import { defaultMuezzins, getCustomAudios, getAudioUrl, getAudioUrlSync, archiveMuezzins, downloadAndSaveAudio, deleteDownloadedAudio, getDownloadedTrackIds, getAudioStorageStats } from '../utils/audioStorage';
import ToggleSwitch from './ui/ToggleSwitch';
import BackupSettingsTab from './settings/BackupSettingsTab';
import DashboardSectionsTab from './settings/DashboardSectionsTab';
import ThemeSettingsTab from './settings/ThemeSettingsTab';
import LocationSettingsTab from './settings/LocationSettingsTab';
import QadaSettingsTab from './settings/QadaSettingsTab';
import { safeSetItem } from '../utils/storage';
import { formatDateKey } from '../utils/prayerDayBoundary';

interface MoreSettingsProps {
  subTab: SettingsSubTabId;
  setSubTab: React.Dispatch<React.SetStateAction<SettingsSubTabId>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
  ramadanQada: RamadanQadaTracker;
  setRamadanQada: React.Dispatch<React.SetStateAction<RamadanQadaTracker>>;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  voluntaryPrayerLogs?: any[];
  setVoluntaryPrayerLogs?: React.Dispatch<React.SetStateAction<any[]>>;
  fastingLogs: Record<string, { date: string; fasted: boolean; fastType: string }>;
  setFastingLogs: React.Dispatch<React.SetStateAction<Record<string, { date: string; fasted: boolean; fastType: string }>>>;
  quranSessions: QuranSession[];
  setQuranSessions: React.Dispatch<React.SetStateAction<QuranSession[]>>;
  khatmat: QuranKhatma[];
  setKhatmat: React.Dispatch<React.SetStateAction<QuranKhatma[]>>;
  dhikrLogs?: Record<string, Record<string, number>>;
  setDhikrLogs?: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  customDuas: CustomDua[];
  setCustomDuas: React.Dispatch<React.SetStateAction<CustomDua[]>>;
}

export default function MoreSettings({
  subTab,
  setSubTab,
  settings,
  setSettings,
  pendingQadaPrayers,
  setPendingQadaPrayers,
  ramadanQada,
  setRamadanQada,
  prayerLogs,
  setPrayerLogs,
  voluntaryPrayerLogs,
  setVoluntaryPrayerLogs,
  fastingLogs,
  setFastingLogs,
  quranSessions,
  setQuranSessions,
  khatmat,
  setKhatmat,
  dhikrLogs,
  setDhikrLogs,
  customDuas,
  setCustomDuas
}: MoreSettingsProps) {
  
  const [appModal, setAppModal] = useState<{ message: string; variant: AppModalVariant } | null>(null);

  // Audio Testing States & Refs
  const [playingAudio, setPlayingAudio] = useState<{ id: string; url: string; name: string; isFajr: boolean } | null>(null);
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [fajrMuezzin, setFajrMuezzin] = useState(() => localStorage.getItem('salah_fajr_muezzin') || 'fajr_yusuf');
  const [generalMuezzin, setGeneralMuezzin] = useState(() => localStorage.getItem('salah_general_muezzin') || 'makkah');
  const [audioVolume, setAudioVolume] = useState(() => {
    const saved = localStorage.getItem('salah_audio_volume');
    return saved ? parseFloat(saved) : 0.8;
  });
  const [autoPlayAthan, setAutoPlayAthan] = useState(() => localStorage.getItem('salah_auto_play_athan') !== 'false');

  useEffect(() => {
    safeSetItem('salah_fajr_muezzin', fajrMuezzin);
  }, [fajrMuezzin]);

  useEffect(() => {
    safeSetItem('salah_general_muezzin', generalMuezzin);
  }, [generalMuezzin]);

  useEffect(() => {
    safeSetItem('salah_audio_volume', audioVolume.toString());
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
    }
  }, [audioVolume]);

  useEffect(() => {
    safeSetItem('salah_auto_play_athan', autoPlayAthan ? 'true' : 'false');
  }, [autoPlayAthan]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const [customMuezzins, setCustomMuezzins] = useState<MuezzinOption[]>([]);
  const [showArchiveFajr, setShowArchiveFajr] = useState(false);
  const [showArchiveGeneral, setShowArchiveGeneral] = useState(false);
  const [fajrSearch, setFajrSearch] = useState('');
  const [generalSearch, setGeneralSearch] = useState('');
  const [downloadedTrackIds, setDownloadedTrackIds] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [audioSuccessMessage, setAudioSuccessMessage] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState<{ count: number; totalMB: string }>({ count: 0, totalMB: '0.0' });
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  const refreshStorageData = () => {
    getDownloadedTrackIds().then(setDownloadedTrackIds).catch(console.error);
    getAudioStorageStats().then(setStorageStats).catch(console.error);
  };

  useEffect(() => {
    getCustomAudios().then(tracks => {
      setCustomMuezzins(tracks as MuezzinOption[]);
    }).catch(err => {
      console.error('Failed to load custom muezzins in Settings:', err);
    });
    refreshStorageData();
  }, []);

  const handleDownloadTrack = async (track: MuezzinOption) => {
    setDownloadingId(track.id);
    setAudioError(null);
    setAudioSuccessMessage(null);
    try {
      await downloadAndSaveAudio(track as any);
      refreshStorageData();
      setAudioSuccessMessage(`تم تحميل وتخزين "${track.name}" بنجاح للعمل أوفلاين بدون إنترنت!`);
    } catch (err) {
      console.error('Download failed:', err);
      const errMsg = err instanceof Error ? err.message : 'خطأ في الشبكة';
      setAudioError('فشل تحميل الصوت أوفلاين: ' + errMsg);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteDownloadedTrack = async (trackId: string) => {
    try {
      await deleteDownloadedAudio(trackId);
      refreshStorageData();
      setAudioSuccessMessage('تم حذف النسخة المحفوظة أوفلاين بنجاح.');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleBatchDownloadDefaults = async () => {
    setIsBulkDownloading(true);
    setAudioError(null);
    setAudioSuccessMessage(null);
    try {
      const toDownload = defaultMuezzins.filter(m => !downloadedTrackIds.has(m.id));
      if (toDownload.length === 0) {
        setAudioSuccessMessage('جميع الأذانات الأساسية محفوظة أوفلاين بالفعل! ⚡');
        setIsBulkDownloading(false);
        return;
      }
      setBulkProgress({ current: 0, total: toDownload.length });
      let downloadedCount = 0;
      for (let i = 0; i < toDownload.length; i++) {
        try {
          await downloadAndSaveAudio(toDownload[i]);
          downloadedCount++;
        } catch (e) {
          console.warn(`Failed to download ${toDownload[i].name}`, e);
        }
        setBulkProgress({ current: i + 1, total: toDownload.length });
      }
      refreshStorageData();
      setAudioSuccessMessage(`تم تحميل وتخزين ${downloadedCount} صوت أذان بنجاح للعمل أوفلاين! ⚡`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'خطأ في الاتصال';
      setAudioError('حدث خطأ أثناء التحميل: ' + errMsg);
    } finally {
      setIsBulkDownloading(false);
      setBulkProgress(null);
    }
  };

  const muezzins = [...defaultMuezzins, ...archiveMuezzins, ...customMuezzins];

  const togglePlayAudio = async (id: string, url: string) => {
    const muezzin = muezzins.find(m => m.id === id);
    const name = muezzin ? muezzin.name : 'أذان مخصص';
    const isFajr = muezzin ? muezzin.isFajr : false;

    setAudioError(null);

    if (playingAudio && playingAudio.id === id) {
      if (audioRef.current) {
        if (audioIsPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(e => {
            console.error("Error playing audio", e);
            setAudioError('فشل تشغيل الملف الصوتي. يرجى التأكد من أن صيغة الملف مدعومة وصالحة.');
          });
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      setPlayingAudio({ id, url, name, isFajr });
      setAudioCurrentTime(0);
      setAudioDuration(0);

      const playAudioTrack = (srcUrl: string, isFallback = false) => {
        let safeUrl = srcUrl;
        if (!safeUrl || typeof safeUrl !== 'string' || safeUrl.trim() === '' || safeUrl.startsWith('db://')) {
          safeUrl = isFajr
            ? 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/020--.mp3'
            : 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';
        }
        const audio = new Audio(safeUrl);
        audioRef.current = audio;
        audio.volume = audioVolume;
        audio.playbackRate = playbackSpeed;

        audio.addEventListener('play', () => {
          setAudioIsPlaying(true);
          setAudioError(null);
        });

        audio.addEventListener('pause', () => {
          setAudioIsPlaying(false);
        });

        audio.addEventListener('ended', () => {
          setAudioIsPlaying(false);
          setAudioCurrentTime(0);
        });

        audio.addEventListener('timeupdate', () => {
          setAudioCurrentTime(audio.currentTime);
        });

        audio.addEventListener('durationchange', () => {
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            setAudioDuration(audio.duration);
          }
        });

        audio.addEventListener('loadedmetadata', () => {
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            setAudioDuration(audio.duration);
          }
        });

        audio.addEventListener('error', () => {
          if (!isFallback) {
            const fallbackUrl = isFajr 
              ? 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/020--.mp3'
              : 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';
            playAudioTrack(fallbackUrl, true);
          } else {
            setAudioError('تعذر تشغيل الملف الصوتي.');
          }
        });

        audio.play().catch(e => {
          console.warn("Audio play error:", e);
          if (e.name === 'NotAllowedError') {
            setAudioError('⚠️ يرجى الضغط على زر التشغيل ▶ لبدء الصوت (بسبب قيود التشغيل التلقائي بالمتصفح).');
          } else if (!isFallback) {
            const fallbackUrl = isFajr 
              ? 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/020--.mp3'
              : 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';
            playAudioTrack(fallbackUrl, true);
          } else {
            setAudioError('تعذر تشغيل الملف الصوتي.');
          }
        });
      };

      getAudioUrl(url, id).then(resolvedUrl => {
        playAudioTrack(resolvedUrl, false);
      }).catch(err => {
        console.error('Failed to resolve settings audio:', err);
        const fallbackUrl = isFajr 
          ? 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/020--.mp3'
          : 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';
        playAudioTrack(fallbackUrl, true);
      });
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      let newTime = audioRef.current.currentTime + seconds;
      if (newTime < 0) newTime = 0;
      if (newTime > audioDuration) newTime = audioDuration;
      audioRef.current.currentTime = newTime;
      setAudioCurrentTime(newTime);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setAudioCurrentTime(time);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingAudio(null);
    setAudioIsPlaying(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setAudioError(null);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Individual manual prayer offsets updater
  const handleUpdateOffset = (prayer: PrayerName | 'Sunrise', amount: number) => {
    const currentOffsets = settings.prayerOffsets || {
      Fajr: 0,
      Sunrise: 0,
      Dhuhr: 0,
      Asr: 0,
      Maghrib: 0,
      Isha: 0
    };
    const updatedOffsets = {
      ...currentOffsets,
      [prayer]: (currentOffsets[prayer as PrayerName] || 0) + amount
    };
    setSettings(prev => ({
      ...prev,
      prayerOffsets: updatedOffsets
    }));
  };

  // Sound togglers
  const handleToggleAdhan = (prayer: PrayerName) => {
    setSettings(prev => ({
      ...prev,
      adhanEnabled: {
        ...prev.adhanEnabled,
        [prayer]: !prev.adhanEnabled[prayer]
      }
    }));
  };

  const todayHijri = getHijriDate(new Date(), settings.hijriOffset);

  return (
    <div id="settings-root" className="space-y-6 text-end animate-fade-in w-full" dir="rtl">
      
      {/* ==================== 1. PRAYER CALCULATIONS & MADHAB ==================== */}
      {subTab === 'prayer' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-black text-slate-800 dark:text-white">إعدادات الصلاة والمذهب</h2>
          </div>

          {/* Calc Method and Madhab Cards */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-5 transition-colors duration-300 shadow-sm">
            
            {/* Calculation Method Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">طريقة الحساب الرياضي للمواقيت</label>
              <select
                value={settings.calcMethod}
                onChange={(e) => setSettings(prev => ({ ...prev, calcMethod: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-[#111720] border border-[#e2e8f0]/85 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Egypt">الهيئة المصرية العامة للمساحة</option>
                <option value="UmmAlQura">جامعة أم القرى (مكة المكرمة)</option>
                <option value="MWL">رابطة العالم الإسلامي</option>
                <option value="ISNA">الجمعية الإسلامية لأمريكا الشمالية (ISNA)</option>
                <option value="Karachi">جامعة العلوم الإسلامية بكراتشي</option>
                <option value="Tehran">معهد الجيوفيزياء بجامعة طهران</option>
                <option value="Gulf">منطقة الخليج العربي</option>
              </select>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">تغيير طريقة الحساب يؤثر على أوقات الفجر والظهر والعشاء تلقائياً بناءً على الموقع.</p>
            </div>

            {/* Asr Madhab Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">مذهب صلاة العصر</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'standard', title: 'الجمهور', desc: 'الشافعي، المالكي، الحنبلي' },
                  { id: 'hanafi', title: 'المذهب الحنفي', desc: 'عند مثل الظل الثاني للشيء' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSettings(prev => ({ ...prev, madhab: item.id as AppSettings['madhab'] }))}
                    className={`p-3.5 rounded-2xl border text-end transition-all cursor-pointer flex flex-col justify-between ${
                      settings.madhab === item.id
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/25 text-indigo-700 dark:text-indigo-350'
                        : 'border-[#e2e8f0] dark:border-slate-800 bg-slate-50/55 dark:bg-[#111720] text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-black">{item.title}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gender Selection Section */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/50">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">جنس ومستند المستخدم (لحساب الرخصة والعذر الشرعي)</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'male', title: 'ذكر 👨', desc: 'الحساب العادي للفرائض والسنن' },
                  { id: 'female', title: 'أنثى 👩', desc: 'يتيح تسجيل الأعذار الشرعية (الرخص)' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, gender: item.id as any }))}
                    className={`p-3.5 rounded-2xl border text-end transition-all cursor-pointer flex flex-col justify-between ${
                      (settings.gender || 'male') === item.id
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/25 text-indigo-700 dark:text-indigo-350 font-black'
                        : 'border-[#e2e8f0] dark:border-slate-800 bg-slate-50/55 dark:bg-[#111720] text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-black">{item.title}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">{item.desc}</span>
                  </button>
                ))}
              </div>
              
              {(settings.gender === 'female') && (
                <div className="p-3 bg-indigo-500/10 dark:bg-indigo-400/5 border border-indigo-500/20 rounded-2xl text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed font-semibold mt-2 animate-fade-in text-end">
                  ✨ <strong>رخصة العذر الشرعي مفعلة:</strong> لقد تم تفعيل وضع المرأة المسلمة. يتيح لكِ التطبيق الآن تسجيل صلواتكِ كـ «عذر شرعي رخصة» في لوحة التحكم أثناء أيام عذركِ الشرعي. لن تؤثر هذه الأيام بالسلب على نسب إتمام العبادات أو تهدم تتابع السلاسل الإيمانية الخاص بكِ تيسيراً ورفقاً بكِ 🤍.
                </div>
              )}
            </div>
          </div>

          {/* Manual Prayer Offsets Adjust */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-800 dark:text-white">التعديل اليدوي للمواقيت (بالدقائق)</h3>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
              إذا لاحظت اختلافاً بسيطاً عن التوقيت المحلي لمدينتك، يمكنك زيادة الدقائق أو إنقاصها لكل صلاة بشكل مستقل ليتطابق تماماً.
            </p>

            <div className="space-y-3 pt-2">
              {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as (PrayerName | 'Sunrise')[]).map((prayer) => {
                const arabicName = 
                  prayer === 'Fajr' ? 'الفجر' :
                  prayer === 'Sunrise' ? 'الشروق' :
                  prayer === 'Dhuhr' ? 'الظهر' :
                  prayer === 'Asr' ? 'العصر' :
                  prayer === 'Maghrib' ? 'المغرب' : 'العشاء';
                
                const val = (settings.prayerOffsets && settings.prayerOffsets[prayer as PrayerName]) || 0;

                return (
                  <div key={prayer} className="flex items-center justify-between p-3 bg-slate-50/60 dark:bg-[#111720]/75 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-250">{arabicName}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdateOffset(prayer, -1)}
                        className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-sm flex items-center justify-center cursor-pointer transition-all"
                      >
                        -
                      </button>
                      <span className={`text-xs font-black min-w-10 text-center ${val > 0 ? 'text-emerald-600 dark:text-emerald-400' : val < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                        {val > 0 ? `+${toArabicNumbers(val)}` : val === 0 ? '٠' : toArabicNumbers(val)} د
                      </span>
                      <button
                        onClick={() => handleUpdateOffset(prayer, 1)}
                        className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-sm flex items-center justify-center cursor-pointer transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* ==================== 2. ATHAN SOUND & MUEZZINS ==================== */}
      {subTab === 'adhan' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-black text-slate-800 dark:text-white">إصدار الأذان وأصوات المؤذنين</h2>
          </div>

          {/* Premium Interactive Audio Player / Scrubber */}
          {playingAudio && (
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-[#131b26] dark:to-[#17212f] rounded-2xl border border-indigo-100 dark:border-indigo-950/50 space-y-3 shadow-md text-end transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 ${audioIsPlaying ? '' : 'hidden'}`}></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span>مشغل الصوت التفاعلي للتحكم والتحقق</span>
                </div>
                <button 
                  onClick={handleStopAudio}
                  className="text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                  title="إغلاق المشغل"
                >
                  إغلاق ×
                </button>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight">
                  {playingAudio.name}
                </h4>
                {playingAudio.isFajr && (
                  <p className="text-[11px] text-indigo-600/90 dark:text-indigo-400/90 font-medium">
                    ✨ هذا الأذان مخصص لصلاة الفجر، يمكنك التقديم والتحقق من عبارة "الصلاة خير من النوم".
                  </p>
                )}
                {audioError && (
                  <p className="text-[11px] text-rose-500 font-bold bg-rose-50/50 dark:bg-rose-950/10 p-2 rounded-lg border border-rose-100 dark:border-rose-950/20">
                    ⚠️ {audioError}
                  </p>
                )}
                {audioSuccessMessage && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/10 p-2 rounded-lg border border-emerald-100 dark:border-emerald-950/20">
                    ✅ {audioSuccessMessage}
                  </p>
                )}
              </div>

              {/* Scrubber / Timeline Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={audioDuration || 100}
                  step="0.1"
                  value={audioCurrentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  <span>{toArabicNumbers(formatTime(audioCurrentTime))}</span>
                  <span>{toArabicNumbers(formatTime(audioDuration))}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                {/* Navigation Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSkip(-10)}
                    className="py-1.5 px-2.5 rounded-xl bg-white dark:bg-[#1c2635] border border-slate-150 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95 text-xs font-bold"
                    title="تراجع ١٠ ثوانٍ"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>١٠ث -</span>
                  </button>
                  
                  <button
                    onClick={() => togglePlayAudio(playingAudio.id, playingAudio.url)}
                    className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-200 dark:shadow-none animate-pulse-slow"
                    title={audioIsPlaying ? "إيقاف مؤقت" : "تشغيل"}
                  >
                    {audioIsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleSkip(10)}
                    className="py-1.5 px-2.5 rounded-xl bg-white dark:bg-[#1c2635] border border-slate-150 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95 text-xs font-bold"
                    title="تقدم ١٠ ثوانٍ"
                  >
                    <span>١٠ث +</span>
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Speed Rates */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#10161f] p-0.5 rounded-lg border border-slate-150 dark:border-slate-800/50">
                  {[1.0, 1.25, 1.5, 2.0].map((speed) => {
                    const isActive = playbackSpeed === speed;
                    return (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {speed === 1.0 ? 'طبيعي' : `${speed}x`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium bg-white/40 dark:bg-black/15 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-800/20">
                💡 **تلميح:** يمكنك السحب على شريط الوقت للتقديم والتأخير، أو زيادة السرعة (مثل 1.5x) لتسريع الفحص للتأكد من وجود جملة "الصلاة خير من النوم" في الأذان المختار.
              </div>
            </div>
          )}

          {/* Unified Muezzins Selection with Play Test Controls */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-3">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">المؤذنون الافتراضيون</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">معاينة الصوت فورية</span>
            </div>

            {/* Offline Storage Dashboard & Batch Download */}
            <div className="p-3.5 bg-gradient-to-r from-indigo-900/10 via-slate-900/5 to-emerald-900/10 dark:from-indigo-950/30 dark:via-slate-900/30 dark:to-emerald-950/30 rounded-2xl border border-indigo-200/40 dark:border-indigo-800/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700 dark:text-indigo-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>إدارة التخزين المحلي (أوفلاين)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                    تم حفظ <strong className="text-emerald-600 dark:text-emerald-400">{toArabicNumbers(storageStats.count)}</strong> أصوات محلياً ({toArabicNumbers(storageStats.totalMB)} ميجابايت). تعمل بدون إنترنت!
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleBatchDownloadDefaults}
                  disabled={isBulkDownloading}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="تحميل جميع الأصوات الافتراضية دفعة واحدة للعمل بدون اتصال"
                >
                  {isBulkDownloading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جارٍ التحميل ({toArabicNumbers(bulkProgress?.current || 0)}/{toArabicNumbers(bulkProgress?.total || 0)})...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>⚡ تحميل كافة الأساسية أوفلاين</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-1.5">
                <span className="text-amber-500 font-bold">💡 ملاحظة ذكية:</span>
                <span>عند تشغيل أي أذان وأنت أونلاين، يتم حفظه تلقائياً أوفلاين بالخلفية ليكون جاهزاً دائماً بدون إنترنت!</span>
              </div>
            </div>

            {/* General Volume Control */}
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-[#111720] rounded-2xl border border-slate-100 dark:border-slate-800/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  {audioVolume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : audioVolume < 0.5 ? <Volume1 className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-indigo-500" />}
                  شدة ومستوى صوت الأذان
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  {toArabicNumbers(Math.round(audioVolume * 100))}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioVolume}
                onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Auto Play Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#111720] rounded-2xl border border-slate-100 dark:border-slate-800/45 gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 block">الأذان التلقائي فور دخول الوقت</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">تشغيل صوت الأذان كاملاً في المتصفح فور حلول وقت الفريضة.</span>
              </div>
              <ToggleSwitch
                checked={autoPlayAthan}
                onChange={(checked) => setAutoPlayAthan(checked)}
                activeColor="bg-indigo-600"
              />
            </div>

            {/* Reliable Background Athans Control & Privacy Badge */}
            <div className="p-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-emerald-500/10 dark:from-indigo-950/30 dark:to-slate-900 rounded-2xl border border-indigo-500/20 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                      🔔 تنبيهات الأذان والمواقيت في الخلفية
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      ⚡ 30 يوم جاهزة
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    يتم تحضير مواقيت الـ 30 يومًا القادمة آليًا في خلفية جهازك لضمان تنبيهك بدقة حتى لو كان المتصفح مغلقًا.
                  </p>
                </div>
              </div>

              {/* Privacy Badge Banner */}
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                <span className="text-sm shrink-0">🔒</span>
                <span>
                  <strong>خصوصية تامة:</strong> مواقيت صلواتك تُحسب بالكامل محليًا على جهازك، وتُحفظ كرموز زمنية مجردة (UTC) دون مشاركة إحداثيات موقعك الجغرافي.
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  حالة إذن الإشعارات: {
                    typeof window !== 'undefined' && 'Notification' in window
                      ? Notification.permission === 'granted'
                        ? '✅ مُفعلة ومُصرح بها'
                        : Notification.permission === 'denied'
                        ? '❌ محظورة من إعدادات المتصفح'
                        : '⚠️ بانتظار الإذن'
                      : 'غير مدعوم'
                  }
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    if (typeof window !== 'undefined' && 'Notification' in window) {
                      const res = await Notification.requestPermission();
                      if (res === 'granted') {
                        setAppModal({ message: 'تم تفعيل إذن الإشعارات بنجاح! سيصلك تنبيه دخول وقت الصلاة في موعده.', variant: 'success' });
                      } else if (res === 'denied') {
                        setAppModal({ message: 'تم رفض الإذن. يرجى السماح بالإشعارات من إعدادات المتصفح/الموقع.', variant: 'error' });
                      }
                    } else {
                      setAppModal({ message: 'المتصفح لا يدعم إشعارات النظام.', variant: 'info' });
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  تفعيل الإشعارات
                </button>
              </div>
            </div>

            {/* Default Fajr Muezzin */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/40 text-end">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">صوت أذان الفجر (الخاص بالتثويب)</label>
              <div className="space-y-2">
                {muezzins.filter(m => m.isFajr && !m.id.startsWith('archive_')).map((m) => {
                  const isSelected = fajrMuezzin === m.id;
                  const isDownloaded = downloadedTrackIds.has(m.id) || m.id.startsWith('custom_');
                  const isDownloading = downloadingId === m.id;
                  const isPlaying = playingAudio?.id === m.id && audioIsPlaying;
                  return (
                    <div 
                      key={m.id}
                      onClick={() => setFajrMuezzin(m.id)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20' 
                          : 'border-slate-150 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-[#111720]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">{m.name}</span>
                        {isDownloaded ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">⚡ أوفلاين</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">🌐 أونلاين</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        {isDownloaded ? (
                          <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 px-2 py-1 rounded-lg text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="hidden sm:inline">محفوظ أوفلاين</span>
                            {!m.id.startsWith('custom_') && (
                              <button
                                onClick={() => handleDeleteDownloadedTrack(m.id)}
                                className="p-0.5 hover:text-rose-500 transition-colors ms-1 cursor-pointer"
                                title="حذف النسخة المحفوظة أوفلاين"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDownloadTrack(m)}
                            disabled={isDownloading}
                            className="flex items-center gap-1 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                            title="تحميل الأذان لحفظه والعمل أوفلاين بدون إنترنت"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            <span className="hidden sm:inline">{isDownloading ? 'جارٍ الحفظ...' : 'تحميل أوفلاين'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => togglePlayAudio(m.id, m.url)}
                          className={`p-1.5 rounded-lg text-white transition-colors cursor-pointer ${isPlaying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                          title="اختبر صوت المؤذن"
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Expandable Section for Archive Fajr */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowArchiveFajr(!showArchiveFajr)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-[#111720] transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {showArchiveFajr ? 'إخفاء أصوات أذان الفجر الإضافية' : 'عرض أصوات أذان الفجر الإضافية (٣٠ صوتاً من المكتبة الشاملة)'}
                  </span>
                  {showArchiveFajr ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {showArchiveFajr && (
                  <div className="mt-3 space-y-3 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                    {/* Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="البحث عن مؤذن للفجر..."
                        value={fajrSearch}
                        onChange={(e) => setFajrSearch(e.target.value)}
                        className="w-full p-2.5 pe-10 ps-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111720] text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-all text-end"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute end-3 top-3.5" />
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-2 pe-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                      {muezzins
                        .filter(m => m.isFajr && m.id.startsWith('archive_') && m.name.toLowerCase().includes(fajrSearch.toLowerCase()))
                        .map((m) => {
                          const isSelected = fajrMuezzin === m.id;
                          const isDownloaded = downloadedTrackIds.has(m.id);
                          const isDownloading = downloadingId === m.id;
                          const isPlaying = playingAudio?.id === m.id && audioIsPlaying;
                          return (
                            <div 
                              key={m.id}
                              onClick={() => setFajrMuezzin(m.id)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-end ${
                                isSelected 
                                  ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10' 
                                  : 'border-slate-100 dark:border-slate-800/40 bg-white dark:bg-[#161d26] hover:bg-slate-50 dark:hover:bg-[#111720]/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isSelected && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{m.name}</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                {isDownloaded ? (
                                  <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    <button
                                      onClick={() => handleDeleteDownloadedTrack(m.id)}
                                      className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer"
                                      title="حذف النسخة المحفوظة"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleDownloadTrack(m)}
                                    disabled={isDownloading}
                                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 hover:text-indigo-600 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                                    title="تحميل للعمل أوفلاين"
                                  >
                                    {isDownloading ? <Loader2 className="w-3 h-3 animate-spin text-indigo-500" /> : <Download className="w-3 h-3" />}
                                  </button>
                                )}
                                <button
                                  onClick={() => togglePlayAudio(m.id, m.url)}
                                  className={`p-1 rounded-lg text-white transition-colors cursor-pointer ${isPlaying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                  title="اختبر صوت المؤذن"
                                >
                                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Default General Muezzin */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/40 text-end">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">صوت بقية الصلوات (المساجد الشهيرة)</label>
              <div className="space-y-2">
                {muezzins.filter(m => !m.isFajr && !m.id.startsWith('archive_')).map((m) => {
                  const isSelected = generalMuezzin === m.id;
                  const isDownloaded = downloadedTrackIds.has(m.id) || m.id.startsWith('custom_');
                  const isDownloading = downloadingId === m.id;
                  const isPlaying = playingAudio?.id === m.id && audioIsPlaying;
                  return (
                    <div 
                      key={m.id}
                      onClick={() => setGeneralMuezzin(m.id)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20' 
                          : 'border-slate-150 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-[#111720]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">{m.name}</span>
                        {isDownloaded ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">⚡ أوفلاين</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">🌐 أونلاين</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        {isDownloaded ? (
                          <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 px-2 py-1 rounded-lg text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="hidden sm:inline">محفوظ أوفلاين</span>
                            {!m.id.startsWith('custom_') && (
                              <button
                                onClick={() => handleDeleteDownloadedTrack(m.id)}
                                className="p-0.5 hover:text-rose-500 transition-colors ms-1 cursor-pointer"
                                title="حذف النسخة المحفوظة أوفلاين"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDownloadTrack(m)}
                            disabled={isDownloading}
                            className="flex items-center gap-1 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                            title="تحميل الأذان لحفظه والعمل أوفلاين بدون إنترنت"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            <span className="hidden sm:inline">{isDownloading ? 'جارٍ الحفظ...' : 'تحميل أوفلاين'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => togglePlayAudio(m.id, m.url)}
                          className={`p-1.5 rounded-lg text-white transition-colors cursor-pointer ${isPlaying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                          title="اختبر صوت المؤذن"
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Expandable Section for Archive General */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowArchiveGeneral(!showArchiveGeneral)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-[#111720] transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {showArchiveGeneral ? 'إخفاء أصوات الصلوات الإضافية' : 'عرض أصوات الصلوات الإضافية (٦٠ صوتاً من المكتبة الشاملة)'}
                  </span>
                  {showArchiveGeneral ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {showArchiveGeneral && (
                  <div className="mt-3 space-y-3 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                    {/* Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="البحث عن مؤذن..."
                        value={generalSearch}
                        onChange={(e) => setGeneralSearch(e.target.value)}
                        className="w-full p-2.5 pe-10 ps-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111720] text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-all text-end"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute end-3 top-3.5" />
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-2 pe-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                      {muezzins
                        .filter(m => !m.isFajr && m.id.startsWith('archive_') && m.name.toLowerCase().includes(generalSearch.toLowerCase()))
                        .map((m) => {
                          const isSelected = generalMuezzin === m.id;
                          const isDownloaded = downloadedTrackIds.has(m.id);
                          const isDownloading = downloadingId === m.id;
                          const isPlaying = playingAudio?.id === m.id && audioIsPlaying;
                          return (
                            <div 
                              key={m.id}
                              onClick={() => setGeneralMuezzin(m.id)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-end ${
                                isSelected 
                                  ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10' 
                                  : 'border-slate-100 dark:border-slate-800/40 bg-white dark:bg-[#161d26] hover:bg-slate-50 dark:hover:bg-[#111720]/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isSelected && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{m.name}</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                {isDownloaded ? (
                                  <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    <button
                                      onClick={() => handleDeleteDownloadedTrack(m.id)}
                                      className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer"
                                      title="حذف النسخة المحفوظة"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleDownloadTrack(m)}
                                    disabled={isDownloading}
                                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 hover:text-indigo-600 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                                    title="تحميل للعمل أوفلاين"
                                  >
                                    {isDownloading ? <Loader2 className="w-3 h-3 animate-spin text-indigo-500" /> : <Download className="w-3 h-3" />}
                                  </button>
                                )}
                                <button
                                  onClick={() => togglePlayAudio(m.id, m.url)}
                                  className={`p-1 rounded-lg text-white transition-colors cursor-pointer ${isPlaying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                  title="اختبر صوت المؤذن"
                                >
                                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Individual Prayer Notification Toggles */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white">تفعيل صوت التنبيه للصلوات الفردية</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
              يمكنك كتم الأذان لبعض الفرائض وتشغيلها لفرائض أخرى (مثال: تشغيله للفجر والمغرب فقط).
            </p>

            <div className="space-y-3 pt-2">
              {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as PrayerName[]).map((prayer) => {
                const arabicName = 
                  prayer === 'Fajr' ? 'صلاة الفجر والصبح' :
                  prayer === 'Sunrise' ? 'تنبيه شروق الشمس' :
                  prayer === 'Dhuhr' ? 'صلاة الظهر وعصر الجمعة' :
                  prayer === 'Asr' ? 'صلاة العصر والوسطى' :
                  prayer === 'Maghrib' ? 'صلاة المغرب والغروب' : 'صلاة العشاء والقيام';

                const isEnabled = settings.adhanEnabled[prayer];

                return (
                  <div key={prayer} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#111720] rounded-2xl border border-slate-100 dark:border-slate-800/40 gap-3">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-250">{arabicName}</span>
                    <ToggleSwitch
                      checked={isEnabled}
                      onChange={() => handleToggleAdhan(prayer)}
                      activeColor="bg-emerald-500"
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* ==================== 3. HIJRI CALENDAR ADJUST ==================== */}
      {subTab === 'calendar' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-black text-slate-800 dark:text-white">ضبط وتعديل التقويم الهجري</h2>
          </div>

          {/* Premium Calligraphy Date Card */}
          <div className="bg-radial from-indigo-500 to-indigo-750 dark:from-indigo-900/60 dark:to-slate-900 text-white rounded-3xl p-6 text-center space-y-4 shadow-md border border-indigo-100/10 transition-colors">
            <Sparkles className="w-8 h-8 text-amber-300 mx-auto animate-pulse" />
            <div className="space-y-1">
              <span className="text-[10px] tracking-widest text-indigo-200 font-bold uppercase block">التاريخ الهجري لليوم</span>
              <h3 className="text-xl font-extrabold text-amber-200 tracking-wide font-sans">{todayHijri.fullString}</h3>
              <p className="text-[10px] text-indigo-100/80 font-medium leading-relaxed">
                يتم حساب اليوم استناداً لتقويم أم القرى / الحساب الفلكي القياسي، ويمكنك تعديله بحسب رؤية الهلال المحلية في بلدك:
              </p>
            </div>
          </div>

          {/* Hijri Adjustment Selector */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white">تعديل التاريخ الهجري (رؤية الهلال)</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
              اختر الفارق بالأيام إذا ثبتت رؤية الهلال في بلدك بخلاف التحديد الفلكي:
            </p>

            <div className="grid grid-cols-5 gap-2 pt-1">
              {[-2, -1, 0, 1, 2].map((off) => (
                <button
                  key={off}
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, hijriOffset: off }))}
                  className={`py-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                    settings.hijriOffset === off
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-105'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                  }`}
                >
                  {off === 0 ? 'قياسي (٠)' : off > 0 ? `+${toArabicNumbers(off)} يوم` : `${toArabicNumbers(off)} يوم`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 5. QADA & MISSED LOGS ==================== */}
      {subTab === 'qada' && (
        <QadaSettingsTab
          ramadanQada={ramadanQada}
          setRamadanQada={setRamadanQada}
          setFastingLogs={setFastingLogs}
          pendingQadaPrayers={pendingQadaPrayers}
          setPendingQadaPrayers={setPendingQadaPrayers}
          setAppModal={setAppModal}
        />
      )}

      {/* ==================== 6. CUSTOM DUAS ==================== */}
      {subTab === 'duas' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-black text-slate-800 dark:text-white">الأدعية المخصصة المحفوظة</h2>
          </div>

          {/* Add Custom Dua Form */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white">حفظ دعاء مخصص وجديد</h3>
            
            <div className="space-y-3">
              <textarea
                id="new-dua-textarea"
                rows={3}
                placeholder="اكتب دعاءك هنا بصدق وإخلاص (مثال: اللهم آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار)..."
                className="w-full bg-slate-50 dark:bg-[#111720] border border-[#e2e8f0]/85 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-2xl p-4 text-xs font-bold leading-relaxed outline-hidden focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 dark:text-slate-400">
                  <input
                    type="checkbox"
                    id="new-dua-show-home"
                    defaultChecked
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>عرض هذا الدعاء في الشاشة الرئيسية</span>
                </label>

                <button
                  onClick={() => {
                    const txtEl = document.getElementById('new-dua-textarea') as HTMLTextAreaElement;
                    const checkEl = document.getElementById('new-dua-show-home') as HTMLInputElement;
                    if (txtEl && txtEl.value.trim()) {
                      const newDua: CustomDua = {
                        id: crypto.randomUUID(),
                        text: txtEl.value.trim(),
                        showOnHome: checkEl ? checkEl.checked : true,
                        order: customDuas.length
                      };
                      setCustomDuas(prev => [...prev, newDua]);
                      txtEl.value = '';
                    }
                  }}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  حفظ الدعاء
                </button>
              </div>
            </div>
          </div>

          {/* List of Custom Duas */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white">أدعيتك المخصصة والخاصة</h3>
            
            {customDuas.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6 font-semibold">
                لا يوجد أي دعاء مخصص حتى الآن. أضف دعاءك الأول المبارك بالأعلى!
              </p>
            ) : (
              <div className="space-y-3">
                {customDuas.map((dua) => (
                  <div 
                    key={dua.id} 
                    className="p-4 bg-slate-50 dark:bg-[#111720] rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-3"
                  >
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line text-end font-sans">
                      {dua.text}
                    </p>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/30 pt-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 dark:text-slate-400 font-bold">
                        <input
                          type="checkbox"
                          checked={dua.showOnHome}
                          onChange={(e) => {
                            setCustomDuas(prev => prev.map(d => d.id === dua.id ? { ...d, showOnHome: e.target.checked } : d));
                          }}
                          className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>عرض على لوحة التحكم</span>
                      </label>

                      <button
                        onClick={() => {
                          setCustomDuas(prev => prev.filter(d => d.id !== dua.id));
                        }}
                        className="text-rose-500 hover:text-rose-600 dark:text-rose-450 dark:hover:text-rose-350 font-black flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* ==================== 7. DATA BACKUP & RESTORE ==================== */}
      {subTab === 'backup' && (
        <BackupSettingsTab
          settings={settings}
          setSettings={setSettings}
          prayerLogs={prayerLogs}
          setPrayerLogs={setPrayerLogs}
          pendingQadaPrayers={pendingQadaPrayers}
          setPendingQadaPrayers={setPendingQadaPrayers}
          voluntaryPrayerLogs={voluntaryPrayerLogs}
          setVoluntaryPrayerLogs={setVoluntaryPrayerLogs}
          fastingLogs={fastingLogs}
          setFastingLogs={setFastingLogs}
          ramadanQada={ramadanQada}
          setRamadanQada={setRamadanQada}
          quranSessions={quranSessions}
          setQuranSessions={setQuranSessions}
          khatmat={khatmat}
          setKhatmat={setKhatmat}
          dhikrLogs={dhikrLogs}
          setDhikrLogs={setDhikrLogs}
          customDuas={customDuas}
          setCustomDuas={setCustomDuas}
          fajrMuezzin={fajrMuezzin}
          setFajrMuezzin={setFajrMuezzin}
          generalMuezzin={generalMuezzin}
          setGeneralMuezzin={setGeneralMuezzin}
          audioVolume={audioVolume}
        />
      )}

      {/* ==================== 8. DASHBOARD SECTIONS CUSTOMIZATION ==================== */}
      {subTab === 'dashboard' && <DashboardSectionsTab />}

      {appModal && (
        <AppModal
          message={appModal.message}
          variant={appModal.variant}
          onClose={() => setAppModal(null)}
        />
      )}
    </div>
  );
}
