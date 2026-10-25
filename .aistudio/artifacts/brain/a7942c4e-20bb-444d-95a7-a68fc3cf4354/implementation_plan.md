# Hemmaty (هِمَّتِي) — Focused Stabilization Implementation Plan (B0, B1, B2)

Strictly scoped implementation blueprint for **B0**, **B1**, and **B2** ONLY, delivered as three separate commits on branch `Wip/commit3-athan-master-toggle` (base `6fe78a6`). B3 through B7 are deferred. No push or sync to GitHub.

---

## Approved Amendments & Critical Implementation Details

> [!IMPORTANT]
> **Strict Scope**: Implement **B0**, **B1**, and **B2** ONLY.
> 1. **JVM Test (Amendment 1)**:
>    - The Android module only has `junit` as `testImplementation`, and `org.json` is not available in plain JVM unit tests.
>    - The window filter operates on plain `Long` values (`timeMs`, `nowMs`, `windowDays`) via `@JvmStatic fun isAlarmInActiveWindow(timeMs: Long, nowMs: Long, windowDays: Long = 14L): Boolean`.
>    - `JSONArray` / `JSONObject` handling is kept outside the pure function, and `AthanAlarmWindowFilterTest.kt` tests only the pure part without any Android-stub or `org.json` dependencies.
> 2. **Device Check (Amendment 2)**:
>    - The in-app diagnostics report lists all saved alarms (30-day buffer) with `isCurrentlyScheduled` per item (marked as نشط: نعم vs مخزن).
>    - Manual testing compares the `dumpsys alarm` count specifically against the count of `isCurrentlyScheduled == true`, not the total 30-day saved buffer.
> 3. **ScheduleRenewalWorker (Amendment 3)**:
>    - No new user-facing notification is added.
>    - Retains existing worker behavior and logs a warning (`Log.w(TAG, "...")`) when the unexpired buffer is low (`futureCount < 25`).
>    - B1 commit message explicitly notes that offline coverage is now 30 days instead of 60.
> 4. **Payload Contract (B1)**:
>    - **JS Side**: Passes the **FULL 30-day computed buffer** to native via `scheduleNativeAthanAlarms`.
>    - **Native Side**: Stores the whole buffer in `KEY_SAVED_ALARMS`.
>    - **Single Shared Filter**: One pure Kotlin function (`isAlarmInActiveWindow`) filters `nowMs < timeMs <= nowMs + (windowDays * 86400000L)`. This single function is used across `reconcileAlarmsInternalStatic`, `AthanBootReceiver`, and `ScheduleRenewalWorker`.
>    - **Ledger Accuracy**: `KEY_SCHEDULED_IDS` stores **only actually-registered request codes** in `AlarmManager` (ensuring `getScheduledAlarmsStatic` stays 100% accurate).
> 5. **Test Expectation (B1)**:
>    - The expected count is computed dynamically by calling the **same alarm generator** (`buildNativePrayerTimeAlarms`) on the 14-day slice, including occurrences of recurring custom alarms, snoozes, and khushu entries.
>    - Enforces a hard ceiling around 300 (`<= 300`). Real alarms are never dropped.
> 6. **Kotlin Environment Disclosure**:
>    - Kotlin cannot be compiled in the container environment (requires Android SDK / JDK build tools).
>    - All Kotlin code remains minimal, pure, strictly null-safe, and clearly listed by file and function.

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
│  - Calls pure function: isAlarmInActiveWindow(timeMs, nowMs, windowDays)    │
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
│  - Reads KEY_SAVED_ALARMS, cleans expired alarms                            │
│  - Calls the SAME 14-day filter to slide registration window forward        │
│  - Logs warning if unexpired buffer < 25 alarms (< 5 days remaining)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Granular Batch Specifications

---

### Batch B0 — Baseline Hygiene & Snooze Collision Fix
- **Root Cause** [VERIFIED]:
  `AppModalOutlets.tsx:127` generated snooze IDs with `snooze_${Date.now()}`. Rapid calls within the same millisecond caused ID collisions.
- **Fix (Fix 0a)**:
  Generate high-entropy, guaranteed-unique IDs:
  `snooze_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  in `AppModalOutlets.tsx` and verify via `SnoozeAlarm.test.ts`.
- **Affected Files**:
  - `src/components/layout/AppModalOutlets.tsx`
  - `src/domain/notifications/SnoozeAlarm.test.ts`
- **Tests**:
  - `npm run test` (confirming all unit tests pass).
- **Manual Device Test**:
  Trigger an alarm, tap Snooze, inspect Alarms tab to confirm exactly one snooze card exists with the new unique ID format without duplicates.
- **Commit Message**:
  `fix(alarm): generate unique IDs for snoozed custom alarms`

---

### Batch B1 — Payload Contract, Shared 14-Day Filter & Sliding Window
- **Root Cause** [VERIFIED]:
  1. `AthanAlarmPlugin.kt` checked `currentScheduledIds.contains(reqCode)` and treated them as retained without calling `AlarmManager`. When the OS dropped alarms, the plugin never rescheduled them.
  2. The old 60-day window generated > 1,100 alarms, exceeding OEM limits (e.g. Samsung 500 cap).
- **Fix (Fix 1b & Fix 1c)**:
  1. **Fix 1b (Pure Window Filter & Unconditional Idempotent Re-assertion)**:
     - In `AthanAlarmPlugin.kt`, define pure Kotlin function:
       ```kotlin
       @JvmStatic
       fun isAlarmInActiveWindow(timeMs: Long, nowMs: Long, windowDays: Long = 14L): Boolean {
           val maxWindowMs = nowMs + (windowDays * 86400000L)
           return timeMs > nowMs && timeMs <= maxWindowMs
       }
       ```
     - In `reconcileAlarmsInternalStatic`, for every alarm returned by the filter, unconditionally call `alarmManager.setExactAndAllowWhileIdle(...)` with `FLAG_UPDATE_CURRENT`.
     - Populate `KEY_SCHEDULED_IDS` with strictly the request codes actually registered in `AlarmManager`.
     - In `scheduleAthanAlarms`, store the full 30-day buffer in `KEY_SAVED_ALARMS`.
  2. **Fix 1c (ScheduleRenewalWorker Sliding Window)**:
     - In `ScheduleRenewalWorker.kt`, remove duplicate Kotlin calculations. Read `KEY_SAVED_ALARMS`, filter to unexpired, and call `restoreOrScheduleAlarms` to slide the 14-day window.
     - When unexpired count < 25, log warning via `Log.w(TAG, "...")` without user-facing notification.
  3. **Fix 1d (Dynamic Generator Test & Ceiling)**:
     - In `src/domain/notifications/SlidingWindowScheduler.test.ts`:
       Call `buildNativePrayerTimeAlarms` dynamically across the 14-day slice.
       Assert `actual.length === expectedCountFromGenerator`.
       Assert `actual.length <= 300` hard ceiling. Real alarms are never dropped.
  4. **Fix 1e (JVM Unit Test for Native Filter)**:
     - Add `android/app/src/test/java/com/salahpro/app/plugins/AthanAlarmWindowFilterTest.kt` verifying `isAlarmInActiveWindow` with plain `Long` timestamps (no Android SDK or `org.json` dependencies).
- **Affected Files**:
  - `android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt` (`isAlarmInActiveWindow`, `filterAlarmsFor14DayWindow`, `reconcileAlarmsInternalStatic`)
  - `android/app/src/main/java/com/salahpro/app/plugins/ScheduleRenewalWorker.kt` (`doWork`)
  - `android/app/src/test/java/com/salahpro/app/plugins/AthanAlarmWindowFilterTest.kt` (pure JVM unit test)
  - `src/hooks/usePrayerScheduler.ts` (`BUFFER_DAYS = 30`)
  - `src/domain/notifications/SlidingWindowScheduler.test.ts` (dynamic generator test)
- **Manual Device Test (Windows cmd)**:
  1. Force stop the app:
     ```cmd
     adb shell am force-stop com.salahpro.app
     ```
  2. Count registered alarms in AlarmManager:
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
     Compare against the count of alarms with `isCurrentlyScheduled == true` (نشط: نعم) in the in-app diagnostics report.
- **Commit Message**:
  `feat(alarm): implement 30-day buffer with 14-day sliding native window`

---

### Batch B2 — Boot & Package Update Recovery (No Ledger Trust)
- **Root Cause** [VERIFIED]:
  On reboot or app update, Android wipes `AlarmManager`. `AthanBootReceiver.kt` previously called reconcile with stale `KEY_SCHEDULED_IDS` still in SharedPreferences, marking alarms as "retained" and registering 0 alarms with the OS.
- **Fix (Fix 2a)**:
  In `AthanBootReceiver.kt`:
  1. Clear the stale `KEY_SCHEDULED_IDS` and `KEY_SCHEDULED_COUNT` on `ACTION_BOOT_COMPLETED` and `ACTION_MY_PACKAGE_REPLACED`.
  2. Read `KEY_SAVED_ALARMS`.
  3. Call `AthanAlarmPlugin.restoreOrScheduleAlarms(context, jsonArray)` to unconditionally re-register all unexpired alarms in the 14-day window into `AlarmManager`.
- **Affected Files**:
  - `android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt` (`onReceive`)
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
  `fix(boot): unconditionally restore alarms and clear stale ledger on boot`

---

## 3. Kotlin Files & Functions Modification Summary

> [!NOTE]
> All Kotlin modifications are minimal, pure, strictly null-safe, and paired with a JVM unit test:
> - `android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt`:
>   - Added `@JvmStatic fun isAlarmInActiveWindow(timeMs: Long, nowMs: Long, windowDays: Long = 14L): Boolean`
>   - Added `@JvmStatic fun filterAlarmsFor14DayWindow(items: JSONArray, nowMs: Long, windowDays: Long): List<JSONObject>`
>   - Updated `reconcileAlarmsInternalStatic` to filter 14 days and unconditionally call `setExactAndAllowWhileIdle`
> - `android/app/src/main/java/com/salahpro/app/plugins/ScheduleRenewalWorker.kt`:
>   - In `doWork()`, purges expired alarms and slides 14-day window over unexpired 30-day buffer via `restoreOrScheduleAlarms`
>   - Logs warning on low buffer; removed unused notification classes and helper
> - `android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt`:
>   - In `onReceive()`, cleared stale `KEY_SCHEDULED_IDS` on boot/update before calling `restoreOrScheduleAlarms`
> - `android/app/src/test/java/com/salahpro/app/plugins/AthanAlarmWindowFilterTest.kt`:
>   - Pure JVM unit tests verifying `isAlarmInActiveWindow` with standard JUnit assertions (no Android SDK or `org.json` dependencies)
