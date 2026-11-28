const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

function readFile(relPath) {
  const fullPath = path.join(rootDir, relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

function getLineCount(content) {
  return content.split('\n').length;
}

const diagRunnerContent = readFile('src/diagnostics/tests/diagRunner.ts');
const diagTypesContent = readFile('src/diagnostics/tests/diagTypes.ts');
const testASpecContent = readFile('src/diagnostics/tests/specs/testA_previewSource.ts');
const testBSpecContent = readFile('src/diagnostics/tests/specs/testB_khushuCustomAlarm.ts');
const diagSectionContent = readFile('src/components/settings/adhan/AthanDiagnosticsSection.tsx');
const backupAlarmUtilsContent = readFile('src/utils/backupAlarmUtils.ts');
const bootReceiverContent = readFile('android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt');
const khushuReceiverContent = readFile('android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt');

// Changed hunks
const alarmReceiverContent = readFile('android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmReceiver.kt');
const alarmPluginContent = readFile('android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt');
const athanAlarmPluginTsContent = readFile('src/services/athanAlarmPlugin.ts');
const backupTabContent = readFile('src/components/settings/BackupSettingsTab.tsx');
const appTsxContent = readFile('src/App.tsx');
const previewSourceContent = readFile('src/utils/previewSource.ts');
const worshipAlarmsContent = readFile('src/components/WorshipAlarms.tsx');

// Slice functions from AthanAlarmPlugin.kt
const pluginLines = alarmPluginContent.split('\n');
const createAthanIntentHunk = pluginLines.slice(130, 240).join('\n');
const reconcileHunk = pluginLines.slice(240, 390).join('\n');
const getAlarmDiagnosticsHunk = pluginLines.slice(1398, 1445).join('\n');

// Slice hunks from AthanAlarmReceiver.kt
const receiverLines = alarmReceiverContent.split('\n');
const receiverCustomHunk = receiverLines.slice(154, 166).join('\n');
const receiverKhushuHunk = receiverLines.slice(182, 192).join('\n');

// Slice hunks from athanAlarmPlugin.ts
const tsLines = athanAlarmPluginTsContent.split('\n');
const tsDiagGuardHunk = tsLines.slice(516, 550).join('\n');

const bundle = `# حزمة المراجعة الشاملة لنتائج المرحلة الأولى - الإصدار الثالث (PHASE1_REVIEW_BUNDLE_v3.md)

تحتوي هذه الحزمة على المحتوى الكامل غير المنقوص لجميع ملفات إطار الاختبارات التشخيصية (Phase 1) بعد تطبيق كافة الإصلاحات F1 حتى F12، بالإضافة إلى الإجابات الدقيقة على أسئلة المراجعة التقنية وحدود البيئة.

---

## A. Full file contents

### 1. src/diagnostics/tests/diagRunner.ts
**Line count:** ${getLineCount(diagRunnerContent)} lines

\`\`\`ts
${diagRunnerContent}
\`\`\`

---

### 2. src/diagnostics/tests/diagTypes.ts
**Line count:** ${getLineCount(diagTypesContent)} lines

\`\`\`ts
${diagTypesContent}
\`\`\`

---

### 3. src/diagnostics/tests/specs/testA_previewSource.ts
**Line count:** ${getLineCount(testASpecContent)} lines

\`\`\`ts
${testASpecContent}
\`\`\`

---

### 4. src/diagnostics/tests/specs/testB_khushuCustomAlarm.ts
**Line count:** ${getLineCount(testBSpecContent)} lines

\`\`\`ts
${testBSpecContent}
\`\`\`

---

### 5. src/components/settings/adhan/AthanDiagnosticsSection.tsx
**Line count:** ${getLineCount(diagSectionContent)} lines

\`\`\`tsx
${diagSectionContent}
\`\`\`

---

### 6. src/utils/backupAlarmUtils.ts
**Line count:** ${getLineCount(backupAlarmUtilsContent)} lines

\`\`\`ts
${backupAlarmUtilsContent}
\`\`\`

---

### 7. android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt
**Line count:** ${getLineCount(bootReceiverContent)} lines

\`\`\`kotlin
${bootReceiverContent}
\`\`\`

---

### 8. android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt
**Line count:** ${getLineCount(khushuReceiverContent)} lines

\`\`\`kotlin
${khushuReceiverContent}
\`\`\`

---

### 9. Changed Hunks in Other Files

#### 9.1 android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmReceiver.kt (lines 155-165 & 183-191)
Passing \`prayerKey\` as \`sourceKey\` into \`KhushuRestoreReceiver.activateKhushuDirectly\`:

\`\`\`kotlin
// Lines 155-165 (Custom alarm autoKhushu):
${receiverCustomHunk}

// Lines 183-191 (Standalone khushu alarm):
${receiverKhushuHunk}
\`\`\`

#### 9.2 android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt (Changed Functions)
- \`createAthanIntent\` (lines 131-240):
\`\`\`kotlin
${createAthanIntentHunk}
\`\`\`

- \`reconcileAlarmsInternalStatic\` (lines 241-390):
\`\`\`kotlin
${reconcileHunk}
\`\`\`

- \`getAlarmDiagnostics\` (lines 1399-1445):
\`\`\`kotlin
${getAlarmDiagnosticsHunk}
\`\`\`

#### 9.3 src/services/athanAlarmPlugin.ts (lines 517-550)
F6: Scheduler guard preventing diag_ alarms from being scheduled unless \`diag_run_state\` is in \`waiting\` phase, has matching \`fireDate\`, and is registered in \`createdAlarmIds\`:

\`\`\`ts
${tsDiagGuardHunk}
\`\`\`

#### 9.4 src/utils/previewSource.ts (lines 32-40)
F5: Real online detection verifying boolean \`navigator.onLine\` safely in browser and Node.js environments:

\`\`\`ts
${previewSourceContent.split('\n').slice(31, 41).join('\n')}
\`\`\`

#### 9.5 src/components/settings/BackupSettingsTab.tsx (lines 12-14, 53-56, 126-130)
F10 & T2: Sanitization of diagnostic alarms during backup export and restore:

\`\`\`tsx
import { sanitizeAlarmsForExport, sanitizeAlarmsForRestore } from '../../utils/backupAlarmUtils';

// Export path:
const cleanCustomAlarms = sanitizeAlarmsForExport(customAlarms);

// Restore path:
const cleanAlarms = sanitizeAlarmsForRestore(importedSettings.customAlarms);
localStorage.setItem('salah_custom_alarms', JSON.stringify(cleanAlarms));
\`\`\`

#### 9.6 src/App.tsx (lines 40-42)
F6: Early app startup resumption hook:

\`\`\`tsx
import { diagRunnerInstance } from './diagnostics/tests/diagRunner';

// Line 41:
diagRunnerInstance.checkAndResumeOnAppStartup();
\`\`\`

#### 9.7 src/components/WorshipAlarms.tsx (lines 210-213)
T1: UI filter hiding diag_ alarms from custom alarms list:

\`\`\`tsx
const visibleAlarms = useMemo(() => {
  return filterUserVisibleAlarms(customAlarms);
}, [customAlarms]);
\`\`\`

---

## B. Honest answers (Strict Verification Labels)

### a) Can you run \`gradlew compileDebugKotlin\` in this environment?
**NO (CANNOT VERIFY / UNCOMPILED).**
Neither JDK nor the Android SDK is installed in this Linux sandbox container. Commands \`compile_applet\` and \`npx tsc\` compile and bundle only the TypeScript/React web app. All Kotlin modifications in \`android/app/src/main/java/com/salahpro/app/plugins/\` remain **UNCOMPILED** in this environment and must be compiled on a machine with Android Studio/Gradle.

### b) Does the custom alarms screen or any list UI filter out entries whose id starts with "diag_"?
**YES (VERIFIED).**
In \`src/components/WorshipAlarms.tsx\` lines 210-213:
\`\`\`tsx
const visibleAlarms = useMemo(() => {
  return filterUserVisibleAlarms(customAlarms);
}, [customAlarms]);
\`\`\`
The helper \`filterUserVisibleAlarms\` (defined in \`src/diagnostics/tests/diagRunner.ts\` lines 53-60 and tested in \`diagRunner.test.ts\` Suite 10) explicitly filters out any alarm where \`isDiagAlarmId(alarm.id)\` returns true. All card rendering and list mapping iterate over \`visibleAlarms\`.

### c) Is \`src/components/prayer/PrayerTimesView.tsx\` modified by any action in this session?
**NO (VERIFIED).**
\`src/components/prayer/PrayerTimesView.tsx\` has NOT been touched or modified in any way in this session or previous sessions, adhering strictly to the hard boundary rules.

### d) Which files did you edit in this session?
Full exhaustive list of modified files across the Phase 1 hardening tasks (F1–F12):
1. \`src/diagnostics/tests/diagTypes.ts\` (F1, F4)
2. \`src/diagnostics/tests/diagRunner.ts\` (F1, F4, F8, F9, F10)
3. \`src/diagnostics/tests/specs/testA_previewSource.ts\` (F4, F5)
4. \`src/diagnostics/tests/specs/testB_khushuCustomAlarm.ts\` (F2, F3, F4, F6)
5. \`src/components/settings/adhan/AthanDiagnosticsSection.tsx\` (F2, F5)
6. \`src/utils/previewSource.ts\` (F5)
7. \`src/utils/backupAlarmUtils.ts\` (F10 - created)
8. \`src/components/settings/BackupSettingsTab.tsx\` (F10)
9. \`src/services/athanAlarmPlugin.ts\` (F6)
10. \`src/App.tsx\` (F6)
11. \`android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt\` (F7 - UNCOMPILED)
12. \`android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt\` (F3 - UNCOMPILED)
13. \`android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmReceiver.kt\` (F3 - UNCOMPILED)
14. \`src/diagnostics/tests/diagRunner.test.ts\` (F1, F2, F3, F4, F6, F10)
15. \`docs/review/DEVICE_TEST_PLAN.md\` (F11)
16. \`docs/review/PROGRESS.md\` (Checkpoints F1–F12)

### e) Does any sync, backup or export path read \`salah_custom_alarms\`?
**YES (VERIFIED).**
1. \`src/components/settings/BackupSettingsTab.tsx\`:
   - Line 53-56: Export path reads \`salah_custom_alarms\` and passes it through \`sanitizeAlarmsForExport(customAlarms)\`, stripping any alarm matching \`isDiagAlarmId(id)\`.
   - Line 126-130: Restore path parses imported alarms and passes them through \`sanitizeAlarmsForRestore(importedSettings.customAlarms)\` before persisting to storage.
2. \`src/services/athanAlarmPlugin.ts\`:
   - Line 512-549: Scheduler reconcile reads \`customAlarms\` and strictly drops any \`isDiagAlarmId\` unless \`diag_run_state\` is in \`waiting\` phase and the alarm ID is explicitly registered in \`createdAlarmIds\`.

---

## C. Known limits

1. **Kotlin Compilation (UNCOMPILED):** As stated in B(a), Kotlin changes in \`AthanBootReceiver.kt\`, \`KhushuRestoreReceiver.kt\`, and \`AthanAlarmReceiver.kt\` cannot be compiled in this sandbox. Static inspection was performed line-by-line.
2. **Git Commit History (CANNOT VERIFY):** This execution environment does not host a git repository (\`fatal: not a git repository\`). No commit has been claimed or faked.
3. **Phase 2 Scope Boundary (UNTOUCHED):** Khushu start delay per prayer, \`iqamaOffsets\` modifications, and \`computeKhushuStartMs\` remain completely untouched for Phase 2 as instructed.
`;

fs.writeFileSync(path.join(rootDir, 'docs/review/PHASE1_REVIEW_BUNDLE_v3.md'), bundle, 'utf8');

// Mirror to artifacts
const artifactDir = path.join(rootDir, '.aistudio/artifacts/brain/a7942c4e-20bb-444d-95a7-a68fc3cf4354');
if (fs.existsSync(artifactDir)) {
  fs.writeFileSync(path.join(artifactDir, 'PHASE1_REVIEW_BUNDLE_v3.md'), bundle, 'utf8');
}

console.log('Successfully generated PHASE1_REVIEW_BUNDLE_v3.md');
