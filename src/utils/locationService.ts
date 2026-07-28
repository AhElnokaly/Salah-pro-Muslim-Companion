/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { POPULAR_CITIES, CityData } from './prayerCalc';

export interface LocationResult {
  latitude: number;
  longitude: number;
  cityName: string;
  source: 'gps' | 'ip' | 'fallback';
  message?: string;
}

// Calculate distance between two coordinates in km (Haversine formula)
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find closest city in our city database
export function findClosestCity(lat: number, lng: number): CityData {
  let closest = POPULAR_CITIES[0];
  let minDistance = Infinity;

  for (const city of POPULAR_CITIES) {
    const dist = getDistanceKm(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }

  return closest;
}

// Attempt reverse geocoding to get human readable Arabic city name
export async function reverseGeocodeArabic(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`,
      { headers: { 'User-Agent': 'MuslimCompanionApp/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.state ||
        data.address?.governorate ||
        data.address?.country;
      if (city) return city;
    }
  } catch (e) {
    console.warn('Reverse geocoding failed:', e);
  }

  // Fallback to nearest city in POPULAR_CITIES
  const closest = findClosestCity(lat, lng);
  return closest.arabicName;
}

// IP-based Geolocation Fallback
async function getLocationFromIP(): Promise<{ lat: number; lng: number; city: string } | null> {
  // Provider 1: ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        return {
          lat: data.latitude,
          lng: data.longitude,
          city: data.city || data.region || 'موقعي'
        };
      }
    }
  } catch (e) {
    console.warn('IP location provider 1 failed:', e);
  }

  // Provider 2: wttr.in
  try {
    const res = await fetch('https://wttr.in/?format=j1', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const area = data.nearest_area?.[0];
      if (area) {
        const lat = parseFloat(area.latitude);
        const lng = parseFloat(area.longitude);
        const city = area.areaName?.[0]?.value || 'موقعي';
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng, city };
        }
      }
    }
  } catch (e) {
    console.warn('IP location provider 2 failed:', e);
  }

  return null;
}

/**
 * Smart hybrid location detector:
 * 1. Tries Browser GPS (navigator.geolocation) with low-accuracy & timeout.
 * 2. If GPS fails or is denied or times out, falls back to IP Geolocation.
 * 3. Resolves city name in Arabic.
 */
export async function detectUserLocation(): Promise<LocationResult> {
  // Try GPS first with high accuracy
  if (navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const cityName = await reverseGeocodeArabic(lat, lng);

      return {
        latitude: lat,
        longitude: lng,
        cityName: cityName,
        source: 'gps',
        message: 'تم تحديد موقعك بدقة عالية عبر الـ GPS 📍'
      };
    } catch (gpsError: any) {
      console.warn('High accuracy GPS failed or denied, trying standard location:', gpsError);
      // Retry with standard accuracy before falling back to IP
      try {
        const posCoarse = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000
          });
        });

        const lat = posCoarse.coords.latitude;
        const lng = posCoarse.coords.longitude;
        const cityName = await reverseGeocodeArabic(lat, lng);

        return {
          latitude: lat,
          longitude: lng,
          cityName: cityName,
          source: 'gps',
          message: 'تم تحديد موقعك عبر خدمة الموقع 📍'
        };
      } catch (err) {
        console.warn('Standard GPS location failed, falling back to IP:', err);
      }
    }
  }

  // Fallback to IP Geolocation
  const ipLoc = await getLocationFromIP();
  if (ipLoc) {
    const closest = findClosestCity(ipLoc.lat, ipLoc.lng);
    const arabicCity = await reverseGeocodeArabic(ipLoc.lat, ipLoc.lng);

    return {
      latitude: ipLoc.lat,
      longitude: ipLoc.lng,
      cityName: arabicCity || closest.arabicName,
      source: 'ip',
      message: 'تم تحديد موقعك التلقائي عبر عنوان الشبكة (IP) بنجاح 🌐'
    };
  }

  // Final fallback to Cairo if everything fails
  return {
    latitude: 30.0444,
    longitude: 31.2357,
    cityName: 'القاهرة',
    source: 'fallback',
    message: 'تعذر التحديد التلقائي. تم تعيين الموقع الافتراضي (القاهرة).'
  };
}
