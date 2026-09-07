/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ChevronRight,
  Sun,
  Heart,
  Sparkles,
  BookOpen,
  ListFilter,
} from 'lucide-react';
import { ADHKAR_DATA, DhikrCategory, DhikrItem } from '../../../utils/adhkarData';
import { PrayerKey } from '../../../utils/adhkarCalc';
import { toArabicNumbers } from '../../../utils/hijri';

interface AdhkarSubCategoriesViewProps {
  hubSection: 'adhkar' | 'duas' | 'ruqyah' | 'hisn';
  onBackToMainHub: () => void;
  onSelectCategory: (category: DhikrCategory) => void;
  getCategoryVisibleItems: (cat: DhikrCategory, prayerKey?: PrayerKey | null) => DhikrItem[];
  favoriteCategoryIds: string[];
  activePrayerKey: PrayerKey | null;
}

export const AdhkarSubCategoriesView: React.FC<AdhkarSubCategoriesViewProps> = ({
  hubSection,
  onBackToMainHub,
  onSelectCategory,
  getCategoryVisibleItems,
  favoriteCategoryIds,
  activePrayerKey,
}) => {
  const getSubCategories = () => {
    return ADHKAR_DATA.filter((cat) => {
      if (hubSection === 'adhkar') {
        return [
          'morning',
          'evening',
          'after_prayer',
          'sleep',
          'wake',
          'wudu',
          'toilet',
          'home',
          'walk',
          'mosque',
          'adhan',
        ].includes(cat.id);
      }
      if (hubSection === 'duas') {
        return [
          'istiftah',
          'ruku',
          'weather',
          'travel',
          'food',
          'distress',
          'anger',
          'istikhara',
          'hajj',
          'funeral',
          'salawat',
          'misc',
          'insomnia',
          'clothes',
        ].includes(cat.id);
      }
      if (hubSection === 'ruqyah') {
        return ['sick'].includes(cat.id);
      }
      return true; // hisn = all 26
    });
  };

  const subCategories = getSubCategories();

  return (
    <div className="space-y-5">
      {/* Back to Hub Header Button */}
      <button
        onClick={onBackToMainHub}
        className="py-2 px-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
      >
        <ChevronRight className="w-4 h-4" />
        <span>العودة إلى Hub الأدعية والأذكار الرئيسي</span>
      </button>

      {/* Section Header Dark Green Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-5 rounded-3xl border border-emerald-800/60 shadow-md space-y-2.5 text-right">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-800/80 text-emerald-300 border border-emerald-700/50">
              {hubSection === 'adhkar' ? (
                <Sun className="w-5 h-5" />
              ) : hubSection === 'duas' ? (
                <Heart className="w-5 h-5" />
              ) : hubSection === 'ruqyah' ? (
                <Sparkles className="w-5 h-5" />
              ) : (
                <BookOpen className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-black text-lg text-white">
                {hubSection === 'adhkar' && 'قسم الأذكار اليومية والصلوات'}
                {hubSection === 'duas' && 'قسم الأدعية المأثورة والجامعة'}
                {hubSection === 'ruqyah' && 'قسم الرقية الشرعية وأدعية الشفاء'}
                {hubSection === 'hisn' && 'فهرس كتاب حصن المسلم الكامل (٢٦ قسماً)'}
              </h3>
              <p className="text-xs text-emerald-200/80 font-medium">
                {hubSection === 'adhkar' &&
                  '﴿فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ﴾ — سورة البقرة'}
                {hubSection === 'duas' &&
                  '﴿وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ﴾ — سورة البقرة'}
                {hubSection === 'ruqyah' &&
                  '﴿وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ﴾ — سورة الإسراء'}
                {hubSection === 'hisn' &&
                  'فهرس الكتاب المرجعي مرتب بالترقيم الأصلي للدكتور سعيد بن علي بن وهف القحطاني رحمه الله'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold bg-emerald-800/60 text-emerald-200 px-3 py-1 rounded-full border border-emerald-700/50">
            ● دون إنترنت
          </span>
        </div>

        {/* Counter bar */}
        <div className="pt-2 border-t border-emerald-800/50 flex justify-between items-center text-xs font-bold text-emerald-300">
          <span className="flex items-center gap-1.5">
            <ListFilter className="w-4 h-4" />
            <span>
              إجمالي الفئات:{' '}
              {toArabicNumbers(
                hubSection === 'adhkar'
                  ? 11
                  : hubSection === 'duas'
                  ? 14
                  : hubSection === 'ruqyah'
                  ? 1
                  : 26
              )}{' '}
              فئة فرعية
            </span>
          </span>
          <span className="text-[11px] text-emerald-200/70">
            انقر على الفئة المحددة لاستعراض وقراءة أذكارها
          </span>
        </div>
      </div>

      {/* LEVEL 2 CIRCULAR SUB-CATEGORIES GRID */}
      <div className="bg-white dark:bg-[#161d26] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
        <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>الفئات الفرعية (اختر فئة للقراءة):</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-center">
          {subCategories.map((cat) => {
            const visibleItems = getCategoryVisibleItems(cat, activePrayerKey);
            const isFavorited = favoriteCategoryIds.includes(cat.id);

            return (
              <div
                key={`sub_cat_${cat.id}`}
                onClick={() => onSelectCategory(cat)}
                className="group flex flex-col items-center justify-between p-3.5 rounded-3xl border border-slate-100 dark:border-slate-800/80 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all cursor-pointer space-y-2"
              >
                {/* Level 2 Circular Icon */}
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-emerald-600 bg-emerald-900 text-white flex items-center justify-center font-black text-2xl shadow-md group-hover:scale-105 transition-transform">
                    {cat.id === 'morning'
                      ? '🌅'
                      : cat.id === 'evening'
                      ? '🌆'
                      : cat.id === 'after_prayer'
                      ? '📿'
                      : cat.id === 'sleep'
                      ? '🌌'
                      : cat.id === 'travel'
                      ? '✈️'
                      : cat.id === 'food'
                      ? '🍲'
                      : cat.id === 'sick'
                      ? '🌿'
                      : cat.id === 'distress'
                      ? '🤲'
                      : '📖'}
                  </div>
                  {isFavorited && (
                    <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 p-1 rounded-full text-[10px] shadow-xs">
                      ⭐
                    </span>
                  )}
                </div>

                {/* Category Name & Small Decorative Line */}
                <div className="space-y-0.5 text-center w-full">
                  <h5 className="font-black text-xs sm:text-sm text-slate-800 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {cat.arabicName}
                  </h5>
                  {/* Decorative Line below name */}
                  <div className="w-7 h-1 bg-emerald-500 rounded-full mx-auto my-1 group-hover:w-12 transition-all" />
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">
                    {toArabicNumbers(visibleItems.length)} نصاً/ذكراً
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdhkarSubCategoriesView;
