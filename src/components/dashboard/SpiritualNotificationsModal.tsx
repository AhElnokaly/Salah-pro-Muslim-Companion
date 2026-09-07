import React from 'react';
import { ChevronLeft } from 'lucide-react';

export interface SpiritualNotification {
  id: string;
  type: 'qada' | 'fasting_make_up' | 'sunnah_fast' | 'spiritual_advice' | 'friday';
  title: string;
  description: string;
  icon: string;
  actionLabel?: string;
  action?: () => void;
}

interface SpiritualNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SpiritualNotification[];
  onOpenPushSettings: () => void;
}

export const SpiritualNotificationsModal: React.FC<SpiritualNotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onOpenPushSettings
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="نافذة النفحات والإشعارات الإيمانية"
        className="bg-white dark:bg-[#161d26] w-full max-w-sm rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl p-5 flex flex-col gap-4 relative z-10 animate-scale-up text-end"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-slate-850 dark:text-white">النفحات والإشعارات الإيمانية</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">توجيهات روحية تناسب يومك وعبادتك</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-1 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-black transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>

        {/* List */}
        <div className="space-y-3.5 max-h-[350px] overflow-y-auto pe-1">
          {notifications.map((notif, idx) => (
            <div 
              key={notif.id || idx}
              className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800/50 flex items-start gap-3 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/40"
            >
              <span className="text-2xl shrink-0 p-2 bg-white dark:bg-[#161d26] rounded-xl shadow-xs border border-slate-100 dark:border-slate-800/50">
                {notif.icon}
              </span>
              <div className="space-y-2 flex-1">
                <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                  {notif.title}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  {notif.description}
                </p>
                {notif.actionLabel && (
                  <button
                    type="button"
                    onClick={() => {
                      if (notif.action) {
                        notif.action();
                      }
                      if (notif.id.includes('rem') || notif.id.includes('advice')) {
                        onClose();
                      }
                    }}
                    className="py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[10px] shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    {notif.actionLabel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer wisdom & Push Notifications link */}
        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 space-y-2 text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPushSettings();
            }}
            className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>إعداد خيارات الإشعارات الفورية (Push)</span>
            <ChevronLeft className="w-4 h-4" />
          </button>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-normal">
            "إنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا" 🤍
          </p>
        </div>
      </div>
    </div>
  );
};
