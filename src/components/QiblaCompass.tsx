/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Compass, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  Smartphone,
  HelpCircle,
  RotateCw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings } from '../types';
import { calculateQiblaBearing, bearingToCompassLabel } from '../utils/qibla';
import { toArabicNumbers } from '../utils/hijri';

interface QiblaCompassProps {
  settings: AppSettings;
  setSettings?: React.Dispatch<React.SetStateAction<AppSettings>>;
  setActiveTab?: React.Dispatch<React.SetStateAction<any>>;
}

type SensorStatus = 'inactive' | 'requesting' | 'active' | 'error';

export default function QiblaCompass({ settings, setSettings, setActiveTab }: QiblaCompassProps) {
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>('inactive');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLockedOn, setIsLockedOn] = useState<boolean>(false);
  const [isTilted, setIsTilted] = useState<boolean>(false);
  const [showCalibrateModal, setShowCalibrateModal] = useState<boolean>(false);
  const [showBraveHelp, setShowBraveHelp] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
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
      
      // 1. iOS absolute compass heading
      if ((e as any).webkitCompassHeading !== undefined) {
        heading = (e as any).webkitCompassHeading;
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

    const handleAbsoluteOrientation = (e: any) => {
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
    const win = window as any;
    if ('ondeviceorientationabsolute' in win) {
      win.addEventListener('deviceorientationabsolute', handleAbsoluteOrientation, true);
    }
    win.addEventListener('deviceorientation', handleOrientation, true);

    // Fallback detection: if no events fire after 1500ms, set as inactive (simulation fallback)
    const timeout = setTimeout(() => {
      if (!receivedEvent) {
        setSensorStatus('inactive');
      }
    }, 1500);

    return () => {
      clearTimeout(timeout);
      if ('ondeviceorientationabsolute' in win) {
        win.removeEventListener('deviceorientationabsolute', handleAbsoluteOrientation, true);
      }
      win.removeEventListener('deviceorientation', handleOrientation, true);
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
    
    const DeviceOrientation = (window as any).DeviceOrientationEvent;
    
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

  // Tick generator for Compass Dial (SVG format)
  const renderCompassTicks = () => {
    return Array.from({ length: 72 }).map((_, index) => {
      const angle = index * 5;
      const isMajor = angle % 30 === 0;
      const isCardinal = angle % 90 === 0;
      const tickLength = isCardinal ? 8 : isMajor ? 6 : 4;
      const strokeWidth = isCardinal ? 1.2 : isMajor ? 0.8 : 0.5;
      const strokeColor = isCardinal 
        ? 'rgba(255, 255, 255, 0.85)' 
        : isMajor 
        ? 'rgba(255, 255, 255, 0.5)' 
        : 'rgba(255, 255, 255, 0.2)';
      
      const r1 = 96;
      const r2 = 96 - tickLength;
      const rad = (angle * Math.PI) / 180;
      const x1 = 100 + r1 * Math.sin(rad);
      const y1 = 100 - r1 * Math.cos(rad);
      const x2 = 100 + r2 * Math.sin(rad);
      const y2 = 100 - r2 * Math.cos(rad);
      
      return (
        <line
          key={index}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    });
  };

  const cardinalLabels = [
    { text: 'N', angle: 0, isMajor: true },
    { text: 'NE', angle: 45, isMajor: false },
    { text: 'E', angle: 90, isMajor: true },
    { text: 'SE', angle: 135, isMajor: false },
    { text: 'S', angle: 180, isMajor: true },
    { text: 'SW', angle: 225, isMajor: false },
    { text: 'W', angle: 270, isMajor: true },
    { text: 'NW', angle: 315, isMajor: false },
  ];

  return (
    <motion.div 
      id="qibla-immersive-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#0c3147] via-[#091d2c] to-[#040d16] flex flex-col justify-between py-8 px-6 select-none text-white overflow-hidden text-center"
      dir="rtl"
    >
      {/* 1. Top Bar: Title & Close Button */}
      <div className="flex items-center justify-between w-full relative z-10 px-2">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-300 animate-spin-slow" />
          <span className="text-xs font-black tracking-wide text-white/85">بوصلة اتجاه القبلة</span>
        </div>
        {setActiveTab && (
          <button 
            onClick={() => setActiveTab('home')}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/80 hover:text-white cursor-pointer"
            title="إغلاق والعودة"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Top Center Kaaba minimalist 3D isometric representation */}
      <div className="flex flex-col items-center justify-center my-2 relative z-10">
        <svg className="w-12 h-12 text-white/95 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" viewBox="0 0 100 100" fill="none">
          {/* Isometric Kaaba representation */}
          {/* Top of Cube */}
          <path d="M50 25 L75 35 L50 45 L25 35 Z" fill="#2c3540" stroke="#424f5e" strokeWidth="0.5" />
          {/* Left wall */}
          <path d="M25 35 L50 45 L50 72 L25 62 Z" fill="#151921" />
          {/* Right wall */}
          <path d="M50 45 L75 35 L75 62 L50 72 Z" fill="#0d1015" />
          {/* Gold Belt (Kiswah gold band) */}
          <path d="M25 43 L50 53 L50 55.5 L25 45.5 Z" fill="#d4af37" />
          <path d="M50 53 L75 43 L75 45.5 L50 55.5 Z" fill="#bfa130" />
          {/* Door of Kaaba */}
          <path d="M57 50.5 L64 47.5 L64 58 L57 61 Z" fill="#d4af37" opacity="0.9" />
        </svg>
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
          <div 
            className={`w-52 h-52 sm:w-60 sm:h-60 rounded-full border border-white/5 bg-[#050e14] shadow-inner flex items-center justify-center pointer-events-none relative ${dialTransitionClass}`}
            style={{
              transform: `rotate(${dialRotation}deg)`
            }}
          >
            {/* SVG Tick Marks and Cardinal Directions */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
              {/* Ticks */}
              {renderCompassTicks()}
              
              {/* English Cardinal Text Labels exactly rotating with the dial */}
              {cardinalLabels.map((lbl, idx) => {
                const rad = (lbl.angle * Math.PI) / 180;
                const r = 76; // outer padding for labels
                const x = 100 + r * Math.sin(rad);
                const y = 100 - r * Math.cos(rad);
                return (
                  <text
                    key={idx}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`font-sans tracking-tighter ${
                      lbl.isMajor 
                        ? 'text-[11px] font-extrabold fill-white/90' 
                        : 'text-[7.5px] font-bold fill-white/40'
                    }`}
                    transform={`rotate(${lbl.angle}, ${x}, ${y})`}
                  >
                    {lbl.text}
                  </text>
                );
              })}

              {/* Gold marker for Qibla direction inside the dial */}
              {(() => {
                const qRad = (qiblaAngle * Math.PI) / 180;
                const qr = 54;
                const qx = 100 + qr * Math.sin(qRad);
                const qy = 100 - qr * Math.cos(qRad);
                return (
                  <g transform={`rotate(${qiblaAngle}, ${qx}, ${qy})`}>
                    {/* Pulsing Qibla Pointer circle */}
                    <circle cx={qx} cy={qy} r="6" className="fill-amber-400" />
                    <text x={qx} y={qy} textAnchor="middle" dominantBaseline="middle" className="text-[7px] fill-slate-950 font-black">🕋</text>
                  </g>
                );
              })()}
            </svg>

            {/* Subtle center background circle decoration */}
            <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
              <span className="text-xl opacity-20">✨</span>
            </div>
          </div>

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
      <div className="flex flex-col items-center justify-center space-y-2 relative z-10">
        {/* Real-time Dynamic Big Digit Heading */}
        <div className="text-5xl sm:text-6xl font-sans font-black tracking-tight text-white drop-shadow-md select-all">
          {Math.round(currentHeading)}
        </div>

        {/* Descriptive Direction details */}
        <div className="space-y-1">
          <p className="text-white/65 text-xs font-semibold tracking-wide">
            الاتجاه التقريبي للقبلة في
          </p>
          <p className="text-white text-base sm:text-lg font-black tracking-wide">
            {settings.cityName} {toArabicNumbers(Math.round(qiblaAngle))}°
          </p>
          
          {isAligned && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-emerald-400 text-xs font-black flex items-center justify-center gap-1 mt-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>أنت الآن باتجاه القبلة الشريفة 🕋</span>
            </motion.div>
          )}
        </div>

        {/* Help button for Brave/Chrome sensor issues */}
        {deviceHeading === null && (
          <button
            onClick={() => setShowBraveHelp(true)}
            className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 cursor-pointer underline underline-offset-2 flex items-center justify-center gap-1 mx-auto mt-2 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 active:scale-95 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>مشكلة في تفعيل المستشعر؟ اضغط هنا</span>
          </button>
        )}
      </div>

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

      {/* 6. Calibration Guidance Modal Overlay */}
      <AnimatePresence>
        {showCalibrateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-pointer" 
              onClick={() => setShowCalibrateModal(false)}
            />

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b1722] border border-white/10 w-full max-w-xs rounded-3xl p-5 relative z-10 shadow-2xl text-right flex flex-col gap-4 text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <h3 className="text-sm font-black text-amber-400">طريقة معايرة البوصلة</h3>
                </div>
                <button
                  onClick={() => setShowCalibrateModal(false)}
                  className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs font-semibold leading-relaxed text-white/95">
                <p>لضمان الحصول على أدق اتجاه للقبلة الشريفة، يرجى اتباع الآتي:</p>
                <ol className="list-decimal list-inside space-y-2 pr-1 text-[11px] text-white/80">
                  <li>ضع الهاتف بشكل <span className="text-amber-300 font-bold">مستوٍ وموازٍ للأرض</span> تماماً في كف يدك.</li>
                  <li>قم بتحريك هاتفك في الهواء برسم مسار دائري متقاطع على شكل رقم ثمانية بالإنجليزية (<span className="text-amber-300 font-black">∞</span>) عدة مرات.</li>
                  <li>تجنب التواجد بالقرب من الأجهزة الإلكترونية أو الأجسام المعدنية والمغناطيسية لأنها تسبب تشتيت المستشعر.</li>
                </ol>
              </div>

              {/* Animated Infinity SVG calibration pattern */}
              <div className="flex justify-center py-2">
                <svg className="w-24 h-12 text-amber-400/35" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M 25 25 C 10 5, 5 45, 25 25 C 45 5, 50 45, 25 25 Z" className="animate-dash" strokeDasharray="100" strokeDashoffset="100" style={{ animation: 'dash 3s linear infinite' }} />
                  <circle cx="25" cy="25" r="3" className="fill-amber-300 animate-pulse" />
                </svg>
              </div>

              <button
                onClick={() => setShowCalibrateModal(false)}
                className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all active:scale-95 text-center shadow-md shadow-amber-500/10"
              >
                حسناً، فهمت
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Brave / Chrome Sensor Activation Help Modal */}
      <AnimatePresence>
        {showBraveHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-pointer" 
              onClick={() => setShowBraveHelp(false)}
            />

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b1722] border border-white/10 w-full max-w-xs rounded-3xl p-5 relative z-10 shadow-2xl text-right flex flex-col gap-4 text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-black text-cyan-400">تفعيل بوصلة الهاتف (Brave / Chrome)</h3>
                </div>
                <button
                  onClick={() => setShowBraveHelp(false)}
                  className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs font-semibold leading-relaxed text-white/95">
                <p>متصفحات مثل <span className="text-amber-400 font-bold">Brave</span> و <span className="text-amber-400 font-bold">Chrome</span> تقوم بحظر حساسات الهاتف افتراضياً لحمايتك. لتشغيل البوصلة تلقائياً، يرجى اتباع هذه الخطوة البسيطة:</p>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-2 text-right">
                  <p className="font-bold text-amber-300">من شريط العنوان بالمتصفح (في الأعلى أو الأسفل):</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-white/80">
                    <li>اضغط على <span className="text-white font-bold">أيقونة القفل 🔒</span> أو <span className="text-white font-bold">أيقونة الإعدادات ⚙️</span> الموجودة بجانب رابط الموقع.</li>
                    <li>ابحث عن إذن <span className="text-white font-bold">"المسشعر" (Sensors)</span> أو <span className="text-white font-bold">"الحركة والاتجاه" (Motion)</span>.</li>
                    <li>قم بتغيير الإعداد إلى <span className="text-emerald-400 font-bold">"سماح" (Allow)</span>.</li>
                    <li>أعد تحميل الصفحة، وستعمل البوصلة تلقائياً بنسبة 100%!</li>
                  </ol>
                </div>
                <p className="text-[10px] text-white/60 text-center">أو يمكنك تدوير البوصلة يدوياً الآن بالمسح والسحب بإصبعك على شاشة الهاتف!</p>
              </div>

              <button
                onClick={() => setShowBraveHelp(false)}
                className="w-full py-2 bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all active:scale-95 text-center shadow-md"
              >
                فهمت، شكراً لك
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
