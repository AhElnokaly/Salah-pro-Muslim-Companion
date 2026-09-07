import React from 'react';
import { Sparkles } from 'lucide-react';
import { ActiveNudge } from '../../types';

interface ActionableNudgeBannerProps {
  activeNudge: ActiveNudge | null;
  onExecuteAction: () => void;
}

export const ActionableNudgeBanner: React.FC<ActionableNudgeBannerProps> = ({
  activeNudge,
  onExecuteAction
}) => {
  if (!activeNudge) return null;

  return (
    <div 
      id="nudge-banner" 
      className="bg-emerald-50/70 dark:bg-[#132c23] border border-emerald-100 dark:border-[#234237] rounded-3xl p-5 flex items-start gap-4 transition-colors duration-300" 
      dir="rtl"
    >
      <div className="p-3 bg-emerald-100 dark:bg-[#1e4638] text-emerald-700 dark:text-emerald-300 rounded-2xl shrink-0">
        <Sparkles className="w-6 h-6 animate-pulse" />
      </div>
      <div className="space-y-3 flex-1 text-right">
        <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-300 text-right">توجيه مبارك من هِمَّتِي</h4>
        <p className="text-sm text-emerald-800 dark:text-emerald-100 leading-relaxed font-semibold text-right">
          {activeNudge.message}
        </p>
        {activeNudge.actionKey && activeNudge.actionKey !== 'general' && (
          <button
            onClick={onExecuteAction}
            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-200/50 dark:shadow-none transition-all cursor-pointer"
          >
            {activeNudge.actionKey.startsWith('enable_alarm_') ? 'تفعيل تنبيهات الأذان' : 'موافق'}
          </button>
        )}
      </div>
    </div>
  );
};
