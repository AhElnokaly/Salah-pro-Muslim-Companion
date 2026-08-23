/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  Plus, 
  Check, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  AlertTriangle, 
  Play, 
  Pause,
  ChevronDown,
  ChevronUp,
  Info,
  Sliders,
  Vibrate
} from 'lucide-react';
import { AppSettings, PrayerName, AlarmConfig, SpiritualAlerts, AlarmSoundType, AlarmNotifyMode } from '../types';
import { getArabicPrayerName } from '../utils/prayerCalc';
import { toArabicNumbers } from '../utils/hijri';
import { playSpiritualSound, playSpiritualSpeech } from '../utils/spiritualAudio';
import { requestNotificationPermission as requestNativeNotificationPermission } from '../services/athanAlarmPlugin';
import PushNotificationManager from './PushNotificationManager';

interface WorshipAlarmsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  customAlarms: AlarmConfig[];
  setCustomAlarms: React.Dispatch<React.SetStateAction<AlarmConfig[]>>;
  alerts: SpiritualAlerts;
  setAlerts: React.Dispatch<React.SetStateAction<SpiritualAlerts>>;
  audioVolume: number;
  setAudioVolume: (vol: number) => void;
}

export default function WorshipAlarms({
  settings,
  setSettings,
  customAlarms,
  setCustomAlarms,
  alerts,
  setAlerts,
  audioVolume,
  setAudioVolume
}: WorshipAlarmsProps) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showPushModal, setShowPushModal] = useState<boolean>(false);
  const [showAddAlarm, setShowAddAlarm] = useState(false);
  const [expandedAlarmId, setExpandedAlarmId] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    show: false,
    title: '',
    message: ''
  });
  
  // Alarm Form States
  const [alarmTitle, setAlarmTitle] = useState('');
  const [alarmTime, setAlarmTime] = useState('05:00');
  const [alarmDays, setAlarmDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [alarmSoundType, setAlarmSoundType] = useState<AlarmSoundType>('speech');
  const [alarmNotifyMode, setAlarmNotifyMode] = useState<AlarmNotifyMode>('both');
  
  // Audio test state
  const [testPlaying, setTestPlaying] = useState<string | null>(null);
  const testAudioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const showTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('تم تفعيل منبهات تطبيق هِمَّتِي 🔔', {
          body: 'ستتلقى الآن تنبيهات الصلوات والورد اليومي في وقتها المبارك بإذن الله.',
          icon: '/favicon.ico',
          dir: 'rtl'
        });
      } catch (e) {
        console.warn('Failed to send native test notification:', e);
      }
    }
  };

  const showIframeFailureHint = () => {
    setAlertModal({
      show: true,
      title: 'فشل التفعيل التلقائي 🔒',
      message: 'يمنع المتصفح طلب أذونات الإشعارات داخل إطار المعاينة الحالي لحمايتك.\n\nللاستمتاع بالخلفية الصوتية والأذان التلقائي، افتح التطبيق في نافذة/تبويب جديد بالكامل باستخدام الأيقونة المخصصة في الأعلى!'
    });
  };

  const requestNotificationPermission = async () => {
    const isInIframe = window.self !== window.top;

    // Trigger native Android permission if available
    try {
      await requestNativeNotificationPermission();
    } catch (e) {
      console.warn('Native notification request error:', e);
    }

    if (!('Notification' in window)) {
      setAlertModal({
        show: true,
        title: 'المنبهات عبر المتصفح غير مدعومة هنا ⚠️',
        message: 'متصفحك الحالي أو البيئة الحالية لا تدعم الإشعارات المباشرة بالخلفية.\n\nللتفعيل الكامل ومحاكاة الأذان بصوت نقي:\n١. افتح التطبيق في نافذة مستقلة/خارجية (خارج الإطار الحالي).\n٢. قم بتثبيت التطبيق على الشاشة الرئيسية (PWA) عبر خيارات المتصفح.\n\nسنقوم باستخدام التنبيهات الصوتية الداخلية والمرئية النشطة بدلاً من ذلك!'
      });
      return;
    }

    try {
      if (isInIframe) {
        setAlertModal({
          show: true,
          title: 'تنبيه بخصوص نافذة المعاينة ℹ️',
          message: 'أنت تتصفح تطبيق هِمَّتِي داخل نافذة معاينة (إطار داخلي). قد يمنع المتصفح طلب إذن الإشعارات هنا لأسباب أمنية.\n\nيرجى النقر على زر "فتح في نافذة جديدة" بأعلى يمين الشاشة أو في شريط العنوان لتفعيل الأذان والتنبيهات بالخلفية بشكل سليم تماماً!\n\nسنحاول الآن طلب الإذن على أي حال...',
          onConfirm: async () => {
            try {
              const result = await Notification.requestPermission();
              setNotificationPermission(result);
              if (result === 'granted') {
                showTestNotification();
              }
            } catch (err) {
              console.error('Permission request inside iframe failed:', err);
              showIframeFailureHint();
            }
          }
        });
        return;
      }

      const result = await Notification.requestPermission();
      setNotificationPermission(result);
      
      if (result === 'granted') {
        showTestNotification();
      } else if (result === 'denied') {
        setAlertModal({
          show: true,
          title: 'تم رفض إذن الإشعارات ⚠️',
          message: 'لقد قمت برفض إذن الإشعارات مسبقاً لهذا الموقع. لتمكين أذان الخلفية والتنبيهات، يرجى النقر على رمز القفل بجانب شريط عنوان المتصفح، ثم قم بتفعيل الإشعارات يدوياً.'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setAlertModal({
        show: true,
        title: 'عذراً، لم نتمكن من طلب الإذن ⚙️',
        message: 'حدث خطأ أثناء محاولة طلب إذن الإشعارات بالخلفية (قد يكون بسبب قيود الأمان في المتصفح أو الإطار الحالي).\n\nالحل: يرجى فتح التطبيق في تبويب مستقل تماماً وتجربة التفعيل مرة أخرى.'
      });
    }
  };

  const handleAddAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alarmTitle.trim()) return;

    const newAlarm: AlarmConfig = {
      id: `alarm_${Date.now()}`,
      title: alarmTitle,
      time: alarmTime,
      days: alarmDays,
      enabled: true,
      soundType: alarmSoundType,
      notifyMode: alarmNotifyMode
    };

    setCustomAlarms(prev => [...prev, newAlarm]);
    setAlarmTitle('');
    setAlarmTime('05:00');
    setAlarmDays([0, 1, 2, 3, 4, 5, 6]);
    setAlarmSoundType('speech');
    setAlarmNotifyMode('both');
    setShowAddAlarm(false);
  };

  const handleToggleAlarm = (id: string, isEnabled: boolean) => {
    setCustomAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: isEnabled } : a));
  };

  const handleDeleteAlarm = (id: string) => {
    setCustomAlarms(prev => prev.filter(a => a.id !== id));
  };

  const handleUpdateAlarmNotifyMode = (id: string, notifyMode: AlarmNotifyMode) => {
    setCustomAlarms(prev => prev.map(a => a.id === id ? { ...a, notifyMode } : a));
  };

  const handleUpdateAlarmSoundType = (id: string, soundType: AlarmSoundType) => {
    setCustomAlarms(prev => prev.map(a => a.id === id ? { ...a, soundType } : a));
  };

  const toggleTestSound = (id: string, type: AlarmSoundType, title = 'الصلاة والعبادة', mode: AlarmNotifyMode = 'both') => {
    if (testPlaying === id) {
      if (testAudioRef.current) {
        testAudioRef.current.pause();
        testAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setTestPlaying(null);
    } else {
      if (testAudioRef.current) {
        testAudioRef.current.pause();
      }
      playSpiritualSound(type, title, audioVolume, testAudioRef, mode);
      setTestPlaying(id);
      
      // Auto reset playing status after 8 seconds
      setTimeout(() => {
        setTestPlaying(prev => prev === id ? null : prev);
      }, 8000);
    }
  };

  useEffect(() => {
    return () => {
      if (testAudioRef.current) {
        testAudioRef.current.pause();
      }
    };
  }, []);

  const dayNamesArabic = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  return (
    <div className="pb-12 space-y-6 text-end font-sans" dir="rtl">
      {/* Premium Header Banner */}
      <div className="relative bg-gradient-to-br from-indigo-900 to-slate-900 dark:from-indigo-950 dark:to-slate-950 rounded-3xl p-6 overflow-hidden shadow-md text-white">
        <div className="absolute top-0 start-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-x-10 -translate-y-10" />
        <div className="absolute bottom-0 end-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl translate-x-10 translate-y-10" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/20">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black">منبهات العبادات والصلوات ⏰</h2>
              <p className="text-[11px] text-indigo-200/80 font-bold">إدارة تنبيهات الصلوات والورد اليومي بذكاء فائق ودقة متناهية</p>
            </div>
          </div>
          
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {/* Notification Permission Indicator */}
            {notificationPermission === 'granted' ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl text-[10px] font-black border border-emerald-500/20 shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                  <span>الإشعارات بالخلفية مُفعّلة ✓</span>
                </span>
                <button
                  onClick={showTestNotification}
                  className="inline-flex items-center gap-1 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-95 cursor-pointer border border-indigo-500/30"
                >
                  <span>إرسال إشعار تجريبي 🔔</span>
                </button>
              </div>
            ) : notificationPermission === 'denied' ? (
              <button
                onClick={requestNotificationPermission}
                className="inline-flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-95 cursor-pointer shadow-sm border border-rose-500/30"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>الإشعارات مرفوضة (انقر لإعادة الضبط) 🔒</span>
              </button>
            ) : (
              <button
                onClick={requestNotificationPermission}
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-95 cursor-pointer shadow-sm animate-bounce"
              >
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                <span>تفعيل الإشعارات بالخلفية (موصى به) 🔔</span>
              </button>
            )}

            <button
              onClick={() => setShowPushModal(true)}
              className="inline-flex items-center gap-1.5 bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-95 cursor-pointer border border-indigo-400/30 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>إعدادات الإشعارات الفورية (Push) ⚙️</span>
            </button>
          </div>

          {/* Persistent Foreground Service Notification Toggle (Proposal 2) */}
          <div className="flex items-center justify-between bg-white/10 p-3 rounded-2xl border border-white/10 mt-1">
            <div className="text-right space-y-0.5">
              <span className="text-[11px] font-black text-white block">الإشعار الدائم لمواقيت الصلاة القادمة</span>
              <span className="text-[9.5px] font-bold text-indigo-200 block">إظهار شريط إشعار دائم بأعلى الشاشة يوضح الصلاة القادمة والوقت المتبقي لها</span>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, persistentNotificationEnabled: !prev.persistentNotificationEnabled }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                settings.persistentNotificationEnabled 
                  ? 'bg-emerald-400 text-slate-950 shadow-sm' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {settings.persistentNotificationEnabled ? 'مفعّل ✓' : 'تفعيل'}
            </button>
          </div>
        </div>
      </div>

      {/* Browser Warning Info Card */}
      <div className="bg-amber-50/60 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-950/20 p-4 rounded-2xl flex gap-3 text-amber-800 dark:text-amber-300 text-xs">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-black">ملاحظة فنية هامة لعمل التنبيهات بالخلفية:</h4>
          <p className="leading-relaxed font-bold text-[11px] opacity-90">
            يقوم نظام تشغيل هاتفك أو متصفحك بتعطيل البرامج في الخلفية لتوفير البطارية. لحل هذه المشكلة بالكامل:
          </p>
          <ul className="list-disc list-inside space-y-1 pe-1 font-bold text-[10.5px] opacity-80 leading-relaxed">
            <li>قم بتثبيت التطبيق كـ <strong>تطبيق شاشة رئيسية (PWA)</strong> عبر قائمة الخيارات أو الشريط الجانبي.</li>
            <li>تأكد من السماح بالإشعارات للتطبيق لتلقي التنبيهات حتى عند إغلاق الشاشة.</li>
            <li>يتضمن تطبيق هِمَّتِي <strong>محرك مزامنة ذكي (Catch-up)</strong>، فإذا أغلقت الهاتف تماماً وفاتك موعد أذان أو منبه، سيقوم التطبيق بتشغيل الصوت فور فتحك الشاشة دون فوات الأجر!</li>
          </ul>
        </div>
      </div>

      {/* One-Tap Quick Spiritual Presets */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">القوالب الإيمانية السريعة (تفعيل بضغطة واحدة)</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">منبهات جاهزة لأهم العبادات اليومية والأسبوعية</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[
            {
              title: 'قيام الليل والتهجد 🌌',
              time: '03:30',
              days: [0, 1, 2, 3, 4, 5, 6],
              soundType: 'speech' as AlarmSoundType,
              desc: 'قبل الفجر للتهجد والتحنّث',
              badge: 'الثلث الأخير'
            },
            {
              title: 'منبه السحور والإمساك 🍲',
              time: '04:15',
              days: [0, 1, 2, 3, 4, 5, 6],
              soundType: 'alsalatu_khayr' as AlarmSoundType,
              desc: 'للاستعداد للصيام والتسحر',
              badge: 'الصيام'
            },
            {
              title: 'ورد أذكار الصباح 🌅',
              time: '06:15',
              days: [0, 1, 2, 3, 4, 5, 6],
              soundType: 'duaa' as AlarmSoundType,
              desc: 'عقب صلاة الفجر والشروق',
              badge: 'الورد اليومي'
            },
            {
              title: 'ورد أذكار المساء 🌆',
              time: '16:45',
              days: [0, 1, 2, 3, 4, 5, 6],
              soundType: 'duaa' as AlarmSoundType,
              desc: 'قبل الغروب لحصن المسلم',
              badge: 'الورد اليومي'
            },
            {
              title: 'سورة الكهف والجمعة 📖',
              time: '10:00',
              days: [5], // Friday
              soundType: 'salawat' as AlarmSoundType,
              desc: 'قراءة الكهف والصلاة على النبي',
              badge: 'يوم الجمعة'
            },
            {
              title: 'استغفار الأسحار 📿',
              time: '04:30',
              days: [0, 1, 2, 3, 4, 5, 6],
              soundType: 'istighfar' as AlarmSoundType,
              desc: 'المستغفرين بالأسحار',
              badge: 'دعاء مستجاب'
            },
          ].map((preset, idx) => {
            const isAlreadyAdded = customAlarms.some(a => a.title === preset.title);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (isAlreadyAdded) return;
                  const newAlarm: AlarmConfig = {
                    id: `alarm_preset_${Date.now()}_${idx}`,
                    title: preset.title,
                    time: preset.time,
                    days: preset.days,
                    enabled: true,
                    soundType: preset.soundType
                  };
                  setCustomAlarms(prev => [...prev, newAlarm]);
                }}
                disabled={isAlreadyAdded}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 relative overflow-hidden group ${
                  isAlreadyAdded 
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 cursor-default opacity-80'
                    : 'bg-slate-50/80 dark:bg-slate-900/40 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400 cursor-pointer active:scale-98 shadow-xs'
                }`}
              >
                <div className="flex justify-between items-start w-full gap-1">
                  <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                    {preset.badge}
                  </span>
                  <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {toArabicNumbers(preset.time)}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-black leading-tight text-slate-900 dark:text-white">
                    {preset.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 line-clamp-1">
                    {preset.desc}
                  </p>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-black">
                  {isAlreadyAdded ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>مُضاف ومُفعّل</span>
                    </span>
                  ) : (
                    <span className="text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      <span>إضافة سريعة</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Action Panel: Custom Alarms */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">المنبهات المخصصة والإضافية</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">اضبط منبهات مخصصة لقيام الليل، الاستغفار، أو قراءة وردك المبارك</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddAlarm(!showAddAlarm)}
            className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer"
          >
            {showAddAlarm ? 'إلغاء' : <Plus className="w-3.5 h-3.5" />}
            <span>{showAddAlarm ? 'إلغاء' : 'إضافة منبه'}</span>
          </button>
        </div>

        {/* Master Audio Volume Control */}
        <div className="bg-slate-50/80 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {audioVolume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-500" />
            )}
            <span className="font-black text-slate-700 dark:text-slate-300">مستوى صوت المنبهات والتنبيهات الصوتية:</span>
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioVolume}
              onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 shrink-0">
              {toArabicNumbers(Math.round(audioVolume * 100))}%
            </span>
          </div>
        </div>

        {/* Add Alarm Form */}
        {showAddAlarm && (
          <form onSubmit={handleAddAlarm} className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-black block">اسم المنبه (مثال: قيام الليل، الورد اليومي):</label>
                <input
                  type="text"
                  required
                  value={alarmTitle}
                  onChange={(e) => setAlarmTitle(e.target.value)}
                  placeholder="مثال: قيام الليل والتهجد، الاستغفار بالأسحار..."
                  className="w-full bg-white dark:bg-[#161d26] border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-black block">وقت المنبه:</label>
                <input
                  type="time"
                  required
                  value={alarmTime}
                  onChange={(e) => setAlarmTime(e.target.value)}
                  className="w-full bg-white dark:bg-[#161d26] border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-3 text-xs font-bold font-mono text-center text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Repetition Days */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-black block">تكرار المنبه في الأيام التالية:</label>
              <div className="flex flex-wrap gap-1">
                {dayNamesArabic.map((day, idx) => {
                  const isIncluded = alarmDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const days = alarmDays.includes(idx)
                          ? alarmDays.filter(d => d !== idx)
                          : [...alarmDays, idx];
                        setAlarmDays(days);
                      }}
                      className={`flex-1 py-2 text-center text-[10px] font-bold rounded-xl cursor-pointer border transition-all ${
                        isIncluded
                          ? 'bg-indigo-600 border-indigo-600 text-white font-black shadow-xs'
                          : 'bg-white dark:bg-[#161d26] border-slate-100 dark:border-slate-850 text-slate-555 dark:text-slate-400'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Mode Selection */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-black block">نوع التنبيه المطلوب لكل منبه:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { mode: 'both', label: '🔔📳 صوت واهتزاز', desc: 'تنبيه صوتي مع اهتزاز' },
                  { mode: 'sound', label: '🔊 صوت فقط', desc: 'تنبيه صوتي نقي' },
                  { mode: 'vibrate', label: '📳 اهتزاز فقط', desc: 'اهتزاز صامت بدون صوت' },
                  { mode: 'silent', label: '🔕 بدون / صامت', desc: 'إشعار مرئي فقط' },
                ].map((item) => {
                  const isSelected = alarmNotifyMode === item.mode;
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setAlarmNotifyMode(item.mode as AlarmNotifyMode)}
                      className={`py-2 px-2.5 text-center rounded-xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white font-black shadow-xs'
                          : 'bg-white dark:bg-[#161d26] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
                      }`}
                    >
                      <div className="text-[11px] font-black">{item.label}</div>
                      <div className={`text-[9px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sound Selection & Live Preview */}
            {alarmNotifyMode !== 'silent' && alarmNotifyMode !== 'vibrate' && (
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/40">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 font-black block">صوت المنبه (بدون موسيقى):</label>
                  <button
                    type="button"
                    onClick={() => toggleTestSound('form_preview', alarmSoundType, alarmTitle || 'الصلاة والعبادة', alarmNotifyMode)}
                    className="text-[10.5px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer transition-all active:scale-95"
                  >
                    {testPlaying === 'form_preview' ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        <span className="text-rose-600 dark:text-rose-400">إيقاف التجربة</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>تجربة الصوت المختار الآن 🔊</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { type: 'takbeer', label: '🔊 تكبيرات الحرمين' },
                    { type: 'alsalatu_khayr', label: '🌅 الصلاة خير من النوم' },
                    { type: 'hayya', label: '🕌 حي على الصلاة' },
                    { type: 'adhan', label: '📢 الأذان المبارك كاملاً' },
                    { type: 'salawat', label: '🌸 الصلاة على النبي ﷺ' },
                    { type: 'istighfar', label: '📿 استغفار الأسحار' },
                    { type: 'duaa', label: '🤲 دعاء قرآني خاشع' },
                    { type: 'speech', label: '🎙️ تذكير إيماني بشري' },
                    { type: 'beep', label: '🔔 رنين تنبيه هادئ' },
                  ].map((sound) => {
                    const isSelected = alarmSoundType === sound.type;
                    return (
                      <button
                        key={sound.type}
                        type="button"
                        onClick={() => setAlarmSoundType(sound.type as AlarmSoundType)}
                        className={`py-2 px-2 text-center text-[10.5px] font-bold rounded-xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black shadow-xs'
                            : 'bg-white dark:bg-[#161d26] border-slate-100 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                        }`}
                      >
                        {sound.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/40">
              <button
                type="submit"
                className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>إضافة وتفعيل المنبه المخصص</span>
              </button>
            </div>
          </form>
        )}

        {/* Custom Alarms List */}
        {customAlarms.length === 0 ? (
          <div className="text-center py-8 text-[11px] text-slate-400 dark:text-slate-500 font-bold leading-normal border border-dashed border-slate-100 dark:border-slate-800/60 rounded-2xl">
            لا يوجد منبهات مخصصة مضافة حالياً. يمكنك استخدام زري "القوالب الإيمانية" أو "إضافة منبه" بالأعلى.
          </div>
        ) : (
          <div className="space-y-2.5">
            {customAlarms.map((a) => {
              const soundLabels: Record<string, string> = {
                takbeer: '🔊 تكبيرات الحرمين',
                alsalatu_khayr: '🌅 الصلاة خير من النوم',
                hayya: '🕌 حي على الصلاة',
                adhan: '📢 أذان كاملاً',
                salawat: '🌸 الصلاة على النبي',
                istighfar: '📿 استغفار الأسحار',
                duaa: '🤲 دعاء خاشع',
                speech: '🎙️ تذكير إيماني',
                beep: '🔔 رنين عادي'
              };

              const notifyModeLabels: Record<AlarmNotifyMode, { label: string; icon: string; bg: string }> = {
                both: { label: 'صوت واهتزاز', icon: '🔔📳', bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-800/50' },
                sound: { label: 'صوت فقط', icon: '🔊', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50' },
                vibrate: { label: 'اهتزاز فقط', icon: '📳', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50' },
                silent: { label: 'صامت', icon: '🔕', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' }
              };

              const currentMode = a.notifyMode || 'both';
              const modeInfo = notifyModeLabels[currentMode] || notifyModeLabels.both;
              const soundLabel = soundLabels[a.soundType] || 'تنبيه';
              const daysText = a.days.length === 7 ? 'يومياً' : a.days.map(d => dayNamesArabic[d].slice(0, 3)).join('، ');
              const isTestPlaying = testPlaying === a.id;
              const isExpanded = expandedAlarmId === a.id;

              return (
                <div 
                  key={a.id} 
                  className={`bg-slate-50/60 dark:bg-slate-900/10 p-3.5 rounded-2xl border transition-all ${
                    a.enabled ? 'border-slate-200/80 dark:border-slate-800/60 shadow-xs' : 'opacity-60 border-slate-100 dark:border-slate-850'
                  }`}
                >
                  <div className="flex justify-between items-center gap-3">
                    <div className="space-y-1 text-end min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 dark:text-white">{a.title}</span>
                        {!a.enabled && <span className="bg-slate-150 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-[8.5px] text-slate-500 font-bold">معطل</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-1 items-center text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">
                        <span className="text-indigo-600 dark:text-indigo-400 font-black font-mono">{toArabicNumbers(a.time)}</span>
                        <span>•</span>
                        <span>{daysText}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${modeInfo.bg}`}>
                          {modeInfo.icon} {modeInfo.label}
                        </span>
                        {currentMode !== 'silent' && currentMode !== 'vibrate' && (
                          <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg text-[9px] font-black border border-slate-200/50 dark:border-slate-700/50">
                            {soundLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Play Test Button */}
                      {currentMode !== 'silent' && (
                        <button
                          onClick={() => toggleTestSound(a.id, a.soundType, a.title, currentMode)}
                          className={`p-1.5 rounded-lg text-white transition-colors cursor-pointer flex items-center gap-1 ${
                            isTestPlaying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-slate-200 dark:bg-slate-800 hover:bg-indigo-600 text-slate-700 dark:text-slate-300 hover:text-white'
                          }`}
                          title="تجربة التنبيه والصوت"
                        >
                          {isTestPlaying ? <Pause className="w-3.5 h-3.5 text-white animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {/* Expand / Quick Settings Button */}
                      <button
                        onClick={() => setExpandedAlarmId(isExpanded ? null : a.id)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                        }`}
                        title="تعديل نوع التنبيه والصوت"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>

                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleAlarm(a.id, !a.enabled)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          a.enabled ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                            a.enabled ? '-translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Delete Alarm */}
                      <button
                        onClick={() => handleDeleteAlarm(a.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-all cursor-pointer"
                        title="حذف المنبه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Expanded Settings */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3 bg-white dark:bg-[#161d26] p-3 rounded-xl">
                      {/* Notify Mode Quick Choice */}
                      <div>
                        <label className="text-[9.5px] font-black text-slate-500 dark:text-slate-400 block mb-1.5">
                          نوع التنبيه:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {[
                            { mode: 'both', label: '🔔📳 صوت واهتزاز' },
                            { mode: 'sound', label: '🔊 صوت فقط' },
                            { mode: 'vibrate', label: '📳 اهتزاز فقط' },
                            { mode: 'silent', label: '🔕 صامت' },
                          ].map((m) => {
                            const isSelected = currentMode === m.mode;
                            return (
                              <button
                                key={m.mode}
                                type="button"
                                onClick={() => handleUpdateAlarmNotifyMode(a.id, m.mode as AlarmNotifyMode)}
                                className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600 font-black'
                                    : 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                {m.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sound Choice if sound enabled */}
                      {currentMode !== 'silent' && currentMode !== 'vibrate' && (
                        <div>
                          <label className="text-[9.5px] font-black text-slate-500 dark:text-slate-400 block mb-1.5">
                            تغيير الصوت:
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {[
                              { type: 'takbeer', label: '🔊 تكبيرات' },
                              { type: 'alsalatu_khayr', label: '🌅 الصلاة خير' },
                              { type: 'hayya', label: '🕌 حي على الصلاة' },
                              { type: 'adhan', label: '📢 أذان كاملاً' },
                              { type: 'salawat', label: '🌸 الصلاة على النبي' },
                              { type: 'istighfar', label: '📿 استغفار' },
                              { type: 'duaa', label: '🤲 دعاء خاشع' },
                              { type: 'speech', label: '🎙️ تذكير إيماني' },
                              { type: 'beep', label: '🔔 رنين' },
                            ].map((s) => {
                              const isSelected = a.soundType === s.type;
                              return (
                                <button
                                  key={s.type}
                                  type="button"
                                  onClick={() => handleUpdateAlarmSoundType(a.id, s.type as AlarmSoundType)}
                                  className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white border-emerald-600 font-black'
                                      : 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                  }`}
                                >
                                  {s.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Built-in Spiritual Alarms Section (Before, After, Duha) */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 shadow-xs space-y-5">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-800 dark:text-white">منبهات العبادات والسنن المرتبطة بالصلوات</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">تنبيهات تلقائية ذكية تعينك على السنن القبلية والبعدية وصلاة الضحى</p>
        </div>

        {/* 1. Before Prayer Alarm */}
        <div className="space-y-3.5 p-3.5 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800/30">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-800 dark:text-white">التنبيه قبل الصلوات المكتوبة</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">للاستعداد والوضوء وقراءة السنن القبلية</p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setAlerts(prev => ({
                  ...prev,
                  before: { ...prev.before, enabled: !prev.before.enabled }
                }));
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                alerts.before.enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                  alerts.before.enabled ? '-translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {alerts.before.enabled && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400">التنبيه قبل الصلاة بمدة:</span>
                <div className="flex items-center gap-1 bg-white dark:bg-[#161d26] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1">
                  <input 
                    type="number"
                    min="1"
                    max="60"
                    value={alerts.before.minutes}
                    onChange={(e) => {
                      const min = Math.max(1, Math.min(60, parseInt(e.target.value) || 10));
                      setAlerts(prev => ({ ...prev, before: { ...prev.before, minutes: min } }));
                    }}
                    className="w-8 text-center bg-transparent focus:outline-none font-mono font-black text-indigo-600 dark:text-indigo-400"
                  />
                  <span className="text-[10px] text-slate-400 font-black">دقيقة</span>
                </div>
              </div>

              {/* Day selection */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-black block">التفعيل في أيام:</span>
                <div className="flex gap-1 flex-wrap">
                  {dayNamesArabic.map((day, idx) => {
                    const isIncluded = alerts.before.days.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const days = alerts.before.days.includes(idx)
                            ? alerts.before.days.filter(d => d !== idx)
                            : [...alerts.before.days, idx];
                          setAlerts(prev => ({ ...prev, before: { ...prev.before, days } }));
                        }}
                        className={`flex-1 py-1 text-center text-[9px] font-black rounded-lg cursor-pointer border transition-all ${
                          isIncluded
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white dark:bg-[#161d26] border-slate-150 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. After Prayer Alarm */}
        <div className="space-y-3.5 p-3.5 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800/30">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-800 dark:text-white">التنبيه للأذكار والسنن البعدية</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">تذكير بالأوراد والسنن بعد انقضاء جماعة الصلاة</p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setAlerts(prev => ({
                  ...prev,
                  after: { ...prev.after, enabled: !prev.after.enabled }
                }));
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                alerts.after.enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                  alerts.after.enabled ? '-translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {alerts.after.enabled && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400">التنبيه بعد الصلاة بمدة:</span>
                <div className="flex items-center gap-1 bg-white dark:bg-[#161d26] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1">
                  <input 
                    type="number"
                    min="1"
                    max="60"
                    value={alerts.after.minutes}
                    onChange={(e) => {
                      const min = Math.max(1, Math.min(60, parseInt(e.target.value) || 15));
                      setAlerts(prev => ({ ...prev, after: { ...prev.after, minutes: min } }));
                    }}
                    className="w-8 text-center bg-transparent focus:outline-none font-mono font-black text-indigo-600 dark:text-indigo-400"
                  />
                  <span className="text-[10px] text-slate-400 font-black">دقيقة</span>
                </div>
              </div>

              {/* Day selection */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-black block">التفعيل في أيام:</span>
                <div className="flex gap-1 flex-wrap">
                  {dayNamesArabic.map((day, idx) => {
                    const isIncluded = alerts.after.days.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const days = alerts.after.days.includes(idx)
                            ? alerts.after.days.filter(d => d !== idx)
                            : [...alerts.after.days, idx];
                          setAlerts(prev => ({ ...prev, after: { ...prev.after, days } }));
                        }}
                        className={`flex-1 py-1 text-center text-[9px] font-black rounded-lg cursor-pointer border transition-all ${
                          isIncluded
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white dark:bg-[#161d26] border-slate-150 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Duha Prayer Alarm */}
        <div className="space-y-3.5 p-3.5 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800/30">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-800 dark:text-white">منبه صلاة الضحى (صلاة الأوابين)</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">تذكير تلقائي بصلاة الضحى بعد شروق الشمس بمدة محددة</p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setAlerts(prev => ({
                  ...prev,
                  duha: { ...prev.duha, enabled: !prev.duha.enabled }
                }));
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                alerts.duha.enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                  alerts.duha.enabled ? '-translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {alerts.duha.enabled && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400">التنبيه بعد الشروق بمدة:</span>
                <div className="flex items-center gap-1 bg-white dark:bg-[#161d26] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1">
                  <input 
                    type="number"
                    min="1"
                    max="120"
                    value={alerts.duha.minutes}
                    onChange={(e) => {
                      const min = Math.max(1, Math.min(120, parseInt(e.target.value) || 15));
                      setAlerts(prev => ({ ...prev, duha: { ...prev.duha, minutes: min } }));
                    }}
                    className="w-8 text-center bg-transparent focus:outline-none font-mono font-black text-indigo-600 dark:text-indigo-400"
                  />
                  <span className="text-[10px] text-slate-400 font-black">دقيقة</span>
                </div>
              </div>

              {/* Day selection */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-black block">التفعيل في أيام:</span>
                <div className="flex gap-1 flex-wrap">
                  {dayNamesArabic.map((day, idx) => {
                    const isIncluded = alerts.duha.days.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const days = alerts.duha.days.includes(idx)
                            ? alerts.duha.days.filter(d => d !== idx)
                            : [...alerts.duha.days, idx];
                          setAlerts(prev => ({ ...prev, duha: { ...prev.duha, days } }));
                        }}
                        className={`flex-1 py-1 text-center text-[9px] font-black rounded-lg cursor-pointer border transition-all ${
                          isIncluded
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white dark:bg-[#161d26] border-slate-150 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Alert/Instruction Modal */}
      {alertModal.show && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-[#161d26] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl p-6 text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 start-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl -translate-x-5 -translate-y-5" />
            
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500 dark:text-amber-400 border border-amber-500/20">
              <Info className="w-6 h-6" />
            </div>

            <h3 className="text-xs font-black text-slate-800 dark:text-white">{alertModal.title}</h3>
            
            <p className="text-[10.5px] text-slate-600 dark:text-slate-400 font-bold leading-relaxed whitespace-pre-line text-end">
              {alertModal.message}
            </p>

            <div className="flex gap-2 pt-2">
              {alertModal.onConfirm ? (
                <>
                  <button
                    onClick={() => {
                      setAlertModal(prev => ({ ...prev, show: false }));
                    }}
                    className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-[10.5px] font-black cursor-pointer transition-all active:scale-95"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      const confirmFn = alertModal.onConfirm;
                      setAlertModal(prev => ({ ...prev, show: false }));
                      if (confirmFn) confirmFn();
                    }}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-black shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    متابعة التفعيل
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setAlertModal(prev => ({ ...prev, show: false }))}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                >
                  فهمت ذلك
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Push Notification Manager Control Center Modal */}
      <PushNotificationManager
        isOpen={showPushModal}
        onClose={() => setShowPushModal(false)}
      />
    </div>
  );
}
