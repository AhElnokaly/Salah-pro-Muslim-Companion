import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { formatScheduleFailureLine } from './scheduleFailureFormatter';

describe('formatScheduleFailureLine', () => {
  test('always formats count 0 with HH:MM when timestamp is provided', () => {
    const sampleDate = new Date(2026, 10, 23, 9, 5, 0, 0).getTime();
    const line = formatScheduleFailureLine(0, [], sampleDate);
    assert.equal(line, 'فشل التسجيل: 0 (آخر مصالحة 09:05)');
  });

  test('falls back cleanly when lastReconcileAtMs is 0 or missing', () => {
    assert.equal(formatScheduleFailureLine(0, [], 0), 'فشل التسجيل: 0 (آخر مصالحة غير متوفر)');
    assert.equal(formatScheduleFailureLine(undefined, undefined, undefined), 'فشل التسجيل: 0 (آخر مصالحة غير متوفر)');
  });

  test('includes structured failure sample (max 5) when failedCount > 0', () => {
    const sampleDate = new Date(2026, 10, 23, 14, 30, 0, 0).getTime();
    const line = formatScheduleFailureLine(
      7,
      [
        { requestCode: 4100, errorType: 'IllegalStateException' },
        { requestCode: 4101, errorType: 'SecurityException' },
      ],
      sampleDate
    );
    assert.equal(
      line,
      'فشل التسجيل: 7 (آخر مصالحة 14:30) — العينة: 4100 (IllegalStateException)، 4101 (SecurityException)'
    );
  });
});
