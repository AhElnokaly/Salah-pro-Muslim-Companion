/**
 * Deterministic Alarm Identifier Generator
 * Converts date + prayer key into a stable Int32 ID for Android AlarmManager & Notification scheduling.
 */

export class AlarmIdentifier {
  /**
   * Creates a unique, deterministic 32-bit integer ID for a specific date & prayer
   * @example generateId('2026-08-26', 'Fajr') => 1847392
   */
  static generateId(dateStr: string, prayerKey: string): number {
    const combined = `${dateStr}:${prayerKey.toLowerCase()}`;
    return Math.abs(this.fnv1aHash(combined));
  }

  private static fnv1aHash(str: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0;
  }
}
