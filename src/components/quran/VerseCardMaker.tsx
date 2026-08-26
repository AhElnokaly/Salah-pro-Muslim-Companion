/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  X, 
  Type, 
  BookOpen, 
  Download,
  Moon,
  Palette
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { SURAHS_LIST, SAMPLE_AYAHS, SampleAyah } from '../../data/quranData';
import { toArabicNumbers } from '../../utils/hijri';
import { VerseCardConfig } from '../../types';

interface VerseCardMakerProps {
  initialConfig?: Partial<VerseCardConfig>;
  onClose?: () => void;
  isModal?: boolean;
}

export default function VerseCardMaker({
  initialConfig,
  onClose,
  isModal = false
}: VerseCardMakerProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(
    initialConfig?.surahNumber || 94
  );
  const [ayahNumber, setAyahNumber] = useState<string | number>(
    initialConfig?.ayahNumber || '٥-٦'
  );
  const [ayahText, setAyahText] = useState<string>(
    initialConfig?.ayahText || 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا'
  );
  const [theme, setTheme] = useState<'green_gradient' | 'cream_light' | 'dark_elegant' | 'cyan_gold'>(
    initialConfig?.theme || 'green_gradient'
  );
  const [fontSize, setFontSize] = useState<number>(initialConfig?.fontSize || 22);
  const [wisdomWord, setWisdomWord] = useState<string>(initialConfig?.wisdomWord || 'يُسْر');

  const [copiedText, setCopiedText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const currentSurah = SURAHS_LIST.find(s => s.number === selectedSurahNumber) || SURAHS_LIST[93];

  const handleSelectSample = (sample: SampleAyah) => {
    setSelectedSurahNumber(sample.surahNumber);
    setAyahNumber(sample.ayahNumber);
    setAyahText(sample.text);
    if (sample.wisdomWord) setWisdomWord(sample.wisdomWord);
  };

  const handleSurahChange = (num: number) => {
    setSelectedSurahNumber(num);
    const surah = SURAHS_LIST.find(s => s.number === num);
    if (surah) {
      setAyahNumber('١');
    }
  };

  const handleCopyText = async () => {
    const textToCopy = `﴿ ${ayahText} ﴾\n[${currentSurah.name} : ${ayahNumber}]`;
    await navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleShareImage = async () => {
    if (!cardRef.current) return;
    setIsGeneratingImage(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      
      // Convert dataUrl to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `ayah-${selectedSurahNumber}-${ayahNumber}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `بطاقة آية - ${currentSurah.name}`,
          text: `﴿ ${ayahText} ﴾ - ${currentSurah.name}`,
        });
      } else {
        // Fallback: Download
        const link = document.createElement('a');
        link.download = `ayah-${selectedSurahNumber}-${ayahNumber}.png`;
        link.href = dataUrl;
        link.click();
      }
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('Error generating verse image:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Theme Styles
  const getThemeClasses = () => {
    switch (theme) {
      case 'cream_light':
        return {
          cardBg: 'bg-[#FAF7F2] text-amber-950 border border-amber-200/80 shadow-md',
          ornament: 'border-amber-400/50',
          moonColor: 'text-amber-600',
          badge: 'bg-amber-100/80 border border-amber-300 text-amber-900',
          wisdom: 'text-amber-700/80 bg-amber-50 border border-amber-200/60',
          verseText: 'text-amber-950'
        };
      case 'dark_elegant':
        return {
          cardBg: 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-amber-100 border border-slate-800 shadow-xl',
          ornament: 'border-amber-400/40',
          moonColor: 'text-amber-400',
          badge: 'bg-amber-950/60 border border-amber-500/40 text-amber-300',
          wisdom: 'text-amber-300 bg-amber-950/30 border border-amber-500/30',
          verseText: 'text-amber-100'
        };
      case 'cyan_gold':
        return {
          cardBg: 'bg-gradient-to-br from-cyan-900 via-teal-900 to-slate-900 text-cyan-50 border border-cyan-700/50 shadow-lg',
          ornament: 'border-cyan-300/40',
          moonColor: 'text-cyan-300',
          badge: 'bg-cyan-950/60 border border-cyan-400/40 text-cyan-200',
          wisdom: 'text-cyan-200 bg-cyan-950/40 border border-cyan-500/30',
          verseText: 'text-cyan-50'
        };
      case 'green_gradient':
      default:
        return {
          cardBg: 'bg-gradient-to-br from-emerald-900 via-emerald-850 to-teal-950 text-emerald-50 border border-emerald-700/50 shadow-lg',
          ornament: 'border-amber-300/40',
          moonColor: 'text-amber-300',
          badge: 'bg-emerald-950/60 border border-amber-400/40 text-amber-200',
          wisdom: 'text-amber-200 bg-emerald-950/40 border border-amber-400/30',
          verseText: 'text-emerald-50'
        };
    }
  };

  const style = getThemeClasses();

  return (
    <div className={`space-y-6 ${isModal ? 'p-1 sm:p-2' : ''}`} dir="rtl">
      {/* Header if modal or header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100">
            صانع بطاقات الآيات
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Sample Selector */}
      <div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          آيات ملهمة مقترحة:
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SAMPLE_AYAHS.map(sample => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 text-xs shrink-0 transition-all border border-slate-200/60 dark:border-slate-700/60"
            >
              {sample.surahName} ({sample.ayahNumber})
            </button>
          ))}
        </div>
      </div>

      {/* PREVIEW CARD CONTAINER */}
      <div className="flex justify-center my-2">
        <div
          ref={cardRef}
          className={`relative w-full max-w-sm sm:max-w-md min-h-[300px] p-7 rounded-3xl flex flex-col items-center justify-between transition-all duration-300 ${style.cardBg}`}
          dir="rtl"
        >
          {/* Geometric Corner Ornaments (┌ ┐ └ ┘) */}
          <div className={`absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 ${style.ornament} rounded-tr-lg`} />
          <div className={`absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 ${style.ornament} rounded-tl-lg`} />
          <div className={`absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 ${style.ornament} rounded-br-lg`} />
          <div className={`absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 ${style.ornament} rounded-bl-lg`} />

          {/* Crescent Moon Header */}
          <div className="flex items-center gap-1.5 pt-1">
            <Moon className={`w-5 h-5 fill-current ${style.moonColor}`} />
          </div>

          {/* Verse Text Area */}
          <div className="my-6 text-center px-2 flex-1 flex items-center justify-center">
            <p
              className={`font-serif leading-relaxed text-center ${style.verseText}`}
              style={{ fontSize: `${fontSize}px`, fontFamily: 'Traditional Arabic, Scheherazade New, Amiri, serif' }}
            >
              ﴿ {ayahText} ﴾
            </p>
          </div>

          {/* Bottom Badge (Surah & Ayah) */}
          <div className="flex flex-col items-center gap-2">
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-sm ${style.badge}`}>
              سورة {currentSurah.name} · الآية {toArabicNumbers(ayahNumber)}
            </div>

            {wisdomWord && (
              <div className={`px-3 py-0.5 rounded-md text-[11px] font-semibold ${style.wisdom}`}>
                {wisdomWord}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTROLS SECTION */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-4 border border-slate-200/80 dark:border-slate-800">
        {/* Row 1: Surah & Ayah Input */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              السورة
            </label>
            <select
              value={selectedSurahNumber}
              onChange={(e) => handleSurahChange(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            >
              {SURAHS_LIST.map(surah => (
                <option key={surah.number} value={surah.number}>
                  {toArabicNumbers(surah.number)}. سورة {surah.name} ({toArabicNumbers(surah.numberOfAyahs)} آية)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              رقم الآية / المدى
            </label>
            <input
              type="text"
              value={ayahNumber}
              onChange={(e) => setAyahNumber(e.target.value)}
              placeholder="مثال: ٥ أو ٥-٦"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Row 2: Custom Verse Text */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            نص الآية
          </label>
          <textarea
            rows={2}
            value={ayahText}
            onChange={(e) => setAyahText(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs leading-relaxed text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-serif"
          />
        </div>

        {/* Row 3: Theme Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-emerald-600" />
            نمط الألوان
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setTheme('green_gradient')}
              className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                theme === 'green_gradient' 
                  ? 'bg-emerald-900 text-amber-300 border-amber-400 ring-2 ring-emerald-500' 
                  : 'bg-emerald-800/80 text-emerald-100 border-transparent'
              }`}
            >
              أخضر زمردي
            </button>

            <button
              type="button"
              onClick={() => setTheme('cream_light')}
              className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                theme === 'cream_light' 
                  ? 'bg-[#FAF7F2] text-amber-950 border-amber-400 ring-2 ring-amber-500' 
                  : 'bg-stone-200 text-stone-800 border-transparent'
              }`}
            >
              كريمي هادئ
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark_elegant')}
              className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                theme === 'dark_elegant' 
                  ? 'bg-slate-950 text-amber-300 border-amber-400 ring-2 ring-amber-500' 
                  : 'bg-slate-900 text-slate-300 border-transparent'
              }`}
            >
              أنيق داكن
            </button>

            <button
              type="button"
              onClick={() => setTheme('cyan_gold')}
              className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                theme === 'cyan_gold' 
                  ? 'bg-cyan-900 text-amber-200 border-amber-300 ring-2 ring-cyan-500' 
                  : 'bg-cyan-800/80 text-cyan-100 border-transparent'
              }`}
            >
              سماوي ذهبي
            </button>
          </div>
        </div>

        {/* Row 4: Font Size Slider & Wisdom Word */}
        <div className="grid grid-cols-2 gap-3 items-center">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              <span>حجم الخط:</span>
              <span className="text-emerald-600">{toArabicNumbers(fontSize)}px</span>
            </div>
            <input
              type="range"
              min="16"
              max="34"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              كلمة حكمة أسفل البطاقة
            </label>
            <input
              type="text"
              value={wisdomWord}
              onChange={(e) => setWisdomWord(e.target.value)}
              placeholder="مثال: يُسْر أو صَبْر"
              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleShareImage}
          disabled={isGeneratingImage}
          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          {isGeneratingImage ? (
            <span>جاري إنشاء الصورة...</span>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>مشاركة كصورة</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCopyText}
          className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          {copiedText ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>تم النسخ!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>نسخ النص</span>
            </>
          )}
        </button>
      </div>

      {showSuccessToast && (
        <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs text-center font-bold animate-fadeIn">
          تمت مشاركة بطاقة الآية بنجاح! ✨
        </div>
      )}
    </div>
  );
}
