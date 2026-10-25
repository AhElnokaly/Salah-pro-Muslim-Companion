# Hemmaty (هِمَّتِي) — Focused Stabilization Implementation Plan (B0, B1, B2)

Strictly scoped implementation blueprint for **B0**, **B1**, and **B2** ONLY, delivered as three separate commits on branch `Wip/commit3-athan-master-toggle` (base `6fe78a6`). B3 through B7 are deferred. No push or sync to GitHub.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Strict Scope**: Implement **B0**, **B1**, and **B2** ONLY.
> 1. **Payload Contract (B1)**:
>    - **JS Side**: Passes the **FULL 30-day computed buffer** to native via `scheduleNativeAthanAlarms`.
>    - **Native Side**: Stores the whole buffer in `KEY_SAVED_ALARMS`.
>    - **Single Shared Filter**: One pure Kotlin function (`filterAlarmsFor14DayWindow`) filters `now < timeMs <= now + 14 days`. This single function is used across `reconcileAlarmsInternalStatic`, `AthanBootReceiver`, and `ScheduleRenewalWorker`.
>    - **Ledger Accuracy**: `KEY_SCHEDULED_IDS` stores **only actually-registered request codes** in `AlarmManager` (ensuring `getScheduledAlarmsStatic` stays 100% accurate).
> 2. **Test Expectation (B1)**:
>    - Do NOT use a hand-calculated formula. The expected count must be computed by calling the **same alarm generator** (`buildNativePrayerTimeAlarms`) on the 14-day slice, including occurrences of recurring custom alarms in the 14-day window, snoozes, and khushu entries.
>    - Enforce a hard ceiling around 300. Real alarms are never dropped to satisfy a cap.
>    - **Device Check**: Compare `dumpsys alarm` count with the scheduled count in the in-app diagnostics report.
> 3. **Native Automated JVM Unit Test (B1/B2)**:
>    - Extract the window-filter decision into a pure, null-safe Kotlin function in `AthanAlarmPlugin.kt`.
>    - Add a JVM unit test next to `AthanAlarmCancelPrefixTest.kt` (`AthanAlarmWindowFilterTest.kt`).
>    - The boot path and worker call that exact same pure function.
> 4. **Kotlin Environment Disclosure**:
>    - Kotlin cannot be compiled in the container environment (requires Android SDK / JDK build tools).
>    - All Kotlin code must remain minimal, robust, null-safe, and clearly listed by file and function.
> 5. **Device Tests**:
>    - **B1**: `adb shell am force-stop com.salahpro.app` -> count with `findstr` -> reopen app -> recount (must match in-app diagnostics count).
>    - **B2**: Record count -> `adb reboot` -> count after 60s (must match without opening app).

---

## 1. Architecture & Payload Contract

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       JS AUTHORITATIVE ORCHESTRATOR                         │
│                                                                             │
│  usePrayerScheduler.ts & UnifiedNotificationOrchestrator.ts                 │
│  - Computes FULL 30-day buffer from coordinates & prayer offsets            │
│  - Merges active custom alarms (fixed, relative, snoozes, khushu)           │
│  - Sends FULL 30-day buffer to native bridge (scheduleNativeAthanAlarms)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                      Payload: FULL 30-day buffer (JSON)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NATIVE ANDROID PIPELINE (ONE FILTER)                     │
│                                                                             │
│  AthanAlarmPlugin.kt:                                                       │
│  - Stores FULL 30-day buffer in SharedPreferences (KEY_SAVED_ALARMS)        │
│  - Calls pure shared function: filterAlarmsFor14DayWindow(buffer, nowMs)     │
│  - Re-asserts all 14-day alarms unconditionally and idempotently via        │
│    alarmManager.setExactAndAllowWhileIdle(RTC_WAKEUP, timeMs, PendingIntent)│
│    with FLAG_UPDATE_CURRENT                                                 │
│  - Cancels obsolete / slid-out alarms                                       │
│  - Records actually-registered request codes in KEY_SCHEDULED_IDS           │
│                                                                             │
│  AthanBootReceiver.kt (BOOT_COMPLETED / MY_PACKAGE_REPLACED):               │
│  - Clears stale KEY_SCHEDULED_IDS (never trust ledger after reboot)         │
│  - Reads KEY_SAVED_ALARMS and calls the SAME 14-day filter + registration   │
│                                                                             │
│  ScheduleRenewalWorker.kt (Every 3 Days via WorkManager):                   │
│  - Reads KEY_SAVED_ALARMS                                                   │
│  - Calls the SAME 14-day filter to slide registration window forward        │
│  - Alerts user only when unexpired buffer < 25 alarms (< 5 days)           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Granular Batch Specifications

---

### Batch B0 — Baseline Hygiene & Snooze Collision Fix
- **Root Cause** [VERIFIED]:
  `AppModalOutlets.tsx:127` and `SnoozeAlarm.test.ts:57` generate snooze IDs with `snooze_${Date.now()}`. Rapid calls within the same millisecond cause ID collisions and assertion failures.
- **Fix (Fix 0a)**:
  Generate high-entropy, guaranteed-unique IDs:
  `snooze_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  in `AppModalOutlets.tsx` and `SnoozeAlarm.test.ts`. Confirm no remaining references to removed default alarms (`alarm_before_salah`, `alarm_after_salah`) outside of migration logic.
- **Affected Files**:
  - `src/components/layout/AppModalOutlets.tsx`
  - `src/domain/notifications/SnoozeAlarm.test.ts`
- **Tests**:
  - `npm run test` (confirming all 183 tests pass).
- **Manual Device Test**:
  Trigger an alarm, tap Snooze, inspect Alarms tab to confirm exactly one snooze card exists with the new unique ID format without duplicates.
- **Commit Message**:
  `fix(alarms): fix snooze ID collision and verify baseline hygiene`

---

### Batch B1 — Payload Contract, Shared 14-Day Filter & Sliding Window
- **Root Cause** [VERIFIED]:
  1. `AthanAlarmPlugin.kt:217` checked `currentScheduledIds.contains(reqCode)` and treated them as retained without calling `AlarmManager`. When the OS drops alarms (quota, battery saver, etc.), the plugin never reschedules them.
  2. The old 60-day window generated > 1,100 alarms, exceeding Samsung's `max_alarms_per_uid = 500` limit.
- **Fix (Fix 1b & Fix 1c)**:
  1. **Fix 1b (Pure Window Filter & Unconditional Idempotent Re-assertion)**:
     - In `AthanAlarmPlugin.kt`, define a pure, testable Kotlin function:
       ```kotlin
       @JvmStatic
       fun filterAlarmsFor14DayWindow(
           items: JSONArray,
           nowMs: Long,
           windowDays: Long = 14L
       ): List<JSONObject>
       ```
     - Filter strictly to `nowMs < timeMs <= nowMs + (windowDays * 86400000L)`.
     - In `reconcileAlarmsInternalStatic`, for every alarm returned by the filter, unconditionally call `alarmManager.setExactAndAllowWhileIdle(...)` with `FLAG_UPDATE_CURRENT`.
     - Populate `KEY_SCHEDULED_IDS` with strictly the request codes actually registered in `AlarmManager`.
     - In `scheduleAthanAlarms`, store the full 30-day buffer in `KEY_SAVED_ALARMS`.
  2. **Fix 1c (ScheduleRenewalWorker Sliding Window)**:
     - In `ScheduleRenewalWorker.kt`, remove the duplicate Kotlin calculation. Instead, read `KEY_SAVED_ALARMS`, filter to unexpired, and call the shared registration function to slide the 14-day window.
  3. **Fix 1d (Dynamic Generator Test & Ceiling)**:
     - In `src/domain/notifications/SlidingWindowScheduler.test.ts`:
       Call `buildNativePrayerTimeAlarms` on the 14-day slice dynamically to compute the exact expected count (including recurring custom alarms, snoozes, and khushu).
       Assert `actual.length === expectedCountFromGenerator`.
       Assert `actual.length <= 300` hard ceiling. Real alarms are never dropped.
  4. **Fix 1e (JVM Unit Test for Native Filter)**:
     - Add `android/app/src/test/java/com/salahpro/app/plugins/AthanAlarmWindowFilterTest.kt` verifying that `filterAlarmsFor14DayWindow` excludes past alarms, includes alarms within 14 days, and excludes alarms past 14 days.
- **Affected Files**:
  - `android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt` (`filterAlarmsFor14DayWindow`, `reconcileAlarmsInternalStatic`, `scheduleAthanAlarms`)
  - `android/app/src/main/java/com/salahpro/app/plugins/ScheduleRenewalWorker.kt` (`doWork`)
  - `android/app/src/test/java/com/salahpro/app/plugins/AthanAlarmWindowFilterTest.kt` (new JVM test)
  - `src/hooks/usePrayerScheduler.ts` (`SCHEDULE_BUFFER_DAYS = 30`)
  - `src/domain/notifications/SlidingWindowScheduler.test.ts` (dynamic generator test)
- **Manual Device Test (Windows cmd)**:
  1. Force stop the app:
     ```cmd
     adb shell am force-stop com.salahpro.app
     ```
  2. Check registered alarms:
     ```cmd
     adb shell dumpsys alarm | findstr /C:"com.salahpro.app"
     ```
  3. Reopen the app:
     ```cmd
     adb shell monkey -p com.salahpro.app -c android.intent.category.LAUNCHER 1
     ```
  4. Recount:
     ```cmd
     adb shell dumpsys alarm | findstr /C:"com.salahpro.app"
     ```
     Must match the scheduled count shown in the in-app diagnostics report (~70–120 alarms, well below 300 ceiling).
- **Commit Message**:
  `fix(alarms): re-assert 14-day window unconditionally and slide over stored buffer`

---

### Batch B2 — Boot & Package Update Recovery (No Ledger Trust)
- **Root Cause** [VERIFIED]:
  On reboot or app update, Android wipes `AlarmManager`. `AthanBootReceiver.kt` previously called reconcile with stale `KEY_SCHEDULED_IDS` still in SharedPreferences, marking all alarms as "retained" and registering 0 alarms with the OS.
- **Fix (Fix 2a)**:
  In `AthanBootReceiver.kt`, do NOT trust the `KEY_SCHEDULED_IDS` ledger:
  1. Clear the stale `KEY_SCHEDULED_IDS` set on `ACTION_BOOT_COMPLETED` and `ACTION_MY_PACKAGE_REPLACED`.
  2. Read `KEY_SAVED_ALARMS`.
  3. Call the shared `restoreOrScheduleAlarms` function (which applies `filterAlarmsFor14DayWindow` and unconditionally registers all unexpired alarms in the 14-day window into `AlarmManager`).
- **Affected Files**:
  - `android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt` (`restoreAlarms`)
- **Manual Device Test (Windows cmd)**:
  1. Record alarms:
     ```cmd
     adb shell dumpsys alarm | findstr /C:"com.salahpro.app"
     ```
  2. Reboot phone:
     ```cmd
     adb reboot
     ```
  3. Wait 60s without launching app, then verify:
     ```cmd
     adb shell dumpsys alarm | findstr /C:"com.salahpro.app"
     ```
  4. Alarm count must match pre-reboot count without opening the app.
- **Commit Message**:
  `fix(boot): force re-registration of unexpired 14-day alarms on device reboot`

---

## 3. Kotlin Files & Functions Modification Summary

> [!NOTE]
> Because the local web container cannot compile Android / Kotlin code, all Kotlin modifications are kept minimal, pure, strictly null-safe, and paired with a JVM unit test:
> - `android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt`:
>   - Added `@JvmStatic fun filterAlarmsFor14DayWindow(items: JSONArray, nowMs: Long, windowDays: Long): List<JSONObject>`
>   - Updated `reconcileAlarmsInternalStatic` to use `filterAlarmsFor14DayWindow` and unconditionally call `setExactAndAllowWhileIdle`
>   - Updated `scheduleAthanAlarms` to store full 30-day buffer in `KEY_SAVED_ALARMS`
> - `android/app/src/main/java/com/salahpro/app/plugins/ScheduleRenewalWorker.kt`:
>   - In `doWork()`, replaced 150-line duplicate calculation with call to shared `restoreOrScheduleAlarms` over unexpired buffer
> - `android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt`:
>   - In `restoreAlarms()`, removed `KEY_SCHEDULED_IDS` on boot/update before re-registration
> - `android/app/src/test/java/com/salahpro/app/plugins/AthanAlarmWindowFilterTest.kt`:
>   - Added JVM unit tests verifying the pure filter logic
