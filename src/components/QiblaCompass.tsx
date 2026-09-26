/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Compass, RotateCw, MapPin, Sparkles, Volume2, ShieldCheck } from 'lucide-react';
import { AppSettings } from '../types';
import { calculateQiblaBearing, bearingToCompassLabel } from '../utils/qibla';
import { getCurrentPositionWithCity, getDistanceKm } from '../utils/locationService';
import { toArabicNumbers } from '../utils/hijri';
import { QiblaModals } from './qibla/QiblaModals';
import KaabaIsometricIcon from './qibla/KaabaIsometricIcon';

export interface QiblaCompassProps {
  settings: AppSettings;
  setSettings?: React.Dispatch<React.SetStateAction<AppSettings>>;
  setActiveTab?: (tab: any) => void;
}

const CARDINALS = [
  { text: 'N', angle: 0, isMajor: true },
  { text: 'NE', angle: 45, isMajor: false },
  { text: 'E', angle: 90, isMajor: true },
  { text: 'SE', angle: 135, isMajor: false },
  { text: 'S', angle: 180, isMajor: true },
  { text: 'SW', angle: 225, isMajor: false },
  { text: 'W', angle: 270, isMajor: true },
  { text: 'NW', angle: 315, isMajor: false },
];

export default function QiblaCompass({
  settings,
  setSettings,
}: QiblaCompassProps) {
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [showCalibrateModal, setShowCalibrateModal] = useState<boolean>(false);
  const [showBraveHelp, setShowBraveHelp] = useState<boolean>(false);
  const [isSyncingLoc, setIsSyncingLoc] = useState<boolean>(false);
  const [locFeedback, setLocFeedback] = useState<string>('');

  const lat = settings.latitude || 30.0444;
  const lng = settings.longitude || 31.2357;
  const qiblaAngle = Math.round(calculateQiblaBearing(lat, lng));
  const distanceToMakkah = Math.round(getDistanceKm(lat, lng, 21.4225, 39.8262));

  // Listen to Device Orientation
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;
      const webkitEvent = e as any;
      if (typeof webkitEvent.webkitCompassHeading === 'number') {
        heading = webkitEvent.webkitCompassHeading;
      } else if (e.alpha !== null) {
        heading = (360 - e.alpha) % 360;
      }

      if (heading !== null) {
        setDeviceHeading(Math.round(heading));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  const currentHeading = deviceHeading ?? 0;
  const angleDiff = ((qiblaAngle - currentHeading + 540) % 360) - 180;
  const isAligned = Math.abs(angleDiff) <= 4;

  const handleSyncLocation = async () => {
    if (!setSettings) return;
    setIsSyncingLoc(true);
    setLocFeedback('جارٍ تحديد موقعك بدقة...');
    try {
      const loc = await getCurrentPositionWithCity();
      setSettings((prev) => ({
        ...prev,
        latitude: loc.latitude,
        longitude: loc.longitude,
        cityName: loc.cityName,
      }));
      setLocFeedback(`تم التحديث: ${loc.cityName}`);
    } catch {
      setLocFeedback('تعذر تحديد الموقع تلقائياً');
    } finally {
      setIsSyncingLoc(false);
      setTimeout(() => setLocFeedback(''), 4000);
    }
  };

  const handleRequestSensor = async () => {
    if (
      typeof (DeviceOrientationEvent as any)?.requestPermission === 'function'
    ) {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          // Permitted
        }
      } catch (e) {
        console.warn('Orientation permission error:', e);
      }
    } else {
      setShowCalibrateModal(true);
    }
  };

  return (
    <div className="pb-12 space-y-5 animate-fade-in" dir="rtl">
      {/* Top Hero Card with Compass & Direction */}
      <div className="bg-gradient-to-b from-[#0b1722] via-[#09121a] to-[#04090e] border border-white/10 rounded-3xl p-6 sm:p-8 text-white flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl space-y-6">
        {/* Glow backdrop */}
        <div
          className={`absolute w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-20 ${
            isAligned ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />

        {/* Header Stats */}
        <div className="w-full flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/15">
              <Compass className="w-5 h-5 text-amber-300" />
            </div>
            <div className="text-right">
              <h2 className="text-base font-black text-white">اتجاه القبلة الشريفة</h2>
              <span className="text-xs text-slate-400 font-bold">
                {settings.cityName || 'موقعك الحالي'} • {bearingToCompassLabel(qiblaAngle)}
              </span>
            </div>
          </div>

          <div className="text-left font-mono">
            <span className="text-[10px] text-slate-400 block font-bold">زاوية القبلة</span>
            <span className="text-lg font-black text-amber-400">
              {toArabicNumbers(qiblaAngle)}°
            </span>
          </div>
        </div>

        {/* Alignment Indicator Banner */}
        <div
          role="status"
          aria-live="polite"
          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all duration-500 flex items-center gap-2 border z-10 ${
            isAligned
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse'
              : 'bg-white/10 text-slate-300 border-white/15'
          }`}
        >
          {isAligned ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>أنت في اتجاه القبلة تماماً الآن! تقبل الله 🕋</span>
            </>
          ) : (
            <span>
              {angleDiff > 0
                ? `ادر هاتفك يميناً ${toArabicNumbers(Math.abs(angleDiff))}°`
                : `ادر هاتفك يساراً ${toArabicNumbers(Math.abs(angleDiff))}°`}
            </span>
          )}
        </div>

        {/* CIRCULAR COMPASS DIAL */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-white/10 bg-[#060e15] shadow-2xl flex items-center justify-center select-none my-2">
          {/* Compass Dial Rotating opposite to heading */}
          <div
            className="absolute inset-0 rounded-full transition-transform duration-200 ease-out"
            style={{ transform: `rotate(${-currentHeading}deg)` }}
          >
            {/* Cardinal Direction Marks */}
            {CARDINALS.map((c) => (
              <span
                key={c.text}
                className={`absolute font-black tracking-wider ${
                  c.text === 'N'
                    ? 'text-red-400 text-sm top-3 start-1/2 -translate-x-1/2'
                    : c.text === 'S'
                    ? 'text-white/80 text-xs bottom-3 start-1/2 -translate-x-1/2'
                    : c.text === 'E'
                    ? 'text-white/80 text-xs end-3 top-1/2 -translate-y-1/2'
                    : c.text === 'W'
                    ? 'text-white/80 text-xs start-3 top-1/2 -translate-y-1/2'
                    : 'text-white/40 text-[9px] hidden'
                }`}
              >
                {c.text}
              </span>
            ))}

            {/* Kaaba Direction Marker on Dial */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-start pointer-events-none"
              style={{ transform: `rotate(${qiblaAngle}deg)` }}
            >
              <div className="mt-1 flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center shadow-[0_0_12px_#f59e0b]">
                  <span className="text-xs">🕋</span>
                </div>
                <div className="w-0.5 h-6 bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              </div>
            </div>
          </div>

          {/* Fixed Center Hub */}
          <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-white/20 shadow-xl flex flex-col items-center justify-center z-10 text-center">
            <span className="text-lg">🕋</span>
            <span className="text-[10px] font-black text-amber-300 font-mono mt-0.5">
              {toArabicNumbers(currentHeading)}°
            </span>
          </div>

          {/* Top Indicator Triangle */}
          <div className="absolute -top-3 start-1/2 -translate-x-1/2 z-20">
            <div className={`w-0 h-0 border-x-8 border-x-transparent border-t-[14px] ${isAligned ? 'border-t-emerald-400' : 'border-t-red-500'} drop-shadow-md`} />
          </div>
        </div>

        {/* Distance & Info Strip */}
        <div className="grid grid-cols-2 gap-3 w-full border-t border-white/10 pt-4 z-10">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center text-center">
            <span className="text-[10px] text-slate-400 font-bold">المسافة إلى الكعبة المشرفة</span>
            <span className="text-xs sm:text-sm font-black text-amber-300 font-mono mt-0.5">
              {toArabicNumbers(distanceToMakkah)} كم
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center text-center">
            <span className="text-[10px] text-slate-400 font-bold">اتجاه الانحراف</span>
            <span className="text-xs sm:text-sm font-black text-white font-mono mt-0.5">
              {bearingToCompassLabel(qiblaAngle)} ({toArabicNumbers(qiblaAngle)}°)
            </span>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between w-full border-t border-white/10 pt-4 z-10 flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRequestSensor}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-amber-300 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>معايرة البوصلة</span>
          </button>

          <button
            type="button"
            onClick={handleSyncLocation}
            disabled={isSyncingLoc}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isSyncingLoc ? 'جارٍ التحديث...' : 'تحديث الموقع'}</span>
          </button>
        </div>

        {locFeedback && (
          <div className="text-xs font-bold text-amber-300 animate-fadeIn z-10">
            {locFeedback}
          </div>
        )}
      </div>

      {/* Calibration & Browser Help Modals */}
      <QiblaModals
        showCalibrateModal={showCalibrateModal}
        setShowCalibrateModal={setShowCalibrateModal}
        showBraveHelp={showBraveHelp}
        setShowBraveHelp={setShowBraveHelp}
      />
    </div>
  );
}
