import { ScheduleFailureSampleItem } from '../services/athanAlarmPlugin';

function formatHHMM(timestampMs?: number): string {
  if (!timestampMs || !Number.isFinite(timestampMs) || timestampMs <= 0) {
    return 'غير متوفر';
  }
  const d = new Date(timestampMs);
  if (Number.isNaN(d.getTime())) {
    return 'غير متوفر';
  }
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Formats the persisted last-reconcile scheduling failure summary line
 * for AthanDiagnosticsSection UI and its plain-text report.
 */
export function formatScheduleFailureLine(
  failedCount?: number,
  failedSample?: ScheduleFailureSampleItem[],
  lastReconcileAtMs?: number
): string {
  const count = typeof failedCount === 'number' && Number.isFinite(failedCount) ? failedCount : 0;
  const timeLabel = formatHHMM(lastReconcileAtMs);
  const baseLine = `فشل التسجيل: ${count} (آخر مصالحة ${timeLabel})`;

  if (count <= 0 || !Array.isArray(failedSample) || failedSample.length === 0) {
    return baseLine;
  }

  const sampleText = failedSample
    .slice(0, 5)
    .map((item) => `${item.requestCode} (${item.errorType})`)
    .join('، ');

  return `${baseLine} — العينة: ${sampleText}`;
}
