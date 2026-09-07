/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Info, ChevronLeft, Star, Sparkles, Eye, Sun, BookOpen } from 'lucide-react';
import { MoonPhaseDetails, LunarMansion, LUNAR_MANSIONS } from './lunarMansionsData';

interface MoonSubTabsProps {
  activeSubTab: 'overview' | 'mansions' | 'islamic' | 'phenomena';
  currentPhase: MoonPhaseDetails;
  targetHijriDay: number;
  currentMansion: LunarMansion;
  toArabicNumbers: (val: string | number) => string;
  onNavigateTab?: (tab: string) => void;
}

export default function MoonSubTabs({
  activeSubTab,
  currentPhase,
  targetHijriDay,
  currentMansion,
  toArabicNumbers,
  onNavigateTab
}: MoonSubTabsProps) {
  return (
    <>
      {/* SUBTAB 1: OVERVIEW & FASTING ACTION */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                <span>تفاصيل الطور الحالي: {currentPhase.name}</span>
              </h3>
              <span className="text-xs font-bold text-slate-400">
                اليوم {toArabicNumbers(targetHijriDay)} من الشهر
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {currentPhase.desc}
            </p>

            <div className="bg-indigo-950/40 border border-indigo-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-black text-amber-300 block">✨ التوجيه العبادي والروحي:</span>
                <p className="text-xs text-indigo-200 font-bold">{currentPhase.fastingNote}</p>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('fasting')}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                >
                  <span>سجل صيام النوافل</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 8 MOON PHASES CYCLE SUMMARY GRID */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h4 className="text-xs font-black text-slate-300">أطوار القمر الثمانية الرئيسية في الإسلام:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { name: 'المحاق', days: '١ - ٣٠', icon: '🌑', desc: 'رؤية الهلال وولادته' },
                { name: 'الهلال', days: '٢ - ٦', icon: '🌒', desc: 'أول أيام الشهر' },
                { name: 'التربيع الأول', days: '٧ - ٨', icon: '🌓', desc: 'ربع الشهر' },
                { name: 'الأحدب المتزايد', days: '٩ - ١٢', icon: '🌔', desc: 'اقتراب البدر' },
                { name: 'البدر المكتمل', days: '١٣ - ١٥', icon: '🌕', desc: 'أيام البيض' },
                { name: 'الأحدب المتناقص', days: '١٦ - ١٩', icon: '🌖', desc: 'بعد البدر' },
                { name: 'التربيع الأخير', days: '٢٠ - ٢٣', icon: '🌗', desc: 'ثلاثة أرباع الشهر' },
                { name: 'الهلال المتناقص', days: '٢٤ - ٢٩', icon: '🌘', desc: 'آخر الشهر الهجري' },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                  <span className="text-2xl block">{item.icon}</span>
                  <span className="text-xs font-black text-amber-300 block">{item.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">أيام {toArabicNumbers(item.days)}</span>
                  <span className="text-[10px] text-slate-500 block">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: THE 28 LUNAR MANSIONS */}
      {activeSubTab === 'mansions' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>المنزلة الحالية: منزلة {currentMansion.name}</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">{currentMansion.transliteration} • {currentMansion.stars}</p>
              </div>
              <span className="text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full">
                المنزلة رقم {toArabicNumbers(currentMansion.id)} من ٢٨
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-black text-amber-400 block">📖 المعنى والموقع الفلكي:</span>
                <p className="text-xs text-slate-300 leading-relaxed">{currentMansion.meaning}</p>
              </div>

              <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-black text-emerald-400 block">🌿 التراث العربي والأثر الفلاحي:</span>
                <p className="text-xs text-slate-300 leading-relaxed">{currentMansion.heritageNote}</p>
              </div>
            </div>

            {/* POETRY BOX */}
            <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border border-amber-500/30 rounded-2xl p-4 text-center space-y-2">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">✨ من شعر العرب في هذه المنزلة</span>
              <p className="text-sm font-serif font-black text-amber-100 leading-loose" dir="rtl">
                "{currentMansion.poetry}"
              </p>
              <span className="text-[10px] text-slate-400 font-bold block">— {currentMansion.poet}</span>
            </div>
          </div>

          {/* ALL 28 MANSIONS EXPLORER */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h4 className="text-xs font-black text-slate-300">دليل منازل القمر الـ ٢٨ كاملة:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto pe-1">
              {LUNAR_MANSIONS.map((mansion) => {
                const isCurrent = mansion.id === currentMansion.id;
                return (
                  <div
                    key={mansion.id}
                    className={`p-2.5 rounded-xl border transition-all text-end ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-md'
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span>منزلة {toArabicNumbers(mansion.id)}</span>
                      <span className={isCurrent ? 'text-slate-900' : 'text-slate-500'}>{mansion.season}</span>
                    </div>
                    <span className="text-xs font-black block mt-0.5">{mansion.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ISLAMIC OBSERVANCES & HILAL */}
      {activeSubTab === 'islamic' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Box 1: Ayyam al-Beed */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-black text-sm border-b border-slate-800 pb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>أيام البيض (١٣، ١٤، ١٥ هجرياً)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                عن أبي هريرة رضي الله عنه قال: «أَوْصَانِي خَلِيلِي صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ بِثَلاَثٍ: صِيَامِ ثَلاَثَةِ أَيَّامٍ مِنْ كُلِّ شَهْرٍ...».
              </p>
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>اليوم الأول (١٣):</span>
                  <span className="font-bold text-amber-400">{targetHijriDay === 13 ? 'اليوم!' : 'متوقع قريباً'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>اليوم الثاني (١٤):</span>
                  <span className="font-bold text-amber-400">{targetHijriDay === 14 ? 'اليوم!' : 'منتصف الشهر'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>اليوم الثالث (١٥):</span>
                  <span className="font-bold text-amber-400">{targetHijriDay === 15 ? 'اليوم!' : 'ختام البيض'}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Hilal Sighting & Sacred Months */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-black text-sm border-b border-slate-800 pb-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>استطلاع الهلال والأشهر الحُرُم</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                سُنّة الدعاء عند رؤية الهلال: «اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالأَمْنِ وَالإِيمَانِ وَالسَّلاَمَةِ وَالإِسْلاَمِ، رَبِّي وَرَبُّكَ اللَّهُ».
              </p>
              <div className="bg-indigo-950/40 p-3 rounded-2xl border border-indigo-900/50 text-xs space-y-1.5">
                <span className="font-black text-indigo-300 block">الأشهر الحرم الأربعة:</span>
                <p className="text-[11px] text-slate-300">
                  ذو القعدة • ذو الحجة • المحرم • رجب. يعظم فيها أجر الطاعات وتضاعف الحسنات.
                </p>
              </div>
            </div>
          </div>

          {/* ECLIPSE & SUNNAH PRAYER GUIDANCE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h4 className="text-xs font-black text-amber-300 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>صلاة الخسوف والكسوف عند الظواهر القمرية:</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              قال النبي ﷺ: «إنَّ الشَّمْسَ والقَمَرَ آيَتانِ مِنْ آياتِ اللَّهِ، لا يَخْسِفانِ لِمَوْتِ أحَدٍ ولا لِحَياتِهِ، فَإذا رأَيْتُمُوهُما فادْعُوا اللَّهَ وكَبِّرُوا وصَلُّوا وتَصَدَّقُوا».
            </p>
            <div className="grid sm:grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <span className="font-bold text-amber-400 block">صفة الصلاة</span>
                <span className="text-[11px] text-slate-400 mt-1 block">ركعتان في كل ركعة قيامان وقراءتان وركوعان</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <span className="font-bold text-amber-400 block">وقتها</span>
                <span className="text-[11px] text-slate-400 mt-1 block">من بداية انكساف القمر حتى انجلاؤه ورجوعه</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <span className="font-bold text-amber-400 block">المستحبات</span>
                <span className="text-[11px] text-slate-400 mt-1 block">الإكثار من التكبير والاستغفار والصدقة</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PHENOMENA & HERITAGE */}
      {activeSubTab === 'phenomena' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-black text-amber-300 flex items-center gap-2 border-b border-slate-800 pb-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>الظواهر الفلكية القمرية والتراث العربي</span>
            </h3>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs font-black text-amber-400 block">🌕 القمر العملاق (Supermoon)</span>
                <p className="text-xs text-slate-300">
                  حدث فلكي يقع عندما يكون القمر في أقرب نقطة له من الأرض (الحضيض)، فيبدو أكبر حجماً بـ ١٤٪ وأشد ضياءً بـ ٣٠٪.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs font-black text-amber-400 block">🌑 القمر الدموي (Blood Moon)</span>
                <p className="text-xs text-slate-300">
                  ظاهرة تقع أثناء الخسوف الكلي حيث يمر القمر بظل الأرض وينعكس عليه الضوء الأحمر عبر الغلاف الجوي للأرض.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs font-black text-amber-400 block">🌊 أثر المد والجزر</span>
                <p className="text-xs text-slate-300">
                  تصل قوة جاذبية القمر لقمّتها في ليلتي المحاق والبدر المكتمل، مما يؤدي لأعلى ارتفاع في منسوب مياه البحار (المد العالي).
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs font-black text-amber-400 block">🐪 القمر في الملاحة والأسفار</span>
                <p className="text-xs text-slate-300">
                  اعتمدت العرب والمسافرون قديماً على منازل القمر الـ ٢٨ لتحديد الاتجاهات في الفيافي والبحار ومعرفة نضج المحاصيل.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
