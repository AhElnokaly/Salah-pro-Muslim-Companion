import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export type AppModalVariant = 'warning' | 'success' | 'error' | 'info';

interface AppModalProps {
  message: string;
  variant?: AppModalVariant;
  onClose: () => void;
}

const variantConfig: Record<AppModalVariant, {
  icon: React.ReactNode;
  titleColor: string;
  bg: string;
  border: string;
  btnBg: string;
  btnHover: string;
}> = {
  warning: {
    icon: <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />,
    titleColor: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    border: 'border-amber-500/30',
    btnBg: 'bg-amber-600',
    btnHover: 'hover:bg-amber-700',
  },
  success: {
    icon: <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />,
    titleColor: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    border: 'border-emerald-500/30',
    btnBg: 'bg-emerald-600',
    btnHover: 'hover:bg-emerald-700',
  },
  error: {
    icon: <XCircle className="w-5 h-5 shrink-0 text-red-500" />,
    titleColor: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50/50 dark:bg-red-950/20',
    border: 'border-red-500/30',
    btnBg: 'bg-red-600',
    btnHover: 'hover:bg-red-700',
  },
  info: {
    icon: <Info className="w-5 h-5 shrink-0 text-blue-500" />,
    titleColor: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    border: 'border-blue-500/30',
    btnBg: 'bg-blue-600',
    btnHover: 'hover:bg-blue-700',
  },
};

export default function AppModal({ message, variant = 'info', onClose }: AppModalProps) {
  const cfg = variantConfig[variant];
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-[#18202c] border ${cfg.border} rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-end`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-center gap-2.5 font-black text-base ${cfg.titleColor}`}>
          {cfg.icon}
          <span>{message}</span>
        </div>
        <button
          onClick={onClose}
          className={`w-full py-2.5 ${cfg.btnBg} ${cfg.btnHover} active:scale-95 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer`}
        >
          حسناً
        </button>
      </div>
    </div>
  );
}
