import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, Sparkles } from 'lucide-react';

export type NoticeType = 'warning' | 'success' | 'info' | 'error';

interface CustomNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: NoticeType;
  details?: string[];
  actionText?: string;
}

export default function CustomNoticeModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  details,
  actionText = 'فهمت وتأكدت'
}: CustomNoticeModalProps) {
  if (!isOpen) return null;

  const iconMap = {
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
  };

  const headerColorMap = {
    warning: 'text-amber-600 dark:text-amber-400 border-amber-500/30',
    success: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    info: 'text-sky-600 dark:text-sky-400 border-sky-500/30',
    error: 'text-rose-600 dark:text-rose-400 border-rose-500/30',
  };

  const btnColorMap = {
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    info: 'bg-sky-600 hover:bg-sky-700 text-white',
    error: 'bg-rose-600 hover:bg-rose-700 text-white',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
      <div className={`bg-white dark:bg-[#18202c] border ${headerColorMap[type]} rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-end transition-all`}>
        <div className={`flex items-center gap-2.5 font-black text-base ${headerColorMap[type]}`}>
          {iconMap[type]}
          <h3>{title}</h3>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-200 font-bold leading-relaxed whitespace-pre-line">
          {message}
        </p>

        {details && details.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-xs font-bold space-y-1">
            {details.map((detail, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{detail}</span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className={`w-full py-2.5 ${btnColorMap[type]} active:scale-95 font-black text-xs rounded-xl transition-all shadow-md cursor-pointer`}
        >
          {actionText}
        </button>
      </div>
    </div>
  );
}
