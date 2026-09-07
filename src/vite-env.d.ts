/// <reference types="vite/client" />

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}

interface Window {
  webkitAudioContext?: typeof AudioContext;
  Capacitor?: {
    isNativePlatform: () => boolean;
    getPlatform: () => string;
  };
  DeviceOrientationEvent?: {
    requestPermission?: () => Promise<'granted' | 'denied'>;
  } & typeof DeviceOrientationEvent;
}

interface Navigator {
  standalone?: boolean;
}

interface DeviceOrientationEventWithWebkit extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

interface PeriodicSyncManager {
  getTags(): Promise<string[]>;
  register(tag: string, options?: { minInterval?: number }): Promise<void>;
  unregister(tag: string): Promise<void>;
}

interface ServiceWorkerRegistration {
  periodicSync?: PeriodicSyncManager;
}
