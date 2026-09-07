import React from 'react';
import { 
  requestExactAlarmPermission, 
  checkExactAlarmPermission, 
  requestNotificationPermission 
} from '../../services/athanAlarmPlugin';

interface AppBannersProps {
  storageWriteError: boolean;
  storageWarningAcknowledged: boolean;
  onDismissStorageWarning: () => void;
  notifPermission: NotificationPermission | 'unsupported';
  notifBannerDismissed: boolean;
  onDismissNotifBanner: () => void;
  setNotifPermission: (perm: NotificationPermission | 'unsupported') => void;
  exactAlarmPermissionGranted: boolean;
  exactAlarmBannerDismissed: boolean;
  onDismissExactAlarmBanner: () => void;
  setExactAlarmPermissionGranted: (granted: boolean) => void;
}

export const AppBanners: React.FC<AppBannersProps> = ({
  storageWriteError,
  storageWarningAcknowledged,
  onDismissStorageWarning,
  notifPermission,
  notifBannerDismissed,
  onDismissNotifBanner,
  setNotifPermission,
  exactAlarmPermissionGranted,
  exactAlarmBannerDismissed,
  onDismissExactAlarmBanner,
  setExactAlarmPermissionGranted
}) => {
  return (
    <>
      {storageWriteError && !storageWarningAcknowledged && (
        <div className="w-full p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 rounded-2xl text-rose-900 dark:text-rose-100 space-y-2 text-end text-xs shadow-md">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="text-base">⚠️</span>
            <span>تنبيه هام: تعذر حفظ البيانات</span>
          </div>
          <p className="leading-relaxed">
            تعذر حفظ البيانات في ذاكرة الجهاز المحلية (قد تكون المساحة ممتلئة أو التصفح الخاص مفعّلاً). يرجى تفريغ مساحة على جهازك أو إغلاق الوضع الخاص لضمان حفظ سجلاتك وطاعاتك.
          </p>
          <button
            onClick={onDismissStorageWarning}
            className="mt-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            حسناً، فهمت
          </button>
        </div>
      )}

      {notifPermission === 'default' && !notifBannerDismissed && (
        <div className="w-full p-3.5 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-indigo-900 dark:text-indigo-100 flex items-center justify-between gap-3 text-end text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🔔</span>
            <div>
              <p className="font-bold text-sm">تفعيل التنبيهات</p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300">احصل على تذكير في مواقيت الصلاة والأذكار</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={async () => {
                try {
                  await requestNotificationPermission();
                } catch (e) {
                  console.warn('Native notification request error:', e);
                }
                if ('Notification' in window) {
                  const res = await Notification.requestPermission();
                  setNotifPermission(res);
                }
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              فعّل تذكير الصلاة
            </button>
            <button
              onClick={onDismissNotifBanner}
              className="p-1.5 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 transition-colors cursor-pointer"
              aria-label="إغلاق التنبيه"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!exactAlarmPermissionGranted && !exactAlarmBannerDismissed && (
        <div className="w-full p-3.5 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-900 dark:text-amber-100 flex items-center justify-between gap-3 text-end text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-base">⏰</span>
            <div>
              <p className="font-bold text-sm">تنبيه الأذان الدقيق</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                يتطلب إطلاق الأذان في الوقت المظبوط منح صلاحية المنبهات والتذكيرات في إعدادات النظام
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={async () => {
                await requestExactAlarmPermission();
                setTimeout(async () => {
                  const isGranted = await checkExactAlarmPermission();
                  setExactAlarmPermissionGranted(isGranted);
                }, 1200);
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              منح الصلاحية
            </button>
            <button
              onClick={onDismissExactAlarmBanner}
              className="p-1.5 text-amber-400 hover:text-amber-600 dark:hover:text-amber-200 transition-colors cursor-pointer"
              aria-label="إغلاق التنبيه"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};
