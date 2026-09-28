/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Robust UUID generator with 3-tier fallback to prevent crashes in older WebViews
 * and non-secure HTTP contexts.
 */
export function safeUUID(): string {
  // Tier 1: Modern Web Crypto standard API
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to Tier 2
  }

  // Tier 2: Crypto getRandomValues if available
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC4122
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  } catch {
    // Fall through to Tier 3
  }

  // Tier 3: Pure Math.random + timestamp pseudo-random fallback
  const d = Date.now();
  const d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16;
    if (d > 0) {
      r = ((d + r) % 16) | 0;
    } else {
      r = ((d2 + r) % 16) | 0;
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const generateUUID = safeUUID;
export const uuid = safeUUID;
export default safeUUID;
