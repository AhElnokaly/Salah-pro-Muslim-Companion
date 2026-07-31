# Salah Pro Fix Backlog — State

Last updated: 2026-07-31
Current task: 5 — [SERIOUS] Replace `as any` tab-navigation casts with a shared typed union
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

## Recovered / Remaining Backlog Tasks
- [x] Task 3 — [SERIOUS] Fix root-level RTL and lang attributes — commit [Task 3]
- [x] Task 4 — [SERIOUS] Replace hardcoded left/right Tailwind classes with logical properties — commit [Task 4]
- [x] Task 5 — [SERIOUS] Replace `as any` tab-navigation casts with a shared typed union — commit [Task 5]
- Task 6 — [SERIOUS] Enable TypeScript strict mode incrementally — report only (not started)
- Task 7 — [MINOR] Cleanup pass (not started)
- Task 10 — [SERIOUS] Add aria-labels to icon-only interactive controls (not started)
- Task 14 — [MINOR] Standardize localStorage key naming (not started)
- Task 15 — [MINOR] Revoke the Blob URL used for the background scheduling Web Worker (not started)
- Task 16 — [SERIOUS] Reduce production bundle size (not started)

## Blocked / needs input
- None

## Attempt log (current task only)
- Attempt 1: Created `TabId`, `SettingsSubTabId`, `ClockFace`, and `AlarmSoundType` union types in `src/types.ts`. Replaced all `as any` casts tied to tab navigation, subtab switching, clock faces, and alarm sound types in `src/App.tsx` and `src/components/PrayerManager.tsx` with strongly typed union references or explicit casts. Verified `grep -rn "as any" src/App.tsx src/components/PrayerManager.tsx` returns 0 tab/navigation casts (only 1 vendor AudioContext cast remains). `tsc --noEmit` and `compile_applet` both succeeded.

