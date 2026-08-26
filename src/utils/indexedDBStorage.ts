/**
 * IndexedDB storage engine for Hemmaty heavy data logs.
 * Provides async fallback to localStorage via safeGetJSON/safeSetJSON.
 */
import { safeGetJSON, safeSetJSON } from './storage';

const DB_NAME = 'hemmaty_idb_store';
const DB_VERSION = 1;
const STORE_NAME = 'app_key_value_store';

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
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = () => {
        console.warn('[IndexedDB] Failed to open IndexedDB, falling back to localStorage');
        resolve(null);
      };
    } catch (e) {
      console.warn('[IndexedDB] Error initializing IndexedDB:', e);
      resolve(null);
    }
  });
}

export async function idbGetItem<T>(key: string, fallback: T): Promise<T> {
  const db = await openDB();
  if (!db) {
    return safeGetJSON<T>(key, fallback);
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result !== undefined) {
          resolve(req.result as T);
        } else {
          // Fallback to localStorage if not found in IDB yet
          const localVal = safeGetJSON<T>(key, fallback);
          resolve(localVal);
        }
      };

      req.onerror = () => {
        resolve(safeGetJSON<T>(key, fallback));
      };
    } catch {
      resolve(safeGetJSON<T>(key, fallback));
    }
  });
}

export async function idbSetItem<T>(key: string, value: T): Promise<boolean> {
  // Always update localStorage as immediate fallback
  safeSetJSON(key, value);

  const db = await openDB();
  if (!db) {
    return true;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}
