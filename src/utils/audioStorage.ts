const DB_NAME = 'salah_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_tracks';

export interface AudioTrack {
  id: string;
  name: string;
  url: string; // Online HTTPS MP3 URL or virtual 'db://[id]'
  isFajr: boolean;
  isCustom?: boolean;
  fileName?: string;
}

export interface DbTrackRecord {
  id: string;
  name: string;
  fileName: string;
  blob?: Blob;
  url?: string;
  isFajr: boolean;
  dateAdded: number;
}

import { archiveMuezzins } from './archiveMuezzins';
export { archiveMuezzins };

// Default muezzin tracks using high-reliability online HTTPS URLs
export const defaultMuezzins: AudioTrack[] = [
  { id: 'fajr_yusuf', name: 'أذان الفجر - الشيخ يوسف إسلام', url: 'https://archive.org/download/LifeOfTheLastProphet-ByYusufIslam/01%20-%20Call%20To%20Prayer%20%28Adhan%29.mp3', isFajr: true },
  { id: 'fajr_makkah', name: 'أذان الفجر - الحرم المكي الشريف', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/033--.mp3', isFajr: true },
  { id: 'fajr_medina', name: 'أذان الفجر - المسجد النبوي الشريف', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/034--.mp3', isFajr: true },
  { id: 'fajr_aqsa', name: 'أذان الفجر - المسجد الأقصى المبارك', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/069--.mp3', isFajr: true },
  { id: 'makkah', name: 'أذان الحرم المكي الشريف', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/016---2.mp3', isFajr: false },
  { id: 'medina', name: 'أذان المسجد النبوي الشريف', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3', isFajr: false },
  { id: 'yusuf_islam', name: 'الشيخ يوسف إسلام', url: 'https://archive.org/download/LifeOfTheLastProphet-ByYusufIslam/01%20-%20Call%20To%20Prayer%20%28Adhan%29.mp3', isFajr: false },
  { id: 'aqsa', name: 'المسجد الأقصى المبارك', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/007--.mp3', isFajr: false },
];

/**
 * Initializes the IndexedDB database for local audio storage.
 */
export function initAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Downloads an online audio URL and permanently stores its Blob into IndexedDB.
 */
export async function downloadAndSaveAudio(track: AudioTrack): Promise<string> {
  const dbKey = `downloaded_${track.id}`;
  const response = await fetch(track.url);
  if (!response.ok) {
    throw new Error(`تعذر تحميل الأذان (رمز الخطأ: ${response.status})`);
  }

  const blob = await response.blob();
  const db = await initAudioDB();
  const record: DbTrackRecord = {
    id: dbKey,
    name: `${track.name} (مُحمَّل أوفلاين)`,
    fileName: `${track.id}.mp3`,
    blob: blob,
    url: track.url,
    isFajr: track.isFajr,
    dateAdded: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);
    request.onsuccess = () => resolve(`db://${dbKey}`);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Checks if a track is stored offline in IndexedDB.
 */
export async function isAudioDownloaded(trackId: string): Promise<boolean> {
  try {
    const db = await initAudioDB();
    const dbKey = `downloaded_${trackId}`;
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(dbKey);
      request.onsuccess = () => resolve(!!(request.result && request.result.blob));
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Deletes a downloaded audio track from IndexedDB.
 */
export async function deleteDownloadedAudio(trackId: string): Promise<void> {
  const db = await initAudioDB();
  const dbKey = `downloaded_${trackId}`;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(dbKey);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves all downloaded track IDs from IndexedDB.
 */
export async function getDownloadedTrackIds(): Promise<Set<string>> {
  try {
    const db = await initAudioDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onsuccess = () => {
        const keys = (request.result || []) as string[];
        const downloadedIds = new Set<string>();
        keys.forEach((k) => {
          if (typeof k === 'string' && k.startsWith('downloaded_')) {
            downloadedIds.add(k.replace('downloaded_', ''));
          }
        });
        resolve(downloadedIds);
      };
      request.onerror = () => resolve(new Set());
    });
  } catch {
    return new Set();
  }
}

/**
 * Saves a custom uploaded audio file (Blob) or direct web URL directly to IndexedDB.
 */
export async function saveCustomAudio(
  name: string,
  fileName: string,
  blob: Blob | null,
  url: string | null,
  isFajr: boolean
): Promise<AudioTrack> {
  const db = await initAudioDB();
  const id = `custom_${Date.now()}`;
  const record: DbTrackRecord = {
    id,
    name,
    fileName,
    isFajr,
    dateAdded: Date.now(),
  };

  if (blob) {
    record.blob = blob;
  }
  if (url) {
    record.url = url;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => {
      resolve({
        id,
        name: `${name} (مخصص)`,
        url: blob ? `db://${id}` : (url || ''),
        isFajr,
        isCustom: true,
        fileName,
      });
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves all custom tracks stored in IndexedDB.
 */
export async function getCustomAudios(): Promise<AudioTrack[]> {
  try {
    const db = await initAudioDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records: DbTrackRecord[] = request.result || [];
        const customRecords = records.filter(r => !r.id.startsWith('downloaded_'));
        const tracks: AudioTrack[] = customRecords.map((r) => ({
          id: r.id,
          name: `${r.name} (مخصص)`,
          url: r.blob ? `db://${r.id}` : (r.url || ''),
          isFajr: r.isFajr,
          isCustom: true,
          fileName: r.fileName,
        }));
        resolve(tracks);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting custom audios from IndexedDB:', error);
    return [];
  }
}

/**
 * Deletes a custom audio track from IndexedDB.
 */
export async function deleteCustomAudio(id: string): Promise<void> {
  const db = await initAudioDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function getAudioUrlSync(url: string): string {
  if (!url) return '';
  if (!url.startsWith('db://')) {
    return url;
  }
  return '';
}

/**
 * Resolves an audio URL to a playable source string.
 * Checks IndexedDB first if trackId is provided or if url is a db:// link.
 */
/**
 * Resolves an audio URL to a playable source string.
 * Checks IndexedDB first if trackId is provided or if url is a db:// link.
 * If online and not yet stored, silently caches the track in IndexedDB for offline use!
 * If offline and track is missing, falls back to any available offline track in IndexedDB.
 */
export async function getAudioUrl(url: string, trackId?: string, isFajr = false): Promise<string> {
  if (url && url.startsWith('db://')) {
    const id = url.replace('db://', '');
    try {
      const blobUrl = await getBlobUrlFromDb(id);
      if (blobUrl) return blobUrl;
    } catch {
      // Fall through if blob missing
    }
  }

  if (trackId) {
    const dbKey = `downloaded_${trackId}`;
    try {
      const blobUrl = await getBlobUrlFromDb(dbKey);
      if (blobUrl) {
        return blobUrl;
      }
    } catch {
      // Not stored in IndexedDB yet
    }

    // Auto-cache silently if online
    if (url && url.startsWith('http') && typeof window !== 'undefined' && navigator.onLine) {
      silentlyCacheAudio(trackId, url, isFajr).catch(() => {});
    }
  }

  // Check if browser is offline and URL is an external web link
  if (typeof window !== 'undefined' && !navigator.onLine && url && url.startsWith('http')) {
    // Attempt fallback to any locally stored offline track in IndexedDB
    try {
      const fallbackBlobUrl = await getAnyOfflineTrackBlob(isFajr);
      if (fallbackBlobUrl) {
        console.warn('Network offline: falling back to cached offline audio track');
        return fallbackBlobUrl;
      }
    } catch (err) {
      console.error('Failed to get offline fallback audio track:', err);
    }
  }

  return url;
}

/**
 * Background auto-caching when playing an audio track while online.
 */
async function silentlyCacheAudio(trackId: string, url: string, isFajr: boolean) {
  try {
    const response = await fetch(url);
    if (!response.ok) return;
    const blob = await response.blob();
    const db = await initAudioDB();
    const dbKey = `downloaded_${trackId}`;
    const record: DbTrackRecord = {
      id: dbKey,
      name: `أذان (مخزن تلقائياً أوفلاين)`,
      fileName: `${trackId}.mp3`,
      blob,
      url,
      isFajr,
      dateAdded: Date.now(),
    };
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(record);
  } catch (e) {
    // Silent fail if network fails during background caching
  }
}

/**
 * Retrieves a blob URL for any available offline track in IndexedDB for emergency offline playback.
 */
async function getAnyOfflineTrackBlob(isFajr = false): Promise<string | null> {
  try {
    const db = await initAudioDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const records: DbTrackRecord[] = request.result || [];
        const valid = records.filter(r => r.blob);
        if (valid.length === 0) return resolve(null);

        // Try matching Fajr preference first
        const matchFajr = valid.find(r => r.isFajr === isFajr);
        const chosen = matchFajr || valid[0];
        if (chosen && chosen.blob) {
          resolve(URL.createObjectURL(chosen.blob));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Calculates total storage used (in MB) and count of downloaded tracks.
 */
export async function getAudioStorageStats(): Promise<{ count: number; totalMB: string }> {
  try {
    const db = await initAudioDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const records: DbTrackRecord[] = request.result || [];
        let totalBytes = 0;
        let count = 0;
        records.forEach(r => {
          if (r.blob) {
            totalBytes += r.blob.size;
            count++;
          }
        });
        const mb = (totalBytes / (1024 * 1024)).toFixed(1);
        resolve({ count, totalMB: mb });
      };
      request.onerror = () => resolve({ count: 0, totalMB: '0.0' });
    });
  } catch {
    return { count: 0, totalMB: '0.0' };
  }
}

async function getBlobUrlFromDb(id: string): Promise<string> {
  const db = await initAudioDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const record = request.result as DbTrackRecord | undefined;
      if (record && record.blob) {
        const objectUrl = URL.createObjectURL(record.blob);
        resolve(objectUrl);
      } else {
        reject(new Error(`Audio blob not found for ID: ${id}`));
      }
    };
    request.onerror = () => reject(request.error);
  });
}
