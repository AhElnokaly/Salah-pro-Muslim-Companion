import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { selectUpcomingCachedDays, CachedScheduleDay } from './locationCache';

describe('selectUpcomingCachedDays', () => {
  const makeDay = (offsetDays: number): CachedScheduleDay => {
    const d = new Date(2026, 3, 10, 12, 0, 0); // April 10, 2026
    d.setDate(d.getDate() + offsetDays);
    return {
      dateStr: d.toISOString(),
      timesMap: { Fajr: '04:30', Dhuhr: '12:30' },
    };
  };

  const baseNow = new Date(2026, 3, 10, 15, 0, 0);

  it('returns requested slice when fresh cache has enough upcoming days', () => {
    const schedule: CachedScheduleDay[] = Array.from({ length: 30 }, (_, i) => makeDay(i));
    const result = selectUpcomingCachedDays(schedule, baseNow, 30);
    assert.ok(result);
    assert.strictEqual(result.length, 30);
  });

  it('rejects stale cache with fewer upcoming days than minDays', () => {
    const schedule: CachedScheduleDay[] = Array.from({ length: 30 }, (_, i) => makeDay(i - 20));
    const result = selectUpcomingCachedDays(schedule, baseNow, 30);
    assert.strictEqual(result, null);
  });

  it('trims larger schedule (e.g. 60 days) to exactly minDays', () => {
    const schedule: CachedScheduleDay[] = Array.from({ length: 60 }, (_, i) => makeDay(i));
    const result = selectUpcomingCachedDays(schedule, baseNow, 30);
    assert.ok(result);
    assert.strictEqual(result.length, 30);
  });

  it('ignores entries with invalid dateStr and excludes them from count', () => {
    const schedule: CachedScheduleDay[] = [
      { dateStr: 'invalid-date', timesMap: {} },
      ...Array.from({ length: 30 }, (_, i) => makeDay(i)),
    ];
    const result = selectUpcomingCachedDays(schedule, baseNow, 30);
    assert.ok(result);
    assert.strictEqual(result.length, 30);
  });
});
