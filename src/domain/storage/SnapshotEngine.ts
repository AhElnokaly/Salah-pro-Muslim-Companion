/**
 * Local Disaster Recovery Snapshot Engine
 * Maintains up to 3 automatic rolling local snapshots of app data for easy restore if corrupted.
 */

import { idbGetItem, idbSetItem } from '../../utils/indexedDBStorage';

export interface LocalSnapshot {
  id: string;
  createdAt: string;
  version: string;
  backupVersion: number;
  data: Record<string, unknown>;
}

const SNAPSHOT_KEY = 'hemmaty_local_snapshots';
const MAX_SNAPSHOTS = 3;

export class SnapshotEngine {
  /**
   * Create an automatic snapshot of key data
   */
  static async createSnapshot(settings: unknown, logs: unknown, qada: unknown): Promise<boolean> {
    try {
      const existing = await idbGetItem<LocalSnapshot[]>(SNAPSHOT_KEY, []);
      const newSnapshot: LocalSnapshot = {
        id: `snap_${Date.now()}`,
        createdAt: new Date().toISOString(),
        version: '2.5',
        backupVersion: 1,
        data: {
          settings,
          logs,
          qada,
        },
      };

      const updated = [newSnapshot, ...existing].slice(0, MAX_SNAPSHOTS);
      await idbSetItem(SNAPSHOT_KEY, updated);
      return true;
    } catch (err) {
      console.warn('[SnapshotEngine] Error creating local snapshot:', err);
      return false;
    }
  }

  /**
   * Retrieve all saved local snapshots
   */
  static async getSnapshots(): Promise<LocalSnapshot[]> {
    return idbGetItem<LocalSnapshot[]>(SNAPSHOT_KEY, []);
  }

  /**
   * Restore state from a specific local snapshot
   */
  static async restoreSnapshot(snapshotId: string): Promise<LocalSnapshot | null> {
    const snapshots = await this.getSnapshots();
    const target = snapshots.find((s) => s.id === snapshotId);
    return target || null;
  }
}
