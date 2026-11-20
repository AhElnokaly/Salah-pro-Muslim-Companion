# SPEC: Khushu start delay per prayer (expose `iqamaOffsets`)

Branch: `Wip/commit3-athan-master-toggle`
Scope: small. UI + clamping + tests. **No Kotlin changes. No new data field.**

## Goal
Let the user choose, per prayer, how many minutes after the athan Khushu mode auto-activates (today it is only possible to choose the duration).

## Decisions (final, from the owner)
1. Do NOT add `delayAfterAthanMin`. Reuse the existing `iqamaOffsets` (`KhushuIqamaOffsets` in `src/domain/khushu/khushuTypes.ts`).
2. Allowed range: **min 5, max 30 minutes**. Zero is NOT allowed.
3. Dropdown options: `5, 10, 15, 20, 25, 30`.
4. Friday keeps its own entry (`iqamaOffsets.friday`), same range.
5. Existing defaults stay unchanged (all are already inside 5-30): fajr 20, dhuhr 15, asr 15, maghrib 10, isha 15, friday 25.

## Changes

### 1) UI: `src/components/KhushuModeSheet.tsx` (customization tab)
- In the per-prayer list (fajr, dhuhr, asr, maghrib, isha, friday), each prayer card shows TWO dropdowns:
  - "يبدأ بعد الأذان بـ" -> `settings.iqamaOffsets[key]`, options 5-30 above.
  - "المدة" -> `settings.prayerDurations[key]` (existing, unchanged options).
- Keep the existing visual style of the duration dropdown. Arabic digits via the existing `toArabicNumbers`.
- On change, send the COMPLETE merged object (the hook merges shallowly):
  ```ts
  onUpdateSettings({
    iqamaOffsets: { ...settings.iqamaOffsets, [key]: value },
  });
  ```
- Value shown must be the stored value; if the stored value is outside 5-30, show the clamped value.

### 2) Clamping (single helper, used everywhere)
- Add `clampIqamaOffset(v: unknown, fallback: number): number` (suggested place: `khushuFlowUtils.ts` or a small util next to it).
  - Not a finite number -> `fallback`.
  - Otherwise round, then clamp to `[5, 30]`.
- Use it in the three places that compute the start time, so they all follow ONE rule:
  - `getIqamaWindowInfo` in `src/domain/khushu/khushuFlowUtils.ts`
  - `buildNativePrayerTimeAlarms` in `src/services/athanAlarmPlugin.ts` (all paths: day list, today, tomorrow)
  - any equivalent block in `src/domain/notifications/UnifiedNotificationOrchestrator.ts` (check; change only if it computes the offset itself)
- Keep the Friday rule: `isFriday && dhuhr && enableFridaySpecial` -> use `iqamaOffsets.friday` (fallback 25) and `prayerDurations.friday`.
- Do not touch the `|| 15` for durations. Only the offset logic changes.

### 3) Do NOT change
- `khushuTypes.ts`, `khushuStorage.ts` (merge already covers `iqamaOffsets`), `useKhushuMode.ts`, `usePrayerScheduler.ts`, any `.kt` file.
- The `khushu-settings-changed` event already triggers re-orchestration; just make sure the new dropdown goes through `onUpdateSettings`.

## Tests (node:test, same style as existing)
In `src/domain/khushu/Khushu.test.ts`:
1. `clampIqamaOffset`: 0 -> 5, 3 -> 5, 5 -> 5, 17 -> 17, 30 -> 30, 45 -> 30, NaN/undefined/string -> fallback.
2. Changing fajr offset does not change the other prayers' offsets (merge keeps them).
3. Changing an offset does not change any duration, and vice versa.
4. `getIqamaWindowInfo`: start time = athan + chosen offset for a non-default value (e.g. dhuhr 25 -> athan + 25).
5. Friday uses `iqamaOffsets.friday` and `prayerDurations.friday`; a Friday offset of 30 gives athan + 30.

In `src/services/athanAlarmPlugin.test.ts`:
6. Khushu alarm `timeMs` = athan `timeMs` + chosen offset for fajr = 10 and for friday = 30.
7. Stored out-of-range offset (e.g. 0 or 90) is clamped in the generated alarm time.
8. `durationMinutes` is unchanged when only the offset changes.

All existing tests must still pass (`tsc` clean).

## Out of scope (do not build now)
- Blocking `offset + duration` from overlapping the next prayer (flagged as a risk, separate decision).
- Fixing the possible double activation between the in-app scheduler (`useKhushuAutoScheduler`, 15 s check) and the native alarm. Needs a device test, not part of this change.
- Allowing 0 ("right at the athan").
- Volume / RingCoordinator work (Task 10).

## Device test after merge (owner)
1. Set Dhuhr offset to 5, enable auto-with-iqama, wait for Dhuhr: Khushu starts 5 min after the athan, once.
2. Change it to 10 before the next prayer: the old alarm must not fire, the new one fires at +10.
3. Friday: confirm the Friday entry is used.
