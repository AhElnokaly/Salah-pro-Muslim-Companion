/**
 * Deterministic Alarm Identifier Generator
 * Converts date + prayer key into a stable Int32 ID for Android AlarmManager & Notification scheduling.
 */

export class AlarmIdentifier {
  private static javaStringHashCode(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (Math.imul(31, hash) + s.charCodeAt(i)) | 0;
    }
    return hash;
  }

  static generateId(prayerKey: string, timeMs: number): number {
    const minuteBucket = Math.floor(timeMs / 60000);
    const identifier = `${prayerKey}_${minuteBucket}`;
    const hash = this.javaStringHashCode(identifier);
    return ((hash & 0x7FFFFFFF) % 10000000) + 1000;
  }
}

