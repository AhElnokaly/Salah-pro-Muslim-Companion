# PHASE1_COMPLETION_PROMPT.md

You are finishing **Phase 1** (in-app diagnostics test framework) of the Hemmaty / Salah Pro app on branch `Wip/commit3-athan-master-toggle`.
Everything you need is in this file. Do not ask questions. If something is ambiguous, pick the safest option, write the decision and the reason into the final report, and continue.

The work will be reviewed by other AI reviewers and by a human before any push. Honesty matters more than looking complete.

---

## 0. Hard rules

1. **Do NOT touch:** `src/components/prayer/PrayerTimesView.tsx`, `REFERENCE.md`, project images, anything under Phase 2 (Khushu start-delay, `iqamaOffsets` UI, `computeKhushuStartMs`).
2. **No new features** beyond this file. No refactors of unrelated code.
3. **Never claim something is verified unless you ran it.** Use exactly these labels everywhere in reports:
   - `VERIFIED` = you ran a command or test and saw the output.
   - `STATIC` = you read the code and reasoned, without running it.
   - `UNCOMPILED` = Kotlin you changed (no JDK/Android SDK here; `tsc` and `compile_applet` do NOT compile Kotlin).
   - `CANNOT VERIFY` = you cannot prove it.
4. **Every claim about code needs `path:line`.** No "somewhere in the file".
5. **Prefix single source of truth:** the string `"diag_"` must be defined once (one exported constant + one helper `isDiagAlarmId(id: string): boolean`, in `src/diagnostics/tests/diagTypes.ts` or a tiny util next to it). Every place below imports it. No hard-coded `"diag_"` literals elsewhere (test files excepted).
6. **Checkpointing (quota safety):** after each task (T1..T9) append one line to `docs/review/PROGRESS.md`: task id, status (`DONE`/`PARTIAL`/`BLOCKED`), files touched. If you run out of quota, the next session must be able to continue from that file. Do not leave half-written files: finish or revert the current file before stopping.
7. Commit at the end as ONE new commit on the current branch: `fix(diagnostics): Phase 1 hardening - hide/strip diag_ alarms, backup safety, report`. Do not amend `a7c8ed2`.

---

## 1. Context you must know (facts already established)

- Test B creates synthetic custom alarms with ids `diag_<runId>_<n>` inside `salah_custom_alarms` (kept there so `reconcile` does not cancel them while waiting).
- Reviewer found these places that read `salah_custom_alarms` and are NOT yet diag-safe:
  - `src/components/WorshipAlarms.tsx:381` renders `customAlarms.map(...)` with no filter, so the user sees and can edit/delete `diag_` alarms.
  - `src/components/settings/BackupSettingsTab.tsx:134` (export) and `:274` (restore): backup would include `diag_` alarms and restore could resurrect them after cleanup.
  - `src/domain/notifications/UnifiedNotificationOrchestrator.ts:186`, `src/hooks/usePrayerScheduler.ts:60` and `:130` (verify exact paths with a search): they schedule from the same key. Unknown: are `diag_` alarms treated as one-shot, or could they be rescheduled daily / after cleanup?
- You edited `src/utils/audioStorage.ts` ("Node test guard"), which was not in the approved plan. It contains `getAudioUrl`, used by real app playback.
- Kotlin files changed in Phase 1: `AthanBootReceiver.kt`, `KhushuRestoreReceiver.kt`, `AthanAlarmPlugin.kt` (all under `android/app/src/main/java/com/salahpro/app/plugins/`). `gradlew compileDebugKotlin` cannot run here, so they are `UNCOMPILED`.
- Test B verdict rule (must hold in code and tests): a "mute state" is ANY of `ringerMode=SILENT`, `ringerMode=VIBRATE`, `interruptionFilter=NONE`. Control heard + Khushu alarm not heard + mute state logged => `SUPPORTS_HYPOTHESIS`. Both not heard => `INCONCLUSIVE`.
- Custom alarms play through the notification channel: there is NO playback callback. The strongest technical evidence for them is `ALARM_RECEIVED`. `PLAYBACK_STARTED` must never be reported for custom alarms.

---

## 2. Tasks (do in this order)

### T1. Hide `diag_` alarms from every user-facing list
- Filter at **render time only** (do not remove them from storage, the scheduler needs them).
- Apply in `WorshipAlarms.tsx` and any other component that lists or edits custom alarms (search the repo for `salah_custom_alarms`, `customAlarms`, `custom-alarms-changed`; list every consumer in the report with `path:line` and whether you changed it).
- Also make sure edit/delete handlers cannot target a `diag_` id by index shift (if handlers use array index of the filtered list, fix them to use ids).

### T2. Backup safety
- `BackupSettingsTab.tsx:134` export: exclude entries where `isDiagAlarmId(id)`.
- `BackupSettingsTab.tsx:274` restore/import: strip `diag_` entries from imported data before writing.
- Do not change the backup file format otherwise.

### T3. Scheduler paths
- Read `UnifiedNotificationOrchestrator.ts` and `usePrayerScheduler.ts` around the lines above. Answer in the report with `path:line` evidence:
  1. Are `diag_` alarms scheduled as one-shot at their exact `timeMs`, or can they be recurring/daily?
  2. After the runner cleans up (or the app restarts), can any scheduler path re-create a native alarm for a `diag_` id?
  3. Does any scheduler path cancel all custom alarms and reschedule (which would kill them mid-test)?
- If any answer is unsafe, fix it minimally (skip `isDiagAlarmId` ids in the recurring/daily paths, and guarantee one-shot). Explain the fix.
- Also answer: does `AthanAlarm.scheduleAthanAlarms` cancel existing alarms before scheduling? State exactly how Phase 1 schedules `diag_` alarms (via `scheduleAthanAlarms` or injected into the reconcile desired list) and why that is safe.

### T4. `src/utils/audioStorage.ts` change
- Print the exact diff of your change (`path:line`).
- Prove it changes **no behavior** in the browser or the Capacitor app (it must only be a guard for Node/test environments). If you cannot prove that, **revert it** and make the unit tests inject what they need instead.
- Add a test that fails if the production path (browser-like environment) behaves differently.

### T5. Kotlin static review (they are `UNCOMPILED`)
For each of the 3 Kotlin files, re-read your own changes line by line and check: imports, nullability (`?.`, `!!`), `Map<String, Any>` casts (`as? Number`, `as? String`), `JSONObject`/`JSONArray` API usage, `Context` usage, `SharedPreferences` key names, and that every new function is actually called. Then:
1. List every changed Kotlin line range per file.
2. Prove the `os_verified` check uses the **same** `reqCode` and the same `Intent` identity as scheduling. Print the body of `createAthanIntent` and `getAthanPendingIntent` (action, data, component, categories) and say if `Intent.filterEquals` can differ between schedule and verify. Label `STATIC`.
3. Give the report a "Kotlin compile risk" list: the 5 places most likely to fail compilation, with your confidence for each.
Do not rewrite Kotlin beyond fixing real defects you find.

### T6. Traceability matrix (requirement -> code -> test)
Build a table in the final report. Every row needs `path:line` for the code and the exact test name. Rows:
1. Test B mute-state rule (any of three) and the 4 verdict outcomes.
2. Test A dual-track isolation: online probe track vs never-cached offline probe track (offline step must return `default`, not `local`).
3. Test A cache teardown: wait with timeout, `cacheCleanupPending` persisted, retried on next app launch, never deletes an entry that existed before the run.
4. Reboot detection mechanism (`last_device_boot_timestamp`, who writes it, who compares it).
5. Compare-and-restore: snapshot with hash before first write; per-key rule (equals-ours -> restore, equals-original -> nothing, else keep user value + `CONFLICT`); custom alarms: remove only this run's `diag_` ids, never restore the whole list.
6. Prayer guard: covers real athan times AND real custom alarms, from test start to end of Khushu duration + restore + 10 min margin.
7. Cleanup in 3 places: end of test, app start after kill, `AthanBootReceiver` on boot and `MY_PACKAGE_REPLACED`.
8. Ownership manifest of created `diag_<runId>_<n>` ids.
9. `PLAYBACK_STARTED` is never emitted for custom alarms.
10. T1, T2, T3 fixes.
Mark any row not fully implemented as `MISSING` or `PARTIAL` honestly.

### T7. Tests
- Add unit tests for: `isDiagAlarmId`; render filter (pure function if the component is hard to test: extract `filterUserVisibleAlarms()`); backup export strips `diag_`; backup restore strips `diag_`; scheduler skips/one-shots `diag_`; `audioStorage` guard (T4).
- Keep all existing tests green.
- Run and paste the **tail of the real output** for: `npm test` (with total counts), `npx tsc --noEmit`, and the web build you used before (`compile_applet`). Label `VERIFIED` only with real output.

### T8. Diagnostics and on-device test plan
Create `docs/review/DEVICE_TEST_PLAN.md` (for a human doing the tests from a phone, one step at a time, Arabic with English terms in backticks):
- Pre-flight checklist (battery optimization, exact alarm permission, DND access, not near a real prayer time, volume up, charged).
- Test A steps: online (expected `remote`, then confirm `downloaded_<id>` cleaned), offline with the never-cached track (expected `default`), offline with a cached track (expected `local`). For each step: what to tap, expected result, and what to copy back (the Markdown report from the copy button).
- Test B steps: control alarm vs Khushu alarm, the hearing question, what each verdict means, what to do on `INCONCLUSIVE`.
- Kill-app-mid-test scenario and reboot-mid-test scenario with expected cleanup.
- A "how to roll back" section: how to cancel a run, confirm no `diag_` alarm remains (in app UI and via `adb shell dumpsys alarm` filtered for the package, given as a separate single command), and confirm settings are restored.
- Commands for the PC later, **one per line, each in its own code block**, Windows `cmd` forms only (use `findstr`, never `grep`): `gradlew compileDebugKotlin`, `npm test`, `npx tsc --noEmit`.

### T9. Final deliverables (files, not chat)
Create these files and show them in Artifacts:

1. `docs/review/PHASE1_FINAL_REPORT.md` (Arabic prose, English identifiers in backticks) with sections:
   1. ملخص تنفيذي (5 lines max).
   2. Files changed: table of **every** file touched in this task and in Phase 1 (path, new/modified, one-line change, impact on the rest of the app). Take the list from your action history and from `git status`/`git diff --stat`; if they disagree, say so.
   3. Decisions you made where the prompt was ambiguous, with reasons.
   4. Traceability matrix (T6).
   5. Test and build results (T7) with the real output tails and the labels.
   6. Kotlin: changed ranges, `UNCOMPILED` warning, compile-risk list (T5).
   7. Risk register: each risk with severity, evidence `path:line`, mitigation, residual risk.
   8. Known limits and anything not implemented or not testable here.
   9. What the reviewer must check manually (max 10 items, most important first).
2. `docs/review/PHASE1_REVIEW_BUNDLE_v2.md`: complete, unabridged contents of **every file added or modified in Phase 1 or in this task** (including tests, `audioStorage.ts` diff, the Kotlin files in full or the changed functions with path and line range, `WorshipAlarms.tsx`/`BackupSettingsTab.tsx`/scheduler hunks). Each file: heading with exact path, line count, fenced code block with language tag. No `...` placeholders, no summarizing. Start with a table of contents.
3. `docs/review/DEVICE_TEST_PLAN.md` (T8).
4. `docs/review/PROGRESS.md` (checkpoints).

If the bundle is too large for one file, split it as `PHASE1_REVIEW_BUNDLE_v2_part1.md`, `_part2.md`, ... and list the parts in the report.

### Final chat reply (only this, nothing else)
- list of the 4 files with paths and line counts,
- test counts (`VERIFIED` only),
- one line each for: any `MISSING`/`PARTIAL` row, any reverted change, any `CANNOT VERIFY`.

Do not paste the reports in chat.
