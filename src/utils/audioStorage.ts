const DB_NAME = 'salah_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_tracks';

export interface AudioTrack {
  id: string;
  name: string;
  url: string; // E.g., '/audio/azanXX.mp3' or virtual 'db://[id]'
  isFajr: boolean;
  isCustom?: boolean;
  fileName?: string;
}

export interface DbTrackRecord {
  id: string;
  name: string;
  fileName: string;
  blob?: Blob; // Made optional to support custom URLs
  url?: string; // Storing web URL if no local file is uploaded
  isFajr: boolean;
  dateAdded: number;
}

// Default muezzin tracks hosted locally in public/audio/
import { archiveMuezzins } from './archiveMuezzins';
export { archiveMuezzins };

export const defaultMuezzins: AudioTrack[] = [
  { id: 'fajr_yusuf', name: 'أذان الفجر - يوسف إسلام (بالتحية والتثويب)', url: '/audio/azan20.mp3', isFajr: true },
  { id: 'fajr_makkah', name: 'أذان الفجر - الحرم المكي الشريف (الشيخ علي ملا)', url: '/audio/azan8.mp3', isFajr: true },
  { id: 'fajr_medina', name: 'أذان الفجر - المسجد النبوي الشريف (الشيخ عصام بخاري)', url: '/audio/azan22.mp3', isFajr: true },
  { id: 'fajr_aqsa', name: 'أذان الفجر - المسجد الأقصى المبارك', url: '/audio/azan1.mp3', isFajr: true },
  { id: 'makkah', name: 'أذان الحرم المكي الشريف (الشيخ علي ملا)', url: '/audio/azan2.mp3', isFajr: false },
  { id: 'medina', name: 'أذان المسجد النبوي الشريف', url: '/audio/azan3.mp3', isFajr: false },
  { id: 'yusuf_islam', name: 'أذان يوسف إسلام (برواية حفص)', url: '/audio/azan4.mp3', isFajr: false },
  { id: 'aqsa', name: 'أذان المسجد الأقصى المبارك', url: '/audio/azan1.mp3', isFajr: false },
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
        const tracks: AudioTrack[] = records.map((r) => ({
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

/**
 * Resolves an audio URL to a playable source string.
 * For local files (like /audio/azan1.mp3) or direct web URLs it returns as is.
 * For custom DB references (db://custom_xxx) it retrieves the Blob from IndexedDB and returns an Object URL.
 */
export async function getAudioUrl(url: string): Promise<string> {
  if (!url) return '';
  if (!url.startsWith('db://')) {
    if (url.startsWith('/')) {
      return new URL(url, window.location.origin).href;
    }
    return url;
  }

  const id = url.replace('db://', '');
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
