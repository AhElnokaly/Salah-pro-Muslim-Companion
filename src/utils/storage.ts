/**
 * Safely writes a key-value pair to localStorage with error handling.
 * Returns true if the write succeeded, or false if it threw an error (e.g., quota exceeded).
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.error(`[safeSetItem] Failed to write key "${key}" to localStorage:`, err);
    return false;
  }
}
