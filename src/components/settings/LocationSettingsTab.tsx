import React, { useState } from 'react';
import {
  MapPin,
  Globe,
  Compass,
  Navigation,
  Loader2,
  CheckCircle2,
  Search,
  Edit3,
  Check,
  HelpCircle,
} from 'lucide-react';
import { AppSettings } from '../../types';
import { AppModalVariant } from '../shared/AppModal';
import { POPULAR_CITIES } from '../../utils/prayerCalc';
import { detectUserLocation } from '../../utils/locationService';
import { calculateQiblaBearing, bearingToCompassLabel } from '../../utils/qibla';

interface LocationSettingsTabProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setAppModal: (modal: { message: string; variant: AppModalVariant } | null) => void;
}

export default function LocationSettingsTab({
  settings,
  setSettings,
  setAppModal,
}: LocationSettingsTabProps) {
  const [isAutoLocating, setIsAutoLocating] = useState(false);
  const [citySearchFilter, setCitySearchFilter] = useState('');
  const [locationStatusMsg, setLocationStatusMsg] = useState('');
  const [customLat, setCustomLat] = useState<string>('');
  const [customLng, setCustomLng] = useState<string>('');
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [showGpsGuide, setShowGpsGuide] = useState(false);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
        <h2 className="text-lg font-black text-slate-800 dark:text-white">إعدادات الموقع الجغرافي والـ GPS</h2>
      </div>

      {/* Current Active Location Card & Qibla Bearing */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/30 dark:via-teal-950/10 dark:to-transparent rounded-3xl p-5 border border-emerald-500/20 dark:border-emerald-800/40 space-y-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-emerald-500/10 dark:border-emerald-800/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">الموقع والمدينة الحالية</span>
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>{settings.cityName || 'غير محدد'}</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300/40">نشط 📍</span>
              </h3>
            </div>
          </div>

          {/* Action to view Qibla Compass */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('change-main-tab', { detail: { tab: 'qibla' } }));
            }}
            className="py-1.5 px-3 bg-white dark:bg-[#111720] hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>اتجاه القبلة</span>
          </button>
        </div>

        <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          تحديد موقعك الجغرافي الدقيق يُستخدم لحساب أوقات الشروق والغروب ومواقيت الصلاة الخمسة بدقة فلكية متناهية بدون الحاجة لاتصال بالإنترنت.
        </p>

        {/* Geographical Coordinates Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-3 bg-white/80 dark:bg-[#111720]/80 backdrop-blur-xs rounded-2xl text-center space-y-1 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block">خط العرض (Lat)</span>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">{settings.latitude.toFixed(4)}°</span>
          </div>
          <div className="p-3 bg-white/80 dark:bg-[#111720]/80 backdrop-blur-xs rounded-2xl text-center space-y-1 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block">خط الطول (Lng)</span>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">{settings.longitude.toFixed(4)}°</span>
          </div>
          <div className="p-3 bg-white/80 dark:bg-[#111720]/80 backdrop-blur-xs rounded-2xl text-center space-y-1 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block">زاوية القبلة 🕋</span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
              {Math.round(calculateQiblaBearing(settings.latitude, settings.longitude))}° ({bearingToCompassLabel(calculateQiblaBearing(settings.latitude, settings.longitude))})
            </span>
          </div>
        </div>
      </div>

      {/* GPS Automatic Location Detector */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white">التحديد التلقائي للموقع (GPS / شبكة الاتصال)</h3>
        </div>
        
        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          اضغط على الزر التالي ليقوم التطبيق بالاستعلام التلقائي من حساس الـ GPS في جهازك أو عبر شبكة المزود لتحديد أقرب مدينة بدقة.
        </p>

        <button
          type="button"
          disabled={isAutoLocating}
          onClick={async () => {
            setIsAutoLocating(true);
            setLocationStatusMsg('');
            try {
              const res = await detectUserLocation();
              setSettings(prev => ({
                ...prev,
                latitude: res.latitude,
                longitude: res.longitude,
                cityName: res.cityName
              }));
              setLocationStatusMsg(res.message);
            } catch (e) {
              console.error(e);
              setLocationStatusMsg('فشل تحديد الموقع تلقائياً. يرجى التأكد من سماح المتصفح بإذن الموقع الجغرافي أو اختيار مدينتك من القائمة أسفله.');
            } finally {
              setIsAutoLocating(false);
            }
          }}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
        >
          {isAutoLocating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>جاري تحديد موقعك التلقائي بدقة فلكية...</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 text-white animate-pulse" />
              <span>تحديث موقعي التلقائي الآن (GPS) 📍</span>
            </>
          )}
        </button>

        {locationStatusMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-[11px] font-bold text-emerald-800 dark:text-emerald-300 text-center flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{locationStatusMsg}</span>
          </div>
        )}
      </div>

      {/* Quick Popular Cities Shortcuts */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-3 transition-colors duration-300 shadow-sm">
        <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
          <span>🚀 اختصارات سريعة للمدن والمحافظات الكبرى</span>
        </h3>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
          اضغط على أي مدينة لاختيارها فوراً وتعديل المواقيت وإحداثيات القبلة تلقائياً:
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { name: 'Cairo', label: 'القاهرة' },
            { name: 'Alexandria', label: 'الإسكندرية' },
            { name: 'Makkah', label: 'مكة المكرمة' },
            { name: 'Medina', label: 'المدينة المنورة' },
            { name: 'Riyadh', label: 'الرياض' },
            { name: 'Jeddah', label: 'جدة' },
            { name: 'Dubai', label: 'دبي' },
            { name: 'Amman', label: 'عمان' },
            { name: 'Dammam', label: 'الدمام' },
            { name: 'Baghdad', label: 'بغداد' },
            { name: 'Tunis', label: 'تونس' },
            { name: 'Casablanca', label: 'الدار البيضاء' }
          ].map(item => {
            const cityData = POPULAR_CITIES.find(c => c.name === item.name || c.arabicName === item.label);
            if (!cityData) return null;
            const isSelected = settings.cityName === cityData.arabicName || settings.cityName === cityData.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  setSettings(prev => ({
                    ...prev,
                    cityName: cityData.arabicName,
                    latitude: cityData.lat,
                    longitude: cityData.lng,
                    timezoneId: cityData.timezone
                  }));
                  setLocationStatusMsg(`تم تحديد ${cityData.arabicName} بنجاح ✨`);
                }}
                className={`py-2 px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-105'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:bg-emerald-50/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Comprehensive City Selector */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 dark:text-white">قائمة جميع المحافظات والمدن العربية والعالمية</h3>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
          يمكنك البحث باسم مدينتك أو محافظتك أو دولتك من القائمة التالية المحدثة بجميع الإحداثيات الرسمية:
        </p>
        
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute end-3.5 top-3.5" />
          <input
            type="text"
            placeholder="ابحث عن مدينتك أو محافظتك باللغة العربية أو الإنجليزية..."
            value={citySearchFilter}
            onChange={(e) => setCitySearchFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#111720] border border-[#e2e8f0]/85 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl pe-10 ps-4 py-2.5 text-xs font-bold outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={settings.cityName}
          onChange={(e) => {
            const val = e.target.value;
            const found = POPULAR_CITIES.find(c => c.arabicName === val || c.name === val);
            if (found) {
              setSettings(prev => ({
                ...prev,
                cityName: found.arabicName,
                latitude: found.lat,
                longitude: found.lng,
                timezoneId: found.timezone
              }));
              setLocationStatusMsg(`تم تحديد مدينة ${found.arabicName} (${found.country}) بنجاح`);
            }
          }}
          className="w-full bg-slate-50 dark:bg-[#111720] border border-[#e2e8f0]/85 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          {POPULAR_CITIES
            .filter(c => 
              !citySearchFilter || 
              c.arabicName.includes(citySearchFilter) || 
              c.name.toLowerCase().includes(citySearchFilter.toLowerCase()) ||
              c.country.includes(citySearchFilter)
            )
            .map((c) => (
              <option key={c.name} value={c.arabicName}>
                {c.arabicName} — ({c.country})
              </option>
            ))
          }
        </select>
      </div>

      {/* Manual Custom Coordinates Entry */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-black text-slate-800 dark:text-white">إدخال إحداثيات جغرافية مخصصة</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowManualCoords(!showManualCoords);
              if (!showManualCoords) {
                setCustomLat(settings.latitude.toString());
                setCustomLng(settings.longitude.toString());
              }
            }}
            className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer hover:bg-indigo-100 transition-all"
          >
            {showManualCoords ? 'إخفاء الإدخال اليدوي' : 'تعديل الإحداثيات يدوياً'}
          </button>
        </div>

        {showManualCoords && (
          <div className="space-y-3 pt-2 animate-fade-in border-t border-slate-100 dark:border-slate-800/50">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
              مفيد للمناطق الصحراوية، أو الرحلات البحرية والبرية التي لا تتوافر فيها أسماء مدن مسجلة:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">خط العرض (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="مثال: 30.0444"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#111720] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">خط الطول (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="مثال: 31.2357"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#111720] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const latNum = parseFloat(customLat);
                const lngNum = parseFloat(customLng);
                if (!isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180) {
                  setSettings(prev => ({
                    ...prev,
                    latitude: latNum,
                    longitude: lngNum,
                    cityName: `موقع مخصص (${latNum.toFixed(2)}°, ${lngNum.toFixed(2)}°)`
                  }));
                  setLocationStatusMsg('تم حفظ وتحديث الإحداثيات المخصصة بنجاح ✨');
                  setShowManualCoords(false);
                } else {
                  setAppModal({ message: 'يرجى إدخال قيم صحيحة لخطوط العرض (-90 إلى 90) وخطوط الطول (-180 إلى 180).', variant: 'error' });
                }
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>حفظ وتطبيق الإحداثيات المخصصة</span>
            </button>
          </div>
        )}
      </div>

      {/* GPS Help & Permissions Guide */}
      <div className="bg-slate-50 dark:bg-[#111720] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300">طريقة تفعيل إذن الموقع الجغرافي وحل المشاكل</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowGpsGuide(!showGpsGuide)}
            className="text-[10px] text-slate-500 hover:text-slate-800 dark:text-slate-400 font-bold underline cursor-pointer"
          >
            {showGpsGuide ? 'إغلاق الدليل' : 'عرض خطوات التفعيل'}
          </button>
        </div>

        {showGpsGuide && (
          <div className="text-[10.5px] text-slate-600 dark:text-slate-400 space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 font-medium leading-relaxed animate-fade-in">
            <p>إذا ظهرت لك رسالة خطأ عند الضغط على زر تحديد الموقع التلقائي:</p>
            <ul className="list-disc list-inside space-y-1.5 pe-2">
              <li><strong>على هواتف أندرويد (Chrome / Brave / Samsung):</strong> اضغط على أيقونة القفل 🔒 بجوار عنوان الموقع في أعلى المتصفح، ثم اختر "إعدادات الموقع" واسمح بـ (Location / الموقع الجغرافي).</li>
              <li><strong>على آيفون (Safari):</strong> اذهب لإعدادات الآيفون ⚙️ ➔ الخصوصية والأمان ➔ خدمات الموقع ➔ Safari ➔ اختر "أثناء استخدام التطبيق".</li>
              <li><strong>على الكمبيوتر / اللابتوب:</strong> يرجى السماح بالنافذة المنبثقة Permission Prompt التي تظهر بأعلى اليسار/اليمين عند الضغط على زر تحديد الموقع.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
