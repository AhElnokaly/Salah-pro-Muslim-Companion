/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Search, Zap, Check, Sparkles, BookOpen, Plus } from 'lucide-react';
import { TabId } from '../../types';

export interface NavItemType {
  id: TabId;
  label: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
}

export interface FabRadialMenuProps {
  isOpen: boolean;
  activePrayerArabic: string;
  isPrayerLogged: boolean;
  adhkarText: string;
  activeTab: TabId;
  navItems: NavItemType[];
  onOpenSpiritualSearch: () => void;
  onQuickLogPrayer: () => void;
  onQuickLogAdhkar: () => void;
  onQuickLogQuran: () => void;
  onQuickTasbeeh: () => void;
  onSelectTab: (tabId: TabId) => void;
}

export const FabRadialMenu: React.FC<FabRadialMenuProps> = ({
  isOpen,
  activePrayerArabic,
  isPrayerLogged,
  adhkarText,
  activeTab,
  navItems,
  onOpenSpiritualSearch,
  onQuickLogPrayer,
  onQuickLogAdhkar,
  onQuickLogQuran,
  onQuickTasbeeh,
  onSelectTab,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 20 }}
      transition={{ type: 'spring', damping: 22, stiffness: 320 }}
      role="menu"
      aria-label="قائمة الإنجاز السريع والتنقل"
      className="absolute bottom-20 flex flex-col items-center gap-3 z-50 w-80 max-w-[92vw]"
      dir="rtl"
    >
      {/* Top Dynamic Quick Completion Pills */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="w-full bg-white/95 dark:bg-[#121924]/95 backdrop-blur-xl p-2.5 rounded-3xl border border-amber-500/30 shadow-2xl space-y-2 text-center"
      >
        {/* Spiritual Search Quick Trigger */}
        <button
          type="button"
          onClick={onOpenSpiritualSearch}
          role="menuitem"
          aria-label="البحث الروحي الشامل في القرآن والأذكار والمواقيت"
          className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer text-start active:scale-98 border border-emerald-400/30"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Search className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="text-[11px] font-black leading-tight">البحث الروحي الشامل</div>
              <div className="text-[8.5px] text-emerald-100 font-bold">قرآن، أذكار، مواقيت وتقويم 🔍</div>
            </div>
          </div>
          <div className="px-2 py-0.5 bg-amber-400 text-slate-900 rounded-lg text-[9px] font-black">
            ضغط مطوّل ⚡
          </div>
        </button>

        <div className="flex items-center justify-between px-2 text-[10px] font-black text-amber-600 dark:text-amber-400 pt-1">
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            الإنجاز السريع المباشر
          </span>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">بلمسة واحدة</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {/* Quick Log Prayer Pill */}
          <button
            type="button"
            onClick={onQuickLogPrayer}
            role="menuitem"
            aria-label={isPrayerLogged ? `تم تسجيل صلاة ${activePrayerArabic} بالفعل` : `تسجيل صلاة ${activePrayerArabic} فوراً`}
            className={`flex items-center justify-between p-2 rounded-2xl active:scale-95 transition-all cursor-pointer text-start border ${
              isPrayerLogged
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 border-emerald-500/40 shadow-xs'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/20'
            }`}
          >
            <div className="space-y-0.5">
              <div className="text-[10px] font-black leading-tight">أتممت صلاة {activePrayerArabic}</div>
              <div className={`text-[8.5px] font-bold ${
                isPrayerLogged ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-600/80 dark:text-amber-400/80'
              }`}>
                {isPrayerLogged ? 'تم تسجيل الصلاة ✔️' : 'تسجيل فوري 🕌'}
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs transition-colors ${
              isPrayerLogged ? 'bg-emerald-600' : 'bg-amber-500'
            }`}>
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </button>

          {/* Quick Log Adhkar Pill */}
          <button
            type="button"
            onClick={onQuickLogAdhkar}
            role="menuitem"
            aria-label={`فتح ورد الأذكار: ${adhkarText}`}
            className="flex items-center justify-between p-2 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 transition-all cursor-pointer text-start"
          >
            <div className="space-y-0.5">
              <div className="text-[10px] font-black leading-tight">{adhkarText}</div>
              <div className="text-[8.5px] text-indigo-600/80 dark:text-indigo-400/80 font-bold">فتح الورد 📿</div>
            </div>
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </button>
        </div>

        {/* Quran Quick Pill & Quick Tasbeeh Pill */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onQuickLogQuran}
            role="menuitem"
            aria-label="تسجيل قراءة صفحة من القرآن الكريم وإضافتها للإنجاز"
            className="flex items-center justify-between p-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition-all cursor-pointer text-start"
          >
            <div className="space-y-0.5">
              <div className="text-[10px] font-black leading-tight">ورد القرآن</div>
              <div className="text-[8.5px] text-emerald-600/80 dark:text-emerald-400/80 font-bold">+1 صفحة 📖</div>
            </div>
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </button>

          <button
            type="button"
            onClick={onQuickTasbeeh}
            role="menuitem"
            aria-label="تسجيل عشر تسبيحات في المسبحة السريعة"
            className="flex items-center justify-between p-2 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 active:scale-95 text-teal-700 dark:text-teal-300 border border-teal-500/20 transition-all cursor-pointer text-start"
          >
            <div className="space-y-0.5">
              <div className="text-[10px] font-black leading-tight">تسبيح سريع</div>
              <div className="text-[8.5px] text-teal-600/80 dark:text-teal-400/80 font-bold">+10 تسبيحات 📿</div>
            </div>
            <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </button>
        </div>
      </motion.div>

      {/* Radial Fan / Grid of Main Worship Hubs (3x3 Grid) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        role="menu"
        aria-label="أقسام العبادات الرئيسية"
        className="w-full bg-white/95 dark:bg-[#121924]/95 backdrop-blur-xl p-3 rounded-3xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl grid grid-cols-3 gap-2"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isCurrent = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              type="button"
              role="menuitem"
              aria-label={`الانتقال إلى تبويب ${item.label}${isCurrent ? ' (التبويب النشط حالياً)' : ''}`}
              aria-current={isCurrent ? 'page' : undefined}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl border transition-all cursor-pointer relative ${
                isCurrent
                  ? 'bg-gradient-to-b from-emerald-600 to-teal-700 text-white border-emerald-400 shadow-md font-black'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/50 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40'
              }`}
            >
              {item.badge && (
                <span className="absolute -top-1 -start-1 bg-amber-500 text-white text-[7.5px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                  {item.badge}
                </span>
              )}
              <div className={`p-1.5 rounded-xl ${isCurrent ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[9.5px] font-extrabold leading-tight text-center">
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default FabRadialMenu;
