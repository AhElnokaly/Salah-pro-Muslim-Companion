import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AdaptiveKhatmaCalculator } from './AdaptiveKhatmaCalculator';

describe('AdaptiveKhatmaCalculator (No-Guilt Engine)', () => {
  test('calculates normal 30-day Quran khatma pace accurately', () => {
    const result = AdaptiveKhatmaCalculator.calculatePlan({
      totalPages: 604,
      startPage: 1,
      currentPage: 1,
      targetDays: 30,
      daysPassed: 0,
    });

    assert.equal(result.remainingPages, 603);
    assert.equal(result.remainingDays, 30);
    assert.equal(result.recommendedPagesPerDay, 21);
    assert.ok(result.encouragementMessage);
  });

  test('auto-extends plan when user falls behind to avoid overwhelming target', () => {
    // 504 pages remaining with only 2 days left
    const result = AdaptiveKhatmaCalculator.calculatePlan({
      totalPages: 604,
      startPage: 1,
      currentPage: 100,
      targetDays: 30,
      daysPassed: 28,
    });

    assert.equal(result.remainingPages, 504);
    // Without auto-extend, it would be 504 / 2 = 252 pages/day!
    // With auto-extend, it caps and adjusts remainingDays to a feasible schedule (~10 pages/day)
    assert.ok(result.recommendedPagesPerDay <= 20, `Pages per day (${result.recommendedPagesPerDay}) should be <= 20`);
    assert.ok(result.adjustedTargetDays > 30, 'Target days should be extended');
    assert.ok(result.remainingDays >= 25, 'Remaining days should be increased');
  });

  test('handles completed or nearly completed khatma gracefully', () => {
    const result = AdaptiveKhatmaCalculator.calculatePlan({
      totalPages: 604,
      startPage: 1,
      currentPage: 604,
      targetDays: 30,
      daysPassed: 25,
    });

    assert.equal(result.remainingPages, 0);
    assert.equal(result.recommendedPagesPerDay, 0);
  });

  test('adapts encouragement message according to workload tier', () => {
    const lightResult = AdaptiveKhatmaCalculator.calculatePlan({
      totalPages: 604,
      startPage: 1,
      currentPage: 500,
      targetDays: 30,
      daysPassed: 0,
    });
    // 104 pages / 30 days = 4 pages/day -> Light tier
    assert.match(lightResult.encouragementMessage, /صفحتان بعد كل صلاة|ورْدٌ لطيف/);
  });
});
