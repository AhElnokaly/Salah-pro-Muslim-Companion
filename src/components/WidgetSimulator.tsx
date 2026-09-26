/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getMoonPhaseInfo } from '../utils/moonPhase';
import { AppSettings, PrayerTimes } from '../types';
import WidgetControls from './widgets/WidgetControls';
import { WidgetSimulatorHeader } from './widgets/WidgetSimulatorHeader';
import { WidgetPhoneFrame } from './widgets/WidgetPhoneFrame';
import { useWidgetSimulatorLogic, WALLPAPERS } from './widgets/useWidgetSimulatorLogic';

export { getMoonPhaseInfo };

interface WidgetSimulatorProps {
  prayerTimes: PrayerTimes | Record<string, string>;
  settings: AppSettings;
  setSettings?: React.Dispatch<React.SetStateAction<AppSettings>>;
  currentPrayer?: string;
  nextPrayer?: string;
  timeRemainingStr?: string;
  hijri?: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    fullString: string;
  };
  dayNameArabic?: string;
  gregorianStr?: string;
}

export default function WidgetSimulator({
  prayerTimes,
  settings,
  setSettings,
  currentPrayer = 'Dhuhr',
  nextPrayer = 'Asr',
  timeRemainingStr = '02:15:30',
  hijri,
  dayNameArabic = 'الجمعة',
  gregorianStr = '١٧ يوليو ٢٠٢٦',
}: WidgetSimulatorProps) {
  const [mobileTab, setMobileTab] = useState<'preview' | 'customize'>('preview');
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const logic = useWidgetSimulatorLogic({
    prayerTimes,
    settings,
    setSettings,
    currentPrayer,
    nextPrayer,
    timeRemainingStr,
    hijri,
    dayNameArabic,
    gregorianStr,
  });

  return (
    <div
      id="widget-simulator-section"
      className={`rounded-3xl border transition-all duration-300 relative overflow-hidden ${
        logic.isFaithBright
          ? 'bg-gradient-to-b from-[#faf8f2] to-[#f4f0e4] border-[#e4dcbf] shadow-md text-slate-800'
          : 'bg-[#0d131b]/95 backdrop-blur-md border-slate-800/80 shadow-2xl text-slate-100'
      }`}
      dir="rtl"
    >
      {/* Dynamic Animated Status Toast */}
      {logic.showToast && (
        <div className="absolute top-4 inset-x-4 z-50 bg-emerald-600 text-white font-black text-xs py-3 px-4 rounded-2xl shadow-xl flex items-center justify-between gap-2 animate-bounce">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <p className="text-right leading-relaxed">{logic.toastMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => logic.setShowToast(false)}
            className="text-white hover:opacity-80 text-xs font-bold bg-white/10 px-2 py-1 rounded-lg shrink-0 cursor-pointer"
          >
            حسناً
          </button>
        </div>
      )}

      {/* Header Panel */}
      <WidgetSimulatorHeader
        isFaithBright={logic.isFaithBright}
        wallpapers={WALLPAPERS}
        activeWallpaper={logic.activeWallpaper}
        onSelectWallpaper={logic.setActiveWallpaper}
      />

      {/* 1-TAP PRESET STRIP */}
      <div className="px-4 sm:px-5 pt-3 pb-1 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black text-amber-500 flex items-center gap-1.5">
            <span>⚡ قوالب جاهزة بضغطة زر:</span>
          </span>
          <span className="text-[9px] font-bold text-slate-400">تطبيق نمط فوري</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => logic.applyPreset('hero')}
            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/30 text-start transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🌟</span>
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-300">الهيرو كارد الأصلي</span>
            </div>
            <p className="text-[7.5px] text-slate-400 mt-0.5 truncate">مطابق للتطبيق 100%</p>
          </button>

          <button
            type="button"
            onClick={() => logic.applyPreset('digital')}
            className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 active:scale-95 border border-white/10 text-start transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">⏱️</span>
              <span className="text-[10px] font-black text-slate-200">الساعة الكلاسيكية</span>
            </div>
            <p className="text-[7.5px] text-slate-400 mt-0.5 truncate">ساعة رقمية بارزة</p>
          </button>

          <button
            type="button"
            onClick={() => logic.applyPreset('spiritual')}
            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 border border-emerald-500/30 text-start transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">📿</span>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-300">الأذكار والتسبيح</span>
            </div>
            <p className="text-[7.5px] text-slate-400 mt-0.5 truncate">سبحة تفاعلية + ذكر</p>
          </button>

          <button
            type="button"
            onClick={() => logic.applyPreset('minimal')}
            className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 active:scale-95 border border-cyan-500/30 text-start transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💎</span>
              <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-300">الزجاجي المصغر</span>
            </div>
            <p className="text-[7.5px] text-slate-400 mt-0.5 truncate">مربع 2×2 للصلاة القادمة</p>
          </button>
        </div>
      </div>

      {/* MOBILE SEGMENTED VIEW SWITCHER */}
      <div className="flex items-center justify-center p-1 bg-black/30 rounded-2xl mx-4 mt-3 md:hidden border border-white/10">
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'preview'
              ? 'bg-amber-400 text-slate-950 shadow-md font-black'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <span>📱 المعاينة الحية على الجوال</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('customize')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'customize'
              ? 'bg-amber-400 text-slate-950 shadow-md font-black'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <span>⚙️ خيارات التخصيص والألوان</span>
        </button>
      </div>

      {/* TWO COLUMN GRID LAB: Sleek, compact and modular */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 sm:p-5">
        {/* Left Column: Config Panels (hidden on mobile if mobileTab === 'preview') */}
        <div className={`${mobileTab === 'customize' ? 'block' : 'hidden'} md:block md:col-span-7 space-y-4`}>
          <WidgetControls
            isFaithBright={logic.isFaithBright}
            widgetType={logic.widgetType}
            setWidgetType={logic.setWidgetType}
            widgetTheme={logic.widgetTheme}
            setWidgetTheme={logic.setWidgetTheme}
            cardSize={logic.cardSize}
            setCardSize={logic.setCardSize}
            showKhushuBtn={logic.showKhushuBtn}
            setShowKhushuBtn={logic.setShowKhushuBtn}
            clockStyle={logic.clockStyle}
            setClockStyle={logic.setClockStyle}
            prayerDisplay={logic.prayerDisplay}
            setPrayerDisplay={logic.setPrayerDisplay}
            showMoonPhase={logic.showMoonPhase}
            setShowMoonPhase={logic.setShowMoonPhase}
            showDate={logic.showDate}
            setShowDate={logic.setShowDate}
            showDhikr={logic.showDhikr}
            setShowDhikr={logic.setShowDhikr}
            showAyah={logic.showAyah}
            setShowAyah={logic.setShowAyah}
            showQibla={logic.showQibla}
            setShowQibla={logic.setShowQibla}
            showSubhaBtn={logic.showSubhaBtn}
            setShowSubhaBtn={logic.setShowSubhaBtn}
            showProgressBar={logic.showProgressBar}
            setShowProgressBar={logic.setShowProgressBar}
            handlePinWidget={logic.handlePinWidget}
            handleDownloadWidgetSVG={logic.handleDownloadWidgetSVG}
          />

          {/* Quick link back to preview on mobile */}
          <div className="md:hidden pt-2">
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-amber-300 border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>📱 معاينة التغييرات على شاشة الجوال ←</span>
            </button>
          </div>
        </div>

        {/* Right Column: Smartphone frame with live-reacting Widget preview (hidden on mobile if mobileTab === 'customize') */}
        <div className={`${mobileTab === 'preview' ? 'flex flex-col items-center' : 'hidden'} md:flex md:flex-col md:items-center md:col-span-5 space-y-3`}>
          <WidgetPhoneFrame
            currentWallpaper={logic.currentWallpaper}
            internalTime={logic.internalTime}
            widgetType={logic.widgetType}
            cardSize={logic.cardSize}
            showKhushuBtn={logic.showKhushuBtn}
            getWidgetThemeClass={logic.getWidgetThemeClass}
            showDate={logic.showDate}
            dayNameArabic={dayNameArabic}
            currentDayDigit={logic.currentDayDigit}
            currentMonthName={logic.currentMonthName}
            currentYear={logic.currentYear}
            showMoonPhase={logic.showMoonPhase}
            clockStyle={logic.clockStyle}
            hrDeg={logic.hrDeg}
            minDeg={logic.minDeg}
            secDeg={logic.secDeg}
            prayerDisplay={logic.prayerDisplay}
            nextPrayer={nextPrayer}
            currentPrayer={currentPrayer}
            prayerTimes={prayerTimes}
            showProgressBar={logic.showProgressBar}
            timeRemainingStr={timeRemainingStr}
            getFormattedTimeRemaining={logic.getFormattedTimeRemaining}
            getPrayerProgressPercent={logic.getPrayerProgressPercent}
            getArabicName={logic.getArabicName}
            showDhikr={logic.showDhikr}
            showAyah={logic.showAyah}
            showQibla={logic.showQibla}
            settings={settings}
            showSubhaBtn={logic.showSubhaBtn}
            subhaCount={logic.subhaCount}
            setSubhaCount={logic.setSubhaCount}
            gregorianStr={gregorianStr}
            getCompactCountdown={logic.getCompactCountdown}
          />

          {/* Quick link to customize on mobile */}
          <div className="w-full max-w-[230px] md:hidden">
            <button
              type="button"
              onClick={() => setMobileTab('customize')}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-bold text-amber-300 border border-white/10 flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>⚙️ تخصيص الألوان والمحتويات ←</span>
            </button>
          </div>
        </div>
      </div>

      {/* PROMINENT ACTION BUTTON: Save and Sync to Phone */}
      <div className="px-4 sm:px-5 pb-3">
        <button
          type="button"
          onClick={logic.handlePinWidget}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 active:scale-[0.99] text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300/40"
        >
          <span className="text-base">🚀</span>
          <span>تطبيق وتحديث على شاشة هاتفي الآن</span>
        </button>
      </div>

      {/* INTERACTIVE GUIDE CARD: How to add to home screen */}
      <div className="px-4 sm:px-5 pb-5">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5 space-y-2">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between text-start cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">💡</span>
              <span className="text-xs font-black text-amber-300">كيف تضيف الويدجيت على الشاشة الرئيسية لجوالك؟</span>
            </div>
            <span className="text-[11px] font-bold text-white/50">{showGuide ? 'إخفاء ▲' : 'عرض الخطوات الثلاث ▼'}</span>
          </button>
          {showGuide && (
            <div className="pt-2.5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2 text-right">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px]">
                <span className="font-black text-amber-400 block mb-0.5">١. اضغط مطولاً</span>
                <p className="text-slate-300 leading-relaxed">على أي مساحة فارغة في شاشة هاتفك الرئيسية.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px]">
                <span className="font-black text-amber-400 block mb-0.5">٢. اختر أدوات (Widgets)</span>
                <p className="text-slate-300 leading-relaxed">من القائمة المنبثقة أسفل الشاشة أو في نظام هاتفك.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px]">
                <span className="font-black text-amber-400 block mb-0.5">٣. اسحب ويدجيت هِمَّتي</span>
                <p className="text-slate-300 leading-relaxed">ابحث عن تطبيق هِمَّتي ثم اسحب الويدجيت وضعه بالمكان المناسب.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
