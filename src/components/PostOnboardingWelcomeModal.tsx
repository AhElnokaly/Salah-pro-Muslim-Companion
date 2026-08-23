import React from 'react';
import { Sparkles, Compass, ArrowLeft, Check } from 'lucide-react';

interface PostOnboardingWelcomeModalProps {
  isOpen: boolean;
  onStartTour: () => void;
  onExploreOnOwn: () => void;
}

export default function PostOnboardingWelcomeModal({
  isOpen,
  onStartTour,
  onExploreOnOwn
}: PostOnboardingWelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-[#131922] w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-end space-y-5 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 start-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-x-10 -translate-y-10" />

        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-md">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-200/50">
              مرحباً بك في تطبيق هِمَّتِي 🤍
            </span>
            <h2 className="text-lg font-black text-slate-800 dark:text-white mt-1">
              التطبيق جاهز للاستخدام!
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-bold">
          تم ضبط مواقيت مدينتك وإعداداتك بنجاح. هل ترغب في جولة تعارف سريعة (دقيقة واحدة) لمحتوى التطبيق أم تفضل الاستكشاف بنفسك؟
        </p>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onStartTour}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Compass className="w-4 h-4" />
            <span>جولة سريعة (دقيقة واحدة) ✨</span>
          </button>

          <button
            type="button"
            onClick={onExploreOnOwn}
            className="w-full py-3.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>سأستكشف التطبيق بنفسي</span>
          </button>
        </div>
      </div>
    </div>
  );
}
