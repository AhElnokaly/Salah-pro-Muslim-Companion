import { safeSetItem } from './storage';

const CACHE_KEY = 'salah_location_prayer_cache_v2';
const MAX_LOCATION_ENTRIES = 3; // Store up to 3 most recent locations (LRU)
export const SUBSTANTIAL_DISTANCE_THRESHOLD_KM = 25; // 25km threshold

export interface DailyScheduleEntry {
  dateStr: string; // 'YYYY-MM-DD'
  timesMap: Record<string, string>;
}

export interface CachedLocationSchedule {
  id: string;
  lat: number;
  lng: number;
  cityName?: string;
  calcMethod: string;
  madhab: string;
  prayerOffsetsKey: string;
  timestamp: number; // For LRU sorting
  schedule: DailyScheduleEntry[];
}

interface CacheStore {
  locations: CachedLocationSchedule[];
}

/**
 * Calculates Haversine distance between two sets of coordinates in kilometers.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
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

/**
 * Checks if distance between two coordinates exceeds the 25km substantial change threshold.
 */
export function isSubstantialLocationChange(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): boolean {
  return haversineDistance(lat1, lon1, lat2, lon2) > SUBSTANTIAL_DISTANCE_THRESHOLD_KM;
}

function getOffsetsKey(offsets: Record<string, number>): string {
  return Object.entries(offsets || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
}

function loadCacheStore(): CacheStore {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { locations: [] };
    const parsed = JSON.parse(raw);
    return { locations: Array.isArray(parsed.locations) ? parsed.locations : [] };
  } catch (err) {
    console.warn('[LocationCache] Error loading cache store:', err);
    return { locations: [] };
  }
}

function saveCacheStore(store: CacheStore): void {
  try {
    // Sort locations by timestamp descending (most recent first) and keep top 3 (LRU)
    const sorted = [...store.locations]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_LOCATION_ENTRIES);

    safeSetItem(CACHE_KEY, JSON.stringify({ locations: sorted }));
  } catch (err) {
    console.warn('[LocationCache] Error saving cache store:', err);
  }
}

/**
 * Finds a cached location schedule within 25km of the given lat/lng that matches calcMethod, madhab, and offsets.
 */
export function findNearestLocationCache(
  lat: number,
  lng: number,
  calcMethod: string,
  madhab: string,
  prayerOffsets: Record<string, number>
): CachedLocationSchedule | null {
  if (typeof window === 'undefined' || !lat || !lng) return null;

  const offsetsKey = getOffsetsKey(prayerOffsets);
  const store = loadCacheStore();

  for (const loc of store.locations) {
    const dist = haversineDistance(lat, lng, loc.lat, loc.lng);
    if (
      dist <= SUBSTANTIAL_DISTANCE_THRESHOLD_KM &&
      loc.calcMethod === calcMethod &&
      loc.madhab === madhab &&
      loc.prayerOffsetsKey === offsetsKey
    ) {
      // Touch timestamp for LRU
      loc.timestamp = Date.now();
      saveCacheStore(store);
      return loc;
    }
  }

  return null;
}

/**
 * Saves or updates a 30-day location schedule in the cache (persisting max 3 locations with LRU eviction).
 */
export function saveLocationSchedule(
  lat: number,
  lng: number,
  calcMethod: string,
  madhab: string,
  prayerOffsets: Record<string, number>,
  daysList: Array<{ date: Date; timesMap: Record<string, string> }>,
  cityName?: string
): CachedLocationSchedule {
  const store = loadCacheStore();
  const offsetsKey = getOffsetsKey(prayerOffsets);

  const existingIndex = store.locations.findIndex(loc => {
    const dist = haversineDistance(lat, lng, loc.lat, loc.lng);
    return (
      dist <= SUBSTANTIAL_DISTANCE_THRESHOLD_KM &&
      loc.calcMethod === calcMethod &&
      loc.madhab === madhab &&
      loc.prayerOffsetsKey === offsetsKey
    );
  });

  const formattedSchedule: DailyScheduleEntry[] = daysList.map(entry => ({
    dateStr: entry.date.toISOString().split('T')[0],
    timesMap: entry.timesMap,
  }));

  const updatedEntry: CachedLocationSchedule = {
    id: `${lat.toFixed(2)}_${lng.toFixed(2)}_${calcMethod}_${madhab}`,
    lat,
    lng,
    cityName,
    calcMethod,
    madhab,
    prayerOffsetsKey: offsetsKey,
    timestamp: Date.now(),
    schedule: formattedSchedule,
  };

  if (existingIndex >= 0) {
    store.locations[existingIndex] = updatedEntry;
  } else {
    store.locations.push(updatedEntry);
  }

  saveCacheStore(store);
  return updatedEntry;
}

/**
 * Fallback to the last used cached location schedule if location fetching or computation fails.
 */
export function getLastCachedLocationSchedule(): CachedLocationSchedule | null {
  if (typeof window === 'undefined') return null;
  const store = loadCacheStore();
  if (store.locations.length === 0) return null;
  // Return the most recently accessed location
  return [...store.locations].sort((a, b) => b.timestamp - a.timestamp)[0];
}
