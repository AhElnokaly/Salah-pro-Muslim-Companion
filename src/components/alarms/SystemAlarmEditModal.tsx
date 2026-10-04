/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Bell, Clock, Moon, BookOpen, Headphones, Sparkles, Volume2, Play, Square } from 'lucide-react';
import { PushNotificationSettings } from '../../utils/pushNotificationService';
import { SmartNotificationsSettings } from '../../domain/smartNotifications/smartNotificationTypes';
import { SOUND_OPTIONS } from './alarmModalConstants';
import { playSpiritualSound, stopSpiritualSound } from '../../utils/spiritualAudio';

export type SystemAlarmItemKey =
  | 'prayerAthan'
  | 'prayerPreAlert'
  | 'prayerPostAlert'
  | 'adhkarMorning'
  | 'adhkarEvening'
  | 'adhkarPeriodic'
  | 'fridayKahf'
  | 'sleepAdhkar'
  | 'quietHours'
  | 'ongoingPrayerBar'
  | 'readingPortion'
  | 'listeningPortion';

export interface SystemAlarmMeta {
  key: SystemAlarmItemKey;
  title: string;
  desc: string;
  iconName?: string;
}

interface SystemAlarmEditModalProps {
  isOpen: boolean;
  alarmKey: SystemAlarmItemKey | null;
  onClose: () => void;
  pushSettings: PushNotificationSettings;
  smartSettings: SmartNotificationsSettings;
  onSavePushSettings: (updated: PushNotificationSettings) => void;
  onSaveSmartSettings: (updated: SmartNotificationsSettings) => void;
}

export default function SystemAlarmEditModal({
  isOpen,
  alarmKey,
  onClose,
  pushSettings,
  smartSettings,
  onSavePushSettings,
  onSaveSmartSettings,
}: SystemAlarmEditModalProps) {
  // Temporary form state
  const [preAlertMinutes, setPreAlertMinutes] = useState<number>(pushSettings.preAlertMinutes || 15);
  const [preAlertSound, setPreAlertSound] = useState<string>(pushSettings.preAlertSound || 'reminder');
  const [postAlertMinutes, setPostAlertMinutes] = useState<number>(pushSettings.postAlertMinutes || 15);
  const [postAlertSound, setPostAlertSound] = useState<string>(pushSettings.postAlertSound || 'reminder');
  const [morningTime, setMorningTime] = useState<string>(pushSettings.morningTime || '07:00');
  const [eveningTime, setEveningTime] = useState<string>(pushSettings.eveningTime || '16:30');
  const [periodicIntervalHours, setPeriodicIntervalHours] = useState<number>(pushSettings.periodicIntervalHours || 2);
  const [sleepTime, setSleepTime] = useState<string>(pushSettings.sleepTime || '22:30');
  const [quietStart, setQuietStart] = useState<string>(pushSettings.quietStart || '23:00');
  const [quietEnd, setQuietEnd] = useState<string>(pushSettings.quietEnd || '04:30');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(pushSettings.soundEnabled ?? true);
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(pushSettings.vibrateEnabled ?? true);

  // Audio preview testing state
  const [testPlaying, setTestPlaying] = useState<boolean>(false);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleTestSound = (sound: string, testTitle: string) => {
    if (testPlaying) {
      stopSpiritualSound(testAudioRef);
      setTestPlaying(false);
      return;
    }
    setTestPlaying(true);
    playSpiritualSound(
      sound,
      testTitle,
      0.8,
      testAudioRef,
      'sound'
    );
  };

  const handleClose = () => {
    if (testPlaying) {
      stopSpiritualSound(testAudioRef);
      setTestPlaying(false);
    }
    onClose();
  };

  // Smart settings form state
  const [showSeconds, setShowSeconds] = useState<boolean>(smartSettings.ongoingPrayerBar.showSeconds ?? true);
  const [showHijriDate, setShowHijriDate] = useState<boolean>(smartSettings.ongoingPrayerBar.showHijriDate ?? true);
  const [showLocation, setShowLocation] = useState<boolean>(smartSettings.ongoingPrayerBar.showLocation ?? true);
  const [readingTime, setReadingTime] = useState<string>(smartSettings.readingPortion.scheduledTime || '17:00');
  const [readingPages, setReadingPages] = useState<number>(smartSettings.readingPortion.dailyPagesGoal || 2);
  const [listeningTime, setListeningTime] = useState<string>(smartSettings.listeningPortion.scheduledTime || '20:00');
  const [listeningVerses, setListeningVerses] = useState<number>(smartSettings.listeningPortion.versesPerPortion || 5);

  useEffect(() => {
    if (isOpen) {
      setPreAlertMinutes(pushSettings.preAlertMinutes || 15);
      setPreAlertSound(pushSettings.preAlertSound || 'reminder');
      setPostAlertMinutes(pushSettings.postAlertMinutes || 15);
      setPostAlertSound(pushSettings.postAlertSound || 'reminder');
      setMorningTime(pushSettings.morningTime || '07:00');
      setEveningTime(pushSettings.eveningTime || '16:30');
      setPeriodicIntervalHours(pushSettings.periodicIntervalHours || 2);
      setSleepTime(pushSettings.sleepTime || '22:30');
      setQuietStart(pushSettings.quietStart || '23:00');
      setQuietEnd(pushSettings.quietEnd || '04:30');
      setSoundEnabled(pushSettings.soundEnabled ?? true);
      setVibrateEnabled(pushSettings.vibrateEnabled ?? true);
      setTestPlaying(false);

      setShowSeconds(smartSettings.ongoingPrayerBar.showSeconds ?? true);
      setShowHijriDate(smartSettings.ongoingPrayerBar.showHijriDate ?? true);
      setShowLocation(smartSettings.ongoingPrayerBar.showLocation ?? true);
      setReadingTime(smartSettings.readingPortion.scheduledTime || '17:00');
      setReadingPages(smartSettings.readingPortion.dailyPagesGoal || 2);
      setListeningTime(smartSettings.listeningPortion.scheduledTime || '20:00');
      setListeningVerses(smartSettings.listeningPortion.versesPerPortion || 5);
    } else {
      if (testAudioRef.current) {
        stopSpiritualSound(testAudioRef);
      }
      setTestPlaying(false);
    }
  }, [isOpen, pushSettings, smartSettings]);

  if (!isOpen || !alarmKey) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (testPlaying) {
      stopSpiritualSound(testAudioRef);
      setTestPlaying(false);
    }
    if (
      alarmKey === 'ongoingPrayerBar' ||
      alarmKey === 'readingPortion' ||
      alarmKey === 'listeningPortion'
    ) {
      const updated: SmartNotificationsSettings = {
        ...smartSettings,
        ongoingPrayerBar: {
          ...smartSettings.ongoingPrayerBar,
          showSeconds,
          showHijriDate,
          showLocation,
        },
        readingPortion: {
          ...smartSettings.readingPortion,
          scheduledTime: readingTime,
          dailyPagesGoal: readingPages,
        },
        listeningPortion: {
          ...smartSettings.listeningPortion,
          scheduledTime: listeningTime,
          versesPerPortion: listeningVerses,
        },
      };
      onSaveSmartSettings(updated);
    } else {
      const updated: PushNotificationSettings = {
        ...pushSettings,
        preAlertMinutes,
        preAlertSound,
        postAlertMinutes,
        postAlertSound,
        morningTime,
        eveningTime,
        periodicIntervalHours,
        sleepTime,
        quietStart,
        quietEnd,
        soundEnabled,
        vibrateEnabled,
      };
      onSavePushSettings(updated);
    }
    onClose();
  };

  const getTitleAndDesc = (): { title: string; subtitle: string; icon: React.ReactNode } => {
    switch (alarmKey) {
      case 'prayerAthan':
        return {
          title: 'تنبيه الأذان (الصلوات الخمس)',
          subtitle: 'يطلق الأذان والتنبيه عند دخول موعد الصلاة المحدد بدقة وفق موقعك.',
          icon: <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'prayerPreAlert':
        return {
          title: 'تنبيه ما قبل الصلاة (الاستعداد والوضوء)',
          subtitle: 'تذكير مسبق قبل حلول موعد الأذان للاستعداد والتطهر وإدراك تكبيرة الإحرام.',
          icon: <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'prayerPostAlert':
        return {
          title: 'تنبيه ما بعد الصلاة (الأذكار والسنن)',
          subtitle: 'تذكير بأذكار ختام الصلاة المأثورة وصلاة السنن الرواتب.',
          icon: <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'adhkarMorning':
        return {
          title: 'تنبيه أذكار الصباح',
          subtitle: 'تذكير يومي لبدء اليوم بذكر الله وحفظه.',
          icon: <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'adhkarEvening':
        return {
          title: 'تنبيه أذكار المساء',
          subtitle: 'تذكير يومي بأذكار المساء في وقت العصر أو الغروب.',
          icon: <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'adhkarPeriodic':
        return {
          title: 'تذكير دوري بالأذكار والتسبيح',
          subtitle: 'إشعارات لطيفة خفيفة بالصلاة على النبي ﷺ والتسبيح على مدار اليوم.',
          icon: <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'fridayKahf':
        return {
          title: 'تذكير سورة الكهف يوم الجمعة',
          subtitle: 'إشعار صباح كل يوم جمعة لقراءة سورة الكهف والإكثار من الصلاة على النبي ﷺ.',
          icon: <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'sleepAdhkar':
        return {
          title: 'أذكار النوم وسورة الملك',
          subtitle: 'تذكير ليلي بأذكار النوم وقراءة سورة الملك المنجية من عذاب القبر.',
          icon: <Moon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'quietHours':
        return {
          title: 'ساعات الهدوء وكتم التنبيهات',
          subtitle: 'إيقاف الإشعارات غير الحرجة خلال ساعات النوم والراحة.',
          icon: <Moon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'ongoingPrayerBar':
        return {
          title: 'الإشعار الدائم لشريط الصلاة (Ongoing Bar)',
          subtitle: 'تثبيت شريط مباشر في مركز الإشعارات يعرض الصلاة الحالية والقادمة والعد التنازلي.',
          icon: <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'readingPortion':
        return {
          title: 'ورد قراءة القرآن الكريم',
          subtitle: 'تذكير يومي ذكي لقراءة وردك من المصحف الشريف.',
          icon: <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'listeningPortion':
        return {
          title: 'ورد استماع القرآن الكريم',
          subtitle: 'تذكير يومي للاستماع لآيات بينات بصوت القارئ المفضل لديك.',
          icon: <Headphones className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      default:
        return {
          title: 'تعديل التنبيه',
          subtitle: 'إعدادات وخيارات التنبيه',
          icon: <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
    }
  };

  const { title, subtitle, icon } = getTitleAndDesc();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#151c27] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden text-right max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 truncate">
                {title}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="إغلاق"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form id="system-alarm-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* A. Pre-Alert Minutes & Sound */}
          {alarmKey === 'prayerPreAlert' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  التنبيه قبل الصلاة بـ:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[5, 10, 15, 20, 25, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setPreAlertMinutes(mins)}
                      className={`py-2 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        preAlertMinutes === mins
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                      }`}
                    >
                      {mins} دقيقة
                    </button>
                  ))}
                </div>
              </div>

              {/* Pre-Alert Sound Picker */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                    نغمة التنبيه / الصوت:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestSound(preAlertSound, 'تنبيه قبل الصلاة')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                      testPlaying
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {testPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>إيقاف التجربة</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>تجربة الصوت</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-0.5">
                  {SOUND_OPTIONS.map((opt) => {
                    const isSelected = preAlertSound === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setPreAlertSound(opt.type)}
                        className={`p-2.5 rounded-xl text-right border transition-all flex flex-col justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-black shadow-xs'
                            : 'bg-slate-50 dark:bg-[#1a232e] border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                        }`}
                      >
                        <div className="text-xs font-black">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* B. Post-Alert Minutes & Sound */}
          {alarmKey === 'prayerPostAlert' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  التنبيه بعد الصلاة بـ:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[5, 10, 15, 20, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setPostAlertMinutes(mins)}
                      className={`py-2 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        postAlertMinutes === mins
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                      }`}
                    >
                      {mins} دقيقة
                    </button>
                  ))}
                </div>
              </div>

              {/* Post-Alert Sound Picker */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                    نغمة التنبيه / الصوت:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestSound(postAlertSound, 'تنبيه بعد الصلاة')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                      testPlaying
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {testPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>إيقاف التجربة</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>تجربة الصوت</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-0.5">
                  {SOUND_OPTIONS.map((opt) => {
                    const isSelected = postAlertSound === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setPostAlertSound(opt.type)}
                        className={`p-2.5 rounded-xl text-right border transition-all flex flex-col justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-black shadow-xs'
                            : 'bg-slate-50 dark:bg-[#1a232e] border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                        }`}
                      >
                        <div className="text-xs font-black">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* C. Morning Time */}
          {alarmKey === 'adhkarMorning' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                موعد أذكار الصباح:
              </label>
              <input
                type="time"
                value={morningTime}
                onChange={(e) => setMorningTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* D. Evening Time */}
          {alarmKey === 'adhkarEvening' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                موعد أذكار المساء:
              </label>
              <input
                type="time"
                value={eveningTime}
                onChange={(e) => setEveningTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* E. Periodic Interval */}
          {alarmKey === 'adhkarPeriodic' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                تكرار التذكير كل:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 6].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setPeriodicIntervalHours(hours)}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      periodicIntervalHours === hours
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                    }`}
                  >
                    {hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتين' : `${hours} ساعات`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* F. Sleep Time */}
          {alarmKey === 'sleepAdhkar' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                موعد تذكير أذكار النوم:
              </label>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* G. Quiet Hours */}
          {alarmKey === 'quietHours' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  بداية الهدوء:
                </label>
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  نهاية الهدوء:
                </label>
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* H. Ongoing Prayer Bar Options */}
          {alarmKey === 'ongoingPrayerBar' && (
            <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-850/60 rounded-2xl border border-slate-200/80 dark:border-slate-750">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">
                محتويات شريط الإشعار المستمر:
              </h4>
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                  <span>إظهار العد التنازلي بالثواني الحية</span>
                  <input
                    type="checkbox"
                    checked={showSeconds}
                    onChange={(e) => setShowSeconds(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                  <span>إظهار التاريخ الهجري</span>
                  <input
                    type="checkbox"
                    checked={showHijriDate}
                    onChange={(e) => setShowHijriDate(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                  <span>إظهار المدينة والموقع الحالي</span>
                  <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* I. Quran Reading Portion */}
          {alarmKey === 'readingPortion' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  موعد التذكير اليومي:
                </label>
                <input
                  type="time"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  الهدف اليومي (عدد الصفحات):
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 4, 10, 20].map((pages) => (
                    <button
                      key={pages}
                      type="button"
                      onClick={() => setReadingPages(pages)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        readingPages === pages
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {pages} {pages === 1 ? 'صفحة' : pages === 2 ? 'صفحتان' : 'صفحات'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* J. Quran Listening Portion */}
          {alarmKey === 'listeningPortion' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  موعد التذكير اليومي:
                </label>
                <input
                  type="time"
                  value={listeningTime}
                  onChange={(e) => setListeningTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  عدد الآيات لكل ورد:
                </label>
                <div className="flex items-center gap-2">
                  {[3, 5, 7, 10].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setListeningVerses(v)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        listeningVerses === v
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {v} آيات
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* General Audio/Vibration Settings for Push */}
          {alarmKey !== 'ongoingPrayerBar' && (
            <div className="p-3 bg-slate-50 dark:bg-slate-850/60 rounded-2xl border border-slate-200/80 dark:border-slate-750 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>تشغيل النغمة الصوتية للإشعار</span>
              </div>
              <button
                type="button"
                role="switch"
                dir="ltr"
                aria-checked={soundEnabled}
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  soundEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform ${
                    soundEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-[#161f2a]/90 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-black text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="system-alarm-form"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>حفظ التعديلات</span>
          </button>
        </div>
      </div>
    </div>
  );
}
