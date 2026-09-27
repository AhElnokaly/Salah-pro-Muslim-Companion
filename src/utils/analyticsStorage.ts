/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeSetItem, safeGetItem, safeGetJSON } from './storage';
import { FeatureDefinition, FEATURES_LIST } from '../data/featuresList';
import { BadgeTierInfo, BADGE_TIERS_MAP, getBadgeTierForRate } from '../data/badgeTiers';

// Re-export data definitions & tiers for backward compatibility
export { FEATURES_LIST, BADGE_TIERS_MAP, getBadgeTierForRate };
export type { FeatureDefinition, BadgeTierInfo };

export interface FeatureMetricRecord {
  usageLogs: Record<string, number>; // date "YYYY-MM-DD" -> count
  completionLogs: Record<string, number>; // date "YYYY-MM-DD" -> count
  totalUsage: number;
  totalCompletion: number;
  lastUsedAt?: string;
  lastCompletedAt?: string;
}

export type AnalyticsDataMap = Record<string, FeatureMetricRecord>;

const LOCAL_STORAGE_KEY = 'rafiq_feature_analytics_v1';
const EXCUSE_STORAGE_KEY = 'rafiq_women_excuse_active_v1';

// Helper to get formatted date string "YYYY-MM-DD"
export function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get dates within last N days
export function getDatesInRange(daysBack: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(getTodayDateString(d));
  }
  return dates;
}

// Get all data from local storage with initial seed if empty
export function loadAnalyticsData(): AnalyticsDataMap {
  const raw = safeGetJSON<AnalyticsDataMap | null>(LOCAL_STORAGE_KEY, null);
  if (raw) {
    return raw;
  }

  // Generate clean initial structure with realistic initial baseline demo data for previewing
  const initialData: AnalyticsDataMap = {};
  const todayStr = getTodayDateString();
  const yesterdayStr = getTodayDateString(new Date(Date.now() - 86400000));
  const twoDaysAgoStr = getTodayDateString(new Date(Date.now() - 2 * 86400000));

  FEATURES_LIST.forEach((feat) => {
    let baseUsage = 1;
    let baseCompletion = 0;

    // Give a few baseline counts so the table looks rich and informative immediately
    let daysAgo = 0;
    if (feat.id === 'home') {
      baseUsage = 12;
      baseCompletion = 5;
      daysAgo = 0;
    } else if (feat.id === 'adhkar') {
      baseUsage = 8;
      baseCompletion = 6;
      daysAgo = 1;
    } else if (feat.id === 'salah') {
      baseUsage = 9;
      baseCompletion = 7;
      daysAgo = 0;
    } else if (feat.id === 'quran') {
      baseUsage = 2;
      baseCompletion = 1;
      daysAgo = 3;
    } else if (feat.id === 'khushu') {
      baseUsage = 1;
      baseCompletion = 0;
      daysAgo = 14;
    } else if (feat.id === 'fasting') {
      baseUsage = 1;
      baseCompletion = 0;
      daysAgo = 32;
    } else if (feat.id === 'qibla') {
      baseUsage = 1;
      baseCompletion = 0;
      daysAgo = 5;
    } else if (feat.id === 'widgets') {
      baseUsage = 1;
      baseCompletion = 0;
      daysAgo = 21;
    } else {
      baseUsage = 1;
      baseCompletion = 0;
      daysAgo = 8;
    }

    const lastUsedDate = new Date(Date.now() - daysAgo * 86400000).toISOString();

    initialData[feat.id] = {
      usageLogs: {
        [todayStr]: Math.max(0, Math.floor(baseUsage / 2)),
        [yesterdayStr]: Math.max(0, Math.floor(baseUsage / 3)),
        [twoDaysAgoStr]: Math.max(0, Math.floor(baseUsage / 3)),
      },
      completionLogs: {
        [todayStr]: Math.max(0, Math.floor(baseCompletion / 2)),
        [yesterdayStr]: Math.max(0, Math.floor(baseCompletion / 3)),
        [twoDaysAgoStr]: Math.max(0, Math.floor(baseCompletion / 3)),
      },
      totalUsage: baseUsage,
      totalCompletion: baseCompletion,
      lastUsedAt: lastUsedDate,
      lastCompletedAt: baseCompletion > 0 ? lastUsedDate : undefined,
    };
  });

  saveAnalyticsData(initialData);
  return initialData;
}

export function saveAnalyticsData(data: AnalyticsDataMap) {
  safeSetItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

// Track +1 feature usage
export function trackFeatureUsage(featureId: string) {
  if (!featureId) return;
  const data = loadAnalyticsData();
  const today = getTodayDateString();

  if (!data[featureId]) {
    data[featureId] = {
      usageLogs: {},
      completionLogs: {},
      totalUsage: 0,
      totalCompletion: 0,
    };
  }

  const record = data[featureId];
  record.usageLogs[today] = (record.usageLogs[today] || 0) + 1;
  record.totalUsage = (record.totalUsage || 0) + 1;
  record.lastUsedAt = new Date().toISOString();

  saveAnalyticsData(data);
  window.dispatchEvent(new CustomEvent('analytics-updated'));
}

// Track +1 100% completion event
export function trackFeatureCompletion(featureId: string) {
  if (!featureId) return;
  const data = loadAnalyticsData();
  const today = getTodayDateString();

  if (!data[featureId]) {
    data[featureId] = {
      usageLogs: {},
      completionLogs: {},
      totalUsage: 0,
      totalCompletion: 0,
    };
  }

  const record = data[featureId];
  record.completionLogs[today] = (record.completionLogs[today] || 0) + 1;
  record.totalCompletion = (record.totalCompletion || 0) + 1;
  record.lastCompletedAt = new Date().toISOString();

  // Also count as usage if completion happened
  if (!record.usageLogs[today]) {
    record.usageLogs[today] = 1;
    record.totalUsage = (record.totalUsage || 0) + 1;
  }

  saveAnalyticsData(data);
  window.dispatchEvent(new CustomEvent('analytics-updated'));
}

export function getWomenExcuseMode(): boolean {
  return safeGetItem(EXCUSE_STORAGE_KEY) === 'true';
}

export function setWomenExcuseMode(active: boolean): void {
  safeSetItem(EXCUSE_STORAGE_KEY, active ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('analytics-updated'));
}
