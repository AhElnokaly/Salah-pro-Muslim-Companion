import React from 'react';
import { Menu, Sun, Moon, Monitor, Bell, Lightbulb, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, TabId } from '../../types';
import { WeatherWidget } from '../WeatherWidget';
import companionIcon from '../../assets/images/hemmaty_logo.jpg';

export interface AppHeaderProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setIsSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: TabId) => void;
  setIsTourModalOpen: (open: boolean) => void;
  setShowSpiritualModal: (show: boolean) => void;
  headerRippleActive: boolean;
  setHeaderRippleActive: (active: boolean) => void;
  headerParticles: Array<{ id: number; emoji: string; x: number; y: number; scale: number; rotate: number }>;
  triggerHeaderParticles: () => void;
  playSpiritualChime: (freq: number) => void;
  isSyncing: boolean;
  isOnline: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  settings,
  setSettings,
  setIsSidebarOpen,
  setActiveTab,
  setIsTourModalOpen,
  setShowSpiritualModal,
  headerRippleActive,
  setHeaderRippleActive,
  headerParticles,
  triggerHeaderParticles,
  playSpiritualChime,
  isSyncing,
  isOnline
}) => {
  return (
    <header className="w-full max-w-md md:max-w-xl bg-white/95 dark:bg-[#121820]/95 backdrop-blur-md border-b border-[#e2e8f0]/80 dark:border-slate-800/80 px-3 md:px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors duration-300 rounded-b-3xl">
      {/* Right side: Menu + App Brand & Location */}
      <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
          title="افتح القائمة الجانبية"
          aria-label="فتح القائمة الجانبية والضبط"
        >
          <Menu className="w-4.5 h-4.5 md:w-5 md:h-5" />
        </button>
        
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex items-center justify-center shrink-0">
            {/* Concentric Expanding Spiritual Ripples */}
            {headerRippleActive && (
              <>
                <motion.span
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute inset-0 rounded-2xl border-2 border-indigo-500/60 pointer-events-none z-0"
                />
                <motion.span
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 3.2, opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
                  className="absolute inset-0 rounded-2xl border-2 border-emerald-400/50 pointer-events-none z-0"
                />
                <motion.span
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 4.2, opacity: 0 }}
                  transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                  className="absolute inset-0 rounded-2xl border border-teal-300/30 pointer-events-none z-0"
                />
              </>
            )}

            {/* Floating Spiritual Particles */}
            <AnimatePresence>
              {headerParticles.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 0.1, rotate: 0 }}
                  animate={{ 
                    opacity: 0, 
                    x: p.x, 
                    y: p.y, 
                    scale: p.scale, 
                    rotate: p.rotate 
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 1.3, 
                    ease: [0.19, 1, 0.22, 1]
                  }}
                  className="absolute text-sm pointer-events-none z-20 select-none drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
                >
                  {p.emoji}
                </motion.span>
              ))}
            </AnimatePresence>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setHeaderRippleActive(true);
                triggerHeaderParticles();
                setTimeout(() => setHeaderRippleActive(false), 1400);
                playSpiritualChime(523.25);
                setTimeout(() => {
                  setShowSpiritualModal(true);
                }, 250);
              }}
              className="relative w-10 h-10 md:w-11 md:h-11 rounded-2xl overflow-hidden border-2 border-emerald-500/40 dark:border-amber-400/50 flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-emerald-500/20 focus:outline-hidden z-10 transition-all duration-300 bg-[#121d2a]"
              title="اضغط لتفتح بوابة النفحات الإيمانية 🌸"
            >
              <img 
                src={companionIcon} 
                alt="هِمَّتِي" 
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/hemmaty_logo.jpg';
                }}
                className="w-full h-full object-cover select-none transition-transform duration-300 hover:scale-105"
                referrerPolicy="no-referrer" 
              />
              <span className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-2xl pointer-events-none" />
              
              {/* Dynamic Smart Network & Sync Status Indicator Dot */}
              {isSyncing ? (
                <span 
                  className="absolute bottom-0.5 end-0.5 w-3 h-3 bg-amber-400 border-2 border-white dark:border-slate-900 rounded-full shadow-[0_0_10px_#f59e0b] animate-ping"
                  title="جاري التحديث ومزامنة المواقيت أونلاين... 🟡"
                />
              ) : isOnline ? (
                <span 
                  className="absolute bottom-0.5 end-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-[0_0_8px_#10b981]"
                  title="متصل بالشبكة - الخدمة أونلاين 🟢"
                />
              ) : (
                <span 
                  className="absolute bottom-0.5 end-0.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full shadow-[0_0_8px_#f43f5e] animate-pulse"
                  title="غير متصل بالشبكة - يعمل أوفلاين بالكامل 🔴"
                />
              )}
            </motion.button>
          </div>

          <div className="flex flex-col text-end min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <h1 className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">هِمَّتِي</h1>
            </div>
            <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('trigger-gps-sync'));
                }}
                className="text-[9px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-0.5 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer truncate"
                title="اضغط لتحديث موقعك ومزامنة المواقيت تلقائياً عبر الـ GPS 📡"
                aria-label="مزامنة وتحديث الموقع الجغرافي والمواقيت"
              >
                <MapPin className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                <span className="truncate max-w-[80px] sm:max-w-[120px]">{settings.cityName || 'الإسكندرية'}</span>
              </button>
              <WeatherWidget lat={settings.latitude} lng={settings.longitude} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Left side: Streamlined High-Priority Action Panel */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Worship Alarms Shortcut Button */}
        <button 
          onClick={() => setActiveTab('alarms')}
          className="w-8.5 h-8.5 md:w-9.5 md:h-9.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
          title="منبهات العبادات والصلوات ⏰"
          aria-label="منبهات العبادات والصلوات"
        >
          <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </button>

        {/* Minaret / Athan Simulator Button */}
        <button 
          onClick={() => {
            window.dispatchEvent(new CustomEvent('trigger-athan-simulation'));
          }}
          className="w-8.5 h-8.5 md:w-9.5 md:h-9.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
          title="محاكاة تجربة الأذان الكاملة 🕌"
          aria-label="تشغيل محاكاة تجربة الأذان الكاملة"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a1.5 1.5 0 0 0-1.5 1.5v2h3v-2A1.5 1.5 0 0 0 12 2z" />
            <path d="M9 7c0-2 1.5-3 3-3s3 1 3 3v2H9V7z" />
            <path d="M8 9h8v3H8z" />
            <path d="M9 12h6v8H9z" />
            <path d="M11 15v3h2v-3z" />
            <path d="M6 20h12v2H6z" />
          </svg>
        </button>

        {/* Interactive Feature Guide Tour Button */}
        <button 
          onClick={() => setIsTourModalOpen(true)}
          className="w-8.5 h-8.5 md:w-9.5 md:h-9.5 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 relative shadow-2xs group"
          title="جولة تفاعلية في مزايا التطبيق 💡"
          aria-label="بدء جولة تفاعلية في مزايا التطبيق"
        >
          <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-300 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
          <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
        </button>

        {/* Theme toggle button */}
        <button 
          onClick={() => {
            const nextTheme = settings.theme === 'light' ? 'dark' : settings.theme === 'dark' ? 'system' : 'light';
            setSettings(prev => ({ ...prev, theme: nextTheme }));
          }}
          className="w-8.5 h-8.5 md:w-9.5 md:h-9.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/50 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
          title="تغيير المظهر"
          aria-label="تغيير مظهر التطبيق (ليلي / نهاري / نظام)"
        >
          {settings.theme === 'light' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : settings.theme === 'dark' ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : (
            <Monitor className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>
    </header>
  );
};
