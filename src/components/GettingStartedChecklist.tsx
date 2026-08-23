import React, { useState, useEffect } from 'react';
import { safeSetItem } from '../utils/storage';
import { CheckCircle2, Circle, Sparkles, ChevronDown, ChevronUp, Compass, BookOpen, Clock, Heart } from 'lucide-react';
import { toArabicNumbers } from '../utils/hijri';

interface GettingStartedChecklistProps {
  hasLoggedPrayer: boolean;
  hasUsedTasbih: boolean;
  hasVisitedQibla: boolean;
  hasStartedKhatma: boolean;
  onNavigateTab: (tab: string) => void;
}

export default function GettingStartedChecklist({
  hasLoggedPrayer,
  hasUsedTasbih,
  hasVisitedQibla,
  hasStartedKhatma,
  onNavigateTab
}: GettingStartedChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('salah_getting_started_dismissed') === 'true';
  });
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-dismiss if all required tasks are done
  useEffect(() => {
    if (hasLoggedPrayer && hasUsedTasbih && hasVisitedQibla) {
      const timer = setTimeout(() => {
        setIsDismissed(true);
        safeSetItem('salah_getting_started_dismissed', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasLoggedPrayer, hasUsedTasbih, hasVisitedQibla]);

  if (isDismissed) return null;

  const tasks = [
    {
      id: 'prayer',
      title: 'سجّل أول صلاة في جدول الصلوات',
      done: hasLoggedPrayer,
      action: () => onNavigateTab('salah'),
      icon: Clock,
      required: true
    },
    {
      id: 'tasbih',
      title: 'جرّب المسبحة الإلكترونية التفاعلية',
      done: hasUsedTasbih,
      action: () => onNavigateTab('adhkar'),
      icon: Heart,
      required: true
    },
    {
      id: 'qibla',
      title: 'افتح بوصلة القبلة لتحديد الاتجاه',
      done: hasVisitedQibla,
      action: () => onNavigateTab('qibla'),
      icon: Compass,
      required: true
    },
    {
      id: 'khatma',
      title: 'ابدأ ختمة قرآنية جديدة (اختياري)',
      done: hasStartedKhatma,
      action: () => onNavigateTab('quran'),
      icon: BookOpen,
      required: false
    }
  ];

  const completedCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="bg-gradient-to-r from-indigo-900/10 via-slate-900/5 to-emerald-900/10 dark:from-indigo-950/40 dark:via-slate-900/30 dark:to-emerald-950/40 rounded-3xl p-4 sm:p-5 border border-indigo-200/50 dark:border-indigo-800/50 space-y-3 text-end transition-all shadow-sm">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-white font-black text-sm"
        >
          <div className="p-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-end">
            <h3 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
              <span>خطوات البداية السريعة 🌱</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black px-2 py-0.5 rounded-full">
                {toArabicNumbers(completedCount)} من {toArabicNumbers(totalCount)} مكتمل
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">تعلّم بالممارسة — انجز أفعالك الإيمانية الأولى</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              setIsDismissed(true);
              safeSetItem('salah_getting_started_dismissed', 'true');
            }}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer px-1"
            title="إغلاق هذه القائمة"
          >
            تجاهل ×
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Task List */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-fade-in">
          {tasks.map((task) => {
            const Icon = task.icon;
            return (
              <button
                key={task.id}
                onClick={task.action}
                className={`p-3 rounded-2xl border text-end flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  task.done
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-white/80 dark:bg-[#131922] border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {task.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                  <span className={`text-xs font-bold truncate ${task.done ? 'line-through opacity-80' : ''}`}>
                    {task.title}
                  </span>
                </div>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${task.done ? 'text-emerald-500' : 'text-slate-400'}`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
