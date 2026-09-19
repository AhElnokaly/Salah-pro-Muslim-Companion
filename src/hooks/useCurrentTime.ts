import { useAuthoritativeClock } from './useAuthoritativeClock';

/**
 * Custom hook to provide authoritative real-time clock state updated every second
 * and instantly resynchronized on app resume / screen on.
 */
export function useCurrentTime(): Date {
  return useAuthoritativeClock();
}
