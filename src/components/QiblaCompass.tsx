/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { safeSetItem } from '../utils/storage';
import { 
  X, 
  Compass, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  Smartphone,
  HelpCircle,
  RotateCw,
  Sparkles,
  Loader2,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, DashboardTab } from '../types';
import { calculateQiblaBearing, bearingToCompassLabel } from '../utils/qibla';
import { detectUserLocation } from '../utils/locationService';
import { toArabicNumbers } from '../utils/hijri';
import darkMosqueBackdrop from '../assets/images/mosque_backdrop_dark.jpg';
import { QiblaCompassDial } from './qibla/QiblaCompassDial';
import { KaabaIsometricIcon } from './qibla/KaabaIsometricIcon';
import { QiblaReadingsPanel } from './qibla/QiblaReadingsPanel';
import { QiblaModals } from './qibla/QiblaModals';

interface QiblaCompassProps {
  settings: AppSettings;
  setSettings?: React.Dispatch<React.SetStateAction<AppSettings>>;
  setActiveTab?: React.Dispatch<React.SetStateAction<DashboardTab | string>>;
}

type SensorStatus = 'inactive' | 'requesting' | 'active' | 'error';

export default function QiblaCompass({ settings, setSettings, setActiveTab }: QiblaCompassProps) {
  useEffect(() => {
    safeSetItem('salah_visited_qibla', 'true');
  }, []);

  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>('inactive');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLockedOn, setIsLockedOn] = useState<boolean>(false);
  const [isTilted, setIsTilted] = useState<boolean>(false);
  const [showCalibrateModal, setShowCalibrateModal] = useState<boolean>(false);
  const [showBraveHelp, setShowBraveHelp] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSyncingLoc, setIsSyncingLoc] = useState<boolean>(false);
  const [locFeedback, setLocFeedback] = useState<string>('');
  
  const compassRef = useRef<HTMLDivElement>(null);
  const dragStartAngle = useRef<number>(0);
  const dragStartHeading = useRef<number>(0);
  const lockStartTimeRef = useRef<number>(0);

  const qiblaAngle = calculateQiblaBearing(settings.latitude, settings.longitude);
  const qiblaCompassLabel = bearingToCompassLabel(qiblaAngle);

  // Automatically start compass orientation sensors on mount
  useEffect(() => {
    let receivedEvent = false;

    const processHeading = (heading: number | null) => {
      if (heading === null) return;
      
      receivedEvent = true;
      const targetHeading = Math.round(heading);

      setDeviceHeading((prev) => {
        if (prev === null) return targetHeading;
        let diff = targetHeading - prev;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;
        const factor = 0.15; // Smooth but highly responsive
        return Math.round((prev + diff * factor + 360) % 360);
      });
      setSensorStatus('active');
      setErrorMessage('');
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;
      const webkitEvent = e as DeviceOrientationEventWithWebkit;
      
      // 1. iOS absolute compass heading
      if (webkitEvent.webkitCompassHeading !== undefined) {
        heading = webkitEvent.webkitCompassHeading;
      } 
      // 2. Android device orientation absolute alpha (if absolute is true)
      else if (e.alpha !== null && e.alpha !== undefined) {
        heading = (360 - e.alpha) % 360;
      }

      // Check if phone is tilted (upright/standing)
      if (e.beta !== null && e.gamma !== null) {
        const tilted = Math.abs(e.beta) > 35 || Math.abs(e.gamma) > 35;
        setIsTilted(tilted);
      }

      if (heading !== null) {
        processHeading(heading);
      }
    };

    const handleAbsoluteOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.alpha !== undefined) {
        const heading = (360 - e.alpha) % 360;
        processHeading(heading);
      }
      if (e.beta !== null && e.gamma !== null) {
        const tilted = Math.abs(e.beta) > 35 || Math.abs(e.gamma) > 35;
        setIsTilted(tilted);
      }
    };

    // Register both to ensure we catch whatever the browser fires
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleAbsoluteOrientation as EventListener, true);
    }
    window.addEventListener('deviceorientation', handleOrientation, true);

    // Fallback detection: if no events fire after 1500ms, set as inactive (simulation fallback)
    const timeout = setTimeout(() => {
      if (!receivedEvent) {
        setSensorStatus('inactive');
      }
    }, 1500);

    return () => {
      clearTimeout(timeout);
      if ('ondeviceorientationabsolute' in window) {
        window.removeEventListener('deviceorientationabsolute', handleAbsoluteOrientation as EventListener, true);
      }
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  // Manage automatic magnetic lock-on and hold (hysteresis + duration hold)
  const currentHeading = deviceHeading !== null ? deviceHeading : manualHeading;
  const relativeDiff = (qiblaAngle - currentHeading + 360) % 360;
  const normalizedDiff = relativeDiff > 180 ? relativeDiff - 360 : relativeDiff;
  const absDiff = Math.abs(normalizedDiff);

  // If locked, we snap visual rotation parameters so they stay completely rock-solid on Qibla
  const visualHeading = isLockedOn ? qiblaAngle : currentHeading;
  const dialRotation = -visualHeading;
  const isAligned = absDiff <= 3;

  useEffect(() => {
    if (absDiff <= 3) {
      if (!isLockedOn) {
        setIsLockedOn(true);
        lockStartTimeRef.current = Date.now();
        // Dynamic premium feedback vibration if available
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([100]);
          } catch (e) {
            console.log('Vibration blocked or unsupported:', e);
          }
        }
      }
    } else {
      if (isLockedOn) {
        const timeElapsed = Date.now() - lockStartTimeRef.current;
        if (absDiff > 8 || timeElapsed >= 1500) {
          setIsLockedOn(false);
        }
      }
    }
  }, [currentHeading, qiblaAngle, isLockedOn, absDiff]);

  // Handle explicit calibration trigger & iOS Permission request
  const handleActivateSensor = async () => {
    setErrorMessage('');
    setSensorStatus('requesting');
    
    const DeviceOrientation = window.DeviceOrientationEvent;
    
    if (!DeviceOrientation) {
      setSensorStatus('error');
      setErrorMessage('جهازك أو متصفحك لا يدعم حساسات الاتجاه والبوصلة.');
      return;
    }

    // iOS 13+ permission flow request
    if (typeof DeviceOrientation.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientation.requestPermission();
        if (permissionState === 'granted') {
          setSensorStatus('active');
        } else {
          setSensorStatus('error');
          setErrorMessage('تم رفض الصلاحية للوصول لحساسات الهاتف. يمكنك تدوير البوصلة يدوياً.');
        }
      } catch (err) {
        console.error('Permission error:', err);
        setSensorStatus('error');
        setErrorMessage('فشل تفعيل الحساس. يتطلب تفعيل البوصلة موافقة صريحة على أجهزة iOS.');
      }
    } else {
      // Android / Other browsers
      setSensorStatus('active');
    }
  };

  // --- Manual Drag-to-Rotate Fallback Mechanics ---
  const getAngleOfTouch = (clientX: number, clientY: number) => {
    if (!compassRef.current) return 0;
    const rect = compassRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (deviceHeading !== null) return; // Disable dragging if live sensor is active
    
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const angle = getAngleOfTouch(clientX, clientY);
    dragStartAngle.current = angle;
    dragStartHeading.current = manualHeading;
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || deviceHeading !== null) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const currentAngle = getAngleOfTouch(clientX, clientY);
    const angleDifference = currentAngle - dragStartAngle.current;
    
    let newHeading = (dragStartHeading.current - angleDifference + 360) % 360;
    setManualHeading(Math.round(newHeading));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Dial transition class
  const dialTransitionClass = deviceHeading !== null
    ? 'transition-none' 
    : isDragging 
    ? 'transition-none' 
    : 'transition-transform duration-300 ease-out';

  return (
    <motion.div 
      id="qibla-immersive-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#0c3147] via-[#091d2c] to-[#040d16] flex flex-col justify-between py-8 px-6 select-none text-white overflow-hidden text-center"
      dir="rtl"
    >
      {/* Background Mosque Atmosphere Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden select-none">
        <img 
          src={darkMosqueBackdrop} 
          alt="Mosque Atmosphere" 
          className="w-full h-full object-cover object-center scale-110 filter blur-[0.5px]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040d16] via-[#091d2c]/60 to-[#0c3147]/80" />
      </div>

      {/* 1. Top Bar: Title & Close Button */}
      <div className="flex items-center justify-between w-full relative z-10 px-2">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-300 animate-spin-slow" aria-hidden="true" />
          <span className="text-xs font-black tracking-wide text-white/85">بوصلة اتجاه القبلة</span>
        </div>
        {setActiveTab && (
          <button 
            onClick={() => setActiveTab('home')}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/80 hover:text-white cursor-pointer"
            title="إغلاق والعودة"
            aria-label="إغلاق شاشة القبلة والعودة للرئيسية"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* 2. Top Center Kaaba minimalist 3D isometric representation */}
      <div className="flex flex-col items-center justify-center my-2 relative z-10">
        <KaabaIsometricIcon />
      </div>

      {/* 3. Central Interactive Compass Area */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        
        {/* Glow backdrop behind the compass */}
        <div className={`absolute w-80 h-80 rounded-full transition-all duration-700 blur-3xl pointer-events-none ${
          isAligned 
            ? 'bg-emerald-500/15 scale-110' 
            : 'bg-cyan-500/10 scale-100'
        }`} />

        {/* Outer Circular Compass Rim */}
        <div 
          ref={compassRef}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full flex items-center justify-center bg-black/15 border-2 transition-colors duration-500 select-none touch-none ${
            isAligned 
              ? 'border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]' 
              : 'border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)]'
          } ${deviceHeading === null ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        >
          {/* Compass Rotating Disk */}
          <QiblaCompassDial
            dialRotation={dialRotation}
            dialTransitionClass={dialTransitionClass}
            qiblaAngle={qiblaAngle}
          />

          {/* Stationary White / Green Triangle Pointer at the Bottom center, pointing inwards */}
          <div className="absolute bottom-1.5 flex flex-col items-center pointer-events-none transition-colors duration-500">
            <span className={`text-sm ${isAligned ? 'text-emerald-400 scale-125' : 'text-white'}`}>
              ▲
            </span>
          </div>

          {/* Stationary top guide line */}
          <div className="absolute top-1.5 w-0.5 h-3 bg-white/20 pointer-events-none" />
        </div>

        {/* Pitch tilt warning */}
        {isTilted && (
          <div className="mt-3 text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full animate-pulse font-black">
            ⚠️ ضع الهاتف مسطحاً تماماً لضمان دقة القراءة
          </div>
        )}
      </div>

      {/* 4. Display Info & Readings */}
      <QiblaReadingsPanel
        currentHeading={currentHeading}
        qiblaAngle={qiblaAngle}
        angleDiff={normalizedDiff}
        settings={settings}
        setSettings={setSettings}
        isSyncingLoc={isSyncingLoc}
        locFeedback={locFeedback}
        isAligned={isAligned}
        deviceHeading={deviceHeading}
        onSyncLocation={async () => {
          if (!setSettings) return;
          setIsSyncingLoc(true);
          setLocFeedback('');
          try {
            const res = await detectUserLocation();
            setSettings(prev => ({
              ...prev,
              latitude: res.latitude,
              longitude: res.longitude,
              cityName: res.cityName
            }));
            setLocFeedback(`تم التحديث: ${res.cityName}`);
          } catch (e) {
            setLocFeedback('فشل المزامنة الحية');
          } finally {
            setIsSyncingLoc(false);
          }
        }}
        onShowBraveHelp={() => setShowBraveHelp(true)}
      />

      {/* 5. Bottom Status and calibration trigger */}
      <div className="flex items-center justify-between w-full border-t border-white/10 pt-4 px-2 mt-4 relative z-10">
        
        {/* Bottom Left: Calibrate action button */}
        <button 
          onClick={() => {
            if (deviceHeading === null) {
              handleActivateSensor();
            } else {
              setShowCalibrateModal(true);
            }
          }}
          aria-label={deviceHeading === null ? 'تشغيل مستشعر بوصلة الهاتف' : 'بدء معايرة بوصلة الهاتف'}
          className="text-xs font-bold text-amber-300 hover:text-amber-200 cursor-pointer active:scale-95 transition-all bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5"
        >
          {deviceHeading === null ? 'تشغيل المستشعر' : 'معايرة'}
        </button>

        {/* Bottom Right: High-Fidelity Sensor Accuracy Indicator with glowing dot */}
        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
          <span className={`w-2 h-2 rounded-full ${
            deviceHeading !== null 
              ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' 
              : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
          }`} />
          <span className="text-[10px] font-black text-white/80">
            {deviceHeading !== null ? 'دقة مستشعر الهاتف جيدة' : 'البوصلة في وضع المحاكاة'}
          </span>
        </div>

      </div>

      {/* 6 & 7. Calibration Guidance & Browser Sensor Help Modals */}
      <QiblaModals
        showCalibrateModal={showCalibrateModal}
        setShowCalibrateModal={setShowCalibrateModal}
        showBraveHelp={showBraveHelp}
        setShowBraveHelp={setShowBraveHelp}
      />

    </motion.div>
  );
}
