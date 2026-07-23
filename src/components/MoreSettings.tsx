/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { AppSettings, PendingQadaPrayer, RamadanQadaTracker, PrayerLog, PrayerName, CustomDua } from '../types';
import { POPULAR_CITIES } from '../utils/prayerCalc';
import { toArabicNumbers, formatArabicDayCount, getHijriDate } from '../utils/hijri';
import { defaultMuezzins, getCustomAudios, getAudioUrl, getAudioUrlSync, archiveMuezzins, downloadAndSaveAudio, deleteDownloadedAudio, getDownloadedTrackIds, getAudioStorageStats } from '../utils/audioStorage';

interface MoreSettingsProps {
  subTab: 'qada' | 'prayer' | 'adhan' | 'calendar' | 'theme' | 'backup' | 'duas';
  setSubTab: React.Dispatch<React.SetStateAction<'qada' | 'prayer' | 'adhan' | 'calendar' | 'theme' | 'backup' | 'duas'>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
  ramadanQada: RamadanQadaTracker;
  setRamadanQada: React.Dispatch<React.SetStateAction<RamadanQadaTracker>>;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  fastingLogs: Record<string, { date: string; fasted: boolean; fastType: string }>;
  setFastingLogs: React.Dispatch<React.SetStateAction<Record<string, { date: string; fasted: boolean; fastType: string }>>>;
  quranSessions: any[];
  setQuranSessions: React.Dispatch<React.SetStateAction<any[]>>;
  khatmat: any[];
  setKhatmat: React.Dispatch<React.SetStateAction<any[]>>;
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
  fastingLogs,
  setFastingLogs,
  quranSessions,
  setQuranSessions,
  khatmat,
  setKhatmat,
  customDuas,
  setCustomDuas
}: MoreSettingsProps) {
  
  const [backupText, setBackupText] = useState('');
  const [importText, setImportText] = useState('');
  const [showImportResult, setShowImportResult] = useState('');

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
    localStorage.setItem('salah_fajr_muezzin', fajrMuezzin);
  }, [fajrMuezzin]);

  useEffect(() => {
    localStorage.setItem('salah_general_muezzin', generalMuezzin);
  }, [generalMuezzin]);

  useEffect(() => {
    localStorage.setItem('salah_audio_volume', audioVolume.toString());
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
    }
  }, [audioVolume]);

  useEffect(() => {
    localStorage.setItem('salah_auto_play_athan', autoPlayAthan ? 'true' : 'false');
  }, [autoPlayAthan]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const [customMuezzins, setCustomMuezzins] = useState<any[]>([]);
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
      setCustomMuezzins(tracks);
    }).catch(err => {
      console.error('Failed to load custom muezzins in Settings:', err);
    });
    refreshStorageData();
  }, []);

  const handleDownloadTrack = async (track: any) => {
    setDownloadingId(track.id);
    setAudioError(null);
    setAudioSuccessMessage(null);
    try {
      await downloadAndSaveAudio(track);
      refreshStorageData();
      setAudioSuccessMessage(`تم تحميل وتخزين "${track.name}" بنجاح للعمل أوفلاين بدون إنترنت!`);
    } catch (err: any) {
      console.error('Download failed:', err);
      setAudioError('فشل تحميل الصوت أوفلاين: ' + (err.message || 'خطأ في الشبكة'));
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
    } catch (err: any) {
      setAudioError('حدث خطأ أثناء التحميل: ' + (err.message || 'خطأ في الاتصال'));
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
        const audio = new Audio(srcUrl);
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

  // Manual fast Qada adding
  const handleAddRamadanQadaDays = (num: number) => {
    setRamadanQada(prev => ({
      ...prev,
      daysOwed: Math.max(0, prev.daysOwed + num)
    }));
  };

  const handleCompleteRamadanQadaDay = () => {
    if (ramadanQada.daysOwed > 0) {
      setRamadanQada(prev => ({
        ...prev,
        daysOwed: prev.daysOwed - 1,
        daysCompleted: prev.daysCompleted + 1
      }));
      
      const todayStr = new Date().toISOString().split('T')[0];
      setFastingLogs(prev => ({
        ...prev,
        [todayStr]: {
          date: todayStr,
          fasted: true,
          fastType: 'Qada'
        }
      }));
      alert('بشرى! تم قضاء يوم واحد وتسجيله في صيام اليوم المبارك. تقبل الله منك 🤍');
    }
  };

  const handleToggleFidyaMode = () => {
    setRamadanQada(prev => ({
      ...prev,
      trackMode: prev.trackMode === 'fasting' ? 'fidya' : 'fasting'
    }));
  };

  const handleUpdateFidyaCompleted = (amount: number) => {
    setRamadanQada(prev => ({
      ...prev,
      fidyaCompleted: Math.max(0, (prev.fidyaCompleted || 0) + amount)
    }));
  };

  // Manual Prayer Qada log
  const handleRemoveQadaItem = (qadaId: string) => {
    setPendingQadaPrayers(prev => prev.filter(q => q.id !== qadaId));
    alert('تم تأدية الفريضة الفائتة بنجاح بفضل الله وتقبله 🤍');
  };

  const handleAddManualMissedPrayer = (prayerName: PrayerName) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newQada: PendingQadaPrayer = {
      id: crypto.randomUUID(),
      date: todayStr,
      hijriDate: 'يدوي',
      prayerName
    };
    setPendingQadaPrayers(prev => [...prev, newQada]);
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

  // Export state to JSON string
  const handleExportData = () => {
    const fullData = {
      settings,
      prayerLogs,
      pendingQadaPrayers,
      fastingLogs,
      ramadanQada,
      quranSessions,
      khatmat,
      version: '1.2',
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(fullData, null, 2);
    setBackupText(jsonStr);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muslim_companion_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import state from JSON
  const handleImportData = () => {
    try {
      if (!importText.trim()) {
        setShowImportResult('يرجى لصق نص النسخ الاحتياطي أولاً.');
        return;
      }
      const data = JSON.parse(importText);
      if (data.settings && data.prayerLogs) {
        setSettings(data.settings);
        setPrayerLogs(data.prayerLogs);
        if (data.pendingQadaPrayers) setPendingQadaPrayers(data.pendingQadaPrayers);
        if (data.fastingLogs) setFastingLogs(data.fastingLogs);
        if (data.ramadanQada) setRamadanQada(data.ramadanQada);
        if (data.quranSessions) setQuranSessions(data.quranSessions);
        if (data.khatmat) setKhatmat(data.khatmat);
        setShowImportResult('تمت استعادة البيانات بنجاح! تم تحديث السجلات والإعدادات بنجاح.');
        setImportText('');
      } else {
        setShowImportResult('الصيغة غير صحيحة. يرجى التأكد من نسخ النص الأصلي بالكامل.');
      }
    } catch (e) {
      setShowImportResult('فشل استيراد البيانات. تأكد من أن النص الملصق بصيغة JSON صالحة.');
    }
  };

  const todayHijri = getHijriDate(new Date(), settings.hijriOffset);

  return (
    <div id="settings-root" className="space-y-6 text-right animate-fade-in w-full" dir="rtl">
      
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
                    onClick={() => setSettings(prev => ({ ...prev, madhab: item.id as any }))}
                    className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
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
                    className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
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
                <div className="p-3 bg-indigo-500/10 dark:bg-indigo-400/5 border border-indigo-500/20 rounded-2xl text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed font-semibold mt-2 animate-fade-in text-right">
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
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-[#131b26] dark:to-[#17212f] rounded-2xl border border-indigo-100 dark:border-indigo-950/50 space-y-3 shadow-md text-right transition-all">
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
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#111720] rounded-2xl border border-slate-100 dark:border-slate-800/45">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 block">الأذان التلقائي فور دخول الوقت</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">تشغيل صوت الأذان كاملاً في المتصفح فور حلول وقت الفريضة.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPlayAthan}
                  onChange={(e) => setAutoPlayAthan(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-300 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:-right-4 after:content-[''] after:absolute after:top-1 after:right-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {/* Default Fajr Muezzin */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/40 text-right">
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
                                className="p-0.5 hover:text-rose-500 transition-colors ml-1 cursor-pointer"
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
                        className="w-full p-2.5 pr-10 pl-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111720] text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-all text-right"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
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
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-right ${
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
            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/40 text-right">
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
                                className="p-0.5 hover:text-rose-500 transition-colors ml-1 cursor-pointer"
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
                        className="w-full p-2.5 pr-10 pl-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111720] text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-all text-right"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
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
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-right ${
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
                  <div key={prayer} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#111720] rounded-2xl border border-slate-100 dark:border-slate-800/40">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-250">{arabicName}</span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleToggleAdhan(prayer)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:-right-3.5 after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                    </label>
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
              <p className="text-[10px] text-indigo-150 font-bold">
                الموافق: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Hijri Adjustment Slider */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white">التعديل اليدوي للتقويم الهجري</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
              نظراً لاختلاف رؤية الهلال والمطالع الشرعية في بعض الدول، يمكنك تعديل التاريخ الهجري بزيادة يومين أو إنقاصهما ليتوافق مع الرؤية المحلية في بلدك.
            </p>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#111720] rounded-2xl border border-slate-100 dark:border-slate-800/40">
              <span className="text-xs font-black text-slate-600 dark:text-slate-350">معيار الإزاحة والفرق</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, hijriOffset: Math.max(-2, prev.hijriOffset - 1) }))}
                  disabled={settings.hijriOffset === -2}
                  className="w-8 h-8 rounded-xl bg-slate-200 disabled:opacity-40 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-sm flex items-center justify-center cursor-pointer transition-all"
                >
                  -
                </button>
                <span className={`text-xs font-black min-w-16 text-center ${settings.hijriOffset > 0 ? 'text-emerald-600' : settings.hijriOffset < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                  {settings.hijriOffset > 0 ? `+${toArabicNumbers(settings.hijriOffset)} يوم` : settings.hijriOffset === 0 ? 'مطابق تماماً' : `${toArabicNumbers(settings.hijriOffset)} يوم`}
                </span>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, hijriOffset: Math.min(2, prev.hijriOffset + 1) }))}
                  disabled={settings.hijriOffset === 2}
                  className="w-8 h-8 rounded-xl bg-slate-200 disabled:opacity-40 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-sm flex items-center justify-center cursor-pointer transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ==================== 4. APP THEME & LOCATION ==================== */}
      {subTab === 'theme' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-black text-slate-800 dark:text-white">مظهر التطبيق والموقع الجغرافي</h2>
          </div>

          {/* Theme Selector */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white">مظهر وسمة واجهة التطبيق</h3>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', name: 'مضيء', icon: Sun },
                { id: 'dark', name: 'ليلي', icon: Moon },
                { id: 'system', name: 'تلقائي', icon: Monitor }
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = settings.theme === t.id || (!settings.theme && t.id === 'system');
                return (
                  <button
                    key={t.id}
                    onClick={() => setSettings(prev => ({ ...prev, theme: t.id as any }))}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 font-black text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-350'
                        : 'border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gender Selector */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
              <h3 className="text-sm font-black text-slate-800 dark:text-white">تحديد الجنس ومستند الرخصة الشرعية</h3>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
              تحديد الجنس يسمح للمرأة المسلمة بتفعيل «وضع الرخصة الشرعية» لعدم احتساب صلوات الفترات الخاصة كصلوات فائتة أو كسر التتابع الإيماني لتتبع الطاعات والورد اليومي.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, gender: 'male' }))}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  (settings.gender || 'male') === 'male'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-350 font-bold shadow-xs scale-[1.02]'
                    : 'border-slate-150 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:scale-[1.01]'
                }`}
              >
                <span className="text-lg">👨</span>
                <span className="text-xs font-black">ذكر</span>
              </button>
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, gender: 'female' }))}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  settings.gender === 'female'
                    ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-350 font-bold shadow-xs scale-[1.02]'
                    : 'border-slate-150 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:scale-[1.01]'
                }`}
              >
                <span className="text-lg">👩</span>
                <span className="text-xs font-black">أنثى</span>
              </button>
            </div>
            {settings.gender === 'female' && (
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold leading-relaxed animate-fade-in text-center bg-rose-50/30 dark:bg-rose-950/10 p-2.5 rounded-xl border border-rose-500/10">
                ✨ يتيح وضع المرأة المسلمة تسجيل صلواتك كـ «عذر شرعي رخصة» لا ينقص من إنجازكِ أو يقطع تتابعكِ الإيماني المبارك 🤍.
              </p>
            )}
          </div>

          {/* Clock Style Toggle */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-800 dark:text-white">شكل وعرض الساعة</h3>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
              اختر مظهر عرض الساعة على الكارت الرئيسي؛ إما ساعة حائط بعقارب تقليدية أنيقة أو ساعة رقمية عصرية مع العد التنازلي.
            </p>
            <div className="flex bg-slate-50 dark:bg-[#111720] p-1 rounded-2xl border border-slate-150 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, clockStyle: 'digital' }))}
                className={`flex-1 py-3 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  (settings.clockStyle || 'digital') === 'digital'
                    ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-sm border border-[#e2e8f0]/40 dark:border-slate-700/50'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
                }`}
              >
                <span>⏰</span>
                <span>ساعة رقمية حديثة</span>
              </button>
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, clockStyle: 'analog' }))}
                className={`flex-1 py-3 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  (settings.clockStyle || 'digital') === 'analog'
                    ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-sm border border-[#e2e8f0]/40 dark:border-slate-700/50'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
                }`}
              >
                <span>🕒</span>
                <span>ساعة عقارب تقليدية</span>
              </button>
            </div>
          </div>

          {/* App Style Toggle (Faith vs Glass) */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-black text-slate-800 dark:text-white">شكل وأسلوب التطبيق</h3>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
              غيّر النمط العام للتطبيق بين المظهر الإيماني المشرق والمضيء، والأسلوب الزجاجي المتألق الحديث ذي الألوان الداكنة والعميقة المريحة للعين.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'faith-bright', name: 'النمط الإيماني 🕌', desc: 'ألوان مشرقة مستوحاة من كسوة الكعبة والزخارف الذهبية' },
                { id: 'glass-dark', name: 'النمط الزجاجي 🌌', desc: 'مظهر زجاجي شفاف مع تدرجات داكنة وهادئة ومريحة' }
              ].map((style) => {
                const isSelected = (settings.appStyle || 'glass-dark') === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => setSettings(prev => ({ ...prev, appStyle: style.id as any }))}
                    className={`p-3 rounded-2xl border text-right flex flex-col justify-between gap-1 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 ring-2 ring-indigo-400/20 shadow-xs'
                        : 'border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-500'
                    }`}
                  >
                    <span className="text-xs font-black text-slate-800 dark:text-white block">
                      {style.name}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-snug font-medium block">
                      {style.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mosque Backdrop Selector */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-800 dark:text-white">خلفية كارت الصلاة الرئيسي</h3>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
              اختر مظهر وخلفية المسجد الأنيقة المعروضة في الكارت الرئيسي بقمة الشاشة ليتناسب مع ذوقك ومزاجك اليومي.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {[
                { 
                  id: 'auto', 
                  name: 'تلقائي ذكي 🌟', 
                  desc: 'تتغير تلقائياً حسب فترات اليوم ويوم الجمعة المبارك',
                  bgClass: 'bg-gradient-to-r from-indigo-500/10 to-amber-500/10 border-indigo-200/50 dark:border-indigo-900/30'
                },
                { 
                  id: 'gold', 
                  name: 'المسجد الذهبي ✨', 
                  desc: 'خلفية ذهبية مشرقة مستوحاة من شروق شمس الحرم',
                  bgClass: 'bg-amber-500/5 border-amber-200/40 dark:border-amber-900/20'
                },
                { 
                  id: 'classic', 
                  name: 'الظل الكلاسيكي 🌙', 
                  desc: 'صورة ظلية زرقاء ليلية تمنحك طابعاً من الهدوء والسكينة',
                  bgClass: 'bg-sky-500/5 border-sky-200/40 dark:border-sky-900/20'
                },
                { 
                  id: 'banner', 
                  name: 'راية الغروب 🕌', 
                  desc: 'مظهر أوسع ومثالي لزوايا المسجد في وقت الغروب',
                  bgClass: 'bg-rose-500/5 border-rose-200/40 dark:border-rose-900/20'
                },
              ].map((item) => {
                const isSelected = (settings.backdropStyle || 'auto') === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSettings(prev => ({ ...prev, backdropStyle: item.id as any }))}
                    className={`p-3 rounded-2xl border text-right flex flex-col justify-between gap-1 transition-all duration-200 cursor-pointer hover:scale-[1.01] ${item.bgClass} ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 border-transparent shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <span className="text-xs font-black text-slate-800 dark:text-white block">
                      {item.name}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-snug font-medium block">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* City Selection Coordinates */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white">المدينة والموقع الجغرافي النشط</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
              تحديد مدينتك الحالية يضمن حساب أوقات الشروق والغروب ومواقيت الصلاة الخمسة بدقة فلكية تامة وبدون الحاجة لإنترنت.
            </p>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">اختر إحدى المدن المقترحة</label>
              <select
                value={settings.cityName}
                onChange={(e) => {
                  const name = e.target.value;
                  const found = POPULAR_CITIES.find(c => c.name === name);
                  if (found) {
                    setSettings(prev => ({
                      ...prev,
                      cityName: found.name,
                      latitude: found.lat,
                      longitude: found.lng
                    }));
                  }
                }}
                className="w-full bg-slate-50 dark:bg-[#111720] border border-[#e2e8f0]/85 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {POPULAR_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-[#111720] rounded-xl text-center space-y-1">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block">خط العرض (Latitude)</span>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">{settings.latitude}°</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#111720] rounded-xl text-center space-y-1">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block">خط الطول (Longitude)</span>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">{settings.longitude}°</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ==================== 5. QADA & MISSED LOGS ==================== */}
      {subTab === 'qada' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-black text-slate-800 dark:text-white">سجل القضاء وتتبع الفوائت</h2>
          </div>

          {/* Section A: Fasting Qada */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-3">
              <div className="flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black text-slate-800 dark:text-white">قضاء صيام رمضان</h3>
              </div>
              <button
                onClick={handleToggleFidyaMode}
                className="text-[10px] bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-300 py-1 px-2.5 rounded-lg font-bold border border-slate-100 dark:border-slate-800/40 cursor-pointer"
              >
                {ramadanQada.trackMode === 'fasting' ? 'التحويل لإخراج الفدية' : 'التحويل لنية الصيام والعد'}
              </button>
            </div>

            {ramadanQada.trackMode === 'fasting' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/10 p-4 rounded-2xl border border-amber-500/10 text-right">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">الأيام المتبقية في ذمتك</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold block">سجل الأيام التي أفطرتها بعذر شرعي لقضائها</span>
                  </div>
                  <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                    {toArabicNumbers(ramadanQada.daysOwed)} <span className="text-xs font-bold">أيام</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-[#111720] rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-800/40">
                    <span className="font-bold text-slate-600 dark:text-slate-400">عدد الأيام المقضية:</span>
                    <span className="font-extrabold text-slate-800 dark:text-white">{toArabicNumbers(ramadanQada.daysCompleted)}</span>
                  </div>
                  <button
                    onClick={handleCompleteRamadanQadaDay}
                    disabled={ramadanQada.daysOwed === 0}
                    className="p-3 bg-indigo-600 disabled:opacity-40 hover:bg-indigo-700 text-white font-bold rounded-xl text-center cursor-pointer transition-colors"
                  >
                    صمت وقضيت يوماً!
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-450">تعديل الأيام المطلوبة يدوياً:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddRamadanQadaDays(-1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                    >
                      -١
                    </button>
                    <button
                      onClick={() => handleAddRamadanQadaDays(1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                    >
                      +١
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/10 p-4 rounded-2xl border border-emerald-500/10 text-right">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-750 dark:text-slate-200">فدية إطعام مسكين</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">للعاجز عن الصوم بمرض مستمر أو كبر سن.</span>
                  </div>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {toArabicNumbers(ramadanQada.fidyaCompleted || 0)} <span className="text-xs font-bold">مسكين</span>
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-50 dark:bg-[#111720] p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 text-xs">
                  <span className="font-bold text-slate-500">تعديل إطعام مسكين:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateFidyaCompleted(-1)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold"
                    >
                      -١
                    </button>
                    <button
                      onClick={() => handleUpdateFidyaCompleted(1)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold"
                    >
                      +١
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section B: Missed Prayer Qada */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/40 pb-3">
              <Clock className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-black text-slate-800 dark:text-white">قضاء الصلوات والفرائض الفائتة</h3>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
              عند إيقاظك متأخراً أو فوات صلاة بعذر، يتم إضافتها في ذمتك هنا. صلها قضاءً فور استحضارها ثم احذفها بالضغط عليها.
            </p>

            {/* List of pending qada */}
            {pendingQadaPrayers.length === 0 ? (
              <div className="p-6 bg-slate-50/50 dark:bg-[#111720]/40 rounded-2xl text-center space-y-1.5 border border-dashed border-slate-200 dark:border-slate-800/70">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">الحمد لله! لا توجد عليك أي صلاة فائتة في السجل 🌿</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">سجل الفوائت المبارك خالٍ من التقصير والحمد لله الحفيظ.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 block uppercase">الصلوات المطلوبة في ذمتك حالياً:</span>
                <div className="grid grid-cols-1 gap-2">
                  {pendingQadaPrayers.map((qada) => {
                    const nameAr = 
                      qada.prayerName === 'Fajr' ? 'الفجر' :
                      qada.prayerName === 'Dhuhr' ? 'الظهر' :
                      qada.prayerName === 'Asr' ? 'العصر' :
                      qada.prayerName === 'Maghrib' ? 'المغرب' : 'العشاء';
                    return (
                      <div 
                        key={qada.id}
                        onClick={() => handleRemoveQadaItem(qada.id)}
                        className="p-3 bg-rose-50/30 dark:bg-rose-950/10 hover:bg-rose-100/40 dark:hover:bg-rose-950/20 border border-rose-500/10 rounded-2xl flex items-center justify-between cursor-pointer transition-all"
                        title="اضغط لإزالتها وتأكيد القضاء"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">قضاء صلاة {nameAr}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                          <span>بتاريخ: {toArabicNumbers(qada.date)}</span>
                          <span className="bg-rose-100/60 dark:bg-rose-950/40 text-rose-600 px-2 py-0.5 rounded-md">قضاء الآن</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick manual missed adder */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 space-y-2.5">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 block">إضافة صلاة فائتة في ذمتك يدوياً:</span>
              <div className="grid grid-cols-5 gap-1.5">
                {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as PrayerName[]).map((p) => {
                  const ar = p === 'Fajr' ? 'فجر' : p === 'Dhuhr' ? 'ظهر' : p === 'Asr' ? 'عصر' : p === 'Maghrib' ? 'مغرب' : 'عشاء';
                  return (
                    <button
                      key={p}
                      onClick={() => handleAddManualMissedPrayer(p)}
                      className="py-2.5 px-1 bg-slate-50 hover:bg-rose-50/30 dark:bg-[#111720] dark:hover:bg-rose-950/10 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-100 dark:border-slate-800/40 rounded-xl text-[11px] font-black cursor-pointer transition-colors"
                    >
                      {ar}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
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
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line text-right font-sans">
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
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-black text-slate-800 dark:text-white">النسخ الاحتياطي واسترداد البيانات</h2>
          </div>

          {/* Backup Action Card */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <div className="flex items-center gap-1.5">
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-black text-slate-800 dark:text-white">إنشاء نسخة احتياطية وتصديرها</h3>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
              يتم حفظ جميع سجلات الصيام والصلاة والقرآن والأدعية محلياً على هاتفك. نوصي بتنزيل ملف النسخة الاحتياطية دورياً لحماية سجلاتك المباركة من الضياع عند مسح ذاكرة المتصفح.
            </p>

            <button
              onClick={handleExportData}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              تحميل وتصدير النسخة الاحتياطية المباركة (.json)
            </button>

            {backupText && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">نص النسخ المرمز البديل:</span>
                <textarea
                  readOnly
                  rows={4}
                  value={backupText}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full bg-slate-50 dark:bg-[#111720] border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-[10px] font-mono text-left"
                />
                <span className="text-[9px] text-emerald-600 font-bold block text-right">تم نسخ النص تلقائياً، يمكنك نسخه وحفظه في أي ملف نصي آمن.</span>
              </div>
            )}
          </div>

          {/* Import / Restore Card */}
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
            <div className="flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black text-slate-800 dark:text-white">استيراد واسترجاع السجلات السابقة</h3>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
              لاستعادة بياناتك على جهاز جديد أو متصفح آخر، الصق نص النسخ الاحتياطي (JSON) الذي قمت بتصديره سابقاً في الحقل أدناه ثم اضغط تأكيد الاستعادة.
            </p>

            <textarea
              rows={4}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="ألصق هنا النص البرمجي الكامل للنسخة الاحتياطية..."
              className="w-full bg-slate-50 dark:bg-[#111720] border border-[#e2e8f0]/80 dark:border-slate-800 rounded-2xl p-4 text-[10px] font-mono text-left outline-hidden focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={handleImportData}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              تأكيد استعادة واستيراد البيانات الآن
            </button>

            {showImportResult && (
              <p className={`p-3 rounded-xl text-xs font-black text-center ${showImportResult.includes('بنجاح') ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-500'}`}>
                {showImportResult}
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
