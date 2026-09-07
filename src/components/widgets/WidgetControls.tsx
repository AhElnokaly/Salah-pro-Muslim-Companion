/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Pin, Download, Palette, LayoutGrid, Clock, BellOff } from 'lucide-react';

export type WidgetType = 'custom' | 'timeline' | 'grid' | 'teal' | 'analog' | 'compact' | 'dhikr' | 'qibla' | 'calendar';
export type WidgetTheme = 'green' | 'gold' | 'glass' | 'dark-blue' | 'amber' | 'onyx';

export interface WidgetControlsProps {
  isFaithBright: boolean;
  widgetType?: WidgetType;
  setWidgetType?: (t: WidgetType) => void;
  widgetTheme: WidgetTheme;
  setWidgetTheme: (t: WidgetTheme) => void;
  cardSize?: 'compact' | 'medium' | 'large';
  setCardSize?: (s: 'compact' | 'medium' | 'large') => void;
  clockStyle: 'none' | 'digital' | 'analog';
  setClockStyle: (s: 'none' | 'digital' | 'analog') => void;
  prayerDisplay: 'none' | 'next_only' | 'all_prayers';
  setPrayerDisplay: (p: 'none' | 'next_only' | 'all_prayers') => void;
  showMoonPhase: boolean;
  setShowMoonPhase: (b: boolean) => void;
  showDate: boolean;
  setShowDate: (b: boolean) => void;
  showKhushuBtn?: boolean;
  setShowKhushuBtn?: (b: boolean) => void;
  showDhikr: boolean;
  setShowDhikr: (b: boolean) => void;
  showAyah: boolean;
  setShowAyah: (b: boolean) => void;
  showQibla: boolean;
  setShowQibla: (b: boolean) => void;
  showSubhaBtn: boolean;
  setShowSubhaBtn: (b: boolean) => void;
  showProgressBar: boolean;
  setShowProgressBar: (b: boolean) => void;
  handlePinWidget: () => void;
  handleDownloadWidgetSVG: () => void;
}

export default function WidgetControls({
  isFaithBright,
  widgetTheme,
  setWidgetTheme,
  cardSize = 'medium',
  setCardSize,
  clockStyle,
  setClockStyle,
  prayerDisplay,
  setPrayerDisplay,
  showMoonPhase,
  setShowMoonPhase,
  showDate,
  setShowDate,
  showKhushuBtn = true,
  setShowKhushuBtn,
  showDhikr,
  setShowDhikr,
  showAyah,
  setShowAyah,
  showQibla,
  setShowQibla,
  showSubhaBtn,
  setShowSubhaBtn,
  showProgressBar,
  setShowProgressBar,
  handlePinWidget,
  handleDownloadWidgetSVG,
}: WidgetControlsProps) {
  const sizeOptions: Array<{ id: 'compact' | 'medium' | 'large'; name: string; dim: string; desc: string; badge?: string }> = [
    { id: 'compact', name: 'مصغر', dim: '٢×٢', desc: 'الصلاة القادمة والوقت فقط' },
    { id: 'medium', name: 'عريض', dim: '٤×٢', desc: 'الصلوات الخمس + التاريخ الهجري', badge: 'الأكثر استخداماً' },
    { id: 'large', name: 'كبير', dim: '٤×٤', desc: 'شامل: الصلوات، الأذكار، والتسبيح' },
  ];

  const themeOptions: Array<{ id: WidgetTheme; label: string; activeStyle: string }> = [
    { id: 'glass', label: '💎 زجاج بلوري', activeStyle: 'bg-white/20 border-white/40 text-white shadow-md' },
    { id: 'onyx', label: '⬛ ليلي OLED', activeStyle: 'bg-black/90 border-slate-700 text-slate-100 shadow-md' },
    { id: 'green', label: '🟢 زمردي مكة', activeStyle: 'bg-emerald-900/60 border-emerald-500 text-emerald-300 shadow-md' },
    { id: 'gold', label: '🟡 ذهبي ملكي', activeStyle: 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-md' },
    { id: 'dark-blue', label: '🔵 كحلي هادئ', activeStyle: 'bg-blue-950/60 border-blue-500 text-blue-300 shadow-md' },
    { id: 'amber', label: '🟠 غروب دافئ', activeStyle: 'bg-amber-900/60 border-amber-600 text-amber-200 shadow-md' },
  ];

  const toggleItems = [
    {
      id: 'khushu',
      label: 'زر وضع الخشوع السريع',
      icon: <BellOff className="w-3.5 h-3.5 text-emerald-400" />,
      value: showKhushuBtn,
      toggle: () => setShowKhushuBtn && setShowKhushuBtn(!showKhushuBtn),
    },
    {
      id: 'progress',
      label: 'شريط تقدم الصلاة القادمة',
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
      value: showProgressBar,
      toggle: () => setShowProgressBar(!showProgressBar),
    },
    {
      id: 'date',
      label: 'التاريخ الهجري واليوم',
      icon: <span className="text-xs">📅</span>,
      value: showDate,
      toggle: () => setShowDate(!showDate),
    },
    {
      id: 'moon',
      label: 'طور القمر الهجري',
      icon: <span className="text-xs">🌙</span>,
      value: showMoonPhase,
      toggle: () => setShowMoonPhase(!showMoonPhase),
    },
    {
      id: 'subha',
      label: 'زر التسبيح التفاعلي',
      icon: <span className="text-xs">📿</span>,
      value: showSubhaBtn,
      toggle: () => setShowSubhaBtn(!showSubhaBtn),
    },
    {
      id: 'dhikr',
      label: 'ذكر ودعاء اليوم',
      icon: <span className="text-xs">✨</span>,
      value: showDhikr,
      toggle: () => setShowDhikr(!showDhikr),
    },
    {
      id: 'ayah',
      label: 'آية قرآنية كريمة',
      icon: <span className="text-xs">📖</span>,
      value: showAyah,
      toggle: () => setShowAyah(!showAyah),
    },
    {
      id: 'qibla',
      label: 'اتجاه القبلة والمدينة',
      icon: <span className="text-xs">🧭</span>,
      value: showQibla,
      toggle: () => setShowQibla(!showQibla),
    },
  ];

  return (
    <div className="md:col-span-7 space-y-4 flex flex-col justify-between" dir="rtl">
      {/* SECTION 1: WIDGET SIZE (Replacing repetitive 9 types) */}
      <div className="space-y-2 text-start">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>١. اختر مقاس الـ Widget على شاشتك:</span>
          </label>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
            ودجت مخصص مرن
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {sizeOptions.map((opt) => {
            const isSel = cardSize === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCardSize && setCardSize(opt.id)}
                className={`p-2.5 rounded-2xl border text-start transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isSel
                    ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-300 ring-2 ring-amber-400/40 shadow-sm'
                    : isFaithBright
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                {opt.badge && (
                  <span className="absolute top-1 end-1 bg-amber-500 text-slate-950 font-black text-[7px] px-1.5 py-0.5 rounded-full">
                    {opt.badge}
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-black">{opt.name}</span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">({opt.dim})</span>
                  </div>
                  <p className="text-[8px] text-slate-400 dark:text-slate-400 mt-1 leading-tight line-clamp-2">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: VISUAL THEME & PALETTES */}
      <div className="space-y-2 text-start">
        <label className="text-[11px] font-black text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>٢. النمط اللوني والخلفية:</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {themeOptions.map((t) => {
            const isSel = widgetTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setWidgetTheme(t.id)}
                className={`py-2 px-1 rounded-xl border text-[9.5px] font-black cursor-pointer text-center transition-all ${
                  isSel
                    ? t.activeStyle + ' ring-2 ring-white/20 scale-[1.02]'
                    : isFaithBright
                    ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: SPIRITUAL COMPONENT CONTROLS */}
      <div
        className={`p-3.5 rounded-2xl border space-y-3 ${
          isFaithBright ? 'bg-amber-50/50 border-amber-200/70' : 'bg-slate-900/70 border-white/10'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-[11px] font-black text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>٣. تخصيص محتويات الودجت الذكي:</span>
          </span>
          <span className="text-[8.5px] font-bold text-slate-400">تحكم فوري مباشر</span>
        </div>

        {/* Primary Layout Selectors (Clock + Prayers) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
          {/* Clock Style */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 dark:text-slate-400 block text-[9.5px]">
              🕒 نمط الساعة:
            </label>
            <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
              {[
                { id: 'none' as const, label: 'إخفاء' },
                { id: 'digital' as const, label: 'رقمية' },
                { id: 'analog' as const, label: 'عقارب' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setClockStyle(opt.id)}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-black cursor-pointer transition-all ${
                    clockStyle === opt.id
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prayer Display */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 dark:text-slate-400 block text-[9.5px]">
              🕌 عرض الصلوات:
            </label>
            <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
              {[
                { id: 'none' as const, label: 'إخفاء' },
                { id: 'next_only' as const, label: 'القادمة فقط' },
                { id: 'all_prayers' as const, label: 'الصلوات الخمس' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPrayerDisplay(opt.id)}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-black cursor-pointer transition-all ${
                    prayerDisplay === opt.id
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modular Feature Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[9.5px]">
          {toggleItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.toggle}
              className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                item.value
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-black'
                  : 'bg-black/15 border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <span
                className={`text-[8.5px] px-1.5 py-0.5 rounded-full font-bold ${
                  item.value ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-500'
                }`}
              >
                {item.value ? 'مفعل ✓' : 'معطل'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 4: PIN & EXPORT ACTIONS */}
      <div
        className={`p-3.5 rounded-2xl border space-y-2.5 ${
          isFaithBright ? 'bg-amber-50/50 border-amber-200/60' : 'bg-slate-900/40 border-white/5'
        }`}
      >
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase">
          ٤. حفظ المكون واستخدامه على هاتفك:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handlePinWidget}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[10.5px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Pin className="w-3.5 h-3.5" />
            <span>📌 تثبيت باللوحة الرئيسية للتطبيق</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadWidgetSVG}
            className={`py-2.5 px-3 font-black text-[10.5px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              isFaithBright
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs'
                : 'bg-slate-900 border-white/10 text-white hover:bg-slate-800 shadow-sm'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>📥 تحميل الـ Widget كملف SVG فائق الدقة</span>
          </button>
        </div>
      </div>
    </div>
  );
}
