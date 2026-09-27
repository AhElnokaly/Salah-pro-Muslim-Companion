import React, { lazy } from 'react';

// Helper for safe lazy loading with retry mechanism and graceful fallback
export function safeLazy<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T } | Record<string, unknown>>
) {
  return lazy(async () => {
    try {
      const module = await importFn();
      if ('default' in module && module.default) {
        return { default: module.default as T };
      }
      const values = Object.values(module);
      for (const val of values) {
        if (typeof val === 'function') {
          return { default: val as unknown as T };
        }
      }
      throw new Error('No valid component export found');
    } catch (err) {
      console.warn('[safeLazy] Dynamic import failed, retrying once...', err);
      await new Promise((resolve) => setTimeout(resolve, 300));
      try {
        const retryModule = await importFn();
        if ('default' in retryModule && retryModule.default) {
          return { default: retryModule.default as T };
        }
        const values = Object.values(retryModule);
        for (const val of values) {
          if (typeof val === 'function') {
            return { default: val as unknown as T };
          }
        }
      } catch (retryErr) {
        console.error('[safeLazy] Secondary retry failed:', retryErr);
      }
      // Return a safe dummy component to prevent root ErrorBoundary crashes on stale/failed chunks
      return { default: (() => null) as unknown as T };
    }
  });
}
