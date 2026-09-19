/**
 * Authoritative Clock Hook & Event Bus
 * Derives real-time directly from system Date.now() / new Date().
 * Resumes and syncs immediately on:
 * 1. window 'visibilitychange' (screen on / app foreground)
 * 2. window 'focus'
 * 3. window 'pageshow'
 * 4. Capacitor App 'appStateChange' (isActive: true)
 * 5. Native custom event 'salah_app_resume'
 * 6. High-frequency requestAnimationFrame or self-correcting 1000ms tick
 */

import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// Global listeners registry for fast instant sync across all mounted hooks
type ClockListener = (date: Date) => void;
const listeners = new Set<ClockListener>();

function notifyAll() {
  const current = new Date();
  listeners.forEach(fn => {
    try {
      fn(current);
    } catch (e) {
      console.warn('Clock listener error:', e);
    }
  });
}

// Global lifecycle watchers
if (typeof window !== 'undefined') {
  const syncNow = () => notifyAll();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncNow();
    }
  });

  window.addEventListener('focus', syncNow);
  window.addEventListener('pageshow', syncNow);
  window.addEventListener('online', syncNow);
  window.addEventListener('salah_app_resume', syncNow);

  if (Capacitor.isNativePlatform()) {
    CapacitorApp.addListener('appStateChange', (state) => {
      if (state.isActive) {
        syncNow();
      }
    }).catch(() => {});
  }
}

/**
 * Authoritative Clock Hook
 * Guarantees that time is always derived from Date.now() and refreshes
 * immediately whenever the application resumes from background or screen lock.
 */
export function useAuthoritativeClock(): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    // Initial sync
    setNow(new Date());

    const updateClock = (d: Date) => {
      setNow(d);
    };

    listeners.add(updateClock);

    // Precise 1-second interval self-correcting against Date.now()
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      listeners.delete(updateClock);
      clearInterval(timer);
    };
  }, []);

  return now;
}

export function syncAuthoritativeClock() {
  notifyAll();
}
