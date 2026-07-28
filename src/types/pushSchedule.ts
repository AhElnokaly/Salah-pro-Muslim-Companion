/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PushSubscriptionRecord {
  id?: string;
  deviceId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  adhanEnabled: boolean;
  updatedAt: string;
}

export interface ScheduledAthanItem {
  prayerName: string; // 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'
  fireAtUtc: string;  // ISO 8601 string in UTC (e.g. '2026-07-28T03:15:00.000Z')
  dateStr: string;    // Local date string 'YYYY-MM-DD'
}

export interface ScheduledAthansPayload {
  deviceId: string;
  subscriptionEndpoint: string;
  schedules: ScheduledAthanItem[];
}
