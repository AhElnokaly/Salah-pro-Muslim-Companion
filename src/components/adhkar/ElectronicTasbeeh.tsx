/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { FREE_TASBEEH_PRESETS } from '../../utils/adhkarData';
import { toArabicNumbers } from '../../utils/hijri';
import { UseAdhkarTasbeehReturn } from '../../hooks/useAdhkarTasbeeh';

export interface ElectronicTasbeehProps {
  tasbeeh: UseAdhkarTasbeehReturn;
}

const TASBEEH_COLORS: Record<string, { bg: string; shadow: string; targetBtn: string; dot: string; name: string }> = {
  emerald: {
    bg: 'bg-gradient-to-tr from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600',
    shadow: 'shadow-emerald-200/50',
    targetBtn: 'bg-emerald-600 text-white',
    dot: 'bg-emerald-600',
    name: 'زمردي'
  },
  indigo: {
    bg: 'bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600',
    shadow: 'shadow-indigo-200/50',
    targetBtn: 'bg-indigo-600 text-white',
    dot: 'bg-indigo-600',
    name: 'نيلي'
  },
  amber: {
    bg: 'bg-gradient-to-tr from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600',
    shadow: 'shadow-amber-200/50',
    targetBtn: 'bg-amber-600 text-white',
    dot: 'bg-amber-600',
    name: 'كهرماني'
  },
  rose: {
    bg: 'bg-gradient-to-tr from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600',
    shadow: 'shadow-rose-200/50',
    targetBtn: 'bg-rose-600 text-white',
    dot: 'bg-rose-600',
    name: 'وردي'
  },
  slate: {
    bg: 'bg-gradient-to-tr from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800',
    shadow: 'shadow-slate-300/50',
    targetBtn: 'bg-slate-800 text-white',
    dot: 'bg-slate-800',
    name: 'ملكي'
  }
};

export const ElectronicTasbeeh: React.FC<ElectronicTasbeehProps> = ({ tasbeeh }) => {
  const {
    tasbeehPresetIdx,
    setTasbeehPresetIdx,
    customTasbeehText,
    setCustomTasbeehText,
    isCustomTasbeeh,
    setIsCustomTasbeeh,
    tasbeehCount,
    setTasbeehCount,
    tasbeehTarget,
    setTasbeehTarget,
    tasbeehColor,
    selectColor,
    customTasbeehs,
    addCustomTasbeeh,
    removeCustomTasbeeh,
    handleIncrementTasbeeh,
    resetCount,
    showCompletionNotice,
  } = tasbeeh;

  const activeColor = TASBEEH_COLORS[tasbeehColor] || TASBEEH_COLORS.indigo;

  return (
    <div className="space-y-6 text-right">
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">اختر الذكر المفضل:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsCustomTasbeeh(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                !isCustomTasbeeh 
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 font-extrabold' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              الرئيسية
            </button>
            <button
              type="button"
              onClick={() => setIsCustomTasbeeh(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                isCustomTasbeeh 
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 font-extrabold' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              كتابة مخصص
            </button>
          </div>
        </div>

        {/* Presets vs Custom input */}
        {!isCustomTasbeeh ? (
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto no-scrollbar pe-1">
            {FREE_TASBEEH_PRESETS.map((preset, i) => (
              <button
                key={preset.text}
                type="button"
                onClick={() => {
                  setTasbeehPresetIdx(i);
                  setTasbeehCount(0);
                }}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-right transition-all cursor-pointer ${
                  tasbeehPresetIdx === i 
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-extrabold' 
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {preset.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={customTasbeehText}
                onChange={(e) => setCustomTasbeehText(e.target.value)}
                placeholder="اكتب صيغة الذكر الخاص بك..."
                className="flex-1 py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (customTasbeehText.trim()) {
                    addCustomTasbeeh(customTasbeehText.trim());
                  }
                }}
                className="py-2 px-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                حفظ
              </button>
            </div>

            {customTasbeehs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {customTasbeehs.map((txt) => (
                  <span
                    key={txt}
                    onClick={() => {
                      setCustomTasbeehText(txt);
                      setTasbeehCount(0);
                    }}
                    className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer hover:bg-slate-200"
                  >
                    <span>{txt}</span>
                    <Trash2 
                      className="w-3 h-3 text-red-500 hover:text-red-700 cursor-pointer" 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustomTasbeeh(txt);
                      }}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Completion Notice Toast */}
      {showCompletionNotice && (
        <div className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 p-3 rounded-2xl flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>ما شاء الله! أتممت دورة التسبيح ({toArabicNumbers(tasbeehTarget)} مرة) تقبل الله طاعتكم! 🌟</span>
        </div>
      )}

      {/* Interactive Counter Ring */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center justify-center space-y-5 shadow-xs relative overflow-hidden">
        
        {/* Controls Bar: Target & Color Selectors */}
        <div className="flex flex-wrap items-center justify-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 w-full">
          {/* Target Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الهدف:</span>
            {[33, 100, 1000].map((tgt) => (
              <button
                key={tgt}
                type="button"
                onClick={() => {
                  setTasbeehTarget(tgt);
                  setTasbeehCount(0);
                }}
                aria-label={`تحديد هدف التسبيح ${toArabicNumbers(tgt)} مرة`}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  tasbeehTarget === tgt 
                    ? `${activeColor.targetBtn} shadow-xs` 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {toArabicNumbers(tgt)}
              </button>
            ))}
          </div>

          {/* Color Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">اللون:</span>
            <div className="flex items-center gap-1.5">
              {Object.keys(TASBEEH_COLORS).map((cKey) => {
                const cObj = TASBEEH_COLORS[cKey];
                const isSelected = tasbeehColor === cKey;
                return (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => selectColor(cKey)}
                    title={cObj.name}
                    aria-label={`لون السبحة: ${cObj.name}`}
                    className={`w-5 h-5 rounded-full ${cObj.dot} border-2 transition-all cursor-pointer ${
                      isSelected ? 'border-white ring-2 ring-slate-400 scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Tasbeeh Button */}
        <button
          type="button"
          onClick={handleIncrementTasbeeh}
          aria-label={`تسبيح: ${toArabicNumbers(tasbeehCount)} من ${toArabicNumbers(tasbeehTarget)}`}
          className={`w-52 h-52 rounded-full ${activeColor.bg} text-white flex flex-col items-center justify-center shadow-xl ${activeColor.shadow} dark:shadow-none border-4 border-white dark:border-slate-800 cursor-pointer active:scale-95 transition-all relative select-none`}
        >
          <span className="text-5xl font-black">{toArabicNumbers(tasbeehCount)}</span>
          <span className="text-xs font-extrabold text-white/90 mt-1 border-t border-white/20 pt-1 px-4">
            من {toArabicNumbers(tasbeehTarget)}
          </span>
          <span className="text-[11px] font-extrabold mt-2 bg-black/20 px-3 py-0.5 rounded-full">
            اضغط للتسبيح 📿
          </span>
        </button>

        {/* Current Text Display */}
        <p className="text-base font-black text-slate-800 dark:text-white text-center max-w-sm">
          {isCustomTasbeeh ? (customTasbeehText || 'سُبْحَانَ اللهِ') : FREE_TASBEEH_PRESETS[tasbeehPresetIdx].text}
        </p>

        <button
          type="button"
          onClick={resetCount}
          aria-label="تصفير وإعادة تعيين عداد التسبيح"
          className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
        >
          <RotateCcw className="w-4 h-4" />
          <span>إعادة العداد</span>
        </button>
      </div>
    </div>
  );
};

export default ElectronicTasbeeh;
