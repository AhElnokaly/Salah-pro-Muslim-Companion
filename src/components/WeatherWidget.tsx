import React, { useState, useEffect } from 'react';
import { safeSetItem } from '../utils/storage';
import { Sun, CloudSun, Cloud, CloudRain, CloudLightning, CloudFog, Snowflake, Thermometer } from 'lucide-react';

interface WeatherWidgetProps {
  lat: number;
  lng: number;
}

interface WeatherData {
  temp: number;
  weatherCode: number;
  humidity?: number;
  description: string;
  iconType: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'thunder' | 'fog' | 'snow' | 'default';
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ lat, lng }) => {
  const [weather, setWeather] = useState<WeatherData | null>(() => {
    try {
      const cached = localStorage.getItem('muslim_companion_weather_cache');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(!weather);

  useEffect(() => {
    let isMounted = true;

    const fetchWeather = async () => {
      try {
        setLoading(true);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();

        if (data && data.current) {
          const temp = Math.round(data.current.temperature_2m);
          const code = data.current.weather_code;
          const humidity = data.current.relative_humidity_2m;

          const info = getWeatherInfo(code);

          const weatherObj: WeatherData = {
            temp,
            weatherCode: code,
            humidity,
            description: info.label,
            iconType: info.iconType,
          };

          if (isMounted) {
            setWeather(weatherObj);
            safeSetItem('muslim_companion_weather_cache', JSON.stringify(weatherObj));
          }
        }
      } catch (err) {
        console.warn('Could not fetch weather data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWeather();

    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lat, lng]);

  const getWeatherInfo = (code: number): { label: string; iconType: WeatherData['iconType'] } => {
    if (code === 0) return { label: 'مشمس', iconType: 'sun' };
    if (code >= 1 && code <= 2) return { label: 'صافٍ جزئياً', iconType: 'cloud-sun' };
    if (code === 3) return { label: 'غائم', iconType: 'cloud' };
    if (code === 45 || code === 48) return { label: 'ضبابي', iconType: 'fog' };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { label: 'ممطر', iconType: 'rain' };
    if (code >= 71 && code <= 77) return { label: 'مثلج', iconType: 'snow' };
    if (code >= 95) return { label: 'عاصف', iconType: 'thunder' };
    return { label: 'معتدل', iconType: 'default' };
  };

  const renderIcon = (type: WeatherData['iconType']) => {
    switch (type) {
      case 'sun':
        return <Sun className="w-3 h-3 text-amber-500 animate-spin-slow shrink-0" />;
      case 'cloud-sun':
        return <CloudSun className="w-3 h-3 text-amber-400 shrink-0" />;
      case 'cloud':
        return <Cloud className="w-3 h-3 text-slate-400 shrink-0" />;
      case 'rain':
        return <CloudRain className="w-3 h-3 text-sky-400 shrink-0" />;
      case 'thunder':
        return <CloudLightning className="w-3 h-3 text-amber-500 shrink-0" />;
      case 'fog':
        return <CloudFog className="w-3 h-3 text-slate-400 shrink-0" />;
      case 'snow':
        return <Snowflake className="w-3 h-3 text-blue-300 shrink-0" />;
      default:
        return <Thermometer className="w-3 h-3 text-amber-500 shrink-0" />;
    }
  };

  if (!weather && loading) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8.5px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse shrink-0">
        <Thermometer className="w-2.5 h-2.5 animate-spin" />
        <span>جاري التحميل...</span>
      </span>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div 
      className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8.5px] md:text-[9px] font-black bg-gradient-to-r from-amber-500/10 to-sky-500/10 text-slate-700 dark:text-slate-200 border border-amber-500/20 dark:border-amber-400/20 shadow-2xs shrink-0 cursor-help transition-all hover:scale-105"
      title={`حالة الطقس الآن: ${weather.description} | الحرارة: ${weather.temp}° مئوية${weather.humidity ? ` | الرطوبة: ${weather.humidity}%` : ''}`}
    >
      {renderIcon(weather.iconType)}
      <span className="font-mono dir-ltr">{weather.temp}°م</span>
      <span className="text-[8px] text-slate-500 dark:text-slate-400 hidden sm:inline">{weather.description}</span>
    </div>
  );
};
