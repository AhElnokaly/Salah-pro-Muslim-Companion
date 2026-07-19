// Safe localStorage polyfill to prevent DOMExceptions and SecurityErrors inside sandboxed iframes
(function() {
  let storageAvailable = false;
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch (e) {
    storageAvailable = false;
  }

  if (!storageAvailable) {
    console.warn('[Storage Polyfill] localStorage is not fully accessible. Using in-memory fallback.');
    const memoryStore: Record<string, string> = {};
    const mockStorage: Storage = {
      length: 0,
      clear() {
        for (const key in memoryStore) {
          delete memoryStore[key];
        }
        this.length = 0;
      },
      getItem(key: string): string | null {
        return memoryStore[key] !== undefined ? memoryStore[key] : null;
      },
      key(index: number): string | null {
        const keys = Object.keys(memoryStore);
        return keys[index] || null;
      },
      removeItem(key: string) {
        delete memoryStore[key];
        this.length = Object.keys(memoryStore).length;
      },
      setItem(key: string, value: string) {
        memoryStore[key] = String(value);
        this.length = Object.keys(memoryStore).length;
      }
    };
    
    try {
      Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        writable: true,
        configurable: true
      });
    } catch (err) {
      console.error('[Storage Polyfill] Failed to override window.localStorage', err);
    }
  } else {
    // Even if storage is available, wrapping methods in try-catch prevents sporadic DOMExceptions
    try {
      const originalSetItem = window.localStorage.setItem;
      const originalGetItem = window.localStorage.getItem;
      const originalRemoveItem = window.localStorage.removeItem;
      const originalClear = window.localStorage.clear;

      window.localStorage.setItem = function(key, value) {
        try {
          originalSetItem.call(window.localStorage, key, value);
        } catch (e) {
          console.error('[Storage Polyfill] setItem failed:', e);
        }
      };

      window.localStorage.getItem = function(key) {
        try {
          return originalGetItem.call(window.localStorage, key);
        } catch (e) {
          console.error('[Storage Polyfill] getItem failed:', e);
          return null;
        }
      };

      window.localStorage.removeItem = function(key) {
        try {
          originalRemoveItem.call(window.localStorage, key);
        } catch (e) {
          console.error('[Storage Polyfill] removeItem failed:', e);
        }
      };

      window.localStorage.clear = function() {
        try {
          originalClear.call(window.localStorage);
        } catch (e) {
          console.error('[Storage Polyfill] clear failed:', e);
        }
      };
    } catch (err) {
      console.error('[Storage Polyfill] Failed to instrument native localStorage methods', err);
    }
  }

  // Safe window.alert fallback for iframe compatibility
  try {
    const originalAlert = window.alert;
    window.alert = function(message) {
      try {
        originalAlert(message);
      } catch (e) {
        console.warn('[Alert Polyfill] window.alert blocked, message was:', message);
      }
    };
  } catch (err) {
    console.warn('[Alert Polyfill] Failed to instrument window.alert:', err);
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Unregister any active service workers to prevent stale PWA caching in development/preview environments
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.log('[Service Worker] Unregistered successfully to bypass stale cache');
      });
    }
  });
}

