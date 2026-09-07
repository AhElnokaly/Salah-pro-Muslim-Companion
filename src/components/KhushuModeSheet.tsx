import React, { useState } from 'react';
import {
  VolumeX,
  Volume2,
  BellOff,
  Clock,
  Shield,
  AlertTriangle,
  Settings2,
  PhoneCall,
  Sparkles,
  Zap,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { KhushuModeType } from '../services/khushuModePlugin';
import { KhushuSettings } from '../domain/khushu/khushuTypes';
import { toArabicNumbers } from '../utils/hijri';

interface KhushuModeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isActive: boolean;
  currentMode: KhushuModeType;
  currentDuration: number;
  remainingSeconds: number;
  hasPermission: boolean;
  settings: KhushuSettings;
  onUpdateSettings: (newSettings: Partial<KhushuSettings>) => void;
  onActivate: (durationMinutes: number, mode?: KhushuModeType) => Promise<boolean>;
  onDeactivate: () => Promise<boolean>;
  onRequestPermission: () => Promise<void>;
}

const DURATIONS = [
  { minutes: 15, label: '١٥ دقيقة' },
  { minutes: 20, label: '٢٠ دقيقة' },
  { minutes: 30, label: '٣٠ دقيقة' },
  { minutes: 45, label: '٤٥ دقيقة' },
  { minutes: 60, label: 'ساعة كاملة' },
];

export const KhushuModeSheet: React.FC<KhushuModeSheetProps> = ({
  isOpen,
  onClose,
  isActive,
  currentMode,
  currentDuration,
  remainingSeconds,
  hasPermission,
  settings,
  onUpdateSettings,
  onActivate,
  onDeactivate,
  onRequestPermission,
}) => {
  const [selectedDuration, setSelectedDuration] = useState(settings.defaultDurationMinutes || 15);
  const [selectedMode, setSelectedMode] = useState<KhushuModeType>(settings.preferredMode || 'silent');
  const [activeTab, setActiveTab] = useState<'quick' | 'settings'>('quick');

  if (!isOpen) return null;

  const handleActivate = async () => {
    const success = await onActivate(selectedDuration, selectedMode);
    if (success) onClose();
  };

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeFormatted = `${toArabicNumbers(mins)}:${toArabicNumbers(secs < 10 ? `0${secs}` : secs)}`;

  return (
    <div
      id="khushu-sheet-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      dir="rtl"
    >
      <div
        id="khushu-sheet-content"
        className="w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-t-3xl sm:rounded-3xl p-6 text-white shadow-2xl animate-in slide-in-from-bottom-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس النافذة مع شريط التبويب */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                وضع الخشوع للصلاة
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                كتم ذكي وتلقائي مع استعادة مضمونة للصوت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              id="tab-quick-khushu"
              onClick={() => setActiveTab('quick')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'quick' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              التحكم
            </button>
            <button
              id="tab-settings-khushu"
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'settings' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>التخصيص</span>
            </button>
          </div>
        </div>

        {/* التبويب الأول: التحكم السريع والتفعيل */}
        {activeTab === 'quick' && (
          <div className="space-y-4">
            {isActive ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 text-center shadow-inner">
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  وضع الخشوع مفعّل حالياً ({currentMode === 'dnd' ? 'عدم الإزعاج' : 'الوضع الصامت'})
                </div>
                <div className="text-4xl font-black font-mono text-emerald-300 my-2">
                  {timeFormatted}
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  سيتم إعادة تفعيل الصوت تلقائياً بعد انتهاء الوقت
                </p>
                <button
                  id="btn-deactivate-khushu"
                  onClick={onDeactivate}
                  className="w-full py-3 rounded-xl bg-red-900/60 hover:bg-red-800/80 border border-red-700/60 text-red-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Volume2 className="w-4 h-4 shrink-0" />
                  <span>إنهاء الوضع واستعادة الصوت الآن</span>
                </button>
              </div>
            ) : (
              <>
                {/* اختيار النمط */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-2">
                    اختر نمط الكتم المفضل
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMode('silent')}
                      className={`p-3 rounded-xl border text-right transition-all flex items-center gap-3 ${
                        selectedMode === 'silent'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <VolumeX className="w-5 h-5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">الوضع الصامت</div>
                        <div className="text-[10px] text-slate-400">كتم الرنين والاهتزاز</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMode('dnd')}
                      className={`p-3 rounded-xl border text-right transition-all flex items-center gap-3 ${
                        selectedMode === 'dnd'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <BellOff className="w-5 h-5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">عدم الإزعاج</div>
                        <div className="text-[10px] text-slate-400">حجب كل التنبيهات (DND)</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* اختيار المدة السريعة */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-2">
                    مدة الخشوع (الوقت المقدر للصلاة)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DURATIONS.map((dur) => (
                      <button
                        key={dur.minutes}
                        type="button"
                        onClick={() => setSelectedDuration(dur.minutes)}
                        className={`py-2.5 px-2 rounded-xl border text-center text-xs font-semibold transition-all ${
                          selectedDuration === dur.minutes
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* تنبيه الإذن إذا كان DND */}
                {selectedMode === 'dnd' && !hasPermission && (
                  <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span>يتطلب وضع عدم الإزعاج إذناً خاصاً من النظام.</span>
                      <button
                        onClick={onRequestPermission}
                        className="block mt-1 text-amber-200 underline font-bold"
                      >
                        منح الإذن الآن
                      </button>
                    </div>
                  </div>
                )}

                {/* زر التفعيل السريع */}
                <button
                  id="btn-activate-khushu-now"
                  onClick={handleActivate}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50 transition-all mt-2"
                >
                  <VolumeX className="w-4 h-4 shrink-0" />
                  <span>تفعيل الخشوع الآن ({toArabicNumbers(selectedDuration)} دقيقة)</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* التبويب الثاني: التخصيص والميزات الذكية */}
        {activeTab === 'settings' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* 1. الأتمتة مع وقت الإقامة */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">التفعيل التلقائي مع وقت الإقامة</div>
                    <div className="text-[10px] text-slate-400">يبدأ الكتم تلقائياً فور وقت الإقامة المحسوب لكل فريضة</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoWithIqama}
                  onChange={(e) => onUpdateSettings({ autoWithIqama: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 2. مدد الصلوات المخصصة */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>تخصيص مدة الخشوع لكل صلاة (بالدقائق)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'fajr', label: 'صلاة الفجر' },
                  { key: 'dhuhr', label: 'صلاة الظهر' },
                  { key: 'asr', label: 'صلاة العصر' },
                  { key: 'maghrib', label: 'صلاة المغرب' },
                  { key: 'isha', label: 'صلاة العشاء' },
                  { key: 'friday', label: 'صلاة وخطبة الجمعة' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between bg-black/20 p-2 rounded-xl border border-white/5">
                    <span className="text-slate-300">{item.label}</span>
                    <select
                      value={settings.prayerDurations[item.key as keyof typeof settings.prayerDurations] || 15}
                      onChange={(e) =>
                        onUpdateSettings({
                          prayerDurations: {
                            ...settings.prayerDurations,
                            [item.key]: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="bg-slate-800 text-emerald-300 text-xs rounded-lg px-2 py-1 border border-slate-700 outline-none"
                    >
                      {[10, 15, 20, 25, 30, 45, 60].map((m) => (
                        <option key={m} value={m}>
                          {toArabicNumbers(m)} د
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. استثناء اتصالات الطوارئ المكررة */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">استثناء مكالمات الطوارئ المكررة</div>
                    <div className="text-[10px] text-slate-400">السماح بالرنين إذا كرر نفس الرقم الاتصال ٣ مرات خلال ٣ دقائق</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableEmergencyCallBypass}
                  onChange={(e) => onUpdateSettings({ enableEmergencyCallBypass: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 4. شاشة السكون الإيماني والاهتزاز اللطيف وأذكار ما بعد الصلاة */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-white">خيارات التجربة الروحانية</div>
              
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>شاشة السكون الإيماني (OLED) عند فتح التطبيق أثناء الصلاة</span>
                <input
                  type="checkbox"
                  checked={settings.enableDistractionShield}
                  onChange={(e) => onUpdateSettings({ enableDistractionShield: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer border-t border-white/5 pt-2">
                <span>نبضة اهتزاز هادئة تنبهك بانتهاء فترة الصلاة وعودة الصوت</span>
                <input
                  type="checkbox"
                  checked={settings.enableGentleHapticPulse}
                  onChange={(e) => onUpdateSettings({ enableGentleHapticPulse: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer border-t border-white/5 pt-2">
                <span>إظهار أذكار ما بعد الصلاة فور انتهاء فترة الخشوع</span>
                <input
                  type="checkbox"
                  checked={settings.enablePostPrayerAthkar}
                  onChange={(e) => onUpdateSettings({ enablePostPrayerAthkar: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
