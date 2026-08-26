/**
 * Qada System Ledger Data Model & Architecture
 */

import { PrayerName } from '../prayer/prayer.types';

export interface QadaRecord {
  id: string;
  originalDate: string; // YYYY-MM-DD
  prayer: PrayerName;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: number;
  completedAt?: number;
  source: 'missed' | 'manual' | 'import';
  notes?: string;
}

export class QadaLedger {
  private records: QadaRecord[] = [];

  constructor(initialRecords: QadaRecord[] = []) {
    this.records = [...initialRecords];
  }

  static createRecord(prayer: PrayerName, originalDate: string, source: 'missed' | 'manual' | 'import' = 'manual'): QadaRecord {
    return {
      id: `${originalDate}:${prayer}:${Date.now()}`,
      originalDate,
      prayer,
      status: 'pending',
      createdAt: Date.now(),
      source,
    };
  }

  addRecord(record: QadaRecord): void {
    this.records.push(record);
  }

  markCompleted(id: string): boolean {
    const target = this.records.find((r) => r.id === id);
    if (target) {
      target.status = 'completed';
      target.completedAt = Date.now();
      return true;
    }
    return false;
  }

  getPendingCount(prayer?: PrayerName): number {
    return this.records.filter((r) => r.status === 'pending' && (!prayer || r.prayer === prayer)).length;
  }

  getCompletedCount(prayer?: PrayerName): number {
    return this.records.filter((r) => r.status === 'completed' && (!prayer || r.prayer === prayer)).length;
  }

  getAllRecords(): QadaRecord[] {
    return [...this.records];
  }
}
