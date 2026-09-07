import React from 'react';
import { Home, BookOpen, Compass, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TabId, PrayerLog, PrayerName } from '../../types';
import SmartFabSystem from '../SmartFabSystem';
import { getArabicPrayerName } from '../../utils/prayerCalc';

export interface AppBottomNavProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isFabOpen: boolean;
  setIsFabOpen: (open: boolean) => void;
  currentPrayerName: PrayerName;
  nextPrayerName: PrayerName | string;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setToastMessage: (msg: string | null) => void;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({
  activeTab,
  setActiveTab,
  isFabOpen,
  setIsFabOpen,
  currentPrayerName,
  nextPrayerName,
  prayerLogs,
  setToastMessage,
}) => {
  const currentPrayerArabic = getArabicPrayerName(currentPrayerName);
  const nextKey = (typeof nextPrayerName === 'string' ? nextPrayerName : 'Asr') as PrayerName;
  const nextPrayerArabic = getArabicPrayerName(nextKey);

  return (
    <nav 
      aria-label="شريط التنقل الرئيسي للتطبيق"
      className="fixed bottom-0 start-0 end-0 bg-white/95 dark:bg-[#161d26]/95 backdrop-blur-md border-t border-[#e2e8f0] dark:border-slate-800/80 py-2 px-1 shadow-xl z-40 flex justify-around items-center w-full max-w-md mx-auto rounded-t-3xl transition-colors duration-300"
    >
      {/* Backdrop overlay when FAB fan menu is open */}
      <AnimatePresence>
        {isFabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFabOpen(false)}
            role="button"
            aria-label="إغلاق القائمة السريعة"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Escape' || e.key === 'Enter') setIsFabOpen(false);
            }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30"
          />
        )}
      </AnimatePresence>

      {/* 1. Home Dashboard */}
      <button
        onClick={() => {
          setIsFabOpen(false);
          setActiveTab('home');
        }}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl cursor-pointer transition-all active:scale-95 ${
          activeTab === 'home'
            ? 'text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/30'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        aria-label="الصفحة الرئيسية ومواقيت الصلاة"
        aria-current={activeTab === 'home' ? 'page' : undefined}
      >
        <Home className="w-5 h-5" aria-hidden="true" />
        <span className="text-[9.5px] leading-none font-bold">الرئيسية</span>
      </button>

      {/* 2. Adhkar & Remembrance */}
      <button
        onClick={() => {
          setIsFabOpen(false);
          setActiveTab('adhkar');
        }}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl cursor-pointer transition-all active:scale-95 ${
          activeTab === 'adhkar'
            ? 'text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/30'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        aria-label="حصن المسلم والأذكار اليومية"
        aria-current={activeTab === 'adhkar' ? 'page' : undefined}
      >
        <BookOpen className="w-5 h-5" aria-hidden="true" />
        <span className="text-[9.5px] leading-none font-bold">الأذكار</span>
      </button>

      {/* 3. Central Raised FAB (Smart Radial Speed-Dial & Quick Log System) */}
      <SmartFabSystem
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isFabOpen={isFabOpen}
        setIsFabOpen={setIsFabOpen}
        currentPrayerArabic={currentPrayerArabic}
        currentPrayerKey={currentPrayerName}
        nextPrayerArabic={nextPrayerArabic}
        nextPrayerKey={nextKey}
        prayerLogs={prayerLogs}
        setToastMessage={setToastMessage}
      />

      {/* 4. Qibla Compass */}
      <button
        onClick={() => {
          setIsFabOpen(false);
          setActiveTab('qibla');
        }}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl cursor-pointer transition-all active:scale-95 ${
          activeTab === 'qibla'
            ? 'text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/30'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        aria-label="تحديد اتجاه القبلة الشريفة"
        aria-current={activeTab === 'qibla' ? 'page' : undefined}
      >
        <Compass className="w-5 h-5" aria-hidden="true" />
        <span className="text-[9.5px] leading-none font-bold">القبلة</span>
      </button>

      {/* 5. Hijri Calendar */}
      <button
        onClick={() => {
          setIsFabOpen(false);
          setActiveTab('calendar');
        }}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl cursor-pointer transition-all active:scale-95 ${
          activeTab === 'calendar'
            ? 'text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/30'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        aria-label="التقويم الهجري والمناسبات الإسلامية"
        aria-current={activeTab === 'calendar' ? 'page' : undefined}
      >
        <Calendar className="w-5 h-5" aria-hidden="true" />
        <span className="text-[9.5px] leading-none font-bold">التقويم</span>
      </button>
    </nav>
  );
};
