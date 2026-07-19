/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Compass, MapPin, ChevronLeft, Moon, Sun, Bell, Heart, Info } from 'lucide-react';
import { AppSettings, PrayerName } from '../types';
import { POPULAR_CITIES, calculatePrayerTimes } from '../utils/prayerCalc';
import { toArabicNumbers } from '../utils/hijri';

interface OnboardingProps {
  onComplete: (settings: AppSettings, lastPrayerDone: { prayer: PrayerName; wasOnTime: boolean }) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [errorLoc, setErrorLoc] = useState('');
  
  // Settings being gathered
  const [selectedCity, setSelectedCity] = useState(POPULAR_CITIES[0]);
  const [customCoords, setCustomCoords] = useState({ lat: 30.0444, lng: 31.2357, name: 'القاهرة' });
  const [calcMethod, setCalcMethod] = useState('Egypt');
  const [madhab, setMadhab] = useState<'standard' | 'hanafi'>('standard');
  const [hijriOffset, setHijriOffset] = useState(0);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  
  // Last prayer state
  const [lastPrayer, setLastPrayer] = useState<PrayerName>('Dhuhr');
  const [wasOnTime, setWasOnTime] = useState(true);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setErrorLoc('المتصفح لا يدعم تحديد الموقع تلقائياً. يرجى اختيار مدينة من القائمة.');
      return;
    }
    setLoadingLoc(true);
    setErrorLoc('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoadingLoc(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCustomCoords({ lat, lng, name: 'موقعي الحالي' });
        setSelectedCity({
          name: 'Custom Location',
          arabicName: 'موقعي الحالي',
          lat,
          lng,
          country: 'Local'
        });
        setStep(2); // Proceed
      },
      (err) => {
        setLoadingLoc(false);
        console.error(err);
        setErrorLoc('لم نتمكن من تحديد موقعك تلقائياً (ربما تم رفض الصلاحية). يرجى اختيار مدينة من القائمة أدناه.');
      },
      { timeout: 10000 }
    );
  };

  const handleCitySelect = (city: typeof POPULAR_CITIES[0]) => {
    setSelectedCity(city);
    setCustomCoords({ lat: city.lat, lng: city.lng, name: city.arabicName });
    setStep(2);
  };

  const handleFinish = () => {
    const finalSettings: AppSettings = {
      latitude: customCoords.lat,
      longitude: customCoords.lng,
      cityName: customCoords.name,
      calcMethod,
      madhab,
      hijriOffset,
      gender,
      adhanEnabled: {
        Fajr: true,
        Sunrise: false,
        Dhuhr: true,
        Asr: true,
        Maghrib: true,
        Isha: true
      },
      hasCompletedOnboarding: true
    };
    
    onComplete(finalSettings, { prayer: lastPrayer, wasOnTime });
  };

  return (
    <div id="onboarding-root" className="min-h-screen bg-[#faf7f0] flex flex-col items-center justify-center p-4 text-right" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 border border-[#e2e8f0] transition-all duration-300">
        
        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-1.5 w-full">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                  s <= step ? 'bg-indigo-600' : 'bg-gray-100'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-400 mr-4 whitespace-nowrap">
            خطوة {toArabicNumbers(step)} من {toArabicNumbers(3)}
          </span>
        </div>

        {/* STEP 1: Location Setup */}
        {step === 1 && (
          <div id="onboarding-step-1" className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3.5 bg-indigo-50 text-indigo-600 rounded-full mb-2">
                <MapPin className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">تحديد موقعك لمواقيت دقيقة</h2>
              <p className="text-sm text-gray-500">يحتاج التطبيق لمعرفة موقعك لحساب مواقيت الصلاة واتجاه القبلة بدقة متناهية.</p>
            </div>

            <button
              id="btn-use-gps"
              onClick={requestLocation}
              disabled={loadingLoc}
              className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Compass className={`w-5 h-5 ${loadingLoc ? 'animate-spin' : ''}`} />
              {loadingLoc ? 'جاري تحديد موقعك...' : 'تحديد الموقع تلقائياً عبر الـ GPS'}
            </button>

            {errorLoc && (
              <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs flex items-start gap-2 border border-amber-100 leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorLoc}</span>
              </div>
            )}

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-4 text-xs text-gray-400 font-medium">أو اختر مدينتك من القائمة</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar grid grid-cols-2 gap-2">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleCitySelect(city)}
                  className="p-3 text-right bg-[#faf7f0] hover:bg-indigo-50 hover:text-indigo-600 text-gray-700 font-semibold rounded-xl text-sm transition-colors border border-transparent hover:border-indigo-100 cursor-pointer"
                >
                  {city.arabicName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Settings and Preferences */}
        {step === 2 && (
          <div id="onboarding-step-2" className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3.5 bg-indigo-50 text-indigo-600 rounded-full mb-2">
                <Sun className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">طريقة الحساب والفقه</h2>
              <p className="text-sm text-gray-500">اختر طريقة الحساب المعتمدة في منطقتك لضمان تطابق الأذان.</p>
            </div>

            <div className="space-y-4 text-right">
              {/* Calc Method */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">طريقة الحساب:</label>
                <select
                  value={calcMethod}
                  onChange={(e) => setCalcMethod(e.target.value)}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Egypt">الهيئة المصرية العامة للمساحة</option>
                  <option value="UmmAlQura">أم القرى (مكة المكرمة)</option>
                  <option value="ISNA">الجمعية الإسلامية لأمريكا الشمالية (ISNA)</option>
                  <option value="MWL">رابطة العالم الإسلامي</option>
                  <option value="Karachi">جامعة العلوم الإسلامية بكراتشي</option>
                  <option value="Gulf">منطقة الخليج العربي</option>
                </select>
              </div>

              {/* Madhab */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">مذهب صلاة العصر:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMadhab('standard')}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                      madhab === 'standard'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    الجمهور (شافعي، مالكي، حنبلي)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMadhab('hanafi')}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                      madhab === 'hanafi'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    الحنفي
                  </button>
                </div>
              </div>

              {/* Hijri Adjustment */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">تعديل التاريخ الهجري (أيام):</label>
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setHijriOffset(prev => Math.max(-2, prev - 1))}
                    className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-gray-600 border border-gray-200 hover:bg-gray-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-gray-800 text-sm">
                    {hijriOffset === 0 ? 'تطابق الحساب الفلكي' : `${hijriOffset > 0 ? '+' : ''}${toArabicNumbers(hijriOffset)} يوم`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHijriOffset(prev => Math.min(2, prev + 1))}
                    className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-gray-600 border border-gray-200 hover:bg-gray-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Gender Selection */}
              <div className="space-y-1.5 text-right">
                <label className="text-sm font-bold text-gray-700">الجنس ومستند الرخصة الشرعية (👨/👩):</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                      gender === 'male'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    ذكر 👨
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                      gender === 'female'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    أنثى 👩
                  </button>
                </div>
                {gender === 'female' && (
                  <p className="text-[10px] text-indigo-600 font-semibold leading-relaxed mt-1">
                    ✨ يتيح وضع المرأة المسلمة تسجيل صلواتك كـ «عذر شرعي رخصة» لا ينقص من إنجازكِ أو يقطع تتابعك الإيماني المبارك 🤍.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-bold rounded-2xl transition-colors cursor-pointer"
              >
                رجوع
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                متابعة
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Last prayer question (Smart start point) */}
        {step === 3 && (
          <div id="onboarding-step-3" className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3.5 bg-indigo-50 text-indigo-600 rounded-full mb-2">
                <Heart className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">نقطة بداية ذكية للتتبع</h2>
              <p className="text-sm text-gray-500">نود معرفة آخر صلاة صليتها لنبدأ تتبع الفوائت بشكل صحيح بدون ملء خانات فارغة غير حقيقية.</p>
            </div>

            <div className="space-y-4 text-right">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">ما هي آخر فريضة أديتها اليوم؟</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as PrayerName[]).map((p) => {
                    const arabicNames: Record<string, string> = {
                      Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء'
                    };
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setLastPrayer(p)}
                        className={`p-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                          lastPrayer === p
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {arabicNames[p]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">هل صليتها في وقتها أم قضاء؟</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWasOnTime(true)}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                      wasOnTime
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    في وقتها (حاضر)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWasOnTime(false)}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                      !wasOnTime
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    صليتها قضاءً / متأخرة
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-bold rounded-2xl transition-colors cursor-pointer"
              >
                رجوع
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                ابدأ رحلتي المباركة
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
