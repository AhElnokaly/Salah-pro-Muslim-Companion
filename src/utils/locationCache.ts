/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeGetJSON, safeSetJSON } from './storage';

export interface CachedScheduleDay {
  dateStr: string;
  timesMap: Record<string, string>;
}

export interface LocationScheduleCache {
  lat: number;
  lng: number;
  calcMethod: string;
  madhab: string;
  prayerOffsets: Record<string, number>;
  cityName?: string;
  timestamp: number;
  schedule: CachedScheduleDay[];
}

const STORAGE_KEY = 'mc_location_prayer_schedules_cache_v1';
const LAST_LOCATION_KEY = 'mc_last_cached_location_schedule_v1';

// Maximum distance in kilometers to consider "same location" (25km)
const MAX_CACHE_DISTANCE_KM = 25;

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestLocationCache(
  lat: number,
  lng: number,
  calcMethod: string,
  madhab: string,
  prayerOffsets: Record<string, number> = {}
): LocationScheduleCache | null {
  const list = safeGetJSON<LocationScheduleCache[]>(STORAGE_KEY, []);
  if (!list.length) return null;

  for (const entry of list) {
    if (entry.calcMethod !== calcMethod || entry.madhab !== madhab) continue;

    // Check offsets match
    const offsetsMatch = Object.keys(prayerOffsets).every(
      (k) => (prayerOffsets[k] || 0) === (entry.prayerOffsets?.[k] || 0)
    );
    if (!offsetsMatch) continue;

    const dist = calculateDistanceKm(lat, lng, entry.lat, entry.lng);
    if (dist <= MAX_CACHE_DISTANCE_KM) {
      return entry;
    }
  }

  return null;
}

export function saveLocationSchedule(
  lat: number,
  lng: number,
  calcMethod: string,
  madhab: string,
  prayerOffsets: Record<string, number>,
  scheduleList: Array<{ date: Date; timesMap: Record<string, string> }>,
  cityName?: string
): void {
  const schedule: CachedScheduleDay[] = scheduleList.map((item) => ({
    dateStr: item.date instanceof Date ? item.date.toISOString() : String(item.date),
    timesMap: item.timesMap,
  }));

  const cacheEntry: LocationScheduleCache = {
    lat,
    lng,
    calcMethod,
    madhab,
    prayerOffsets: prayerOffsets || {},
    cityName,
    timestamp: Date.now(),
    schedule,
  };

  const list = safeGetJSON<LocationScheduleCache[]>(STORAGE_KEY, []);
  const filtered = list.filter((e) => calculateDistanceKm(lat, lng, e.lat, e.lng) > MAX_CACHE_DISTANCE_KM);
  filtered.unshift(cacheEntry);
  // Keep up to 5 locations
  safeSetJSON(STORAGE_KEY, filtered.slice(0, 5));
  safeSetJSON(LAST_LOCATION_KEY, cacheEntry);
}

export function getLastCachedLocationSchedule(): LocationScheduleCache | null {
  return safeGetJSON<LocationScheduleCache | null>(LAST_LOCATION_KEY, null);
}
