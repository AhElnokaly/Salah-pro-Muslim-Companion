/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeGetJSON, safeSetJSON } from './storage';
import { formatDateKey } from './prayerDayBoundary';
export { FEATURES_LIST } from '../data/featuresList';

export interface FeatureAnalyticsRecord {
  usageLogs: Record<string, number>;
  completionLogs: Record<string, number>;
  totalUsage: number;
  totalCompletion: number;
  lastUsed?: string;
  lastUsedAt?: string;
}

export type AnalyticsData = Record<string, FeatureAnalyticsRecord>;

const STORAGE_KEY = 'mc_feature_analytics_data_v1';
const WOMEN_EXCUSE_KEY = 'mc_women_excuse_active';

export function loadAnalyticsData(): AnalyticsData {
  return safeGetJSON<AnalyticsData>(STORAGE_KEY, {});
}

export function saveAnalyticsData(data: AnalyticsData): void {
  safeSetJSON(STORAGE_KEY, data);
}

export function getTodayDateString(d?: Date): string {
  return formatDateKey(d || new Date());
}

export function getDatesInRange(days: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    result.push(formatDateKey(d));
  }
  return result;
}

export function getWomenExcuseMode(): boolean {
  return safeGetJSON<boolean>(WOMEN_EXCUSE_KEY, false);
}

export function setWomenExcuseMode(enabled: boolean): void {
  safeSetJSON(WOMEN_EXCUSE_KEY, enabled);
}

export function trackFeatureUsage(featureId: string): void {
  try {
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
    record.lastUsed = new Date().toISOString();
    record.lastUsedAt = record.lastUsed;
    saveAnalyticsData(data);
  } catch (e) {
    console.warn('[AnalyticsStorage] Error tracking feature usage:', e);
  }
}

export function trackFeatureCompletion(featureId: string, amount: number = 1): void {
  try {
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
    record.completionLogs[today] = (record.completionLogs[today] || 0) + amount;
    record.totalCompletion = (record.totalCompletion || 0) + amount;
    record.lastUsed = new Date().toISOString();
    record.lastUsedAt = record.lastUsed;
    saveAnalyticsData(data);
  } catch (e) {
    console.warn('[AnalyticsStorage] Error tracking feature completion:', e);
  }
}
