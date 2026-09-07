import React from 'react';
import { AppSettings } from '../types';
import { detectUserLocation, LocationResult } from '../utils/locationService';

interface LocationToast {
  msg: string;
  type: 'success' | 'error' | 'info';
}

interface UseLocationSyncProps {
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setIsLocating: (isLocating: boolean) => void;
  setLocationToast: (toast: LocationToast | null) => void;
}

export function useLocationSync({
  setSettings,
  setIsLocating,
  setLocationToast,
}: UseLocationSyncProps) {
  const handleGPSLocationSync = async () => {
    setIsLocating(true);
    setLocationToast(null);
    try {
      const res: LocationResult = await detectUserLocation();
      setSettings(prev => ({
        ...prev,
        latitude: res.latitude,
        longitude: res.longitude,
        cityName: res.cityName
      }));
      setLocationToast({
        msg: `${res.message} — 📍 المدينة المحددة: ${res.cityName} (${res.latitude.toFixed(2)}°, ${res.longitude.toFixed(2)}°)`,
        type: 'success'
      });
      setTimeout(() => setLocationToast(null), 5000);
    } catch (e) {
      console.error(e);
      setLocationToast({
        msg: 'حدث خطأ أثناء تحديد الموقع. يرجى اختيار مدينتك يدوياً من قائمة المدن.',
        type: 'error'
      });
      setTimeout(() => setLocationToast(null), 5000);
    } finally {
      setIsLocating(false);
    }
  };

  return {
    handleGPSLocationSync,
  };
}
