import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import {
  TabId,
  SettingsSubTabId,
  AppSettings,
  PrayerLog,
  PendingQadaPrayer,
  RamadanQadaTracker,
  QuranSession,
  QuranKhatma,
  CustomDua,
  AlarmConfig,
  PrayerName,
} from '../../types';
import { safeLazy } from '../../utils/safeLazy';
import Dashboard from '../Dashboard';

// Code-split Lazy Secondary Tabs & Features
const QuranTracker = safeLazy(() => import('../QuranTracker'));
const AdhkarTracker = safeLazy(() => import('../AdhkarTracker'));
const QiblaCompass = safeLazy(() => import('../QiblaCompass'));
const MoreSettings = safeLazy(() => import('../MoreSettings'));
const PrayerManager = safeLazy(() => import('../PrayerManager'));
const FastingTracker = safeLazy(() => import('../FastingTracker'));
const IslamicCalendar = safeLazy(() => import('../IslamicCalendar'));
const WidgetSimulator = safeLazy(() => import('../WidgetSimulator'));
const WorshipAlarms = safeLazy(() => import('../WorshipAlarms'));
const KhushuQiyamTracker = safeLazy(() => import('../KhushuQiyamTracker'));
const AnalyticsDashboard = safeLazy(() => import('../AnalyticsDashboard'));
const MoonPhases = safeLazy(() => import('../MoonPhases'));

// Minimal Loading Fallback
export const TabLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[45vh] p-8 text-center" dir="rtl">
    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 shadow-xs">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
    </div>
    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">جاري التحميل...</span>
  </div>
);

export interface AppTabRouterProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  activeSettingsSubTab: SettingsSubTabId;
  setActiveSettingsSubTab: (subTab: SettingsSubTabId) => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
  voluntaryPrayerLogs: Record<string, Record<string, boolean>>;
  setVoluntaryPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, boolean>>>>;
  fastingLogs: Record<string, { fasted: boolean; type?: string }>;
  setFastingLogs: React.Dispatch<React.SetStateAction<Record<string, { fasted: boolean; type?: string }>>>;
  ramadanQada: RamadanQadaTracker;
  setRamadanQada: React.Dispatch<React.SetStateAction<RamadanQadaTracker>>;
  quranSessions: QuranSession[];
  setQuranSessions: React.Dispatch<React.SetStateAction<QuranSession[]>>;
  khatmat: QuranKhatma[];
  setKhatmat: React.Dispatch<React.SetStateAction<QuranKhatma[]>>;
  dhikrLogs: Record<string, Record<string, number>>;
  setDhikrLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  customDuas: CustomDua[];
  setCustomDuas: React.Dispatch<React.SetStateAction<CustomDua[]>>;
  customAlarms: AlarmConfig[];
  setCustomAlarms: React.Dispatch<React.SetStateAction<AlarmConfig[]>>;
  alerts: Record<string, boolean>;
  setAlerts: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  audioVolume: number;
  setAudioVolume: React.Dispatch<React.SetStateAction<number>>;
  targetAdhkarPrayer?: string;
  handleNavigateToAdhkarForPrayer: (prayerKey: string) => void;
  handleInstallApp: () => void;
  isInstalled: boolean;
  times: Record<string, string>;
  current: PrayerName | null;
  next: PrayerName | null;
  timeRemainingStr: string;
  hijri: { day: number; monthName: string; year: number };
  dayNameArabic: string;
  gregorianStr: string;
  now: Date;
  toArabicNumbers: (n: number | string) => string;
}

export const AppTabRouter: React.FC<AppTabRouterProps> = ({
  activeTab,
  setActiveTab,
  activeSettingsSubTab,
  setActiveSettingsSubTab,
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
  customAlarms,
  setCustomAlarms,
  alerts,
  setAlerts,
  audioVolume,
  setAudioVolume,
  targetAdhkarPrayer,
  handleNavigateToAdhkarForPrayer,
  handleInstallApp,
  isInstalled,
  times,
  current,
  next,
  timeRemainingStr,
  hijri,
  dayNameArabic,
  gregorianStr,
  now,
  toArabicNumbers,
}) => {
  return (
    <>
      {activeTab !== 'home' && activeTab !== 'calendar' && activeTab !== 'qibla' && (
        <button
          onClick={() => setActiveTab('home')}
          className="w-full flex items-center justify-between p-3 bg-white dark:bg-[#161d26] rounded-2xl border border-[#e2e8f0] dark:border-slate-800/80 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">↩️</span>
            <span>العودة للرئيسية</span>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">اللوحة الرئيسية ←</span>
        </button>
      )}

      {activeTab === 'home' && (
        <Dashboard 
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
          setActiveTab={setActiveTab}
          onNavigateToAdhkarForPrayer={handleNavigateToAdhkarForPrayer}
          customDuas={customDuas}
          setCustomDuas={setCustomDuas}
          quranSessions={quranSessions}
          khatmat={khatmat}
          dhikrLogs={dhikrLogs}
          onInstallApp={handleInstallApp}
          isPwaInstalled={isInstalled}
        />
      )}

      <Suspense fallback={<TabLoadingFallback />}>
        {activeTab === 'calendar' && (
          <div className="pb-12 space-y-6">
            <IslamicCalendar 
              settings={settings}
              setSettings={setSettings}
              prayerLogs={prayerLogs}
              fastingLogs={fastingLogs}
              dhikrLogs={dhikrLogs}
              quranSessions={quranSessions}
              khatmat={khatmat}
              onNavigateTab={(tab) => setActiveTab(tab as TabId)}
            />
          </div>
        )}

        {activeTab === 'salah' && (
          <PrayerManager
            settings={settings}
            setSettings={setSettings}
            prayerLogs={prayerLogs}
            setPrayerLogs={setPrayerLogs}
            pendingQadaPrayers={pendingQadaPrayers}
            setPendingQadaPrayers={setPendingQadaPrayers}
            voluntaryPrayerLogs={voluntaryPrayerLogs}
            setVoluntaryPrayerLogs={setVoluntaryPrayerLogs}
            customAlarms={customAlarms}
            setCustomAlarms={setCustomAlarms}
            alerts={alerts}
            setAlerts={setAlerts}
            onNavigateTab={(tab, subTab) => {
              if (tab) setActiveTab(tab as TabId);
              if (subTab && tab === 'settings') setActiveSettingsSubTab(subTab as SettingsSubTabId);
            }}
          />
        )}

        {activeTab === 'quran' && (
          <QuranTracker 
            khatmat={khatmat}
            setKhatmat={setKhatmat}
            quranSessions={quranSessions}
            setQuranSessions={setQuranSessions}
          />
        )}

        {activeTab === 'adhkar' && (
          <AdhkarTracker 
            dhikrLogs={dhikrLogs}
            setDhikrLogs={setDhikrLogs}
            currentPrayer={current}
            prayerTimes={times}
            targetPrayerKey={targetAdhkarPrayer}
            onNavigateTab={(tab) => {
              if (tab === 'settings' || tab === 'prayer' || tab === 'adhan') {
                setActiveTab('settings');
                if (tab === 'prayer' || tab === 'adhan') {
                  setActiveSettingsSubTab(tab as SettingsSubTabId);
                }
              } else {
                setActiveTab(tab as TabId);
              }
            }}
            onOpenNotificationsModal={() => {
              window.dispatchEvent(new CustomEvent('open-spiritual-notifications'));
            }}
          />
        )}

        {activeTab === 'qibla' && (
          <QiblaCompass 
            settings={settings}
            setSettings={setSettings}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'fasting' && (
          <FastingTracker 
            settings={settings}
            fastingLogs={fastingLogs}
            setFastingLogs={setFastingLogs}
            ramadanQada={ramadanQada}
            setRamadanQada={setRamadanQada}
            onNavigateTab={(tab) => setActiveTab(tab as TabId)}
          />
        )}

        {activeTab === 'settings' && (
          <MoreSettings 
            subTab={activeSettingsSubTab}
            setSubTab={setActiveSettingsSubTab}
            settings={settings}
            setSettings={setSettings}
            pendingQadaPrayers={pendingQadaPrayers}
            setPendingQadaPrayers={setPendingQadaPrayers}
            ramadanQada={ramadanQada}
            setRamadanQada={setRamadanQada}
            prayerLogs={prayerLogs}
            setPrayerLogs={setPrayerLogs}
            voluntaryPrayerLogs={voluntaryPrayerLogs}
            setVoluntaryPrayerLogs={setVoluntaryPrayerLogs}
            fastingLogs={fastingLogs}
            setFastingLogs={setFastingLogs}
            quranSessions={quranSessions}
            setQuranSessions={setQuranSessions}
            khatmat={khatmat}
            setKhatmat={setKhatmat}
            dhikrLogs={dhikrLogs}
            setDhikrLogs={setDhikrLogs}
            customDuas={customDuas}
            setCustomDuas={setCustomDuas}
          />
        )}

        {activeTab === 'widgets' && (
          <div className="pb-12 space-y-6">
            <WidgetSimulator 
              prayerTimes={times} 
              settings={settings}
              setSettings={setSettings}
              currentPrayer={current}
              nextPrayer={next}
              timeRemainingStr={timeRemainingStr}
              hijri={hijri}
              dayNameArabic={dayNameArabic}
              gregorianStr={gregorianStr}
            />
          </div>
        )}

        {activeTab === 'alarms' && (
          <WorshipAlarms
            settings={settings}
            setSettings={setSettings}
            customAlarms={customAlarms}
            setCustomAlarms={setCustomAlarms}
            alerts={alerts}
            setAlerts={setAlerts}
            audioVolume={audioVolume}
            setAudioVolume={setAudioVolume}
          />
        )}

        {activeTab === 'khushu' && (
          <KhushuQiyamTracker
            settings={settings}
            prayerLogs={prayerLogs}
            setPrayerLogs={setPrayerLogs}
            setCustomAlarms={setCustomAlarms}
            onNavigateTab={(tab) => setActiveTab(tab as TabId)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            onSelectTab={(tab) => setActiveTab(tab as TabId)}
          />
        )}

        {activeTab === 'moon' && (
          <MoonPhases
            now={now}
            hijriDay={hijri.day}
            hijriMonthName={hijri.monthName}
            hijriYear={hijri.year}
            cityName={settings.cityName}
            toArabicNumbers={toArabicNumbers}
            onNavigateTab={(tab) => setActiveTab(tab as TabId)}
          />
        )}
      </Suspense>
    </>
  );
};
