# Hemmaty (هِمَّتِي) Fix Backlog — State

Last updated: 2026-08-15
Current task: Release Hardening (Task 51: Gradle Wrapper & CI Pipeline)
Status: done

## Completed
- [x] Task 1 — safeSetItem wrapper and storageWriteError handling — commit [Task 1]
- [x] Task 2 — Apply safeSetItem wrapper to all remaining localStorage call sites — commit [Task 2]
- [x] Task 3 — [SERIOUS] Fix root-level RTL and lang attributes — commit [Task 3]
- [x] Task 4 — [SERIOUS] Replace hardcoded left/right Tailwind classes with logical properties — commit [Task 4]
- [x] Task 5 — [SERIOUS] Replace `as any` tab-navigation casts with a shared typed union — commit [Task 5]
- [x] Task 8 — [SERIOUS] Stop auto-requesting notification permission on load — commit [Task 8]
- [x] Task 9 — [SERIOUS] Fix audio event listener accumulation in the athan player — commit [Task 9]
- [x] Task 11 — [CRITICAL] Fix PWA manifest and icon paths for GitHub Pages subpath deployment — commit [Task 11]
- [x] Task 12 — [SERIOUS] Add a top-level Error Boundary — commit [Task 12]
- [x] Task 17 — [CRITICAL] Runtime check + user flow for exact alarm permission — commit [Task 17]
- [x] Task 18 — [SERIOUS] Extend scheduling window to 30 days — commit [Task 18]
- [x] Task 19 — [SERIOUS] WorkManager job to renew the rolling window offline — commit [Task 19] *(Correction note: see Task 25. The original implementation re-scheduled existing alarms but did not extend the rolling window; it only notified the user to open the app, which does not meet the offline-renewal requirement.)*
- [x] Task 20 — [SERIOUS] Location cache to avoid recomputing on return to a known location — commit [Task 20]
- [x] Task 21 — [CRITICAL] Athan overlay reopens after user dismisses it — commit [Task 21]
- [x] Task 22 — [CRITICAL] Reducing khatma progress manually doesn't reduce logged Quran sessions — commit [Task 22]
- [x] Task 23 — [ENHANCEMENT] Professional integration of Adhkar System (26 categories, search engine, filter pills, copy & font size controls) — commit [Task 23]
- [x] Task 24 — [CRITICAL] Set up real release signing for the APK — commit [Task 24]
- [x] Task 25 — [CRITICAL] Correction: make ScheduleRenewalWorker actually extend the schedule offline — commit [Task 25]
- [x] Task 26 — [SERIOUS] Proper Android hardware back-button navigation — commit [Task 26]

- [x] Task 27 — [CRITICAL] Update app name in capacitor.config.ts, manifest.json, strings.xml, index.html — commit [Task 27]
- [x] Task 28 — [CORRECTION] Keep "هِمَّتِي" (fatha on shadda) everywhere — commit [Task 28]
- [x] Task 29 — [MINOR] Remove dead title attribute and group-hover tooltip div in SmartFabSystem.tsx — commit [Task 29]
- [x] Task 30 — [SERIOUS] Add Alarms shortcut to FAB grid layout and header — commit [Task 30]
- [x] Task 31 — [SERIOUS] Contextual inline quick-log sheets for Duha and Night Prayers — commit [Task 31]
- [x] Task 32 — [MINOR] Rename "go to sunnah" button to "اذهب لتسجيل السنن ☀️" — commit [Task 32]
- [x] Task 33 — [MINOR] Remove CompanionInsights component — commit [Task 33]
- [x] Task 34 — [MINOR] Replace removed card with streak summary line in Dashboard — commit [Task 34]
- [x] Task 35 — [MINOR] Tasbih button color customization with persistence — commit [Task 35]
- [x] Task 36 — [SERIOUS] Establish and maintain CODE_INDEX.md — commit [Task 36]
- [x] Task 37 — [CRITICAL] Rename every remaining user-visible occurrence of "رفيق المسلم" / "Salah Pro" — commit [Task 37]
- [x] Task 38 — [SERIOUS] Open interactive prayer log modal on FAB "اتممت صلاة" button click — commit [Task 38]
- [x] Task 39 — [CRITICAL] Reorder React hooks in Dashboard.tsx to strictly follow Rules of Hooks and prevent invalid hook call error — commit [Task 39]
- [x] Task 40 — [UI] Upgrade 7 Daily Dhikr Stations Bar UI with responsive mobile strip, badges, tap animations, and overall progress indicator — commit [Task 40]
- [x] Task 41 — [FEATURE] Upgrade Worship Alarms & Reminders system with 1-tap spiritual presets, master volume control, expanded vocal Islamic audio modes (Takbeer, Alsalatu Khayr, Salawat, Istighfar) — commit [Task 41]
- [x] Task 42 — [CRITICAL] Revert "Fajr-to-Fajr" day logic to standard midnight-to-midnight date across app + Implement "Did you forget to log a prayer?" yesterday banner — commit [Task 42]
- [x] Task 43 — [CRITICAL] Fix blank white screen in Chrome preview by updating Service Worker fetch strategy to Network-First and removing legacy SPA redirect script from index.html — commit [Task 43]
- [x] Task 44 — [RUNTIME/PREVIEW] Fix runtime boot and module evaluation by removing risky Storage prototype mutation in main.tsx, configuring dynamic Vite base, adding src/vite-env.d.ts, and establishing safe mounting fallback — commit [Task 44]
- [x] Task 45 — [STABILIZATION/PRAYER & ALARMS] Parity and stabilization of prayer times calculations with location-aware timezone offsets across 60-day schedule loop, clock hooks, and trackers + eliminate remaining UTC toISOString date key drift + high-res notification icons — verified by AI Tester
- [x] Task 46 — [STABILIZATION/QURAN TRACKER] Unify Quran khatmat, memorization routines, and spaced-repetition juz review sessions to local midnight date keys (formatDateKey) across QuranTracker & MemorizationTab — verified by AI Tester
- [x] Task 47 — [STABILIZATION/ADHKAR & STATIONS] Audit and verify 7 Daily Stations completion tracking, electronic masbaha persistence, audio/vibration feedback synthesis, and Smart Dhikr suggestions — verified by AI Tester
- [x] Task 48 — [STABILIZATION/FASTING & CALENDAR] Stabilize Fasting & Ramadan Qada trackers, Hijri calendar events, and unified date keys across Dashboard & MoreSettings — verified by AI Tester
- [x] Task 49 — [STABILIZATION/ANDROID 13+ NOTIFICATIONS] Implement runtime POST_NOTIFICATIONS permission request bridge in AthanAlarmPlugin and integrate across App.tsx, PrayerManager, WorshipAlarms & PushNotificationService — verified by AI Tester
- [x] Task 50 — [STABILIZATION/FULL BACKUP & RESTORE] Upgrade backup & restore engine to export and restore 100% of application state (27 religious datasets and preference keys) with native JSON file picker and text paste support — verified by AI Tester
- [x] Task 51 — [RELEASE HARDENING/GRADLE & CI] Replace corrupted gradle-wrapper.jar with valid official wrapper binary, verify archive integrity (unzip -t 0 errors), enforce strict npm ci in CI workflows, add zipalign/apksigner verification and SHA-256 generation — verified by AI Tester
- [x] Task 52 — [STABILIZATION/CUSTOM ALARMS UNIFICATION] Unify `customAlarms` and `alerts` states into a single source of truth in `usePrayerScheduler.ts` passed cleanly to `PrayerManager`, `WorshipAlarms`, and `KhushuQiyamTracker`, eliminating isolated duplicates and ensuring instant reactive synchronization across screens — verified by AI Tester
- [x] Task 53 — [ASSETS/IMAGE RESTORATION & INTEGRATION] Identified and replaced all corrupted binary image files in `public/`, `src/assets/images/`, and Android mipmap/splash resources with pristine, high-resolution valid Web & App assets (Logo, Mosque Banners, Friday Backdrop, Dark Gold Backdrop, Light Mosque, and Icons) — verified by AI Tester
- [x] Image Integration — [ASSET] Integrate official high-res "هِمَّتِي" logo icon across web & Android app resources — commit [Task Logos]

## In Progress / Backlog Tasks
- None

## Blocked / needs input
- None

## Attempt log (current task only)
- Task 51 Release Hardening & Verification:
  - Downloaded and installed official valid `android/gradle/wrapper/gradle-wrapper.jar` (43,583 bytes; SHA-256: `2db75c40782f5e8ba1fc278a5574bab070adccb2d21ca5a6e5ed840888448046`).
  - Ran `unzip -t android/gradle/wrapper/gradle-wrapper.jar` confirming: "No errors detected in compressed data".
  - Enforced strict `npm ci` across `.github/workflows/build-apk.yml`, `.github/workflows/build-release-apk.yml`, and `.github/workflows/deploy.yml`.
  - Added Gradle wrapper integrity step, zipalign verification, apksigner verification, and SHA-256 checksum generation/upload in CI pipelines.
  - Verification: `tsc --noEmit` passed with 0 errors, `compile_applet` passed, and `npx cap sync android` completed.


