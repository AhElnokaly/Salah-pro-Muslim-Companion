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

/**
 * Safely reads a value from localStorage with error handling.
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.error(`[safeGetItem] Failed to read key "${key}" from localStorage:`, err);
    return null;
  }
}

/**
 * Safely removes a key from localStorage with error handling.
 */
export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error(`[safeRemoveItem] Failed to remove key "${key}" from localStorage:`, err);
    return false;
  }
}

/**
 * Safely writes a JSON-serializable object to localStorage.
 */
export function safeSetJSON<T>(key: string, data: T): boolean {
  try {
    return safeSetItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`[safeSetJSON] Failed to serialize key "${key}":`, err);
    return false;
  }
}

/**
 * Safely reads and parses a JSON object from localStorage.
 */
export function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    const raw = safeGetItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[safeGetJSON] Failed to parse key "${key}":`, err);
    return fallback;
  }
}

