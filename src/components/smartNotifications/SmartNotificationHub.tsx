/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  Settings2, 
  Send, 
  ChevronDown, 
  ChevronUp,
  Clock,
  ExternalLink,
  Flame
} from 'lucide-react';
import { useSmartNotifications } from '../../hooks/useSmartNotifications';
import { QuranReadingModal } from './QuranReadingModal';
import { SmartNotificationSettingsModal } from './SmartNotificationSettingsModal';

interface SmartNotificationHubProps {
  cityName: string;
  hijriFullString: string;
  nextPrayerNameArabic: string;
  nextPrayerTimeFormatted: string;
  remainingMsToNextPrayer?: number;
  countdownFormatted?: string;
  onNavigateToPrayerTimes?: () => void;
  onNavigateToAdhkar?: (type: 'morning' | 'evening') => void;
}

export const SmartNotificationHub: React.FC<SmartNotificationHubProps> = ({
  cityName,
  hijriFullString,
  nextPrayerNameArabic,
  nextPrayerTimeFormatted,
  remainingMsToNextPrayer = 0,
  countdownFormatted,
  onNavigateToPrayerTimes,
  onNavigateToAdhkar,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  const smart = useSmartNotifications({
    cityName,
    hijriFullString,
    nextPrayerNameArabic,
    nextPrayerTimeFormatted,
    remainingMsToNextPrayer,
    countdownFormatted,
  });

  const showToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3000);
  };

  const handleTestNotification = async (type: 'ongoing_prayer' | 'listening' | 'reading' | 'adhkar') => {
    const success = await smart.triggerTestNotification(type);
    if (success) {
      showToast('تم إرسال الإشعار بنجاح إلى ستارة التنبيهات 🔔');
    } else {
      showToast('يرجى التأكد من السماح بالإشعارات في المتصفح أو التطبيق');
    }
  };

  return (
    <div
      id="smart-notification-hub-root"
      className="w-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white p-4 sm:p-5 shadow-xl border border-slate-800/80 space-y-4"
      dir="rtl"
    >
      {/* SECTION TITLE & ACTION BAR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>ستارة الإشعارات التفاعلية</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal border border-emerald-500/30">
                مباشر
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              محاكاة وتجربة الإشعارات الدقيقة على شاشة القفل وستارة الهاتف
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="btn-open-smart-notif-settings"
            onClick={() => smart.setIsSettingsModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60 cursor-pointer"
            title="تخصيص الإشعارات"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOAST FEEDBACK */}
      {toastFeedback && (
        <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-200 text-xs text-center animate-in fade-in duration-150">
          {toastFeedback}
        </div>
      )}

      {/* 1. ONGOING LIVE PRAYER CARD (شريط الصلاة الحي الدائم) */}
      {smart.settings.ongoingPrayerBar.enabled && (
        <div
          id="notif-card-ongoing-prayer"
          className="relative overflow-hidden rounded-2xl bg-slate-800/90 border border-slate-700/80 p-3.5 sm:p-4 hover:border-slate-600 transition-all shadow-md group"
        >
          <div className="flex items-center justify-between gap-3">
            {/* Right: Mosque Icon & Text */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-inner">
                {/* Visual Minaret / Mosque Icon matching the screenshot */}
                <div className="w-6 h-6 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  🕌
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                  {smart.ongoingPrayerData.firstLine}
                </div>
                <div className="text-xs text-cyan-300 font-semibold flex items-center gap-1 mt-0.5">
                  <span>{smart.ongoingPrayerData.prayerName}،</span>
                  <span>{smart.ongoingPrayerData.prayerTimeFormatted}</span>
                  <span className="font-mono text-cyan-400 font-bold tracking-wider mr-1">
                    {smart.ongoingPrayerData.countdownFormatted}
                  </span>
                </div>
              </div>
            </div>

            {/* Left: Interactive Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleTestNotification('ongoing_prayer')}
                title="إرسال إشعار الصلاة الحي"
                className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors text-xs flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">تجربة</span>
              </button>
              {onNavigateToPrayerTimes && (
                <button
                  type="button"
                  onClick={onNavigateToPrayerTimes}
                  title="عرض جدول الصلاة"
                  className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BUNDLE HEADER: هِمَّتِي (HEMMATY / YUSR) */}
      <div className="pt-1 flex items-center justify-between text-xs text-slate-400 font-medium px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-200 font-bold text-xs sm:text-sm">هِمَّتِي (Hemmaty)</span>
          <span className="text-[10px] text-slate-500">• 3 تنبيهات مباركة</span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
        >
          <span>{isExpanded ? 'طي الحزمة' : 'عرض الكل'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* BUNDLED NOTIFICATION CARDS */}
      {isExpanded && (
        <div className="space-y-2.5 animate-in fade-in duration-200">
          
          {/* CARD 1: ورد الاستماع (QURAN LISTENING PORTION) */}
          {smart.settings.listeningPortion.enabled && (
            <div
              id="notif-card-listening"
              className="rounded-2xl bg-slate-800/80 border border-slate-700/70 p-3.5 hover:border-slate-600 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Calligraphic Circle Icon matching screenshot */}
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 shadow-xs font-serif font-bold text-base select-none">
                    يُ
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{smart.listeningInfo.timeStr}</span>
                      <span className="font-bold text-slate-200">{smart.listeningInfo.title}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100 font-medium mt-0.5 leading-snug">
                      {smart.listeningInfo.body}
                    </p>
                    
                    {/* Audio Status & Error message */}
                    {smart.audioError && (
                      <p className="text-[10px] text-rose-400 mt-1">{smart.audioError}</p>
                    )}
                  </div>
                </div>

                {/* Quick Audio Play/Pause Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={smart.toggleListeningAudio}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      smart.isAudioPlaying
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 animate-pulse'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {smart.isAudioPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>إيقاف</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>استماع</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestNotification('listening')}
                    title="إرسال التنبيه"
                    className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar when Playing */}
              {smart.isAudioPlaying && (
                <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-purple-300">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                    <span>جاري تلاوة الآية {smart.currentAudioIndex + 1} من {smart.listeningInfo.audioUrls.length}</span>
                  </span>
                  <button
                    type="button"
                    onClick={smart.stopListeningAudio}
                    className="text-slate-400 hover:text-white underline text-[10px]"
                  >
                    إنهاء المقطع
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CARD 2: وردك اليومي من القرآن (QURAN READING PORTION) */}
          {smart.settings.readingPortion.enabled && (
            <div
              id="notif-card-reading"
              className="rounded-2xl bg-slate-800/80 border border-slate-700/70 p-3.5 hover:border-slate-600 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Calligraphic Circle Icon matching screenshot */}
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 shadow-xs font-serif font-bold text-base select-none">
                    يُ
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{smart.readingInfo.timeStr}</span>
                      <span className="font-bold text-slate-200">{smart.readingInfo.title}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100 font-medium mt-0.5 leading-snug">
                      {smart.readingInfo.body}
                    </p>
                    
                    {/* Streak badge */}
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{smart.settings.readingPortion.streakDays} أيام متواصلة من الورد اليومي</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => smart.setIsReadingModalOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>قراءة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestNotification('reading')}
                    title="إرسال التنبيه"
                    className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CARD 3: أذكار المساء / الصباح المقتبسة (CONTEXTUAL ADHKAR) */}
          {smart.settings.contextualAdhkar.enabled && (
            <div
              id="notif-card-adhkar"
              className="rounded-2xl bg-slate-800/80 border border-slate-700/70 p-3.5 hover:border-slate-600 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Calligraphic Circle Icon matching screenshot */}
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 shadow-xs font-serif font-bold text-base select-none">
                    يُ
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{smart.eveningAdhkarInfo.timeStr}</span>
                      <span className="font-bold text-slate-200">{smart.eveningAdhkarInfo.title}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100 font-medium mt-0.5 leading-snug">
                      {smart.eveningAdhkarInfo.body}
                    </p>
                  </div>
                </div>

                {/* Action button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {onNavigateToAdhkar && (
                    <button
                      type="button"
                      onClick={() => onNavigateToAdhkar('evening')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ترديد</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleTestNotification('adhkar')}
                    title="إرسال التنبيه"
                    className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODALS */}
      <QuranReadingModal
        isOpen={smart.isReadingModalOpen}
        onClose={() => smart.setIsReadingModalOpen(false)}
        readingInfo={smart.readingInfo}
        onComplete={smart.completeReadingPortion}
        streakDays={smart.settings.readingPortion.streakDays}
      />

      <SmartNotificationSettingsModal
        isOpen={smart.isSettingsModalOpen}
        onClose={() => smart.setIsSettingsModalOpen(false)}
        settings={smart.settings}
        onSaveSettings={smart.updateSettings}
      />
    </div>
  );
};
