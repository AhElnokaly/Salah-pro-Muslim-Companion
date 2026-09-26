import React from 'react';
import { Bell, MapPin, ChevronLeft, Calendar } from 'lucide-react';
import { PrayerName, DailyPrayerLogs, DashboardTab, QuranKhatma, AppSettings } from '../../types';
import GettingStartedChecklist from '../GettingStartedChecklist';
import SacredHoursBanner from '../SacredHoursBanner';
import { subtractDays, formatDateKey } from '../../utils/prayerDayBoundary';
import { safeSetItem, safeGetItem } from '../../utils/storage';

interface DashboardBannersProps {
  now: Date;
  todayStr: string;
  prayerLogs: Record<string, DailyPrayerLogs>;
  getArabicPrayerName: (p: PrayerName, date?: Date) => string;
  setActiveTab?: (tab: DashboardTab) => void;
  locationToast: { msg: string; type: 'success' | 'error' } | null;
  setLocationToast: (toast: { msg: string; type: 'success' | 'error' } | null) => void;
  dhikrLogs?: Record<string, number>;
  khatmat?: QuranKhatma[];
  dismissedTravelBanner: boolean;
  setDismissedTravelBanner: (dismissed: boolean) => void;
  needsBackup: boolean;
  dismissedBackupBanner: boolean;
  setDismissedBackupBanner: (dismissed: boolean) => void;
  handleExportBackup: () => void;
  hijri: { day: number; month: number; year: number; monthName?: string };
  times: Record<string, string>;
  currentStyle: string;
  dashboardSections: { sacredHours?: boolean; [key: string]: boolean | undefined };
  settings?: AppSettings;
  onOpenHijriAdjust?: () => void;
  hideStandaloneActionBanners?: boolean;
}

export const DashboardBanners: React.FC<DashboardBannersProps> = ({
  now,
  todayStr,
  prayerLogs,
  getArabicPrayerName,
  setActiveTab,
  locationToast,
  setLocationToast,
  dhikrLogs,
  khatmat,
  dismissedTravelBanner,
  setDismissedTravelBanner,
  needsBackup,
  dismissedBackupBanner,
  setDismissedBackupBanner,
  handleExportBackup,
  hijri,
  times,
  currentStyle,
  dashboardSections,
  settings,
  onOpenHijriAdjust,
  hideStandaloneActionBanners = true,
}) => {
  const yesterdayDate = subtractDays(now, 1);
  const yesterdayStr = formatDateKey(yesterdayDate);
  const yesterdayLogs = prayerLogs[yesterdayStr] || {};
  const fiveDaily: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  const missingPrayers = fiveDaily.filter(p => {
    const status = yesterdayLogs[p]?.status;
    return !status || status === 'not_yet' || status === 'future';
  });

  const bannerTitle = missingPrayers.length === 1
    ? `هل نسيت تسجيل صلاة ${getArabicPrayerName(missingPrayers[0], yesterdayDate)}؟`
    : 'هل نسيت تسجيل صلوات اليوم السابق؟';

  let installedAt = typeof window !== 'undefined' ? safeGetItem('salah_installed_at') : null;
  if (!installedAt && typeof window !== 'undefined') {
    installedAt = Date.now().toString();
    safeSetItem('salah_installed_at', installedAt);
  }
  const daysSinceInstalled = installedAt ? (Date.now() - Number(installedAt)) / (1000 * 60 * 60 * 24) : 0;
  const showChecklist = daysSinceInstalled <= 7;

  // Check if Hijri Month Start / Season verification banner should be shown
  const isHijriNotificationEnabled = settings?.notifyHijriMonthStart !== false;
  const isMonthBoundary = hijri.day >= 29 || hijri.day <= 2;
  
  // Storage key for dismissal of this month's transition
  const hijriDismissKey = `salah_dismissed_hijri_banner_${hijri.year}_${hijri.month}_${hijri.day <= 2 ? 'start' : 'end'}`;
  const [dismissedHijriBanner, setDismissedHijriBanner] = React.useState<boolean>(() => {
    return safeGetItem(hijriDismissKey) === 'true';
  });

  // Determine seasonal message
  let seasonalInfo: { title: string; desc: string; badge: string; isMajor: boolean } | null = null;
  if (isHijriNotificationEnabled && isMonthBoundary && !dismissedHijriBanner) {
    // Ramadan transition (end of Shaban or beginning of Ramadan)
    if ((hijri.month === 8 && hijri.day >= 29) || (hijri.month === 9 && hijri.day <= 2)) {
      seasonalInfo = {
        title: hijri.month === 8 ? 'ترقب هلال شهر رمضان المبارك 🌙' : 'مبارك عليكم شهر رمضان المبارك 🌙',
        desc: 'هل ثبتت رؤية الهلال في بلدك؟ تأكد من مطابقة تاريخك الهجري مع الرؤية الشرعية لضبط الصيام والقيام.',
        badge: 'موسم مبارك 🌟',
        isMajor: true,
      };
    }
    // Eid al-Fitr transition (end of Ramadan or beginning of Shawwal)
    else if ((hijri.month === 9 && hijri.day >= 29) || (hijri.month === 10 && hijri.day <= 2)) {
      seasonalInfo = {
        title: hijri.month === 9 ? 'ترقب هلال شهر شوال وعيد الفطر 🎉' : 'عيد فطر مبارك وتقبل الله طاعتكم 🎉',
        desc: 'هل أُعلنت رؤية هلال شوال في منطقتك؟ اضبط التاريخ بدقة لثبوت يوم العيد وإخراج زكاة الفطر.',
        badge: 'عيد الفطر 🌙',
        isMajor: true,
      };
    }
    // Dhu al-Hijjah / Hajj & Arafah transition (end of Dhu al-Qadah or beginning of Dhu al-Hijjah)
    else if ((hijri.month === 11 && hijri.day >= 29) || (hijri.month === 12 && hijri.day <= 2)) {
      seasonalInfo = {
        title: hijri.month === 11 ? 'ترقب هلال شهر ذي الحجة والعشر الأوائل 🕋' : 'أهلاً بالعشر الأوائل من ذي الحجة 🕋',
        desc: 'اضبط التاريخ الهجري لضمان موافقة صيام التسع ويوم عرفة والأضحى لإعلان بلدك الشرعي.',
        badge: 'عشر ذي الحجة 🕋',
        isMajor: true,
      };
    }
    // Muharram / New Hijri Year
    else if ((hijri.month === 12 && hijri.day >= 29) || (hijri.month === 1 && hijri.day <= 2)) {
      seasonalInfo = {
        title: 'إطلالة العام الهجري الجديد 🌿',
        desc: 'بداية شهر محرم الحرام، تحقق من توافق تقويمك مع إعلان الرؤية الشرعية وصيام عاشوراء.',
        badge: 'رأس السنة الهجرية 🌿',
        isMajor: true,
      };
    }
    // Other months regular start
    else {
      seasonalInfo = {
        title: `ثبوت هلال شهر ${hijri.monthName || 'الهجري الجديد'} 🌙`,
        desc: 'هل ترغب بالتحقق من مطابقة التاريخ مع رؤية الهلال المحلية في بلدك؟',
        badge: 'بداية الشهر 🗓️',
        isMajor: false,
      };
    }
  }

  return (
    <>
      {/* Smart Hijri Month Transition & Season Verification Banner */}
      {seasonalInfo && (
        <div
          id="hijri-month-transition-banner"
          className="w-full bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-indigo-500/15 border border-cyan-500/30 dark:border-cyan-500/40 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-xs transition-all"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-cyan-100 leading-snug">
                  {seasonalInfo.title}
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30">
                  {seasonalInfo.badge}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                {seasonalInfo.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="adjust-hijri-from-banner-btn"
              type="button"
              onClick={() => {
                if (onOpenHijriAdjust) {
                  onOpenHijriAdjust();
                } else {
                  window.dispatchEvent(new CustomEvent('open-hijri-adjust'));
                }
              }}
              className="py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
            >
              <span>اضبط التاريخ</span>
              <span className="text-[10px]">⚙️</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDismissedHijriBanner(true);
                safeSetItem(hijriDismissKey, 'true');
              }}
              title="إغلاق التنبيه لهذا الشهر"
              aria-label="إغلاق تنبيه التاريخ الهجري"
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* Yesterday's Unlogged Obligatory Prayers Notice Banner */}
      {missingPrayers.length > 0 && !hideStandaloneActionBanners && (
        <div 
          id="yesterday-unlogged-prayers-banner"
          className="w-full bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/50 dark:border-amber-700/40 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-xs text-right transition-all animate-fade-in"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-200 leading-snug truncate">
              {bannerTitle}
            </p>
          </div>
          <button
            type="button"
            id="btn-log-yesterday-prayers"
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('salah');
                window.dispatchEvent(new CustomEvent('open-prayer-worship-yesterday'));
              }
            }}
            className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-xs shrink-0 cursor-pointer transition-all flex items-center gap-1"
          >
            <span>سجّلها الآن</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Location GPS Sync Toast Notification Banner */}
      {locationToast && (
        <div className={`p-3.5 rounded-2xl text-xs font-black shadow-lg flex items-center justify-between gap-3 border transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
          locationToast.type === 'success'
            ? 'bg-emerald-500/15 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
            : 'bg-rose-500/15 dark:bg-rose-950/40 border-rose-500/30 text-rose-800 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{locationToast.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocationToast(null)}
            aria-label="إغلاق إشعار الموقع الجغرافي"
            className="text-xs font-bold hover:opacity-80 p-1 cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Progressive Onboarding Dashboard Checklist (Auto-hides after 7 days) */}
      {showChecklist && (
        <GettingStartedChecklist
          hasLoggedPrayer={Object.keys(prayerLogs).some(k => Object.values((prayerLogs[k] || {}) as DailyPrayerLogs).some(p => p && (p.status === 'A' || p.status === 'B')))}
          hasUsedTasbih={Object.keys(dhikrLogs || {}).length > 0}
          hasVisitedQibla={safeGetItem('salah_visited_qibla') === 'true'}
          hasStartedKhatma={(khatmat || []).length > 0}
          onNavigateTab={(tab) => setActiveTab && setActiveTab(tab as DashboardTab)}
        />
      )}

      {/* Travel Mode Info Banner */}
      {!dismissedTravelBanner && !hideStandaloneActionBanners && (
        <div className="bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs font-bold text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🧳</span>
            <span>في سفر أو تنقل؟ يجوز لك قصر الصلاة الرباعية وجمعها رخصةً وتيسيراً.</span>
          </div>
          <button
            onClick={() => {
              safeSetItem('salah_dismissed_travel_banner', todayStr);
              setDismissedTravelBanner(true);
            }}
            className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1 rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            لا تذكرني اليوم
          </button>
        </div>
      )}

      {/* Backup Reminder Banner */}
      {needsBackup && !dismissedBackupBanner && !hideStandaloneActionBanners && (
        <div className="bg-indigo-500/10 dark:bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs font-bold text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🛡️</span>
            <span>لم تُنشئ نسخة احتياطية من سجل عباداتك منذ فترة — احمِ بياناتك.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportBackup}
              className="text-[11px] bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1 rounded-xl font-black transition-colors cursor-pointer"
            >
              نسخة احتياطية
            </button>
            <button
              type="button"
              onClick={() => setDismissedBackupBanner(true)}
              aria-label="إغلاق تنبيه النسخ الاحتياطي"
              className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Last 10 Days of Ramadan Focus Card */}
      {hijri.month === 9 && hijri.day >= 21 && (
        <div className="bg-gradient-to-r from-amber-500/20 via-purple-500/15 to-indigo-500/20 p-4 rounded-3xl border border-amber-500/30 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🌙</span>
              <h3 className="text-xs font-black text-amber-900 dark:text-amber-200">العشر الأواخر من رمضان المبارك</h3>
            </div>
            {hijri.day % 2 === 1 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs animate-pulse">
                ليلة مرجوة ✨
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
            {hijri.day % 2 === 1 
              ? 'هذه الليلة من الليالي الوترية المرجوة لليلة القدر المباركة — أكثر من الدعاء "اللهم إنك عفو تحب العفو فاعف عني" والقيام.' 
              : 'شمر واجتهد في قيام الليل والطاعات ففي هذه الليالي المباركة ليلة القدر خير من ألف شهر.'}
          </p>
        </div>
      )}

      {/* Sacred Hours Banner */}
      {dashboardSections.sacredHours && (
        <SacredHoursBanner
          prayerTimes={times}
          now={now}
          onNavigateTab={(tab) => setActiveTab && setActiveTab(tab as DashboardTab)}
          appStyle={currentStyle}
        />
      )}
    </>
  );
};
