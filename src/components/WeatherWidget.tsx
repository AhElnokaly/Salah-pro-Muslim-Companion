/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CloudSun, Sun, CloudRain } from 'lucide-react';
import { toArabicNumbers } from '../utils/hijri';

export interface WeatherWidgetProps {
  lat?: number;
  lng?: number;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ lat, lng }) => {
  const [temp, setTemp] = useState<number | null>(null);

  useEffect(() => {
    if (!lat || !lng) return;
    let isMounted = true;

    async function fetchWeather() {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
        );
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.current_weather?.temperature !== undefined) {
            setTemp(Math.round(data.current_weather.temperature));
          }
        }
      } catch (e) {
        // Quiet fallback
      }
    }

    fetchWeather();
    return () => {
      isMounted = false;
    };
  }, [lat, lng]);

  if (temp === null) return null;

  return (
    <div
      className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60"
      title="درجة الحرارة الحالية"
    >
      <CloudSun className="w-3 h-3 text-amber-500" />
      <span>{toArabicNumbers(temp)}° م</span>
    </div>
  );
};

export default WeatherWidget;
