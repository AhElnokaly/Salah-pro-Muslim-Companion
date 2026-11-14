const fs = require('fs');
const path = require('path');

function getFileContent(relPath) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lineCount = content.split('\n').length;
  return { content, lineCount, fullPath };
}

let bundle = `# PHASE 1 REVIEW BUNDLE - VERSION 4 (UNABRIDGED)
Generated: ${new Date().toISOString()}
Branch: Wip/commit3-athan-master-toggle

This bundle contains the complete, unabridged contents of all files touched or referenced in Round 2 of Phase 1 hardening.
No lines skipped, no "..." placeholders.

---

## Table of Contents
1. src/diagnostics/tests/diagRunner.ts
2. src/diagnostics/tests/diagTypes.ts
3. src/diagnostics/tests/specs/testA_previewSource.ts
4. src/components/settings/adhan/AthanDiagnosticsSection.tsx
5. src/App.tsx
6. src/utils/previewSource.ts
7. src/utils/backupAlarmUtils.ts
8. src/diagnostics/tests/diagRunner.test.ts
9. android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt
10. android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt
11. Changed Kotlin functions in AthanAlarmPlugin.kt & AthanAlarmReceiver.kt
12. cancelNativeAlarm TS & Kotlin implementation
13. Native log writing code from R3.2
14. App.tsx startup snippet from R5

---
`;

const fullFiles = [
  { path: 'src/diagnostics/tests/diagRunner.ts', lang: 'ts' },
  { path: 'src/diagnostics/tests/diagTypes.ts', lang: 'ts' },
  { path: 'src/diagnostics/tests/specs/testA_previewSource.ts', lang: 'ts' },
  { path: 'src/components/settings/adhan/AthanDiagnosticsSection.tsx', lang: 'tsx' },
  { path: 'src/App.tsx', lang: 'tsx' },
  { path: 'src/utils/previewSource.ts', lang: 'ts' },
  { path: 'src/utils/backupAlarmUtils.ts', lang: 'ts' },
  { path: 'src/diagnostics/tests/diagRunner.test.ts', lang: 'ts' },
  { path: 'android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt', lang: 'kotlin' },
  { path: 'android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt', lang: 'kotlin' }
];

for (const f of fullFiles) {
  const { content, lineCount } = getFileContent(f.path);
  bundle += `\n### ${f.path} (${lineCount} lines)\n\`\`\`${f.lang}\n${content}\n\`\`\`\n\n---\n`;
}

// 11. Changed Kotlin functions in AthanAlarmPlugin.kt & AthanAlarmReceiver.kt
bundle += `\n### Changed Kotlin functions in AthanAlarmPlugin.kt and AthanAlarmReceiver.kt\n\n`;

bundle += `#### android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt: cancelSingleAlarmStatic & matchesAlarmId (Lines 440-496)\n\`\`\`kotlin\n`;
const athanPlugin = fs.readFileSync(path.resolve(__dirname, '../android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt'), 'utf8');
const athanPluginLines = athanPlugin.split('\n');
bundle += athanPluginLines.slice(439, 497).join('\n');
bundle += `\n\`\`\`\n\n`;

bundle += `#### android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt: cancelAlarm (Lines 1009-1065)\n\`\`\`kotlin\n`;
bundle += athanPluginLines.slice(1008, 1066).join('\n');
bundle += `\n\`\`\`\n\n`;

bundle += `#### android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmReceiver.kt: onReceive event logging & showCustomAlarmNotification (Lines 135-175)\n\`\`\`kotlin\n`;
const athanReceiver = fs.readFileSync(path.resolve(__dirname, '../android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmReceiver.kt'), 'utf8');
const athanReceiverLines = athanReceiver.split('\n');
bundle += athanReceiverLines.slice(134, 175).join('\n');
bundle += `\n\`\`\`\n\n---\n`;

// 12. cancelNativeAlarm TS & Kotlin implementation
bundle += `\n### 12. cancelNativeAlarm TS & Kotlin implementation\n\n`;
bundle += `#### TypeScript: src/services/athanAlarmPlugin.ts (Lines 1079-1090)\n\`\`\`ts\n`;
const tsPlugin = fs.readFileSync(path.resolve(__dirname, '../src/services/athanAlarmPlugin.ts'), 'utf8');
const tsPluginLines = tsPlugin.split('\n');
bundle += tsPluginLines.slice(1078, 1092).join('\n');
bundle += `\n\`\`\`\n\n`;

bundle += `#### Kotlin: android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt (Lines 1010-1035)\n\`\`\`kotlin\n`;
bundle += athanPluginLines.slice(1009, 1035).join('\n');
bundle += `\n\`\`\`\n\n---\n`;

// 13. Native log writing code from R3.2
bundle += `\n### 13. Native log writing code from R3.2\n\n`;
bundle += `#### AthanAlarmReceiver.kt: Line 144\n\`\`\`kotlin\n`;
bundle += athanReceiverLines.slice(140, 146).join('\n');
bundle += `\n\`\`\`\n\n`;

bundle += `#### KhushuRestoreReceiver.kt: Lines 200-205\n\`\`\`kotlin\n`;
const khushuReceiver = fs.readFileSync(path.resolve(__dirname, '../android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt'), 'utf8');
const khushuReceiverLines = khushuReceiver.split('\n');
bundle += khushuReceiverLines.slice(198, 206).join('\n');
bundle += `\n\`\`\`\n\n---\n`;

// 14. App.tsx startup snippet from R5
bundle += `\n### 14. App.tsx startup snippet from R5 (Lines 60-72)\n\`\`\`tsx\n`;
const appContent = fs.readFileSync(path.resolve(__dirname, '../src/App.tsx'), 'utf8');
const appLines = appContent.split('\n');
bundle += appLines.slice(59, 73).join('\n');
bundle += `\n\`\`\`\n`;

const outPath = path.resolve(__dirname, '../docs/review/PHASE1_REVIEW_BUNDLE_v4.md');
fs.writeFileSync(outPath, bundle, 'utf8');
console.log('Successfully wrote', outPath, 'Total lines:', bundle.split('\n').length);
