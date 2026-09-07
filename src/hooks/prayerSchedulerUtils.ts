import { safeRemoveItem } from '../utils/storage';

export const getLocalDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function cleanupOldTrackingKeys(): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    const nowMs = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const prefixes = ['salah_played_', 'salah_triggered_', 'alert_before_', 'alert_after_', 'alert_duha_'];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const matchedPrefix = prefixes.find(p => key.startsWith(p));
      if (!matchedPrefix) continue;

      const match = key.match(/\b\d{4}-\d{2}-\d{2}\b/);
      if (match) {
        const dateStr = match[0];
        const keyDate = new Date(dateStr);
        if (!isNaN(keyDate.getTime())) {
          if (nowMs - keyDate.getTime() > sevenDaysMs) {
            safeRemoveItem(key);
          }
        }
      }
    }
  } catch (e) {
    console.error('Error cleaning up old tracking keys:', e);
  }
}
