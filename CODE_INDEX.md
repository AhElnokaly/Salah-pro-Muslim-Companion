# Hemmaty Code Index

Last updated: 2026-08-31

## React Application Core (`src/`)

### `src/App.tsx` (~493 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `App` | 1-493 | Main entry point layout, navigation tabs, global state hooks (`useSpiritualState`, `usePrayerScheduler`), overlays, headers, and footer bottom nav. Kept strictly under 500 lines as a pure coordinator. |
| Hook | `src/components/app/useAppPermissionsAndAlerts.ts` | 1-170 | Notification & exact alarm permissions, progressive StorageFacade migration, online/offline status, GPS sync, toast auto-dismiss timer, and sharing. |
| Hook | `src/components/app/useAppGlobalEvents.ts` | 1-188 | Global event bus, deep links, Service Worker triggers, URL parameters, quick logs. |
| Hook | `src/components/app/useAppSync.ts` | 1-118 | Audio pre-cache, schedule synchronization, theme sync, and fiqh fasting validation. |

### `src/components/Dashboard.tsx` (~492 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `Dashboard` | 1-492 | Main home screen dashboard coordinator composed of sub-blocks (ClockBlock, NextPrayerBlock, SunnahQuoteBlock, etc.), streak summary, and feature widgets. |
| Hook | `src/components/dashboard/useDashboardTimeAndPrayers.ts` | 1-96 | Time, hijri/gregorian date, prayer calculation, and dynamic mosque backdrop determination. |
| Component | `src/components/khushu/DashboardKhushuModals.tsx` | 1-76 | Unified container for Khushu Mode sheet, distraction shield, and post-prayer adhkar modal. |
| Component | `src/components/dashboard/DashboardDailyShortcuts.tsx` | 1-84 | Daily actionables container (Nafilah tracker, Custom Duas, Active Nudge, Fasting shortcut). |
| Hook | `src/components/dashboard/useDashboardBlockSharedProps.ts` | 1-96 | Encapsulates shared props logic for main prayer card sub-blocks. |

### `src/components/PrayerManager.tsx` (~475 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `PrayerManager` | 1-475 | Complete obligatory & sunnah prayer coordinator composed of modular subviews (`PrayerTimesView`, `PrayerWorshipView`, `PrayerQadaView`). Handles Android back button integration. |

### `src/components/AdhkarTracker.tsx` (~690 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `AdhkarTracker` | 1-690 | Core coordinator for 7 Daily Stations, tab switching, and orchestration of modular adhkar subviews. |

### `src/components/MoreSettings.tsx` (~220 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `MoreSettings` | 1-220 | Modular settings coordinator managing tabs for Location, Prayer, Adhan, Theme, Calendar, Qada, Backup, and Dashboard sections. |

### `src/components/QuranTracker.tsx` (~451 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `QuranTracker` | 1-451 | Full Quran reader, khatma completion planner, spaced-repetition memorization, Android back integration, and Hijri year attribution. |

### `src/components/FastingTracker.tsx` (~392 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `FastingTracker` | 1-392 | Ramadan makeup (Qada) plan slider, Sunnah/White days recommendations, Imsak/Iftar countdown, and forbidden days protection. |

### `src/components/IslamicCalendar.tsx` (~231 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `IslamicCalendar` | 1-231 | Hijri/Gregorian interactive calendar grid, moon phase tracking, historical worship logs, and weekly/monthly progress breakdown. |

### `src/components/AnalyticsDashboard.tsx` (~164 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `AnalyticsDashboard` | 1-164 | Comprehensive spiritual metrics, feature praise indicators, smart nudges, and engagement tier badges. |

### `src/components/UnifiedProgressCard.tsx` (~310 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `UnifiedProgressCard` | 1-310 | 5-tier unified worship index (salah, sunnah, adhkar, fasting, quran) with period selector (daily/weekly/monthly/all). |
| Component | `src/components/progress/ProgressRowItem.tsx` | 1-70 | Single categorized worship card with badge pill, SVG ring, on-time vs late indicators, and tab navigation. |
| Component | `src/components/progress/CircularProgressRing.tsx` | 1-120 | Dual-arc SVG circular completion ring rendering on-time (emerald) and late (amber) progress segments smoothly. |

### `src/components/FridayMode.tsx` (~243 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `FridayMode` | 1-243 | Friday ambiance hub hosting Kahf reading, Hour of Acceptance alerts, Sunnah checklist, and Salawat counter. |
| Component | `src/components/friday/FridayKahfCard.tsx` | 1-60 | Surah Al-Kahf quick read toggle card with direct deep-link into the Quran reader. |
| Component | `src/components/friday/FridayHourOfDuaAlert.tsx` | 1-85 | Golden Hour of Acceptance alert (last hour before Maghrib) with curated copyable Friday supplications. |
| Component | `src/components/friday/FridaySunnahChecklist.tsx` | 1-90 | Interactive Friday Sunnah checklist (Ghusl, perfume, Kahf, early attendance, dua) with live progress bar. |
| Component | `src/components/friday/FridaySalawatCounter.tsx` | 1-95 | Interactive Prophet Salawat counter with tiered goals (100, 300, 500, 1000), haptics, audio, and encouragement. |


### `src/hooks/usePrayerScheduler.ts` (~500 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Hook | `usePrayerScheduler` | 1-500 | Rolling 60-day schedule generation with location-aware timezone offsets, background push dispatch, and custom alarms. |

### `src/hooks/useAthanPlayer.ts` (~514 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Hook | `useAthanPlayer` | 1-514 | Audio playback management, muezzin selection, blob memory cleanup, stall timeouts, fallback cascade, and dismiss tracking. |

### `src/services/AlarmReconciliationService.ts` (~140 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Service | `AlarmReconciliationService` | 1-140 | Background alarm matching using timezone-accurate astronomical prayer times, prayer offsets, and native notifications. |

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

### `src/components/AdhkarTracker.tsx` (~685 lines)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `AdhkarTracker` | 1-685 | Core coordinator for 7 Daily Stations, tab switching, and orchestration of modular adhkar subviews. |

### `src/components/adhkar/` (Modular Adhkar Suite)
| Type | Name | Lines | Key Responsibilities & Deps |
|------|------|-------|-----------------------------|
| Component | `AdhkarHubView` | ~460 | 5-section interactive Hub, global full-text search engine, and level-2 circular subcategories. |
| Component | `DhikrFavoritesView` | ~260 | Persistent favorite dhikrs and favorite categories view with quick-access cards and action controls. |
| Component | `DhikrCategoryDetailView` | ~160 | Selected category coordinator managing StepCard, ListView, Header, and Celebration. |
| Component | `DhikrCategoryHeader` | ~220 | Category navigation bar, view toggle, font size switcher, and post-prayer tabs. |
| Component | `DhikrStepCard` | ~240 | Interactive step-by-step card with tap-to-count, progress wheel, and particle effects. |
| Component | `DhikrListItem` | ~150 | Compact scrollable list item with counter controls, copy, and favorite toggles. |
| Component | `DhikrCelebration` | ~50 | Khatm/completion reward celebration card with interactive return button. |
| Component | `SevenSegmentProgressBar` | ~120 | Visual 7-segment progress bar representing the daily prayer and adhkar stations. |
| Component | `ElectronicTasbeeh` | ~200 | Interactive digital masbaha with presets, custom dhikr creation, and vibration. |
| Component | `AdhkarFocusModal` | ~150 | Fullscreen distraction-free dhikr recitation overlay. |

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
- `useSpiritualState.ts` (~260 lines): Global reactive state hook for prayers, fasting, dhikr, Quran logs, and settings — fully wired to `StorageFacade` repository with instant zero-flash sync boot and resilient background IndexedDB persistence.
- `usePrayerClock.ts` (~120 lines): Accurate prayer calculation and real-time countdown timer.
- `useAndroidBackButton.ts` (~70 lines): Native hardware back button navigation & double-tap to exit.

## Utilities (`src/utils/`)
- `uuid.ts` (~40 lines): Resilient `safeUUID()` multi-tier generator (RFC4122 v4) preventing crashes on older WebViews and non-secure execution contexts.
- `moonPhases.ts` & `moonPhase.ts` (~105 lines): Unified astronomical Hijri moon phase calculation with backward-compatible phase alias and full information models.
- `vite-env.d.ts`: Ambient TypeScript definitions for Vite static assets (.jpg, .png, .svg, .mp3).
- `prayerDayBoundary.ts` (~80 lines): Deprecated `getAppPrayerDay`; exports unified `formatDateKey`, `getDateFromPrayerDay`, and date manipulation helpers.
- `hijri.ts` (~118 lines): Umm al-Qura Hijri date calculation, day names, and formatting.
- `storage.ts` (~60 lines): Resilient `safeSetItem` local storage wrapper handling quota limits.

## Domain Architecture (`src/domain/`)
- `notifications/UnifiedNotificationOrchestrator.ts` (~120 lines): Single-ingress orchestrator coordinating 30-day SW sync, native exact AlarmManager reconciliation, individual prayer cancellation, and home screen widget data sync.
- `storage/StorageFacade.ts` (~190 lines): Multi-tier dual-sync storage repository connecting IndexedDB and canonical local storage keys (`CANONICAL_STORAGE_KEYS`) with full entity CRUD, QuotaExceeded protection, and zero-flash sync read helpers.
- `quran/AdaptiveKhatmaCalculator.ts` (~60 lines): No-guilt adaptive Quran calculation engine adjusting daily pages smoothly upon missed intervals.

## Services (`src/services/`)
- `AlarmReconciliationService.ts` (~140 lines): State reconciliation service computing true diffs (missing, obsolete, retained) between desired prayers and scheduled native alarms.
- `NotificationScheduler.ts` (~160 lines): Multi-channel notification and test alarm dispatcher with Web Worker timeout tracking.
- `athanAlarmPlugin.ts` (~345 lines): Capacitor bridge and web simulation fallback for native Android Athan alarms, home screen widgets, and Battery Optimization bypass (`checkBatteryOptimization`, `requestIgnoreBatteryOptimization`).

## Constants & Configuration (`src/config/` & `src/constants/`)
- `config/defaultSettings.ts` (~66 lines): Canonical comprehensive application configuration and default settings object (`DEFAULT_APP_SETTINGS`).
- `constants/defaultSettings.ts`: Canonical unified re-export pointing directly to `DEFAULT_APP_SETTINGS`.

## Native Android Layer (`android/app/src/main/`)
- `MainActivity.kt`: Native Capacitor activity entry point with plugin registration.
- `plugins/AthanAlarmPlugin.kt` (~600 lines): Capacitor native plugin for scheduling exact alarms, battery optimization exemption, widget syncing, and Android 13+ `POST_NOTIFICATIONS` runtime permission bridge.
- `plugins/AthanAlarmReceiver.kt` & `AthanForegroundService.kt` (~220 lines): AlarmManager broadcast receiver and foreground service playing offline full athan voice recordings with lockscreen `fullScreenIntent`, Doze Mode WakeLock, and Ringtone fallback.
- `ScheduleRenewalWorker.java`: WorkManager background worker renewing offline prayer notification schedules.
- `res/values/strings.xml`: Application name strings (`app_name`: "هِمَّتِي Hemmaty").

## CI/CD Workflows & Build Automation (`.github/workflows/` & Scripts)
- `.github/workflows/build-release-apk.yml`: Signed Release APK builder running on Java 17, clean `npm ci`, quality gates with `npm test`, strict `zipalign` 4-byte boundary verification, and `apksigner` cryptographic verification.
- `.github/workflows/build-apk.yml`: Debug APK builder on pushes and PRs running Java 17, clean `npm ci`, and `npm test` gate.
- `.github/workflows/deploy.yml`: GitHub Pages automated PWA deployment pipeline with concurrency management and lint gates.
- `build_apk.sh` & `build_apk.bat`: One-click local APK build scripts with type-checking, Capacitor sync, Gradle packaging, and SHA-256 verification.

## Automated Test Suite (`src/**/*.test.ts`)
- `src/utils/prayerCalc.test.ts`: Verification of Egyptian and international prayer calculations, Hanafi vs Standard Asr offsets, minute arithmetic, and Friday Dhuhr localization.
- `src/domain/quran/AdaptiveKhatmaCalculator.test.ts`: Tests for 30-day Quran pace, auto-extension catch-up thresholds, and encouragement tier logic.
- `src/domain/storage/StorageFacade.test.ts`: Tests for canonical storage keys, resilient fallback handling, and zero-flash sync read/write.
- `src/domain/notifications/AlarmIdentifier.test.ts`: Tests for deterministic Android Int32 request codes, minute bucketing, and prayer isolation.

## Accessibility (A11y) & Screen Reader Architecture (`src/components/`)
- `QiblaCompass.tsx` & `qibla/QiblaReadingsPanel.tsx`: Dynamic screen reader live region (`role="status"`, `aria-live="polite"`) delivering turn-by-turn degree direction and alignment announcements for visually impaired users.
- `SmartFabSystem.tsx` & `fab/FabRadialMenu.tsx`: WAI-ARIA speed-dial menu implementation with `aria-haspopup="menu"`, `aria-expanded`, `role="menuitem"`, and descriptive action labels.
- `layout/AppBottomNav.tsx`: Bottom navigation bar with `aria-current="page"`, descriptive labels, and keyboard-accessible modal backdrops.
- `dashboard/MainPrayerCardContainer.tsx` & `MainPrayerCardPrayersRow.tsx`: Semantic `role="region"`, `role="list"`, `aria-current="time"` on the active prayer, and WCAG AA 4.5:1 text contrast.
- `dashboard/blocks/NextPrayerBlock.tsx`: Real-time countdown timer with `role="timer"` and `aria-live="polite"`.

## Modular Quick Log Architecture (`src/components/prayer/quickLog/`)
- `PrayerQuickLogModal.tsx`: Slim orchestrator modal component (<240 lines) coordinating prayer logging, sunnah, night prayers, and contextual gateways.
- `PrayerObligatorySelector.tsx`: Obligatory prayer status selector (in-time, late, missed, excused) with full keyboard & screen reader support.
- `PrayerSunnahRow.tsx`: Sunnah prayers stepper row with decrement, increment, and full completion toggle.
- `PrayerNightPrayersSection.tsx`: Night prayers companion section for Isha (Witr, Qiyam) with direct modal expansion triggers.
- `PrayerContextualGateways.tsx`: Post-prayer contextual gateway for morning/evening adhkar and instant missed prayer offset (-1).

## Modular Spiritual Search Architecture (`src/components/search/`)
- `SpiritualSearchModal.tsx`: Unified spiritual search orchestrator querying Quran, Adhkar, Prayers, and Events dynamically.
- `SearchHeaderInput.tsx`: Search input box with clear action, category filter chips (all, quran, adhkar, prayers, events), and keyboard accessibility.
- `SearchDiscoverySection.tsx`: Zero-query discovery screen featuring persistent recent search history with clear button, popular quick suggestions, and 4-tier domain navigation shortcuts.
- `SearchResultCard.tsx`: Rich result display card supporting direct audio speech synthesis (`playSpiritualSpeech`), clipboard copy, and tab switching.

## Modular Prayer Management Architecture (`src/components/prayer/`)
- `PrayerManager.tsx`: Main prayer tab orchestrator (<190 lines) delegating views to `PrayerTimesView` and `PrayerWorshipView`.
- `usePrayerManagerLogic.ts`: Dedicated domain hook managing calculation times, prayer status mutations, sunnah/nafilah tracking, qada list synchronizations, and Android back button handlers.
- `PrayerManagerHeader.tsx`: Top subtab bar switcher (times vs. worship) with dynamic badge counters and polite toast status announcements.

## Modular Quran Memorization Architecture (`src/components/quran/memorization/`)
- `MemorizationTab.tsx`: Quran memorization and review orchestrator (<280 lines) coordinating daily progress, spaced repetitions, and active routines.
- `DailyQuickMemorizationCard.tsx`: Fast toggle card for daily new memorization and review status with current date display.
- `SpacedReviewAlert.tsx`: Intelligent spaced repetition notification calculating intervals since last review to suggest optimal revision parts.
- `MemorizationMapGrid.tsx`: Interactive 30-Juz status map displaying color-coded states (memorized, needs review, not started) with status legend.
- `ActiveRoutinesSection.tsx`: Routine management section rendering scheduled memorization/review plans with reminder days, time badges, verse card sharing, and deletion actions.

## Modular Feature Tour Architecture (`src/components/tour/` & `src/data/featureTourData.ts`)
- `featureTourData.ts`: Central data registry defining all 9 interactive tour steps, badges, highlight bullets, category tags, and contextual tips.
- `FeatureTourModal.tsx`: Lightweight orchestrator (<90 lines) managing step transitions, keyboard shortcuts, and deep-link navigations.
- `TourHeaderBanner.tsx`: Step progress badge, dynamic gradient branding, and accessible modal dismissal button.
- `TourStepBody.tsx`: Formatted descriptions, highlight checklist icons, and gold tip callout box.
- `TourFooterControls.tsx`: Accessible step dot tabs (`role="tablist"`), direct feature shortcut trial, back button, and next/finish action.

## Modular Adhan Settings Architecture (`src/components/settings/adhan/`)
- `AdhanSettingsTab.tsx`: Slim settings coordinator (<200 lines) connecting playback UI, storage statistics, and muezzin libraries.
- `useAdhanAudioLogic.ts`: Central domain hook managing HTML5 audio preview, scrubbing, volume synchronization, single and batch offline downloading, and cleanup.
- `AdhanAudioPlaybar.tsx`: Interactive bottom scrubber bar with playback speed, seek slider, and skip actions.
- `OfflineStorageCard.tsx`: Storage quota status, offline cache counts, and batch-download trigger.
- `MuezzinSelectionSection.tsx`: Searchable muezzin lists (default and archive) with play preview and offline cache actions.
- `IndividualPrayerToggles.tsx`: Granular per-prayer adhan notification switches.

## Modular Feature Discovery Architecture (`src/components/discovery/`, `src/data/`)
- `FeatureDiscoveryWidget.tsx`: Lightweight widget entry point (85 lines) orchestrating bubble dismissal state, tip carousel index, and modals.
- `src/data/featureDiscoveryData.ts`: Central catalog of all 10 application capabilities, badges, icons, gradients, and bullet points.
- `DiscoveryBubble.tsx`: Ambient speech bubble with smooth entering animations, interactive tip stepper, and direct shortcut action.
- `FullCatalogModal.tsx`: Searchable and categorized multi-service catalog modal with category pills, live filter, and action launchers.

## Modular Adhkar Hub Architecture (`src/components/adhkar/hub/`)
- `AdhkarHubView.tsx`: Slim coordinator component (88 lines) orchestrating header search, results mode, level-1 main categories, and level-2 sub-categories.
- `AdhkarHubHeader.tsx`: Responsive header with real-time keyword search, clear action, and sound-effect toggle.
- `AdhkarSearchResultsList.tsx`: Keyword match counter, favorite star toggles, reward callout boxes, and direct category jump.
- `AdhkarMainSectionsGrid.tsx`: Level-1 cards for daily adhkar, duas, ruqyah, interactive tasbeeh, and Hisn al-Muslim index.
- `AdhkarSubCategoriesView.tsx`: Level-2 view featuring emerald header banner, category counter, and circular visual category cards.

## Modular Quran Tracker Architecture (`src/components/quran/`)
- `QuranTracker.tsx`: High-level tab coordinator connecting Khatma, Memorization, and History tabs with Verse Card Maker launcher.
- `useQuranTrackerLogic.ts`: Dedicated hook managing active khatma state, annual goals, Android back navigation, and modal dialog states.
- `KhatmaMainTab.tsx`: Primary tab containing AnnualGoalCard, KhatmaActiveCard, and new khatma initiation trigger.
- `QuranModalsContainer.tsx`: Centralized container managing AnnualGoalModal, CreateKhatmaModal, UpdatePageModal, CatchUpModal, KhatmaCelebrationModal, AttributionChoiceModal, and VerseCardMaker popup.

## Modular Widget Simulator Architecture (`src/components/widgets/`)
- `WidgetSimulator.tsx`: High-level widget studio shell orchestrating header controls, custom widget studio control panel, and phone mockup preview.
- `WidgetControls.tsx`: Neo-Minimalist custom widget studio configuration panel supporting 3 card sizes (compact, medium, large), 4 ambient themes, and modular feature toggles (khushu mode, adhkar, ayah, qibla, date).
- `CustomModularWidget.tsx`: Single customizable home screen widget with frosted glass aesthetic, responsive sizing, live countdown timer, and quick khushu mode trigger.
- `simulator/SimulatorCustomWidget.tsx`: Live-rendered phone mockup custom widget replicating the frosted glass card with interactive subha counter, khushu mode simulation, and prayer timeline.
- `useWidgetSimulatorLogic.ts`: Comprehensive hook managing card size, clock hands math, prayer progress, live countdown, SVG download generator, and local persistence.
- `WidgetSimulatorHeader.tsx`: Responsive header featuring visual lab icon, description, and interactive 5-wallpaper selector palette.
- `WidgetPhoneFrame.tsx`: 9/16 aspect ratio smartphone container with Dynamic Island/notch, status bar, centered live widget, and launcher dock.

## Automated Testing Suites (`src/utils/`, `src/services/`, `src/domain/`, `src/components/widgets/`)
- `src/components/widgets/CustomModularWidget.test.ts`: Automated tests (4 suites, 60 total assertions) covering custom modular widget SVG generation, ambient theme palette consistency, analog clock dial degree rotations, and responsive cardSize adaptation (compact, medium, large).
- `src/domain/khushu/Khushu.test.ts`: Automated test suite for Khushu 2.0 configuration, cross-environment localStorage serialization, and distraction shield dismissal session persistence.
- `src/utils/hijri.test.ts`: Automated tests (18 assertions across 5 suites) for Eastern Arabic numerals (`toArabicNumbers`), Hijri calendar calculations (`getHijriDate`), Sharia fasting forbidden days (`isForbiddenFastDay`), Arabic dual/plural grammar (`formatArabicDayCount`), and uniform calendar boundary functions (`formatDateKey`, `getDateFromPrayerDay`).
- `src/utils/prayerCalc.test.ts`: Automated tests (6 suites) for Cairo prayer calculations, Hanafi vs Standard Asr comparison, manual prayer offsets, Arabic numerals parsing, and Friday detection.
- `src/services/alarmIdentifier.test.ts`: Deterministic Android 32-bit integer request code generation and collision avoidance tests.
- `src/services/adaptiveKhatmaCalculator.test.ts`: No-guilt khatma pace calculation, automatic extension, and tier-based encouragement tests.
- `src/services/storageFacade.test.ts`: Canonical storage keys, stable prefixes, fallbacks, and synchronous persistence tests.

## Khushu Mode 2.0 Architecture (`src/domain/khushu/`, `src/components/khushu/`)
- `src/domain/khushu/khushuTypes.ts`: Strict TypeScript interfaces for `KhushuSettings`, `KhushuPrayerDurations`, `KhushuIqamaOffsets`, and default settings.
- `src/domain/khushu/khushuStorage.ts`: Environment-safe persistent storage facade (`getStorage()`) supporting cross-platform web preview and headless test environments.
- `src/domain/khushu/useKhushuAutoScheduler.ts`: Autonomous scheduler monitoring Iqama time offsets and Friday Jumu'ah overrides, auto-triggering Khushu mode during prayer times.
- `src/components/khushu/KhushuDistractionShield.tsx`: Deep OLED dark backdrop with pulsating focus indicator, remaining time, dhikr reminder, and dismiss action.
- `src/components/khushu/KhushuPostPrayerModal.tsx`: Post-prayer tranquil modal offering quick Sunnah athkar (Astaghfirullah x3, Allahumma Antas Salam, Ayat al-Kursi, Tasbeeh) with haptic feedback.
- `src/hooks/useKhushuMode.ts`: Master orchestration hook coordinating native plugin status, permissions, shield visibility, and post-prayer workflows.
- `src/components/KhushuModeSheet.tsx`: Comprehensive bottom sheet UI for mode toggles, duration overrides, Iqama auto-scheduling, emergency bypass, and post-prayer athkar preferences.

## Native Android Widget Khushu Architecture (`android/app/src/main/`)
- `salah_widget_layout.xml`: Native widget layout featuring the prayer schedule header, next prayer badge, and dedicated bottom `widget_khushu_bar` with live status indicator (`widget_khushu_status`) and toggle action button (`widget_khushu_btn`).
- `SalahWidgetProvider.kt`: AppWidgetProvider managing prayer time updates and dispatching `ACTION_TOGGLE_KHUSHU`. Configures PendingIntents (`FLAG_UPDATE_CURRENT or FLAG_IMMUTABLE`), detects Khushu state via `KhushuRestoreReceiver.isKhushuActive`, and dynamically formats widget colors and button states.
- `KhushuRestoreReceiver.kt`: BroadcastReceiver and static helper engine managing Khushu SharedPreferences, audio manager interactions (DND / Interruption Filter and RingerMode Silent), deterministic restore alarms (`RESTORE_ALARM_REQUEST_CODE = 998877`), and broadcast triggers to synchronize all home screen widgets.
- `KhushuModePlugin.kt`: Capacitor native plugin exposing `activate`, `deactivate`, `getStatus`, `checkPermission`, and `requestPermission` to the frontend, with broadcast dispatching to `SalahWidgetProvider.updateAllWidgets` on state transitions.








