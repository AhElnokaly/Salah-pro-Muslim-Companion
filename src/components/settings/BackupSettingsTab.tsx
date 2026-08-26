import React, { useState, useRef } from 'react';
import { RotateCcw, Download, Upload, FileUp } from 'lucide-react';
import { AppSettings, PendingQadaPrayer, RamadanQadaTracker, PrayerLog, CustomDua, QuranSession, QuranKhatma } from '../../types';
import { safeSetItem, safeGetJSON } from '../../utils/storage';
import { formatDateKey } from '../../utils/prayerDayBoundary';
import { getDashboardSectionsConfig } from '../dashboard/dashboardSections';

interface BackupSettingsTabProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
  voluntaryPrayerLogs?: any[];
  setVoluntaryPrayerLogs?: React.Dispatch<React.SetStateAction<any[]>>;
  fastingLogs: Record<string, { date: string; fasted: boolean; fastType: string }>;
  setFastingLogs: React.Dispatch<React.SetStateAction<Record<string, { date: string; fasted: boolean; fastType: string }>>>;
  ramadanQada: RamadanQadaTracker;
  setRamadanQada: React.Dispatch<React.SetStateAction<RamadanQadaTracker>>;
  quranSessions: QuranSession[];
  setQuranSessions: React.Dispatch<React.SetStateAction<QuranSession[]>>;
  khatmat: QuranKhatma[];
  setKhatmat: React.Dispatch<React.SetStateAction<QuranKhatma[]>>;
  dhikrLogs?: Record<string, Record<string, number>>;
  setDhikrLogs?: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  customDuas: CustomDua[];
  setCustomDuas: React.Dispatch<React.SetStateAction<CustomDua[]>>;
  fajrMuezzin?: string;
  setFajrMuezzin?: (val: string) => void;
  generalMuezzin?: string;
  setGeneralMuezzin?: (val: string) => void;
  audioVolume?: number;
}

export default function BackupSettingsTab({
  settings,
  setSettings,
  prayerLogs,
  setPrayerLogs,
  pendingQadaPrayers,
  setPendingQadaPrayers,
  voluntaryPrayerLogs,
  setVoluntaryPrayerLogs,
  fastingLogs,
  setFastingLogs,
  ramadanQada,
  setRamadanQada,
  quranSessions,
  setQuranSessions,
  khatmat,
  setKhatmat,
  dhikrLogs,
  setDhikrLogs,
  customDuas,
  setCustomDuas,
  fajrMuezzin = 'makkah',
  setFajrMuezzin,
  generalMuezzin = 'makkah',
  setGeneralMuezzin,
  audioVolume = 1,
}: BackupSettingsTabProps) {
  const [backupText, setBackupText] = useState('');
  const [importText, setImportText] = useState('');
  const [showImportResult, setShowImportResult] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        handleImportData(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportData = () => {
    try {
      const fullData = {
        appName: 'Hemmaty',
        version: '2.5',
        backupVersion: 1,
        exportedAt: new Date().toISOString(),
        settings,
        prayerLogs,
        pendingQadaPrayers,
        voluntaryPrayerLogs: voluntaryPrayerLogs || [],
        fastingLogs,
        ramadanQada,
        quranSessions,
        khatmat,
        dhikrLogs: dhikrLogs || {},
        customDuas: customDuas || [],
        customTasbeehs: safeGetJSON('mc_custom_tasbeehs', []),
        favoriteDhikrCategories: safeGetJSON('mc_favorite_dhikr_categories', []),
        favoriteDhikrs: safeGetJSON('mc_favorite_dhikrs', []),
        fridayChecklist: safeGetJSON('mc_friday_checklist', []),
        quranJuzProgress: safeGetJSON('quran_juz_progress', []),
        quranRoutines: safeGetJSON('quran_routines', []),
        qiyamJournalHistory: safeGetJSON('qiyam_journal_history', []),
        customAlarms: safeGetJSON('salah_custom_alarms', []),
        spiritualAlerts: safeGetJSON('salah_alerts', null),
        soundModes: safeGetJSON('salah_sound_modes', null),
        audioPreferences: {
          fajrMuezzin: localStorage.getItem('salah_fajr_muezzin') || fajrMuezzin,
          generalMuezzin: localStorage.getItem('salah_general_muezzin') || generalMuezzin,
          audioVolume: localStorage.getItem('salah_audio_volume') || audioVolume.toString(),
          autoPlayAthan: localStorage.getItem('salah_auto_play_athan') !== 'false',
          prayerMuezzins: {
            Fajr: localStorage.getItem('salah_muezzin_Fajr') || '',
            Sunrise: localStorage.getItem('salah_muezzin_Sunrise') || '',
            Dhuhr: localStorage.getItem('salah_muezzin_Dhuhr') || '',
            Asr: localStorage.getItem('salah_muezzin_Asr') || '',
            Maghrib: localStorage.getItem('salah_muezzin_Maghrib') || '',
            Isha: localStorage.getItem('salah_muezzin_Isha') || ''
          }
        },
        clockFace: localStorage.getItem('salah_clock_face') || 'classic',
        tasbihColor: localStorage.getItem('salah_tasbih_color') || 'indigo',
        dashboardSections: getDashboardSectionsConfig(),
        pushSettings: JSON.parse(localStorage.getItem('hemmaty_push_settings') || 'null'),
        featureAnalytics: JSON.parse(localStorage.getItem('rafiq_feature_analytics_v1') || 'null'),
        womenExcuseActive: localStorage.getItem('rafiq_women_excuse_active_v1') === 'true'
      };
      const jsonStr = JSON.stringify(fullData, null, 2);
      setBackupText(jsonStr);

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hemmaty_backup_${formatDateKey(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating backup:', e);
      setShowImportResult('فشل إنشاء ملف النسخ الاحتياطي.');
    }
  };

  const handleImportData = (contentToImport?: string) => {
    try {
      const rawText = contentToImport || importText;
      if (!rawText || !rawText.trim()) {
        setShowImportResult('يرجى اختيار ملف أو لصق نص النسخ الاحتياطي أولاً.');
        return;
      }
      const data = JSON.parse(rawText);
      if (!data || typeof data !== 'object') {
        setShowImportResult('الصيغة غير صحيحة. يرجى التأكد من نسخ ملف النسخ الاحتياطي الأصلي بالكامل.');
        return;
      }

      let restoredCount = 0;

      if (data.settings) {
        setSettings(data.settings);
        safeSetItem('mc_settings', JSON.stringify(data.settings));
        safeSetItem('salah_settings', JSON.stringify(data.settings));
        restoredCount++;
      }
      if (data.prayerLogs) {
        setPrayerLogs(data.prayerLogs);
        safeSetItem('mc_prayer_logs', JSON.stringify(data.prayerLogs));
        restoredCount++;
      }
      if (data.pendingQadaPrayers) {
        setPendingQadaPrayers(data.pendingQadaPrayers);
        safeSetItem('mc_pending_qada', JSON.stringify(data.pendingQadaPrayers));
        restoredCount++;
      }
      if (data.voluntaryPrayerLogs && setVoluntaryPrayerLogs) {
        setVoluntaryPrayerLogs(data.voluntaryPrayerLogs);
        safeSetItem('mc_voluntary_prayer_logs', JSON.stringify(data.voluntaryPrayerLogs));
        restoredCount++;
      }
      if (data.fastingLogs) {
        setFastingLogs(data.fastingLogs);
        safeSetItem('mc_fasting_logs', JSON.stringify(data.fastingLogs));
        restoredCount++;
      }
      if (data.ramadanQada) {
        setRamadanQada(data.ramadanQada);
        safeSetItem('mc_ramadan_qada', JSON.stringify(data.ramadanQada));
        restoredCount++;
      }
      if (data.quranSessions) {
        setQuranSessions(data.quranSessions);
        safeSetItem('mc_quran_sessions', JSON.stringify(data.quranSessions));
        restoredCount++;
      }
      if (data.khatmat) {
        setKhatmat(data.khatmat);
        safeSetItem('mc_khatmat', JSON.stringify(data.khatmat));
        restoredCount++;
      }
      if (data.dhikrLogs && setDhikrLogs) {
        setDhikrLogs(data.dhikrLogs);
        safeSetItem('mc_dhikr_logs', JSON.stringify(data.dhikrLogs));
        restoredCount++;
      }
      if (data.customDuas) {
        setCustomDuas(data.customDuas);
        safeSetItem('mc_custom_duas', JSON.stringify(data.customDuas));
        restoredCount++;
      }

      if (data.customTasbeehs) {
        safeSetItem('mc_custom_tasbeehs', JSON.stringify(data.customTasbeehs));
        restoredCount++;
      }
      if (data.favoriteDhikrCategories) {
        safeSetItem('mc_favorite_dhikr_categories', JSON.stringify(data.favoriteDhikrCategories));
        restoredCount++;
      }
      if (data.favoriteDhikrs) {
        safeSetItem('mc_favorite_dhikrs', JSON.stringify(data.favoriteDhikrs));
        restoredCount++;
      }
      if (data.fridayChecklist) {
        safeSetItem('mc_friday_checklist', JSON.stringify(data.fridayChecklist));
        restoredCount++;
      }

      if (data.quranJuzProgress) {
        safeSetItem('quran_juz_progress', JSON.stringify(data.quranJuzProgress));
        restoredCount++;
      }
      if (data.quranRoutines) {
        safeSetItem('quran_routines', JSON.stringify(data.quranRoutines));
        restoredCount++;
      }
      if (data.qiyamJournalHistory) {
        safeSetItem('qiyam_journal_history', JSON.stringify(data.qiyamJournalHistory));
        restoredCount++;
      }

      if (data.customAlarms) {
        safeSetItem('salah_custom_alarms', JSON.stringify(data.customAlarms));
        restoredCount++;
      }
      if (data.spiritualAlerts) {
        safeSetItem('salah_alerts', JSON.stringify(data.spiritualAlerts));
        restoredCount++;
      }
      if (data.soundModes) {
        safeSetItem('salah_sound_modes', JSON.stringify(data.soundModes));
        restoredCount++;
      }
      if (data.audioPreferences) {
        if (data.audioPreferences.fajrMuezzin && setFajrMuezzin) {
          setFajrMuezzin(data.audioPreferences.fajrMuezzin);
          safeSetItem('salah_fajr_muezzin', data.audioPreferences.fajrMuezzin);
        }
        if (data.audioPreferences.generalMuezzin && setGeneralMuezzin) {
          setGeneralMuezzin(data.audioPreferences.generalMuezzin);
          safeSetItem('salah_general_muezzin', data.audioPreferences.generalMuezzin);
        }
      }

      setShowImportResult(`تم استعادة البيانات بنجاح! (${restoredCount} أقسام مجمعة).`);
    } catch (e) {
      console.error('Error importing backup data:', e);
      setShowImportResult('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية. يرجى التأكد من صحة النص.');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
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
          type="button"
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
              className="w-full bg-slate-50 dark:bg-[#111720] border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-[10px] font-mono text-start"
            />
            <span className="text-[9px] text-emerald-600 font-bold block text-end">تم نسخ النص تلقائياً، يمكنك نسخه وحفظه في أي ملف نصي آمن.</span>
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
          لاستعادة بياناتك على جهاز جديد أو متصفح آخر، يمكنك اختيار ملف النسخة الاحتياطية (.json) مباشرة من جهازك أو لصق النص المرمز في الحقل أدناه:
        </p>

        <input
          type="file"
          ref={fileInputRef}
          accept=".json,application/json"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <FileUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          اختيار ملف النسخة الاحتياطية (.json) من جهازك
        </button>

        <div className="flex items-center gap-2 my-2">
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
          <span className="text-[10px] text-slate-400 font-bold">أو لصق النص يدوياً</span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        </div>

        <textarea
          rows={4}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="ألصق هنا النص البرمجي الكامل للنسخة الاحتياطية..."
          className="w-full bg-slate-50 dark:bg-[#111720] border border-[#e2e8f0]/80 dark:border-slate-800 rounded-2xl p-4 text-[10px] font-mono text-start outline-hidden focus:ring-2 focus:ring-indigo-500"
        />

        <button
          type="button"
          onClick={() => handleImportData()}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Upload className="w-4 h-4" />
          تأكيد استعادة واستيراد البيانات الآن
        </button>

        {showImportResult && (
          <p className={`p-3 rounded-xl text-xs font-black text-center ${showImportResult.includes('بنجاح') ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 border border-rose-500/20'}`}>
            {showImportResult}
          </p>
        )}
      </div>
    </div>
  );
}
