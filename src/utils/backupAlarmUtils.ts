/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDiagAlarmId } from '../diagnostics/tests/diagTypes';

/**
 * Strips any synthetic diagnostic alarms (with id prefix diag_) from custom alarms list before export.
 */
export function sanitizeAlarmsForExport<T extends { id?: string | null }>(alarms: T[] | null | undefined): T[] {
  if (!Array.isArray(alarms)) return [];
  return alarms.filter((alarm) => !isDiagAlarmId(alarm?.id));
}

/**
 * Strips any synthetic diagnostic alarms (with id prefix diag_) from imported backup payload before saving.
 */
export function sanitizeAlarmsForRestore<T extends { id?: string | null }>(alarms: T[] | null | undefined): T[] {
  if (!Array.isArray(alarms)) return [];
  return alarms.filter((alarm) => !isDiagAlarmId(alarm?.id));
}
