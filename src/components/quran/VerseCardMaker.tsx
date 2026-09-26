/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { X, Share2, Copy, Check, Sparkles, Download, Type } from 'lucide-react';
import { VerseCardConfig } from '../../types';
import { SURAHS_LIST } from '../../data/quranData';
import { toArabicNumbers } from '../../utils/hijri';

export interface VerseCardMakerProps {
  initialConfig?: Partial<VerseCardConfig>;
  onClose?: () => void;
  isModal?: boolean;
}

export const VerseCardMaker: React.FC<VerseCardMakerProps> = ({
  initialConfig,
  onClose,
  isModal = true,
}) => {
  const [surahNumber, setSurahNumber] = useState<number>(initialConfig?.surahNumber || 1);
  const [ayahNumber, setAyahNumber] = useState<number | string>(initialConfig?.ayahNumber || 1);
  const [ayahText, setAyahText] = useState<string>(
    initialConfig?.ayahText || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
  );
  const [theme, setTheme] = useState<VerseCardConfig['theme']>(
    initialConfig?.theme || 'green_gradient'
  );
  const [fontSize, setFontSize] = useState<number>(initialConfig?.fontSize || 20);
  const [copied, setCopied] = useState<boolean>(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const currentSurah = SURAHS_LIST.find((s) => s.number === surahNumber) || SURAHS_LIST[0];

  const themeStyles = {
    green_gradient: {
      card: 'bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 text-white border-emerald-500/30',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      text: 'text-amber-100',
    },
    cream_light: {
      card: 'bg-[#faf6ee] text-slate-800 border-amber-300/40 shadow-md',
      badge: 'bg-amber-100 text-amber-800 border-amber-300/60',
      text: 'text-slate-800',
    },
    dark_elegant: {
      card: 'bg-[#0f141c] text-white border-white/10 shadow-2xl',
      badge: 'bg-white/10 text-amber-300 border-white/15',
      text: 'text-slate-100',
    },
    cyan_gold: {
      card: 'bg-gradient-to-br from-cyan-950 via-slate-900 to-amber-950/80 text-white border-cyan-500/30',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      text: 'text-amber-200',
    },
  }[theme];

  const handleCopyText = async () => {
    const textToCopy = `﴿ ${ayahText} ﴾ [سورة ${currentSurah.name}: ${ayahNumber}]`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleShare = async () => {
    const shareText = `﴿ ${ayahText} ﴾ [سورة ${currentSurah.name}: ${ayahNumber}]\nتطبيق هِمَّتِي`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `آية من سورة ${currentSurah.name}`,
          text: shareText,
        });
      } catch {
        handleCopyText();
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
            صانع بطاقات الآيات القرآنية ✨
          </h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Card Preview Container */}
      <div
        ref={cardRef}
        className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all duration-300 flex flex-col items-center justify-center text-center gap-4 ${themeStyles.card}`}
      >
        {/* Subtle Decorative Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Surah & Ayah Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-black border z-10 ${themeStyles.badge}`}>
          سورة {currentSurah.name} • الآية {toArabicNumbers(ayahNumber)}
        </div>

        {/* Ayah Text */}
        <p
          className={`font-amiri font-bold leading-loose z-10 max-w-md ${themeStyles.text}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          ﴿ {ayahText} ﴾
        </p>

        {/* App Footer Branding */}
        <span className="text-[10px] font-bold opacity-60 z-10">
          هِمَّتِي • رفيقك الإيماني اليومي
        </span>
      </div>

      {/* Editor Controls */}
      <div className="space-y-3 pt-2">
        {/* Surah Selection */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
              السورة:
            </label>
            <select
              value={surahNumber}
              onChange={(e) => {
                const num = parseInt(e.target.value, 10);
                setSurahNumber(num);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-800 dark:text-slate-100"
            >
              {SURAHS_LIST.map((s) => (
                <option key={s.number} value={s.number}>
                  {toArabicNumbers(s.number)}. سورة {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
              رقم الآية:
            </label>
            <input
              type="text"
              value={ayahNumber}
              onChange={(e) => setAyahNumber(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-800 dark:text-slate-100 text-center"
            />
          </div>
        </div>

        {/* Ayah Text Editor */}
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
            نص الآية الكريمة:
          </label>
          <textarea
            rows={2}
            value={ayahText}
            onChange={(e) => setAyahText(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 leading-relaxed font-amiri"
          />
        </div>

        {/* Themes Selector */}
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
            سمة التصميم:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'green_gradient', name: 'زمردي', bg: 'bg-emerald-800' },
              { id: 'cream_light', name: 'ورقي ناصع', bg: 'bg-[#faf6ee]' },
              { id: 'dark_elegant', name: 'ليلي فاخر', bg: 'bg-slate-900' },
              { id: 'cyan_gold', name: 'سماوي ذهبي', bg: 'bg-cyan-900' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id as any)}
                className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  theme === t.id
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 font-black'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFontSize((prev) => Math.max(16, prev - 2))}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
            title="تصغير الخط"
          >
            A-
          </button>
          <button
            type="button"
            onClick={() => setFontSize((prev) => Math.min(32, prev + 2))}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
            title="تكبير الخط"
          >
            A+
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>مشاركة البطاقة</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerseCardMaker;
