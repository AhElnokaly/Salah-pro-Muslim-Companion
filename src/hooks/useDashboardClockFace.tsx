import React, { useState } from 'react';
import { AppSettings } from '../types';
import { safeSetItem, safeGetItem } from '../utils/storage';
import { CardAnalogClock, ClockFaceType } from '../components/dashboard/CardAnalogClock';

interface UseDashboardClockFaceProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  now: Date;
  currentStyle: string;
  dayNameArabic: string;
  toArabicNumbers: (n: number | string) => string;
}

export function useDashboardClockFace({
  settings,
  setSettings,
  now,
  currentStyle,
  dayNameArabic,
  toArabicNumbers,
}: UseDashboardClockFaceProps) {
  const [clockFace, setClockFaceState] = useState<ClockFaceType>(() => {
    const saved = safeGetItem('salah_clock_face');
    if (saved && ['classic', 'islamic', 'minimal', 'cyber', 'salatuk'].includes(saved)) {
      return saved as ClockFaceType;
    }
    return 'classic';
  });

  const showAnalogClock = (settings.clockStyle || 'digital') === 'analog';

  const setShowAnalogClock = (val: boolean | ((p: boolean) => boolean)) => {
    setSettings(prev => {
      const nextVal = typeof val === 'function' ? val(prev.clockStyle === 'analog') : val;
      return { ...prev, clockStyle: nextVal ? 'analog' : 'digital' };
    });
  };

  const setClockFace = (val: ClockFaceType) => {
    setClockFaceState(val);
    safeSetItem('salah_clock_face', val);
  };

  const renderCardAnalogClock = () => {
    return (
      <CardAnalogClock
        clockFace={clockFace}
        now={now}
        currentStyle={currentStyle}
        dayNameArabic={dayNameArabic}
        toArabicNumbers={toArabicNumbers}
      />
    );
  };

  return {
    clockFace,
    setClockFace,
    showAnalogClock,
    setShowAnalogClock,
    renderCardAnalogClock,
  };
}
