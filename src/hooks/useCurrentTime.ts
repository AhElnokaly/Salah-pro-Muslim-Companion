import { useState, useEffect } from 'react';

/**
 * Custom hook to provide real-time clock state updated every second.
 */
export function useCurrentTime(): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return now;
}
