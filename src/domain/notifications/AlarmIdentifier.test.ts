import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AlarmIdentifier } from './AlarmIdentifier';

describe('AlarmIdentifier (Deterministic Android Request Code Engine)', () => {
  test('generates strictly positive Int32 request codes within safe Android range', () => {
    const timeMs = 1756980000000; // arbitrary timestamp
    const id = AlarmIdentifier.generateId('Fajr', timeMs);

    assert.ok(Number.isInteger(id), 'ID must be an integer');
    assert.ok(id >= 1000, 'ID must be >= 1000');
    assert.ok(id <= 10001000, 'ID must be within safe Int32 range');
  });

  test('is fully deterministic for the same prayer and timestamp bucket', () => {
    const timeMs = 1756980000000;
    const id1 = AlarmIdentifier.generateId('Dhuhr', timeMs);
    const id2 = AlarmIdentifier.generateId('Dhuhr', timeMs);
    const id3WithinSameMinute = AlarmIdentifier.generateId('Dhuhr', timeMs + 30000); // +30s in same minute bucket

    assert.equal(id1, id2, 'Same input must yield identical ID');
    assert.equal(id1, id3WithinSameMinute, 'Timestamps within the same minute must yield identical bucket ID');
  });

  test('generates distinct IDs for different prayers at the same time bucket', () => {
    const timeMs = 1756980000000;
    const fajrId = AlarmIdentifier.generateId('Fajr', timeMs);
    const asrId = AlarmIdentifier.generateId('Asr', timeMs);

    assert.notEqual(fajrId, asrId, 'Different prayers must produce distinct IDs');
  });

  test('generates distinct IDs across different days/minute buckets', () => {
    const time1 = 1756980000000;
    const time2 = time1 + 24 * 60 * 60 * 1000; // Next day
    const day1Id = AlarmIdentifier.generateId('Maghrib', time1);
    const day2Id = AlarmIdentifier.generateId('Maghrib', time2);

    assert.notEqual(day1Id, day2Id, 'Different days must produce distinct IDs');
  });
});
