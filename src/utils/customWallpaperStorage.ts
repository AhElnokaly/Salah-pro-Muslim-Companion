/**
 * Custom Wallpaper Storage Engine for Hemmaty.
 * 
 * Stores user-uploaded wallpapers directly in IndexedDB without compression
 * to preserve 100% original visual fidelity.
 * 
 * Safe from localStorage quota limits (which fail on files > 4-5MB).
 * Maintains an in-memory cache for synchronous fast renders in components.
 */

export type WallpaperTimingSlot =
  | 'none'      // لا يوجد توقيت محدد (يدوي فقط)
  | 'day'       // فترة النهار (من الفجر للغروب)
  | 'night'     // فترة الليل (من المغرب للفجر)
  | 'fajr'      // وقت صلاة الفجر
  | 'sunrise'   // وقت الشروق والضحى
  | 'dhuhr'     // وقت صلاة الظهر
  | 'asr'       // وقت صلاة العصر
  | 'maghrib'   // وقت صلاة المغرب
  | 'isha'      // وقت صلاة العشاء والوتر
  | 'friday';   // يوم الجمعة

export interface CustomWallpaper {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: number;
  timingSlot?: WallpaperTimingSlot;
}

const DB_NAME = 'hemmaty_custom_wallpapers_db';
const DB_VERSION = 1;
const STORE_NAME = 'wallpapers';

// In-memory cache for zero-latency synchronous access
let wallpapersCache: CustomWallpaper[] = [];
let isInitialized = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('[CustomWallpaperStorage] Listener error:', e);
    }
  });
}

function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      resolve(null);
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = () => {
        console.warn('[CustomWallpaperStorage] Failed to open IndexedDB');
        resolve(null);
      };
    } catch (e) {
      console.warn('[CustomWallpaperStorage] Exception initializing DB:', e);
      resolve(null);
    }
  });
}

/**
 * Loads all custom wallpapers from IndexedDB into the in-memory cache.
 */
export async function loadCustomWallpapers(): Promise<CustomWallpaper[]> {
  const db = await openDB();
  if (!db) {
    isInitialized = true;
    return wallpapersCache;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = (req.result || []) as CustomWallpaper[];
        results.sort((a, b) => b.createdAt - a.createdAt);
        wallpapersCache = results;
        isInitialized = true;
        notifyListeners();
        resolve(wallpapersCache);
      };

      req.onerror = () => {
        isInitialized = true;
        resolve(wallpapersCache);
      };
    } catch (e) {
      console.warn('[CustomWallpaperStorage] Error reading wallpapers:', e);
      isInitialized = true;
      resolve(wallpapersCache);
    }
  });
}

/**
 * Reads a user file into a high-fidelity data URL without any compression.
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('فشل قراءة ملف الصورة'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('خطأ أثناء قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

/**
 * Saves a new custom wallpaper in IndexedDB and memory cache without compression.
 * Ensures that if a timing slot is chosen (e.g. 'fajr'), any previous wallpaper assigned to that slot is cleared.
 */
export async function saveCustomWallpaper(
  file: File,
  customName?: string,
  timingSlot: WallpaperTimingSlot = 'none'
): Promise<CustomWallpaper | null> {
  try {
    const dataUrl = await readFileAsDataURL(file);
    const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Auto name: e.g. صورة خاصة 1
    const currentCount = wallpapersCache.length + 1;
    const name = customName || `صورة خاصة ${currentCount}`;

    const newWallpaper: CustomWallpaper = {
      id,
      name,
      dataUrl,
      createdAt: Date.now(),
      timingSlot,
    };

    const db = await openDB();
    if (db) {
      await new Promise<boolean>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);

          // If timingSlot is set and not 'none', remove that slot from any existing wallpaper in DB to prevent conflicts!
          if (timingSlot && timingSlot !== 'none') {
            wallpapersCache.forEach((w) => {
              if (w.timingSlot === timingSlot && w.id !== id) {
                const updatedW = { ...w, timingSlot: 'none' as WallpaperTimingSlot };
                store.put(updatedW);
              }
            });
          }

          const req = store.put(newWallpaper);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      });
    }

    // Update in-memory cache immediately, clearing timingSlot from old items if reassigned
    let updatedList = wallpapersCache.map(w => {
      if (timingSlot && timingSlot !== 'none' && w.timingSlot === timingSlot && w.id !== id) {
        return { ...w, timingSlot: 'none' as WallpaperTimingSlot };
      }
      return w;
    });

    wallpapersCache = [newWallpaper, ...updatedList.filter(w => w.id !== id)];
    notifyListeners();
    return newWallpaper;
  } catch (err) {
    console.error('[CustomWallpaperStorage] Failed to save custom wallpaper:', err);
    return null;
  }
}

/**
 * Assigns or updates the timing slot of an existing custom wallpaper.
 * If slot !== 'none', clears any other wallpaper previously assigned to this exact slot.
 */
export async function assignTimingToWallpaper(id: string, slot: WallpaperTimingSlot): Promise<boolean> {
  const target = wallpapersCache.find(w => w.id === id);
  if (!target) return false;

  const db = await openDB();
  if (db) {
    await new Promise<boolean>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        // Clear slot from other wallpapers if slot !== 'none'
        if (slot && slot !== 'none') {
          wallpapersCache.forEach(w => {
            if (w.timingSlot === slot && w.id !== id) {
              store.put({ ...w, timingSlot: 'none' });
            }
          });
        }

        store.put({ ...target, timingSlot: slot });
        reqSuccess(tx, resolve);
      } catch {
        resolve(false);
      }
    });
  }

  // Update in-memory cache
  wallpapersCache = wallpapersCache.map(w => {
    if (w.id === id) {
      return { ...w, timingSlot: slot };
    }
    if (slot && slot !== 'none' && w.timingSlot === slot) {
      return { ...w, timingSlot: 'none' };
    }
    return w;
  });

  notifyListeners();
  return true;
}

function reqSuccess(tx: IDBTransaction, resolve: (val: boolean) => void) {
  tx.oncomplete = () => resolve(true);
  tx.onerror = () => resolve(false);
  tx.onabort = () => resolve(false);
}

/**
 * Updates a wallpaper's custom name.
 */
export async function renameCustomWallpaper(id: string, newName: string): Promise<boolean> {
  const target = wallpapersCache.find(w => w.id === id);
  if (!target || !newName.trim()) return false;

  const updated = { ...target, name: newName.trim() };
  const db = await openDB();
  if (db) {
    await new Promise<boolean>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(updated);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  wallpapersCache = wallpapersCache.map(w => w.id === id ? updated : w);
  notifyListeners();
  return true;
}

/**
 * Finds if there is a custom wallpaper assigned to a specific timing slot.
 */
export function getCustomWallpaperForTimingSlotSync(slot: WallpaperTimingSlot): CustomWallpaper | null {
  if (!slot || slot === 'none') return null;
  return wallpapersCache.find(w => w.timingSlot === slot) || null;
}

/**
 * Deletes a custom wallpaper by its ID.
 */
export async function deleteCustomWallpaper(id: string): Promise<boolean> {
  const db = await openDB();
  if (db) {
    await new Promise<boolean>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  wallpapersCache = wallpapersCache.filter(w => w.id !== id);
  notifyListeners();
  return true;
}

/**
 * Synchronously retrieves a custom wallpaper's image data URL by ID from the memory cache.
 */
export function getCustomWallpaperSync(id: string): string | null {
  const found = wallpapersCache.find(w => w.id === id);
  return found ? found.dataUrl : null;
}

/**
 * Synchronously gets all cached custom wallpapers.
 */
export function getAllCustomWallpapersSync(): CustomWallpaper[] {
  return wallpapersCache;
}

/**
 * React hook or listener to subscribe to changes in custom wallpapers.
 */
export function subscribeCustomWallpapers(callback: () => void): () => void {
  listeners.add(callback);
  if (!isInitialized) {
    loadCustomWallpapers();
  }
  return () => {
    listeners.delete(callback);
  };
}

// Auto-preload wallpapers on app load if in browser
if (typeof window !== 'undefined') {
  loadCustomWallpapers();
}
