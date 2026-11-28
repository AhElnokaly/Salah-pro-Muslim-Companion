/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Test script for R13: Multi-Process Timezone Invariance Verification.
 * Spawns an isolated Node.js child process for each target TZ environment variable
 * to verify that buildPrayerTimestampMs produces identical numeric epoch ms
 * regardless of host machine timezone.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const targetTimezones = [
  'Africa/Cairo',
  'Asia/Riyadh',
  'America/New_York',
  'UTC',
  'Australia/Sydney',
];

console.log('===============================================================');
console.log('R13: Running Multi-Process Timezone Invariance Suite');
console.log('Testing identical numeric timeMs output across 5 isolated TZ environments');
console.log('===============================================================\n');

// The worker code executed inside each isolated Node process
const workerCode = `
const { buildPrayerTimestampMs } = require('./src/utils/prayerTimestamp.ts');

const cases = [
  { name: 'Cairo Fajr (DST)', cityDate: '2026-06-15', prayerMinutes: 272, timezoneId: 'Africa/Cairo', expected: 1781487120000 },
  { name: 'Riyadh Dhuhr (No DST)', cityDate: '2026-01-10', prayerMinutes: 725, timezoneId: 'Asia/Riyadh', expected: 1768035900000 },
  { name: 'New York Maghrib (EDT)', cityDate: '2026-10-15', prayerMinutes: 1080, timezoneId: 'America/New_York', expected: 1792101600000 },
  { name: 'Cairo 24:15 Midnight Carry', cityDate: '2026-06-15', prayerMinutes: 1455, timezoneId: 'Africa/Cairo', expected: 1781558100000 },
  { name: 'Cairo -15m Negative Carry', cityDate: '2026-06-15', prayerMinutes: -15, timezoneId: 'Africa/Cairo', expected: 1781469900000 },
];

const results = {};
let allPassed = true;

for (const c of cases) {
  const actual = buildPrayerTimestampMs({
    cityDate: c.cityDate,
    prayerMinutes: c.prayerMinutes,
    timezoneId: c.timezoneId,
  });
  const pass = actual === c.expected;
  if (!pass) allPassed = false;
  results[c.name] = { actual, expected: c.expected, pass };
}

console.log(JSON.stringify({ tz: process.env.TZ, allPassed, results }));
if (!allPassed) process.exit(1);
`;

const processResults = [];
let overallSuccess = true;

for (const tz of targetTimezones) {
  const env = { ...process.env, TZ: tz };
  const child = spawnSync('npx', ['tsx', '-e', workerCode], {
    env,
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..'),
  });

  if (child.status !== 0) {
    console.error(`❌ Process with TZ=${tz} failed!`);
    console.error(child.stderr || child.stdout);
    overallSuccess = false;
  } else {
    try {
      const output = JSON.parse(child.stdout.trim());
      processResults.push(output);
      console.log(`✓ Process with TZ=${tz.padEnd(18)} passed all test cases.`);
    } catch (e) {
      console.error(`Failed parsing worker output for TZ=${tz}:`, child.stdout);
      overallSuccess = false;
    }
  }
}

console.log('\n--- Cross-Process Invariance Matrix ---');
if (processResults.length > 0) {
  const sampleResults = processResults[0].results;
  for (const caseName of Object.keys(sampleResults)) {
    const expected = sampleResults[caseName].expected;
    const allMatch = processResults.every(pr => pr.results[caseName]?.actual === expected);
    console.log(`Case: "${caseName.padEnd(28)}" -> Expected: ${expected} | All 5 TZs Match: ${allMatch ? 'YES ✓' : 'NO ✕'}`);
    if (!allMatch) overallSuccess = false;
  }
}

if (!overallSuccess) {
  console.error('\n❌ Timezone Invariance Suite FAILED!');
  process.exit(1);
} else {
  console.log('\n✅ All 5 isolated processes returned identical timestamps. Timezone Invariance PROVEN.');
  process.exit(0);
}
