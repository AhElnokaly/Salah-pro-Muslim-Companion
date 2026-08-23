# Hemmaty Code Index

Last updated: 2026-08-10

## React Application Core (`src/`)

### `src/App.tsx` (~1940 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `App` | 1-1940 | Main entry point layout, navigation tabs, global state hooks (`useSpiritualState`, `usePrayerScheduler`), overlays, headers, and footer bottom nav. Single source of truth for unified alarms & spiritual alerts. |

### `src/components/Dashboard.tsx` (~2912 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `Dashboard` | 1-2912 | Main home screen dashboard displaying prayer clock, next prayer, streak summary line, progress bars, and feature widgets. |

### `src/components/PrayerManager.tsx` (~2900 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `PrayerManager` | 1-2900 | Complete obligatory & sunnah prayer logger, duha/qiyam counters, and worship tracker. Consumes centralized `customAlarms` and `alerts` props. |

### `src/components/AdhkarTracker.tsx` (~850 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `AdhkarTracker` | 1-850 | 26 Adhkar categories, counter, custom tasbih button with configurable color palette. |

### `src/components/SmartFabSystem.tsx` (~640 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `SmartFabSystem` | 1-640 | Speed dial navigation grid, quick action completion pills, long-press spiritual search trigger. |

### `src/components/DuhaQuickLogModal.tsx` (~268 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `DuhaQuickLogModal` | 1-268 | Contextual bottom sheet modal for logging Duha prayer rakaat directly from sunrise card with sound test & educational guides. |

### `src/components/NightPrayersQuickLogModal.tsx` (~317 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `NightPrayersQuickLogModal` | 1-317 | Contextual bottom sheet modal for logging Qiyam, Shafi, Witr, and Taraweeh prayers directly from Isha card. |

### `src/components/WorshipAlarms.tsx` (~600 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `WorshipAlarms` | 1-600 | Custom alarm manager for prayer times, tahajjud, duha, and custom worship reminders. |

### `src/components/MoreSettings.tsx` (~2700 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `MoreSettings` | 1-2700 | Full app settings including muezzin selection, calculation methods, theme, location GPS, and 100% full JSON backup/restore with file upload. |

### `src/components/IslamicCalendar.tsx` (~450 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `IslamicCalendar` | 1-450 | Hijri & Gregorian monthly calendar, Islamic events, and fasting days. |

### `src/hooks/usePrayerScheduler.ts` (~520 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Hook | `usePrayerScheduler` | 1-520 | Rolling 60-day schedule generation with location-aware timezone offsets, background push dispatch, and custom alarms. |

### `src/hooks/usePrayerClock.ts` (~40 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Hook | `usePrayerClock` | 1-40 | Real-time ticking prayer clock, Hijri/Gregorian formatted strings, and next prayer calculation. |

### `src/hooks/useAthanPlayer.ts` (~465 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Hook | `useAthanPlayer` | 1-465 | Audio playback management, muezzin selection, fallback cascade, and dismiss tracking. |

### `src/components/QuranTracker.tsx` (~930 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `QuranTracker` | 1-930 | Full Quran reader, khatma completion planner, spaced-repetition memorization, and Hijri year attribution. |

### `src/components/AdhkarTracker.tsx` (~2280 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `AdhkarTracker` | 1-2280 | 7 daily dhikr stations segmented progress bar, situational adhkar catalog, electronic tasbih counter, and custom dhikr manager. |

### `src/components/SmartAdhkarSuggestions.tsx` (~340 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `SmartAdhkarSuggestions` | 1-340 | Contextual Dhikr recommendation engine based on time of day, active prayer, and spiritual state. |

### `src/components/FastingTracker.tsx` (~750 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `FastingTracker` | 1-750 | Ramadan makeup (Qada) plan slider, Sunnah/White days recommendations, Imsak/Iftar countdown, and forbidden days protection. |

### `src/components/IslamicCalendar.tsx` (~840 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `IslamicCalendar` | 1-840 | Hijri/Gregorian interactive calendar grid, moon phase tracking, historical worship logs, and weekly/monthly progress breakdown. |

### `src/components/AnalyticsDashboard.tsx` (~845 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `AnalyticsDashboard` | 1-845 | Comprehensive spiritual metrics, feature praise indicators, smart nudges, and engagement tier badges. |

## Hooks (`src/hooks/`)
- `useSpiritualState.ts` (~260 lines): Global reactive state hook for prayers, fasting, dhikr, Quran logs, and settings.
- `usePrayerClock.ts` (~120 lines): Accurate prayer calculation and real-time countdown timer.
- `useAndroidBackButton.ts` (~70 lines): Native hardware back button navigation & double-tap to exit.

## Utilities (`src/utils/`)
- `vite-env.d.ts`: Ambient TypeScript definitions for Vite static assets (.jpg, .png, .svg, .mp3).
- `prayerDayBoundary.ts` (~80 lines): Deprecated `getAppPrayerDay`; exports unified `formatDateKey`, `getDateFromPrayerDay`, and date manipulation helpers.
- `hijri.ts` (~118 lines): Umm al-Qura Hijri date calculation, day names, and formatting.
- `storage.ts` (~60 lines): Resilient `safeSetItem` local storage wrapper handling quota limits.

## Native Android Layer (`android/app/src/main/`)
- `MainActivity.kt`: Native Capacitor activity entry point with plugin registration.
- `plugins/AthanAlarmPlugin.kt`: Capacitor native plugin for scheduling exact alarms, widget syncing, and Android 13+ `POST_NOTIFICATIONS` runtime permission bridge.
- `plugins/AthanAlarmReceiver.kt` & `AthanForegroundService.kt`: AlarmManager broadcast receiver and foreground service playing offline full athan voice recordings.
- `ScheduleRenewalWorker.java`: WorkManager background worker renewing offline prayer notification schedules.
- `res/values/strings.xml`: Application name strings (`app_name`: "هِمَّتِي Hemmaty").
