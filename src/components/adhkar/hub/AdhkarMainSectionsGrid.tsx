/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Layers,
  Sun,
  Heart,
  Sparkles,
  Award,
  BookOpen,
  ChevronLeft,
} from 'lucide-react';

interface AdhkarMainSectionsGridProps {
  onSelectHubSection: (section: 'main' | 'adhkar' | 'duas' | 'ruqyah' | 'hisn') => void;
  onSelectTasbeehTab: () => void;
}

export const AdhkarMainSectionsGrid: React.FC<AdhkarMainSectionsGridProps> = ({
  onSelectHubSection,
  onSelectTasbeehTab,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>الأقسام الرئيسية لمكتبة الأدعية والأذكار</span>
        </h4>
        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40">
          ٥ أقسام شاملة
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 md:gap-4">
        {/* 1. الأذكار */}
        <div
          onClick={() => onSelectHubSection('adhkar')}
          className="bg-white dark:bg-[#161d26] p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-4 group relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>دون إنترنت</span>
            </span>
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 group-hover:scale-110 transition-transform">
              <Sun className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-base text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              الأذكار اليومية والصلوات
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              أذكار الصباح، المساء، الوضوء، المسجد، الصلاة واليوم والليلة
            </p>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs font-bold text-amber-700 dark:text-amber-400">
            <span>١١ فئة • أذكار مباركة</span>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2. الأدعية */}
        <div
          onClick={() => onSelectHubSection('duas')}
          className="bg-white dark:bg-[#161d26] p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-4 group relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>دون إنترنت</span>
            </span>
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-base text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              الأدعية المأثورة والجامعة
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              أدعية الصلاة، السفر، الطعام، الكرب، الشدائد، والاستخارة
            </p>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs font-bold text-indigo-700 dark:text-indigo-400">
            <span>١٤ فئة • أدعية مأثورة</span>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 3. الرقية الشرعية */}
        <div
          onClick={() => onSelectHubSection('ruqyah')}
          className="bg-white dark:bg-[#161d26] p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-4 group relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>دون إنترنت</span>
            </span>
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-base text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              الرقية الشرعية وشفاء المريض
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              أدعية الشفاء، عيادة المريض، ورقية الوقاية والحصن المأثور
            </p>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <span>قسم مخصص • الشفاء والتحصين</span>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 4. التسبيح */}
        <div
          onClick={onSelectTasbeehTab}
          className="bg-white dark:bg-[#161d26] p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-4 group relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>دون إنترنت</span>
            </span>
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-base text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              المسبحة الإلكترونية التفاعلية
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              عداد الذكر والتسبيح الحر مع اهتزاز تفاعلي وأدعية مخصصة
            </p>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs font-bold text-purple-700 dark:text-purple-400">
            <span>تسبيح واستغفار تفاعلي</span>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 5. حصن المسلم */}
        <div
          onClick={() => onSelectHubSection('hisn')}
          className="bg-white dark:bg-[#161d26] p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-4 group relative overflow-hidden col-span-1 sm:col-span-2 md:col-span-1"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>دون إنترنت</span>
            </span>
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-base text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              فهرس كتاب «حصن المسلم» الشامل
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              عرض مرجعي كامل لجميع أقسام الكتاب الـ 26 بالترتيب الأصلي
            </p>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs font-bold text-teal-700 dark:text-teal-400">
            <span>٢٦ قسماً كاملاً بالترقيم الأصلي</span>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdhkarMainSectionsGrid;
