/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ComponentType, lazy, LazyExoticComponent } from 'react';

/**
 * Robust wrapper around React.lazy with retry and resilient fallback
 * to prevent white screen crashes during chunk load failures.
 */
export function safeLazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (firstError) {
      console.warn('[SafeLazy] Initial chunk load failed, retrying once...', firstError);
      try {
        return await factory();
      } catch (secondError) {
        console.error('[SafeLazy] Fatal chunk load error:', secondError);
        // Return a resilient blank component fallback instead of crashing
        const FallbackComponent: React.FC = () => null;
        return { default: FallbackComponent as unknown as T };
      }
    }
  });
}

export default safeLazy;
